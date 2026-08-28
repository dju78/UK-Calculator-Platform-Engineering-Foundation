import rawRules from "@foundation/rules-uk/src/rulesets/uk-2026-27-v1.json";
import type { CalculatorDefinition } from "@foundation/calculator-registry/src/types";
import { calculatorRegistry } from "./calculator-registry";

export type GovernanceReviewStatus =
  | "Current"
  | "Review approaching"
  | "Review due"
  | "Overdue"
  | "Unknown";

export interface GovernanceReviewItem {
  key: string;
  name: string;
  category: string;
  jurisdiction: string;
  currentRulesetId: string;
  taxYear: string;
  effectiveFrom: string;
  effectiveTo: string;
  lastReviewed: string;
  nextScheduledReview: string;
  reviewTriggerEvent: string;
  status: GovernanceReviewStatus;
  statusNotes: string;
  primarySource: string;
  statutoryBasis: string;
  dependentCalculatorsCount: number;
}

export interface AdminGovernanceCalendarOverview {
  activeRulesetId: string;
  taxYear: string;
  effectivePeriod: string;
  totalRuleFamilies: number;
  currentCount: number;
  approachingCount: number;
  dueCount: number;
  overdueCount: number;
  unknownCount: number;
  items: GovernanceReviewItem[];
  overallAlertSummary: string;
}

export function evaluateGovernanceReviewStatus(
  effectiveTo: string,
  lastReviewed: string,
  targetReviewDate: string,
  referenceDate: string = "2026-08-28"
): { status: GovernanceReviewStatus; notes: string } {
  if (!effectiveTo || !lastReviewed) {
    return { status: "Unknown", notes: "Review schedule not recorded" };
  }

  const ref = new Date(referenceDate).getTime();
  const effTo = new Date(effectiveTo).getTime();
  const targetRev = new Date(targetReviewDate).getTime();

  if (ref > effTo) {
    return { status: "Overdue", notes: "Past statutory effective period end date" };
  }

  if (ref > targetRev) {
    return { status: "Review due", notes: "Past target scheduled review date" };
  }

  const diffDays = Math.round((targetRev - ref) / (1000 * 60 * 60 * 24));
  if (diffDays <= 90 && diffDays >= 0) {
    return { status: "Review approaching", notes: `Review scheduled in ${diffDays} days (Autumn/Winter fiscal cycle)` };
  }

  return { status: "Current", notes: `Approved for ${rawRules.tax_year || "2026/27"}` };
}

export function getAdminGovernanceCalendar(): AdminGovernanceCalendarOverview {
  const rules = rawRules as any;
  const calcs = calculatorRegistry as CalculatorDefinition[];

  const rawFamilies = [
    {
      key: "income_tax_england_wales_ni",
      name: "Income Tax (England, Wales & NI)",
      category: "UK Tax & Salary",
      jurisdiction: "England, Wales & NI",
      primarySource: "HMRC / Autumn Statement Statutory Schedule",
      statutoryBasis: "Income Tax Act 2007, Finance Act",
      nextScheduledReview: "2026-11-20",
      reviewTriggerEvent: "Autumn Statement 2026 statutory rates announcement",
      filterFn: (c: CalculatorDefinition) => c.category === "UK Tax & Salary" || c.id.startsWith("TAX-") || c.id.startsWith("SAL-"),
    },
    {
      key: "income_tax_scotland",
      name: "Scottish Income Tax (Devolved Rates)",
      category: "UK Tax & Salary",
      jurisdiction: "Scotland",
      primarySource: "Scottish Government Budget Resolution",
      statutoryBasis: "Scotland Act 2016, Scottish Rate Resolution",
      nextScheduledReview: "2026-12-15",
      reviewTriggerEvent: "Scottish Budget 2027/28 parliamentary resolution",
      filterFn: (c: CalculatorDefinition) => c.category === "UK Tax & Salary" || c.id === "TAX-002" || c.id === "TAX-004",
    },
    {
      key: "national_insurance_class1",
      name: "National Insurance (Class 1 Employee)",
      category: "UK Tax & Salary",
      jurisdiction: "United Kingdom",
      primarySource: "HMRC National Insurance Manual & Statutory Rates",
      statutoryBasis: "Social Security Contributions and Benefits Act 1992",
      nextScheduledReview: "2026-11-20",
      reviewTriggerEvent: "Autumn Statement 2026 / NIC threshold updates",
      filterFn: (c: CalculatorDefinition) => c.category === "UK Tax & Salary" || c.id.startsWith("NIC-"),
    },
    {
      key: "pension_annual_allowance",
      name: "Pension Tax Relief & Annual Allowance",
      category: "Pensions & Retirement",
      jurisdiction: "United Kingdom",
      primarySource: "HMRC Pensions Tax Manual (PTM)",
      statutoryBasis: "Finance Act 2004 Part 4",
      nextScheduledReview: "2026-11-20",
      reviewTriggerEvent: "Autumn fiscal statement / pension allowance indexation",
      filterFn: (c: CalculatorDefinition) => c.category === "Pensions & Retirement" || c.id.startsWith("PEN-"),
    },
    {
      key: "isa_allowances",
      name: "Individual Savings Account (ISA) Limits",
      category: "ISA & Tax Wrappers",
      jurisdiction: "United Kingdom",
      primarySource: "HMRC ISA Guidance for Managers",
      statutoryBasis: "Individual Savings Account Regulations 1998",
      nextScheduledReview: "2027-02-15",
      reviewTriggerEvent: "HMRC annual ISA manager bulletin / statutory limits update",
      filterFn: (c: CalculatorDefinition) => c.category === "ISA & Tax Wrappers" || c.id.startsWith("ISA-"),
    },
    {
      key: "property_transaction_tax",
      name: "Property Transaction Taxes (SDLT, LBTT, LTT)",
      category: "Mortgages & Property",
      jurisdiction: "England & NI (SDLT), Scotland (LBTT), Wales (LTT)",
      primarySource: "HMRC SDLT Manual, Revenue Scotland, Welsh Revenue Authority",
      statutoryBasis: "Finance Act 2003, LBTT Act 2013, LTT Act 2017",
      nextScheduledReview: "2026-11-20",
      reviewTriggerEvent: "UK & Devolved Governments Autumn Budgets",
      filterFn: (c: CalculatorDefinition) => c.category === "Mortgages & Property" || c.id.startsWith("MOR-") || c.id.startsWith("PRO-"),
    },
    {
      key: "capital_gains_tax",
      name: "Capital Gains Tax (CGT)",
      category: "Investing & Wealth",
      jurisdiction: "United Kingdom",
      primarySource: "HMRC Capital Gains Manual",
      statutoryBasis: "Taxation of Chargeable Gains Act 1992 (TCGA 1992)",
      nextScheduledReview: "2026-11-20",
      reviewTriggerEvent: "Autumn Statement 2026 / Finance Bill",
      filterFn: (c: CalculatorDefinition) => c.category === "Investing & Wealth" || c.id.startsWith("INV-") || c.id.startsWith("CGT-"),
    },
    {
      key: "student_loans",
      name: "Student Loan Repayment Thresholds & Rates",
      category: "Education",
      jurisdiction: "United Kingdom",
      primarySource: "Student Loans Company / Department for Education",
      statutoryBasis: "Education (Student Loans) (Repayment) Regulations 2009",
      nextScheduledReview: "2027-01-15",
      reviewTriggerEvent: "Department for Education annual threshold recalculation",
      filterFn: (c: CalculatorDefinition) => c.category === "Education" || c.id.startsWith("EDU-") || c.id.startsWith("STU-"),
    },
    {
      key: "corporation_tax",
      name: "Corporation Tax & Marginal Relief",
      category: "Business & Commercial",
      jurisdiction: "United Kingdom",
      primarySource: "HMRC Company Taxation Manual",
      statutoryBasis: "Corporation Tax Act 2010 (CTA 2010)",
      nextScheduledReview: "2026-11-20",
      reviewTriggerEvent: "Autumn Statement 2026 / Corporation Tax schedules",
      filterFn: (c: CalculatorDefinition) => c.category === "Business & Commercial" || c.id.startsWith("BUS-") || c.id.startsWith("CORP-"),
    },
  ];

  let currentCount = 0;
  let approachingCount = 0;
  let dueCount = 0;
  let overdueCount = 0;
  let unknownCount = 0;

  const items: GovernanceReviewItem[] = rawFamilies.map((f) => {
    const { status, notes } = evaluateGovernanceReviewStatus(
      rules.effective_to || "2027-04-05",
      rules.checked_at || "2026-08-22",
      f.nextScheduledReview,
      "2026-08-28"
    );

    if (status === "Current") currentCount++;
    else if (status === "Review approaching") approachingCount++;
    else if (status === "Review due") dueCount++;
    else if (status === "Overdue") overdueCount++;
    else unknownCount++;

    return {
      key: f.key,
      name: f.name,
      category: f.category,
      jurisdiction: f.jurisdiction,
      currentRulesetId: rules.ruleset_id || "uk-2026-27-v1",
      taxYear: rules.tax_year || "2026/27",
      effectiveFrom: rules.effective_from || "2026-04-06",
      effectiveTo: rules.effective_to || "2027-04-05",
      lastReviewed: rules.checked_at || "2026-08-22",
      nextScheduledReview: f.nextScheduledReview,
      reviewTriggerEvent: f.reviewTriggerEvent,
      status,
      statusNotes: notes,
      primarySource: f.primarySource,
      statutoryBasis: f.statutoryBasis,
      dependentCalculatorsCount: calcs.filter(f.filterFn).length,
    };
  });

  let overallAlertSummary = "All 9 statutory rule families current for 2026/27";
  if (overdueCount > 0) {
    overallAlertSummary = `${overdueCount} rule ${overdueCount === 1 ? "family" : "families"} overdue for statutory update`;
  } else if (dueCount > 0) {
    overallAlertSummary = `${dueCount} rule ${dueCount === 1 ? "family" : "families"} due for scheduled review`;
  } else if (approachingCount > 0) {
    overallAlertSummary = `${approachingCount} rule ${approachingCount === 1 ? "family" : "families"} approaching Autumn 2026 review window`;
  }

  return {
    activeRulesetId: rules.ruleset_id || "uk-2026-27-v1",
    taxYear: rules.tax_year || "2026/27",
    effectivePeriod: `${rules.effective_from || "2026-04-06"} to ${rules.effective_to || "2027-04-05"}`,
    totalRuleFamilies: items.length,
    currentCount,
    approachingCount,
    dueCount,
    overdueCount,
    unknownCount,
    items,
    overallAlertSummary,
  };
}
