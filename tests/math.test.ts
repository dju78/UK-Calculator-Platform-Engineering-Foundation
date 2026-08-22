import { test } from 'node:test';
import * as assert from 'node:assert';
import { evaluateExpression, percentageCalculator, ratioCalculator, fractionCalculator } from '../packages/calculation-engine/src/math/core.js';

test('MAT-002: evaluateExpression', async (t) => {
  await t.test('handles basic arithmetic with precedence', () => {
    assert.strictEqual(evaluateExpression('2 + 3 * 4'), 14);
    assert.strictEqual(evaluateExpression('(2 + 3) * 4'), 20);
  });

  await t.test('handles negatives', () => {
    assert.strictEqual(evaluateExpression('-5 + 3'), -2);
    assert.strictEqual(evaluateExpression('-(2 + 3)'), -5);
  });

  await t.test('handles division by zero', () => {
    assert.throws(() => evaluateExpression('5 / 0'), /Result is not a finite number|divide by zero/i);
  });

  await t.test('handles malformed expressions', () => {
    assert.throws(() => evaluateExpression('2 + * 3'), /Evaluation error/);
    assert.throws(() => evaluateExpression('2 + a'), /Evaluation error/);
  });
});

test('MAT-003: percentageCalculator', async (t) => {
  await t.test('percent of value', () => {
    assert.strictEqual(percentageCalculator({ mode: 'percent_of', pct: 20, value: 50 }).result, 10);
  });

  await t.test('is what percent', () => {
    assert.strictEqual(percentageCalculator({ mode: 'is_what_percent', a: 10, b: 50 }).result_percent, 20);
    assert.throws(() => percentageCalculator({ mode: 'is_what_percent', a: 10, b: 0 }), /Divide by zero/);
  });

  await t.test('is percent of what', () => {
    assert.strictEqual(percentageCalculator({ mode: 'is_percent_of_what', a: 10, pct: 20 }).result, 50);
    assert.throws(() => percentageCalculator({ mode: 'is_percent_of_what', a: 10, pct: 0 }), /Divide by zero/);
  });

  await t.test('percent change', () => {
    assert.strictEqual(percentageCalculator({ mode: 'percent_change', old: 50, new: 60 }).result_percent, 20);
    assert.throws(() => percentageCalculator({ mode: 'percent_change', old: 0, new: 60 }), /Divide by zero/);
  });
});

test('MAT-005: ratioCalculator', async (t) => {
  await t.test('simplifies ratio', () => {
    assert.strictEqual(ratioCalculator({ a: 10, b: 15, d: 1 }).simplified, '2:3');
    assert.throws(() => ratioCalculator({ a: 0, b: 0, d: 1 }), /Divide by zero/);
  });

  await t.test('scales ratio', () => {
    assert.strictEqual(ratioCalculator({ a: 2, b: 3, scale: 4 }).equivalent, '8:12');
  });

  await t.test('finds missing value', () => {
    assert.strictEqual(ratioCalculator({ a: 2, b: 3, c: 4, d: null }).d, 6);
    assert.throws(() => ratioCalculator({ a: 0, b: 3, c: 4, d: null }), /Divide by zero/);
  });
});

test('MAT-006: fractionCalculator', async (t) => {
  await t.test('adds fractions', () => {
    const result = fractionCalculator({ a: '1/2', b: '1/4', op: '+' });
    assert.strictEqual(result.fraction, '3/4');
    assert.strictEqual(result.decimal, 0.75);
  });

  await t.test('subtracts fractions', () => {
    const result = fractionCalculator({ a: '1/2', b: '1/4', op: '-' });
    assert.strictEqual(result.fraction, '1/4');
    assert.strictEqual(result.decimal, 0.25);
  });

  await t.test('multiplies fractions', () => {
    const result = fractionCalculator({ a: '1/2', b: '1/4', op: '*' });
    assert.strictEqual(result.fraction, '1/8');
    assert.strictEqual(result.decimal, 0.125);
  });

  await t.test('divides fractions', () => {
    const result = fractionCalculator({ a: '1/2', b: '1/4', op: '/' });
    assert.strictEqual(result.fraction, '2');
    assert.strictEqual(result.decimal, 2);
    assert.throws(() => fractionCalculator({ a: '1/2', b: '0/1', op: '/' }), /Divide by zero/);
  });

  await t.test('handles divide by zero in denominator', () => {
    assert.throws(() => fractionCalculator({ a: '1/0', b: '1/4', op: '+' }), /Denominator cannot be zero/);
  });
});
