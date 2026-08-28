import test from "node:test";
import assert from "node:assert/strict";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";
import { getUKRuleset, listUKRulesets } from "../packages/rules-uk/src/index.js";
import type { CalculatorDefinition } from "../packages/calculator-registry/src/types.js";

test("Admin Console Data Integrity Suite", async (t: any) => {
  await t.test("Calculator inventory counts derive exact platform figures", () => {
    assert.strictEqual(calculatorRegistry.length, 253, "Total calculators must equal 253");
    const categories = new Set(calculatorRegistry.map((c) => c.category));
    assert.strictEqual(categories.size, 19, "Total categories must equal 19");

    const wave1 = calculatorRegistry.filter((c) => c.launchWave === "Wave 1");
    const wave2 = calculatorRegistry.filter((c) => c.launchWave === "Wave 2");
    const wave3 = calculatorRegistry.filter((c) => c.launchWave === "Wave 3");

    assert.strictEqual(wave1.length, 55, "Wave 1 must contain 55 calculators");
    assert.strictEqual(wave2.length, 188, "Wave 2 must contain 188 calculators");
    assert.strictEqual(wave3.length, 10, "Wave 3 must contain 10 calculators");

    const implemented = calculatorRegistry.filter((c) => c.implementationStatus === "implemented");
    const verified = calculatorRegistry.filter((c) => c.status === "verified");

    assert.strictEqual(implemented.length, 253, "All 253 calculators must be implemented");
    assert.strictEqual(verified.length, 253, "All 253 calculators must be verified");
  });

  await t.test("All 19 categories are defined and routable", () => {
    const categories = Array.from(new Set(calculatorRegistry.map((c) => c.category))).sort();
    assert.strictEqual(categories.length, 19);
    assert.ok(categories.includes("UK Tax & Salary"));
    assert.ok(categories.includes("Mortgages & Property"));
    assert.ok(categories.includes("Investing & Wealth"));
    assert.ok(categories.includes("Pensions & Retirement"));
    assert.ok(categories.includes("ISA & Tax Wrappers"));
  });

  await t.test("Ruleset uk-2026-27-v1 is approved and effective for 2026/27", () => {
    const rules = getUKRuleset("uk-2026-27-v1");
    assert.strictEqual(rules.ruleset_id, "uk-2026-27-v1");
    assert.strictEqual(rules.tax_year, "2026/27");
    assert.strictEqual(rules.status, "approved");
    assert.strictEqual(rules.effective_from, "2026-04-06");
    assert.strictEqual(rules.effective_to, "2027-04-05");
    assert.strictEqual(rules.checked_at, "2026-08-22");
    assert.ok(rules.income_tax_england_wales_ni);
    assert.ok(rules.income_tax_scotland);
    assert.ok(rules.isa);
  });

  await t.test("Rules-sensitive calculators correctly flagged in registry", () => {
    const rulesSensitive = calculatorRegistry.filter((c) => c.rulesSensitive);
    assert.strictEqual(rulesSensitive.length, 51, "Platform must have exactly 51 rules-sensitive calculators");

    for (const c of rulesSensitive) {
      assert.strictEqual(c.rulesSensitive, true);
      assert.ok(c.id.length > 0);
      assert.ok(c.slug.length > 0);
    }
  });

  await t.test("Benchmark counts meet minimum verification threshold of 5 cases", () => {
    for (const c of calculatorRegistry) {
      if (c.status === "verified") {
        assert.ok(c.benchmarkCount >= 5, `Calculator ${c.id} must have >= 5 benchmark cases (has ${c.benchmarkCount})`);
      }
    }
  });

  await t.test("Slugs and IDs are unique across all 253 calculators", () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const c of calculatorRegistry) {
      assert.ok(!ids.has(c.id), `Duplicate id ${c.id}`);
      assert.ok(!slugs.has(c.slug), `Duplicate slug ${c.slug}`);
      ids.add(c.id);
      slugs.add(c.slug);
    }

    assert.strictEqual(ids.size, 253);
    assert.strictEqual(slugs.size, 253);
  });
});