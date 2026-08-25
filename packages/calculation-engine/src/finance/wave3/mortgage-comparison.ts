function pmt(ratePerPeriod: number, periods: number, presentValue: number): number {
  if (ratePerPeriod === 0) return presentValue / periods;
  const pvif = Math.pow(1 + ratePerPeriod, periods);
  return (presentValue * ratePerPeriod * pvif) / (pvif - 1);
}

export interface MortgageComparisonInputs {
  loan_amount: number;
  term_years: number;
  fixed_rate: number;
  fixed_fee?: number;
  tracker_margin: number;
  current_base_rate: number;
  tracker_fee?: number;
  deal_years: number;
  expected_rate_change?: number;
  fee_financed?: boolean;
}

export interface MortgageComparisonResult {
  fixed_monthly_payment: number;
  tracker_initial_monthly_payment: number;
  fixed_deal_total_cost: number;
  tracker_deal_total_cost: number;
  deal_cost_difference: number;
  cheaper_option: "fixed" | "tracker" | "equal";
  breakeven_average_base_rate: number;
  fixed_balance_after_deal: number;
  tracker_balance_after_deal: number;
}

export function compareFixedVsTracker(inputs: MortgageComparisonInputs): MortgageComparisonResult {
  const loan = Number(inputs.loan_amount);
  const termMonths = Math.round(Number(inputs.term_years) * 12);
  const dealMonths = Math.min(termMonths, Math.round(Number(inputs.deal_years) * 12));
  const feeFinanced = Boolean(inputs.fee_financed);

  const fixedFee = Number(inputs.fixed_fee ?? 0);
  const trackerFee = Number(inputs.tracker_fee ?? 0);

  const fixedRateAnnual = Number(inputs.fixed_rate);
  const trackerMarginAnnual = Number(inputs.tracker_margin);
  const currentBaseRateAnnual = Number(inputs.current_base_rate);
  const annualRateChange = Number(inputs.expected_rate_change ?? 0);

  const fixedPrincipal = loan + (feeFinanced ? fixedFee : 0);
  const fixedMonthlyRate = fixedRateAnnual / 100 / 12;
  const fixedMonthlyPayment = pmt(fixedMonthlyRate, termMonths, fixedPrincipal);

  // Amortise fixed deal over deal period
  let fixedBal = fixedPrincipal;
  let fixedTotalPaid = 0;
  for (let m = 0; m < dealMonths; m++) {
    const interest = fixedBal * fixedMonthlyRate;
    const principalPaid = fixedMonthlyPayment - interest;
    fixedBal = Math.max(0, fixedBal - principalPaid);
    fixedTotalPaid += fixedMonthlyPayment;
  }
  const fixedDealTotalCost = fixedTotalPaid + (feeFinanced ? 0 : fixedFee);

  // Tracker simulation
  const trackerPrincipal = loan + (feeFinanced ? trackerFee : 0);
  const initialTrackerRate = Math.max(0, currentBaseRateAnnual + trackerMarginAnnual);
  const trackerInitialMonthlyPayment = pmt(initialTrackerRate / 100 / 12, termMonths, trackerPrincipal);

  let trackerBal = trackerPrincipal;
  let trackerTotalPaid = 0;
  for (let m = 0; m < dealMonths; m++) {
    const currentYearIndex = Math.floor(m / 12);
    const activeBaseRate = Math.max(0, currentBaseRateAnnual + currentYearIndex * annualRateChange);
    const activeTrackerRate = Math.max(0, activeBaseRate + trackerMarginAnnual);
    const activeMonthlyRate = activeTrackerRate / 100 / 12;
    const remainingMonths = termMonths - m;
    const currentPayment = pmt(activeMonthlyRate, remainingMonths, trackerBal);
    const interest = trackerBal * activeMonthlyRate;
    const principalPaid = currentPayment - interest;
    trackerBal = Math.max(0, trackerBal - principalPaid);
    trackerTotalPaid += currentPayment;
  }
  const trackerDealTotalCost = trackerTotalPaid + (feeFinanced ? 0 : trackerFee);

  const diff = Math.round(Math.abs(fixedDealTotalCost - trackerDealTotalCost) * 100) / 100;
  let cheaperOption: "fixed" | "tracker" | "equal" = "equal";
  if (fixedDealTotalCost < trackerDealTotalCost - 0.01) {
    cheaperOption = "fixed";
  } else if (trackerDealTotalCost < fixedDealTotalCost - 0.01) {
    cheaperOption = "tracker";
  }

  // Solve break-even base rate
  let breakevenBaseRate = currentBaseRateAnnual;
  let low = 0;
  let high = 25;
  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testMonthlyRate = (mid + trackerMarginAnnual) / 100 / 12;
    const testPayment = pmt(testMonthlyRate, termMonths, trackerPrincipal);
    const testTotalCost = testPayment * dealMonths + (feeFinanced ? 0 : trackerFee);
    if (testTotalCost < fixedDealTotalCost) {
      low = mid;
    } else {
      high = mid;
    }
  }
  breakevenBaseRate = Math.round(((low + high) / 2) * 100) / 100;

  return {
    fixed_monthly_payment: Math.round(fixedMonthlyPayment * 100) / 100,
    tracker_initial_monthly_payment: Math.round(trackerInitialMonthlyPayment * 100) / 100,
    fixed_deal_total_cost: Math.round(fixedDealTotalCost * 100) / 100,
    tracker_deal_total_cost: Math.round(trackerDealTotalCost * 100) / 100,
    deal_cost_difference: diff,
    cheaper_option: cheaperOption,
    breakeven_average_base_rate: breakevenBaseRate,
    fixed_balance_after_deal: Math.round(fixedBal * 100) / 100,
    tracker_balance_after_deal: Math.round(trackerBal * 100) / 100
  };
}
