/**
 * Independent benchmark oracle for Wave 2 Mortgages & Property.
 *
 * Imports nothing from the calculation engine or the ruleset. Statutory bands
 * are re-typed here from the primary sources named in each comment, so that
 * agreement with the engine corroborates BOTH the arithmetic and the ruleset
 * data rather than merely re-reading the same JSON.
 */

const r2 = (n) => Math.round(n * 100) / 100;

// --- Independent amortisation primitives ------------------------------------

/** Level payment by bisection on the simulated closing balance. */
function pmtByBisection(principal, ratePct, years) {
  const r = ratePct / 100 / 12, n = Math.round(years * 12);
  if (principal === 0) return 0;
  if (r === 0) return principal / n;
  const closing = (p) => { let b = principal; for (let i = 0; i < n; i++) b = b * (1 + r) - p; return b; };
  let lo = 0, hi = principal * (1 + r);
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (closing(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/** Balance after k payments, by explicit simulation. */
function balanceAfterSim(principal, ratePct, years, k) {
  const r = ratePct / 100 / 12;
  const pmt = pmtByBisection(principal, ratePct, years);
  let b = principal;
  for (let i = 0; i < k; i++) b = Math.max(0, b * (1 + r) - pmt);
  return b;
}

/** Total interest by simulation. */
function totalInterestSim(principal, ratePct, years, pmt) {
  const r = ratePct / 100 / 12, n = Math.round(years * 12);
  let b = principal, interest = 0;
  for (let i = 0; i < n; i++) { const int = b * r; interest += int; b = b + int - pmt; }
  return interest;
}

/** Payoff months and interest with a regular overpayment, by simulation. */
function overpaymentSim(principal, ratePct, years, extra) {
  const r = ratePct / 100 / 12, n = Math.round(years * 12);
  const pmt = pmtByBisection(principal, ratePct, years);
  let b = principal, interest = 0, months = 0;
  for (let i = 0; i < n && b > 1e-9; i++) {
    const int = b * r;
    let pay = pmt + extra;
    if (pay > b + int) pay = b + int;
    interest += int;
    b = b + int - pay;
    if (b < 0.005) b = 0;
    months++;
  }
  return { months, interest };
}

// --- Statutory band tables, re-typed from primary sources -------------------
// SDLT (England & NI): gov.uk/stamp-duty-land-tax/residential-property-rates
const SDLT_STANDARD = [[125000, 0], [250000, 0.02], [925000, 0.05], [1500000, 0.10], [Infinity, 0.12]];
const SDLT_FTB = [[300000, 0], [500000, 0.05]];
const SDLT_FTB_CEILING = 500000;
const SDLT_ADDITIONAL_SURCHARGE = 0.05;

// LBTT (Scotland): revenue.scot residential property + ADS pages
const LBTT_STANDARD = [[145000, 0], [250000, 0.02], [325000, 0.05], [750000, 0.10], [Infinity, 0.12]];
const LBTT_FTB_NIL_BAND = 175000;
const ADS_RATE = 0.08;
const ADS_MINIMUM = 40000;

// LTT (Wales): gov.wales, higher rates effective 11 December 2024
const LTT_MAIN = [[225000, 0], [400000, 0.06], [750000, 0.075], [1500000, 0.10], [Infinity, 0.12]];
const LTT_HIGHER = [[180000, 0.05], [250000, 0.085], [400000, 0.10], [750000, 0.125], [1500000, 0.15], [Infinity, 0.17]];

/** Slice a price through a [upperBound, rate] band table. */
function bandTax(price, table) {
  let tax = 0, previous = 0;
  for (const [upper, rate] of table) {
    if (price <= previous) break;
    const slice = Math.min(price, upper) - previous;
    if (slice > 0) tax += slice * rate;
    previous = upper;
  }
  return tax;
}

function sdlt(price, { ftb = false, additional = false, nonResident = false } = {}) {
  let base = ftb && !additional && price <= SDLT_FTB_CEILING
    ? bandTax(price, SDLT_FTB)
    : bandTax(price, SDLT_STANDARD);
  let surcharge = 0;
  if (additional) surcharge += price * SDLT_ADDITIONAL_SURCHARGE;
  if (nonResident) surcharge += price * 0.02;
  return base + surcharge;
}

function lbtt(price, { ftb = false, additional = false } = {}) {
  let base;
  if (ftb && !additional) {
    // First-time buyer relief raises the nil-rate band to 175,000.
    base = 0; let previous = LBTT_FTB_NIL_BAND;
    for (const [upper, rate] of LBTT_STANDARD) {
      if (upper <= LBTT_FTB_NIL_BAND) continue;
      if (price <= previous) break;
      base += (Math.min(price, upper) - previous) * rate;
      previous = upper;
    }
  } else {
    base = bandTax(price, LBTT_STANDARD);
  }
  const ads = additional && price >= ADS_MINIMUM ? price * ADS_RATE : 0;
  return base + ads;
}

function ltt(price, { additional = false } = {}) {
  return bandTax(price, additional ? LTT_HIGHER : LTT_MAIN);
}

// --- Fixtures ---------------------------------------------------------------

const fixtures = {};
const add = (id, scenario, inputs, expected, note) => {
  (fixtures[id] ??= []).push({
    scenario, inputs, expected,
    tolerance: "±£0.01 / ±0.0001 as applicable",
    ruleset: "uk-2026-27-v1",
    note: note ?? "Independently derived: simulation/bisection and band tables re-typed from primary sources."
  });
};

// ---------------------------------------------------------------- PRO-005 ---
for (const [scenario, balance, rate, years, extra] of [
  ["£200 overpayment", 180000, 4.5, 20, 200],
  ["No overpayment", 180000, 4.5, 20, 0],
  ["£500 overpayment", 250000, 5.25, 25, 500],
  ["Zero rate", 120000, 0, 10, 100],
  ["Large overpayment", 90000, 3.75, 15, 1000]
]) {
  const base = overpaymentSim(balance, rate, years, 0);
  const withExtra = overpaymentSim(balance, rate, years, extra);
  const pmt = pmtByBisection(balance, rate, years);
  add("PRO-005", scenario,
    { balance, annual_rate: rate, remaining_years: years, monthly_overpayment: extra },
    {
      current_monthly_payment: r2(pmt),
      original_payoff_months: base.months,
      new_payoff_months: withExtra.months,
      months_saved: base.months - withExtra.months,
      interest_saved: r2(base.interest - withExtra.interest),
      new_total_interest: r2(withExtra.interest)
    });
}

// ---------------------------------------------------------------- PRO-006 ---
for (const [scenario, balance, curRate, curYears, newRate, newYears, fees] of [
  ["Lower rate same term", 200000, 5.5, 20, 4.2, 20, 999],
  ["Lower rate longer term", 200000, 5.5, 20, 4.2, 25, 999],
  ["No fees", 150000, 6.0, 15, 4.5, 15, 0],
  ["Higher new rate", 100000, 3.0, 10, 5.0, 10, 500],
  ["Zero rate remortgage", 80000, 4.0, 10, 0, 10, 0]
]) {
  const curPmt = pmtByBisection(balance, curRate, curYears);
  const curMonths = Math.round(curYears * 12);
  const curInterest = curPmt * curMonths - balance;
  const financed = balance + fees;
  const newPmt = pmtByBisection(financed, newRate, newYears);
  const newMonths = Math.round(newYears * 12);
  const newInterest = newPmt * newMonths - financed;
  const saving = curPmt - newPmt;
  add("PRO-006", scenario,
    { balance, current_rate: curRate, current_remaining_years: curYears, new_rate: newRate, new_term_years: newYears, fees },
    {
      current_monthly_payment: r2(curPmt),
      new_monthly_payment: r2(newPmt),
      monthly_saving: r2(saving),
      new_total_interest: r2(newInterest),
      total_interest_change: r2(newInterest - curInterest),
      break_even_months: saving > 0 ? Math.ceil(fees / saving) : null
    });
}

// ---------------------------------------------------------------- PRO-007 ---
for (const [scenario, balance, rate, years] of [
  ["Standard interest-only", 200000, 4.5, 25],
  ["Low rate", 300000, 2.5, 20],
  ["Zero rate", 150000, 0, 15],
  ["High rate", 100000, 8, 10],
  ["Short term", 250000, 5, 5]
]) {
  const r = rate / 100 / 12, months = Math.round(years * 12);
  const interestPayment = balance * r;
  const repaymentPmt = pmtByBisection(balance, rate, years);
  add("PRO-007", scenario,
    { balance, annual_rate: rate, years },
    {
      monthly_interest_payment: r2(interestPayment),
      total_interest_over_term: r2(interestPayment * months),
      balance_at_end_of_term: r2(balance),
      repayment_equivalent_payment: r2(repaymentPmt),
      monthly_difference: r2(repaymentPmt - interestPayment)
    });
}

// ---------------------------------------------------------------- PRO-009 ---
for (const [scenario, balance, rate, years, increase, income] of [
  ["Plus 2 points", 200000, 4.5, 20, 2, 4000],
  ["Plus 3 points", 250000, 3.5, 25, 3, 5000],
  ["No change", 180000, 5, 20, 0, 4500],
  ["Rate falls", 180000, 5, 20, -1, 4500],
  ["No income supplied", 300000, 4, 30, 2, undefined]
]) {
  const cur = pmtByBisection(balance, rate, years);
  const stressed = pmtByBisection(balance, rate + increase, years);
  const inputs = { balance, current_rate: rate, remaining_years: years, rate_increase: increase };
  if (income !== undefined) inputs.gross_monthly_income = income;
  add("PRO-009", scenario, inputs, {
    current_monthly_payment: r2(cur),
    stressed_monthly_payment: r2(stressed),
    monthly_increase: r2(stressed - cur),
    annual_increase: r2((stressed - cur) * 12),
    payment_to_income_stressed: income ? stressed / income : null
  });
}

// ---------------------------------------------------------------- PRO-012 ---
for (const [scenario, value, balance, maxLtv] of [
  ["Typical equity", 350000, 180000, 85],
  ["High equity", 500000, 100000, 85],
  ["Negative equity", 200000, 220000, 85],
  ["No mortgage", 300000, 0, 85],
  ["Low max LTV", 400000, 150000, 60]
]) {
  add("PRO-012", scenario,
    { property_value: value, mortgage_balance: balance, max_ltv: maxLtv },
    {
      equity: r2(value - balance),
      equity_percentage: (value - balance) / value,
      ltv: balance / value,
      available_to_borrow: r2(Math.max(0, value * (maxLtv / 100) - balance))
    });
}

// ---------------------------------------------------------------- PRO-014 ---
for (const [scenario, income, multiple, proposed, weeks] of [
  ["Standard 30x rule", 3000, 30, 1000, 5],
  ["No proposed rent", 4000, 30, undefined, 5],
  ["Stricter multiple", 3000, 36, 900, 5],
  ["Six week deposit", 2500, 30, 800, 6],
  ["High income", 8000, 30, 2200, 5]
]) {
  const annual = income * 12;
  const affordable = annual / multiple;
  const rent = proposed ?? affordable;
  const deposit = ((rent * 12) / 52) * weeks;
  const inputs = { gross_monthly_income: income, income_multiple: multiple, deposit_weeks: weeks };
  if (proposed !== undefined) inputs.proposed_rent = proposed;
  add("PRO-014", scenario, inputs, {
    affordable_rent_by_ratio: r2(affordable),
    annual_income_required: r2(rent * multiple),
    rent_to_income: rent / income,
    deposit_required: r2(deposit),
    upfront_cost: r2(deposit + rent)
  });
}

// ---------------------------------------------------------------- PRO-021 ---
for (const [scenario, rent, vacancy, costs, mortgage, cash] of [
  ["Positive cash flow", 1300, 5, 3000, 700, 90000],
  ["Negative cash flow", 900, 10, 4000, 800, 60000],
  ["No mortgage", 1000, 5, 2000, 0, 200000],
  ["Full occupancy", 1200, 0, 2500, 650, 75000],
  ["High vacancy", 1500, 20, 3500, 900, 100000]
]) {
  const gross = rent * 12;
  const effective = gross * (1 - vacancy / 100);
  const annualMortgage = mortgage * 12;
  const net = effective - costs - annualMortgage;
  add("PRO-021", scenario,
    { monthly_rent: rent, vacancy, annual_costs: costs, monthly_mortgage_payment: mortgage, cash_invested: cash },
    {
      annual_gross_rent: r2(gross),
      annual_effective_rent: r2(effective),
      annual_mortgage_cost: r2(annualMortgage),
      net_annual_cash_flow: r2(net),
      net_monthly_cash_flow: r2(net / 12),
      cash_on_cash_return: cash > 0 ? net / cash : null
    });
}

// ---------------------------------------------------------------- PRO-022 ---
for (const [scenario, value, growth, years, inflation] of [
  ["Steady growth", 300000, 3, 10, 0],
  ["With inflation", 300000, 3, 10, 2.5],
  ["Zero growth", 250000, 0, 5, 0],
  ["Falling prices", 400000, -2, 5, 2],
  ["Long horizon", 200000, 4, 25, 2]
]) {
  const final = value * Math.pow(1 + growth / 100, years);
  const real = final / Math.pow(1 + inflation / 100, years);
  add("PRO-022", scenario,
    { initial_value: value, annual_growth: growth, years, inflation },
    {
      final_value: r2(final),
      total_growth: r2(final - value),
      total_growth_percentage: final / value - 1,
      real_final_value: r2(real),
      real_total_growth_percentage: real / value - 1
    });
}

// -------------------------------------------- PRO-024 / 025 / 026 / 027 -----
// First-time buyer SDLT
for (const [scenario, price] of [
  ["Under 300k - no tax", 250000],
  ["At 300k threshold", 300000],
  ["Between 300k and 500k", 400000],
  ["At the 500k ceiling", 500000],
  ["Above ceiling - relief lost", 600000]
]) {
  add("PRO-024", scenario, { price }, {
    tax: r2(sdlt(price, { ftb: true })),
    effective_rate: price > 0 ? sdlt(price, { ftb: true }) / price : null
  });
}

// Additional property SDLT
for (const [scenario, price] of [
  ["Small additional property", 150000],
  ["Typical buy-to-let", 250000],
  ["Mid value", 400000],
  ["High value", 1000000],
  ["Very high value", 2000000]
]) {
  const total = sdlt(price, { additional: true });
  add("PRO-025", scenario, { price }, {
    tax: r2(total),
    base_tax: r2(bandTax(price, SDLT_STANDARD)),
    surcharge: r2(price * SDLT_ADDITIONAL_SURCHARGE),
    effective_rate: total / price
  });
}

// Scotland LBTT
for (const [scenario, price, opts] of [
  ["Below nil rate", 140000, {}],
  ["Standard purchase", 300000, {}],
  ["First-time buyer", 200000, { first_time_buyer: true }],
  ["Additional dwelling", 250000, { additional_property: true }],
  ["High value", 800000, {}]
]) {
  const total = lbtt(price, { ftb: opts.first_time_buyer, additional: opts.additional_property });
  add("PRO-026", scenario, { price, ...opts }, {
    tax: r2(total),
    effective_rate: price > 0 ? total / price : null
  });
}

// Wales LTT
for (const [scenario, price, opts] of [
  ["Below nil rate", 200000, {}],
  ["Standard purchase", 300000, {}],
  ["Higher rate additional property", 300000, { additional_property: true }],
  ["High value main residence", 800000, {}],
  ["Very high value", 1600000, {}]
]) {
  const total = ltt(price, { additional: opts.additional_property });
  add("PRO-027", scenario, { price, ...opts }, {
    tax: r2(total),
    effective_rate: price > 0 ? total / price : null
  });
}

// ---------------------------------------------------------------- PRO-015 ---
// Rent vs buy: the oracle re-implements both sides independently.
for (const [scenario, p] of [
  ["Ten year hold", { price: 300000, deposit: 60000, mrate: 4.5, myears: 25, maint: 1, growth: 3, rent: 1200, rentInc: 2, invReturn: 5, held: 10, ftb: false }],
  ["Short hold favours renting", { price: 300000, deposit: 60000, mrate: 4.5, myears: 25, maint: 1, growth: 0, rent: 1200, rentInc: 0, invReturn: 5, held: 3, ftb: false }],
  ["First-time buyer", { price: 280000, deposit: 40000, mrate: 4.2, myears: 30, maint: 1, growth: 3, rent: 1100, rentInc: 2, invReturn: 4, held: 10, ftb: true }],
  ["No growth no returns", { price: 250000, deposit: 50000, mrate: 4, myears: 25, maint: 1, growth: 0, rent: 1000, rentInc: 0, invReturn: 0, held: 5, ftb: false }],
  ["Long hold favours buying", { price: 300000, deposit: 60000, mrate: 4.5, myears: 25, maint: 1, growth: 4, rent: 1300, rentInc: 3, invReturn: 4, held: 20, ftb: false }]
]) {
  const tax = sdlt(p.price, { ftb: p.ftb });
  const mortgage = p.price - p.deposit;
  const pmt = pmtByBisection(mortgage, p.mrate, p.myears);
  const months = Math.round(p.held * 12);
  let value = p.price, maint = 0, rent = p.rent, rentPaid = 0;
  for (let y = 0; y < p.held; y++) {
    maint += value * (p.maint / 100);
    value *= 1 + p.growth / 100;
    rentPaid += rent * 12;
    rent *= 1 + p.rentInc / 100;
  }
  const bal = balanceAfterSim(mortgage, p.mrate, p.myears, months);
  const costBuying = p.deposit + tax + pmt * months + maint;
  const netBuy = (value - bal) - costBuying;
  const pot = (p.deposit + tax) * Math.pow(1 + p.invReturn / 100, p.held);
  const netRent = pot - (p.deposit + tax) - rentPaid;
  add("PRO-015", scenario,
    { property_price: p.price, deposit: p.deposit, mortgage_rate: p.mrate, mortgage_years: p.myears,
      maintenance_pct: p.maint, property_growth: p.growth, monthly_rent: p.rent,
      rent_increase: p.rentInc, investment_return: p.invReturn, years_held: p.held,
      first_time_buyer: p.ftb, jurisdiction: "england_ni" },
    {
      purchase_tax: r2(tax),
      total_cost_of_renting: r2(rentPaid),
      total_cost_of_buying: r2(costBuying),
      property_value_at_end: r2(value),
      equity_at_end: r2(value - bal),
      net_position_buying: r2(netBuy),
      net_position_renting: r2(netRent),
      difference: r2(netBuy - netRent)
    });
}

// ---------------------------------------------------------------- PRO-017 ---
for (const [scenario, p] of [
  ["Interest-only BTL", { price: 250000, deposit: 75000, rate: 4.5, years: 25, io: true, rent: 1300, vac: 5, costs: 3000, other: 2000 }],
  ["Repayment BTL", { price: 250000, deposit: 75000, rate: 4.5, years: 25, io: false, rent: 1300, vac: 5, costs: 3000, other: 2000 }],
  ["No mortgage", { price: 200000, deposit: 200000, rate: 0, years: 25, io: true, rent: 1000, vac: 5, costs: 2500, other: 1500 }],
  ["High vacancy", { price: 300000, deposit: 90000, rate: 5, years: 25, io: true, rent: 1500, vac: 20, costs: 4000, other: 2500 }],
  ["Low yield", { price: 500000, deposit: 150000, rate: 4, years: 25, io: true, rent: 1800, vac: 5, costs: 5000, other: 4000 }]
]) {
  const tax = sdlt(p.price, { additional: true });
  const mortgage = p.price - p.deposit;
  const r = p.rate / 100 / 12;
  const monthly = mortgage === 0 ? 0 : (p.io ? mortgage * r : pmtByBisection(mortgage, p.rate, p.years));
  const gross = p.rent * 12;
  const effective = gross * (1 - p.vac / 100);
  const noi = effective - p.costs;
  const cashIn = p.deposit + tax + p.other;
  const cf = noi - monthly * 12;
  add("PRO-017", scenario,
    { price: p.price, deposit: p.deposit, mortgage_rate: p.rate, mortgage_years: p.years,
      interest_only: p.io, monthly_rent: p.rent, vacancy: p.vac, annual_costs: p.costs,
      other_purchase_costs: p.other, jurisdiction: "england_ni" },
    {
      annual_gross_rent: r2(gross),
      annual_effective_rent: r2(effective),
      net_operating_income: r2(noi),
      gross_yield: gross / p.price,
      net_yield: noi / p.price,
      annual_mortgage_cost: r2(monthly * 12),
      pre_tax_cash_flow: r2(cf),
      purchase_tax: r2(tax),
      cash_invested: r2(cashIn),
      cash_on_cash_return: cf / cashIn
    });
}

// ---------------------------------------------------------------- PRO-020 ---
for (const [scenario, p] of [
  ["Ten years", { price: 250000, deposit: 62500, other: 2000, rate: 4.5, myears: 25, rent: 1200, costs: 3000, pg: 3, sr: 7, years: 10 }],
  ["Stocks ahead", { price: 250000, deposit: 62500, other: 2000, rate: 5.5, myears: 25, rent: 1000, costs: 4000, pg: 1, sr: 9, years: 10 }],
  ["Property ahead", { price: 250000, deposit: 62500, other: 2000, rate: 3.5, myears: 25, rent: 1400, costs: 2000, pg: 6, sr: 3, years: 15 }],
  ["Short horizon", { price: 200000, deposit: 50000, other: 1500, rate: 4, myears: 25, rent: 1000, costs: 2500, pg: 3, sr: 6, years: 5 }],
  ["No growth", { price: 300000, deposit: 75000, other: 2500, rate: 4, myears: 25, rent: 1300, costs: 3000, pg: 0, sr: 0, years: 10 }]
]) {
  const tax = sdlt(p.price, { additional: true });
  const purchaseCosts = tax + p.other;
  const mortgage = p.price - p.deposit;
  const pmt = pmtByBisection(mortgage, p.rate, p.myears);
  const months = Math.round(p.years * 12);
  const value = p.price * Math.pow(1 + p.pg / 100, p.years);
  const bal = balanceAfterSim(mortgage, p.rate, p.myears, months);
  const netRent = (p.rent * 12 - p.costs) * p.years;
  const propInvested = p.deposit + purchaseCosts + pmt * months - netRent;
  const propEquity = value - bal;

  const upfront = p.deposit + purchaseCosts;
  const outlay = pmt - (p.rent - p.costs / 12);
  const sr = p.sr / 100 / 12;
  let pot = upfront, contributed = upfront;
  for (let i = 0; i < months; i++) { pot = pot * (1 + sr) + Math.max(0, outlay); contributed += Math.max(0, outlay); }

  add("PRO-020", scenario,
    { price: p.price, deposit: p.deposit, other_purchase_costs: p.other, mortgage_rate: p.rate,
      mortgage_years: p.myears, monthly_rent: p.rent, annual_costs: p.costs,
      property_growth: p.pg, stock_return: p.sr, years: p.years, jurisdiction: "england_ni" },
    {
      property_final_equity: r2(propEquity),
      property_total_invested: r2(propInvested),
      property_net_gain: r2(propEquity - propInvested),
      stocks_final_value: r2(pot),
      stocks_total_invested: r2(contributed),
      stocks_net_gain: r2(pot - contributed)
    });
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`\nOracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
