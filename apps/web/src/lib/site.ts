/**
 * Single source of truth for the canonical site origin and page metadata.
 *
 * The origin was previously hard-coded to a domain that does not serve the
 * application, which meant the sitemap advertised URLs on one host, the
 * OpenGraph tags claimed another, and the deployed site had no canonical at
 * all. Everything now derives from one value, overridable per environment.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://uk-calculator-platform.onrender.com"
).replace(/\/$/, "");

export const SITE_NAME = "UK Calculator Platform";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Canonical path for a calculator. Always the slug, never the internal id. */
export function calculatorPath(slug: string): string {
  return `/calculators/${slug}`;
}

/**
 * Canonical path for a category. The category name is percent-encoded exactly
 * once so the value is a valid URL component in sitemaps and link targets.
 */
export function categoryPath(category: string): string {
  return `/category/${encodeURIComponent(category.toLowerCase())}`;
}

const TAX_YEAR = "2026/27";

/**
 * A distinct, useful description per calculator. Generic boilerplate repeated
 * across pages is treated as duplicate content by search engines, so the
 * description names the calculator, its subject area and - for rules-sensitive
 * calculators - the tax year the figures apply to.
 */
export function calculatorDescription(calc: {
  name: string;
  category: string;
  subcategory?: string;
  rulesSensitive?: boolean;
}): string {
  const topic = calc.subcategory ? `${calc.subcategory.toLowerCase()} ` : "";
  const base = `Free ${calc.name.replace(/ Calculator$/i, "")} calculator for the UK. Work out ${topic}figures in the ${calc.category.toLowerCase()} category`;
  return calc.rulesSensitive
    ? `${base}, using ${TAX_YEAR} UK rules. Estimates only - not financial or tax advice.`
    : `${base}. Estimates only - not financial or tax advice.`;
}

export function categoryDescription(category: string, count: number): string {
  return `Browse ${count} free UK ${category.toLowerCase()} calculators. Estimates based on ${TAX_YEAR} UK rules where applicable - not financial or tax advice.`;
}
