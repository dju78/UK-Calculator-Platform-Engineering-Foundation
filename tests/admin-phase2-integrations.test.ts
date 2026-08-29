import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildEmptyTrafficOverview,
  mapCloudflareGraphQLResponse,
  TrafficTimePeriod,
  buildEmptyGoogleSearchOverview,
  mapGoogleSearchAnalyticsResponse,
  buildEmptyGitHubHealthOverview,
  mapGitHubRunsResponse,
  formatDuration,
  evaluateGovernanceReviewStatus,
  getAdminGovernanceCalendar,
  getMonorepoRootDir,
} from "./admin-data-helper.js";

test("Admin Console Phase 2 Integrations & Growth Suite", async (t: any) => {
  await t.test("Auth Contract: Phase 2 preserves ADMIN_PASSWORD and ADMIN_SESSION_SECRET without ADMIN_ACCESS_KEY", () => {
    const rootDir = getMonorepoRootDir();
    const authFile = join(rootDir, "apps/admin/src/lib/auth.ts");
    assert.ok(existsSync(authFile), "apps/admin/src/lib/auth.ts must exist");

    const authContent = readFileSync(authFile, "utf8");
    assert.ok(authContent.includes("ADMIN_PASSWORD"), "auth.ts must use ADMIN_PASSWORD");
    assert.ok(authContent.includes("ADMIN_SESSION_SECRET"), "auth.ts must use ADMIN_SESSION_SECRET");
    assert.ok(!authContent.includes("ADMIN_ACCESS_KEY"), "auth.ts must NOT use ADMIN_ACCESS_KEY");
  });

  await t.test("Traffic Analytics: handles missing credentials with accurate terminology and error code", () => {
    const origAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const origApiToken = process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;

    const unconfigured = buildEmptyTrafficOverview("7d", "NOT_CONFIGURED");
    assert.strictEqual(unconfigured.status, "NOT_CONFIGURED");
    assert.strictEqual(unconfigured.isApiConfigured, false);
    assert.strictEqual(unconfigured.isApiConnected, false);
    assert.strictEqual(unconfigured.errorCode, "CREDENTIALS_MISSING");
    assert.strictEqual(unconfigured.statusLabel, "Cloudflare Analytics API credentials are not configured.");
    assert.strictEqual(unconfigured.visits, null, "Visits must be null when unconfigured (never fake 0)");
    assert.strictEqual(unconfigured.pageViews, null, "Page views must be null when unconfigured");
    assert.strictEqual(unconfigured.topCountry, null);
    assert.strictEqual(unconfigured.topPage, null);
    assert.strictEqual(unconfigured.topPages.length, 0);

    if (origAccountId) process.env.CLOUDFLARE_ACCOUNT_ID = origAccountId;
    if (origApiToken) process.env.CLOUDFLARE_API_TOKEN = origApiToken;
  });

  await t.test("Traffic Analytics: handles configured credentials awaiting sync", () => {
    const origAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const origApiToken = process.env.CLOUDFLARE_API_TOKEN;
    process.env.CLOUDFLARE_ACCOUNT_ID = "mock_acc_123";
    process.env.CLOUDFLARE_API_TOKEN = "mock_token_abc";

    const configured = buildEmptyTrafficOverview("7d");
    assert.strictEqual(configured.status, "CONFIGURED");
    assert.strictEqual(configured.isApiConfigured, true);
    assert.strictEqual(configured.isApiConnected, false);
    assert.strictEqual(configured.statusLabel, "Cloudflare API credentials configured (Awaiting sync)");

    if (origAccountId) process.env.CLOUDFLARE_ACCOUNT_ID = origAccountId; else delete process.env.CLOUDFLARE_ACCOUNT_ID;
    if (origApiToken) process.env.CLOUDFLARE_API_TOKEN = origApiToken; else delete process.env.CLOUDFLARE_API_TOKEN;
  });

  await t.test("Traffic Analytics: correctly maps Cloudflare GraphQL response with live traffic", () => {
    const mockGql = {
      data: {
        viewer: {
          accounts: [
            {
              rumPageloadEventsAdaptiveGroups: [
                {
                  count: 1420,
                  sum: { visits: 3850 },
                },
              ],
            },
          ],
        },
      },
    };

    const mapped = mapCloudflareGraphQLResponse(mockGql, "30d");
    assert.strictEqual(mapped.status, "CONNECTED");
    assert.strictEqual(mapped.isApiConnected, true);
    assert.strictEqual(mapped.errorCode, null);
    assert.strictEqual(mapped.visits, 1420, "Visits metric accurately mapped from count");
    assert.strictEqual(mapped.pageViews, 3850);
    assert.strictEqual(mapped.topCountry, "United Kingdom");
    assert.strictEqual(mapped.period, "30d");
  });

  await t.test("Traffic Analytics: correctly handles zero-traffic successful response", () => {
    const mockEmptyData = {
      data: {
        viewer: {
          accounts: [
            {
              rumPageloadEventsAdaptiveGroups: [],
            },
          ],
        },
      },
    };

    const mapped = mapCloudflareGraphQLResponse(mockEmptyData, "7d");
    assert.strictEqual(mapped.status, "CONNECTED");
    assert.strictEqual(mapped.isApiConnected, true);
    assert.strictEqual(mapped.visits, 0);
    assert.strictEqual(mapped.pageViews, 0);
    assert.strictEqual(mapped.errorCode, null);
  });

  await t.test("Traffic Analytics: distinguishes error states (auth, permission, query error)", () => {
    const authErr = buildEmptyTrafficOverview("7d", "AUTH_ERROR", "Cloudflare authentication failed (Invalid API token).", "AUTH_FAILED", "HTTP 401 Unauthorized");
    assert.strictEqual(authErr.status, "AUTH_ERROR");
    assert.strictEqual(authErr.errorCode, "AUTH_FAILED");

    const permErr = buildEmptyTrafficOverview("7d", "PERMISSION_DENIED", "Cloudflare permission denied (Account Analytics Read permission required).", "PERMISSION_DENIED", "HTTP 403 Forbidden");
    assert.strictEqual(permErr.status, "PERMISSION_DENIED");
    assert.strictEqual(permErr.errorCode, "PERMISSION_DENIED");

    const queryErr = mapCloudflareGraphQLResponse({ errors: [{ message: "Field not found" }] }, "7d");
    assert.strictEqual(queryErr.status, "ERROR");
    assert.strictEqual(queryErr.errorCode, "QUERY_ERROR");
  });

  await t.test("Google Search Console: handles unconfigured credentials with null metric semantics", () => {
    const emptyGsc = buildEmptyGoogleSearchOverview("https://ukcalc.jomovate.com/", "NOT_CONFIGURED");
    assert.strictEqual(emptyGsc.status, "NOT_CONFIGURED");
    assert.strictEqual(emptyGsc.totalClicks, null, "Clicks must be null when not connected");
    assert.strictEqual(emptyGsc.totalImpressions, null, "Impressions must be null when not connected");
    assert.strictEqual(emptyGsc.averageCtr, null);
    assert.strictEqual(emptyGsc.averagePosition, null);
    assert.strictEqual(emptyGsc.topQueries.length, 0);
  });

  await t.test("Google Search Console: maps search analytics rows and calculates average CTR and position", () => {
    const mockGscRows = {
      rows: [
        { keys: ["uk tax calculator"], clicks: 250, impressions: 5000, ctr: 0.05, position: 2.1 },
        { keys: ["mortgage calculator uk"], clicks: 150, impressions: 3000, ctr: 0.05, position: 3.4 },
        { keys: ["stamp duty calculator"], clicks: 100, impressions: 2000, ctr: 0.05, position: 1.8 },
      ],
    };

    const mapped = mapGoogleSearchAnalyticsResponse(mockGscRows, "https://ukcalc.jomovate.com/");
    assert.strictEqual(mapped.status, "CONNECTED");
    assert.strictEqual(mapped.totalClicks, 500);
    assert.strictEqual(mapped.totalImpressions, 10000);
    assert.strictEqual(mapped.averageCtr, "5.0%");
    assert.strictEqual(mapped.topQueries.length, 3);
    assert.strictEqual(mapped.topQueries[0].query, "uk tax calculator");
  });

  await t.test("GitHub Engineering Health: handles duration formatting accurately", () => {
    assert.strictEqual(formatDuration(0), "0s");
    assert.strictEqual(formatDuration(45), "45s");
    assert.strictEqual(formatDuration(125), "2m 5s");
    assert.strictEqual(formatDuration(undefined), "Not available");
    assert.strictEqual(formatDuration(-5), "Not available");
  });

  await t.test("GitHub Engineering Health: maps workflow runs and conclusions accurately", () => {
    const mockRuns = {
      total_count: 1,
      workflow_runs: [
        {
          id: 123456789,
          name: "CI Verification",
          run_number: 42,
          event: "push",
          status: "completed",
          conclusion: "success",
          head_branch: "main",
          head_sha: "2a1d59958967cb0134725277abcd870cbb6fbfeb",
          head_commit: { message: "feat(admin): phase 2 live insights\n\nFull details" },
          run_started_at: "2026-08-28T20:00:00Z",
          updated_at: "2026-08-28T20:00:23Z",
          html_url: "https://github.com/dju78/UK-Calculator-Platform-Engineering-Foundation/actions/runs/123456789",
          actor: { login: "dju78" },
        },
      ],
    };

    const mapped = mapGitHubRunsResponse(mockRuns);
    assert.strictEqual(mapped.status, "CONNECTED");
    assert.strictEqual(mapped.latestRun?.runNumber, 42);
    assert.strictEqual(mapped.latestRun?.conclusion, "success");
    assert.strictEqual(mapped.latestRun?.branch, "main");
    assert.strictEqual(mapped.latestRun?.commitSha, "2a1d599");
    assert.strictEqual(mapped.latestRun?.commitMessage, "feat(admin): phase 2 live insights");
    assert.strictEqual(mapped.latestRun?.durationFormatted, "23s");
  });

  await t.test("Governance Calendar: evaluates statutory review status accurately", () => {
    // 1. Current status: review far in future
    const current = evaluateGovernanceReviewStatus("2027-04-05", "2026-08-22", "2027-03-01", "2026-08-28");
    assert.strictEqual(current.status, "Current");

    // 2. Approaching status: within 90 days
    const approaching = evaluateGovernanceReviewStatus("2027-04-05", "2026-08-22", "2026-11-20", "2026-08-28");
    assert.strictEqual(approaching.status, "Review approaching");

    // 3. Due status: past target review date
    const due = evaluateGovernanceReviewStatus("2027-04-05", "2026-08-22", "2026-08-01", "2026-08-28");
    assert.strictEqual(due.status, "Review due");

    // 4. Overdue status: past statutory effective end date
    const overdue = evaluateGovernanceReviewStatus("2026-04-05", "2026-08-22", "2026-04-01", "2026-08-28");
    assert.strictEqual(overdue.status, "Overdue");

    // 5. Overall calendar overview derivation across all 9 statutory rule families
    const calendar = getAdminGovernanceCalendar();
    assert.strictEqual(calendar.totalRuleFamilies, 9);
    assert.ok(calendar.currentCount + calendar.approachingCount + calendar.dueCount + calendar.overdueCount === 9);
  });

  await t.test("Traffic Analytics: safe status response never leaks secrets or authorization details", () => {
    const overview = buildEmptyTrafficOverview("7d", "CONFIGURED", "Cloudflare API credentials configured (Awaiting sync)");
    const safeJson = JSON.stringify(overview);

    // Verify secrets are completely absent from serialized overview
    assert.strictEqual(safeJson.includes("CLOUDFLARE_API_TOKEN"), false);
    assert.strictEqual(safeJson.includes("Bearer"), false);
    assert.strictEqual(safeJson.includes("Authorization"), false);
  });

  await t.test("Security Contract: server-side Cloudflare credentials are never referenced as NEXT_PUBLIC_ in apps/admin", () => {
    const rootDir = getMonorepoRootDir();
    const adminSrc = join(rootDir, "apps/admin/src");
    
    // Check that NEXT_PUBLIC_CLOUDFLARE_API_TOKEN or NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID do not exist anywhere in apps/admin
    const checkDir = (dir: string) => {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const fullPath = join(dir, f.name);
        if (f.isDirectory()) {
          checkDir(fullPath);
        } else if (f.name.endsWith(".ts") || f.name.endsWith(".tsx")) {
          const content = readFileSync(fullPath, "utf8");
          assert.strictEqual(
            content.includes("NEXT_PUBLIC_CLOUDFLARE_API_TOKEN"),
            false,
            `Forbidden NEXT_PUBLIC_CLOUDFLARE_API_TOKEN found in ${fullPath}`
          );
          assert.strictEqual(
            content.includes("NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID"),
            false,
            `Forbidden NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID found in ${fullPath}`
          );
        }
      }
    };
    checkDir(adminSrc);
  });
});

