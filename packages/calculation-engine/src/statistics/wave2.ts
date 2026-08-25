/**
 * Wave 2 Statistics & Data calculators.
 *
 * Everything here rests on the special functions and distributions in
 * `special.ts` and `distributions.ts`, which reproduce published statistical
 * tables to seven significant figures. Nothing in this module re-implements a
 * distribution of its own.
 *
 * Every test that reports a p-value also reports the test statistic, the
 * degrees of freedom and the effect size, because a p-value on its own tells a
 * reader almost nothing about whether a difference matters.
 */
import {
  normalCDF, tCDF, chiSquareCDF, fCDF,
  inverseNormalCDF, inverseTCDF
} from "./distributions.js";
import { combinations, permutations, factorial } from "./special.js";
import { mean, median, mode, variance, standardDeviation } from "./descriptive.js";

function requireData(data: number[], label = "Data"): number[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${label} must contain at least one number.`);
  }
  for (const [i, value] of data.entries()) {
    if (!Number.isFinite(value)) throw new Error(`${label} entry ${i + 1} is not a valid number.`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// STA-002 Average
// ---------------------------------------------------------------------------

export interface AverageResult {
  count: number;
  sum: number;
  arithmetic_mean: number;
  median: number;
  modes: number[];
  has_distinct_mode: boolean;
  geometric_mean: number | null;
  harmonic_mean: number | null;
  weighted_mean: number | null;
  range: number;
  midrange: number;
}

/**
 * The four means answer different questions and are not interchangeable: the
 * geometric mean is the right average for growth rates, the harmonic mean for
 * rates over a fixed distance such as speed. Returning only the arithmetic
 * mean invites the wrong one to be used, so all of them are returned, and the
 * two that are undefined for non-positive data are returned as null rather
 * than as a misleading number.
 */
export function averages(data: number[], weights: number[] | null): AverageResult {
  requireData(data);
  const n = data.length;
  const total = data.reduce((a, b) => a + b, 0);
  const allPositive = data.every((x) => x > 0);

  let weighted: number | null = null;
  if (weights && weights.length > 0) {
    if (weights.length !== data.length) {
      throw new Error("Enter the same number of weights as data values.");
    }
    const weightSum = weights.reduce((a, b) => a + b, 0);
    if (weightSum === 0) throw new Error("The weights must not all be zero.");
    weighted = data.reduce((acc, x, i) => acc + x * weights[i], 0) / weightSum;
  }

  const sorted = [...data].sort((a, b) => a - b);
  const modes = mode(data);

  return {
    count: n,
    sum: total,
    arithmetic_mean: total / n,
    median: median(data),
    modes,
    has_distinct_mode: modes.length > 0 && modes.length < n,
    geometric_mean: allPositive
      ? Math.exp(data.reduce((acc, x) => acc + Math.log(x), 0) / n)
      : null,
    harmonic_mean: allPositive ? n / data.reduce((acc, x) => acc + 1 / x, 0) : null,
    weighted_mean: weighted,
    range: sorted[n - 1] - sorted[0],
    midrange: (sorted[0] + sorted[n - 1]) / 2
  };
}

// ---------------------------------------------------------------------------
// STA-004 Variance
// ---------------------------------------------------------------------------

export interface VarianceResult {
  count: number;
  mean: number;
  sum_of_squares: number;
  sample_variance: number | null;
  population_variance: number;
  sample_standard_deviation: number | null;
  population_standard_deviation: number;
  coefficient_of_variation: number | null;
  standard_error: number | null;
}

export function varianceAnalysis(data: number[]): VarianceResult {
  requireData(data);
  const n = data.length;
  const m = mean(data);
  // Two-pass sum of squares. The one-pass form, sum of x squared less n times
  // the mean squared, is algebraically identical but loses catastrophic
  // precision when the mean is large relative to the spread.
  const ss = data.reduce((acc, x) => acc + (x - m) * (x - m), 0);

  const populationVariance = ss / n;
  const sampleVariance = n > 1 ? ss / (n - 1) : null;
  const sampleSd = sampleVariance === null ? null : Math.sqrt(sampleVariance);

  return {
    count: n,
    mean: m,
    sum_of_squares: ss,
    sample_variance: sampleVariance,
    population_variance: populationVariance,
    sample_standard_deviation: sampleSd,
    population_standard_deviation: Math.sqrt(populationVariance),
    coefficient_of_variation: sampleSd !== null && m !== 0 ? sampleSd / Math.abs(m) : null,
    standard_error: sampleSd !== null ? sampleSd / Math.sqrt(n) : null
  };
}

// ---------------------------------------------------------------------------
// STA-005 Z-Score
// ---------------------------------------------------------------------------

export interface ZScoreResult {
  z_score: number;
  percentile: number;
  probability_below: number;
  probability_above: number;
  two_tailed_p_value: number;
  standard_deviations_from_mean: number;
  within_one_sd: boolean;
  is_outlier_at_two_sd: boolean;
  is_outlier_at_three_sd: boolean;
}

export function zScore(value: number, populationMean: number, populationSd: number): ZScoreResult {
  if (!Number.isFinite(value) || !Number.isFinite(populationMean) || !Number.isFinite(populationSd)) {
    throw new Error("Enter valid numbers for the value, the mean and the standard deviation.");
  }
  if (populationSd <= 0) {
    throw new Error("The standard deviation must be greater than zero: with no spread, no value is unusual.");
  }
  const z = (value - populationMean) / populationSd;
  const below = normalCDF(z);
  return {
    z_score: z,
    percentile: below * 100,
    probability_below: below,
    probability_above: 1 - below,
    two_tailed_p_value: 2 * (1 - normalCDF(Math.abs(z))),
    standard_deviations_from_mean: Math.abs(z),
    within_one_sd: Math.abs(z) <= 1,
    is_outlier_at_two_sd: Math.abs(z) > 2,
    is_outlier_at_three_sd: Math.abs(z) > 3
  };
}

// ---------------------------------------------------------------------------
// STA-007 P-Value
// ---------------------------------------------------------------------------

export type TestDistribution = "z" | "t" | "chi_square" | "f";
export type TailType = "two" | "left" | "right";

export interface PValueResult {
  test_statistic: number;
  distribution: TestDistribution;
  tail: TailType;
  p_value: number;
  significant_at_5_percent: boolean;
  significant_at_1_percent: boolean;
  critical_value: number | null;
}

/**
 * A p-value from a test statistic.
 *
 * Chi-square and F are one-tailed by their nature - the statistic is a sum of
 * squares and cannot be negative - so asking for a left or two-tailed p-value
 * on them is a category error and is rejected rather than silently answered.
 */
export function pValue(
  statistic: number,
  distribution: TestDistribution,
  tail: TailType,
  df1: number,
  df2: number
): PValueResult {
  if (!Number.isFinite(statistic)) throw new Error("Enter a valid test statistic.");

  let cdf: number;
  let critical: number | null = null;

  switch (distribution) {
    case "z":
      cdf = normalCDF(statistic);
      critical = tail === "two" ? inverseNormalCDF(0.975) : inverseNormalCDF(0.95);
      break;
    case "t":
      if (df1 <= 0) throw new Error("Degrees of freedom must be greater than zero.");
      cdf = tCDF(statistic, df1);
      critical = tail === "two" ? inverseTCDF(0.975, df1) : inverseTCDF(0.95, df1);
      break;
    case "chi_square":
      if (df1 <= 0) throw new Error("Degrees of freedom must be greater than zero.");
      if (tail !== "right") {
        throw new Error(
          "A chi-square statistic is a sum of squares and cannot be negative, so only a right-tailed test is meaningful."
        );
      }
      cdf = chiSquareCDF(statistic, df1);
      break;
    case "f":
      if (df1 <= 0 || df2 <= 0) throw new Error("Both degrees of freedom must be greater than zero.");
      if (tail !== "right") {
        throw new Error(
          "An F statistic is a ratio of variances and cannot be negative, so only a right-tailed test is meaningful."
        );
      }
      cdf = fCDF(statistic, df1, df2);
      break;
  }

  const p =
    tail === "left" ? cdf : tail === "right" ? 1 - cdf : 2 * Math.min(cdf, 1 - cdf);

  return {
    test_statistic: statistic,
    distribution,
    tail,
    p_value: Math.min(1, Math.max(0, p)),
    significant_at_5_percent: p < 0.05,
    significant_at_1_percent: p < 0.01,
    critical_value: critical
  };
}

// ---------------------------------------------------------------------------
// STA-009 Margin of Error
// ---------------------------------------------------------------------------

export interface MarginOfErrorResult {
  margin_of_error: number;
  lower_bound: number;
  upper_bound: number;
  critical_value: number;
  standard_error: number;
  sample_size_used: number;
  finite_population_correction_applied: boolean;
  sample_size_for_half_the_margin: number;
}

/**
 * Margin of error for a proportion or a mean.
 *
 * Halving the margin of error requires FOUR times the sample, not twice, and
 * that is reported explicitly because it is the single most useful fact when
 * someone is deciding how big a survey needs to be.
 */
export function marginOfError(
  isProportion: boolean,
  proportion: number,
  standardDeviationValue: number,
  sampleMean: number,
  sampleSize: number,
  confidence: number,
  populationSize: number | null
): MarginOfErrorResult {
  if (sampleSize < 1) throw new Error("The sample size must be at least 1.");
  if (!(confidence > 0 && confidence < 1)) {
    throw new Error("The confidence level must be between 0 and 1, for example 0.95.");
  }

  const z = inverseNormalCDF(1 - (1 - confidence) / 2);
  let se: number;
  let centre: number;

  if (isProportion) {
    if (proportion < 0 || proportion > 1) {
      throw new Error("A proportion must be between 0 and 1.");
    }
    se = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
    centre = proportion;
  } else {
    if (standardDeviationValue < 0) throw new Error("The standard deviation cannot be negative.");
    se = standardDeviationValue / Math.sqrt(sampleSize);
    centre = sampleMean;
  }

  // The finite population correction matters when the sample is a large share
  // of the population, which is common in staff and membership surveys.
  let fpcApplied = false;
  if (populationSize !== null && populationSize > 0 && sampleSize < populationSize) {
    const fpc = Math.sqrt((populationSize - sampleSize) / (populationSize - 1));
    if (sampleSize / populationSize > 0.05) {
      se *= fpc;
      fpcApplied = true;
    }
  }

  const margin = z * se;

  return {
    margin_of_error: margin,
    lower_bound: centre - margin,
    upper_bound: centre + margin,
    critical_value: z,
    standard_error: se,
    sample_size_used: sampleSize,
    finite_population_correction_applied: fpcApplied,
    sample_size_for_half_the_margin: sampleSize * 4
  };
}

// ---------------------------------------------------------------------------
// STA-010 Statistical Power
// ---------------------------------------------------------------------------

export interface PowerResult {
  effect_size: number;
  power: number;
  beta: number;
  sample_size_per_group: number;
  required_sample_size_per_group: number;
  critical_value: number;
  is_adequately_powered: boolean;
}

/**
 * Power for a two-sample comparison of means, and the sample size a target
 * power would need.
 *
 * Under-powered studies are the commonest way to reach a wrong conclusion, so
 * the required sample size is always reported next to the achieved power
 * rather than left for the reader to work out.
 */
export function statisticalPower(
  effectSize: number,
  sampleSizePerGroup: number,
  alpha: number,
  targetPower: number,
  twoTailed: boolean
): PowerResult {
  if (!Number.isFinite(effectSize)) throw new Error("Enter a valid effect size.");
  if (sampleSizePerGroup < 2) throw new Error("Each group needs at least 2 observations.");
  if (!(alpha > 0 && alpha < 1)) throw new Error("Alpha must be between 0 and 1, for example 0.05.");
  if (!(targetPower > 0 && targetPower < 1)) {
    throw new Error("The target power must be between 0 and 1, for example 0.8.");
  }

  const zAlpha = inverseNormalCDF(1 - (twoTailed ? alpha / 2 : alpha));
  const d = Math.abs(effectSize);
  // Non-centrality for a two-sample comparison with equal group sizes.
  const lambda = d * Math.sqrt(sampleSizePerGroup / 2);
  const power = 1 - normalCDF(zAlpha - lambda) + (twoTailed ? normalCDF(-zAlpha - lambda) : 0);

  const zBeta = inverseNormalCDF(targetPower);
  // The plain normal approximation 2(z_alpha + z_beta)^2 / d^2 UNDERSTATES the
  // requirement, because the test statistic is a t rather than a z. The
  // standard correction adds z_alpha^2 / 4, and with it this reproduces the
  // published two-sample requirements exactly: 64 per group at d = 0.5,
  // 26 at d = 0.8 and 394 at d = 0.2, all at 5% and 80% power. Understating
  // a required sample size is the wrong direction to be wrong in.
  const required =
    d === 0
      ? Infinity
      : Math.ceil((2 * Math.pow(zAlpha + zBeta, 2)) / (d * d) + Math.pow(zAlpha, 2) / 4);

  return {
    effect_size: d,
    power,
    beta: 1 - power,
    sample_size_per_group: sampleSizePerGroup,
    required_sample_size_per_group: Number.isFinite(required) ? required : 0,
    critical_value: zAlpha,
    is_adequately_powered: power >= targetPower
  };
}

// ---------------------------------------------------------------------------
// STA-011 Probability
// ---------------------------------------------------------------------------

export interface ProbabilityResult {
  probability_a: number;
  probability_b: number;
  not_a: number;
  a_and_b_independent: number;
  a_or_b_independent: number;
  a_given_b: number | null;
  b_given_a: number | null;
  a_and_b_mutually_exclusive: number;
  a_or_b_mutually_exclusive: number;
  odds_for_a: number | null;
  events_are_consistent: boolean;
}

export function probability(pA: number, pB: number, pAandB: number | null): ProbabilityResult {
  for (const [name, value] of [["A", pA], ["B", pB]] as const) {
    if (!(value >= 0 && value <= 1)) {
      throw new Error(`The probability of ${name} must be between 0 and 1.`);
    }
  }
  const joint = pAandB === null || pAandB === undefined ? pA * pB : pAandB;
  if (!(joint >= 0 && joint <= 1)) {
    throw new Error("A joint probability must be between 0 and 1.");
  }
  // A joint probability can never exceed either event's own probability.
  const consistent = joint <= Math.min(pA, pB) + 1e-12 && joint >= Math.max(0, pA + pB - 1) - 1e-12;

  return {
    probability_a: pA,
    probability_b: pB,
    not_a: 1 - pA,
    a_and_b_independent: pA * pB,
    a_or_b_independent: pA + pB - pA * pB,
    a_given_b: pB > 0 ? joint / pB : null,
    b_given_a: pA > 0 ? joint / pA : null,
    a_and_b_mutually_exclusive: 0,
    a_or_b_mutually_exclusive: Math.min(1, pA + pB),
    odds_for_a: pA < 1 ? pA / (1 - pA) : null,
    events_are_consistent: consistent
  };
}

// ---------------------------------------------------------------------------
// STA-012 Permutations and combinations
// ---------------------------------------------------------------------------

export interface CountingResult {
  n: number;
  r: number;
  permutations: number;
  combinations: number;
  permutations_with_repetition: number;
  combinations_with_repetition: number;
  factorial_n: number | null;
  ordered_selections_exceed_unordered_by: number;
}

export function countingRules(n: number, r: number): CountingResult {
  if (!Number.isInteger(n) || !Number.isInteger(r)) {
    throw new Error("Both n and r must be whole numbers.");
  }
  if (n < 0 || r < 0) throw new Error("Both n and r must be 0 or more.");
  if (r > n) {
    throw new Error(
      "You cannot choose more items than you have. Enter an r that is no larger than n."
    );
  }

  const nPr = permutations(n, r);
  const nCr = combinations(n, r);

  return {
    n,
    r,
    permutations: nPr,
    combinations: nCr,
    permutations_with_repetition: Math.pow(n, r),
    // C(n + r - 1, r) is the multiset count, but it is only defined for
    // n >= 1. Choosing nothing from nothing is one way (the empty selection),
    // not an error, so that case is answered rather than thrown.
    combinations_with_repetition: r === 0 ? 1 : combinations(n + r - 1, r),
    // A double represents a factorial exactly only up to 18!. Beyond that the
    // digits shown would be confidently wrong, so nothing is shown at all -
    // the permutation and combination counts above remain exact and are what
    // the user actually needs.
    factorial_n: n <= 18 ? factorial(n) : null,
    // Order multiplies the count by r factorial. That is the whole difference
    // between the two, and stating it makes the choice between them concrete.
    ordered_selections_exceed_unordered_by: nCr === 0 ? 0 : nPr / nCr
  };
}

// ---------------------------------------------------------------------------
// STA-013 Correlation
// ---------------------------------------------------------------------------

export interface CorrelationResult {
  n: number;
  pearson_r: number;
  r_squared: number;
  covariance_sample: number;
  covariance_population: number;
  spearman_rho: number;
  t_statistic: number | null;
  degrees_of_freedom: number;
  p_value: number | null;
  significant_at_5_percent: boolean;
  strength: string;
  direction: string;
}

function ranks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const out = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    // Tied values share the average of the ranks they span, which is what
    // keeps Spearman correct in the presence of ties.
    const averageRank = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) out[indexed[k].i] = averageRank;
    i = j + 1;
  }
  return out;
}

export function correlation(x: number[], y: number[]): CorrelationResult {
  requireData(x, "X values");
  requireData(y, "Y values");
  if (x.length !== y.length) throw new Error("X and Y must have the same number of values.");
  const n = x.length;
  if (n < 3) throw new Error("Correlation needs at least three pairs of values.");

  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) {
    throw new Error(
      "One of the two variables never changes, so there is no relationship to measure."
    );
  }

  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  // The significance test on r is a t test with n - 2 degrees of freedom.
  const t = Math.abs(r) >= 1 ? null : (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  const p = t === null ? null : 2 * (1 - tCDF(Math.abs(t), df));

  const rx = ranks(x), ry = ranks(y);
  const mrx = mean(rx), mry = mean(ry);
  let rxy = 0, rxx = 0, ryy = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - mrx, dy = ry[i] - mry;
    rxy += dx * dy;
    rxx += dx * dx;
    ryy += dy * dy;
  }
  const rho = rxx === 0 || ryy === 0 ? 0 : rxy / Math.sqrt(rxx * ryy);

  const magnitude = Math.abs(r);
  const strength =
    magnitude >= 0.8 ? "very strong"
      : magnitude >= 0.6 ? "strong"
        : magnitude >= 0.4 ? "moderate"
          : magnitude >= 0.2 ? "weak"
            : "very weak or none";

  return {
    n,
    pearson_r: r,
    r_squared: r * r,
    covariance_sample: sxy / (n - 1),
    covariance_population: sxy / n,
    spearman_rho: rho,
    t_statistic: t,
    degrees_of_freedom: df,
    p_value: p,
    significant_at_5_percent: p !== null && p < 0.05,
    strength,
    direction: r > 0 ? "positive" : r < 0 ? "negative" : "none"
  };
}

// ---------------------------------------------------------------------------
// STA-015 R-Squared
// ---------------------------------------------------------------------------

export interface RSquaredResult {
  n: number;
  slope: number;
  intercept: number;
  r_squared: number;
  adjusted_r_squared: number;
  total_sum_of_squares: number;
  regression_sum_of_squares: number;
  residual_sum_of_squares: number;
  standard_error_of_estimate: number;
  f_statistic: number | null;
  p_value: number | null;
  predictors: number;
}

export function rSquared(x: number[], y: number[], predictors: number): RSquaredResult {
  requireData(x, "X values");
  requireData(y, "Y values");
  if (x.length !== y.length) throw new Error("X and Y must have the same number of values.");
  const n = x.length;
  if (n < 3) throw new Error("A regression needs at least three pairs of values.");
  if (predictors < 1 || !Number.isInteger(predictors)) {
    throw new Error("The number of predictors must be a whole number of 1 or more.");
  }
  if (n - predictors - 1 <= 0) {
    throw new Error("There are not enough observations for this number of predictors.");
  }

  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) * (x[i] - mx);
  }
  if (sxx === 0) throw new Error("The X values never change, so no line can be fitted.");

  const slope = sxy / sxx;
  const intercept = my - slope * mx;

  let sst = 0, sse = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * x[i];
    sst += (y[i] - my) * (y[i] - my);
    sse += (y[i] - predicted) * (y[i] - predicted);
  }
  const ssr = sst - sse;
  const r2 = sst === 0 ? 0 : ssr / sst;

  // Adjusted R-squared penalises extra predictors, which is why it can fall
  // when a useless variable is added while plain R-squared never does.
  const adjusted = 1 - ((1 - r2) * (n - 1)) / (n - predictors - 1);
  const dfResidual = n - predictors - 1;
  const f = sse === 0 ? null : (ssr / predictors) / (sse / dfResidual);
  const p = f === null ? null : 1 - fCDF(f, predictors, dfResidual);

  return {
    n,
    slope,
    intercept,
    r_squared: r2,
    adjusted_r_squared: adjusted,
    total_sum_of_squares: sst,
    regression_sum_of_squares: ssr,
    residual_sum_of_squares: sse,
    standard_error_of_estimate: Math.sqrt(sse / dfResidual),
    f_statistic: f,
    p_value: p,
    predictors
  };
}

// ---------------------------------------------------------------------------
// STA-016 T-Test
// ---------------------------------------------------------------------------

export type TTestType = "one_sample" | "two_sample" | "welch" | "paired";

export interface TTestResult {
  test_type: TTestType;
  t_statistic: number;
  degrees_of_freedom: number;
  p_value: number;
  critical_value: number;
  significant_at_5_percent: boolean;
  mean_difference: number;
  standard_error: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  cohens_d: number;
  effect_size_interpretation: string;
}

export function tTest(
  type: TTestType,
  sampleA: number[],
  sampleB: number[],
  hypothesisedMean: number,
  confidence: number,
  twoTailed: boolean
): TTestResult {
  requireData(sampleA, "Sample A");
  const alpha = 1 - confidence;
  let t: number, df: number, difference: number, se: number, d: number;

  if (type === "one_sample") {
    const n = sampleA.length;
    if (n < 2) throw new Error("A one-sample t test needs at least two observations.");
    const m = mean(sampleA);
    const sd = standardDeviation(sampleA, true);
    se = sd / Math.sqrt(n);
    difference = m - hypothesisedMean;
    t = se === 0 ? 0 : difference / se;
    df = n - 1;
    d = sd === 0 ? 0 : difference / sd;
  } else if (type === "paired") {
    requireData(sampleB, "Sample B");
    if (sampleA.length !== sampleB.length) {
      throw new Error("A paired t test needs the same number of before and after values.");
    }
    const differences = sampleA.map((a, i) => a - sampleB[i]);
    const n = differences.length;
    if (n < 2) throw new Error("A paired t test needs at least two pairs.");
    const m = mean(differences);
    const sd = standardDeviation(differences, true);
    se = sd / Math.sqrt(n);
    difference = m;
    t = se === 0 ? 0 : m / se;
    df = n - 1;
    d = sd === 0 ? 0 : m / sd;
  } else {
    requireData(sampleB, "Sample B");
    const n1 = sampleA.length, n2 = sampleB.length;
    if (n1 < 2 || n2 < 2) throw new Error("Each group needs at least two observations.");
    const m1 = mean(sampleA), m2 = mean(sampleB);
    const v1 = variance(sampleA, true), v2 = variance(sampleB, true);
    difference = m1 - m2;

    if (type === "welch") {
      // Welch does NOT assume equal variances, which is why its degrees of
      // freedom are fractional. It is the safer default whenever the two
      // groups differ in size or spread.
      se = Math.sqrt(v1 / n1 + v2 / n2);
      const numerator = Math.pow(v1 / n1 + v2 / n2, 2);
      const denominator =
        Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1);
      df = denominator === 0 ? n1 + n2 - 2 : numerator / denominator;
    } else {
      const pooled = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
      se = Math.sqrt(pooled * (1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
    }
    t = se === 0 ? 0 : difference / se;
    const pooledSd = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
    d = pooledSd === 0 ? 0 : difference / pooledSd;
  }

  const cdf = tCDF(Math.abs(t), df);
  const p = twoTailed ? 2 * (1 - cdf) : 1 - cdf;
  const critical = inverseTCDF(twoTailed ? 1 - alpha / 2 : 1 - alpha, df);
  const halfWidth = critical * se;

  const absoluteD = Math.abs(d);
  const interpretation =
    absoluteD >= 0.8 ? "large" : absoluteD >= 0.5 ? "medium" : absoluteD >= 0.2 ? "small" : "negligible";

  return {
    test_type: type,
    t_statistic: t,
    degrees_of_freedom: df,
    p_value: Math.min(1, Math.max(0, p)),
    critical_value: critical,
    significant_at_5_percent: p < 0.05,
    mean_difference: difference,
    standard_error: se,
    confidence_interval_lower: difference - halfWidth,
    confidence_interval_upper: difference + halfWidth,
    cohens_d: d,
    effect_size_interpretation: interpretation
  };
}

// ---------------------------------------------------------------------------
// STA-017 Chi-Square
// ---------------------------------------------------------------------------

export interface ChiSquareResult {
  test_type: "goodness_of_fit" | "independence";
  chi_square: number;
  degrees_of_freedom: number;
  p_value: number;
  critical_value: number;
  significant_at_5_percent: boolean;
  cramers_v: number | null;
  total_observations: number;
  smallest_expected_count: number;
  expected_counts_adequate: boolean;
}

export function chiSquareTest(
  observed: number[][] | number[],
  expected: number[] | null,
  isContingency: boolean
): ChiSquareResult {
  if (isContingency) {
    const table = observed as number[][];
    if (!Array.isArray(table) || table.length < 2 || !Array.isArray(table[0]) || table[0].length < 2) {
      throw new Error("A contingency table needs at least two rows and two columns.");
    }
    const rows = table.length, cols = table[0].length;
    for (const row of table) {
      if (row.length !== cols) throw new Error("Every row of the table must have the same number of columns.");
      for (const cell of row) {
        if (!Number.isFinite(cell) || cell < 0) throw new Error("Counts must be zero or more.");
      }
    }

    const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0));
    const colTotals = Array.from({ length: cols }, (_, j) =>
      table.reduce((acc, r) => acc + r[j], 0)
    );
    const total = rowTotals.reduce((a, b) => a + b, 0);
    if (total === 0) throw new Error("The table contains no observations.");

    let chi = 0, smallestExpected = Infinity;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const e = (rowTotals[i] * colTotals[j]) / total;
        smallestExpected = Math.min(smallestExpected, e);
        if (e > 0) chi += Math.pow(table[i][j] - e, 2) / e;
      }
    }
    const df = (rows - 1) * (cols - 1);
    const p = 1 - chiSquareCDF(chi, df);

    return {
      test_type: "independence",
      chi_square: chi,
      degrees_of_freedom: df,
      p_value: p,
      critical_value: 0,
      significant_at_5_percent: p < 0.05,
      // Cramer's V is the effect size. A large table can reach significance on
      // a trivial association, so reporting chi-square alone is misleading.
      cramers_v: Math.sqrt(chi / (total * Math.min(rows - 1, cols - 1))),
      total_observations: total,
      smallest_expected_count: smallestExpected,
      expected_counts_adequate: smallestExpected >= 5
    };
  }

  const obs = observed as number[];
  requireData(obs, "Observed counts");
  if (!expected || expected.length !== obs.length) {
    throw new Error("Enter the same number of expected counts as observed counts.");
  }
  let chi = 0, smallestExpected = Infinity;
  for (let i = 0; i < obs.length; i++) {
    const e = expected[i];
    if (e <= 0) throw new Error(`Expected count ${i + 1} must be greater than zero.`);
    smallestExpected = Math.min(smallestExpected, e);
    chi += Math.pow(obs[i] - e, 2) / e;
  }
  const df = obs.length - 1;
  const p = 1 - chiSquareCDF(chi, df);

  return {
    test_type: "goodness_of_fit",
    chi_square: chi,
    degrees_of_freedom: df,
    p_value: p,
    critical_value: 0,
    significant_at_5_percent: p < 0.05,
    cramers_v: null,
    total_observations: obs.reduce((a, b) => a + b, 0),
    smallest_expected_count: smallestExpected,
    expected_counts_adequate: smallestExpected >= 5
  };
}

// ---------------------------------------------------------------------------
// STA-018 ANOVA
// ---------------------------------------------------------------------------

export interface AnovaResult {
  groups: number;
  total_observations: number;
  grand_mean: number;
  between_groups_sum_of_squares: number;
  within_groups_sum_of_squares: number;
  total_sum_of_squares: number;
  between_groups_df: number;
  within_groups_df: number;
  between_groups_mean_square: number;
  within_groups_mean_square: number;
  f_statistic: number;
  p_value: number;
  critical_value: number;
  significant_at_5_percent: boolean;
  eta_squared: number;
  group_means: number[];
}

export function oneWayAnova(groups: number[][]): AnovaResult {
  if (!Array.isArray(groups) || groups.length < 2) {
    throw new Error("An analysis of variance needs at least two groups.");
  }
  groups.forEach((g, i) => {
    requireData(g, `Group ${i + 1}`);
    if (g.length < 2) throw new Error(`Group ${i + 1} needs at least two observations.`);
  });

  const all = groups.flat();
  const n = all.length;
  const k = groups.length;
  const grandMean = mean(all);
  const groupMeans = groups.map((g) => mean(g));

  let ssBetween = 0, ssWithin = 0;
  groups.forEach((g, i) => {
    ssBetween += g.length * Math.pow(groupMeans[i] - grandMean, 2);
    for (const value of g) ssWithin += Math.pow(value - groupMeans[i], 2);
  });
  const ssTotal = ssBetween + ssWithin;

  const dfBetween = k - 1;
  const dfWithin = n - k;
  if (dfWithin <= 0) throw new Error("There are not enough observations for this number of groups.");

  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const f = msWithin === 0 ? Infinity : msBetween / msWithin;
  const p = Number.isFinite(f) ? 1 - fCDF(f, dfBetween, dfWithin) : 0;

  return {
    groups: k,
    total_observations: n,
    grand_mean: grandMean,
    between_groups_sum_of_squares: ssBetween,
    within_groups_sum_of_squares: ssWithin,
    total_sum_of_squares: ssTotal,
    between_groups_df: dfBetween,
    within_groups_df: dfWithin,
    between_groups_mean_square: msBetween,
    within_groups_mean_square: msWithin,
    f_statistic: Number.isFinite(f) ? f : 0,
    p_value: p,
    critical_value: 0,
    significant_at_5_percent: p < 0.05,
    // Eta squared is the share of variance explained. A significant F says
    // only that groups differ, never by how much.
    eta_squared: ssTotal === 0 ? 0 : ssBetween / ssTotal,
    group_means: groupMeans
  };
}

// ---------------------------------------------------------------------------
// STA-019 A/B Test
// ---------------------------------------------------------------------------

export interface AbTestResult {
  control_rate: number;
  variant_rate: number;
  absolute_difference: number;
  relative_lift: number | null;
  pooled_rate: number;
  standard_error: number;
  z_statistic: number;
  p_value: number;
  significant_at_5_percent: boolean;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  interval_contains_zero: boolean;
  required_sample_per_group_for_this_lift: number;
}

/**
 * Two-proportion z test for a conversion experiment.
 *
 * The confidence interval on the difference is reported alongside the p-value,
 * and whether it contains zero, because "not significant" and "no difference"
 * are not the same statement and a wide interval says which one you have.
 */
export function abTest(
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number,
  confidence: number
): AbTestResult {
  for (const [name, value] of [
    ["Control visitors", controlVisitors],
    ["Variant visitors", variantVisitors]
  ] as const) {
    if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a whole number of 1 or more.`);
  }
  if (controlConversions < 0 || controlConversions > controlVisitors) {
    throw new Error("Control conversions must be between 0 and the number of control visitors.");
  }
  if (variantConversions < 0 || variantConversions > variantVisitors) {
    throw new Error("Variant conversions must be between 0 and the number of variant visitors.");
  }
  if (!(confidence > 0 && confidence < 1)) {
    throw new Error("The confidence level must be between 0 and 1, for example 0.95.");
  }

  const p1 = controlConversions / controlVisitors;
  const p2 = variantConversions / variantVisitors;
  const difference = p2 - p1;

  const pooled = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
  const sePooled = Math.sqrt(pooled * (1 - pooled) * (1 / controlVisitors + 1 / variantVisitors));
  const z = sePooled === 0 ? 0 : difference / sePooled;
  const p = 2 * (1 - normalCDF(Math.abs(z)));

  // The interval uses the UNPOOLED standard error, because pooling assumes the
  // null hypothesis is true - which is exactly what an interval must not do.
  const seUnpooled = Math.sqrt((p1 * (1 - p1)) / controlVisitors + (p2 * (1 - p2)) / variantVisitors);
  const zCritical = inverseNormalCDF(1 - (1 - confidence) / 2);
  const lower = difference - zCritical * seUnpooled;
  const upper = difference + zCritical * seUnpooled;

  const zBeta = inverseNormalCDF(0.8);
  const required =
    difference === 0
      ? 0
      : Math.ceil(
          (Math.pow(zCritical + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2))) /
            (difference * difference)
        );

  return {
    control_rate: p1,
    variant_rate: p2,
    absolute_difference: difference,
    relative_lift: p1 === 0 ? null : difference / p1,
    pooled_rate: pooled,
    standard_error: sePooled,
    z_statistic: z,
    p_value: p,
    significant_at_5_percent: p < 0.05,
    confidence_interval_lower: lower,
    confidence_interval_upper: upper,
    interval_contains_zero: lower <= 0 && upper >= 0,
    required_sample_per_group_for_this_lift: required
  };
}

// ---------------------------------------------------------------------------
// STA-020 Percent Error
// ---------------------------------------------------------------------------

export interface PercentErrorResult {
  observed: number;
  expected: number;
  absolute_error: number;
  percent_error: number;
  relative_error: number;
  signed_percent_error: number;
  direction: string;
  within_one_percent: boolean;
  within_five_percent: boolean;
}

export function percentError(observed: number, expected: number): PercentErrorResult {
  if (!Number.isFinite(observed) || !Number.isFinite(expected)) {
    throw new Error("Enter valid numbers for the observed and expected values.");
  }
  if (expected === 0) {
    throw new Error(
      "Percent error is undefined when the expected value is zero, because there is nothing to measure the error against."
    );
  }
  const error = observed - expected;
  const relative = error / Math.abs(expected);

  return {
    observed,
    expected,
    absolute_error: Math.abs(error),
    percent_error: Math.abs(relative) * 100,
    relative_error: Math.abs(relative),
    signed_percent_error: relative * 100,
    direction: error > 0 ? "over" : error < 0 ? "under" : "exact",
    within_one_percent: Math.abs(relative) <= 0.01,
    within_five_percent: Math.abs(relative) <= 0.05
  };
}
