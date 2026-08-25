import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";
import {
  normalCDF, inverseNormalCDF, getZScoreForConfidence,
  inverseTCDF, inverseChiSquareCDF, inverseFCDF, tCDF, chiSquareCDF, fCDF
} from "../packages/calculation-engine/src/statistics/distributions.js";
import { combinations, permutations, factorial } from "../packages/calculation-engine/src/statistics/special.js";

const CTX = { taxYear: "2026/27" };
const closeTo = (a: number, e: number, tol = 0.011) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// Distribution accuracy, checked against published statistical tables
// ---------------------------------------------------------------------------

/**
 * Published critical values are a genuinely independent source: they were
 * computed by other people, by other methods, long before this engine existed.
 * The previous implementation used the Abramowitz & Stegun 26.2.23 rational
 * approximation, whose error of about 4.5e-4 in z passed a penny tolerance
 * while getting the fourth decimal place of a confidence interval wrong.
 */
test("distributions reproduce published critical values", async (t: any) => {
  const cases: Array<[string, number, number]> = [
    ["z at 90% confidence", getZScoreForConfidence(0.90), 1.644854],
    ["z at 95% confidence", getZScoreForConfidence(0.95), 1.959964],
    ["z at 99% confidence", getZScoreForConfidence(0.99), 2.575829],
    ["z at 99.9% confidence", getZScoreForConfidence(0.999), 3.290527],
    ["normal CDF at 1.96", normalCDF(1.96), 0.9750021],
    ["normal CDF at -2.58", normalCDF(-2.58), 0.0049400],
    ["inverse normal at 0.975", inverseNormalCDF(0.975), 1.959964],
    ["t at 0.975 with 1 df", inverseTCDF(0.975, 1), 12.70620],
    ["t at 0.975 with 10 df", inverseTCDF(0.975, 10), 2.228139],
    ["t at 0.975 with 30 df", inverseTCDF(0.975, 30), 2.042272],
    ["t at 0.95 with 20 df", inverseTCDF(0.95, 20), 1.724718],
    ["t at 0.995 with 1 df", inverseTCDF(0.995, 1), 63.65674],
    ["t CDF at 2.228 with 10 df", tCDF(2.228139, 10), 0.975],
    ["chi-square at 0.95 with 1 df", inverseChiSquareCDF(0.95, 1), 3.841459],
    ["chi-square at 0.95 with 10 df", inverseChiSquareCDF(0.95, 10), 18.30704],
    ["chi-square at 0.99 with 1 df", inverseChiSquareCDF(0.99, 1), 6.634897],
    ["chi-square CDF at 18.307 with 10 df", chiSquareCDF(18.30704, 10), 0.95],
    ["F at 0.95 with 3 and 12 df", inverseFCDF(0.95, 3, 12), 3.490295],
    ["F at 0.99 with 5 and 10 df", inverseFCDF(0.99, 5, 10), 5.636326],
    ["F at 0.95 with 1 and 1 df", inverseFCDF(0.95, 1, 1), 161.4476],
    ["F CDF at 3.4903 with 3 and 12 df", fCDF(3.490295, 3, 12), 0.95]
  ];
  for (const [name, actual, published] of cases) {
    await t.test(name, () => {
      // Published tables carry seven significant figures; the engine must
      // agree with them to the precision the table itself states.
      const tolerance = Math.max(Math.abs(published) * 1e-6, 1e-7);
      assert.ok(
        Math.abs(actual - published) <= tolerance,
        `Expected ${actual} to match the published ${published} within ${tolerance}`
      );
    });
  }
});

test("the inverse normal is a true inverse of the CDF", async () => {
  for (const p of [0.001, 0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 0.999]) {
    const z = inverseNormalCDF(p);
    assert.ok(
      Math.abs(normalCDF(z) - p) < 1e-12,
      `Round trip failed at p=${p}: got ${normalCDF(z)}`
    );
  }
});

test("counting functions are exact", () => {
  assert.strictEqual(combinations(52, 5), 2598960);   // poker hands
  assert.strictEqual(combinations(49, 6), 13983816);  // lottery draws
  assert.strictEqual(combinations(10, 0), 1);
  assert.strictEqual(combinations(10, 10), 1);
  assert.strictEqual(combinations(5, 7), 0);
  assert.strictEqual(permutations(10, 3), 720);
  assert.strictEqual(permutations(5, 5), 120);
  assert.strictEqual(factorial(0), 1);
  assert.strictEqual(factorial(10), 3628800);
  assert.throws(() => factorial(-1), /whole numbers of 0 or more/);
  assert.throws(() => factorial(200), /too large/);
});

// ---------------------------------------------------------------------------
// BUS-002: markup and margin are different numbers
// ---------------------------------------------------------------------------

test("BUS-002 never confuses markup with margin", async () => {
  const { outputs } = await calculate("BUS-002", { cost: 100, price: 150, markup_percentage: "" }, CTX);
  // A 50% markup is a 33.3% margin. Returning one as the other is the most
  // common pricing error there is.
  closeTo(outputs.markup as number, 0.5, 1e-8);
  closeTo(outputs.margin as number, 1 / 3, 1e-6);
  assert.notStrictEqual(outputs.markup, outputs.margin);
});

test("BUS-002 needs either a price or a markup", async () => {
  await assert.rejects(
    () => calculate("BUS-002", { cost: 100, price: "", markup_percentage: "" }, CTX),
    (err: Error) => /either a selling price or a markup percentage/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// BUS-003 / 004 / 005: one computation, three views
// ---------------------------------------------------------------------------

test("the three profit calculators never disagree on the same facts", async () => {
  const full = {
    revenue: 400000, cost_of_goods_sold: 180000, operating_expenses: 120000,
    other_income: 15000, interest_and_other_costs: 25000, tax_rate: 25
  };
  const bus003 = await calculate("BUS-003", full, CTX);
  const bus005 = await calculate("BUS-005", full, CTX);
  const bus004 = await calculate("BUS-004", { revenue: full.revenue, cost_of_goods_sold: full.cost_of_goods_sold }, CTX);

  for (const key of ["gross_profit", "gross_margin", "operating_profit", "net_profit", "tax"]) {
    assert.strictEqual(bus005.outputs[key], bus003.outputs[key], `${key} differs between BUS-003 and BUS-005`);
  }
  assert.strictEqual(bus004.outputs.gross_profit, bus003.outputs.gross_profit);
});

test("a loss attracts no tax", async () => {
  const { outputs, warnings } = await calculate(
    "BUS-005",
    {
      revenue: 120000, cost_of_goods_sold: 90000, operating_expenses: 60000,
      other_income: 0, interest_and_other_costs: 2000, tax_rate: 19
    },
    CTX
  );
  assert.ok((outputs.profit_before_tax as number) < 0);
  assert.strictEqual(outputs.tax, 0);
  assert.ok(warnings.some((w: string) => /loss/i.test(w)));
});

// ---------------------------------------------------------------------------
// BUS-007: the threshold is not decorative
// ---------------------------------------------------------------------------

test("BUS-007 pays commission only above the threshold", async () => {
  const withoutThreshold = await calculate("BUS-007", {
    sales: 100000, commission_rate: 5, threshold: 0, target: 0, accelerator_rate: 0, base_salary: 25000
  }, CTX);
  const withThreshold = await calculate("BUS-007", {
    sales: 100000, commission_rate: 5, threshold: 40000, target: 0, accelerator_rate: 0, base_salary: 25000
  }, CTX);
  closeTo(withoutThreshold.outputs.total_commission as number, 5000);
  closeTo(withThreshold.outputs.total_commission as number, 3000);
});

test("BUS-007 applies the accelerator only above target", async () => {
  const { outputs } = await calculate("BUS-007", {
    sales: 150000, commission_rate: 4, threshold: 20000,
    target: 120000, accelerator_rate: 8, base_salary: 30000
  }, CTX);
  // £20,000 to £120,000 at 4% = £4,000; £120,000 to £150,000 at 8% = £2,400.
  closeTo(outputs.base_commission as number, 4000);
  closeTo(outputs.accelerator_commission as number, 2400);
  closeTo(outputs.total_commission as number, 6400);
});

test("BUS-007 rejects a target below the threshold", async () => {
  await assert.rejects(
    () => calculate("BUS-007", {
      sales: 100000, commission_rate: 5, threshold: 50000,
      target: 20000, accelerator_rate: 8, base_salary: 0
    }, CTX),
    (err: Error) => /cannot be below the commission threshold/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// BUS-009: depreciation cannot run below the residual value
// ---------------------------------------------------------------------------

test("BUS-009 never depreciates below the residual value", async (t: any) => {
  for (const method of ["straight_line", "reducing_balance", "sum_of_years_digits"]) {
    await t.test(method, async () => {
      const { outputs, schedule } = await calculate(
        "BUS-009",
        {
          cost: 10000, residual_value: 4000, useful_life_years: 10, method,
          reducing_balance_rate: 40, total_units: 0, units_per_year: "[]"
        },
        CTX
      );
      assert.ok(
        (outputs.closing_book_value as number) >= 4000 - 1e-6,
        `${method} left a book value of ${outputs.closing_book_value}, below the residual value`
      );
      for (const row of schedule as any[]) {
        assert.ok(row.closing_value >= 4000 - 1e-6, `Year ${row.year} fell below the residual value`);
        assert.ok(row.depreciation >= 0, `Year ${row.year} had a negative charge`);
      }
    });
  }
});

test("BUS-009 rejects a residual value above cost", async () => {
  await assert.rejects(
    () => calculate("BUS-009", {
      cost: 5000, residual_value: 8000, useful_life_years: 5, method: "straight_line",
      reducing_balance_rate: 25, total_units: 0, units_per_year: "[]"
    }, CTX),
    (err: Error) => /cannot exceed the cost/.test(err.message)
  );
});

test("BUS-009 states that depreciation is not a capital allowance", async () => {
  const { outputs } = await calculate("BUS-009", {
    cost: 25000, residual_value: 5000, useful_life_years: 5, method: "straight_line",
    reducing_balance_rate: 25, total_units: 0, units_per_year: "[]"
  }, CTX);
  assert.match(String(outputs.basis), /capital allowances/i);
});

// ---------------------------------------------------------------------------
// BUS-010: a profitable year can still run out of cash
// ---------------------------------------------------------------------------

test("BUS-010 surfaces a mid-year cash trough behind a healthy year end", async () => {
  const { outputs, warnings } = await calculate(
    "BUS-010",
    {
      opening_balance: 10000,
      inflows: "[10000, 10000, 10000, 10000, 10000, 10000, 35000, 35000, 35000, 35000, 35000, 35000]",
      outflows: "[20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000]"
    },
    CTX
  );
  // £30,000 up over the year, yet £50,000 overdrawn in month six. The year-end
  // figure alone would have said nothing about that.
  closeTo(outputs.net_cash_flow as number, 30000);
  closeTo(outputs.closing_balance as number, 40000);
  closeTo(outputs.lowest_balance as number, -50000);
  assert.strictEqual(outputs.lowest_balance_period, 6);
  assert.ok((outputs.closing_balance as number) > 0);
  assert.ok((outputs.lowest_balance as number) < 0);
  assert.ok((outputs.periods_negative as number) > 0);
  assert.ok(warnings.some((w: string) => /run out of money in the middle/i.test(w)));
});

test("BUS-010 rejects mismatched period counts", async () => {
  await assert.rejects(
    () => calculate("BUS-010", { opening_balance: 0, inflows: "[1,2,3]", outflows: "[1,2]" }, CTX),
    (err: Error) => /same number of periods/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// BUS-011: pricing from margin, and what a discount really costs
// ---------------------------------------------------------------------------

test("BUS-011 prices from margin, not markup", async () => {
  const { outputs } = await calculate("BUS-011", {
    unit_cost: 70, target_margin: 30, vat_registered: true, discount: 0, fixed_costs: 0
  }, CTX);
  // 70 / 0.7 = 100, and the margin is then genuinely 30%. Using 70 x 1.3 = 91
  // would give a margin of 23%, missing the target badly.
  closeTo(outputs.price_excluding_vat as number, 100);
  closeTo(outputs.price_including_vat as number, 120);
});

test("BUS-011 shows that a discount comes off profit, not off the margin", async () => {
  const { outputs } = await calculate("BUS-011", {
    unit_cost: 70, target_margin: 30, vat_registered: true, discount: 20, fixed_costs: 0
  }, CTX);
  // Price £100 discounted to £80 on a £70 cost leaves £10 of profit on £80,
  // which is 12.5% - not the 10% a subtract-the-discount reading suggests.
  closeTo(outputs.price_after_discount_excluding_vat as number, 80);
  closeTo(outputs.margin_after_discount as number, 0.125, 1e-8);
});

test("BUS-011 refuses an impossible margin", async () => {
  await assert.rejects(
    () => calculate("BUS-011", {
      unit_cost: 70, target_margin: 100, vat_registered: true, discount: 0, fixed_costs: 0
    }, CTX),
    (err: Error) => /price would have to be infinite/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// BUS-012: timing changes the verdict
// ---------------------------------------------------------------------------

test("BUS-012 shows where simple ROI and net present value disagree", async () => {
  const { outputs } = await calculate("BUS-012", {
    initial_investment: 100000,
    annual_benefits: "[5000, 10000, 30000, 60000, 90000]",
    annual_costs: "[0, 0, 0, 0, 0]",
    discount_rate: 10
  }, CTX);
  // Undiscounted, the project returns 95% on the investment. Discounted at
  // 10%, most of that is eaten by waiting five years for it.
  assert.ok((outputs.simple_roi as number) > 0.9);
  assert.ok((outputs.net_present_value as number) < (outputs.net_benefit as number));
  assert.ok((outputs.discounted_payback_years as number) > (outputs.simple_payback_years as number));
});

test("BUS-012 reports no internal rate of return where none exists", async () => {
  // Every cash flow negative: the net present value never crosses zero, so
  // there is no rate to find and none must be invented.
  const { outputs } = await calculate("BUS-012", {
    initial_investment: 100000,
    annual_benefits: "[1000, 1000, 1000]",
    annual_costs: "[2000, 2000, 2000]",
    discount_rate: 8
  }, CTX);
  assert.strictEqual(outputs.internal_rate_of_return, null);
});

test("BUS-012 rejects mismatched year counts", async () => {
  await assert.rejects(
    () => calculate("BUS-012", {
      initial_investment: 1000, annual_benefits: "[1,2,3]", annual_costs: "[1,2]", discount_rate: 5
    }, CTX),
    (err: Error) => /same number of years/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the business tranche
// ---------------------------------------------------------------------------

test("no business calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["BUS-002", { cost: 1, price: 0, markup_percentage: "" }],
    ["BUS-003", { revenue: 0, cost_of_goods_sold: 0, operating_expenses: 0, other_income: 0, interest_and_other_costs: 0, tax_rate: 0 }],
    ["BUS-004", { revenue: 0, cost_of_goods_sold: 0 }],
    ["BUS-005", { revenue: 0, cost_of_goods_sold: 0, operating_expenses: 0, other_income: 0, interest_and_other_costs: 0, tax_rate: 0 }],
    ["BUS-007", { sales: 0, commission_rate: 0, threshold: 0, target: 0, accelerator_rate: 0, base_salary: 0 }],
    ["BUS-009", { cost: 0, residual_value: 0, useful_life_years: 1, method: "straight_line", reducing_balance_rate: 0, total_units: 0, units_per_year: "[]" }],
    ["BUS-010", { opening_balance: 0, inflows: "[0]", outflows: "[0]" }],
    ["BUS-011", { unit_cost: 0, target_margin: 0, vat_registered: false, discount: 0, fixed_costs: 0 }],
    ["BUS-012", { initial_investment: 1, annual_benefits: "[0]", annual_costs: "[0]", discount_rate: 0 }]
  ];
  for (const [id, inputs] of cases) {
    await t.test(`${id} with every input at zero`, async () => {
      const { outputs } = await calculate(id, inputs, CTX);
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === "number") {
          assert.ok(Number.isFinite(value), `${id}.${key} is ${value}`);
        }
        assert.notStrictEqual(String(value), "[object Object]", `${id}.${key} rendered as an object`);
        assert.notStrictEqual(String(value), "undefined", `${id}.${key} is undefined`);
      }
    });
  }
});
