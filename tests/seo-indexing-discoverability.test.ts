import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";
import {
  getMonorepoRootDir,
  getAdminSEOOverview,
  getSitemapRouteList,
  generateCalculatorDescription,
  evaluateCalculatorSEOCoverage,
} from "./admin-data-helper.js";

test("SEO Indexing, Discoverability & Crawl Architecture Suite", async (t: any) => {
  const rootDir = getMonorepoRootDir();

  await t.test("Sitemap Completeness: exact 284 URLs breakdown across calculators, categories, governance and static pages", () => {
    const sitemapRoutes = getSitemapRouteList();
    assert.strictEqual(sitemapRoutes.length, 284, "Sitemap must contain exactly 284 production URLs");

    const calculatorRoutes = sitemapRoutes.filter((r) => r.startsWith("/calculators/"));
    const categoryRoutes = sitemapRoutes.filter((r) => r.startsWith("/category/"));
    const governanceRoutes = [
      "/about",
      "/for-organisations",
      "/how-we-check-our-figures",
      "/editorial-policy",
      "/updates",
      "/contact",
    ];
    const staticRoutes = ["/", "/privacy", "/terms", "/disclaimer", "/commercial-disclosure", "/accessibility"];

    assert.strictEqual(calculatorRoutes.length, 253, "Must include all 253 calculator routes");
    assert.strictEqual(categoryRoutes.length, 19, "Must include all 19 category hub routes");
    assert.strictEqual(governanceRoutes.length, 6, "Must include all 6 editorial trust routes");
    assert.strictEqual(staticRoutes.length, 6, "Must include all 6 static/legal routes");

    for (const gov of governanceRoutes) {
      assert.ok(sitemapRoutes.includes(gov), `Governance route ${gov} must be present in sitemap`);
    }

    for (const stat of staticRoutes) {
      assert.ok(sitemapRoutes.includes(stat), `Static route ${stat} must be present in sitemap`);
    }
  });

  await t.test("Sitemap Purity: contains zero private, admin, API, or embed routes", () => {
    const sitemapRoutes = getSitemapRouteList();

    const forbiddenPrefixes = ["/admin", "/api", "/embed", "/login", "/system", "/qa", "/traffic", "/rules", "/releases"];
    for (const route of sitemapRoutes) {
      for (const prefix of forbiddenPrefixes) {
        assert.strictEqual(
          route.startsWith(prefix),
          false,
          `Forbidden route ${route} with prefix ${prefix} must not appear in public sitemap.xml`
        );
      }
    }

    // Check uniqueness (no duplicate URLs)
    const uniqueSet = new Set(sitemapRoutes);
    assert.strictEqual(uniqueSet.size, sitemapRoutes.length, "Sitemap must contain zero duplicate URLs");
  });

  await t.test("Canonical URLs & Slugs: 100% of calculators have unique, valid lowercase kebab-case slugs", () => {
    const slugSet = new Set<string>();
    const idSet = new Set<string>();

    for (const calc of calculatorRegistry) {
      assert.ok(calc.slug, `Calculator ${calc.id} must have a slug`);
      assert.ok(calc.slug.length > 2, `Calculator ${calc.id} slug must be meaningful`);
      assert.strictEqual(
        calc.slug,
        calc.slug.toLowerCase(),
        `Slug ${calc.slug} must be lowercase`
      );
      assert.match(
        calc.slug,
        /^[a-z0-9-]+$/,
        `Slug ${calc.slug} must only contain lowercase alphanumeric characters and hyphens`
      );

      assert.strictEqual(slugSet.has(calc.slug), false, `Duplicate slug detected: ${calc.slug}`);
      assert.strictEqual(idSet.has(calc.id), false, `Duplicate ID detected: ${calc.id}`);

      slugSet.add(calc.slug);
      idSet.add(calc.id);
    }

    assert.strictEqual(slugSet.size, 253);
    assert.strictEqual(idSet.size, 253);
  });

  await t.test("robots.txt: allows search crawler access while disallowing embed widgets and internal APIs", () => {
    const robotsFile = join(rootDir, "apps/web/src/app/robots.ts");
    assert.ok(existsSync(robotsFile), "apps/web/src/app/robots.ts must exist");

    const content = readFileSync(robotsFile, "utf8");
    assert.ok(content.includes("allow: '/'"), "robots.txt must allow root");
    assert.ok(content.includes("'/embed/'"), "robots.txt must disallow /embed/");
    assert.ok(content.includes("'/api/'"), "robots.txt must disallow /api/");
    assert.ok(content.includes("sitemap.xml"), "robots.txt must declare sitemap");
  });

  await t.test("Metadata Uniqueness & Tax Year: every calculator has a customized meta description and title", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const calc of calculatorRegistry) {
      const title = `${calc.name} | UK Calculator Platform`;
      const desc = generateCalculatorDescription(calc);

      assert.ok(title.length >= 10, `Title too short for ${calc.id}`);
      assert.ok(desc.length >= 40, `Description too short for ${calc.id}`);

      assert.strictEqual(titles.has(title), false, `Duplicate title detected for ${calc.name}`);
      titles.add(title);

      if (calc.rulesSensitive) {
        assert.ok(
          desc.includes("2026/27"),
          `Rules-sensitive calculator ${calc.id} description must cite 2026/27 statutory rules`
        );
      }

      descriptions.add(desc);
    }

    assert.strictEqual(titles.size, 253);
    assert.strictEqual(descriptions.size, 253);
  });

  await t.test("Information Architecture & Zero Orphans: every calculator is assigned to a category with cross-linking", () => {
    const categories = Array.from(new Set(calculatorRegistry.map((c) => c.category)));
    assert.strictEqual(categories.length, 19, "Exactly 19 canonical categories");

    const categoryMap: Record<string, typeof calculatorRegistry> = {};
    for (const calc of calculatorRegistry) {
      if (!categoryMap[calc.category]) {
        categoryMap[calc.category] = [];
      }
      categoryMap[calc.category].push(calc);
    }

    for (const [catName, calcs] of Object.entries(categoryMap)) {
      assert.ok(calcs.length > 0, `Category ${catName} must not be empty`);
      for (const calc of calcs) {
        assert.strictEqual(calc.category, catName);
      }
    }
  });

  await t.test("Schema.org Coverage: 100% of calculators and categories map to official Schema.org ApplicationCategory", () => {
    const audit = evaluateCalculatorSEOCoverage(calculatorRegistry);
    assert.strictEqual(audit.totalCalculators, 253);
    assert.strictEqual(audit.withCanonical, 253);
    assert.strictEqual(audit.withCustomDescription, 253);
    assert.strictEqual(audit.withSchemaApplicationCategory, 253);
    assert.strictEqual(audit.totalCategories, 19);
    assert.strictEqual(audit.categoriesWithMetadata, 19);
    assert.strictEqual(audit.coverageComplete, true);
  });

  await t.test("Embed Route Protection: embed pages emit noindex, nofollow directives", () => {
    const embedPageFile = join(rootDir, "apps/web/src/app/embed/[slug]/page.tsx");
    assert.ok(existsSync(embedPageFile), "embed page must exist");

    const content = readFileSync(embedPageFile, "utf8");
    assert.ok(content.includes("index: false"), "Embed pages must specify index: false");
    assert.ok(content.includes("follow: false"), "Embed pages must specify follow: false");
  });

  await t.test("Category Page Structured Data: category hub pages emit CollectionPage and ItemList JSON-LD", () => {
    const categoryPageFile = join(rootDir, "apps/web/src/app/category/[category]/page.tsx");
    assert.ok(existsSync(categoryPageFile), "Category page must exist");

    const content = readFileSync(categoryPageFile, "utf8");
    assert.ok(content.includes('"@type": "CollectionPage"'), "Category page must emit CollectionPage");
    assert.ok(content.includes('"@type": "ItemList"'), "Category page must emit ItemList");
  });
});
