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

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
});

test.describe('Category Page', () => {
  test('renders correctly and is accessible', async ({ page }) => {
    await page.goto('/category/finance%20%26%20debt');
    
    await expect(page.getByRole('heading', { name: 'finance & debt Calculators', exact: true })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
});

test.describe('Compound Interest Calculator (INV-002)', () => {
  test('renders correctly and is accessible', async ({ page }) => {
    await page.goto('/calculators/compound-interest-calculator');
    
    // Just verifying it loads correctly for now, as UI bindings are next
    await expect(page.getByRole('heading', { name: 'Compound Interest Calculator' })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
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

test.describe('Statistics Calculators', () => {
  test('Descriptive Statistics (STA-001) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/mean-median-mode-and-range-calculator');
    await expect(page.getByRole('heading', { name: 'Mean, Median, Mode & Range Calculator' })).toBeVisible();
    
    // Dataset can be entered
    const input = page.locator('input[name="values"]');
    await input.fill("1, 2, 3");
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Standard Deviation (STA-003) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/standard-deviation-calculator');
    await expect(page.getByRole('heading', { name: 'Standard Deviation Calculator' })).toBeVisible();
    
    const select = page.locator('select[name="definition"]');
    await expect(select).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
  
  test('Confidence Interval (STA-006) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/confidence-interval-calculator');
    await expect(page.getByRole('heading', { name: 'Confidence Interval Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Sample Size (STA-008) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/sample-size-calculator');
    await expect(page.getByRole('heading', { name: 'Sample Size Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Linear Regression (STA-014) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/linear-regression-calculator');
    await expect(page.getByRole('heading', { name: 'Linear Regression Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
});
test.describe('Business Calculators', () => {
  test('Margin Calculator (BUS-001) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/margin-calculator');
    await expect(page.getByRole('heading', { name: 'Margin Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Break-Even Calculator (BUS-006) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/break-even-calculator');
    await expect(page.getByRole('heading', { name: 'Break-Even Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Discount Calculator (BUS-008) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/discount-calculator');
    await expect(page.getByRole('heading', { name: 'Discount Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
});

test.describe('Mathematics Calculators', () => {
  test('Scientific Calculator (MAT-002) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/scientific-calculator');
    await expect(page.getByRole('heading', { name: 'Scientific Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Percentage Calculator (MAT-003) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/percentage-calculator');
    await expect(page.getByRole('heading', { name: 'Percentage Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Ratio Calculator (MAT-005) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/ratio-calculator');
    await expect(page.getByRole('heading', { name: 'Ratio Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Fraction Calculator (MAT-006) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/fraction-calculator');
    await expect(page.getByRole('heading', { name: 'Fraction Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
});

test.describe('Personal Finance Calculators', () => {
  test('APR Calculator (FIN-006) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/apr-calculator');
    await expect(page.getByRole('heading', { name: 'APR Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Credit Card Calculator (FIN-009) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/credit-card-calculator');
    await expect(page.getByRole('heading', { name: 'Credit Card Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Debt Payoff Calculator (FIN-011) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/debt-payoff-calculator');
    await expect(page.getByRole('heading', { name: 'Debt Payoff Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });

  test('Budget Calculator (FIN-013) renders and is accessible', async ({ page }) => {
    await page.goto('/calculators/budget-calculator');
    await expect(page.getByRole('heading', { name: 'Budget Calculator' })).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    const blockingViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blockingViolations).toEqual([]);
  });
});
test.describe('Property Analytics Calculators', () => {
  const calculators = [
    { id: 'PRO-010', url: '/calculators/loan-to-value-ltv-calculator', name: 'Loan-to-Value (LTV) Calculator' },
    { id: 'PRO-011', url: '/calculators/property-deposit-calculator', name: 'Property Deposit Calculator' },
    { id: 'PRO-016', url: '/calculators/rental-yield-calculator', name: 'Rental Yield Calculator' },
    { id: 'PRO-018', url: '/calculators/buy-to-let-calculator', name: 'Buy-to-Let Calculator' },
    { id: 'PRO-019', url: '/calculators/property-roi-calculator', name: 'Property ROI Calculator' }
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
