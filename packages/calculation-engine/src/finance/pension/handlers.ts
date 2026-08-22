import { CalculatorHandler } from "../../types.js";
import { 
  calculatePensionGrowth,
  calculateSippGrowth,
  calculateWorkplacePension,
  calculateRetirement
} from "./core.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";

export const handlePensionGrowth: CalculatorHandler = (inputs, context) => {
  const current_pot = inputs.current_pot as number;
  const member_monthly = inputs.member_monthly as number;
  const employer_monthly = inputs.employer_monthly as number;
  const returnRate = inputs.return as number;
  const fee = inputs.fee as number;
  const years = inputs.years as number;
  
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
  const allowance = rules.pension?.annual_allowance_gbp ?? 60000;

  const result = calculatePensionGrowth(current_pot, member_monthly, employer_monthly, returnRate, fee, years, allowance);

  return {
    outputs: result
  };
};

export const handleSippGrowth: CalculatorHandler = (inputs, context) => {
  const pot = inputs.pot as number;
  const net_monthly = inputs.net_monthly as number;
  const marginal_rate = inputs.marginal_rate as number;
  const returnRate = inputs.return as number;
  const fee = inputs.fee as number;
  const years = inputs.years as number;
  
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
  const allowance = rules.pension?.annual_allowance_gbp ?? 60000;
  const relief_rate = rules.pension?.relief_at_source_basic_rate ?? 0.2;

  const result = calculateSippGrowth(pot, net_monthly, marginal_rate, returnRate, fee, years, allowance, relief_rate);

  return {
    outputs: result
  };
};

export const handleWorkplacePension: CalculatorHandler = (inputs, context) => {
  const annual_pay = inputs.annual_pay as number;
  const employer_rate = inputs.employer_rate as number;
  const employee_rate = inputs.employee_rate as number;
  const current_pot = inputs.current_pot as number;
  const returnRate = inputs.return as number;
  const years = inputs.years as number;
  
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
  const wpRules = rules.workplace_pension_auto_enrolment;
  const qualifying_lower = wpRules?.qualifying_earnings_lower_limit_annual_gbp ?? 6240;
  const qualifying_upper = wpRules?.qualifying_earnings_upper_limit_annual_gbp ?? 50270;

  const result = calculateWorkplacePension(
    annual_pay, employer_rate, employee_rate, current_pot, returnRate, years, qualifying_lower, qualifying_upper
  );

  return {
    outputs: result
  };
};

export const handleRetirement: CalculatorHandler = (inputs, context) => {
  const age = inputs.age as number;
  const retirement_age = inputs.retirement_age as number;
  const pot = inputs.pot as number;
  const monthly_contribution = inputs.monthly_contribution as number;
  const returnRate = inputs.return as number;
  const inflation = inputs.inflation as number;
  const target_today = inputs.target_today as number;
  const withdrawal_rate = inputs.withdrawal_rate as number;

  const result = calculateRetirement(
    age, retirement_age, pot, monthly_contribution, returnRate, inflation, target_today, withdrawal_rate
  );

  return {
    outputs: result
  };
};
