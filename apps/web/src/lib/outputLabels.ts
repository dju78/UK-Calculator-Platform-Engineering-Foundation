/**
 * Shared Deterministic Result Label Formatter & Acronym Dictionary
 *
 * Ensures all user-visible calculation output labels are human-readable,
 * cleanly titleized, and correctly format acronyms and unit suffixes without
 * modifying raw engine keys or leaking snake_case.
 */

/**
 * Controlled acronym dictionary derived from actual calculation output keys.
 */
export const CONTROLLED_ACRONYMS = new Set([
  "APR",
  "APRC",
  "BMI",
  "BMR",
  "CAGR",
  "CGT",
  "DF",
  "EPC",
  "EV",
  "FV",
  "GBP",
  "GIA",
  "GPA",
  "HICBC",
  "HP",
  "ICR",
  "IP",
  "IRR",
  "ISA",
  "KWH",
  "LBTT",
  "LISA",
  "LTT",
  "LTV",
  "MPG",
  "NI",
  "NIC",
  "NPV",
  "PAYE",
  "PCLS",
  "PRR",
  "PV",
  "ROI",
  "RPM",
  "SD",
  "SDLT",
  "SE",
  "SIPP",
  "TDEE",
  "URL",
  "VAT",
  "XIRR"
]);

/**
 * Special token replacements for units, abbreviations, and financial terms.
 */
const TOKEN_REPLACEMENTS: Record<string, string> = {
  gbp: "(£)",
  pct: "(%)",
  kg: "(kg)",
  cm: "(cm)",
  cm2: "(cm²)",
  cm3: "(cm³)",
  mm: "(mm)",
  mm2: "(mm²)",
  mm3: "(mm³)",
  m: "(m)",
  m2: "(m²)",
  m3: "(m³)",
  km: "(km)",
  mph: "(mph)",
  kmh: "(km/h)",
  kw: "(kW)",
  kwh: "(kWh)",
  litres: "(Litres)",
  ohms: "(Ω)",
  hpa: "(hPa)",
  ppm: "(ppm)",
  sec: "(sec)",
  min: "(min)",
  approx: "(Approx)",
  dp: "DP",
  sd: "SD",
  se: "SE"
};

/**
 * Known custom whole-key presentation overrides for clarity.
 */
const KEY_OVERRIDES: Record<string, string> = {
  sdlt: "SDLT (Stamp Duty)",
  ltv: "Loan-to-Value (LTV)",
  cgt: "Capital Gains Tax (CGT)",
  vat: "VAT",
  vat_amount: "VAT Amount",
  cost_gbp: "Cost (£)",
  profit_margin: "Profit Margin",
  gross_margin: "Gross Margin",
  net_margin: "Net Margin",
  future_value: "Future Value",
  present_value: "Present Value",
  interest_earned: "Interest Earned",
  effective_apr: "Effective APR",
  hicbc_tax_charge: "HICBC Tax Charge",
  prr_relief_amount: "Private Residence Relief (PRR)",
  ni: "National Insurance",
  ni_yearly: "National Insurance (Yearly)",
  ni_monthly: "National Insurance (Monthly)",
  ni_weekly: "National Insurance (Weekly)",
  tax_yearly: "Income Tax (Yearly)",
  tax_monthly: "Income Tax (Monthly)",
  tax_weekly: "Income Tax (Weekly)",
  net_yearly: "Take-Home Pay (Yearly)",
  net_monthly: "Take-Home Pay (Monthly)",
  net_weekly: "Take-Home Pay (Weekly)"
};

/**
 * Formats a raw snake_case or camelCase output key into a human-readable label.
 */
export function formatOutputLabel(key: string): string {
  if (!key || typeof key !== "string") return "";

  const trimmed = key.trim();
  const lowerKey = trimmed.toLowerCase();

  // 1. Direct whole-key override if defined
  if (KEY_OVERRIDES[lowerKey]) {
    return KEY_OVERRIDES[lowerKey];
  }

  // 2. Split by underscores and camelCase transitions
  const tokens = trimmed
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .split("_")
    .filter(Boolean);

  const formattedTokens = tokens.map((tok, idx) => {
    const lower = tok.toLowerCase();

    // Check token replacements (units, etc.)
    if (TOKEN_REPLACEMENTS[lower]) {
      return TOKEN_REPLACEMENTS[lower];
    }

    // Check controlled acronyms
    const upper = tok.toUpperCase();
    if (CONTROLLED_ACRONYMS.has(upper)) {
      return upper;
    }

    // Numbers: e.g. "1", "2dp" -> "1", "2 DP"
    if (/^\d+$/.test(tok)) {
      return tok;
    }
    if (/^\d+dp$/i.test(tok)) {
      return `${tok.slice(0, -2)} DP`;
    }

    // Standard titleized word
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return formattedTokens.join(" ");
}
