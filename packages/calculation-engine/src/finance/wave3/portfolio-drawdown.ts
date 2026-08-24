export interface PortfolioDrawdownInputs {
  initial_balance: number;
  annual_withdrawal: number;
  annual_return?: number;
  inflation_rate?: number;
  adjust_for_inflation?: boolean;
  management_fee?: number;
  planning_years: number;
}

export interface PortfolioDrawdownResult {
  portfolio_survived: boolean;
  years_until_depleted: number | null;
  final_balance: number;
  total_withdrawn: number;
  total_growth_earned: number;
  total_fees_paid: number;
  average_monthly_income: number;
}

export function simulatePortfolioDrawdown(inputs: PortfolioDrawdownInputs): PortfolioDrawdownResult {
  let balance = Number(inputs.initial_balance);
  const baseAnnualWithdrawal = Number(inputs.annual_withdrawal);
  const annualReturn = Number(inputs.annual_return ?? 0);
  const inflationRate = Number(inputs.inflation_rate ?? 0);
  const rawAdjust = inputs.adjust_for_inflation;
  const adjustInflation = rawAdjust !== false && (rawAdjust as unknown) !== "false";
  const annualFee = Number(inputs.management_fee ?? 0);
  const years = Math.max(1, Number(inputs.planning_years));

  const totalMonths = years * 12;
  const monthlyGrossRate = (annualReturn / 100) / 12;
  const monthlyFeeRate = (annualFee / 100) / 12;

  let totalWithdrawn = 0;
  let totalGrowth = 0;
  let totalFees = 0;
  let survived = true;
  let depletionMonth: number | null = null;

  for (let m = 1; m <= totalMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const inflationFactor = adjustInflation ? Math.pow(1 + inflationRate / 100, yearIndex) : 1;
    const currentMonthlyWithdrawal = (baseAnnualWithdrawal * inflationFactor) / 12;

    if (balance <= currentMonthlyWithdrawal + 0.0001) {
      totalWithdrawn += balance;
      balance = 0;
      if (m < totalMonths) {
        survived = false;
        depletionMonth = m;
      }
      break;
    }

    balance -= currentMonthlyWithdrawal;
    totalWithdrawn += currentMonthlyWithdrawal;

    const monthlyGrowth = balance * monthlyGrossRate;
    const monthlyFee = balance * monthlyFeeRate;
    totalGrowth += monthlyGrowth;
    totalFees += monthlyFee;

    balance += (monthlyGrowth - monthlyFee);
  }

  const yearsDepleted = depletionMonth !== null ? Math.round((depletionMonth / 12) * 10) / 10 : null;
  const avgMonthlyIncome = totalWithdrawn / (depletionMonth ?? totalMonths);

  return {
    portfolio_survived: survived,
    years_until_depleted: yearsDepleted,
    final_balance: Math.round(balance * 100) / 100,
    total_withdrawn: Math.round(totalWithdrawn * 100) / 100,
    total_growth_earned: Math.round(totalGrowth * 100) / 100,
    total_fees_paid: Math.round(totalFees * 100) / 100,
    average_monthly_income: Math.round(avgMonthlyIncome * 100) / 100
  };
}
