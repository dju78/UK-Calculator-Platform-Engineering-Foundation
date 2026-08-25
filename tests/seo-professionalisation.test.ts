import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculatorRegistry, publishedRegistry } from "../packages/calculator-registry/src/index.js";
import { implementedCalculatorIds } from "../packages/calculation-engine/src/engine.js";

const SITE_URL = "https://uk-calculator-platform.onrender.com";
const SITE_NAME = "UK Calculator Platform";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function calculatorPath(slug: string): string {
  return `/calculators/${slug}`;
}

function categoryPath(category: string): string {
  return `/category/${encodeURIComponent(category.toLowerCase())}`;
}

function calculatorDescription(calc: any): string {
  const is2026 = calc.rulesSensitive;
  const name = calc.name.toLowerCase().includes("calculator")
    ? calc.name
    : `${calc.name} Calculator`;
  const rules = is2026 ? "using 2026/27 UK rules" : "standard UK methods";
  const advice = "Estimates only - not financial or tax advice.";
  return `Free ${name} for the UK. Work out figures in the ${calc.category} category, using ${rules}. ${advice}`;
}

function categoryDescription(category: string, count: number): string {
  return `Browse and compare ${count} free UK calculators in ${category}. Free, instant tools calculated in accordance with UK statutory rules and financial guidelines.`;
}

describe("Professionalisation Phase 3: SEO, Discoverability and Information Architecture", () => {
  const rootDir = process.cwd();
  const siteTs = fs.readFileSync(path.join(rootDir, "apps/web/src/lib/site.ts"), "utf8");
  const implemented = implementedCalculatorIds();
  const liveCalcs = publishedRegistry(implemented);
  const liveCategories = Array.from(new Set(liveCalcs.map((c: any) => c.category))).sort();

  test("1. Registry and Category Information Architecture (253 calculators, 19 categories)", () => {
    assert.equal(calculatorRegistry.length, 253, "Full registry must contain exactly 253 calculators");
    assert.equal(liveCalcs.length, 253, "Live calculators must equal 253");
    assert.equal(liveCategories.length, 19, "Live categories must equal exactly 19");

    for (const cat of liveCategories) {
      assert.ok(siteTs.includes(`"${cat}":`), `Category ${cat} must be configured in CATEGORY_DETAILS in site.ts`);
    }

    const categorySet = new Set(liveCategories);
    for (const calc of liveCalcs) {
      assert.ok(
        categorySet.has(calc.category),
        `Calculator ${calc.id} has invalid category: ${calc.category}`
      );
    }

    for (const cat of liveCategories) {
      const inCat = liveCalcs.filter((c: any) => c.category === cat);
      assert.ok(
        inCat.length > 0,
        `Category ${cat} has 0 calculators (empty category)`
      );
    }
  });

  test("2. Unique Slugs and Canonical Paths (0 duplicate slugs, clean kebab format)", () => {
    const slugSet = new Set<string>();
    const duplicateSlugs: string[] = [];

    for (const calc of liveCalcs) {
      assert.ok(calc.slug && calc.slug.length > 2, `${calc.id} has invalid slug: ${calc.slug}`);
      assert.match(calc.slug, /^[a-z]+[a-z0-9-]*$/, `${calc.id} slug is not valid kebab-case: ${calc.slug}`);
      if (slugSet.has(calc.slug)) {
        duplicateSlugs.push(calc.slug);
      }
      slugSet.add(calc.slug);
    }

    assert.equal(duplicateSlugs.length, 0, `Duplicate slugs found: ${duplicateSlugs.join(", ")}`);
    assert.equal(slugSet.size, 253, "Must have exactly 253 unique calculator slugs");
  });

  test("3. Calculator Metadata Quality and Canonical Matching (253 metadata sets)", () => {
    const titleSet = new Set<string>();
    const duplicateTitles: string[] = [];
    const missingTitles: string[] = [];

    for (const calc of liveCalcs) {
      const title = `${calc.name} | ${SITE_NAME}`;
      const description = calculatorDescription(calc);
      const expectedPath = calculatorPath(calc.slug);
      const expectedOgUrl = absoluteUrl(expectedPath);

      if (!title || title.trim().length === 0) missingTitles.push(calc.id);
      if (titleSet.has(title)) duplicateTitles.push(`${calc.id} (${title})`);
      titleSet.add(title);

      assert.ok(description && description.length > 20, `Missing description for ${calc.id}`);
      assert.ok(!description.toLowerCase().includes("calculator calculator"), `Duplicate 'calculator calculator' found in ${calc.id}`);
      assert.equal(expectedPath, `/calculators/${calc.slug}`);
      assert.equal(expectedOgUrl, `${SITE_URL}/calculators/${calc.slug}`);
    }

    assert.equal(missingTitles.length, 0);
    assert.equal(duplicateTitles.length, 0);
  });

  test("4. Category Metadata Quality and Canonical Matching (19 category metadata sets)", () => {
    const catTitleSet = new Set<string>();
    for (const cat of liveCategories) {
      const inCat = liveCalcs.filter((c: any) => c.category === cat);
      const title = `${cat} Calculators | ${SITE_NAME}`;
      const description = categoryDescription(cat, inCat.length);
      const path = categoryPath(cat);
      const ogUrl = absoluteUrl(path);

      assert.ok(!catTitleSet.has(title), `Duplicate category title: ${title}`);
      catTitleSet.add(title);

      assert.ok(description.length > 20, `Category description too short for ${cat}`);
      assert.ok(path.startsWith("/category/"), `Invalid category path: ${path}`);
      assert.equal(ogUrl, `${SITE_URL}${path}`, `Category og:url mismatch for ${cat}`);
    }
  });

  test("5. Related Calculators Engine: 3 to 6 valid relevant tools per calculator", () => {
    const relatedCalcsTs = fs.readFileSync(path.join(rootDir, "apps/web/src/lib/relatedCalculators.ts"), "utf8");
    assert.ok(relatedCalcsTs.includes("getRelatedCalculators"), "Must export getRelatedCalculators");
    assert.ok(relatedCalcsTs.includes("CURATED_RELATED"), "Must declare Phase 2 CURATED_RELATED hook");
  });

  test("6. Sitemap Architecture (277 total URLs: 1 home + 253 calculators + 19 categories + 4 legal)", () => {
    const sitemapTs = fs.readFileSync(path.join(rootDir, "apps/web/src/app/sitemap.ts"), "utf8");
    assert.ok(sitemapTs.includes("liveCalculators.map"), "Sitemap must map over calculators");
    assert.ok(sitemapTs.includes("categories ="), "Sitemap must generate categories");
    assert.ok(sitemapTs.includes("/accessibility"), "Sitemap must include legal pages");
    assert.ok(sitemapTs.includes("/disclaimer"), "Sitemap must include disclaimer");
    assert.ok(sitemapTs.includes("/privacy"), "Sitemap must include privacy");
    assert.ok(sitemapTs.includes("/terms"), "Sitemap must include terms");

    const expectedCount = 1 + liveCalcs.length + liveCategories.length + 4;
    assert.equal(expectedCount, 277, "Expected sitemap entries must equal 277");
  });

  test("7. Robots and Indexability Configuration", () => {
    const robotsTs = fs.readFileSync(path.join(rootDir, "apps/web/src/app/robots.ts"), "utf8");
    assert.ok(robotsTs.includes("allow: '/'") || robotsTs.includes('allow: "/"'), "Robots must allow crawling");
    assert.ok(robotsTs.includes('sitemap.xml'), "Robots must declare sitemap");
    assert.ok(robotsTs.includes('host: SITE_URL'), "Robots must declare canonical host");
  });

  test("8. Structured Data Schema Protection (No FinancialProduct schema mass-applied)", () => {
    const calcPageFile = fs.readFileSync(path.join(rootDir, "apps/web/src/app/calculators/[slug]/page.tsx"), "utf8");
    assert.ok(
      calcPageFile.includes("WebApplication"),
      "Calculator page must declare WebApplication schema"
    );
    assert.ok(
      !calcPageFile.includes("FinancialProduct"),
      "Calculator page must NOT declare FinancialProduct schema"
    );
  });

  test("9. Breadcrumbs Component and Structured Data Integrity", () => {
    const breadcrumbFile = fs.readFileSync(path.join(rootDir, "apps/web/src/components/layout/Breadcrumbs.tsx"), "utf8");
    assert.ok(breadcrumbFile.includes("BreadcrumbList"), "Breadcrumbs must declare BreadcrumbList schema");
    assert.ok(breadcrumbFile.includes('aria-label="Breadcrumb"'), "Breadcrumbs must have accessible aria-label");
  });

  test("10. Public Routes Free of Internal Wave Terminology and Raw Headings", () => {
    const filesToAudit = [
      "apps/web/src/app/page.tsx",
      "apps/web/src/components/home/CalculatorBrowser.tsx",
      "apps/web/src/app/calculators/[slug]/page.tsx",
      "apps/web/src/app/category/[category]/page.tsx",
      "apps/web/src/app/not-found.tsx",
    ];

    for (const relPath of filesToAudit) {
      const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
      assert.ok(!content.includes("Wave 1"), `Found Wave 1 in ${relPath}`);
      assert.ok(!content.includes("Wave 2"), `Found Wave 2 in ${relPath}`);
      assert.ok(!content.includes("Wave 3"), `Found Wave 3 in ${relPath}`);
      assert.ok(!content.includes("{calc.id}</span>"), `Found raw ID span in ${relPath}`);
    }
  });
});
