import type { NumericInputs, CalculatorHandler } from "../types.js";
import {
  averages, varianceAnalysis, zScore, pValue, marginOfError, statisticalPower,
  probability, countingRules, correlation, rSquared, tTest, chiSquareTest,
  oneWayAnova, abTest, percentError,
  type TestDistribution, type TailType, type TTestType
} from "./wave2.js";
import { parseDataset } from "./parser.js";
import { inverseChiSquareCDF, inverseFCDF } from "./distributions.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
function orNull(n: number | null, fn: (v: number) => number): number | null {
  return n === null || n === undefined ? null : fn(n);
}

function parseMatrix(value: unknown, label: string): number[][] {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) {
    throw new Error(`${label} must be a table, for example [[10, 20], [30, 40]].`);
  }
  return raw.map((row: unknown[]) => row.map(Number));
}

function parseGroups(value: unknown, label: string): number[][] {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(raw) || !Array.isArray(raw[0])) {
    throw new Error(`${label} must be a list of groups, for example [[1, 2, 3], [4, 5, 6]].`);
  }
  return raw.map((g: unknown[]) => g.map(Number));
}

const NOT_A_CONCLUSION =
  "A statistical result on the data you entered. Statistical significance is not the same as practical importance, and a test cannot tell you whether your data were collected in a way that supports the conclusion you want to draw.";

/** STA-002 Average */
export const sta002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const data = parseDataset(inputs.data as string);
  const rawWeights = inputs.weights;
  const weights =
    rawWeights === "" || rawWeights === null || rawWeights === undefined
      ? null
      : parseDataset(rawWeights as string);
  const r = averages(data, weights);
  return {
    outputs: {
      count: r.count,
      sum: round8(r.sum),
      arithmetic_mean: round8(r.arithmetic_mean),
      median: round8(r.median),
      modes: r.modes,
      geometric_mean: orNull(r.geometric_mean, round8),
      harmonic_mean: orNull(r.harmonic_mean, round8),
      weighted_mean: orNull(r.weighted_mean, round8),
      range: round8(r.range),
      midrange: round8(r.midrange),
      basis:
        "The four means answer different questions. Use the geometric mean for growth rates and the harmonic mean for rates over a fixed distance such as speed; using the arithmetic mean for either overstates the answer. The geometric and harmonic means are undefined for data containing zero or negative values and are left blank rather than guessed."
    }
  };
};

/** STA-004 Variance */
export const sta004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = varianceAnalysis(parseDataset(inputs.data as string));
  return {
    outputs: {
      count: r.count,
      mean: round8(r.mean),
      sum_of_squares: round8(r.sum_of_squares),
      sample_variance: orNull(r.sample_variance, round8),
      population_variance: round8(r.population_variance),
      sample_standard_deviation: orNull(r.sample_standard_deviation, round8),
      population_standard_deviation: round8(r.population_standard_deviation),
      coefficient_of_variation: orNull(r.coefficient_of_variation, round8),
      standard_error: orNull(r.standard_error, round8),
      basis:
        "Use the SAMPLE figures when your data are a sample from a larger group, which is almost always the case; they divide by n-1 rather than n, which corrects a bias that would otherwise understate the spread. The population figures are right only when you have measured every member of the group."
    }
  };
};

/** STA-005 Z-Score */
export const sta005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = zScore(Number(inputs.value), Number(inputs.mean), Number(inputs.standard_deviation));
  return {
    outputs: {
      z_score: round8(r.z_score),
      percentile: round8(r.percentile),
      probability_below: round8(r.probability_below),
      probability_above: round8(r.probability_above),
      two_tailed_p_value: round8(r.two_tailed_p_value),
      standard_deviations_from_mean: round8(r.standard_deviations_from_mean),
      is_outlier_at_two_sd: r.is_outlier_at_two_sd,
      is_outlier_at_three_sd: r.is_outlier_at_three_sd,
      basis:
        "The percentile assumes the data follow a normal distribution. For skewed data such as incomes or waiting times, a z-score still measures distance from the mean but the percentile it implies will be wrong."
    }
  };
};

/** STA-007 P-Value */
export const sta007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = pValue(
    Number(inputs.test_statistic),
    String(inputs.distribution ?? "z") as TestDistribution,
    String(inputs.tail ?? "two") as TailType,
    Number(inputs.degrees_of_freedom ?? 0),
    Number(inputs.degrees_of_freedom_2 ?? 0)
  );
  return {
    outputs: {
      p_value: round8(r.p_value),
      significant_at_5_percent: r.significant_at_5_percent,
      significant_at_1_percent: r.significant_at_1_percent,
      critical_value: orNull(r.critical_value, round8),
      basis:
        "A p-value is the probability of seeing a result at least this extreme IF the null hypothesis were true. It is not the probability that the null hypothesis is true, and it says nothing about the size of the effect. " +
        NOT_A_CONCLUSION
    }
  };
};

/** STA-009 Margin of Error */
export const sta009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const isProportion = String(inputs.measure ?? "proportion") === "proportion";
  const populationRaw = inputs.population_size;
  const r = marginOfError(
    isProportion,
    Number(inputs.proportion ?? 0.5),
    Number(inputs.standard_deviation ?? 0),
    Number(inputs.sample_mean ?? 0),
    Number(inputs.sample_size),
    Number(inputs.confidence ?? 0.95),
    populationRaw === "" || populationRaw === null || populationRaw === undefined
      ? null
      : Number(populationRaw)
  );
  return {
    outputs: {
      margin_of_error: round8(r.margin_of_error),
      lower_bound: round8(r.lower_bound),
      upper_bound: round8(r.upper_bound),
      critical_value: round8(r.critical_value),
      standard_error: round8(r.standard_error),
      sample_size_for_half_the_margin: r.sample_size_for_half_the_margin,
      finite_population_correction_applied: r.finite_population_correction_applied,
      basis:
        "Halving the margin of error takes FOUR times the sample, not twice, which is why the sample size for half this margin is shown. The margin covers sampling error only: it says nothing about a biased sample, a leading question or people who declined to answer."
    }
  };
};

/** STA-010 Statistical Power */
export const sta010Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = statisticalPower(
    Number(inputs.effect_size),
    Number(inputs.sample_size_per_group),
    Number(inputs.alpha ?? 0.05),
    Number(inputs.target_power ?? 0.8),
    inputs.two_tailed === false ? false : true
  );
  const warnings: string[] = [];
  if (!r.is_adequately_powered) {
    warnings.push(
      `This design has ${round2(r.power * 100)}% power, below your target. You would need about ${r.required_sample_size_per_group} per group to reach it. An under-powered study that finds nothing has not shown there is nothing to find.`
    );
  }
  return {
    outputs: {
      effect_size: round8(r.effect_size),
      power: round8(r.power),
      beta: round8(r.beta),
      required_sample_size_per_group: r.required_sample_size_per_group,
      critical_value: round8(r.critical_value),
      is_adequately_powered: r.is_adequately_powered,
      basis:
        "Power is the chance of detecting an effect of this size if it is really there. Under-powered studies are the commonest route to a wrong conclusion, in both directions: they miss real effects, and the effects they do find are exaggerated. " +
        NOT_A_CONCLUSION
    },
    warnings
  };
};

/** STA-011 Probability */
export const sta011Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const jointRaw = inputs.probability_a_and_b;
  const r = probability(
    Number(inputs.probability_a),
    Number(inputs.probability_b),
    jointRaw === "" || jointRaw === null || jointRaw === undefined ? null : Number(jointRaw)
  );
  const warnings: string[] = [];
  if (!r.events_are_consistent) {
    warnings.push(
      "The joint probability you entered is impossible alongside the two individual probabilities: it cannot exceed either of them, nor fall below their sum minus one."
    );
  }
  return {
    outputs: {
      not_a: round8(r.not_a),
      a_and_b_independent: round8(r.a_and_b_independent),
      a_or_b_independent: round8(r.a_or_b_independent),
      a_given_b: orNull(r.a_given_b, round8),
      b_given_a: orNull(r.b_given_a, round8),
      a_or_b_mutually_exclusive: round8(r.a_or_b_mutually_exclusive),
      odds_for_a: orNull(r.odds_for_a, round8),
      basis:
        "Independent and mutually exclusive are opposites, not synonyms: independent events can both happen, mutually exclusive events cannot. Both sets of figures are shown so the right one can be chosen deliberately."
    },
    warnings
  };
};

/** STA-012 Permutations & Combinations */
export const sta012Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = countingRules(Number(inputs.n), Number(inputs.r));
  return {
    outputs: {
      permutations: r.permutations,
      combinations: r.combinations,
      permutations_with_repetition: r.permutations_with_repetition,
      combinations_with_repetition: r.combinations_with_repetition,
      factorial_n: r.factorial_n,
      ordered_selections_exceed_unordered_by: round8(r.ordered_selections_exceed_unordered_by),
      basis:
        "Permutations count arrangements where order matters; combinations count selections where it does not. Order multiplies the count by r factorial, which is exactly the ratio shown between the two."
    }
  };
};

/** STA-013 Correlation */
export const sta013Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = correlation(
    parseDataset(inputs.x_values as string),
    parseDataset(inputs.y_values as string)
  );
  return {
    outputs: {
      n: r.n,
      pearson_r: round8(r.pearson_r),
      r_squared: round8(r.r_squared),
      spearman_rho: round8(r.spearman_rho),
      covariance_sample: round8(r.covariance_sample),
      t_statistic: orNull(r.t_statistic, round8),
      degrees_of_freedom: r.degrees_of_freedom,
      p_value: orNull(r.p_value, round8),
      significant_at_5_percent: r.significant_at_5_percent,
      strength: r.strength,
      direction: r.direction,
      basis:
        "Correlation is not causation, and Pearson's r measures only STRAIGHT-LINE association: a perfect curved relationship can return an r of nearly zero. Spearman's rho is shown alongside because it captures any consistently increasing or decreasing relationship, straight or not. " +
        NOT_A_CONCLUSION
    }
  };
};

/** STA-015 R-Squared */
export const sta015Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = rSquared(
    parseDataset(inputs.x_values as string),
    parseDataset(inputs.y_values as string),
    Number(inputs.predictors ?? 1)
  );
  return {
    outputs: {
      slope: round8(r.slope),
      intercept: round8(r.intercept),
      r_squared: round8(r.r_squared),
      adjusted_r_squared: round8(r.adjusted_r_squared),
      total_sum_of_squares: round8(r.total_sum_of_squares),
      regression_sum_of_squares: round8(r.regression_sum_of_squares),
      residual_sum_of_squares: round8(r.residual_sum_of_squares),
      standard_error_of_estimate: round8(r.standard_error_of_estimate),
      f_statistic: orNull(r.f_statistic, round8),
      p_value: orNull(r.p_value, round8),
      basis:
        "R-squared never falls when a predictor is added, however useless that predictor is, which is why adjusted R-squared is shown beside it: adjusted R-squared can fall, and that is the point of it. A high R-squared does not make a model correct, and a low one does not make it useless."
    }
  };
};

/** STA-016 T-Test */
export const sta016Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const type = String(inputs.test_type ?? "two_sample") as TTestType;
  const sampleB =
    inputs.sample_b === "" || inputs.sample_b === null || inputs.sample_b === undefined
      ? []
      : parseDataset(inputs.sample_b as string);
  const r = tTest(
    type,
    parseDataset(inputs.sample_a as string),
    sampleB,
    Number(inputs.hypothesised_mean ?? 0),
    Number(inputs.confidence ?? 0.95),
    inputs.two_tailed === false ? false : true
  );
  return {
    outputs: {
      t_statistic: round8(r.t_statistic),
      degrees_of_freedom: round8(r.degrees_of_freedom),
      p_value: round8(r.p_value),
      critical_value: round8(r.critical_value),
      significant_at_5_percent: r.significant_at_5_percent,
      mean_difference: round8(r.mean_difference),
      standard_error: round8(r.standard_error),
      confidence_interval_lower: round8(r.confidence_interval_lower),
      confidence_interval_upper: round8(r.confidence_interval_upper),
      cohens_d: round8(r.cohens_d),
      effect_size_interpretation: r.effect_size_interpretation,
      basis:
        (type === "welch"
          ? "Welch's test does not assume the two groups have equal variances, which is why its degrees of freedom are fractional. It is the safer choice whenever the groups differ in size or spread. "
          : type === "two_sample"
            ? "The pooled two-sample test assumes both groups have the same variance. Where that is doubtful, use Welch instead. "
            : "") +
        "The confidence interval and the effect size are reported alongside the p-value, because a significant result on a trivial difference and a non-significant result on a large one are both common. " +
        NOT_A_CONCLUSION
    }
  };
};

/** STA-017 Chi-Square */
export const sta017Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const isContingency = String(inputs.test_type ?? "independence") === "independence";
  const r = isContingency
    ? chiSquareTest(parseMatrix(inputs.contingency_table, "The table"), null, true)
    : chiSquareTest(
        parseDataset(inputs.observed as string),
        parseDataset(inputs.expected as string),
        false
      );
  const critical = inverseChiSquareCDF(0.95, r.degrees_of_freedom);
  const warnings: string[] = [];
  if (!r.expected_counts_adequate) {
    warnings.push(
      `The smallest expected count is ${round2(r.smallest_expected_count)}. The chi-square approximation becomes unreliable below about 5, so this p-value should be treated with caution; a Fisher exact test would be more appropriate.`
    );
  }
  return {
    outputs: {
      chi_square: round8(r.chi_square),
      degrees_of_freedom: r.degrees_of_freedom,
      p_value: round8(r.p_value),
      critical_value: round8(critical),
      significant_at_5_percent: r.significant_at_5_percent,
      cramers_v: orNull(r.cramers_v, round8),
      total_observations: r.total_observations,
      smallest_expected_count: round8(r.smallest_expected_count),
      basis:
        "Cramer's V is the effect size and matters as much as the p-value: with a large enough sample, a trivial association reaches significance. " +
        NOT_A_CONCLUSION
    },
    warnings
  };
};

/** STA-018 ANOVA */
export const sta018Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = oneWayAnova(parseGroups(inputs.groups, "The groups"));
  const critical = inverseFCDF(0.95, r.between_groups_df, r.within_groups_df);
  return {
    outputs: {
      groups: r.groups,
      total_observations: r.total_observations,
      grand_mean: round8(r.grand_mean),
      between_groups_sum_of_squares: round8(r.between_groups_sum_of_squares),
      within_groups_sum_of_squares: round8(r.within_groups_sum_of_squares),
      total_sum_of_squares: round8(r.total_sum_of_squares),
      between_groups_df: r.between_groups_df,
      within_groups_df: r.within_groups_df,
      between_groups_mean_square: round8(r.between_groups_mean_square),
      within_groups_mean_square: round8(r.within_groups_mean_square),
      f_statistic: round8(r.f_statistic),
      p_value: round8(r.p_value),
      critical_value: round8(critical),
      significant_at_5_percent: r.significant_at_5_percent,
      eta_squared: round8(r.eta_squared),
      basis:
        "A significant F says only that the groups are not all the same. It does not say WHICH differ, and comparing every pair afterwards without correcting for multiple testing will manufacture false differences. Eta squared shows how much of the variation the grouping actually explains. " +
        NOT_A_CONCLUSION
    }
  };
};

/** STA-019 A/B Test */
export const sta019Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = abTest(
    Number(inputs.control_visitors),
    Number(inputs.control_conversions),
    Number(inputs.variant_visitors),
    Number(inputs.variant_conversions),
    Number(inputs.confidence ?? 0.95)
  );
  const warnings: string[] = [];
  if (!r.significant_at_5_percent && r.interval_contains_zero) {
    warnings.push(
      `This result is not significant, and the confidence interval runs from ${round2(r.confidence_interval_lower * 100)}% to ${round2(r.confidence_interval_upper * 100)}%. That is not evidence the variant makes no difference; it means the test cannot yet tell. About ${r.required_sample_per_group_for_this_lift} visitors per group would be needed to detect a difference of this size.`
    );
  }
  return {
    outputs: {
      control_rate: round8(r.control_rate),
      variant_rate: round8(r.variant_rate),
      absolute_difference: round8(r.absolute_difference),
      relative_lift: orNull(r.relative_lift, round8),
      z_statistic: round8(r.z_statistic),
      p_value: round8(r.p_value),
      significant_at_5_percent: r.significant_at_5_percent,
      confidence_interval_lower: round8(r.confidence_interval_lower),
      confidence_interval_upper: round8(r.confidence_interval_upper),
      required_sample_per_group_for_this_lift: r.required_sample_per_group_for_this_lift,
      basis:
        "The confidence interval uses the unpooled standard error, because pooling assumes the two rates are equal, which is precisely what an interval must not assume. Stopping a test as soon as it turns significant inflates false positives badly: decide the sample size first and run to it. " +
        NOT_A_CONCLUSION
    },
    warnings
  };
};

/** STA-020 Percent Error */
export const sta020Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = percentError(Number(inputs.observed), Number(inputs.expected));
  return {
    outputs: {
      absolute_error: round8(r.absolute_error),
      percent_error: round8(r.percent_error),
      relative_error: round8(r.relative_error),
      signed_percent_error: round8(r.signed_percent_error),
      direction: r.direction,
      within_one_percent: r.within_one_percent,
      within_five_percent: r.within_five_percent,
      basis:
        "Percent error is measured against the EXPECTED value, not the observed one, and the signed figure is shown alongside the absolute so you can see whether the measurement ran high or low."
    }
  };
};
