import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Legal and Compliance Pages', () => {
  const pages = [
    { path: '/privacy', title: 'Privacy Policy' },
    { path: '/terms', title: 'Terms of Use' },
    { path: '/disclaimer', title: 'Disclaimer' },
    { path: '/accessibility', title: 'Accessibility Statement' },
  ];

  for (const { path, title } of pages) {
    test.describe(`${title} page`, () => {
      test('should load successfully and display correct title', async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('h1')).toContainText(title);
        await expect(page).toHaveTitle(new RegExp(title));
      });

      test('should pass Axe accessibility checks', async ({ page }) => {
        await page.goto(path);
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
      });
    });
  }
});
