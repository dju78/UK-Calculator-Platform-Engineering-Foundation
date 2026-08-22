export type NumericInputs = Record<string, unknown>;

export interface CalculationContext {
  rulesetId?: string;
  taxYear?: string;
  now?: Date;
}

export interface CalculationResult<TOutputs extends Record<string, unknown> = Record<string, unknown>> {
  calculatorId: string;
  calculatorVersion: string;
  inputs: NumericInputs;
  outputs: TOutputs;
  schedule?: unknown[];
  warnings: string[];
  assumptions: string[];
  engineVersion: string;
  rulesetId: string | null;
  calculatedAt: string;
}

type HandlerResult = {
  outputs: Record<string, unknown>;
  schedule?: unknown[];
  warnings?: string[];
  assumptions?: string[];
};

export type CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => HandlerResult | Promise<HandlerResult>;
