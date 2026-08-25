export interface SippVsIsaInputs {
  monthly_contribution_net: number;
  years_to_invest: number;
  annual_growth_rate?: number;
  current_tax_band?: "basic" | "higher" | "additional";
  retirement_tax_band?: "nil" | "basic" | "higher";
  reinvest_tax_relief?: boolean;
}

export interface SippVsIsaResult {
  isa_final_value: number;
  sipp_gross_pot_value: number;
  sipp_tax_free_lump_sum: number;
  sipp_net_after_tax_value: number;
  net_retirement_difference: number;
  more_effective_wrapper: "sipp" | "isa" | "equal";
  effective_sipp_return_boost_pct: number;
}

function futureValueMonthly(monthlyAmount: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r);
}

export function compareSippVsIsa(inputs: SippVsIsaInputs): SippVsIsaResult {
  const netMonthly = Number(inputs.monthly_contribution_net);
  const years = Math.max(1, Number(inputs.years_to_invest));
  const growthRate = Number(inputs.annual_growth_rate ?? 6.0);
  const currentBand = inputs.current_tax_band ?? "higher";
  const retirementBand = inputs.retirement_tax_band ?? "basic";
  const reinvestRelief = inputs.reinvest_tax_relief !== false;

  let currentReliefRate = 0.20;
  if (currentBand === "higher") currentReliefRate = 0.40;
  else if (currentBand === "additional") currentReliefRate = 0.45;

  let retirementTaxRate = 0.20;
  if (retirementBand === "nil") retirementTaxRate = 0.0;
  else if (retirementBand === "higher") retirementTaxRate = 0.40;

  // ISA Pot: Net monthly invested directly with 100% tax free return
  const isaFinal = futureValueMonthly(netMonthly, growthRate, years);

  // SIPP Pot: Grossed up contribution
  let sippGrossMonthly = netMonthly / (1 - 0.20);
  if (reinvestRelief) {
    sippGrossMonthly = netMonthly / (1 - currentReliefRate);
  }

  const sippGrossPot = futureValueMonthly(sippGrossMonthly, growthRate, years);

  // At retirement: 25% tax-free lump sum, 75% taxed at retirement marginal rate
  const lumpSumAllowance = 268275;
  const standardLumpSum = sippGrossPot * 0.25;
  const taxFreeLumpSum = Math.min(standardLumpSum, lumpSumAllowance);
  const taxablePortion = sippGrossPot - taxFreeLumpSum;
  const netTaxableIncome = taxablePortion * (1 - retirementTaxRate);
  const sippNetFinal = taxFreeLumpSum + netTaxableIncome;

  const diff = Math.round(Math.abs(sippNetFinal - isaFinal) * 100) / 100;
  let winner: "sipp" | "isa" | "equal" = "equal";
  if (sippNetFinal > isaFinal + 1.0) winner = "sipp";
  else if (isaFinal > sippNetFinal + 1.0) winner = "isa";

  const boostPct = isaFinal > 0 ? ((sippNetFinal - isaFinal) / isaFinal) * 100 : 0;

  return {
    isa_final_value: Math.round(isaFinal * 100) / 100,
    sipp_gross_pot_value: Math.round(sippGrossPot * 100) / 100,
    sipp_tax_free_lump_sum: Math.round(taxFreeLumpSum * 100) / 100,
    sipp_net_after_tax_value: Math.round(sippNetFinal * 100) / 100,
    net_retirement_difference: diff,
    more_effective_wrapper: winner,
    effective_sipp_return_boost_pct: Math.round(boostPct * 100) / 100
  };
}
