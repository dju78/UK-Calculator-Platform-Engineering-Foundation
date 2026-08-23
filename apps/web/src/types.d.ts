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
