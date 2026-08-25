/**
 * Merge an oracle's output into the Wave 2 benchmark fixture file.
 *
 * Usage: node scripts/merge_fixtures.mjs /tmp/education.json
 *
 * Replaces whole calculators rather than appending, so re-running an oracle
 * after a change to its cases updates them in place instead of duplicating.
 */
import fs from 'fs';
import path from 'path';

const source = process.argv[2];
if (!source) {
  console.error('Give the path to an oracle output file.');
  process.exit(1);
}

const target = path.join(process.cwd(), 'packages/test-fixtures/fixtures/wave2-benchmarks.json');
const current = JSON.parse(fs.readFileSync(target, 'utf8'));
const incoming = JSON.parse(fs.readFileSync(source, 'utf8'));

for (const id of Object.keys(incoming)) {
  current[id] = incoming[id];
}

const ordered = {};
for (const id of Object.keys(current).sort()) ordered[id] = current[id];
fs.writeFileSync(target, JSON.stringify(ordered, null, 2) + '\n');

const cases = Object.values(ordered).reduce((n, f) => n + f.length, 0);
console.log(`Fixtures now cover ${Object.keys(ordered).length} calculators and ${cases} cases.`);
