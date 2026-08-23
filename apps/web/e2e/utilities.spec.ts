import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Append this block to smoke.spec.ts
test.describe('Everyday Utilities Calculators', () => {
  const calculators = [
    { id: 'DAT-001', url: '/calculators/age-calculator', name: 'Age Calculator' },
    { id: 'AUT-006', url: '/calculators/fuel-cost-calculator', name: 'Fuel Cost Calculator' },
    { id: 'CON-001', url: '/calculators/unit-conversion-calculator', name: 'Unit Conversion Calculator' },
    { id: 'CON-010', url: '/calculators/currency-converter', name: 'Currency Converter' }
  ];

  for (const calc of calculators) {
    if (calc.id === 'CON-010') {
      test(calc.name + ' E2E complete flow', async ({ page }) => {
        // Mock the FX API to return deterministic data
        await page.route('https://api.frankfurter.app/latest?from=GBP', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              amount: 1,
              base: 'GBP',
              date: '2026-08-22',
              rates: { USD: 1.25, EUR: 1.15 }
            })
          });
        });

        await page.goto(calc.url);
        await expect(page.getByRole('heading', { name: calc.name })).toBeVisible();

        // Fill form fields
        await page.getByLabel(/Amount/i).fill('100');
        await page.getByLabel(/From/i).selectOption('GBP');
        await page.getByLabel(/To/i).selectOption('USD');
        
        await page.getByRole('button', { name: /Calculate/i }).click();

        // Check the deterministic result
        await expect(page.getByText(/125/)).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        const blockingViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical'
        );
        expect(blockingViolations).toEqual([]);
      });
      continue;
    }

    test(calc.name + ' renders and is accessible', async ({ page }) => {
      await page.goto(calc.url);
      await expect(page.getByRole('heading', { name: calc.name })).toBeVisible();
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      const blockingViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(blockingViolations).toEqual([]);
    });
  }
});
