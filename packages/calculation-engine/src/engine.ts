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
import {
  inv004Handler, inv005Handler, inv010Handler, inv012Handler, inv013Handler,
  inv016Handler, inv017Handler, inv018Handler, inv019Handler, inv020Handler,
  inv021Handler, inv022Handler, inv023Handler, inv024Handler
} from "./finance/wave2/investment-handlers.js";
import {
  isa003Handler, isa004Handler, isa005Handler, isa006Handler,
  tax005Handler, tax006Handler, tax007Handler, tax008Handler, tax009Handler,
  tax010Handler, tax011Handler, tax012Handler, tax014Handler,
  tax016Handler, tax017Handler, tax018Handler
} from "./finance/wave2/isa-tax-handlers.js";
import {
  pen004Handler, pen005Handler, pen007Handler, pen008Handler,
  pen009Handler, pen010Handler, pen012Handler
} from "./finance/wave2/pension-handlers.js";
import {
  bus002Handler, bus003Handler, bus004Handler, bus005Handler, bus007Handler,
  bus009Handler, bus010Handler, bus011Handler, bus012Handler
} from "./finance/wave2/business-handlers.js";
import {
  sta002Handler, sta004Handler, sta005Handler, sta007Handler, sta009Handler,
  sta010Handler, sta011Handler, sta012Handler, sta013Handler, sta015Handler,
  sta016Handler, sta017Handler, sta018Handler, sta019Handler, sta020Handler
} from "./statistics/wave2-handlers.js";
import {
  mat001Handler, mat004Handler, mat007Handler, mat008Handler, mat009Handler,
  mat010Handler, mat011Handler, mat012Handler, mat013Handler, mat014Handler,
  mat015Handler, mat016Handler, mat017Handler, mat018Handler, mat019Handler,
  mat021Handler, mat022Handler, mat023Handler
} from "./math/wave2-handlers.js";
import {
  geo001Handler, geo002Handler, geo003Handler, geo004Handler, geo005Handler,
  geo006Handler, geo007Handler, geo008Handler, geo009Handler
} from "./geometry/handlers.js";
import {
  hlt002Handler, hlt003Handler, hlt004Handler, hlt005Handler, hlt006Handler,
  hlt007Handler, hlt008Handler, hlt009Handler, hlt010Handler, hlt011Handler,
  hlt012Handler, hlt013Handler, hlt014Handler, hlt015Handler, hlt016Handler,
  hlt017Handler, hlt019Handler, hlt020Handler, hlt022Handler, hlt023Handler,
  hlt025Handler
} from "./health/wave2-handlers.js";
import {
  dat002Handler, dat003Handler, dat004Handler, dat005Handler,
  dat006Handler, dat007Handler, dat008Handler, dat009Handler
} from "./utilities/wave2-handlers.js";
import {
  aut001Handler, aut002Handler, aut003Handler, aut004Handler, aut005Handler,
  aut007Handler, aut008Handler, aut009Handler, aut010Handler, aut011Handler,
  aut012Handler
} from "./automotive/wave2-handlers.js";
import {
  sci001Handler, sci002Handler, sci003Handler, sci004Handler, sci005Handler,
  sci006Handler, sci007Handler, sci008Handler, sci009Handler, sci010Handler,
  sci011Handler
} from "./science/wave2-handlers.js";
import {
  hom001Handler, hom002Handler, hom003Handler,
  hom004Handler, hom005Handler, hom006Handler
} from "./home/wave2-handlers.js";
import {
  con002Handler, con003Handler, con004Handler, con005Handler,
  con006Handler, con007Handler, con008Handler, con009Handler
} from "./conversion/wave2-handlers.js";
import {
  tec001Handler, tec002Handler, tec003Handler, tec004Handler, tec005Handler
} from "./technology/wave2-handlers.js";
import {
  edu001Handler, edu002Handler, edu003Handler, edu004Handler, edu005Handler,
  eve001Handler, eve003Handler
} from "./education/wave2-handlers.js";

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

  // --- Wave 2: Investing & Wealth ---
  "INV-004": inv004Handler,
  "INV-005": inv005Handler,
  "INV-010": inv010Handler,
  "INV-012": inv012Handler,
  "INV-013": inv013Handler,
  "INV-016": inv016Handler,
  "INV-017": inv017Handler,
  "INV-018": inv018Handler,
  "INV-019": inv019Handler,
  "INV-020": inv020Handler,
  "INV-021": inv021Handler,
  "INV-022": inv022Handler,
  "INV-023": inv023Handler,
  "INV-024": inv024Handler,

  // --- Wave 2: ISA & tax wrappers ---
  "ISA-003": isa003Handler,
  "ISA-004": isa004Handler,
  "ISA-005": isa005Handler,
  "ISA-006": isa006Handler,

  // --- Wave 2: UK Tax & Salary ---
  "TAX-005": tax005Handler,
  "TAX-006": tax006Handler,
  "TAX-007": tax007Handler,
  "TAX-008": tax008Handler,
  "TAX-009": tax009Handler,
  "TAX-010": tax010Handler,
  "TAX-011": tax011Handler,
  "TAX-012": tax012Handler,
  "TAX-014": tax014Handler,
  "TAX-016": tax016Handler,
  "TAX-017": tax017Handler,
  "TAX-018": tax018Handler,

  // --- Wave 2: Pensions & Retirement ---
  "PEN-004": pen004Handler,
  "PEN-005": pen005Handler,
  "PEN-007": pen007Handler,
  "PEN-008": pen008Handler,
  "PEN-009": pen009Handler,
  "PEN-010": pen010Handler,
  "PEN-012": pen012Handler,

  // --- Wave 2: Business & Commercial ---
  "BUS-002": bus002Handler,
  "BUS-003": bus003Handler,
  "BUS-004": bus004Handler,
  "BUS-005": bus005Handler,
  "BUS-007": bus007Handler,
  "BUS-009": bus009Handler,
  "BUS-010": bus010Handler,
  "BUS-011": bus011Handler,
  "BUS-012": bus012Handler,

  // --- Wave 2: Statistics & Data ---
  "STA-002": sta002Handler,
  "STA-004": sta004Handler,
  "STA-005": sta005Handler,
  "STA-007": sta007Handler,
  "STA-009": sta009Handler,
  "STA-010": sta010Handler,
  "STA-011": sta011Handler,
  "STA-012": sta012Handler,
  "STA-013": sta013Handler,
  "STA-015": sta015Handler,
  "STA-016": sta016Handler,
  "STA-017": sta017Handler,
  "STA-018": sta018Handler,
  "STA-019": sta019Handler,
  "STA-020": sta020Handler,

  // --- Wave 2: Maths & Algebra ---
  "MAT-001": mat001Handler,
  "MAT-004": mat004Handler,
  "MAT-007": mat007Handler,
  "MAT-008": mat008Handler,
  "MAT-009": mat009Handler,
  "MAT-010": mat010Handler,
  "MAT-011": mat011Handler,
  "MAT-012": mat012Handler,
  "MAT-013": mat013Handler,
  "MAT-014": mat014Handler,
  "MAT-015": mat015Handler,
  "MAT-016": mat016Handler,
  "MAT-017": mat017Handler,
  "MAT-018": mat018Handler,
  "MAT-019": mat019Handler,
  "MAT-021": mat021Handler,
  "MAT-022": mat022Handler,
  "MAT-023": mat023Handler,

  // --- Wave 2: Geometry ---
  "GEO-001": geo001Handler,
  "GEO-002": geo002Handler,
  "GEO-003": geo003Handler,
  "GEO-004": geo004Handler,
  "GEO-005": geo005Handler,
  "GEO-006": geo006Handler,
  "GEO-007": geo007Handler,
  "GEO-008": geo008Handler,
  "GEO-009": geo009Handler,

  // --- Wave 2: Health & Fitness ---
  "HLT-002": hlt002Handler,
  "HLT-003": hlt003Handler,
  "HLT-004": hlt004Handler,
  "HLT-005": hlt005Handler,
  "HLT-006": hlt006Handler,
  "HLT-007": hlt007Handler,
  "HLT-008": hlt008Handler,
  "HLT-009": hlt009Handler,
  "HLT-010": hlt010Handler,
  "HLT-011": hlt011Handler,
  "HLT-012": hlt012Handler,
  "HLT-013": hlt013Handler,
  "HLT-014": hlt014Handler,
  "HLT-015": hlt015Handler,
  "HLT-016": hlt016Handler,
  "HLT-017": hlt017Handler,
  "HLT-019": hlt019Handler,
  "HLT-020": hlt020Handler,
  "HLT-022": hlt022Handler,
  "HLT-023": hlt023Handler,
  "HLT-025": hlt025Handler,

  // --- Wave 2: Date & Time ---
  "DAT-002": dat002Handler,
  "DAT-003": dat003Handler,
  "DAT-004": dat004Handler,
  "DAT-005": dat005Handler,
  "DAT-006": dat006Handler,
  "DAT-007": dat007Handler,
  "DAT-008": dat008Handler,
  "DAT-009": dat009Handler,

  // --- Wave 2: Automotive & Travel ---
  "AUT-001": aut001Handler,
  "AUT-002": aut002Handler,
  "AUT-003": aut003Handler,
  "AUT-004": aut004Handler,
  "AUT-005": aut005Handler,
  "AUT-007": aut007Handler,
  "AUT-008": aut008Handler,
  "AUT-009": aut009Handler,
  "AUT-010": aut010Handler,
  "AUT-011": aut011Handler,
  "AUT-012": aut012Handler,

  // --- Wave 2: Science & Engineering ---
  "SCI-001": sci001Handler,
  "SCI-002": sci002Handler,
  "SCI-003": sci003Handler,
  "SCI-004": sci004Handler,
  "SCI-005": sci005Handler,
  "SCI-006": sci006Handler,
  "SCI-007": sci007Handler,
  "SCI-008": sci008Handler,
  "SCI-009": sci009Handler,
  "SCI-010": sci010Handler,
  "SCI-011": sci011Handler,

  // --- Wave 2: Home & Construction ---
  "HOM-001": hom001Handler,
  "HOM-002": hom002Handler,
  "HOM-003": hom003Handler,
  "HOM-004": hom004Handler,
  "HOM-005": hom005Handler,
  "HOM-006": hom006Handler,

  // --- Wave 2: Conversions ---
  "CON-002": con002Handler,
  "CON-003": con003Handler,
  "CON-004": con004Handler,
  "CON-005": con005Handler,
  "CON-006": con006Handler,
  "CON-007": con007Handler,
  "CON-008": con008Handler,
  "CON-009": con009Handler,

  // --- Wave 2: Technology & Digital ---
  "TEC-001": tec001Handler,
  "TEC-002": tec002Handler,
  "TEC-003": tec003Handler,
  "TEC-004": tec004Handler,
  "TEC-005": tec005Handler,

  // --- Wave 2: Education ---
  "EDU-001": edu001Handler,
  "EDU-002": edu002Handler,
  "EDU-003": edu003Handler,
  "EDU-004": edu004Handler,
  "EDU-005": edu005Handler,

  // --- Wave 2: Everyday & Lifestyle ---
  "EVE-001": eve001Handler,
  "EVE-003": eve003Handler,

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
