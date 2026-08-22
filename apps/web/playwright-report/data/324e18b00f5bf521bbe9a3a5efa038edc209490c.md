# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Navigation >> can navigate from homepage to category to calculator
- Location: e2e\smoke.spec.ts:51:7

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('link', { name: 'Loan Calculator' }) resolved to 2 elements:
    1) <a href="/calculators/loan-calculator">…</a> aka getByRole('link', { name: 'Loan Calculator FIN-001' })
    2) <a href="/calculators/personal-loan-calculator">…</a> aka getByRole('link', { name: 'Personal Loan Calculator FIN-' })

Call log:
  - waiting for getByRole('link', { name: 'Loan Calculator' })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - link "UK Calculator Platform" [ref=e6] [cursor=pointer]:
        - /url: /
    - generic [ref=e8]:
      - complementary [ref=e9]:
        - heading "Categories" [level=2] [ref=e10]
        - navigation [ref=e11]:
          - link "All Calculators" [ref=e12] [cursor=pointer]:
            - /url: /
          - link "Automotive & Travel" [ref=e13] [cursor=pointer]:
            - /url: /category/automotive%20%26%20travel
          - link "Business & Commercial" [ref=e14] [cursor=pointer]:
            - /url: /category/business%20%26%20commercial
          - link "Conversions" [ref=e15] [cursor=pointer]:
            - /url: /category/conversions
          - link "Date & Time" [ref=e16] [cursor=pointer]:
            - /url: /category/date%20%26%20time
          - link "Finance & Debt" [active] [ref=e17] [cursor=pointer]:
            - /url: /category/finance%20%26%20debt
          - link "Health & Fitness" [ref=e18] [cursor=pointer]:
            - /url: /category/health%20%26%20fitness
          - link "ISA & Tax Wrappers" [ref=e19] [cursor=pointer]:
            - /url: /category/isa%20%26%20tax%20wrappers
          - link "Investing & Wealth" [ref=e20] [cursor=pointer]:
            - /url: /category/investing%20%26%20wealth
          - link "Maths & Algebra" [ref=e21] [cursor=pointer]:
            - /url: /category/maths%20%26%20algebra
          - link "Mortgages & Property" [ref=e22] [cursor=pointer]:
            - /url: /category/mortgages%20%26%20property
          - link "Pensions & Retirement" [ref=e23] [cursor=pointer]:
            - /url: /category/pensions%20%26%20retirement
          - link "Statistics & Data" [ref=e24] [cursor=pointer]:
            - /url: /category/statistics%20%26%20data
          - link "UK Tax & Salary" [ref=e25] [cursor=pointer]:
            - /url: /category/uk%20tax%20%26%20salary
      - main [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]:
            - heading "finance & debt Calculators" [level=1] [ref=e29]
            - paragraph [ref=e30]: Browse 6 calculators in this category.
          - generic [ref=e31]:
            - link "Loan Calculator FIN-001 Finance & Debt Draft" [ref=e32] [cursor=pointer]:
              - /url: /calculators/loan-calculator
              - generic [ref=e33]:
                - generic [ref=e34]:
                  - heading "Loan Calculator" [level=2] [ref=e35]
                  - generic [ref=e36]: FIN-001
                - generic [ref=e38]:
                  - generic [ref=e39]: Finance & Debt
                  - generic [ref=e40]: Draft
            - link "Personal Loan Calculator FIN-002 Finance & Debt Draft" [ref=e41] [cursor=pointer]:
              - /url: /calculators/personal-loan-calculator
              - generic [ref=e42]:
                - generic [ref=e43]:
                  - heading "Personal Loan Calculator" [level=2] [ref=e44]
                  - generic [ref=e45]: FIN-002
                - generic [ref=e47]:
                  - generic [ref=e48]: Finance & Debt
                  - generic [ref=e49]: Draft
            - link "APR Calculator FIN-006 Finance & Debt Draft" [ref=e50] [cursor=pointer]:
              - /url: /calculators/apr-calculator
              - generic [ref=e51]:
                - generic [ref=e52]:
                  - heading "APR Calculator" [level=2] [ref=e53]
                  - generic [ref=e54]: FIN-006
                - generic [ref=e56]:
                  - generic [ref=e57]: Finance & Debt
                  - generic [ref=e58]: Draft
            - link "Credit Card Calculator FIN-009 Finance & Debt Draft" [ref=e59] [cursor=pointer]:
              - /url: /calculators/credit-card-calculator
              - generic [ref=e60]:
                - generic [ref=e61]:
                  - heading "Credit Card Calculator" [level=2] [ref=e62]
                  - generic [ref=e63]: FIN-009
                - generic [ref=e65]:
                  - generic [ref=e66]: Finance & Debt
                  - generic [ref=e67]: Draft
            - link "Debt Payoff Calculator FIN-011 Finance & Debt Draft" [ref=e68] [cursor=pointer]:
              - /url: /calculators/debt-payoff-calculator
              - generic [ref=e69]:
                - generic [ref=e70]:
                  - heading "Debt Payoff Calculator" [level=2] [ref=e71]
                  - generic [ref=e72]: FIN-011
                - generic [ref=e74]:
                  - generic [ref=e75]: Finance & Debt
                  - generic [ref=e76]: Draft
            - link "Budget Calculator FIN-013 Finance & Debt Draft" [ref=e77] [cursor=pointer]:
              - /url: /calculators/budget-calculator
              - generic [ref=e78]:
                - generic [ref=e79]:
                  - heading "Budget Calculator" [level=2] [ref=e80]
                  - generic [ref=e81]: FIN-013
                - generic [ref=e83]:
                  - generic [ref=e84]: Finance & Debt
                  - generic [ref=e85]: Draft
  - alert [ref=e86]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | 
  4  | test.describe('Homepage', () => {
  5  |   test('renders correctly and is accessible', async ({ page }) => {
  6  |     await page.goto('/');
  7  |     
  8  |     // Verify title and navigation
  9  |     await expect(page.getByRole('heading', { name: 'Calculators', exact: true })).toBeVisible();
  10 |     await expect(page.getByRole('navigation')).toBeVisible();
  11 |     
  12 |     // Verify search
  13 |     await expect(page.getByPlaceholder('Search calculators...')).toBeVisible();
  14 |     
  15 |     // Verify calculator cards render
  16 |     const cards = page.locator('.grid > a');
  17 |     await expect(cards.first()).toBeVisible();
  18 | 
  19 |     // Run axe accessibility check
  20 |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  21 |     expect(accessibilityScanResults.violations).toEqual([]);
  22 |   });
  23 | });
  24 | 
  25 | test.describe('Category Page', () => {
  26 |   test('renders correctly and is accessible', async ({ page }) => {
  27 |     await page.goto('/category/finance%20%26%20debt');
  28 |     
  29 |     await expect(page.getByRole('heading', { name: 'finance & debt Calculators', exact: true })).toBeVisible();
  30 |     
  31 |     // Run axe accessibility check
  32 |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  33 |     expect(accessibilityScanResults.violations).toEqual([]);
  34 |   });
  35 | });
  36 | 
  37 | test.describe('Compound Interest Calculator (INV-002)', () => {
  38 |   test('renders correctly and is accessible', async ({ page }) => {
  39 |     await page.goto('/calculators/compound-interest-calculator');
  40 |     
  41 |     // Just verifying it loads correctly for now, as UI bindings are next
  42 |     await expect(page.getByRole('heading', { name: 'Compound Interest Calculator' })).toBeVisible();
  43 | 
  44 |     // Run axe accessibility check
  45 |     const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  46 |     expect(accessibilityScanResults.violations).toEqual([]);
  47 |   });
  48 | });
  49 | 
  50 | test.describe('Navigation', () => {
  51 |   test('can navigate from homepage to category to calculator', async ({ page }) => {
  52 |     await page.goto('/');
  53 |     
  54 |     // Click category
  55 |     await page.getByRole('link', { name: 'Finance & Debt', exact: true }).click();
  56 |     await expect(page).toHaveURL(/.*\/category\/finance%20%26%20debt/);
  57 |     
  58 |     // Click calculator
> 59 |     await page.getByRole('link', { name: 'Loan Calculator' }).click();
     |                                                               ^ Error: locator.click: Error: strict mode violation: getByRole('link', { name: 'Loan Calculator' }) resolved to 2 elements:
  60 |     await expect(page).toHaveURL(/.*\/calculators\/loan-calculator/);
  61 |   });
  62 | });
  63 | 
```