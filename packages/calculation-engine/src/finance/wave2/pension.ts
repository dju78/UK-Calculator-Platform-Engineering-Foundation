/**
 * Wave 2 Pensions & Retirement calculators.
 *
 * Statutory figures come from the versioned UK Rules Engine and are passed in
 * by the handler. Percentages arrive as human percentages (5 means 5%) and are
 * normalised exactly once.
 */
import { assertMoney, assertTermYears, assertFiniteNumber } from "../../common/validation.js";
import { calculateIncomeTax } from "../tax/core.js";

// ---------------------------------------------------------------------------
// PEN-004 Employer Pension Contribution
// ---------------------------------------------------------------------------

export type ContributionBasis = "qualifying_earnings" | "basic_pay" | "total_pay";

export function normaliseBasis(value: unknown): ContributionBasis {
  const raw = String(value ?? "qualifying_earnings").toLowerCase().trim();
  if (raw === "basic_pay" || raw === "basic") return "basic_pay";
  if (raw === "total_pay" || raw === "total") return "total_pay";
  return "qualifying_earnings";
}

export interface EmployerContributionResult {
  salary: number;
  contribution_basis: ContributionBasis;
  pensionable_earnings: number;
  employer_contribution: number;
  employee_contribution: number;
  total_contribution: number;
  auto_enrolment_eligible: boolean;
  employer_minimum_required: number;
  total_minimum_required: number;
  meets_employer_minimum: boolean;
  meets_total_minimum: boolean;
  employer_shortfall: number;
  total_shortfall: number;
  contribution_as_share_of_salary: number;
}

/**
 * Employer and employee pension contributions on a chosen contribution basis.
 *
 * The basis is the point of this calculator. Automatic enrolment minimums are
 * expressed on QUALIFYING EARNINGS - a band, not the whole salary - so an
 * employer paying "3% of pay" on total pay is contributing more than the
 * statutory minimum, while a scheme quoting 3% could still be short if it uses
 * a narrower definition. Comparing the two requires modelling the basis
 * explicitly rather than multiplying salary by a rate.
 */
export function employerPensionContribution(
  annualSalary: number,
  basis: ContributionBasis,
  employerRatePct: number,
  employeeRatePct: number,
  rules: any
): EmployerContributionResult {
  const salary = assertMoney(annualSalary, "Annual salary");
  const employerRate = assertFiniteNumber(employerRatePct, "Employer contribution") / 100;
  const employeeRate = assertFiniteNumber(employeeRatePct, "Employee contribution") / 100;
  if (employerRate < 0 || employerRate > 1 || employeeRate < 0 || employeeRate > 1) {
    throw new Error("Contribution rates must be between 0% and 100% of the contribution basis.");
  }

  const ae = rules.workplace_pension_auto_enrolment;
  const lower = ae.qualifying_earnings_lower_limit_annual_gbp;
  const upper = ae.qualifying_earnings_upper_limit_annual_gbp;

  const qualifying = Math.max(0, Math.min(salary, upper) - lower);
  const pensionable =
    basis === "qualifying_earnings" ? qualifying : salary;

  const employer = pensionable * employerRate;
  const employee = pensionable * employeeRate;

  // The statutory minimums are always measured on qualifying earnings,
  // whatever basis the scheme itself uses.
  const employerMinimum = qualifying * ae.minimum_employer_contribution_rate;
  const totalMinimum = qualifying * ae.minimum_total_contribution_rate;

  return {
    salary,
    contribution_basis: basis,
    pensionable_earnings: pensionable,
    employer_contribution: employer,
    employee_contribution: employee,
    total_contribution: employer + employee,
    auto_enrolment_eligible: salary >= ae.earnings_trigger_annual_gbp,
    employer_minimum_required: employerMinimum,
    total_minimum_required: totalMinimum,
    meets_employer_minimum: employer >= employerMinimum - 0.005,
    meets_total_minimum: employer + employee >= totalMinimum - 0.005,
    employer_shortfall: Math.max(0, employerMinimum - employer),
    total_shortfall: Math.max(0, totalMinimum - (employer + employee)),
    contribution_as_share_of_salary: salary > 0 ? (employer + employee) / salary : 0
  };
}

// ---------------------------------------------------------------------------
// PEN-005 Pension Tax Relief
// ---------------------------------------------------------------------------

export type ReliefArrangement = "relief_at_source" | "net_pay" | "salary_sacrifice";

export function normaliseReliefArrangement(value: unknown): ReliefArrangement {
  const raw = String(value ?? "relief_at_source").toLowerCase().trim();
  if (raw === "net_pay") return "net_pay";
  if (raw === "salary_sacrifice") return "salary_sacrifice";
  return "relief_at_source";
}

export interface PensionReliefResult {
  gross_income: number;
  arrangement: ReliefArrangement;
  personal_payment: number;
  basic_rate_relief_added: number;
  gross_contribution: number;
  higher_rate_relief_claimable: number;
  total_tax_relief: number;
  net_cost: number;
  relief_rate: number;
  annual_allowance: number;
  tapered: boolean;
  money_purchase_allowance_applies: boolean;
  allowance_used: number;
  allowance_remaining: number;
  excess_over_allowance: number;
  annual_allowance_charge: number;
  earnings_limit_exceeded: boolean;
}

/**
 * Pension tax relief and the annual allowance.
 *
 * The three arrangements deliver the SAME relief to a basic-rate taxpayer by
 * different routes, and materially different outcomes to a higher-rate one, so
 * they are modelled separately rather than through a shared rate:
 *
 *   relief at source  - paid from net pay, the provider reclaims basic rate,
 *                       and higher-rate relief must be claimed separately.
 *   net pay           - taken from gross pay, so full relief is immediate.
 *   salary sacrifice  - gross pay is reduced, so National Insurance is saved
 *                       as well as Income Tax.
 */
export function pensionTaxRelief(
  grossIncome: number,
  personalPayment: number,
  arrangement: ReliefArrangement,
  employerContribution: number,
  hasFlexiblyAccessed: boolean,
  jurisdiction: string,
  rules: any
): PensionReliefResult {
  const income = assertMoney(grossIncome, "Gross income");
  const payment = assertMoney(personalPayment, "Pension contribution");
  const employer = assertMoney(employerContribution, "Employer contribution");

  const pen = rules.pension;
  const it = rules.income_tax_england_wales_ni;
  const basicRate = pen.relief_at_source_basic_rate;

  // Relief at source: the provider adds basic-rate relief to what the member
  // pays, so a £80 payment becomes £100 in the pension.
  const grossContribution =
    arrangement === "relief_at_source" ? payment / (1 - basicRate) : payment;
  const basicReliefAdded = grossContribution - payment;

  // Higher-rate relief. Under relief at source it must be claimed; under net
  // pay and sacrifice it is already given, so nothing further is claimable.
  const taxWithout = calculateIncomeTax(income, jurisdiction, rules).tax;
  const taxWith = calculateIncomeTax(Math.max(0, income - grossContribution), jurisdiction, rules).tax;
  const totalIncomeTaxRelief = taxWithout - taxWith;
  const higherRateClaimable =
    arrangement === "relief_at_source"
      ? Math.max(0, totalIncomeTaxRelief - basicReliefAdded)
      : 0;

  const totalRelief =
    arrangement === "relief_at_source"
      ? basicReliefAdded + higherRateClaimable
      : totalIncomeTaxRelief;

  const netCost = grossContribution - totalRelief;

  // --- Annual allowance -------------------------------------------------
  // The taper applies only when threshold income is above its own limit, so
  // someone with high adjusted income but modest threshold income keeps the
  // full allowance. Skipping that test is the usual error.
  let allowance = pen.annual_allowance_gbp;
  let tapered = false;
  const thresholdIncome = income - (arrangement === "net_pay" ? grossContribution : 0);
  const adjustedIncome = income + employer;
  if (
    thresholdIncome > pen.threshold_income_taper_gbp &&
    adjustedIncome > pen.adjusted_income_taper_gbp
  ) {
    const excess = adjustedIncome - pen.adjusted_income_taper_gbp;
    allowance = Math.max(pen.minimum_tapered_annual_allowance_gbp, allowance - excess / 2);
    tapered = allowance < pen.annual_allowance_gbp;
  }

  // Flexibly accessing a pot replaces the allowance for money purchase
  // contributions with a much smaller one.
  const mpaaApplies = hasFlexiblyAccessed;
  if (mpaaApplies) {
    allowance = Math.min(allowance, pen.money_purchase_annual_allowance_gbp);
  }

  const used = grossContribution + employer;
  const excessOver = Math.max(0, used - allowance);

  // The charge claws relief back at the member's marginal rate, which is
  // found by adding the excess back on top of income.
  const taxOnExcess =
    calculateIncomeTax(income + excessOver, jurisdiction, rules).tax -
    calculateIncomeTax(income, jurisdiction, rules).tax;

  return {
    gross_income: income,
    arrangement,
    personal_payment: payment,
    basic_rate_relief_added: arrangement === "relief_at_source" ? basicReliefAdded : 0,
    gross_contribution: grossContribution,
    higher_rate_relief_claimable: higherRateClaimable,
    total_tax_relief: totalRelief,
    net_cost: netCost,
    relief_rate: grossContribution > 0 ? totalRelief / grossContribution : 0,
    annual_allowance: allowance,
    tapered,
    money_purchase_allowance_applies: mpaaApplies,
    allowance_used: used,
    allowance_remaining: Math.max(0, allowance - used),
    excess_over_allowance: excessOver,
    annual_allowance_charge: excessOver > 0 ? taxOnExcess : 0,
    // Tax relief on personal contributions is limited to relevant UK earnings.
    earnings_limit_exceeded: grossContribution > income
  };
}

// ---------------------------------------------------------------------------
// State Pension entitlement, shared by PEN-007, PEN-010 and PEN-012
// ---------------------------------------------------------------------------

export interface StatePensionEntitlement {
  qualifying_years: number;
  meets_minimum: boolean;
  weekly_amount: number;
  annual_amount: number;
  proportion_of_full: number;
  years_short_of_full: number;
  value_of_one_more_year_weekly: number;
  value_of_one_more_year_annual: number;
}

/**
 * State Pension entitlement from qualifying years.
 *
 * The minimum is a CLIFF, not a taper: below it the entitlement is nil rather
 * than a small amount. Scaling linearly from zero would tell someone with
 * eight qualifying years that they will receive a pension they will not get.
 */
export function statePensionEntitlement(
  qualifyingYears: number,
  rules: any
): StatePensionEntitlement {
  const years = assertFiniteNumber(qualifyingYears, "Qualifying years");
  if (years < 0) throw new Error("Qualifying years cannot be negative.");

  const sp = rules.state_pension;
  const full = sp.full_entitlement_qualifying_years;
  const minimum = sp.minimum_qualifying_years;
  const weeklyFull = sp.new_state_pension_weekly_gbp;
  const weeks = sp.weeks_per_year;

  const counted = Math.min(years, full);
  const meets = years >= minimum;
  const weekly = meets ? (weeklyFull * counted) / full : 0;

  // One more year is worth nothing below the minimum until the minimum is
  // reached, and nothing at all once the record is already full.
  let extraWeekly = 0;
  if (years + 1 >= minimum && years < full) {
    const nextCounted = Math.min(years + 1, full);
    extraWeekly = (weeklyFull * nextCounted) / full - weekly;
  }

  return {
    qualifying_years: years,
    meets_minimum: meets,
    weekly_amount: weekly,
    annual_amount: weekly * weeks,
    proportion_of_full: weeklyFull > 0 ? weekly / weeklyFull : 0,
    years_short_of_full: Math.max(0, full - years),
    value_of_one_more_year_weekly: extraWeekly,
    value_of_one_more_year_annual: extraWeekly * weeks
  };
}

// ---------------------------------------------------------------------------
// PEN-007 Retirement Income
// ---------------------------------------------------------------------------

export interface RetirementIncomeResult {
  pension_pot: number;
  tax_free_lump_sum: number;
  lump_sum_capped_by_allowance: boolean;
  pot_after_lump_sum: number;
  drawdown_income: number;
  state_pension_income: number;
  other_income: number;
  total_gross_income: number;
  personal_allowance: number;
  income_tax: number;
  total_net_income: number;
  monthly_net_income: number;
  effective_tax_rate: number;
}

export function retirementIncome(
  pensionPot: number,
  takeLumpSum: boolean,
  drawdownRatePct: number,
  qualifyingYears: number,
  otherIncome: number,
  jurisdiction: string,
  rules: any
): RetirementIncomeResult {
  const pot = assertMoney(pensionPot, "Pension pot");
  const rate = assertFiniteNumber(drawdownRatePct, "Drawdown rate") / 100;
  const other = assertMoney(otherIncome, "Other income");
  if (rate < 0 || rate > 1) throw new Error("The drawdown rate must be between 0% and 100% of the pot.");

  const pen = rules.pension;
  const uncapped = takeLumpSum ? pot * pen.tax_free_lump_sum_proportion : 0;
  const lumpSum = Math.min(uncapped, pen.lump_sum_allowance_gbp);
  const remaining = pot - lumpSum;

  const drawdown = remaining * rate;
  const sp = statePensionEntitlement(qualifyingYears, rules);

  // The tax-free lump sum is not income, so it is deliberately excluded from
  // the taxable total. The State Pension IS taxable, even though it is paid
  // without tax deducted, which is why people are caught out by it.
  const grossIncome = drawdown + sp.annual_amount + other;
  const { tax, personalAllowance } = calculateIncomeTax(grossIncome, jurisdiction, rules);

  return {
    pension_pot: pot,
    tax_free_lump_sum: lumpSum,
    lump_sum_capped_by_allowance: uncapped > lumpSum,
    pot_after_lump_sum: remaining,
    drawdown_income: drawdown,
    state_pension_income: sp.annual_amount,
    other_income: other,
    total_gross_income: grossIncome,
    personal_allowance: personalAllowance,
    income_tax: tax,
    total_net_income: grossIncome - tax,
    monthly_net_income: (grossIncome - tax) / 12,
    effective_tax_rate: grossIncome > 0 ? tax / grossIncome : 0
  };
}

// ---------------------------------------------------------------------------
// PEN-008 Pension Drawdown
// ---------------------------------------------------------------------------

export interface DrawdownResult {
  starting_pot: number;
  tax_free_lump_sum: number;
  pot_after_lump_sum: number;
  first_year_withdrawal: number;
  final_year_withdrawal: number;
  total_withdrawn: number;
  years_pot_lasts: number | null;
  pot_exhausted: boolean;
  final_pot_value: number;
  real_value_of_final_withdrawal: number;
  sustainable_annual_withdrawal: number;
}

/**
 * Pension drawdown, simulated year by year.
 *
 * Withdrawals rise with inflation while the pot grows at the assumed return,
 * so the calculator answers the question people actually ask - how long does
 * it last - rather than showing a flat withdrawal that quietly loses a third
 * of its buying power over twenty years.
 */
export function pensionDrawdown(
  pot: number,
  takeLumpSum: boolean,
  annualWithdrawal: number,
  annualGrowthPct: number,
  inflationPct: number,
  projectionYears: number,
  rules: any
): DrawdownResult {
  const starting = assertMoney(pot, "Pension pot");
  const withdrawal = assertMoney(annualWithdrawal, "Annual withdrawal");
  const growth = assertFiniteNumber(annualGrowthPct, "Annual growth") / 100;
  const inflation = assertFiniteNumber(inflationPct, "Inflation") / 100;
  const years = assertTermYears(projectionYears, "Projection period");

  const pen = rules.pension;
  const uncapped = takeLumpSum ? starting * pen.tax_free_lump_sum_proportion : 0;
  const lumpSum = Math.min(uncapped, pen.lump_sum_allowance_gbp);

  const simulate = (annual: number, horizon: number) => {
    let balance = starting - lumpSum;
    let taken = 0;
    let thisYear = annual;
    let exhaustedAt: number | null = null;
    let last = 0;
    for (let y = 1; y <= horizon; y++) {
      const drawn = Math.min(thisYear, balance);
      balance -= drawn;
      taken += drawn;
      last = drawn;
      if (balance <= 0 && exhaustedAt === null) {
        exhaustedAt = y;
        balance = 0;
        break;
      }
      balance *= 1 + growth;
      thisYear *= 1 + inflation;
    }
    return { balance, taken, exhaustedAt, last };
  };

  const wholeYears = Math.round(years);
  const run = simulate(withdrawal, wholeYears);

  // The level first-year withdrawal, rising with inflation, that leaves the
  // pot at zero exactly at the end of the projection. Found by bisection
  // because the relationship has no closed form once inflation indexing and
  // growth interact.
  let lo = 0, hi = Math.max(starting, 1);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const test = simulate(mid, wholeYears);
    if (test.exhaustedAt === null && test.balance > 0) lo = mid;
    else hi = mid;
  }
  const sustainable = (lo + hi) / 2;

  return {
    starting_pot: starting,
    tax_free_lump_sum: lumpSum,
    pot_after_lump_sum: starting - lumpSum,
    first_year_withdrawal: withdrawal,
    final_year_withdrawal: run.last,
    total_withdrawn: run.taken,
    years_pot_lasts: run.exhaustedAt,
    pot_exhausted: run.exhaustedAt !== null,
    final_pot_value: run.balance,
    // What the last withdrawal is worth in today's money.
    real_value_of_final_withdrawal:
      run.last / Math.pow(1 + inflation, Math.min(wholeYears, run.exhaustedAt ?? wholeYears)),
    sustainable_annual_withdrawal: sustainable
  };
}

// ---------------------------------------------------------------------------
// PEN-009 Annuity
// ---------------------------------------------------------------------------

export interface AnnuityResult {
  pension_pot: number;
  tax_free_lump_sum: number;
  purchase_amount: number;
  first_year_income: number;
  monthly_income: number;
  final_year_income: number;
  total_income_over_period: number;
  guaranteed_minimum_income: number;
  spouse_annual_income: number;
  years_to_recover_purchase_price: number | null;
  income_as_share_of_purchase: number;
}

/**
 * Annuity income from a pot at a quoted annuity rate.
 *
 * The annuity rate is an INPUT, not a statutory value: it is set by the
 * insurer and depends on age, health, gilt yields and the options chosen. The
 * calculator therefore prices the options the buyer selects rather than
 * pretending to know the market.
 */
export function annuity(
  pot: number,
  takeLumpSum: boolean,
  annuityRatePct: number,
  escalationPct: number,
  guaranteePeriodYears: number,
  spouseProportionPct: number,
  projectionYears: number,
  rules: any
): AnnuityResult {
  const starting = assertMoney(pot, "Pension pot");
  const rate = assertFiniteNumber(annuityRatePct, "Annuity rate") / 100;
  const escalation = assertFiniteNumber(escalationPct, "Escalation") / 100;
  const guarantee = assertFiniteNumber(guaranteePeriodYears, "Guarantee period");
  const spouse = assertFiniteNumber(spouseProportionPct, "Spouse's pension") / 100;
  const years = assertTermYears(projectionYears, "Projection period");

  if (rate <= 0) throw new Error("Enter the annuity rate quoted to you, for example 6 for 6%.");
  if (guarantee < 0) throw new Error("A guarantee period cannot be negative.");
  if (spouse < 0 || spouse > 1) throw new Error("A spouse's pension is between 0% and 100% of your income.");

  const pen = rules.pension;
  const uncapped = takeLumpSum ? starting * pen.tax_free_lump_sum_proportion : 0;
  const lumpSum = Math.min(uncapped, pen.lump_sum_allowance_gbp);
  const purchase = starting - lumpSum;

  const first = purchase * rate;
  const wholeYears = Math.round(years);

  let total = 0, last = 0, income = first;
  let recovered: number | null = null;
  for (let y = 1; y <= wholeYears; y++) {
    total += income;
    last = income;
    if (recovered === null && total >= purchase) recovered = y;
    income *= 1 + escalation;
  }

  // If the buyer dies inside the guarantee period the income continues to
  // their estate for the rest of it, so that total is the floor.
  let guaranteed = 0, gIncome = first;
  for (let y = 1; y <= Math.round(guarantee); y++) {
    guaranteed += gIncome;
    gIncome *= 1 + escalation;
  }

  return {
    pension_pot: starting,
    tax_free_lump_sum: lumpSum,
    purchase_amount: purchase,
    first_year_income: first,
    monthly_income: first / 12,
    final_year_income: last,
    total_income_over_period: total,
    guaranteed_minimum_income: guaranteed,
    spouse_annual_income: first * spouse,
    years_to_recover_purchase_price: recovered,
    income_as_share_of_purchase: purchase > 0 ? first / purchase : 0
  };
}

// ---------------------------------------------------------------------------
// PEN-012 Retirement Target
// ---------------------------------------------------------------------------

export interface RetirementTargetResult {
  target_annual_income: number;
  state_pension_income: number;
  income_needed_from_pot: number;
  target_pot: number;
  projected_pot: number;
  shortfall: number;
  surplus: number;
  on_track: boolean;
  required_monthly_contribution: number;
  additional_monthly_contribution_needed: number;
  years_to_retirement: number;
}

/**
 * Work back from a target retirement income to the pot and the monthly saving
 * it requires.
 *
 * The required contribution is solved directly from the annuity-due future
 * value rather than found by trial and error, so it is exact.
 */
export function retirementTarget(
  targetAnnualIncome: number,
  currentPot: number,
  monthlyContribution: number,
  yearsToRetirement: number,
  annualGrowthPct: number,
  safeWithdrawalRatePct: number,
  includeStatePension: boolean,
  qualifyingYears: number,
  rules: any
): RetirementTargetResult {
  const target = assertMoney(targetAnnualIncome, "Target income");
  const pot = assertMoney(currentPot, "Current pot");
  const monthly = assertMoney(monthlyContribution, "Monthly contribution");
  const years = assertTermYears(yearsToRetirement, "Years to retirement");
  const growth = assertFiniteNumber(annualGrowthPct, "Annual growth") / 100;
  const swr = assertFiniteNumber(safeWithdrawalRatePct, "Safe withdrawal rate") / 100;

  if (swr <= 0) throw new Error("The safe withdrawal rate must be above 0%, for example 4 for 4%.");

  const sp = includeStatePension ? statePensionEntitlement(qualifyingYears, rules) : null;
  const stateIncome = sp ? sp.annual_amount : 0;
  const fromPot = Math.max(0, target - stateIncome);
  const targetPot = fromPot / swr;

  const i = Math.pow(1 + growth, 1 / 12) - 1;
  const n = Math.round(years * 12);
  const factor = i === 0 ? n : (Math.pow(1 + i, n) - 1) / i;
  const grownPot = pot * Math.pow(1 + i, n);
  const projected = grownPot + monthly * factor;

  // Required contribution solved directly, not searched for, then rounded UP
  // to the penny. Rounding to nearest would leave a figure that is a fraction
  // of a penny short, and over 240 compounding months that shortfall grows
  // into pounds - so the calculator would display a required contribution and
  // then tell a user paying exactly that amount they were not on track.
  const rawRequired = factor > 0 ? Math.max(0, (targetPot - grownPot) / factor) : 0;
  const required = Math.ceil(rawRequired * 100) / 100;

  return {
    target_annual_income: target,
    state_pension_income: stateIncome,
    income_needed_from_pot: fromPot,
    target_pot: targetPot,
    projected_pot: projected,
    shortfall: Math.max(0, targetPot - projected),
    surplus: Math.max(0, projected - targetPot),
    on_track: projected >= targetPot,
    required_monthly_contribution: required,
    additional_monthly_contribution_needed: Math.max(0, required - monthly),
    years_to_retirement: years
  };
}
