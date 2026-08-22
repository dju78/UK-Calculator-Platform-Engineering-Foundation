declare module "*/dist/packages/calculation-engine/src/engine.js" {
  export function calculate(calculatorId: string, inputs: Record<string, string | number>, context?: any): any;
}

declare module "*/dist/packages/calculator-registry/src/index.js" {
  export const wave1Registry: any[];
  export function getCalculatorDefinition(idOrSlug: string): any;
}
