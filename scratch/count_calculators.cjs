const fs = require('fs');
const file = 'packages/calculator-registry/src/wave1-registry.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const verified = data.filter(c => c.status === 'verified').length;
const total = data.length;
console.log(`Total calculators: ${total}`);
console.log(`Verified calculators: ${verified}`);
