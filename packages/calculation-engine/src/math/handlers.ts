import { CalculatorHandler, NumericInputs, CalculationContext } from "../types.js";
import { evaluateExpression, percentageCalculator, ratioCalculator, fractionCalculator } from "./core.js";

export const mat002Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const { expression, angle } = inputs as any;
  const result = evaluateExpression(expression, angle);
  return {
    outputs: { result }
  };
};

export const mat003Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const outputs = percentageCalculator(inputs);
  return { outputs };
};

export const mat005Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const outputs = ratioCalculator(inputs);
  return { outputs };
};

export const mat006Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const outputs = fractionCalculator(inputs);
  return { outputs };
};
