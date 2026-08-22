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
  "HLT-001": hlt001Handler,
  "PEN-001": handlePensionGrowth,
  "PEN-002": handleSippGrowth,
  "PEN-003": handleWorkplacePension,
  "PEN-006": handleRetirement
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
