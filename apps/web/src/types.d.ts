declare module "*/dist/packages/calculation-engine/src/engine.js" {
  export function calculate(calculatorId: string, inputs: Record<string, string | number>, context?: any): any;
  export function implementedCalculatorIds(): string[];
}

declare module "*/dist/packages/calculator-registry/src/index.js" {
  export interface CalculatorDefinition {
    id: string;
    name: string;
    slug: string;
    category: string;
    subcategory: string;
    version: string;
    status: string;
    launchWave: string;
    rulesSensitive: boolean;
    risk: string;
    benchmarkCount: number;
    specFile: string;
    implementationStatus: string;
    jurisdiction?: string;
    aliases?: string[];
  }
  export const wave1Registry: CalculatorDefinition[];
  export const wave2Registry: CalculatorDefinition[];
  export const calculatorRegistry: CalculatorDefinition[];
  export function publishedRegistry(implementedIds?: readonly string[]): CalculatorDefinition[];
  export function getCalculatorDefinition(idOrSlug: string): CalculatorDefinition | undefined;
}

declare module "*/dist/packages/governance/src/index.js" {
  export type SourceTier = 1 | 2 | 3;
  export interface SourceTierDefinition {
    tier: SourceTier;
    name: string;
    description: string;
    standing: string;
    publishers: string[];
  }

  export type RuleSensitivity = "rules-sensitive" | "general";
  export type ReviewState =
    | "current"
    | "review-due"
    | "verification-required"
    | "not-yet-reviewed";

  export interface CalculatorProvenance {
    calculatorId: string;
    name: string;
    slug: string;
    category: string;
    jurisdiction: string;
    ruleSensitivity: RuleSensitivity;
    hasGuide: boolean;
    rulesetId?: string;
    rulesetTaxYear?: string;
    sourcesReviewedAt?: string;
    nextReviewDue?: string;
    reviewState: ReviewState;
    sourceCount: number;
    tier1SourceCount: number;
  }

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
    latestReviewDate?: string;
  }

  export type UpdateCategory =
    | "Statutory correction"
    | "New calculators"
    | "Editorial content"
    | "Trust and transparency"
    | "Discoverability"
    | "Platform";

  export interface PlatformUpdate {
    date: string;
    title: string;
    summary: string;
    category: UpdateCategory;
    affectedCalculators?: string[];
    reference?: { label: string; href: string };
  }

  export interface VerificationSnapshot {
    date: string;
    calculators: number;
    categories: number;
    referenceBenchmarkCases: number;
    unitAndContentTests: number;
    browserChecks: number;
    publishedGuides: number;
  }

  export const SOURCE_HIERARCHY: SourceTierDefinition[];
  export const PLATFORM_UPDATES: PlatformUpdate[];
  export const VERIFICATION_SNAPSHOT: VerificationSnapshot;
  export const REVIEW_STATE_LABELS: Record<ReviewState, string>;
  export function sourceTier(url: string): SourceTier;
  export function isPrimaryOfficialSource(url: string): boolean;
  export function provenanceSummary(asOf: string): ProvenanceSummary;
  export function calculatorProvenance(asOf: string): CalculatorProvenance[];
  export function nextReviewDue(
    reviewedAt: string,
    sensitivity: RuleSensitivity
  ): string;
  export function verificationSnapshotLabel(
    snapshot?: VerificationSnapshot
  ): string;
}
