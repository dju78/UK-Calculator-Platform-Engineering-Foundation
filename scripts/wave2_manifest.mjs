/**
 * Build the Wave 2 post-2C manifest.
 *
 * CONTEXT. The canonical GitHub main is `df9f31f` (Wave 2 tranche 2C), and
 * Wave 1 plus tranches 2A, 2B and 2C are already safely on origin. The build
 * container that produced them was later recycled and lost its .git directory,
 * so this repository is a WORKING-TREE SOURCE only: its history is
 * reinitialised and has no ancestry with origin/main. It is never pushed.
 *
 * Commit `ab2fce7` in this local repository is the recovered tranche-2C
 * working tree, so it is the correct baseline for "what changed after Wave
 * 2C". Everything this manifest reports as changed is content to be applied
 * over the real df9f31f repository as NEW normal commits.
 *
 * Every number here is derived by execution or by inspecting the artefacts.
 * Nothing is hard-coded.
 *
 * Run: node scripts/wave2_manifest.mjs
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const BASELINE = process.env.WAVE2C_BASELINE || 'ab2fce7';
const REMOTE_MAIN = 'df9f31f';

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const wave1Registry = read('packages/calculator-registry/src/wave1-registry.json');
const wave2Registry = read('packages/calculator-registry/src/wave2-registry.json');
const wave1Benchmarks = read('packages/test-fixtures/fixtures/wave1-benchmarks.json');
const wave2Benchmarks = read('packages/test-fixtures/fixtures/wave2-benchmarks.json');
const ruleset = read('packages/rules-uk/src/rulesets/uk-2026-27-v1.json');

// Verification results, produced by scripts/final_verification.mjs by RUNNING
// each check. Absent rather than invented if that sweep has not been run.
let verification = null;
try {
  verification = read('docs/wave2-verification.json').results;
} catch {
  verification = null;
}

// Open defects. Held as a file so the manifest cannot claim "none" merely
// because nobody wrote any down; an absent file is reported as unknown.
let defects = { p0: [], p1: [] };
try {
  defects = read('docs/wave2-open-defects.json');
} catch {
  defects = null;
}

const verified = wave2Registry.filter((c) => c.status === 'verified');
const planned = wave2Registry.filter((c) => c.status !== 'verified');

const countCases = (b) => Object.values(b).reduce((n, cases) => n + cases.length, 0);

// --- Files changed since the recovered tranche-2C tree ----------------------
let changed = [];
let baselineResolved = null;
try {
  baselineResolved = execSync(`git rev-parse --short ${BASELINE}`, { encoding: 'utf8' }).trim();
  const raw = execSync(`git diff --name-status ${BASELINE} HEAD`, { encoding: 'utf8' });
  changed = raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split('\t');
      return { status: status[0], path: rest.join('\t') };
    });
} catch {
  // No git available: the manifest still reports everything else honestly
  // rather than inventing a file list.
  changed = null;
}

const statusWord = { A: 'added', M: 'modified', D: 'deleted', R: 'renamed' };
const byStatus = changed
  ? changed.reduce((acc, f) => {
      (acc[statusWord[f.status] ?? f.status] ||= []).push(f.path);
      return acc;
    }, {})
  : null;

// --- Specifications and tests present --------------------------------------
const specDir = path.join(ROOT, 'docs/specs/wave2');
const specs = fs.existsSync(specDir)
  ? fs.readdirSync(specDir).filter((f) => f.endsWith('.md')).sort()
  : [];

const testDir = path.join(ROOT, 'tests');
const tests = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.ts')).sort();

const oracleDir = path.join(ROOT, 'scripts/oracles');
const oracles = fs.existsSync(oracleDir) ? fs.readdirSync(oracleDir).sort() : [];

// --- Verified calculators grouped by category ------------------------------
const byCategory = {};
for (const c of wave2Registry) {
  const bucket = (byCategory[c.category] ||= { total: 0, verified: 0, verified_ids: [], remaining_ids: [] });
  bucket.total++;
  if (c.status === 'verified') {
    bucket.verified++;
    bucket.verified_ids.push(c.id);
  } else {
    bucket.remaining_ids.push(c.id);
  }
}

const fmt = (v) => (v === null || v === undefined ? 'UNKNOWN' : v);

const manifest = {
  generated_at: new Date().toISOString().slice(0, 10),

  // The headline block, in the order it is usually read. Every figure is
  // derived above from the registry, the fixtures or an executed check.
  summary: {
    BASELINE: REMOTE_MAIN,
    WAVE_1: `${wave1Registry.length}/${wave1Registry.length}`,
    WAVE_2_EXPECTED: wave2Registry.length,
    WAVE_2_VERIFIED: `${verified.length}/${wave2Registry.length}`,
    TOTAL_PLATFORM: wave1Registry.length + wave2Registry.length,
    WAVE_1_BENCHMARKS: verification?.benchmarks
      ? `${verification.benchmarks.wave1.passed}/${verification.benchmarks.wave1.total}`
      : `${countCases(wave1Benchmarks)} cases (not executed in this manifest run)`,
    WAVE_2_BENCHMARKS: verification?.benchmarks
      ? `${verification.benchmarks.wave2.passed}/${verification.benchmarks.wave2.total}`
      : `${countCases(wave2Benchmarks)} cases (not executed in this manifest run)`,
    TOTAL_BENCHMARKS: verification?.benchmarks
      ? `${verification.benchmarks.combined.passed}/${verification.benchmarks.combined.total}`
      : `${countCases(wave1Benchmarks) + countCases(wave2Benchmarks)} cases (not executed)`,
    FAILED: fmt(verification?.benchmarks?.combined?.failed),
    SKIPPED: fmt(verification?.benchmarks?.combined?.skipped),
    UNIT_TESTS: verification?.unit_tests
      ? `${verification.unit_tests.passed}/${verification.unit_tests.total}`
      : 'UNKNOWN',
    UI_PARITY: verification?.browser_suite?.parity_tests_seen
      ? `${verification.browser_suite.parity_tests_seen} parity assertions within the browser suite`
      : 'UNKNOWN',
    BROWSER_TESTS: verification?.browser_suite
      ? `${verification.browser_suite.passed}/${verification.browser_suite.passed + verification.browser_suite.failed}`
      : 'UNKNOWN',
    ROUTES: verification?.routes?.total ?? 'UNKNOWN',
    AXE_SERIOUS: fmt(verification?.accessibility?.serious_violations),
    AXE_CRITICAL: fmt(verification?.accessibility?.critical_violations),
    TYPECHECK:
      verification?.typecheck_root?.status === 'PASS' &&
      verification?.typecheck_web?.status === 'PASS'
        ? 'PASS'
        : fmt(verification?.typecheck_root?.status),
    LINT: fmt(verification?.lint?.status),
    RULES_VALIDATION: verification?.unit_tests?.status ?? 'UNKNOWN',
    PRODUCTION_BUILD: fmt(verification?.production_build?.status),
    P0_OPEN: defects ? defects.p0 : 'UNKNOWN (no defect register found)',
    P1_OPEN: defects ? defects.p1 : 'UNKNOWN (no defect register found)'
  },

  verification,

  git: {
    canonical_remote_main: REMOTE_MAIN,
    canonical_remote_main_contains: [
      'Wave 1',
      'Wave 2A Finance & Debt',
      'Wave 2B Mortgages & Property',
      'Wave 2C Investing & Wealth'
    ],
    local_repository_role:
      'Working-tree source only. Its history was reinitialised after the build container was recycled and lost its .git directory, so it has NO ancestry with origin/main and is never pushed.',
    local_baseline_commit_for_diff: baselineResolved ?? BASELINE,
    local_baseline_meaning:
      'The recovered tranche-2C working tree, content-equivalent to origin/main at ' + REMOTE_MAIN + '.',
    integration_instruction:
      'Apply the files listed under files_changed_since_wave_2c over a checkout of ' +
      REMOTE_MAIN + ' and create NEW normal commits from there. Do not push this repository.'
  },

  progress: {
    wave2_verified: verified.length,
    wave2_total: wave2Registry.length,
    wave2_remaining: planned.length,
    progress: `${verified.length}/${wave2Registry.length}`,
    wave1_verified: wave1Registry.length,
    combined_live_calculators: wave1Registry.length + verified.length
  },

  benchmarks: {
    wave1_cases: countCases(wave1Benchmarks),
    wave2_cases: countCases(wave2Benchmarks),
    combined_cases: countCases(wave1Benchmarks) + countCases(wave2Benchmarks),
    wave2_minimum_target: wave2Registry.length * 5,
    wave2_calculators_with_cases: Object.keys(wave2Benchmarks).length,
    minimum_cases_per_calculator: Math.min(
      ...Object.values(wave2Benchmarks).map((c) => c.length)
    )
  },

  completed_calculator_ids: verified.map((c) => c.id).sort(),
  remaining_calculator_ids: planned.map((c) => c.id).sort(),
  by_category: byCategory,

  benchmark_counts_by_calculator: Object.fromEntries(
    Object.entries(wave2Benchmarks)
      .map(([id, cases]) => [id, cases.length])
      .sort(([a], [b]) => a.localeCompare(b))
  ),

  ruleset_changes: {
    ruleset_id: ruleset.ruleset_id ?? 'uk-2026-27-v1',
    status: ruleset.status,
    source_count: (ruleset.sources ?? []).length,
    source_register_entries: (ruleset.source_register_notes ?? []).length,
    top_level_sections: Object.keys(ruleset).sort(),
    source_register: (ruleset.source_register_notes ?? []).map((n) => ({
      key: n.key,
      source: n.source
    }))
  },

  specification_files: specs,
  specification_count: specs.length,

  test_files: tests,
  oracle_files: oracles,

  files_changed_since_wave_2c: byStatus,
  files_changed_count: changed ? changed.length : null
};

const outPath = path.join(ROOT, 'docs/wave2-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Manifest -> ${outPath}`);
console.log(
  `progress ${manifest.progress.progress}  benchmarks ${manifest.benchmarks.combined_cases}` +
  `  specs ${manifest.specification_count}  changed-since-2C ${manifest.files_changed_count ?? 'unknown'}`
);
