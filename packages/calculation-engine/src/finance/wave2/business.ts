/**
 * Wave 2 Business & Commercial calculators.
 *
 * Percentages arrive as human percentages (5 means 5%) and are normalised
 * exactly once. The only statutory value used anywhere here is the VAT
 * standard rate, which BUS-011 reads from the versioned ruleset rather than
 * assuming.
 */
import { assertMoney, assertTermYears, assertFiniteNumber } from "../../common/validation.js";
import { bracketedRoot } from "./investment.js";

function parseList(value: unknown, label: string): number[] {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(raw)) throw new Error(`${label} must be a list of numbers.`);
  return raw.map((n, i) => assertFiniteNumber(Number(n), `${label} entry ${i + 1}`));
}

// ---------------------------------------------------------------------------
// BUS-002 Markup
// ---------------------------------------------------------------------------

export interface MarkupResult {
  cost: number;
  price: number;
  profit: number;
  markup: number;
  margin: number;
  price_from_markup: number | null;
}

/**
 * Markup and margin are different numbers for the same trade, and confusing
 * them is the single most common pricing error in small businesses: a 50%
 * markup is a 33.3% margin, not a 50% one. Both are always returned together.
 */
export function markupCalculator(
  cost: number,
  price: number | null,
  markupPct: number | null
): MarkupResult {
  const c = assertMoney(cost, "Cost");
  if (c <= 0) throw new Error("Cost must be greater than zero to work out a markup.");

  let p: number;
  let fromMarkup: number | null = null;
  if (price !== null && price !== undefined && !Number.isNaN(price)) {
    p = assertMoney(price, "Price");
  } else if (markupPct !== null && markupPct !== undefined && !Number.isNaN(markupPct)) {
    const m = assertFiniteNumber(markupPct, "Markup") / 100;
    p = c * (1 + m);
    fromMarkup = p;
  } else {
    throw new Error("Enter either a selling price or a markup percentage.");
  }

  const profit = p - c;
  return {
    cost: c,
    price: p,
    profit,
    markup: profit / c,
    // Margin is profit over PRICE; markup is profit over COST.
    margin: p === 0 ? 0 : profit / p,
    price_from_markup: fromMarkup
  };
}

// ---------------------------------------------------------------------------
// BUS-003 / BUS-004 / BUS-005 Profit
// ---------------------------------------------------------------------------

export interface ProfitResult {
  revenue: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin: number;
  markup_on_cost: number;
  operating_expenses: number;
  operating_profit: number;
  operating_margin: number;
  other_income: number;
  interest_and_other_costs: number;
  profit_before_tax: number;
  tax: number;
  net_profit: number;
  net_margin: number;
  breaks_even: boolean;
}

/**
 * One profit computation serving BUS-003, BUS-004 and BUS-005, which differ in
 * how much of the profit and loss account they expose rather than in their
 * arithmetic. Sharing the implementation means the three can never disagree
 * about the same figures.
 */
export function profitStatement(
  revenue: number,
  costOfGoodsSold: number,
  operatingExpenses: number,
  otherIncome: number,
  interestAndOtherCosts: number,
  taxRatePct: number
): ProfitResult {
  const rev = assertMoney(revenue, "Revenue");
  const cogs = assertMoney(costOfGoodsSold, "Cost of goods sold");
  const opex = assertMoney(operatingExpenses, "Operating expenses");
  const other = assertMoney(otherIncome, "Other income");
  const interest = assertMoney(interestAndOtherCosts, "Interest and other costs");
  const taxRate = assertFiniteNumber(taxRatePct, "Tax rate") / 100;
  if (taxRate < 0 || taxRate > 1) throw new Error("The tax rate must be between 0% and 100%.");

  const gross = rev - cogs;
  const operating = gross - opex;
  const pbt = operating + other - interest;
  // Tax is charged on profit, not on a loss.
  const tax = pbt > 0 ? pbt * taxRate : 0;
  const net = pbt - tax;

  return {
    revenue: rev,
    cost_of_goods_sold: cogs,
    gross_profit: gross,
    gross_margin: rev === 0 ? 0 : gross / rev,
    markup_on_cost: cogs === 0 ? 0 : gross / cogs,
    operating_expenses: opex,
    operating_profit: operating,
    operating_margin: rev === 0 ? 0 : operating / rev,
    other_income: other,
    interest_and_other_costs: interest,
    profit_before_tax: pbt,
    tax,
    net_profit: net,
    net_margin: rev === 0 ? 0 : net / rev,
    breaks_even: net >= 0
  };
}

// ---------------------------------------------------------------------------
// BUS-007 Commission
// ---------------------------------------------------------------------------

export interface CommissionResult {
  sales: number;
  threshold: number;
  commissionable_sales: number;
  base_commission: number;
  accelerator_sales: number;
  accelerator_commission: number;
  total_commission: number;
  base_salary: number;
  total_earnings: number;
  effective_commission_rate: number;
  on_target_earnings_met: boolean;
}

/**
 * Commission with a threshold and an optional accelerator tier above target.
 *
 * The threshold matters: commission on sales ABOVE a floor is a materially
 * different number from commission on all sales, and quoting one rate without
 * the floor overstates earnings badly at low volumes.
 */
export function commission(
  sales: number,
  thresholdSales: number,
  commissionRatePct: number,
  targetSales: number,
  acceleratorRatePct: number,
  baseSalary: number
): CommissionResult {
  const s = assertMoney(sales, "Sales");
  const threshold = assertMoney(thresholdSales, "Threshold");
  const rate = assertFiniteNumber(commissionRatePct, "Commission rate") / 100;
  const target = assertMoney(targetSales, "Target");
  const accelRate = assertFiniteNumber(acceleratorRatePct, "Accelerator rate") / 100;
  const base = assertMoney(baseSalary, "Base salary");

  if (rate < 0 || accelRate < 0) throw new Error("Commission rates cannot be negative.");
  if (target > 0 && target < threshold) {
    throw new Error("The accelerator target cannot be below the commission threshold.");
  }

  const commissionable = Math.max(0, s - threshold);
  // The accelerator applies only to sales above target; everything between
  // the threshold and target stays at the base rate.
  const aboveTarget = target > 0 ? Math.max(0, s - target) : 0;
  const atBaseRate = commissionable - aboveTarget;

  const baseCommission = atBaseRate * rate;
  const accelCommission = aboveTarget * accelRate;
  const total = baseCommission + accelCommission;

  return {
    sales: s,
    threshold,
    commissionable_sales: commissionable,
    base_commission: baseCommission,
    accelerator_sales: aboveTarget,
    accelerator_commission: accelCommission,
    total_commission: total,
    base_salary: base,
    total_earnings: base + total,
    effective_commission_rate: s === 0 ? 0 : total / s,
    on_target_earnings_met: target > 0 && s >= target
  };
}

// ---------------------------------------------------------------------------
// BUS-009 Depreciation
// ---------------------------------------------------------------------------

export type DepreciationMethod =
  | "straight_line"
  | "reducing_balance"
  | "sum_of_years_digits"
  | "units_of_production";

export function normaliseDepreciationMethod(value: unknown): DepreciationMethod {
  const raw = String(value ?? "straight_line").toLowerCase().trim();
  if (raw === "reducing_balance" || raw === "declining_balance") return "reducing_balance";
  if (raw === "sum_of_years_digits") return "sum_of_years_digits";
  if (raw === "units_of_production") return "units_of_production";
  return "straight_line";
}

export interface DepreciationRow {
  year: number;
  opening_value: number;
  depreciation: number;
  accumulated: number;
  closing_value: number;
}

export interface DepreciationResult {
  method: DepreciationMethod;
  depreciable_amount: number;
  first_year_depreciation: number;
  final_year_depreciation: number;
  total_depreciation: number;
  average_annual_depreciation: number;
  closing_book_value: number;
  schedule: DepreciationRow[];
}

export function depreciation(
  cost: number,
  residualValue: number,
  usefulLifeYears: number,
  method: DepreciationMethod,
  reducingBalanceRatePct: number,
  totalUnits: number,
  unitsPerYear: number[]
): DepreciationResult {
  const c = assertMoney(cost, "Asset cost");
  const residual = assertMoney(residualValue, "Residual value");
  const life = assertTermYears(usefulLifeYears, "Useful life");
  if (residual > c) throw new Error("The residual value cannot exceed the cost of the asset.");
  if (life < 1) throw new Error("The useful life must be at least one year.");

  const years = Math.round(life);
  const depreciable = c - residual;
  const schedule: DepreciationRow[] = [];
  let book = c;
  let accumulated = 0;

  const sumOfDigits = (years * (years + 1)) / 2;
  const rbRate = assertFiniteNumber(reducingBalanceRatePct, "Reducing balance rate") / 100;

  for (let y = 1; y <= years; y++) {
    let charge: number;
    switch (method) {
      case "straight_line":
        charge = depreciable / years;
        break;
      case "reducing_balance":
        charge = book * rbRate;
        break;
      case "sum_of_years_digits":
        charge = (depreciable * (years - y + 1)) / sumOfDigits;
        break;
      case "units_of_production": {
        const units = unitsPerYear[y - 1] ?? 0;
        if (totalUnits <= 0) throw new Error("Total expected units must be greater than zero.");
        charge = (depreciable * units) / totalUnits;
        break;
      }
    }
    // Depreciation may never take the book value below the residual value,
    // which is what stops a reducing balance running away below scrap value.
    charge = Math.min(charge, book - residual);
    charge = Math.max(0, charge);

    const opening = book;
    book -= charge;
    accumulated += charge;
    schedule.push({
      year: y,
      opening_value: opening,
      depreciation: charge,
      accumulated,
      closing_value: book
    });
  }

  return {
    method,
    depreciable_amount: depreciable,
    first_year_depreciation: schedule[0]?.depreciation ?? 0,
    final_year_depreciation: schedule[schedule.length - 1]?.depreciation ?? 0,
    total_depreciation: accumulated,
    average_annual_depreciation: accumulated / years,
    closing_book_value: book,
    schedule
  };
}

// ---------------------------------------------------------------------------
// BUS-010 Cash Flow
// ---------------------------------------------------------------------------

export interface CashFlowResult {
  opening_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  lowest_balance: number;
  lowest_balance_period: number;
  periods_negative: number;
  first_negative_period: number | null;
  average_net_flow: number;
  balances: number[];
}

/**
 * Period-by-period cash flow.
 *
 * The output that matters is not the closing balance but the LOWEST balance
 * and when it occurs: a business with a healthy year-end can still fail in
 * month seven. Both are surfaced.
 */
export function cashFlow(
  openingBalance: number,
  inflows: number[],
  outflows: number[]
): CashFlowResult {
  const opening = assertFiniteNumber(openingBalance, "Opening balance");
  if (inflows.length !== outflows.length) {
    throw new Error("Enter the same number of periods for money in and money out.");
  }
  if (inflows.length === 0) throw new Error("Enter at least one period of cash flow.");

  let balance = opening;
  let lowest = opening;
  let lowestPeriod = 0;
  let negatives = 0;
  let firstNegative: number | null = null;
  const balances: number[] = [];
  let totalIn = 0, totalOut = 0;

  for (let i = 0; i < inflows.length; i++) {
    totalIn += inflows[i];
    totalOut += outflows[i];
    balance += inflows[i] - outflows[i];
    balances.push(balance);
    if (balance < lowest) {
      lowest = balance;
      lowestPeriod = i + 1;
    }
    if (balance < 0) {
      negatives++;
      if (firstNegative === null) firstNegative = i + 1;
    }
  }

  return {
    opening_balance: opening,
    total_inflows: totalIn,
    total_outflows: totalOut,
    net_cash_flow: totalIn - totalOut,
    closing_balance: balance,
    lowest_balance: lowest,
    lowest_balance_period: lowestPeriod,
    periods_negative: negatives,
    first_negative_period: firstNegative,
    average_net_flow: (totalIn - totalOut) / inflows.length,
    balances
  };
}

// ---------------------------------------------------------------------------
// BUS-011 Pricing
// ---------------------------------------------------------------------------

export interface PricingResult {
  unit_cost: number;
  target_margin: number;
  price_excluding_vat: number;
  vat_amount: number;
  price_including_vat: number;
  profit_per_unit: number;
  markup_on_cost: number;
  price_after_discount_excluding_vat: number;
  margin_after_discount: number;
  discount_destroys_margin: boolean;
  break_even_units: number | null;
}

/**
 * Price a product from a target MARGIN, not a markup, and show what a
 * discount does to it.
 *
 * A discount comes straight off profit, so a 20% discount on a 30% margin
 * leaves 12.5%, not 10%. Businesses routinely discount themselves into a loss
 * because they subtract the discount from the margin instead of repricing.
 */
export function pricing(
  unitCost: number,
  targetMarginPct: number,
  vatRate: number,
  discountPct: number,
  fixedCosts: number
): PricingResult {
  const cost = assertMoney(unitCost, "Unit cost");
  const margin = assertFiniteNumber(targetMarginPct, "Target margin") / 100;
  const discount = assertFiniteNumber(discountPct, "Discount") / 100;
  const fixed = assertMoney(fixedCosts, "Fixed costs");

  if (margin >= 1) {
    throw new Error("A margin of 100% or more is impossible: the price would have to be infinite.");
  }
  if (margin < 0) throw new Error("The target margin cannot be negative.");
  if (discount < 0 || discount >= 1) throw new Error("The discount must be between 0% and 100%.");

  // Price from margin: price = cost / (1 - margin). Using cost x (1 + margin)
  // here would be a markup, and would miss the target by a wide margin at
  // high percentages.
  const price = cost / (1 - margin);
  const vat = price * vatRate;
  const discounted = price * (1 - discount);
  const profitAfterDiscount = discounted - cost;
  const marginAfterDiscount = discounted === 0 ? 0 : profitAfterDiscount / discounted;

  const contribution = discounted - cost;

  return {
    unit_cost: cost,
    target_margin: margin,
    price_excluding_vat: price,
    vat_amount: vat,
    price_including_vat: price + vat,
    profit_per_unit: price - cost,
    markup_on_cost: cost === 0 ? 0 : (price - cost) / cost,
    price_after_discount_excluding_vat: discounted,
    margin_after_discount: marginAfterDiscount,
    discount_destroys_margin: profitAfterDiscount <= 0,
    break_even_units: contribution > 0 ? fixed / contribution : null
  };
}

// ---------------------------------------------------------------------------
// BUS-012 ROI for a business project
// ---------------------------------------------------------------------------

export interface ProjectRoiResult {
  initial_investment: number;
  total_benefits: number;
  total_ongoing_costs: number;
  net_benefit: number;
  simple_roi: number;
  net_present_value: number;
  internal_rate_of_return: number | null;
  discounted_payback_years: number | null;
  simple_payback_years: number | null;
  profitability_index: number | null;
  annualised_roi: number;
}

/**
 * Appraise a project on both an undiscounted and a discounted basis.
 *
 * Simple ROI ignores timing entirely, which flatters any project whose
 * benefits arrive late. Reporting NPV and IRR alongside it is what makes the
 * comparison honest, so all three are returned together rather than a headline
 * ROI on its own.
 */
export function projectRoi(
  initialInvestment: number,
  annualBenefits: number[],
  annualCosts: number[],
  discountRatePct: number
): ProjectRoiResult {
  const investment = assertMoney(initialInvestment, "Initial investment");
  const rate = assertFiniteNumber(discountRatePct, "Discount rate") / 100;
  if (annualBenefits.length !== annualCosts.length) {
    throw new Error("Enter the same number of years for benefits and ongoing costs.");
  }
  if (annualBenefits.length === 0) throw new Error("Enter at least one year of benefits.");

  const net = annualBenefits.map((b, i) => b - annualCosts[i]);
  const totalBenefits = annualBenefits.reduce((a, b) => a + b, 0);
  const totalCosts = annualCosts.reduce((a, b) => a + b, 0);
  const netBenefit = totalBenefits - totalCosts - investment;

  let npv = -investment;
  let discountedCumulative = -investment;
  let cumulative = -investment;
  let discountedPayback: number | null = null;
  let simplePayback: number | null = null;
  let pvOfInflows = 0;

  for (let y = 1; y <= net.length; y++) {
    const discounted = net[y - 1] / Math.pow(1 + rate, y);
    npv += discounted;
    pvOfInflows += discounted;

    const previousDiscounted = discountedCumulative;
    discountedCumulative += discounted;
    if (discountedPayback === null && discountedCumulative >= 0 && discounted !== 0) {
      discountedPayback = y - 1 + -previousDiscounted / discounted;
    }

    const previous = cumulative;
    cumulative += net[y - 1];
    if (simplePayback === null && cumulative >= 0 && net[y - 1] !== 0) {
      simplePayback = y - 1 + -previous / net[y - 1];
    }
  }

  // IRR by bracketed root finding on the NPV function - deliberately not
  // Newton, which diverges on flat or sign-changing cash flow polynomials.
  const npvAt = (r: number) => {
    let v = -investment;
    for (let y = 1; y <= net.length; y++) v += net[y - 1] / Math.pow(1 + r, y);
    return v;
  };
  let irr: number | null = null;
  let lo = -0.9999;
  for (let hi = lo + 0.01; hi <= 10; hi += 0.01) {
    if (npvAt(lo) * npvAt(hi) < 0) {
      irr = bracketedRoot(npvAt, lo, hi);
      break;
    }
    lo = hi;
  }

  const years = net.length;
  const simpleRoi = investment === 0 ? 0 : netBenefit / investment;

  return {
    initial_investment: investment,
    total_benefits: totalBenefits,
    total_ongoing_costs: totalCosts,
    net_benefit: netBenefit,
    simple_roi: simpleRoi,
    net_present_value: npv,
    internal_rate_of_return: irr,
    discounted_payback_years: discountedPayback,
    simple_payback_years: simplePayback,
    profitability_index: investment === 0 ? null : pvOfInflows / investment,
    // Annualised, so a project running twice as long is not credited twice.
    annualised_roi: years > 0 && simpleRoi > -1 ? Math.pow(1 + simpleRoi, 1 / years) - 1 : 0
  };
}

export { parseList as parseNumberList };
