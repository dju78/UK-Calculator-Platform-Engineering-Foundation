import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";

/**
 * Behavioural tests for Wave 2 tranche 2F, Pensions & Retirement.
 *
 * These assert properties the canonical benchmarks cannot: that a searched
 * value really solves the equation it claims to, that a threshold behaves as a
 * cliff rather than a slope, and that a legal limitation is stated rather than
 * assumed away.
 */

const CTX = { taxYear: "2026/27" };
const closeTo = (a: number, e: number, tol = 0.011) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// PEN-004: the contribution basis changes the answer
// ---------------------------------------------------------------------------

test("PEN-004 the contribution basis materially changes the contribution", async () => {
  const common = { annual_salary: 30000, employer_rate: 3, employee_rate: 5 };
  const band = await calculate("PEN-004", { ...common, contribution_basis: "qualifying_earnings" }, CTX);
  const total = await calculate("PEN-004", { ...common, contribution_basis: "total_pay" }, CTX);

  // Qualifying earnings on £30,000 are £30,000 - £6,240 = £23,760, not the
  // whole salary. Identical headline percentages therefore buy 26% more
  // pension on a total pay basis, which is exactly the comparison a member
  // needs and the one a salary-times-rate calculator hides.
  closeTo(band.outputs.pensionable_earnings as number, 23760);
  closeTo(total.outputs.pensionable_earnings as number, 30000);
  assert.ok((total.outputs.total_contribution as number) > (band.outputs.total_contribution as number));
  // Both still satisfy the statutory minimum, which is measured on the band.
  assert.strictEqual(band.outputs.meets_total_minimum, true);
  assert.strictEqual(total.outputs.meets_total_minimum, true);
});

test("PEN-004 detects an employer paying below the statutory minimum", async () => {
  const { outputs, warnings } = await calculate(
    "PEN-004",
    { annual_salary: 35000, contribution_basis: "qualifying_earnings", employer_rate: 2, employee_rate: 3 },
    CTX
  );
  assert.strictEqual(outputs.meets_employer_minimum, false);
  assert.strictEqual(outputs.meets_total_minimum, false);
  assert.ok(warnings.some((w: string) => /below the automatic enrolment minimum/i.test(w)));
});

test("PEN-004 caps qualifying earnings at the upper limit", async () => {
  const { outputs } = await calculate(
    "PEN-004",
    { annual_salary: 80000, contribution_basis: "qualifying_earnings", employer_rate: 3, employee_rate: 5 },
    CTX
  );
  // £50,270 - £6,240 = £44,030, regardless of the £80,000 salary.
  closeTo(outputs.pensionable_earnings as number, 44030);
});

// ---------------------------------------------------------------------------
// PEN-005: relief that is not automatic, and the two-limit taper
// ---------------------------------------------------------------------------

test("PEN-005 relief at source leaves higher-rate relief to be claimed", async () => {
  const { outputs } = await calculate(
    "PEN-005",
    {
      gross_income: 70000, personal_contribution: 4000, arrangement: "relief_at_source",
      employer_contribution: 0, flexibly_accessed: false, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  // £4,000 paid becomes £5,000 gross. Basic rate relief of £1,000 is added by
  // the provider; the further 20% on the same £5,000 is NOT automatic.
  closeTo(outputs.gross_contribution as number, 5000);
  closeTo(outputs.basic_rate_relief_added as number, 1000);
  closeTo(outputs.higher_rate_relief_claimable as number, 1000);
  assert.match(String(outputs.basis), /you have to claim it/i);
});

test("PEN-005 net pay and relief at source give the same total relief", async () => {
  // A higher-rate taxpayer ends up in the same place by either route once the
  // claim is made. The difference is whether they have to make it.
  const ras = await calculate("PEN-005", {
    gross_income: 70000, personal_contribution: 4000, arrangement: "relief_at_source",
    employer_contribution: 0, flexibly_accessed: false, jurisdiction: "England/Wales/NI"
  }, CTX);
  const netPay = await calculate("PEN-005", {
    gross_income: 70000, personal_contribution: 5000, arrangement: "net_pay",
    employer_contribution: 0, flexibly_accessed: false, jurisdiction: "England/Wales/NI"
  }, CTX);
  closeTo(ras.outputs.gross_contribution as number, netPay.outputs.gross_contribution as number);
  closeTo(ras.outputs.total_tax_relief as number, netPay.outputs.total_tax_relief as number);
  assert.strictEqual(netPay.outputs.higher_rate_relief_claimable, 0);
});

test("PEN-005 does not taper when threshold income is below its limit", async () => {
  // Adjusted income of £270,000 is above its limit, but threshold income of
  // £190,000 is not, so the full allowance survives. Testing only adjusted
  // income is the usual implementation error.
  const { outputs } = await calculate(
    "PEN-005",
    {
      gross_income: 190000, personal_contribution: 0, arrangement: "net_pay",
      employer_contribution: 80000, flexibly_accessed: false, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  closeTo(outputs.annual_allowance as number, 60000);
});

test("PEN-005 tapers when both limits are exceeded", async () => {
  const { outputs, warnings } = await calculate(
    "PEN-005",
    {
      gross_income: 280000, personal_contribution: 20000, arrangement: "net_pay",
      employer_contribution: 30000, flexibly_accessed: false, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  // Adjusted income £310,000 is £50,000 over, halving to £25,000 of reduction:
  // £60,000 - £25,000 = £35,000.
  closeTo(outputs.annual_allowance as number, 35000);
  assert.ok(warnings.some((w: string) => /tapered/i.test(w)));
});

test("PEN-005 applies the money purchase allowance after flexible access", async () => {
  const { outputs, warnings } = await calculate(
    "PEN-005",
    {
      gross_income: 60000, personal_contribution: 15000, arrangement: "net_pay",
      employer_contribution: 0, flexibly_accessed: true, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  closeTo(outputs.annual_allowance as number, 10000);
  closeTo(outputs.excess_over_allowance as number, 5000);
  assert.ok((outputs.annual_allowance_charge as number) > 0);
  assert.ok(warnings.some((w: string) => /annual allowance/i.test(w)));
});

// ---------------------------------------------------------------------------
// PEN-007: the tax-free lump sum is not income; the State Pension is
// ---------------------------------------------------------------------------

test("PEN-007 excludes the lump sum from taxable income but includes the State Pension", async () => {
  const { outputs } = await calculate(
    "PEN-007",
    {
      pension_pot: 300000, take_tax_free_lump_sum: true, drawdown_rate: 4,
      qualifying_years: 35, other_income: 0, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  closeTo(outputs.tax_free_lump_sum as number, 75000);
  closeTo(outputs.drawdown_income as number, 9000);
  closeTo(outputs.state_pension_income as number, 12547.6);
  // The £75,000 lump sum must not appear in the taxable total.
  closeTo(outputs.total_gross_income as number, 21547.6);
});

test("PEN-007 caps the tax-free lump sum at the lump sum allowance", async () => {
  const { outputs, warnings } = await calculate(
    "PEN-007",
    {
      pension_pot: 1400000, take_tax_free_lump_sum: true, drawdown_rate: 4,
      qualifying_years: 35, other_income: 0, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  // A quarter of £1.4m is £350,000, above the £268,275 allowance.
  closeTo(outputs.tax_free_lump_sum as number, 268275);
  assert.ok(warnings.some((w: string) => /lump sum allowance/i.test(w)));
});

// ---------------------------------------------------------------------------
// PEN-008: the sustainable withdrawal must actually be sustainable
// ---------------------------------------------------------------------------

test("PEN-008 the sustainable withdrawal really does exhaust the pot at the end", async (t: any) => {
  const scenarios = [
    { pension_pot: 400000, annual_growth: 5, inflation: 2.5, projection_years: 30 },
    { pension_pot: 250000, annual_growth: 4, inflation: 3, projection_years: 25 },
    { pension_pot: 150000, annual_growth: 0, inflation: 0, projection_years: 20 }
  ];
  for (const s of scenarios) {
    await t.test(`£${s.pension_pot} over ${s.projection_years} years`, async () => {
      const probe = await calculate(
        "PEN-008",
        { ...s, take_tax_free_lump_sum: true, annual_withdrawal: 1 },
        CTX
      );
      const sustainable = probe.outputs.sustainable_annual_withdrawal as number;

      // Feed the engine's own answer back in. The pot must end at
      // approximately nothing: not exhausted early, not left with a
      // meaningful balance. This tests the root, not the search.
      const check = await calculate(
        "PEN-008",
        { ...s, take_tax_free_lump_sum: true, annual_withdrawal: sustainable },
        CTX
      );
      const finalValue = check.outputs.final_pot_value as number;
      const startingAfterLump = check.outputs.pot_after_lump_sum as number;
      assert.ok(
        Math.abs(finalValue) < startingAfterLump * 0.001,
        `Pot ended at ${finalValue}, which is not close enough to zero for a sustainable withdrawal`
      );
    });
  }
});

test("PEN-008 says when the pot runs out and offers a figure that would not", async () => {
  const { outputs, warnings } = await calculate(
    "PEN-008",
    {
      pension_pot: 250000, take_tax_free_lump_sum: true, annual_withdrawal: 25000,
      annual_growth: 4, inflation: 3, projection_years: 30
    },
    CTX
  );
  assert.ok((outputs.years_pot_lasts as number) > 0);
  assert.ok((outputs.years_pot_lasts as number) < 30);
  assert.ok((outputs.sustainable_annual_withdrawal as number) < 25000);
  assert.ok(warnings.some((w: string) => /runs out/i.test(w)));
});

// ---------------------------------------------------------------------------
// PEN-009: options cost income
// ---------------------------------------------------------------------------

test("PEN-009 escalation buys a lower starting income", async () => {
  const common = {
    pension_pot: 300000, take_tax_free_lump_sum: true,
    guarantee_period: 0, spouse_proportion: 0, projection_years: 25
  };
  const level = await calculate("PEN-009", { ...common, annuity_rate: 6, escalation: 0 }, CTX);
  const rising = await calculate("PEN-009", { ...common, annuity_rate: 4.5, escalation: 3 }, CTX);

  assert.ok((rising.outputs.first_year_income as number) < (level.outputs.first_year_income as number));
  // But the escalating income overtakes it eventually.
  assert.ok((rising.outputs.final_year_income as number) > (level.outputs.final_year_income as number));
  assert.match(String(level.outputs.basis), /loses buying power/i);
});

test("PEN-009 refuses a rate of zero rather than dividing by it", async () => {
  await assert.rejects(
    () => calculate("PEN-009", {
      pension_pot: 300000, take_tax_free_lump_sum: true, annuity_rate: 0,
      escalation: 0, guarantee_period: 0, spouse_proportion: 0, projection_years: 25
    }, CTX),
    (err: Error) => /annuity rate quoted to you/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// PEN-010: the ten-year minimum is a cliff
// ---------------------------------------------------------------------------

test("PEN-010 the qualifying years minimum is a threshold, not a slope", async () => {
  const nine = await calculate("PEN-010", { qualifying_years: 9, additional_years_planned: 0 }, CTX);
  const ten = await calculate("PEN-010", { qualifying_years: 10, additional_years_planned: 0 }, CTX);

  // Nine years earns nothing at all. A linear model would wrongly promise
  // about £3,200 a year here.
  assert.strictEqual(nine.outputs.annual_amount, 0);
  assert.strictEqual(nine.outputs.weekly_amount, 0);
  assert.ok((ten.outputs.annual_amount as number) > 3000);

  // And the calculator must SAY so, not merely return a zero.
  assert.ok(nine.warnings.some((w: string) => /threshold, not a sliding scale/i.test(w)));

  // One more year, from nine, is worth the whole ten-year entitlement.
  closeTo(nine.outputs.value_of_one_more_year_annual as number, ten.outputs.annual_amount as number);
});

test("PEN-010 years beyond a full record add nothing", async () => {
  const full = await calculate("PEN-010", { qualifying_years: 35, additional_years_planned: 0 }, CTX);
  const over = await calculate("PEN-010", { qualifying_years: 40, additional_years_planned: 0 }, CTX);
  assert.strictEqual(over.outputs.annual_amount, full.outputs.annual_amount);
  assert.strictEqual(over.outputs.value_of_one_more_year_annual, 0);
  closeTo(full.outputs.weekly_amount as number, 241.3);
});

test("PEN-010 rejects a negative record", async () => {
  await assert.rejects(
    () => calculate("PEN-010", { qualifying_years: -1, additional_years_planned: 0 }, CTX),
    (err: Error) => /cannot be negative/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// PEN-012: the required contribution is exact, not searched
// ---------------------------------------------------------------------------

test("PEN-012 the required contribution actually reaches the target", async () => {
  const base = {
    target_annual_income: 40000, current_pot: 50000, years_to_retirement: 20,
    annual_growth: 5, safe_withdrawal_rate: 4,
    include_state_pension: true, qualifying_years: 35
  };
  const first = await calculate("PEN-012", { ...base, monthly_contribution: 300 }, CTX);
  const required = first.outputs.required_monthly_contribution as number;

  // Feeding the required contribution back must land on the target. The
  // contribution is reported to the penny, and 240 monthly payments compound
  // into a factor of about 400, so half a penny of rounding moves the pot by
  // a couple of pounds. The tolerance is scaled to the pot for that reason
  // and no other: it is rounding, not model error.
  const second = await calculate("PEN-012", { ...base, monthly_contribution: required }, CTX);
  const targetPot = second.outputs.target_pot as number;
  closeTo(second.outputs.projected_pot as number, targetPot, targetPot * 1e-5);
  assert.strictEqual(second.outputs.on_track, true);
  assert.strictEqual(second.outputs.shortfall, 0);
});

test("PEN-012 counting the State Pension changes the pot needed sharply", async () => {
  const base = {
    target_annual_income: 30000, current_pot: 100000, monthly_contribution: 500,
    years_to_retirement: 25, annual_growth: 5, safe_withdrawal_rate: 4, qualifying_years: 35
  };
  const withSp = await calculate("PEN-012", { ...base, include_state_pension: true }, CTX);
  const without = await calculate("PEN-012", { ...base, include_state_pension: false }, CTX);

  // £30,000 at a 4% withdrawal rate needs £750,000 without the State Pension,
  // but only £436,310 with it. Whether a calculator counts it is the single
  // biggest lever on the answer, so it is an explicit choice, not a default.
  closeTo(without.outputs.target_pot as number, 750000);
  assert.ok((withSp.outputs.target_pot as number) < (without.outputs.target_pot as number) * 0.6);
});

test("PEN-012 refuses a withdrawal rate of zero", async () => {
  await assert.rejects(
    () => calculate("PEN-012", {
      target_annual_income: 30000, current_pot: 0, monthly_contribution: 500,
      years_to_retirement: 25, annual_growth: 5, safe_withdrawal_rate: 0,
      include_state_pension: false, qualifying_years: 0
    }, CTX),
    (err: Error) => /must be above 0%/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the pensions tranche
// ---------------------------------------------------------------------------

test("no pension calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["PEN-004", { annual_salary: 0, contribution_basis: "qualifying_earnings", employer_rate: 0, employee_rate: 0 }],
    ["PEN-005", { gross_income: 0, personal_contribution: 0, arrangement: "net_pay", employer_contribution: 0, flexibly_accessed: false, jurisdiction: "England/Wales/NI" }],
    ["PEN-007", { pension_pot: 0, take_tax_free_lump_sum: true, drawdown_rate: 0, qualifying_years: 0, other_income: 0, jurisdiction: "England/Wales/NI" }],
    ["PEN-008", { pension_pot: 0, take_tax_free_lump_sum: true, annual_withdrawal: 0, annual_growth: 0, inflation: 0, projection_years: 1 }],
    ["PEN-010", { qualifying_years: 0, additional_years_planned: 0 }],
    ["PEN-012", { target_annual_income: 0, current_pot: 0, monthly_contribution: 0, years_to_retirement: 1, annual_growth: 0, safe_withdrawal_rate: 4, include_state_pension: false, qualifying_years: 0 }]
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
