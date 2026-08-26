/**
 * A dated record of what the automated suites actually executed.
 *
 * Test totals are published as a snapshot with a date attached, never woven
 * into evergreen prose. The difference matters: "the suite runs 1,489
 * benchmark cases" reads as a permanent property of the platform and silently
 * becomes a lie the next time a case is added, whereas a dated snapshot stays
 * true forever and tells the reader exactly how old the figure is.
 *
 * Every number below was taken from an actual executed run on `date`, not from
 * a planning document. The accompanying Phase 4 report records the commands
 * and their output. If you change these figures, re-run the suites first.
 */

export interface VerificationSnapshot {
  /** ISO date the suites below were executed. */
  date: string;
  /** Calculators published by the registry and engine. */
  calculators: number;
  /** Distinct published categories. */
  categories: number;
  /** Cases in the combined reference benchmark suite. */
  referenceBenchmarkCases: number;
  /** Assertions in the unit, content, SEO and governance suite. */
  unitAndContentTests: number;
  /** Checks in the browser-level regression and parity suite. */
  browserChecks: number;
  /** Editorial guides published with sources and a verified worked example. */
  publishedGuides: number;
}

export const VERIFICATION_SNAPSHOT: VerificationSnapshot = {
  date: "2026-08-26",
  calculators: 253,
  categories: 19,
  referenceBenchmarkCases: 1489,
  unitAndContentTests: 1057,
  browserChecks: 1669,
  publishedGuides: 40,
};

/** The snapshot date rendered for a British reader, e.g. "26 August 2026". */
export function verificationSnapshotLabel(
  snapshot: VerificationSnapshot = VERIFICATION_SNAPSHOT
): string {
  return new Date(`${snapshot.date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
