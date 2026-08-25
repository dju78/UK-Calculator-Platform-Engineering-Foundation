/**
 * Independent benchmark oracle for Wave 2 tranches 2D (ISA & tax wrappers)
 * and 2E (UK Tax & Salary).
 *
 * Imports NOTHING from the calculation engine or from the ruleset JSON.
 *
 * Two forms of independence are used deliberately:
 *
 *   1. Statutory tables are re-typed here from the primary sources named in
 *      each comment. Agreement with the engine therefore corroborates the
 *      RULESET DATA as well as the arithmetic, instead of merely re-reading
 *      the same JSON twice.
 *
 *   2. The METHOD differs from the engine's. Where the engine uses band
 *      tables, this oracle sums tax pound by pound and looks the marginal
 *      rate up for each one. Where the engine iterates month by month, this
 *      oracle solves the same recurrence in closed form. A shared algebraic
 *      slip therefore cannot pass unnoticed in both.
 *
 * Run: node scripts/oracles/wave2-isa-tax-oracle.mjs > /tmp/isa-tax.json
 */

const r2 = (n) => Math.round(n * 100) / 100;
const r8 = (n) => Math.round(n * 1e8) / 1e8;

// ===========================================================================
// Statutory data, re-typed from primary sources
// ===========================================================================

// https://www.gov.uk/income-tax-rates  and
// https://www.gov.uk/government/publications/rates-and-allowances-income-tax
const PERSONAL_ALLOWANCE = 12570;
const TAPER_START = 100000;
const TAPER_RATE = 0.5;
const BASIC_LIMIT = 37700;      // taxable income
const ADDITIONAL_START = 125140; // taxable income
const BASIC_RATE = 0.2;
const HIGHER_RATE = 0.4;
const ADDITIONAL_RATE = 0.45;

// https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
const NI_PT = 12570;
const NI_UEL = 50270;
const NI_MAIN = 0.08;
const NI_UPPER = 0.02;

// https://www.gov.uk/repaying-your-student-loan/what-you-pay
const STUDENT_PLANS = {
  "Plan 1": { threshold: 26900, rate: 0.09 },
  "Plan 2": { threshold: 29385, rate: 0.09 },
  "Plan 4": { threshold: 33795, rate: 0.09 },
  "Plan 5": { threshold: 25000, rate: 0.09 }
};
const PG_THRESHOLD = 21000;
const PG_RATE = 0.06;

// https://www.gov.uk/tax-on-dividends
const DIV_ALLOWANCE = 500;
const DIV_BASIC = 0.1075;
const DIV_HIGHER = 0.3575;
const DIV_ADDITIONAL = 0.3935;

// https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances
const CGT_AEA = 3000;
const CGT_BASIC = 0.18;
const CGT_HIGHER = 0.24;

// https://www.gov.uk/individual-savings-accounts and https://www.gov.uk/lifetime-isa
const ISA_LIMIT = 20000;
const LISA_LIMIT = 4000;
const LISA_BONUS_RATE = 0.25;
const LISA_MAX_BONUS = 1000;
const LISA_CHARGE = 0.25;
const LISA_PROPERTY_CAP = 450000;
const JISA_LIMIT = 9000;
const JISA_MATURITY = 18;

// https://www.gov.uk/apply-tax-free-interest-on-savings
const PSA = { basic: 1000, higher: 500, additional: 0 };
const STARTING_RATE_BAND = 5000;

// https://www.gov.uk/marriage-allowance
const MA_TRANSFER = 1260;
const MA_MAX_BENEFIT = 252;

// https://www.gov.uk/inheritance-tax
const NRB = 325000;
const RNRB = 175000;
const RNRB_TAPER_FROM = 2000000;
const RNRB_TAPER_RATE = 0.5;
const IHT_RATE = 0.4;
const IHT_CHARITY_RATE = 0.36;
const IHT_CHARITY_PROPORTION = 0.1;

// https://www.gov.uk/self-employed-national-insurance-rates
const CLASS2_WEEKLY = 3.65;
const SPT = 7105;
const CLASS4_LPL = 12570;
const CLASS4_UPL = 50270;
const CLASS4_MAIN = 0.06;
const CLASS4_UPPER = 0.02;

// https://www.gov.uk/corporation-tax-rates
const CT_SMALL_RATE = 0.19;
const CT_SMALL_LIMIT = 50000;
const CT_MAIN_RATE = 0.25;
const CT_MAIN_LIMIT = 250000;
const CT_MR_FRACTION = 3 / 200;

// https://www.gov.uk/understand-self-assessment-bill/payments-on-account
const POA_THRESHOLD = 1000;

// ===========================================================================
// Independent primitives: pound-by-pound summation
// ===========================================================================

/**
 * Income Tax by summing one pound at a time and looking up the marginal rate
 * for each pound. Deliberately NOT a band-table walk, so a band-boundary error
 * in the engine cannot be reproduced here by construction.
 *
 * `fixedAllowance` models a tax code that pins the allowance (used by the
 * Marriage Allowance transferor).
 */
function incomeTaxByPound(income, fixedAllowance = null) {
  let pa = fixedAllowance;
  if (pa === null) {
    pa = PERSONAL_ALLOWANCE;
    if (income > TAPER_START) pa = Math.max(0, pa - (income - TAPER_START) * TAPER_RATE);
  }
  const taxable = Math.max(0, income - pa);
  const whole = Math.floor(taxable);
  let tax = 0;
  for (let p = 1; p <= whole; p++) {
    tax += p <= BASIC_LIMIT ? BASIC_RATE : p <= ADDITIONAL_START ? HIGHER_RATE : ADDITIONAL_RATE;
  }
  // Any fractional pound left over sits at the rate of the next whole pound.
  const frac = taxable - whole;
  if (frac > 0) {
    const p = whole + 1;
    tax += frac * (p <= BASIC_LIMIT ? BASIC_RATE : p <= ADDITIONAL_START ? HIGHER_RATE : ADDITIONAL_RATE);
  }
  return { tax, personalAllowance: pa, taxable };
}

/** Employee Class 1 National Insurance, pound by pound. */
function niByPound(earnings) {
  const whole = Math.floor(earnings);
  let ni = 0;
  for (let p = NI_PT + 1; p <= whole; p++) {
    ni += p <= NI_UEL ? NI_MAIN : NI_UPPER;
  }
  const frac = earnings - whole;
  if (frac > 0 && whole >= NI_PT) {
    ni += frac * (whole + 1 <= NI_UEL ? NI_MAIN : NI_UPPER);
  }
  return ni;
}

function studentLoan(income, plan, postgraduate) {
  let sl = 0, pg = 0;
  const p = STUDENT_PLANS[plan];
  if (p && income > p.threshold) sl = (income - p.threshold) * p.rate;
  if (postgraduate && income > PG_THRESHOLD) pg = (income - PG_THRESHOLD) * PG_RATE;
  return { sl, pg };
}

/** Full PAYE position, built only from the primitives above. */
function paye(gross, plan = "None", postgraduate = false) {
  const { tax, personalAllowance } = incomeTaxByPound(gross);
  const ni = niByPound(gross);
  const { sl, pg } = studentLoan(gross, plan, postgraduate);
  return { gross, tax, ni, sl, pg, net: gross - tax - ni - sl - pg, personalAllowance };
}

// ===========================================================================
// Closed-form solutions to the engine's recurrences
// ===========================================================================

/**
 * Solve v_k = v_{k-1} * f + m for n steps in closed form.
 * The engine reaches the same value by iterating; this does not.
 */
function recurrence(v0, f, m, n) {
  if (f === 1) return v0 + m * n;
  return v0 * Math.pow(f, n) + m * ((Math.pow(f, n) - 1) / (f - 1));
}

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario,
    inputs,
    expected,
    tolerance: "±£0.01 / ±0.0001 as applicable",
    ruleset: "uk-2026-27-v1",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// ISA-003 ISA vs General Investment Account
// ===========================================================================

function bandOf(income) {
  if (income > ADDITIONAL_START) return "additional";
  if (income > BASIC_LIMIT + PERSONAL_ALLOWANCE) return "higher";
  return "basic";
}

function isaVsGiaOracle({ initial, monthly, growth, dy, years, income }) {
  const gm = Math.pow(1 + growth / 100, 1 / 12) - 1;
  const dm = dy / 100 / 12;
  const f = (1 + gm) * (1 + dm);
  const n = Math.round(years * 12);

  // v_{k} = v_{k-1} * f + monthly, so v_{k-1} = A f^{k-1} - B.
  const B = f === 1 ? 0 : monthly / (f - 1);
  const A = initial + B;

  const finalValue = recurrence(initial, f, monthly, n);
  const contributions = initial + monthly * n;

  // Dividend declared in month k is v_{k-1} * (1+gm) * dm.
  const dividendAt = (k) => ((f === 1 ? initial + monthly * (k - 1) : A * Math.pow(f, k - 1) - B)) * (1 + gm) * dm;

  let totalDividends = 0;
  for (let k = 1; k <= n; k++) totalDividends += dividendAt(k);

  const basis = initial + monthly * n + totalDividends;

  const band = bandOf(income);
  const divRate = band === "basic" ? DIV_BASIC : band === "higher" ? DIV_HIGHER : DIV_ADDITIONAL;

  // Dividend tax settled once per twelve months.
  let dividendTax = 0, yearsExceeded = 0;
  for (let start = 0; start < n; start += 12) {
    let yearTotal = 0;
    for (let k = start + 1; k <= Math.min(start + 12, n); k++) yearTotal += dividendAt(k);
    const taxable = Math.max(0, yearTotal - DIV_ALLOWANCE);
    if (taxable > 0) yearsExceeded++;
    dividendTax += taxable * divRate;
  }

  const gain = Math.max(0, finalValue - basis);
  const taxableGain = Math.max(0, gain - CGT_AEA);
  const taxableIncome = Math.max(0, income - PERSONAL_ALLOWANCE);
  const basicRemaining = Math.max(0, BASIC_LIMIT - taxableIncome);
  const atBasic = Math.min(taxableGain, basicRemaining);
  const cgt = atBasic * CGT_BASIC + (taxableGain - atBasic) * CGT_HIGHER;

  return {
    finalValue, contributions, totalDividends, basis, gain,
    dividendTax, cgt, yearsExceeded,
    advantage: cgt + dividendTax
  };
}

for (const p of [
  { scenario: "Basic-rate saver, ten years, modest yield", initial: 10000, monthly: 200, growth: 6, dy: 2, years: 10, income: 35000 },
  { scenario: "Higher-rate saver, twenty years", initial: 20000, monthly: 500, growth: 7, dy: 3, years: 20, income: 70000 },
  { scenario: "Lump sum only, no contributions", initial: 50000, monthly: 0, growth: 5, dy: 4, years: 15, income: 45000 },
  { scenario: "No dividend yield, so the ISA advantage is capital gains only", initial: 15000, monthly: 300, growth: 8, dy: 0, years: 12, income: 60000 },
  { scenario: "Additional-rate saver", initial: 100000, monthly: 1000, growth: 6, dy: 3.5, years: 10, income: 200000 },
  { scenario: "Short term where the gain stays inside the annual exempt amount", initial: 5000, monthly: 50, growth: 4, dy: 1, years: 3, income: 30000 }
]) {
  const o = isaVsGiaOracle(p);
  add("ISA-003", p.scenario,
    { initial_investment: p.initial, monthly_contribution: p.monthly, annual_growth: p.growth,
      dividend_yield: p.dy, years: p.years, other_income: p.income },
    {
      final_gross_value: r2(o.finalValue),
      total_contributions: r2(o.contributions),
      total_dividends: r2(o.totalDividends),
      cost_basis: r2(o.basis),
      capital_gain: r2(o.gain),
      isa_net_proceeds: r2(o.finalValue),
      gia_dividend_tax: r2(o.dividendTax),
      gia_capital_gains_tax: r2(o.cgt),
      gia_net_proceeds: r2(o.finalValue - o.cgt),
      isa_advantage: r2(o.advantage),
      years_dividend_allowance_exceeded: o.yearsExceeded
    },
    "Monthly recurrence solved in closed form; the engine iterates.");
}

// ===========================================================================
// ISA-004 Lifetime ISA
// ===========================================================================

for (const p of [
  { scenario: "Maximum contributions, first home, within the price cap", bal: 0, contrib: 4000, growth: 5, years: 5, purpose: "first_home", price: 250000 },
  { scenario: "Maximum contributions, first home ABOVE the price cap so the charge applies", bal: 0, contrib: 4000, growth: 5, years: 5, purpose: "first_home", price: 500000 },
  { scenario: "Non-qualifying withdrawal shows the 6.25% loss of own money", bal: 0, contrib: 4000, growth: 0, years: 1, purpose: "other", price: 0 },
  { scenario: "Contribution above the limit is capped and earns no extra bonus", bal: 2000, contrib: 6000, growth: 4, years: 10, purpose: "age_60", price: 0 },
  { scenario: "Long run to age 60 with an opening balance", bal: 12000, contrib: 3000, growth: 6, years: 20, purpose: "age_60", price: 0 },
  { scenario: "Zero growth isolates contributions and bonus", bal: 0, contrib: 2000, growth: 0, years: 8, purpose: "first_home", price: 300000 }
]) {
  const allowed = Math.min(p.contrib, LISA_LIMIT);
  const bonus = Math.min(allowed * LISA_BONUS_RATE, LISA_MAX_BONUS);
  const G = 1 + p.growth / 100;
  const n = Math.round(p.years);
  // v_y = (v_{y-1} + allowed + bonus) * G  ->  closed form.
  const value = G === 1
    ? p.bal + (allowed + bonus) * n
    : p.bal * Math.pow(G, n) + (allowed + bonus) * G * (Math.pow(G, n) - 1) / (G - 1);
  const contributions = allowed * n;
  const bonusTotal = bonus * n;

  const chargeFree = p.purpose === "first_home" || p.purpose === "age_60" || p.purpose === "terminal_illness";
  const withinCap = p.purpose === "first_home" && p.price > 0 ? p.price <= LISA_PROPERTY_CAP : null;
  const chargeApplies = !chargeFree || withinCap === false;
  const charge = chargeApplies ? value * LISA_CHARGE : 0;

  add("ISA-004", p.scenario,
    { current_balance: p.bal, annual_contribution: p.contrib, annual_growth: p.growth,
      years: p.years, withdrawal_purpose: p.purpose, property_price: p.price },
    {
      total_contributions: r2(contributions),
      total_bonus: r2(bonusTotal),
      final_value: r2(value),
      investment_growth: r2(value - p.bal - contributions - bonusTotal),
      withdrawal_charge: r2(charge),
      net_withdrawal: r2(value - charge),
      own_money_lost_to_charge: r2(Math.max(0, charge - bonusTotal)),
      charge_applies: chargeApplies
    },
    "Annual recurrence solved in closed form; the engine iterates.");
}

// ===========================================================================
// ISA-005 Junior ISA
// ===========================================================================

for (const p of [
  { scenario: "Newborn, full allowance, eighteen years", bal: 0, contrib: 9000, growth: 6, age: 0 },
  { scenario: "Ten-year-old, modest contributions", bal: 3000, contrib: 1200, growth: 5, age: 10 },
  { scenario: "Contribution above the limit is capped", bal: 0, contrib: 12000, growth: 4, age: 5 },
  { scenario: "Final year before maturity", bal: 20000, contrib: 9000, growth: 3, age: 17 },
  { scenario: "Zero growth isolates the contributions", bal: 1000, contrib: 500, growth: 0, age: 8 },
  { scenario: "Existing pot with no further contributions", bal: 15000, contrib: 0, growth: 7, age: 4 }
]) {
  const allowed = Math.min(p.contrib, JISA_LIMIT);
  const G = 1 + p.growth / 100;
  const n = JISA_MATURITY - p.age;
  const value = G === 1
    ? p.bal + allowed * n
    : p.bal * Math.pow(G, n) + allowed * G * (Math.pow(G, n) - 1) / (G - 1);

  add("ISA-005", p.scenario,
    { current_balance: p.bal, annual_contribution: p.contrib, annual_growth: p.growth, child_age: p.age },
    {
      years_to_maturity: n,
      total_contributions: r2(allowed * n),
      final_value: r2(value),
      investment_growth: r2(value - p.bal - allowed * n),
      monthly_equivalent: r2(allowed / 12)
    },
    "Annual recurrence solved in closed form; the engine iterates.");
}

// ===========================================================================
// ISA-006 Cash ISA
// ===========================================================================

function cashIsaOracle({ opening, monthly, rate, years, income }) {
  const i = Math.pow(1 + rate / 100, 1 / 12) - 1;
  const n = Math.round(years * 12);
  const band = bandOf(income);
  const psa = PSA[band];
  const startingBand = Math.max(0, STARTING_RATE_BAND - Math.max(0, income - PERSONAL_ALLOWANCE));
  const marginal = band === "basic" ? BASIC_RATE : band === "higher" ? HIGHER_RATE : ADDITIONAL_RATE;

  // ISA side: one closed-form solution of the whole recurrence.
  const isaValue = recurrence(opening, 1 + i, monthly, n);
  const isaInterest = isaValue - opening - monthly * n;

  // Taxable side: closed form within each tax year, tax deducted at year end.
  let taxValue = opening, taxGross = 0, taxPaid = 0;
  let done = 0;
  while (done < n) {
    const steps = Math.min(12, n - done);
    const start = taxValue;
    const end = recurrence(start, 1 + i, monthly, steps);
    const interest = end - start - monthly * steps;
    taxGross += interest;
    const taxable = Math.max(0, Math.max(0, interest - startingBand) - psa);
    const due = taxable * marginal;
    taxPaid += due;
    taxValue = end - due;
    done += steps;
  }

  return { isaValue, isaInterest, taxValue, taxGross, taxPaid, psa, startingBand, band };
}

for (const p of [
  { scenario: "Basic-rate saver whose interest stays inside the Personal Savings Allowance", opening: 5000, monthly: 100, rate: 4, years: 5, income: 35000 },
  { scenario: "Basic-rate saver with a large balance, so the allowance is exceeded", opening: 60000, monthly: 500, rate: 4.5, years: 10, income: 35000 },
  { scenario: "Higher-rate saver with the smaller allowance", opening: 40000, monthly: 300, rate: 5, years: 8, income: 70000 },
  { scenario: "Additional-rate saver with no allowance at all", opening: 50000, monthly: 0, rate: 4, years: 5, income: 200000 },
  { scenario: "Low earner benefiting from the starting rate for savings", opening: 80000, monthly: 0, rate: 5, years: 3, income: 13000 },
  { scenario: "Contributions only, no opening balance", opening: 0, monthly: 1000, rate: 3.5, years: 12, income: 45000 }
]) {
  const o = cashIsaOracle(p);
  add("ISA-006", p.scenario,
    { opening_balance: p.opening, monthly_contribution: p.monthly, annual_rate: p.rate,
      years: p.years, other_income: p.income },
    {
      isa_final_value: r2(o.isaValue),
      isa_interest: r2(o.isaInterest),
      taxable_final_value: r2(o.taxValue),
      taxable_gross_interest: r2(o.taxGross),
      tax_paid_on_savings: r2(o.taxPaid),
      isa_advantage: r2(o.isaValue - o.taxValue),
      personal_savings_allowance: r2(o.psa),
      starting_rate_band_available: r2(o.startingBand),
      income_tax_band: o.band
    },
    "Monthly recurrence solved in closed form per tax year; the engine iterates.");
}

// ===========================================================================
// TAX-005 Salary Sacrifice
// ===========================================================================

for (const p of [
  { scenario: "Basic-rate, 5% sacrifice, 3% employer", salary: 32000, sac: 5, emp: 3, plan: "None", pg: false },
  { scenario: "Higher-rate, 10% sacrifice", salary: 70000, sac: 10, emp: 5, plan: "None", pg: false },
  { scenario: "Sacrifice that restores the Personal Allowance", salary: 110000, sac: 10, emp: 0, plan: "None", pg: false },
  { scenario: "With a Plan 2 student loan", salary: 45000, sac: 8, emp: 4, plan: "Plan 2", pg: false },
  { scenario: "No sacrifice at all leaves take-home unchanged", salary: 40000, sac: 0, emp: 3, plan: "None", pg: false },
  { scenario: "Sacrifice below the National Insurance primary threshold", salary: 20000, sac: 20, emp: 3, plan: "None", pg: false },
  { scenario: "Additional-rate with a postgraduate loan", salary: 150000, sac: 15, emp: 6, plan: "Plan 2", pg: true }
]) {
  const sacrificed = p.salary * (p.sac / 100);
  const post = p.salary - sacrificed;
  const before = paye(p.salary, p.plan, p.pg);
  const after = paye(post, p.plan, p.pg);
  const employer = post * (p.emp / 100);
  const total = sacrificed + employer;
  const reduction = before.net - after.net;

  add("TAX-005", p.scenario,
    { gross_salary: p.salary, sacrifice_percentage: p.sac, employer_contribution_percentage: p.emp,
      jurisdiction: "England/Wales/NI", student_plan: p.plan, postgraduate: p.pg },
    {
      sacrificed_amount: r2(sacrificed),
      post_sacrifice_salary: r2(post),
      pension_contribution: r2(sacrificed),
      employer_contribution: r2(employer),
      total_into_pension: r2(total),
      take_home_before: r2(before.net),
      take_home_after: r2(after.net),
      take_home_reduction: r2(reduction),
      income_tax_saved: r2(before.tax - after.tax),
      national_insurance_saved: r2(before.ni - after.ni),
      student_loan_saved: r2(before.sl + before.pg - after.sl - after.pg),
      total_tax_saved: r2(sacrificed - reduction),
      cost_per_pound_in_pension: total > 0 ? r8(reduction / total) : 0
    },
    "Income Tax and National Insurance summed pound by pound; the engine walks band tables.");
}

// ===========================================================================
// TAX-006 / TAX-007 Pay frequency conversion
// ===========================================================================

for (const p of [
  { scenario: "Full-time 37.5 hours, 52 weeks", rate: 15, hours: 37.5, weeks: 52, days: 5 },
  { scenario: "Part-time 20 hours", rate: 12.5, hours: 20, weeks: 52, days: 3 },
  { scenario: "Term-time only, 39 paid weeks", rate: 14, hours: 32.5, weeks: 39, days: 5 },
  { scenario: "Four-day week", rate: 22, hours: 30, weeks: 52, days: 4 },
  { scenario: "Long-hours contract", rate: 18.75, hours: 48, weeks: 48, days: 6 },
  { scenario: "Low hourly rate, short week", rate: 11.44, hours: 16, weeks: 52, days: 2 }
]) {
  const annual = p.rate * p.hours * p.weeks;
  const expected = {
    annual_salary: r2(annual),
    monthly_salary: r2(annual / 12),
    weekly_pay: r2(annual / p.weeks),
    daily_pay: r2(annual / p.weeks / p.days),
    hourly_rate: r2(annual / (p.hours * p.weeks)),
    annual_hours: r2(p.hours * p.weeks)
  };
  add("TAX-006", p.scenario,
    { hourly_rate: p.rate, hours_per_week: p.hours, paid_weeks_per_year: p.weeks, days_per_week: p.days },
    expected);

  // TAX-007 is the exact inverse on the same pattern: feeding the annual
  // figure back must return the hourly rate that produced it.
  add("TAX-007", p.scenario + " (inverse)",
    { annual_salary: r2(annual), hours_per_week: p.hours, paid_weeks_per_year: p.weeks, days_per_week: p.days },
    expected);
}

// ===========================================================================
// TAX-008 Overtime Pay
// ===========================================================================

for (const p of [
  { scenario: "Time and a half on eight hours", rate: 15, std: 37.5, ot: 8, otm: 1.5, ph: 0, pm: 2, periods: 52 },
  { scenario: "Time and a half plus double time", rate: 12, std: 40, ot: 6, otm: 1.5, ph: 4, pm: 2, periods: 52 },
  { scenario: "No overtime worked", rate: 20, std: 35, ot: 0, otm: 1.5, ph: 0, pm: 2, periods: 52 },
  { scenario: "Overtime at plain time", rate: 11.5, std: 37.5, ot: 10, otm: 1, ph: 0, pm: 2, periods: 52 },
  { scenario: "Monthly paid, heavy overtime", rate: 18, std: 160, ot: 30, otm: 1.5, ph: 10, pm: 2, periods: 12 },
  { scenario: "Double time only", rate: 25, std: 30, ot: 0, otm: 1.5, ph: 12, pm: 2, periods: 52 }
]) {
  const base = p.rate * p.std;
  const ot = p.rate * p.otm * p.ot;
  const prem = p.rate * p.pm * p.ph;
  const total = base + ot + prem;
  const hours = p.std + p.ot + p.ph;
  add("TAX-008", p.scenario,
    { base_hourly_rate: p.rate, standard_hours: p.std, overtime_hours: p.ot,
      overtime_multiplier: p.otm, premium_hours: p.ph, premium_multiplier: p.pm,
      pay_periods_per_year: p.periods },
    {
      base_pay: r2(base),
      overtime_pay: r2(ot),
      premium_overtime_pay: r2(prem),
      total_pay: r2(total),
      total_hours: r2(hours),
      blended_hourly_rate: r2(total / hours),
      overtime_hourly_rate: r2(p.rate * p.otm),
      premium_hourly_rate: r2(p.rate * p.pm),
      annualised_total: r2(total * p.periods),
      overtime_share_of_pay: r8((ot + prem) / total)
    });
}

// ===========================================================================
// TAX-009 Bonus Tax
// ===========================================================================

for (const p of [
  { scenario: "Basic-rate bonus", salary: 30000, bonus: 3000, pension: 0, plan: "None", pg: false },
  { scenario: "Bonus that crosses into higher rate", salary: 48000, bonus: 6000, pension: 0, plan: "None", pg: false },
  { scenario: "Bonus inside the Personal Allowance taper, giving a 60% effective rate", salary: 99000, bonus: 10000, pension: 0, plan: "None", pg: false },
  { scenario: "Half the bonus sacrificed into a pension", salary: 60000, bonus: 10000, pension: 50, plan: "None", pg: false },
  { scenario: "With a Plan 2 student loan", salary: 40000, bonus: 5000, pension: 0, plan: "Plan 2", pg: false },
  { scenario: "Additional-rate bonus", salary: 140000, bonus: 20000, pension: 0, plan: "None", pg: false },
  { scenario: "Whole bonus into the pension leaves nothing taxable", salary: 50000, bonus: 8000, pension: 100, plan: "None", pg: false }
]) {
  const pension = p.bonus * (p.pension / 100);
  const taxableBonus = p.bonus - pension;
  const without = paye(p.salary, p.plan, p.pg);
  const withB = paye(p.salary + taxableBonus, p.plan, p.pg);
  const taxOn = withB.tax - without.tax;
  const niOn = withB.ni - without.ni;
  const slOn = withB.sl + withB.pg - without.sl - without.pg;
  const totalDed = taxOn + niOn + slOn;

  add("TAX-009", p.scenario,
    { annual_salary: p.salary, bonus: p.bonus, pension_from_bonus_percentage: p.pension,
      jurisdiction: "England/Wales/NI", student_plan: p.plan, postgraduate: p.pg },
    {
      bonus: r2(p.bonus),
      pension_from_bonus: r2(pension),
      taxable_bonus: r2(taxableBonus),
      income_tax_on_bonus: r2(taxOn),
      national_insurance_on_bonus: r2(niOn),
      student_loan_on_bonus: r2(slOn),
      total_deductions_on_bonus: r2(totalDed),
      net_bonus: r2(taxableBonus - totalDed),
      effective_rate_on_bonus: p.bonus > 0 ? r8(totalDed / p.bonus) : 0,
      personal_allowance_lost: r2(without.personalAllowance - withB.personalAllowance)
    },
    "Computed as the difference between two independent full-year positions.");
}

// ===========================================================================
// TAX-010 Marriage Allowance
// ===========================================================================

for (const p of [
  { scenario: "Classic case: non-earner and a basic-rate earner", lower: 0, higher: 35000 },
  { scenario: "Lower earner with income below the allowance", lower: 8000, higher: 40000 },
  { scenario: "Lower earner just under the allowance, so transferring costs them tax", lower: 12000, higher: 30000 },
  { scenario: "Recipient is a higher-rate taxpayer, so the couple does not qualify", lower: 5000, higher: 60000 },
  { scenario: "Lower earner is above the Personal Allowance, so there is nothing to transfer", lower: 20000, higher: 45000 },
  { scenario: "Neither pays tax, so there is no benefit", lower: 4000, higher: 10000 },
  { scenario: "Recipient close to the higher-rate threshold but still basic rate", lower: 2000, higher: 50000 }
]) {
  const transferorBefore = incomeTaxByPound(p.lower).tax;
  const recipientBefore = incomeTaxByPound(p.higher).tax;

  let reason = null;
  if (p.lower > p.higher) reason = "swap";
  else if (p.lower > PERSONAL_ALLOWANCE) reason = "no unused allowance";
  else if (p.higher <= PERSONAL_ALLOWANCE) reason = "recipient pays no tax";
  else if (p.higher > BASIC_LIMIT + PERSONAL_ALLOWANCE) reason = "recipient not basic rate";
  const eligible = reason === null;

  const transferorAfter = eligible
    ? incomeTaxByPound(p.lower, PERSONAL_ALLOWANCE - MA_TRANSFER).tax
    : transferorBefore;
  const reducer = eligible ? Math.min(MA_TRANSFER * BASIC_RATE, recipientBefore) : 0;
  const recipientAfter = recipientBefore - reducer;

  add("TAX-010", p.scenario,
    { lower_earner_income: p.lower, higher_earner_income: p.higher, jurisdiction: "England/Wales/NI" },
    {
      eligible,
      transferable_allowance: MA_TRANSFER,
      transferor_tax_before: r2(transferorBefore),
      transferor_tax_after: r2(transferorAfter),
      recipient_tax_before: r2(recipientBefore),
      recipient_tax_after: r2(recipientAfter),
      household_tax_before: r2(transferorBefore + recipientBefore),
      household_tax_after: r2(transferorAfter + recipientAfter),
      household_benefit: r2(transferorBefore + recipientBefore - transferorAfter - recipientAfter),
      maximum_possible_benefit: MA_MAX_BENEFIT
    },
    "The recipient side is modelled as a tax reducer, not an allowance increase.");
}

// ===========================================================================
// TAX-011 Dividend Tax
// ===========================================================================

function dividendOracle(other, dividends) {
  const total = other + dividends;
  let pa = PERSONAL_ALLOWANCE;
  if (total > TAPER_START) pa = Math.max(0, pa - (total - TAPER_START) * TAPER_RATE);

  const paAgainstOther = Math.min(other, pa);
  const paAgainstDiv = Math.min(dividends, pa - paAgainstOther);
  const taxableOther = other - paAgainstOther;
  const taxableDiv = dividends - paAgainstDiv;

  // Stack the dividends pound by pound on top of the non-dividend taxable
  // income, consuming the nil-rate allowance first as each pound is placed.
  const whole = Math.floor(taxableDiv);
  let allowanceLeft = Math.min(taxableDiv, DIV_ALLOWANCE);
  let atBasic = 0, atHigher = 0, atAdditional = 0, tax = 0;

  const place = (amount, position) => {
    const rate = position <= BASIC_LIMIT ? DIV_BASIC : position <= ADDITIONAL_START ? DIV_HIGHER : DIV_ADDITIONAL;
    const free = Math.min(amount, allowanceLeft);
    allowanceLeft -= free;
    const taxed = amount - free;
    if (position <= BASIC_LIMIT) atBasic += taxed;
    else if (position <= ADDITIONAL_START) atHigher += taxed;
    else atAdditional += taxed;
    tax += taxed * rate;
  };

  for (let k = 1; k <= whole; k++) place(1, taxableOther + k);
  const frac = taxableDiv - whole;
  if (frac > 0) place(frac, taxableOther + whole + 1);

  return {
    pa, paAgainstDiv,
    divAllowanceUsed: Math.min(taxableDiv, DIV_ALLOWANCE),
    atBasic, atHigher, atAdditional, tax
  };
}

for (const p of [
  { scenario: "Small dividend fully inside the allowance", other: 30000, dividends: 400, jurisdiction: "England/Wales/NI" },
  { scenario: "Basic-rate dividends above the allowance", other: 20000, dividends: 5000, jurisdiction: "England/Wales/NI" },
  { scenario: "Dividends straddling basic and higher rate", other: 40000, dividends: 20000, jurisdiction: "England/Wales/NI" },
  { scenario: "Director on a small salary with large dividends", other: 12570, dividends: 50000, jurisdiction: "England/Wales/NI" },
  { scenario: "Dividends in the Personal Allowance taper", other: 95000, dividends: 20000, jurisdiction: "England/Wales/NI" },
  { scenario: "Additional-rate dividends", other: 130000, dividends: 30000, jurisdiction: "England/Wales/NI" },
  { scenario: "No other income, so part of the Personal Allowance covers the dividends", other: 0, dividends: 18000, jurisdiction: "England/Wales/NI" },
  { scenario: "Scottish taxpayer pays UK rates on dividends because the tax is reserved", other: 40000, dividends: 20000, jurisdiction: "Scotland" }
]) {
  const o = dividendOracle(p.other, p.dividends);
  // For the Scottish case only the reserved dividend figures are asserted:
  // the earnings side uses devolved bands that this oracle deliberately does
  // not re-type, and asserting it would prove nothing about the reservation.
  const expected = {
    personal_allowance: r2(o.pa),
    personal_allowance_against_dividends: r2(o.paAgainstDiv),
    dividend_allowance_used: r2(o.divAllowanceUsed),
    dividends_taxed_at_basic: r2(o.atBasic),
    dividends_taxed_at_higher: r2(o.atHigher),
    dividends_taxed_at_additional: r2(o.atAdditional),
    dividend_tax: r2(o.tax),
    net_dividends: r2(p.dividends - o.tax),
    effective_rate_on_dividends: p.dividends > 0 ? r8(o.tax / p.dividends) : 0
  };
  add("TAX-011", p.scenario,
    { other_income: p.other, dividend_income: p.dividends, jurisdiction: p.jurisdiction },
    expected,
    p.jurisdiction === "Scotland"
      ? "Asserts only the reserved dividend figures. A Scottish taxpayer must get the SAME dividend tax as an English one on identical income, which is what this case proves."
      : "Dividends stacked pound by pound on top of other taxable income.");
}

// ===========================================================================
// TAX-012 Capital Gains Tax
// ===========================================================================

for (const p of [
  { scenario: "Gain fully covered by the annual exempt amount", proceeds: 12000, cost: 9500, costs: 0, losses: 0, income: 30000 },
  { scenario: "Basic-rate taxpayer with room in the band", proceeds: 50000, cost: 20000, costs: 1000, losses: 0, income: 25000 },
  { scenario: "Gain straddling the basic and higher rate bands", proceeds: 100000, cost: 40000, costs: 2000, losses: 0, income: 40000 },
  { scenario: "Higher-rate taxpayer, whole gain at 24%", proceeds: 80000, cost: 30000, costs: 0, losses: 0, income: 80000 },
  { scenario: "Losses brought in reduce the gain before the exempt amount", proceeds: 60000, cost: 30000, costs: 1500, losses: 10000, income: 35000 },
  { scenario: "A loss on the disposal, so no tax is due", proceeds: 15000, cost: 25000, costs: 500, losses: 0, income: 40000 },
  { scenario: "Losses exceed the gain and are carried forward", proceeds: 40000, cost: 30000, costs: 0, losses: 25000, income: 30000 }
]) {
  const gross = p.proceeds - p.cost - p.costs;
  const lossesApplied = gross > 0 ? Math.min(p.losses, gross) : 0;
  const after = gross - lossesApplied;
  const aeaUsed = Math.max(0, Math.min(after, CGT_AEA));
  const taxable = Math.max(0, after - aeaUsed);
  const taxableIncome = Math.max(0, p.income - PERSONAL_ALLOWANCE);
  const basicRemaining = Math.max(0, BASIC_LIMIT - taxableIncome);

  // Pound-by-pound placement of the gain on top of taxable income.
  const whole = Math.floor(taxable);
  let atBasic = 0, atHigher = 0, tax = 0;
  for (let k = 1; k <= whole; k++) {
    if (taxableIncome + k <= BASIC_LIMIT) { atBasic += 1; tax += CGT_BASIC; }
    else { atHigher += 1; tax += CGT_HIGHER; }
  }
  const frac = taxable - whole;
  if (frac > 0) {
    if (taxableIncome + whole + 1 <= BASIC_LIMIT) { atBasic += frac; tax += frac * CGT_BASIC; }
    else { atHigher += frac; tax += frac * CGT_HIGHER; }
  }

  add("TAX-012", p.scenario,
    { disposal_proceeds: p.proceeds, acquisition_cost: p.cost, costs: p.costs,
      allowable_losses: p.losses, other_taxable_income: p.income },
    {
      gross_gain: r2(gross),
      total_costs: r2(p.cost + p.costs),
      losses_applied: r2(lossesApplied),
      annual_exempt_amount_used: r2(aeaUsed),
      taxable_gain: r2(taxable),
      gain_taxed_at_basic_rate: r2(atBasic),
      gain_taxed_at_higher_rate: r2(atHigher),
      basic_rate_band_remaining: r2(basicRemaining),
      capital_gains_tax: r2(tax),
      net_proceeds: r2(p.proceeds - p.cost - p.costs - tax),
      unused_losses_carried_forward: r2(Math.max(0, p.losses - lossesApplied))
    },
    "The gain is placed pound by pound on top of taxable income.");
}

// ===========================================================================
// TAX-014 Inheritance Tax
// ===========================================================================

for (const p of [
  { scenario: "Estate below the nil rate band", estate: 300000, property: 0, charity: 0, tnrb: 0, trnrb: 0 },
  { scenario: "Estate above the nil rate band with no residence relief", estate: 600000, property: 0, charity: 0, tnrb: 0, trnrb: 0 },
  { scenario: "Home left to children, so the residence nil rate band applies", estate: 700000, property: 400000, charity: 0, tnrb: 0, trnrb: 0 },
  { scenario: "Widow with a fully transferred nil rate band and residence band", estate: 950000, property: 500000, charity: 0, tnrb: 100, trnrb: 100 },
  { scenario: "Large estate where the residence band is tapered away entirely", estate: 2400000, property: 600000, charity: 0, tnrb: 0, trnrb: 0 },
  { scenario: "Estate partially tapered", estate: 2200000, property: 500000, charity: 0, tnrb: 0, trnrb: 0 },
  { scenario: "Ten per cent to charity brings the rate down to 36%", estate: 800000, property: 0, charity: 50000, tnrb: 0, trnrb: 0 },
  { scenario: "Charitable gift just below the ten per cent test", estate: 800000, property: 0, charity: 40000, tnrb: 0, trnrb: 0 }
]) {
  const transferredNrb = NRB * (p.tnrb / 100);
  const baseRnrb = RNRB * (1 + p.trnrb / 100);
  const cappedRnrb = Math.min(baseRnrb, p.property);
  const taper = Math.max(0, p.estate - RNRB_TAPER_FROM) * RNRB_TAPER_RATE;
  const rnrb = Math.max(0, cappedRnrb - taper);
  const allowances = NRB + transferredNrb + rnrb;
  const taxable = Math.max(0, p.estate - p.charity - allowances);
  const baseline = Math.max(0, p.estate - allowances);
  const reduced = baseline > 0 && p.charity >= baseline * IHT_CHARITY_PROPORTION;
  const rate = reduced ? IHT_CHARITY_RATE : IHT_RATE;
  const tax = taxable * rate;

  add("TAX-014", p.scenario,
    { estate_value: p.estate, property_to_direct_descendants: p.property, charitable_gifts: p.charity,
      transferred_nil_rate_band_percentage: p.tnrb, transferred_residence_nil_rate_band_percentage: p.trnrb },
    {
      gross_estate: r2(p.estate),
      nil_rate_band: NRB,
      transferred_nil_rate_band: r2(transferredNrb),
      residence_nil_rate_band: r2(rnrb),
      total_allowances: r2(allowances),
      taxable_estate: r2(taxable),
      rate_applied: rate,
      reduced_charity_rate_applies: reduced,
      inheritance_tax: r2(tax),
      estate_to_beneficiaries: r2(p.estate - p.charity - tax),
      effective_rate_on_estate: p.estate > 0 ? r8(tax / p.estate) : 0
    });
}

// ===========================================================================
// TAX-016 / TAX-017 Self-employment and sole trader
// ===========================================================================

function selfEmployedOracle({ turnover, expenses, capital, other }) {
  const profit = Math.max(0, turnover - expenses - capital);
  const totalIncome = profit + other;
  const { tax, personalAllowance } = incomeTaxByPound(totalIncome);

  // Class 4 pound by pound on profits alone.
  const whole = Math.floor(profit);
  let class4 = 0;
  for (let p = CLASS4_LPL + 1; p <= whole; p++) {
    class4 += p <= CLASS4_UPL ? CLASS4_MAIN : CLASS4_UPPER;
  }
  const frac = profit - whole;
  if (frac > 0 && whole >= CLASS4_LPL) {
    class4 += frac * (whole + 1 <= CLASS4_UPL ? CLASS4_MAIN : CLASS4_UPPER);
  }

  const class2TreatedAsPaid = profit >= SPT;
  const totalDue = tax + class4;
  const poaRequired = totalDue >= POA_THRESHOLD;
  const poaEach = poaRequired ? totalDue / 2 : 0;

  return { profit, totalIncome, tax, class4, personalAllowance, class2TreatedAsPaid, totalDue, poaEach, poaRequired };
}

const seCases = [
  { scenario: "Profit below the Personal Allowance and the small profits threshold", turnover: 9000, expenses: 3000, capital: 0, other: 0 },
  { scenario: "Typical sole trader", turnover: 55000, expenses: 15000, capital: 2000, other: 0 },
  { scenario: "Profit at the Class 4 upper limit", turnover: 60000, expenses: 9730, capital: 0, other: 0 },
  { scenario: "High profit into the additional rate", turnover: 200000, expenses: 40000, capital: 10000, other: 0 },
  { scenario: "Trader with employment income alongside", turnover: 30000, expenses: 8000, capital: 0, other: 35000 },
  { scenario: "Profit just under the payments on account threshold", turnover: 20000, expenses: 4000, capital: 0, other: 0 },
  { scenario: "Expenses exceed turnover, so profit is nil", turnover: 12000, expenses: 15000, capital: 0, other: 0 }
];

for (const p of seCases) {
  const o = selfEmployedOracle(p);
  add("TAX-016", p.scenario,
    { turnover: p.turnover, allowable_expenses: p.expenses, capital_allowances: p.capital,
      other_income: p.other, jurisdiction: "England/Wales/NI" },
    {
      taxable_profit: r2(o.profit),
      total_income: r2(o.totalIncome),
      personal_allowance: r2(o.personalAllowance),
      income_tax: r2(o.tax),
      class_2_national_insurance: 0,
      class_4_national_insurance: r2(o.class4),
      total_national_insurance: r2(o.class4),
      total_tax_and_national_insurance: r2(o.totalDue),
      net_profit_after_tax: r2(o.profit - o.totalDue),
      effective_rate: o.profit > 0 ? r8(o.totalDue / o.profit) : 0,
      voluntary_class_2_annual_cost: o.class2TreatedAsPaid ? 0 : r2(CLASS2_WEEKLY * 52),
      payment_on_account_each: r2(o.poaEach),
      first_payment_due: r2(o.totalDue + o.poaEach)
    },
    "Income Tax and Class 4 National Insurance summed pound by pound.");

  add("TAX-017", p.scenario,
    { turnover: p.turnover, allowable_expenses: p.expenses, capital_allowances: p.capital,
      other_income: p.other, jurisdiction: "England/Wales/NI" },
    {
      turnover: r2(p.turnover),
      allowable_expenses: r2(p.expenses),
      capital_allowances: r2(p.capital),
      gross_profit: r2(p.turnover - p.expenses),
      taxable_profit: r2(o.profit),
      profit_margin: p.turnover > 0 ? r8((p.turnover - p.expenses - p.capital) / p.turnover) : 0,
      income_tax: r2(o.tax),
      class_4_national_insurance: r2(o.class4),
      total_tax_and_national_insurance: r2(o.totalDue),
      net_profit_after_tax: r2(o.profit - o.totalDue),
      monthly_take_home: r2((o.profit - o.totalDue) / 12),
      effective_rate: o.profit > 0 ? r8(o.totalDue / o.profit) : 0,
      payment_on_account_each: r2(o.poaEach),
      first_payment_due: r2(o.totalDue + o.poaEach)
    },
    "Same independent tax computation, expressed from turnover rather than profit.");
}

// ===========================================================================
// TAX-018 Corporation Tax
// ===========================================================================

for (const p of [
  { scenario: "Profit at the small profits rate", profit: 40000, assoc: 0, months: 12 },
  { scenario: "Profit exactly at the small profits limit", profit: 50000, assoc: 0, months: 12 },
  { scenario: "Profit inside the marginal relief band", profit: 100000, assoc: 0, months: 12 },
  { scenario: "Profit exactly at the main rate limit", profit: 250000, assoc: 0, months: 12 },
  { scenario: "Profit above the main rate limit", profit: 400000, assoc: 0, months: 12 },
  { scenario: "One associated company halves both limits", profit: 40000, assoc: 1, months: 12 },
  { scenario: "Six-month accounting period halves both limits", profit: 30000, assoc: 0, months: 6 },
  { scenario: "Three associated companies and a nine-month period", profit: 20000, assoc: 3, months: 9 }
]) {
  const divisor = p.assoc + 1;
  const proration = p.months / 12;
  const lower = (CT_SMALL_LIMIT / divisor) * proration;
  const upper = (CT_MAIN_LIMIT / divisor) * proration;

  let tax, relief = 0, band, marginal;
  if (p.profit <= lower) {
    tax = p.profit * CT_SMALL_RATE; band = "Small profits rate"; marginal = CT_SMALL_RATE;
  } else if (p.profit >= upper) {
    tax = p.profit * CT_MAIN_RATE; band = "Main rate"; marginal = CT_MAIN_RATE;
  } else {
    relief = CT_MR_FRACTION * (upper - p.profit);
    tax = p.profit * CT_MAIN_RATE - relief;
    band = "Marginal relief"; marginal = CT_MAIN_RATE + CT_MR_FRACTION;
  }

  add("TAX-018", p.scenario,
    { taxable_profit: p.profit, associated_companies: p.assoc, accounting_period_months: p.months },
    {
      taxable_profit: r2(p.profit),
      small_profits_limit_applied: r2(lower),
      main_rate_limit_applied: r2(upper),
      rate_band: band,
      marginal_relief: r2(relief),
      corporation_tax: r2(tax),
      effective_rate: p.profit > 0 ? r8(tax / p.profit) : 0,
      marginal_rate_on_next_pound: r8(marginal),
      profit_after_tax: r2(p.profit - tax)
    },
    "The marginal relief fraction is derived from the two published boundary conditions, not copied from a secondary source.");
}

// ===========================================================================

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases (minimum 5).`);
}
