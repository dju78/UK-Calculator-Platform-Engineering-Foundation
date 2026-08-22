import { calculateEffectiveApr, calculateCreditCardPayoff, calculateDebtPayoff, calculateBudget } from "./core.js";
import type { CalculationContext, NumericInputs, CalculatorHandler } from "../../types.js";

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

function round8(num: number): number {
  return Math.round(num * 100000000) / 100000000;
}

export const fin006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const periodic_rate = Number(inputs.periodic_rate);
  const periods = Number(inputs.periods);
  
  const effective_apr = calculateEffectiveApr(periodic_rate, periods);
  
  return {
    outputs: {
      effective_apr: round8(effective_apr) // benchmark expects 8 decimals
    }
  };
};

export const fin009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const balance = Number(inputs.balance);
  const apr = Number(inputs.apr);
  const monthly_payment = Number(inputs.monthly_payment);
  
  const result = calculateCreditCardPayoff(balance, apr, monthly_payment);
  
  return {
    outputs: {
      months: result.months,
      total_interest: round2(result.totalInterest)
    }
  };
};

export const fin011Handler: CalculatorHandler = (inputs: NumericInputs & { debts?: any[], extra?: number, strategy?: "avalanche" | "snowball" }) => {
  const debts = inputs.debts || [];
  const extra = Number(inputs.extra || 0);
  const strategy = inputs.strategy || "avalanche";
  
  const result = calculateDebtPayoff(debts, extra, strategy);
  
  return {
    outputs: {
      months: result.months,
      total_interest: round2(result.totalInterest)
    }
  };
};

export const fin013Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const income = Number(inputs.income);
  const fixed = Number(inputs.fixed);
  const variable = Number(inputs.variable);
  const savings = Number(inputs.savings);
  
  const result = calculateBudget(income, fixed, variable, savings);
  
  return {
    outputs: {
      surplus: round2(result.surplus),
      savings_rate: result.savingsRate !== null ? round8(result.savingsRate) : null
    }
  };
};
