import { investmentGrowth } from "../investment/core.js";

export function calculatePensionGrowth(
  current_pot: number,
  member_monthly: number,
  employer_monthly: number,
  annual_return: number,
  fee: number,
  years: number,
  annual_allowance: number = 60000
) {
  const total_monthly = member_monthly + employer_monthly;
  const projected_pot = investmentGrowth(current_pot, total_monthly, annual_return, fee, years);
  const annual_contributions = total_monthly * 12;

  return {
    projected_pot,
    annual_contributions,
    standard_allowance_warning: annual_contributions > annual_allowance
  };
}

export function calculateSippGrowth(
  pot: number,
  net_monthly: number,
  marginal_rate: number,
  annual_return: number,
  fee: number,
  years: number,
  annual_allowance: number = 60000,
  relief_at_source_basic_rate: number = 0.2
) {
  const gross_monthly = net_monthly / (1 - relief_at_source_basic_rate);
  const provider_relief_monthly = gross_monthly * relief_at_source_basic_rate;
  
  let potential_extra_relief_monthly = 0;
  if (marginal_rate > relief_at_source_basic_rate) {
    potential_extra_relief_monthly = gross_monthly * (marginal_rate - relief_at_source_basic_rate);
  }

  const projected_value = investmentGrowth(pot, gross_monthly, annual_return, fee, years);
  const annual_contributions = gross_monthly * 12;

  return {
    gross_monthly,
    provider_relief_monthly,
    potential_extra_relief_monthly,
    projected_value,
    allowance_warning: annual_contributions > annual_allowance
  };
}

export function calculateWorkplacePension(
  annual_pay: number,
  employer_rate: number,
  employee_rate: number,
  current_pot: number,
  annual_return: number,
  years: number,
  qualifying_lower: number = 6240,
  qualifying_upper: number = 50270
) {
  let qualifying_earnings = 0;
  if (annual_pay > qualifying_lower) {
    qualifying_earnings = Math.min(annual_pay, qualifying_upper) - qualifying_lower;
  }
  
  const employer_annual = qualifying_earnings * employer_rate;
  const employee_annual = qualifying_earnings * employee_rate;
  const total_monthly = (employer_annual + employee_annual) / 12;

  const projected_pot = investmentGrowth(current_pot, total_monthly, annual_return, 0, years);

  return {
    qualifying_earnings,
    employer_annual,
    employee_annual,
    projected_pot
  };
}

export function calculateRetirement(
  age: number,
  retirement_age: number,
  pot: number,
  monthly_contribution: number,
  annual_return: number,
  inflation: number,
  target_today: number,
  withdrawal_rate: number
) {
  const years = retirement_age - age;
  
  // Real return is not exactly used for accumulation in standard TVM here.
  // Wait, let's see how they did accumulation for PEN-006.
  // In PEN-006 standard scenario:
  // pot 80000, contrib 500, return 0.05, inflation 0.025, years = 27
  // projected_pot = 634142.05
  
  // Let's verify projected_pot first using standard investment growth:
  const projected_pot = investmentGrowth(pot, monthly_contribution, annual_return, 0, years);
  
  // Future target income: target_today * (1+inflation)^years
  const future_target_income = target_today * Math.pow(1 + inflation, years);
  
  // required pot = future_target_income / withdrawal_rate
  const required_pot = future_target_income / withdrawal_rate;
  
  const gap = projected_pot - required_pot;
  const funding_ratio = projected_pot / required_pot;

  return {
    projected_pot,
    future_target_income,
    required_pot,
    gap,
    funding_ratio
  };
}
