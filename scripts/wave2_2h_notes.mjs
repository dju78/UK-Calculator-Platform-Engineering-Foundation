/**
 * Narrative specification sections for Wave 2 tranche 2H, Statistics & Data.
 * Run: node scripts/wave2_2h_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const NOT_A_CONCLUSION =
  'A statistical result on the data entered. Statistical significance is not the same as practical importance, and no test can tell you whether the data were collected in a way that supports the conclusion you want to draw.';

const QUADRATURE =
  'Benchmarks come from an independent oracle that shares NO special-function code with the engine. Where the engine evaluates the t, chi-square and F distributions through the regularised incomplete beta and incomplete gamma functions, the oracle integrates each density numerically by Simpson\'s rule and obtains the normalising constant by integrating the unnormalised density over its whole support. No gamma function is used on that side at all, and infinite ranges are handled by substitution rather than truncation, so no tail is silently discarded.';

const PARSER =
  'Inputs are read by the shared dataset parser, which accepts commas, spaces, semicolons, new lines and JSON array notation, and REFUSES any token it cannot read rather than dropping it. Silently discarding an unreadable value would hand the user a confident answer to the wrong data.';

Object.assign(notes, {

  "STA-002": {
    purpose: "Report every common average for a dataset, so the right one is chosen deliberately rather than by default.",
    scope: "A list of values, with optional weights.",
    assumptions: ["Weights, where supplied, correspond one-to-one with the values."],
    validation: [
      "The weight list must be the same length as the data.",
      "Weights must not all be zero.",
      PARSER
    ],
    formula: "Arithmetic mean is the sum over the count. The geometric mean is the exponential of the mean of the logarithms, and is defined only for strictly positive data. The harmonic mean is the count over the sum of reciprocals, likewise. The weighted mean divides the sum of value times weight by the sum of the weights.",
    boundary: "The four means answer different questions and are not interchangeable: use the geometric mean for growth rates and the harmonic mean for rates over a fixed distance such as speed. Where the data contain a zero or a negative value, those two means are undefined and are returned BLANK rather than as a misleading number.",
    methodology: "Benchmarks were derived by independent direct arithmetic, including a case with a negative value that proves the undefined means are blanked rather than guessed.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-001 Mean, Median and Mode", "STA-004 Variance"]
  },

  "STA-004": {
    purpose: "Report the spread of a dataset on both a sample and a population basis.",
    scope: "A list of values.",
    assumptions: ["The data are the complete set of observations supplied."],
    validation: ["At least one value is required; the sample figures need at least two.", PARSER],
    formula: "Deviations are squared and summed in a TWO-PASS calculation. The algebraically identical one-pass form, the sum of x squared less n times the mean squared, loses catastrophic precision when the mean is large relative to the spread, and a benchmark with values near a million is included to prove this implementation does not.",
    boundary: "Use the SAMPLE figures unless you have measured every member of the group, which is rare. They divide by n-1 rather than n, correcting a bias that would otherwise understate the spread.",
    methodology: "Benchmarks were derived independently, including the large-value case that would expose a one-pass formula.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-002 Average", "STA-005 Z-Score", "STA-009 Margin of Error"]
  },

  "STA-005": {
    purpose: "Express a value as a number of standard deviations from the mean, with the percentile that implies.",
    scope: "One value against a known mean and standard deviation.",
    assumptions: ["The percentile assumes the data follow a normal distribution."],
    validation: ["The standard deviation must be greater than zero: with no spread, no value is unusual."],
    formula: "z is the value less the mean, divided by the standard deviation. The percentile is the normal cumulative distribution function at z.",
    boundary: "For skewed data such as incomes or waiting times, a z-score still measures distance from the mean but the percentile it implies will be wrong. The calculator says so rather than presenting the percentile as a fact.",
    methodology: QUADRATURE,
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-004 Variance", "STA-007 P-Value"]
  },

  "STA-007": {
    purpose: "Convert a test statistic into a p-value under the normal, t, chi-square or F distribution.",
    scope: "One statistic, its distribution, its degrees of freedom and the tail of interest.",
    assumptions: ["The statistic was computed correctly for the distribution named."],
    validation: [
      "Degrees of freedom must be greater than zero for t, chi-square and F.",
      "A left-tailed or two-tailed chi-square or F test is REFUSED, because those statistics are a sum of squares and a ratio of variances respectively and cannot be negative. Answering such a request would dignify a category error."
    ],
    formula: "The p-value is the cumulative distribution function for a left tail, its complement for a right tail, and twice the smaller of the two for a two-tailed test.",
    boundary: "A p-value is the probability of a result at least this extreme IF the null hypothesis were true. It is not the probability that the null hypothesis is true, and it says nothing about the size of an effect. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " Benchmarks sit on published critical points - 1.96, 2.228 at 10 degrees of freedom, 7.815 at 3 - so each must return a p-value of 0.05.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-016 T-Test", "STA-017 Chi-Square", "STA-018 ANOVA"]
  },

  "STA-009": {
    purpose: "Work out the margin of error on a survey result, and what a tighter one would cost.",
    scope: "A proportion or a mean, a sample size, a confidence level and an optional population size.",
    assumptions: ["The sample was drawn at random.", "The allowances cover sampling error only."],
    validation: [
      "The sample size must be at least 1 and the confidence level strictly between 0 and 1.",
      "A proportion must be between 0 and 1."
    ],
    formula: "The margin is the critical z times the standard error. The finite population correction is applied only where the sample exceeds 5% of the population, because below that it changes nothing worth reporting.",
    boundary: "The margin covers SAMPLING error only. It says nothing about a biased sample, a leading question, or the people who declined to answer - which are usually larger sources of error than the one it measures. Halving the margin takes four times the sample, not twice, and that figure is reported explicitly because it is the most useful fact when sizing a survey.",
    methodology: QUADRATURE + " A matched pair differing only in population size proves the correction is applied when the sample is a large share of the group and not otherwise.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-008 Sample Size", "STA-006 Confidence Interval", "STA-019 A/B Test"]
  },

  "STA-010": {
    purpose: "Work out the power of a planned comparison, and the sample size a target power would need.",
    scope: "A two-sample comparison of means with equal group sizes.",
    assumptions: ["Equal group sizes.", "The effect size is expressed as Cohen's d."],
    validation: ["Each group needs at least two observations; alpha and the target power must be strictly between 0 and 1."],
    formula: "Power is computed from the non-centrality d times the square root of n over 2. The required sample size uses 2(z_alpha + z_beta)^2 / d^2 PLUS z_alpha^2 / 4. The plain normal approximation without that correction understates the requirement, because the test statistic is a t and not a z; with it, this reproduces the published two-sample requirements exactly - 64 per group at d = 0.5, 26 at d = 0.8 and 394 at d = 0.2, all at 5% and 80% power.",
    boundary: "Under-powered studies are the commonest route to a wrong conclusion, in both directions: they miss real effects, and the effects they do find are exaggerated. An under-powered design is flagged with the sample size that would fix it, and the calculator states plainly that finding nothing is not the same as showing there is nothing to find. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " The normal quantiles on the oracle side come from bisection on a numerically integrated CDF, so the engine's Acklam-plus-Halley inverse is checked against quadrature rather than against another rational approximation.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-008 Sample Size", "STA-016 T-Test", "STA-019 A/B Test"]
  },

  "STA-011": {
    purpose: "Work out the everyday combinations of two probabilities without confusing independence with mutual exclusivity.",
    scope: "Two events, with an optional joint probability.",
    assumptions: ["Where no joint probability is given, the events are treated as independent."],
    validation: [
      "Probabilities must be between 0 and 1.",
      "An impossible joint probability is flagged: it can never exceed either event's own probability, nor fall below their sum minus one."
    ],
    formula: "Independent: P(A and B) = P(A)P(B) and P(A or B) = P(A) + P(B) - P(A)P(B). Mutually exclusive: P(A and B) = 0 and P(A or B) = P(A) + P(B). Conditional probability is the joint divided by the condition.",
    boundary: "Independent and mutually exclusive are OPPOSITES, not synonyms: independent events can both happen, mutually exclusive events cannot. Both sets of figures are returned so the right one is chosen deliberately.",
    methodology: "Benchmarks were derived by independent direct arithmetic.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-012 Permutations & Combinations"]
  },

  "STA-012": {
    purpose: "Count arrangements and selections, with and without repetition.",
    scope: "Choosing r items from n.",
    assumptions: ["n and r are whole numbers and r does not exceed n."],
    validation: [
      "Choosing more items than exist is refused rather than answered with a zero that looks like a result.",
      "Choosing nothing from nothing is answered as one way, the empty selection, rather than thrown."
    ],
    formula: "Permutations are n!/(n-r)!, combinations n!/(r!(n-r)!), permutations with repetition n^r, and combinations with repetition C(n+r-1, r). The engine computes these in log space to avoid overflow and rounds small results back to exact integers.",
    boundary: "A factorial is shown only up to 18!, beyond which a double cannot hold the exact value and every digit displayed would be wrong. The permutation and combination counts remain exact well past that point and are what is actually needed.",
    methodology: "The oracle counts by ITERATIVE INTEGER PRODUCTS, never by a log gamma function, so the engine's log-space combinatorics is checked against exact arithmetic. Benchmarks include the 2,598,960 poker hands and the 13,983,816 lottery draws, both of which are widely published.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-011 Probability"]
  },

  "STA-013": {
    purpose: "Measure the association between two variables, both as a straight line and as a rank order.",
    scope: "Paired X and Y values.",
    assumptions: ["The pairs are independent observations."],
    validation: [
      "X and Y must have the same length and at least three pairs.",
      "A variable that never changes is refused, because there is no relationship to measure.",
      PARSER
    ],
    formula: "Pearson's r is the covariance over the product of the standard deviations. Significance is a t test on r with n-2 degrees of freedom. Spearman's rho is Pearson's r applied to the RANKS, with tied values sharing the average of the ranks they span.",
    boundary: "Correlation is not causation, and Pearson's r measures only STRAIGHT-LINE association: a perfect curved relationship can return an r well below 1. Spearman is reported alongside because it captures any consistently increasing or decreasing relationship, and a benchmark on y = x squared has a Spearman of exactly 1 while Pearson is lower. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " The rank correlation is computed independently with its own tie handling.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-014 Linear Regression", "STA-015 R-Squared"]
  },

  "STA-015": {
    purpose: "Fit a straight line and report how much of the variation it explains, honestly.",
    scope: "Paired X and Y values, with a stated number of predictors for the adjustment.",
    assumptions: ["A single predictor is fitted; the predictor count affects only the adjustment and the F test."],
    validation: ["At least three pairs, and enough observations for the number of predictors.", PARSER],
    formula: "Slope is the covariance over the variance of X. The total sum of squares splits exactly into the regression and residual sums of squares, which a test asserts. Adjusted R-squared is 1 - (1 - R^2)(n-1)/(n-k-1).",
    boundary: "R-squared NEVER falls when a predictor is added, however useless that predictor is, which is precisely why adjusted R-squared is shown beside it: adjusted R-squared can fall, and a benchmark pair differing only in the predictor count proves it does. A high R-squared does not make a model correct and a low one does not make it useless.",
    methodology: QUADRATURE + " for the F test; the regression itself is recomputed independently from covariance and variance rather than from a raw-score formula.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-014 Linear Regression", "STA-013 Correlation"]
  },

  "STA-016": {
    purpose: "Compare means with the right t test, and report the effect size and interval alongside the p-value.",
    scope: "One-sample, paired, and two independent samples with either pooled or Welch treatment.",
    assumptions: [
      "The pooled two-sample test assumes equal variances; Welch does not.",
      "Observations are independent within groups."
    ],
    validation: ["Each group needs at least two observations; a paired test needs matched lengths.", PARSER],
    formula: "The statistic is the difference over its standard error. Welch's degrees of freedom come from the Welch-Satterthwaite equation and are fractional by construction, which a test asserts. Cohen's d uses the pooled standard deviation.",
    boundary: "Welch is the safer choice whenever the groups differ in size or spread, and choosing the pooled test out of habit is a common error. The confidence interval and the effect size are always reported with the p-value, because a significant result on a trivial difference and a non-significant result on a large one are both routine. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " A benchmark pair on deliberately unequal variances shows the pooled and Welch degrees of freedom diverging sharply.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-007 P-Value", "STA-018 ANOVA", "STA-010 Statistical Power"]
  },

  "STA-017": {
    purpose: "Test a contingency table for association, or counts against expectations, with an effect size.",
    scope: "A test of independence on a table, or a goodness-of-fit test on observed against expected counts.",
    assumptions: ["Observations are independent and each falls in exactly one cell."],
    validation: [
      "A table needs at least two rows and two columns, all rows the same length, and counts of zero or more.",
      "Expected counts for a goodness-of-fit test must be above zero.",
      "Where the smallest expected count falls below 5 the result is flagged as unreliable, with a Fisher exact test suggested instead."
    ],
    formula: "Expected cell counts are the row total times the column total over the grand total. Chi-square sums the squared difference over the expected count. Cramer's V is the square root of chi-square over the total times the smaller dimension less one.",
    boundary: "Cramer's V matters as much as the p-value: with a large enough sample a trivial association reaches significance, so chi-square alone is misleading. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " The chi-square right tail is integrated DIRECTLY rather than as one minus the CDF, because subtracting two numbers that agree to five figures destroys the precision of a small p-value.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-007 P-Value", "STA-019 A/B Test"]
  },

  "STA-018": {
    purpose: "Compare several group means at once with a one-way analysis of variance.",
    scope: "Two or more groups of values, of any sizes.",
    assumptions: ["Independent observations, roughly equal variances, and roughly normal residuals."],
    validation: ["At least two groups, each with at least two observations, and enough observations overall.", PARSER],
    formula: "The total sum of squares splits exactly into between-groups and within-groups components, which a test asserts. F is the ratio of their mean squares. Eta squared is the between-groups share of the total.",
    boundary: "A significant F says only that the groups are not ALL the same. It does not say which differ, and comparing every pair afterwards without correcting for multiple testing will manufacture false differences. A benchmark pair with identical group means but a much wider within-group spread is significant in one case and not the other, which is the entire point of the ratio. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " with the F right tail integrated directly to preserve small p-values.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-016 T-Test", "STA-007 P-Value"]
  },

  "STA-019": {
    purpose: "Decide whether a conversion experiment has actually shown anything.",
    scope: "Two groups of visitors and conversions, at a chosen confidence level.",
    assumptions: ["Visitors were assigned at random and each is counted once."],
    validation: [
      "Visitor counts must be whole numbers of 1 or more.",
      "Conversions cannot exceed visitors."
    ],
    formula: "The test statistic uses the POOLED standard error, which assumes the null hypothesis. The confidence interval uses the UNPOOLED standard error, because an interval must not assume the very thing it is estimating. Using one for both is a common and quiet error.",
    boundary: "'Not significant' and 'no difference' are different statements, and a wide interval says which one you have - so the interval, whether it contains zero, and the sample that would be needed are all reported. Stopping a test as soon as it turns significant inflates false positives badly: decide the sample size first and run to it. " + NOT_A_CONCLUSION,
    methodology: QUADRATURE + " Benchmarks include a very large sample with a tiny difference and a small sample with a large apparent one, which behave in opposite ways.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-010 Statistical Power", "STA-009 Margin of Error"]
  },

  "STA-020": {
    purpose: "Measure how far an observation falls from the value it should have taken.",
    scope: "One observed value against one expected value.",
    assumptions: ["The expected value is the reference, not the observation."],
    validation: [
      "A zero expected value is refused, because there is nothing to measure the error against."
    ],
    formula: "The error is the observation less the expected value, divided by the ABSOLUTE expected value so a negative reference does not flip the sign. Both the absolute and the signed percentage are returned.",
    boundary: "Percent error is measured against the expected value and not the observed one; dividing by the observation instead is a common mistake that produces a different number.",
    methodology: "Benchmarks were derived independently and include a negative expected value, which proves the denominator is taken as an absolute value.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["STA-005 Z-Score", "MAT-003 Percentage Change"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
