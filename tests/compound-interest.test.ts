import test from "node:test";
import assert from "node:assert/strict";
import { calculate, CalculationValidationError } from "../packages/calculation-engine/src/index.js";
import { wave1Benchmarks } from "../packages/test-fixtures/src.js";

const moneyTolerance = 0.011;

for (const fixture of wave1Benchmarks["INV-002"]) {
  test(`INV-002 benchmark: ${fixture.scenario}`, async () => {
    const result = await calculate("INV-002", fixture.inputs, { now: new Date("2026-08-22T08:00:00Z") });
    assert.ok(Math.abs(Number(result.outputs.fv) - Number(fixture.expected.fv)) <= moneyTolerance,
      `expected ${fixture.expected.fv}, got ${result.outputs.fv}`);
  });
}

test("INV-002 returns required reproducibility metadata", async () => {
  const result = await calculate("INV-002", {P:10000, nominal_rate:0.05, m:12, years:10}, {now:new Date("2026-08-22T08:00:00Z")});
  assert.equal(result.calculatorId, "INV-002");
  assert.equal(result.calculatorVersion, "1.0");
  assert.equal(result.engineVersion, "0.1.0");
  assert.equal(result.rulesetId, null);
  assert.equal(result.calculatedAt, "2026-08-22T08:00:00.000Z");
});

test("INV-002 rejects invalid compounding frequency", async () => {
  await assert.rejects(async () => {
    await calculate("INV-002", {P:1000, nominal_rate:0.05, m:0, years:10});
  }, CalculationValidationError);
});
