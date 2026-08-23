/**
 * Canonical benchmark runner for every launch wave.
 *
 * Every count here is derived from actual execution. Nothing is hard-coded:
 * there is no `passed = total`, and the expected totals are read from the
 * registry and the fixture files rather than written into the script.
 */
import { calculate, implementedCalculatorIds } from "../packages/calculation-engine/src/index.js";
import { allBenchmarks, wave1Benchmarks, wave2Benchmarks, countCases } from "../packages/test-fixtures/src.js";
import { calculatorRegistry } from "../packages/calculator-registry/src/index.js";

const TOLERANCE = 0.011;

/**
 * Compare one actual output against its expected value.
 *
 * Arrays are compared element-wise. The previous runner ignored any
 * non-numeric expectation entirely, which meant array outputs such as
 * STA-001's `modes` were declared to be benchmarked but never actually
 * checked.
 */
function matches(actual: unknown, expected: unknown): boolean {
  if (expected === null || expected === undefined) return true;

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    return expected.every((value, index) => matches(actual[index], value));
  }
  if (typeof expected === "string") return String(actual) === expected;
  if (typeof expected === "boolean") return actual === expected;

  const actualNumber = Number(actual);
  return Number.isFinite(actualNumber) && Math.abs(actualNumber - Number(expected)) <= TOLERANCE;
}

interface WaveTally {
  total: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
}

const supported = new Set(implementedCalculatorIds());
const waveById = new Map(calculatorRegistry.map((c) => [c.id, c.launchWave]));

const tallies: Record<string, WaveTally> = {
  "Wave 1": { total: 0, executed: 0, passed: 0, failed: 0, skipped: 0 },
  "Wave 2": { total: 0, executed: 0, passed: 0, failed: 0, skipped: 0 }
};
const failures: string[] = [];
const skipped: string[] = [];

for (const [calculatorId, fixtures] of Object.entries(allBenchmarks)) {
  const wave = waveById.get(calculatorId) ?? "Wave 1";
  const tally = tallies[wave] ?? (tallies[wave] = { total: 0, executed: 0, passed: 0, failed: 0, skipped: 0 });

  for (const fixture of fixtures) {
    tally.total++;
    if (!supported.has(calculatorId)) {
      tally.skipped++;
      skipped.push(`${calculatorId} [${fixture.scenario}] - no engine handler`);
      continue;
    }
    tally.executed++;
    try {
      const result = await calculate(calculatorId, fixture.inputs, { now: new Date("2026-08-22T08:00:00Z") });
      const differences = Object.entries(fixture.expected).filter(([key, expected]) =>
        !matches(result.outputs[key], expected)
      );
      if (differences.length) {
        tally.failed++;
        failures.push(
          `${calculatorId} [${fixture.scenario}] ` +
            differences.map(([k, e]) => `${k}: expected ${e}, got ${result.outputs[k]}`).join("; ")
        );
      } else {
        tally.passed++;
      }
    } catch (error) {
      tally.failed++;
      failures.push(`${calculatorId} [${fixture.scenario}] THREW: ${(error as Error).message}`);
    }
  }
}

function line(label: string, t: WaveTally): string {
  return `${label.padEnd(8)} total ${String(t.total).padStart(5)}  executed ${String(t.executed).padStart(5)}  passed ${String(t.passed).padStart(5)}  failed ${String(t.failed).padStart(4)}  skipped ${String(t.skipped).padStart(5)}`;
}

const combined: WaveTally = Object.values(tallies).reduce(
  (acc, t) => ({
    total: acc.total + t.total,
    executed: acc.executed + t.executed,
    passed: acc.passed + t.passed,
    failed: acc.failed + t.failed,
    skipped: acc.skipped + t.skipped
  }),
  { total: 0, executed: 0, passed: 0, failed: 0, skipped: 0 }
);

console.log("\n=== BENCHMARK SUMMARY ===");
for (const [wave, tally] of Object.entries(tallies)) console.log(line(wave, tally));
console.log(line("COMBINED", combined));

// Coverage expectations, derived from the registry rather than asserted.
const wave2Expected = calculatorRegistry.filter((c) => c.launchWave === "Wave 2").length * 5;
console.log(
  `\nWave 1 fixture cases: ${countCases(wave1Benchmarks)}` +
    `\nWave 2 fixture cases: ${countCases(wave2Benchmarks)} (minimum for full Wave 2: ${wave2Expected})`
);

if (failures.length) {
  console.error(`\n=== ${failures.length} FAILURES ===`);
  for (const failure of failures) console.error("  " + failure);
}
if (skipped.length) {
  console.log(`\n${skipped.length} skipped (calculator not yet implemented).`);
}

if (combined.failed > 0) process.exitCode = 1;
