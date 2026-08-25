import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { calculatorRegistry, getCalculatorDisclaimer } from "../packages/calculator-registry/src/index.js";

describe("Professionalisation Phase 1: Trust, UX and Public Credibility", () => {
  const rootDir = process.cwd();

  test("1. No public boolean field displays literal 'True' / 'False' option labels", () => {
    const mappingFiles = [
      "apps/web/src/components/calculators/fieldMappings.ts",
      "apps/web/src/components/calculators/wave2FieldMappings.ts",
      "apps/web/src/components/calculators/wave3FieldMappings.ts"
    ];

    for (const relPath of mappingFiles) {
      const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
      const trueMatch = content.match(/label:\s*["']True["']/g);
      const falseMatch = content.match(/label:\s*["']False["']/g);

      assert.equal(
        trueMatch,
        null,
        `Found literal 'True' option label in ${relPath}`
      );
      assert.equal(
        falseMatch,
        null,
        `Found literal 'False' option label in ${relPath}`
      );
    }
  });

  test("2. Pregnancy and fertility calculators receive reproductive/clinical disclaimer rather than body-composition exclusion", () => {
    const pregnancyCalcs = ["HLT-019", "HLT-020", "HLT-021", "HLT-022"];
    for (const id of pregnancyCalcs) {
      const calc = calculatorRegistry.find((c: any) => c.id === id);
      const disclaimer = getCalculatorDisclaimer({
        id,
        category: calc?.category,
        subcategory: calc?.subcategory,
        name: calc?.name,
        rulesSensitive: calc?.rulesSensitive
      });

      assert.ok(
        !disclaimer.body.toLowerCase().includes("does not account for"),
        `${id} should not state that it does not account for pregnancy`
      );
      assert.ok(
        disclaimer.body.toLowerCase().includes("midwife") ||
        disclaimer.body.toLowerCase().includes("healthcare professional"),
        `${id} disclaimer must refer to midwife or healthcare professional`
      );
    }
  });

  test("3. Property tax calculators (SDLT/LBTT/LTT/CGT) receive conveyancing/tax adviser disclaimers instead of mortgage lender text", () => {
    const propertyTaxCalcs = ["PRO-023", "PRO-024", "PRO-025", "PRO-026", "PRO-027", "PRO-028"];
    for (const id of propertyTaxCalcs) {
      const calc = calculatorRegistry.find((c: any) => c.id === id);
      const disclaimer = getCalculatorDisclaimer({
        id,
        category: calc?.category,
        subcategory: calc?.subcategory,
        name: calc?.name,
        rulesSensitive: calc?.rulesSensitive
      });

      assert.ok(
        !disclaimer.body.toLowerCase().includes("lending decision"),
        `${id} property tax calculator should not mention lending decisions`
      );
      assert.ok(
        disclaimer.body.toLowerCase().includes("conveyancer") ||
        disclaimer.body.toLowerCase().includes("tax adviser"),
        `${id} disclaimer must refer to licensed conveyancers or tax advisers`
      );
    }
  });

  test("4. Homepage calculator count is dynamically derived and matches 253", () => {
    const totalCalculators = calculatorRegistry.length;
    assert.equal(totalCalculators, 253, "Registry must contain 253 calculators");

    const homePath = path.join(rootDir, "apps/web/src/app/page.tsx");
    const homeContent = fs.readFileSync(homePath, "utf8");
    assert.ok(
      homeContent.includes("liveCalculators.length"),
      "Homepage must derive its count dynamically from liveCalculators.length"
    );
  });

  test("5. Public components and homepage do not expose internal Wave terminology", () => {
    const publicFiles = [
      "apps/web/src/app/page.tsx",
      "apps/web/src/components/home/CalculatorBrowser.tsx",
      "apps/web/src/app/calculators/[slug]/page.tsx",
      "apps/web/src/app/category/[category]/page.tsx"
    ];

    for (const relPath of publicFiles) {
      const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
      assert.ok(
        !content.includes("Wave 1 calculators"),
        `Found 'Wave 1 calculators' in ${relPath}`
      );
      assert.ok(
        !content.includes("Wave 2 calculators"),
        `Found 'Wave 2 calculators' in ${relPath}`
      );
      assert.ok(
        !content.includes("Wave 3 calculators"),
        `Found 'Wave 3 calculators' in ${relPath}`
      );
    }
  });

  test("6. Public calculator pages do not expose internal calculator IDs in headings/badges", () => {
    const calcPagePath = path.join(rootDir, "apps/web/src/app/calculators/[slug]/page.tsx");
    const calcPageContent = fs.readFileSync(calcPagePath, "utf8");

    // The ID should only exist in data attributes or schema, not visible headings/spans
    assert.ok(
      !calcPageContent.includes('<span className="text-sm text-slate-500 font-mono ml-auto">{calc.id}</span>'),
      "Calculator page should not render raw ID span in header"
    );
    assert.ok(
      !calcPageContent.includes('{calc.implementationStatus === "implemented" ? "Live" : "Specified"}'),
      "Calculator page should not render internal implementation status badge"
    );
  });

  test("7. Accessibility Statement uses one consistent WCAG 2.2 AA standard", () => {
    const a11yPagePath = path.join(rootDir, "apps/web/src/app/accessibility/page.tsx");
    const a11yContent = fs.readFileSync(a11yPagePath, "utf8");

    assert.ok(
      a11yContent.includes("WCAG 2.2 AA"),
      "Accessibility statement must reference WCAG 2.2 AA"
    );
    assert.ok(
      !a11yContent.includes("WCAG 2.1 level AA"),
      "Accessibility statement must not have conflicting WCAG 2.1 statement"
    );
  });

  test("8. Legal pages define page-specific OpenGraph and Twitter metadata", () => {
    const legalPages = [
      "apps/web/src/app/accessibility/page.tsx",
      "apps/web/src/app/disclaimer/page.tsx",
      "apps/web/src/app/privacy/page.tsx",
      "apps/web/src/app/terms/page.tsx"
    ];

    for (const relPath of legalPages) {
      const content = fs.readFileSync(path.join(rootDir, relPath), "utf8");
      assert.ok(
        content.includes("openGraph:"),
        `Missing openGraph metadata in ${relPath}`
      );
      assert.ok(
        content.includes("twitter:"),
        `Missing twitter metadata in ${relPath}`
      );
    }
  });

  test("9. All 253 calculators resolve valid professional disclaimers", () => {
    for (const calc of calculatorRegistry) {
      const disclaimer = getCalculatorDisclaimer({
        id: calc.id,
        category: calc.category,
        subcategory: calc.subcategory,
        name: calc.name,
        rulesSensitive: calc.rulesSensitive
      });

      assert.ok(disclaimer.body.length > 20, `Disclaimer body too short for ${calc.id}`);
      assert.ok(disclaimer.professional.length > 2, `Missing professional designation for ${calc.id}`);
    }
  });
});
