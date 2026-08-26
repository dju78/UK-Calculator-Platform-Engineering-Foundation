/**
 * Focused regression tests for the TAX-019 Child Benefit rate correction.
 *
 * TAX-019 hardcoded weekly Child Benefit of £25.60 and £16.95, which are the
 * preceding year's rates, so both the benefit received and the resulting charge
 * were understated. GOV.UK publishes £27.05 for the eldest or only child and
 * £17.90 for each additional child.
 *
 * The correction covers the weekly rates only. The threshold, the taper and the
 * adjusted net income mechanics were confirmed correct and are asserted here so
 * that any disturbance to them fails loudly.
 */
import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { calculateHicbc } from "../packages/calculation-engine/src/finance/wave3/index.js";

/** Weekly Child Benefit, confirmed against GOV.UK on 25 August 2026. */
const ELDEST_WEEKLY = 27.05;
const ADDITIONAL_WEEKLY = 17.90;

/** The engine annualises on a 52-week basis and rounds to the penny. */
function annual(children: number): number {
  const weekly = ELDEST_WEEKLY + Math.max(0, children - 1) * ADDITIONAL_WEEKLY;
  return Math.round(weekly * 52 * 100) / 100;
}

describe("TAX-019: 2026/27 Child Benefit weekly rates", () => {
  test("one child receives the eldest-child rate", () => {
    const r = calculateHicbc({ gross_salary: 50000, children_count: 1 });
    assert.equal(r.total_child_benefit_received, annual(1));
    assert.equal(r.total_child_benefit_received, 1406.6);
  });

  test("two children add one additional-child rate", () => {
    const r = calculateHicbc({ gross_salary: 50000, children_count: 2 });
    assert.equal(r.total_child_benefit_received, annual(2));
    assert.equal(r.total_child_benefit_received, 2337.4);
  });

  test("three children add two additional-child rates", () => {
    const r = calculateHicbc({ gross_salary: 50000, children_count: 3 });
    assert.equal(r.total_child_benefit_received, annual(3));
    assert.equal(r.total_child_benefit_received, 3268.2);
  });

  test("four children add three additional-child rates", () => {
    const r = calculateHicbc({ gross_salary: 50000, children_count: 4 });
    assert.equal(r.total_child_benefit_received, annual(4));
    assert.equal(r.total_child_benefit_received, 4199);
  });

  test("each additional child adds exactly one additional-child rate", () => {
    // Proves the per-child increment rather than four independent constants.
    for (let n = 2; n <= 6; n++) {
      const here = calculateHicbc({ gross_salary: 50000, children_count: n });
      const before = calculateHicbc({ gross_salary: 50000, children_count: n - 1 });
      const increment =
        Math.round((here.total_child_benefit_received - before.total_child_benefit_received) * 100) / 100;
      assert.equal(increment, Math.round(ADDITIONAL_WEEKLY * 52 * 100) / 100);
    }
  });

  test("the previous year's rates are no longer reachable", () => {
    // The specific defect: £25.60 and £16.95 hardcoded in the engine.
    const one = calculateHicbc({ gross_salary: 50000, children_count: 1 });
    const two = calculateHicbc({ gross_salary: 50000, children_count: 2 });
    assert.notEqual(one.total_child_benefit_received, 1331.2, "stale eldest-child rate still in use");
    assert.notEqual(two.total_child_benefit_received, 2212.6, "stale rates still in use");
  });

  test("annualisation stays on the calculator's existing 52-week basis", () => {
    // Asserted deliberately so that moving to a 52/53-week treatment has to be
    // a conscious decision recorded in a test, not a silent side effect.
    const r = calculateHicbc({ gross_salary: 50000, children_count: 1 });
    assert.equal(r.total_child_benefit_received, Math.round(ELDEST_WEEKLY * 52 * 100) / 100);
  });
});

describe("TAX-019: thresholds and taper are unchanged by the correction", () => {
  test("no charge at or below £60,000 of adjusted net income", () => {
    const r = calculateHicbc({ gross_salary: 60000, children_count: 2 });
    assert.equal(r.charge_percentage, 0);
    assert.equal(r.hicbc_tax_charge, 0);
    assert.equal(r.net_benefit_retained, r.total_child_benefit_received);
  });

  test("full clawback at or above £80,000", () => {
    const r = calculateHicbc({ gross_salary: 80000, children_count: 2 });
    assert.equal(r.charge_percentage, 100);
    assert.equal(r.hicbc_tax_charge, r.total_child_benefit_received);
    assert.equal(r.net_benefit_retained, 0);
  });

  test("the taper is 1% for every £200 above £60,000", () => {
    const r = calculateHicbc({ gross_salary: 66000, children_count: 2 });
    assert.equal(r.adjusted_net_income, 66000);
    assert.equal(r.charge_percentage, 30);
    assert.equal(r.hicbc_tax_charge, Math.round(annual(2) * 0.3 * 100) / 100);
    assert.equal(r.hicbc_tax_charge, 701.22);
  });

  test("gross pension contributions still reduce adjusted net income", () => {
    const r = calculateHicbc({
      gross_salary: 68000,
      other_taxable_income: 2000,
      pension_contributions_gross: 4000,
      children_count: 2,
    });
    assert.equal(r.adjusted_net_income, 66000);
    assert.equal(r.pension_top_up_needed_to_eliminate_charge, 6000);
  });

  test("Gift Aid is still grossed up before reducing adjusted net income", () => {
    const r = calculateHicbc({
      gross_salary: 70000,
      gift_aid_net: 800,
      children_count: 1,
    });
    // £800 net grosses up to £1,000, so adjusted net income falls to £69,000.
    assert.equal(r.adjusted_net_income, 69000);
  });
});
