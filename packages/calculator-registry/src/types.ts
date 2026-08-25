export type RiskLevel = "low" | "medium" | "high";
export type ImplementationStatus = "specified" | "implemented";
export type LaunchWave = "Wave 1" | "Wave 2" | "Wave 3";

/**
 * Registry status and implementationStatus are deliberately separate axes:
 *
 *   status               planned -> specified -> verified
 *                        "verified" means the Definition of Done is met:
 *                        engine, UI, benchmarks, tests and documentation.
 *
 *   implementationStatus specified -> implemented
 *                        purely whether code exists. It must never be set to
 *                        "verified"; that is not a value of this axis.
 */
export interface CalculatorDefinition {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  version: string;
  status: string;
  launchWave: LaunchWave;
  rulesSensitive: boolean;
  risk: RiskLevel;
  benchmarkCount: number;
  specFile: string;
  implementationStatus: ImplementationStatus;
  /** Wave 2 additions - optional so Wave 1 records stay valid unchanged. */
  jurisdiction?: string;
  aliases?: string[];
}
