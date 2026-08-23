/**
 * Wave 2 Finance & Debt calculators.
 *
 * These reuse the Wave 1 amortisation and credit-card engines wherever the
 * mathematics is genuinely the same; only the parts that differ (fees,
 * consolidation comparison, savings targets) are new.
 */
import { calculatePmt, calculateAmortisation } from "../loan/core.js";
import { calculateCreditCardPayoff } from "../personal/core.js";
import { assertMoney, assertTermYears, assertFiniteNumber } from "../../common/validation.js";

/** Monthly rate from an annual nominal rate. */
function monthlyRate(annualRate: number): number {
  return annualRate / 12;
}

// ---------------------------------------------------------------------------
// FIN-003 Business Loan / FIN-004 Secured Loan
// ---------------------------------------------------------------------------

export interface AmortisingLoanResult {
  monthly_payment: number;
  total_repayment: number;
  total_interest: number;
  /** Arrangement/product fee, financed or paid up front. */
  fee: number;
  /** What the borrower actually receives after an up-front fee. */
  amount_advanced: number;
  total_cost_of_credit: number;
}

/**
 * An amortising loan with an optional arrangement fee.
 *
 * `feeFinanced` decides whether the fee is added to the amount borrowed (and
 * therefore attracts interest) or paid separately up front. That distinction
 * changes the monthly payment, so it must be explicit rather than assumed.
 */
export function amortisingLoanWithFee(
  principal: number,
  annualRatePct: number,
  years: number,
  fee: number = 0,
  feeFinanced: boolean = true
): AmortisingLoanResult {
  assertMoney(principal, "Loan amount");
  assertTermYears(years, "Term");
  assertMoney(fee, "Fee");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;

  const financed = feeFinanced ? principal + fee : principal;
  const payment = calculatePmt(financed, rate, years, "repayment");
  const months = Math.round(years * 12);
  const totalRepayment = payment * months;
  const totalInterest = totalRepayment - financed;

  return {
    monthly_payment: payment,
    total_repayment: totalRepayment,
    total_interest: totalInterest,
    fee,
    amount_advanced: feeFinanced ? principal : principal - fee,
    // Everything the borrowing costs above the sum actually received.
    total_cost_of_credit: totalInterest + fee
  };
}

// ---------------------------------------------------------------------------
// FIN-007 Amortisation schedule
// ---------------------------------------------------------------------------

export interface AmortisationSummary {
  monthly_payment: number;
  total_repayment: number;
  total_interest: number;
  payoff_months: number;
  /** Interest paid across the first twelve months. */
  first_year_interest: number;
  /** Capital repaid across the first twelve months. */
  first_year_principal: number;
  balance_after_year_one: number;
}

export function amortisationSummary(
  principal: number,
  annualRatePct: number,
  years: number
): { summary: AmortisationSummary; schedule: ReturnType<typeof calculateAmortisation>["schedule"] } {
  assertMoney(principal, "Loan amount");
  assertTermYears(years, "Term");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;

  const result = calculateAmortisation(principal, rate, years);
  const firstYear = result.schedule.slice(0, 12);
  const firstYearInterest = firstYear.reduce((sum, row) => sum + row.interest, 0);
  const firstYearPrincipal = firstYear.reduce((sum, row) => sum + row.principal, 0);
  const payment = calculatePmt(principal, rate, years, "repayment");

  return {
    summary: {
      monthly_payment: payment,
      total_repayment: principal + result.totalInterest,
      total_interest: result.totalInterest,
      payoff_months: result.payoffMonths,
      first_year_interest: firstYearInterest,
      first_year_principal: firstYearPrincipal,
      balance_after_year_one:
        firstYear.length > 0 ? firstYear[firstYear.length - 1].balance : principal
    },
    schedule: result.schedule
  };
}

// ---------------------------------------------------------------------------
// FIN-008 Debt-to-Income ratio
// ---------------------------------------------------------------------------

export interface DebtToIncomeResult {
  gross_monthly_income: number;
  total_monthly_debt: number;
  dti_ratio: number;
  front_end_ratio: number | null;
  assessment: string;
}

/**
 * Debt-to-income on gross monthly income.
 *
 * `housing` is optional and only used for the front-end (housing-only) ratio,
 * which lenders assess separately from total debt.
 */
export function debtToIncome(
  grossMonthlyIncome: number,
  totalMonthlyDebt: number,
  housingPayment?: number
): DebtToIncomeResult {
  assertMoney(grossMonthlyIncome, "Gross monthly income");
  assertMoney(totalMonthlyDebt, "Total monthly debt payments");
  if (grossMonthlyIncome === 0) {
    throw new Error("Gross monthly income must be greater than zero to calculate a ratio.");
  }

  const dti = totalMonthlyDebt / grossMonthlyIncome;
  // Bands are presentational guidance, not a lending decision.
  const assessment =
    dti <= 0.2 ? "Low" : dti <= 0.35 ? "Manageable" : dti <= 0.5 ? "High" : "Very high";

  return {
    gross_monthly_income: grossMonthlyIncome,
    total_monthly_debt: totalMonthlyDebt,
    dti_ratio: dti,
    front_end_ratio:
      housingPayment === undefined ? null : housingPayment / grossMonthlyIncome,
    assessment
  };
}

// ---------------------------------------------------------------------------
// FIN-010 Credit card payoff
// ---------------------------------------------------------------------------

export interface CardPayoffResult {
  months: number;
  total_interest: number;
  total_repaid: number;
  /** Payment needed to clear the balance within the requested number of months. */
  payment_for_target: number | null;
}

/**
 * Credit-card payoff. Reuses the Wave 1 engine for the payoff itself and adds
 * the inverse question - what payment clears the card in a target time.
 */
export function creditCardPayoff(
  balance: number,
  aprPct: number,
  monthlyPayment: number,
  targetMonths?: number
): CardPayoffResult {
  assertMoney(balance, "Balance");
  assertMoney(monthlyPayment, "Monthly payment");
  const apr = assertFiniteNumber(aprPct, "APR") / 100;

  const result = calculateCreditCardPayoff(balance, apr, monthlyPayment);

  let paymentForTarget: number | null = null;
  if (targetMonths !== undefined) {
    const n = Math.round(assertFiniteNumber(targetMonths, "Target months"));
    if (n <= 0) throw new Error("Target months must be greater than zero.");
    const r = monthlyRate(apr);
    // Standard annuity payment: the level payment that amortises the balance.
    paymentForTarget = r === 0 ? balance / n : (balance * r) / (1 - Math.pow(1 + r, -n));
  }

  return {
    months: result.months,
    total_interest: result.totalInterest,
    total_repaid: balance + result.totalInterest,
    payment_for_target: paymentForTarget
  };
}

// ---------------------------------------------------------------------------
// FIN-012 Debt consolidation
// ---------------------------------------------------------------------------

export interface ExistingDebt {
  balance: number;
  apr: number;
  monthly_payment: number;
}

export interface ConsolidationResult {
  current_total_balance: number;
  current_monthly_payment: number;
  current_total_interest: number;
  current_payoff_months: number;
  consolidated_monthly_payment: number;
  consolidated_total_interest: number;
  consolidated_total_repayment: number;
  monthly_payment_change: number;
  total_interest_change: number;
  /** True when consolidating costs more interest overall despite lower monthly payments. */
  costs_more_overall: boolean;
}

/**
 * Compare keeping several debts against consolidating them into one loan.
 *
 * The comparison deliberately reports BOTH the monthly payment change and the
 * total interest change, because a longer consolidation term routinely lowers
 * the monthly payment while increasing the total cost - presenting only the
 * monthly saving would mislead.
 */
export function debtConsolidation(
  debts: ExistingDebt[],
  consolidationAprPct: number,
  consolidationYears: number,
  fee: number = 0
): ConsolidationResult {
  if (!Array.isArray(debts) || debts.length === 0) {
    throw new Error("Enter at least one existing debt.");
  }
  assertTermYears(consolidationYears, "Consolidation term");
  const consolidationApr = assertFiniteNumber(consolidationAprPct, "Consolidation APR") / 100;
  assertMoney(fee, "Fee");

  let currentBalance = 0;
  let currentMonthly = 0;
  let currentInterest = 0;
  let currentMonths = 0;

  for (const [index, debt] of debts.entries()) {
    assertMoney(debt.balance, `Debt ${index + 1} balance`);
    assertMoney(debt.monthly_payment, `Debt ${index + 1} monthly payment`);
    // Existing debt APRs arrive as human percentages (21.9 meaning 21.9%);
    // calculateCreditCardPayoff takes a decimal fraction, so normalise here.
    const apr = assertFiniteNumber(debt.apr, `Debt ${index + 1} APR`) / 100;
    if (apr < 0) throw new Error(`Debt ${index + 1} APR cannot be negative.`);
    // Each existing debt is run to payoff on its own terms.
    const payoff = calculateCreditCardPayoff(debt.balance, apr, debt.monthly_payment);
    if (!Number.isFinite(payoff.totalInterest)) {
      throw new Error(
        `Debt ${index + 1}: a monthly payment of ${debt.monthly_payment} never clears a balance of ${debt.balance} at ${assertFiniteNumber(debt.apr, "APR")}% APR.`
      );
    }
    currentBalance += debt.balance;
    currentMonthly += debt.monthly_payment;
    currentInterest += payoff.totalInterest;
    currentMonths = Math.max(currentMonths, payoff.months);
  }

  const financed = currentBalance + fee;
  const payment = calculatePmt(financed, consolidationApr, consolidationYears, "repayment");
  const months = Math.round(consolidationYears * 12);
  const consolidatedRepayment = payment * months;
  const consolidatedInterest = consolidatedRepayment - financed;

  return {
    current_total_balance: currentBalance,
    current_monthly_payment: currentMonthly,
    current_total_interest: currentInterest,
    current_payoff_months: currentMonths,
    consolidated_monthly_payment: payment,
    consolidated_total_interest: consolidatedInterest,
    consolidated_total_repayment: consolidatedRepayment,
    monthly_payment_change: payment - currentMonthly,
    total_interest_change: consolidatedInterest - currentInterest,
    costs_more_overall: consolidatedInterest > currentInterest
  };
}

// ---------------------------------------------------------------------------
// FIN-014 Emergency fund
// ---------------------------------------------------------------------------

export interface EmergencyFundResult {
  monthly_essential_spending: number;
  target_fund: number;
  current_savings: number;
  shortfall: number;
  months_covered_now: number;
  months_to_target: number | null;
}

export function emergencyFund(
  monthlyEssentials: number,
  monthsOfCover: number,
  currentSavings: number = 0,
  monthlyContribution: number = 0
): EmergencyFundResult {
  assertMoney(monthlyEssentials, "Monthly essential spending");
  assertMoney(currentSavings, "Current savings");
  assertMoney(monthlyContribution, "Monthly contribution");
  const months = assertFiniteNumber(monthsOfCover, "Months of cover");
  if (months <= 0) throw new Error("Months of cover must be greater than zero.");
  if (monthlyEssentials === 0) {
    throw new Error("Monthly essential spending must be greater than zero.");
  }

  const target = monthlyEssentials * months;
  const shortfall = Math.max(0, target - currentSavings);

  return {
    monthly_essential_spending: monthlyEssentials,
    target_fund: target,
    current_savings: currentSavings,
    shortfall,
    months_covered_now: currentSavings / monthlyEssentials,
    // Cash savings only - no growth assumption, because an emergency fund is
    // held in accessible cash by definition.
    months_to_target:
      shortfall === 0 ? 0 : monthlyContribution > 0 ? Math.ceil(shortfall / monthlyContribution) : null
  };
}

// ---------------------------------------------------------------------------
// FIN-015 Savings goal
// ---------------------------------------------------------------------------

export interface SavingsGoalResult {
  target_amount: number;
  months: number;
  required_monthly_saving: number;
  total_contributions: number;
  interest_earned: number;
  projected_value: number;
}

/**
 * The level monthly contribution needed to reach a target.
 *
 * Contributions are treated as made at the END of each month (an ordinary
 * annuity), which is the conservative convention: a contribution cannot earn
 * interest before it is paid in.
 */
export function savingsGoal(
  target: number,
  months: number,
  annualRatePct: number = 0,
  startingAmount: number = 0
): SavingsGoalResult {
  assertMoney(target, "Target amount");
  assertMoney(startingAmount, "Starting amount", { allowNegative: false });
  const n = Math.round(assertFiniteNumber(months, "Months"));
  if (n <= 0) throw new Error("Number of months must be greater than zero.");
  if (n > 12 * 150) throw new Error("Number of months is longer than this calculator supports.");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;
  const r = monthlyRate(rate);

  // Future value of the existing balance.
  const grownStart = startingAmount * Math.pow(1 + r, n);
  const remaining = target - grownStart;

  let required: number;
  if (remaining <= 0) {
    required = 0;
  } else if (r === 0) {
    required = remaining / n;
  } else {
    // FV of an ordinary annuity: PMT * ((1+r)^n - 1) / r
    required = (remaining * r) / (Math.pow(1 + r, n) - 1);
  }

  const totalContributions = required * n;
  const projected =
    grownStart + (r === 0 ? totalContributions : (required * (Math.pow(1 + r, n) - 1)) / r);

  return {
    target_amount: target,
    months: n,
    required_monthly_saving: required,
    total_contributions: totalContributions,
    interest_earned: projected - startingAmount - totalContributions,
    projected_value: projected
  };
}
