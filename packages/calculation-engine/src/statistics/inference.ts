import { getZScoreForConfidence } from "./distributions.js";

export function standardError(sd: number, n: number): number {
  if (n <= 0) throw new Error("Sample size must be greater than 0");
  return sd / Math.sqrt(n);
}

export function confidenceInterval(mean: number, sd: number, n: number, confidence: number): {
  lower: number;
  upper: number;
  margin: number;
  standard_error: number;
} {
  const se = standardError(sd, n);
  const z = getZScoreForConfidence(confidence);
  const margin = z * se;
  return {
    lower: mean - margin,
    upper: mean + margin,
    margin,
    standard_error: se
  };
}

export function sampleSizeProportion(
  confidence: number,
  margin: number,
  p: number = 0.5,
  population?: number
): number {
  if (margin <= 0 || margin >= 1) throw new Error("Margin of error must be between 0 and 1");
  if (p <= 0 || p >= 1) throw new Error("Expected proportion must be strictly between 0 and 1");

  const z = getZScoreForConfidence(confidence);
  const n0 = (Math.pow(z, 2) * p * (1 - p)) / Math.pow(margin, 2);

  if (population && population > 0) {
    const n = n0 / (1 + (n0 - 1) / population);
    return Math.ceil(n);
  }
  return Math.ceil(n0);
}
