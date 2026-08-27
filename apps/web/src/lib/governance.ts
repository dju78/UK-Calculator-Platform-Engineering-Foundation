/**
 * Governance data as the site consumes it.
 *
 * Runtime values come from the compiled package, the same way the app already
 * consumes the registry, the engine and the editorial guides, with the module
 * shape declared in `apps/web/src/types.d.ts`. Keeping the import in one
 * module means each governance page carries a single import rather than
 * reaching into `dist/` five times over.
 */
import {
  SOURCE_HIERARCHY,
  PLATFORM_UPDATES,
  VERIFICATION_SNAPSHOT,
  provenanceSummary,
  calculatorProvenance,
} from "../../../../dist/packages/governance/src/index.js";

/**
 * Types are derived from the imported values rather than imported by name.
 *
 * The two TypeScript projects that compile this file resolve the governance
 * module differently - one through the ambient declaration, one through the
 * emitted JavaScript - and only one of them can see exported type aliases.
 * Deriving the shapes from the values themselves satisfies both, and matches
 * how `calculators.ts` already types the registry.
 */
export type SourceTierDefinition = (typeof SOURCE_HIERARCHY)[number];
export type PlatformUpdate = (typeof PLATFORM_UPDATES)[number];
export type VerificationSnapshot = typeof VERIFICATION_SNAPSHOT;
export type ProvenanceSummary = ReturnType<typeof provenanceSummary>;
export type CalculatorProvenance = ReturnType<typeof calculatorProvenance>[number];

export const sourceHierarchy = SOURCE_HIERARCHY;
export const platformUpdates = PLATFORM_UPDATES;
export const verificationSnapshot = VERIFICATION_SNAPSHOT;

/**
 * The date the governance pages evaluate review freshness against.
 *
 * Resolved once at module load, which for these statically rendered pages is
 * build time, so every page in a single build agrees on "today" rather than
 * each computing its own and disagreeing across a midnight boundary.
 */
export const AS_OF: string = new Date().toISOString().slice(0, 10);

export function governanceSummary(asOf: string = AS_OF) {
  return provenanceSummary(asOf);
}

export function governanceProvenance(asOf: string = AS_OF) {
  return calculatorProvenance(asOf);
}

/** A date rendered for a British reader, e.g. "26 August 2026". */
export function formatGovernanceDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** A month and year, for wording like "Sources reviewed: August 2026". */
export function formatGovernanceMonth(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
