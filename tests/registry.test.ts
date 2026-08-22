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

test("Registry engine implementation matches verified status", async () => {
  const { implementedCalculatorIds } = await import("../packages/calculation-engine/src/engine.js");
  const implemented = implementedCalculatorIds();
  
  for (const item of wave1Registry) {
    const hasEngine = implemented.includes(item.id);
    const isImpl = item.implementationStatus === "implemented";
    const isVer = item.status === "verified";
    
    if (isVer) {
      assert.ok(hasEngine, item.id + " is verified but missing engine handler");
      assert.ok(isImpl, item.id + " is verified but implementationStatus is not implemented");
    }
  }
});
