/**
 * Route integrity across every launch wave.
 *
 * Counts are derived from the registry, never written into the message, so
 * this cannot report "55/55" while the registry has moved on.
 */
import {
  calculatorRegistry,
  publishedRegistry,
  validateRegistry
} from "../packages/calculator-registry/src/index.js";
import { implementedCalculatorIds } from "../packages/calculation-engine/src/index.js";
import { allBenchmarks, caseCountsById } from "../packages/test-fixtures/src.js";

const implemented = implementedCalculatorIds();
const published = publishedRegistry(implemented);

const slugs = new Map<string, string>();
let collisions = 0;
for (const calc of calculatorRegistry) {
  const existing = slugs.get(calc.slug);
  if (existing) {
    console.error(`Slug collision: ${calc.slug} used by ${existing} and ${calc.id}`);
    collisions++;
  } else {
    slugs.set(calc.slug, calc.id);
  }
}

const errors = validateRegistry(calculatorRegistry, {
  implementedIds: implemented,
  benchmarkCounts: caseCountsById(allBenchmarks)
});

const byWave = (wave: string) => calculatorRegistry.filter((c) => c.launchWave === wave);
const publishedByWave = (wave: string) => published.filter((c) => c.launchWave === wave);

for (const wave of ["Wave 1", "Wave 2", "Wave 3"]) {
  const total = byWave(wave).length;
  const live = publishedByWave(wave).length;
  const verified = byWave(wave).filter((c) => c.status === "verified").length;
  console.log(
    `${wave}: ${live}/${total} routable, ${verified}/${total} verified`
  );
}
console.log(`Total routable: ${published.length}/${calculatorRegistry.length}`);

if (errors.length) {
  console.error(`\n${errors.length} registry integrity errors:`);
  for (const error of errors) console.error("  " + error);
}
if (collisions > 0) console.error(`\n${collisions} routing collisions.`);

if (collisions > 0 || errors.length > 0) process.exit(1);
console.log("Registry integrity and route uniqueness verified.");
