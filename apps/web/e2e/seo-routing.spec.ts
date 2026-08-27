import { test, expect } from '@playwright/test';
import { liveCalculators } from '../src/lib/calculators';

/**
 * Routing and SEO regressions.
 *
 * The sitemap previously advertised /calculators/<INTERNAL-ID> for all 55
 * calculators - none of which is the URL the site actually links to - and both
 * the sitemap and robots.txt pointed at a domain that does not serve the app.
 */

const calculators = liveCalculators as Array<{ id: string; slug: string; name: string; category: string }>;
const categories = [...new Set(calculators.map(c => c.category))];

/**
 * Every non-homepage standalone route the sitemap must advertise: the legal
 * set, plus the Phase 4 governance pages. Listed explicitly rather than as a
 * bare count, so adding a page means naming it here and the assertion below
 * keeps meaning something.
 */
const standalonePages = [
  '/privacy',
  '/terms',
  '/disclaimer',
  '/accessibility',
  '/about',
  '/contact',
  '/editorial-policy',
  '/how-we-check-our-figures',
  '/updates',
];

test.describe('Sitemap', () => {
  test('lists every calculator by slug, never by internal id', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();

    for (const calc of calculators) {
      expect(xml, `${calc.id} should appear as a slug URL`).toContain(`/calculators/${calc.slug}`);
    }
    // No internal-id URLs at all.
    expect(xml).not.toMatch(/\/calculators\/[A-Z]{3}-\d{3}/);
  });

  test('encodes category URLs and covers every category and legal page', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const category of categories) {
      expect(xml).toContain(`/category/${encodeURIComponent(category.toLowerCase())}`);
    }
    for (const page of standalonePages) {
      expect(xml).toContain(page);
    }
    // Raw spaces and ampersands would make the sitemap invalid.
    const locs = xml.match(/<loc>([^<]*)<\/loc>/g) ?? [];
    // Homepage plus every standalone page, category and calculator, and
    // nothing else - so an accidentally duplicated or orphaned entry fails.
    expect(locs.length).toBe(1 + standalonePages.length + categories.length + calculators.length);
    for (const loc of locs) {
      expect(loc).not.toMatch(/<loc>[^<]* [^<]*<\/loc>/);
      expect(loc.replace(/<\/?loc>/g, '')).not.toContain('&');
    }
  });
});

test.describe('robots.txt', () => {
  test('permits crawling and points at the sitemap on the same origin', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('Allow: /');
    expect(body).not.toMatch(/Disallow:\s*\/\s*$/m);
    expect(body).toContain('/sitemap.xml');
  });
});

test.describe('Per-page metadata', () => {
  test('every calculator page has a unique title, description and canonical', async ({ request }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const calc of calculators) {
      const html = await (await request.get(`/calculators/${calc.slug}`)).text();
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
      const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
      const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];

      expect(title, `${calc.id} title`).toBeTruthy();
      expect(description, `${calc.id} description`).toBeTruthy();
      expect(canonical, `${calc.id} canonical`).toContain(`/calculators/${calc.slug}`);

      expect(titles.has(title!), `${calc.id} duplicate title`).toBe(false);
      expect(descriptions.has(description!), `${calc.id} duplicate description`).toBe(false);
      titles.add(title!);
      descriptions.add(description!);
    }
  });

  test('rules-sensitive pages reference the 2026/27 tax year, not an older one', async ({ request }) => {
    const html = await (await request.get('/calculators/take-home-pay-calculator')).text();
    expect(html).toContain('2026/27');
    expect(html).not.toContain('2025/26');
  });

  test('calculator pages carry valid, factual structured data', async ({ request }) => {
    const html = await (await request.get('/calculators/loan-calculator')).text();
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(block).toBeTruthy();
    const data = JSON.parse(block!);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebApplication');
    expect(data.url).toContain('/calculators/loan-calculator');
    // No invented ratings, prices or reviews.
    expect(data.aggregateRating).toBeUndefined();
    expect(data.review).toBeUndefined();
  });
});

test.describe('Deep links', () => {
  test('every calculator route loads directly', async ({ request }) => {
    for (const calc of calculators) {
      const res = await request.get(`/calculators/${calc.slug}`);
      expect(res.status(), `${calc.id} (${calc.slug})`).toBe(200);
    }
  });

  test('every category route loads directly', async ({ request }) => {
    for (const category of categories) {
      const res = await request.get(`/category/${encodeURIComponent(category.toLowerCase())}`);
      expect(res.status(), category).toBe(200);
    }
  });

  test('unknown calculators and categories return 404, not an empty page', async ({ request }) => {
    expect((await request.get('/calculators/not-a-real-calculator')).status()).toBe(404);
    expect((await request.get('/category/not-a-real-category')).status()).toBe(404);
  });

  test('security headers are present on a deep link', async ({ request }) => {
    const res = await request.get('/calculators/loan-calculator');
    const headers = res.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['referrer-policy']).toBeTruthy();
  });
});

test.describe('Disclaimers', () => {
  test('the health calculator does not carry a finance-only disclaimer', async ({ page }) => {
    await page.goto('/calculators/bmi-calculator');
    const disclaimer = page.getByRole('note');
    await expect(disclaimer).toContainText(/not medical advice/i);
    await expect(disclaimer).not.toContainText(/tax/i);
  });

  test('tax pages disclaim advice and name the tax year', async ({ page }) => {
    await page.goto('/calculators/take-home-pay-calculator');
    const disclaimer = page.getByRole('note');
    await expect(disclaimer).toContainText(/not tax advice/i);
    await expect(disclaimer).toContainText('2026/27');
  });
});
