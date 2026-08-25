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

// ---------------------------------------------------------------------------
// Feature gating
// ---------------------------------------------------------------------------

test("the publish gate needs evidence, not just an engine handler", async (t: any) => {
  const { publishedRegistry, calculatorRegistry } = await import(
    "../packages/calculator-registry/src/index.js"
  );
  const { implementedCalculatorIds } = await import(
    "../packages/calculation-engine/src/engine.js"
  );

  const implemented = implementedCalculatorIds();
  const published = publishedRegistry(implemented);

  await t.test("nothing unverified is published", () => {
    for (const c of published) {
      if (c.launchWave === "Wave 1") continue;
      assert.strictEqual(
        c.status,
        "verified",
        `${c.id} is published while its registry status is "${c.status}"`
      );
    }
  });

  await t.test("a handler alone does not publish a calculator", () => {
    // A handler is written before the benchmarks, the field definitions and
    // the specification. If having one were enough, a calculator would go live
    // with no input fields the moment its engine code was wired up.
    const handlerButNotVerified = calculatorRegistry.filter(
      (c: any) =>
        c.launchWave === "Wave 2" && implemented.includes(c.id) && c.status !== "verified"
    );
    const publishedIds = new Set(published.map((c: any) => c.id));
    for (const c of handlerButNotVerified) {
      assert.ok(
        !publishedIds.has(c.id),
        `${c.id} has a handler but no verification, and must not be published`
      );
    }
  });

  await t.test("every published Wave 2 calculator has a handler", () => {
    for (const c of published) {
      if (c.launchWave === "Wave 1") continue;
      assert.ok(implemented.includes(c.id), `${c.id} is published with no engine handler`);
    }
  });
});

// ---------------------------------------------------------------------------
// Wave 2 completeness
// ---------------------------------------------------------------------------

test("Wave 2 is complete and every verified calculator carries its full evidence", async (t: any) => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { wave2Registry, calculatorRegistry } = await import(
    "../packages/calculator-registry/src/index.js"
  );
  const { implementedCalculatorIds } = await import(
    "../packages/calculation-engine/src/engine.js"
  );

  const fixtures = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "packages/test-fixtures/fixtures/wave2-benchmarks.json"),
      "utf8"
    )
  ) as Record<string, unknown[]>;

  // The field definitions live in the web app, which compiles to CommonJS and
  // therefore cannot be imported from this ES module test. Reading the source
  // is the honest alternative: it verifies a field block exists for each id,
  // which is the property that matters, and the E2E parity harness separately
  // drives those same definitions through the real UI.
  const mappingSource =
    fs.readFileSync(
      path.join(process.cwd(), "apps/web/src/components/calculators/wave2FieldMappings.ts"),
      "utf8"
    ) +
    fs.readFileSync(
      path.join(process.cwd(), "apps/web/src/components/calculators/fieldMappings.ts"),
      "utf8"
    );

  const implemented = new Set(implementedCalculatorIds());

  await t.test("the registry holds exactly 188 Wave 2 calculators", () => {
    assert.strictEqual(wave2Registry.length, 188);
  });

  await t.test("no duplicate IDs or slugs across both waves", () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const c of calculatorRegistry) {
      assert.ok(!ids.has(c.id), `duplicate id ${c.id}`);
      assert.ok(!slugs.has(c.slug), `duplicate slug ${c.slug}`);
      ids.add(c.id);
      slugs.add(c.slug);
    }
  });

  // Every one of the kinds of evidence, asserted for every verified
  // calculator. A calculator is not "done" because its engine runs: it is done
  // when a reader can find out what it claims, a benchmark proves the claim,
  // and a form exists to drive it.
  await t.test("every verified Wave 2 calculator has all its evidence", () => {
    const missing: string[] = [];
    for (const c of wave2Registry) {
      if (c.status !== "verified") continue;

      if (!implemented.has(c.id)) missing.push(`${c.id}: no engine handler`);
      if (c.implementationStatus !== "implemented") {
        missing.push(`${c.id}: implementationStatus is "${c.implementationStatus}"`);
      }

      const cases = fixtures[c.id] ?? [];
      if (cases.length < 5) {
        missing.push(`${c.id}: only ${cases.length} benchmark cases, minimum is 5`);
      }
      if (c.benchmarkCount !== cases.length) {
        missing.push(
          `${c.id}: registry declares ${c.benchmarkCount} benchmarks but the fixtures hold ${cases.length}`
        );
      }

      if (!mappingSource.includes(`"${c.id}": [`)) {
        missing.push(`${c.id}: no UI field definitions, so the page would render no form`);
      }

      const specPath = path.join(process.cwd(), "docs/specs/wave2", `${c.id}.md`);
      if (!fs.existsSync(specPath)) missing.push(`${c.id}: no specification`);
    }
    assert.deepStrictEqual(missing, []);
  });

  await t.test("the whole platform is 243 calculators", () => {
    assert.strictEqual(calculatorRegistry.length, 243);
  });
});
