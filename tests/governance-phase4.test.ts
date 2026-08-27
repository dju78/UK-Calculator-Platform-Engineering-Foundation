import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SOURCE_HIERARCHY,
  sourceTier,
  isPrimaryOfficialSource,
  PLATFORM_UPDATES,
  VERIFICATION_SNAPSHOT,
  REVIEW_STATE_LABELS,
  provenanceSummary,
  calculatorProvenance,
  deriveReviewState,
  nextReviewDue,
  nextUkTaxYearStart,
} from "../packages/governance/src/index.js";
import { allGuides } from "../packages/calculator-content/src/index.js";
import { calculatorRegistry, publishedRegistry } from "../packages/calculator-registry/src/index.js";
import { implementedCalculatorIds } from "../packages/calculation-engine/src/engine.js";

/**
 * Phase 4 governance assurance.
 *
 * These tests check contracts, not prose. Asserting the exact wording of a
 * paragraph produces a suite that fails every time an editor improves a
 * sentence, which trains everyone to update the expected string without
 * reading it - the opposite of assurance. What is asserted here is the set of
 * things that would actually make the governance layer dishonest or broken: a
 * missing page, a duplicated description, a canonical pointing at a dead host,
 * a fabricated regulatory claim, a provenance record that outruns its
 * evidence, or an update entry dated in the future.
 */

const rootDir = process.cwd();
const SITE_URL = "https://ukcalc.jomovate.com";
const CONTACT_EMAIL = "dju78@jomovate.com";

const GOVERNANCE_ROUTES = [
  { route: "/about", dir: "about", h1: "About" },
  { route: "/contact", dir: "contact", h1: "Contact" },
  { route: "/editorial-policy", dir: "editorial-policy", h1: "Editorial Policy" },
  {
    route: "/how-we-check-our-figures",
    dir: "how-we-check-our-figures",
    h1: "How we check our figures",
  },
  { route: "/updates", dir: "updates", h1: "Updates" },
];

function pageSource(dir: string): string {
  return fs.readFileSync(
    path.join(rootDir, "apps/web/src/app", dir, "page.tsx"),
    "utf8"
  );
}

function readRepoFile(relPath: string): string {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8");
}

/**
 * Page source with runs of whitespace collapsed and inline JSX tags stripped.
 *
 * Prose in a component is wrapped by the formatter and interrupted by tags
 * like `<em>`, so a sentence-level assertion against the raw file would be an
 * assertion about line breaks. Normalising first means these tests check what
 * the page says, not how it happens to be laid out.
 */
function pageProse(dir: string): string {
  return pageSource(dir)
    .replace(/<\/?(?:em|strong|Link|span|code)\b[^>]*>/g, "")
    .replace(/\s+/g, " ");
}

/** The single-quoted or double-quoted string following a metadata key. */
function extractMetadataString(source: string, key: string): string | undefined {
  const match = source.match(
    new RegExp(`${key}\\s*=\\s*\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`)
  );
  return match?.[1];
}

describe("Professionalisation Phase 4: Governance, Transparency and Editorial Trust", () => {
  describe("A. Public governance routes", () => {
    for (const { route, dir, h1 } of GOVERNANCE_ROUTES) {
      test(`${route} exists as a route with an h1 and a canonical`, () => {
        const pagePath = path.join(rootDir, "apps/web/src/app", dir, "page.tsx");
        assert.ok(fs.existsSync(pagePath), `${route} must have a page at ${pagePath}`);

        const source = pageSource(dir);
        assert.ok(
          source.includes("<h1>"),
          `${route} must render exactly one top-level heading`
        );
        assert.equal(
          (source.match(/<h1[ >]/g) ?? []).length,
          1,
          `${route} must render exactly one h1`
        );
        assert.ok(
          source.includes(h1),
          `${route} h1 should read as "${h1}"`
        );
        assert.ok(
          source.includes(`canonical: "${route}"`),
          `${route} must declare its own canonical path`
        );
        assert.ok(
          source.includes(`absoluteUrl("${route}")`),
          `${route} must set an absolute Open Graph URL`
        );
        assert.ok(
          source.includes("Breadcrumbs"),
          `${route} must render breadcrumb navigation`
        );
      });
    }

    test("governance pages have unique, non-boilerplate titles and descriptions", () => {
      const titles = new Set<string>();
      const descriptions = new Set<string>();

      for (const { route, dir } of GOVERNANCE_ROUTES) {
        const source = pageSource(dir);
        const description = extractMetadataString(source, "const DESCRIPTION");
        assert.ok(
          description,
          `${route} must define a page description`
        );
        assert.ok(
          description!.length >= 60,
          `${route} description is too thin to be useful: ${description}`
        );
        assert.ok(
          !descriptions.has(description!),
          `${route} reuses another governance page's description`
        );
        descriptions.add(description!);

        const titleMatch = source.match(/title:\s*`([^`]+)`/);
        assert.ok(titleMatch, `${route} must define a metadata title`);
        assert.ok(
          !titles.has(titleMatch![1]),
          `${route} reuses another governance page's title`
        );
        titles.add(titleMatch![1]);
      }

      assert.equal(titles.size, GOVERNANCE_ROUTES.length);
      assert.equal(descriptions.size, GOVERNANCE_ROUTES.length);
    });

    test("governance pages are reachable from shared site navigation", () => {
      const footer = readRepoFile("apps/web/src/components/layout/Footer.tsx");
      for (const { route } of GOVERNANCE_ROUTES) {
        assert.ok(
          footer.includes(`href="${route}"`),
          `Footer must link to ${route} or the page is unreachable by browsing`
        );
      }
    });

    test("governance pages cross-link into one another", () => {
      // A governance page that dead-ends forces the reader back to search to
      // answer the obvious follow-up question.
      const about = pageSource("about");
      for (const route of ["/how-we-check-our-figures", "/editorial-policy", "/contact", "/updates"]) {
        assert.ok(
          about.includes(`href="${route}"`),
          `/about should link onward to ${route}`
        );
      }

      const howWeCheck = pageSource("how-we-check-our-figures");
      assert.ok(howWeCheck.includes('href="/contact"'));
      assert.ok(howWeCheck.includes('href="/editorial-policy"'));
    });
  });

  describe("B. Sitemap and canonical domain", () => {
    test("every governance route is in the sitemap", () => {
      const sitemap = readRepoFile("apps/web/src/app/sitemap.ts");
      for (const { route } of GOVERNANCE_ROUTES) {
        assert.ok(
          sitemap.includes(`'${route}'`),
          `${route} must appear in the sitemap or it will not be discovered`
        );
      }
    });

    test("the canonical origin is the branded production domain", () => {
      const site = readRepoFile("apps/web/src/lib/site.ts");
      assert.ok(
        site.includes(SITE_URL),
        `site.ts must default to ${SITE_URL}`
      );
    });

    test("no stale Render host survives in active app, scripts or tests", () => {
      // Historical audit documents under docs/ are preserved as written; they
      // are a record of what was true at the time, not live configuration.
      //
      // The needle is assembled at runtime so that this file - and the e2e
      // spec that makes the same assertion - do not themselves contain the
      // literal string and trip the check. That is cheaper and more honest
      // than maintaining a list of files exempted from their own rule.
      const staleHost = ["onrender", "com"].join(".");
      const searchRoots = ["apps/web/src", "apps/web/e2e", "scripts", "tests", "packages"];
      const offenders: string[] = [];

      const walk = (dir: string) => {
        const abs = path.join(rootDir, dir);
        if (!fs.existsSync(abs)) return;
        for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
          const rel = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".next") continue;
            walk(rel);
          } else if (/\.(ts|tsx|js|mjs|cjs|json)$/.test(entry.name)) {
            if (readRepoFile(rel).includes(staleHost)) offenders.push(rel);
          }
        }
      };
      searchRoots.forEach(walk);

      assert.deepEqual(
        offenders,
        [],
        `Stale ${staleHost} host found in active files: ${offenders.join(", ")}`
      );
    });
  });

  describe("C. Truthfulness of governance claims", () => {
    const governanceSources = GOVERNANCE_ROUTES.map(({ route, dir }) => ({
      route,
      source: pageSource(dir),
    }));

    test("no fabricated company registration or regulatory authorisation", () => {
      // The operator is a named project, not an evidenced registered company
      // or an authorised firm. Claiming otherwise would be a false statement
      // about regulated status, which is the single worst thing this platform
      // could publish.
      const forbidden: RegExp[] = [
        /company\s+(registration\s+)?number/i,
        /registered\s+in\s+England/i,
        /Companies\s+House/i,
        /\bauthorised\s+and\s+regulated\b/i,
        /regulated\s+by\s+the\s+Financial\s+Conduct\s+Authority/i,
        /\bFCA[- ]authorised\b/i,
        /\bFCA\s+registration\b/i,
        /\bFRN\b/,
        /\bVAT\s+number\b/i,
      ];

      for (const { route, source } of governanceSources) {
        for (const pattern of forbidden) {
          assert.ok(
            !pattern.test(source),
            `${route} must not make an unevidenced corporate or regulatory claim (matched ${pattern})`
          );
        }
      }
    });

    test("no claim of endorsement, guaranteed accuracy or regulated advice", () => {
      const forbidden: RegExp[] = [
        /government[- ]endorsed/i,
        /endorsed\s+by\s+(HMRC|GOV\.UK|the\s+government)/i,
        /guaranteed\s+accurate/i,
        /we\s+guarantee\s+(the\s+)?accuracy/i,
        /100%\s+accurate/i,
        /\bwe\s+are\s+regulated\b/i,
        /\bfinancial\s+advice\s+(is\s+)?provided\b/i,
      ];

      for (const { route, source } of governanceSources) {
        for (const pattern of forbidden) {
          assert.ok(
            !pattern.test(source),
            `${route} must not overstate certainty or status (matched ${pattern})`
          );
        }
      }
    });

    test("no fabricated named reviewers, boards or external certification", () => {
      const forbidden: RegExp[] = [
        /editorial\s+board\s+(of|comprising|includes)/i,
        /reviewed\s+by\s+(our\s+)?(chartered|certified)\s+/i,
        /medically\s+reviewed\s+by\s+Dr/i,
        /externally\s+certified/i,
        /third[- ]party\s+certification\s+(has\s+been|was)\s+(completed|obtained)/i,
        /ISO\s?\d{4,}/,
      ];

      for (const { route, source } of governanceSources) {
        for (const pattern of forbidden) {
          assert.ok(
            !pattern.test(source),
            `${route} must not imply review or certification that has not happened (matched ${pattern})`
          );
        }
      }
    });

    test("the assurance page states the limits of its own verification", () => {
      const source = pageProse("how-we-check-our-figures");
      // The value of this page comes from what it concedes, so the concessions
      // are a tested contract rather than a stylistic choice.
      assert.match(source, /legislation\s+changes/i);
      assert.match(source, /simplif/i);
      assert.match(source, /do not guarantee/i);
      assert.ok(
        /cannot\s+(prove|substitute|eliminate)/i.test(source),
        "The assurance page must say plainly what its testing cannot establish"
      );
    });

    test("the editorial policy is transparent about AI-assisted tooling", () => {
      const source = pageProse("editorial-policy");
      assert.match(source, /AI-assisted/i);
      // Transparency is only meaningful alongside the boundary: AI output is
      // never the authority for a figure.
      assert.ok(
        /no calculation result, statutory rate, threshold or rule reaches this platform on the authority of a language model/i.test(
          source
        ),
        "The AI section must state that no figure rests on model output"
      );
      assert.match(source, /deterministic/i);
      assert.match(source, /independently derived/i);
    });

    test("contact guidance asks for reproducible reports, not personal data", () => {
      const source = pageProse("contact");
      assert.ok(source.includes(CONTACT_EMAIL), "Contact page must expose the real address");
      for (const expected of [/inputs/i, /result/i, /source/i, /date/i]) {
        assert.match(source, expected);
      }
      assert.ok(
        /do not send bank details|National Insurance\s+numbers/i.test(source),
        "Contact page must warn against sending sensitive personal data"
      );
      assert.ok(
        !/<form/i.test(source),
        "Contact must not introduce a form backend in Phase 4"
      );
    });

    test("accessibility wording is not strengthened into an unevidenced compliance claim", () => {
      const statement = readRepoFile("apps/web/src/app/accessibility/page.tsx");
      assert.ok(
        !/\bis\s+WCAG\s*2\.2\s*AA\s*compliant\b/i.test(statement),
        "The platform must not claim certified WCAG compliance"
      );
      assert.ok(
        !/fully\s+accessible\s+to\s+all/i.test(statement),
        "The platform must not claim universal accessibility"
      );
    });
  });

  describe("D. Source hierarchy", () => {
    test("three tiers are defined, ordered, and describe their standing", () => {
      assert.equal(SOURCE_HIERARCHY.length, 3);
      assert.deepEqual(
        SOURCE_HIERARCHY.map((t) => t.tier),
        [1, 2, 3]
      );
      for (const tier of SOURCE_HIERARCHY) {
        assert.ok(tier.name.length > 0);
        assert.ok(tier.description.length > 40, `Tier ${tier.tier} needs a real description`);
        assert.ok(tier.standing.length > 40, `Tier ${tier.tier} must state what it may prove`);
        assert.ok(tier.publishers.length > 0);
      }
    });

    test("official UK bodies classify as Tier 1", () => {
      const tier1 = [
        "https://www.gov.uk/income-tax-rates",
        "https://www.legislation.gov.uk/ukpga/2003/1",
        "https://www.hmrc.gov.uk/rates",
        "https://revenue.scot/taxes/land-buildings-transaction-tax",
        "https://www.handbook.fca.org.uk/handbook/MCOB/11/6.html",
        "https://www.bankofengland.co.uk/monetary-policy",
        "https://www.nhs.uk/conditions/obesity",
        "https://www.nice.org.uk/guidance",
        "https://www.gov.scot/policies/taxes",
        "https://www.gov.wales/land-transaction-tax",
      ];
      for (const url of tier1) {
        assert.equal(sourceTier(url), 1, `${url} should be Tier 1`);
        assert.equal(isPrimaryOfficialSource(url), true);
      }
    });

    test("institutional guidance is Tier 2 and cannot stand alone", () => {
      assert.equal(sourceTier("https://www.moneyhelper.org.uk/en/pensions"), 2);
      assert.equal(isPrimaryOfficialSource("https://www.moneyhelper.org.uk/en/pensions"), false);
    });

    test("unknown and lookalike hosts fall to Tier 3, never Tier 1", () => {
      // Suffix matching, not substring matching: a hostile or careless host
      // containing "gov.uk" must not inherit statutory authority.
      assert.equal(sourceTier("https://gov.uk.example.com/rates"), 3);
      assert.equal(sourceTier("https://notgov.uk/rates"), 3);
      assert.equal(sourceTier("https://example.com/tax-guide"), 3);
      assert.equal(sourceTier("not a url"), 3);
      assert.equal(sourceTier(""), 3);
    });

    test("every cited source in published guides resolves to a real tier", () => {
      const sources = allGuides.flatMap((g) => g.officialSources);
      assert.ok(sources.length > 0, "Guides must cite sources");
      for (const source of sources) {
        assert.match(
          source.url,
          /^https:\/\//,
          `Source "${source.title}" must be an absolute HTTPS URL`
        );
        assert.ok([1, 2, 3].includes(sourceTier(source.url)));
      }
    });

    test("no rule-sensitive guide rests solely on non-primary sources", () => {
      // The hierarchy is only worth publishing if it holds. A guide that
      // states statutory figures must cite at least one Tier 1 source.
      const failures: string[] = [];
      for (const guide of allGuides) {
        if (guide.ruleStatus !== "VERIFIED") continue;
        if (!guide.ruleset) continue;
        const tier1 = guide.officialSources.filter((s) => isPrimaryOfficialSource(s.url));
        if (tier1.length === 0) failures.push(guide.calculatorId);
      }
      assert.deepEqual(
        failures,
        [],
        `Verified rule-sensitive guides citing no primary official source: ${failures.join(", ")}`
      );
    });

    test("the source hierarchy is rendered on the public pages", () => {
      const policy = pageSource("editorial-policy");
      const assurance = pageSource("how-we-check-our-figures");
      for (const source of [policy, assurance]) {
        assert.ok(
          source.includes("sourceHierarchy"),
          "Public pages must render the hierarchy from the shared definition, not a hand-copied duplicate"
        );
      }
      assert.match(policy, /search-result snippet is not a source/i);
    });
  });

  describe("E. Provenance and review freshness", () => {
    const AS_OF = "2026-08-26";

    test("every published calculator has a provenance record", () => {
      const live = publishedRegistry(implementedCalculatorIds());
      const records = calculatorProvenance(AS_OF);
      assert.equal(records.length, live.length);
      assert.equal(
        new Set(records.map((r) => r.calculatorId)).size,
        records.length,
        "Provenance records must be one per calculator"
      );
    });

    test("rules-sensitive calculators are distinguishable from general ones", () => {
      const records = calculatorProvenance(AS_OF);
      const sensitive = records.filter((r) => r.ruleSensitivity === "rules-sensitive");
      const general = records.filter((r) => r.ruleSensitivity === "general");

      assert.ok(sensitive.length > 0, "Some calculators must be rules-sensitive");
      assert.ok(general.length > 0, "Some calculators must be general");
      assert.equal(sensitive.length + general.length, records.length);

      // The flag is derived from the registry, never re-authored, so the two
      // can never disagree.
      for (const record of records) {
        const calc = calculatorRegistry.find((c: any) => c.id === record.calculatorId);
        assert.equal(
          record.ruleSensitivity === "rules-sensitive",
          Boolean(calc?.rulesSensitive),
          `${record.calculatorId} provenance disagrees with the registry`
        );
      }
    });

    test("no calculator is marked reviewed without an editorial review record", () => {
      for (const record of calculatorProvenance(AS_OF)) {
        if (!record.hasGuide) {
          assert.equal(
            record.reviewState,
            "not-yet-reviewed",
            `${record.calculatorId} has no guide and must not claim a review state`
          );
          assert.equal(record.sourcesReviewedAt, undefined);
          assert.equal(record.nextReviewDue, undefined);
          assert.equal(record.sourceCount, 0);
        } else {
          assert.ok(
            record.sourcesReviewedAt,
            `${record.calculatorId} has a guide and must carry its review date`
          );
          assert.match(record.sourcesReviewedAt!, /^\d{4}-\d{2}-\d{2}$/);
        }
      }
    });

    test("review dates come from the guides and are never invented", () => {
      const guideDates = new Map(allGuides.map((g) => [g.calculatorId, g.lastReviewed]));
      for (const record of calculatorProvenance(AS_OF)) {
        if (!record.hasGuide) continue;
        assert.equal(
          record.sourcesReviewedAt,
          guideDates.get(record.calculatorId),
          `${record.calculatorId} review date must match its guide exactly`
        );
      }
    });

    test("no review date is in the future", () => {
      const today = new Date().toISOString().slice(0, 10);
      for (const record of calculatorProvenance(AS_OF)) {
        if (!record.sourcesReviewedAt) continue;
        assert.ok(
          record.sourcesReviewedAt <= today,
          `${record.calculatorId} claims a review on ${record.sourcesReviewedAt}, which has not happened yet`
        );
      }
    });

    test("outstanding source verification is surfaced, not suppressed", () => {
      const flagged = allGuides.filter(
        (g) =>
          g.ruleStatus === "SOURCE VERIFICATION REQUIRED" ||
          g.officialSources.some((s) => s.verificationStatus === "SOURCE VERIFICATION REQUIRED")
      );
      const records = calculatorProvenance(AS_OF);
      for (const guide of flagged) {
        const record = records.find((r) => r.calculatorId === guide.calculatorId);
        if (!record) continue;
        assert.equal(
          record.reviewState,
          "verification-required",
          `${guide.calculatorId} flags unverified figures and must report that state`
        );
      }
    });

    test("the review clock follows the UK tax year for rules-sensitive content", () => {
      assert.equal(nextUkTaxYearStart("2026-08-25"), "2027-04-06");
      assert.equal(nextUkTaxYearStart("2027-01-01"), "2027-04-06");
      assert.equal(nextUkTaxYearStart("2027-04-05"), "2027-04-06");
      // Reviewed on the first day of a tax year: due the next one, not today.
      assert.equal(nextUkTaxYearStart("2027-04-06"), "2028-04-06");

      assert.equal(nextReviewDue("2026-08-25", "rules-sensitive"), "2027-04-06");
      assert.equal(nextReviewDue("2026-08-25", "general"), "2028-08-25");
      // Month-end clamping rather than silently rolling into the next month.
      assert.equal(nextReviewDue("2026-08-31", "general"), "2028-08-31");
    });

    test("review state transitions deterministically as time passes", () => {
      const guide = allGuides.find((g) => g.ruleStatus === "VERIFIED" && g.ruleset);
      assert.ok(guide, "Expected at least one verified rule-sensitive guide");

      assert.equal(deriveReviewState(guide, "rules-sensitive", "2026-08-26"), "current");
      assert.equal(deriveReviewState(guide, "rules-sensitive", "2027-04-05"), "current");
      assert.equal(deriveReviewState(guide, "rules-sensitive", "2027-04-06"), "review-due");
      assert.equal(deriveReviewState(undefined, "general", "2026-08-26"), "not-yet-reviewed");
    });

    test("review state labels are human wording, not internal jargon", () => {
      for (const [state, label] of Object.entries(REVIEW_STATE_LABELS)) {
        assert.ok(label.length > 0, `${state} needs a public label`);
        assert.ok(
          !/[_]|v\d+|ruleset|SOURCE VERIFICATION REQUIRED/i.test(label),
          `Public label for ${state} leaks internal terminology: ${label}`
        );
      }
    });

    test("the platform summary is internally consistent", () => {
      const summary = provenanceSummary(AS_OF);
      assert.equal(summary.rulesSensitive + summary.general, summary.totalCalculators);
      assert.equal(
        Object.values(summary.byReviewState).reduce((a, b) => a + b, 0),
        summary.totalCalculators
      );
      assert.equal(
        summary.tier1Sources + summary.tier2Sources + summary.tier3Sources,
        summary.totalSources
      );
      assert.equal(summary.guided, allGuides.length);
      assert.ok(
        summary.guided <= summary.totalCalculators,
        "Guided coverage cannot exceed the number of calculators"
      );
    });
  });

  describe("F. Verification snapshot", () => {
    test("the snapshot is dated and not in the future", () => {
      assert.match(VERIFICATION_SNAPSHOT.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(
        VERIFICATION_SNAPSHOT.date <= new Date().toISOString().slice(0, 10),
        "A verification snapshot cannot be dated in the future"
      );
    });

    test("snapshot platform figures match the live registry", () => {
      const live = publishedRegistry(implementedCalculatorIds());
      const categories = new Set(live.map((c: any) => c.category));
      assert.equal(
        VERIFICATION_SNAPSHOT.calculators,
        live.length,
        "Published calculator count in the snapshot must match the registry"
      );
      assert.equal(VERIFICATION_SNAPSHOT.categories, categories.size);
      assert.equal(VERIFICATION_SNAPSHOT.publishedGuides, allGuides.length);
    });

    test("snapshot test totals are positive integers", () => {
      for (const key of [
        "referenceBenchmarkCases",
        "unitAndContentTests",
        "browserChecks",
      ] as const) {
        const value = VERIFICATION_SNAPSHOT[key];
        assert.ok(Number.isInteger(value) && value > 0, `${key} must be a real executed count`);
      }
    });

    test("counts are published as a dated snapshot, not evergreen prose", () => {
      const source = pageSource("how-we-check-our-figures");
      assert.match(source, /Verification snapshot/);
      assert.ok(
        source.includes("snapshot.date"),
        "The snapshot date must be rendered alongside the counts"
      );
      // Hardcoded totals in prose go stale silently; the page must read them
      // from the dated snapshot instead.
      assert.ok(
        !/\b1,?489\b/.test(source) && !/\b1,?6\d{2}\b/.test(source),
        "Test totals must not be hardcoded into page prose"
      );
    });
  });

  describe("G. Public updates record", () => {
    test("entries are well formed and dated in the past", () => {
      assert.ok(PLATFORM_UPDATES.length > 0);
      const today = new Date().toISOString().slice(0, 10);
      for (const update of PLATFORM_UPDATES) {
        assert.match(update.date, /^\d{4}-\d{2}-\d{2}$/, `Bad date: ${update.title}`);
        assert.ok(
          update.date <= today,
          `${update.title} is dated ${update.date}, which is in the future`
        );
        assert.ok(update.title.length > 10, `Title too thin: ${update.title}`);
        assert.ok(
          update.summary.length > 60,
          `Summary too thin to be useful: ${update.title}`
        );
        assert.ok(update.category.length > 0);
      }
    });

    test("no duplicate entries", () => {
      const keys = PLATFORM_UPDATES.map((u) => `${u.date}|${u.title}`);
      assert.equal(new Set(keys).size, keys.length, "Duplicate update entries");
    });

    test("affected calculators reference real published calculators", () => {
      const liveIds = new Set(publishedRegistry(implementedCalculatorIds()).map((c: any) => c.id));
      for (const update of PLATFORM_UPDATES) {
        for (const id of update.affectedCalculators ?? []) {
          assert.ok(
            liveIds.has(id),
            `${update.title} names ${id}, which is not a published calculator`
          );
        }
      }
    });

    test("statutory corrections name the calculators they changed", () => {
      const corrections = PLATFORM_UPDATES.filter(
        (u) => u.category === "Statutory correction"
      );
      assert.ok(corrections.length > 0, "The known TAX-013/TAX-019 corrections must be recorded");
      for (const correction of corrections) {
        assert.ok(
          (correction.affectedCalculators ?? []).length > 0,
          `${correction.title} must name the calculators affected`
        );
      }
    });

    test("internal references do not leak commit SHAs to readers", () => {
      for (const update of PLATFORM_UPDATES) {
        assert.ok(
          !/\b[0-9a-f]{7,40}\b/.test(update.summary),
          `${update.title} exposes a commit hash to ordinary readers`
        );
      }
    });

    test("update references point at real internal routes", () => {
      const known = new Set([
        ...GOVERNANCE_ROUTES.map((r) => r.route),
        "/privacy",
        "/terms",
        "/disclaimer",
        "/accessibility",
        "/",
      ]);
      for (const update of PLATFORM_UPDATES) {
        if (!update.reference) continue;
        assert.ok(
          known.has(update.reference.href),
          `${update.title} references unknown route ${update.reference.href}`
        );
      }
    });
  });

  describe("H. Rules maintenance documentation", () => {
    const required = [
      "docs/RULES_MAINTENANCE_POLICY.md",
      "docs/RULES_REVIEW_CALENDAR.md",
      "docs/PROFESSIONALISATION_PHASE4_AUDIT.md",
      "docs/PROFESSIONALISATION_PHASE4_REPORT.md",
      "docs/PHASE4_INTEGRATION_NOTES.md",
    ];

    for (const relPath of required) {
      test(`${relPath} exists and has substance`, () => {
        const abs = path.join(rootDir, relPath);
        assert.ok(fs.existsSync(abs), `${relPath} is a required Phase 4 deliverable`);
        assert.ok(
          fs.readFileSync(abs, "utf8").length > 1500,
          `${relPath} must be a real document, not a stub`
        );
      });
    }

    test("the maintenance policy covers the events that actually change UK rules", () => {
      const policy = readRepoFile("docs/RULES_MAINTENANCE_POLICY.md");
      for (const topic of [
        /tax year/i,
        /budget/i,
        /uprating/i,
        /benefit/i,
        /pension/i,
        /Scotland|Scottish/i,
        /Wales|Welsh/i,
        /benchmark/i,
        /independent/i,
        /regression/i,
      ]) {
        assert.match(policy, topic, `Maintenance policy must address ${topic}`);
      }
    });

    test("the review calendar schedules windows without inventing fiscal dates", () => {
      const calendar = readRepoFile("docs/RULES_REVIEW_CALENDAR.md");
      assert.match(calendar, /6 April/);
      assert.match(calendar, /quarterly/i);
      // Budget dates are announced by government and must never be guessed.
      assert.ok(
        !/Budget\s+(will\s+be|is)\s+(held|delivered)\s+on\s+\d{1,2}\s+\w+\s+20\d\d/i.test(calendar),
        "The calendar must not assert a specific future Budget date"
      );
    });
  });
});
