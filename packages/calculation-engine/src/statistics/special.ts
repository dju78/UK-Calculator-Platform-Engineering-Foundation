/**
 * Special functions underpinning every statistical distribution in the engine.
 *
 * These replace the low-order rational approximations the engine previously
 * used. The Abramowitz & Stegun 26.2.23 inverse-normal formula is accurate
 * only to about 4.5e-4 in z, which is invisible against a penny tolerance but
 * moves a 99% confidence interval in the fourth decimal place, and matters a
 * great deal more once the same z is squared inside a sample-size or power
 * calculation. Everything here converges to close to machine precision
 * instead.
 *
 * All series and continued fractions below are standard, and each is
 * documented with the convergence condition that decides which branch is used,
 * because using the wrong branch is where these functions usually go wrong.
 */

const EPSILON = 1e-15;
const TINY = 1e-300;
const MAX_ITERATIONS = 500;

/** Lanczos approximation to log Gamma, valid for x > 0. */
export function logGamma(x: number): number {
  if (!Number.isFinite(x) || x <= 0) {
    throw new Error("The log gamma function is defined only for positive numbers.");
  }
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) {
    // Reflection formula, so the series is only ever used where it converges.
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const z = x - 1;
  let a = c[0];
  const t = z + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Series expansion for the regularised lower incomplete gamma P(a, x). */
function gammaPSeries(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < MAX_ITERATIONS; n++) {
    ap++;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPSILON) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/** Continued fraction for the regularised upper incomplete gamma Q(a, x). */
function gammaQContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / TINY;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPSILON) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/**
 * Regularised lower incomplete gamma P(a, x).
 *
 * The series converges quickly for x < a + 1 and the continued fraction for
 * x > a + 1; using either everywhere loses accuracy in the other region, so
 * the branch is chosen on that condition rather than arbitrarily.
 */
export function gammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) throw new Error("Invalid arguments to the incomplete gamma function.");
  if (x === 0) return 0;
  return x < a + 1 ? gammaPSeries(a, x) : 1 - gammaQContinuedFraction(a, x);
}

/** Regularised upper incomplete gamma Q(a, x) = 1 - P(a, x). */
export function gammaQ(a: number, x: number): number {
  return 1 - gammaP(a, x);
}

/** Modified Lentz continued fraction for the incomplete beta function. */
function betaContinuedFraction(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAX_ITERATIONS; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPSILON) break;
  }
  return h;
}

/**
 * Regularised incomplete beta I_x(a, b).
 *
 * The continued fraction converges rapidly only when x is below the
 * distribution's centre, so above it the symmetry relation is used instead.
 */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(a, b, x)) / a
    : 1 - (Math.exp(
        logGamma(a + b) - logGamma(a) - logGamma(b) + b * Math.log(1 - x) + a * Math.log(x)
      ) * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** Error function, built on the incomplete gamma so it inherits its accuracy. */
export function erf(x: number): number {
  if (x === 0) return 0;
  return x < 0 ? -gammaP(0.5, x * x) : gammaP(0.5, x * x);
}

/** Complementary error function. */
export function erfc(x: number): number {
  return 1 - erf(x);
}

/** Combinations, computed in log space so large arguments do not overflow. */
export function combinations(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k)) {
    throw new Error("Combinations are defined only for whole numbers.");
  }
  if (n < 0 || k < 0) throw new Error("Combinations are defined only for non-negative numbers.");
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  const value = Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1));
  // Small results are exact integers, so round away the floating-point dust.
  return value < 1e15 ? Math.round(value) : value;
}

/** Permutations, computed in log space. */
export function permutations(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k)) {
    throw new Error("Permutations are defined only for whole numbers.");
  }
  if (n < 0 || k < 0) throw new Error("Permutations are defined only for non-negative numbers.");
  if (k > n) return 0;
  const value = Math.exp(logGamma(n + 1) - logGamma(n - k + 1));
  return value < 1e15 ? Math.round(value) : value;
}

/** Factorial, exact where a double can represent it. */
export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("A factorial is defined only for whole numbers of 0 or more.");
  }
  if (n > 170) throw new Error("That factorial is too large to represent.");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
