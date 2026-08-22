export interface Band {
  to?: number;
  from?: number;
  rate: number;
}

export function calculateProgressiveTax(amount: number, bands: Band[]): number {
  let tax = 0;
  let previousEnd = 0;

  for (const band of bands) {
    const to = band.to !== undefined ? band.to : Infinity;
    const bandSize = to - previousEnd;
    const taxableInBand = Math.max(0, Math.min(amount - previousEnd, bandSize));
    
    if (taxableInBand > 0) {
      tax += taxableInBand * band.rate;
    }
    
    previousEnd = to;
    if (amount <= previousEnd) {
      break;
    }
  }

  return tax;
}
