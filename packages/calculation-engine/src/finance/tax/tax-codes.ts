/**
 * PAYE tax-code interpretation layer.
 *
 * Tax-code semantics live here and in the versioned ruleset - never in React
 * components. A component's only job is to pass the code string through.
 *
 * What this layer deliberately does NOT do:
 *
 *  - K codes. A K code represents a NEGATIVE allowance (benefits or underpaid
 *    tax exceeding the personal allowance) and carries a statutory 50% regulatory
 *    limit on the deduction per pay period. Modelling that honestly needs
 *    pay-period and year-to-date PAYE context this annual estimator does not
 *    have, so K codes are reported as unsupported rather than approximated.
 *
 *  - W1 / M1 / X (non-cumulative "emergency") markers. These change PAYE from a
 *    cumulative to a period-by-period basis, which again needs YTD context. We
 *    report them as unsupported and NEVER silently strip the marker and treat
 *    the code as cumulative.
 */

export type TaxJurisdiction = "england_wales_ni" | "scotland";

export interface TaxCodeResolution {
  /** The code as entered, upper-cased and trimmed. */
  code: string;
  supported: boolean;
  /** Present only when supported === false. */
  reason?: string;
  /** Annual tax-free allowance implied by the code. */
  allowance: number;
  /** When true the personal-allowance taper does not apply (code fixes the allowance). */
  fixedAllowance: boolean;
  /** When set, ALL taxable pay is charged at this single flat rate. */
  flatRate?: number;
  /** When true no income tax at all is due (NT). */
  noTax: boolean;
  /** Which jurisdiction's bands the code selects, if the code carries a prefix. */
  jurisdictionFromCode?: TaxJurisdiction;
  /** Short plain-English explanation for display. */
  explanation: string;
}

const UNSUPPORTED_ANNUAL_ESTIMATE =
  "This tax code is not yet supported by this annual estimate calculator.";

function unsupported(code: string, reason: string): TaxCodeResolution {
  return {
    code,
    supported: false,
    reason,
    allowance: 0,
    fixedAllowance: true,
    noTax: false,
    explanation: reason
  };
}

/**
 * Resolve a tax code against the versioned ruleset.
 *
 * `rules` must be a resolved UK ruleset; flat-rate codes are resolved by
 * indexing into that ruleset's own band table, so statutory rates are never
 * duplicated here.
 */
export function resolveTaxCode(
  rawCode: string | undefined | null,
  jurisdiction: TaxJurisdiction,
  rules: any
): TaxCodeResolution {
  const code = String(rawCode ?? "").trim().toUpperCase().replace(/\s+/g, "");

  if (!code) {
    throw new Error("A tax code is required.");
  }

  const codeRules = rules.tax_codes;
  if (!codeRules) {
    throw new Error("The active ruleset does not define tax-code semantics.");
  }

  // --- Non-cumulative / emergency markers -------------------------------
  // Detect BEFORE anything else so the marker can never be silently stripped.
  if (/(W1|M1|X)$/.test(code) && !/^(BR|D0|D1|D2|D3|NT|0T)$/.test(code)) {
    if (/\d/.test(code) || /^(S|C)?(BR|D[0-3]|0T)/.test(code)) {
      return unsupported(
        code,
        `${UNSUPPORTED_ANNUAL_ESTIMATE} Week 1/Month 1 (non-cumulative) codes need year-to-date payroll context.`
      );
    }
  }

  // --- Jurisdiction prefix ----------------------------------------------
  let jurisdictionFromCode: TaxJurisdiction | undefined;
  let body = code;
  if (body.startsWith("S")) {
    jurisdictionFromCode = "scotland";
    body = body.slice(1);
  } else if (body.startsWith("C")) {
    jurisdictionFromCode = "england_wales_ni"; // Welsh rates currently mirror England/NI
    body = body.slice(1);
  }

  const effectiveJurisdiction = jurisdictionFromCode ?? jurisdiction;

  // --- No-tax code -------------------------------------------------------
  if (body === "NT") {
    return {
      code,
      supported: true,
      allowance: 0,
      fixedAllowance: true,
      noTax: true,
      jurisdictionFromCode,
      explanation: codeRules.explanations?.NT ?? "No Income Tax is deducted."
    };
  }

  // --- K codes -----------------------------------------------------------
  if (body.startsWith("K")) {
    return unsupported(
      code,
      `${UNSUPPORTED_ANNUAL_ESTIMATE} K codes apply a negative allowance and a regulatory limit that need payroll-period context.`
    );
  }

  // --- Flat-rate codes (BR / D0 / D1 / SD0..SD3) -------------------------
  const flatTable = codeRules.flat_rate_codes?.[effectiveJurisdiction];
  const prefixedBody = jurisdictionFromCode === "scotland" ? `S${body}` : body;
  const flatEntry = flatTable?.[prefixedBody] ?? flatTable?.[body];
  if (flatEntry) {
    const bands = bandsFor(effectiveJurisdiction, rules);
    const band = bands[flatEntry.band_index];
    if (!band) {
      throw new Error(
        `Ruleset band_index ${flatEntry.band_index} is out of range for tax code ${code}.`
      );
    }
    return {
      code,
      supported: true,
      allowance: 0,
      fixedAllowance: true,
      flatRate: band.rate,
      noTax: false,
      jurisdictionFromCode,
      explanation: codeRules.explanations?.[prefixedBody] ?? codeRules.explanations?.[body] ?? ""
    };
  }

  // --- 0T: no personal allowance, normal bands ---------------------------
  if (body === "0T") {
    return {
      code,
      supported: true,
      allowance: 0,
      fixedAllowance: true,
      noTax: false,
      jurisdictionFromCode,
      explanation: codeRules.explanations?.["0T"] ?? "No Personal Allowance is applied."
    };
  }

  // --- Numeric codes with a suffix letter (1257L, 1100L, 1257M, ...) -----
  const numeric = /^(\d{1,5})([LMNT])$/.exec(body);
  if (numeric) {
    const allowance = Number(numeric[1]) * (codeRules.numeric_code_multiplier ?? 10);
    const isStandard =
      allowance === standardAllowance(effectiveJurisdiction, rules) && numeric[2] === "L";
    return {
      code,
      supported: true,
      allowance,
      // A numeric code states the allowance HMRC has already worked out, so the
      // income-based taper must not be applied again on top of it.
      fixedAllowance: true,
      noTax: false,
      jurisdictionFromCode,
      explanation: isStandard
        ? codeRules.explanations?.["1257L"] ??
          "Standard tax code for most people with one job or pension."
        : `A tax-free allowance of ${formatAllowance(allowance)} is applied for the year.`
    };
  }

  return unsupported(
    code,
    `Tax code "${code}" is not recognised by this annual estimate calculator.`
  );
}

function bandsFor(jurisdiction: TaxJurisdiction, rules: any): Array<{ rate: number }> {
  return jurisdiction === "scotland"
    ? rules.income_tax_scotland.bands_taxable_income_gbp
    : rules.income_tax_england_wales_ni.bands_taxable_income_gbp;
}

function standardAllowance(jurisdiction: TaxJurisdiction, rules: any): number {
  return jurisdiction === "scotland"
    ? rules.income_tax_scotland.personal_allowance_gbp
    : rules.income_tax_england_wales_ni.personal_allowance_gbp;
}

function formatAllowance(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

/** Map a user-facing jurisdiction label onto the ruleset's jurisdiction key. */
export function jurisdictionKey(label: unknown): TaxJurisdiction {
  return String(label ?? "").trim().toLowerCase() === "scotland"
    ? "scotland"
    : "england_wales_ni";
}

/** The default tax code for a jurisdiction, taken from the ruleset. */
export function defaultTaxCode(jurisdictionLabel: unknown, rules: any): string {
  const label = String(jurisdictionLabel ?? "").trim().toLowerCase();
  const defaults = rules.tax_codes?.default_codes ?? {};
  if (label === "scotland") return defaults.scotland ?? "S1257L";
  if (label === "wales") return defaults.wales ?? "C1257L";
  return defaults.england_wales_ni ?? "1257L";
}
