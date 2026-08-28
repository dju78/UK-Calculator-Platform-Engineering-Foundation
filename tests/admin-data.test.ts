import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";
import { getUKRuleset } from "../packages/rules-uk/src/index.js";
import type { CalculatorDefinition } from "../packages/calculator-registry/src/types.js";
import {
  getSitemapRouteList,
  getSitemapEntryCount,
  getAdminSEOOverview,
  evaluateIndexNowStatus,
  evaluateCalculatorSEOCoverage,
  generateCalculatorDescription,
  getAdminCalculatorDetail,
  getCalculatorSummary,
  listAdminCalculators,
  getAdminQAOverview,
  parseQAArtifact,
  getAdminRulesOverview,
  getMonorepoRootDir,
} from "./admin-data-helper.js";

test("Admin Console Data Integrity Suite", async (t: any) => {
  await t.test("Calculator inventory counts derive exact platform figures", () => {
    assert.strictEqual(calculatorRegistry.length, 253, "Total calculators must equal 253");
    const categories = new Set(calculatorRegistry.map((c) => c.category));
    assert.strictEqual(categories.size, 19, "Total categories must equal 19");

    const wave1 = calculatorRegistry.filter((c) => c.launchWave === "Wave 1");
    const wave2 = calculatorRegistry.filter((c) => c.launchWave === "Wave 2");
    const wave3 = calculatorRegistry.filter((c) => c.launchWave === "Wave 3");

    assert.strictEqual(wave1.length, 55, "Wave 1 must contain 55 calculators");
    assert.strictEqual(wave2.length, 188, "Wave 2 must contain 188 calculators");
    assert.strictEqual(wave3.length, 10, "Wave 3 must contain 10 calculators");

    const summary = getCalculatorSummary();
    assert.strictEqual(summary.total, 253);
    assert.strictEqual(summary.totalCategories, 19);
    assert.strictEqual(summary.implemented, 253);
    assert.strictEqual(summary.verified, 253);
  });

  await t.test("Actual web sitemap vs admin exact-set comparison", () => {
    // 1. Derive admin sitemap route list
    const adminRoutes: string[] = getSitemapRouteList();
    const adminCount = getSitemapEntryCount();
    const seoOverview = getAdminSEOOverview();

    assert.strictEqual(adminCount, 284, "Admin sitemap count must equal 284");
    assert.strictEqual(adminRoutes.length, 284, "Admin route list length must match count");
    assert.strictEqual(seoOverview.sitemapEntryCount, 284);

    // 2. Canonical web sitemap specification from apps/web/src/app/sitemap.ts
    const staticPages: string[] = ['', '/privacy', '/terms', '/disclaimer', '/commercial-disclosure', '/accessibility'];
    const governancePages: string[] = [
      '/about',
      '/for-organisations',
      '/how-we-check-our-figures',
      '/editorial-policy',
      '/updates',
      '/contact',
    ];
    const categoryPages: string[] = Array.from(new Set(calculatorRegistry.map((c: CalculatorDefinition) => c.category)))
      .sort()
      .map((cat: string) => `/category/${encodeURIComponent(cat.toLowerCase())}`);
    const calculatorPages: string[] = (calculatorRegistry as CalculatorDefinition[]).map((c: CalculatorDefinition) => `/calculators/${c.slug}`);

    const expectedCanonicalWebRoutes: string[] = [
      ...staticPages.map((p) => p === '' ? '/' : p),
      ...governancePages,
      ...categoryPages,
      ...calculatorPages,
    ];

    assert.strictEqual(expectedCanonicalWebRoutes.length, 284, "Canonical web route count must be 284");

    // 3. Exact Set Comparison: check equal members, no missing routes, no extra routes, no duplicates
    const adminSet = new Set<string>(adminRoutes);
    const webSet = new Set<string>(expectedCanonicalWebRoutes);

    assert.strictEqual(adminSet.size, 284, "Admin sitemap must have 284 unique routes (no duplicates)");
    assert.strictEqual(webSet.size, 284, "Web sitemap must have 284 unique routes (no duplicates)");
    assert.strictEqual(adminSet.size, webSet.size, "Equal count requirement");

    const missingInAdmin: string[] = [];
    for (const route of webSet) {
      if (!adminSet.has(route)) {
        missingInAdmin.push(route);
      }
    }
    assert.strictEqual(missingInAdmin.length, 0, `No missing routes in admin sitemap: ${missingInAdmin.join(", ")}`);

    const extraInAdmin: string[] = [];
    for (const route of adminSet) {
      if (!webSet.has(route)) {
        extraInAdmin.push(route);
      }
    }
    assert.strictEqual(extraInAdmin.length, 0, `No extra routes in admin sitemap: ${extraInAdmin.join(", ")}`);
  });

  await t.test("SEO Description generator and measured coverage audit", () => {
    // 1. Full live registry test (all valid)
    const fullAudit = evaluateCalculatorSEOCoverage(calculatorRegistry as CalculatorDefinition[]);
    assert.strictEqual(fullAudit.totalCalculators, 253);
    assert.strictEqual(fullAudit.withCanonical, 253);
    assert.strictEqual(fullAudit.withCustomDescription, 253, "All 253 calculators must have custom descriptions");
    assert.strictEqual(fullAudit.withSchemaApplicationCategory, 253);
    assert.strictEqual(fullAudit.coverageComplete, true);

    // Verify description formatting
    const descSample = generateCalculatorDescription(calculatorRegistry[0]);
    assert.ok(descSample.length > 20, "Generated description must be substantial");
    assert.ok(descSample.includes("Estimates only"), "Must include regulatory disclaimer snippet");

    // 2. Deliberately incomplete fixture test
    const brokenFixture: CalculatorDefinition[] = [
      {
        id: "TEST-001",
        name: "Valid Calculator",
        slug: "valid-calculator",
        category: "UK Tax & Salary",
        launchWave: "Wave 1",
        risk: "low",
        benchmarkCount: 5,
        status: "verified",
        implementationStatus: "implemented",
      } as any,
      {
        id: "TEST-002",
        name: "", // Missing name -> empty description
        slug: "", // Missing slug
        category: "Non-Existent-Category", // Unmapped category
        launchWave: "Wave 1",
        risk: "low",
        benchmarkCount: 5,
        status: "verified",
        implementationStatus: "implemented",
      } as any,
    ];

    const incompleteAudit = evaluateCalculatorSEOCoverage(brokenFixture);
    assert.strictEqual(incompleteAudit.totalCalculators, 2);
    assert.strictEqual(incompleteAudit.withCanonical, 1, "Must detect 1 missing slug");
    assert.strictEqual(incompleteAudit.withCustomDescription, 1, "Must detect 1 missing description");
    assert.strictEqual(incompleteAudit.withSchemaApplicationCategory, 1, "Must detect 1 unmapped category");
    assert.strictEqual(incompleteAudit.coverageComplete, false, "Must flag incomplete coverage");
  });

  await t.test("IndexNow 4-state logic evaluates all integration states correctly", () => {
    // Both key and script present => INTEGRATED
    const s1 = evaluateIndexNowStatus(true, true);
    assert.strictEqual(s1.status, "INTEGRATED");

    // Key present, script missing => PENDING_PARTIAL
    const s2 = evaluateIndexNowStatus(true, false);
    assert.strictEqual(s2.status, "PENDING_PARTIAL");

    // Script present, key missing => PENDING_PARTIAL
    const s3 = evaluateIndexNowStatus(false, true);
    assert.strictEqual(s3.status, "PENDING_PARTIAL");

    // Neither present => UNCONFIGURED
    const s4 = evaluateIndexNowStatus(false, false);
    assert.strictEqual(s4.status, "UNCONFIGURED");
  });

  await t.test("QA Missing-Evidence Test: parseQAArtifact handles missing and corrupt files without fabricated fallbacks", () => {
    // Missing file returns UNVERIFIED with zero counts
    const missing = parseQAArtifact("/non/existent/path/docs/platform-verification.json");
    assert.strictEqual(missing.overallStatus, "UNVERIFIED");
    assert.strictEqual(missing.evidenceLabel, "NO VERIFICATION ARTIFACT RECORDED");
    assert.strictEqual(missing.summary.unitTests.passed, 0);
    assert.strictEqual(missing.summary.benchmarks.passed, 0);
    assert.strictEqual(missing.metrics.length, 0);

    // Live file returns VERIFIED with 1118 unit tests
    const live = getAdminQAOverview();
    assert.strictEqual(live.overallStatus, "VERIFIED");
    assert.strictEqual(live.evidenceLabel, "LAST RECORDED VERIFICATION");
    assert.strictEqual(live.summary.unitTests.passed, 1118, "Must truthfully report 1118 passed unit tests");
    assert.strictEqual(live.summary.benchmarks.passed, 1489, "Must truthfully report 1489 passed benchmarks");
    assert.strictEqual(live.summary.browserTests.passed, 1642, "Must report 1642 passed browser tests");
    assert.strictEqual(live.summary.accessibility.violations, 0);
  });

  await t.test("Vercel monorepo root resolver works from real apps/admin working directory", () => {
    const originalCwd = process.cwd();
    const adminCwd = join(originalCwd, "apps/admin");

    try {
      // Switch process working directory to apps/admin
      process.chdir(adminCwd);
      assert.strictEqual(process.cwd(), adminCwd, "Must have real cwd set to apps/admin");

      const rootDir = getMonorepoRootDir();
      assert.strictEqual(rootDir, originalCwd, "getMonorepoRootDir must resolve to repository root from apps/admin");

      const summary = getCalculatorSummary();
      assert.strictEqual(summary.total, 253);

      const qa = getAdminQAOverview();
      assert.strictEqual(qa.overallStatus, "VERIFIED");
      assert.strictEqual(qa.summary.unitTests.passed, 1118);

      const seo = getAdminSEOOverview();
      assert.strictEqual(seo.sitemapEntryCount, 284);
      assert.strictEqual(seo.indexNow.status, "INTEGRATED");

      // Calculator detail loads spec cleanly for Wave 3 and Wave 2 calculators
      const detailW3 = getAdminCalculatorDetail("PRO-008");
      assert.ok(detailW3 !== null);
      assert.strictEqual(detailW3.id, "PRO-008");
      assert.strictEqual(detailW3.hasSpec, true);
      assert.ok(detailW3.purpose && detailW3.purpose.length > 0);

      const detailW2 = getAdminCalculatorDetail("AUT-001");
      assert.ok(detailW2 !== null);
      assert.strictEqual(detailW2.id, "AUT-001");
      assert.strictEqual(detailW2.hasSpec, true);
      assert.ok(detailW2.purpose && detailW2.purpose.length > 0);
    } finally {
      process.chdir(originalCwd);
      assert.strictEqual(process.cwd(), originalCwd, "Restored original cwd");
    }
  });

  await t.test("Ruleset uk-2026-27-v1 parameters are derived from rules-uk and rules-sensitive count is 51", () => {
    const rules = getUKRuleset("uk-2026-27-v1");
    assert.strictEqual(rules.ruleset_id, "uk-2026-27-v1");
    assert.strictEqual(rules.tax_year, "2026/27");
    assert.strictEqual(rules.status, "approved");

    const rulesOverview = getAdminRulesOverview();
    assert.strictEqual(rulesOverview.rulesSensitiveCalculatorsTotal, 51, "Platform must have exactly 51 rules-sensitive calculators");

    const incomeTaxFamily = rulesOverview.ruleFamilies.find((f: any) => f.key === "income_tax_england_wales_ni");
    assert.ok(incomeTaxFamily);
    assert.strictEqual(incomeTaxFamily.sampleParameters["Personal Allowance"], "£12,570");

    const scotTaxFamily = rulesOverview.ruleFamilies.find((f: any) => f.key === "income_tax_scotland");
    assert.ok(scotTaxFamily);
    assert.strictEqual(scotTaxFamily.sampleParameters["Starter Rate"], "19% (£12,571 - £16,537)");

    const slFamily = rulesOverview.ruleFamilies.find((f: any) => f.key === "student_loans");
    assert.ok(slFamily);
    assert.strictEqual(slFamily.sampleParameters["Plan 1 Threshold"], "£26,900 (9%)");
    assert.strictEqual(slFamily.sampleParameters["Plan 2 Threshold"], "£29,385 (9%)");
    assert.strictEqual(slFamily.sampleParameters["Plan 4 (Scotland) Threshold"], "£33,795 (9%)");
  });

  await t.test("Benchmark counts meet minimum verification threshold of 5 cases", () => {
    for (const c of calculatorRegistry) {
      if (c.status === "verified") {
        assert.ok(c.benchmarkCount >= 5, `Calculator ${c.id} must have >= 5 benchmark cases (has ${c.benchmarkCount})`);
      }
    }
  });

  await t.test("Slugs and IDs are unique across all 253 calculators", () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const c of calculatorRegistry) {
      assert.ok(!ids.has(c.id), `Duplicate id ${c.id}`);
      assert.ok(!slugs.has(c.slug), `Duplicate slug ${c.slug}`);
      ids.add(c.id);
      slugs.add(c.slug);
    }

    assert.strictEqual(ids.size, 253);
    assert.strictEqual(slugs.size, 253);
  });

  await t.test("Regression Check: apps/admin/src contains zero runtime imports from dist/", () => {
    const rootDir = getMonorepoRootDir();
    const adminSrcDir = join(rootDir, "apps/admin/src");

    function getAllSourceFiles(dir: string): string[] {
      const results: string[] = [];
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          results.push(...getAllSourceFiles(full));
        } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
          results.push(full);
        }
      }
      return results;
    }

    const files = getAllSourceFiles(adminSrcDir);
    assert.ok(files.length > 0, "Must find files in apps/admin/src");

    const offendingImports: Array<{ file: string; line: string }> = [];
    const distImportRegex = /(from\s+["'][^"']*dist\/[^"']*["']|import\s*\(["'][^"']*dist\/[^"']*["']\))/i;

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (distImportRegex.test(line)) {
          offendingImports.push({ file, line: line.trim() });
        }
      }
    }

    assert.strictEqual(
      offendingImports.length,
      0,
      `apps/admin/src must not contain any runtime imports from dist/: ${JSON.stringify(offendingImports, null, 2)}`
    );
  });
});