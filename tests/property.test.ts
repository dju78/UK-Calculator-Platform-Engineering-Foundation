import { test } from "node:test";
import assert from "node:assert";
import { calculateMortgageAffordability } from "../packages/calculation-engine/src/finance/property/core.js";

test("calculateMortgageAffordability (PRO-002)", async (t) => {
  await t.test("standard standard inputs", () => {
    // income: 100k, deposit: 50k, stress: 5%, term: 25, mult: 4.5, ratio: 0.3, debt: 0
    const res = calculateMortgageAffordability(100000, 50000, 0.05, 25, 4.5, 0.3, 0);
    assert.strictEqual(res.max_mortgage, 427650.11760226387); // derived from math
    assert.strictEqual(res.max_price, 427650.11760226387 + 50000);
    assert.strictEqual(res.monthly_payment_cap, 2500);
  });

  await t.test("capped by multiple", () => {
    // high payment ratio, low multiple
    const res = calculateMortgageAffordability(100000, 50000, 0.05, 25, 3.0, 0.5, 0);
    assert.strictEqual(res.max_mortgage, 300000); 
    assert.strictEqual(res.max_price, 350000);
  });

  await t.test("zero stress rate", () => {
    const res = calculateMortgageAffordability(100000, 50000, 0, 25, 4.5, 0.3, 0);
    assert.strictEqual(res.monthly_payment_cap, 2500);
    assert.strictEqual(res.max_mortgage, 450000); // multiple is 450k, cap by payment is 2500*300 = 750k. min is 450k
  });

  await t.test("high debt caps mortgage to zero", () => {
    const res = calculateMortgageAffordability(100000, 50000, 0.05, 25, 4.5, 0.3, 3000);
    assert.strictEqual(res.monthly_payment_cap, 0);
    assert.strictEqual(res.max_mortgage, 0);
    assert.strictEqual(res.max_price, 50000);
  });

  await t.test("negative inputs / extreme", () => {
    const res = calculateMortgageAffordability(-1000, 0, -0.05, 25, 4.5, 0.3, 0);
    assert.strictEqual(res.monthly_payment_cap, 0); // Math.max(0, cap)
    assert.strictEqual(res.max_mortgage, 0);
  });
});
