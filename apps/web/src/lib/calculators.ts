/**
 * The set of calculators the site publishes.
 *
 * Wave 1 is always published - it is the production baseline. A Wave 2
 * calculator appears only once it has an engine handler, so pushing to a
 * branch that auto-deploys can never expose an unbuilt calculator as though it
 * were live. This is the feature gate for the Wave 2 rollout.
 */
import { publishedRegistry } from "../../../../dist/packages/calculator-registry/src/index.js";
import { implementedCalculatorIds } from "../../../../dist/packages/calculation-engine/src/engine.js";

export type CalculatorDefinition = (ReturnType<typeof publishedRegistry>)[number];

export const liveCalculators: CalculatorDefinition[] = publishedRegistry(
  implementedCalculatorIds()
);

export const liveCategories: string[] = Array.from(
  new Set(liveCalculators.map((c) => c.category))
).sort();

export function getLiveCalculator(slugOrId: string): CalculatorDefinition | undefined {
  const needle = slugOrId.trim().toLowerCase();
  return liveCalculators.find(
    (c) => c.slug === needle || c.id.toLowerCase() === needle
  );
}

export function liveCalculatorsInCategory(categoryLower: string): CalculatorDefinition[] {
  return liveCalculators.filter((c) => c.category.toLowerCase() === categoryLower);
}

