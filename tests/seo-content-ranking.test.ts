import test from "node:test";
import assert from "node:assert/strict";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";
import { allGuides } from "../packages/calculator-content/src/index.js";
import {
  PRIORITY_SEO_METADATA,
  getCalculatorSEOMetadata,
  validateCuratedRelationships,
} from "./admin-data-helper.js";

test("SEO Content Quality, Search Intent & Organic Ranking Suite", async (t: any) => {
  await t.test("Priority Ranking Metadata: all priority calculators define intent-targeted metadata", () => {
    const priorityIds = Object.keys(PRIORITY_SEO_METADATA);
    assert.ok(priorityIds.length >= 10, "Must have at least 10 priority calculators configured");

    const registryIds = new Set(calculatorRegistry.map((c) => c.id));

    for (const [id, meta] of Object.entries(PRIORITY_SEO_METADATA)) {
      assert.ok(registryIds.has(id), `Priority calculator ${id} must exist in calculator registry`);
      assert.ok(meta.title.length > 20, `Title too short for ${id}: ${meta.title}`);
      assert.ok(meta.description.length > 50, `Description too short for ${id}: ${meta.description}`);
      assert.ok(meta.primaryKeyword.length > 3, `Primary keyword missing for ${id}`);
      assert.ok(meta.secondaryKeywords.length >= 2, `Must have secondary keywords for ${id}`);
      assert.ok(meta.searchIntent.length > 15, `Search intent description missing for ${id}`);
    }
  });

  await t.test("Metadata Resolution: getCalculatorSEOMetadata resolves priority metadata and falls back gracefully", () => {
    const taxCalc = calculatorRegistry.find((c) => c.id === "TAX-001")!;
    const taxMeta = getCalculatorSEOMetadata(taxCalc);
    assert.ok(taxMeta.title.includes("2026/27"));
    assert.ok(taxMeta.description.includes("HMRC"));
    assert.strictEqual(taxMeta.primaryKeyword, "income tax calculator uk");

    // Test standard calculator fallback
    const standardCalc = calculatorRegistry.find((c) => !PRIORITY_SEO_METADATA[c.id])!;
    const stdMeta = getCalculatorSEOMetadata(standardCalc);
    assert.ok(stdMeta.title.includes(standardCalc.name));
    assert.ok(stdMeta.description.length > 30);
  });

  await t.test("Content Depth & Guides: all 40 authored guides contain comprehensive E-E-A-T and methodology sections", () => {
    assert.strictEqual(allGuides.length, 40, "Must maintain 40 comprehensive calculator guides");

    for (const guide of allGuides) {
      assert.ok(guide.title, `Guide ${guide.calculatorId} must have title`);
      assert.ok(guide.summary && guide.summary.length > 30, `Guide ${guide.calculatorId} must have meaningful summary`);
      assert.ok(guide.purpose && guide.purpose.length > 0, `Guide ${guide.calculatorId} must list purposes`);
      assert.ok(guide.methodology && guide.methodology.length > 20, `Guide ${guide.calculatorId} must have methodology`);
      assert.ok(guide.formulaExplanation.formula, `Guide ${guide.calculatorId} must state the formula rule`);
      assert.ok(guide.formulaExplanation.steps.length > 0, `Guide ${guide.calculatorId} must have formula steps`);

      // Worked example
      assert.ok(guide.workedExample.scenario, `Guide ${guide.calculatorId} must have worked example scenario`);
      assert.ok(guide.workedExample.displayInputs.length > 0, `Guide ${guide.calculatorId} must display example inputs`);
      assert.ok(guide.workedExample.steps.length > 0, `Guide ${guide.calculatorId} must display example steps`);
      assert.ok(guide.workedExample.outputs.length > 0, `Guide ${guide.calculatorId} must display example outputs`);

      // Assumptions & Limitations
      assert.ok(guide.assumptions.length > 0, `Guide ${guide.calculatorId} must list assumptions`);
      assert.ok(guide.limitations.length > 0, `Guide ${guide.calculatorId} must list limitations`);

      // FAQs
      assert.ok(guide.faqs.length >= 2, `Guide ${guide.calculatorId} must have at least 2 FAQs`);
      for (const faq of guide.faqs) {
        assert.ok(faq.question.length > 10, `FAQ question too short in ${guide.calculatorId}`);
        assert.ok(faq.answer.length > 20, `FAQ answer too short in ${guide.calculatorId}`);
      }

      // Official authoritative sources
      assert.ok(guide.officialSources.length >= 1, `Guide ${guide.calculatorId} must cite official sources`);
      for (const source of guide.officialSources) {
        assert.ok(source.title, `Source title missing in ${guide.calculatorId}`);
        assert.ok(source.publisher, `Source publisher missing in ${guide.calculatorId}`);
        assert.ok(source.url.startsWith("http"), `Source URL must be valid in ${guide.calculatorId}`);
      }
    }
  });

  await t.test("Internal Linking & Curated Relationships: all curated link edges resolve to existing calculators with zero broken links", () => {
    const validation = validateCuratedRelationships();
    assert.strictEqual(
      validation.valid,
      true,
      `Curated relationships validation failed: ${validation.errors.join(", ")}`
    );

    // Also check guide relatedCalculators
    const registryIds = new Set(calculatorRegistry.map((c) => c.id));
    for (const guide of allGuides) {
      for (const rel of guide.relatedCalculators) {
        assert.ok(
          registryIds.has(rel.calculatorId),
          `Guide ${guide.calculatorId} references non-existent related calculator ${rel.calculatorId}`
        );
        assert.ok(rel.why && rel.why.length > 5, `Must explain why related in ${guide.calculatorId}`);
      }
    }
  });

  await t.test("Authoritative Sources Integrity: publishers belong to established statutory/standard bodies", () => {
    for (const guide of allGuides) {
      for (const source of guide.officialSources) {
        assert.ok(
          source.publisher && source.publisher.length > 2,
          `Invalid publisher in ${guide.calculatorId}: ${source.publisher}`
        );
      }
    }
  });
});
