import rawRegistry from "./wave1-registry.json" with { type: "json" };
import type { CalculatorDefinition } from "./types.js";

export const wave1Registry = rawRegistry as CalculatorDefinition[];

export function getCalculatorDefinition(idOrSlug: string): CalculatorDefinition | undefined {
  const needle = idOrSlug.trim().toLowerCase();
  return wave1Registry.find((item) => item.id.toLowerCase() === needle || item.slug === needle);
}

export function validateRegistry(registry: CalculatorDefinition[] = wave1Registry): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const item of registry) {
    if (!item.id || !item.name || !item.slug) errors.push(`Missing required registry metadata: ${JSON.stringify(item)}`);
    if (ids.has(item.id)) errors.push(`Duplicate calculator id: ${item.id}`);
    if (slugs.has(item.slug)) errors.push(`Duplicate calculator slug: ${item.slug}`);
    ids.add(item.id);
    slugs.add(item.slug);
    if (item.benchmarkCount < 5) errors.push(`${item.id} has fewer than five benchmark cases`);
  }
  return errors;
}

export type { CalculatorDefinition } from "./types.js";
