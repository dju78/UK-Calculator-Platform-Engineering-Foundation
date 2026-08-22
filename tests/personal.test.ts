import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { calculateEffectiveApr, calculateCreditCardPayoff, calculateDebtPayoff, calculateBudget } from '../packages/calculation-engine/src/finance/personal/core.js';

describe('Personal Finance Core Math', () => {
  describe('calculateEffectiveApr (FIN-006)', () => {
    test('standard case', () => {
      assert.ok(Math.abs(calculateEffectiveApr(0.005, 12) - 0.06167781) < 1e-8);
    });

    test('zero rate', () => {
      assert.strictEqual(calculateEffectiveApr(0, 12), 0);
    });
  });

  describe('calculateCreditCardPayoff (FIN-009)', () => {
    test('standard payoff', () => {
      const res = calculateCreditCardPayoff(3000, 0.249, 150);
      assert.strictEqual(res.months, 27);
      assert.ok(Math.abs(res.totalInterest - 915.95) < 0.01);
    });

    test('never pays off', () => {
      const res = calculateCreditCardPayoff(1000, 0.24, 10);
      assert.strictEqual(res.months, Infinity);
      assert.strictEqual(res.totalInterest, Infinity);
    });

    test('zero balance', () => {
      const res = calculateCreditCardPayoff(0, 0.2, 100);
      assert.strictEqual(res.months, 0);
      assert.strictEqual(res.totalInterest, 0);
    });

    test('zero APR', () => {
      const res = calculateCreditCardPayoff(1200, 0, 100);
      assert.strictEqual(res.months, 12);
      assert.strictEqual(res.totalInterest, 0);
    });
    
    test('high payment', () => {
      const res = calculateCreditCardPayoff(500, 0.2, 600);
      assert.strictEqual(res.months, 1);
      assert.ok(Math.abs(res.totalInterest - 8.33) < 0.01);
    });
  });

  describe('calculateDebtPayoff (FIN-011)', () => {
    const debts = [
      { balance: 1000, apr: 0.2, min_payment: 50 },
      { balance: 2000, apr: 0.1, min_payment: 60 }
    ];

    test('avalanche', () => {
      const d = debts.map(x => ({...x}));
      const res = calculateDebtPayoff(d, 100, 'avalanche');
      assert.strictEqual(res.months, 16);
      assert.ok(Math.abs(res.totalInterest - 246.01) < 0.01);
    });

    test('snowball', () => {
      const d = debts.map(x => ({...x}));
      const res = calculateDebtPayoff(d, 100, 'snowball');
      assert.strictEqual(res.months, 16);
      assert.ok(Math.abs(res.totalInterest - 246.01) < 0.01);
    });

    test('empty debts', () => {
      const res = calculateDebtPayoff([], 100, 'avalanche');
      assert.strictEqual(res.months, 0);
      assert.strictEqual(res.totalInterest, 0);
    });

    test('zero interest', () => {
      const res = calculateDebtPayoff([{ balance: 600, apr: 0, min_payment: 50 }], 50, 'avalanche');
      assert.strictEqual(res.months, 6);
      assert.strictEqual(res.totalInterest, 0);
    });
    
    test('no extra payment', () => {
      const res = calculateDebtPayoff([
        { balance: 1000, apr: 0.12, min_payment: 100 },
        { balance: 500, apr: 0.18, min_payment: 50 }
      ], 0, 'avalanche');
      assert.strictEqual(res.months, 11);
      assert.ok(Math.abs(res.totalInterest - 104.8) < 0.1);
    });
  });

  describe('calculateBudget (FIN-013)', () => {
    test('balanced', () => {
      const res = calculateBudget(3000, 1500, 800, 300);
      assert.strictEqual(res.surplus, 400);
      assert.strictEqual(res.savingsRate, 0.1);
    });

    test('deficit', () => {
      const res = calculateBudget(2500, 1800, 900, 0);
      assert.strictEqual(res.surplus, -200);
      assert.strictEqual(res.savingsRate, 0);
    });

    test('zero income', () => {
      const res = calculateBudget(0, 100, 0, 0);
      assert.strictEqual(res.surplus, -100);
      assert.strictEqual(res.savingsRate, null);
    });
  });
});
