import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Professionalisation Phase 6: Growth, Monetisation & B2B Embeds", () => {
  test("1. /for-organisations renders correctly with zero serious/critical Axe violations", async ({ page }) => {
    await page.goto("/for-organisations");

    // Title and Headings
    await expect(page.getByRole("heading", { level: 1, name: /For Organisations & Partners/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Contact Our Team/i })).toBeVisible();

    // Axe Accessibility Check
    const axe = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = axe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test("2. /commercial-disclosure renders correctly with zero serious/critical Axe violations", async ({ page }) => {
    await page.goto("/commercial-disclosure");

    // Title and Policy sections
    await expect(page.getByRole("heading", { level: 1, name: /Commercial Disclosure/i })).toBeVisible();
    await expect(page.getByText(/Editorial & Mathematical Independence/i)).toBeVisible();

    // Axe Accessibility Check
    const axe = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = axe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test("3. /embed/loan-calculator renders isolated embed view with attribution and zero Axe violations", async ({ page }) => {
    await page.goto("/embed/loan-calculator");

    // Should NOT have standard website header or sidebar
    await expect(page.getByRole("navigation", { name: "Main Navigation" })).toHaveCount(0);

    // Embed header and form
    await expect(page.getByRole("heading", { level: 1, name: "Loan Calculator" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Calculate" })).toBeVisible();

    // Attribution footer
    const attributionLink = page.getByRole("link", { name: /UK Calculator Platform/i });
    await expect(attributionLink).toBeVisible();
    await expect(attributionLink).toHaveAttribute("target", "_blank");
    await expect(attributionLink).toHaveAttribute("href", /https:\/\/ukcalc\.jomovate\.com\/calculators\/loan-calculator/);

    // Run calculation inside embed
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByText(/Monthly Payment/i)).toBeVisible();

    // Axe Accessibility Check inside embed
    const axe = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = axe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test("4. /embed/compound-interest-calculator renders and calculates correctly", async ({ page }) => {
    await page.goto("/embed/compound-interest-calculator");

    await expect(page.getByRole("heading", { level: 1, name: "Compound Interest Calculator" })).toBeVisible();
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByText(/Future Value/i)).toBeVisible();
  });

  test("5. /embed/[unsupported-slug] returns 404 not found", async ({ page }) => {
    const response = await page.goto("/embed/arbitrary-unsupported-calculator");
    expect(response?.status()).toBe(404);
  });

  test("6. /privacy embeds ConsentManager and allows toggling analytics preference", async ({ page }) => {
    await page.goto("/privacy");

    const manager = page.getByTestId("consent-manager");
    await expect(manager).toBeVisible();

    const enableBtn = manager.getByRole("button", { name: "Enable Analytics" });
    const disableBtn = manager.getByRole("button", { name: "Disable Analytics" });

    await expect(enableBtn).toBeVisible();
    await expect(disableBtn).toBeVisible();

    // Enable analytics
    await enableBtn.click();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("ukcalc_analytics_consent"))).toBe("granted");

    // Disable analytics
    await disableBtn.click();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("ukcalc_analytics_consent"))).toBe("denied");

    // Axe Accessibility Check on privacy page
    const axe = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = axe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical).toEqual([]);
  });

  test("7. Footer includes links to For Organisations and Commercial Disclosure", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "For Organisations" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Commercial Disclosure" })).toBeVisible();
  });
});
