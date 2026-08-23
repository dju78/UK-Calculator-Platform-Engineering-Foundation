import test from "node:test";
import assert from "node:assert";
import { mean, median, mode, hasDistinctMode, min, max, range, variance, standardDeviation } from "../packages/calculation-engine/src/statistics/descriptive.js";
import { normalCDF, inverseNormalCDF } from "../packages/calculation-engine/src/statistics/distributions.js";
import { confidenceInterval, sampleSizeProportion } from "../packages/calculation-engine/src/statistics/inference.js";
import { linearRegression } from "../packages/calculation-engine/src/statistics/regression.js";
import { parseDataset } from "../packages/calculation-engine/src/statistics/parser.js";

const closeTo = (actual: number, expected: number, tolerance = 1e-4) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be close to ${expected} within ${tolerance}`
  );
};

test("Descriptive Statistics - invariants and basics", () => {
  const data = [1, 2, 3, 4, 5];
  const m = mean(data);
  const med = median(data);
  
  assert.strictEqual(m, 3);
  assert.strictEqual(med, 3);
  assert.strictEqual(min(data), 1);
  assert.strictEqual(max(data), 5);
  assert.strictEqual(range(data), 4);
  
  // Median must be between min and max
  assert.ok(med >= min(data) && med <= max(data));
  
  // Variance/SD invariants
  const v = variance(data, true);
  const sd = standardDeviation(data, true);
  assert.ok(v >= 0);
  assert.ok(sd >= 0);
});

test("Descriptive Statistics - median odd/even", () => {
  assert.strictEqual(median([1, 2, 3]), 2);
  assert.strictEqual(median([1, 2, 3, 4]), 2.5);
});

test("Descriptive Statistics - mode", () => {
  assert.deepStrictEqual(mode([1, 2, 2, 3]), [2]);
  assert.deepStrictEqual(mode([1, 2, 2, 3, 3, 4]), [2, 3]);
  // Convention: the mode is every value at the maximum frequency, so when all
  // values tie they are all modes. This resolves a contradiction where this
  // assertion said [] while the canonical STA-001 benchmark expected
  // [1,2,3,4] - a disagreement that stayed hidden because the old benchmark
  // runner never compared array outputs at all. `hasDistinctMode` carries the
  // "no meaningful mode" information that the empty array used to imply.
  assert.deepStrictEqual(mode([1, 2, 3, 4]), [1, 2, 3, 4]);
  assert.equal(hasDistinctMode([1, 2, 3, 4]), false);
  assert.equal(hasDistinctMode([1, 2, 2, 3]), true);
  assert.deepStrictEqual(mode([7]), [7]);
});

test("Descriptive Statistics - variance and SD (pop vs sample)", () => {
  const data = [2, 4, 4, 4, 5, 5, 7, 9];
  closeTo(variance(data, false), 4); // Population variance
  closeTo(standardDeviation(data, false), 2); // Population SD
  
  closeTo(variance(data, true), 4.57142857); // Sample variance
  closeTo(standardDeviation(data, true), 2.1380899); // Sample SD
});

test("Dataset Parsing", () => {
  assert.deepStrictEqual(parseDataset("1, 2, 3"), [1, 2, 3]);
  assert.deepStrictEqual(parseDataset("1 \n 2 \n 3"), [1, 2, 3]);
  assert.deepStrictEqual(parseDataset([1, 2, 3]), [1, 2, 3]);
  assert.deepStrictEqual(parseDataset("1, foo, 2, NaN, 3"), [1, 2, 3]); // Ignore invalid
  assert.deepStrictEqual(parseDataset(""), []);
});

test("Inference - Confidence Interval", () => {
  const ci = confidenceInterval(100, 15, 100, 0.95);
  // Lower bound <= Upper bound
  assert.ok(ci.lower <= ci.upper);
  closeTo(ci.lower, 97.06, 0.05);
  closeTo(ci.upper, 102.94, 0.05);
});

test("Inference - Sample Size", () => {
  // Positive integer check
  const n = sampleSizeProportion(0.95, 0.05, 0.5);
  assert.ok(Number.isInteger(n));
  assert.ok(n > 0);
  assert.strictEqual(n, 385);
  
  // Finite population
  const nFinite = sampleSizeProportion(0.95, 0.05, 0.5, 1000);
  assert.strictEqual(nFinite, 278);
});

test("Regression - basics and invariants", () => {
  const x = [1, 2, 3, 4, 5];
  const y = [2, 4, 5, 4, 5];
  
  const reg = linearRegression(x, y);
  closeTo(reg.slope, 0.6);
  closeTo(reg.intercept, 2.2);
  closeTo(reg.r2, 0.6);
  
  // R2 bounds
  assert.ok(reg.r2 >= 0 && reg.r2 <= 1);
  
  // Correlation bounds
  assert.ok(reg.r >= -1 && reg.r <= 1);
  
  // Residuals sum to approximately 0
  const sumRes = reg.residuals.reduce((a, b) => a + b, 0);
  closeTo(sumRes, 0, 1e-8);
});

test("Regression - perfect relationships", () => {
  const x = [1, 2, 3];
  
  // Perfect positive
  const reg1 = linearRegression(x, [2, 4, 6]);
  closeTo(reg1.r2, 1);
  closeTo(reg1.r, 1);
  
  // Perfect negative
  const reg2 = linearRegression(x, [10, 9, 8]);
  closeTo(reg2.r2, 1);
  closeTo(reg2.r, -1);
});

test("Regression - errors", () => {
  assert.throws(() => linearRegression([1, 2], [1]), /same number of observations/);
  assert.throws(() => linearRegression([1], [1]), /requires at least 2 observations/);
  assert.throws(() => linearRegression([1, 1, 1], [1, 2, 3]), /zero variance/);
});
