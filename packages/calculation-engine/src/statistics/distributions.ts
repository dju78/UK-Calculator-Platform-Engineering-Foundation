/**
 * Probability distributions.
 *
 * These were previously low-order rational approximations. The inverse normal
 * in particular used Abramowitz & Stegun 26.2.23, whose error of about 4.5e-4
 * in z is invisible against a penny tolerance but shifts a 99% confidence
 * interval in the fourth decimal place, and is squared inside sample-size and
 * power calculations. Everything here now converges to close to machine
 * precision, built on the special functions in `special.ts`.
 */
import { erf, incompleteBeta, gammaP, logGamma } from "./special.js";

/** Standard normal cumulative distribution function. */
export function normalCDF(x: number): number {
  if (!Number.isFinite(x)) throw new Error("The normal distribution needs a finite value.");
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Standard normal probability density function. */
export function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Inverse standard normal CDF.
 *
 * Acklam's rational approximation supplies a starting point good to about
 * 1.15e-9, then a single Halley refinement against the accurate CDF above
 * takes it to full double precision. The refinement is what makes this exact
 * enough to reproduce published critical values such as 1.959964 and 2.575829.
 */
export function inverseNormalCDF(p: number): number {
  if (!(p > 0 && p < 1)) throw new Error("A probability must be strictly between 0 and 1.");

  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
             1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
             6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
             -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
             3.754408661907416e+00];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let x: number;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  // One Halley step. `u` is the CDF error and `e` the density at x.
  for (let i = 0; i < 2; i++) {
    const u = normalCDF(x) - p;
    const e = normalPDF(x);
    if (e === 0) break;
    const t = u / e;
    x -= t / (1 + (x * t) / 2);
  }
  return x;
}

/** Two-sided critical z for a confidence level given as a proportion. */
export function getZScoreForConfidence(confidence: number): number {
  if (!(confidence > 0 && confidence < 1)) {
    throw new Error("A confidence level must be between 0 and 1, for example 0.95.");
  }
  return inverseNormalCDF(1 - (1 - confidence) / 2);
}

// ---------------------------------------------------------------------------
// Student's t
// ---------------------------------------------------------------------------

/** Student's t cumulative distribution function. */
export function tCDF(t: number, df: number): number {
  if (df <= 0) throw new Error("Degrees of freedom must be greater than zero.");
  const x = df / (df + t * t);
  const half = 0.5 * incompleteBeta(df / 2, 0.5, x);
  return t > 0 ? 1 - half : half;
}

/** Student's t probability density function. */
export function tPDF(t: number, df: number): number {
  const c = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) / Math.sqrt(df * Math.PI);
  return c * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
}

/**
 * Inverse Student's t, by bisection on the CDF.
 *
 * Bisection rather than Newton: the t density is flat far into the tails at
 * low degrees of freedom, where a Newton step overshoots badly. Bisection on a
 * bracket that is widened until it genuinely straddles the target always
 * converges.
 */
export function inverseTCDF(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new Error("A probability must be strictly between 0 and 1.");
  if (df <= 0) throw new Error("Degrees of freedom must be greater than zero.");

  let lo = -1, hi = 1;
  while (tCDF(lo, df) > p && lo > -1e12) lo *= 2;
  while (tCDF(hi, df) < p && hi < 1e12) hi *= 2;

  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (tCDF(mid, df) < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-12 * Math.max(1, Math.abs(mid))) break;
  }
  return (lo + hi) / 2;
}

/** Two-sided critical t for a confidence level given as a proportion. */
export function getTScoreForConfidence(confidence: number, df: number): number {
  if (!(confidence > 0 && confidence < 1)) {
    throw new Error("A confidence level must be between 0 and 1, for example 0.95.");
  }
  return inverseTCDF(1 - (1 - confidence) / 2, df);
}

// ---------------------------------------------------------------------------
// Chi-square
// ---------------------------------------------------------------------------

/** Chi-square cumulative distribution function. */
export function chiSquareCDF(x: number, df: number): number {
  if (df <= 0) throw new Error("Degrees of freedom must be greater than zero.");
  if (x <= 0) return 0;
  return gammaP(df / 2, x / 2);
}

/** Inverse chi-square, by bisection on the CDF. */
export function inverseChiSquareCDF(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new Error("A probability must be strictly between 0 and 1.");
  let lo = 0, hi = Math.max(df * 4, 4);
  while (chiSquareCDF(hi, df) < p && hi < 1e12) hi *= 2;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (chiSquareCDF(mid, df) < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-12 * Math.max(1, hi)) break;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// F distribution
// ---------------------------------------------------------------------------

/** F distribution cumulative distribution function. */
export function fCDF(f: number, df1: number, df2: number): number {
  if (df1 <= 0 || df2 <= 0) throw new Error("Degrees of freedom must be greater than zero.");
  if (f <= 0) return 0;
  return incompleteBeta(df1 / 2, df2 / 2, (df1 * f) / (df1 * f + df2));
}

/** Inverse F, by bisection on the CDF. */
export function inverseFCDF(p: number, df1: number, df2: number): number {
  if (!(p > 0 && p < 1)) throw new Error("A probability must be strictly between 0 and 1.");
  let lo = 0, hi = 4;
  while (fCDF(hi, df1, df2) < p && hi < 1e12) hi *= 2;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (fCDF(mid, df1, df2) < p) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-12 * Math.max(1, hi)) break;
  }
  return (lo + hi) / 2;
}
