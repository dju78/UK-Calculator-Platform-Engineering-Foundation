import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Phase 5 Utility: Result Actions & Post-Calculation UX", () => {
  test("shows result actions after calculation on UK Income Tax Calculator and allows copy/share/favourite", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/calculators/uk-income-tax-calculator");

    // Before calculation: result actions should not be visible
    await expect(page.getByTestId("result-actions")).toHaveCount(0);

    // Calculate
    await page.getByRole("button", { name: "Calculate" }).click();

    // After calculation: result actions should appear
    const actions = page.getByTestId("result-actions");
    await expect(actions).toBeVisible();

    // Copy Result button
    const copyResultBtn = actions.getByRole("button", { name: /Copy calculation summary/i });
    await expect(copyResultBtn).toBeVisible();
    await copyResultBtn.click();
    await expect(actions.getByText(/Summary Copied!/i)).toBeVisible();

    // Copy Link / Share button
    const copyLinkBtn = actions.getByRole("button", { name: /Copy calculator web link/i });
    await expect(copyLinkBtn).toBeVisible();
    await copyLinkBtn.click();
    await expect(actions.getByText(/Link Copied!/i)).toBeVisible();

    // Print button
    const printBtn = actions.getByRole("button", { name: /Print calculation/i });
    await expect(printBtn).toBeVisible();

    // Favourite toggle in actions
    const favouriteBtn = actions.getByRole("button", { name: /Save to favourites|Remove from favourites/i });
    await expect(favouriteBtn).toBeVisible();
    await favouriteBtn.click();
    await expect(favouriteBtn).toHaveText(/Favourited/i);

    // Verify localStorage has saved the favourite slug
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("ukcalc_favourites"))).toContain("uk-income-tax-calculator");

    // Live announcement for accessibility
    const announcement = page.locator('div[role="status"]');
    await expect(announcement).toHaveCount(2); // Page utility + ResultActions
  });

  test("tracks recently visited calculator in localStorage", async ({ page }) => {
    await page.goto("/calculators/uk-mortgage-calculator");
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("ukcalc_recents"))).toContain("uk-mortgage-calculator");
  });

  test("has zero serious or critical Axe accessibility violations on calculated state", async ({ page }) => {
    await page.goto("/calculators/uk-income-tax-calculator");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByTestId("result-actions")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const seriousOrCritical = accessibilityScanResults.violations.filter(
      v => v.impact === "serious" || v.impact === "critical"
    );
    expect(seriousOrCritical).toEqual([]);
  });
});

test.describe("Phase 5 Utility: Search Aliases & Browser Navigation", () => {
  test("matches calculators using colloquial aliases (PAYE, Stamp Duty, HICBC, FIRE)", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByLabel("Search calculators");

    // Search PAYE
    await searchInput.fill("PAYE");
    await expect(page.getByRole("heading", { name: "UK Income Tax Calculator" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "UK Salary Calculator" })).toBeVisible();

    // Search Stamp Duty
    await searchInput.fill("stamp duty");
    await expect(page.getByRole("heading", { name: "Stamp Duty Land Tax Calculator" })).toBeVisible();

    // Search HICBC
    await searchInput.fill("HICBC");
    await expect(page.getByRole("heading", { name: "High Income Child Benefit Charge Calculator" })).toBeVisible();

    // Search FIRE
    await searchInput.fill("FIRE");
    await expect(page.getByRole("heading", { name: "FIRE Calculator" })).toBeVisible();
  });

  test("supports Favourites and Recently Used filter tabs in CalculatorBrowser", async ({ page }) => {
    // Seed favourites and recents in localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("ukcalc_favourites", JSON.stringify(["uk-income-tax-calculator", "uk-mortgage-calculator"]));
      localStorage.setItem("ukcalc_recents", JSON.stringify(["bmi-calculator"]));
      window.dispatchEvent(new Event("ukcalc_storage_change"));
    });

    await page.reload();

    // Favourites tab should appear
    const favTab = page.getByRole("button", { name: /^Favourites/i });
    await expect(favTab).toBeVisible();
    await favTab.click();

    // Should only show the 2 favourited calculators
    await expect(page.getByRole("heading", { name: "UK Income Tax Calculator" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "UK Mortgage Calculator" })).toBeVisible();
    await expect(page.getByText("Showing 2 tools")).toBeVisible();

    // Recents tab
    const recentTab = page.getByRole("button", { name: /^Recently Used/i });
    await expect(recentTab).toBeVisible();
    await recentTab.click();
    await expect(page.getByRole("heading", { name: "BMI Calculator" })).toBeVisible();
    await expect(page.getByText("Showing 1 tool")).toBeVisible();
  });

  test("shows clear no-results guidance with suggestions and reset button", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByLabel("Search calculators");
    await searchInput.fill("nonexistentquery12345");

    await expect(page.getByText(/No calculators found matching/i)).toBeVisible();
    await expect(page.getByText(/Popular:/i)).toBeVisible();

    // Reset button
    const resetBtn = page.getByRole("button", { name: /Reset Search & Filters/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    await expect(page.getByText("Showing 253 tools")).toBeVisible();
  });
});

test.describe("Phase 5 Utility: Mobile Viewports & Responsive UX", () => {
  const viewports = [
    { name: "320px (iPhone SE narrow)", width: 320, height: 568 },
    { name: "375px (iPhone standard)", width: 375, height: 667 },
    { name: "390px (iPhone 12/13/14)", width: 390, height: 844 },
    { name: "768px (iPad portrait)", width: 768, height: 1024 }
  ];

  const testUrls = [
    "/",
    "/calculators/uk-income-tax-calculator",
    "/calculators/uk-mortgage-calculator",
    "/calculators/stamp-duty-land-tax-calculator",
    "/calculators/general-investment-account-tax-calculator",
    "/calculators/high-income-child-benefit-charge-calculator",
    "/calculators/fire-calculator",
    "/calculators/monte-carlo-investment-simulator",
    "/calculators/bmi-calculator",
    "/calculators/pregnancy-due-date-calculator",
    "/calculators/password-strength-entropy-calculator",
    "/calculators/linear-regression-calculator"
  ];

  for (const vp of viewports) {
    test(`has no horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const url of testUrls) {
        await page.goto(url);
        await page.waitForLoadState("domcontentloaded");

        // Verify document does not exceed viewport width
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(isOverflowing, `Horizontal overflow detected at ${vp.name} on ${url}`).toBe(false);
      }
    });
  }
});
