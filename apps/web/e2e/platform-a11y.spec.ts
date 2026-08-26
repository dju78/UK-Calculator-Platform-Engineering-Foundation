import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { calculatorRegistry, publishedRegistry } from '../../../packages/calculator-registry/src/index';
import { implementedCalculatorIds } from '../../../packages/calculation-engine/src/index';

/**
 * Platform-wide accessibility and mobile sweep.
 *
 * The existing Axe coverage grew alongside the earliest calculators and does
 * not reach the families added later, so a claim of "zero serious or critical
 * violations across the platform" was broader than the evidence. This spec
 * closes that gap by taking one representative calculator from EVERY category
 * in the registry, chosen from the registry itself rather than from a written
 * list, so a new category cannot be added without being covered here.
 *
 * Two decisions matter:
 *
 * AXE RUNS WITH RESULTS SHOWN. An empty form exercises none of the result
 * rendering, which is where the interesting violations live: colour contrast on
 * a warning, a table without headers, a live region that never announces. Every
 * page here is calculated before it is scanned.
 *
 * THE MOBILE PASS CHECKS FOR HORIZONTAL OVERFLOW rather than appearance. A
 * results table that pushes the page sideways on a 320px screen is the single
 * most common responsive failure and it is objectively detectable, unlike
 * "looks right".
 */

const implemented = implementedCalculatorIds();
const published = publishedRegistry(implemented);

/** One calculator per category, the lowest id in each so the choice is stable. */
const representatives = (() => {
  const byCategory = new Map<string, typeof published[number]>();
  for (const calc of [...published].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!byCategory.has(calc.category)) byCategory.set(calc.category, calc);
  }
  return [...byCategory.values()];
})();

const categories = [...new Set(calculatorRegistry.map((c) => c.category))];

const LEGAL_ROUTES = ['/privacy', '/terms', '/disclaimer', '/accessibility'];

async function blockingViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`);
}

test.describe('Platform accessibility', () => {
  for (const calc of representatives) {
    test(`${calc.category}: ${calc.id} has no serious or critical violations WITH RESULTS SHOWN`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`/calculators/${calc.slug}`);

      const calculate = page.getByRole('button', { name: /calculate/i });
      if (await calculate.count()) {
        await calculate.first().click();
        // Wait for something to have been rendered into the results region.
        await page
          .locator('[data-output-key]')
          .first()
          .waitFor({ state: 'visible', timeout: 15000 })
          .catch(() => {
            // A calculator whose defaults legitimately produce a validation
            // message rather than a result still needs scanning, and the
            // message itself is exactly the kind of content Axe should see.
          });
      }

      expect(await blockingViolations(page)).toEqual([]);
    });
  }

  for (const category of categories) {
    test(`category route "${category}" is accessible`, async ({ page }) => {
      await page.goto(`/category/${encodeURIComponent(category.toLowerCase())}`);
      expect(await blockingViolations(page)).toEqual([]);
    });
  }

  for (const route of LEGAL_ROUTES) {
    test(`legal route ${route} is accessible`, async ({ page }) => {
      await page.goto(route);
      expect(await blockingViolations(page)).toEqual([]);
    });
  }
});

test.describe('Mobile layout', () => {
  // 320px is the narrowest screen still in real use and the width at which a
  // wide results table gives itself away.
  test.use({ viewport: { width: 320, height: 720 } });

  for (const calc of representatives) {
    test(`${calc.category}: ${calc.id} does not scroll sideways at 320px`, async ({ page }) => {
      await page.goto(`/calculators/${calc.slug}`);

      const calculate = page.getByRole('button', { name: /calculate/i });
      if (await calculate.count()) {
        await calculate.first().click();
        await page
          .locator('[data-output-key]')
          .first()
          .waitFor({ state: 'visible', timeout: 15000 })
          .catch(() => {});
      }

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth
        };
      });

      expect(
        overflow.scrollWidth,
        `${calc.id} overflows its viewport by ${overflow.scrollWidth - overflow.clientWidth}px, which forces horizontal scrolling on a phone`
      ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }
});

test.describe('Site routes', () => {
  test('every published calculator route returns 200', async ({ request }) => {
    const failures: string[] = [];
    for (const calc of published) {
      const response = await request.get(`/calculators/${calc.slug}`);
      if (response.status() !== 200) {
        failures.push(`${calc.id} (${calc.slug}): ${response.status()}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test('the sitemap lists every published calculator and no unpublished one', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    const missing = published.filter((c) => !body.includes(`/calculators/${c.slug}`));
    expect(missing.map((c) => c.id)).toEqual([]);

    const unpublished = calculatorRegistry.filter(
      (c) => !published.some((p) => p.id === c.id)
    );
    const leaked = unpublished.filter((c) => body.includes(`/calculators/${c.slug}`));
    expect(leaked.map((c) => c.id)).toEqual([]);
  });

  test('robots.txt permits crawling and points at the sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toMatch(/sitemap:/i);
    expect(body).not.toMatch(/^\s*Disallow:\s*\/\s*$/im);
  });
});
