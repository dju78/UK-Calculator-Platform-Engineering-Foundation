import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";

/**
 * Behavioural tests for Wave 2 tranches 2D and 2E.
 *
 * These assert PROPERTIES the canonical benchmarks cannot express: that two
 * calculators agree with each other, that an error path produces a readable
 * message rather than a number, and that a legal boundary is stated rather
 * than silently crossed. The numeric agreement itself is covered by the 108
 * independent benchmark cases.
 */

const CTX = { taxYear: "2026/27" };
const closeTo = (a: number, e: number, tol = 0.011) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// ISA-004: the withdrawal charge takes more than the bonus
// ---------------------------------------------------------------------------

test("ISA-004 Lifetime ISA withdrawal charge", async (t: any) => {
  await t.test("a 25% charge costs the saver 6.25% of their own money", async () => {
    const { outputs } = await calculate(
      "ISA-004",
      {
        current_balance: 0, annual_contribution: 4000, annual_growth: 0,
        years: 1, withdrawal_purpose: "other", property_price: 0
      },
      CTX
    );
    // £4,000 in, £1,000 bonus, £5,000 balance, 25% charge = £1,250.
    // The charge exceeds the bonus by £250, which is exactly 6.25% of £4,000.
    closeTo(outputs.total_bonus as number, 1000);
    closeTo(outputs.withdrawal_charge as number, 1250);
    closeTo(outputs.own_money_lost_to_charge as number, 250);
    assert.strictEqual(
      Math.round(((outputs.own_money_lost_to_charge as number) / 4000) * 10000) / 100,
      6.25
    );
  });

  await t.test("a first home above the price cap is NOT charge free", async () => {
    const { outputs } = await calculate(
      "ISA-004",
      {
        current_balance: 0, annual_contribution: 4000, annual_growth: 5,
        years: 5, withdrawal_purpose: "first_home", property_price: 500000
      },
      CTX
    );
    assert.strictEqual(outputs.charge_applies, true);
    assert.ok((outputs.withdrawal_charge as number) > 0);
  });

  await t.test("a qualifying first home attracts no charge at all", async () => {
    const { outputs } = await calculate(
      "ISA-004",
      {
        current_balance: 0, annual_contribution: 4000, annual_growth: 5,
        years: 5, withdrawal_purpose: "first_home", property_price: 250000
      },
      CTX
    );
    assert.strictEqual(outputs.charge_applies, false);
    assert.strictEqual(outputs.withdrawal_charge, 0);
  });
});

// ---------------------------------------------------------------------------
// ISA-005: the child's age governs the term, and is validated
// ---------------------------------------------------------------------------

test("ISA-005 Junior ISA", async (t: any) => {
  await t.test("rejects an age at or beyond maturity with a readable message", async () => {
    await assert.rejects(
      () => calculate("ISA-005", { current_balance: 0, annual_contribution: 1000, annual_growth: 5, child_age: 18 }, CTX),
      (err: Error) => /matures at 18/.test(err.message)
    );
  });

  await t.test("caps contributions at the statutory limit", async () => {
    const { outputs } = await calculate(
      "ISA-005",
      { current_balance: 0, annual_contribution: 15000, annual_growth: 0, child_age: 17 },
      CTX
    );
    // One year left, capped at the £9,000 Junior ISA limit.
    closeTo(outputs.total_contributions as number, 9000);
  });
});

// ---------------------------------------------------------------------------
// ISA-006: the honest "no advantage" case
// ---------------------------------------------------------------------------

test("ISA-006 Cash ISA reports a nil advantage honestly", async () => {
  const { outputs } = await calculate(
    "ISA-006",
    { opening_balance: 5000, monthly_contribution: 100, annual_rate: 4, years: 5, other_income: 35000 },
    CTX
  );
  // A basic-rate saver with interest inside the £1,000 Personal Savings
  // Allowance pays no tax on an ordinary account either, so the ISA gives no
  // advantage. Claiming one here would be the easiest way to mislead a user.
  assert.strictEqual(outputs.tax_paid_on_savings, 0);
  assert.strictEqual(outputs.isa_advantage, 0);
  assert.match(String(outputs.basis), /no tax advantage/i);
});

// ---------------------------------------------------------------------------
// TAX-006 / TAX-007: exact inverses on the same working pattern
// ---------------------------------------------------------------------------

test("TAX-006 and TAX-007 are exact inverses", async () => {
  const pattern = { hours_per_week: 37.5, paid_weeks_per_year: 52, days_per_week: 5 };
  const forward = await calculate("TAX-006", { hourly_rate: 15, ...pattern }, CTX);
  const back = await calculate(
    "TAX-007",
    { annual_salary: forward.outputs.annual_salary, ...pattern },
    CTX
  );
  closeTo(back.outputs.hourly_rate as number, 15, 0.005);
  closeTo(back.outputs.annual_salary as number, forward.outputs.annual_salary as number);
  closeTo(back.outputs.monthly_salary as number, forward.outputs.monthly_salary as number);
});

test("TAX-006 refuses to invent a working pattern", async () => {
  await assert.rejects(
    () => calculate("TAX-006", { hourly_rate: 15, days_per_week: 5 }, CTX),
    (err: Error) => /Hours per week is required/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// TAX-008: a multiplier below 1 is a typing error, not a pay cut
// ---------------------------------------------------------------------------

test("TAX-008 rejects an overtime multiplier below 1", async () => {
  await assert.rejects(
    () => calculate("TAX-008", {
      base_hourly_rate: 15, standard_hours: 37.5, overtime_hours: 5,
      overtime_multiplier: 0.5, premium_hours: 0, premium_multiplier: 2,
      pay_periods_per_year: 52
    }, CTX),
    (err: Error) => /below 1 would pay less/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// TAX-009: the 60% band is reported, not hidden
// ---------------------------------------------------------------------------

test("TAX-009 exposes the Personal Allowance taper", async () => {
  const { outputs } = await calculate(
    "TAX-009",
    {
      annual_salary: 99000, bonus: 10000, pension_from_bonus_percentage: 0,
      jurisdiction: "England/Wales/NI", student_plan: "None", postgraduate: false
    },
    CTX
  );
  // £10,000 of bonus above £100,000 withdraws £4,500 of allowance, so £14,500
  // becomes taxable at 40%: £5,800 of tax on a £10,000 bonus.
  closeTo(outputs.personal_allowance_lost as number, 4500);
  closeTo(outputs.income_tax_on_bonus as number, 5800);
  assert.match(String(outputs.marginal_rate_band), /taper/i);
});

// ---------------------------------------------------------------------------
// TAX-010: every ineligibility route names the reason
// ---------------------------------------------------------------------------

test("TAX-010 Marriage Allowance eligibility", async (t: any) => {
  const cases: Array<[string, number, number, RegExp]> = [
    ["recipient is a higher-rate taxpayer", 5000, 60000, /not a basic-rate taxpayer/i],
    ["transferor has no unused allowance", 20000, 45000, /no unused allowance/i],
    ["recipient pays no tax at all", 4000, 10000, /no Income Tax/i]
  ];
  for (const [name, lower, higher, expected] of cases) {
    await t.test(name, async () => {
      const { outputs } = await calculate(
        "TAX-010",
        { lower_earner_income: lower, higher_earner_income: higher, jurisdiction: "England/Wales/NI" },
        CTX
      );
      assert.strictEqual(outputs.eligible, false);
      assert.match(String(outputs.eligibility_note), expected);
      assert.strictEqual(outputs.household_benefit, 0);
    });
  }

  await t.test("the qualifying case gives the published maximum", async () => {
    const { outputs } = await calculate(
      "TAX-010",
      { lower_earner_income: 0, higher_earner_income: 35000, jurisdiction: "England/Wales/NI" },
      CTX
    );
    assert.strictEqual(outputs.eligible, true);
    closeTo(outputs.household_benefit as number, 252);
  });

  await t.test("a transferor with income near the allowance loses part of the gain", async () => {
    const { outputs } = await calculate(
      "TAX-010",
      { lower_earner_income: 12000, higher_earner_income: 30000, jurisdiction: "England/Wales/NI" },
      CTX
    );
    // The transferor's allowance falls to £11,310, so £690 of their income
    // becomes taxable at 20% - £138. The household gains £252 less £138.
    closeTo(outputs.transferor_tax_after as number, 138);
    closeTo(outputs.household_benefit as number, 114);
  });
});

// ---------------------------------------------------------------------------
// TAX-011: dividend tax is reserved, not devolved
// ---------------------------------------------------------------------------

test("TAX-011 charges a Scottish taxpayer UK rates on dividends", async () => {
  const inputs = { other_income: 40000, dividend_income: 20000 };
  const england = await calculate("TAX-011", { ...inputs, jurisdiction: "England/Wales/NI" }, CTX);
  const scotland = await calculate("TAX-011", { ...inputs, jurisdiction: "Scotland" }, CTX);

  // Dividend taxation is reserved. The dividend figures must be identical...
  assert.strictEqual(scotland.outputs.dividend_tax, england.outputs.dividend_tax);
  assert.strictEqual(scotland.outputs.dividends_taxed_at_basic, england.outputs.dividends_taxed_at_basic);
  assert.strictEqual(scotland.outputs.dividends_taxed_at_higher, england.outputs.dividends_taxed_at_higher);

  // ...while the tax on earnings, which IS devolved, is free to differ, and
  // the explanation must tell a Scottish user why the two behave differently.
  assert.match(String(scotland.outputs.basis), /reserved/i);
});

test("TAX-011 treats the dividend allowance as a nil rate band", async () => {
  // £12,570 salary uses the whole Personal Allowance, so all £50,000 of
  // dividends is taxable. The £500 allowance sits inside the basic rate band
  // and uses up band space rather than shifting later dividends downwards.
  const { outputs } = await calculate(
    "TAX-011",
    { other_income: 12570, dividend_income: 50000, jurisdiction: "England/Wales/NI" },
    CTX
  );
  closeTo(outputs.dividends_taxed_at_basic as number, 37200);
  closeTo(outputs.dividends_taxed_at_higher as number, 12300);
  closeTo(outputs.dividend_tax as number, 8396.25);
});

// ---------------------------------------------------------------------------
// TAX-012: capital gains use UK bands even in Scotland
// ---------------------------------------------------------------------------

test("TAX-012 uses the UK basic rate band regardless of jurisdiction", async () => {
  const { outputs } = await calculate(
    "TAX-012",
    {
      disposal_proceeds: 100000, acquisition_cost: 40000, costs: 2000,
      allowable_losses: 0, other_taxable_income: 40000
    },
    CTX
  );
  // Taxable income £27,430 leaves £10,270 of basic rate band; the gain is
  // £58,000, less £3,000 exempt = £55,000 taxable.
  closeTo(outputs.basic_rate_band_remaining as number, 10270);
  closeTo(outputs.gain_taxed_at_basic_rate as number, 10270);
  closeTo(outputs.gain_taxed_at_higher_rate as number, 44730);
  assert.match(String(outputs.basis), /reserved/i);
});

test("TAX-012 reports a loss rather than negative tax", async () => {
  const { outputs, warnings } = await calculate(
    "TAX-012",
    {
      disposal_proceeds: 15000, acquisition_cost: 25000, costs: 500,
      allowable_losses: 0, other_taxable_income: 40000
    },
    CTX
  );
  assert.strictEqual(outputs.capital_gains_tax, 0);
  assert.strictEqual(outputs.taxable_gain, 0);
  assert.ok(warnings.some((w: string) => /loss/i.test(w)));
});

// ---------------------------------------------------------------------------
// TAX-014: the charity rate cliff
// ---------------------------------------------------------------------------

test("TAX-014 applies the reduced charity rate at exactly a tenth", async () => {
  const base = {
    estate_value: 800000, property_to_direct_descendants: 0,
    transferred_nil_rate_band_percentage: 0,
    transferred_residence_nil_rate_band_percentage: 0
  };
  // Baseline after the £325,000 nil rate band is £475,000, so the test is met
  // at £47,500 and missed just below it.
  const met = await calculate("TAX-014", { ...base, charitable_gifts: 47500 }, CTX);
  const missed = await calculate("TAX-014", { ...base, charitable_gifts: 47499 }, CTX);

  assert.strictEqual(met.outputs.reduced_charity_rate_applies, true);
  assert.strictEqual(met.outputs.rate_applied, 0.36);
  assert.strictEqual(missed.outputs.reduced_charity_rate_applies, false);
  assert.strictEqual(missed.outputs.rate_applied, 0.4);

  // Giving the extra pound leaves MORE for the beneficiaries, which is the
  // whole point of the relief and the reason the cliff must be modelled.
  assert.ok(
    (met.outputs.estate_to_beneficiaries as number) >
      (missed.outputs.estate_to_beneficiaries as number)
  );
});

test("TAX-014 tapers the residence nil rate band away on a large estate", async () => {
  const { outputs, warnings } = await calculate(
    "TAX-014",
    {
      estate_value: 2400000, property_to_direct_descendants: 600000, charitable_gifts: 0,
      transferred_nil_rate_band_percentage: 0, transferred_residence_nil_rate_band_percentage: 0
    },
    CTX
  );
  // £400,000 above the £2m threshold withdraws £200,000, which exceeds the
  // whole £175,000 band.
  assert.strictEqual(outputs.residence_nil_rate_band, 0);
  assert.ok(warnings.some((w: string) => /withdrawn/i.test(w)));
});

// ---------------------------------------------------------------------------
// TAX-016 / TAX-017: one tax computation, two presentations
// ---------------------------------------------------------------------------

test("TAX-016 and TAX-017 never disagree on the same facts", async () => {
  const inputs = {
    turnover: 55000, allowable_expenses: 15000, capital_allowances: 2000,
    other_income: 0, jurisdiction: "England/Wales/NI"
  };
  const se = await calculate("TAX-016", inputs, CTX);
  const st = await calculate("TAX-017", inputs, CTX);
  assert.strictEqual(st.outputs.taxable_profit, se.outputs.taxable_profit);
  assert.strictEqual(st.outputs.income_tax, se.outputs.income_tax);
  assert.strictEqual(st.outputs.class_4_national_insurance, se.outputs.class_4_national_insurance);
  assert.strictEqual(
    st.outputs.total_tax_and_national_insurance,
    se.outputs.total_tax_and_national_insurance
  );
});

test("TAX-016 charges Class 4 on profits alone, not on total income", async () => {
  // £22,000 of profit alongside £35,000 of employment income. Income Tax is
  // charged on £57,000, but Class 4 only on the £22,000 of profit.
  const { outputs } = await calculate(
    "TAX-016",
    {
      turnover: 30000, allowable_expenses: 8000, capital_allowances: 0,
      other_income: 35000, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  // (22,000 - 12,570) x 6% = £565.80
  closeTo(outputs.class_4_national_insurance as number, 565.8);
  closeTo(outputs.total_income as number, 57000);
});

test("TAX-016 shows the real January demand", async () => {
  const { outputs } = await calculate(
    "TAX-016",
    {
      turnover: 55000, allowable_expenses: 15000, capital_allowances: 0,
      other_income: 0, jurisdiction: "England/Wales/NI"
    },
    CTX
  );
  // The balancing payment plus the first payment on account is one and a half
  // times the year's liability, which is the figure that surprises people.
  closeTo(
    outputs.first_payment_due as number,
    (outputs.total_tax_and_national_insurance as number) * 1.5
  );
});

// ---------------------------------------------------------------------------
// TAX-018: the boundaries the fraction was derived from
// ---------------------------------------------------------------------------

test("TAX-018 Corporation Tax", async (t: any) => {
  await t.test("reproduces both published boundary rates exactly", async () => {
    const lower = await calculate("TAX-018", { taxable_profit: 50000, associated_companies: 0, accounting_period_months: 12 }, CTX);
    const upper = await calculate("TAX-018", { taxable_profit: 250000, associated_companies: 0, accounting_period_months: 12 }, CTX);
    closeTo(lower.outputs.corporation_tax as number, 9500);   // 19% of 50,000
    closeTo(upper.outputs.corporation_tax as number, 62500);  // 25% of 250,000
  });

  await t.test("the marginal band is taxed above the headline main rate", async () => {
    const { outputs } = await calculate(
      "TAX-018",
      { taxable_profit: 100000, associated_companies: 0, accounting_period_months: 12 },
      CTX
    );
    closeTo(outputs.corporation_tax as number, 22750);
    assert.strictEqual(outputs.marginal_rate_on_next_pound, 0.265);
    assert.ok((outputs.effective_rate as number) < 0.25);
  });

  await t.test("associated companies divide the limits", async () => {
    const alone = await calculate("TAX-018", { taxable_profit: 40000, associated_companies: 0, accounting_period_months: 12 }, CTX);
    const paired = await calculate("TAX-018", { taxable_profit: 40000, associated_companies: 1, accounting_period_months: 12 }, CTX);
    // Alone, £40,000 is under the £50,000 limit and pays 19%. With one
    // associated company the limit halves to £25,000, so marginal relief bites.
    assert.strictEqual(alone.outputs.rate_band, "Small profits rate");
    assert.strictEqual(paired.outputs.rate_band, "Marginal relief");
    assert.ok((paired.outputs.corporation_tax as number) > (alone.outputs.corporation_tax as number));
  });

  await t.test("rejects an impossible accounting period", async () => {
    await assert.rejects(
      () => calculate("TAX-018", { taxable_profit: 40000, associated_companies: 0, accounting_period_months: 24 }, CTX),
      (err: Error) => /1 to 18 months/.test(err.message)
    );
  });
});

// ---------------------------------------------------------------------------
// TAX-005: sacrifice is not the same as any other pension arrangement
// ---------------------------------------------------------------------------

test("TAX-005 salary sacrifice saves National Insurance as well as Income Tax", async () => {
  const { outputs } = await calculate(
    "TAX-005",
    {
      gross_salary: 32000, sacrifice_percentage: 5, employer_contribution_percentage: 3,
      jurisdiction: "England/Wales/NI", student_plan: "None", postgraduate: false
    },
    CTX
  );
  // £1,600 sacrificed at basic rate saves 20% Income Tax and 8% National
  // Insurance. A net pay or relief at source arrangement would save the tax
  // but NOT the National Insurance, which is what distinguishes sacrifice.
  closeTo(outputs.sacrificed_amount as number, 1600);
  closeTo(outputs.income_tax_saved as number, 320);
  closeTo(outputs.national_insurance_saved as number, 128);
  closeTo(outputs.take_home_reduction as number, 1152);
});

test("TAX-005 rejects a sacrifice above the whole salary", async () => {
  await assert.rejects(
    () => calculate("TAX-005", {
      gross_salary: 32000, sacrifice_percentage: 120, employer_contribution_percentage: 0,
      jurisdiction: "England/Wales/NI", student_plan: "None", postgraduate: false
    }, CTX),
    (err: Error) => /between 0% and 100%/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the new tranche
// ---------------------------------------------------------------------------

test("no tranche 2D or 2E calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["ISA-003", { initial_investment: 0, monthly_contribution: 0, annual_growth: 0, dividend_yield: 0, years: 1, other_income: 0 }],
    ["ISA-004", { current_balance: 0, annual_contribution: 0, annual_growth: 0, years: 1, withdrawal_purpose: "other", property_price: 0 }],
    ["ISA-005", { current_balance: 0, annual_contribution: 0, annual_growth: 0, child_age: 0 }],
    ["ISA-006", { opening_balance: 0, monthly_contribution: 0, annual_rate: 0, years: 1, other_income: 0 }],
    ["TAX-005", { gross_salary: 0, sacrifice_percentage: 0, employer_contribution_percentage: 0, jurisdiction: "England/Wales/NI", student_plan: "None", postgraduate: false }],
    ["TAX-008", { base_hourly_rate: 0, standard_hours: 0, overtime_hours: 0, overtime_multiplier: 1, premium_hours: 0, premium_multiplier: 1, pay_periods_per_year: 52 }],
    ["TAX-009", { annual_salary: 0, bonus: 0, pension_from_bonus_percentage: 0, jurisdiction: "England/Wales/NI", student_plan: "None", postgraduate: false }],
    ["TAX-011", { other_income: 0, dividend_income: 0, jurisdiction: "England/Wales/NI" }],
    ["TAX-012", { disposal_proceeds: 0, acquisition_cost: 0, costs: 0, allowable_losses: 0, other_taxable_income: 0 }],
    ["TAX-014", { estate_value: 0, property_to_direct_descendants: 0, charitable_gifts: 0, transferred_nil_rate_band_percentage: 0, transferred_residence_nil_rate_band_percentage: 0 }],
    ["TAX-016", { turnover: 0, allowable_expenses: 0, capital_allowances: 0, other_income: 0, jurisdiction: "England/Wales/NI" }],
    ["TAX-017", { turnover: 0, allowable_expenses: 0, capital_allowances: 0, other_income: 0, jurisdiction: "England/Wales/NI" }],
    ["TAX-018", { taxable_profit: 0, associated_companies: 0, accounting_period_months: 12 }]
  ];
  // Every zero input is a division waiting to happen. None of these may
  // produce NaN, Infinity or an object rendered as text.
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
