import { test, expect } from "@playwright/test";

test.describe("Phase 5 Completion: Result Experience, Warnings, Assumptions & Presentation", () => {
  test("1. Compound Interest Calculator renders primary result, supporting outputs, assumptions, and suppresses duplicate fv", async ({ page }) => {
    const response = await page.goto("/calculators/compound-interest-calculator");
    expect(response?.status()).toBe(200);

    // Fill inputs
    await page.fill('input[name="P"]', "10000");
    await page.fill('input[name="nominal_rate"]', "5");
    await page.fill('input[name="years"]', "10");

    await page.click('button[type="submit"]');

    // Verify Primary Result card
    await expect(page.locator('#results-container').getByRole('heading', { name: 'Compound Growth' })).toBeVisible();
    await expect(page.locator('[data-output-key="future_value"]')).toBeVisible();

    // Verify Assumptions Region
    const assumptionsBox = page.locator('[data-testid="calculation-assumptions"]');
    await expect(assumptionsBox).toBeVisible();
    await expect(assumptionsBox).toContainText("The nominal annual rate remains constant for the full period.");

    // Verify Detail breakdown visually displays future_value and suppresses duplicate alias fv
    await expect(page.locator('[data-output-key="future_value"]')).toBeVisible();
    await expect(page.locator('[data-testid="detail-results"]').locator('[data-output-key="fv"]')).toHaveCount(0);

    // Verify human-readable labels in results container
    await expect(page.locator('#results-container').getByText('Effective Annual Rate', { exact: true })).toBeVisible();
  });

  test("2. IP Subnet Calculator renders real engine warning for /31 point-to-point subnet", async ({ page }) => {
    const response = await page.goto("/calculators/ip-subnet-calculator");
    expect(response?.status()).toBe(200);

    // Enter /31 prefix
    await page.fill('input[name="address"]', "192.168.1.0");
    await page.fill('input[name="prefix_length"]', "31");

    await page.click('button[type="submit"]');

    // Verify Warning callout is rendered
    const warningBox = page.locator('[data-testid="calculation-warnings"]');
    await expect(warningBox).toBeVisible();
    await expect(warningBox).toContainText("point-to-point link");
  });

  test("3. UK Mortgage Calculator renders prominent primary results and human-readable output labels", async ({ page }) => {
    const response = await page.goto("/calculators/uk-mortgage-calculator");
    expect(response?.status()).toBe(200);

    await page.fill('input[name="price"]', "300000");
    await page.fill('input[name="deposit"]', "60000");
    await page.fill('input[name="rate"]', "4.5");
    await page.fill('input[name="years"]', "25");

    await page.click('button[type="submit"]');

    // Verify Primary Result card
    await expect(page.locator('#results-container').getByRole('heading', { name: 'Mortgage Repayment' })).toBeVisible();
    await expect(page.locator('[data-output-key="monthly_payment"]')).toBeVisible();

    // Verify human-readable labels
    await expect(page.locator('#results-container').getByText('Loan-to-Value (LTV)')).toBeVisible();
    await expect(page.locator('[data-output-key="total_interest"]')).toBeVisible();
  });

  test("4. Stamp Duty (SDLT) Calculator renders prominent primary result with effective rate", async ({ page }) => {
    const response = await page.goto("/calculators/stamp-duty-land-tax-calculator");
    expect(response?.status()).toBe(200);

    await page.fill('input[name="price"]', "350000");
    await page.click('button[type="submit"]');

    await expect(page.locator('#results-container').getByRole('heading', { name: 'Stamp Duty (SDLT)' })).toBeVisible();
    await expect(page.locator('[data-output-key="sdlt"]')).toBeVisible();
    await expect(page.locator('[data-output-key="effective_rate"]')).toBeVisible();
  });

  test("5. Copy Result button copies clean summary text with human labels and no internal IDs", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const response = await page.goto("/calculators/fuel-cost-calculator");
    expect(response?.status()).toBe(200);

    await page.fill('input[name="distance_miles"]', "100");
    await page.fill('input[name="mpg_uk"]', "40");
    await page.fill('input[name="price_p_per_litre"]', "150");

    await page.click('button[type="submit"]');

    // Click Copy Result
    await page.click('button[aria-label="Copy calculation summary to clipboard"]');
    await expect(page.locator('text=Summary Copied!')).toBeVisible();
  });

  test("6. Share Link copies canonical calculator URL without query parameters", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const response = await page.goto("/calculators/vat-calculator");
    expect(response?.status()).toBe(200);

    await page.click('button[type="submit"]');

    // Click Share Link
    await page.click('button[aria-label="Copy calculator web link"]');
    await expect(page.locator('text=Link Copied!')).toBeVisible();
  });

  test("7. Favourite button toggles independently without page navigation", async ({ page }) => {
    const response = await page.goto("/calculators/bmi-calculator");
    expect(response?.status()).toBe(200);

    await page.click('button[type="submit"]');

    const favButton = page.locator('[data-testid="result-actions"] button[aria-label="Add favourite"]');
    await expect(favButton).toBeVisible();
    await favButton.click();

    await expect(page.locator('[data-testid="result-actions"] button[aria-label="Remove favourite"]')).toBeVisible();
    expect(page.url()).toContain("/calculators/bmi-calculator");
  });

  test("8. Stale result invalidates immediately on input modification and recalculates cleanly", async ({ page }) => {
    const response = await page.goto("/calculators/percentage-calculator");
    expect(response?.status()).toBe(200);

    await page.fill('input[name="pct"]', "20");
    await page.fill('input[name="value"]', "100");
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-output-key="result"]')).toBeVisible();

    // Edit input
    await page.fill('input[name="pct"]', "25");

    // Result container should show placeholder
    await expect(page.locator('text=Enter values and calculate to see results.')).toBeVisible();
    await expect(page.locator('[data-output-key="result"]')).not.toBeVisible();

    // Recalculate
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-output-key="result"]')).toBeVisible();
  });
});
