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
  sampleParameters: Record<string, string>;
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

function safeCurrency(val: unknown): string {
  if (typeof val === "number" && !isNaN(val)) {
    return `£${val.toLocaleString("en-GB")}`;
  }
  return "Not available";
}

function safePercent(val: unknown): string {
  if (typeof val === "number" && !isNaN(val)) {
    const pct = val * 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
  }
  return "Not available";
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
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC / Autumn Statement 2025 statutory schedule",
      statutoryBasis: "Income Tax Act 2007, Finance Act",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id.startsWith("TAX-") || c.id.startsWith("SAL-")
      ).length,
      sampleParameters: {
        "Personal Allowance": typeof itEWN?.personal_allowance_gbp === "number" ? safeCurrency(itEWN.personal_allowance_gbp) : "Not available",
        "Basic Rate": typeof itEWN?.bands_taxable_income_gbp?.[0]?.rate === "number" && typeof itEWN?.bands_taxable_income_gbp?.[0]?.to === "number"
          ? `${safePercent(itEWN.bands_taxable_income_gbp[0].rate)} (up to ${safeCurrency(itEWN.bands_taxable_income_gbp[0].to)} taxable)`
          : "Not available",
        "Higher Rate": typeof itEWN?.bands_taxable_income_gbp?.[1]?.rate === "number" && typeof itEWN?.bands_taxable_income_gbp?.[1]?.from === "number" && typeof itEWN?.bands_taxable_income_gbp?.[1]?.to === "number"
          ? `${safePercent(itEWN.bands_taxable_income_gbp[1].rate)} (${safeCurrency(itEWN.bands_taxable_income_gbp[1].from)} - ${safeCurrency(itEWN.bands_taxable_income_gbp[1].to)})`
          : "Not available",
        "Additional Rate": typeof itEWN?.bands_taxable_income_gbp?.[2]?.rate === "number" && typeof itEWN?.bands_taxable_income_gbp?.[2]?.from === "number"
          ? `${safePercent(itEWN.bands_taxable_income_gbp[2].rate)} (above ${safeCurrency(itEWN.bands_taxable_income_gbp[2].from - 1)})`
          : "Not available",
        "Allowance Taper Start": typeof itEWN?.personal_allowance_taper_start_gbp === "number" ? safeCurrency(itEWN.personal_allowance_taper_start_gbp) : "Not available",
      },
      notes: "Personal Allowance tapered by £1 for every £2 of Adjusted Net Income above £100,000.",
    },
    {
      key: "income_tax_scotland",
      name: "Scottish Income Tax (Devolved Rates)",
      category: "UK Tax & Salary",
      jurisdiction: "Scotland",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "Scottish Government Budget Resolution",
      statutoryBasis: "Scotland Act 2016, Scottish Rate Resolution",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id === "TAX-002" || c.id === "TAX-004"
      ).length,
      sampleParameters: {
        "Starter Rate": typeof itScot?.bands_taxable_income_gbp?.[0]?.rate === "number" && typeof itScot?.bands_taxable_income_gbp?.[0]?.to === "number"
          ? `${safePercent(itScot.bands_taxable_income_gbp[0].rate)} (up to ${safeCurrency(itScot.bands_taxable_income_gbp[0].to)})`
          : "Not available",
        "Basic Rate": typeof itScot?.bands_taxable_income_gbp?.[1]?.rate === "number" && typeof itScot?.bands_taxable_income_gbp?.[1]?.from === "number" && typeof itScot?.bands_taxable_income_gbp?.[1]?.to === "number"
          ? `${safePercent(itScot.bands_taxable_income_gbp[1].rate)} (${safeCurrency(itScot.bands_taxable_income_gbp[1].from)} - ${safeCurrency(itScot.bands_taxable_income_gbp[1].to)})`
          : "Not available",
        "Intermediate Rate": typeof itScot?.bands_taxable_income_gbp?.[2]?.rate === "number" && typeof itScot?.bands_taxable_income_gbp?.[2]?.from === "number" && typeof itScot?.bands_taxable_income_gbp?.[2]?.to === "number"
          ? `${safePercent(itScot.bands_taxable_income_gbp[2].rate)} (${safeCurrency(itScot.bands_taxable_income_gbp[2].from)} - ${safeCurrency(itScot.bands_taxable_income_gbp[2].to)})`
          : "Not available",
        "Higher Rate": typeof itScot?.bands_taxable_income_gbp?.[3]?.rate === "number" && typeof itScot?.bands_taxable_income_gbp?.[3]?.from === "number" && typeof itScot?.bands_taxable_income_gbp?.[3]?.to === "number"
          ? `${safePercent(itScot.bands_taxable_income_gbp[3].rate)} (${safeCurrency(itScot.bands_taxable_income_gbp[3].from)} - ${safeCurrency(itScot.bands_taxable_income_gbp[3].to)})`
          : "Not available",
        "Advanced Rate": typeof itScot?.bands_taxable_income_gbp?.[4]?.rate === "number" && typeof itScot?.bands_taxable_income_gbp?.[4]?.from === "number" && typeof itScot?.bands_taxable_income_gbp?.[4]?.to === "number"
          ? `${safePercent(itScot.bands_taxable_income_gbp[4].rate)} (${safeCurrency(itScot.bands_taxable_income_gbp[4].from)} - ${safeCurrency(itScot.bands_taxable_income_gbp[4].to)})`
          : "Not available",
        "Top Rate": typeof itScot?.bands_taxable_income_gbp?.[5]?.rate === "number" && typeof itScot?.bands_taxable_income_gbp?.[5]?.from === "number"
          ? `${safePercent(itScot.bands_taxable_income_gbp[5].rate)} (above ${safeCurrency(itScot.bands_taxable_income_gbp[5].from - 1)})`
          : "Not available",
      },
      notes: "Six-band structure with Starter (19%), Basic (20%), Intermediate (21%), Higher (42%), Advanced (45%), and Top (48%) rates.",
    },
    {
      key: "national_insurance_class1",
      name: "National Insurance (Class 1 Employee)",
      category: "UK Tax & Salary",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC National Insurance manual & statutory rates",
      statutoryBasis: "Social Security Contributions and Benefits Act 1992",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id.startsWith("NIC-")
      ).length,
      sampleParameters: {
        "Primary Threshold": typeof niEmp?.primary_threshold_annual_gbp === "number" ? `${safeCurrency(niEmp.primary_threshold_annual_gbp)}/yr` : (typeof niEmp?.period_thresholds_gbp?.primary_threshold?.annual === "number" ? `${safeCurrency(niEmp.period_thresholds_gbp.primary_threshold.annual)}/yr` : "Not available"),
        "Upper Earnings Limit": typeof niEmp?.upper_earnings_limit_annual_gbp === "number" ? `${safeCurrency(niEmp.upper_earnings_limit_annual_gbp)}/yr` : (typeof niEmp?.period_thresholds_gbp?.upper_earnings_limit?.annual === "number" ? `${safeCurrency(niEmp.period_thresholds_gbp.upper_earnings_limit.annual)}/yr` : "Not available"),
        "Main Rate": typeof niEmp?.main_rate === "number" ? `${safePercent(niEmp.main_rate)} (between PT and UEL)` : "Not available",
        "Higher Rate": typeof niEmp?.upper_rate === "number" ? `${safePercent(niEmp.upper_rate)} (above UEL)` : (typeof niEmp?.higher_rate === "number" ? `${safePercent(niEmp.higher_rate)} (above UEL)` : "Not available"),
      },
      notes: "Class 1 Primary Threshold aligned with standard Personal Allowance (£12,570).",
    },
    {
      key: "pension_annual_allowance",
      name: "Pension Tax Relief & Annual Allowance",
      category: "Pensions & Retirement",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC Pensions Tax Manual (PTM)",
      statutoryBasis: "Finance Act 2004 Part 4",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Pensions & Retirement" || c.id.startsWith("PEN-")
      ).length,
      sampleParameters: {
        "Annual Allowance": typeof pen?.annual_allowance_gbp === "number" ? safeCurrency(pen.annual_allowance_gbp) : "Not available",
        "Money Purchase AA": typeof pen?.money_purchase_annual_allowance_gbp === "number" ? safeCurrency(pen.money_purchase_annual_allowance_gbp) : "Not available",
        "Taper Threshold Income": typeof pen?.threshold_income_taper_gbp === "number" ? safeCurrency(pen.threshold_income_taper_gbp) : (typeof pen?.taper_threshold_income_gbp === "number" ? safeCurrency(pen.taper_threshold_income_gbp) : "Not available"),
        "Taper Adjusted Income": typeof pen?.adjusted_income_taper_gbp === "number" ? safeCurrency(pen.adjusted_income_taper_gbp) : (typeof pen?.taper_adjusted_income_gbp === "number" ? safeCurrency(pen.taper_adjusted_income_gbp) : "Not available"),
        "Minimum Tapered AA": typeof pen?.minimum_tapered_annual_allowance_gbp === "number" ? safeCurrency(pen.minimum_tapered_annual_allowance_gbp) : "Not available",
      },
      notes: "Annual Allowance tapered down to minimum £10,000 for high earners above adjusted income limits.",
    },
    {
      key: "isa_allowances",
      name: "Individual Savings Account (ISA) Limits",
      category: "ISA & Tax Wrappers",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC ISA Guidance for Managers",
      statutoryBasis: "Individual Savings Account Regulations 1998",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "ISA & Tax Wrappers" || c.id.startsWith("ISA-")
      ).length,
      sampleParameters: {
        "Overall Subscription Limit": typeof isa?.overall_subscription_limit_gbp === "number" ? safeCurrency(isa.overall_subscription_limit_gbp) : "Not available",
        "Lifetime ISA Limit": typeof isa?.lifetime_isa_subscription_limit_gbp === "number" ? safeCurrency(isa.lifetime_isa_subscription_limit_gbp) : "Not available",
        "LISA Government Bonus": typeof isa?.lifetime_isa_bonus_rate === "number" && typeof isa?.lifetime_isa_maximum_bonus_gbp === "number"
          ? `${safePercent(isa.lifetime_isa_bonus_rate)} (max ${safeCurrency(isa.lifetime_isa_maximum_bonus_gbp)})`
          : "Not available",
        "Junior ISA Limit": typeof isa?.junior_isa_subscription_limit_gbp === "number" ? safeCurrency(isa.junior_isa_subscription_limit_gbp) : "Not available",
      },
      notes: "Annual £20,000 allowance across all ISA types (Adult Stocks & Shares, Cash, Innovative Finance, LISA).",
    },
    {
      key: "property_transaction_tax",
      name: "Property Transaction Taxes (SDLT, LBTT, LTT)",
      category: "Mortgages & Property",
      jurisdiction: "England & NI (SDLT), Scotland (LBTT), Wales (LTT)",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC SDLT Manual, Revenue Scotland, Welsh Revenue Authority",
      statutoryBasis: "Finance Act 2003 (SDLT), Land and Buildings Transaction Tax (Scotland) Act 2013, Land Transaction Tax and Anti-avoidance of Devolved Taxes (Wales) Act 2017",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Mortgages & Property" || c.id.startsWith("MOR-") || c.id.startsWith("PRO-")
      ).length,
      sampleParameters: {
        "SDLT Standard Residential Nil-Rate": typeof sdlt?.standard_bands?.[0]?.to === "number"
          ? `Up to ${safeCurrency(sdlt.standard_bands[0].to)}`
          : (typeof sdlt?.residential_standard?.bands_price_gbp?.[0]?.to === "number" ? `Up to ${safeCurrency(sdlt.residential_standard.bands_price_gbp[0].to)}` : "Not available"),
        "SDLT Additional Property Surcharge": typeof sdlt?.additional_property_surcharge_rate === "number"
          ? `${safePercent(sdlt.additional_property_surcharge_rate)}`
          : "Not available",
        "LBTT Residential Nil-Rate": typeof lbtt?.standard_bands?.[0]?.to === "number"
          ? `Up to ${safeCurrency(lbtt.standard_bands[0].to)}`
          : (typeof lbtt?.residential_standard?.bands_price_gbp?.[0]?.to === "number" ? `Up to ${safeCurrency(lbtt.residential_standard.bands_price_gbp[0].to)}` : "Not available"),
        "LTT Residential Nil-Rate": typeof ltt?.main_bands?.[0]?.to === "number"
          ? `Up to ${safeCurrency(ltt.main_bands[0].to)}`
          : (typeof ltt?.residential_standard?.bands_price_gbp?.[0]?.to === "number" ? `Up to ${safeCurrency(ltt.residential_standard.bands_price_gbp[0].to)}` : "Not available"),
      },
      notes: "Devolved transaction taxes reflect distinct threshold bands and surcharge structures across jurisdictions.",
    },
    {
      key: "capital_gains_tax",
      name: "Capital Gains Tax (CGT)",
      category: "Investing & Wealth",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC Capital Gains Manual",
      statutoryBasis: "Taxation of Chargeable Gains Act 1992 (TCGA 1992)",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Investing & Wealth" || c.id.startsWith("INV-") || c.id.startsWith("CGT-")
      ).length,
      sampleParameters: {
        "Annual Exempt Amount": typeof cgt?.annual_exempt_amount_gbp === "number" ? safeCurrency(cgt.annual_exempt_amount_gbp) : "Not available",
        "Basic Rate (Other Assets)": typeof cgt?.standard_rates?.basic_band === "number"
          ? safePercent(cgt.standard_rates.basic_band)
          : (typeof cgt?.basic_rate_other === "number" ? safePercent(cgt.basic_rate_other) : "Not available"),
        "Higher Rate (Other Assets)": typeof cgt?.standard_rates?.higher_band === "number"
          ? safePercent(cgt.standard_rates.higher_band)
          : (typeof cgt?.higher_rate_other === "number" ? safePercent(cgt.higher_rate_other) : "Not available"),
        "Residential Property Rates": "Not available",
      },
      notes: "CGT rates harmonised per 2026/27 statutory schedules with unified basic and higher bands.",
    },
    {
      key: "student_loans",
      name: "Student Loan Repayment Thresholds & Rates",
      category: "Education",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "Student Loans Company / Department for Education",
      statutoryBasis: "Education (Student Loans) (Repayment) Regulations 2009",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Education" || c.id.startsWith("EDU-") || c.id.startsWith("STU-")
      ).length,
      sampleParameters: {
        "Plan 1 Threshold": typeof sl?.["Plan 1"]?.annual_threshold_gbp === "number" && typeof sl?.["Plan 1"]?.rate === "number"
          ? `${safeCurrency(sl["Plan 1"].annual_threshold_gbp)}/yr (${safePercent(sl["Plan 1"].rate)})`
          : "Not available",
        "Plan 2 Threshold": typeof sl?.["Plan 2"]?.annual_threshold_gbp === "number" && typeof sl?.["Plan 2"]?.rate === "number"
          ? `${safeCurrency(sl["Plan 2"].annual_threshold_gbp)}/yr (${safePercent(sl["Plan 2"].rate)})`
          : "Not available",
        "Plan 4 Threshold (Scotland)": typeof sl?.["Plan 4"]?.annual_threshold_gbp === "number" && typeof sl?.["Plan 4"]?.rate === "number"
          ? `${safeCurrency(sl["Plan 4"].annual_threshold_gbp)}/yr (${safePercent(sl["Plan 4"].rate)})`
          : "Not available",
        "Plan 5 Threshold": typeof sl?.["Plan 5"]?.annual_threshold_gbp === "number" && typeof sl?.["Plan 5"]?.rate === "number"
          ? `${safeCurrency(sl["Plan 5"].annual_threshold_gbp)}/yr (${safePercent(sl["Plan 5"].rate)})`
          : "Not available",
        "Postgraduate Loan Threshold": typeof sl?.["Postgraduate"]?.annual_threshold_gbp === "number" && typeof sl?.["Postgraduate"]?.rate === "number"
          ? `${safeCurrency(sl["Postgraduate"].annual_threshold_gbp)}/yr (${safePercent(sl["Postgraduate"].rate)})`
          : "Not available",
      },
      notes: "Income-contingent repayments deducted through PAYE simultaneously with Income Tax and National Insurance.",
    },
    {
      key: "corporation_tax",
      name: "Corporation Tax & Marginal Relief",
      category: "Business & Commercial",
      jurisdiction: "United Kingdom",
      status: "approved",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastChecked: rules.checked_at || "2026-08-22",
      primarySource: "HMRC Company Taxation Manual",
      statutoryBasis: "Corporation Tax Act 2010 (CTA 2010)",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Business & Commercial" || c.id.startsWith("BUS-") || c.id.startsWith("CORP-")
      ).length,
      sampleParameters: {
        "Small Profits Rate": typeof ct?.small_profits_rate === "number" && typeof ct?.small_profits_limit_gbp === "number"
          ? `${safePercent(ct.small_profits_rate)} (profits up to ${safeCurrency(ct.small_profits_limit_gbp)})`
          : "Not available",
        "Main Rate": typeof ct?.main_rate === "number" && typeof ct?.main_rate_limit_gbp === "number"
          ? `${safePercent(ct.main_rate)} (profits above ${safeCurrency(ct.main_rate_limit_gbp)})`
          : "Not available",
        "Marginal Relief Fraction": typeof ct?.marginal_relief_standard_fraction === "number"
          ? `${ct.marginal_relief_standard_fraction} (3/200)`
          : "Not available",
      },
      notes: "Marginal relief provides a gradual transition between the Small Profits Rate and Main Rate.",
    },
  ];

  return {
    activeRulesetId: rules.ruleset_id || "uk-2026-27-v1",
    taxYear: rules.tax_year || "2026/27",
    status: rules.status || "approved",
    effectivePeriod: `${rules.effective_from || "2026-04-06"} to ${rules.effective_to || "2027-04-05"}`,
    lastChecked: rules.checked_at || "2026-08-22",
    totalRuleFamilies: ruleFamilies.length,
    rulesSensitiveCalculatorsTotal: rulesSensitiveCalculators.length,
    ruleFamilies,
  };
}