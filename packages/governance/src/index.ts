/**
 * Phase 4 governance package.
 *
 * Holds the platform's source hierarchy, the derived provenance and review
 * freshness layer, and the public change record. It owns no calculator
 * mathematics, no statutory rules and no benchmark values, and it deliberately
 * depends on the registry and editorial content rather than duplicating them.
 */
export {
  SOURCE_HIERARCHY,
  sourceTier,
  isPrimaryOfficialSource,
  getSourceTierDefinition,
} from "./source-hierarchy.js";

export {
  REVIEW_POLICY,
  REVIEW_STATE_LABELS,
  calculatorProvenance,
  provenanceSummary,
  deriveReviewState,
  nextReviewDue,
  nextUkTaxYearStart,
  ruleSensitivityOf,
  livePublishedCalculators,
} from "./provenance.js";

export {
  VERIFICATION_SNAPSHOT,
  verificationSnapshotLabel,
  type VerificationSnapshot,
} from "./verification-snapshot.js";

export {
  PLATFORM_UPDATES,
  updateCategories,
  latestUpdateDate,
} from "./updates.js";

export type {
  SourceTier,
  SourceTierDefinition,
  RuleSensitivity,
  ReviewState,
  CalculatorProvenance,
  ProvenanceSummary,
  UpdateCategory,
  PlatformUpdate,
} from "./types.js";
