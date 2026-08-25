/**
 * Phase 2 content validation.
 *
 * The point of this suite is that editorial content cannot quietly rot. The
 * strongest check is the worked-example one: every published figure is
 * re-derived by running the real calculation engine with the exact inputs the
 * guide claims produced it. If the engine moves, or a figure was mistyped, the
 * suite fails rather than leaving a wrong number on a public page.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  allGuides,
  getCalculatorGuide,
  TOP_40_IDS,
  TOP_40_GROUPS,
} from "../packages/calculator-content/src/index.js";
import { publishedRegistry } from "../packages/calculator-registry/src/index.js";
import { calculate, implementedCalculatorIds } from "../packages/calculation-engine/src/engine.js";

const live = publishedRegistry(implementedCalculatorIds());
const liveIds = new Set(live.map((c) => c.id));
const liveById = new Map(live.map((c) => [c.id, c]));

/** Domains an official source is allowed to live on. */
const OFFICIAL_HOSTS = [
  "gov.uk",
  "legislation.gov.uk",
  "hmrc.gov.uk",
  "revenue.scot",
  "gov.scot",
  "gov.wales",
  "bankofengland.co.uk",
  "fca.org.uk",
  "moneyhelper.org.uk",
  "pensionwise.gov.uk",
  "nhs.uk",
  "nice.org.uk",
  "ons.gov.uk",
  "who.int",
  "slc.co.uk",
];

function hostIsOfficial(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  if (protocol !== "https:") return false;
  return OFFICIAL_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

/**
 * Every string a reader can actually see. `editorialNotes` is excluded on
 * purpose: it is a maintainer channel and is never rendered.
 */
function readerFacingText(guide: (typeof allGuides)[number]): string[] {
  return [
    guide.title,
    guide.summary,
    guide.methodology,
    guide.formulaExplanation.formula,
    ...guide.purpose,
    ...guide.formulaExplanation.steps,
    guide.workedExample.scenario,
    ...guide.workedExample.steps,
    ...guide.workedExample.displayInputs.map((i) => `${i.label} ${i.display}`),
    ...guide.workedExample.outputs.map((o) => o.label),
    ...guide.assumptions,
    ...guide.limitations,
    ...guide.faqs.flatMap((f) => [f.question, f.answer]),
    ...guide.relatedCalculators.map((r) => r.why),
    ...guide.officialSources.map((s) => `${s.title} ${s.applicableRule}`),
  ];
}

describe("Phase 2: calculator guide content validation", () => {
  test("every guide targets a calculator that exists and is live", () => {
    for (const guide of allGuides) {
      assert.ok(
        liveIds.has(guide.calculatorId),
        `Guide targets ${guide.calculatorId}, which is not a live calculator`
      );
    }
  });

  test("no duplicate guide ids", () => {
    const seen = new Set<string>();
    for (const guide of allGuides) {
      assert.ok(!seen.has(guide.calculatorId), `Duplicate guide for ${guide.calculatorId}`);
      seen.add(guide.calculatorId);
    }
  });

  test("every guide belongs to the declared top-40 priority set", () => {
    const target = new Set(TOP_40_IDS);
    for (const guide of allGuides) {
      assert.ok(
        target.has(guide.calculatorId),
        `${guide.calculatorId} has a guide but is not in the top-40 target set`
      );
    }
  });

  test("the top-40 set itself contains forty distinct, live calculators", () => {
    assert.equal(TOP_40_IDS.length, 40, "Top-40 set does not contain forty entries");
    assert.equal(new Set(TOP_40_IDS).size, 40, "Top-40 set contains duplicates");
    for (const id of TOP_40_IDS) {
      assert.ok(liveIds.has(id), `Top-40 target ${id} is not a live calculator`);
    }
  });

  test("a started batch is a finished batch", () => {
    // Guides land one batch at a time. Partial coverage across batches is fine;
    // a half-authored batch is not, because it means a group shipped with gaps.
    const guided = new Set(allGuides.map((g) => g.calculatorId));
    for (const group of TOP_40_GROUPS) {
      const present = group.calculatorIds.filter((id) => guided.has(id));
      if (present.length === 0) continue;
      assert.equal(
        present.length,
        group.calculatorIds.length,
        `Batch ${group.batch} (${group.name}) is partially authored: ${present.length}/${group.calculatorIds.length}. Missing ${group.calculatorIds.filter((id) => !guided.has(id)).join(", ")}`
      );
    }
  });

  test("every required editorial section is present and non-empty", () => {
    for (const guide of allGuides) {
      const where = guide.calculatorId;
      assert.ok(guide.title.trim().length > 0, `${where}: missing title`);
      assert.ok(guide.summary.trim().length > 0, `${where}: missing summary`);
      assert.ok(guide.purpose.length > 0, `${where}: missing purpose`);
      assert.ok(guide.methodology.trim().length > 0, `${where}: missing methodology`);
      assert.ok(
        guide.formulaExplanation.formula.trim().length > 0,
        `${where}: missing formula explanation`
      );
      assert.ok(guide.formulaExplanation.steps.length > 0, `${where}: missing formula steps`);
      assert.ok(guide.assumptions.length > 0, `${where}: missing assumptions`);
      assert.ok(guide.limitations.length > 0, `${where}: missing limitations`);
      assert.ok(guide.officialSources.length > 0, `${where}: no official sources`);
      assert.ok(
        guide.relatedCalculators.length >= 2,
        `${where}: fewer than two related calculators`
      );
      assert.ok(
        /^\d{4}-\d{2}-\d{2}$/.test(guide.lastReviewed),
        `${where}: lastReviewed is not an ISO date`
      );
    }
  });

  test("FAQ sets are genuine and reasonably sized", () => {
    for (const guide of allGuides) {
      assert.ok(
        guide.faqs.length >= 2 && guide.faqs.length <= 6,
        `${guide.calculatorId}: ${guide.faqs.length} FAQs, expected between 2 and 6`
      );
      const questions = new Set<string>();
      for (const faq of guide.faqs) {
        assert.ok(faq.question.trim().endsWith("?"), `${guide.calculatorId}: FAQ is not a question`);
        assert.ok(faq.answer.trim().length > 40, `${guide.calculatorId}: FAQ answer is too thin`);
        assert.ok(!questions.has(faq.question), `${guide.calculatorId}: duplicate FAQ question`);
        questions.add(faq.question);
      }
    }
  });

  test("related calculators point at real, live, different calculators", () => {
    for (const guide of allGuides) {
      const seen = new Set<string>();
      for (const related of guide.relatedCalculators) {
        assert.ok(
          liveIds.has(related.calculatorId),
          `${guide.calculatorId}: related ${related.calculatorId} is not live`
        );
        assert.notEqual(
          related.calculatorId,
          guide.calculatorId,
          `${guide.calculatorId}: links to itself`
        );
        assert.ok(
          !seen.has(related.calculatorId),
          `${guide.calculatorId}: duplicate related link to ${related.calculatorId}`
        );
        assert.ok(
          related.why.trim().length > 15,
          `${guide.calculatorId}: related link to ${related.calculatorId} has no editorial reason`
        );
        seen.add(related.calculatorId);
      }
    }
  });

  test("official sources are HTTPS URLs on official domains, with a stated rule", () => {
    for (const guide of allGuides) {
      for (const source of guide.officialSources) {
        assert.ok(
          hostIsOfficial(source.url),
          `${guide.calculatorId}: ${source.url} is not an HTTPS official source`
        );
        assert.ok(
          source.applicableRule.trim().length > 0,
          `${guide.calculatorId}: ${source.url} does not say which rule it supports`
        );
        assert.ok(
          source.title.trim().length > 0 && source.publisher.trim().length > 0,
          `${guide.calculatorId}: ${source.url} is missing a title or publisher`
        );
        assert.ok(
          ["VERIFIED", "SOURCE VERIFICATION REQUIRED"].includes(source.verificationStatus),
          `${guide.calculatorId}: invalid source verification status`
        );
      }
    }
  });

  test("rule-sensitive guides expose a verification status and name their ruleset", () => {
    for (const guide of allGuides) {
      assert.ok(
        ["VERIFIED", "SOURCE VERIFICATION REQUIRED", "NOT RULE-SENSITIVE"].includes(
          guide.ruleStatus
        ),
        `${guide.calculatorId}: invalid ruleStatus`
      );

      const definition = liveById.get(guide.calculatorId);
      if (definition?.rulesSensitive) {
        assert.notEqual(
          guide.ruleStatus,
          "NOT RULE-SENSITIVE",
          `${guide.calculatorId} is rules-sensitive in the registry but the guide says otherwise`
        );
      }

      if (guide.ruleStatus !== "NOT RULE-SENSITIVE") {
        assert.ok(
          guide.ruleset && guide.ruleset.id.length > 0 && guide.ruleset.taxYear.length > 0,
          `${guide.calculatorId}: rule-sensitive guide does not name its ruleset`
        );
      }
    }
  });

  test("a guide claiming VERIFIED has no unverified sources", () => {
    for (const guide of allGuides) {
      if (guide.ruleStatus !== "VERIFIED") continue;
      for (const source of guide.officialSources) {
        assert.equal(
          source.verificationStatus,
          "VERIFIED",
          `${guide.calculatorId} is marked VERIFIED but cites an unverified source: ${source.url}`
        );
      }
    }
  });

  test("no placeholder or unfinished content is public", () => {
    const forbidden = /\b(TODO|TBD|FIXME|XXX|lorem ipsum|placeholder|coming soon)\b/i;
    for (const guide of allGuides) {
      for (const text of readerFacingText(guide)) {
        assert.ok(
          !forbidden.test(text),
          `${guide.calculatorId}: placeholder text in public content: ${text.slice(0, 80)}`
        );
      }
    }
  });

  test("no internal engineering terminology is public", () => {
    // Wave numbering and raw calculator ids are internal. Phase 1 removed them
    // from the UI; Phase 2 must not reintroduce them through content.
    const waveTerminology = /\bwave\s*[123]\b/i;
    const rawId = /\b[A-Z]{3}-\d{3}\b/;
    for (const guide of allGuides) {
      assert.ok(
        !rawId.test(guide.title),
        `${guide.calculatorId}: raw calculator id used as an editorial heading`
      );
      for (const text of readerFacingText(guide)) {
        assert.ok(
          !waveTerminology.test(text),
          `${guide.calculatorId}: internal wave terminology in public content: ${text.slice(0, 80)}`
        );
        assert.ok(
          !rawId.test(text),
          `${guide.calculatorId}: raw calculator id in public content: ${text.slice(0, 80)}`
        );
      }
    }
  });

  test("no guaranteed-outcome or advisory language is public", () => {
    // This targets promissory claims, not caveats. "Returns are not
    // guaranteed", and "a guaranteed income" as the correct description of an
    // annuity, are honest and must survive. "Guaranteed returns" must not.
    const forbidden = [
      /\bguarantee(s|d)?\s+(returns?|growth|profits?|results?|outcomes?|gains?)\b/i,
      /\bguaranteed\s+to\s+(grow|rise|increase|beat|outperform|succeed)\b/i,
      /\bwe\s+guarantee\b/i,
      /\brisk[-\s]?free\b/i,
      /\b100%\s+accurate\b/i,
      /\balways\s+correct\b/i,
      /\byou\s+should\s+(invest|buy|sell|choose)\b/i,
      /\bwe\s+recommend\b/i,
      /\bbest\s+(investment|pension|mortgage)\s+for\s+you\b/i,
    ];
    for (const guide of allGuides) {
      for (const text of readerFacingText(guide)) {
        const hit = forbidden.find((pattern) => pattern.test(text));
        assert.ok(
          hit === undefined,
          `${guide.calculatorId}: unsupported or advisory language matching ${String(hit)}: ${text.slice(0, 100)}`
        );
      }
    }
  });

  test("getCalculatorGuide resolves by id and is case-insensitive", () => {
    for (const guide of allGuides) {
      assert.equal(getCalculatorGuide(guide.calculatorId)?.calculatorId, guide.calculatorId);
      assert.equal(
        getCalculatorGuide(guide.calculatorId.toLowerCase())?.calculatorId,
        guide.calculatorId
      );
    }
    assert.equal(getCalculatorGuide("NOT-999"), undefined);
  });
});

describe("Phase 2: worked examples are reproduced by the live calculation engine", () => {
  for (const guide of allGuides) {
    test(`${guide.calculatorId} worked example matches engine output`, async () => {
      const example = guide.workedExample;
      assert.ok(example.displayInputs.length > 0, "worked example shows no inputs");
      assert.ok(example.steps.length > 0, "worked example shows no arithmetic");
      assert.ok(example.outputs.length > 0, "worked example publishes no figures");

      // A calculator that reads the current date gets a pinned one, so the
      // example neither drifts nor eventually falls outside the calculator's
      // own validation window as real time passes.
      const base = example.engineNow ? new Date(example.engineNow) : new Date();
      const result = await calculate(guide.calculatorId, example.engineInputs, {
        now: base,
      });

      for (const output of example.outputs) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(result.outputs, output.key),
          `${guide.calculatorId}: engine returns no output named "${output.key}"`
        );
        const actual = result.outputs[output.key];
        assert.ok(
          typeof actual === "number" || typeof actual === "string",
          `${guide.calculatorId}: output "${output.key}" is neither a number nor a string, so it cannot be published as a figure`
        );
        assert.equal(
          actual,
          output.value,
          `${guide.calculatorId}: published "${output.label}" is ${output.value} but the engine returns ${String(actual)}`
        );
      }

      // A published figure must be stable for the inputs given. Some
      // calculators derive outputs from the current date - gestational age,
      // days remaining - and those change every day, so quoting one as a
      // fixed result would put a number on the page that is wrong tomorrow.
      // Re-running a few days later catches any such output. The shift is
      // small so it stays inside each calculator's own validation window.
      const shifted = new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000);
      const later = await calculate(guide.calculatorId, example.engineInputs, {
        now: shifted,
      });
      for (const output of example.outputs) {
        assert.equal(
          later.outputs[output.key],
          output.value,
          `${guide.calculatorId}: published "${output.label}" changes with the current date, so it cannot be quoted as a fixed figure`
        );
      }
    });
  }
});
