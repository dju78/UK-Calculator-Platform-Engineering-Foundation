import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";
import { getUKRuleset } from "../packages/rules-uk/src/index.js";
import type { CalculatorDefinition } from "../packages/calculator-registry/src/types.js";

test("Admin Console Data Integrity Suite", async (t: any) => {
  const seoModulePath = pathToFileURL(join(process.cwd(), "apps/admin/src/lib/admin-data/seo-status.ts")).href;
  const {
    getSitemapRouteList,
    getSitemapEntryCount,
    getAdminSEOOverview,
    evaluateIndexNowStatus,
    evaluateCalculatorSEOCoverage,
    getMonorepoRootDir,
  } = await import(seoModulePath);

  const calcModulePath = pathToFileURL(join(process.cwd(), "apps/admin/src/lib/admin-data/calculator-registry.ts")).href;
  const { getAdminCalculatorDetail, getCalculatorSummary, listAdminCalculators } = await import(calcModulePath);

  const qaModulePath = pathToFileURL(join(process.cwd(), "apps/admin/src/lib/admin-data/qa-status.ts")).href;
  const { getAdminQAOverview } = await import(qaModulePath);

  const rulesModulePath = pathToFileURL(join(process.cwd(), "apps/admin/src/lib/admin-data/rules-governance.ts")).href;
  const { getAdminRulesOverview } = await import(rulesModulePath);

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

  await t.test("Sitemap count is derived dynamically and matches canonical route inventory (284 URLs)", () => {
    const routeList = getSitemapRouteList();
    const count = getSitemapEntryCount();
    const seoOverview = getAdminSEOOverview();

    // 6 static + 6 governance + 19 categories + 253 calculators = 284 URLs
    assert.strictEqual(count, 284, "Total sitemap route count must equal 284");
    assert.strictEqual(routeList.length, 284, "Route list length must match count");
    assert.strictEqual(seoOverview.sitemapEntryCount, 284, "Admin SEO overview must report 284");
    assert.ok(routeList.includes("/"), "Must include homepage");
    assert.ok(routeList.includes("/privacy"), "Must include privacy policy");
    assert.ok(routeList.includes("/about"), "Must include about page");
    assert.ok(routeList.includes("/category/uk%20tax%20%26%20salary"), "Must include encoded category");
    assert.ok(routeList.includes("/calculators/loan-calculator"), "Must include calculator canonical route");
    assert.ok(routeList.includes("/calculators/uk-income-tax-calculator"), "Must include calculator canonical route");
  });

  await t.test("SEO Coverage audit inspects actual data and detects incomplete fixtures", () => {
    // 1. Full live registry test (all valid)
    const fullAudit = evaluateCalculatorSEOCoverage(calculatorRegistry as CalculatorDefinition[]);
    assert.strictEqual(fullAudit.totalCalculators, 253);
    assert.strictEqual(fullAudit.withCanonical, 253);
    assert.strictEqual(fullAudit.withCustomDescription, 253);
    assert.strictEqual(fullAudit.withSchemaApplicationCategory, 253);
    assert.strictEqual(fullAudit.coverageComplete, true);

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
        name: "", // Missing name/description
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

  await t.test("Vercel monorepo root resolver works from simulated apps/admin directory", () => {
    const root = getMonorepoRootDir();
    assert.ok(root.length > 0);
    assert.ok(!root.endsWith("apps/admin"), "Monorepo root must resolve repository base");

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
  });

  await t.test("QA Evidence reflects LAST RECORDED VERIFICATION without stale assumptions", () => {
    const qa = getAdminQAOverview();
    assert.strictEqual(qa.overallStatus, "VERIFIED");
    assert.strictEqual(qa.evidenceLabel, "LAST RECORDED VERIFICATION");
    assert.strictEqual(qa.summary.unitTests.passed, 1112, "Unit test count must reflect 1112 passed");
    assert.strictEqual(qa.summary.benchmarks.passed, 1489, "Benchmark count must reflect 1489 passed");
    assert.strictEqual(qa.summary.browserTests.passed, 1642, "Browser test count must reflect 1642 passed");
    assert.strictEqual(qa.summary.accessibility.violations, 0, "A11y violations must equal 0");
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
});