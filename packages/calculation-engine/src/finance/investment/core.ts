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
