import { test } from "node:test";
import assert from "node:assert";
import {
  calculatePensionGrowth,
  calculateSippGrowth,
  calculateWorkplacePension,
  calculateRetirement
} from "../packages/calculation-engine/src/finance/pension/core.js";

test("calculatePensionGrowth (PEN-001)", async (t) => {
  await t.test("standard", () => {
    const res = calculatePensionGrowth(10000, 200, 100, 0.05, 0.01, 10, 60000);
    assert.strictEqual(Math.round(res.projected_pot), 58629);
    assert.strictEqual(res.annual_contributions, 3600);
    assert.strictEqual(res.standard_allowance_warning, false);
  });
  await t.test("exceeds allowance", () => {
    const res = calculatePensionGrowth(0, 5000, 1000, 0.05, 0.01, 10, 60000);
    assert.strictEqual(res.annual_contributions, 72000);
    assert.strictEqual(res.standard_allowance_warning, true);
  });
});

test("calculateSippGrowth (PEN-002)", async (t) => {
  await t.test("standard", () => {
    const res = calculateSippGrowth(0, 800, 0.4, 0.05, 0.01, 10, 60000, 0.2);
    assert.strictEqual(res.gross_monthly, 1000);
    assert.strictEqual(res.provider_relief_monthly, 200);
    assert.strictEqual(res.potential_extra_relief_monthly, 200);
    assert.strictEqual(res.allowance_warning, false);
    assert.strictEqual(Math.round(res.projected_value), 146324);
  });
});

test("calculateWorkplacePension (PEN-003)", async (t) => {
  await t.test("standard", () => {
    const res = calculateWorkplacePension(30000, 0.03, 0.05, 0, 0.05, 10, 6240, 50270);
    assert.strictEqual(res.qualifying_earnings, 23760);
    assert.strictEqual(res.employer_annual, 712.8);
    assert.strictEqual(res.employee_annual, 1188);
  });
  await t.test("below threshold", () => {
    const res = calculateWorkplacePension(5000, 0.03, 0.05, 0, 0.05, 10, 6240, 50270);
    assert.strictEqual(res.qualifying_earnings, 0);
    assert.strictEqual(res.employer_annual, 0);
    assert.strictEqual(res.employee_annual, 0);
  });
  await t.test("above upper limit", () => {
    const res = calculateWorkplacePension(100000, 0.03, 0.05, 0, 0.05, 10, 6240, 50270);
    assert.strictEqual(res.qualifying_earnings, 50270 - 6240);
  });
});

test("calculateRetirement (PEN-006)", async (t) => {
  await t.test("standard", () => {
    const res = calculateRetirement(30, 65, 50000, 500, 0.05, 0.02, 30000, 0.04);
    assert.ok(res.projected_pot > 0);
    assert.ok(res.future_target_income > 30000);
    assert.ok(res.required_pot > 0);
    assert.ok(typeof res.gap === "number");
    assert.ok(res.funding_ratio > 0);
  });
});
