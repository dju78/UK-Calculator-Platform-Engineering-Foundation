export type RiskLevel = "low" | "medium" | "high";
export type ImplementationStatus = "specified" | "implemented";

export interface CalculatorDefinition {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  version: string;
  status: string;
  launchWave: "Wave 1";
  rulesSensitive: boolean;
  risk: RiskLevel;
  benchmarkCount: number;
  specFile: string;
  implementationStatus: ImplementationStatus;
}
