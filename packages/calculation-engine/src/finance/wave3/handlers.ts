import type { CalculationContext, CalculatorHandler } from "../../types.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";
import { compareFixedVsTracker } from "./mortgage-comparison.js";
import { calculatePropertyCgt } from "./property-cgt.js";
import { simulatePortfolioDrawdown } from "./portfolio-drawdown.js";
import { calculateSafeWithdrawalRate } from "./safe-withdrawal.js";
import { rebalancePortfolio } from "./rebalancing.js";
import { simulateMonteCarlo } from "./monte-carlo.js";
import { compareSippVsIsa } from "./sipp-vs-isa.js";
import { calculateGiaTax } from "./gia-tax.js";
import { calculateHicbc } from "./hicbc.js";
import { calculateFire } from "./fire.js";

/** PRO-008 Fixed vs Tracker Mortgage */
export const pro008Handler: CalculatorHandler = (inputs) => {
  const r = compareFixedVsTracker({
    loan_amount: Number(inputs.loan_amount),
    term_years: Number(inputs.term_years),
    fixed_rate: Number(inputs.fixed_rate),
    fixed_fee: inputs.fixed_fee !== undefined ? Number(inputs.fixed_fee) : undefined,
    tracker_margin: Number(inputs.tracker_margin),
    current_base_rate: Number(inputs.current_base_rate),
    tracker_fee: inputs.tracker_fee !== undefined ? Number(inputs.tracker_fee) : undefined,
    deal_years: Number(inputs.deal_years),
    expected_rate_change: inputs.expected_rate_change !== undefined ? Number(inputs.expected_rate_change) : undefined,
    fee_financed: inputs.fee_financed === true || inputs.fee_financed === "true"
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/** PRO-028 Property Capital Gains Tax */
export const pro028Handler: CalculatorHandler = (inputs) => {
  const r = calculatePropertyCgt({
    disposal_price: Number(inputs.disposal_price),
    acquisition_price: Number(inputs.acquisition_price),
    buying_costs: inputs.buying_costs !== undefined ? Number(inputs.buying_costs) : undefined,
    selling_costs: inputs.selling_costs !== undefined ? Number(inputs.selling_costs) : undefined,
    improvement_costs: inputs.improvement_costs !== undefined ? Number(inputs.improvement_costs) : undefined,
    total_ownership_months: Number(inputs.total_ownership_months),
    months_as_main_residence: inputs.months_as_main_residence !== undefined ? Number(inputs.months_as_main_residence) : undefined,
    taxable_income: inputs.taxable_income !== undefined ? Number(inputs.taxable_income) : undefined,
    joint_owners: inputs.joint_owners !== undefined ? Number(inputs.joint_owners) : undefined,
    loss_brought_forward: inputs.loss_brought_forward !== undefined ? Number(inputs.loss_brought_forward) : undefined
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/** INV-025 Portfolio Withdrawal */
export const inv025Handler: CalculatorHandler = (inputs) => {
  const r = simulatePortfolioDrawdown({
    initial_balance: Number(inputs.initial_balance),
    annual_withdrawal: Number(inputs.annual_withdrawal),
    annual_return: inputs.annual_return !== undefined ? Number(inputs.annual_return) : undefined,
    inflation_rate: inputs.inflation_rate !== undefined ? Number(inputs.inflation_rate) : undefined,
    adjust_for_inflation: inputs.adjust_for_inflation !== false && inputs.adjust_for_inflation !== "false",
    management_fee: inputs.management_fee !== undefined ? Number(inputs.management_fee) : undefined,
    planning_years: Number(inputs.planning_years)
  });
  return { outputs: r as unknown as Record<string, number | string | boolean | null> };
};

/** INV-026 Safe Withdrawal Rate */
export const inv026Handler: CalculatorHandler = (inputs) => {
  const r = calculateSafeWithdrawalRate({
    portfolio_value: Number(inputs.portfolio_value),
    retirement_years: Number(inputs.retirement_years),
    equity_allocation_pct: inputs.equity_allocation_pct !== undefined ? Number(inputs.equity_allocation_pct) : undefined,
    expected_equity_return: inputs.expected_equity_return !== undefined ? Number(inputs.expected_equity_return) : undefined,
    expected_bond_return: inputs.expected_bond_return !== undefined ? Number(inputs.expected_bond_return) : undefined,
    custom_withdrawal_pct: inputs.custom_withdrawal_pct !== undefined ? Number(inputs.custom_withdrawal_pct) : undefined,
    use_guardrails: inputs.use_guardrails === true || inputs.use_guardrails === "true"
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/** INV-027 Portfolio Rebalancing */
export const inv027Handler: CalculatorHandler = (inputs) => {
  const r = rebalancePortfolio({
    assets_json: inputs.assets_json as string,
    cash_flow: inputs.cash_flow !== undefined ? Number(inputs.cash_flow) : undefined,
    rebalance_mode: (inputs.rebalance_mode as "full" | "cash_only") ?? "full"
  });
  return {
    outputs: {
      current_total_value: r.current_total_value,
      post_rebalance_total_value: r.post_rebalance_total_value,
      total_buys_amount: r.total_buys_amount,
      total_sells_amount: r.total_sells_amount,
      portfolio_drift_pct: r.portfolio_drift_pct
    }
  };
};

/** INV-029 Monte Carlo Investment Simulator */
export const inv029Handler: CalculatorHandler = (inputs) => {
  const r = simulateMonteCarlo({
    initial_investment: Number(inputs.initial_investment),
    annual_contribution: inputs.annual_contribution !== undefined ? Number(inputs.annual_contribution) : undefined,
    annual_withdrawal: inputs.annual_withdrawal !== undefined ? Number(inputs.annual_withdrawal) : undefined,
    expected_return_pct: Number(inputs.expected_return_pct),
    volatility_pct: Number(inputs.volatility_pct),
    horizon_years: Number(inputs.horizon_years),
    simulations_count: inputs.simulations_count !== undefined ? Number(inputs.simulations_count) : undefined,
    target_wealth: inputs.target_wealth !== undefined ? Number(inputs.target_wealth) : undefined,
    seed: inputs.seed !== undefined ? Number(inputs.seed) : undefined
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/** ISA-007 SIPP vs ISA */
export const isa007Handler: CalculatorHandler = (inputs) => {
  const r = compareSippVsIsa({
    monthly_contribution_net: Number(inputs.monthly_contribution_net),
    years_to_invest: Number(inputs.years_to_invest),
    annual_growth_rate: inputs.annual_growth_rate !== undefined ? Number(inputs.annual_growth_rate) : undefined,
    current_tax_band: inputs.current_tax_band as "basic" | "higher" | "additional",
    retirement_tax_band: inputs.retirement_tax_band as "nil" | "basic" | "higher",
    reinvest_tax_relief: inputs.reinvest_tax_relief !== false && inputs.reinvest_tax_relief !== "false"
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/**
 * The ruleset is a versioned JSON document, so its shape is validated at load
 * time rather than by the compiler. Handlers read it structurally, exactly as
 * the Wave 1 and Wave 2 tax handlers do.
 */
function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

/** TAX-013 General Investment Account Tax */
export const tax013Handler: CalculatorHandler = (inputs, context) => {
  const r = calculateGiaTax({
    annual_dividends: inputs.annual_dividends !== undefined ? Number(inputs.annual_dividends) : undefined,
    realised_capital_gains: inputs.realised_capital_gains !== undefined ? Number(inputs.realised_capital_gains) : undefined,
    interest_income: inputs.interest_income !== undefined ? Number(inputs.interest_income) : undefined,
    other_taxable_income: inputs.other_taxable_income !== undefined ? Number(inputs.other_taxable_income) : undefined,
    capital_losses_brought_forward: inputs.capital_losses_brought_forward !== undefined ? Number(inputs.capital_losses_brought_forward) : undefined
  }, rulesFor(context));
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/** TAX-019 High Income Child Benefit Charge */
export const tax019Handler: CalculatorHandler = (inputs) => {
  const r = calculateHicbc({
    gross_salary: Number(inputs.gross_salary),
    other_taxable_income: inputs.other_taxable_income !== undefined ? Number(inputs.other_taxable_income) : undefined,
    pension_contributions_gross: inputs.pension_contributions_gross !== undefined ? Number(inputs.pension_contributions_gross) : undefined,
    gift_aid_net: inputs.gift_aid_net !== undefined ? Number(inputs.gift_aid_net) : undefined,
    children_count: Number(inputs.children_count)
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};

/** PEN-011 FIRE Calculator */
export const pen011Handler: CalculatorHandler = (inputs) => {
  const r = calculateFire({
    current_age: Number(inputs.current_age),
    annual_net_income: Number(inputs.annual_net_income),
    current_annual_spending: Number(inputs.current_annual_spending),
    current_invested_assets: inputs.current_invested_assets !== undefined ? Number(inputs.current_invested_assets) : undefined,
    desired_retirement_spending: Number(inputs.desired_retirement_spending),
    safe_withdrawal_rate: inputs.safe_withdrawal_rate !== undefined ? Number(inputs.safe_withdrawal_rate) : undefined,
    investment_return_rate: inputs.investment_return_rate !== undefined ? Number(inputs.investment_return_rate) : undefined
  });
  return { outputs: r as unknown as Record<string, number | string | null> };
};
