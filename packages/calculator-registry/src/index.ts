import rawWave1 from "./wave1-registry.json" with { type: "json" };
import rawWave2 from "./wave2-registry.json" with { type: "json" };
import rawWave3 from "./wave3-registry.json" with { type: "json" };
import type { CalculatorDefinition } from "./types.js";

export const wave1Registry = rawWave1 as CalculatorDefinition[];
export const wave2Registry = rawWave2 as CalculatorDefinition[];
export const wave3Registry = rawWave3 as CalculatorDefinition[];

/** Every calculator across all launch waves. */
export const calculatorRegistry: CalculatorDefinition[] = [...wave1Registry, ...wave2Registry, ...wave3Registry];

/**
 * Calculators that should be publicly routable and listed.
 *
 * Wave 2 entries appear only once their engine exists, so that pushing to main
 * (which auto-deploys) can never expose an unbuilt calculator as if it were
 * live. Wave 1 is always included - it is the production baseline.
 */
/**
 * The set of calculators the site is allowed to publish.
 *
 * A Wave 2 calculator must clear BOTH gates: an engine handler must exist, and
 * the registry must record it as verified.
 *
 * Requiring only the handler is not enough, and that was a real hole. A
 * handler is written first, before the benchmarks, the UI field definitions,
 * the specification and the registry promotion. Publishing on the handler
 * alone put a live page in front of users for a calculator with no input
 * fields at all, the moment its engine code was wired up. Requiring `verified`
 * as well means a calculator becomes public only once its evidence exists.
 */
export function publishedRegistry(
  implementedIds: readonly string[] = []
): CalculatorDefinition[] {
  const implemented = new Set(implementedIds);
  return calculatorRegistry.filter(
    (c) => c.launchWave === "Wave 1" || (implemented.has(c.id) && c.status === "verified")
  );
}

export function getCalculatorDefinition(idOrSlug: string): CalculatorDefinition | undefined {
  const needle = idOrSlug.trim().toLowerCase();
  return calculatorRegistry.find(
    (item) => item.id.toLowerCase() === needle || item.slug === needle
  );
}

const VALID_STATUS = ["specified", "planned", "verified"];
const VALID_IMPLEMENTATION = ["specified", "implemented"];
const VALID_RISK = ["low", "medium", "high"];
const VALID_WAVES = ["Wave 1", "Wave 2", "Wave 3"];

export interface RegistryIntegrityOptions {
  /** Calculator ids that have an engine handler. */
  implementedIds?: readonly string[];
  /** Benchmark case counts by calculator id. */
  benchmarkCounts?: Record<string, number>;
  /** Categories considered valid. Defaults to those present in the registry. */
  validCategories?: readonly string[];
}

/**
 * Registry integrity checks.
 *
 * Structural rules apply to every entry. Evidence-based rules (engine exists,
 * benchmarks present) apply only where the caller supplies that evidence, so
 * the same function serves both a quick structural check and the full
 * release gate.
 */
export function validateRegistry(
  registry: CalculatorDefinition[] = calculatorRegistry,
  options: RegistryIntegrityOptions = {}
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const categories = new Set(
    options.validCategories ?? calculatorRegistry.map((c) => c.category)
  );

  for (const item of registry) {
    if (!item.id || !item.name || !item.slug) {
      errors.push(`Missing required registry metadata: ${item.id}`);
    }
    if (!VALID_STATUS.includes(item.status)) {
      errors.push(`Invalid status for ${item.id}: ${item.status}`);
    }
    if (!VALID_IMPLEMENTATION.includes(item.implementationStatus)) {
      errors.push(`Invalid implementationStatus for ${item.id}: ${item.implementationStatus}`);
    }
    if (!VALID_RISK.includes(item.risk)) {
      errors.push(`Invalid risk for ${item.id}: ${item.risk}`);
    }
    if (!VALID_WAVES.includes(item.launchWave)) {
      errors.push(`Invalid launchWave for ${item.id}: ${item.launchWave}`);
    }
    if (!categories.has(item.category)) {
      errors.push(`Unknown category for ${item.id}: ${item.category}`);
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(item.slug)) {
      errors.push(`Slug is not a clean kebab slug for ${item.id}: ${item.slug}`);
    }
    if (ids.has(item.id)) errors.push(`Duplicate calculator id: ${item.id}`);
    if (slugs.has(item.slug)) errors.push(`Duplicate calculator slug: ${item.slug}`);
    ids.add(item.id);
    slugs.add(item.slug);

    // --- Evidence-based rules -------------------------------------------
    const implemented = options.implementedIds
      ? options.implementedIds.includes(item.id)
      : undefined;
    const benchmarks = options.benchmarkCounts?.[item.id];

    if (implemented !== undefined) {
      if (item.implementationStatus === "implemented" && !implemented) {
        errors.push(`${item.id} is marked implemented but has no engine handler`);
      }
      if (item.status === "verified" && !implemented) {
        errors.push(`${item.id} is verified but has no engine handler`);
      }
    }
    if (item.status === "verified" && item.implementationStatus !== "implemented") {
      errors.push(`${item.id} is verified but implementationStatus is not implemented`);
    }
    if (benchmarks !== undefined) {
      if (item.benchmarkCount !== benchmarks) {
        errors.push(
          `${item.id} declares ${item.benchmarkCount} benchmarks but ${benchmarks} exist`
        );
      }
      if (item.status === "verified" && benchmarks < 5) {
        errors.push(`${item.id} is verified with fewer than five benchmark cases`);
      }
    }
    if (item.status === "verified" && item.benchmarkCount < 5) {
      errors.push(`${item.id} is verified but declares fewer than five benchmark cases`);
    }
  }
  return errors;
}

export function listWave(wave: CalculatorDefinition["launchWave"]): CalculatorDefinition[] {
  return calculatorRegistry.filter((c) => c.launchWave === wave);
}

export { getCalculatorDisclaimer, type DisclaimerResolutionContext } from "./disclaimers.js";
export type { CalculatorDefinition } from "./types.js";
