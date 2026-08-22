const fs = require('fs');
const file = 'packages/calculator-registry/src/wave1-registry.json';
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const idsToUpdate = ["PRO-023", "ISA-001", "ISA-002", "TAX-001", "TAX-002", "TAX-003", "TAX-004", "TAX-015", "TAX-020"];

data.forEach(calc => {
  if (idsToUpdate.includes(calc.id)) {
    calc.implementationStatus = "implemented";
    calc.status = "verified";
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
