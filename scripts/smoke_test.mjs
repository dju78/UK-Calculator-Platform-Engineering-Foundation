import fs from 'fs';

const benchmarks = JSON.parse(fs.readFileSync('../../packages/test-fixtures/fixtures/wave1-benchmarks.json', 'utf8'));
const calculators = Object.keys(benchmarks);
const BASE_URL = 'https://uk-calculator-platform.onrender.com';

async function run() {
  console.log(`Starting smoke test for ${calculators.length} calculators on ${BASE_URL}...`);
  let passed = 0;
  let failed = 0;
  for (const calcId of calculators) {
    try {
      const res = await fetch(`${BASE_URL}/calculators/${calcId.toLowerCase()}`);
      if (res.ok) {
        passed++;
      } else {
        failed++;
        console.error(`Failed: ${calcId} - Status: ${res.status}`);
      }
    } catch (e) {
      failed++;
      console.error(`Failed: ${calcId} - Error: ${e.message}`);
    }
  }
  
  console.log(`\nSmoke Test Results:`);
  console.log(`Total: ${calculators.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

run();
