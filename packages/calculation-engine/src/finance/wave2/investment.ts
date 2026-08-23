/**
 * Wave 2 investment and savings calculators.
 */
import { assertMoney, assertTermYears, assertFiniteNumber } from "../../common/validation.js";

// ---------------------------------------------------------------------------
// Safeguarded root finding
// ---------------------------------------------------------------------------

/**
 * Find a root of `f` on a bracket, using bisection guarded by the Brent-style
 * secant step where it helps.
 *
 * A plain Newton iteration is deliberately NOT used: cash-flow polynomials
 * routinely have flat regions and multiple sign changes, and Newton diverges
 * or jumps to a spurious root there. Bracketing guarantees convergence to a
 * root that actually lies between two rates of opposite sign, which is the
 * property an IRR needs.
 */
export function bracketedRoot(
  f: (x: number) => number,
  lo: number,
  hi: number,
  tolerance = 1e-10,
  maxIterations = 300
): number | null {
  let a = lo, b = hi;
  let fa = f(a), fb = f(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) return null;
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return null; // no sign change: no bracketed root

  for (let i = 0; i < maxIterations; i++) {
    // Secant candidate, accepted only when it stays inside the bracket.
    const mid = (a + b) / 2;
    let next = mid;
    if (fb !== fa) {
      const secant = b - (fb * (b - a)) / (fb - fa);
      if (secant > Math.min(a, b) && secant < Math.max(a, b)) next = secant;
    }
    const fNext = f(next);
    if (!Number.isFinite(fNext)) return null;
    if (fNext === 0 || Math.abs(b - a) < tolerance) return next;

    if (fa * fNext < 0) { b = next; fb = fNext; }
    else { a = next; fa = fNext; }
  }
  return (a + b) / 2;
}

/**
 * Scan a wide range for a sign change, then solve within that bracket.
 * Returns null when no rate in the searched range produces a root, rather
 * than returning a plausible-looking number that is not one.
 */
export function findRateByScan(
  f: (r: number) => number,
  min = -0.9999,
  max = 10,
  steps = 2000
): number | null {
  let previousX = min;
  let previousY = f(previousX);
  for (let i = 1; i <= steps; i++) {
    const x = min + ((max - min) * i) / steps;
    const y = f(x);
    if (Number.isFinite(previousY) && Number.isFinite(y) && previousY * y <= 0) {
      const root = bracketedRoot(f, previousX, x);
      if (root !== null) return root;
    }
    previousX = x;
    previousY = y;
  }
  return null;
}

// ---------------------------------------------------------------------------
// INV-012 XIRR
// ---------------------------------------------------------------------------

export interface DatedCashflow {
  date: string;
  amount: number;
}

/**
 * Internal rate of return on irregularly dated cash flows (XIRR).
 *
 * Uses the actual/365 day-count convention, matching the common spreadsheet
 * definition: NPV(r) = sum( amount_i / (1+r)^(days_i/365) ).
 */
export function xirr(cashflows: DatedCashflow[]): number | null {
  if (!Array.isArray(cashflows) || cashflows.length < 2) {
    throw new Error("Enter at least two dated cash flows.");
  }
  const parsed = cashflows.map((c, i) => {
    const time = Date.parse(c.date);
    if (!Number.isFinite(time)) throw new Error(`Cash flow ${i + 1} has an invalid date.`);
    const amount = assertFiniteNumber(c.amount, `Cash flow ${i + 1} amount`);
    return { time, amount };
  }).sort((a, b) => a.time - b.time);

  const hasPositive = parsed.some((c) => c.amount > 0);
  const hasNegative = parsed.some((c) => c.amount < 0);
  if (!hasPositive || !hasNegative) {
    throw new Error("XIRR needs at least one negative and one positive cash flow.");
  }

  const start = parsed[0].time;
  const DAY = 86400000;
  const npv = (rate: number) =>
    parsed.reduce((sum, c) => {
      const years = (c.time - start) / DAY / 365;
      return sum + c.amount / Math.pow(1 + rate, years);
    }, 0);

  return findRateByScan(npv);
}

// ---------------------------------------------------------------------------
// INV-004 / INV-005 interest and rate
// ---------------------------------------------------------------------------

export interface InterestResult {
  simple_interest: number;
  simple_total: number;
  compound_interest: number;
  compound_total: number;
  difference: number;
}

/** Interest on a lump sum, both simple and compound. */
export function interestComparison(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear: number = 1
): InterestResult {
  assertMoney(principal, "Principal");
  assertTermYears(years, "Years");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;
  const m = assertFiniteNumber(compoundsPerYear, "Compounding frequency");
  if (m <= 0) throw new Error("Compounding frequency must be greater than zero.");

  const simple = principal * rate * years;
  const compoundTotal = principal * Math.pow(1 + rate / m, m * years);

  return {
    simple_interest: simple,
    simple_total: principal + simple,
    compound_interest: compoundTotal - principal,
    compound_total: compoundTotal,
    difference: compoundTotal - principal - simple
  };
}

/** The annual rate needed to grow a present value into a future value. */
export function requiredRate(
  presentValue: number,
  futureValue: number,
  years: number,
  compoundsPerYear: number = 1
): number {
  assertMoney(presentValue, "Present value");
  assertMoney(futureValue, "Future value");
  assertTermYears(years, "Years");
  if (presentValue <= 0) throw new Error("Present value must be greater than zero.");
  if (years <= 0) throw new Error("Number of years must be greater than zero.");
  const m = assertFiniteNumber(compoundsPerYear, "Compounding frequency");
  if (m <= 0) throw new Error("Compounding frequency must be greater than zero.");

  // FV = PV(1 + r/m)^(m*n)  =>  r = m((FV/PV)^(1/(m*n)) - 1)
  return m * (Math.pow(futureValue / presentValue, 1 / (m * years)) - 1);
}

// ---------------------------------------------------------------------------
// INV-010 average return
// ---------------------------------------------------------------------------

export interface AverageReturnResult {
  arithmetic_mean: number;
  geometric_mean: number;
  cumulative_return: number;
  /** Arithmetic mean overstates compounded growth whenever returns vary. */
  difference: number;
  years: number;
}

/**
 * Arithmetic and geometric average returns.
 *
 * Both are reported because they answer different questions and the
 * arithmetic mean systematically overstates what an investor actually earned
 * whenever returns vary.
 */
export function averageReturn(returnsPct: number[]): AverageReturnResult {
  if (!Array.isArray(returnsPct) || returnsPct.length === 0) {
    throw new Error("Enter at least one annual return.");
  }
  const rates = returnsPct.map((r, i) => {
    const value = assertFiniteNumber(r, `Return ${i + 1}`) / 100;
    if (value <= -1) throw new Error(`Return ${i + 1} cannot be -100% or lower.`);
    return value;
  });

  const arithmetic = rates.reduce((a, b) => a + b, 0) / rates.length;
  const growth = rates.reduce((product, r) => product * (1 + r), 1);
  const geometric = Math.pow(growth, 1 / rates.length) - 1;

  return {
    arithmetic_mean: arithmetic,
    geometric_mean: geometric,
    cumulative_return: growth - 1,
    difference: arithmetic - geometric,
    years: rates.length
  };
}

// ---------------------------------------------------------------------------
// INV-013 payback period
// ---------------------------------------------------------------------------

export interface PaybackResult {
  payback_years: number | null;
  discounted_payback_years: number | null;
  total_cash_returned: number;
  net_gain: number;
}

/** Simple and discounted payback period on an initial outlay. */
export function paybackPeriod(
  initialInvestment: number,
  annualCashflows: number[],
  discountRatePct: number = 0
): PaybackResult {
  assertMoney(initialInvestment, "Initial investment");
  if (!Array.isArray(annualCashflows) || annualCashflows.length === 0) {
    throw new Error("Enter at least one annual cash flow.");
  }
  const discount = assertFiniteNumber(discountRatePct, "Discount rate") / 100;

  const crossing = (flows: number[]): number | null => {
    let cumulative = -initialInvestment;
    for (let year = 0; year < flows.length; year++) {
      const previous = cumulative;
      cumulative += flows[year];
      if (cumulative >= 0) {
        // Interpolate within the year in which the outlay is recovered.
        const needed = -previous;
        return flows[year] === 0 ? year + 1 : year + needed / flows[year];
      }
    }
    return null;
  };

  const nominal = annualCashflows.map((c, i) => assertFiniteNumber(c, `Cash flow ${i + 1}`));
  const discounted = nominal.map((c, i) => c / Math.pow(1 + discount, i + 1));
  const total = nominal.reduce((a, b) => a + b, 0);

  return {
    payback_years: crossing(nominal),
    discounted_payback_years: crossing(discounted),
    total_cash_returned: total,
    net_gain: total - initialInvestment
  };
}

// ---------------------------------------------------------------------------
// INV-016 cost of waiting
// ---------------------------------------------------------------------------

export interface CostOfWaitingResult {
  value_if_starting_now: number;
  value_if_delayed: number;
  cost_of_waiting: number;
  contributions_if_starting_now: number;
  contributions_if_delayed: number;
  extra_monthly_needed_to_catch_up: number | null;
}

/**
 * What delaying the start of regular investing costs by a target date.
 *
 * Contributions are end-of-month (an ordinary annuity), so a contribution
 * never earns growth before it is made.
 */
export function costOfWaiting(
  monthlyContribution: number,
  annualReturnPct: number,
  yearsToGoal: number,
  yearsDelayed: number,
  startingAmount: number = 0
): CostOfWaitingResult {
  assertMoney(monthlyContribution, "Monthly contribution");
  assertMoney(startingAmount, "Starting amount");
  assertTermYears(yearsToGoal, "Years to goal");
  assertTermYears(yearsDelayed, "Years delayed");
  if (yearsDelayed > yearsToGoal) {
    throw new Error("The delay cannot be longer than the time to your goal.");
  }
  const r = assertFiniteNumber(annualReturnPct, "Annual return") / 100 / 12;

  const fv = (months: number, growthMonths: number) => {
    const grownStart = startingAmount * Math.pow(1 + r, growthMonths);
    const annuity = r === 0
      ? monthlyContribution * months
      : monthlyContribution * ((Math.pow(1 + r, months) - 1) / r);
    return grownStart + annuity;
  };

  const totalMonths = Math.round(yearsToGoal * 12);
  const delayedMonths = Math.round((yearsToGoal - yearsDelayed) * 12);

  const now = fv(totalMonths, totalMonths);
  const delayed = fv(delayedMonths, totalMonths);

  // What the later starter must contribute each month to reach the same place.
  let catchUp: number | null = null;
  if (delayedMonths > 0) {
    const grownStart = startingAmount * Math.pow(1 + r, totalMonths);
    const target = now - grownStart;
    const factor = r === 0 ? delayedMonths : (Math.pow(1 + r, delayedMonths) - 1) / r;
    catchUp = factor > 0 ? target / factor - monthlyContribution : null;
  }

  return {
    value_if_starting_now: now,
    value_if_delayed: delayed,
    cost_of_waiting: now - delayed,
    contributions_if_starting_now: monthlyContribution * totalMonths,
    contributions_if_delayed: monthlyContribution * delayedMonths,
    extra_monthly_needed_to_catch_up: catchUp
  };
}

// ---------------------------------------------------------------------------
// INV-017 / INV-018 / INV-019 / INV-020 contributions and savings
// ---------------------------------------------------------------------------

export interface ContributionGrowthResult {
  final_value: number;
  total_contributions: number;
  starting_amount: number;
  growth: number;
  effective_annual_rate: number;
}

/**
 * Regular contributions plus growth.
 *
 * `contributionTiming` matters: paying at the start of each period earns one
 * extra period of growth, which is why it is an explicit choice rather than a
 * silent assumption.
 */
export function contributionGrowth(
  startingAmount: number,
  monthlyContribution: number,
  annualRatePct: number,
  years: number,
  contributionTiming: "end" | "start" = "end"
): ContributionGrowthResult {
  assertMoney(startingAmount, "Starting amount");
  assertMoney(monthlyContribution, "Monthly contribution");
  assertTermYears(years, "Years");
  const annual = assertFiniteNumber(annualRatePct, "Annual rate") / 100;
  const r = annual / 12;
  const n = Math.round(years * 12);

  const grownStart = startingAmount * Math.pow(1 + r, n);
  let annuity: number;
  if (r === 0) {
    annuity = monthlyContribution * n;
  } else {
    annuity = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
    if (contributionTiming === "start") annuity *= 1 + r;
  }
  const final = grownStart + annuity;

  return {
    final_value: final,
    total_contributions: monthlyContribution * n,
    starting_amount: startingAmount,
    growth: final - startingAmount - monthlyContribution * n,
    effective_annual_rate: Math.pow(1 + r, 12) - 1
  };
}

/** A fixed-term deposit with no further contributions. */
export function fixedTermSavings(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear: number = 1
): { final_value: number; interest_earned: number; effective_annual_rate: number; gross_annual_interest: number } {
  assertMoney(principal, "Deposit");
  assertTermYears(years, "Term");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;
  const m = assertFiniteNumber(compoundsPerYear, "Compounding frequency");
  if (m <= 0) throw new Error("Compounding frequency must be greater than zero.");

  const final = principal * Math.pow(1 + rate / m, m * years);
  return {
    final_value: final,
    interest_earned: final - principal,
    effective_annual_rate: Math.pow(1 + rate / m, m) - 1,
    gross_annual_interest: principal * rate
  };
}

// ---------------------------------------------------------------------------
// INV-021 bond pricing
// ---------------------------------------------------------------------------

export interface BondResult {
  price: number;
  total_coupons: number;
  current_yield: number;
  premium_or_discount: number;
  yield_to_maturity: number | null;
}

/**
 * Price a plain vanilla bond from its yield, and report the current yield.
 *
 * Clean-price convention with whole coupon periods; accrued interest and
 * day-count conventions between coupon dates are out of scope.
 */
export function bondPrice(
  faceValue: number,
  couponRatePct: number,
  yieldPct: number,
  years: number,
  couponsPerYear: number = 2
): BondResult {
  assertMoney(faceValue, "Face value");
  assertTermYears(years, "Years to maturity");
  const coupon = assertFiniteNumber(couponRatePct, "Coupon rate") / 100;
  const y = assertFiniteNumber(yieldPct, "Yield") / 100;
  const m = assertFiniteNumber(couponsPerYear, "Coupons per year");
  if (m <= 0) throw new Error("Coupons per year must be greater than zero.");

  const n = Math.round(years * m);
  const couponPayment = (faceValue * coupon) / m;
  const periodYield = y / m;

  let price: number;
  if (periodYield === 0) {
    price = couponPayment * n + faceValue;
  } else {
    const annuity = couponPayment * ((1 - Math.pow(1 + periodYield, -n)) / periodYield);
    price = annuity + faceValue / Math.pow(1 + periodYield, n);
  }

  return {
    price,
    total_coupons: couponPayment * n,
    current_yield: price > 0 ? (faceValue * coupon) / price : 0,
    premium_or_discount: price - faceValue,
    yield_to_maturity: y
  };
}

// ---------------------------------------------------------------------------
// INV-022 / INV-023 dividends
// ---------------------------------------------------------------------------

export interface DividendGrowthResult {
  first_year_income: number;
  final_year_income: number;
  total_income: number;
  yield_on_cost: number;
  final_yield_on_cost: number;
}

/** Income from a holding whose dividend grows at a constant rate. */
export function dividendGrowth(
  investment: number,
  startingYieldPct: number,
  dividendGrowthPct: number,
  years: number
): DividendGrowthResult {
  assertMoney(investment, "Investment");
  assertTermYears(years, "Years");
  const startYield = assertFiniteNumber(startingYieldPct, "Starting yield") / 100;
  const growth = assertFiniteNumber(dividendGrowthPct, "Dividend growth") / 100;

  const first = investment * startYield;
  let income = first;
  let total = 0;
  for (let y = 0; y < Math.round(years); y++) {
    total += income;
    if (y < Math.round(years) - 1) income *= 1 + growth;
  }

  return {
    first_year_income: first,
    final_year_income: income,
    total_income: total,
    yield_on_cost: investment > 0 ? first / investment : 0,
    final_yield_on_cost: investment > 0 ? income / investment : 0
  };
}

export interface DividendReinvestmentResult {
  final_value: number;
  final_value_without_reinvestment: number;
  reinvestment_benefit: number;
  total_dividends: number;
  final_shares: number;
}

/**
 * Compare reinvesting dividends against taking them as cash.
 *
 * Both sides experience the same share-price growth; the difference is purely
 * the effect of compounding the income.
 */
export function dividendReinvestment(
  initialInvestment: number,
  startingYieldPct: number,
  annualPriceGrowthPct: number,
  dividendGrowthPct: number,
  years: number
): DividendReinvestmentResult {
  assertMoney(initialInvestment, "Initial investment");
  assertTermYears(years, "Years");
  const startYield = assertFiniteNumber(startingYieldPct, "Starting yield") / 100;
  const priceGrowth = assertFiniteNumber(annualPriceGrowthPct, "Price growth") / 100;
  const divGrowth = assertFiniteNumber(dividendGrowthPct, "Dividend growth") / 100;

  // Work in shares so reinvestment buys at the prevailing price.
  const startingPrice = 100;
  let shares = initialInvestment / startingPrice;
  let price = startingPrice;
  let dividendPerShare = startingPrice * startYield;
  let totalDividends = 0;

  for (let y = 0; y < Math.round(years); y++) {
    const income = shares * dividendPerShare;
    totalDividends += income;
    price *= 1 + priceGrowth;
    shares += income / price;
    dividendPerShare *= 1 + divGrowth;
  }

  const withoutReinvestment = (initialInvestment / startingPrice) * price;

  return {
    final_value: shares * price,
    final_value_without_reinvestment: withoutReinvestment,
    reinvestment_benefit: shares * price - withoutReinvestment,
    total_dividends: totalDividends,
    final_shares: shares
  };
}

// ---------------------------------------------------------------------------
// INV-024 fund investment
// ---------------------------------------------------------------------------

export interface FundInvestmentResult {
  gross_value: number;
  net_value: number;
  total_fees: number;
  total_contributions: number;
  fee_drag_percentage: number;
  net_annualised_return: number;
}

/**
 * A fund holding with an ongoing charge, plus an optional platform fee.
 *
 * Fees are applied monthly to the running balance, which is how ongoing
 * charges actually accrue - deducting them once a year understates their cost.
 */
export function fundInvestment(
  initialInvestment: number,
  monthlyContribution: number,
  grossReturnPct: number,
  ongoingChargePct: number,
  platformFeePct: number,
  years: number
): FundInvestmentResult {
  assertMoney(initialInvestment, "Initial investment");
  assertMoney(monthlyContribution, "Monthly contribution");
  assertTermYears(years, "Years");
  const gross = assertFiniteNumber(grossReturnPct, "Gross return") / 100;
  const ocf = assertFiniteNumber(ongoingChargePct, "Ongoing charge") / 100;
  const platform = assertFiniteNumber(platformFeePct, "Platform fee") / 100;

  const months = Math.round(years * 12);
  const monthlyGross = Math.pow(1 + gross, 1 / 12) - 1;
  const monthlyFee = (ocf + platform) / 12;

  let grossBalance = initialInvestment;
  let netBalance = initialInvestment;
  let fees = 0;

  for (let i = 0; i < months; i++) {
    grossBalance = grossBalance * (1 + monthlyGross) + monthlyContribution;
    netBalance = netBalance * (1 + monthlyGross);
    const fee = netBalance * monthlyFee;
    fees += fee;
    netBalance = netBalance - fee + monthlyContribution;
  }

  const contributions = initialInvestment + monthlyContribution * months;
  return {
    gross_value: grossBalance,
    net_value: netBalance,
    total_fees: fees,
    total_contributions: contributions,
    fee_drag_percentage: grossBalance > 0 ? (grossBalance - netBalance) / grossBalance : 0,
    net_annualised_return:
      years > 0 && contributions > 0 ? Math.pow(netBalance / contributions, 1 / years) - 1 : 0
  };
}
