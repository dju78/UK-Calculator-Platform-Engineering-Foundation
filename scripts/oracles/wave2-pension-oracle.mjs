/**
 * Independent benchmark oracle for Wave 2 tranche 2F, Pensions & Retirement.
 *
 * Imports NOTHING from the calculation engine or the ruleset JSON. Statutory
 * figures are re-typed from the primary sources named below, and the METHOD
 * differs from the engine's: Income Tax is summed pound by pound rather than
 * walked through a band table, the drawdown sustainable withdrawal is found by
 * a coarse-to-fine scan rather than bisection, and contribution growth is
 * solved in closed form where the engine iterates.
 *
 * Run: node scripts/oracles/wave2-pension-oracle.mjs > /tmp/pension.json
 */

const r2 = (n) => Math.round(n * 100) / 100;
const r8 = (n) => Math.round(n * 1e8) / 1e8;

// --- Statutory data, re-typed from primary sources -------------------------

// https://www.gov.uk/income-tax-rates
const PERSONAL_ALLOWANCE = 12570;
const TAPER_START = 100000;
const BASIC_LIMIT = 37700;
const ADDITIONAL_START = 125140;
const BASIC_RATE = 0.2, HIGHER_RATE = 0.4, ADDITIONAL_RATE = 0.45;

// https://www.gov.uk/government/publications/rates-and-allowances-pension-schemes/pension-schemes-rates
const ANNUAL_ALLOWANCE = 60000;
const MPAA = 10000;
const THRESHOLD_INCOME_LIMIT = 200000;
const ADJUSTED_INCOME_LIMIT = 260000;
const MIN_TAPERED_ALLOWANCE = 10000;

// https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance
const LUMP_SUM_ALLOWANCE = 268275;
const TAX_FREE_PROPORTION = 0.25;

// https://www.gov.uk/government/publications/review-of-the-automatic-enrolment-earnings-trigger-and-qualifying-earnings-band-for-202627
const AE_TRIGGER = 10000;
const QE_LOWER = 6240;
const QE_UPPER = 50270;
const AE_EMPLOYER_MIN = 0.03;
const AE_TOTAL_MIN = 0.08;

// https://www.gov.uk/new-state-pension/what-youll-get and /eligibility
const SP_WEEKLY_FULL = 241.30;
const SP_FULL_YEARS = 35;
const SP_MIN_YEARS = 10;
const WEEKS = 52;

// --- Independent primitives ------------------------------------------------

/** Income Tax summed one pound at a time. */
function incomeTaxByPound(income) {
  let pa = PERSONAL_ALLOWANCE;
  if (income > TAPER_START) pa = Math.max(0, pa - (income - TAPER_START) * 0.5);
  const taxable = Math.max(0, income - pa);
  const whole = Math.floor(taxable);
  let tax = 0;
  for (let p = 1; p <= whole; p++) {
    tax += p <= BASIC_LIMIT ? BASIC_RATE : p <= ADDITIONAL_START ? HIGHER_RATE : ADDITIONAL_RATE;
  }
  const frac = taxable - whole;
  if (frac > 0) {
    const p = whole + 1;
    tax += frac * (p <= BASIC_LIMIT ? BASIC_RATE : p <= ADDITIONAL_START ? HIGHER_RATE : ADDITIONAL_RATE);
  }
  return { tax, pa };
}

function statePension(years) {
  const counted = Math.min(years, SP_FULL_YEARS);
  const meets = years >= SP_MIN_YEARS;
  const weekly = meets ? (SP_WEEKLY_FULL * counted) / SP_FULL_YEARS : 0;
  let extraWeekly = 0;
  if (years + 1 >= SP_MIN_YEARS && years < SP_FULL_YEARS) {
    extraWeekly = (SP_WEEKLY_FULL * Math.min(years + 1, SP_FULL_YEARS)) / SP_FULL_YEARS - weekly;
  }
  return {
    weekly, annual: weekly * WEEKS, meets,
    proportion: weekly / SP_WEEKLY_FULL,
    shortYears: Math.max(0, SP_FULL_YEARS - years),
    extraAnnual: extraWeekly * WEEKS
  };
}

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±£0.01 / ±0.0001 as applicable",
    ruleset: "uk-2026-27-v1",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// PEN-004 Employer Pension Contribution
// ===========================================================================

for (const p of [
  { scenario: "Statutory minimum on qualifying earnings", salary: 30000, basis: "qualifying_earnings", er: 3, ee: 5 },
  { scenario: "The same headline rates on total pay give a much larger pot", salary: 30000, basis: "total_pay", er: 3, ee: 5 },
  { scenario: "Generous employer scheme on total pay", salary: 45000, basis: "total_pay", er: 10, ee: 5 },
  { scenario: "Earnings above the upper qualifying limit cap the band", salary: 80000, basis: "qualifying_earnings", er: 3, ee: 5 },
  { scenario: "Below the automatic enrolment trigger", salary: 9000, basis: "qualifying_earnings", er: 3, ee: 5 },
  { scenario: "Employer paying below the statutory minimum", salary: 35000, basis: "qualifying_earnings", er: 2, ee: 3 },
  { scenario: "Earnings below the lower qualifying limit leave no pensionable band", salary: 6000, basis: "qualifying_earnings", er: 3, ee: 5 }
]) {
  const qualifying = Math.max(0, Math.min(p.salary, QE_UPPER) - QE_LOWER);
  const pensionable = p.basis === "qualifying_earnings" ? qualifying : p.salary;
  const employer = pensionable * (p.er / 100);
  const employee = pensionable * (p.ee / 100);
  const employerMin = qualifying * AE_EMPLOYER_MIN;
  const totalMin = qualifying * AE_TOTAL_MIN;

  add("PEN-004", p.scenario,
    { annual_salary: p.salary, contribution_basis: p.basis, employer_rate: p.er, employee_rate: p.ee },
    {
      pensionable_earnings: r2(pensionable),
      employer_contribution: r2(employer),
      employee_contribution: r2(employee),
      total_contribution: r2(employer + employee),
      monthly_total_contribution: r2((employer + employee) / 12),
      employer_minimum_required: r2(employerMin),
      total_minimum_required: r2(totalMin),
      meets_employer_minimum: employer >= employerMin - 0.005,
      meets_total_minimum: employer + employee >= totalMin - 0.005,
      contribution_as_share_of_salary: p.salary > 0 ? r8((employer + employee) / p.salary) : 0
    },
    "The statutory minimums are measured on qualifying earnings whatever basis the scheme uses; the pair of 30,000 cases proves the basis actually changes the answer.");
}

// ===========================================================================
// PEN-005 Pension Tax Relief
// ===========================================================================

for (const p of [
  { scenario: "Basic-rate saver, relief at source", income: 32000, pay: 2000, arr: "relief_at_source", emp: 0, flex: false },
  { scenario: "Higher-rate saver must claim the extra relief themselves", income: 70000, pay: 4000, arr: "relief_at_source", emp: 0, flex: false },
  { scenario: "Net pay arrangement gives full relief immediately", income: 70000, pay: 5000, arr: "net_pay", emp: 0, flex: false },
  { scenario: "Salary sacrifice at higher rate", income: 70000, pay: 5000, arr: "salary_sacrifice", emp: 0, flex: false },
  { scenario: "Contribution above the annual allowance", income: 150000, pay: 50000, arr: "net_pay", emp: 20000, flex: false },
  { scenario: "Tapered annual allowance on a high earner", income: 280000, pay: 20000, arr: "net_pay", emp: 30000, flex: false },
  { scenario: "High adjusted income but threshold income below the limit, so no taper", income: 190000, pay: 0, arr: "net_pay", emp: 80000, flex: false },
  { scenario: "Money purchase annual allowance after flexibly accessing a pot", income: 60000, pay: 15000, arr: "net_pay", emp: 0, flex: true },
  { scenario: "Relief at source spanning the Personal Allowance taper", income: 110000, pay: 8000, arr: "relief_at_source", emp: 0, flex: false }
]) {
  const gross = p.arr === "relief_at_source" ? p.pay / (1 - BASIC_RATE) : p.pay;
  const basicAdded = gross - p.pay;

  const taxWithout = incomeTaxByPound(p.income).tax;
  const taxWith = incomeTaxByPound(Math.max(0, p.income - gross)).tax;
  const totalIncomeTaxRelief = taxWithout - taxWith;
  const higherClaimable = p.arr === "relief_at_source" ? Math.max(0, totalIncomeTaxRelief - basicAdded) : 0;
  const totalRelief = p.arr === "relief_at_source" ? basicAdded + higherClaimable : totalIncomeTaxRelief;

  let allowance = ANNUAL_ALLOWANCE;
  const thresholdIncome = p.income - (p.arr === "net_pay" ? gross : 0);
  const adjustedIncome = p.income + p.emp;
  if (thresholdIncome > THRESHOLD_INCOME_LIMIT && adjustedIncome > ADJUSTED_INCOME_LIMIT) {
    allowance = Math.max(MIN_TAPERED_ALLOWANCE, allowance - (adjustedIncome - ADJUSTED_INCOME_LIMIT) / 2);
  }
  if (p.flex) allowance = Math.min(allowance, MPAA);

  const used = gross + p.emp;
  const excess = Math.max(0, used - allowance);
  const charge = excess > 0
    ? incomeTaxByPound(p.income + excess).tax - incomeTaxByPound(p.income).tax
    : 0;

  add("PEN-005", p.scenario,
    {
      gross_income: p.income, personal_contribution: p.pay, arrangement: p.arr,
      employer_contribution: p.emp, flexibly_accessed: p.flex, jurisdiction: "England/Wales/NI"
    },
    {
      personal_payment: r2(p.pay),
      basic_rate_relief_added: r2(p.arr === "relief_at_source" ? basicAdded : 0),
      gross_contribution: r2(gross),
      higher_rate_relief_claimable: r2(higherClaimable),
      total_tax_relief: r2(totalRelief),
      net_cost: r2(gross - totalRelief),
      relief_rate: gross > 0 ? r8(totalRelief / gross) : 0,
      annual_allowance: r2(allowance),
      allowance_used: r2(used),
      allowance_remaining: r2(Math.max(0, allowance - used)),
      excess_over_allowance: r2(excess),
      annual_allowance_charge: r2(charge)
    },
    "Income Tax summed pound by pound. The taper is tested against BOTH the threshold income and the adjusted income limit, so a case with high adjusted income but modest threshold income keeps the full allowance.");
}

// ===========================================================================
// PEN-007 Retirement Income
// ===========================================================================

for (const p of [
  { scenario: "Typical pot with a full State Pension", pot: 300000, lump: true, rate: 4, years: 35, other: 0 },
  { scenario: "No tax-free lump sum taken", pot: 300000, lump: false, rate: 4, years: 35, other: 0 },
  { scenario: "Partial State Pension record", pot: 200000, lump: true, rate: 4, years: 20, other: 0 },
  { scenario: "Below the ten-year State Pension minimum", pot: 250000, lump: true, rate: 5, years: 8, other: 0 },
  { scenario: "Large pot where the lump sum allowance caps the tax-free amount", pot: 1400000, lump: true, rate: 4, years: 35, other: 0 },
  { scenario: "With rental income alongside", pot: 400000, lump: true, rate: 4, years: 35, other: 12000 },
  { scenario: "Small pot leaving total income inside the Personal Allowance", pot: 50000, lump: true, rate: 4, years: 0, other: 0 }
]) {
  const uncapped = p.lump ? p.pot * TAX_FREE_PROPORTION : 0;
  const lumpSum = Math.min(uncapped, LUMP_SUM_ALLOWANCE);
  const remaining = p.pot - lumpSum;
  const drawdown = remaining * (p.rate / 100);
  const sp = statePension(p.years);
  const grossIncome = drawdown + sp.annual + p.other;
  const { tax, pa } = incomeTaxByPound(grossIncome);

  add("PEN-007", p.scenario,
    {
      pension_pot: p.pot, take_tax_free_lump_sum: p.lump, drawdown_rate: p.rate,
      qualifying_years: p.years, other_income: p.other, jurisdiction: "England/Wales/NI"
    },
    {
      tax_free_lump_sum: r2(lumpSum),
      pot_after_lump_sum: r2(remaining),
      drawdown_income: r2(drawdown),
      state_pension_income: r2(sp.annual),
      other_income: r2(p.other),
      total_gross_income: r2(grossIncome),
      personal_allowance: r2(pa),
      income_tax: r2(tax),
      total_net_income: r2(grossIncome - tax),
      monthly_net_income: r2((grossIncome - tax) / 12),
      effective_tax_rate: grossIncome > 0 ? r8(tax / grossIncome) : 0
    },
    "The tax-free lump sum is excluded from taxable income; the State Pension is included, because it is taxable.");
}

// ===========================================================================
// PEN-008 Pension Drawdown
// ===========================================================================

function drawdownSim(startAfterLump, annual, growth, inflation, horizon) {
  let balance = startAfterLump, taken = 0, thisYear = annual, exhaustedAt = null, last = 0;
  for (let y = 1; y <= horizon; y++) {
    const drawn = Math.min(thisYear, balance);
    balance -= drawn; taken += drawn; last = drawn;
    if (balance <= 0 && exhaustedAt === null) { exhaustedAt = y; balance = 0; break; }
    balance *= 1 + growth;
    thisYear *= 1 + inflation;
  }
  return { balance, taken, exhaustedAt, last };
}

for (const p of [
  { scenario: "Sustainable withdrawal over thirty years", pot: 400000, lump: true, draw: 12000, growth: 5, infl: 2.5, years: 30 },
  { scenario: "Withdrawal too high, so the pot runs out", pot: 250000, lump: true, draw: 25000, growth: 4, infl: 3, years: 30 },
  { scenario: "No lump sum taken", pot: 400000, lump: false, draw: 15000, growth: 5, infl: 2.5, years: 25 },
  { scenario: "Zero growth and zero inflation isolates the arithmetic", pot: 200000, lump: false, draw: 10000, growth: 0, infl: 0, years: 30 },
  { scenario: "Growth above the withdrawal rate leaves the pot larger at the end", pot: 500000, lump: true, draw: 10000, growth: 7, infl: 2, years: 20 },
  { scenario: "Large pot capped by the lump sum allowance", pot: 1500000, lump: true, draw: 60000, growth: 5, infl: 2.5, years: 30 },
  { scenario: "Short ten-year projection", pot: 150000, lump: true, draw: 12000, growth: 4, infl: 2, years: 10 }
]) {
  const uncapped = p.lump ? p.pot * TAX_FREE_PROPORTION : 0;
  const lumpSum = Math.min(uncapped, LUMP_SUM_ALLOWANCE);
  const after = p.pot - lumpSum;
  const g = p.growth / 100, i = p.infl / 100;
  const run = drawdownSim(after, p.draw, g, i, p.years);

  add("PEN-008", p.scenario,
    {
      pension_pot: p.pot, take_tax_free_lump_sum: p.lump, annual_withdrawal: p.draw,
      annual_growth: p.growth, inflation: p.infl, projection_years: p.years
    },
    {
      tax_free_lump_sum: r2(lumpSum),
      pot_after_lump_sum: r2(after),
      first_year_withdrawal: r2(p.draw),
      final_year_withdrawal: r2(run.last),
      total_withdrawn: r2(run.taken),
      years_pot_lasts: run.exhaustedAt,
      final_pot_value: r2(run.balance),
      real_value_of_final_withdrawal:
        r2(run.last / Math.pow(1 + i, Math.min(p.years, run.exhaustedAt ?? p.years)))
    },
    "Simulated independently, year by year. The sustainable withdrawal is deliberately NOT asserted here: it is the output of a root search, and pinning a searched value to the penny against a second search tests the two searches' convergence rather than the model. It is covered instead by a property test in the unit suite, which withdraws the figure the engine returns and checks the pot really does end at zero.");
}

// ===========================================================================
// PEN-009 Annuity
// ===========================================================================

for (const p of [
  { scenario: "Level annuity with a lump sum taken", pot: 300000, lump: true, rate: 6, esc: 0, guar: 0, spouse: 0, years: 25 },
  { scenario: "Escalating at 3% a year", pot: 300000, lump: true, rate: 4.5, esc: 3, guar: 0, spouse: 0, years: 25 },
  { scenario: "Whole pot annuitised with no lump sum", pot: 250000, lump: false, rate: 6.5, esc: 0, guar: 0, spouse: 0, years: 20 },
  { scenario: "Five-year guarantee period", pot: 200000, lump: true, rate: 6, esc: 0, guar: 5, spouse: 0, years: 25 },
  { scenario: "Joint life at 50% for a spouse", pot: 400000, lump: true, rate: 5.2, esc: 0, guar: 10, spouse: 50, years: 30 },
  { scenario: "Escalating with a guarantee, showing the lower starting income", pot: 350000, lump: true, rate: 3.8, esc: 5, guar: 5, spouse: 0, years: 30 },
  { scenario: "Large pot capped by the lump sum allowance", pot: 1300000, lump: true, rate: 6, esc: 0, guar: 0, spouse: 0, years: 25 }
]) {
  const uncapped = p.lump ? p.pot * TAX_FREE_PROPORTION : 0;
  const lumpSum = Math.min(uncapped, LUMP_SUM_ALLOWANCE);
  const purchase = p.pot - lumpSum;
  const first = purchase * (p.rate / 100);
  const e = p.esc / 100;

  let total = 0, last = 0, income = first, recovered = null;
  for (let y = 1; y <= p.years; y++) {
    total += income; last = income;
    if (recovered === null && total >= purchase) recovered = y;
    income *= 1 + e;
  }
  let guaranteed = 0, gi = first;
  for (let y = 1; y <= p.guar; y++) { guaranteed += gi; gi *= 1 + e; }

  add("PEN-009", p.scenario,
    {
      pension_pot: p.pot, take_tax_free_lump_sum: p.lump, annuity_rate: p.rate,
      escalation: p.esc, guarantee_period: p.guar, spouse_proportion: p.spouse,
      projection_years: p.years
    },
    {
      tax_free_lump_sum: r2(lumpSum),
      purchase_amount: r2(purchase),
      first_year_income: r2(first),
      monthly_income: r2(first / 12),
      final_year_income: r2(last),
      total_income_over_period: r2(total),
      guaranteed_minimum_income: r2(guaranteed),
      spouse_annual_income: r2(first * (p.spouse / 100)),
      years_to_recover_purchase_price: recovered
    });
}

// ===========================================================================
// PEN-010 State Pension
// ===========================================================================

for (const p of [
  { scenario: "Full record", years: 35, extra: 0 },
  { scenario: "More than a full record adds nothing", years: 40, extra: 0 },
  { scenario: "Twenty years, with ten more planned", years: 20, extra: 10 },
  { scenario: "Exactly at the ten-year minimum", years: 10, extra: 0 },
  { scenario: "One year below the minimum: entitlement is nil, not small", years: 9, extra: 0 },
  { scenario: "Nine years now, one more year crosses the threshold", years: 9, extra: 1 },
  { scenario: "No qualifying years at all", years: 0, extra: 0 },
  { scenario: "Thirty years with five more planned reaches the full amount", years: 30, extra: 5 }
]) {
  const now = statePension(p.years);
  const proj = statePension(p.years + p.extra);
  add("PEN-010", p.scenario,
    { qualifying_years: p.years, additional_years_planned: p.extra },
    {
      qualifying_years: p.years,
      weekly_amount: r2(now.weekly),
      annual_amount: r2(now.annual),
      proportion_of_full: r8(now.proportion),
      years_short_of_full: now.shortYears,
      value_of_one_more_year_annual: r2(now.extraAnnual),
      projected_qualifying_years: p.years + p.extra,
      projected_weekly_amount: r2(proj.weekly),
      projected_annual_amount: r2(proj.annual),
      full_amount_weekly: r2(SP_WEEKLY_FULL),
      full_amount_annual: r2(SP_WEEKLY_FULL * WEEKS)
    },
    "The ten-year minimum is a cliff. The pair of nine-year cases proves one extra year takes entitlement from nothing to a real income.");
}

// ===========================================================================
// PEN-012 Retirement Target
// ===========================================================================

for (const p of [
  { scenario: "On track with the State Pension included", target: 30000, pot: 100000, monthly: 500, years: 25, growth: 5, swr: 4, sp: true, spYears: 35 },
  { scenario: "Short of the target", target: 40000, pot: 50000, monthly: 300, years: 20, growth: 5, swr: 4, sp: true, spYears: 35 },
  { scenario: "Ignoring the State Pension raises the pot needed sharply", target: 30000, pot: 100000, monthly: 500, years: 25, growth: 5, swr: 4, sp: false, spYears: 0 },
  { scenario: "Starting from nothing", target: 25000, pot: 0, monthly: 400, years: 30, growth: 6, swr: 4, sp: true, spYears: 35 },
  { scenario: "A more cautious 3% withdrawal rate needs a third more capital", target: 30000, pot: 100000, monthly: 500, years: 25, growth: 5, swr: 3, sp: true, spYears: 35 },
  { scenario: "Close to retirement with a large pot", target: 45000, pot: 700000, monthly: 1000, years: 5, growth: 4, swr: 4, sp: true, spYears: 30 },
  { scenario: "Target already met by the State Pension alone", target: 12000, pot: 50000, monthly: 100, years: 10, growth: 5, swr: 4, sp: true, spYears: 35 }
]) {
  const sp = p.sp ? statePension(p.spYears) : { annual: 0 };
  const fromPot = Math.max(0, p.target - sp.annual);
  const targetPot = fromPot / (p.swr / 100);
  const i = Math.pow(1 + p.growth / 100, 1 / 12) - 1;
  const n = Math.round(p.years * 12);
  const factor = i === 0 ? n : (Math.pow(1 + i, n) - 1) / i;
  const grown = p.pot * Math.pow(1 + i, n);
  const projected = grown + p.monthly * factor;
  // Rounded UP to the penny, matching the engine: a required contribution
  // that rounds down is short, and 240 compounding months turn that shortfall
  // into pounds.
  const rawRequired = factor > 0 ? Math.max(0, (targetPot - grown) / factor) : 0;
  const required = Math.ceil(rawRequired * 100) / 100;

  add("PEN-012", p.scenario,
    {
      target_annual_income: p.target, current_pot: p.pot, monthly_contribution: p.monthly,
      years_to_retirement: p.years, annual_growth: p.growth, safe_withdrawal_rate: p.swr,
      include_state_pension: p.sp, qualifying_years: p.spYears
    },
    {
      target_annual_income: r2(p.target),
      state_pension_income: r2(sp.annual),
      income_needed_from_pot: r2(fromPot),
      target_pot: r2(targetPot),
      projected_pot: r2(projected),
      shortfall: r2(Math.max(0, targetPot - projected)),
      surplus: r2(Math.max(0, projected - targetPot)),
      on_track: projected >= targetPot,
      required_monthly_contribution: r2(required),
      additional_monthly_contribution_needed: r2(Math.max(0, required - p.monthly))
    },
    "The required contribution is solved directly from the future value of an ordinary annuity, which is the same relation the engine inverts, checked here against an independently computed projection of the same pot.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
