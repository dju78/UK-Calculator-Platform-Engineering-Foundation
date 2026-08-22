import { calculate, implementedCalculatorIds } from "../packages/calculation-engine/src/index.js";
import { wave1Benchmarks } from "../packages/test-fixtures/src.js";

const supported = new Set(implementedCalculatorIds());
let pass = 0, fail = 0, skipped = 0;
for (const [calculatorId, fixtures] of Object.entries(wave1Benchmarks)) {
  if (!supported.has(calculatorId)) {
    skipped += fixtures.length;
    continue;
  }
  for (const fixture of fixtures) {
    try {
      const result = calculate(calculatorId, fixture.inputs, {now:new Date("2026-08-22T08:00:00Z")});
      const differences = Object.entries(fixture.expected).filter(([key, expected]) => {
        if (typeof expected !== "number") return false;
        const actual = Number(result.outputs[key]);
        return !Number.isFinite(actual) || Math.abs(actual - expected) > 0.011;
      });
      if (differences.length) {
        fail++;
        console.error(`FAIL ${calculatorId} ${fixture.scenario}: ${JSON.stringify(differences)}`);
      } else {
        pass++;
        console.log(`PASS ${calculatorId} ${fixture.scenario}`);
      }
    } catch (error) {
      fail++;
      console.error(`ERROR ${calculatorId} ${fixture.scenario}:`, error);
    }
  }
}
console.log(`\nBenchmark summary: ${pass} passed, ${fail} failed, ${skipped} skipped (not yet implemented).`);
if (fail > 0) process.exitCode = 1;
