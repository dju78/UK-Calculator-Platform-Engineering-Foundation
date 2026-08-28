import { getUKRuleset } from "../../../../../packages/rules-uk/src/index.js";
import { calculatorRegistry } from "../../../../../packages/calculator-registry/src/index.js";
import type { CalculatorDefinition } from "../../../../../packages/calculator-registry/src/types.js";

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
      primarySource: "Scottish Government Budget 2026/27",
      statutoryBasis: "Scotland Act 2016, Scottish Rate Resolution",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        (c.category === "UK Tax & Salary" || c.id.startsWith("TAX-")) &&
        (c.jurisdiction === "Scotland" || !c.jurisdiction || c.jurisdiction === "UK")
      ).length,
      sampleParameters: {
        "Starter Rate": itScot?.bands_taxable_income_gbp?.[0] ? `${(itScot.bands_taxable_income_gbp[0].rate * 100).toFixed(0)}% (£12,571 - £${(12570 + itScot.bands_taxable_income_gbp[0].to).toLocaleString()})` : "Not available",
        "Basic Rate": itScot?.bands_taxable_income_gbp?.[1] ? `${(itScot.bands_taxable_income_gbp[1].rate * 100).toFixed(0)}% (£${(12570 + itScot.bands_taxable_income_gbp[1].from).toLocaleString()} - £${(12570 + itScot.bands_taxable_income_gbp[1].to).toLocaleString()})` : "Not available",
        "Intermediate Rate": itScot?.bands_taxable_income_gbp?.[2] ? `${(itScot.bands_taxable_income_gbp[2].rate * 100).toFixed(0)}% (£${(12570 + itScot.bands_taxable_income_gbp[2].from).toLocaleString()} - £${(12570 + itScot.bands_taxable_income_gbp[2].to).toLocaleString()})` : "Not available",
        "Higher Rate": itScot?.bands_taxable_income_gbp?.[3] ? `${(itScot.bands_taxable_income_gbp[3].rate * 100).toFixed(0)}% (£${(12570 + itScot.bands_taxable_income_gbp[3].from).toLocaleString()} - £${(12570 + itScot.bands_taxable_income_gbp[3].to).toLocaleString()})` : "Not available",
        "Advanced Rate": itScot?.bands_taxable_income_gbp?.[4] ? `${(itScot.bands_taxable_income_gbp[4].rate * 100).toFixed(0)}% (£${(12570 + itScot.bands_taxable_income_gbp[4].from).toLocaleString()} - £${(12570 + itScot.bands_taxable_income_gbp[4].to).toLocaleString()})` : "Not available",
        "Top Rate": itScot?.bands_taxable_income_gbp?.[5] ? `${(itScot.bands_taxable_income_gbp[5].rate * 100).toFixed(0)}% (above £${(12570 + itScot.bands_taxable_income_gbp[5].from - 1).toLocaleString()})` : "Not available",
      },
      notes: "Applies to non-savings, non-dividend earned income for Scottish resident taxpayers.",
    },
    {
      key: "national_insurance",
      name: "National Insurance Contributions (NICs)",
      category: "UK Tax & Salary",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC National Insurance manual",
      statutoryBasis: "Social Security Contributions and Benefits Act 1992",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "UK Tax & Salary" || c.id.startsWith("TAX-") || c.id.startsWith("BUS-")
      ).length,
      sampleParameters: {
        "Class 1 Primary Threshold": niEmp?.period_thresholds_gbp?.primary_threshold ? `£${niEmp.period_thresholds_gbp.primary_threshold.weekly}/week (£${niEmp.period_thresholds_gbp.primary_threshold.annual?.toLocaleString()}/year)` : "Not available",
        "Class 1 Main Employee Rate": niEmp?.main_rate !== undefined ? `${(niEmp.main_rate * 100).toFixed(0)}%` : "Not available",
        "Class 1 Upper Earnings Limit": niEmp?.period_thresholds_gbp?.upper_earnings_limit ? `£${niEmp.period_thresholds_gbp.upper_earnings_limit.weekly}/week (£${niEmp.period_thresholds_gbp.upper_earnings_limit.annual?.toLocaleString()}/year)` : "Not available",
        "Class 1 Additional Employee Rate": niEmp?.upper_rate !== undefined ? `${(niEmp.upper_rate * 100).toFixed(0)}%` : "Not available",
      },
      notes: "Class 1 employee National Insurance calculated on annualised primary earnings basis.",
    },
    {
      key: "pensions",
      name: "Pensions & Retirement Allowances",
      category: "Pensions & Retirement",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Pensions Tax Manual",
      statutoryBasis: "Finance Act 2004, Pensions Act",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Pensions & Retirement" || c.id.startsWith("PEN-")
      ).length,
      sampleParameters: {
        "Standard Annual Allowance": pen?.annual_allowance_gbp ? `£${pen.annual_allowance_gbp.toLocaleString()}` : "Not available",
        "Money Purchase Annual Allowance (MPAA)": pen?.money_purchase_annual_allowance_gbp ? `£${pen.money_purchase_annual_allowance_gbp.toLocaleString()}` : "Not available",
        "Lump Sum Allowance (LSA)": pen?.lump_sum_allowance_gbp ? `£${pen.lump_sum_allowance_gbp.toLocaleString()} (25% tax-free cap)` : "Not available",
        "Tapered Annual Allowance Minimum": pen?.minimum_tapered_annual_allowance_gbp ? `£${pen.minimum_tapered_annual_allowance_gbp.toLocaleString()} (Adjusted Income > £${pen.adjusted_income_taper_gbp?.toLocaleString()})` : "Not available",
      },
      notes: "Lifetime Allowance abolished; replaced by Lump Sum Allowance (LSA).",
    },
    {
      key: "isa",
      name: "ISA & Tax-Free Savings Wrappers",
      category: "ISA & Tax Wrappers",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "Individual Savings Account Regulations",
      statutoryBasis: "ISA Regulations 1998 (as amended)",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "ISA & Tax Wrappers" || c.id.startsWith("ISA-") || c.id.startsWith("INV-")
      ).length,
      sampleParameters: {
        "Annual ISA Limit": isa?.overall_subscription_limit_gbp ? `£${isa.overall_subscription_limit_gbp.toLocaleString()}` : "Not available",
        "Lifetime ISA (LISA) Limit": isa?.lifetime_isa_subscription_limit_gbp ? `£${isa.lifetime_isa_subscription_limit_gbp.toLocaleString()}` : "Not available",
        "LISA Government Bonus": isa?.lifetime_isa_bonus_rate !== undefined ? `${(isa.lifetime_isa_bonus_rate * 100).toFixed(0)}% (up to £${isa.lifetime_isa_maximum_bonus_gbp?.toLocaleString()}/year)` : "Not available",
        "Junior ISA Limit": isa?.junior_isa_subscription_limit_gbp ? `£${isa.junior_isa_subscription_limit_gbp.toLocaleString()}` : "Not available",
        "LISA Unauthorized Withdrawal Charge": isa?.lifetime_isa_withdrawal_charge_rate !== undefined ? `${(isa.lifetime_isa_withdrawal_charge_rate * 100).toFixed(0)}%` : "Not available",
      },
      notes: "LISA property price cap is £450,000 across all UK regions.",
    },
    {
      key: "sdlt",
      name: "Stamp Duty Land Tax (SDLT)",
      category: "Mortgages & Property",
      jurisdiction: "England & Northern Ireland",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Stamp Taxes / Finance Act",
      statutoryBasis: "Finance Act 2003 (Part 4)",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.id === "PRO-004" || c.id === "PRO-023" || c.id === "PRO-024"
      ).length,
      sampleParameters: {
        "Nil Rate Band (Standard Residential)": sdlt?.standard_bands?.[0] ? `£0 - £${sdlt.standard_bands[0].to?.toLocaleString()} (${(sdlt.standard_bands[0].rate * 100).toFixed(0)}%)` : "Not available",
        "Band 1 (£125,001 - £250,000)": sdlt?.standard_bands?.[1] ? `${(sdlt.standard_bands[1].rate * 100).toFixed(0)}%` : "Not available",
        "Band 2 (£250,001 - £925,000)": sdlt?.standard_bands?.[2] ? `${(sdlt.standard_bands[2].rate * 100).toFixed(0)}%` : "Not available",
        "Band 3 (£925,001 - £1,500,000)": sdlt?.standard_bands?.[3] ? `${(sdlt.standard_bands[3].rate * 100).toFixed(0)}%` : "Not available",
        "Additional Property Surcharge": sdlt?.additional_property_surcharge_rate !== undefined ? `${(sdlt.additional_property_surcharge_rate * 100).toFixed(0)}% across all slices` : "Not available",
        "FTB Relief Threshold": sdlt?.first_time_buyer_relief ? `£${sdlt.first_time_buyer_relief.bands?.[0]?.to?.toLocaleString()} at 0% (max purchase £${sdlt.first_time_buyer_relief.maximum_qualifying_property_value_gbp?.toLocaleString()})` : "Not available",
      },
      notes: "Post-March 2025 sunset thresholds applied. Additional property surcharge reflects statutory rate.",
    },
    {
      key: "lbtt",
      name: "Land & Buildings Transaction Tax (LBTT)",
      category: "Mortgages & Property",
      jurisdiction: "Scotland",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "Revenue Scotland LBTT statutory rates",
      statutoryBasis: "Land and Buildings Transaction Tax (Scotland) Act 2013",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.id === "PRO-025" || c.id === "PRO-026"
      ).length,
      sampleParameters: {
        "Nil Rate Band": lbtt?.standard_bands?.[0] ? `£0 - £${lbtt.standard_bands[0].to?.toLocaleString()} (${(lbtt.standard_bands[0].rate * 100).toFixed(0)}%)` : "Not available",
        "Band 1 (£145,001 - £250,000)": lbtt?.standard_bands?.[1] ? `${(lbtt.standard_bands[1].rate * 100).toFixed(0)}%` : "Not available",
        "Band 2 (£250,001 - £325,000)": lbtt?.standard_bands?.[2] ? `${(lbtt.standard_bands[2].rate * 100).toFixed(0)}%` : "Not available",
        "Band 3 (£325,001 - £750,000)": lbtt?.standard_bands?.[3] ? `${(lbtt.standard_bands[3].rate * 100).toFixed(0)}%` : "Not available",
        "Band 4 (Over £750,000)": lbtt?.standard_bands?.[4] ? `${(lbtt.standard_bands[4].rate * 100).toFixed(0)}%` : "Not available",
        "Additional Dwelling Supplement (ADS)": lbtt?.additional_dwelling_supplement_rate !== undefined ? `${(lbtt.additional_dwelling_supplement_rate * 100).toFixed(0)}%` : "Not available",
      },
      notes: "Administered independently by Revenue Scotland.",
    },
    {
      key: "ltt",
      name: "Land Transaction Tax (LTT)",
      category: "Mortgages & Property",
      jurisdiction: "Wales",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "Welsh Revenue Authority (WRA)",
      statutoryBasis: "Land Transaction Tax and Anti-avoidance of Devolved Taxes (Wales) Act 2017",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) => c.id === "PRO-027").length,
      sampleParameters: {
        "Nil Rate Band": ltt?.main_bands?.[0] ? `£0 - £${ltt.main_bands[0].to?.toLocaleString()} (${(ltt.main_bands[0].rate * 100).toFixed(0)}%)` : "Not available",
        "Band 1 (£225,001 - £400,000)": ltt?.main_bands?.[1] ? `${(ltt.main_bands[1].rate * 100).toFixed(1)}%` : "Not available",
        "Band 2 (£400,001 - £750,000)": ltt?.main_bands?.[2] ? `${(ltt.main_bands[2].rate * 100).toFixed(1)}%` : "Not available",
        "Band 3 (£750,001 - £1,500,000)": ltt?.main_bands?.[3] ? `${(ltt.main_bands[3].rate * 100).toFixed(0)}%` : "Not available",
      },
      notes: "Administered by Welsh Revenue Authority.",
    },
    {
      key: "capital_gains_tax",
      name: "Capital Gains Tax (CGT)",
      category: "Investing & Wealth",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Capital Gains manual",
      statutoryBasis: "Taxation of Chargeable Gains Act 1992, Finance Act 2024",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.id === "INV-004" || c.id === "INV-028" || c.id === "PRO-028" || c.id === "TAX-013"
      ).length,
      sampleParameters: {
        "Annual Exempt Amount": cgt?.annual_exempt_amount_gbp ? `£${cgt.annual_exempt_amount_gbp.toLocaleString()}` : "Not available",
        "Basic Rate Assets": cgt?.standard_rates?.basic_band !== undefined ? `${(cgt.standard_rates.basic_band * 100).toFixed(0)}%` : "Not available",
        "Higher/Additional Rate Assets": cgt?.standard_rates?.higher_band !== undefined ? `${(cgt.standard_rates.higher_band * 100).toFixed(0)}%` : "Not available",
      },
      notes: "Rates harmonised at statutory rates following Autumn Budget adjustments.",
    },
    {
      key: "student_loans",
      name: "Student Loan Repayment Thresholds",
      category: "UK Tax & Salary",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "Student Loans Company (SLC) repayment guidance",
      statutoryBasis: "Education (Student Loans) (Repayment) Regulations",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.id === "TAX-004" || c.id === "TAX-001" || c.id === "TAX-002"
      ).length,
      sampleParameters: {
        "Plan 1 Threshold": sl?.["Plan 1"]?.annual_threshold_gbp ? `£${sl["Plan 1"].annual_threshold_gbp.toLocaleString()} (${(sl["Plan 1"].rate * 100).toFixed(0)}%)` : "Not available",
        "Plan 2 Threshold": sl?.["Plan 2"]?.annual_threshold_gbp ? `£${sl["Plan 2"].annual_threshold_gbp.toLocaleString()} (${(sl["Plan 2"].rate * 100).toFixed(0)}%)` : "Not available",
        "Plan 4 (Scotland) Threshold": sl?.["Plan 4"]?.annual_threshold_gbp ? `£${sl["Plan 4"].annual_threshold_gbp.toLocaleString()} (${(sl["Plan 4"].rate * 100).toFixed(0)}%)` : "Not available",
        "Plan 5 Threshold": sl?.["Plan 5"]?.annual_threshold_gbp ? `£${sl["Plan 5"].annual_threshold_gbp.toLocaleString()} (${(sl["Plan 5"].rate * 100).toFixed(0)}%)` : "Not available",
        "Postgraduate Loan Threshold": sl?.["Postgraduate"]?.annual_threshold_gbp ? `£${sl["Postgraduate"].annual_threshold_gbp.toLocaleString()} (${(sl["Postgraduate"].rate * 100).toFixed(0)}%)` : "Not available",
      },
      notes: "Repayments deducted via PAYE alongside Income Tax and NICs.",
    },
    {
      key: "corporation_tax",
      name: "Corporation Tax Rates",
      category: "Business & Commercial",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Corporation Tax guidance",
      statutoryBasis: "Corporation Tax Act 2010",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) =>
        c.category === "Business & Commercial" || c.id.startsWith("BUS-")
      ).length,
      sampleParameters: {
        "Small Profits Rate": ct?.small_profits_rate !== undefined ? `${(ct.small_profits_rate * 100).toFixed(0)}% (up to £${ct.small_profits_limit_gbp?.toLocaleString()})` : "Not available",
        "Main Rate": ct?.main_rate !== undefined ? `${(ct.main_rate * 100).toFixed(0)}% (above £${ct.main_rate_limit_gbp?.toLocaleString()})` : "Not available",
        "Marginal Relief Fraction": ct?.marginal_relief_standard_fraction !== undefined ? `${ct.marginal_relief_standard_fraction} (3/200)` : "Not available",
      },
      notes: "Marginal relief applies between small profits and main rate thresholds.",
    },
  ];

  return {
    activeRulesetId: rules.ruleset_id,
    taxYear: rules.tax_year,
    status: rules.status,
    effectivePeriod: `${rules.effective_from} to ${rules.effective_to}`,
    lastChecked: rules.checked_at,
    totalRuleFamilies: ruleFamilies.length,
    rulesSensitiveCalculatorsTotal: rulesSensitiveCalculators.length,
    ruleFamilies,
  };
}