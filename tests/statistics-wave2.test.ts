import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";
import { parseDataset } from "../packages/calculation-engine/src/statistics/parser.js";

/**
 * Behavioural tests for Wave 2 tranche 2H, Statistics & Data.
 *
 * The numeric agreement is covered by 93 independent benchmark cases whose
 * distributions are computed by numerical quadrature rather than by the
 * engine's incomplete beta and gamma functions. These tests cover what
 * benchmarks cannot: that the tool refuses to mislead.
 */

const CTX = {};
const closeTo = (a: number, e: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// The parser must never lose data quietly
// ---------------------------------------------------------------------------

test("the dataset parser never silently loses values", async (t: any) => {
  await t.test("JSON array notation survives intact", () => {
    assert.deepStrictEqual(parseDataset("[2, 4, 6, 8]"), [2, 4, 6, 8]);
  });

  await t.test("a bracketed list reaches the calculator complete", async () => {
    const { outputs } = await calculate("STA-002", { data: "[2, 4, 4, 6, 8]", weights: "" }, CTX);
    // The old parser turned this into [4, 4, 6] by discarding "[2" and "8]",
    // and reported a mean of 4.67 with total confidence.
    assert.strictEqual(outputs.count, 5);
    closeTo(outputs.arithmetic_mean as number, 4.8);
  });

  await t.test("unreadable input is refused, not quietly dropped", async () => {
    await assert.rejects(
      () => calculate("STA-002", { data: "1, 2, banana, 4", weights: "" }, CTX),
      (err: Error) => /"banana" is not a number/.test(err.message)
    );
  });
});

// ---------------------------------------------------------------------------
// STA-002: the four means are not interchangeable
// ---------------------------------------------------------------------------

test("STA-002 returns every mean, and blanks the ones that are undefined", async () => {
  const growth = await calculate("STA-002", { data: "1.1, 1.05, 0.95, 1.2, 1.02", weights: "" }, CTX);
  // For growth factors the geometric mean is the correct average and is
  // always at or below the arithmetic mean.
  assert.ok((growth.outputs.geometric_mean as number) <= (growth.outputs.arithmetic_mean as number));
  assert.ok((growth.outputs.harmonic_mean as number) <= (growth.outputs.geometric_mean as number));

  const withNegative = await calculate("STA-002", { data: "-5, 10, 15, 20", weights: "" }, CTX);
  // Neither is defined over negative values, so neither is invented.
  assert.strictEqual(withNegative.outputs.geometric_mean, null);
  assert.strictEqual(withNegative.outputs.harmonic_mean, null);
});

test("STA-002 rejects a mismatched weight list", async () => {
  await assert.rejects(
    () => calculate("STA-002", { data: "1, 2, 3", weights: "0.5, 0.5" }, CTX),
    (err: Error) => /same number of weights/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// STA-004: sample and population are different answers
// ---------------------------------------------------------------------------

test("STA-004 distinguishes sample from population", async () => {
  const { outputs } = await calculate("STA-004", { data: "2, 4, 4, 4, 5, 5, 7, 9" }, CTX);
  // The classic textbook set: population variance 4, sample variance 32/7.
  closeTo(outputs.population_variance as number, 4);
  closeTo(outputs.sample_variance as number, 32 / 7);
  closeTo(outputs.population_standard_deviation as number, 2);
  assert.ok((outputs.sample_variance as number) > (outputs.population_variance as number));
});

test("STA-004 keeps precision on large values", async () => {
  // A one-pass sum-of-squares formula loses almost all precision here,
  // because the mean is seven orders of magnitude larger than the spread.
  const { outputs } = await calculate(
    "STA-004",
    { data: "1000000.1, 1000000.2, 1000000.3, 1000000.4" },
    CTX
  );
  closeTo(outputs.sample_variance as number, 0.0166666667, 1e-8);
});

// ---------------------------------------------------------------------------
// STA-007: a category error is refused, not answered
// ---------------------------------------------------------------------------

test("STA-007 refuses a left-tailed chi-square test", async () => {
  await assert.rejects(
    () => calculate("STA-007", {
      test_statistic: 7.815, distribution: "chi_square", tail: "left",
      degrees_of_freedom: 3, degrees_of_freedom_2: 0
    }, CTX),
    (err: Error) => /cannot be negative/.test(err.message)
  );
});

test("STA-007 reproduces published critical points", async () => {
  const chi = await calculate("STA-007", {
    test_statistic: 7.815, distribution: "chi_square", tail: "right",
    degrees_of_freedom: 3, degrees_of_freedom_2: 0
  }, CTX);
  // 7.815 is the published 5% critical value for 3 degrees of freedom.
  closeTo(chi.outputs.p_value as number, 0.05, 1e-4);

  const t = await calculate("STA-007", {
    test_statistic: 2.228139, distribution: "t", tail: "two",
    degrees_of_freedom: 10, degrees_of_freedom_2: 0
  }, CTX);
  closeTo(t.outputs.p_value as number, 0.05, 1e-6);
});

// ---------------------------------------------------------------------------
// STA-009: the fourfold rule, and the correction that is often forgotten
// ---------------------------------------------------------------------------

test("STA-009 halving the margin needs four times the sample", async () => {
  const base = await calculate("STA-009", {
    measure: "proportion", proportion: 0.5, standard_deviation: 0, sample_mean: 0,
    sample_size: 1000, confidence: 0.95, population_size: ""
  }, CTX);
  const quadrupled = await calculate("STA-009", {
    measure: "proportion", proportion: 0.5, standard_deviation: 0, sample_mean: 0,
    sample_size: 4000, confidence: 0.95, population_size: ""
  }, CTX);
  // Outputs are rounded to eight decimal places for display, so the tolerance
  // here is set by that rounding rather than by the mathematics.
  closeTo(
    quadrupled.outputs.margin_of_error as number,
    (base.outputs.margin_of_error as number) / 2,
    1e-7
  );
  assert.strictEqual(base.outputs.sample_size_for_half_the_margin, 4000);
});

test("STA-009 applies the finite population correction only when it matters", async () => {
  const smallPopulation = await calculate("STA-009", {
    measure: "proportion", proportion: 0.6, standard_deviation: 0, sample_mean: 0,
    sample_size: 300, confidence: 0.95, population_size: 500
  }, CTX);
  const largePopulation = await calculate("STA-009", {
    measure: "proportion", proportion: 0.6, standard_deviation: 0, sample_mean: 0,
    sample_size: 300, confidence: 0.95, population_size: 100000
  }, CTX);
  assert.strictEqual(smallPopulation.outputs.finite_population_correction_applied, true);
  assert.strictEqual(largePopulation.outputs.finite_population_correction_applied, false);
  // Surveying 300 of 500 people gives a much tighter margin than 300 of 100,000.
  assert.ok(
    (smallPopulation.outputs.margin_of_error as number) <
      (largePopulation.outputs.margin_of_error as number)
  );
});

// ---------------------------------------------------------------------------
// STA-010: under-powered designs are called out
// ---------------------------------------------------------------------------

test("STA-010 warns about an under-powered design and says what would fix it", async () => {
  const { outputs, warnings } = await calculate("STA-010", {
    effect_size: 0.5, sample_size_per_group: 30, alpha: 0.05, target_power: 0.8, two_tailed: true
  }, CTX);
  assert.strictEqual(outputs.is_adequately_powered, false);
  // The published requirement for d = 0.5 at 80% power is 64 per group.
  assert.strictEqual(outputs.required_sample_size_per_group, 64);
  assert.ok(warnings.some((w: string) => /has not shown there is nothing to find/i.test(w)));
});

test("STA-010 a one-tailed test has more power than a two-tailed one", async () => {
  const two = await calculate("STA-010", {
    effect_size: 0.5, sample_size_per_group: 100, alpha: 0.05, target_power: 0.8, two_tailed: true
  }, CTX);
  const one = await calculate("STA-010", {
    effect_size: 0.5, sample_size_per_group: 100, alpha: 0.05, target_power: 0.8, two_tailed: false
  }, CTX);
  assert.ok((one.outputs.power as number) > (two.outputs.power as number));
});

// ---------------------------------------------------------------------------
// STA-011: independent and mutually exclusive are opposites
// ---------------------------------------------------------------------------

test("STA-011 flags an impossible joint probability", async () => {
  const { warnings } = await calculate("STA-011", {
    probability_a: 0.3, probability_b: 0.4, probability_a_and_b: 0.5
  }, CTX);
  // A joint probability cannot exceed either event's own probability.
  assert.ok(warnings.some((w: string) => /impossible/i.test(w)));
});

test("STA-011 gives both the independent and the mutually exclusive figures", async () => {
  const { outputs } = await calculate("STA-011", {
    probability_a: 0.5, probability_b: 0.4, probability_a_and_b: ""
  }, CTX);
  closeTo(outputs.a_and_b_independent as number, 0.2);
  closeTo(outputs.a_or_b_independent as number, 0.7);
  closeTo(outputs.a_or_b_mutually_exclusive as number, 0.9);
});

// ---------------------------------------------------------------------------
// STA-012: exact counts, and no invented digits
// ---------------------------------------------------------------------------

test("STA-012 counts exactly", async () => {
  const poker = await calculate("STA-012", { n: 52, r: 5 }, CTX);
  assert.strictEqual(poker.outputs.combinations, 2598960);
  assert.strictEqual(poker.outputs.permutations, 311875200);
  // 52! cannot be held exactly in a double, so nothing is shown rather than
  // 68 digits of which only the first 15 would be right.
  assert.strictEqual(poker.outputs.factorial_n, null);

  const small = await calculate("STA-012", { n: 10, r: 3 }, CTX);
  assert.strictEqual(small.outputs.factorial_n, 3628800);
  assert.strictEqual(small.outputs.combinations, 120);
  assert.strictEqual(small.outputs.permutations, 720);
  // Order multiplies the count by r factorial: 3! = 6.
  closeTo(small.outputs.ordered_selections_exceed_unordered_by as number, 6);
});

test("STA-012 refuses to choose more items than exist", async () => {
  await assert.rejects(
    () => calculate("STA-012", { n: 5, r: 8 }, CTX),
    (err: Error) => /cannot choose more items than you have/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// STA-013: Pearson and Spearman measure different things
// ---------------------------------------------------------------------------

test("STA-013 Spearman catches a curved relationship that Pearson understates", async () => {
  const { outputs } = await calculate("STA-013", {
    x_values: "1, 2, 3, 4, 5, 6, 7",
    y_values: "1, 4, 9, 16, 25, 36, 49"
  }, CTX);
  // y = x squared is perfectly monotonic, so Spearman is exactly 1 while
  // Pearson, which measures only straight-line association, is not.
  closeTo(outputs.spearman_rho as number, 1, 1e-9);
  assert.ok((outputs.pearson_r as number) < 1);
  assert.match(String(outputs.basis), /not causation/i);
});

test("STA-013 refuses data with no variation", async () => {
  await assert.rejects(
    () => calculate("STA-013", { x_values: "5, 5, 5, 5", y_values: "1, 2, 3, 4" }, CTX),
    (err: Error) => /never changes/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// STA-015: adjusted R-squared can fall, and that is the point
// ---------------------------------------------------------------------------

test("STA-015 adjusted R-squared penalises useless predictors", async () => {
  const one = await calculate("STA-015", {
    x_values: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
    y_values: "2, 4, 5, 4, 5, 7, 8, 9, 11, 12",
    predictors: 1
  }, CTX);
  const three = await calculate("STA-015", {
    x_values: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
    y_values: "2, 4, 5, 4, 5, 7, 8, 9, 11, 12",
    predictors: 3
  }, CTX);
  // Plain R-squared is identical because the fit is identical; adjusted falls.
  closeTo(three.outputs.r_squared as number, one.outputs.r_squared as number, 1e-9);
  assert.ok((three.outputs.adjusted_r_squared as number) < (one.outputs.adjusted_r_squared as number));
});

test("STA-015 sums of squares decompose exactly", async () => {
  const { outputs } = await calculate("STA-015", {
    x_values: "1, 2, 3, 4, 5, 6, 7, 8",
    y_values: "2, 4, 5, 4, 5, 7, 8, 9",
    predictors: 1
  }, CTX);
  closeTo(
    (outputs.regression_sum_of_squares as number) + (outputs.residual_sum_of_squares as number),
    outputs.total_sum_of_squares as number,
    1e-6
  );
});

// ---------------------------------------------------------------------------
// STA-016: Welch differs from the pooled test where it should
// ---------------------------------------------------------------------------

test("STA-016 Welch and the pooled test differ on unequal variances", async () => {
  const data = {
    sample_a: "12, 14, 15, 16, 18, 13",
    sample_b: "5, 30, 12, 40, 8, 35",
    hypothesised_mean: 0, confidence: 0.95, two_tailed: true
  };
  const pooled = await calculate("STA-016", { ...data, test_type: "two_sample" }, CTX);
  const welch = await calculate("STA-016", { ...data, test_type: "welch" }, CTX);

  // The pooled test uses n1 + n2 - 2 = 10 degrees of freedom; Welch's are
  // fractional and much lower because the variances are wildly unequal.
  assert.strictEqual(pooled.outputs.degrees_of_freedom, 10);
  assert.ok((welch.outputs.degrees_of_freedom as number) < 10);
  assert.ok(!Number.isInteger(welch.outputs.degrees_of_freedom as number));
});

test("STA-016 a one-sample test recovers the mean difference", async () => {
  const { outputs } = await calculate("STA-016", {
    test_type: "one_sample",
    sample_a: "5.1, 4.9, 5.3, 5.0, 4.8, 5.2, 5.4, 4.7",
    sample_b: "", hypothesised_mean: 5, confidence: 0.95, two_tailed: true
  }, CTX);
  // Mean of the sample is 5.05, so the difference from 5 is 0.05.
  closeTo(outputs.mean_difference as number, 0.05, 1e-9);
  assert.strictEqual(outputs.degrees_of_freedom, 7);
});

// ---------------------------------------------------------------------------
// STA-017: the small expected count warning
// ---------------------------------------------------------------------------

test("STA-017 warns when expected counts are too small for the approximation", async () => {
  const { outputs, warnings } = await calculate("STA-017", {
    test_type: "independence", contingency_table: "[[8, 2], [3, 7]]", observed: "", expected: ""
  }, CTX);
  assert.ok((outputs.smallest_expected_count as number) < 5);
  assert.ok(warnings.some((w: string) => /Fisher exact test/i.test(w)));
});

test("STA-017 reports no association as no association", async () => {
  const { outputs } = await calculate("STA-017", {
    test_type: "independence", contingency_table: "[[25, 25], [25, 25]]", observed: "", expected: ""
  }, CTX);
  closeTo(outputs.chi_square as number, 0, 1e-9);
  closeTo(outputs.cramers_v as number, 0, 1e-9);
  assert.strictEqual(outputs.significant_at_5_percent, false);
});

// ---------------------------------------------------------------------------
// STA-018: spread matters as much as the difference between means
// ---------------------------------------------------------------------------

test("STA-018 the same group differences are not significant under a wide spread", async () => {
  const tight = await calculate("STA-018", {
    groups: "[[5, 6, 7, 8], [10, 11, 12, 13], [15, 16, 17, 18]]"
  }, CTX);
  const wide = await calculate("STA-018", {
    groups: "[[1, 10, 20], [5, 12, 22], [3, 15, 25]]"
  }, CTX);
  assert.strictEqual(tight.outputs.significant_at_5_percent, true);
  assert.strictEqual(wide.outputs.significant_at_5_percent, false);
  assert.match(String(tight.outputs.basis), /does not say WHICH/i);
});

test("STA-018 sums of squares decompose exactly", async () => {
  const { outputs } = await calculate("STA-018", {
    groups: "[[5, 6, 7], [10, 11, 12, 13, 14], [15, 16]]"
  }, CTX);
  closeTo(
    (outputs.between_groups_sum_of_squares as number) + (outputs.within_groups_sum_of_squares as number),
    outputs.total_sum_of_squares as number,
    1e-9
  );
});

test("STA-018 needs at least two groups", async () => {
  await assert.rejects(
    () => calculate("STA-018", { groups: "[[1, 2, 3]]" }, CTX),
    (err: Error) => /at least two groups/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// STA-019: "not significant" is not "no difference"
// ---------------------------------------------------------------------------

test("STA-019 distinguishes an inconclusive test from no effect", async () => {
  const { outputs, warnings } = await calculate("STA-019", {
    control_visitors: 1000, control_conversions: 50,
    variant_visitors: 1000, variant_conversions: 55, confidence: 0.95
  }, CTX);
  assert.strictEqual(outputs.significant_at_5_percent, false);
  assert.ok(warnings.some((w: string) => /not evidence the variant makes no difference/i.test(w)));
  assert.ok((outputs.required_sample_per_group_for_this_lift as number) > 1000);
});

test("STA-019 rejects more conversions than visitors", async () => {
  await assert.rejects(
    () => calculate("STA-019", {
      control_visitors: 100, control_conversions: 150,
      variant_visitors: 100, variant_conversions: 50, confidence: 0.95
    }, CTX),
    (err: Error) => /between 0 and the number of control visitors/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// STA-020: the denominator is the expected value
// ---------------------------------------------------------------------------

test("STA-020 measures error against the expected value", async () => {
  const { outputs } = await calculate("STA-020", { observed: 150, expected: 100 }, CTX);
  closeTo(outputs.percent_error as number, 50);
  assert.strictEqual(outputs.direction, "over");
});

test("STA-020 handles a negative expected value without flipping the sign", async () => {
  const { outputs } = await calculate("STA-020", { observed: -8, expected: -10 }, CTX);
  // The observation is 2 above -10, so it is "over" by 20% of 10.
  closeTo(outputs.signed_percent_error as number, 20);
  assert.strictEqual(outputs.direction, "over");
});

test("STA-020 refuses a zero expected value", async () => {
  await assert.rejects(
    () => calculate("STA-020", { observed: 5, expected: 0 }, CTX),
    (err: Error) => /nothing to measure the error against/.test(err.message)
  );
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the statistics tranche
// ---------------------------------------------------------------------------

test("no statistics calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["STA-002", { data: "0, 0, 0", weights: "" }],
    ["STA-004", { data: "0, 0, 0" }],
    ["STA-005", { value: 0, mean: 0, standard_deviation: 1 }],
    ["STA-007", { test_statistic: 0, distribution: "z", tail: "two", degrees_of_freedom: 0, degrees_of_freedom_2: 0 }],
    ["STA-009", { measure: "proportion", proportion: 0, standard_deviation: 0, sample_mean: 0, sample_size: 1, confidence: 0.95, population_size: "" }],
    ["STA-011", { probability_a: 0, probability_b: 0, probability_a_and_b: "" }],
    ["STA-012", { n: 0, r: 0 }],
    ["STA-020", { observed: 0, expected: 1 }]
  ];
  for (const [id, inputs] of cases) {
    await t.test(`${id} at its degenerate boundary`, async () => {
      const { outputs } = await calculate(id, inputs, CTX);
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === "number") {
          assert.ok(Number.isFinite(value), `${id}.${key} is ${value}`);
        }
        assert.notStrictEqual(String(value), "[object Object]", `${id}.${key} rendered as an object`);
        assert.notStrictEqual(String(value), "undefined", `${id}.${key} is undefined`);
      }
    });
  }
});
