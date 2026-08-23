import test from 'node:test';
import assert from 'node:assert';
import { business } from '../packages/calculation-engine/src/index.js';

test('Margin Calculator (BUS-001)', async (t: any) => {
  await t.test('normal profit', () => {
    assert.strictEqual(business.grossProfit(60, 100), 40);
  });
  await t.test('zero profit', () => {
    assert.strictEqual(business.grossProfit(100, 100), 0);
  });
  await t.test('loss', () => {
    assert.strictEqual(business.grossProfit(120, 100), -20);
  });
  await t.test('margin', () => {
    assert.strictEqual(business.margin(60, 100), 0.4);
  });
  await t.test('markup', () => {
    assert.ok(Math.abs(business.markup(60, 100)! - 0.666666) < 0.0001);
  });
  await t.test('margin != markup', () => {
    assert.notStrictEqual(business.margin(60, 100), business.markup(60, 100));
  });
  await t.test('zero selling-price denominator', () => {
    assert.throws(() => business.margin(60, 0), /Invalid denominator: selling price cannot be zero/);
  });
  await t.test('zero cost denominator', () => {
    assert.strictEqual(business.markup(0, 100), null);
  });
  await t.test('target margin', () => {
    assert.strictEqual(business.requiredPriceForMargin(50, 0.5), 100);
  });
  await t.test('invalid target margin >=100%', () => {
    assert.throws(() => business.requiredPriceForMargin(50, 1), /Target margin must be less than 100%/);
  });
  await t.test('invalid NaN/Infinity', () => {
    assert.throws(() => business.grossProfit(NaN, 100), /Invalid inputs/);
    assert.throws(() => business.margin(60, Infinity), /Invalid inputs/);
  });
});

test('Break-Even Calculator (BUS-006)', async (t: any) => {
  await t.test('normal break-even', () => {
    assert.strictEqual(business.breakEvenUnits(10000, 50, 30), 500);
  });
  await t.test('rounded-up units', () => {
    assert.strictEqual(business.breakEvenUnits(1000, 30, 17), 77);
  });
  await t.test('zero fixed cost', () => {
    assert.strictEqual(business.breakEvenUnits(0, 50, 30), 0);
  });
  await t.test('price = variable cost', () => {
    assert.throws(() => business.breakEvenUnits(1000, 20, 20), /No finite break-even/);
  });
  await t.test('price < variable cost', () => {
    assert.throws(() => business.breakEvenUnits(1000, 10, 20), /No finite break-even/);
  });
  await t.test('invalid values', () => {
    assert.throws(() => business.breakEvenUnits(-1000, 50, 30), /Invalid inputs/);
    assert.throws(() => business.breakEvenUnits(1000, NaN, 30), /Invalid inputs/);
  });
  await t.test('contribution reconciliation', () => {
    assert.strictEqual(business.contributionMargin(50, 30), 20);
  });
});

test('Discount Calculator (BUS-008)', async (t: any) => {
  await t.test('normal discount', () => {
    const res = business.applyDiscount(100, 0.2);
    assert.strictEqual(res.discountAmount, 20);
    assert.strictEqual(res.salePrice, 80);
  });
  await t.test('zero discount', () => {
    const res = business.applyDiscount(100, 0);
    assert.strictEqual(res.discountAmount, 0);
    assert.strictEqual(res.salePrice, 100);
  });
  await t.test('100% discount', () => {
    const res = business.applyDiscount(100, 1);
    assert.strictEqual(res.discountAmount, 100);
    assert.strictEqual(res.salePrice, 0);
  });
  await t.test('discount >100% rejection', () => {
    assert.throws(() => business.applyDiscount(100, 1.1), /Discount rate must be between 0 and 1/);
  });
  await t.test('negative discount rejection', () => {
    assert.throws(() => business.applyDiscount(100, -0.1), /Discount rate must be between 0 and 1/);
  });
  await t.test('original-price reverse calculation', () => {
    const res = business.inferDiscount(200, 150);
    assert.strictEqual(res.discountRate, 0.25);
    assert.strictEqual(res.discountAmount, 50);
  });
  await t.test('original price = 0 handling', () => {
    assert.throws(() => business.inferDiscount(0, 100), /Cannot infer discount when original price is zero/);
  });
  await t.test('NaN/Infinity rejection', () => {
    assert.throws(() => business.applyDiscount(NaN, 0.2), /Invalid inputs/);
    assert.throws(() => business.inferDiscount(100, Infinity), /Invalid inputs/);
  });
});

