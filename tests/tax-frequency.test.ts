import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";
import {
  annualiseIncome,
  annualWorkingHours,
  normaliseIncomeFrequency,
  normalisePayrollFrequency,
  periodicBreakdown,
  resolveWorkingPattern,
  DEFAULT_HOURS_PER_WEEK,
  DEFAULT_PAID_WEEKS_PER_YEAR
} from "../packages/calculation-engine/src/common/frequency.js";
import {
  applyPensionArrangement,
  normalisePensionArrangement
} from "../packages/calculation-engine/src/finance/tax/pension.js";
import { resolveTaxCode } from "../packages/calculation-engine/src/finance/tax/tax-codes.js";
import { resolveRules } from "../packages/rules-uk/src/index.js";

const CTX = { now: new Date("2026-08-22T08:00:00Z") };
const rules = resolveRules({ taxYear: "2026/27" }) as any;

const closeTo = (actual: number, expected: number, tolerance = 0.005) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be close to ${expected} within ${tolerance}`
  );
};

const STANDARD_PATTERN = { hours_per_week: 37.5, paid_weeks_per_year: 52 };

// ---------------------------------------------------------------------------
// Shared frequency model
// ---------------------------------------------------------------------------

test("Income frequency model", async (t: any) => {
  await t.test("normalises the four supported income frequencies", () => {
    assert.strictEqual(normaliseIncomeFrequency("Annual"), "annual");
    assert.strictEqual(normaliseIncomeFrequency("MONTHLY"), "monthly");
    assert.strictEqual(normaliseIncomeFrequency("per week"), "weekly");
    assert.strictEqual(normaliseIncomeFrequency("hourly"), "hourly");
    assert.throws(() => normaliseIncomeFrequency("fortnightly"), /Unsupported income frequency/);
  });

  await t.test("payroll frequency is a separate, narrower concept", () => {
    assert.strictEqual(normalisePayrollFrequency("monthly"), "monthly");
    assert.strictEqual(normalisePayrollFrequency("weekly"), "weekly");
    // Hourly is a valid INCOME frequency but never a payroll frequency.
    assert.throws(() => normalisePayrollFrequency("hourly"), /Unsupported payroll frequency/);
  });

  await t.test("annualises each frequency to the same gross", () => {
    const pattern = resolveWorkingPattern(STANDARD_PATTERN);
    closeTo(annualiseIncome(39000, "annual", pattern), 39000);
    closeTo(annualiseIncome(3250, "monthly", pattern), 39000);
    closeTo(annualiseIncome(750, "weekly", pattern), 39000);
    closeTo(annualiseIncome(20, "hourly", pattern), 39000);
  });

  await t.test("hourly annualisation uses hours x paid weeks", () => {
    const pattern = resolveWorkingPattern({ hours_per_week: 37.5, paid_weeks_per_year: 52 });
    assert.strictEqual(annualWorkingHours(pattern), 1950);
    closeTo(annualiseIncome(15, "hourly", pattern), 29250);
  });

  await t.test("respects non-default working patterns", () => {
    const pattern = resolveWorkingPattern({ hours_per_week: 20, paid_weeks_per_year: 48 });
    closeTo(annualiseIncome(15, "hourly", pattern), 15 * 20 * 48);
    closeTo(annualiseIncome(500, "weekly", pattern), 24000);
  });

  await t.test("defaults are 37.5 hours and 52 paid weeks, and are reported", () => {
    const pattern = resolveWorkingPattern({});
    assert.strictEqual(pattern.hoursPerWeek, DEFAULT_HOURS_PER_WEEK);
    assert.strictEqual(pattern.paidWeeksPerYear, DEFAULT_PAID_WEEKS_PER_YEAR);
    // Crucially, an unsupplied pattern is flagged so callers can decline to
    // show an hourly figure derived from an assumption the user never saw.
    assert.strictEqual(pattern.hoursKnown, false);
  });

  await t.test("requires hours when income is entered hourly", () => {
    assert.throws(
      () => resolveWorkingPattern({ paid_weeks_per_year: 52 }, { requireHours: true }),
      /Hours per week is required/
    );
  });

  await t.test("rejects nonsensical working patterns", () => {
    assert.throws(() => resolveWorkingPattern({ hours_per_week: 0 }), /greater than zero/);
    assert.throws(() => resolveWorkingPattern({ paid_weeks_per_year: 60 }), /between 1 and 53/);
  });

  await t.test("omits the hourly equivalent when hours are unknown", () => {
    const unknown = periodicBreakdown(26000, resolveWorkingPattern({}));
    assert.strictEqual(unknown.hourly, null);
    const known = periodicBreakdown(26000, resolveWorkingPattern(STANDARD_PATTERN));
    assert.notStrictEqual(known.hourly, null);
  });
});

// ---------------------------------------------------------------------------
// Periodic reconciliation (rounding)
// ---------------------------------------------------------------------------

test("Periodic results reconcile to the annual figure", async (t: any) => {
  const pattern = resolveWorkingPattern(STANDARD_PATTERN);

  await t.test("monthly x 12, weekly x weeks and hourly x hours all reconcile", () => {
    for (const annual of [25407.6, 32000, 1, 123456.78]) {
      const p = periodicBreakdown(annual, pattern);
      closeTo(p.monthly * 12, annual, 1e-9);
      closeTo(p.weekly * pattern.paidWeeksPerYear, annual, 1e-9);
      closeTo((p.hourly as number) * annualWorkingHours(pattern), annual, 1e-9);
    }
  });

  await t.test("reconciles within display rounding after 2dp rounding", () => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const annual = 25407.6;
    const p = periodicBreakdown(annual, pattern);
    // Each period is rounded for display; the reconstructed annual must stay
    // within half a penny per period.
    closeTo(round2(p.monthly) * 12, annual, 0.005 * 12);
    closeTo(round2(p.weekly) * 52, annual, 0.005 * 52);
  });
});

// ---------------------------------------------------------------------------
// Input-frequency equivalence
// ---------------------------------------------------------------------------

test("Equivalent gross income produces equivalent annual results", async (t: any) => {
  const variants = [
    { label: "annual", inputs: { salary: 39000, income_frequency: "annual" } },
    { label: "monthly", inputs: { salary: 3250, income_frequency: "monthly" } },
    { label: "weekly", inputs: { salary: 750, income_frequency: "weekly" } },
    { label: "hourly", inputs: { salary: 20, income_frequency: "hourly" } }
  ];

  await t.test("TAX-002 converts all four frequencies to the same gross", async () => {
    for (const v of variants) {
      const { outputs } = await calculate(
        "TAX-002",
        { ...v.inputs, ...STANDARD_PATTERN, jurisdiction: "England/Wales/NI" },
        CTX
      );
      closeTo(outputs.gross_annual as number, 39000, 0.01);
      closeTo(outputs.gross_monthly as number, 3250, 0.01);
      closeTo(outputs.gross_weekly as number, 750, 0.01);
      closeTo(outputs.gross_hourly as number, 20, 0.01);
    }
  });

  await t.test("TAX-003 take-home is identical across all four input frequencies", async () => {
    const base = {
      ...STANDARD_PATTERN,
      jurisdiction: "England/Wales/NI",
      tax_code: "1257L",
      pension_arrangement: "none",
      pension_pct: 0,
      student_plan: "None",
      postgraduate: false
    };
    const cases = [
      { label: "annual", gross: 32000, income_frequency: "annual", payroll_frequency: "monthly" },
      { label: "monthly", gross: 32000 / 12, income_frequency: "monthly", payroll_frequency: "monthly" },
      { label: "weekly", gross: 32000 / 52, income_frequency: "weekly", payroll_frequency: "weekly" },
      { label: "hourly", gross: 32000 / 1950, income_frequency: "hourly", payroll_frequency: "monthly" }
    ];

    const results = [];
    for (const c of cases) {
      const { outputs } = await calculate("TAX-003", { ...base, ...c }, CTX);
      results.push({ label: c.label, outputs });
      closeTo(outputs.gross_annual as number, 32000, 0.01);
    }

    const reference = results[0].outputs;
    for (const r of results.slice(1)) {
      for (const key of ["tax", "ni", "net_annual", "net_monthly", "net_weekly"]) {
        closeTo(
          r.outputs[key] as number,
          reference[key] as number,
          0.01
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Take-home regressions pinned by the specification
// ---------------------------------------------------------------------------

test("TAX-003 take-home regressions", async (t: any) => {
  const base = {
    ...STANDARD_PATTERN,
    jurisdiction: "England/Wales/NI",
    tax_code: "1257L",
    student_plan: "None",
    postgraduate: false
  };

  await t.test("£32,000 annual, monthly payroll, no pension", async () => {
    const { outputs } = await calculate(
      "TAX-003",
      { ...base, gross: 32000, income_frequency: "annual", payroll_frequency: "monthly", pension_arrangement: "none", pension_pct: 0 },
      CTX
    );
    // Personal allowance 12,570 -> taxable 19,430 at 20% = 3,886.
    closeTo(outputs.tax as number, 3886, 0.01);
    // NI on (32,000 - 12,570) at 8% = 1,554.40.
    closeTo(outputs.ni as number, 1554.4, 0.01);
    closeTo(outputs.net_annual as number, 26559.6, 0.01);
  });

  await t.test("5% salary sacrifice preserves the approved figures", async () => {
    const { outputs } = await calculate(
      "TAX-003",
      {
        ...base,
        gross: 32000,
        income_frequency: "annual",
        payroll_frequency: "monthly",
        pension_arrangement: "salary_sacrifice",
        pension_pct: 0.05
      },
      CTX
    );
    closeTo(outputs.employee_pension as number, 1600, 0.01);
    closeTo(outputs.tax as number, 3566, 0.01);
    closeTo(outputs.ni as number, 1426.4, 0.01);
    closeTo(outputs.net_annual as number, 25407.6, 0.01);
    closeTo(outputs.net_monthly as number, 2117.3, 0.01);
    closeTo(outputs.net_weekly as number, 25407.6 / 52, 0.01);
    closeTo(outputs.net_hourly_equivalent as number, 25407.6 / 1950, 0.01);
  });

  await t.test("legacy salary_sacrifice_pct input still behaves as salary sacrifice", async () => {
    const legacy = await calculate(
      "TAX-003",
      { gross: 32000, jurisdiction: "England/Wales/NI", salary_sacrifice_pct: 0.05, student_plan: "None", postgraduate: false },
      CTX
    );
    const explicit = await calculate(
      "TAX-003",
      { gross: 32000, jurisdiction: "England/Wales/NI", pension_arrangement: "salary_sacrifice", pension_pct: 0.05, student_plan: "None", postgraduate: false },
      CTX
    );
    closeTo(legacy.outputs.tax as number, explicit.outputs.tax as number, 0.01);
    closeTo(legacy.outputs.ni as number, explicit.outputs.ni as number, 0.01);
    closeTo(legacy.outputs.net_annual as number, explicit.outputs.net_annual as number, 0.01);
  });
});

// ---------------------------------------------------------------------------
// Pension arrangements
// ---------------------------------------------------------------------------

test("Pension arrangements have genuinely distinct treatment", async (t: any) => {
  const base = {
    ...STANDARD_PATTERN,
    gross: 50000,
    income_frequency: "annual",
    payroll_frequency: "monthly",
    jurisdiction: "England/Wales/NI",
    tax_code: "1257L",
    pension_pct: 0.05,
    student_plan: "None",
    postgraduate: false
  };

  const run = async (arrangement: string, extra: Record<string, unknown> = {}) =>
    (await calculate("TAX-003", { ...base, pension_arrangement: arrangement, ...extra }, CTX)).outputs;

  await t.test("normalises arrangement names", () => {
    assert.strictEqual(normalisePensionArrangement("Salary Sacrifice"), "salary_sacrifice");
    assert.strictEqual(normalisePensionArrangement("net pay"), "net_pay");
    assert.strictEqual(normalisePensionArrangement("relief-at-source"), "relief_at_source");
    assert.strictEqual(normalisePensionArrangement(undefined), "none");
    assert.throws(() => normalisePensionArrangement("magic"), /Unsupported pension arrangement/);
  });

  await t.test("salary sacrifice reduces both Income Tax and NI", async () => {
    const none = await run("none", { pension_pct: 0 });
    const sacrifice = await run("salary_sacrifice");
    assert.ok((sacrifice.tax as number) < (none.tax as number), "tax should fall");
    assert.ok((sacrifice.ni as number) < (none.ni as number), "NI should fall");
  });

  await t.test("net pay reduces Income Tax but NOT National Insurance", async () => {
    const none = await run("none", { pension_pct: 0 });
    const netPay = await run("net_pay");
    assert.ok((netPay.tax as number) < (none.tax as number), "tax should fall");
    closeTo(netPay.ni as number, none.ni as number, 0.01);
  });

  await t.test("relief at source leaves Income Tax and NI on the full gross", async () => {
    const none = await run("none", { pension_pct: 0 });
    const ras = await run("relief_at_source");
    closeTo(ras.tax as number, none.tax as number, 0.01);
    closeTo(ras.ni as number, none.ni as number, 0.01);
  });

  await t.test("relief at source models the 100/80/20 split", async () => {
    const ras = await run("relief_at_source");
    // 5% of 50,000 = 2,500 gross into the pot.
    closeTo(ras.employee_pension as number, 2500, 0.01);
    closeTo(ras.employee_pension_cash_cost as number, 2000, 0.01);
    closeTo(ras.pension_tax_relief as number, 500, 0.01);
  });

  await t.test("salary sacrifice beats the other arrangements via the NI saving", async () => {
    const sacrifice = await run("salary_sacrifice");
    const netPay = await run("net_pay");
    assert.ok(
      (sacrifice.net_annual as number) > (netPay.net_annual as number),
      "salary sacrifice should leave more take-home than net pay at the same contribution"
    );
  });

  await t.test("at basic rate, net pay and relief at source deliver the same take-home", async () => {
    // Both give relief at the basic rate, just by different mechanisms:
    // net pay removes the contribution from taxable pay, relief at source
    // tops the pot up instead. For a wholly basic-rate taxpayer the two are
    // arithmetically equivalent, and that equivalence is a correctness check.
    const netPay = await run("net_pay");
    const ras = await run("relief_at_source");
    closeTo(ras.net_annual as number, netPay.net_annual as number, 0.01);
  });

  await t.test("at higher rate, relief at source leaves less take-home than net pay", async () => {
    // This is where the arrangements must diverge: net pay gives higher-rate
    // relief immediately through payroll, whereas relief at source only adds
    // basic rate at source. The extra relief is claimed separately from HMRC
    // and is deliberately NOT credited to take-home here.
    const higher = { gross: 80000 };
    const netPay = await run("net_pay", higher);
    const ras = await run("relief_at_source", higher);
    assert.ok(
      (netPay.net_annual as number) > (ras.net_annual as number),
      "net pay should beat relief at source for a higher-rate taxpayer"
    );
    // The gap is exactly the un-credited higher-rate relief on the contribution.
    const contribution = 80000 * 0.05;
    const basicRate = rules.pension.relief_at_source_basic_rate as number;
    closeTo(
      (netPay.net_annual as number) - (ras.net_annual as number),
      contribution * (0.4 - basicRate),
      0.01
    );
  });

  await t.test("all four arrangements are distinct for a higher-rate taxpayer", async () => {
    const higher = { gross: 80000 };
    const nets = new Set(
      [
        (await run("none", { ...higher, pension_pct: 0 })).net_annual,
        (await run("salary_sacrifice", higher)).net_annual,
        (await run("net_pay", higher)).net_annual,
        (await run("relief_at_source", higher)).net_annual
      ].map(v => Number(v).toFixed(2))
    );
    assert.strictEqual(nets.size, 4, "each arrangement should yield a distinct net figure");
  });

  await t.test("employer contribution never reduces take-home", async () => {
    const without = await run("none", { pension_pct: 0, employer_pension_pct: 0 });
    const with3 = await run("none", { pension_pct: 0, employer_pension_pct: 0.03 });
    closeTo(with3.net_annual as number, without.net_annual as number, 0.001);
    closeTo(with3.employer_pension as number, 1500, 0.01);
    closeTo(with3.total_pension_contribution as number, 1500, 0.01);
  });

  await t.test("rejects out-of-range contribution rates", () => {
    assert.throws(
      () => applyPensionArrangement(50000, "salary_sacrifice", 1.5, 0, rules),
      /between 0% and 100%/
    );
  });
});

// ---------------------------------------------------------------------------
// Tax codes
// ---------------------------------------------------------------------------

test("Tax code interpretation", async (t: any) => {
  await t.test("1257L applies the standard allowance", () => {
    const r = resolveTaxCode("1257L", "england_wales_ni", rules);
    assert.strictEqual(r.supported, true);
    assert.strictEqual(r.allowance, 12570);
    assert.match(r.explanation, /Standard tax code/);
  });

  await t.test("numeric codes map to allowance = number x 10", () => {
    assert.strictEqual(resolveTaxCode("1100L", "england_wales_ni", rules).allowance, 11000);
    assert.strictEqual(resolveTaxCode("0T", "england_wales_ni", rules).allowance, 0);
  });

  await t.test("flat-rate codes resolve their rate from the ruleset bands", () => {
    assert.strictEqual(resolveTaxCode("BR", "england_wales_ni", rules).flatRate, 0.2);
    assert.strictEqual(resolveTaxCode("D0", "england_wales_ni", rules).flatRate, 0.4);
    assert.strictEqual(resolveTaxCode("D1", "england_wales_ni", rules).flatRate, 0.45);
    assert.strictEqual(resolveTaxCode("SBR", "scotland", rules).flatRate, 0.2);
    assert.strictEqual(resolveTaxCode("SD0", "scotland", rules).flatRate, 0.21);
    assert.strictEqual(resolveTaxCode("SD1", "scotland", rules).flatRate, 0.42);
    assert.strictEqual(resolveTaxCode("SD2", "scotland", rules).flatRate, 0.45);
    assert.strictEqual(resolveTaxCode("SD3", "scotland", rules).flatRate, 0.48);
  });

  await t.test("NT charges no tax at all", async () => {
    const r = resolveTaxCode("NT", "england_wales_ni", rules);
    assert.strictEqual(r.noTax, true);
    const { outputs } = await calculate(
      "TAX-003",
      { gross: 50000, jurisdiction: "England/Wales/NI", tax_code: "NT", pension_arrangement: "none", student_plan: "None", postgraduate: false },
      CTX
    );
    closeTo(outputs.tax as number, 0, 0.001);
  });

  await t.test("prefixes select the right jurisdiction", () => {
    assert.strictEqual(resolveTaxCode("S1257L", "england_wales_ni", rules).jurisdictionFromCode, "scotland");
    assert.strictEqual(resolveTaxCode("C1257L", "scotland", rules).jurisdictionFromCode, "england_wales_ni");
  });

  await t.test("K codes are reported unsupported, never approximated", () => {
    const r = resolveTaxCode("K475", "england_wales_ni", rules);
    assert.strictEqual(r.supported, false);
    assert.match(r.reason as string, /not yet supported/);
  });

  await t.test("W1/M1/X markers are reported unsupported, never stripped", () => {
    for (const code of ["1257L W1", "1257LM1", "1257LX"]) {
      const r = resolveTaxCode(code, "england_wales_ni", rules);
      assert.strictEqual(r.supported, false, `${code} should be unsupported`);
      // The critical property: we must never quietly treat it as plain 1257L.
      assert.notStrictEqual(r.allowance, 12570);
    }
  });

  await t.test("unsupported codes surface as a validation message, not a silent fallback", async () => {
    const { outputs } = await calculate(
      "TAX-003",
      { gross: 50000, jurisdiction: "England/Wales/NI", tax_code: "K475", pension_arrangement: "none", student_plan: "None", postgraduate: false },
      CTX
    );
    assert.ok(typeof outputs.validation === "string");
    assert.strictEqual(outputs.tax, undefined);
  });

  await t.test("an unrecognised code is rejected", () => {
    assert.strictEqual(resolveTaxCode("ZZZ", "england_wales_ni", rules).supported, false);
  });

  await t.test("omitting the tax code keeps the tapered personal allowance", async () => {
    // This is the behaviour every pre-existing benchmark relies on.
    const { outputs } = await calculate(
      "TAX-001",
      { income: 110000, jurisdiction: "England/Wales/NI" },
      CTX
    );
    closeTo(outputs.personal_allowance as number, 7570, 0.01);
  });
});

// ---------------------------------------------------------------------------
// Periodic outputs on the wider family
// ---------------------------------------------------------------------------

test("Periodic outputs across the TAX family", async (t: any) => {
  await t.test("TAX-001 omits the hourly equivalent without a working pattern", async () => {
    const withoutHours = await calculate("TAX-001", { income: 40000, jurisdiction: "England/Wales/NI" }, CTX);
    assert.strictEqual(withoutHours.outputs.tax_hourly_equivalent, undefined);
    assert.ok(typeof withoutHours.outputs.tax_monthly === "number");

    const withHours = await calculate(
      "TAX-001",
      { income: 20, income_frequency: "hourly", ...STANDARD_PATTERN, jurisdiction: "England/Wales/NI" },
      CTX
    );
    assert.ok(typeof withHours.outputs.tax_hourly_equivalent === "number");
  });

  await t.test("TAX-004 reports NI per period and states its basis", async () => {
    const { outputs } = await calculate(
      "TAX-004",
      { earnings: 30000, income_frequency: "annual", payroll_frequency: "weekly" },
      CTX
    );
    closeTo(outputs.ni as number, 1394.4, 0.01);
    closeTo(outputs.ni_monthly as number, 1394.4 / 12, 0.01);
    closeTo(outputs.ni_weekly as number, 1394.4 / 52, 0.01);
    assert.strictEqual(outputs.payroll_frequency, "weekly");
    assert.match(outputs.calculation_basis as string, /annual earnings/i);
  });

  await t.test("TAX-020 annualises income and reports periodic repayments", async () => {
    const annual = await calculate("TAX-020", { income: 33000, plan: "Plan 1" }, CTX);
    const monthly = await calculate(
      "TAX-020",
      { income: 2750, income_frequency: "monthly", plan: "Plan 1" },
      CTX
    );
    closeTo(annual.outputs.annual_repayment as number, 549, 0.01);
    closeTo(monthly.outputs.annual_repayment as number, 549, 0.01);
    closeTo(monthly.outputs.repayment_monthly as number, 549 / 12, 0.01);
  });

  await t.test("the ruleset is explicit that the period basis is not applied", () => {
    const ni: any = rules.national_insurance_employee_class1_category_a;
    assert.strictEqual(ni.period_basis_applied, false);
    // The real HMRC period thresholds are recorded for disclosure, and are
    // deliberately not simple divisions of the annual figures.
    assert.strictEqual(ni.period_thresholds_gbp.primary_threshold.weekly, 242);
    assert.strictEqual(ni.period_thresholds_gbp.primary_threshold.monthly, 1048);
    assert.notStrictEqual(ni.period_thresholds_gbp.primary_threshold.weekly * 52, 12570);
  });
});
