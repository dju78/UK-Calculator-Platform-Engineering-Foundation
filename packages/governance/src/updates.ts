/**
 * The public change record rendered at /updates.
 *
 * Two rules govern what may appear here.
 *
 * First, every date is taken from repository history - the authored date of
 * the commit or merge that shipped the change - and never estimated. A
 * transparency page that guesses when a tax rate was corrected is worse than
 * no page at all, because it invites a reader to rely on a date nobody
 * checked.
 *
 * Second, an entry earns its place only if a visitor's answer changed, or
 * their reason to trust an answer changed. Refactors, dependency bumps and
 * internal test scaffolding are invisible to the reader and stay out. That is
 * why this list is short: it is a change record, not a commit log.
 */
import type { PlatformUpdate } from "./types.js";

/**
 * Entries newest-first. Dates are ISO and correspond to repository history on
 * the main branch.
 */
export const PLATFORM_UPDATES: PlatformUpdate[] = [
  {
    date: "2026-08-26",
    title: "Governance, editorial policy and source transparency published",
    summary:
      "Added public pages covering who runs the platform, how figures are checked, the source hierarchy that rule-sensitive content is held to, and how to report a suspected error. Review dates and ruleset versions shown on calculator guides are now derived from the editorial content itself rather than maintained separately.",
    category: "Trust and transparency",
    reference: { label: "How we check our figures", href: "/how-we-check-our-figures" },
  },
  {
    date: "2026-08-26",
    title: "Moved to ukcalc.jomovate.com",
    summary:
      "The platform now has its own branded domain. Canonical URLs, the sitemap and social preview metadata all point at the new address, so search engines index one consistent set of URLs.",
    category: "Platform",
  },
  {
    date: "2026-08-26",
    title: "Calculator guides published for the platform's most-used tools",
    summary:
      "Forty calculators gained a full editorial guide: what the calculator does and deliberately does not do, the governing formula, a worked example computed by the live engine, the assumptions and limitations behind the model, and the official sources behind every rule-sensitive figure.",
    category: "Editorial content",
    reference: { label: "Editorial policy", href: "/editorial-policy" },
  },
  {
    date: "2026-08-25",
    title: "Child Benefit rates corrected for 2026/27",
    summary:
      "The Child Benefit figures used by the High Income Child Benefit Charge calculator were updated to the 2026/27 statutory rates, and benchmark cases were regenerated from independently derived expected values.",
    category: "Statutory correction",
    affectedCalculators: ["TAX-019"],
  },
  {
    date: "2026-08-25",
    title: "Dividend tax rates corrected for 2026/27",
    summary:
      "Dividend rates applied by the general investment account tax calculator were updated to the 2026/27 statutory rates, with regression cases added to catch any future drift.",
    category: "Statutory correction",
    affectedCalculators: ["TAX-013"],
  },
  {
    date: "2026-08-25",
    title: "Search engine discoverability and site structure rebuilt",
    summary:
      "Every calculator and category page now carries a unique title, description and canonical URL, with breadcrumb navigation and structured data describing the tool. Sitemap entries were corrected to use the public calculator addresses rather than internal identifiers.",
    category: "Discoverability",
  },
  {
    date: "2026-08-25",
    title: "Clearer results, disclaimers and input labelling",
    summary:
      "Calculator inputs, option labels and result presentation were reworked for clarity, and each calculator now carries a disclaimer matched to its subject area rather than a single generic notice.",
    category: "Trust and transparency",
  },
  {
    date: "2026-08-25",
    title: "Platform expanded to 253 calculators across 19 categories",
    summary:
      "The third and final build wave brought the platform to its full published range, spanning UK tax and salary, mortgages and property, pensions, investing, business, health, conversions, maths and everyday tools.",
    category: "New calculators",
  },
  {
    date: "2026-08-23",
    title: "Finance, mortgage, property and investment calculators added",
    summary:
      "The second build wave added debt, mortgage, property and wealth calculators, each with its own reference benchmark cases checked against independently derived expected values.",
    category: "New calculators",
  },
];

/** Distinct update categories present in the record, in first-seen order. */
export function updateCategories(): string[] {
  return Array.from(new Set(PLATFORM_UPDATES.map((u) => u.category)));
}

/** The most recent update date, used to date the public page. */
export function latestUpdateDate(): string {
  return PLATFORM_UPDATES.map((u) => u.date).sort().slice(-1)[0];
}
