/**
 * B2B & Embedding Allowlist
 *
 * Only generic, low-risk, non-sensitive calculators with established stability
 * are permitted for iframe embedding. Complex tax/specialist models and sensitive
 * health calculators are excluded from the initial embed pilot.
 */

export const EMBED_ALLOWLIST: readonly string[] = [
  "loan-calculator",
  "personal-loan-calculator",
  "apr-calculator",
  "compound-interest-calculator",
  "percentage-calculator",
  "vat-calculator",
  "unit-conversion-calculator",
  "fuel-cost-calculator",
  "age-calculator",
  "savings-calculator",
] as const;

const allowlistSet = new Set<string>(EMBED_ALLOWLIST);

export function isEmbedAllowed(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  return allowlistSet.has(slug.toLowerCase().trim());
}
