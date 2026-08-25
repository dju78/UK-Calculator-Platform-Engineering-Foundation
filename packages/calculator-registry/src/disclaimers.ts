/**
 * Professional, domain-accurate disclaimers for every calculator on the platform.
 *
 * Implements strict hierarchical fallback resolution:
 *   1. Exact calculator overrides / specialist high-risk families
 *   2. Specific subcategories & domain-focused families
 *   3. Broad category families
 *   4. Generic educational fallback
 *
 * Every disclaimer names the appropriate professional discipline (tax adviser,
 * conveyancer/solicitor, mortgage adviser, medical professional, FCA-regulated
 * financial adviser, etc.) and avoids misleading legal guarantees.
 */

export interface DisclaimerResolutionContext {
  id?: string;
  category?: string;
  subcategory?: string;
  name?: string;
  rulesSensitive?: boolean;
}

export interface CalculatorDisclaimer {
  body: string;
  professional: string;
  family: string;
}

const PROPERTY_TAX_IDS = new Set([
  "PRO-023",
  "PRO-024",
  "PRO-025",
  "PRO-026",
  "PRO-027",
  "PRO-028"
]);

export function getCalculatorDisclaimer(ctx: DisclaimerResolutionContext = {}): CalculatorDisclaimer {
  const id = (ctx.id ?? "").toUpperCase();
  const cat = (ctx.category ?? "").toLowerCase();
  const sub = (ctx.subcategory ?? "").toLowerCase();
  const name = (ctx.name ?? "").toLowerCase();

  // -------------------------------------------------------------------------
  // 1. EXACT OVERRIDES & SPECIALIST HIGH-RISK FAMILIES
  // -------------------------------------------------------------------------

  // Pregnancy & Fertility (Midwife / Obstetrician)
  if (
    id === "HLT-019" || id === "HLT-020" || id === "HLT-021" || id === "HLT-022" ||
    name.includes("pregnancy") || name.includes("due date") || name.includes("ovulation") || name.includes("conception")
  ) {
    return {
      body: "Estimated dates, gestational milestones and fertile windows are indicative approximations based on standard biological averages. Pregnancy dating and clinical decisions must always be confirmed with a midwife, obstetrician or qualified healthcare professional.",
      professional: "midwife or healthcare professional",
      family: "pregnancy_fertility"
    };
  }

  // Stochastic Simulations: Monte Carlo / SWR / FIRE / Portfolio Withdrawal
  // NOTE: Evaluated before generic pensions/investments to ensure PEN-011, INV-025,
  // INV-026, and INV-029 resolve to stochastic/FIRE modelling.
  if (
    id === "INV-029" || id === "INV-026" || id === "INV-025" || id === "PEN-011" ||
    name.includes("monte carlo") || name.includes("safe withdrawal") || name.includes("fire calculator") || name.includes("portfolio withdrawal")
  ) {
    return {
      body: "Probabilistic modelling and withdrawal rate simulations represent statistical mathematical scenarios based on historical parameters, not guaranteed future financial outcomes. Market volatility, inflation and sequencing risk can cause actual portfolio longevity to differ significantly. Consult an FCA-regulated financial adviser.",
      professional: "FCA-regulated financial adviser",
      family: "stochastic_withdrawal_fire"
    };
  }

  // BMI & Body Composition (GP / Registered Dietitian)
  if (
    id === "HLT-001" || id === "HLT-005" || id === "HLT-006" || id === "HLT-007" || id === "HLT-008" || id === "HLT-017" ||
    name.includes("bmi") || name.includes("body fat") || name.includes("lean body") || name.includes("ideal weight") || name.includes("body surface")
  ) {
    return {
      body: "Provides general estimates derived from standardized population formulas. These formulas do not directly measure body tissue composition and may not reflect individual muscularity, bone density, ethnicity, pregnancy or medical conditions. This is not medical advice. Speak to a GP or registered dietitian before making significant changes to diet or weight.",
      professional: "GP or registered dietitian",
      family: "bmi_body_composition"
    };
  }

  // Property Taxes: SDLT, LBTT, LTT, Property CGT
  // Strictly scoped to explicit property-tax IDs or confirmed Mortgages & Property tax tools
  const isPropertyCategory = cat.includes("mortgage") || cat.includes("property") || sub.includes("property");
  const isPropertyTaxName = name.includes("stamp duty") || name.includes("sdlt") || name.includes("lbtt") || name.includes("ltt") || name.includes("property capital gains") || name.includes("property cgt");
  if (
    PROPERTY_TAX_IDS.has(id) ||
    (isPropertyCategory && (sub.includes("property tax") || isPropertyTaxName))
  ) {
    return {
      body: "Property tax estimates are based on published 2026/27 statutory rates and thresholds across England, Northern Ireland, Scotland and Wales. This is not tax or legal advice. Actual liability depends on contract terms, multiple dwellings rules, mixed-use reliefs, residency and chain details. Consult a licensed conveyancer, solicitor or qualified tax adviser.",
      professional: "licensed conveyancer or tax adviser",
      family: "property_taxation"
    };
  }

  // Value Added Tax (VAT)
  if (id === "TAX-015" || name.includes("vat")) {
    return {
      body: "VAT calculations are based on statutory UK VAT rates. This is not tax advice. Actual tax obligations depend on your business registration status, turnover, scheme choice and item classification. Consult HMRC or a qualified accountant.",
      professional: "qualified accountant or HMRC",
      family: "vat"
    };
  }

  // Student Loans (SLC / Payroll)
  if (id === "TAX-020" || name.includes("student loan")) {
    return {
      body: "Student loan repayment estimates are based on published 2026/27 repayment thresholds. Actual monthly deductions depend on official payroll processing and HMRC/SLC records. Check your account with the Student Loans Company (SLC).",
      professional: "Student Loans Company or payroll department",
      family: "student_loans"
    };
  }

  // Foreign Exchange / Currency
  if (id === "CON-010" || name.includes("currency")) {
    return {
      body: "Currency conversions are calculated using indicative mid-market exchange rates and exclude dealer spreads, transaction fees and transfer commissions. This does not represent an offer to buy or sell foreign currency. Consult your bank or foreign exchange provider for live actionable execution rates.",
      professional: "foreign exchange provider or bank",
      family: "foreign_exchange"
    };
  }

  // -------------------------------------------------------------------------
  // 2. BROAD CATEGORY FAMILIES
  // -------------------------------------------------------------------------

  // Mortgage Lending & Borrowing
  if (cat.includes("mortgage") || cat.includes("property") || sub.includes("mortgage") || id.startsWith("PRO-")) {
    return {
      body: "This calculation provides an illustrative estimate and is not a formal mortgage illustration, lending offer or financial recommendation. Final loan amounts, interest rates and monthly payments are subject to lender credit scoring, affordability stress tests and full property valuation. Consult an FCA-regulated mortgage adviser.",
      professional: "qualified mortgage adviser",
      family: "mortgage_lending"
    };
  }

  // UK Income Tax, Salary & Payroll
  if (id.startsWith("TAX-") || cat.includes("tax") || cat.includes("salary")) {
    return {
      body: "Tax and take-home pay estimates are based on published 2026/27 UK, Scottish and Welsh statutory rates and allowances. This is not tax advice, but an annual mathematical model. For personal tax planning or complex affairs, consult HMRC or a qualified tax adviser.",
      professional: "qualified tax adviser or HMRC",
      family: "uk_income_tax_salary"
    };
  }

  // Pensions & Retirement
  if (id.startsWith("PEN-") || cat.includes("pensions") || sub.includes("retirement")) {
    return {
      body: "Illustrative projection based on the figures and assumptions entered. Pension pot growth is not guaranteed, investment values can fall as well as rise, and statutory retirement rules or tax relief rates may change. For personal retirement planning, consult an FCA-regulated financial adviser or contact Pension Wise.",
      professional: "FCA-regulated financial adviser",
      family: "pensions_retirement"
    };
  }

  // Investments & ISA
  if (id.startsWith("INV-") || id.startsWith("ISA-") || cat.includes("investing") || cat.includes("isa")) {
    return {
      body: "For educational and financial modelling purposes only. Does not constitute investment advice or a personal recommendation to buy or sell financial instruments. The value of investments and any income from them can fall as well as rise, and you may get back less than you invest. Consult an FCA-regulated financial adviser.",
      professional: "FCA-regulated financial adviser",
      family: "investments_isa"
    };
  }

  // General Health & Fitness
  if (cat.includes("health") || sub.includes("health") || sub.includes("fitness") || id.startsWith("HLT-")) {
    return {
      body: "For general fitness, training and lifestyle informational purposes only. This is not medical advice and does not provide medical diagnosis or treatment. Consult a GP or healthcare professional before beginning any new training programme or altering medical routines.",
      professional: "GP or healthcare professional",
      family: "general_health"
    };
  }

  // Automotive & Travel
  if (cat.includes("automotive") || id.startsWith("AUT-")) {
    return {
      body: "Vehicle cost, fuel consumption, EV charging and depreciation figures are estimated models based on entered parameters and standard UK averages. Real-world performance varies with vehicle condition, driving behaviour, payload and ambient temperatures.",
      professional: "motoring specialist",
      family: "automotive"
    };
  }

  // Business & Commercial
  if (cat.includes("business") || id.startsWith("BUS-")) {
    return {
      body: "Commercial calculations provide mathematical estimates for business planning and decision support. Actual profitability, cash flows and tax liabilities depend on full accounting records and commercial conditions. Consult a qualified business accountant.",
      professional: "qualified accountant",
      family: "business_commercial"
    };
  }

  // -------------------------------------------------------------------------
  // 3. GENERIC EDUCATIONAL FALLBACK
  // -------------------------------------------------------------------------
  return {
    body: "This calculator provides mathematical estimates based on the information you enter. It is intended for educational and informational purposes only and does not constitute professional advice. Consult a qualified professional before making financial, legal, medical or commercial decisions.",
    professional: "qualified professional",
    family: "general_educational"
  };
}
