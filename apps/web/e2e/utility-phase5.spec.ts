import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Phase 5 Utility: Result Actions & Post-Calculation UX", () => {
  test("invalidates stale results when an input changes to prevent user confusion", async ({ page }) => {
    await page.goto("/calculators/uk-income-tax-calculator");
    await page.getByLabel("Income (£)").fill("50000");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.locator("#results-container")).toBeVisible();

    // Changing an input must invalidate the previous result rather than leave
    // a stale figure on screen next to the new inputs.
    await page.getByLabel("Income (£)").fill("60000");
    await expect(page.getByText("Enter values and calculate to see results.")).toBeVisible();

    // Calculate again
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.locator("#results-container")).toBeVisible();
  });
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
    const favouriteBtn = actions.getByRole("button", { name: /favourite/i });
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

  test("resolves corrected Phase 4 semantic search aliases directly to the intended calculators", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.getByLabel("Search calculators");

    // 1. student loan -> Student Loan Repayment Calculator
    await searchInput.fill("student loan");
    await expect(page.getByRole("heading", { name: "Student Loan Repayment Calculator", exact: true })).toBeVisible();

    // 2. cagr -> CAGR Calculator
    await searchInput.fill("cagr");
    await expect(page.getByRole("heading", { name: "CAGR Calculator", exact: true })).toBeVisible();

    // 3. irr -> IRR Calculator
    await searchInput.fill("irr");
    await expect(page.getByRole("heading", { name: "IRR Calculator", exact: true })).toBeVisible();

    // 4. pregnancy due date -> Pregnancy Due Date Calculator
    await searchInput.fill("pregnancy due date");
    await expect(page.getByRole("heading", { name: "Pregnancy Due Date Calculator", exact: true })).toBeVisible();

    // 5. lifetime isa -> Lifetime ISA Calculator
    await searchInput.fill("lifetime isa");
    await expect(page.getByRole("heading", { name: "Lifetime ISA Calculator", exact: true })).toBeVisible();

    // 6. fuel cost -> Fuel Cost Calculator
    await searchInput.fill("fuel cost");
    await expect(page.getByRole("heading", { name: "Fuel Cost Calculator", exact: true })).toBeVisible();
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
    // TEC-005's canonical slug. The previous value here was
    // password-strength-entropy-calculator, which 404s, so the overflow
    // assertion silently ran against the not-found page.
    "/calculators/password-generator",
    "/calculators/linear-regression-calculator"
  ];

  for (const vp of viewports) {
    test(`has no horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const url of testUrls) {
        const response = await page.goto(url); expect(response?.status()).toBe(200);
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

test.describe("Phase 5 Utility: Mobile Category Navigation", () => {
  const viewports = [320, 375, 390, 430, 768];
  for (const width of viewports) {
    test(`does not push main content below a full viewport sidebar at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const response = await page.goto("/calculators/uk-income-tax-calculator");
      expect(response?.status()).toBe(200);
      
      const form = page.locator("form").first();
      const box = await form.boundingBox();
      
      if (width < 768) {
        const aside = page.locator("aside").first();
        const asideBox = await aside.boundingBox();
        expect(asideBox).not.toBeNull();
        expect(asideBox!.height).toBeLessThan(800);

        expect(box).not.toBeNull();
        expect(box!.y).toBeLessThan(800);
      }
    });
  }
});

test.describe("Phase 5 Utility: Homepage Card Navigation Regression", () => {
  test("clicks on card body navigate to calculator", async ({ page }) => {
    await page.goto("/");
    // Click card body
    const cardLink = page.locator(`a[aria-label="UK Income Tax Calculator"]`).first();
    await cardLink.click({ position: { x: 10, y: 10 } }); 
    await expect(page).toHaveURL(/.*uk-income-tax-calculator/);
  });
  
  test("keyboard focus on card link activates navigation", async ({ page }) => {
    await page.goto("/");
    const cardLink = page.locator(`a[aria-label="UK Income Tax Calculator"]`).first();
    await cardLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/.*uk-income-tax-calculator/);
  });
  
  test("clicking Favourite star does not navigate but updates state", async ({ page }) => {
    await page.goto("/");

    // Scope to one known card and match the button by a label pattern that
    // survives the toggle, so the same element is asserted before and after.
    const card = page.locator('[data-calculator-id="TAX-001"]').first();
    const favBtn = card.getByRole("button", { name: /favourite/i });
    await expect(favBtn).toHaveAttribute("aria-label", "Add favourite");

    await favBtn.click();

    // 1. It must not navigate.
    await expect(page).not.toHaveURL(/.*calculators\//);

    // 2. The state must actually change, in the UI and in storage.
    await expect(favBtn).toHaveAttribute("aria-label", "Remove favourite");
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("ukcalc_favourites")
    );
    expect(stored).toContain("uk-income-tax-calculator");
  });
});

test.describe("Phase 5 Utility: Post-Calculate Mobile Feedback", () => {
  test("scrolls to results on mobile after successful calculation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/calculators/uk-income-tax-calculator");
    await page.getByLabel("Income (£)").fill("50000");
    
    // Evaluate current scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    await page.getByRole("button", { name: "Calculate" }).click();
    
    // Wait for scroll animation to complete
    await page.waitForTimeout(1000); 
    
    // Evaluate new scroll position
    const finalScrollY = await page.evaluate(() => window.scrollY);
    
    // Verify we actually scrolled down
    expect(finalScrollY).toBeGreaterThan(initialScrollY);
    
    const results = page.locator("#results-container"); 
    await expect(results).toBeVisible();
  });
});

