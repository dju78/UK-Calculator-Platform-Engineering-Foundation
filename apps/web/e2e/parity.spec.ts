import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// read benchmarks
const benchmarksPath = path.resolve(process.cwd(), '../../packages/test-fixtures/fixtures/wave1-benchmarks.json');
const benchmarks = JSON.parse(fs.readFileSync(benchmarksPath, 'utf8'));

test.describe('Calculator UI Parity', () => {
  for (const [calcId, fixtures] of Object.entries(benchmarks)) {
    test.describe(calcId, () => {
      for (const [idx, fixture] of (fixtures as any).entries()) {
        test(`Scenario: ${fixture.scenario}`, async ({ page }) => {
          await page.goto(`http://localhost:3000/calculators/${calcId.toLowerCase()}`);
          
          const inputs = fixture.inputs;
          for (const [key, val] of Object.entries(inputs)) {
            // Check if it's a select or input
            const inputLoc = page.locator(`input[name="${key}"]`);
            const selectLoc = page.locator(`select[name="${key}"]`);
            
            const isSelect = await selectLoc.count() > 0;
            
            const firstVal = fixtures[0].inputs[key];
            let finalVal = val;
            let isRate = (key.includes('rate') || key.includes('margin') || key.includes('discount') || key.includes('inflation') || key.includes('return') || key.includes('apr')) && typeof firstVal === 'number' && firstVal >= 0 && firstVal <= 1;
            if (isRate) {
              finalVal = (val as number) * 100;
            }
            
            if (isSelect) {
              await selectLoc.selectOption(String(finalVal));
            } else {
              // clear and fill
              await inputLoc.fill('');
              await inputLoc.fill(String(finalVal));
            }
          }
          
          await page.click('button:has-text("Calculate")');
          
          // Wait for results
          for (const [key, expectedVal] of Object.entries(fixture.expected)) {
            if (typeof expectedVal === 'string') continue; 
            if (expectedVal === null) continue;
            
            const displayKey = key.replace(/_/g, " ");
            
            // if not found exactly, try case insensitive
            let foundText = "";
            try {
              const valLoc = page.locator(`xpath=//span[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')="${displayKey.toLowerCase()}"]/following-sibling::span[1]`);
              foundText = await valLoc.innerText({ timeout: 2000 });
            } catch (e) {
              // sometimes it's not present or calculation failed?
              throw new Error(`Could not find result for ${key}. UI Error possibly?`);
            }
            
            const parsedNum = parseFloat(foundText.replace(/[^0-9.-]+/g, ''));
            const expectedNum = expectedVal as number;
            
            // tolerance check
            let tolerance = 0.05; // Accept rounding up to 2 decimal places difference for small/large values
            if (expectedNum === 0) tolerance = 0.001;
            
            if (Math.abs(parsedNum - expectedNum) >= tolerance) {
              // Try relative tolerance as well
              const relativeDiff = Math.abs(parsedNum - expectedNum) / Math.abs(expectedNum);
              if (relativeDiff >= 0.02) { // 2% max diff
                throw new Error(`Mismatch for ${key}. Expected ${expectedNum}, got ${parsedNum} (parsed from "${foundText}")`);
              }
            }
          }
        });
      }
    });
  }
});
