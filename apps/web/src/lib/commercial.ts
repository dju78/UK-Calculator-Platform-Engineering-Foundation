/**
 * Commercial & Monetisation Safeguards
 */

export const EXCLUDED_AD_CATEGORIES = new Set([
  "health & fitness",
  "health information",
  "pregnancy & fertility",
  "debt & insolvency",
]);

export const EXCLUDED_AD_SLUGS = new Set([
  "bmi-calculator",
  "body-fat-percentage-calculator",
  "calorie-deficit-calculator",
  "pregnancy-due-date-calculator",
  "debt-payoff-calculator",
  "credit-card-payoff-calculator",
]);

export function isAdSlotAllowed(category?: string, slug?: string): boolean {
  if (category && EXCLUDED_AD_CATEGORIES.has(category.toLowerCase().trim())) {
    return false;
  }
  if (slug && EXCLUDED_AD_SLUGS.has(slug.toLowerCase().trim())) {
    return false;
  }
  return true;
}
