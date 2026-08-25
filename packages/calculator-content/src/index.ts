/**
 * The published set of calculator guides.
 *
 * Guides are added a batch at a time. A calculator without a guide simply
 * renders as it did before Phase 2, so partial coverage is a supported state
 * rather than a broken one.
 */
import type { CalculatorGuideDefinition } from "./types.js";
import { batch1TaxSalaryGuides } from "./batch1-tax-salary.js";
import { batch2MortgagesPropertyGuides } from "./batch2-mortgages-property.js";

export const allGuides: CalculatorGuideDefinition[] = [
  ...batch1TaxSalaryGuides,
  ...batch2MortgagesPropertyGuides,
];

/** Guides keyed by calculator id, for O(1) lookup during rendering. */
const guidesById = new Map<string, CalculatorGuideDefinition>(
  allGuides.map((g) => [g.calculatorId, g])
);

/** The guide for a calculator, or undefined where none has been authored yet. */
export function getCalculatorGuide(
  calculatorId: string
): CalculatorGuideDefinition | undefined {
  return guidesById.get(calculatorId.trim().toUpperCase());
}

/** Ids that currently have a published guide. */
export function guidedCalculatorIds(): string[] {
  return allGuides.map((g) => g.calculatorId).sort();
}

export type { CalculatorGuideDefinition } from "./types.js";
export { TOP_40_IDS, TOP_40_GROUPS, planSubstitutions, planLabelCorrections } from "./top40.js";
