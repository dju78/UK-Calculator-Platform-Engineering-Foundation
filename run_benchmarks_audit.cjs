const fs = require('fs');
const { calculate } = require('./dist/packages/calculation-engine/src/engine.js');
const { implementedCalculatorIds } = require('./dist/packages/calculation-engine/src/engine.js');

const benchmarks = JSON.parse(fs.readFileSync('packages/test-fixtures/fixtures/wave1-benchmarks.json', 'utf8'));

const implemented = implementedCalculatorIds();
const registry = JSON.parse(fs.readFileSync('packages/calculator-registry/src/wave1-registry.json'));

let totalFixtures = 0;
let executed = 0;
let passed = 0;
let failed = 0;
let skipped = 0;

const results = {};
const skippedCalcs = [];

for (const [id, fixtures] of Object.entries(benchmarks)) {
  totalFixtures += fixtures.length;
  results[id] = { passed: 0, failed: 0, total: fixtures.length };
  
  if (implemented.includes(id)) {
    for (const fixture of fixtures) {
      executed++;
      try {
        const res = calculate(id, fixture.inputs);
        let ok = true;
        for (const [k, v] of Object.entries(fixture.expected)) {
          if (k === 'validation') continue; 
          if (res.outputs[k] !== undefined) {
             const diff = Math.abs(Number(res.outputs[k]) - Number(v));
             if (diff > 0.02 && v !== null) ok = false;
          } else {
             ok = false;
          }
        }
        if (ok) {
           passed++;
           results[id].passed++;
        } else {
           failed++;
           results[id].failed++;
        }
      } catch (e) {
        if (fixture.expected.validation) {
           passed++;
           results[id].passed++;
        } else {
           failed++;
           results[id].failed++;
        }
      }
    }
  } else {
    skipped += fixtures.length;
    skippedCalcs.push({
       id,
       name: registry.find(c => c.id === id)?.name || id,
       count: fixtures.length,
       reason: 'Engine handler missing'
    });
  }
}

console.log('TOTAL BENCHMARK FIXTURES:', totalFixtures);
console.log('EXECUTED:', executed);
console.log('PASSED:', passed);
console.log('FAILED:', failed);
console.log('SKIPPED:', skipped);

console.log('\nSKIPPED CALCULATORS:');
for (const s of skippedCalcs) {
  console.log(`${s.id} | ${s.name} | Fixtures: ${s.count} | Reason: ${s.reason}`);
}

const groups = {
  'LOAN/MORTGAGE': ['FIN-001', 'FIN-002', 'PRO-001', 'PRO-003', 'PRO-004'],
  'INVESTMENT': ['INV-001', 'INV-002', 'INV-003', 'INV-006', 'INV-007', 'INV-008', 'INV-009', 'INV-011', 'INV-014', 'INV-015'],
  'STATISTICS': ['STA-001', 'STA-003', 'STA-006', 'STA-008', 'STA-014'],
  'BUSINESS': ['BUS-001', 'BUS-006', 'BUS-008'],
  'GENERAL MATHEMATICS': ['MAT-002', 'MAT-003', 'MAT-005', 'MAT-006'],
  'PERSONAL FINANCE': ['FIN-006', 'FIN-009', 'FIN-011', 'FIN-013'],
  'PROPERTY ANALYTICS': ['PRO-010', 'PRO-011', 'PRO-016', 'PRO-018', 'PRO-019'],
  'UTILITIES': ['DAT-001', 'AUT-006', 'CON-001'],
  'HEALTH': ['HLT-001']
};

for (const [group, ids] of Object.entries(groups)) {
  console.log(`\n${group}`);
  let gPass = 0, gTotal = 0;
  for (const id of ids) {
    const r = results[id];
    if (r) {
      console.log(`${id}: ${r.passed}/${r.total}`);
      gPass += r.passed;
      gTotal += r.total;
    } else {
      console.log(`${id}: 0/0 (No fixtures found)`);
    }
  }
  console.log(`${group} TOTAL: ${gPass}/${gTotal}`);
}
