/**
 * Central output formatting registry.
 *
 * One place decides how every calculator result is presented, so no calculator
 * grows its own ad-hoc formatting. Pure data and pure functions - no React - so
 * the E2E parity harness can import the same rules it needs to invert when
 * reading a rendered value back into a number.
 *
 * Classification is per calculator AND per key, never by key name alone,
 * because the same name means different things in different calculators:
 * `margin` is a ratio in BUS-001 but an absolute confidence-interval width in
 * STA-006, and `rate` is a percentage in TAX-015 but an FX multiplier in
 * CON-010.
 */

export type OutputFormat =
  /** £ with comma grouping and 2 decimal places. */
  | "currency"
  /** A decimal fraction shown as a percentage: 0.917 -> 91.7%. */
  | "percent"
  /** Already expressed in percentage units: 25 -> 25%. */
  | "percentValue"
  /** A whole count: months, units, sample size. */
  | "count"
  /** A plain number that is neither money nor a percentage. */
  | "number"
  /** A ratio conventionally read as a multiple, e.g. ICR 1.5009. */
  | "ratio";

/**
 * Decimal fractions that should be shown to people as percentages.
 * Key: calculator id. Value: output keys.
 */
const PERCENT_OUTPUTS: Record<string, string[]> = {
  "BUS-001": ["margin", "markup"],
  "BUS-008": ["discount_rate"],
  "FIN-006": ["effective_apr"],
  "FIN-013": ["savings_rate"],
  "INV-002": ["effective_annual_rate"],
  "INV-008": ["roi"],
  "INV-009": ["cagr"],
  "INV-011": ["irr"],
  "INV-015": ["real_return"],
  "ISA-001": ["allowance_used"],
  "PEN-006": ["funding_ratio"],
  "PRO-001": ["ltv"],
  "PRO-010": ["ltv"],
  "PRO-011": ["ltv"],
  "PRO-016": ["gross_yield", "net_yield"],
  "PRO-018": ["gross_yield", "net_yield"],
  "PRO-023": ["effective_rate"],
  "PRO-019": ["annualised_return", "total_return"],
  // --- Wave 2 ---
  "FIN-004": ["combined_ltv"],
  "FIN-008": ["dti_ratio", "front_end_ratio"]
};

/** Values already carried in percentage units. */
const PERCENT_VALUE_OUTPUTS: Record<string, string[]> = {
  "MAT-003": ["result_percent"]
};

/** Ratios read as a multiple rather than a percentage. */
const RATIO_OUTPUTS: Record<string, string[]> = {
  "PRO-018": ["icr"]
};

/** Whole counts. */
const COUNT_OUTPUTS: Record<string, string[]> = {
  "BUS-006": ["break_even_units"],
  "DAT-001": ["years", "months", "days", "total_days"],
  "FIN-009": ["months"],
  "FIN-011": ["months"],
  "PRO-004": ["payoff_months", "months_saved"],
  "STA-008": ["n"],
  // --- Wave 2 ---
  "FIN-007": ["payoff_months"],
  "FIN-010": ["months"],
  "FIN-012": ["current_payoff_months"],
  "FIN-014": ["months_to_target"]
};

/**
 * Numeric outputs inside otherwise money-oriented calculators that are NOT
 * money - working assumptions, physical quantities and the like.
 */
const NON_MONEY_OUTPUTS: Record<string, string[]> = {
  "AUT-006": ["litres"],
  "CON-010": ["converted"],
  "TAX-002": ["hours_per_week_used", "paid_weeks_per_year_used"],
  "TAX-003": ["hours_per_week_used", "paid_weeks_per_year_used"],
  // --- Wave 2 ---
  "FIN-014": ["months_covered_now"]
};

/**
 * Calculator families whose unclassified numeric outputs are money.
 * Everything else defaults to a plain number.
 */
const MONEY_PREFIXES = ["FIN-", "PRO-", "TAX-", "INV-", "ISA-", "PEN-", "BUS-", "AUT-"];

function listed(map: Record<string, string[]>, calculatorId: string, key: string): boolean {
  return (map[calculatorId] ?? []).includes(key);
}

export function classifyOutput(calculatorId: string, key: string): OutputFormat {
  if (listed(PERCENT_OUTPUTS, calculatorId, key)) return "percent";
  if (listed(PERCENT_VALUE_OUTPUTS, calculatorId, key)) return "percentValue";
  if (listed(RATIO_OUTPUTS, calculatorId, key)) return "ratio";
  if (listed(COUNT_OUTPUTS, calculatorId, key)) return "count";
  if (listed(NON_MONEY_OUTPUTS, calculatorId, key)) return "number";
  if (MONEY_PREFIXES.some(p => calculatorId.startsWith(p))) return "currency";
  return "number";
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const plain = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 8 });
const twoDp = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const integer = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});
const ratioFmt = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
});

/**
 * Format one output value for display.
 *
 * Non-finite numbers never reach the screen as "NaN" or "Infinity"; they are
 * rendered as an em dash, because a broken number is not a result.
 */
export function formatOutputValue(calculatorId: string, key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value !== "number") {
    const text = String(value);
    return text === "[object Object]" ? "—" : text;
  }
  if (!Number.isFinite(value)) return "—";

  switch (classifyOutput(calculatorId, key)) {
    case "currency":
      return gbp.format(value);
    case "percent":
      // Round the scaled value so 0.917 reads 91.7%, not 91.70000000000001%.
      return `${pct.format(Math.round(value * 100 * 1e6) / 1e6)}%`;
    case "percentValue":
      return `${pct.format(value)}%`;
    case "count":
      return integer.format(value);
    case "ratio":
      return ratioFmt.format(value);
    case "number":
      return key === "converted" ? twoDp.format(value) : plain.format(value);
  }
}

/**
 * Invert the display transform to recover the engine-domain number from a
 * rendered string. Used by the E2E parity harness so it compares like with
 * like instead of re-implementing the formatting rules.
 */
export function parseDisplayedValue(
  calculatorId: string,
  key: string,
  text: string
): number {
  const negative = text.includes("-") || (text.includes("(") && text.includes(")"));
  const digits = text.replace(/[^0-9.]/g, "");
  let n = parseFloat(digits);
  if (negative) n = -n;
  return classifyOutput(calculatorId, key) === "percent" ? n / 100 : n;
}
