const fs = require('fs');

const registry = JSON.parse(fs.readFileSync('packages/calculator-registry/src/wave1-registry.json'));
const engineIds = [
  'AUT-006', 'BUS-001', 'BUS-006', 'BUS-008',
  'CON-001', 'DAT-001', 'FIN-001', 'FIN-002',
  'FIN-006', 'FIN-009', 'FIN-011', 'FIN-013',
  'HLT-001', 'INV-001', 'INV-002', 'INV-003',
  'INV-006', 'INV-007', 'INV-008', 'INV-009',
  'INV-011', 'INV-014', 'INV-015', 'ISA-001',
  'ISA-002', 'MAT-002', 'MAT-003', 'MAT-005',
  'MAT-006', 'PRO-001', 'PRO-003', 'PRO-004',
  'PRO-010', 'PRO-011', 'PRO-016', 'PRO-018',
  'PRO-019', 'PRO-023', 'STA-001', 'STA-003',
  'STA-006', 'STA-008', 'STA-014', 'TAX-001',
  'TAX-002', 'TAX-003', 'TAX-004', 'TAX-015',
  'TAX-020'
];

let engineImplementedCount = engineIds.length;
let uiImplementedCount = 0;
let verifiedCount = 0;
let unimplementedCount = 0;

for (const c of registry) {
  const isImpl = c.implementationStatus === 'implemented';
  const isVer = c.status === 'verified';
  
  if (isImpl) uiImplementedCount++;
  if (isVer) verifiedCount++;
  if (!engineIds.includes(c.id) && !isImpl) unimplementedCount++;
}

console.log('TOTAL CALCULATORS IN WAVE 1:', registry.length);
console.log('TOTAL ENGINE IMPLEMENTED:', engineImplementedCount);
console.log('TOTAL UI IMPLEMENTED:', uiImplementedCount);
console.log('TOTAL VERIFIED:', verifiedCount);
console.log('TOTAL UNIMPLEMENTED:', unimplementedCount);

console.log('\nVERIFIED:');
for (const c of registry) {
  if (c.status === 'verified') console.log(c.id);
}
console.log('\nNOT VERIFIED:');
for (const c of registry) {
  if (c.status !== 'verified') console.log(c.id);
}

const benchmarks = JSON.parse(fs.readFileSync('packages/test-fixtures/fixtures/wave1-benchmarks.json'));
let totalFixtures = 0;
let executed = 0;
let passed = 0;
let skipped = 0;
let failed = 0;
// We actually need to read the output of the benchmark script to know exact pass/fail.

