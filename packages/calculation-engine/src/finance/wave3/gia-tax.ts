export interface GiaTaxInputs {
  annual_dividends?: number;
  realised_capital_gains?: number;
  interest_income?: number;
  other_taxable_income?: number;
  capital_losses_brought_forward?: number;
}

/**
 * The slice of the versioned UK ruleset this calculator reads.
 *
 * Declared structurally rather than importing the full ruleset type, because
 * the ruleset is a versioned JSON document validated at load time - the same
 * approach the Wave 1 and Wave 2 tax handlers take.
 */
export interface UKRulesetLike {
  dividends: {
    allowance_gbp: number;
    rates: { basic: number; higher: number; additional: number };
  };
}

export interface GiaTaxResult {
  taxpayer_band: "basic" | "higher" | "additional";
  dividend_tax_due: number;
  capital_gains_tax_due: number;
  interest_tax_due: number;
  total_gia_tax_due: number;
  effective_tax_rate_on_investments_pct: number;
  total_allowances_utilised: number;
  net_investment_income_after_tax: number;
}

/**
 * Tax on an unwrapped general investment account.
 *
 * The dividend allowance and the dividend rates are read from the versioned UK
 * ruleset rather than hardcoded here. They were previously hardcoded at 8.75%
 * and 33.75%, which were the rates before 2026/27, so this calculator quietly
 * disagreed with both the approved ruleset and TAX-011 on identical facts.
 * Reading the statutory figures from the one place that owns them is what stops
 * that happening again, rather than correcting two more constants in place.
 */
export function calculateGiaTax(inputs: GiaTaxInputs, rules: UKRulesetLike): GiaTaxResult {
  const dividends = Math.max(0, Number(inputs.annual_dividends ?? 0));
  const capitalGains = Math.max(0, Number(inputs.realised_capital_gains ?? 0));
  const interest = Math.max(0, Number(inputs.interest_income ?? 0));
  const otherIncome = Math.max(0, Number(inputs.other_taxable_income ?? 0));
  const losses = Math.max(0, Number(inputs.capital_losses_brought_forward ?? 0));

  // Determine income tax band for 2026/27
  let band: "basic" | "higher" | "additional" = "basic";
  if (otherIncome > 125140) {
    band = "additional";
  } else if (otherIncome > 50270) {
    band = "higher";
  }

  // 1. Dividend Tax. The allowance and the rates come from the ruleset, which
  // is the single place the statutory dividend figures are defined.
  const dividendAllowance = rules.dividends.allowance_gbp;
  const divAllowanceUsed = Math.min(dividends, dividendAllowance);
  const taxableDividends = Math.max(0, dividends - divAllowanceUsed);

  const divTaxRate =
    band === "additional"
      ? rules.dividends.rates.additional
      : band === "higher"
        ? rules.dividends.rates.higher
        : rules.dividends.rates.basic;

  const dividendTaxDue = taxableDividends * divTaxRate;

  // 2. Capital Gains Tax (AEA = £3,000)
  const netGainsAfterLosses = Math.max(0, capitalGains - losses);
  const cgtAllowance = 3000;
  const cgtAllowanceUsed = Math.min(netGainsAfterLosses, cgtAllowance);
  const taxableGains = Math.max(0, netGainsAfterLosses - cgtAllowanceUsed);

  let cgtRate = 0.18; // basic
  if (band === "higher" || band === "additional") cgtRate = 0.24;

  const capitalGainsTaxDue = taxableGains * cgtRate;

  // 3. Personal Savings Allowance (PSA) for interest
  let psaLimit = 1000;
  let interestTaxRate = 0.20;
  if (band === "higher") {
    psaLimit = 500;
    interestTaxRate = 0.40;
  } else if (band === "additional") {
    psaLimit = 0;
    interestTaxRate = 0.45;
  }

  const psaUsed = Math.min(interest, psaLimit);
  const taxableInterest = Math.max(0, interest - psaUsed);
  const interestTaxDue = taxableInterest * interestTaxRate;

  const totalGiaTax = dividendTaxDue + capitalGainsTaxDue + interestTaxDue;
  const totalInvestmentGross = dividends + capitalGains + interest;
  const effectiveRate = totalInvestmentGross > 0 ? (totalGiaTax / totalInvestmentGross) * 100 : 0;
  const totalAllowances = divAllowanceUsed + cgtAllowanceUsed + psaUsed;
  const netIncome = totalInvestmentGross - totalGiaTax;

  return {
    taxpayer_band: band,
    dividend_tax_due: Math.round(dividendTaxDue * 100) / 100,
    capital_gains_tax_due: Math.round(capitalGainsTaxDue * 100) / 100,
    interest_tax_due: Math.round(interestTaxDue * 100) / 100,
    total_gia_tax_due: Math.round(totalGiaTax * 100) / 100,
    effective_tax_rate_on_investments_pct: Math.round(effectiveRate * 100) / 100,
    total_allowances_utilised: Math.round(totalAllowances * 100) / 100,
    net_investment_income_after_tax: Math.round(netIncome * 100) / 100
  };
}
