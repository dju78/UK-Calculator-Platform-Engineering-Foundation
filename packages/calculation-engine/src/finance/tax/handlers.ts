import {
  calculateIncomeTax,
  calculateNationalInsurance,
  calculateStudentLoan,
  calculateVAT,
  calculateSDLT
} from "./core.js";
import { investmentGrowth } from "../investment/core.js";
import { getUKRuleset } from "../../../../rules-uk/src/index.js";
import type { NumericInputs, CalculationContext, CalculatorHandler } from "../../types.js";

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export const tax001Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const income = Number(inputs.income);
  const jurisdiction = String(inputs.jurisdiction);
  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1");

  const { tax, personalAllowance, taxableIncome } = calculateIncomeTax(income, jurisdiction, rules);

  return {
    outputs: {
      tax: round2(tax),
      personal_allowance: round2(personalAllowance),
      taxable_income: round2(taxableIncome)
    }
  };
};

export const tax002Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const salary = Number(inputs.salary);
  const jurisdiction = String(inputs.jurisdiction);
  const hoursWeek = Number(inputs.hours_week);
  const weeks = Number(inputs.weeks || 52);
  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1");

  const gross_monthly = salary / 12;
  const gross_weekly = salary / weeks;
  const gross_hourly = salary / (weeks * hoursWeek);

  const { tax } = calculateIncomeTax(salary, jurisdiction, rules);
  const ni = calculateNationalInsurance(salary, rules);

  const net_annual = salary - tax - ni;

  return {
    outputs: {
      gross_monthly: round2(gross_monthly),
      gross_weekly: round2(gross_weekly),
      gross_hourly: round2(gross_hourly),
      income_tax: round2(tax),
      ni: round2(ni),
      net_annual: round2(net_annual)
    }
  };
};

export const tax003Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const gross = Number(inputs.gross);
  const jurisdiction = String(inputs.jurisdiction);
  const salarySacrificePct = Number(inputs.salary_sacrifice_pct || 0);
  const studentPlan = String(inputs.student_plan || "None");
  const postgraduate = Boolean(inputs.postgraduate);

  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1");

  const taxableSalary = gross * (1 - salarySacrificePct);

  const { tax } = calculateIncomeTax(taxableSalary, jurisdiction, rules);
  const ni = calculateNationalInsurance(taxableSalary, rules);
  
  // Student loans are calculated on gross income, or taxable? Usually it's gross income or National Insurance liable income? 
  // Wait, if salary sacrifice is used, student loan is calculated on the reduced salary!
  const { studentLoan, pgLoan } = calculateStudentLoan(taxableSalary, studentPlan, postgraduate, rules);

  const totalDeductions = tax + ni + studentLoan + pgLoan;
  const net_annual = taxableSalary - totalDeductions;
  const net_monthly = net_annual / 12;

  return {
    outputs: {
      tax: round2(tax),
      ni: round2(ni),
      student_loan: round2(studentLoan),
      postgraduate_loan: round2(pgLoan),
      net_annual: round2(net_annual),
      net_monthly: round2(net_monthly)
    }
  };
};

export const tax004Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const earnings = Number(inputs.earnings);
  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1");
  const ni = calculateNationalInsurance(earnings, rules);

  return {
    outputs: {
      ni: round2(ni)
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
  const income = Number(inputs.income);
  const plan = String(inputs.plan);
  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1");

  // In this fixture, it calculates either student loan OR pg loan based on the single input.
  const isPg = plan === "Postgraduate";
  const { studentLoan, pgLoan } = calculateStudentLoan(income, isPg ? "None" : plan, isPg, rules);

  return {
    outputs: {
      annual_repayment: round2(isPg ? pgLoan : studentLoan)
    }
  };
};

export const pro023Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const price = Number(inputs.price);
  const firstTime = Boolean(inputs.first_time);
  const additional = Boolean(inputs.additional);
  const nonresident = Boolean(inputs.nonresident);
  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1");

  const sdlt = calculateSDLT(price, firstTime, additional, nonresident, rules);

  return {
    outputs: {
      sdlt: round2(sdlt)
    }
  };
};

export const isa001Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const start = Number(inputs.start);
  const annualSub = Number(inputs.annual_subscription);
  const ret = Number(inputs.return);
  const fee = Number(inputs.fee || 0);
  const years = Number(inputs.years);
  
  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1") as any;
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

  const rules = getUKRuleset(context.rulesetId || "uk-2026-27-v1") as any;
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
