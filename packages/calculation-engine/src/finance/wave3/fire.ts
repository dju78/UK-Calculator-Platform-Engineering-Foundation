export interface FireInputs {
  current_age: number;
  annual_net_income: number;
  current_annual_spending: number;
  current_invested_assets?: number;
  desired_retirement_spending: number;
  safe_withdrawal_rate?: number;
  investment_return_rate?: number;
}

export interface FireResult {
  fire_number: number;
  years_to_fire: number;
  projected_fire_age: number;
  current_savings_rate_pct: number;
  annual_savings_amount: number;
  lean_fire_number: number;
  fat_fire_number: number;
  progress_towards_fire_pct: number;
}

export function calculateFire(inputs: FireInputs): FireResult {
  const currentAge = Number(inputs.current_age);
  const netIncome = Math.max(1, Number(inputs.annual_net_income));
  const currentSpending = Math.max(0, Number(inputs.current_annual_spending));
  const startingAssets = Math.max(0, Number(inputs.current_invested_assets ?? 0));
  const targetSpending = Math.max(1, Number(inputs.desired_retirement_spending));
  const swrPct = Math.max(0.1, Number(inputs.safe_withdrawal_rate ?? 4.0));
  const realReturnPct = Number(inputs.investment_return_rate ?? 5.0);

  const annualSavings = Math.max(0, netIncome - currentSpending);
  const savingsRate = (annualSavings / netIncome) * 100;

  const fireTarget = targetSpending / (swrPct / 100);
  const leanFireTarget = (targetSpending * 0.75) / (swrPct / 100);
  const fatFireTarget = (targetSpending * 1.35) / (swrPct / 100);

  const progressPct = fireTarget > 0 ? (startingAssets / fireTarget) * 100 : 100;

  if (startingAssets >= fireTarget) {
    return {
      fire_number: Math.round(fireTarget * 100) / 100,
      years_to_fire: 0,
      projected_fire_age: currentAge,
      current_savings_rate_pct: Math.round(savingsRate * 100) / 100,
      annual_savings_amount: Math.round(annualSavings * 100) / 100,
      lean_fire_number: Math.round(leanFireTarget * 100) / 100,
      fat_fire_number: Math.round(fatFireTarget * 100) / 100,
      progress_towards_fire_pct: Math.round(progressPct * 100) / 100
    };
  }

  // Month-by-month compounding solver
  const monthlyRate = (realReturnPct / 100) / 12;
  const monthlySavings = annualSavings / 12;

  let balance = startingAssets;
  let months = 0;
  const maxMonths = 1200; // 100 years

  while (balance < fireTarget && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlySavings;
    months++;
  }

  const yearsToFire = Math.round((months / 12) * 100) / 100;
  const projectedFireAge = Math.round((currentAge + yearsToFire) * 100) / 100;

  return {
    fire_number: Math.round(fireTarget * 100) / 100,
    years_to_fire: yearsToFire,
    projected_fire_age: projectedFireAge,
    current_savings_rate_pct: Math.round(savingsRate * 100) / 100,
    annual_savings_amount: Math.round(annualSavings * 100) / 100,
    lean_fire_number: Math.round(leanFireTarget * 100) / 100,
    fat_fire_number: Math.round(fatFireTarget * 100) / 100,
    progress_towards_fire_pct: Math.round(progressPct * 100) / 100
  };
}
