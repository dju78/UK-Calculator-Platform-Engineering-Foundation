import type { UKRuleset } from "../../../../rules-uk/src/types.js";
import { calculateProgressiveTax } from "../../../../rules-uk/src/progressive-bands.js";

export function calculateIncomeTax(
  grossIncome: number,
  jurisdiction: string,
  rules: any
) {
  let taxRules = rules.income_tax_england_wales_ni;
  if (jurisdiction.toLowerCase() === "scotland") {
    taxRules = rules.income_tax_scotland;
  }
  
  // Taper personal allowance
  let personalAllowance = taxRules.personal_allowance_gbp;
  if (grossIncome > taxRules.personal_allowance_taper_start_gbp) {
    const excess = grossIncome - taxRules.personal_allowance_taper_start_gbp;
    const reduction = excess * taxRules.personal_allowance_reduction_per_excess_gbp;
    personalAllowance = Math.max(0, personalAllowance - reduction);
  }

  const taxableIncome = Math.max(0, grossIncome - personalAllowance);
  const tax = calculateProgressiveTax(taxableIncome, taxRules.bands_taxable_income_gbp);

  return { tax, personalAllowance, taxableIncome };
}

export function calculateNationalInsurance(earnings: number, rules: any) {
  const niRules = rules.national_insurance_employee_class1_category_a;
  let ni = 0;
  
  if (earnings > niRules.primary_threshold_annual_gbp) {
    const mainBandEnd = Math.min(earnings, niRules.upper_earnings_limit_annual_gbp);
    const mainBandEarnings = mainBandEnd - niRules.primary_threshold_annual_gbp;
    ni += mainBandEarnings * niRules.main_rate;
    
    if (earnings > niRules.upper_earnings_limit_annual_gbp) {
      const upperBandEarnings = earnings - niRules.upper_earnings_limit_annual_gbp;
      ni += upperBandEarnings * niRules.upper_rate;
    }
  }
  
  return ni;
}

export function calculateStudentLoan(income: number, plan: string, postgraduate: boolean, rules: any) {
  let studentLoan = 0;
  let pgLoan = 0;

  if (plan && plan !== "None" && rules.student_loans[plan]) {
    const planRules = rules.student_loans[plan];
    if (income > planRules.annual_threshold_gbp) {
      studentLoan = (income - planRules.annual_threshold_gbp) * planRules.rate;
    }
  }

  if (postgraduate && rules.student_loans["Postgraduate"]) {
    const pgRules = rules.student_loans["Postgraduate"];
    if (income > pgRules.annual_threshold_gbp) {
      pgLoan = (income - pgRules.annual_threshold_gbp) * pgRules.rate;
    }
  }

  return { studentLoan, pgLoan };
}

export function calculateVAT(amount: number, rate: number, direction: "add" | "remove") {
  if (direction === "add") {
    const vat = amount * rate;
    const gross = amount + vat;
    return { net: amount, vat, gross };
  } else {
    // remove VAT means amount is gross
    const net = amount / (1 + rate);
    const vat = amount - net;
    return { net, vat, gross: amount };
  }
}

export function calculateSDLT(price: number, firstTime: boolean, additional: boolean, nonResident: boolean, rules: any) {
  // Use England/NI rules for this foundation
  const sdltRules = rules.property_transaction_tax.england_northern_ireland;
  
  let tax = 0;
  
  if (firstTime && price <= sdltRules.first_time_buyer_relief.maximum_qualifying_property_value_gbp && !additional) {
    tax = calculateProgressiveTax(price, sdltRules.first_time_buyer_relief.bands);
  } else {
    tax = calculateProgressiveTax(price, sdltRules.standard_bands);
  }

  // Surcharges are calculated on the ENTIRE property price if applicable
  if (additional) {
    tax += price * sdltRules.additional_property_surcharge_rate;
  }
  if (nonResident) {
    tax += price * sdltRules.non_uk_resident_surcharge_rate;
  }

  return tax;
}
