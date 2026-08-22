import type { UKRuleset } from "../../../../rules-uk/src/types.js";

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
  
  let tax = 0;
  let remainingTaxable = taxableIncome;
  let previousBandEnd = 0;

  for (const band of taxRules.bands_taxable_income_gbp) {
    // If the band defines 'to', the size of this band is (to - previousBandEnd).
    // Actually, looking at the rules:
    // { "to": 37700, "rate": 0.2 } -> size = 37700
    // { "from": 37701, "to": 125140, "rate": 0.4 } -> size = 125140 - 37700
    // { "from": 125141, "rate": 0.45 } -> infinite size
    const to = band.to !== undefined ? band.to : Infinity;
    const bandSize = to - previousBandEnd;
    
    if (remainingTaxable > 0) {
      const taxableInBand = Math.min(remainingTaxable, bandSize);
      tax += taxableInBand * band.rate;
      remainingTaxable -= taxableInBand;
    }
    previousBandEnd = to;
  }

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
    // First time buyer rules
    let remainingPrice = price;
    let previousEnd = 0;
    for (const band of sdltRules.first_time_buyer_relief.bands) {
      const to = band.to !== undefined ? band.to : Infinity;
      const bandSize = to - previousEnd;
      if (remainingPrice > 0) {
        const taxableInBand = Math.min(price - previousEnd, bandSize);
        if (taxableInBand > 0) {
            tax += taxableInBand * band.rate;
        }
      }
      previousEnd = to;
    }
  } else {
    // Standard rules
    let previousEnd = 0;
    for (const band of sdltRules.standard_bands) {
      const to = band.to !== undefined ? band.to : Infinity;
      const bandSize = to - previousEnd;
      const taxableInBand = Math.max(0, Math.min(price - previousEnd, bandSize));
      if (taxableInBand > 0) {
          tax += taxableInBand * band.rate;
      }
      previousEnd = to;
    }
  }

  // Surcharges are calculated on the ENTIRE property price if applicable
  // Wait, standard SDLT surcharge is on the full purchase price?
  // Let's check how it's calculated. Usually it's an additional X% on each band.
  // Actually, additional property is a flat 5% on the entire property price? No, it's usually an extra 3% (or 5% now) on each band. But practically, it's 5% of the total price.
  if (additional) {
    tax += price * sdltRules.additional_property_surcharge_rate;
  }
  if (nonResident) {
    tax += price * sdltRules.non_uk_resident_surcharge_rate;
  }

  return tax;
}
