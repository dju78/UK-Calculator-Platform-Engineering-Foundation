import { test, expect } from '@playwright/test';

test.describe('FIN-001 Explicit E2E Test', () => {
  test('calculates correct values for 10000, 6%, 5 years', async ({ page }) => {
    await page.goto('http://localhost:3000/calculators/fin-001');

    await page.fill('input[name="principal"]', '10000');
    await page.fill('input[name="annual_rate"]', '6');
    await page.fill('input[name="years"]', '5');

    await page.click('button:has-text("Calculate")');

    // Wait for the result to show up and match formatting
    await expect(page.locator('xpath=//span[translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")]/following-sibling::span[1]').first()).toBeVisible({ timeout: 5000 });

    const getVal = async (labelName: string) => {
      const valLoc = page.locator(`xpath=//span[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')="${labelName}"]/following-sibling::span[1]`);
      return await valLoc.innerText();
    };

    expect(await getVal('monthly payment')).toContain('£193.33');
    expect(await getVal('total repayment')).toContain('£11,599.68');
    expect(await getVal('total interest')).toContain('£1,599.68');
  });
});
