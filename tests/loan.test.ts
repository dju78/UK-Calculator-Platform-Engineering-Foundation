import { test } from "node:test";
import assert from "node:assert";
import { calculatePmt, calculateAmortisation } from "../packages/calculation-engine/src/finance/loan/core.js";

test("Loan core math - Standard repayment", () => {
  const pmt = calculatePmt(10000, 0.06, 5); // 5 years
  assert.ok(Math.abs(pmt - 193.33) < 0.01);
});

test("Loan core math - Zero interest", () => {
  const pmt = calculatePmt(10000, 0, 5); // 5 years
  assert.strictEqual(pmt, 10000 / 60);
});

test("Loan amortisation - Standard", () => {
  const result = calculateAmortisation(10000, 0.06, 5);
  const schedule = result.schedule;
  assert.strictEqual(schedule.length, 60);
  
  // First payment
  assert.ok(Math.abs(schedule[0].interest - 50.00) < 0.01); // 10000 * 0.06 / 12
  
  // Last payment closing balance
  assert.ok(Math.abs(schedule[59].balance) < 0.01);
});

test("Loan amortisation - Zero interest", () => {
  const result = calculateAmortisation(10000, 0, 5);
  const schedule = result.schedule;
  assert.strictEqual(schedule.length, 60);
  
  // First payment
  assert.strictEqual(schedule[0].interest, 0);
  assert.strictEqual(schedule[0].principal, 10000 / 60);
  assert.ok(Math.abs(schedule[59].balance) < 0.01);
});

test("Loan amortisation - Overpayments", () => {
  // $10k, 6%, 5 yrs (60 months) -> normal PMT is 193.33
  // If we overpay $100/mo, it should finish faster
  const result = calculateAmortisation(10000, 0.06, 5, 100);
  const schedule = result.schedule;
  assert.ok(schedule.length < 60);
  assert.ok(schedule.length > 30); // It will finish in ~32-35 months
  
  // Ensure closing balance of last period is basically 0
  const last = schedule[schedule.length - 1];
  assert.ok(Math.abs(last.balance) < 0.01);
});

test("Loan core math - Interest Only", () => {
  // $10k, 6%, 5 yrs (60 months)
  const pmt = calculatePmt(10000, 0.06, 5, "interest-only");
  assert.strictEqual(pmt, 50.00); // 10000 * 0.06 / 12
});
