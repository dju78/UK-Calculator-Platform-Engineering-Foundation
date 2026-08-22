import { CalculationValidationError } from "../../errors.js";
import type { CalculatorHandler } from "../../types.js";

function numberField(inputs: Record<string, unknown>, key: string): number {
  const value = inputs[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CalculationValidationError([`${key} must be a finite number`]);
  }
  return value;
}

export const compoundInterestHandler: CalculatorHandler = (inputs) => {
  const P = numberField(inputs, "P");
  const nominalRate = numberField(inputs, "nominal_rate");
  const m = numberField(inputs, "m");
  const years = numberField(inputs, "years");

  const issues: string[] = [];
  if (P < 0) issues.push("P must be greater than or equal to 0");
  if (!Number.isInteger(m) || m <= 0) issues.push("m must be a positive whole number");
  if (years < 0) issues.push("years must be greater than or equal to 0");
  if (nominalRate <= -m) issues.push("nominal_rate must be greater than -m so the periodic growth factor stays positive");
  if (issues.length) throw new CalculationValidationError(issues);

  const periodicRate = nominalRate / m;
  const periods = m * years;
  const futureValue = P * Math.pow(1 + periodicRate, periods);
  const interestEarned = futureValue - P;
  const effectiveAnnualRate = Math.pow(1 + periodicRate, m) - 1;

  return {
    outputs: {
      future_value: futureValue,
      fv: futureValue,
      interest_earned: interestEarned,
      effective_annual_rate: effectiveAnnualRate
    },
    warnings: years > 100 ? ["Very long time horizons can make small rate assumptions dominate the result."] : [],
    assumptions: [
      "The nominal annual rate remains constant for the full period.",
      "Interest compounds at the selected frequency.",
      "No tax, fees, withdrawals or additional contributions are included."
    ]
  };
};
