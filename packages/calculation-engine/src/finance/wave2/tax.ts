/**
 * Wave 2 UK Tax & Salary calculators.
 *
 * Every statutory figure is read from the versioned UK Rules Engine and passed
 * in by the handler. Nothing here hard-codes an allowance, threshold or rate.
 *
 * Percentages arrive as human percentages (5 means 5%) and are normalised
 * exactly once.
 *
 * Frequency conversion reuses the shared income-frequency layer in
 * `common/frequency.ts` rather than reimplementing hours-to-salary arithmetic.
 */
import { assertMoney, assertFiniteNumber } from "../../common/validation.js";
import {
  annualiseIncome,
  periodicBreakdown,
  type WorkingPattern
} from "../../common/frequency.js";
import { calculateIncomeTax, calculateNationalInsurance, calculateStudentLoan } from "../tax/core.js";
import type { TaxCodeResolution } from "../tax/tax-codes.js";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Full PAYE position on one annual salary, used wherever a before/after comparison is needed. */
export interface PayePosition {
  gross: number;
  income_tax: number;
  national_insurance: number;
  student_loan: number;
  postgraduate_loan: number;
  net: number;
  personal_allowance: number;
}

export function payePosition(
  gross: number,
  jurisdiction: string,
  studentPlan: string,
  postgraduate: boolean,
  rules: any
): PayePosition {
  const { tax, personalAllowance } = calculateIncomeTax(gross, jurisdiction, rules);
  const ni = calculateNationalInsurance(gross, rules);
  const { studentLoan, pgLoan } = calculateStudentLoan(gross, studentPlan, postgraduate, rules);
  return {
    gross,
    income_tax: tax,
    national_insurance: ni,
    student_loan: studentLoan,
    postgraduate_loan: pgLoan,
    net: gross - tax - ni - studentLoan - pgLoan,
    personal_allowance: personalAllowance
  };
}

// ---------------------------------------------------------------------------
// TAX-005 Salary Sacrifice
// ---------------------------------------------------------------------------

export interface SalarySacrificeResult {
  gross_salary: number;
  sacrificed_amount: number;
  post_sacrifice_salary: number;
  pension_contribution: number;
  employer_contribution: number;
  total_into_pension: number;
  take_home_before: number;
  take_home_after: number;
  take_home_reduction: number;
  income_tax_saved: number;
  national_insurance_saved: number;
  student_loan_saved: number;
  total_tax_saved: number;
  cost_per_pound_in_pension: number;
  restores_personal_allowance: boolean;
  employer_contribution_rate_used: number;
}

/**
 * Compare take-home pay with and without a salary sacrifice arrangement.
 *
 * Sacrifice reduces gross pay before Income Tax, National Insurance and
 * student loan are assessed, which is precisely what distinguishes it from a
 * net pay or relief at source arrangement. The comparison is therefore run
 * twice through the same PAYE position function rather than by adjusting one
 * result, so the two sides cannot drift apart.
 */
export function salarySacrifice(
  grossSalary: number,
  sacrificePct: number,
  employerContributionPct: number,
  jurisdiction: string,
  studentPlan: string,
  postgraduate: boolean,
  rules: any
): SalarySacrificeResult {
  const gross = assertMoney(grossSalary, "Gross salary");
  const sacrificeRate = assertFiniteNumber(sacrificePct, "Salary sacrifice") / 100;
  const employerRate = assertFiniteNumber(employerContributionPct, "Employer contribution") / 100;

  if (sacrificeRate < 0 || sacrificeRate > 1) {
    throw new Error("Salary sacrifice must be between 0% and 100% of salary.");
  }

  const sacrificed = gross * sacrificeRate;
  const postSacrifice = gross - sacrificed;

  const before = payePosition(gross, jurisdiction, studentPlan, postgraduate, rules);
  const after = payePosition(postSacrifice, jurisdiction, studentPlan, postgraduate, rules);

  // The employer contribution is entered as a percentage of post-sacrifice
  // pay, which is what a scheme rulebook actually states. Employer National
  // Insurance savings are deliberately NOT modelled: whether an employer
  // passes any of that saving on is a matter of scheme design rather than
  // statute, and inventing a share would put an unearned figure in front of
  // the user.
  const employerContribution = postSacrifice * employerRate;
  const totalIntoPension = sacrificed + employerContribution;

  const takeHomeReduction = before.net - after.net;

  const it = rules.income_tax_england_wales_ni;

  return {
    gross_salary: gross,
    sacrificed_amount: sacrificed,
    post_sacrifice_salary: postSacrifice,
    pension_contribution: sacrificed,
    employer_contribution: employerContribution,
    total_into_pension: totalIntoPension,
    take_home_before: before.net,
    take_home_after: after.net,
    take_home_reduction: takeHomeReduction,
    income_tax_saved: before.income_tax - after.income_tax,
    national_insurance_saved: before.national_insurance - after.national_insurance,
    student_loan_saved:
      before.student_loan + before.postgraduate_loan - after.student_loan - after.postgraduate_loan,
    total_tax_saved: sacrificed - takeHomeReduction,
    cost_per_pound_in_pension: totalIntoPension > 0 ? takeHomeReduction / totalIntoPension : 0,
    restores_personal_allowance:
      gross > it.personal_allowance_taper_start_gbp &&
      postSacrifice <= it.personal_allowance_taper_start_gbp,
    employer_contribution_rate_used: employerRate
  };
}

// ---------------------------------------------------------------------------
// TAX-006 / TAX-007 Hourly and salary conversion
// ---------------------------------------------------------------------------

export interface PayConversionResult {
  annual: number;
  monthly: number;
  weekly: number;
  daily: number;
  hourly: number;
  annual_hours: number;
  hours_per_week: number;
  paid_weeks_per_year: number;
  days_per_week: number;
}

function conversion(annual: number, pattern: WorkingPattern, daysPerWeek: number): PayConversionResult {
  const p = periodicBreakdown(annual, pattern, { allowHourly: true });
  const annualHours = pattern.hoursPerWeek * pattern.paidWeeksPerYear;
  return {
    annual,
    monthly: p.monthly,
    weekly: p.weekly,
    daily: daysPerWeek > 0 ? p.weekly / daysPerWeek : 0,
    hourly: p.hourly ?? 0,
    annual_hours: annualHours,
    hours_per_week: pattern.hoursPerWeek,
    paid_weeks_per_year: pattern.paidWeeksPerYear,
    days_per_week: daysPerWeek
  };
}

/** TAX-006 Hourly to salary. */
export function hourlyToSalary(
  hourlyRate: number,
  pattern: WorkingPattern,
  daysPerWeek: number
): PayConversionResult {
  const rate = assertMoney(hourlyRate, "Hourly rate");
  const annual = annualiseIncome(rate, "hourly", pattern);
  return conversion(annual, pattern, assertFiniteNumber(daysPerWeek, "Days per week"));
}

/** TAX-007 Salary to hourly. The exact inverse of TAX-006 on the same pattern. */
export function salaryToHourly(
  annualSalary: number,
  pattern: WorkingPattern,
  daysPerWeek: number
): PayConversionResult {
  const annual = assertMoney(annualSalary, "Annual salary");
  return conversion(annual, pattern, assertFiniteNumber(daysPerWeek, "Days per week"));
}

// ---------------------------------------------------------------------------
// TAX-008 Overtime Pay
// ---------------------------------------------------------------------------

export interface OvertimeResult {
  base_pay: number;
  overtime_pay: number;
  premium_overtime_pay: number;
  total_pay: number;
  total_hours: number;
  blended_hourly_rate: number;
  overtime_hourly_rate: number;
  premium_hourly_rate: number;
  annualised_total: number;
  overtime_share_of_pay: number;
}

/**
 * Overtime for one pay period, with two optional premium tiers (typically
 * time-and-a-half and double time).
 */
export function overtimePay(
  baseHourlyRate: number,
  standardHours: number,
  overtimeHours: number,
  overtimeMultiplier: number,
  premiumHours: number,
  premiumMultiplier: number,
  periodsPerYear: number
): OvertimeResult {
  const rate = assertMoney(baseHourlyRate, "Base hourly rate");
  const std = assertFiniteNumber(standardHours, "Standard hours");
  const ot = assertFiniteNumber(overtimeHours, "Overtime hours");
  const otMult = assertFiniteNumber(overtimeMultiplier, "Overtime multiplier");
  const prem = assertFiniteNumber(premiumHours, "Premium hours");
  const premMult = assertFiniteNumber(premiumMultiplier, "Premium multiplier");
  const periods = assertFiniteNumber(periodsPerYear, "Pay periods per year");

  if (std < 0 || ot < 0 || prem < 0) throw new Error("Hours cannot be negative.");
  if (otMult < 1 || premMult < 1) {
    throw new Error("An overtime multiplier below 1 would pay less than the standard rate. Enter 1 or more.");
  }

  const basePay = rate * std;
  const otPay = rate * otMult * ot;
  const premPay = rate * premMult * prem;
  const total = basePay + otPay + premPay;
  const hours = std + ot + prem;

  return {
    base_pay: basePay,
    overtime_pay: otPay,
    premium_overtime_pay: premPay,
    total_pay: total,
    total_hours: hours,
    blended_hourly_rate: hours > 0 ? total / hours : 0,
    overtime_hourly_rate: rate * otMult,
    premium_hourly_rate: rate * premMult,
    annualised_total: total * periods,
    overtime_share_of_pay: total > 0 ? (otPay + premPay) / total : 0
  };
}

// ---------------------------------------------------------------------------
// TAX-009 Bonus Tax
// ---------------------------------------------------------------------------

export interface BonusTaxResult {
  salary: number;
  bonus: number;
  pension_from_bonus: number;
  taxable_bonus: number;
  income_tax_on_bonus: number;
  national_insurance_on_bonus: number;
  student_loan_on_bonus: number;
  total_deductions_on_bonus: number;
  net_bonus: number;
  effective_rate_on_bonus: number;
  marginal_rate_band: string;
  crosses_personal_allowance_taper: boolean;
  personal_allowance_lost: number;
}

/**
 * Tax on a bonus, computed as the DIFFERENCE between the full-year position
 * with and without the bonus. A bonus has no separate tax rate: the apparent
 * "bonus tax rate" is simply the marginal rate of the band the bonus lands in,
 * which is why this is a differencing calculation rather than a rate lookup.
 */
export function bonusTax(
  salary: number,
  bonus: number,
  pensionFromBonusPct: number,
  jurisdiction: string,
  studentPlan: string,
  postgraduate: boolean,
  rules: any
): BonusTaxResult {
  const base = assertMoney(salary, "Salary");
  const bonusAmount = assertMoney(bonus, "Bonus");
  const pensionRate = assertFiniteNumber(pensionFromBonusPct, "Pension from bonus") / 100;
  if (pensionRate < 0 || pensionRate > 1) {
    throw new Error("The share of the bonus paid into a pension must be between 0% and 100%.");
  }

  const pension = bonusAmount * pensionRate;
  const taxableBonus = bonusAmount - pension;

  // Sacrificing part of the bonus into a pension removes it from gross pay
  // entirely, so the comparison is salary versus salary plus the taxable part.
  const without = payePosition(base, jurisdiction, studentPlan, postgraduate, rules);
  const withBonus = payePosition(base + taxableBonus, jurisdiction, studentPlan, postgraduate, rules);

  const taxOnBonus = withBonus.income_tax - without.income_tax;
  const niOnBonus = withBonus.national_insurance - without.national_insurance;
  const slOnBonus =
    withBonus.student_loan + withBonus.postgraduate_loan - without.student_loan - without.postgraduate_loan;
  const totalDeductions = taxOnBonus + niOnBonus + slOnBonus;

  const it = rules.income_tax_england_wales_ni;
  const taperStart = it.personal_allowance_taper_start_gbp;
  const taperEnd = it.personal_allowance_zero_at_adjusted_net_income_gbp;
  const crosses = base < taperEnd && base + taxableBonus > taperStart;

  const total = base + taxableBonus;
  const bands = it.bands_taxable_income_gbp;
  const band =
    total > taperEnd
      ? "Additional rate"
      : total > taperStart
        ? "Personal Allowance taper (effective 60% marginal rate)"
        : total > bands[0].to + it.personal_allowance_gbp
          ? "Higher rate"
          : total > it.personal_allowance_gbp
            ? "Basic rate"
            : "Below the Personal Allowance";

  return {
    salary: base,
    bonus: bonusAmount,
    pension_from_bonus: pension,
    taxable_bonus: taxableBonus,
    income_tax_on_bonus: taxOnBonus,
    national_insurance_on_bonus: niOnBonus,
    student_loan_on_bonus: slOnBonus,
    total_deductions_on_bonus: totalDeductions,
    net_bonus: taxableBonus - totalDeductions,
    effective_rate_on_bonus: bonusAmount > 0 ? totalDeductions / bonusAmount : 0,
    marginal_rate_band: band,
    crosses_personal_allowance_taper: crosses,
    personal_allowance_lost: without.personal_allowance - withBonus.personal_allowance
  };
}

// ---------------------------------------------------------------------------
// TAX-010 Marriage Allowance
// ---------------------------------------------------------------------------

export interface MarriageAllowanceResult {
  eligible: boolean;
  ineligibility_reason: string | null;
  transferable_allowance: number;
  transferor_tax_before: number;
  transferor_tax_after: number;
  recipient_tax_before: number;
  recipient_tax_after: number;
  household_tax_before: number;
  household_tax_after: number;
  household_benefit: number;
  maximum_possible_benefit: number;
}

/**
 * Marriage Allowance.
 *
 * The transfer is asymmetric and this is where most simplified calculators go
 * wrong: the LOWER earner gives up part of their Personal Allowance, while the
 * HIGHER earner receives a fixed tax REDUCER, not extra allowance. Modelling
 * the recipient side as an allowance increase overstates the benefit for
 * anyone whose income sits near a band edge.
 */
export function marriageAllowance(
  lowerEarnerIncome: number,
  higherEarnerIncome: number,
  jurisdiction: string,
  rules: any
): MarriageAllowanceResult {
  const lower = assertMoney(lowerEarnerIncome, "Lower earner's income");
  const higher = assertMoney(higherEarnerIncome, "Higher earner's income");

  const transferable = rules.marriage_allowance.transferable_personal_allowance_gbp;
  const maxBenefit = rules.marriage_allowance.maximum_benefit_gbp;
  const it = rules.income_tax_england_wales_ni;
  const pa = it.personal_allowance_gbp;
  const basicRate = it.bands_taxable_income_gbp[0].rate;
  const basicTop = it.bands_taxable_income_gbp[0].to + pa;

  const transferorBefore = calculateIncomeTax(lower, jurisdiction, rules).tax;
  const recipientBefore = calculateIncomeTax(higher, jurisdiction, rules).tax;

  let reason: string | null = null;
  if (lower > higher) {
    reason = "The transferring partner must be the lower earner. Swap the two incomes.";
  } else if (lower > pa) {
    reason = `The transferring partner's income is above the Personal Allowance of £${pa.toLocaleString("en-GB")}, so there is no unused allowance to transfer.`;
  } else if (higher <= pa) {
    reason = "The receiving partner pays no Income Tax, so there is no tax for the allowance to reduce.";
  } else if (higher > basicTop) {
    reason = "The receiving partner is not a basic-rate taxpayer, so the couple does not qualify.";
  }

  const eligible = reason === null;

  // Transferor: allowance reduced by the transferable amount.
  // Reducing the transferor's allowance is expressed as a fixed-allowance tax
  // code and run back through the same Income Tax function, so a Scottish
  // transferor is charged Scottish starter and basic rates rather than an
  // assumed 20%.
  const reducedAllowanceCode: TaxCodeResolution = {
    code: "MARRIAGE-ALLOWANCE-TRANSFEROR",
    supported: true,
    allowance: Math.max(0, pa - transferable),
    fixedAllowance: true,
    noTax: false,
    explanation: `Personal Allowance reduced by £${transferable.toLocaleString("en-GB")} because it has been transferred to a spouse or civil partner.`
  };
  const transferorAfter = eligible
    ? calculateIncomeTax(lower, jurisdiction, rules, reducedAllowanceCode).tax
    : transferorBefore;

  // Recipient: a tax reducer, capped at the tax actually due.
  const reducer = eligible ? Math.min(transferable * basicRate, recipientBefore) : 0;
  const recipientAfter = recipientBefore - reducer;

  const before = transferorBefore + recipientBefore;
  const after = transferorAfter + recipientAfter;

  return {
    eligible,
    ineligibility_reason: reason,
    transferable_allowance: transferable,
    transferor_tax_before: transferorBefore,
    transferor_tax_after: transferorAfter,
    recipient_tax_before: recipientBefore,
    recipient_tax_after: recipientAfter,
    household_tax_before: before,
    household_tax_after: after,
    household_benefit: before - after,
    maximum_possible_benefit: maxBenefit
  };
}

// ---------------------------------------------------------------------------
// TAX-011 Dividend Tax
// ---------------------------------------------------------------------------

export interface DividendTaxResult {
  other_income: number;
  dividend_income: number;
  personal_allowance: number;
  personal_allowance_against_dividends: number;
  dividend_allowance_used: number;
  dividends_taxed_at_basic: number;
  dividends_taxed_at_higher: number;
  dividends_taxed_at_additional: number;
  dividend_tax: number;
  tax_on_other_income: number;
  total_income_tax: number;
  net_dividends: number;
  effective_rate_on_dividends: number;
  dividend_rates_are_uk_wide: boolean;
}

/**
 * Dividend tax.
 *
 * Dividends are treated as the TOP slice of income, so the bands they fall
 * into depend on everything else earned first. The dividend allowance is a
 * nil-rate band, not an exemption: it uses up band space, so it does not push
 * later dividends down into a cheaper band.
 *
 * Dividend taxation is reserved, not devolved. A Scottish taxpayer pays
 * Scottish rates on earnings but UK rates and UK band widths on dividends, and
 * that is modelled explicitly here.
 */
export function dividendTax(
  otherIncome: number,
  dividendIncome: number,
  jurisdiction: string,
  rules: any
): DividendTaxResult {
  const other = assertMoney(otherIncome, "Other income");
  const dividends = assertMoney(dividendIncome, "Dividend income");

  const it = rules.income_tax_england_wales_ni;
  const allowanceRules = rules.dividends;
  const total = other + dividends;

  // The Personal Allowance tapers on TOTAL adjusted net income, dividends
  // included.
  let pa = it.personal_allowance_gbp;
  if (total > it.personal_allowance_taper_start_gbp) {
    pa = Math.max(
      0,
      pa - (total - it.personal_allowance_taper_start_gbp) * it.personal_allowance_reduction_per_excess_gbp
    );
  }

  // Allowance is set against non-dividend income first, which is what HMRC's
  // ordering rules produce for almost every taxpayer.
  const paAgainstOther = Math.min(other, pa);
  const paAgainstDividends = Math.min(dividends, pa - paAgainstOther);

  const taxableOther = other - paAgainstOther;
  const taxableDividends = dividends - paAgainstDividends;

  // Non-dividend income uses the taxpayer's own jurisdiction bands.
  const taxOnOther = calculateIncomeTax(other, jurisdiction, rules).tax;

  // Dividends always use UK-wide bands, measured from the top of the
  // non-dividend taxable income.
  const bands = it.bands_taxable_income_gbp;
  const basicTop = bands[0].to;
  // Band ceilings are already expressed in taxable-income terms in the
  // ruleset, so they are used directly. Subtracting the Personal Allowance
  // again here would count it twice and push dividends into the additional
  // rate far too early.
  const higherTop = bands[1].to;

  const divAllowance = Math.min(taxableDividends, allowanceRules.allowance_gbp);

  let position = taxableOther;
  let remaining = taxableDividends;
  let atBasic = 0, atHigher = 0, atAdditional = 0;
  let allowanceLeft = divAllowance;

  const take = (bandCeiling: number | null): number => {
    const room = bandCeiling === null ? remaining : Math.max(0, bandCeiling - position);
    const amount = Math.min(remaining, room);
    position += amount;
    remaining -= amount;
    return amount;
  };

  // Walk the bands. Within each slice, the nil-rate allowance is consumed
  // first, so it occupies band space without attracting tax.
  const basicSlice = take(basicTop);
  const basicFree = Math.min(basicSlice, allowanceLeft);
  allowanceLeft -= basicFree;
  atBasic = basicSlice - basicFree;

  const higherSlice = take(higherTop);
  const higherFree = Math.min(higherSlice, allowanceLeft);
  allowanceLeft -= higherFree;
  atHigher = higherSlice - higherFree;

  const additionalSlice = take(null);
  const additionalFree = Math.min(additionalSlice, allowanceLeft);
  allowanceLeft -= additionalFree;
  atAdditional = additionalSlice - additionalFree;

  const divTax =
    atBasic * allowanceRules.rates.basic +
    atHigher * allowanceRules.rates.higher +
    atAdditional * allowanceRules.rates.additional;

  return {
    other_income: other,
    dividend_income: dividends,
    personal_allowance: pa,
    personal_allowance_against_dividends: paAgainstDividends,
    dividend_allowance_used: divAllowance,
    dividends_taxed_at_basic: atBasic,
    dividends_taxed_at_higher: atHigher,
    dividends_taxed_at_additional: atAdditional,
    dividend_tax: divTax,
    tax_on_other_income: taxOnOther,
    total_income_tax: taxOnOther + divTax,
    net_dividends: dividends - divTax,
    effective_rate_on_dividends: dividends > 0 ? divTax / dividends : 0,
    dividend_rates_are_uk_wide: true
  };
}

// ---------------------------------------------------------------------------
// TAX-012 Capital Gains Tax
// ---------------------------------------------------------------------------

export interface CapitalGainsResult {
  disposal_proceeds: number;
  total_costs: number;
  gross_gain: number;
  losses_applied: number;
  gain_after_losses: number;
  annual_exempt_amount_used: number;
  taxable_gain: number;
  gain_taxed_at_basic_rate: number;
  gain_taxed_at_higher_rate: number;
  capital_gains_tax: number;
  net_proceeds: number;
  effective_rate_on_gain: number;
  basic_rate_band_remaining: number;
  unused_losses_carried_forward: number;
}

/**
 * Capital Gains Tax for an individual.
 *
 * The gain sits on top of taxable income for band purposes, and it uses the
 * UK basic rate band even for a Scottish taxpayer, because Capital Gains Tax
 * is reserved. Losses are set against gains before the annual exempt amount,
 * which is the order that preserves the most allowance.
 */
export function capitalGainsTax(
  disposalProceeds: number,
  acquisitionCost: number,
  improvementAndSellingCosts: number,
  allowableLosses: number,
  otherTaxableIncome: number,
  rules: any
): CapitalGainsResult {
  const proceeds = assertMoney(disposalProceeds, "Disposal proceeds");
  const cost = assertMoney(acquisitionCost, "Acquisition cost");
  const costs = assertMoney(improvementAndSellingCosts, "Improvement and selling costs");
  const losses = assertMoney(allowableLosses, "Allowable losses");
  const income = assertMoney(otherTaxableIncome, "Other taxable income");

  const cg = rules.capital_gains;
  const it = rules.income_tax_england_wales_ni;

  const grossGain = proceeds - cost - costs;
  const lossesApplied = grossGain > 0 ? Math.min(losses, grossGain) : 0;
  const afterLosses = grossGain - lossesApplied;

  const aeaUsed = Math.max(0, Math.min(afterLosses, cg.annual_exempt_amount_gbp));
  const taxable = Math.max(0, afterLosses - aeaUsed);

  const taxableIncome = Math.max(0, income - it.personal_allowance_gbp);
  const basicRemaining = Math.max(0, it.bands_taxable_income_gbp[0].to - taxableIncome);

  const atBasic = Math.min(taxable, basicRemaining);
  const atHigher = taxable - atBasic;
  const tax = atBasic * cg.standard_rates.basic_band + atHigher * cg.standard_rates.higher_band;

  return {
    disposal_proceeds: proceeds,
    total_costs: cost + costs,
    gross_gain: grossGain,
    losses_applied: lossesApplied,
    gain_after_losses: afterLosses,
    annual_exempt_amount_used: aeaUsed,
    taxable_gain: taxable,
    gain_taxed_at_basic_rate: atBasic,
    gain_taxed_at_higher_rate: atHigher,
    capital_gains_tax: tax,
    net_proceeds: proceeds - cost - costs - tax,
    effective_rate_on_gain: grossGain > 0 ? tax / grossGain : 0,
    basic_rate_band_remaining: basicRemaining,
    unused_losses_carried_forward: Math.max(0, losses - lossesApplied)
  };
}

// ---------------------------------------------------------------------------
// TAX-014 Inheritance Tax
// ---------------------------------------------------------------------------

export interface InheritanceTaxResult {
  gross_estate: number;
  charitable_gifts: number;
  nil_rate_band: number;
  transferred_nil_rate_band: number;
  residence_nil_rate_band: number;
  residence_nil_rate_band_tapered_away: number;
  total_allowances: number;
  taxable_estate: number;
  rate_applied: number;
  reduced_charity_rate_applies: boolean;
  inheritance_tax: number;
  estate_to_beneficiaries: number;
  effective_rate_on_estate: number;
}

/**
 * Inheritance Tax on a death estate.
 *
 * MODEL BOUNDARY. This models the nil rate band, the transferable nil rate
 * band, the residence nil rate band with its taper, and the reduced charity
 * rate. It does NOT model Business Relief, Agricultural Relief, trusts,
 * lifetime transfers within seven years and their taper relief, gifts with
 * reservation of benefit, or the statutory division of the estate into
 * components for the 10% charity test. A real estate with any of those
 * features needs professional advice, and the calculator says so.
 */
export function inheritanceTax(
  grossEstate: number,
  propertyToDirectDescendants: number,
  charitableGifts: number,
  transferredNilRatePercentage: number,
  transferredResidenceNilRatePercentage: number,
  rules: any
): InheritanceTaxResult {
  const estate = assertMoney(grossEstate, "Estate value");
  const property = assertMoney(propertyToDirectDescendants, "Property left to direct descendants");
  const charity = assertMoney(charitableGifts, "Charitable gifts");
  const transferredNrbPct = assertFiniteNumber(transferredNilRatePercentage, "Transferred nil rate band") / 100;
  const transferredRnrbPct =
    assertFiniteNumber(transferredResidenceNilRatePercentage, "Transferred residence nil rate band") / 100;

  if (transferredNrbPct < 0 || transferredNrbPct > 1 || transferredRnrbPct < 0 || transferredRnrbPct > 1) {
    throw new Error("A transferred nil rate band is between 0% and 100% of one band.");
  }
  if (charity > estate) {
    throw new Error("Charitable gifts cannot exceed the value of the estate.");
  }

  const iht = rules.inheritance_tax;
  const nrb = iht.nil_rate_band_gbp;
  const transferredNrb = nrb * transferredNrbPct;

  // The residence nil rate band is capped at the value of the home actually
  // passing to direct descendants, then tapered away above the threshold.
  const baseRnrb = iht.residence_nil_rate_band_gbp * (1 + transferredRnrbPct);
  const cappedRnrb = Math.min(baseRnrb, property);
  const excessOverTaper = Math.max(0, estate - iht.residence_nil_rate_band_taper_threshold_gbp);
  const taper = excessOverTaper * iht.residence_nil_rate_band_taper_rate;
  const rnrb = Math.max(0, cappedRnrb - taper);

  const allowances = nrb + transferredNrb + rnrb;

  // The charity gift is deducted from the estate before tax.
  const netEstate = estate - charity;
  const taxable = Math.max(0, netEstate - allowances);

  // Simplified 10% test: charitable gifts measured against the estate after
  // the nil rate bands but before the gift itself.
  const baselineAmount = Math.max(0, estate - allowances);
  const reduced =
    baselineAmount > 0 && charity >= baselineAmount * iht.charity_proportion_for_reduced_rate;
  const rate = reduced ? iht.reduced_charity_rate : iht.standard_rate;

  const tax = taxable * rate;

  return {
    gross_estate: estate,
    charitable_gifts: charity,
    nil_rate_band: nrb,
    transferred_nil_rate_band: transferredNrb,
    residence_nil_rate_band: rnrb,
    residence_nil_rate_band_tapered_away: Math.min(cappedRnrb, taper),
    total_allowances: allowances,
    taxable_estate: taxable,
    rate_applied: rate,
    reduced_charity_rate_applies: reduced,
    inheritance_tax: tax,
    estate_to_beneficiaries: estate - charity - tax,
    effective_rate_on_estate: estate > 0 ? tax / estate : 0
  };
}

// ---------------------------------------------------------------------------
// TAX-016 / TAX-017 Self-employment and sole trader
// ---------------------------------------------------------------------------

export interface SelfEmploymentResult {
  turnover: number;
  allowable_expenses: number;
  capital_allowances: number;
  taxable_profit: number;
  total_income: number;
  personal_allowance: number;
  income_tax: number;
  class_2_national_insurance: number;
  class_4_national_insurance: number;
  total_national_insurance: number;
  total_tax_and_national_insurance: number;
  net_profit_after_tax: number;
  effective_rate: number;
  class_2_treated_as_paid: boolean;
  voluntary_class_2_annual_cost: number;
  payment_on_account_each: number;
  payments_on_account_required: boolean;
  first_payment_due: number;
}

/**
 * Self-employment / sole trader tax.
 *
 * Class 4 National Insurance is charged on profits alone, while Income Tax is
 * charged on total income. Where a trader also has employment income, running
 * both through the same total would overstate Class 4, so the two bases are
 * kept separate here.
 *
 * MODEL BOUNDARY. Class 1 NI already paid on employment income is not offset
 * against Class 4 (the annual maximum rules are outside scope), losses are not
 * carried, and the payment on account figure assumes none of the liability was
 * collected at source.
 */
export function selfEmploymentTax(
  turnover: number,
  allowableExpenses: number,
  capitalAllowances: number,
  otherIncome: number,
  jurisdiction: string,
  rules: any
): SelfEmploymentResult {
  const gross = assertMoney(turnover, "Turnover");
  const expenses = assertMoney(allowableExpenses, "Allowable expenses");
  const capital = assertMoney(capitalAllowances, "Capital allowances");
  const other = assertMoney(otherIncome, "Other income");

  const profit = Math.max(0, gross - expenses - capital);
  const totalIncome = profit + other;

  const { tax, personalAllowance } = calculateIncomeTax(totalIncome, jurisdiction, rules);

  const se = rules.national_insurance_self_employed;

  // Class 2 is treated as paid once profits reach the small profits threshold,
  // so there is no liability - the credit is given without a charge.
  const class2TreatedAsPaid = profit >= se.small_profits_threshold_gbp;
  const class2 = 0;

  let class4 = 0;
  if (profit > se.class4_lower_profits_limit_gbp) {
    const mainTop = Math.min(profit, se.class4_upper_profits_limit_gbp);
    class4 += (mainTop - se.class4_lower_profits_limit_gbp) * se.class4_main_rate;
    if (profit > se.class4_upper_profits_limit_gbp) {
      class4 += (profit - se.class4_upper_profits_limit_gbp) * se.class4_upper_rate;
    }
  }

  const totalNi = class2 + class4;
  const totalDue = tax + totalNi;

  const poaThreshold = rules.self_assessment?.payment_on_account_threshold_gbp ?? 1000;
  const poaRequired = totalDue >= poaThreshold;
  const poaEach = poaRequired ? totalDue / 2 : 0;

  return {
    turnover: gross,
    allowable_expenses: expenses,
    capital_allowances: capital,
    taxable_profit: profit,
    total_income: totalIncome,
    personal_allowance: personalAllowance,
    income_tax: tax,
    class_2_national_insurance: class2,
    class_4_national_insurance: class4,
    total_national_insurance: totalNi,
    total_tax_and_national_insurance: totalDue,
    net_profit_after_tax: profit - totalDue,
    effective_rate: profit > 0 ? totalDue / profit : 0,
    class_2_treated_as_paid: class2TreatedAsPaid,
    // Below the small profits threshold there is no charge, but a trader may
    // pay Class 2 voluntarily to protect their contribution record. Showing
    // what that would cost is more use than showing a bare zero.
    voluntary_class_2_annual_cost: class2TreatedAsPaid ? 0 : se.class2_weekly_gbp * 52,
    payment_on_account_each: poaEach,
    payments_on_account_required: poaRequired,
    first_payment_due: totalDue + poaEach
  };
}

// ---------------------------------------------------------------------------
// TAX-018 Corporation Tax
// ---------------------------------------------------------------------------

export interface CorporationTaxResult {
  taxable_profit: number;
  accounting_period_months: number;
  associated_companies: number;
  small_profits_limit_applied: number;
  main_rate_limit_applied: number;
  rate_band: string;
  tax_before_marginal_relief: number;
  marginal_relief: number;
  corporation_tax: number;
  effective_rate: number;
  marginal_rate_on_next_pound: number;
}

/**
 * Corporation Tax with marginal relief.
 *
 * The profit limits are divided by the number of associated companies plus
 * one, and prorated for an accounting period shorter than twelve months.
 * Missing either adjustment is the most common error in company tax
 * estimates, so both are explicit inputs rather than assumptions.
 */
export function corporationTax(
  taxableProfit: number,
  associatedCompanies: number,
  accountingPeriodMonths: number,
  rules: any
): CorporationTaxResult {
  const profit = assertMoney(taxableProfit, "Taxable profit");
  const associated = assertFiniteNumber(associatedCompanies, "Associated companies");
  const months = assertFiniteNumber(accountingPeriodMonths, "Accounting period");

  if (associated < 0 || !Number.isInteger(associated)) {
    throw new Error("Associated companies must be a whole number of 0 or more.");
  }
  if (months <= 0 || months > 18) {
    throw new Error("An accounting period runs from 1 to 18 months.");
  }

  const ct = rules.corporation_tax;
  const divisor = associated + 1;
  const proration = months / 12;

  const lower = (ct.small_profits_limit_gbp / divisor) * proration;
  const upper = (ct.main_rate_limit_gbp / divisor) * proration;

  let tax: number;
  let relief = 0;
  let band: string;
  let marginalNext: number;

  if (profit <= lower) {
    tax = profit * ct.small_profits_rate;
    band = "Small profits rate";
    marginalNext = ct.small_profits_rate;
  } else if (profit >= upper) {
    tax = profit * ct.main_rate;
    band = "Main rate";
    marginalNext = ct.main_rate;
  } else {
    const beforeRelief = profit * ct.main_rate;
    relief = ct.marginal_relief_standard_fraction * (upper - profit);
    tax = beforeRelief - relief;
    band = "Marginal relief";
    // Within the marginal band each extra pound is taxed at main rate plus the
    // relief withdrawn, which is why the true marginal rate exceeds 25%.
    marginalNext = ct.main_rate + ct.marginal_relief_standard_fraction;
  }

  return {
    taxable_profit: profit,
    accounting_period_months: months,
    associated_companies: associated,
    small_profits_limit_applied: lower,
    main_rate_limit_applied: upper,
    rate_band: band,
    tax_before_marginal_relief: profit * (profit <= lower ? ct.small_profits_rate : ct.main_rate),
    marginal_relief: relief,
    corporation_tax: tax,
    effective_rate: profit > 0 ? tax / profit : 0,
    marginal_rate_on_next_pound: marginalNext
  };
}
