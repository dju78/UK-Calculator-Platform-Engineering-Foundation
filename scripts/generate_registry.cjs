const fs = require('fs');
const benchmarks = JSON.parse(fs.readFileSync('packages/test-fixtures/fixtures/wave1-benchmarks.json'));

let out = `import { DynamicCalculator, FieldDef } from "./DynamicCalculator";

const mappings: Record<string, FieldDef[]> = {
`;

for (const [calcId, fixtures] of Object.entries(benchmarks)) {
  const first = fixtures[0];
  out += `  "${calcId}": [\n`;
  const inputs = first.inputs;
  for (const [key, val] of Object.entries(inputs)) {
    let type = typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'select' : typeof val === 'string' ? 'text' : 'text';
    
    let defaultValue = typeof val === 'string' ? `"${val}"` : typeof val === 'boolean' ? `"${val}"` : val;
    let label = key;
    let scale = '';
    
    let isRate = (key.includes('rate') || key.includes('margin') || key.includes('discount') || key.includes('inflation') || key.includes('return') || key.includes('apr')) && typeof val === 'number' && val >= 0 && val <= 1;
    
    if (isRate) {
      label += " (%)";
      scale = `, scale: 0.01`;
      if (typeof defaultValue === 'number') {
        defaultValue = defaultValue * 100;
      }
    } else {
      label = label.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    let options = '';
    if (typeof val === 'boolean') {
      options = `, options: [{label: "True", value: "true"}, {label: "False", value: "false"}]`;
    }
    
    if (typeof val === 'object' && val !== null) {
      // arrays like cashflows
      type = 'text';
      defaultValue = `"${JSON.stringify(val).replace(/"/g, '\\"')}"`;
    }
    
    out += `    { name: "${key}", label: "${label}", type: "${type}", defaultValue: ${defaultValue}${scale}${options} },\n`;
  }
  out += `  ],\n`;
}

out += `};

export function getCalculatorComponent(id: string) {
  const fields = mappings[id];
  if (!fields) return null;
  return <DynamicCalculator calculatorId={id} fields={fields} />;
}
`;

fs.writeFileSync('apps/web/src/components/calculators/registry.tsx', out);
console.log('registry.tsx generated');
