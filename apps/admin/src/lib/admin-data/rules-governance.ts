import { getUKRuleset } from "../../../../../dist/packages/rules-uk/src/index.js";
import { calculatorRegistry } from "../../../../../dist/packages/calculator-registry/src/index.js";
import type { CalculatorDefinition } from "../../../../../packages/calculator-registry/src/types";

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
        "Personal Allowance": `£${rules.income_tax_england_wales_ni?.personal_allowance_gbp?.toLocaleString() || "12,570"}`,
        "Basic Rate": "20% (up to £37,700 taxable)",
        "Higher Rate": "40% (£37,701 - £125,140)",
        "Additional Rate": "45% (above £125,140)",
        "Allowance Taper Start": `£${rules.income_tax_england_wales_ni?.personal_allowance_taper_start_gbp?.toLocaleString() || "100,000"}`,
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
        "Starter Rate": "19% (£12,571 - £16,537)",
        "Basic Rate": "20% (£16,538 - £29,526)",
        "Intermediate Rate": "21% (£29,527 - £43,662)",
        "Higher Rate": "42% (£43,663 - £75,000)",
        "Advanced Rate": "45% (£75,001 - £125,140)",
        "Top Rate": "48% (above £125,140)",
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
        "Class 1 Primary Threshold": "£242/week (£12,570/year)",
        "Class 1 Main Employee Rate": "8%",
        "Class 1 Upper Earnings Limit": "£967/week (£50,270/year)",
        "Class 1 Additional Employee Rate": "2%",
        "Class 1 Employer Secondary Rate": "15.0% (above £5,000 threshold)",
      },
      notes: "Updated employer NI threshold and rate per Autumn Budget statutory schedule.",
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
        "Standard Annual Allowance": "£60,000",
        "Money Purchase Annual Allowance (MPAA)": "£10,000",
        "Lump Sum Allowance (LSA)": "£268,275 (25% tax-free cap)",
        "Lump Sum & Death Benefit Allowance (LSDBA)": "£1,073,100",
        "Tapered Annual Allowance Minimum": "£10,000 (Adjusted Income > £260k)",
      },
      notes: "Lifetime Allowance abolished; replaced by Lump Sum Allowance (LSA) and LSDBA.",
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
        "Annual ISA Limit": `£${rules.isa?.overall_subscription_limit_gbp?.toLocaleString() || "20,000"}`,
        "Lifetime ISA (LISA) Limit": `£${rules.isa?.lifetime_isa_subscription_limit_gbp?.toLocaleString() || "4,000"}`,
        "LISA Government Bonus": "25% (up to £1,000/year)",
        "Junior ISA Limit": `£${rules.isa?.junior_isa_subscription_limit_gbp?.toLocaleString() || "9,000"}`,
        "LISA Unauthorized Withdrawal Charge": "25%",
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
        "Nil Rate Band (Standard Residential)": "£0 - £125,000 (0%)",
        "Band 1 (£125,001 - £250,000)": "2%",
        "Band 2 (£250,001 - £925,000)": "5%",
        "Band 3 (£925,001 - £1,500,000)": "10%",
        "Additional Property Surcharge": "5% across all slices",
        "FTB Relief Threshold": "£300,000 at 0% (max purchase £500,000)",
      },
      notes: "Post-March 2025 sunset thresholds applied. Additional property surcharge reflects 5% rate.",
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
        "Nil Rate Band": "£0 - £145,000 (0%)",
        "Band 1 (£145,001 - £250,000)": "2%",
        "Band 2 (£250,001 - £325,000)": "5%",
        "Band 3 (£325,001 - £750,000)": "10%",
        "Band 4 (Over £750,000)": "12%",
        "Additional Dwelling Supplement (ADS)": "6%",
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
        "Nil Rate Band": "£0 - £225,000 (0%)",
        "Band 1 (£225,001 - £400,000)": "6%",
        "Band 2 (£400,001 - £750,000)": "7.5%",
        "Band 3 (£750,001 - £1,500,000)": "10%",
        "Higher Residential Rates Surcharge": "Tiered additional property rates",
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
        "Annual Exempt Amount": "£3,000",
        "Basic Rate Assets": "18%",
        "Higher/Additional Rate Assets": "24%",
        "Residential Property Basic Rate": "18%",
        "Residential Property Higher Rate": "24%",
      },
      notes: "Rates harmonised at 18% basic / 24% higher following Autumn Budget adjustments.",
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
        "Plan 1 Threshold": "£26,065 (9%)",
        "Plan 2 Threshold": "£28,470 (9%)",
        "Plan 4 (Scotland) Threshold": "£32,745 (9%)",
        "Plan 5 Threshold": "£25,000 (9%)",
        "Postgraduate Loan Threshold": "£21,000 (6%)",
      },
      notes: "Repayments deducted via PAYE alongside Income Tax and NICs.",
    },
    {
      key: "child_benefit_hicbc",
      name: "High Income Child Benefit Charge (HICBC)",
      category: "UK Tax & Salary",
      jurisdiction: "UK",
      status: "approved",
      taxYear: rules.tax_year,
      effectiveFrom: rules.effective_from,
      effectiveTo: rules.effective_to,
      lastChecked: rules.checked_at,
      primarySource: "HMRC Child Benefit statutory guidance",
      statutoryBasis: "Income Tax (Earnings and Pensions) Act 2003",
      dependentCalculatorsCount: calcs.filter((c: CalculatorDefinition) => c.id === "TAX-019").length,
      sampleParameters: {
        "Threshold (Taper Start)": "£60,000 Adjusted Net Income",
        "Taper End (100% Clawback)": "£80,000 Adjusted Net Income",
        "Clawback Rate": "1% of benefit per £200 income above £60,000",
      },
      notes: "Threshold increased to £60k-£80k range with halved taper rate.",
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