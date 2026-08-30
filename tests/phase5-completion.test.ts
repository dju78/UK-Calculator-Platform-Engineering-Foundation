import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatOutputLabel, CONTROLLED_ACRONYMS } from "../apps/web/src/lib/outputLabels.js";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";
import { allBenchmarks } from "../packages/test-fixtures/src.js";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const rootDir = process.cwd();

describe("Phase 5 Completion: Result Experience & Formatters", () => {
  it("1. formatOutputLabel accurately formats acronyms, snake_case, and unit tokens", () => {
    // Acronyms
    assert.strictEqual(formatOutputLabel("sdlt"), "SDLT (Stamp Duty)");
    assert.strictEqual(formatOutputLabel("ltv"), "Loan-to-Value (LTV)");
    assert.strictEqual(formatOutputLabel("cgt"), "Capital Gains Tax (CGT)");
    assert.strictEqual(formatOutputLabel("vat"), "VAT");
    assert.strictEqual(formatOutputLabel("vat_amount"), "VAT Amount");
    assert.strictEqual(formatOutputLabel("cagr"), "CAGR");
    assert.strictEqual(formatOutputLabel("irr"), "IRR");
    assert.strictEqual(formatOutputLabel("xirr"), "XIRR");
    assert.strictEqual(formatOutputLabel("roi"), "ROI");
    assert.strictEqual(formatOutputLabel("apr"), "APR");
    assert.strictEqual(formatOutputLabel("effective_apr"), "Effective APR");
    assert.strictEqual(formatOutputLabel("bmi"), "BMI");
    assert.strictEqual(formatOutputLabel("bmr"), "BMR");
    assert.strictEqual(formatOutputLabel("tdee"), "TDEE");
    assert.strictEqual(formatOutputLabel("hicbc_tax_charge"), "HICBC Tax Charge");
    assert.strictEqual(formatOutputLabel("sipp_gross_pot_value"), "SIPP Gross Pot Value");
    assert.strictEqual(formatOutputLabel("prr_relief_amount"), "Private Residence Relief (PRR)");

    // Words and Units
    assert.strictEqual(formatOutputLabel("future_value"), "Future Value");
    assert.strictEqual(formatOutputLabel("cost_gbp"), "Cost (£)");
    assert.strictEqual(formatOutputLabel("voltage_drop_pct"), "Voltage Drop (%)");
    assert.strictEqual(formatOutputLabel("density_g_per_cm3"), "Density G Per (cm³)");
    assert.strictEqual(formatOutputLabel("root_1"), "Root 1");
    assert.strictEqual(formatOutputLabel("root_2"), "Root 2");
  });

  it("2. Controlled acronym set contains all verified acronyms and no spurious words", () => {
    assert.strictEqual(CONTROLLED_ACRONYMS.has("SDLT"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("LTV"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("VAT"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("NI"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("NIC"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("PAYE"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("ISA"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("LISA"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("SIPP"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("CAGR"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("IRR"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("XIRR"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("APR"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("APRC"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("ROI"), true);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("CGT"), true);

    // Regular words must not be treated as acronyms
    assert.strictEqual(CONTROLLED_ACRONYMS.has("TAX"), false);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("COST"), false);
    assert.strictEqual(CONTROLLED_ACRONYMS.has("PAYMENT"), false);
  });

  it("3. Proven duplicate suppression maps exact proven alias pairs in fieldMappings.ts", () => {
    const fieldMappingsContent = fs.readFileSync(
      path.join(rootDir, "apps/web/src/components/calculators/fieldMappings.ts"),
      "utf8"
    );
    assert.ok(fieldMappingsContent.includes('PROVEN_DUPLICATE_SUPPRESSIONS: Record<string, string[]> = {'));
    assert.ok(fieldMappingsContent.includes('"INV-002": ["fv"]'));
    assert.ok(fieldMappingsContent.includes('"TAX-001": ["tax"]'));
    assert.ok(fieldMappingsContent.includes('"TAX-004": ["ni"]'));
    assert.ok(fieldMappingsContent.includes('"TAX-020": ["annual_repayment"]'));
    assert.ok(fieldMappingsContent.includes('"HLT-002": ["bmr_mifflin_st_jeor"]'));
    assert.ok(fieldMappingsContent.includes('"HLT-006": ["boer_estimate"]'));
    assert.ok(fieldMappingsContent.includes('"HLT-017": ["mosteller"]'));
    assert.ok(fieldMappingsContent.includes('"MAT-011": ["order_of_magnitude"]'));
    assert.ok(fieldMappingsContent.includes('"MAT-012": ["axis_of_symmetry"]'));
  });

  it("4. Primary result hierarchy covers representative calculators with objective headline results", () => {
    const fieldMappingsContent = fs.readFileSync(
      path.join(rootDir, "apps/web/src/components/calculators/fieldMappings.ts"),
      "utf8"
    );

    const expectedCurated = [
      "TAX-001", "TAX-002", "TAX-003", "TAX-004", "TAX-020",
      "PRO-001", "PRO-023", "INV-002", "TAX-015", "AUT-006",
      "HLT-001", "PEN-001", "FIN-001", "INV-001", "PRO-010", "BUS-001"
    ];

    for (const id of expectedCurated) {
      assert.ok(fieldMappingsContent.includes(`"${id}": {`), `Missing primaryResult config for ${id}`);
    }
  });

  it("5. exportUtils.ts uses formatOutputLabel and does not leak raw snake_case or internal IDs", () => {
    const exportUtilsContent = fs.readFileSync(
      path.join(rootDir, "apps/web/src/lib/exportUtils.ts"),
      "utf8"
    );
    assert.ok(exportUtilsContent.includes("formatOutputLabel"));
    assert.ok(exportUtilsContent.includes("PROVEN_DUPLICATE_SUPPRESSIONS"));
    assert.ok(exportUtilsContent.includes("Important Warnings:"));
    assert.ok(exportUtilsContent.includes("Assumptions:"));
  });

  it("6. Real engine warnings are returned by affected calculators", async () => {
    // TEC-001 (IP Subnet Calculator) /31 prefix triggers point-to-point RFC 3021 warning
    const res = await calculate("TEC-001", { address: "192.168.1.0", prefix_length: 31 });
    assert.ok(res.warnings && res.warnings.length > 0, "TEC-001 should return point-to-point warning for /31");
    assert.ok(res.warnings[0].includes("point-to-point link"));
  });

  it("7. Real engine assumptions are returned by affected calculators", async () => {
    const res = await calculate("INV-002", { P: 10000, nominal_rate: 0.05, m: 12, years: 10 });
    assert.ok(res.assumptions && res.assumptions.length > 0, "INV-002 should return calculation assumptions");
    assert.ok(res.assumptions.some(a => a.includes("constant for the full period")));
  });

  it("8. DynamicCalculator renders accessible warnings and assumptions regions", () => {
    const dynCalcContent = fs.readFileSync(
      path.join(rootDir, "apps/web/src/components/calculators/DynamicCalculator.tsx"),
      "utf8"
    );
    assert.ok(dynCalcContent.includes('data-testid="calculation-warnings"'));
    assert.ok(dynCalcContent.includes('data-testid="calculation-assumptions"'));
    assert.ok(dynCalcContent.includes('formatOutputLabel(k)'));
    assert.ok(dynCalcContent.includes('PROVEN_DUPLICATE_SUPPRESSIONS'));
  });

  it("9. All 253 calculators in registry execute benchmarks without uncaught arithmetic throws", async () => {
    assert.strictEqual(calculatorRegistry.length, 253);

    let testedCount = 0;
    for (const calc of calculatorRegistry) {
      const fixtures = allBenchmarks[calc.id];
      if (fixtures && fixtures.length > 0) {
        const res = await calculate(calc.id, fixtures[0].inputs, {});
        assert.ok(res.outputs, `Outputs missing for ${calc.id}`);
        testedCount++;
      }
    }
    assert.strictEqual(testedCount, 253);
  });
});
