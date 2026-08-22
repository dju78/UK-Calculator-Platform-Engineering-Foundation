import test from "node:test";
import assert from "node:assert/strict";
import { calculateProgressiveTax } from "../src/progressive-bands.js";

test("calculateProgressiveTax calculates basic tax correctly", () => {
  const bands = [
    { to: 1000, rate: 0 },
    { from: 1001, to: 5000, rate: 0.1 },
    { from: 5001, rate: 0.2 }
  ];

  assert.equal(calculateProgressiveTax(500, bands), 0);
  assert.equal(calculateProgressiveTax(1000, bands), 0);
  assert.equal(calculateProgressiveTax(2000, bands), 1000 * 0.1); // 100
  assert.equal(calculateProgressiveTax(5000, bands), 4000 * 0.1); // 400
  assert.equal(calculateProgressiveTax(6000, bands), (4000 * 0.1) + (1000 * 0.2)); // 400 + 200 = 600
});
