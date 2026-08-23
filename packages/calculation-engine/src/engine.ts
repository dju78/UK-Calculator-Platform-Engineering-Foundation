import { getCalculatorDefinition } from "../../calculator-registry/src/index.js";
import { CalculatorNotImplementedError } from "./errors.js";
import type { CalculationContext, CalculationResult, CalculatorHandler, NumericInputs } from "./types.js";
import { compoundInterestHandler } from "./finance/tvm/compoundInterest.js";
import { fin001Handler, fin002Handler, pro001Handler, pro003Handler, pro004Handler } from "./finance/loan/handlers.js";
import { inv001Handler, inv003Handler, inv006Handler, inv007Handler, inv008Handler, inv009Handler, inv011Handler, inv014Handler, inv015Handler } from "./finance/investment/handlers.js";
import { tax001Handler, tax002Handler, tax003Handler, tax004Handler, tax015Handler, tax020Handler, pro023Handler, isa001Handler, isa002Handler } from "./finance/tax/handlers.js";
import { fin006Handler, fin009Handler, fin011Handler, fin013Handler } from "./finance/personal/handlers.js";
import { sta001Handler, sta003Handler, sta006Handler, sta008Handler, sta014Handler } from "./statistics/handlers.js";
import { bus001Handler, bus006Handler, bus008Handler } from "./business/handlers.js";
import { mat002Handler, mat003Handler, mat005Handler, mat006Handler } from "./math/handlers.js";
import { handleLoanToValue, handlePropertyDeposit, handleRentalYield, handleBuyToLet, handlePropertyRoi, handleMortgageAffordability } from "./finance/property/handlers.js";
import { utilitiesHandlers } from "./utilities/handlers.js";
import { handlePensionGrowth, handleSippGrowth, handleWorkplacePension, handleRetirement } from "./finance/pension/handlers.js";
import { hlt001Handler } from "./health/handlers.js";
import { con010Handler } from "./conversion/handlers.js";
// --- Wave 2 ---
import {
  fin003Handler, fin004Handler, fin007Handler, fin008Handler,
  fin010Handler, fin012Handler, fin014Handler, fin015Handler
} from "./finance/wave2/handlers.js";
import {
  pro005Handler, pro006Handler, pro007Handler, pro009Handler, pro012Handler,
  pro014Handler, pro015Handler, pro017Handler, pro020Handler, pro021Handler,
  pro022Handler, pro024Handler, pro025Handler, pro026Handler, pro027Handler
} from "./finance/wave2/property-handlers.js";

export const ENGINE_VERSION = "0.1.0";

const handlers: Record<string, CalculatorHandler> = {
  "BUS-001": bus001Handler,
  "BUS-006": bus006Handler,
  "BUS-008": bus008Handler,
  "STA-001": sta001Handler,
  "STA-003": sta003Handler,
  "STA-006": sta006Handler,
  "STA-008": sta008Handler,
  "STA-014": sta014Handler,
  "INV-001": inv001Handler,
  "INV-002": compoundInterestHandler,
  "INV-003": inv003Handler,
  "INV-006": inv006Handler,
  "INV-007": inv007Handler,
  "INV-008": inv008Handler,
  "INV-009": inv009Handler,
  "INV-011": inv011Handler,
  "INV-014": inv014Handler,
  "INV-015": inv015Handler,
  "FIN-001": fin001Handler,
  "FIN-002": fin002Handler,
  "FIN-006": fin006Handler,
  "FIN-009": fin009Handler,
  "FIN-011": fin011Handler,
  "FIN-013": fin013Handler,
  "PRO-001": pro001Handler,
  "PRO-002": handleMortgageAffordability,
  "PRO-003": pro003Handler,
  "PRO-004": pro004Handler,

  // --- Wave 2: Finance & Debt ---
  "FIN-003": fin003Handler,
  "FIN-004": fin004Handler,
  "FIN-007": fin007Handler,
  "FIN-008": fin008Handler,
  "FIN-010": fin010Handler,
  "FIN-012": fin012Handler,
  "FIN-014": fin014Handler,
  "FIN-015": fin015Handler,

  // --- Wave 2: Mortgages & Property ---
  "PRO-005": pro005Handler,
  "PRO-006": pro006Handler,
  "PRO-007": pro007Handler,
  "PRO-009": pro009Handler,
  "PRO-012": pro012Handler,
  "PRO-014": pro014Handler,
  "PRO-015": pro015Handler,
  "PRO-017": pro017Handler,
  "PRO-020": pro020Handler,
  "PRO-021": pro021Handler,
  "PRO-022": pro022Handler,
  "PRO-024": pro024Handler,
  "PRO-025": pro025Handler,
  "PRO-026": pro026Handler,
  "PRO-027": pro027Handler,
  "TAX-001": tax001Handler,
  "TAX-002": tax002Handler,
  "TAX-003": tax003Handler,
  "TAX-004": tax004Handler,
  "TAX-015": tax015Handler,
  "TAX-020": tax020Handler,
  "PRO-023": pro023Handler,
  "ISA-001": isa001Handler,
  "ISA-002": isa002Handler,
  "MAT-002": mat002Handler,
  "MAT-003": mat003Handler,
  "MAT-005": mat005Handler,
  "MAT-006": mat006Handler,
  "PRO-010": handleLoanToValue,
  "PRO-011": handlePropertyDeposit,
  "PRO-016": handleRentalYield,
  "PRO-018": handleBuyToLet,
  "PRO-019": handlePropertyRoi,
  "DAT-001": utilitiesHandlers["DAT-001"],
  "AUT-006": utilitiesHandlers["AUT-006"],
  "CON-001": utilitiesHandlers["CON-001"],
  "CON-010": con010Handler,
  "HLT-001": hlt001Handler,
  "PEN-001": handlePensionGrowth,
  "PEN-002": handleSippGrowth,
  "PEN-003": handleWorkplacePension,
  "PEN-006": handleRetirement
};

export function implementedCalculatorIds(): string[] {
  return Object.keys(handlers).sort();
}

/** Turn an output key into something readable in an error message. */
function humanKey(key: string): string {
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export async function calculate(calculatorId: string, inputs: NumericInputs, context: CalculationContext = {}): Promise<CalculationResult> {
  const definition = getCalculatorDefinition(calculatorId);
  if (!definition) throw new Error(`Unknown calculator: ${calculatorId}`);
  const handler = handlers[definition.id];
  if (!handler) throw new CalculatorNotImplementedError(definition.id);

  // --- Input guard -------------------------------------------------------
  // A non-finite number is never a legitimate input. Rejecting it here means
  // every calculator gets the same accessible validation message instead of
  // quietly propagating NaN through the arithmetic.
  for (const [key, value] of Object.entries(inputs ?? {})) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(`${humanKey(key)} must be a valid number.`);
    }
  }

  const payload = await handler(inputs, context);

  // --- Output guard ------------------------------------------------------
  // NaN and Infinity must never reach a user. They mean a required input was
  // missing, or the inputs implied a division by zero (a payment that never
  // clears a balance, a zero denominator). Either way the honest response is
  // a validation message, not a number that looks like a result.
  // `null` is deliberately allowed: several calculators use it to say
  // "undefined in this scenario" (markup at zero cost, ICR at zero interest).
  for (const [key, value] of Object.entries(payload.outputs ?? {})) {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(
        `${humanKey(key)} could not be calculated from these inputs. Check that every required value is filled in and that no figure is zero where a division is needed.`
      );
    }
  }

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
