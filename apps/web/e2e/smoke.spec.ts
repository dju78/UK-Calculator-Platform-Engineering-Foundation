import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Homepage', () => {
  test('renders correctly and is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Verify title and navigation
    await expect(page.getByRole('heading', { name: 'Calculators', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Verify search
    await expect(page.getByPlaceholder('Search calculators...')).toBeVisible();
    
    // Verify calculator cards render
    const cards = page.locator('.grid > a');
    await expect(cards.first()).toBeVisible();

    // Run axe accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Category Page', () => {
  test('renders correctly and is accessible', async ({ page }) => {
    await page.goto('/category/finance%20%26%20debt');
    
    await expect(page.getByRole('heading', { name: 'finance & debt Calculators', exact: true })).toBeVisible();
    
    // Run axe accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Compound Interest Calculator (INV-002)', () => {
  test('renders correctly and is accessible', async ({ page }) => {
    await page.goto('/calculators/compound-interest-calculator');
    
    // Just verifying it loads correctly for now, as UI bindings are next
    await expect(page.getByRole('heading', { name: 'Compound Interest Calculator' })).toBeVisible();

    // Run axe accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Navigation', () => {
  test('can navigate from homepage to category to calculator', async ({ page }) => {
    await page.goto('/');
    
    // Click category
    await page.getByRole('link', { name: 'Finance & Debt', exact: true }).click();
    await expect(page).toHaveURL(/.*\/category\/finance%20%26%20debt/);
    
    // Click calculator
    await page.locator('a[href="/calculators/loan-calculator"]').click();
    await expect(page).toHaveURL(/.*\/calculators\/loan-calculator/);
  });
});
