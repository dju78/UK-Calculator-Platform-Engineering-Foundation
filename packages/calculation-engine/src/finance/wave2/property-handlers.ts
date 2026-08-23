import type { CalculatorHandler } from "../../types.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";
import {
  mortgagePayoff, mortgageRefinance, interestOnlyMortgage, mortgageStressTest,
  homeEquity, rentAffordability, propertyCapitalGrowth, propertyCashFlow,
  rentVsBuy, rentalProperty, propertyVsStocks
} from "./property.js";
import { propertyTransactionTax, normalisePropertyJurisdiction } from "./property-tax.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const NOT_A_QUOTE =
  "An illustration based on the figures you entered. It is not a mortgage quote, a lending decision or advice.";

/** PRO-005 Mortgage Payoff */
export const pro005Handler: CalculatorHandler = (inputs) => {
  const r = mortgagePayoff(
    Number(inputs.balance), Number(inputs.annual_rate),
    Number(inputs.remaining_years), Number(inputs.monthly_overpayment ?? 0)
  );
  return {
    outputs: {
      current_monthly_payment: round2(r.current_monthly_payment),
      new_monthly_payment: round2(r.new_monthly_payment),
      original_payoff_months: r.original_payoff_months,
      new_payoff_months: r.new_payoff_months,
      months_saved: r.months_saved,
      original_total_interest: round2(r.original_total_interest),
      new_total_interest: round2(r.new_total_interest),
      interest_saved: round2(r.interest_saved),
      basis: NOT_A_QUOTE + " Many lenders cap annual overpayments; check your mortgage terms."
    }
  };
};

/** PRO-006 Mortgage Refinance */
export const pro006Handler: CalculatorHandler = (inputs) => {
  const r = mortgageRefinance(
    Number(inputs.balance), Number(inputs.current_rate), Number(inputs.current_remaining_years),
    Number(inputs.new_rate), Number(inputs.new_term_years), Number(inputs.fees ?? 0)
  );
  return {
    outputs: {
      current_monthly_payment: round2(r.current_monthly_payment),
      new_monthly_payment: round2(r.new_monthly_payment),
      monthly_saving: round2(r.monthly_saving),
      current_remaining_interest: round2(r.current_remaining_interest),
      new_total_interest: round2(r.new_total_interest),
      total_interest_change: round2(r.total_interest_change),
      break_even_months: r.break_even_months,
      net_saving_over_new_term: round2(r.net_saving_over_new_term),
      basis:
        r.total_interest_change > 0
          ? "The new deal lowers the monthly payment but costs MORE interest overall, because the balance is repaid over a longer period. " + NOT_A_QUOTE
          : NOT_A_QUOTE
    }
  };
};

/** PRO-007 Interest-Only Mortgage */
export const pro007Handler: CalculatorHandler = (inputs) => {
  const r = interestOnlyMortgage(
    Number(inputs.balance), Number(inputs.annual_rate), Number(inputs.years)
  );
  return {
    outputs: {
      monthly_interest_payment: round2(r.monthly_interest_payment),
      total_interest_over_term: round2(r.total_interest_over_term),
      balance_at_end_of_term: round2(r.balance_at_end_of_term),
      repayment_equivalent_payment: round2(r.repayment_equivalent_payment),
      monthly_difference: round2(r.monthly_difference),
      total_cost_difference: round2(r.total_cost_difference),
      capital_warning:
        "With an interest-only mortgage none of the capital is repaid. The full balance is still owed at the end of the term and you need a credible plan to repay it.",
      basis: NOT_A_QUOTE
    }
  };
};

/** PRO-009 Mortgage Rate Stress Test */
export const pro009Handler: CalculatorHandler = (inputs) => {
  const income = inputs.gross_monthly_income === undefined ? undefined : Number(inputs.gross_monthly_income);
  const r = mortgageStressTest(
    Number(inputs.balance), Number(inputs.current_rate),
    Number(inputs.remaining_years), Number(inputs.rate_increase), income
  );
  return {
    outputs: {
      current_monthly_payment: round2(r.current_monthly_payment),
      stressed_monthly_payment: round2(r.stressed_monthly_payment),
      monthly_increase: round2(r.monthly_increase),
      annual_increase: round2(r.annual_increase),
      percentage_increase: r.percentage_increase,
      payment_to_income_now: r.payment_to_income_now,
      payment_to_income_stressed: r.payment_to_income_stressed,
      basis:
        "Shows the payment if your rate rose by the amount entered. Lenders run their own stress tests using their own assumptions."
    }
  };
};

/** PRO-012 Home Equity */
export const pro012Handler: CalculatorHandler = (inputs) => {
  const r = homeEquity(
    Number(inputs.property_value), Number(inputs.mortgage_balance), Number(inputs.max_ltv ?? 85)
  );
  return {
    outputs: {
      equity: round2(r.equity),
      equity_percentage: r.equity_percentage,
      ltv: r.ltv,
      available_to_borrow: round2(r.available_to_borrow),
      basis:
        "Based on the property value you entered. Lenders use their own valuation and their own maximum loan-to-value."
    }
  };
};

/** PRO-014 Rent Calculator */
export const pro014Handler: CalculatorHandler = (inputs) => {
  const proposed = inputs.proposed_rent === undefined || inputs.proposed_rent === "" ? undefined : Number(inputs.proposed_rent);
  const r = rentAffordability(
    Number(inputs.gross_monthly_income), Number(inputs.income_multiple ?? 30),
    proposed, Number(inputs.deposit_weeks ?? 5)
  );
  return {
    outputs: {
      affordable_rent_by_ratio: round2(r.affordable_rent_by_ratio),
      annual_income_required: round2(r.annual_income_required),
      rent_to_income: r.rent_to_income,
      deposit_required: round2(r.deposit_required),
      upfront_cost: round2(r.upfront_cost),
      basis:
        "Letting agents commonly require annual income of about 30 times the monthly rent, but criteria differ. In England the tenancy deposit is capped at five weeks' rent where annual rent is under £50,000."
    }
  };
};

/** PRO-015 Rent vs Buy */
export const pro015Handler: CalculatorHandler = (inputs, context) => {
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
  const price = Number(inputs.property_price);
  const jurisdiction = normalisePropertyJurisdiction(inputs.jurisdiction ?? "england_ni");
  // Purchase tax comes from the versioned rules for the chosen jurisdiction.
  const tax = propertyTransactionTax(
    price, jurisdiction,
    { firstTimeBuyer: inputs.first_time_buyer === true },
    rules
  );

  const r = rentVsBuy({
    propertyPrice: price,
    deposit: Number(inputs.deposit),
    mortgageRatePct: Number(inputs.mortgage_rate),
    mortgageYears: Number(inputs.mortgage_years),
    purchaseTax: tax.tax,
    annualMaintenancePct: Number(inputs.maintenance_pct ?? 1),
    annualGrowthPct: Number(inputs.property_growth ?? 0),
    monthlyRent: Number(inputs.monthly_rent),
    annualRentIncreasePct: Number(inputs.rent_increase ?? 0),
    investmentReturnPct: Number(inputs.investment_return ?? 0),
    yearsHeld: Number(inputs.years_held)
  });

  return {
    outputs: {
      purchase_tax: round2(tax.tax),
      total_cost_of_renting: round2(r.total_cost_of_renting),
      total_cost_of_buying: round2(r.total_cost_of_buying),
      property_value_at_end: round2(r.property_value_at_end),
      mortgage_balance_at_end: round2(r.mortgage_balance_at_end),
      equity_at_end: round2(r.equity_at_end),
      net_position_buying: round2(r.net_position_buying),
      net_position_renting: round2(r.net_position_renting),
      difference: round2(r.difference),
      better_option: r.better_option,
      breakeven_year: r.breakeven_year,
      tax_name: tax.tax_name,
      basis:
        "A long-run comparison on the assumptions you entered. It is highly sensitive to house-price growth, rent increases and investment returns, none of which can be predicted. Not advice."
    }
  };
};

/** PRO-017 Rental Property */
export const pro017Handler: CalculatorHandler = (inputs, context) => {
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
  const price = Number(inputs.price);
  const jurisdiction = normalisePropertyJurisdiction(inputs.jurisdiction ?? "england_ni");
  const tax = propertyTransactionTax(price, jurisdiction, { additionalProperty: true }, rules);

  const r = rentalProperty({
    price,
    deposit: Number(inputs.deposit),
    mortgageRatePct: Number(inputs.mortgage_rate),
    mortgageYears: Number(inputs.mortgage_years),
    interestOnly: inputs.interest_only !== false,
    monthlyRent: Number(inputs.monthly_rent),
    vacancyPct: Number(inputs.vacancy ?? 0),
    annualCosts: Number(inputs.annual_costs ?? 0),
    purchaseTax: tax.tax,
    otherPurchaseCosts: Number(inputs.other_purchase_costs ?? 0)
  });

  return {
    outputs: {
      annual_gross_rent: round2(r.annual_gross_rent),
      annual_effective_rent: round2(r.annual_effective_rent),
      net_operating_income: round2(r.net_operating_income),
      gross_yield: r.gross_yield,
      net_yield: r.net_yield,
      annual_mortgage_cost: round2(r.annual_mortgage_cost),
      pre_tax_cash_flow: round2(r.pre_tax_cash_flow),
      purchase_tax: round2(tax.tax),
      cash_invested: round2(r.cash_invested),
      cash_on_cash_return: r.cash_on_cash_return,
      tax_name: tax.tax_name,
      basis:
        "Cash flow before income tax. Landlord income tax, mortgage interest relief and any company structure are outside the scope of this calculator."
    }
  };
};

/** PRO-020 Property vs Stocks */
export const pro020Handler: CalculatorHandler = (inputs, context) => {
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
  const price = Number(inputs.price);
  const jurisdiction = normalisePropertyJurisdiction(inputs.jurisdiction ?? "england_ni");
  const tax = propertyTransactionTax(price, jurisdiction, { additionalProperty: true }, rules);

  const r = propertyVsStocks({
    price,
    deposit: Number(inputs.deposit),
    purchaseCosts: tax.tax + Number(inputs.other_purchase_costs ?? 0),
    mortgageRatePct: Number(inputs.mortgage_rate),
    mortgageYears: Number(inputs.mortgage_years),
    monthlyRent: Number(inputs.monthly_rent),
    annualCosts: Number(inputs.annual_costs ?? 0),
    propertyGrowthPct: Number(inputs.property_growth ?? 0),
    stockReturnPct: Number(inputs.stock_return ?? 0),
    years: Number(inputs.years)
  });

  return {
    outputs: {
      property_final_equity: round2(r.property_final_equity),
      property_total_invested: round2(r.property_total_invested),
      property_net_gain: round2(r.property_net_gain),
      stocks_final_value: round2(r.stocks_final_value),
      stocks_total_invested: round2(r.stocks_total_invested),
      stocks_net_gain: round2(r.stocks_net_gain),
      difference: round2(r.difference),
      better_option: r.better_option,
      basis:
        "Compares the same cash committed to each option on the growth assumptions you entered. Taxes on rental income and on investment gains are NOT modelled, and neither return is guaranteed. Not investment advice."
    }
  };
};

/** PRO-021 Property Cash Flow */
export const pro021Handler: CalculatorHandler = (inputs) => {
  const r = propertyCashFlow(
    Number(inputs.monthly_rent), Number(inputs.vacancy ?? 0),
    Number(inputs.annual_costs ?? 0), Number(inputs.monthly_mortgage_payment ?? 0),
    Number(inputs.cash_invested ?? 0)
  );
  return {
    outputs: {
      annual_gross_rent: round2(r.annual_gross_rent),
      annual_effective_rent: round2(r.annual_effective_rent),
      annual_mortgage_cost: round2(r.annual_mortgage_cost),
      net_annual_cash_flow: round2(r.net_annual_cash_flow),
      net_monthly_cash_flow: round2(r.net_monthly_cash_flow),
      cash_on_cash_return: r.cash_on_cash_return,
      basis: "Cash flow before income tax."
    }
  };
};

/** PRO-022 Property Capital Growth */
export const pro022Handler: CalculatorHandler = (inputs) => {
  const r = propertyCapitalGrowth(
    Number(inputs.initial_value), Number(inputs.annual_growth),
    Number(inputs.years), Number(inputs.inflation ?? 0)
  );
  return {
    outputs: {
      final_value: round2(r.final_value),
      total_growth: round2(r.total_growth),
      total_growth_percentage: r.total_growth_percentage,
      real_final_value: round2(r.real_final_value),
      real_total_growth_percentage: r.real_total_growth_percentage,
      basis:
        "A projection at a constant growth rate. House prices do not grow smoothly and can fall. The real figures adjust for the inflation rate you entered."
    }
  };
};

/** Shared handler for the four property transaction tax calculators. */
function transactionTaxHandler(
  fixed: { jurisdiction?: string; firstTimeBuyer?: boolean; additionalProperty?: boolean }
): CalculatorHandler {
  return (inputs, context) => {
    const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
    const jurisdiction = normalisePropertyJurisdiction(fixed.jurisdiction ?? inputs.jurisdiction ?? "england_ni");
    const result = propertyTransactionTax(
      Number(inputs.price),
      jurisdiction,
      {
        firstTimeBuyer: fixed.firstTimeBuyer ?? inputs.first_time_buyer === true,
        additionalProperty: fixed.additionalProperty ?? inputs.additional_property === true,
        nonUkResident: inputs.non_uk_resident === true
      },
      rules
    );
    return {
      outputs: {
        tax: round2(result.tax),
        base_tax: round2(result.base_tax),
        surcharge: round2(result.surcharge),
        effective_rate: result.effective_rate,
        tax_name: result.tax_name,
        jurisdiction: result.jurisdiction,
        notes: result.notes.join(" "),
        basis:
          `${result.tax_name} applies to property in ${result.jurisdiction} only. The other UK nations charge a different tax with different bands.`
      }
    };
  };
}

/** PRO-024 First-Time Buyer Stamp Duty (England & NI) */
export const pro024Handler = transactionTaxHandler({ jurisdiction: "england_ni", firstTimeBuyer: true });
/** PRO-025 Additional Property Stamp Duty (England & NI) */
export const pro025Handler = transactionTaxHandler({ jurisdiction: "england_ni", additionalProperty: true });
/** PRO-026 Scotland LBTT */
export const pro026Handler = transactionTaxHandler({ jurisdiction: "scotland" });
/** PRO-027 Wales LTT */
export const pro027Handler = transactionTaxHandler({ jurisdiction: "wales" });
