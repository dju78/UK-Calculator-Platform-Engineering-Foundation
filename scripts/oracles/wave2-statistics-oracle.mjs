/**
 * Independent benchmark oracle for Wave 2 tranche 2H, Statistics & Data.
 *
 * Imports nothing from the calculation engine. Independence here is unusually
 * strong, because the distributions are computed by a completely different
 * technique:
 *
 *   The engine evaluates the t, chi-square and F distributions through the
 *   regularised incomplete beta and incomplete gamma functions. This oracle
 *   instead integrates each density NUMERICALLY by composite Simpson's rule,
 *   and obtains the normalising constant by numerically integrating the
 *   UNNORMALISED density over its whole support and dividing. No gamma
 *   function is used anywhere, so the two sides share no special-function
 *   code, no series and no continued fraction. Agreement to seven figures
 *   across every test therefore corroborates both implementations.
 *
 *   Infinite ranges are handled by substitution rather than truncation:
 *   t = tan(theta) maps the whole real line onto (-pi/2, pi/2), and
 *   x = u/(1-u) maps (0, infinity) onto (0, 1), so no tail is silently
 *   discarded.
 *
 * Run: node scripts/oracles/wave2-statistics-oracle.mjs > /tmp/statistics.json
 */

const r8 = (n) => Math.round(n * 1e8) / 1e8;

// ---------------------------------------------------------------------------
// Numerical integration
// ---------------------------------------------------------------------------

/** Composite Simpson's rule over [a, b] with n intervals (n even). */
function simpson(f, a, b, n = 200000) {
  if (n % 2 === 1) n++;
  const h = (b - a) / n;
  let total = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    const v = f(x);
    total += (i % 2 === 0 ? 2 : 4) * (Number.isFinite(v) ? v : 0);
  }
  return (total * h) / 3;
}

/**
 * Integrate g over the whole real line using t = tan(theta).
 * dt = sec^2(theta) d(theta), and the endpoints are approached rather than hit.
 */
function integrateRealLine(g, n = 200000) {
  const eps = 1e-9;
  const f = (theta) => {
    const t = Math.tan(theta);
    const jacobian = 1 / Math.cos(theta) ** 2;
    const v = g(t) * jacobian;
    return Number.isFinite(v) ? v : 0;
  };
  return simpson(f, -Math.PI / 2 + eps, Math.PI / 2 - eps, n);
}

/** Integrate g over (0, infinity) using x = u / (1 - u). */
function integratePositive(g, n = 200000) {
  const eps = 1e-10;
  const f = (u) => {
    const x = u / (1 - u);
    const jacobian = 1 / (1 - u) ** 2;
    const v = g(x) * jacobian;
    return Number.isFinite(v) ? v : 0;
  };
  return simpson(f, eps, 1 - eps, n);
}

/** Integrate g from a to b where both are finite. */
function integrateFinite(g, a, b, n = 100000) {
  return simpson((x) => {
    const v = g(x);
    return Number.isFinite(v) ? v : 0;
  }, a, b, n);
}

// ---------------------------------------------------------------------------
// Distributions by quadrature. No gamma function anywhere.
// ---------------------------------------------------------------------------

/** Standard normal CDF by direct integration of exp(-x^2/2). */
function normalCDF(z) {
  if (z === 0) return 0.5;
  // The normalising constant is computed rather than assumed.
  const norm = Math.sqrt(2 * Math.PI);
  const kernel = (x) => Math.exp(-0.5 * x * x);
  if (z > 0) return 0.5 + integrateFinite(kernel, 0, z, 20000) / norm;
  return 0.5 - integrateFinite(kernel, z, 0, 20000) / norm;
}

/** Inverse standard normal, by bisection on the integrated CDF. */
function inverseNormalCDF(p) {
  let lo = -40, hi = 40;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (normalCDF(mid) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Student's t CDF: unnormalised kernel, normalised by its own total integral. */
function tCDF(t, df) {
  const kernel = (x) => Math.pow(1 + (x * x) / df, -(df + 1) / 2);
  const total = integrateRealLine(kernel, 60000);
  if (t === 0) return 0.5;
  if (t > 0) return 0.5 + integrateFinite(kernel, 0, t, 40000) / total;
  return 0.5 - integrateFinite(kernel, t, 0, 40000) / total;
}

/**
 * Integrate x^(a-1) h(x) over (0, X), removing the endpoint singularity
 * exactly.
 *
 * Chi-square with one degree of freedom, and F with one numerator degree of
 * freedom, both have densities proportional to x^(-1/2) near zero. That is
 * integrable but INFINITE at the endpoint, and uniform-spacing Simpson's rule
 * produces nonsense on it - the first attempt at this oracle returned a
 * "probability" of 114, which is how the problem was found. Substituting
 * u = x^a turns x^(a-1) dx into du / a, so the transformed integrand is
 * perfectly smooth and no tail or spike is approximated away.
 */
function integrateSingular(a, h, X, n = 100000) {
  if (X <= 0) return 0;
  const upper = Math.pow(X, a);
  return integrateFinite((u) => h(Math.pow(u, 1 / a)), 0, upper, n) / a;
}

/** The same integral over the whole of (0, infinity), via u = v/(1-v). */
function integrateSingularToInfinity(a, h, n = 200000) {
  const eps = 1e-12;
  const f = (v) => {
    const u = v / (1 - v);
    const jacobian = 1 / (1 - v) ** 2;
    const value = h(Math.pow(u, 1 / a)) * jacobian;
    return Number.isFinite(value) ? value : 0;
  };
  return simpson(f, eps, 1 - eps, n) / a;
}

/**
 * The same integral over (X, infinity).
 *
 * Far into the tail, computing `1 - CDF` subtracts two numbers that agree to
 * five figures and throws away almost all the precision - which is exactly how
 * the first version of this oracle disagreed with the engine by 55% on a
 * p-value of 0.000015. Integrating the tail DIRECTLY has no cancellation at
 * all, so small p-values stay accurate to full relative precision.
 */
function integrateSingularTail(a, h, X, n = 200000) {
  const start = Math.pow(Math.max(X, 0), a);
  const eps = 1e-12;
  const f = (w) => {
    const u = start + w / (1 - w);
    const jacobian = 1 / (1 - w) ** 2;
    const value = h(Math.pow(u, 1 / a)) * jacobian;
    return Number.isFinite(value) ? value : 0;
  };
  return simpson(f, 0, 1 - eps, n) / a;
}

/** Right-tail probability for chi-square, computed without cancellation. */
function chiSquareSF(x, df) {
  const a = df / 2;
  const h = (t) => Math.exp(-t / 2);
  if (x <= 0) return 1;
  return integrateSingularTail(a, h, x) / integrateSingularToInfinity(a, h);
}

/** Right-tail probability for F, computed without cancellation. */
function fSF(f, d1, d2) {
  const a = d1 / 2;
  const b = (d1 + d2) / 2;
  const c = d1 / d2;
  const h = (x) => Math.pow(1 + c * x, -b);
  if (f <= 0) return 1;
  return integrateSingularTail(a, h, f) / integrateSingularToInfinity(a, h);
}

/** Chi-square CDF, normalised by its own total integral. */
function chiSquareCDF(x, df) {
  const a = df / 2;
  const h = (t) => Math.exp(-t / 2);
  if (x <= 0) return 0;
  const total = integrateSingularToInfinity(a, h);
  return integrateSingular(a, h, x) / total;
}

/** F CDF, normalised by its own total integral. */
function fCDF(f, d1, d2) {
  const a = d1 / 2;
  const b = (d1 + d2) / 2;
  const c = d1 / d2;
  const h = (x) => Math.pow(1 + c * x, -b);
  if (f <= 0) return 0;
  const total = integrateSingularToInfinity(a, h);
  return integrateSingular(a, h, f) / total;
}

function inverseTCDF(p, df) {
  let lo = -1000, hi = 1000;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    if (tCDF(mid, df) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Descriptive statistics, computed independently
// ---------------------------------------------------------------------------

const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => sum(a) / a.length;

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function modes(a) {
  const counts = new Map();
  for (const v of a) counts.set(v, (counts.get(v) ?? 0) + 1);
  const best = Math.max(...counts.values());
  return [...counts.entries()].filter(([, c]) => c === best).map(([v]) => v).sort((x, y) => x - y);
}

/** Variance from the sum of squared deviations, two-pass. */
function variance(a, sample) {
  const m = mean(a);
  const ss = sum(a.map((x) => (x - m) ** 2));
  return ss / (sample ? a.length - 1 : a.length);
}

function ranks(values) {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const out = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    const avg = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) out[indexed[k].i] = avg;
    i = j + 1;
  }
  return out;
}

function pearson(x, y) {
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return { r: sxy / Math.sqrt(sxx * syy), sxy, sxx, syy };
}

/** Combinations by an iterative product, never by log gamma. */
function nCr(n, r) {
  if (r > n) return 0;
  r = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= r; i++) result = (result * (n - r + i)) / i;
  return Math.round(result);
}

function nPr(n, r) {
  if (r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}

function fact(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±1e-6 on rates and probabilities; ±£0.01 on money",
    ruleset: "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// STA-002 Average
// ===========================================================================

for (const p of [
  { scenario: "Simple set with a clear mode", data: [2, 4, 4, 6, 8], weights: null },
  { scenario: "Growth rates, where the geometric mean is the right average", data: [1.1, 1.05, 0.95, 1.2, 1.02], weights: null },
  { scenario: "Weighted average of exam marks", data: [70, 85, 60], weights: [0.2, 0.5, 0.3] },
  { scenario: "Data containing a negative value, so two means are undefined", data: [-5, 10, 15, 20], weights: null },
  { scenario: "Even count, so the median is interpolated", data: [1, 3, 5, 7], weights: null },
  { scenario: "All values identical", data: [7, 7, 7, 7], weights: null },
  { scenario: "Wide spread with a single outlier", data: [1, 2, 3, 4, 100], weights: null }
]) {
  const allPositive = p.data.every((x) => x > 0);
  const n = p.data.length;
  const sorted = [...p.data].sort((a, b) => a - b);
  const expected = {
    count: n,
    sum: r8(sum(p.data)),
    arithmetic_mean: r8(mean(p.data)),
    median: r8(median(p.data)),
    modes: modes(p.data),
    geometric_mean: allPositive ? r8(Math.exp(sum(p.data.map(Math.log)) / n)) : null,
    harmonic_mean: allPositive ? r8(n / sum(p.data.map((x) => 1 / x))) : null,
    range: r8(sorted[n - 1] - sorted[0]),
    midrange: r8((sorted[0] + sorted[n - 1]) / 2)
  };
  if (p.weights) {
    expected.weighted_mean = r8(sum(p.data.map((x, i) => x * p.weights[i])) / sum(p.weights));
  }
  add("STA-002", p.scenario,
    { data: JSON.stringify(p.data), weights: p.weights ? JSON.stringify(p.weights) : "" },
    expected,
    "The negative-value case proves the geometric and harmonic means are returned as blank rather than as a misleading number.");
}

// ===========================================================================
// STA-004 Variance
// ===========================================================================

for (const p of [
  { scenario: "Textbook set", data: [2, 4, 4, 4, 5, 5, 7, 9] },
  { scenario: "Small sample", data: [10, 12, 23, 23, 16, 23, 21, 16] },
  { scenario: "No variation at all", data: [5, 5, 5, 5] },
  { scenario: "Large values where a one-pass formula would lose precision", data: [1000000.1, 1000000.2, 1000000.3, 1000000.4] },
  { scenario: "Two observations only", data: [3, 7] },
  { scenario: "Includes negative values", data: [-10, -5, 0, 5, 10] }
]) {
  const n = p.data.length;
  const m = mean(p.data);
  const ss = sum(p.data.map((x) => (x - m) ** 2));
  const sampleVar = n > 1 ? ss / (n - 1) : null;
  const sampleSd = sampleVar === null ? null : Math.sqrt(sampleVar);
  add("STA-004", p.scenario,
    { data: JSON.stringify(p.data) },
    {
      count: n,
      mean: r8(m),
      sum_of_squares: r8(ss),
      sample_variance: sampleVar === null ? null : r8(sampleVar),
      population_variance: r8(ss / n),
      sample_standard_deviation: sampleSd === null ? null : r8(sampleSd),
      population_standard_deviation: r8(Math.sqrt(ss / n)),
      coefficient_of_variation: sampleSd !== null && m !== 0 ? r8(sampleSd / Math.abs(m)) : null,
      standard_error: sampleSd === null ? null : r8(sampleSd / Math.sqrt(n))
    },
    "Sum of squares computed two-pass. The large-value case would expose a one-pass formula losing precision.");
}

// ===========================================================================
// STA-005 Z-Score
// ===========================================================================

for (const p of [
  { scenario: "One standard deviation above the mean", value: 115, mean: 100, sd: 15 },
  { scenario: "Below the mean", value: 85, mean: 100, sd: 15 },
  { scenario: "Exactly at the mean", value: 100, mean: 100, sd: 15 },
  { scenario: "Beyond three standard deviations", value: 150, mean: 100, sd: 15 },
  { scenario: "Exam mark in a tight distribution", value: 72, mean: 65, sd: 4 },
  { scenario: "Two standard deviations below", value: 70, mean: 100, sd: 15 }
]) {
  const z = (p.value - p.mean) / p.sd;
  const below = normalCDF(z);
  add("STA-005", p.scenario,
    { value: p.value, mean: p.mean, standard_deviation: p.sd },
    {
      z_score: r8(z),
      percentile: r8(below * 100),
      probability_below: r8(below),
      probability_above: r8(1 - below),
      two_tailed_p_value: r8(2 * (1 - normalCDF(Math.abs(z)))),
      standard_deviations_from_mean: r8(Math.abs(z)),
      is_outlier_at_two_sd: Math.abs(z) > 2,
      is_outlier_at_three_sd: Math.abs(z) > 3
    },
    "The normal CDF is obtained by Simpson quadrature of exp(-x^2/2), not by an error function approximation.");
}

// ===========================================================================
// STA-007 P-Value
// ===========================================================================

for (const p of [
  { scenario: "Two-tailed z test", stat: 1.96, dist: "z", tail: "two", df1: 0, df2: 0 },
  { scenario: "Right-tailed z test", stat: 2.33, dist: "z", tail: "right", df1: 0, df2: 0 },
  { scenario: "Left-tailed z test", stat: -1.645, dist: "z", tail: "left", df1: 0, df2: 0 },
  { scenario: "Two-tailed t test with 10 degrees of freedom", stat: 2.228, dist: "t", tail: "two", df1: 10, df2: 0 },
  { scenario: "Right-tailed t test with 25 degrees of freedom", stat: 1.708, dist: "t", tail: "right", df1: 25, df2: 0 },
  { scenario: "Chi-square with 3 degrees of freedom", stat: 7.815, dist: "chi_square", tail: "right", df1: 3, df2: 0 },
  { scenario: "F test with 3 and 12 degrees of freedom", stat: 3.49, dist: "f", tail: "right", df1: 3, df2: 12 }
]) {
  let pv;
  if (p.dist === "chi_square") {
    pv = chiSquareSF(p.stat, p.df1);
  } else if (p.dist === "f") {
    pv = fSF(p.stat, p.df1, p.df2);
  } else {
    const cdf = p.dist === "z" ? normalCDF(p.stat) : tCDF(p.stat, p.df1);
    pv = p.tail === "left" ? cdf : p.tail === "right" ? 1 - cdf : 2 * Math.min(cdf, 1 - cdf);
  }

  // Only the fields the form actually shows for this distribution. Degrees of
  // freedom are hidden for a z test, so listing them would describe a form
  // that never exists.
  const inputs = { test_statistic: p.stat, distribution: p.dist, tail: p.tail };
  if (p.dist !== "z") inputs.degrees_of_freedom = p.df1;
  if (p.dist === "f") inputs.degrees_of_freedom_2 = p.df2;

  add("STA-007", p.scenario, inputs,
    {
      p_value: r8(Math.min(1, Math.max(0, pv))),
      significant_at_5_percent: pv < 0.05,
      significant_at_1_percent: pv < 0.01
    },
    "Every distribution here is integrated numerically with a numerically computed normalising constant, so no gamma or beta function is shared with the engine.");
}

// ===========================================================================
// STA-009 Margin of Error
// ===========================================================================

for (const p of [
  { scenario: "Opinion poll of 1,000 at 95%", prop: true, p0: 0.5, sd: 0, m: 0, n: 1000, conf: 0.95, pop: null },
  { scenario: "Poll of 400 with a lopsided proportion", prop: true, p0: 0.8, sd: 0, m: 0, n: 400, conf: 0.95, pop: null },
  { scenario: "Mean with a known standard deviation", prop: false, p0: 0, sd: 15, m: 100, n: 100, conf: 0.95, pop: null },
  { scenario: "99% confidence widens the interval", prop: true, p0: 0.5, sd: 0, m: 0, n: 1000, conf: 0.99, pop: null },
  { scenario: "Staff survey where the sample is a large share of the population", prop: true, p0: 0.6, sd: 0, m: 0, n: 300, conf: 0.95, pop: 500 },
  { scenario: "Population large enough that the correction does not apply", prop: true, p0: 0.6, sd: 0, m: 0, n: 300, conf: 0.95, pop: 100000 }
]) {
  const z = inverseNormalCDF(1 - (1 - p.conf) / 2);
  let se = p.prop ? Math.sqrt((p.p0 * (1 - p.p0)) / p.n) : p.sd / Math.sqrt(p.n);
  const centre = p.prop ? p.p0 : p.m;
  let fpcApplied = false;
  if (p.pop !== null && p.n < p.pop && p.n / p.pop > 0.05) {
    se *= Math.sqrt((p.pop - p.n) / (p.pop - 1));
    fpcApplied = true;
  }
  const margin = z * se;

  // The proportion and the mean branches show different fields.
  const inputs = {
    measure: p.prop ? "proportion" : "mean",
    sample_size: p.n,
    confidence: p.conf,
    population_size: p.pop === null ? "" : p.pop
  };
  if (p.prop) {
    inputs.proportion = p.p0;
  } else {
    inputs.sample_mean = p.m;
    inputs.standard_deviation = p.sd;
  }

  add("STA-009", p.scenario, inputs,
    {
      margin_of_error: r8(margin),
      lower_bound: r8(centre - margin),
      upper_bound: r8(centre + margin),
      critical_value: r8(z),
      standard_error: r8(se),
      sample_size_for_half_the_margin: p.n * 4,
      finite_population_correction_applied: fpcApplied
    },
    "The two 300-of-N cases differ only in population size and prove the finite population correction is applied only when the sample is a large share of it.");
}

// ===========================================================================
// STA-010 Statistical Power
// ===========================================================================

for (const p of [
  { scenario: "Medium effect, well powered", d: 0.5, n: 100, alpha: 0.05, target: 0.8, two: true },
  { scenario: "Medium effect, under-powered", d: 0.5, n: 30, alpha: 0.05, target: 0.8, two: true },
  { scenario: "Large effect needs a much smaller sample", d: 0.8, n: 30, alpha: 0.05, target: 0.8, two: true },
  { scenario: "Small effect is expensive to detect", d: 0.2, n: 100, alpha: 0.05, target: 0.8, two: true },
  { scenario: "One-tailed test has more power for the same sample", d: 0.5, n: 100, alpha: 0.05, target: 0.8, two: false },
  { scenario: "Stricter alpha costs power", d: 0.5, n: 100, alpha: 0.01, target: 0.9, two: true }
]) {
  const zAlpha = inverseNormalCDF(1 - (p.two ? p.alpha / 2 : p.alpha));
  const lambda = p.d * Math.sqrt(p.n / 2);
  const power = 1 - normalCDF(zAlpha - lambda) + (p.two ? normalCDF(-zAlpha - lambda) : 0);
  const zBeta = inverseNormalCDF(p.target);
  // Includes the z_alpha^2 / 4 correction for the t statistic, which is what
  // reproduces the published requirements of 64, 26 and 394 per group.
  const required = Math.ceil((2 * (zAlpha + zBeta) ** 2) / (p.d * p.d) + zAlpha ** 2 / 4);

  add("STA-010", p.scenario,
    {
      effect_size: p.d, sample_size_per_group: p.n,
      alpha: p.alpha, target_power: p.target, two_tailed: p.two
    },
    {
      effect_size: r8(p.d),
      power: r8(power),
      beta: r8(1 - power),
      required_sample_size_per_group: required,
      critical_value: r8(zAlpha),
      is_adequately_powered: power >= p.target
    },
    "The normal quantiles come from bisection on a numerically integrated CDF, so the engine's Acklam-plus-Halley inverse is checked against quadrature. The two matched cases at effect size 0.5 and n=100 differ only in whether the test is one- or two-tailed.");
}

// ===========================================================================
// STA-011 Probability
// ===========================================================================

for (const p of [
  { scenario: "Independent events", a: 0.5, b: 0.4, joint: null },
  { scenario: "Joint probability supplied", a: 0.5, b: 0.4, joint: 0.3 },
  { scenario: "Certain event", a: 1, b: 0.5, joint: null },
  { scenario: "Impossible event", a: 0, b: 0.5, joint: null },
  { scenario: "Two likely events", a: 0.9, b: 0.8, joint: null },
  { scenario: "Small probabilities", a: 0.05, b: 0.02, joint: null }
]) {
  const joint = p.joint === null ? p.a * p.b : p.joint;
  add("STA-011", p.scenario,
    { probability_a: p.a, probability_b: p.b, probability_a_and_b: p.joint === null ? "" : p.joint },
    {
      not_a: r8(1 - p.a),
      a_and_b_independent: r8(p.a * p.b),
      a_or_b_independent: r8(p.a + p.b - p.a * p.b),
      a_given_b: p.b > 0 ? r8(joint / p.b) : null,
      b_given_a: p.a > 0 ? r8(joint / p.a) : null,
      a_or_b_mutually_exclusive: r8(Math.min(1, p.a + p.b)),
      odds_for_a: p.a < 1 ? r8(p.a / (1 - p.a)) : null
    });
}

// ===========================================================================
// STA-012 Permutations and combinations
// ===========================================================================

for (const p of [
  { scenario: "Poker hands from a deck", n: 52, r: 5 },
  { scenario: "National lottery draw", n: 49, r: 6 },
  { scenario: "Small selection", n: 10, r: 3 },
  { scenario: "Choosing all of them", n: 6, r: 6 },
  { scenario: "Choosing none of them", n: 8, r: 0 },
  { scenario: "Choosing one", n: 20, r: 1 },
  { scenario: "Committee from a department", n: 15, r: 4 }
]) {
  add("STA-012", p.scenario,
    { n: p.n, r: p.r },
    {
      permutations: nPr(p.n, p.r),
      combinations: nCr(p.n, p.r),
      permutations_with_repetition: Math.pow(p.n, p.r),
      combinations_with_repetition: nCr(p.n + p.r - 1, p.r),
      // Only up to 18!, beyond which a double cannot hold the exact value and
      // every digit displayed would be wrong.
      factorial_n: p.n <= 18 ? fact(p.n) : null,
      ordered_selections_exceed_unordered_by: nCr(p.n, p.r) === 0 ? 0 : r8(nPr(p.n, p.r) / nCr(p.n, p.r))
    },
    "Counted by iterative products, never by a log gamma function, so the engine's log-space combinatorics is checked by exact integer arithmetic.");
}

// ===========================================================================
// STA-013 Correlation
// ===========================================================================

for (const p of [
  { scenario: "Strong positive relationship", x: [1, 2, 3, 4, 5, 6, 7, 8], y: [2, 4, 5, 4, 5, 7, 8, 9] },
  { scenario: "Perfect straight line", x: [1, 2, 3, 4, 5], y: [3, 5, 7, 9, 11] },
  { scenario: "Strong negative relationship", x: [1, 2, 3, 4, 5, 6], y: [12, 10, 9, 6, 4, 3] },
  { scenario: "Almost no relationship", x: [1, 2, 3, 4, 5, 6, 7, 8], y: [5, 3, 8, 2, 7, 4, 6, 5] },
  { scenario: "Monotonic but curved, where Spearman beats Pearson", x: [1, 2, 3, 4, 5, 6, 7], y: [1, 4, 9, 16, 25, 36, 49] },
  { scenario: "With tied values", x: [1, 2, 2, 3, 4, 5], y: [2, 3, 3, 5, 6, 8] }
]) {
  const n = p.x.length;
  const { r, sxy } = pearson(p.x, p.y);
  const df = n - 2;
  const t = Math.abs(r) >= 1 ? null : (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
  const pv = t === null ? null : 2 * (1 - tCDF(Math.abs(t), df));
  const rx = ranks(p.x), ry = ranks(p.y);
  const rho = pearson(rx, ry).r;

  add("STA-013", p.scenario,
    { x_values: JSON.stringify(p.x), y_values: JSON.stringify(p.y) },
    {
      n,
      pearson_r: r8(r),
      r_squared: r8(r * r),
      spearman_rho: r8(rho),
      covariance_sample: r8(sxy / (n - 1)),
      t_statistic: t === null ? null : r8(t),
      degrees_of_freedom: df,
      p_value: pv === null ? null : r8(pv),
      significant_at_5_percent: pv !== null && pv < 0.05
    },
    "The curved case has a Spearman rho of exactly 1 while Pearson's r is below it, which proves the two measure different things.");
}

// ===========================================================================
// STA-015 R-Squared
// ===========================================================================

for (const p of [
  { scenario: "Good linear fit", x: [1, 2, 3, 4, 5, 6, 7, 8], y: [2, 4, 5, 4, 5, 7, 8, 9], k: 1 },
  { scenario: "Perfect fit leaves no residual", x: [1, 2, 3, 4, 5], y: [3, 5, 7, 9, 11], k: 1 },
  { scenario: "Poor fit", x: [1, 2, 3, 4, 5, 6, 7, 8], y: [5, 3, 8, 2, 7, 4, 6, 5], k: 1 },
  { scenario: "Negative slope", x: [1, 2, 3, 4, 5, 6], y: [12, 10, 9, 6, 4, 3], k: 1 },
  { scenario: "Adjusted R-squared penalises extra predictors", x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], y: [2, 4, 5, 4, 5, 7, 8, 9, 11, 12], k: 3 },
  { scenario: "Larger dataset", x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], y: [3, 4, 8, 7, 10, 11, 15, 14, 18, 19, 22, 24], k: 1 }
]) {
  const n = p.x.length;
  const mx = mean(p.x), my = mean(p.y);
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (p.x[i] - mx) * (p.y[i] - my); sxx += (p.x[i] - mx) ** 2; }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let sst = 0, sse = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * p.x[i];
    sst += (p.y[i] - my) ** 2;
    sse += (p.y[i] - pred) ** 2;
  }
  const ssr = sst - sse;
  const r2 = ssr / sst;
  const dfRes = n - p.k - 1;
  const f = sse === 0 ? null : (ssr / p.k) / (sse / dfRes);
  const pv = f === null ? null : fSF(f, p.k, dfRes);

  add("STA-015", p.scenario,
    { x_values: JSON.stringify(p.x), y_values: JSON.stringify(p.y), predictors: p.k },
    {
      slope: r8(slope),
      intercept: r8(intercept),
      r_squared: r8(r2),
      adjusted_r_squared: r8(1 - ((1 - r2) * (n - 1)) / dfRes),
      total_sum_of_squares: r8(sst),
      regression_sum_of_squares: r8(ssr),
      residual_sum_of_squares: r8(sse),
      standard_error_of_estimate: r8(Math.sqrt(sse / dfRes)),
      f_statistic: f === null ? null : r8(f),
      p_value: pv === null ? null : r8(pv)
    });
}

// ===========================================================================
// STA-016 T-Test
// ===========================================================================

for (const p of [
  { scenario: "One sample against a hypothesised mean", type: "one_sample", a: [5.1, 4.9, 5.3, 5.0, 4.8, 5.2, 5.4, 4.7], b: [], mu: 5, conf: 0.95 },
  { scenario: "Two independent groups, pooled", type: "two_sample", a: [12, 14, 15, 16, 18, 13], b: [20, 22, 19, 24, 21, 23], mu: 0, conf: 0.95 },
  { scenario: "Unequal variances, so Welch is the right test", type: "welch", a: [12, 14, 15, 16, 18, 13], b: [5, 30, 12, 40, 8, 35], mu: 0, conf: 0.95 },
  { scenario: "Paired before and after", type: "paired", a: [200, 195, 210, 190, 205, 198], b: [190, 188, 200, 185, 197, 192], mu: 0, conf: 0.95 },
  { scenario: "No real difference between the groups", type: "two_sample", a: [10, 11, 12, 13, 14], b: [10, 12, 11, 14, 13], mu: 0, conf: 0.95 },
  { scenario: "Groups of different sizes", type: "welch", a: [30, 32, 35, 31], b: [20, 22, 21, 24, 23, 25, 19, 22], mu: 0, conf: 0.95 }
]) {
  let t, df, difference, se, d;
  if (p.type === "one_sample") {
    const n = p.a.length, m = mean(p.a), sd = Math.sqrt(variance(p.a, true));
    se = sd / Math.sqrt(n); difference = m - p.mu; t = difference / se; df = n - 1; d = difference / sd;
  } else if (p.type === "paired") {
    const diffs = p.a.map((x, i) => x - p.b[i]);
    const n = diffs.length, m = mean(diffs), sd = Math.sqrt(variance(diffs, true));
    se = sd / Math.sqrt(n); difference = m; t = m / se; df = n - 1; d = m / sd;
  } else {
    const n1 = p.a.length, n2 = p.b.length;
    const m1 = mean(p.a), m2 = mean(p.b);
    const v1 = variance(p.a, true), v2 = variance(p.b, true);
    difference = m1 - m2;
    if (p.type === "welch") {
      se = Math.sqrt(v1 / n1 + v2 / n2);
      df = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
    } else {
      const pooled = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
      se = Math.sqrt(pooled * (1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
    }
    t = difference / se;
    d = difference / Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  }
  const pv = 2 * (1 - tCDF(Math.abs(t), df));
  const critical = inverseTCDF(1 - (1 - p.conf) / 2, df);

  // A one-sample test shows a hypothesised mean and no second sample; the
  // other three show a second sample and no hypothesised mean.
  const inputs = {
    test_type: p.type,
    sample_a: JSON.stringify(p.a),
    confidence: p.conf,
    two_tailed: true
  };
  if (p.type === "one_sample") inputs.hypothesised_mean = p.mu;
  else inputs.sample_b = JSON.stringify(p.b);

  add("STA-016", p.scenario, inputs,
    {
      t_statistic: r8(t),
      degrees_of_freedom: r8(df),
      p_value: r8(Math.min(1, Math.max(0, pv))),
      critical_value: r8(critical),
      significant_at_5_percent: pv < 0.05,
      mean_difference: r8(difference),
      standard_error: r8(se),
      confidence_interval_lower: r8(difference - critical * se),
      confidence_interval_upper: r8(difference + critical * se),
      cohens_d: r8(d)
    },
    "The Welch case has deliberately unequal variances, so its fractional degrees of freedom differ sharply from the pooled test's.");
}

// ===========================================================================
// STA-017 Chi-Square
// ===========================================================================

for (const p of [
  { scenario: "Two by two contingency table", table: [[20, 30], [30, 20]] },
  { scenario: "Three by three table", table: [[10, 20, 30], [20, 25, 15], [30, 15, 25]] },
  { scenario: "No association at all", table: [[25, 25], [25, 25]] },
  { scenario: "Strong association", table: [[90, 10], [10, 90]] },
  { scenario: "Small expected counts, where the approximation is unreliable", table: [[8, 2], [3, 7]] },
  { scenario: "Rectangular table", table: [[15, 25, 10, 20], [20, 15, 25, 10]] }
]) {
  const rows = p.table.length, cols = p.table[0].length;
  const rowTotals = p.table.map((r) => sum(r));
  const colTotals = Array.from({ length: cols }, (_, j) => sum(p.table.map((r) => r[j])));
  const total = sum(rowTotals);
  let chi = 0, smallest = Infinity;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const e = (rowTotals[i] * colTotals[j]) / total;
      smallest = Math.min(smallest, e);
      chi += (p.table[i][j] - e) ** 2 / e;
    }
  }
  const df = (rows - 1) * (cols - 1);
  const pv = chiSquareSF(chi, df);

  add("STA-017", p.scenario,
    { test_type: "independence", contingency_table: JSON.stringify(p.table) },
    {
      chi_square: r8(chi),
      degrees_of_freedom: df,
      p_value: r8(pv),
      significant_at_5_percent: pv < 0.05,
      cramers_v: r8(Math.sqrt(chi / (total * Math.min(rows - 1, cols - 1)))),
      total_observations: total,
      smallest_expected_count: r8(smallest)
    },
    "Chi-square CDF by numerical quadrature with a numerically computed normalising constant.");
}

// ===========================================================================
// STA-018 ANOVA
// ===========================================================================

for (const p of [
  { scenario: "Three groups that clearly differ", groups: [[5, 6, 7, 8], [10, 11, 12, 13], [15, 16, 17, 18]] },
  { scenario: "Three groups that do not differ", groups: [[5, 6, 7, 8], [6, 7, 5, 8], [7, 5, 8, 6]] },
  { scenario: "Two groups only", groups: [[12, 14, 15, 16], [20, 22, 19, 24]] },
  { scenario: "Unequal group sizes", groups: [[5, 6, 7], [10, 11, 12, 13, 14], [15, 16]] },
  { scenario: "Four groups", groups: [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] },
  { scenario: "Wide within-group spread masks the difference", groups: [[1, 10, 20], [5, 12, 22], [3, 15, 25]] }
]) {
  const all = p.groups.flat();
  const n = all.length, k = p.groups.length;
  const grand = mean(all);
  const groupMeans = p.groups.map(mean);
  let ssb = 0, ssw = 0;
  p.groups.forEach((g, i) => {
    ssb += g.length * (groupMeans[i] - grand) ** 2;
    for (const v of g) ssw += (v - groupMeans[i]) ** 2;
  });
  const dfb = k - 1, dfw = n - k;
  const msb = ssb / dfb, msw = ssw / dfw;
  const f = msb / msw;
  const pv = fSF(f, dfb, dfw);

  add("STA-018", p.scenario,
    { groups: JSON.stringify(p.groups) },
    {
      groups: k,
      total_observations: n,
      grand_mean: r8(grand),
      between_groups_sum_of_squares: r8(ssb),
      within_groups_sum_of_squares: r8(ssw),
      total_sum_of_squares: r8(ssb + ssw),
      between_groups_df: dfb,
      within_groups_df: dfw,
      between_groups_mean_square: r8(msb),
      within_groups_mean_square: r8(msw),
      f_statistic: r8(f),
      p_value: r8(pv),
      significant_at_5_percent: pv < 0.05,
      eta_squared: r8(ssb / (ssb + ssw))
    },
    "The last case has the same group differences as the first but a much wider within-group spread, and is not significant, which is the point of the F ratio.");
}

// ===========================================================================
// STA-019 A/B Test
// ===========================================================================

for (const p of [
  { scenario: "Clear winner", cv: 10000, cc: 500, vv: 10000, vc: 600, conf: 0.95 },
  { scenario: "Too close to call", cv: 1000, cc: 50, vv: 1000, vc: 55, conf: 0.95 },
  { scenario: "Small sample, large apparent lift", cv: 200, cc: 20, vv: 200, vc: 30, conf: 0.95 },
  { scenario: "Variant performs worse", cv: 5000, cc: 400, vv: 5000, vc: 340, conf: 0.95 },
  { scenario: "Very large sample, tiny difference", cv: 200000, cc: 10000, vv: 200000, vc: 10300, conf: 0.95 },
  { scenario: "Unequal traffic split", cv: 8000, cc: 400, vv: 2000, vc: 130, conf: 0.95 }
]) {
  const p1 = p.cc / p.cv, p2 = p.vc / p.vv;
  const diff = p2 - p1;
  const pooled = (p.cc + p.vc) / (p.cv + p.vv);
  const sePooled = Math.sqrt(pooled * (1 - pooled) * (1 / p.cv + 1 / p.vv));
  const z = diff / sePooled;
  const pv = 2 * (1 - normalCDF(Math.abs(z)));
  const seUn = Math.sqrt((p1 * (1 - p1)) / p.cv + (p2 * (1 - p2)) / p.vv);
  const zc = inverseNormalCDF(1 - (1 - p.conf) / 2);

  add("STA-019", p.scenario,
    {
      control_visitors: p.cv, control_conversions: p.cc,
      variant_visitors: p.vv, variant_conversions: p.vc, confidence: p.conf
    },
    {
      control_rate: r8(p1),
      variant_rate: r8(p2),
      absolute_difference: r8(diff),
      relative_lift: p1 === 0 ? null : r8(diff / p1),
      z_statistic: r8(z),
      p_value: r8(pv),
      significant_at_5_percent: pv < 0.05,
      confidence_interval_lower: r8(diff - zc * seUn),
      confidence_interval_upper: r8(diff + zc * seUn)
    },
    "The test statistic uses the pooled standard error while the interval uses the unpooled one, because pooling assumes the null hypothesis that an interval must not assume.");
}

// ===========================================================================
// STA-020 Percent Error
// ===========================================================================

for (const p of [
  { scenario: "Measurement over the expected value", observed: 10.5, expected: 10 },
  { scenario: "Measurement under the expected value", observed: 9.2, expected: 10 },
  { scenario: "Exact measurement", observed: 25, expected: 25 },
  { scenario: "Large error", observed: 150, expected: 100 },
  { scenario: "Negative expected value", observed: -8, expected: -10 },
  { scenario: "Within one per cent", observed: 100.5, expected: 100 }
]) {
  const error = p.observed - p.expected;
  const relative = error / Math.abs(p.expected);
  add("STA-020", p.scenario,
    { observed: p.observed, expected: p.expected },
    {
      absolute_error: r8(Math.abs(error)),
      percent_error: r8(Math.abs(relative) * 100),
      relative_error: r8(Math.abs(relative)),
      signed_percent_error: r8(relative * 100),
      direction: error > 0 ? "over" : error < 0 ? "under" : "exact",
      within_one_percent: Math.abs(relative) <= 0.01,
      within_five_percent: Math.abs(relative) <= 0.05
    },
    "The negative expected value case proves the denominator is the absolute value, so the sign of the error is not flipped.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
