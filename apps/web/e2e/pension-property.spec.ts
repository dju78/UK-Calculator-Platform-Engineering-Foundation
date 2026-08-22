import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mortgage & Pension Calculators', () => {
  const calculators = [
    { id: 'PRO-002', url: '/calculators/mortgage-affordability-calculator', name: 'Mortgage Affordability Calculator' },
    { id: 'PEN-001', url: '/calculators/pension-growth-calculator', name: 'Pension Growth Calculator' },
    { id: 'PEN-002', url: '/calculators/sipp-growth-calculator', name: 'SIPP Growth Calculator' },
    { id: 'PEN-003', url: '/calculators/workplace-pension-calculator', name: 'Workplace Pension Calculator' },
    { id: 'PEN-006', url: '/calculators/retirement-calculator', name: 'Retirement Calculator' }
  ];

  for (const calc of calculators) {
    test(`${calc.name} (${calc.id}) renders and is accessible`, async ({ page }) => {
      await page.goto(calc.url);
      await expect(page.getByRole('heading', { name: calc.name })).toBeVisible();

      // Ensure form can be interacted with (click Calculate if button exists)
      const calculateBtn = page.getByRole('button', { name: /calculate/i });
      if (await calculateBtn.isVisible()) {
        await calculateBtn.click();
      }

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      const blockingViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(blockingViolations).toEqual([]);
    });
  }
});
