import rawBenchmarks from "./fixtures/wave1-benchmarks.json" with { type: "json" };

export interface BenchmarkFixture {
  scenario: string;
  inputs: Record<string, unknown>;
  expected: Record<string, number | null | undefined>;
  tolerance: string;
  ruleset: string;
  note: string;
}

export const wave1Benchmarks = rawBenchmarks as unknown as Record<string, BenchmarkFixture[]>;
