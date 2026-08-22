import test from 'node:test';
import assert from 'node:assert';
import { business } from '../packages/calculation-engine/src/index.js';

test('Margin Calculator', async (t) => {
  await t.test('grossProfit', () => {
    assert.strictEqual(business.grossProfit(60, 100), 40);
  });
  await t.test('margin', () => {
    assert.strictEqual(business.margin(60, 100), 0.4);
    assert.strictEqual(business.margin(0, 100), 1);
  });
  await t.test('markup', () => {
    assert.ok(Math.abs(business.markup(60, 100)! - 0.666666) < 0.0001);
    assert.strictEqual(business.markup(0, 100), null);
  });
  await t.test('requiredPriceForMargin', () => {
    assert.strictEqual(business.requiredPriceForMargin(50, 0.5), 100);
  });
});

test('Break-Even Calculator', async (t) => {
  await t.test('breakEvenUnits', () => {
    assert.strictEqual(business.breakEvenUnits(10000, 50, 30), 500);
    assert.strictEqual(business.breakEvenUnits(0, 50, 30), 0);
    assert.strictEqual(business.breakEvenUnits(1000, 30, 17), 77);
  });
  await t.test('breakEvenRevenue', () => {
    assert.strictEqual(business.breakEvenRevenue(10000, 50, 30), 25000);
    assert.strictEqual(business.breakEvenRevenue(1000, 30, 17), 2310);
  });
  await t.test('No finite break-even', () => {
    assert.throws(() => business.breakEvenUnits(1000, 20, 20), /No finite break-even/);
  });
});

test('Discount Calculator', async (t) => {
  await t.test('applyDiscount', () => {
    const res = business.applyDiscount(100, 0.2);
    assert.strictEqual(res.discountAmount, 20);
    assert.strictEqual(res.salePrice, 80);
  });
  await t.test('inferDiscount', () => {
    const res = business.inferDiscount(200, 150);
    assert.strictEqual(res.discountRate, 0.25);
    assert.strictEqual(res.discountAmount, 50);
  });
});

