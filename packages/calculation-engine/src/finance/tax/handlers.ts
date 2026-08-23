import {
  calculateIncomeTax,
  calculateNationalInsurance,
  calculateStudentLoan,
  calculateVAT,
  calculateSDLT
} from "./core.js";
import { investmentGrowth } from "../investment/core.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";
import type { NumericInputs, CalculationContext, CalculatorHandler } from "../../types.js";
import {
  annualiseIncome,
  normaliseIncomeFrequency,
  normalisePayrollFrequency,
  periodicBreakdown,
  resolveWorkingPattern,
  type PeriodicAmounts,
  type WorkingPattern
} from "../../common/frequency.js";
import { jurisdictionKey, resolveTaxCode, type TaxCodeResolution } from "./tax-codes.js";
import { applyPensionArrangement, normalisePensionArrangement } from "./pension.js";

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Every periodic money figure the UI shows is derived here, from ONE annual
 * number, so the yearly/monthly/weekly/hourly views can never drift apart.
 */
function emitPeriodic(
  prefix: string,
  annualAmount: number,
  pattern: WorkingPattern,
  options: { allowHourly?: boolean } = {}
): Record<string, number> {
  const p: PeriodicAmounts = periodicBreakdown(annualAmount, pattern, options);
  const out: Record<string, number> = {
    [`${prefix}_yearly`]: round2(p.yearly),
    [`${prefix}_monthly`]: round2(p.monthly),
    [`${prefix}_weekly`]: round2(p.weekly)
  };
  if (p.hourly !== null) {
    out[`${prefix}_hourly_equivalent`] = round2(p.hourly);
  }
  return out;
}

/**
 * Read the shared income-frequency inputs and return the annualised amount
 * plus the working pattern behind it.
 */
function annualiseFromInputs(
  inputs: NumericInputs,
  amountKey: string
): { annual: number; pattern: WorkingPattern; frequency: string } {
  const frequency = normaliseIncomeFrequency(inputs.income_frequency ?? "annual");
  const pattern = resolveWorkingPattern(inputs as Record<string, unknown>, {
    requireHours: frequency === "hourly"
  });
  const amount = Number(inputs[amountKey]);
  if (!Number.isFinite(amount)) {
    throw new Error("Enter a valid income amount.");
  }
  return { annual: annualiseIncome(amount, frequency, pattern), pattern, frequency };
}

const PAYE_ESTIMATE_NOTE =
  "Annual estimate. Periodic figures divide the annual result and may differ from a payslip because of payroll rounding, cumulative PAYE, mid-year code changes, bonuses, benefits and prior earnings.";

export const tax001Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const jurisdiction = String(inputs.jurisdiction);
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });

  const { annual: income, pattern } = annualiseFromInputs(inputs, "income");
  const { tax, personalAllowance, taxableIncome } = calculateIncomeTax(income, jurisdiction, rules);

  return {
    outputs: {
      tax: round2(tax),
      personal_allowance: round2(personalAllowance),
      taxable_income: round2(taxableIncome),
      annual_income: round2(income),
      // Monthly/weekly always available; hourly only when the user has actually
      // supplied a working pattern, so we never invent an unseen assumption.
      ...emitPeriodic("tax", tax, pattern),
      estimation_basis: PAYE_ESTIMATE_NOTE
    }
  };
};

/**
 * TAX-002 doubles as a gross-pay frequency converter: enter your pay in any one
 * of the four frequencies and read the equivalent in the other three.
 */
export const tax002Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const jurisdiction = String(inputs.jurisdiction);
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });

  // TAX-002 has always carried hours/weeks, so an hourly figure is always
  // meaningful here.
  const { annual: salary, pattern } = annualiseFromInputs(inputs, "salary");
  const gross = periodicBreakdown(salary, pattern, { allowHourly: true });

  const { tax } = calculateIncomeTax(salary, jurisdiction, rules);
  const ni = calculateNationalInsurance(salary, rules);

  const net_annual = salary - tax - ni;

  return {
    outputs: {
      gross_annual: round2(gross.yearly),
      gross_monthly: round2(gross.monthly),
      gross_weekly: round2(gross.weekly),
      gross_hourly: round2(gross.hourly ?? 0),
      income_tax: round2(tax),
      ni: round2(ni),
      net_annual: round2(net_annual),
      ...emitPeriodic("net", net_annual, pattern, { allowHourly: true }),
      hours_per_week_used: pattern.hoursPerWeek,
      paid_weeks_per_year_used: pattern.paidWeeksPerYear,
      estimation_basis: PAYE_ESTIMATE_NOTE
    }
  };
};

export const tax003Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const jurisdiction = String(inputs.jurisdiction);
  const studentPlan = String(inputs.student_plan || "None");
  const postgraduate = Boolean(inputs.postgraduate);
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });

  const { annual: gross, pattern } = annualiseFromInputs(inputs, "gross");

  // Payroll frequency is a separate state from income frequency: an hourly
  // worker may be paid weekly or monthly.
  const payrollFrequency = normalisePayrollFrequency(inputs.payroll_frequency ?? "monthly");

  // --- Pension arrangement ----------------------------------------------
  // `salary_sacrifice_pct` is the original (decimal) contract and still means
  // a salary-sacrifice arrangement. Newer callers pass an explicit arrangement
  // plus `pension_pct`.
  const legacySacrifice = Number(inputs.salary_sacrifice_pct ?? 0);
  const hasExplicitArrangement = inputs.pension_arrangement !== undefined;
  const arrangement = hasExplicitArrangement
    ? normalisePensionArrangement(inputs.pension_arrangement)
    : legacySacrifice > 0
      ? "salary_sacrifice"
      : "none";
  const employeeRate = hasExplicitArrangement
    ? Number(inputs.pension_pct ?? 0)
    : legacySacrifice;
  const employerRate = Number(inputs.employer_pension_pct ?? 0);

  const pension = applyPensionArrangement(gross, arrangement, employeeRate, employerRate, rules);

  // --- Tax code ----------------------------------------------------------
  // Absent tax code keeps the historic tapered-personal-allowance behaviour.
  let taxCode: TaxCodeResolution | undefined;
  if (inputs.tax_code !== undefined && String(inputs.tax_code).trim() !== "") {
    taxCode = resolveTaxCode(String(inputs.tax_code), jurisdictionKey(jurisdiction), rules);
    if (!taxCode.supported) {
      // Never silently fall back to 1257L.
      return { outputs: { validation: taxCode.reason ?? "Unsupported tax code.", tax_code: taxCode.code } };
    }
  }

  const { tax, personalAllowance, taxableIncome } = calculateIncomeTax(
    pension.earningsForIncomeTax,
    jurisdiction,
    rules,
    taxCode
  );
  const ni = calculateNationalInsurance(pension.earningsForNationalInsurance, rules);
  const { studentLoan, pgLoan } = calculateStudentLoan(
    pension.earningsForStudentLoan,
    studentPlan,
    postgraduate,
    rules
  );

  // Take-home starts from contractual pay after any sacrifice, then removes
  // statutory deductions and any pension cash the employee actually pays.
  const totalDeductions = tax + ni + studentLoan + pgLoan;
  const pensionCashFromPay =
    arrangement === "salary_sacrifice" ? 0 : pension.employeeCashCost;
  const net_annual = pension.payAfterSacrifice - totalDeductions - pensionCashFromPay;
  const net_monthly = net_annual / 12;

  const taperStart = (rules as any).income_tax_england_wales_ni
    .personal_allowance_taper_start_gbp as number;
  const taxCodeNote =
    taxCode?.fixedAllowance &&
    taxCode.allowance > 0 &&
    pension.earningsForIncomeTax > taperStart
      ? "At this income HMRC would normally issue a reduced tax code. This estimate applies the allowance in the code you selected."
      : undefined;

  return {
    outputs: {
      // --- original contract, unchanged ---
      tax: round2(tax),
      ni: round2(ni),
      student_loan: round2(studentLoan),
      postgraduate_loan: round2(pgLoan),
      net_annual: round2(net_annual),
      net_monthly: round2(net_monthly),

      // --- primary periodic take-home ---
      ...emitPeriodic("net", net_annual, pattern, { allowHourly: true }),

      // --- breakdown ---
      gross_annual: round2(gross),
      gross_monthly: round2(gross / 12),
      gross_weekly: round2(gross / pattern.paidWeeksPerYear),
      taxable_pay: round2(taxableIncome),
      personal_allowance: round2(personalAllowance),

      // --- pension ---
      employee_pension: round2(pension.employeeGrossContribution),
      employee_pension_cash_cost: round2(pension.employeeCashCost),
      pension_tax_relief: round2(pension.basicRateReliefTopUp),
      employer_pension: round2(pension.employerContribution),
      total_pension_contribution: round2(pension.totalContribution),

      // --- context ---
      pension_arrangement: arrangement,
      payroll_frequency: payrollFrequency,
      hours_per_week_used: pattern.hoursPerWeek,
      paid_weeks_per_year_used: pattern.paidWeeksPerYear,
      ...(taxCode ? { tax_code: taxCode.code, tax_code_explanation: taxCode.explanation } : {}),
      ...(taxCodeNote ? { tax_code_note: taxCodeNote } : {}),
      estimation_basis: PAYE_ESTIMATE_NOTE
    }
  };
};

export const tax004Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
  const { annual: earnings, pattern } = annualiseFromInputs(inputs, "earnings");
  const payrollFrequency = normalisePayrollFrequency(inputs.payroll_frequency ?? "monthly");
  const ni = calculateNationalInsurance(earnings, rules);

  const niRules: any = rules.national_insurance_employee_class1_category_a;

  return {
    outputs: {
      ni: round2(ni),
      annual_earnings: round2(earnings),
      ...emitPeriodic("ni", ni, pattern),
      payroll_frequency: payrollFrequency,
      // Be explicit about the basis rather than implying payslip accuracy.
      calculation_basis: niRules.period_basis_applied
        ? `National Insurance assessed per ${payrollFrequency} pay period.`
        : "National Insurance is assessed on annual earnings in this ruleset version. HMRC operates weekly and monthly thresholds that are not exact divisions of the annual figures, so a real payslip may differ by a few pence per period.",
      estimation_basis: PAYE_ESTIMATE_NOTE
    }
  };
};

export const tax015Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const amount = Number(inputs.amount);
  const rate = Number(inputs.rate);
  const direction = String(inputs.direction) as "add" | "remove";

  const { net, vat, gross } = calculateVAT(amount, rate, direction);

  return {
    outputs: {
      net: round2(net),
      vat: round2(vat),
      gross: round2(gross)
    }
  };
};

export const tax020Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const plan = String(inputs.plan);
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
  const { annual: income, pattern } = annualiseFromInputs(inputs, "income");
  const payrollFrequency = normalisePayrollFrequency(inputs.payroll_frequency ?? "monthly");

  // In this fixture, it calculates either student loan OR pg loan based on the single input.
  const isPg = plan === "Postgraduate";
  const { studentLoan, pgLoan } = calculateStudentLoan(income, isPg ? "None" : plan, isPg, rules);
  const repayment = isPg ? pgLoan : studentLoan;

  return {
    outputs: {
      annual_repayment: round2(repayment),
      annual_income: round2(income),
      ...emitPeriodic("repayment", repayment, pattern),
      payroll_frequency: payrollFrequency,
      calculation_basis:
        "Repayments are estimated from annual income against the annual threshold. Real payroll assesses each pay period separately, so a payslip may differ - particularly if your income varies between periods.",
      estimation_basis: PAYE_ESTIMATE_NOTE
    }
  };
};

export const pro023Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const price = Number(inputs.price);
  const firstTime = Boolean(inputs.first_time);
  const additional = Boolean(inputs.additional);
  const nonresident = Boolean(inputs.nonresident);
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });

  const sdlt = calculateSDLT(price, firstTime, additional, nonresident, rules);

  const ftbRelief = (rules as any).property_transaction_tax.england_northern_ireland
    .first_time_buyer_relief;
  const ftbCeiling = ftbRelief.maximum_qualifying_property_value_gbp as number;

  return {
    outputs: {
      sdlt: round2(sdlt),
      effective_rate: price === 0 ? null : sdlt / price,
      // Stamp Duty Land Tax is an England and Northern Ireland tax. Scotland
      // and Wales levy different taxes with different bands, and presenting
      // this figure without saying so would mislead users in those nations.
      jurisdiction_note:
        "Stamp Duty Land Tax applies to property in England and Northern Ireland only. Scotland charges Land and Buildings Transaction Tax (LBTT) and Wales charges Land Transaction Tax (LTT); this calculator does not cover either.",
      ...(firstTime && price > ftbCeiling
        ? {
            first_time_buyer_note: `First-time buyer relief is not available above £${ftbCeiling.toLocaleString(
              "en-GB"
            )}, so the standard rates have been applied.`
          }
        : {})
    }
  };
};

export const isa001Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const start = Number(inputs.start);
  const annualSub = Number(inputs.annual_subscription);
  const ret = Number(inputs.return);
  const fee = Number(inputs.fee || 0);
  const years = Number(inputs.years);
  
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
  const overallLimit = rules.isa.overall_subscription_limit_gbp;

  const monthly = annualSub / 12;
  const projected_value = investmentGrowth(start, monthly, ret, fee, years);
  
  const allowance_used = annualSub / overallLimit;
  const remaining_allowance = Math.max(0, overallLimit - annualSub);

  return {
    outputs: {
      projected_value: round2(projected_value),
      allowance_used: round2(allowance_used),
      remaining_allowance: round2(remaining_allowance)
    }
  };
};

export const isa002Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const cash = Number(inputs.cash || 0);
  const stocks = Number(inputs.stocks || 0);
  const innovative = Number(inputs.innovative || 0);
  const lisa = Number(inputs.lisa || 0);

  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
  const overallLimit = rules.isa.overall_subscription_limit_gbp;
  const lisaLimit = rules.isa.lifetime_isa_subscription_limit_gbp;

  const total = cash + stocks + innovative + lisa;
  const remaining = Math.max(0, overallLimit - total);

  let validation = "";
  if (lisa > lisaLimit) {
    validation = "LISA limit exceeded";
  } else if (total > overallLimit) {
    validation = "Overall ISA limit exceeded";
  }

  // The runner ignores non-number fields, but we add it anyway
  return {
    outputs: {
      total: round2(total),
      remaining: round2(remaining),
      ...(validation ? { validation } : {})
    }
  };
};
