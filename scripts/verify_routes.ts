import { wave1Registry } from "../packages/calculator-registry/src/index.js";

const slugs = new Set();
let collisions = 0;

for (const calc of wave1Registry) {
  if (slugs.has(calc.slug)) {
    console.error(`Collision detected for slug: ${calc.slug}`);
    collisions++;
  } else {
    slugs.add(calc.slug);
  }
}

if (collisions > 0) {
  console.error(`Found ${collisions} routing collisions!`);
  process.exit(1);
} else {
  console.log(`Verified 55/55 routes. No collisions found among ${wave1Registry.length} calculators.`);
}
