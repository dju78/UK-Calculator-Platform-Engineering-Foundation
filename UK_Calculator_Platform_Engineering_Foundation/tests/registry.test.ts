import test from "node:test";
import assert from "node:assert/strict";
import { wave1Registry, validateRegistry, getCalculatorDefinition } from "../packages/calculator-registry/src/index.js";

test("Wave 1 registry contains exactly 55 calculators", () => {
  assert.equal(wave1Registry.length, 55);
});

test("Wave 1 registry has no duplicate IDs or slugs and minimum benchmark coverage", () => {
  assert.deepEqual(validateRegistry(), []);
});

test("Compound Interest registry record is implemented", () => {
  const item = getCalculatorDefinition("INV-002");
  assert.ok(item);
  assert.equal(item?.implementationStatus, "implemented");
  assert.equal(item?.slug, "compound-interest-calculator");
});
