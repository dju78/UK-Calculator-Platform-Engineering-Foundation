/**
 * Wave 2 mortgage and property calculators.
 *
 * The amortisation mathematics is reused from the Wave 1 loan engine; only
 * genuinely new behaviour (refinance comparison, stress testing, rent-vs-buy)
 * lives here.
 */
import { calculatePmt, calculateAmortisation } from "../loan/core.js";
import { assertMoney, assertTermYears, assertFiniteNumber } from "../../common/validation.js";

/** Remaining balance after `monthsPaid` payments on an amortising loan. */
export function balanceAfter(
  principal: number,
  annualRatePct: number,
  years: number,
  monthsPaid: number
): number {
  const r = annualRatePct / 100 / 12;
  const pmt = calculatePmt(principal, annualRatePct / 100, years, "repayment");
  if (r === 0) return Math.max(0, principal - pmt * monthsPaid);
  const grown = principal * Math.pow(1 + r, monthsPaid);
  const paid = pmt * ((Math.pow(1 + r, monthsPaid) - 1) / r);
  return Math.max(0, grown - paid);
}

// --------------------------------------------------------------- PRO-005 ---

export interface MortgagePayoffResult {
  current_monthly_payment: number;
  new_monthly_payment: number;
  original_payoff_months: number;
  new_payoff_months: number;
  months_saved: number;
  original_total_interest: number;
  new_total_interest: number;
  interest_saved: number;
}

/** Effect of a regular overpayment on an outstanding mortgage. */
export function mortgagePayoff(
  balance: number,
  annualRatePct: number,
  remainingYears: number,
  monthlyOverpayment: number
): MortgagePayoffResult {
  assertMoney(balance, "Outstanding balance");
  assertTermYears(remainingYears, "Remaining term");
  assertMoney(monthlyOverpayment, "Monthly overpayment");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;

  const baseline = calculateAmortisation(balance, rate, remainingYears, 0, 0, 1);
  const withExtra = calculateAmortisation(balance, rate, remainingYears, monthlyOverpayment, 0, 1);
  const payment = calculatePmt(balance, rate, remainingYears, "repayment");

  return {
    current_monthly_payment: payment,
    new_monthly_payment: payment + monthlyOverpayment,
    original_payoff_months: baseline.payoffMonths,
    new_payoff_months: withExtra.payoffMonths,
    months_saved: baseline.payoffMonths - withExtra.payoffMonths,
    original_total_interest: baseline.totalInterest,
    new_total_interest: withExtra.totalInterest,
    interest_saved: baseline.totalInterest - withExtra.totalInterest
  };
}

// --------------------------------------------------------------- PRO-006 ---

export interface RefinanceResult {
  current_monthly_payment: number;
  new_monthly_payment: number;
  monthly_saving: number;
  current_remaining_interest: number;
  new_total_interest: number;
  total_interest_change: number;
  fees: number;
  break_even_months: number | null;
  net_saving_over_new_term: number;
}

/**
 * Compare staying on a current mortgage against remortgaging.
 *
 * Reports the total interest change as well as the monthly saving, because a
 * longer new term routinely lowers the payment while increasing lifetime cost.
 */
export function mortgageRefinance(
  balance: number,
  currentRatePct: number,
  currentRemainingYears: number,
  newRatePct: number,
  newTermYears: number,
  fees: number = 0
): RefinanceResult {
  assertMoney(balance, "Outstanding balance");
  assertTermYears(currentRemainingYears, "Current remaining term");
  assertTermYears(newTermYears, "New term");
  assertMoney(fees, "Fees");
  const currentRate = assertFiniteNumber(currentRatePct, "Current rate") / 100;
  const newRate = assertFiniteNumber(newRatePct, "New rate") / 100;

  const currentPayment = calculatePmt(balance, currentRate, currentRemainingYears, "repayment");
  const currentMonths = Math.round(currentRemainingYears * 12);
  const currentInterest = currentPayment * currentMonths - balance;

  const financed = balance + fees;
  const newPayment = calculatePmt(financed, newRate, newTermYears, "repayment");
  const newMonths = Math.round(newTermYears * 12);
  const newInterest = newPayment * newMonths - financed;

  const monthlySaving = currentPayment - newPayment;

  return {
    current_monthly_payment: currentPayment,
    new_monthly_payment: newPayment,
    monthly_saving: monthlySaving,
    current_remaining_interest: currentInterest,
    new_total_interest: newInterest,
    total_interest_change: newInterest - currentInterest,
    fees,
    // How long the monthly saving takes to repay the fees.
    break_even_months: monthlySaving > 0 ? Math.ceil(fees / monthlySaving) : null,
    net_saving_over_new_term: monthlySaving * newMonths - fees
  };
}

// --------------------------------------------------------------- PRO-007 ---

export interface InterestOnlyResult {
  monthly_interest_payment: number;
  total_interest_over_term: number;
  balance_at_end_of_term: number;
  repayment_equivalent_payment: number;
  monthly_difference: number;
  total_cost_difference: number;
}

/** Interest-only mortgage, contrasted with the capital-and-interest equivalent. */
export function interestOnlyMortgage(
  balance: number,
  annualRatePct: number,
  years: number
): InterestOnlyResult {
  assertMoney(balance, "Mortgage balance");
  assertTermYears(years, "Term");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;
  const months = Math.round(years * 12);

  const interestPayment = balance * (rate / 12);
  const totalInterest = interestPayment * months;
  const repaymentPayment = calculatePmt(balance, rate, years, "repayment");
  const repaymentInterest = repaymentPayment * months - balance;

  return {
    monthly_interest_payment: interestPayment,
    total_interest_over_term: totalInterest,
    // The defining risk of interest-only: the capital is still owed in full.
    balance_at_end_of_term: balance,
    repayment_equivalent_payment: repaymentPayment,
    monthly_difference: repaymentPayment - interestPayment,
    total_cost_difference: totalInterest - repaymentInterest
  };
}

// --------------------------------------------------------------- PRO-009 ---

export interface StressTestResult {
  current_monthly_payment: number;
  stressed_monthly_payment: number;
  monthly_increase: number;
  annual_increase: number;
  percentage_increase: number;
  payment_to_income_now: number | null;
  payment_to_income_stressed: number | null;
}

/** What a mortgage payment becomes if rates rise by a given amount. */
export function mortgageStressTest(
  balance: number,
  currentRatePct: number,
  remainingYears: number,
  rateIncreasePct: number,
  grossMonthlyIncome?: number
): StressTestResult {
  assertMoney(balance, "Mortgage balance");
  assertTermYears(remainingYears, "Remaining term");
  const currentRate = assertFiniteNumber(currentRatePct, "Current rate") / 100;
  const increase = assertFiniteNumber(rateIncreasePct, "Rate increase") / 100;
  if (currentRate + increase < 0) {
    throw new Error("The stressed rate cannot be negative.");
  }

  const current = calculatePmt(balance, currentRate, remainingYears, "repayment");
  const stressed = calculatePmt(balance, currentRate + increase, remainingYears, "repayment");
  const income = grossMonthlyIncome !== undefined ? Number(grossMonthlyIncome) : undefined;

  return {
    current_monthly_payment: current,
    stressed_monthly_payment: stressed,
    monthly_increase: stressed - current,
    annual_increase: (stressed - current) * 12,
    percentage_increase: current > 0 ? (stressed - current) / current : 0,
    payment_to_income_now: income && income > 0 ? current / income : null,
    payment_to_income_stressed: income && income > 0 ? stressed / income : null
  };
}

// --------------------------------------------------------------- PRO-012 ---

export interface HomeEquityResult {
  property_value: number;
  mortgage_balance: number;
  equity: number;
  equity_percentage: number;
  ltv: number;
  /** Equity releasable while staying within a maximum LTV. */
  available_to_borrow: number;
}

export function homeEquity(
  propertyValue: number,
  mortgageBalance: number,
  maxLtvPct: number = 85
): HomeEquityResult {
  assertMoney(propertyValue, "Property value");
  assertMoney(mortgageBalance, "Mortgage balance", { allowNegative: false });
  const maxLtv = assertFiniteNumber(maxLtvPct, "Maximum LTV") / 100;
  if (propertyValue === 0) {
    throw new Error("Property value must be greater than zero.");
  }

  const equity = propertyValue - mortgageBalance;
  return {
    property_value: propertyValue,
    mortgage_balance: mortgageBalance,
    equity,
    equity_percentage: equity / propertyValue,
    ltv: mortgageBalance / propertyValue,
    available_to_borrow: Math.max(0, propertyValue * maxLtv - mortgageBalance)
  };
}

// --------------------------------------------------------------- PRO-014 ---

export interface RentAffordabilityResult {
  gross_monthly_income: number;
  affordable_rent_by_ratio: number;
  annual_income_required: number;
  rent_to_income: number | null;
  deposit_required: number;
  upfront_cost: number;
}

/**
 * Rent affordability.
 *
 * UK letting agents commonly require annual income of at least 30x the monthly
 * rent (equivalently rent no more than 1/30 of annual income). The multiple is
 * an input, not a hidden constant, because agencies differ.
 */
export function rentAffordability(
  grossMonthlyIncome: number,
  incomeMultiple: number = 30,
  proposedMonthlyRent?: number,
  depositWeeks: number = 5
): RentAffordabilityResult {
  assertMoney(grossMonthlyIncome, "Gross monthly income");
  const multiple = assertFiniteNumber(incomeMultiple, "Income multiple");
  if (multiple <= 0) throw new Error("Income multiple must be greater than zero.");
  const weeks = assertFiniteNumber(depositWeeks, "Deposit weeks");

  const annualIncome = grossMonthlyIncome * 12;
  const affordable = annualIncome / multiple;
  const rent = proposedMonthlyRent !== undefined ? Number(proposedMonthlyRent) : affordable;
  // A deposit expressed in weeks of rent: rent x 12 / 52 gives weekly rent.
  const deposit = ((rent * 12) / 52) * weeks;

  return {
    gross_monthly_income: grossMonthlyIncome,
    affordable_rent_by_ratio: affordable,
    annual_income_required: rent * multiple,
    rent_to_income: grossMonthlyIncome > 0 ? rent / grossMonthlyIncome : null,
    deposit_required: deposit,
    upfront_cost: deposit + rent
  };
}

// --------------------------------------------------------------- PRO-022 ---

export interface CapitalGrowthResult {
  initial_value: number;
  final_value: number;
  total_growth: number;
  total_growth_percentage: number;
  annualised_growth: number;
  real_final_value: number;
  real_total_growth_percentage: number;
}

/** Compound property capital growth, with an inflation-adjusted view. */
export function propertyCapitalGrowth(
  initialValue: number,
  annualGrowthPct: number,
  years: number,
  annualInflationPct: number = 0
): CapitalGrowthResult {
  assertMoney(initialValue, "Property value");
  assertTermYears(years, "Years");
  const growth = assertFiniteNumber(annualGrowthPct, "Annual growth") / 100;
  const inflation = assertFiniteNumber(annualInflationPct, "Inflation") / 100;

  const finalValue = initialValue * Math.pow(1 + growth, years);
  const realFinal = finalValue / Math.pow(1 + inflation, years);

  return {
    initial_value: initialValue,
    final_value: finalValue,
    total_growth: finalValue - initialValue,
    total_growth_percentage: initialValue > 0 ? finalValue / initialValue - 1 : 0,
    annualised_growth: growth,
    real_final_value: realFinal,
    real_total_growth_percentage: initialValue > 0 ? realFinal / initialValue - 1 : 0
  };
}

// --------------------------------------------------------------- PRO-021 ---

export interface CashFlowResult {
  annual_gross_rent: number;
  annual_effective_rent: number;
  annual_operating_costs: number;
  annual_mortgage_cost: number;
  net_annual_cash_flow: number;
  net_monthly_cash_flow: number;
  cash_invested: number;
  cash_on_cash_return: number | null;
}

/** Rental property cash flow before tax. */
export function propertyCashFlow(
  monthlyRent: number,
  vacancyPct: number,
  annualCosts: number,
  monthlyMortgagePayment: number,
  cashInvested: number
): CashFlowResult {
  assertMoney(monthlyRent, "Monthly rent");
  assertMoney(annualCosts, "Annual costs");
  assertMoney(monthlyMortgagePayment, "Monthly mortgage payment");
  assertMoney(cashInvested, "Cash invested");
  const vacancy = assertFiniteNumber(vacancyPct, "Vacancy rate") / 100;
  if (vacancy < 0 || vacancy > 1) throw new Error("Vacancy rate must be between 0% and 100%.");

  const gross = monthlyRent * 12;
  const effective = gross * (1 - vacancy);
  const mortgage = monthlyMortgagePayment * 12;
  const net = effective - annualCosts - mortgage;

  return {
    annual_gross_rent: gross,
    annual_effective_rent: effective,
    annual_operating_costs: annualCosts,
    annual_mortgage_cost: mortgage,
    net_annual_cash_flow: net,
    net_monthly_cash_flow: net / 12,
    cash_invested: cashInvested,
    cash_on_cash_return: cashInvested > 0 ? net / cashInvested : null
  };
}

// --------------------------------------------------------------- PRO-015 ---

export interface RentVsBuyResult {
  total_cost_of_renting: number;
  total_cost_of_buying: number;
  property_value_at_end: number;
  mortgage_balance_at_end: number;
  equity_at_end: number;
  net_position_buying: number;
  net_position_renting: number;
  difference: number;
  better_option: string;
  breakeven_year: number | null;
}

/**
 * Compare renting against buying over a holding period.
 *
 * Both sides are reduced to a NET POSITION so the comparison is fair:
 * buying accumulates equity but pays purchase tax, interest and maintenance;
 * renting pays rent but keeps the deposit invested. Ignoring either side of
 * that would bias the answer.
 */
export function rentVsBuy(params: {
  propertyPrice: number;
  deposit: number;
  mortgageRatePct: number;
  mortgageYears: number;
  purchaseTax: number;
  annualMaintenancePct: number;
  annualGrowthPct: number;
  monthlyRent: number;
  annualRentIncreasePct: number;
  investmentReturnPct: number;
  yearsHeld: number;
}): RentVsBuyResult {
  const {
    propertyPrice, deposit, mortgageRatePct, mortgageYears, purchaseTax,
    annualMaintenancePct, annualGrowthPct, monthlyRent, annualRentIncreasePct,
    investmentReturnPct, yearsHeld
  } = params;

  assertMoney(propertyPrice, "Property price");
  assertMoney(deposit, "Deposit");
  assertMoney(monthlyRent, "Monthly rent");
  assertTermYears(yearsHeld, "Years held");
  assertTermYears(mortgageYears, "Mortgage term");

  const mortgage = propertyPrice - deposit;
  if (mortgage < 0) throw new Error("The deposit cannot exceed the property price.");

  const rate = mortgageRatePct / 100;
  const payment = mortgage > 0 ? calculatePmt(mortgage, rate, mortgageYears, "repayment") : 0;
  const monthsHeld = Math.round(yearsHeld * 12);

  // --- Buying ---
  const mortgagePaid = payment * monthsHeld;
  let maintenance = 0;
  let value = propertyPrice;
  for (let y = 0; y < yearsHeld; y++) {
    maintenance += value * (annualMaintenancePct / 100);
    value *= 1 + annualGrowthPct / 100;
  }
  const balanceEnd = mortgage > 0 ? balanceAfter(mortgage, mortgageRatePct, mortgageYears, monthsHeld) : 0;
  const totalCostBuying = deposit + purchaseTax + mortgagePaid + maintenance;
  const equityEnd = value - balanceEnd;
  // Net position: what you end up with, less what you put in.
  const netBuying = equityEnd - totalCostBuying;

  // --- Renting ---
  let rentPaid = 0;
  let rent = monthlyRent;
  for (let y = 0; y < yearsHeld; y++) {
    rentPaid += rent * 12;
    rent *= 1 + annualRentIncreasePct / 100;
  }
  // The deposit and purchase tax stay invested instead.
  const investedPot = (deposit + purchaseTax) * Math.pow(1 + investmentReturnPct / 100, yearsHeld);
  const netRenting = investedPot - (deposit + purchaseTax) - rentPaid;

  // Year at which buying first overtakes renting.
  let breakeven: number | null = null;
  for (let y = 1; y <= Math.round(yearsHeld); y++) {
    const m = y * 12;
    let v = propertyPrice, maint = 0, r2 = monthlyRent, rp = 0;
    for (let i = 0; i < y; i++) {
      maint += v * (annualMaintenancePct / 100);
      v *= 1 + annualGrowthPct / 100;
      rp += r2 * 12;
      r2 *= 1 + annualRentIncreasePct / 100;
    }
    const bal = mortgage > 0 ? balanceAfter(mortgage, mortgageRatePct, mortgageYears, m) : 0;
    const nb = (v - bal) - (deposit + purchaseTax + payment * m + maint);
    const pot = (deposit + purchaseTax) * Math.pow(1 + investmentReturnPct / 100, y);
    const nr = pot - (deposit + purchaseTax) - rp;
    if (nb > nr) { breakeven = y; break; }
  }

  return {
    total_cost_of_renting: rentPaid,
    total_cost_of_buying: totalCostBuying,
    property_value_at_end: value,
    mortgage_balance_at_end: balanceEnd,
    equity_at_end: equityEnd,
    net_position_buying: netBuying,
    net_position_renting: netRenting,
    difference: netBuying - netRenting,
    better_option: netBuying > netRenting ? "Buying" : netBuying < netRenting ? "Renting" : "Equal",
    breakeven_year: breakeven
  };
}

// --------------------------------------------------------------- PRO-017 ---

export interface RentalPropertyResult {
  annual_gross_rent: number;
  annual_effective_rent: number;
  net_operating_income: number;
  gross_yield: number | null;
  net_yield: number | null;
  annual_mortgage_cost: number;
  pre_tax_cash_flow: number;
  cash_invested: number;
  cash_on_cash_return: number | null;
  total_purchase_cost: number;
}

/** Full rental property appraisal including purchase costs. */
export function rentalProperty(params: {
  price: number;
  deposit: number;
  mortgageRatePct: number;
  mortgageYears: number;
  interestOnly: boolean;
  monthlyRent: number;
  vacancyPct: number;
  annualCosts: number;
  purchaseTax: number;
  otherPurchaseCosts: number;
}): RentalPropertyResult {
  const {
    price, deposit, mortgageRatePct, mortgageYears, interestOnly,
    monthlyRent, vacancyPct, annualCosts, purchaseTax, otherPurchaseCosts
  } = params;

  assertMoney(price, "Property price");
  assertMoney(deposit, "Deposit");
  assertMoney(monthlyRent, "Monthly rent");
  assertMoney(annualCosts, "Annual costs");
  const vacancy = vacancyPct / 100;
  if (vacancy < 0 || vacancy > 1) throw new Error("Vacancy rate must be between 0% and 100%.");

  const mortgage = price - deposit;
  if (mortgage < 0) throw new Error("The deposit cannot exceed the property price.");
  const rate = mortgageRatePct / 100;

  const monthlyPayment = mortgage > 0
    ? calculatePmt(mortgage, rate, mortgageYears, interestOnly ? "interest-only" : "repayment")
    : 0;
  const annualMortgage = monthlyPayment * 12;

  const gross = monthlyRent * 12;
  const effective = gross * (1 - vacancy);
  const noi = effective - annualCosts;
  const cashInvested = deposit + purchaseTax + otherPurchaseCosts;
  const preTaxCashFlow = noi - annualMortgage;

  return {
    annual_gross_rent: gross,
    annual_effective_rent: effective,
    net_operating_income: noi,
    gross_yield: price > 0 ? gross / price : null,
    net_yield: price > 0 ? noi / price : null,
    annual_mortgage_cost: annualMortgage,
    pre_tax_cash_flow: preTaxCashFlow,
    cash_invested: cashInvested,
    cash_on_cash_return: cashInvested > 0 ? preTaxCashFlow / cashInvested : null,
    total_purchase_cost: price + purchaseTax + otherPurchaseCosts
  };
}

// --------------------------------------------------------------- PRO-020 ---

export interface PropertyVsStocksResult {
  property_final_equity: number;
  property_total_invested: number;
  property_net_gain: number;
  stocks_final_value: number;
  stocks_total_invested: number;
  stocks_net_gain: number;
  difference: number;
  better_option: string;
}

/**
 * Compare a geared property investment against an ungeared stock portfolio.
 *
 * The comparison is deliberately like-for-like on CASH INVESTED: the same
 * deposit and purchase costs are assumed to go into the portfolio instead, and
 * any property cash shortfall is treated as further contributions on both
 * sides, so leverage is compared honestly rather than flattered.
 */
export function propertyVsStocks(params: {
  price: number;
  deposit: number;
  purchaseCosts: number;
  mortgageRatePct: number;
  mortgageYears: number;
  monthlyRent: number;
  annualCosts: number;
  propertyGrowthPct: number;
  stockReturnPct: number;
  years: number;
}): PropertyVsStocksResult {
  const {
    price, deposit, purchaseCosts, mortgageRatePct, mortgageYears,
    monthlyRent, annualCosts, propertyGrowthPct, stockReturnPct, years
  } = params;

  assertMoney(price, "Property price");
  assertMoney(deposit, "Deposit");
  assertTermYears(years, "Years");

  const mortgage = price - deposit;
  if (mortgage < 0) throw new Error("The deposit cannot exceed the property price.");
  const payment = mortgage > 0 ? calculatePmt(mortgage, mortgageRatePct / 100, mortgageYears, "repayment") : 0;
  const months = Math.round(years * 12);

  const value = price * Math.pow(1 + propertyGrowthPct / 100, years);
  const balance = mortgage > 0 ? balanceAfter(mortgage, mortgageRatePct, mortgageYears, months) : 0;
  const netRentalIncome = (monthlyRent * 12 - annualCosts) * years;
  const mortgagePaid = payment * months;
  const propertyInvested = deposit + purchaseCosts + mortgagePaid - netRentalIncome;
  const propertyEquity = value - balance;

  // The stock portfolio starts with the same cash and receives the same net
  // periodic outlay the property demands.
  const upfront = deposit + purchaseCosts;
  const monthlyNetOutlay = payment - (monthlyRent - annualCosts / 12);
  const r = stockReturnPct / 100 / 12;
  let pot = upfront;
  let contributed = upfront;
  for (let i = 0; i < months; i++) {
    pot = pot * (1 + r) + Math.max(0, monthlyNetOutlay);
    contributed += Math.max(0, monthlyNetOutlay);
  }

  return {
    property_final_equity: propertyEquity,
    property_total_invested: propertyInvested,
    property_net_gain: propertyEquity - propertyInvested,
    stocks_final_value: pot,
    stocks_total_invested: contributed,
    stocks_net_gain: pot - contributed,
    difference: (propertyEquity - propertyInvested) - (pot - contributed),
    better_option:
      propertyEquity - propertyInvested > pot - contributed ? "Property" : "Stocks"
  };
}
