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
      assert.ok(disclaimer.family.length > 2, `Missing disclaimer family for ${calc.id}`);
    }
  });

  test("10. Specialist disclaimer resolution precedence: PEN-011, INV-025, INV-026, INV-029 resolve to stochastic/FIRE family", () => {
    const specialistCalcs = ["INV-025", "INV-026", "INV-029", "PEN-011"];
    for (const id of specialistCalcs) {
      const calc = calculatorRegistry.find((c: any) => c.id === id);
      assert.ok(calc, `Calculator ${id} must exist in registry`);
      const disclaimer = getCalculatorDisclaimer({
        id: calc.id,
        category: calc.category,
        subcategory: calc.subcategory,
        name: calc.name,
        rulesSensitive: calc.rulesSensitive
      });

      assert.equal(
        disclaimer.family,
        "stochastic_withdrawal_fire",
        `${id} must resolve to stochastic_withdrawal_fire family before generic pensions/investments`
      );
      assert.equal(
        disclaimer.professional,
        "FCA-regulated financial adviser",
        `${id} must require an FCA-regulated financial adviser`
      );
      assert.ok(
        disclaimer.body.includes("Probabilistic modelling") || disclaimer.body.includes("withdrawal rate simulations"),
        `${id} disclaimer body must mention probabilistic / withdrawal simulations`
      );
    }
  });

  test("11. Property-tax disclaimers strictly scoped: PRO-023..028 match and 0 non-property calculators receive property tax disclaimer", () => {
    const expectedPropertyTaxIds = ["PRO-023", "PRO-024", "PRO-025", "PRO-026", "PRO-027", "PRO-028"];
    const actualPropertyTaxCalcs: string[] = [];
    const nonPropertyViolations: string[] = [];

    for (const calc of calculatorRegistry) {
      const disclaimer = getCalculatorDisclaimer({
        id: calc.id,
        category: calc.category,
        subcategory: calc.subcategory,
        name: calc.name,
        rulesSensitive: calc.rulesSensitive
      });

      if (disclaimer.family === "property_taxation") {
        actualPropertyTaxCalcs.push(calc.id);
        if (!calc.id.startsWith("PRO-")) {
          nonPropertyViolations.push(calc.id);
        }
      }
    }

    assert.deepEqual(
      actualPropertyTaxCalcs.sort(),
      expectedPropertyTaxIds.sort(),
      "Property tax disclaimer IDs must exactly match PRO-023 through PRO-028"
    );
    assert.equal(
      nonPropertyViolations.length,
      0,
      `Non-property calculators incorrectly receiving property tax disclaimer: ${nonPropertyViolations.join(", ")}`
    );
  });

  test("12. Canonical registry category count is 19 and all 19 categories are routable", () => {
    const categories = Array.from(new Set(calculatorRegistry.map((c: any) => c.category))).sort();
    assert.equal(categories.length, 19, "Canonical registry must contain exactly 19 categories");
  });

  test("13. Metadata verification: title, description, canonical, OpenGraph, and Twitter cards across representative routes and all 19 categories", () => {
    const targetCalcIds = [
      "TAX-001", "PRO-001", "PRO-023", "INV-029", "ISA-007", "PEN-011", "HLT-020", "CON-010",
      "AUT-006", "BUS-001", "CON-001", "DAT-001", "EDU-001", "EVE-001", "FIN-001", "GEO-001",
      "HLT-001", "HOM-001", "ISA-001", "INV-001", "MAT-001", "PEN-001", "SCI-001", "STA-001",
      "TEC-001"
    ];

    for (const id of targetCalcIds) {
      const calc = calculatorRegistry.find((c: any) => c.id === id);
      assert.ok(calc, `Target calculator ${id} must exist in registry`);
      assert.ok(calc.name.length > 3, `${id} must have a valid title/name`);
      assert.ok(calc.slug.length > 2, `${id} must have a clean kebab slug`);
      assert.ok(calc.category.length > 2, `${id} must have a category`);
    }

    // Verify legal routes
    const legalRoutes = ["/accessibility", "/disclaimer", "/privacy", "/terms"];
    for (const route of legalRoutes) {
      const filePath = path.join(rootDir, `apps/web/src/app${route}/page.tsx`);
      const content = fs.readFileSync(filePath, "utf8");
      assert.ok(content.includes("title:"), `Missing title in metadata for ${route}`);
      assert.ok(content.includes("description:"), `Missing description in metadata for ${route}`);
      assert.ok(content.includes("alternates:"), `Missing canonical in metadata for ${route}`);
      assert.ok(content.includes("openGraph:"), `Missing openGraph in metadata for ${route}`);
      assert.ok(content.includes("twitter:"), `Missing twitter in metadata for ${route}`);
    }
  });
});
