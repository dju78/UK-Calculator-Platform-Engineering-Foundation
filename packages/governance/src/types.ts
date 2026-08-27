/**
 * Phase 4 governance, provenance and transparency model.
 *
 * Phase 4 deliberately adds no new authored facts about calculators. Every
 * value in this module is either
 *
 *   (a) a policy constant that Phase 4 itself defines and documents, or
 *   (b) derived from data that already exists in the registry
 *       (`rulesSensitive`, `jurisdiction`, `version`) and in the Phase 2
 *       editorial content (`lastReviewed`, `ruleset`, `ruleStatus`,
 *       `officialSources[].verificationStatus`).
 *
 * That constraint is the whole point. A freshness indicator is only worth
 * showing if it cannot be set by hand: a second, hand-maintained provenance
 * table would drift from the guides it claims to describe, and the first time
 * it did, the platform would be publishing a "verified" badge it could not
 * substantiate. Deriving the state means a guide and its provenance record
 * cannot disagree, and no review date can exist that nobody performed.
 */

/**
 * Where a source sits in the evidence hierarchy.
 *
 * Tier 1 is the only tier that may stand alone as authority for a statutory
 * figure. Tiers 2 and 3 provide explanation and corroboration.
 */
export type SourceTier = 1 | 2 | 3;

/** One tier of the published source hierarchy. */
export interface SourceTierDefinition {
  tier: SourceTier;
  name: string;
  /** What kind of body this tier covers. */
  description: string;
  /** When a source of this tier is sufficient on its own, and when it is not. */
  standing: string;
  /** Bodies in this tier that the platform actually cites or would accept. */
  publishers: string[];
}

/**
 * How exposed a calculator is to changes in external rules.
 *
 * Derived from the registry's `rulesSensitive` flag, which Waves 1-3 already
 * set per calculator. It is not re-authored here.
 */
export type RuleSensitivity = "rules-sensitive" | "general";

/**
 * Editorial review state of a calculator.
 *
 * Four states, not three, because "no guide has been authored yet" is a
 * genuinely different situation from "a guide exists and one of its figures
 * still needs checking". Collapsing them would either overstate coverage or
 * libel 213 working calculators as defective.
 */
export type ReviewState =
  /** Reviewed, sources verified, and not yet past its next review date. */
  | "current"
  /** Reviewed once, but the review window has now elapsed. */
  | "review-due"
  /** A guide exists and explicitly flags a figure as needing verification. */
  | "verification-required"
  /** No editorial guide has been authored, so there is no review record. */
  | "not-yet-reviewed";

/** The derived provenance record for one calculator. */
export interface CalculatorProvenance {
  calculatorId: string;
  name: string;
  slug: string;
  category: string;
  jurisdiction: string;
  ruleSensitivity: RuleSensitivity;
  /** Whether a Phase 2 editorial guide exists for this calculator. */
  hasGuide: boolean;
  /** Ruleset the published figures are stated against, where one is named. */
  rulesetId?: string;
  /** Human-facing tax year, e.g. "2026/27". */
  rulesetTaxYear?: string;
  /** ISO date the guide was last checked against its sources. Never invented. */
  sourcesReviewedAt?: string;
  /** ISO date the next review falls due, derived from the review policy. */
  nextReviewDue?: string;
  reviewState: ReviewState;
  /** Count of official sources cited by the guide. */
  sourceCount: number;
  /** How many of those sources are Tier 1 primary official sources. */
  tier1SourceCount: number;
}

/** Aggregate provenance position across the whole platform. */
export interface ProvenanceSummary {
  totalCalculators: number;
  rulesSensitive: number;
  general: number;
  guided: number;
  byReviewState: Record<ReviewState, number>;
  totalSources: number;
  tier1Sources: number;
  tier2Sources: number;
  tier3Sources: number;
  /** The most recent editorial review date on record, where any exists. */
  latestReviewDate?: string;
}

/** The kind of change a public update entry describes. */
export type UpdateCategory =
  | "Statutory correction"
  | "New calculators"
  | "Editorial content"
  | "Trust and transparency"
  | "Discoverability"
  | "Platform";

/**
 * One user-facing entry on the public updates page.
 *
 * Engineering churn does not belong here. An entry earns its place only if a
 * visitor's answer, or their reason to trust an answer, actually changed.
 */
export interface PlatformUpdate {
  /** ISO date, evidenced by repository history. Never estimated. */
  date: string;
  title: string;
  summary: string;
  category: UpdateCategory;
  /** Calculator ids materially affected, where the change was specific. */
  affectedCalculators?: string[];
  /** Where a reader can check the change for themselves. */
  reference?: { label: string; href: string };
}
