/**
 * Wave 2 ISA and tax-wrapper calculators.
 *
 * Every statutory figure used here is read from the versioned UK Rules Engine
 * and passed in by the handler. Nothing in this module hard-codes an
 * allowance, a limit or a rate, so a new tax year is a ruleset change rather
 * than a code change.
 *
 * Percentages arrive as human percentages (5 means 5%) and are normalised
 * exactly once, at the top of each function.
 */
import { assertMoney, assertTermYears, assertFiniteNumber } from "../../common/validation.js";

export type IncomeTaxBand = "basic" | "higher" | "additional";

export function normaliseBand(value: unknown): IncomeTaxBand {
  const raw = String(value ?? "basic").toLowerCase().trim();
  if (raw.startsWith("high")) return "higher";
  if (raw.startsWith("add")) return "additional";
  return "basic";
}

/**
 * Derive the income tax band from non-savings income rather than asking the
 * user to self-classify, which they frequently get wrong at the boundaries.
 */
export function bandFromIncome(otherIncome: number, rules: any): IncomeTaxBand {
  const it = rules.income_tax_england_wales_ni;
  const bands = it.bands_taxable_income_gbp;
  const basicTop = bands[0].to + it.personal_allowance_gbp; // 37,700 + 12,570
  const higherTop = it.personal_allowance_zero_at_adjusted_net_income_gbp; // 125,140
  if (otherIncome > higherTop) return "additional";
  if (otherIncome > basicTop) return "higher";
  return "basic";
}

// ---------------------------------------------------------------------------
// ISA-003 ISA vs General Investment Account
// ---------------------------------------------------------------------------

export interface IsaVsGiaResult {
  final_gross_value: number;
  total_contributions: number;
  total_dividends: number;
  cost_basis: number;
  capital_gain: number;
  isa_net_proceeds: number;
  gia_dividend_tax: number;
  gia_capital_gains_tax: number;
  gia_net_proceeds: number;
  isa_advantage: number;
  isa_advantage_percentage: number;
  years_dividend_allowance_exceeded: number;
  annual_subscription_exceeded: boolean;
}

/**
 * Compare the same portfolio held inside an ISA and inside a taxable general
 * investment account.
 *
 * MODEL BOUNDARY. The portfolio itself is identical in both wrappers; the
 * difference is tax. Dividend tax in the GIA is assumed to be settled from
 * money outside the portfolio (which is how most people actually pay it,
 * through PAYE or Self Assessment), so it is reported as a cost rather than
 * being sold out of the holding. Selling units to pay it would itself be a
 * disposal and would create a second capital gains event, which this
 * calculator deliberately does not model. The whole gain is assumed to be
 * realised in a single tax year at the end of the term.
 */
export function isaVsGia(
  initialInvestment: number,
  monthlyContribution: number,
  annualGrowthPct: number,
  dividendYieldPct: number,
  years: number,
  otherIncome: number,
  rules: any
): IsaVsGiaResult {
  const initial = assertMoney(initialInvestment, "Initial investment");
  const monthly = assertMoney(monthlyContribution, "Monthly contribution");
  const growth = assertFiniteNumber(annualGrowthPct, "Annual growth") / 100;
  const divYield = assertFiniteNumber(dividendYieldPct, "Dividend yield") / 100;
  const term = assertTermYears(years, "Term");
  const income = assertMoney(otherIncome, "Other income");

  const band = bandFromIncome(income, rules);
  const divAllowance = rules.dividends.allowance_gbp;
  const divRate = rules.dividends.rates[band];
  const aea = rules.capital_gains.annual_exempt_amount_gbp;
  const cgtRates = rules.capital_gains.standard_rates;
  const isaLimit = rules.isa.overall_subscription_limit_gbp;

  const monthlyGrowth = Math.pow(1 + growth, 1 / 12) - 1;
  const wholeMonths = Math.round(term * 12);

  let value = initial;
  let basis = initial;
  let contributions = initial;
  let dividendsTotal = 0;
  let dividendTax = 0;
  let yearDividends = 0;
  let yearsAllowanceExceeded = 0;

  for (let m = 1; m <= wholeMonths; m++) {
    value *= 1 + monthlyGrowth;

    // Dividends are declared on the value held, then reinvested. Reinvested
    // dividends are a fresh acquisition, so they raise the cost basis - which
    // is exactly why a GIA is not taxed twice on the same money.
    const dividend = value * (divYield / 12);
    dividendsTotal += dividend;
    yearDividends += dividend;
    value += dividend;
    basis += dividend;

    value += monthly;
    basis += monthly;
    contributions += monthly;

    if (m % 12 === 0) {
      const taxable = Math.max(0, yearDividends - divAllowance);
      if (taxable > 0) yearsAllowanceExceeded++;
      dividendTax += taxable * divRate;
      yearDividends = 0;
    }
  }
  // A part year at the end is still a tax year for the dividend allowance.
  if (yearDividends > 0) {
    const taxable = Math.max(0, yearDividends - divAllowance);
    if (taxable > 0) yearsAllowanceExceeded++;
    dividendTax += taxable * divRate;
  }

  const gain = Math.max(0, value - basis);
  const taxableGain = Math.max(0, gain - aea);

  // The gain sits on top of income for banding, using UK-wide bands: capital
  // gains are not devolved, so Scottish income tax bands do not apply.
  const it = rules.income_tax_england_wales_ni;
  const taxableIncome = Math.max(0, income - it.personal_allowance_gbp);
  const basicBandRemaining = Math.max(0, it.bands_taxable_income_gbp[0].to - taxableIncome);
  const atBasic = Math.min(taxableGain, basicBandRemaining);
  const atHigher = taxableGain - atBasic;
  const cgt = atBasic * cgtRates.basic_band + atHigher * cgtRates.higher_band;

  const isaNet = value;
  const giaNet = value - cgt;
  const advantage = cgt + dividendTax;

  return {
    final_gross_value: value,
    total_contributions: contributions,
    total_dividends: dividendsTotal,
    cost_basis: basis,
    capital_gain: gain,
    isa_net_proceeds: isaNet,
    gia_dividend_tax: dividendTax,
    gia_capital_gains_tax: cgt,
    gia_net_proceeds: giaNet,
    isa_advantage: advantage,
    isa_advantage_percentage: isaNet > 0 ? advantage / isaNet : 0,
    years_dividend_allowance_exceeded: yearsAllowanceExceeded,
    annual_subscription_exceeded: initial + monthly * 12 > isaLimit
  };
}

// ---------------------------------------------------------------------------
// ISA-004 Lifetime ISA
// ---------------------------------------------------------------------------

export interface LifetimeIsaResult {
  total_contributions: number;
  total_bonus: number;
  bonus_forgone_by_exceeding_limit: number;
  final_value: number;
  investment_growth: number;
  withdrawal_charge: number;
  net_withdrawal: number;
  own_money_lost_to_charge: number;
  charge_applies: boolean;
  annual_contribution_capped: boolean;
  property_price_within_cap: boolean | null;
}

/**
 * Lifetime ISA projection, including the effect of the withdrawal charge.
 *
 * The withdrawal charge is 25% of the amount withdrawn, not 25% of the bonus.
 * Because the bonus was 25% of the contribution, a 25% charge on the larger
 * post-bonus balance recovers the whole bonus AND takes a further 6.25% of the
 * saver's own money. That is the single most misunderstood feature of the
 * product, so it is surfaced as its own output rather than buried.
 */
export function lifetimeIsa(
  currentBalance: number,
  annualContribution: number,
  annualGrowthPct: number,
  years: number,
  withdrawalPurpose: string,
  propertyPrice: number | null,
  rules: any
): LifetimeIsaResult {
  const opening = assertMoney(currentBalance, "Current balance");
  const requested = assertMoney(annualContribution, "Annual contribution");
  const growth = assertFiniteNumber(annualGrowthPct, "Annual growth") / 100;
  const term = assertTermYears(years, "Years");

  const limit = rules.isa.lifetime_isa_subscription_limit_gbp;
  const bonusRate = rules.isa.lifetime_isa_bonus_rate;
  const maxBonus = rules.isa.lifetime_isa_maximum_bonus_gbp;
  const chargeRate = rules.isa.lifetime_isa_withdrawal_charge_rate;
  const priceCap = rules.isa.lifetime_isa_maximum_property_price_gbp;

  const allowed = Math.min(requested, limit);
  const wholeYears = Math.round(term);

  let value = opening;
  let contributions = 0;
  let bonusTotal = 0;

  for (let y = 1; y <= wholeYears; y++) {
    value += allowed;
    contributions += allowed;
    const bonus = Math.min(allowed * bonusRate, maxBonus);
    value += bonus;
    bonusTotal += bonus;
    value *= 1 + growth;
  }

  const purpose = String(withdrawalPurpose ?? "first_home").toLowerCase().trim();
  const chargeFree = purpose === "first_home" || purpose === "age_60" || purpose === "terminal_illness";
  const price = propertyPrice === null || propertyPrice === undefined || propertyPrice === 0
    ? null
    : assertMoney(propertyPrice, "Property price");
  const withinCap = purpose === "first_home" && price !== null ? price <= priceCap : null;

  // A first-home withdrawal above the property price cap is NOT charge free.
  const chargeApplies = !chargeFree || withinCap === false;
  const charge = chargeApplies ? value * chargeRate : 0;
  const net = value - charge;

  // What the saver loses beyond the bonus being clawed back.
  const ownMoneyLost = Math.max(0, charge - bonusTotal);

  const forgone = requested > limit ? Math.min((requested - limit) * bonusRate, Math.max(0, maxBonus - allowed * bonusRate)) * wholeYears : 0;

  return {
    total_contributions: contributions,
    total_bonus: bonusTotal,
    bonus_forgone_by_exceeding_limit: forgone,
    final_value: value,
    investment_growth: value - opening - contributions - bonusTotal,
    withdrawal_charge: charge,
    net_withdrawal: net,
    own_money_lost_to_charge: ownMoneyLost,
    charge_applies: chargeApplies,
    annual_contribution_capped: requested > limit,
    property_price_within_cap: withinCap
  };
}

// ---------------------------------------------------------------------------
// ISA-005 Junior ISA
// ---------------------------------------------------------------------------

export interface JuniorIsaResult {
  years_to_maturity: number;
  total_contributions: number;
  final_value: number;
  investment_growth: number;
  annual_contribution_capped: boolean;
  monthly_equivalent: number;
}

export function juniorIsa(
  currentBalance: number,
  annualContribution: number,
  annualGrowthPct: number,
  childAge: number,
  rules: any
): JuniorIsaResult {
  const opening = assertMoney(currentBalance, "Current balance");
  const requested = assertMoney(annualContribution, "Annual contribution");
  const growth = assertFiniteNumber(annualGrowthPct, "Annual growth") / 100;
  const age = assertFiniteNumber(childAge, "Child's age");

  const maturity = rules.isa.junior_isa_maturity_age;
  if (age < 0 || age >= maturity) {
    throw new Error(`Enter the child's current age, from 0 to ${maturity - 1}. A Junior ISA matures at ${maturity}.`);
  }

  const limit = rules.isa.junior_isa_subscription_limit_gbp;
  const allowed = Math.min(requested, limit);
  const yearsLeft = maturity - age;

  let value = opening;
  let contributions = 0;
  for (let y = 1; y <= yearsLeft; y++) {
    value += allowed;
    contributions += allowed;
    value *= 1 + growth;
  }

  return {
    years_to_maturity: yearsLeft,
    total_contributions: contributions,
    final_value: value,
    investment_growth: value - opening - contributions,
    annual_contribution_capped: requested > limit,
    monthly_equivalent: allowed / 12
  };
}

// ---------------------------------------------------------------------------
// ISA-006 Cash ISA
// ---------------------------------------------------------------------------

export interface CashIsaResult {
  isa_final_value: number;
  isa_interest: number;
  taxable_final_value: number;
  taxable_gross_interest: number;
  tax_paid_on_savings: number;
  isa_advantage: number;
  personal_savings_allowance: number;
  starting_rate_band_available: number;
  band: IncomeTaxBand;
  advantage_is_nil: boolean;
  annual_subscription_exceeded: boolean;
}

/**
 * Cash ISA against an ordinary taxable savings account.
 *
 * MODEL BOUNDARY. Tax on the taxable account is deducted from the account
 * each year, which is what makes the drag compound. The Personal Savings
 * Allowance and the starting rate for savings are assumed to be entirely
 * available to this account: if the saver holds other interest-bearing
 * accounts, the real advantage of the ISA will be larger than shown here.
 */
export function cashIsa(
  openingBalance: number,
  monthlyContribution: number,
  annualRatePct: number,
  years: number,
  otherIncome: number,
  rules: any
): CashIsaResult {
  const opening = assertMoney(openingBalance, "Opening balance");
  const monthly = assertMoney(monthlyContribution, "Monthly contribution");
  const rate = assertFiniteNumber(annualRatePct, "Interest rate") / 100;
  const term = assertTermYears(years, "Term");
  const income = assertMoney(otherIncome, "Other income");

  const band = bandFromIncome(income, rules);
  const psa = rules.savings.personal_savings_allowance_gbp[band];
  const it = rules.income_tax_england_wales_ni;
  const startingBand = Math.max(
    0,
    rules.savings.starting_rate_for_savings_band_gbp -
      Math.max(0, income - it.personal_allowance_gbp) *
        rules.savings.starting_rate_reduction_per_gbp_of_other_income
  );

  // Marginal rate on savings interest for this band, read from the ruleset's
  // own band table rather than restated here.
  const marginalRate =
    band === "basic"
      ? it.bands_taxable_income_gbp[0].rate
      : band === "higher"
        ? it.bands_taxable_income_gbp[1].rate
        : it.bands_taxable_income_gbp[2].rate;

  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  const wholeMonths = Math.round(term * 12);

  let isaValue = opening;
  let isaInterest = 0;
  let taxValue = opening;
  let taxGross = 0;
  let taxPaid = 0;
  let yearInterest = 0;

  const settleYear = () => {
    // The starting rate band is used first, then the Personal Savings
    // Allowance; only interest above both is taxed.
    const afterStartingRate = Math.max(0, yearInterest - startingBand);
    const taxable = Math.max(0, afterStartingRate - psa);
    const due = taxable * marginalRate;
    taxPaid += due;
    taxValue -= due;
    yearInterest = 0;
  };

  for (let m = 1; m <= wholeMonths; m++) {
    const iIsa = isaValue * monthlyRate;
    isaValue += iIsa;
    isaInterest += iIsa;
    isaValue += monthly;

    const iTax = taxValue * monthlyRate;
    taxValue += iTax;
    taxGross += iTax;
    yearInterest += iTax;
    taxValue += monthly;

    if (m % 12 === 0) settleYear();
  }
  if (yearInterest > 0) settleYear();

  const isaLimit = rules.isa.overall_subscription_limit_gbp;

  return {
    isa_final_value: isaValue,
    isa_interest: isaInterest,
    taxable_final_value: taxValue,
    taxable_gross_interest: taxGross,
    tax_paid_on_savings: taxPaid,
    isa_advantage: isaValue - taxValue,
    personal_savings_allowance: psa,
    starting_rate_band_available: startingBand,
    band,
    advantage_is_nil: taxPaid === 0,
    annual_subscription_exceeded: monthly * 12 > isaLimit
  };
}
