import type { NumericInputs, CalculationContext, CalculatorHandler } from "../../types.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";
import {
  markupCalculator, profitStatement, commission, depreciation,
  normaliseDepreciationMethod, cashFlow, pricing, projectRoi, parseNumberList
} from "./business.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

function optionalNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Format a money figure for a message. Negative amounts read as "-£60,000",
 * never "£-60,000", which is what a bare template literal produces and which
 * looks like a typing error to a reader.
 */
function money(n: number): string {
  const rounded = round2(Math.abs(n));
  return `${n < 0 ? "-" : ""}£${rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const NOT_ACCOUNTING_ADVICE =
  "A management estimate on the figures you entered. It is not a statutory account, a tax computation, or accounting advice, and it does not follow any particular accounting standard.";

/** BUS-002 Markup */
export const bus002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = markupCalculator(
    Number(inputs.cost),
    optionalNumber(inputs.price),
    optionalNumber(inputs.markup_percentage)
  );
  return {
    outputs: {
      cost: round2(r.cost),
      price: round2(r.price),
      profit: round2(r.profit),
      markup: round8(r.markup),
      margin: round8(r.margin),
      basis:
        "Markup is profit measured against COST; margin is profit measured against PRICE. They are never the same number: a 50% markup is a 33.3% margin. Confusing the two is the commonest pricing mistake in a small business, so both are always shown."
    }
  };
};

/** BUS-003 Profit */
export const bus003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = profitStatement(
    Number(inputs.revenue),
    Number(inputs.cost_of_goods_sold ?? 0),
    Number(inputs.operating_expenses ?? 0),
    Number(inputs.other_income ?? 0),
    Number(inputs.interest_and_other_costs ?? 0),
    Number(inputs.tax_rate ?? 0)
  );
  return {
    outputs: {
      gross_profit: round2(r.gross_profit),
      gross_margin: round8(r.gross_margin),
      operating_profit: round2(r.operating_profit),
      operating_margin: round8(r.operating_margin),
      profit_before_tax: round2(r.profit_before_tax),
      tax: round2(r.tax),
      net_profit: round2(r.net_profit),
      net_margin: round8(r.net_margin),
      basis: NOT_ACCOUNTING_ADVICE + " Tax is charged on a profit and not on a loss, so a loss-making year shows no tax rather than a refund."
    }
  };
};

/** BUS-004 Gross Profit */
export const bus004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = profitStatement(
    Number(inputs.revenue), Number(inputs.cost_of_goods_sold), 0, 0, 0, 0
  );
  return {
    outputs: {
      revenue: round2(r.revenue),
      cost_of_goods_sold: round2(r.cost_of_goods_sold),
      gross_profit: round2(r.gross_profit),
      gross_margin: round8(r.gross_margin),
      markup_on_cost: round8(r.markup_on_cost),
      basis:
        "Gross profit is revenue less the direct cost of what you sold. It does not include rent, salaries outside production, or any other overhead, so it is always larger than the profit that reaches your bank account."
    }
  };
};

/** BUS-005 Net Profit */
export const bus005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = profitStatement(
    Number(inputs.revenue),
    Number(inputs.cost_of_goods_sold ?? 0),
    Number(inputs.operating_expenses ?? 0),
    Number(inputs.other_income ?? 0),
    Number(inputs.interest_and_other_costs ?? 0),
    Number(inputs.tax_rate ?? 0)
  );
  const warnings: string[] = [];
  if (!r.breaks_even) {
    warnings.push("These figures produce a loss rather than a profit.");
  }
  return {
    outputs: {
      gross_profit: round2(r.gross_profit),
      gross_margin: round8(r.gross_margin),
      operating_profit: round2(r.operating_profit),
      operating_margin: round8(r.operating_margin),
      other_income: round2(r.other_income),
      interest_and_other_costs: round2(r.interest_and_other_costs),
      profit_before_tax: round2(r.profit_before_tax),
      tax: round2(r.tax),
      net_profit: round2(r.net_profit),
      net_margin: round8(r.net_margin),
      basis: NOT_ACCOUNTING_ADVICE
    },
    warnings
  };
};

/** BUS-007 Commission */
export const bus007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = commission(
    Number(inputs.sales),
    Number(inputs.threshold ?? 0),
    Number(inputs.commission_rate),
    Number(inputs.target ?? 0),
    Number(inputs.accelerator_rate ?? 0),
    Number(inputs.base_salary ?? 0)
  );
  return {
    outputs: {
      commissionable_sales: round2(r.commissionable_sales),
      base_commission: round2(r.base_commission),
      accelerator_sales: round2(r.accelerator_sales),
      accelerator_commission: round2(r.accelerator_commission),
      total_commission: round2(r.total_commission),
      total_earnings: round2(r.total_earnings),
      monthly_earnings: round2(r.total_earnings / 12),
      effective_commission_rate: round8(r.effective_commission_rate),
      basis:
        "Commission is paid on sales above the threshold, not on everything sold, and any accelerator applies only to sales above target. Quoting a headline rate without the threshold overstates earnings badly at low volumes. Figures are gross, before Income Tax and National Insurance."
    }
  };
};

/** BUS-009 Depreciation */
export const bus009Handler: CalculatorHandler = (inputs: NumericInputs, _context: CalculationContext) => {
  const method = normaliseDepreciationMethod(inputs.method);
  const units = inputs.units_per_year ? parseNumberList(inputs.units_per_year, "Units per year") : [];
  const r = depreciation(
    Number(inputs.cost),
    Number(inputs.residual_value ?? 0),
    Number(inputs.useful_life_years),
    method,
    Number(inputs.reducing_balance_rate ?? 25),
    Number(inputs.total_units ?? 0),
    units
  );
  return {
    outputs: {
      depreciable_amount: round2(r.depreciable_amount),
      first_year_depreciation: round2(r.first_year_depreciation),
      final_year_depreciation: round2(r.final_year_depreciation),
      total_depreciation: round2(r.total_depreciation),
      average_annual_depreciation: round2(r.average_annual_depreciation),
      closing_book_value: round2(r.closing_book_value),
      method_used: method,
      basis:
        "Depreciation never takes the book value below the residual value, which is what stops a reducing balance charge running away below scrap value. This is accounting depreciation for management purposes, NOT capital allowances: HMRC does not accept depreciation as a deductible expense, and the tax relief you actually get comes through capital allowances instead."
    },
    schedule: r.schedule.map(row => ({
      year: row.year,
      opening_value: round2(row.opening_value),
      depreciation: round2(row.depreciation),
      accumulated: round2(row.accumulated),
      closing_value: round2(row.closing_value)
    }))
  };
};

/** BUS-010 Cash Flow */
export const bus010Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = cashFlow(
    Number(inputs.opening_balance ?? 0),
    parseNumberList(inputs.inflows, "Money in"),
    parseNumberList(inputs.outflows, "Money out")
  );
  const warnings: string[] = [];
  if (r.first_negative_period !== null) {
    warnings.push(
      `The balance first goes negative in period ${r.first_negative_period}, and reaches its lowest point of ${money(r.lowest_balance)} in period ${r.lowest_balance_period}. A business can be profitable over the year and still run out of money in the middle of it.`
    );
  }
  return {
    outputs: {
      total_inflows: round2(r.total_inflows),
      total_outflows: round2(r.total_outflows),
      net_cash_flow: round2(r.net_cash_flow),
      closing_balance: round2(r.closing_balance),
      lowest_balance: round2(r.lowest_balance),
      lowest_balance_period: r.lowest_balance_period,
      periods_negative: r.periods_negative,
      average_net_flow: round2(r.average_net_flow),
      basis:
        "The figure that matters here is the LOWEST balance and when it happens, not the closing balance. A healthy year-end says nothing about whether you could meet payroll in month seven."
    },
    schedule: r.balances.map((b, i) => ({ period: i + 1, balance: round2(b) })),
    warnings
  };
};

/** BUS-011 Pricing */
export const bus011Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
  // The VAT rate is a statutory value, so it comes from the versioned ruleset
  // rather than a default typed into a form.
  const vatRate = rules.vat.standard_rate;
  const r = pricing(
    Number(inputs.unit_cost),
    Number(inputs.target_margin),
    Number(inputs.vat_registered) === 0 || inputs.vat_registered === false ? 0 : vatRate,
    Number(inputs.discount ?? 0),
    Number(inputs.fixed_costs ?? 0)
  );
  const warnings: string[] = [];
  if (r.discount_destroys_margin) {
    warnings.push(
      "At this discount the price is at or below cost, so every sale loses money."
    );
  }
  return {
    outputs: {
      price_excluding_vat: round2(r.price_excluding_vat),
      vat_amount: round2(r.vat_amount),
      price_including_vat: round2(r.price_including_vat),
      profit_per_unit: round2(r.profit_per_unit),
      markup_on_cost: round8(r.markup_on_cost),
      price_after_discount_excluding_vat: round2(r.price_after_discount_excluding_vat),
      margin_after_discount: round8(r.margin_after_discount),
      break_even_units: r.break_even_units === null ? null : round2(r.break_even_units),
      basis:
        "The price is worked out from your target MARGIN, as cost divided by one minus the margin. Multiplying cost by one plus the margin would be a markup and would miss the target badly at high percentages. A discount comes straight off profit, which is why a 20% discount on a 30% margin leaves 12.5% and not 10%."
    },
    warnings
  };
};

/** BUS-012 ROI for a business project */
export const bus012Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = projectRoi(
    Number(inputs.initial_investment),
    parseNumberList(inputs.annual_benefits, "Annual benefits"),
    parseNumberList(inputs.annual_costs, "Annual ongoing costs"),
    Number(inputs.discount_rate ?? 0)
  );
  return {
    outputs: {
      total_benefits: round2(r.total_benefits),
      total_ongoing_costs: round2(r.total_ongoing_costs),
      net_benefit: round2(r.net_benefit),
      simple_roi: round8(r.simple_roi),
      annualised_roi: round8(r.annualised_roi),
      net_present_value: round2(r.net_present_value),
      internal_rate_of_return: r.internal_rate_of_return === null ? null : round8(r.internal_rate_of_return),
      simple_payback_years: r.simple_payback_years === null ? null : round8(r.simple_payback_years),
      discounted_payback_years: r.discounted_payback_years === null ? null : round8(r.discounted_payback_years),
      profitability_index: r.profitability_index === null ? null : round8(r.profitability_index),
      basis:
        "Simple ROI ignores timing altogether, which flatters any project whose benefits arrive late, so it is shown alongside net present value and the internal rate of return rather than on its own. Where the cash flows never change sign in a way that produces a solution, no internal rate of return exists and none is reported."
    }
  };
};
