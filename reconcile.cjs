const fs = require('fs');
const path = require('path');

const registry = JSON.parse(fs.readFileSync('packages/calculator-registry/src/wave1-registry.json'));
const engineFile = fs.readFileSync('packages/calculation-engine/src/engine.ts', 'utf8');

let engineImplemented = [];
let registryImplemented = [];
let registryVerified = [];

for (const c of registry) {
  if (c.implementationStatus === 'implemented') registryImplemented.push(c.id);
  if (c.status === 'verified') registryVerified.push(c.id);
  
  if (engineFile.includes(`'${c.id}'`)) {
    engineImplemented.push(c.id);
  }
}

console.log('--- EXPLICIT LISTS ---');
console.log('Engine Implemented:', engineImplemented.join(', '));
console.log('Registry Implemented:', registryImplemented.join(', '));
console.log('Registry Verified:', registryVerified.join(', '));

const drift = [];
for (const c of registry) {
  const hasEngine = engineImplemented.includes(c.id);
  const isImpl = c.implementationStatus === 'implemented';
  const isVer = c.status === 'verified';
  
  if (hasEngine && !isImpl) drift.push(`${c.id} has engine but registry is not implemented`);
  if (!hasEngine && isImpl) drift.push(`${c.id} registry says implemented but no engine handler found`);
  if (isVer && !hasEngine) drift.push(`${c.id} is verified but no engine handler`);
}

console.log('--- DRIFT ---');
console.log(drift.join('\n'));
