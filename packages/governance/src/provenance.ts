/**
 * Derives the review-freshness position of every published calculator.
 *
 * Nothing here authors a date. The inputs are the registry (which calculators
 * exist, and which are rules-sensitive) and the Phase 2 editorial content
 * (when a guide was last checked, against which ruleset, and whether any of
 * its sources are still unverified). The review *policy* - how long a review
 * stays valid - is the only judgement Phase 4 adds, and it is a documented
 * constant rather than a per-calculator field, so it cannot be quietly relaxed
 * for one awkward calculator.
 */
import { publishedRegistry } from "../../calculator-registry/src/index.js";
import type { CalculatorDefinition } from "../../calculator-registry/src/types.js";
import { implementedCalculatorIds } from "../../calculation-engine/src/engine.js";
import { allGuides } from "../../calculator-content/src/index.js";
import type { CalculatorGuideDefinition } from "../../calculator-content/src/types.js";
import { sourceTier } from "./source-hierarchy.js";
import type {
  CalculatorProvenance,
  ProvenanceSummary,
  ReviewState,
  RuleSensitivity,
} from "./types.js";

/**
 * How long an editorial review remains current.
 *
 * A rules-sensitive calculator is pinned to the UK tax year rather than to a
 * rolling number of months, because that is when its figures actually go
 * stale: rates change on 6 April, not 365 days after somebody happened to read
 * the guidance. A general calculator - the arithmetic of a circle, a unit
 * conversion - has no statutory clock, so it gets a fixed cycle intended to
 * catch link rot and drifting explanation rather than changed law.
 */
export const REVIEW_POLICY = {
  /** Rules-sensitive guides fall due at the start of the next UK tax year. */
  rulesSensitive: { basis: "UK tax year", ukTaxYearStart: { month: 4, day: 6 } },
  /** General guides are revisited on a fixed two-year cycle. */
  general: { basis: "fixed cycle", months: 24 },
} as const;

/** Parses an ISO YYYY-MM-DD date as UTC midnight. Throws on anything else. */
function parseIsoDate(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`Expected an ISO YYYY-MM-DD date, received: ${iso}`);
  }
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Not a valid date: ${iso}`);
  }
  return date;
}

/** Formats a Date back to YYYY-MM-DD. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * The first 6 April strictly after the given date.
 *
 * Strictly after matters: a guide reviewed exactly on 6 April was reviewed
 * against the tax year starting that day, so its next review is the following
 * April, not the same morning.
 */
export function nextUkTaxYearStart(afterIso: string): string {
  const after = parseIsoDate(afterIso);
  const { month, day } = REVIEW_POLICY.rulesSensitive.ukTaxYearStart;
  const candidate = new Date(Date.UTC(after.getUTCFullYear(), month - 1, day));
  if (candidate.getTime() > after.getTime()) return toIsoDate(candidate);
  return toIsoDate(new Date(Date.UTC(after.getUTCFullYear() + 1, month - 1, day)));
}

/** The review date `months` after the given date, clamped to a valid day. */
function addMonths(iso: string, months: number): string {
  const from = parseIsoDate(iso);
  const target = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 1)
  );
  // Keep the day of month where the target month is long enough, otherwise
  // fall back to that month's last day, so 31 August plus six months is 28 or
  // 29 February rather than silently rolling into March.
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(from.getUTCDate(), lastDay));
  return toIsoDate(target);
}

/** When a review performed on `reviewedAt` next falls due. */
export function nextReviewDue(
  reviewedAt: string,
  sensitivity: RuleSensitivity
): string {
  return sensitivity === "rules-sensitive"
    ? nextUkTaxYearStart(reviewedAt)
    : addMonths(reviewedAt, REVIEW_POLICY.general.months);
}

/** A guide flags verification work outstanding, at guide or source level. */
function needsVerification(guide: CalculatorGuideDefinition): boolean {
  if (guide.ruleStatus === "SOURCE VERIFICATION REQUIRED") return true;
  return guide.officialSources.some(
    (s) => s.verificationStatus === "SOURCE VERIFICATION REQUIRED"
  );
}

/**
 * The review state of one calculator, evaluated against a given date.
 *
 * `asOf` is a parameter rather than a call to `new Date()` inside the function
 * so that tests can assert the state machine deterministically, and so a page
 * rendering a dated snapshot names the date it used.
 */
export function deriveReviewState(
  guide: CalculatorGuideDefinition | undefined,
  sensitivity: RuleSensitivity,
  asOf: string
): ReviewState {
  if (!guide) return "not-yet-reviewed";
  if (needsVerification(guide)) return "verification-required";
  const due = nextReviewDue(guide.lastReviewed, sensitivity);
  return parseIsoDate(asOf).getTime() >= parseIsoDate(due).getTime()
    ? "review-due"
    : "current";
}

/** Rule sensitivity read straight from the registry. Not re-authored here. */
export function ruleSensitivityOf(calc: CalculatorDefinition): RuleSensitivity {
  return calc.rulesSensitive ? "rules-sensitive" : "general";
}

const guidesById = new Map<string, CalculatorGuideDefinition>(
  allGuides.map((g) => [g.calculatorId, g])
);

/** The calculators the site actually publishes. */
export function livePublishedCalculators(): CalculatorDefinition[] {
  return publishedRegistry(implementedCalculatorIds());
}

/** The derived provenance record for every published calculator. */
export function calculatorProvenance(asOf: string): CalculatorProvenance[] {
  return livePublishedCalculators().map((calc) => {
    const guide = guidesById.get(calc.id);
    const sensitivity = ruleSensitivityOf(calc);
    const sources = guide?.officialSources ?? [];

    return {
      calculatorId: calc.id,
      name: calc.name,
      slug: calc.slug,
      category: calc.category,
      // Wave 1 records predate the optional `jurisdiction` field. The platform
      // is UK-first throughout, so an absent value means UK-wide rather than
      // unknown; anything narrower is stated explicitly by the registry.
      jurisdiction: calc.jurisdiction ?? "United Kingdom",
      ruleSensitivity: sensitivity,
      hasGuide: Boolean(guide),
      rulesetId: guide?.ruleset?.id,
      rulesetTaxYear: guide?.ruleset?.taxYear,
      sourcesReviewedAt: guide?.lastReviewed,
      nextReviewDue: guide
        ? nextReviewDue(guide.lastReviewed, sensitivity)
        : undefined,
      reviewState: deriveReviewState(guide, sensitivity, asOf),
      sourceCount: sources.length,
      tier1SourceCount: sources.filter((s) => sourceTier(s.url) === 1).length,
    };
  });
}

/** Platform-wide provenance position for a dated transparency snapshot. */
export function provenanceSummary(asOf: string): ProvenanceSummary {
  const records = calculatorProvenance(asOf);
  const byReviewState: Record<ReviewState, number> = {
    "current": 0,
    "review-due": 0,
    "verification-required": 0,
    "not-yet-reviewed": 0,
  };
  for (const r of records) byReviewState[r.reviewState] += 1;

  const allSources = allGuides.flatMap((g) => g.officialSources);
  const reviewDates = records
    .map((r) => r.sourcesReviewedAt)
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    totalCalculators: records.length,
    rulesSensitive: records.filter((r) => r.ruleSensitivity === "rules-sensitive").length,
    general: records.filter((r) => r.ruleSensitivity === "general").length,
    guided: records.filter((r) => r.hasGuide).length,
    byReviewState,
    totalSources: allSources.length,
    tier1Sources: allSources.filter((s) => sourceTier(s.url) === 1).length,
    tier2Sources: allSources.filter((s) => sourceTier(s.url) === 2).length,
    tier3Sources: allSources.filter((s) => sourceTier(s.url) === 3).length,
    latestReviewDate: reviewDates.length
      ? reviewDates[reviewDates.length - 1]
      : undefined,
  };
}

/** Human wording for a review state. Public copy, never internal jargon. */
export const REVIEW_STATE_LABELS: Record<ReviewState, string> = {
  "current": "Sources reviewed",
  "review-due": "Review due",
  "verification-required": "Verification outstanding",
  "not-yet-reviewed": "No published guide yet",
};
