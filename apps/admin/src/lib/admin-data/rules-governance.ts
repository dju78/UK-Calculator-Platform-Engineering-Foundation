import rawRules from "@foundation/rules-uk/src/rulesets/uk-2026-27-v1.json";
import type { CalculatorDefinition } from "@foundation/calculator-registry/src/types";
import { calculatorRegistry } from "./calculator-registry";

export interface RuleFamilySummary {
  key: string;
  name: string;
  category: string;
  jurisdiction: string;
  status: "approved" | "draft" | "review_due";
  taxYear: string;
  effectiveFrom: string;
  effectiveTo: string;
  lastChecked: string;
  primarySource: string;
  statutoryBasis: string;
  dependentCalculatorsCount: number;
  sampleParameters: Record<string, string | number>;
  notes?: string;
}

export interface AdminRulesOverview {
  activeRulesetId: string;
  taxYear: string;
  status: string;
  effectivePeriod: string;
  lastChecked: string;
  totalRuleFamilies: number;
  rulesSensitiveCalculatorsTotal: number;
  ruleFamilies: RuleFamilySummary[];
}

export function getUKRuleset(id = "uk-2026-27-v1"): any {
  if (rawRules.ruleset_id === id) {
    return structuredClone(rawRules);
  }
  throw new Error(`Unknown UK ruleset: ${id}`);
}

export function getAdminRulesOverview(): AdminRulesOverview {
  const rules: any = getUKRuleset("uk-2026-27-v1");
  const calcs = calculatorRegistry as CalculatorDefinition[];
  const rulesSensitiveCalculators = calcs.filter((c: CalculatorDefinition) => c.rulesSensitive);

  const itEWN = rules.income_tax_england_wales_ni;
  const itScot = rules.income_tax_scotland;
  const niEmp = rules.national_insurance_employee_class1_category_a;
  const pen = rules.pension;
  const isa = rules.isa;
  const sdlt = rules.property_transaction_tax?.england_northern_ireland;
  const lbtt = rules.property_transaction_tax?.scotland;
  const ltt = rules.property_transaction_tax?.wales;
  const cgt = rules.capital_gains;
  const sl = rules.student_loans;
  const ct = rules.corporation_tax;

  const ruleFamilies: RuleFamilySummary[] = [
    {
      key: "income_tax_england_wales_ni",
      name: "Income Tax (England, Wales & NI)",
      category: "UK Tax & Salary",
      jurisdiction: "England, Wales, NI",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC / Autumn Statement 2025 statutory schedule",
      statutoryBasis: "Income Tax Act 2007, Finance Act",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id.startsWith("TAX-") || c.id.startsWith("SAL-")
      ).length,
      sampleParameters: {
        "Personal Allowance": itEWN?.personal_allowance_gbp ? `£${itEWN.personal_allowance_gbp.toLocaleString()}` : "Not available",
        "Basic Rate": itEWN?.bands_taxable_income_gbp?.[0] ? `${(itEWN.bands_taxable_income_gbp[0].rate * 100).toFixed(0)}% (up to £${itEWN.bands_taxable_income_gbp[0].to?.toLocaleString()} taxable)` : "Not available",
        "Higher Rate": itEWN?.bands_taxable_income_gbp?.[1] ? `${(itEWN.bands_taxable_income_gbp[1].rate * 100).toFixed(0)}% (£${itEWN.bands_taxable_income_gbp[1].from?.toLocaleString()} - £${itEWN.bands_taxable_income_gbp[1].to?.toLocaleString()})` : "Not available",
        "Additional Rate": itEWN?.bands_taxable_income_gbp?.[2] ? `${(itEWN.bands_taxable_income_gbp[2].rate * 100).toFixed(0)}% (above £${(itEWN.bands_taxable_income_gbp[2].from - 1)?.toLocaleString()})` : "Not available",
        "Allowance Taper Start": itEWN?.personal_allowance_taper_start_gbp ? `£${itEWN.personal_allowance_taper_start_gbp.toLocaleString()}` : "Not available",
      },
      notes: "Personal Allowance tapered by £1 for every £2 of Adjusted Net Income above £100,000.",
    },
    {
      key: "income_tax_scotland",
      name: "Scottish Income Tax (Devolved Rates)",
      category: "UK Tax & Salary",
      jurisdiction: "Scotland",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "Scottish Government Budget Resolution",
      statutoryBasis: "Scotland Act 2016, Scottish Rate Resolution",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id === "TAX-002" || c.id === "TAX-004"
      ).length,
      sampleParameters: {
        "Starter Rate": itScot?.bands_taxable_income_gbp?.[0] ? `${(itScot.bands_taxable_income_gbp[0].rate * 100).toFixed(0)}% (up to £${itScot.bands_taxable_income_gbp[0].to?.toLocaleString()})` : "Not available",
        "Basic Rate": itScot?.bands_taxable_income_gbp?.[1] ? `${(itScot.bands_taxable_income_gbp[1].rate * 100).toFixed(0)}% (£${itScot.bands_taxable_income_gbp[1].from?.toLocaleString()} - £${itScot.bands_taxable_income_gbp[1].to?.toLocaleString()})` : "Not available",
        "Intermediate Rate": itScot?.bands_taxable_income_gbp?.[2] ? `${(itScot.bands_taxable_income_gbp[2].rate * 100).toFixed(0)}% (£${itScot.bands_taxable_income_gbp[2].from?.toLocaleString()} - £${itScot.bands_taxable_income_gbp[2].to?.toLocaleString()})` : "Not available",
        "Higher Rate": itScot?.bands_taxable_income_gbp?.[3] ? `${(itScot.bands_taxable_income_gbp[3].rate * 100).toFixed(0)}% (£${itScot.bands_taxable_income_gbp[3].from?.toLocaleString()} - £${itScot.bands_taxable_income_gbp[3].to?.toLocaleString()})` : "Not available",
        "Advanced Rate": itScot?.bands_taxable_income_gbp?.[4] ? `${(itScot.bands_taxable_income_gbp[4].rate * 100).toFixed(0)}% (£${itScot.bands_taxable_income_gbp[4].from?.toLocaleString()} - £${itScot.bands_taxable_income_gbp[4].to?.toLocaleString()})` : "Not available",
        "Top Rate": itScot?.bands_taxable_income_gbp?.[5] ? `${(itScot.bands_taxable_income_gbp[5].rate * 100).toFixed(0)}% (above £${(itScot.bands_taxable_income_gbp[5].from - 1)?.toLocaleString()})` : "Not available",
      },
      notes: "Six-band structure with Starter (19%), Basic (20%), Intermediate (21%), Higher (42%), Advanced (45%), and Top (48%) rates.",
    },
    {
      key: "national_insurance_class1",
      name: "National Insurance (Class 1 Employee)",
      category: "UK Tax & Salary",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC National Insurance manual & statutory rates",
      statutoryBasis: "Social Security Contributions and Benefits Act 1992",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id.startsWith("NIC-")
      ).length,
      sampleParameters: {
        "Primary Threshold": niEmp?.primary_threshold_gbp ? `£${niEmp.primary_threshold_gbp.toLocaleString()}/yr` : "Not available",
        "Upper Earnings Limit": niEmp?.upper_earnings_limit_gbp ? `£${niEmp.upper_earnings_limit_gbp.toLocaleString()}/yr` : "Not available",
        "Main Rate": niEmp?.main_rate !== undefined ? `${(niEmp.main_rate * 100).toFixed(0)}% (between PT and UEL)` : "Not available",
        "Higher Rate": niEmp?.higher_rate !== undefined ? `${(niEmp.higher_rate * 100).toFixed(0)}% (above UEL)` : "Not available",
      },
      notes: "Class 1 Primary Threshold aligned with standard Personal Allowance (£12,570).",
    },
    {
      key: "pension_annual_allowance",
      name: "Pension Tax Relief & Annual Allowance",
      category: "Pensions & Retirement",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Pensions Tax Manual (PTM)",
      statutoryBasis: "Finance Act 2004 Part 4",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Pensions & Retirement" || c.id.startsWith("PEN-")
      ).length,
      sampleParameters: {
        "Annual Allowance": pen?.annual_allowance_gbp ? `£${pen.annual_allowance_gbp.toLocaleString()}` : "Not available",
        "Money Purchase AA": pen?.money_purchase_annual_allowance_gbp ? `£${pen.money_purchase_annual_allowance_gbp.toLocaleString()}` : "Not available",
        "Taper Threshold Income": pen?.taper_threshold_income_gbp ? `£${pen.taper_threshold_income_gbp.toLocaleString()}` : "Not available",
        "Taper Adjusted Income": pen?.taper_adjusted_income_gbp ? `£${pen.taper_adjusted_income_gbp.toLocaleString()}` : "Not available",
        "Minimum Tapered AA": pen?.minimum_tapered_annual_allowance_gbp ? `£${pen.minimum_tapered_annual_allowance_gbp.toLocaleString()}` : "Not available",
      },
      notes: "Annual Allowance tapered down to minimum £10,000 for high earners above adjusted income limits.",
    },
    {
      key: "isa_allowances",
      name: "Individual Savings Account (ISA) Limits",
      category: "ISA & Tax Wrappers",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC ISA Guidance for Managers",
      statutoryBasis: "Individual Savings Account Regulations 1998",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "ISA & Tax Wrappers" || c.id.startsWith("ISA-")
      ).length,
      sampleParameters: {
        "Overall Subscription Limit": isa?.overall_subscription_limit_gbp ? `£${isa.overall_subscription_limit_gbp.toLocaleString()}` : "Not available",
        "Lifetime ISA Limit": isa?.lifetime_isa_subscription_limit_gbp ? `£${isa.lifetime_isa_subscription_limit_gbp.toLocaleString()}` : "Not available",
        "LISA Government Bonus": isa?.lifetime_isa_bonus_rate !== undefined ? `${(isa.lifetime_isa_bonus_rate * 100).toFixed(0)}% (max £${isa?.lifetime_isa_maximum_bonus_gbp?.toLocaleString()})` : "Not available",
        "Junior ISA Limit": isa?.junior_isa_subscription_limit_gbp ? `£${isa.junior_isa_subscription_limit_gbp.toLocaleString()}` : "Not available",
      },
      notes: "Annual £20,000 allowance across all ISA types (Adult Stocks & Shares, Cash, Innovative Finance, LISA).",
    },
    {
      key: "property_transaction_tax",
      name: "Property Transaction Taxes (SDLT, LBTT, LTT)",
      category: "Mortgages & Property",
      jurisdiction: "England & NI (SDLT), Scotland (LBTT), Wales (LTT)",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC SDLT Manual, Revenue Scotland, Welsh Revenue Authority",
      statutoryBasis: "Finance Act 2003 (SDLT), Land and Buildings Transaction Tax (Scotland) Act 2013, Land Transaction Tax and Anti-avoidance of Devolved Taxes (Wales) Act 2017",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Mortgages & Property" || c.id.startsWith("MOR-") || c.id.startsWith("PRO-")
      ).length,
      sampleParameters: {
        "SDLT Standard Residential Nil-Rate": sdlt?.residential_standard?.bands_price_gbp?.[0]?.to ? `Up to £${sdlt.residential_standard.bands_price_gbp[0].to.toLocaleString()}` : "Not available",
        "SDLT Additional Property Surcharge": sdlt?.additional_property_surcharge_rate !== undefined ? `${(sdlt.additional_property_surcharge_rate * 100).toFixed(0)}% (Higher Rates for Additional Dwellings)` : "Not available",
        "LBTT Residential Nil-Rate": lbtt?.residential_standard?.bands_price_gbp?.[0]?.to ? `Up to £${lbtt.residential_standard.bands_price_gbp[0].to.toLocaleString()}` : "Not available",
        "LTT Residential Nil-Rate": ltt?.residential_standard?.bands_price_gbp?.[0]?.to ? `Up to £${ltt.residential_standard.bands_price_gbp[0].to.toLocaleString()}` : "Not available",
      },
      notes: "Devolved transaction taxes reflect distinct threshold bands and surcharge structures across jurisdictions.",
    },
    {
      key: "capital_gains_tax",
      name: "Capital Gains Tax (CGT)",
      category: "Investing & Wealth",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Capital Gains Manual",
      statutoryBasis: "Taxation of Chargeable Gains Act 1992 (TCGA 1992)",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Investing & Wealth" || c.id.startsWith("INV-") || c.id.startsWith("CGT-")
      ).length,
      sampleParameters: {
        "Annual Exempt Amount": cgt?.annual_exempt_amount_gbp ? `£${cgt.annual_exempt_amount_gbp.toLocaleString()}` : "Not available",
        "Basic Rate (Other Assets)": cgt?.basic_rate_other !== undefined ? `${(cgt.basic_rate_other * 100).toFixed(0)}%` : "Not available",
        "Higher Rate (Other Assets)": cgt?.higher_rate_other !== undefined ? `${(cgt.higher_rate_other * 100).toFixed(0)}%` : "Not available",
        "Residential Property Basic Rate": cgt?.basic_rate_residential_property !== undefined ? `${(cgt.basic_rate_residential_property * 100).toFixed(0)}%` : "Not available",
        "Residential Property Higher Rate": cgt?.higher_rate_residential_property !== undefined ? `${(cgt.higher_rate_residential_property * 100).toFixed(0)}%` : "Not available",
      },
      notes: "CGT rates aligned per current statutory schedules, with residential property differential rates.",
    },
    {
      key: "student_loans",
      name: "Student Loan Repayment Thresholds & Rates",
      category: "Education",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "Student Loans Company / Department for Education",
      statutoryBasis: "Education (Student Loans) (Repayment) Regulations 2009",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Education" || c.id.startsWith("EDU-") || c.id.startsWith("STU-")
      ).length,
      sampleParameters: {
        "Plan 1 Threshold": sl?.plan_1_repayment_threshold_gbp ? `£${sl.plan_1_repayment_threshold_gbp.toLocaleString()}/yr (${(sl.plan_1_rate * 100).toFixed(0)}%)` : "Not available",
        "Plan 2 Threshold": sl?.plan_2_repayment_threshold_gbp ? `£${sl.plan_2_repayment_threshold_gbp.toLocaleString()}/yr (${(sl.plan_2_rate * 100).toFixed(0)}%)` : "Not available",
        "Plan 4 Threshold (Scotland)": sl?.plan_4_repayment_threshold_gbp ? `£${sl.plan_4_repayment_threshold_gbp.toLocaleString()}/yr (${(sl.plan_4_rate * 100).toFixed(0)}%)` : "Not available",
        "Plan 5 Threshold": sl?.plan_5_repayment_threshold_gbp ? `£${sl.plan_5_repayment_threshold_gbp.toLocaleString()}/yr (${(sl.plan_5_rate * 100).toFixed(0)}%)` : "Not available",
        "Postgraduate Loan Threshold": sl?.postgraduate_loan_threshold_gbp ? `£${sl.postgraduate_loan_threshold_gbp.toLocaleString()}/yr (${(sl.postgraduate_rate * 100).toFixed(0)}%)` : "Not available",
      },
      notes: "Income-contingent repayments deducted through PAYE simultaneously with Income Tax and National Insurance.",
    },
    {
      key: "corporation_tax",
      name: "Corporation Tax & Marginal Relief",
      category: "Business & Commercial",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Company Taxation Manual",
      statutoryBasis: "Corporation Tax Act 2010 (CTA 2010)",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Business & Commercial" || c.id.startsWith("BUS-") || c.id.startsWith("CORP-")
      ).length,
      sampleParameters: {
        "Small Profits Rate": ct?.small_profits_rate !== undefined ? `${(ct.small_profits_rate * 100).toFixed(0)}% (profits up to £${ct?.lower_profit_limit_gbp?.toLocaleString()})` : "Not available",
        "Main Rate": ct?.main_rate !== undefined ? `${(ct.main_rate * 100).toFixed(0)}% (profits above £${ct?.upper_profit_limit_gbp?.toLocaleString()})` : "Not available",
        "Marginal Relief Fraction": ct?.marginal_relief_fraction !== undefined ? `${ct.marginal_relief_fraction} (for profits £50k - £250k)` : "Not available",
      },
      notes: "Marginal relief provides a gradual transition between the Small Profits Rate and Main Rate.",
    },
  ];

  return {
    activeRulesetId: rules.ruleset_id || "uk-2026-27-v1",
    taxYear: rules.tax_year || "2026/27",
    status: rules.status || "approved",
    effectivePeriod: `${rules.effective_from} to ${rules.effective_to}`,
    lastChecked: rules.checked_at,
    totalRuleFamilies: ruleFamilies.length,
    rulesSensitiveCalculatorsTotal: rulesSensitiveCalculators.length,
    ruleFamilies,
  };
}