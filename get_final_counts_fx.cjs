const fs = require('fs');
const { wave1Registry, validateRegistry } = require('./dist/packages/calculator-registry/src/index.js');
const { implementedCalculatorIds } = require('./dist/packages/calculation-engine/src/engine.js');

let totalFixtures = 0, executed = 0, passed = 0, failed = 0, skipped = 0;
const benchmarks = JSON.parse(fs.readFileSync('packages/test-fixtures/fixtures/wave1-benchmarks.json', 'utf8'));
const implemented = implementedCalculatorIds();

const ruleSensitive = ["PRO-023", "ISA-001", "ISA-002", "TAX-001", "TAX-002", "TAX-003", "TAX-004", "TAX-015", "TAX-020"];
const ruleSensitiveResults = {};

async function runBenchmarks() {
  const { calculate } = await import('./dist/packages/calculation-engine/src/engine.js');
  for (const [calculatorId, fixtures] of Object.entries(benchmarks)) {
    if (!implemented.includes(calculatorId)) {
      skipped += fixtures.length;
      continue;
    }
    for (const fixture of fixtures) {
      executed++;
      try {
        const result = await calculate(calculatorId, fixture.inputs, {now:new Date("2026-08-22T08:00:00Z")});
        const differences = Object.entries(fixture.expected).filter(([key, expected]) => {
          if (typeof expected !== "number") return false;
          const actual = Number(result.outputs[key]);
          return !Number.isFinite(actual) || Math.abs(actual - expected) > 0.011;
        });
        if (differences.length) {
          failed++;
        } else {
          passed++;
        }
      } catch (error) {
        failed++;
      }
    }
  }

  console.log(`BENCHMARK: ${executed} TOTAL, ${passed} PASSED`);
}

runBenchmarks().then(() => {
  let uiImplementedCount = 0, verifiedCount = 0, engineMissingCount = 0;
  for (const c of wave1Registry) {
    if (c.implementationStatus === 'implemented') uiImplementedCount++;
    if (c.status === 'verified') verifiedCount++;
    if (!implemented.includes(c.id)) engineMissingCount++;
  }
  console.log('\nTOTAL ENGINE IMPLEMENTED', implemented.length);
  console.log('TOTAL UI IMPLEMENTED', uiImplementedCount);
  console.log('TOTAL VERIFIED', verifiedCount);
  console.log('TOTAL NOT VERIFIED', wave1Registry.length - verifiedCount);
  console.log('TOTAL ENGINE MISSING', engineMissingCount);
});
