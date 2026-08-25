export interface SafeWithdrawalInputs {
  portfolio_value: number;
  retirement_years: number;
  equity_allocation_pct?: number;
  expected_equity_return?: number;
  expected_bond_return?: number;
  custom_withdrawal_pct?: number;
  use_guardrails?: boolean;
}

export interface SafeWithdrawalResult {
  recommended_swr_pct: number;
  recommended_annual_income: number;
  recommended_monthly_income: number;
  tested_annual_income: number;
  tested_monthly_income: number;
  projected_longevity_years: number;
  portfolio_sustainability_status: string;
  capital_preservation_rate_pct: number;
}

export function calculateSafeWithdrawalRate(inputs: SafeWithdrawalInputs): SafeWithdrawalResult {
  const pot = Number(inputs.portfolio_value);
  const years = Math.max(1, Number(inputs.retirement_years));
  const equityPct = Math.min(100, Math.max(0, Number(inputs.equity_allocation_pct ?? 60)));
  const eqReturnReal = Number(inputs.expected_equity_return ?? 5.0) / 100;
  const bdReturnReal = Number(inputs.expected_bond_return ?? 1.5) / 100;
  const testPct = Number(inputs.custom_withdrawal_pct ?? 4.0);

  const weightedRealReturn = (equityPct / 100) * eqReturnReal + (1 - equityPct / 100) * bdReturnReal;

  // Finite annuity SWR formula: r / (1 - (1+r)^-N)
  let finiteAnnuityRate = 0;
  if (weightedRealReturn === 0) {
    finiteAnnuityRate = 1 / years;
  } else {
    finiteAnnuityRate = weightedRealReturn / (1 - Math.pow(1 + weightedRealReturn, -years));
  }

  const recommendedSwrPct = Math.round(finiteAnnuityRate * 10000) / 100;
  const recommendedAnnualIncome = Math.round(pot * (recommendedSwrPct / 100) * 100) / 100;
  const recommendedMonthlyIncome = Math.round((recommendedAnnualIncome / 12) * 100) / 100;

  const testedAnnualIncome = Math.round(pot * (testPct / 100) * 100) / 100;
  const testedMonthlyIncome = Math.round((testedAnnualIncome / 12) * 100) / 100;

  // Longevity simulation under test rate
  let bal = pot;
  let testYearsSurvived = 0;
  const annualTestWithdrawal = testedAnnualIncome;
  for (let y = 1; y <= 100; y++) {
    bal = bal * (1 + weightedRealReturn) - annualTestWithdrawal;
    if (bal <= 0) {
      testYearsSurvived = y;
      break;
    }
  }
  if (bal > 0) testYearsSurvived = 100;

  let status = "Sustainable";
  if (testPct > recommendedSwrPct + 1.5) {
    status = "High Risk of Early Depletion";
  } else if (testPct > recommendedSwrPct) {
    status = "Caution: Exceeds Recommended Horizon Rate";
  } else if (testPct <= weightedRealReturn * 100) {
    status = "Perpetual (Capital Preserving)";
  }

  return {
    recommended_swr_pct: recommendedSwrPct,
    recommended_annual_income: recommendedAnnualIncome,
    recommended_monthly_income: recommendedMonthlyIncome,
    tested_annual_income: testedAnnualIncome,
    tested_monthly_income: testedMonthlyIncome,
    projected_longevity_years: testYearsSurvived,
    portfolio_sustainability_status: status,
    capital_preservation_rate_pct: Math.round(weightedRealReturn * 10000) / 100
  };
}
