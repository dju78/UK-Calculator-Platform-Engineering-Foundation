// Approximation for standard normal CDF (Abramowitz and Stegun)
export function normalCDF(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2.0);
  const t = 1.0 / (1.0 + 0.3275911 * z);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return 0.5 * (1.0 + sign * erf);
}

// Approximation for inverse standard normal CDF
// Beasley-Springer-Moro algorithm
export function inverseNormalCDF(p: number): number {
  if (p <= 0 || p >= 1) throw new Error("p must be strictly between 0 and 1");
  if (p < 0.5) return -inverseNormalCDF(1 - p);
  
  const t = Math.sqrt(-2.0 * Math.log(1.0 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  
  return t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1.0);
}

export function getZScoreForConfidence(confidence: number): number {
  const alpha = 1 - confidence;
  const p = 1 - alpha / 2;
  return inverseNormalCDF(p);
}
