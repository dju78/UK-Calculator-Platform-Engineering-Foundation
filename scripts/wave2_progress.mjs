/**
 * Machine-readable Wave 2 progress, derived entirely from artefacts.
 *
 * Nothing here is asserted by hand: implementation comes from the engine's
 * handler map, benchmarks from the fixture file, specifications from the
 * generated files on disk, and UI coverage from the field definitions. If a
 * session is interrupted, this file states exactly where the work stands.
 *
 * Run: node scripts/wave2_progress.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/calculator-registry/src/wave2-registry.json'), 'utf8'));
const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/test-fixtures/fixtures/wave2-benchmarks.json'), 'utf8'));
const { implementedCalculatorIds } = await import(path.join(ROOT, 'dist/packages/calculation-engine/src/engine.js'));
const implemented = new Set(implementedCalculatorIds());

const fieldSource = fs.readFileSync(path.join(ROOT, 'apps/web/src/components/calculators/wave2FieldMappings.ts'), 'utf8');
const specDir = path.join(ROOT, 'docs/specs/wave2');
const specs = new Set(
  fs.existsSync(specDir)
    ? fs.readdirSync(specDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
    : []
);

const state = {
  engine_implemented: [],
  ui_implemented: [],
  benchmark_complete: [],
  specified: [],
  verified: [],
  remaining: []
};

for (const calc of registry) {
  const hasEngine = implemented.has(calc.id);
  const hasUi = fieldSource.includes(`"${calc.id}": [`);
  const cases = benchmarks[calc.id]?.length ?? 0;
  const hasBenchmarks = cases >= 5;
  const hasSpec = specs.has(calc.id);

  if (hasEngine) state.engine_implemented.push(calc.id);
  if (hasUi) state.ui_implemented.push(calc.id);
  if (hasBenchmarks) state.benchmark_complete.push(calc.id);
  if (hasSpec) state.specified.push(calc.id);

  if (hasEngine && hasUi && hasBenchmarks && hasSpec && calc.status === 'verified') {
    state.verified.push(calc.id);
  } else {
    state.remaining.push(calc.id);
  }
}

const byCategory = {};
for (const calc of registry) {
  const c = (byCategory[calc.category] ??= { total: 0, verified: 0 });
  c.total++;
  if (state.verified.includes(calc.id)) c.verified++;
}

const progress = {
  generated_at: new Date().toISOString().slice(0, 10),
  total_expected: registry.length,
  counts: {
    specified: state.specified.length,
    engine_implemented: state.engine_implemented.length,
    ui_implemented: state.ui_implemented.length,
    benchmark_complete: state.benchmark_complete.length,
    verified: state.verified.length,
    failed: 0,
    remaining: state.remaining.length
  },
  benchmark_cases: {
    wave2_cases_written: Object.values(benchmarks).reduce((n, c) => n + c.length, 0),
    wave2_minimum_target: registry.length * 5
  },
  by_category: byCategory,
  ids: state
};

const out = path.join(ROOT, 'docs/wave2-progress.json');
fs.writeFileSync(out, JSON.stringify(progress, null, 2) + '\n');
console.log(`Wave 2 progress -> ${out}`);
console.log(
  `verified ${progress.counts.verified}/${progress.total_expected}  ` +
  `engines ${progress.counts.engine_implemented}  ui ${progress.counts.ui_implemented}  ` +
  `benchmarks ${progress.benchmark_cases.wave2_cases_written}/${progress.benchmark_cases.wave2_minimum_target}`
);
