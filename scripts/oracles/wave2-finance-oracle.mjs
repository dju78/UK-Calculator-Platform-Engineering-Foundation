/**
 * Independent benchmark oracle for Wave 2 Finance & Debt.
 *
 * This file deliberately imports NOTHING from the calculation engine. Every
 * expected value is derived here from first principles, and wherever the
 * engine uses a closed form this oracle uses iteration (and vice versa), so
 * agreement between the two is genuine corroboration rather than a tautology.
 *
 * Run: node scripts/oracles/wave2-finance-oracle.mjs
 */

const r2 = (n) => Math.round(n * 100) / 100;

// --- Independent primitives -------------------------------------------------

/**
 * Level payment on an amortising loan, derived by BISECTION on the closing
 * balance rather than by the annuity formula the engine uses.
 */
function paymentByBisection(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  if (r === 0) return principal / n;
  const closing = (pmt) => {
    let bal = principal;
    for (let i = 0; i < n; i++) bal = bal * (1 + r) - pmt;
    return bal;
  };
  let lo = 0, hi = principal * (1 + r) ;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (closing(mid) > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Total interest by explicit month-by-month simulation. */
function totalInterestBySimulation(principal, annualRatePct, years, payment) {
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  let bal = principal, interest = 0;
  for (let i = 0; i < n; i++) {
    const int = bal * r;
    interest += int;
    bal = bal + int - payment;
  }
  return interest;
}

/** First-N-months interest and principal by simulation. */
function firstMonths(principal, annualRatePct, years, payment, months) {
  const r = annualRatePct / 100 / 12;
  let bal = principal, interest = 0, capital = 0;
  for (let i = 0; i < months; i++) {
    const int = bal * r;
    const cap = payment - int;
    interest += int; capital += cap; bal -= cap;
  }
  return { interest, capital, balance: bal };
}

/**
 * Months to clear a revolving balance, by the CLOSED FORM
 * n = -ln(1 - B*r/P) / ln(1+r), where the engine iterates.
 */
function payoffMonthsClosedForm(balance, aprPct, payment) {
  const r = aprPct / 100 / 12;
  if (r === 0) return Math.ceil(balance / payment);
  const denom = 1 - (balance * r) / payment;
  if (denom <= 0) return Infinity;
  return Math.ceil(-Math.log(denom) / Math.log(1 + r));
}

/** Total interest on a revolving balance, by simulation with a final part-payment. */
function cardInterestBySimulation(balance, aprPct, payment) {
  const r = aprPct / 100 / 12;
  let bal = balance, interest = 0, months = 0;
  while (bal > 1e-9 && months < 12000) {
    const int = bal * r;
    interest += int;
    const pay = Math.min(payment, bal + int);
    bal = bal + int - pay;
    months++;
  }
  return { interest, months };
}

/**
 * Level contribution to reach a target, derived by BISECTION on the simulated
 * closing balance rather than by the annuity formula the engine uses.
 */
function contributionByBisection(target, months, annualRatePct, start) {
  const r = annualRatePct / 100 / 12;
  const closing = (pmt) => {
    let bal = start;
    for (let i = 0; i < months; i++) bal = bal * (1 + r) + pmt;
    return bal;
  };
  if (closing(0) >= target) return 0;
  let lo = 0, hi = target;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (closing(mid) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// --- Benchmark definitions --------------------------------------------------

const fixtures = {};
const add = (id, scenario, inputs, expected, note) => {
  (fixtures[id] ??= []).push({
    scenario,
    inputs,
    expected,
    tolerance: "±£0.01 / ±0.0001 as applicable",
    ruleset: "None",
    note: note ?? "Independently derived: bisection/simulation oracle, not the production engine."
  });
};

// ---------------------------------------------------------------- FIN-003 ---
for (const [scenario, amount, rate, years, fee] of [
  ["Standard business loan", 50000, 7.5, 5, 0],
  ["With arrangement fee", 50000, 7.5, 5, 1000],
  ["Zero rate", 24000, 0, 4, 0],
  ["Short term high rate", 10000, 14.9, 1, 250],
  ["Large facility", 500000, 6.25, 10, 5000]
]) {
  const financed = amount + fee;
  const pmt = paymentByBisection(financed, rate, years);
  const interest = totalInterestBySimulation(financed, rate, years, pmt);
  add("FIN-003", scenario,
    { amount, annual_rate: rate, years, fee, fee_financed: true },
    {
      monthly_payment: r2(pmt),
      total_repayment: r2(pmt * years * 12),
      total_interest: r2(interest),
      total_cost_of_credit: r2(interest + fee)
    });
}

// ---------------------------------------------------------------- FIN-004 ---
for (const [scenario, amount, rate, years, fee, propertyValue, existing] of [
  ["Standard secured loan", 25000, 8.9, 10, 0, 350000, 180000],
  ["With fee financed", 25000, 8.9, 10, 995, 350000, 180000],
  ["High combined LTV", 60000, 9.9, 15, 0, 250000, 150000],
  ["Zero rate", 12000, 0, 5, 0, 300000, 100000],
  ["Large secured loan", 150000, 6.5, 20, 1500, 800000, 300000]
]) {
  const financed = amount + fee;
  const pmt = paymentByBisection(financed, rate, years);
  const interest = totalInterestBySimulation(financed, rate, years, pmt);
  add("FIN-004", scenario,
    { amount, annual_rate: rate, years, fee, fee_financed: true, property_value: propertyValue, existing_mortgage: existing },
    {
      monthly_payment: r2(pmt),
      total_interest: r2(interest),
      total_cost_of_credit: r2(interest + fee),
      combined_ltv: (existing + amount) / propertyValue
    });
}

// ---------------------------------------------------------------- FIN-007 ---
for (const [scenario, principal, rate, years] of [
  ["25-year mortgage", 200000, 4.5, 25],
  ["Zero rate", 120000, 0, 10],
  ["Short personal loan", 8000, 9.9, 3],
  ["Long term low rate", 300000, 2.5, 30],
  ["One year", 12000, 6, 1]
]) {
  const pmt = paymentByBisection(principal, rate, years);
  const interest = totalInterestBySimulation(principal, rate, years, pmt);
  const y1 = firstMonths(principal, rate, years, pmt, Math.min(12, Math.round(years * 12)));
  add("FIN-007", scenario,
    { principal, annual_rate: rate, years },
    {
      monthly_payment: r2(pmt),
      total_interest: r2(interest),
      total_repayment: r2(principal + interest),
      payoff_months: Math.round(years * 12),
      first_year_interest: r2(y1.interest),
      first_year_principal: r2(y1.capital)
    });
}

// ---------------------------------------------------------------- FIN-008 ---
for (const [scenario, income, debt, housing] of [
  ["Low ratio", 4000, 600, 400],
  ["Manageable", 3500, 1050, 900],
  ["High", 3000, 1350, 1000],
  ["Very high", 2500, 1500, 1200],
  ["No housing supplied", 5000, 1000, undefined]
]) {
  const inputs = { gross_monthly_income: income, total_monthly_debt: debt };
  if (housing !== undefined) inputs.housing_payment = housing;
  add("FIN-008", scenario, inputs, {
    dti_ratio: debt / income,
    front_end_ratio: housing === undefined ? null : housing / income,
    total_monthly_debt: debt,
    gross_monthly_income: income
  });
}

// ---------------------------------------------------------------- FIN-010 ---
for (const [scenario, balance, apr, payment, target] of [
  ["Standard card", 3000, 21.9, 150, undefined],
  ["Minimum-ish payment", 5000, 24.9, 125, undefined],
  ["Zero APR promo", 2400, 0, 200, undefined],
  ["Target payoff in 12 months", 3000, 21.9, 150, 12],
  ["Large balance", 12000, 18.9, 400, undefined]
]) {
  const sim = cardInterestBySimulation(balance, apr, payment);
  const closed = payoffMonthsClosedForm(balance, apr, payment);
  if (sim.months !== closed) {
    console.error(`  ! FIN-010 ${scenario}: simulation ${sim.months} vs closed form ${closed}`);
  }
  const inputs = { balance, apr, monthly_payment: payment };
  const expected = {
    months: sim.months,
    total_interest: r2(sim.interest),
    total_repaid: r2(balance + sim.interest)
  };
  if (target !== undefined) {
    inputs.target_months = target;
    const r = apr / 100 / 12;
    expected.payment_for_target = r2((balance * r) / (1 - Math.pow(1 + r, -target)));
  }
  add("FIN-010", scenario, inputs, expected);
}

// ---------------------------------------------------------------- FIN-012 ---
const consolidationCases = [
  ["Typical consolidation", [{ balance: 3000, apr: 21.9, monthly_payment: 150 }, { balance: 5000, apr: 18.9, monthly_payment: 200 }], 9.9, 5, 0],
  ["With fee", [{ balance: 3000, apr: 21.9, monthly_payment: 150 }, { balance: 5000, apr: 18.9, monthly_payment: 200 }], 9.9, 5, 500],
  ["Single debt", [{ balance: 8000, apr: 24.9, monthly_payment: 250 }], 12.9, 3, 0],
  ["Longer term costs more", [{ balance: 10000, apr: 12.9, monthly_payment: 400 }], 9.9, 10, 0],
  ["Zero rate consolidation", [{ balance: 4000, apr: 19.9, monthly_payment: 200 }], 0, 3, 0]
];
for (const [scenario, debts, apr, years, fee] of consolidationCases) {
  let curBal = 0, curMonthly = 0, curInterest = 0, curMonths = 0;
  for (const d of debts) {
    const sim = cardInterestBySimulation(d.balance, d.apr, d.monthly_payment);
    curBal += d.balance; curMonthly += d.monthly_payment;
    curInterest += sim.interest; curMonths = Math.max(curMonths, sim.months);
  }
  const financed = curBal + fee;
  const pmt = paymentByBisection(financed, apr, years);
  const conInterest = totalInterestBySimulation(financed, apr, years, pmt);
  add("FIN-012", scenario,
    { debts: JSON.stringify(debts), consolidation_apr: apr, consolidation_years: years, fee },
    {
      current_total_balance: r2(curBal),
      current_monthly_payment: r2(curMonthly),
      current_total_interest: r2(curInterest),
      current_payoff_months: curMonths,
      consolidated_monthly_payment: r2(pmt),
      consolidated_total_interest: r2(conInterest),
      monthly_payment_change: r2(pmt - curMonthly),
      total_interest_change: r2(conInterest - curInterest)
    });
}

// ---------------------------------------------------------------- FIN-014 ---
for (const [scenario, essentials, months, savings, contribution] of [
  ["Three months target", 1800, 3, 1000, 250],
  ["Six months target", 2200, 6, 0, 300],
  ["Already funded", 1500, 3, 5000, 100],
  ["No contribution", 2000, 6, 2000, 0],
  ["Twelve months target", 3000, 12, 10000, 500]
]) {
  const target = essentials * months;
  const shortfall = Math.max(0, target - savings);
  add("FIN-014", scenario,
    { monthly_essentials: essentials, months_of_cover: months, current_savings: savings, monthly_contribution: contribution },
    {
      target_fund: r2(target),
      shortfall: r2(shortfall),
      months_covered_now: savings / essentials,
      months_to_target: shortfall === 0 ? 0 : contribution > 0 ? Math.ceil(shortfall / contribution) : null
    });
}

// ---------------------------------------------------------------- FIN-015 ---
for (const [scenario, target, months, rate, start] of [
  ["Deposit in 5 years", 30000, 60, 4, 0],
  ["With starting balance", 30000, 60, 4, 5000],
  ["Zero interest", 12000, 24, 0, 0],
  ["Already achieved", 10000, 12, 5, 12000],
  ["Long horizon", 100000, 180, 5, 10000]
]) {
  const pmt = contributionByBisection(target, months, rate, start);
  const r = rate / 100 / 12;
  let bal = start;
  for (let i = 0; i < months; i++) bal = bal * (1 + r) + pmt;
  add("FIN-015", scenario,
    { target, months, annual_rate: rate, starting_amount: start },
    {
      required_monthly_saving: r2(pmt),
      total_contributions: r2(pmt * months),
      projected_value: r2(bal),
      interest_earned: r2(bal - start - pmt * months)
    });
}

// --- Emit -------------------------------------------------------------------
const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`\nOracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
