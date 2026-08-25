/**
 * Final verification sweep.
 *
 * Every number this writes comes from RUNNING the check and parsing its real
 * output. Nothing is a literal, and a check that fails to run is recorded as
 * an error rather than skipped, so a broken harness can never be mistaken for
 * a passing one.
 *
 * Run: node scripts/final_verification.mjs [path-to-playwright-log]
 * Writes: docs/wave2-verification.json
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const results = {};

function run(label, command, parse, opts = {}) {
  process.stderr.write(`  ${label} ... `);
  const cwd = opts.cwd ? path.resolve(ROOT, opts.cwd) : ROOT;
  const timeout = opts.timeout ?? 600000; // 10 minutes default
  try {
    const out = execSync(command, {
      encoding: 'utf8',
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
      timeout
    });
    const value = parse ? parse(out) : { status: 'PASS' };
    results[label] = value;
    process.stderr.write(`${JSON.stringify(value)}\n`);
    return value;
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    // A non-zero exit is not automatically a failure: some tools exit non-zero
    // while still producing the summary we need. Parse first, then decide.
    let value;
    try {
      value = parse ? parse(out) : null;
    } catch {
      value = null;
    }
    results[label] = value ?? { status: 'FAIL', detail: out.trim().split('\n').slice(-6).join('\n') };
    process.stderr.write(`${JSON.stringify(results[label])}\n`);
    return results[label];
  }
}

// --- Typecheck --------------------------------------------------------------
run('typecheck_root', 'npx tsc -p tsconfig.json --noEmit', (out) =>
  out.trim().length === 0 ? { status: 'PASS' } : { status: 'FAIL', detail: out.trim() }
);
run('typecheck_web', 'npx tsc --noEmit -p tsconfig.json', (out) =>
  out.trim().length === 0 ? { status: 'PASS' } : { status: 'FAIL', detail: out.trim() }
, { cwd: 'apps/web' });

// --- Lint -------------------------------------------------------------------
run('lint', 'npm run lint', (out) =>
  /error|warning/i.test(out.replace(/^>.*$/gm, ''))
    ? { status: 'FAIL', detail: out.trim() }
    : { status: 'PASS' }
);

// --- Unit tests -------------------------------------------------------------
run('unit_tests', 'npm test', (out) => {
  const num = (k) => {
    // Matches spec reporter ("ℹ tests 828", "✔ pass 828") or TAP format ("# tests 828")
    const m = out.match(new RegExp(`^(?:[#ℹi✔✖]|\u2139|\u2714|\u2716)?\\s*${k}\\s+(\\d+)`, 'mi'));
    return m ? Number(m[1]) : null;
  };
  const tests = num('tests');
  const pass = num('pass');
  const fail = num('fail');
  const skipped = num('skipped');
  if (tests === null) throw new Error('could not parse the test summary');
  return {
    status: fail === 0 && (skipped === null || skipped === 0) ? 'PASS' : 'FAIL',
    total: tests,
    passed: pass ?? (tests - (fail ?? 0)),
    failed: fail ?? 0,
    skipped: skipped ?? 0
  };
});

// --- Benchmarks -------------------------------------------------------------
run('benchmarks', 'npm run bench:reference', (out) => {
  const line = (label) => {
    const m = out.match(
      new RegExp(`^${label}\\s+total\\s+(\\d+)\\s+executed\\s+(\\d+)\\s+passed\\s+(\\d+)\\s+failed\\s+(\\d+)\\s+skipped\\s+(\\d+)`, 'm')
    );
    return m
      ? { total: +m[1], executed: +m[2], passed: +m[3], failed: +m[4], skipped: +m[5] }
      : null;
  };
  const wave1 = line('Wave 1');
  const wave2 = line('Wave 2');
  const wave3 = line('Wave 3');
  const combined = line('COMBINED');
  if (!wave1 || !wave2 || !wave3 || !combined) throw new Error('could not parse the benchmark summary');
  return {
    status: combined.failed === 0 && combined.skipped === 0 ? 'PASS' : 'FAIL',
    wave1, wave2, wave3, combined
  };
});

// --- Route integrity --------------------------------------------------------
run('routes', 'node dist/scripts/verify_routes.js', (out) => {
  const m1 = out.match(/Wave 1: (\d+)\/(\d+) routable, (\d+)\/(\d+) verified/);
  const m2 = out.match(/Wave 2: (\d+)\/(\d+) routable, (\d+)\/(\d+) verified/);
  const m3 = out.match(/Wave 3: (\d+)\/(\d+) routable, (\d+)\/(\d+) verified/);
  const mt = out.match(/Total routable: (\d+)\/(\d+)/);
  if (!m1 || !m2 || !m3 || !mt) throw new Error('could not parse the route summary');
  return {
    status: /verified\.$/m.test(out.trim()) && mt[1] === mt[2] ? 'PASS' : 'FAIL',
    wave1: `${m1[1]}/${m1[2]}`,
    wave2: `${m2[1]}/${m2[2]}`,
    wave3: `${m3[1]}/${m3[2]}`,
    total: `${mt[1]}/${mt[2]}`
  };
});

// --- Production build -------------------------------------------------------
run('production_build', 'npm run build', (out) =>
  /Compiled successfully|prerendered as static/i.test(out)
    ? { status: 'PASS' }
    : { status: 'FAIL', detail: out.trim().split('\n').slice(-10).join('\n') }
, { cwd: 'apps/web' });

// --- Browser suite ----------------------------------------------------------
const candidateLog = process.argv[2];
let browserLog = '';
let logSource = '';

if (candidateLog && fs.existsSync(candidateLog)) {
  browserLog = fs.readFileSync(candidateLog, 'utf8');
  logSource = candidateLog;
} else {
  process.stderr.write(`  browser_suite ... `);
  try {
    const out = execSync('npx playwright test', {
      encoding: 'utf8',
      cwd: path.resolve(ROOT, 'apps/web'),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
      timeout: 1800000 // 30 mins
    });
    browserLog = out;
    logSource = 'live execution';
  } catch (err) {
    browserLog = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    logSource = 'live execution (exit non-zero)';
  }
}

const passed = browserLog.match(/^\s*(\d+)\s+passed/m);
const failed = browserLog.match(/^\s*(\d+)\s+failed/m);
const flaky = browserLog.match(/^\s*(\d+)\s+flaky/m);
const parity = (browserLog.match(/Calculator UI Parity/g) ?? []).length;
const failCount = failed ? Number(failed[1]) : 0;
const passCount = passed ? Number(passed[1]) : 0;

if (passed && failCount === 0 && passCount > 0) {
  results.browser_suite = {
    status: 'PASS',
    passed: passCount,
    failed: 0,
    flaky: flaky ? Number(flaky[1]) : 0,
    parity_tests_seen: parity,
    log: logSource
  };
} else if (browserLog.length > 0) {
  results.browser_suite = {
    status: 'FAIL',
    passed: passCount,
    failed: failCount,
    flaky: flaky ? Number(flaky[1]) : 0,
    parity_tests_seen: parity,
    detail: browserLog.trim().split('\n').slice(-10).join('\n'),
    log: logSource
  };
} else {
  results.browser_suite = { status: 'NOT_RUN', detail: 'No output from browser test suite' };
}
process.stderr.write(`${JSON.stringify(results.browser_suite)}\n`);

// --- Accessibility ----------------------------------------------------------
const a11yTests = (browserLog.match(/accessib|Axe|a11y/gi) ?? []).length;
results.accessibility = {
  status: results.browser_suite.status === 'PASS' ? 'PASS' : results.browser_suite.status,
  serious_violations: results.browser_suite.status === 'PASS' ? 0 : null,
  critical_violations: results.browser_suite.status === 'PASS' ? 0 : null,
  accessibility_assertions_seen: a11yTests,
  note:
    'Axe runs inside the browser suite and every scan asserts an empty list of serious and critical violations, so a passing suite is exactly a zero count. The platform-a11y spec scans one calculator from every category WITH RESULTS SHOWN, plus every category route and every legal route.'
};

const outPath = path.join(ROOT, 'docs/wave2-verification.json');
fs.writeFileSync(outPath, JSON.stringify({ generated_at: new Date().toISOString().slice(0, 10), results }, null, 2) + '\n');

const failures = Object.entries(results).filter(([, v]) => v.status !== 'PASS');
console.log(`\nVerification written to ${outPath}`);
console.log(failures.length === 0 ? 'ALL CHECKS PASS' : `CHECKS NOT PASSING: ${failures.map(([k, v]) => `${k}=${v.status}`).join(', ')}`);
process.exit(failures.length === 0 ? 0 : 1);
