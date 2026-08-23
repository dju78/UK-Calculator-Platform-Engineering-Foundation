/**
 * Shared input bounds for the calculation engine.
 *
 * Purpose is twofold:
 *
 *  1. Correctness - a calculation on a nonsensical input is not a result, so
 *     we throw a plain-English Error that the UI renders as an accessible
 *     validation message rather than returning NaN or Infinity.
 *
 *  2. Availability - several calculators iterate month by month over a
 *     user-supplied term. Without an upper bound, a term of 1e10 years asks
 *     for 120 billion iterations and locks the browser tab. Bounds are set
 *     generously so every legitimate scenario still calculates: a 150-year
 *     term and £1 trillion amounts are far beyond any real use, while a
 *     £10m+ mortgage or portfolio works normally.
 */

/** Longest term any calculator will model, in years. */
export const MAX_TERM_YEARS = 150;
/** Largest monetary magnitude accepted, in pounds. */
export const MAX_MONEY = 1e12;

export function assertFiniteNumber(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a valid number.`);
  }
  return n;
}

/**
 * Validate a term expressed in years and return the equivalent whole months.
 * Rejects negative and implausibly long terms.
 */
export function assertTermYears(value: unknown, label = "Term"): number {
  const years = assertFiniteNumber(value, label);
  if (years < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  if (years > MAX_TERM_YEARS) {
    throw new Error(`${label} cannot be longer than ${MAX_TERM_YEARS} years.`);
  }
  return years;
}

/** Validate a monetary amount, optionally allowing negatives. */
export function assertMoney(
  value: unknown,
  label: string,
  options: { allowNegative?: boolean } = {}
): number {
  const amount = assertFiniteNumber(value, label);
  if (!options.allowNegative && amount < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  if (Math.abs(amount) > MAX_MONEY) {
    throw new Error(`${label} is larger than this calculator supports.`);
  }
  return amount;
}
