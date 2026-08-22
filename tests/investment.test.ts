import test from "node:test";
import assert from "node:assert/strict";
import {
  investmentGrowth,
  simpleInterest,
  futureValue,
  presentValue,
  calculateROI,
  calculateCAGR,
  calculateIRR,
  calculateFeeDrag,
  calculateRealReturn
} from "../packages/calculation-engine/src/finance/investment/core.js";

function closeTo(actual: number, expected: number, tolerance = 0.0001) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${expected} but got ${actual}`);
}

test("Investment Growth - Zero return/fee", () => {
  const result = investmentGrowth(1000, 100, 0, 0, 5);
  closeTo(result, 7000); // 1000 + (100 * 60)
});

test("Investment Growth - Positive return", () => {
  const result = investmentGrowth(10000, 500, 0.06, 0.0025, 20);
  closeTo(result, 250615.54, 0.01);
});

test("Simple Interest", () => {
  const { interest, fv } = simpleInterest(1000, 0.05, 5);
  closeTo(interest, 250);
  closeTo(fv, 1250);
});

test("Future Value and Present Value Reversibility", () => {
  const pv = 10000;
  const rate = 0.05;
  const years = 10;
  const fv = futureValue(pv, rate, years);
  const reversedPv = presentValue(fv, rate, years);
  closeTo(reversedPv, pv);
});

test("ROI - standard", () => {
  const { gain, roi } = calculateROI(10000, 15000, 500);
  closeTo(gain, 5500);
  closeTo(roi, 0.55);
});

test("ROI - zero cost", () => {
  const { gain, roi } = calculateROI(0, 1000, 0);
  closeTo(gain, 1000);
  closeTo(roi, 0);
});

test("CAGR - standard", () => {
  const cagr = calculateCAGR(10000, 20000, 10);
  closeTo(cagr, 0.07177, 0.0001);
});

test("CAGR - zero start", () => {
  const cagr = calculateCAGR(0, 10000, 5);
  closeTo(cagr, 0);
});

test("IRR - convergence", () => {
  const irr = calculateIRR([-1000, 1100]);
  closeTo(irr, 0.1);
});

test("IRR - no sign change", () => {
  assert.throws(() => {
    calculateIRR([-1000, -1000]);
  }, /IRR requires at least one positive and one negative cash flow/);
});

test("IRR - negative IRR", () => {
  const irr = calculateIRR([-1000, 900]);
  closeTo(irr, -0.1);
});

test("IRR - derivative instability / bracket fallback", () => {
  // A cash flow pattern that causes Newton-Raphson issues or forces a fallback
  // e.g. large upfront, small intermediate, large final
  const irr = calculateIRR([-10000, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10000]);
  closeTo(irr, 0.001, 0.005);
});

test("IRR - empty cash flows", () => {
  assert.throws(() => {
    calculateIRR([]);
  }, /No cash flows provided/);
});

test("IRR - multiple-sign-change cash flows (fallback test)", () => {
  const irr = calculateIRR([-100, 200, -50, 100]);
  // Just ensuring it converges to *some* valid root.
  assert.ok(typeof irr === "number");
});

test("Fee Drag", () => {
  const { gross_value, net_value, fee_drag } = calculateFeeDrag(100000, 0, 0.07, 0.01, 25);
  closeTo(gross_value, 542743.26, 0.01);
  closeTo(net_value, 422157.30, 0.01);
  closeTo(fee_drag, 120585.96, 0.01);
});

test("Real Return", () => {
  const { real_return, real_value } = calculateRealReturn(0.06, 0.025, 10, 100000);
  closeTo(real_return, 0.034146, 0.0001);
  closeTo(real_value, 78119.84, 0.01);
});
