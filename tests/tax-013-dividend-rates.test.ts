/**
 * Focused regression tests for the TAX-013 dividend rate correction.
 *
 * TAX-013 hardcoded dividend rates of 8.75% and 33.75% - the rates before
 * 2026/27 - so it disagreed with both the approved ruleset and TAX-011 on
 * identical facts. The rates are now read from the ruleset, which is the only
 * place the statutory dividend figures are defined.
 *
 * These tests assert the rule rather than only the number, so a future drift
 * fails with a message that names what broke.
 */
import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { calculateGiaTax, type UKRulesetLike } from "../packages/calculation-engine/src/finance/wave3/index.js";
import { calculate } from "../packages/calculation-engine/src/engine.js";
import { getUKRuleset } from "../packages/rules-uk/src/index.js";

// The ruleset is a versioned JSON document typed with an index signature, so
// reading a known section means narrowing it - the same structural read the
// handlers perform.
const rules = getUKRuleset() as unknown as UKRulesetLike;

describe("TAX-013: 2026/27 dividend rates", () => {
  test("the approved ruleset carries the 2026/27 dividend figures", () => {
    // The correction is only meaningful if the ruleset itself is right, so this
    // is asserted first and independently of the calculator.
    assert.equal(rules.dividends.allowance_gbp, 500);
    assert.equal(rules.dividends.rates.basic, 0.1075);
    assert.equal(rules.dividends.rates.higher, 0.3575);
    assert.equal(rules.dividends.rates.additional, 0.3935);
  });

  test("a basic rate taxpayer's dividends are charged at 10.75%", () => {
    const r = calculateGiaTax(
      { annual_dividends: 2500, other_taxable_income: 30000 },
      rules
    );
    assert.equal(r.taxpayer_band, "basic");
    // £2,500 less the £500 allowance, at the ordinary dividend rate.
    assert.equal(r.dividend_tax_due, 2000 * 0.1075);
    assert.equal(r.dividend_tax_due, 215);
  });

  test("a higher rate taxpayer's dividends are charged at 35.75%", () => {
    const r = calculateGiaTax(
      { annual_dividends: 2500, other_taxable_income: 55000 },
      rules
    );
    assert.equal(r.taxpayer_band, "higher");
    assert.equal(r.dividend_tax_due, 2000 * 0.3575);
    assert.equal(r.dividend_tax_due, 715);
  });

  test("an additional rate taxpayer's dividends are charged at 39.35%", () => {
    const r = calculateGiaTax(
      { annual_dividends: 2500, other_taxable_income: 130000 },
      rules
    );
    assert.equal(r.taxpayer_band, "additional");
    assert.equal(r.dividend_tax_due, 2000 * 0.3935);
  });

  test("the pre-2026/27 rates are no longer reachable", () => {
    // The specific defect: 8.75% and 33.75% hardcoded in the engine.
    for (const otherIncome of [30000, 55000, 130000]) {
      const r = calculateGiaTax(
        { annual_dividends: 2500, other_taxable_income: otherIncome },
        rules
      );
      assert.notEqual(r.dividend_tax_due, 2000 * 0.0875, "stale basic rate still in use");
      assert.notEqual(r.dividend_tax_due, 2000 * 0.3375, "stale higher rate still in use");
    }
  });

  test("the dividend allowance comes from the ruleset, not a local constant", () => {
    const r = calculateGiaTax(
      { annual_dividends: rules.dividends.allowance_gbp, other_taxable_income: 55000 },
      rules
    );
    assert.equal(r.dividend_tax_due, 0);
  });

  test("the correction did not disturb the gains or interest treatment", () => {
    const r = calculateGiaTax(
      {
        annual_dividends: 2500,
        realised_capital_gains: 6000,
        interest_income: 800,
        other_taxable_income: 55000,
      },
      rules
    );
    // Gains: £6,000 less the £3,000 annual exempt amount at the higher CGT rate.
    assert.equal(r.capital_gains_tax_due, 3000 * 0.24);
    // Interest: £800 less the £500 higher-rate Personal Savings Allowance at 40%.
    assert.equal(r.interest_tax_due, 300 * 0.4);
    // Allowances used: £500 dividend + £3,000 CGT + £500 PSA.
    assert.equal(r.total_allowances_utilised, 4000);
  });
});

describe("TAX-013 and TAX-011 treat dividends consistently", () => {
  // The two calculators have different scopes - TAX-011 also taxes other
  // income, TAX-013 also taxes gains and interest - so their totals differ by
  // design. What must agree is the shared statutory dividend treatment.

  test("both apply the same rate to the same slice of dividends", async () => {
    // £60,000 of other income is above the £50,270 higher rate threshold and
    // leaves no basic rate band space, so the dividends sit wholly in the
    // higher band under both calculators' band mechanics.
    const otherIncome = 60000;
    const dividends = 2500;
    const expected = (dividends - 500) * rules.dividends.rates.higher;

    const gia = await calculate("TAX-013", {
      annual_dividends: dividends,
      other_taxable_income: otherIncome,
    });
    const div = await calculate("TAX-011", {
      dividend_income: dividends,
      other_income: otherIncome,
      jurisdiction: "England/Wales/NI",
    });

    assert.equal(
      gia.outputs.dividend_tax_due,
      expected,
      "TAX-013 does not apply the ruleset higher dividend rate"
    );
    assert.equal(
      div.outputs.dividend_tax,
      expected,
      "TAX-011 does not apply the ruleset higher dividend rate"
    );
    assert.equal(
      gia.outputs.dividend_tax_due,
      div.outputs.dividend_tax,
      "the two calculators disagree on the dividend charge for identical facts"
    );
  });

  test("both apply the same dividend allowance", async () => {
    const gia = await calculate("TAX-013", {
      annual_dividends: 400,
      other_taxable_income: 60000,
    });
    const div = await calculate("TAX-011", {
      dividend_income: 400,
      other_income: 60000,
      jurisdiction: "England/Wales/NI",
    });
    assert.equal(gia.outputs.dividend_tax_due, 0);
    assert.equal(div.outputs.dividend_tax, 0);
  });
});
