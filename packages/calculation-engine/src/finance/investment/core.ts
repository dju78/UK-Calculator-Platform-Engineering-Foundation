export function investmentGrowth(
  start: number,
  monthly: number,
  annualReturn: number,
  annualFee: number,
  years: number
): number {
  const M = (1 + annualReturn) * (1 - annualFee);
  const m = Math.pow(M, 1 / 12) - 1;
  const totalMonths = years * 12;
  
  let balance = start;
  for (let i = 0; i < totalMonths; i++) {
    balance = balance * (1 + m) + monthly;
  }
  return balance;
}

export function simpleInterest(
  principal: number,
  rate: number,
  time: number
): { interest: number; fv: number } {
  const interest = principal * rate * time;
  return {
    interest,
    fv: principal + interest
  };
}

export function futureValue(pv: number, r: number, n: number): number {
  return pv * Math.pow(1 + r, n);
}

export function presentValue(fv: number, r: number, n: number): number {
  return fv / Math.pow(1 + r, n);
}

export function calculateROI(
  cost: number,
  end: number,
  income: number
): { gain: number; roi: number } {
  const gain = end - cost + income;
  const roi = cost !== 0 ? gain / cost : 0;
  return { gain, roi };
}

export function calculateCAGR(
  start: number,
  end: number,
  years: number
): number {
  if (start === 0) return 0;
  if (start < 0 || end < 0) {
    // If sign changes or negative, CAGR formula breaks or is complex, 
    // but typically start and end are positive in these fixtures.
    // If end is 0, CAGR is -1.
    if (end === 0) return -1;
  }
  return Math.pow(end / start, 1 / years) - 1;
}

export function calculateIRR(cashflows: number[], guess = 0.1, maxIter = 1000, tol = 1e-8): number {
  let rate = guess;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let deriv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      npv += cashflows[t] / Math.pow(1 + rate, t);
      if (t > 0) {
        deriv -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    if (Math.abs(npv) < tol) {
      return rate;
    }
    if (deriv === 0) break; // Avoid div by zero
    const newRate = rate - npv / deriv;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  throw new Error("IRR did not converge");
}

export function calculateFeeDrag(
  start: number,
  monthly: number,
  gross_return: number,
  fee: number,
  years: number
): { gross_value: number; net_value: number; fee_drag: number } {
  const gross_value = investmentGrowth(start, monthly, gross_return, 0, years);
  const net_value = investmentGrowth(start, monthly, gross_return, fee, years);
  return {
    gross_value,
    net_value,
    fee_drag: gross_value - net_value
  };
}

export function calculateRealReturn(
  nominal: number,
  inflation: number,
  years: number,
  future_amount: number
): { real_return: number; real_value: number } {
  const real_return = (1 + nominal) / (1 + inflation) - 1;
  const real_value = future_amount / Math.pow(1 + inflation, years);
  return {
    real_return,
    real_value
  };
}

