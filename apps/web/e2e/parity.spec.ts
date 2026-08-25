import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { mappings } from '../src/components/calculators/fieldMappings';
import type { FieldDef } from '../src/components/calculators/fieldTypes';
import { parseDisplayedValue } from '../src/components/calculators/outputFormats';

// Read every wave's benchmarks so parity coverage grows with the platform
// instead of silently staying at Wave 1.
const fixtureDir = path.resolve(process.cwd(), '../../packages/test-fixtures/fixtures');
const benchmarks: Record<string, any[]> = {
  ...JSON.parse(fs.readFileSync(path.join(fixtureDir, 'wave1-benchmarks.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(fixtureDir, 'wave2-benchmarks.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(fixtureDir, 'wave3-benchmarks.json'), 'utf8'))
};

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
            // Check if it's a select or input
            const inputLoc = page.locator(`input[name="${key}"]`);
            const selectLoc = page.locator(`select[name="${key}"]`);

            const isSelect = await selectLoc.count() > 0;

            // A null fixture value means "this field is blank, so the engine
            // infers it from the others". The field must therefore be CLEARED,
            // not merely skipped.
            //
            // Skipping was wrong, and it was wrong in a way that hid real
            // defects rather than causing false failures. It assumed every
            // inferable field defaults to blank on the page. That holds for
            // MAT-005's `d`, but not for the solve-for-any-of-these
            // calculators: SCI-001 Ohm's Law ships with a worked example in the
            // form, so a fixture meaning "solve for the voltage" left the
            // default voltage sitting in the box and the engine saw a
            // contradiction instead. The same applied to SCI-005 and SCI-006,
            // and to SCI-010, where leaving the default humidity in place made
            // the engine solve the OPPOSITE direction from the one the fixture
            // was testing. Clearing the field reproduces what a user does.
            if (val === null) {
              if (!isSelect && (await inputLoc.count()) > 0) {
                await inputLoc.fill('');
              }
              continue;
            }

            // A field hidden by `showWhen` is not part of the form the user is
            // looking at, so there is nothing to fill and the engine will use
            // its own default. Waiting for it to appear just burns the whole
            // 60-second timeout and reports a misleading failure, which is
            // exactly what happened to BUS-009, STA-007, STA-009, STA-016 and
            // MAT-021 in turn. The fields are set in declaration order, and
            // every controlling field is declared before the fields it
            // controls, so by the time we reach a conditional field its
            // controller already holds the fixture's value and this
            // visibility check reflects the real form state.
            if (!isSelect && (await inputLoc.count()) === 0) continue;
            if (isSelect && (await selectLoc.count()) === 0) continue;

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
