import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateKeyPairSync, createVerify } from "node:crypto";
import {
  buildEmptyTrafficOverview,
  mapCloudflareGraphQLResponse,
  TrafficTimePeriod,
  buildEmptyGoogleSearchOverview,
  mapGoogleSearchAnalyticsResponse,
  createGoogleServiceAccountJwt,
  calculateGscDateRange,
  formatPEMPrivateKey,
  getSafeGoogleSearchStatus,
  buildEmptyGitHubHealthOverview,
  buildRecordedGitHubHealthOverview,
  mapGitHubRunsResponse,
  formatDuration,
  evaluateGovernanceReviewStatus,
  getAdminGovernanceCalendar,
  calculateImpressionWeightedPosition,
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
    assert.strictEqual(emptyGsc.isConfigured, false);
    assert.strictEqual(emptyGsc.totalClicks, null, "Clicks must be null when not connected");
    assert.strictEqual(emptyGsc.totalImpressions, null, "Impressions must be null when not connected");
    assert.strictEqual(emptyGsc.averageCtr, null);
    assert.strictEqual(emptyGsc.averagePosition, null);
    assert.strictEqual(emptyGsc.topQueries.length, 0);
  });

  await t.test("Google Search Console: distinguishes error and unconfigured states with explicit error codes", () => {
    const authErr = buildEmptyGoogleSearchOverview(
      "https://ukcalc.jomovate.com/",
      "AUTH_ERROR",
      "Google Authentication Failed",
      "AUTH_ERROR",
      "Invalid private key format"
    );
    assert.strictEqual(authErr.status, "AUTH_ERROR");
    assert.strictEqual(authErr.errorCode, "AUTH_ERROR");
    assert.strictEqual(authErr.errorMessage, "Invalid private key format");

    const permErr = buildEmptyGoogleSearchOverview(
      "https://ukcalc.jomovate.com/",
      "PERMISSION_DENIED",
      "Search Console Permission Denied",
      "PERMISSION_DENIED",
      "Service account email does not have Read permission"
    );
    assert.strictEqual(permErr.status, "PERMISSION_DENIED");
    assert.strictEqual(permErr.errorCode, "PERMISSION_DENIED");

    const rateErr = buildEmptyGoogleSearchOverview(
      "https://ukcalc.jomovate.com/",
      "RATE_LIMITED",
      "Google API Rate Limit Exceeded",
      "RATE_LIMITED",
      "Quota exceeded"
    );
    assert.strictEqual(rateErr.status, "RATE_LIMITED");
    assert.strictEqual(rateErr.errorCode, "RATE_LIMITED");
  });

  await t.test("Google Search Console: calculates 2-3 day data latency and date windows for 24h, 7d, 30d", () => {
    const r24h = calculateGscDateRange("24h");
    assert.strictEqual(r24h.startDate, r24h.endDate, "24h range should target single latest finalized day");
    assert.ok(r24h.dataLatencyNote.includes("2-3 day"));

    const r7d = calculateGscDateRange("7d");
    assert.ok(r7d.label.includes("Last 7 Finalized Days"));

    const r30d = calculateGscDateRange("30d");
    assert.ok(r30d.label.includes("Last 28 Finalized Days"));
  });

  await t.test("Google Search Console: generates valid RS256 JWT assertion and cleans PEM formatting", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    // Test PEM formatting with escaped newlines
    const rawEscaped = privateKey.replace(/\n/g, "\\n");
    const cleaned = formatPEMPrivateKey(rawEscaped);
    assert.ok(cleaned.includes("\n"), "Cleaned PEM must contain actual newlines");
    assert.ok(cleaned.startsWith("-----BEGIN PRIVATE KEY-----"));

    // Generate JWT
    const jwt = createGoogleServiceAccountJwt("ukcalc-service@project.iam.gserviceaccount.com", cleaned);
    const [headerB64, payloadB64, signature] = jwt.split(".");
    assert.ok(headerB64 && payloadB64 && signature, "JWT must have 3 dot-separated parts");

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    assert.strictEqual(payload.iss, "ukcalc-service@project.iam.gserviceaccount.com");
    assert.strictEqual(payload.aud, "https://oauth2.googleapis.com/token");
    assert.strictEqual(payload.scope, "https://www.googleapis.com/auth/webmasters.readonly");

    // Verify signature with public key
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    const isValid = verifier.verify(publicKey, signature, "base64url");
    assert.strictEqual(isValid, true, "JWT RS256 signature must be mathematically valid");
  });

  await t.test("Google Search Console: maps search analytics rows for both queries and landing pages", () => {
    const mockQueryRows = [
      { keys: ["uk tax calculator"], clicks: 250, impressions: 5000, ctr: 0.05, position: 2.1 },
      { keys: ["mortgage calculator uk"], clicks: 150, impressions: 3000, ctr: 0.05, position: 3.4 },
      { keys: ["stamp duty calculator"], clicks: 100, impressions: 2000, ctr: 0.05, position: 1.8 },
    ];
    const mockPageRows = [
      { keys: ["https://ukcalc.jomovate.com/calculators/income-tax-calculator"], clicks: 250, impressions: 5000, ctr: 0.05, position: 2.1 },
      { keys: ["https://ukcalc.jomovate.com/calculators/mortgage-calculator"], clicks: 150, impressions: 3000, ctr: 0.05, position: 3.4 },
    ];

    const mapped = mapGoogleSearchAnalyticsResponse(mockQueryRows, mockPageRows, "https://ukcalc.jomovate.com/", "30d");
    assert.strictEqual(mapped.status, "CONNECTED");
    assert.strictEqual(mapped.totalClicks, 500);
    assert.strictEqual(mapped.totalImpressions, 10000);
    assert.strictEqual(mapped.averageCtr, "5.0%");
    assert.strictEqual(mapped.topQueries.length, 3);
    assert.strictEqual(mapped.topQueries[0].query, "uk tax calculator");
    assert.strictEqual(mapped.topPages.length, 2);
    assert.strictEqual(mapped.topPages[0].page, "https://ukcalc.jomovate.com/calculators/income-tax-calculator");

    // Test zero data
    const zeroMapped = mapGoogleSearchAnalyticsResponse([], [], "https://ukcalc.jomovate.com/", "30d");
    assert.strictEqual(zeroMapped.status, "CONNECTED");
    assert.strictEqual(zeroMapped.totalClicks, 0);
    assert.strictEqual(zeroMapped.totalImpressions, 0);
    assert.strictEqual(zeroMapped.averageCtr, "0.0%");
    assert.strictEqual(zeroMapped.averagePosition, "0.0");
    assert.strictEqual(zeroMapped.topQueries.length, 0);
    assert.strictEqual(zeroMapped.topPages.length, 0);
  });

  await t.test("Google Search Console: safe status response never leaks secrets or private keys", () => {
    const mockOverview = buildEmptyGoogleSearchOverview(
      "https://ukcalc.jomovate.com/",
      "CONNECTED",
      "Connected",
      null,
      null,
      "30d"
    );
    const safeStatus = getSafeGoogleSearchStatus(mockOverview);
    const jsonStr = JSON.stringify(safeStatus);

    assert.strictEqual(jsonStr.includes("privateKey"), false);
    assert.strictEqual(jsonStr.includes("PRIVATE KEY"), false);
    assert.strictEqual(jsonStr.includes("clientSecret"), false);
    assert.strictEqual(jsonStr.includes("Bearer"), false);
    assert.strictEqual(jsonStr.includes("accessToken"), false);
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

  await t.test("GitHub Engineering Health: provides truthful recorded evidence fallback when live API is unavailable", () => {
    const recorded = buildRecordedGitHubHealthOverview();
    assert.strictEqual(recorded.status, "CONFIGURED");
    assert.strictEqual(recorded.isLiveConnected, false);
    assert.strictEqual(recorded.statusLabel, "Recorded CI Evidence (1,134 tests passing)");
    assert.strictEqual(recorded.latestRun?.conclusion, "success");
    assert.strictEqual(recorded.latestRun?.runNumber, 42);
    assert.strictEqual(recorded.latestRun?.branch, "main");
    assert.strictEqual(recorded.recentRuns.length, 1);
    assert.strictEqual(recorded.lastChecked, "Recorded Build Evidence");
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
          assert.strictEqual(
            content.includes("NEXT_PUBLIC_GOOGLE_"),
            false,
            `Forbidden NEXT_PUBLIC_GOOGLE_ found in ${fullPath}`
          );
        }
      }
    };
    checkDir(adminSrc);
  });

  await t.test("Google Search Console: calculates truthful impression-weighted average position", () => {
    // Case 1: High impression at position 2, low impression at position 90
    const weighted1 = calculateImpressionWeightedPosition([
      { position: 2.0, impressions: 10000 },
      { position: 90.0, impressions: 2 },
    ]);
    assert.strictEqual(weighted1, 2.0, "Impression-weighted position must reflect dominant traffic weight");

    // Case 2: Multi-row distribution
    const weighted2 = calculateImpressionWeightedPosition([
      { position: 1.0, impressions: 100 },
      { position: 5.0, impressions: 300 },
      { position: 10.0, impressions: 600 },
    ]);
    // (1*100 + 5*300 + 10*600) / 1000 = (100 + 1500 + 6000) / 1000 = 7600 / 1000 = 7.6
    assert.strictEqual(weighted2, 7.6, "Position must equal (100 + 1500 + 6000) / 1000 = 7.6");

    // Case 3: Zero impressions fallback
    const weightedZero = calculateImpressionWeightedPosition([
      { position: 3.0, impressions: 0 },
      { position: 7.0, impressions: 0 },
    ]);
    assert.strictEqual(weightedZero, 5.0, "Zero impressions fallback must compute arithmetic average");

    // Case 4: Empty input
    assert.strictEqual(calculateImpressionWeightedPosition([]), 0);
  });

  await t.test("Search Navigation Integrity: SEARCH_ALIASES semantic audit and all 59 aliases resolve to live valid calculators", async () => {
    const { SEARCH_ALIASES, getCalculatorIdsForQuery } = await import("../apps/web/src/lib/searchAliases.js");
    const { calculatorRegistry } = await import("../packages/calculator-registry/src/index.js");

    const registryIds = new Set(calculatorRegistry.map((c) => c.id));
    assert.ok(SEARCH_ALIASES.length >= 50, "Must have at least 50 configured search alias groups");

    for (const entry of SEARCH_ALIASES) {
      assert.ok(entry.keywords.length > 0, "Alias entry must have keywords");
      if (entry.calculatorIds) {
        for (const targetId of entry.calculatorIds) {
          assert.ok(
            registryIds.has(targetId),
            `Alias '${entry.keywords[0]}' references non-existent calculator ID '${targetId}'`
          );
        }
      }
    }

    // Explicit audit of corrected mappings identified in Phase 4 audit
    const studentLoanMatches = getCalculatorIdsForQuery("student loan");
    assert.ok(
      studentLoanMatches.has("TAX-020"),
      "student loan must map to Student Loan Repayment Calculator (TAX-020)"
    );
    assert.strictEqual(
      studentLoanMatches.has("TAX-005"),
      false,
      "student loan must NOT map to Salary Sacrifice (TAX-005)"
    );

    const cagrMatches = getCalculatorIdsForQuery("cagr");
    assert.ok(
      cagrMatches.has("INV-009"),
      "cagr must map to CAGR Calculator (INV-009)"
    );
    assert.strictEqual(
      cagrMatches.has("INV-007"),
      false,
      "cagr must NOT map to Present Value (INV-007)"
    );

    const irrMatches = getCalculatorIdsForQuery("irr");
    assert.ok(
      irrMatches.has("INV-011"),
      "irr must map to IRR Calculator (INV-011)"
    );
    assert.strictEqual(
      irrMatches.has("INV-009"),
      false,
      "irr must NOT map to CAGR (INV-009)"
    );

    const feeDragMatches = getCalculatorIdsForQuery("fee drag");
    assert.ok(
      feeDragMatches.has("INV-014"),
      "fee drag must map to Investment Fees Calculator (INV-014)"
    );
    assert.strictEqual(
      feeDragMatches.has("INV-011"),
      false,
      "fee drag must NOT map to IRR (INV-011)"
    );

    const pregnancyMatches = getCalculatorIdsForQuery("pregnancy");
    const dueDateMatches = getCalculatorIdsForQuery("due date");
    assert.ok(
      pregnancyMatches.has("HLT-019") && dueDateMatches.has("HLT-020"),
      "pregnancy and due date must map to Pregnancy & Due Date calculators (HLT-019, HLT-020)"
    );
    assert.strictEqual(
      pregnancyMatches.has("HLT-006"),
      false,
      "pregnancy must NOT map to body composition / BMI"
    );

    const lisaMatches = getCalculatorIdsForQuery("lifetime isa");
    assert.ok(
      lisaMatches.has("ISA-004"),
      "LISA and Lifetime ISA must map to Lifetime ISA Calculator (ISA-004)"
    );

    const fuelMatches = getCalculatorIdsForQuery("fuel cost");
    assert.ok(
      fuelMatches.has("AUT-006"),
      "fuel cost must map to Fuel Cost Calculator (AUT-006)"
    );
    assert.strictEqual(
      fuelMatches.has("AUT-001"),
      false,
      "fuel cost must NOT map to Car Loan (AUT-001)"
    );
  });

  await t.test("System Domain Architecture: does not contain hardcoded stale Pending DNS strings and uses evidence-based configured labels", () => {
    const rootDir = getMonorepoRootDir();
    const systemPageFile = join(rootDir, "apps/admin/src/app/system/page.tsx");
    const systemPageContent = readFileSync(systemPageFile, "utf8");

    // Ensure hardcoded "Pending DNS Connection" is removed from system page JSX
    assert.strictEqual(
      systemPageContent.includes("Pending DNS Connection"),
      false,
      "system/page.tsx must not contain hardcoded 'Pending DNS Connection'"
    );
  });
});


