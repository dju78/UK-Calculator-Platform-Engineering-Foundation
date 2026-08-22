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
