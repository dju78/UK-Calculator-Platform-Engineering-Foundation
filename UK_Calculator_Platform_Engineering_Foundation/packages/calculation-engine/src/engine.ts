import { getCalculatorDefinition } from "../../calculator-registry/src/index.js";
import { CalculatorNotImplementedError } from "./errors.js";
import type { CalculationContext, CalculationResult, CalculatorHandler, NumericInputs } from "./types.js";
import { compoundInterestHandler } from "./finance/tvm/compoundInterest.js";

export const ENGINE_VERSION = "0.1.0";

const handlers: Record<string, CalculatorHandler> = {
  "INV-002": compoundInterestHandler
};

export function implementedCalculatorIds(): string[] {
  return Object.keys(handlers).sort();
}

export function calculate(calculatorId: string, inputs: NumericInputs, context: CalculationContext = {}): CalculationResult {
  const definition = getCalculatorDefinition(calculatorId);
  if (!definition) throw new Error(`Unknown calculator: ${calculatorId}`);
  const handler = handlers[definition.id];
  if (!handler) throw new CalculatorNotImplementedError(definition.id);
  const payload = handler(inputs, context);
  return {
    calculatorId: definition.id,
    calculatorVersion: definition.version,
    inputs,
    outputs: payload.outputs,
    schedule: payload.schedule,
    warnings: payload.warnings ?? [],
    assumptions: payload.assumptions ?? [],
    engineVersion: ENGINE_VERSION,
    rulesetId: definition.rulesSensitive ? (context.rulesetId ?? null) : null,
    calculatedAt: (context.now ?? new Date()).toISOString()
  };
}
