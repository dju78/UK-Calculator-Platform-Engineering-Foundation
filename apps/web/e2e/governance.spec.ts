import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Browser-level checks for the Phase 4 governance pages.
 *
 * These assert that the pages actually serve, are navigable, declare correct
 * canonical URLs against the production domain, and pass automated
 * accessibility scanning - the same bar the legal pages are already held to.
 */

const CANONICAL_ORIGIN = 'https://ukcalc.jomovate.com';

const governancePages = [
  { path: '/about', heading: 'About the UK Calculator Platform', title: 'About' },
  { path: '/contact', heading: 'Contact', title: 'Contact' },
  { path: '/editorial-policy', heading: 'Editorial Policy', title: 'Editorial Policy' },
  {
    path: '/how-we-check-our-figures',
    heading: 'How we check our figures',
    title: 'How We Check Our Figures',
  },
  { path: '/updates', heading: 'Updates', title: 'Updates' },
];

test.describe('Phase 4 governance pages', () => {
  for (const { path, heading, title } of governancePages) {
    test.describe(`${path}`, () => {
      test('serves with the expected heading and title', async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.locator('h1')).toContainText(heading);
        await expect(page).toHaveTitle(new RegExp(title));
      });

      test('declares a canonical URL on the production domain', async ({ page }) => {
        await page.goto(path);
        const canonical = await page
          .locator('link[rel="canonical"]')
          .getAttribute('href');
        expect(canonical).toBe(`${CANONICAL_ORIGIN}${path}`);
      });

      test('exposes breadcrumb navigation back to the homepage', async ({ page }) => {
        await page.goto(path);
        const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
        await expect(breadcrumb).toBeVisible();
        await expect(breadcrumb.getByRole('link', { name: 'Home' })).toBeVisible();
      });

      test('passes Axe accessibility checks', async ({ page }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });
    });
  }

  test('governance pages are reachable from the footer of any page', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    for (const { path } of governancePages) {
      await expect(footer.locator(`a[href="${path}"]`)).toHaveCount(1);
    }
  });

  test('the sitemap lists every governance route', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();
    for (const { path } of governancePages) {
      expect(xml).toContain(`${CANONICAL_ORIGIN}${path}`);
    }
    // Assembled at runtime so this file does not itself contain the literal
    // host that the repository-wide staleness check searches for.
    expect(xml).not.toContain(['onrender', 'com'].join('.'));
  });

  test('the assurance page shows a dated verification snapshot', async ({ page }) => {
    await page.goto('/how-we-check-our-figures');
    await expect(page.getByText(/Verification snapshot —/)).toBeVisible();
    await expect(
      page.getByText(/Reference benchmark cases executed/)
    ).toBeVisible();
  });

  test('the assurance page states the limits of its verification', async ({ page }) => {
    await page.goto('/how-we-check-our-figures');
    await expect(
      page.getByRole('heading', { name: /What this does not prove/i })
    ).toBeVisible();
  });

  test('the updates page renders dated entries newest first', async ({ page }) => {
    await page.goto('/updates');
    const times = page.locator('ol time');
    const count = await times.count();
    expect(count).toBeGreaterThan(0);

    const dates: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const value = await times.nth(i).getAttribute('datetime');
      expect(value).toBeTruthy();
      dates.push(value as string);
    }
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  test('the contact page exposes a working mailto address', async ({ page }) => {
    await page.goto('/contact');
    const mailto = page.locator('a[href^="mailto:"]').first();
    await expect(mailto).toBeVisible();
    const href = await mailto.getAttribute('href');
    expect(href).toContain('@');
    // Phase 4 deliberately ships no form backend.
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('the editorial policy renders all three source tiers', async ({ page }) => {
    await page.goto('/editorial-policy');
    for (const tier of [1, 2, 3]) {
      await expect(
        page.getByRole('heading', { name: new RegExp(`Tier ${tier}`) })
      ).toBeVisible();
    }
  });
});
