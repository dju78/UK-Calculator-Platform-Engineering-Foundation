import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { mappings } from '../src/components/calculators/fieldMappings';
import type { FieldDef } from '../src/components/calculators/fieldTypes';
import { parseDisplayedValue } from '../src/components/calculators/outputFormats';

// read benchmarks
const benchmarksPath = path.resolve(process.cwd(), '../../packages/test-fixtures/fixtures/wave1-benchmarks.json');
const benchmarks = JSON.parse(fs.readFileSync(benchmarksPath, 'utf8'));

/**
 * Some benchmark fixtures are written against the engine's input contract,
 * which is deliberately allowed to differ from the field names the UI shows.
 * These maps translate a fixture into the equivalent UI interaction; they
 * never change what the fixture EXPECTS.
 */
const FIXTURE_INPUT_ALIASES: Record<string, Record<string, string>> = {
  // The engine still accepts salary_sacrifice_pct; the UI now expresses the
  // same thing as an explicit arrangement plus a human percentage.
  'TAX-003': { salary_sacrifice_pct: 'pension_pct' }
};

const FIXTURE_EXTRA_INPUTS: Record<string, Record<string, string>> = {
  'TAX-003': { pension_arrangement: 'salary_sacrifice' }
};

function fieldFor(calcId: string, name: string): FieldDef | undefined {
  return (mappings[calcId] ?? []).find(f => f.name === name);
}

test.describe('Calculator UI Parity', () => {
  for (const [calcId, fixtures] of Object.entries(benchmarks)) {
    test.describe(calcId, () => {
      for (const [, fixture] of (fixtures as any).entries()) {
        test(`Scenario: ${fixture.scenario}`, async ({ page }) => {
          await page.goto(`http://localhost:3000/calculators/${calcId.toLowerCase()}`);
          
          const aliases = FIXTURE_INPUT_ALIASES[calcId] ?? {};
          const entries: Array<[string, unknown]> = [
            ...Object.entries(FIXTURE_EXTRA_INPUTS[calcId] ?? {}),
            ...Object.entries(fixture.inputs).map(
              ([k, v]) => [aliases[k] ?? k, v] as [string, unknown]
            )
          ];

          for (const [key, val] of entries) {
            // A null fixture value means "leave this field blank so the
            // engine infers it from the other inputs" (e.g. MAT-005
            // Proportion's `d`). Don't fill it - the field's own default is
            // blank for these inferable fields.
            if (val === null) continue;

            // Check if it's a select or input
            const inputLoc = page.locator(`input[name="${key}"]`);
            const selectLoc = page.locator(`select[name="${key}"]`);

            const isSelect = await selectLoc.count() > 0;

            // Convert the engine-contract fixture value into what a human
            // would type, using the field's OWN declared scale rather than a
            // substring heuristic. The heuristic was unsafe in both
            // directions: it missed fields absent from the first scenario,
            // and it keyed off names like "rate" that are a scaled percentage
            // in one calculator and a raw multiplier in another (CON-010's
            // FX rate, PRO-001's 4.5% mortgage rate).
            const field = fieldFor(calcId, key);
            let finalVal: unknown = val;
            if (field?.scale !== undefined && typeof val === 'number') {
              // toPrecision keeps 0.05 / 0.01 from becoming 5.000000000000001.
              finalVal = Number((val / field.scale).toPrecision(12));
            }

            if (isSelect) {
              await selectLoc.selectOption(String(finalVal));
            } else {
              // clear and fill
              await inputLoc.fill('');
              await inputLoc.fill(typeof finalVal === 'object' ? JSON.stringify(finalVal) : String(finalVal));
            }
          }

          await page.click('button:has-text("Calculate")');
          
          // Wait for results
          for (const [key, expectedVal] of Object.entries(fixture.expected)) {
            if (typeof expectedVal === 'string') continue; 
            if (expectedVal === null) continue;
            
            const displayKey = key.replace(/_/g, " ");
            
            // Results carry a stable data-output-key, which is exact and works
            // wherever the value is rendered (prominent periodic card or the
            // detail list). The label xpath remains as a fallback.
            let foundText = "";
            try {
              foundText = await page
                .locator(`[data-output-key="${key}"]`)
                .first()
                .innerText({ timeout: 2000 });
            } catch {
              try {
                const valLoc = page.locator(`xpath=//span[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')="${displayKey.toLowerCase()}"]/following-sibling::span[1]`);
                foundText = await valLoc.innerText({ timeout: 2000 });
              } catch {
                throw new Error(`Could not find result for ${key}. UI Error possibly?`);
              }
            }
            
            // Invert the display transform using the SAME central registry the
            // UI formats with, so a value rendered as "91.7%" is compared as
            // 0.917 rather than 91.7.
            const parsedNum = parseDisplayedValue(calcId, key, foundText);
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
