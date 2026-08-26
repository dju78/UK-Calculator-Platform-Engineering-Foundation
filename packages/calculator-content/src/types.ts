/**
 * Phase 2 editorial content architecture.
 *
 * A guide is structured data, not a prose blob dropped into a page component.
 * That choice buys four things the regression suite can actually enforce:
 *
 *  1. A worked example carries the exact engine inputs that produced it, so a
 *     test can re-run the calculation engine and prove every published figure
 *     still matches. Content cannot silently drift from the arithmetic it
 *     claims to explain, and no example can contradict engine behaviour.
 *  2. Sources are typed objects with an explicit verification status, so the
 *     platform can never present an unchecked figure as a verified fact.
 *  3. Rule-sensitive guides must name the ruleset their figures come from.
 *  4. Structured content can be validated: required sections, real calculator
 *     ids in related links, no placeholder text, no internal terminology.
 *
 * Phase 2 owns this data. Phase 3 owns how links, metadata and structured data
 * are rendered globally.
 */

/**
 * Whether the factual claims in a guide have actually been checked against an
 * official source.
 *
 * "VERIFIED" is a statement about work that was genuinely done. It must never
 * be set because a figure looked plausible, or because a planning document
 * asserted it.
 */
export type RuleStatus =
  | "VERIFIED"
  | "SOURCE VERIFICATION REQUIRED"
  | "NOT RULE-SENSITIVE";

/** What kind of authority a source carries. */
export type SourceType =
  | "legislation"
  | "government-guidance"
  | "regulator"
  | "statistics"
  | "clinical-guidance";

/** Per-source verification state. */
export type SourceVerificationStatus = "VERIFIED" | "SOURCE VERIFICATION REQUIRED";

/** An official source backing a specific factual claim in the guide. */
export interface OfficialSource {
  title: string;
  /** The publishing body, e.g. "HMRC", "GOV.UK", "Bank of England", "NHS". */
  publisher: string;
  /** Absolute HTTPS URL on an official domain. Never invented. */
  url: string;
  sourceType: SourceType;
  verificationStatus: SourceVerificationStatus;
  /** Which rule or figure in this guide the source supports. */
  applicableRule: string;
  /**
   * Only populated where the source itself stated the period. An absent value
   * means the page did not say, which is materially different from a guess.
   */
  effectivePeriod?: string;
}

/** One question and answer. Genuine practical questions only, never keyword variants. */
export interface GuideFaq {
  question: string;
  answer: string;
}

/** An input as shown to the reader, in the calculator's own field labels. */
export interface WorkedExampleInput {
  label: string;
  /** The value as displayed, including units, e.g. "£55,000". */
  display: string;
}

/** A single figure the engine returned for the worked example. */
export interface WorkedExampleOutput {
  /** Engine output key. Must exist in the engine result for these inputs. */
  key: string;
  label: string;
  /**
   * The value the engine returns. Asserted against a live engine run by
   * tests/calculator-guides.test.ts, so an engine change that moves this
   * number fails the suite rather than leaving a stale figure published.
   */
  value: number | string;
  /**
   * "percentValue" means the number is already in percentage units (30 -> 30%),
   * matching the engine outputs these guides quote. There is deliberately no
   * decimal-fraction percent format here.
   *
   * "date" and "text" carry string outputs, such as an estimated due date.
   * Only outputs that are stable for the given inputs may be published: an
   * output that depends on today's date changes daily and must not be quoted
   * as a fixed figure.
   */
  format: "currency" | "percentValue" | "number" | "date" | "text";
}

/** A concrete, reproducible example run of the calculator. */
export interface WorkedExample {
  /** One sentence: who this person is and what they want to know. */
  scenario: string;
  /**
   * Exact inputs passed to `calculate()`. Engine-level values: any percentage
   * the UI scales at its input boundary is already scaled here.
   */
  engineInputs: Record<string, unknown>;
  /**
   * Pins the date the example was computed on, for the handful of calculators
   * that read the current date. Without it, a dated example both drifts and
   * eventually falls outside the calculator's own validation window as real
   * time passes. ISO date, e.g. "2026-08-25".
   */
  engineNow?: string;
  /** The same inputs restated for the reader. */
  displayInputs: WorkedExampleInput[];
  /** The arithmetic, one step per line, in the order it is applied. */
  steps: string[];
  /** Selected engine outputs, verified against a live run. */
  outputs: WorkedExampleOutput[];
}

/** The governing formula and the ordered steps behind it. */
export interface FormulaExplanation {
  /** The rule written plainly, not as code. */
  formula: string;
  steps: string[];
}

/** An editorially meaningful pointer to another calculator. */
export interface RelatedCalculator {
  /** Id of a calculator that is live on the platform. */
  calculatorId: string;
  /** Why a reader of this page would genuinely want that one next. */
  why: string;
}

/** Which ruleset version the figures in a guide are stated against. */
export interface GuideRuleset {
  id: string;
  taxYear: string;
}

/** The complete authored guide for one calculator. */
export interface CalculatorGuideDefinition {
  calculatorId: string;
  /** Editorial heading for the guide. Never an internal engineering id. */
  title: string;
  /** One or two sentences a reader could take away on its own. */
  summary: string;
  /** What the calculator actually does, and what it deliberately does not. */
  purpose: string[];
  /** How the calculation works, in prose. Length follows informational need. */
  methodology: string;
  formulaExplanation: FormulaExplanation;
  workedExample: WorkedExample;
  /** Modelling choices the reader should know about. */
  assumptions: string[];
  /** Where the model stops being a reliable guide. */
  limitations: string[];
  ruleStatus: RuleStatus;
  /** Required whenever ruleStatus is not "NOT RULE-SENSITIVE". */
  ruleset?: GuideRuleset;
  officialSources: OfficialSource[];
  relatedCalculators: RelatedCalculator[];
  faqs: GuideFaq[];
  /** Internal notes for maintainers. Never rendered to the public. */
  editorialNotes?: string[];
  /** ISO date the content was last checked against sources. */
  lastReviewed: string;
}
