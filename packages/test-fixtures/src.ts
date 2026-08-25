import rawWave1 from "./fixtures/wave1-benchmarks.json" with { type: "json" };
import rawWave2 from "./fixtures/wave2-benchmarks.json" with { type: "json" };
import rawWave3 from "./fixtures/wave3-benchmarks.json" with { type: "json" };

export interface BenchmarkFixture {
  scenario: string;
  inputs: Record<string, unknown>;
  expected: Record<string, number | string | null | undefined>;
  tolerance: string;
  ruleset: string;
  note: string;
}

export type BenchmarkSet = Record<string, BenchmarkFixture[]>;

export const wave1Benchmarks = rawWave1 as unknown as BenchmarkSet;
export const wave2Benchmarks = rawWave2 as unknown as BenchmarkSet;
export const wave3Benchmarks = rawWave3 as unknown as BenchmarkSet;

/** Every benchmark across all waves, keyed by calculator id. */
export const allBenchmarks: BenchmarkSet = { ...wave1Benchmarks, ...wave2Benchmarks, ...wave3Benchmarks };

/** Total case count for a benchmark set - always derived, never hard-coded. */
export function countCases(set: BenchmarkSet): number {
  return Object.values(set).reduce((total, cases) => total + cases.length, 0);
}

/** Case counts per calculator id. */
export function caseCountsById(set: BenchmarkSet): Record<string, number> {
  return Object.fromEntries(Object.entries(set).map(([id, cases]) => [id, cases.length]));
}
