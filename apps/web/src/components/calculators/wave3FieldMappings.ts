import type { FieldDef } from "./fieldTypes";

const YES_NO = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" }
];

const TAX_BANDS = [
  { label: "Basic rate (20%)", value: "basic" },
  { label: "Higher rate (40%)", value: "higher" },
  { label: "Additional rate (45%)", value: "additional" }
];

const RETIREMENT_TAX_BANDS = [
  { label: "Nil / Within Personal Allowance (0%)", value: "nil" },
  { label: "Basic rate (20%)", value: "basic" },
  { label: "Higher rate (40%)", value: "higher" }
];

export const wave3Mappings: Record<string, FieldDef[]> = {
  // PRO-008: Fixed vs Tracker Mortgage Calculator
  "PRO-008": [
    { name: "loan_amount", label: "Mortgage borrowing amount (£)", type: "number", defaultValue: 250000 },
    { name: "term_years", label: "Mortgage term (years)", type: "number", defaultValue: 25 },
    { name: "fixed_rate", label: "Fixed interest rate (%)", type: "number", defaultValue: 4.5, helperText: "Enter 4.5 for 4.5%." },
    { name: "fixed_fee", label: "Fixed product fee (£)", type: "number", defaultValue: 999 },
    { name: "tracker_margin", label: "Tracker margin over base rate (%)", type: "number", defaultValue: 0.75, helperText: "Lender margin added to base rate (e.g. 0.75%)." },
    { name: "current_base_rate", label: "Current Bank of England Base Rate (%)", type: "number", defaultValue: 3.75 },
    { name: "tracker_fee", label: "Tracker product fee (£)", type: "number", defaultValue: 0 },
    { name: "deal_years", label: "Comparison deal period (years)", type: "number", defaultValue: 2 },
    { name: "expected_rate_change", label: "Expected annual base rate change (%)", type: "number", defaultValue: -0.25, helperText: "Anticipated annual change in base rate during deal (e.g. -0.25% or +0.5%)." },
    { name: "fee_financed", label: "Add product fees to mortgage balance?", type: "select", defaultValue: "false", options: YES_NO }
  ],

  // PRO-028: Property Capital Gains Tax Calculator
  "PRO-028": [
    { name: "disposal_price", label: "Sale / Disposal price (£)", type: "number", defaultValue: 350000 },
    { name: "acquisition_price", label: "Original purchase price (£)", type: "number", defaultValue: 220000 },
    { name: "buying_costs", label: "Buying costs (£)", type: "number", defaultValue: 7500, helperText: "Stamp duty, legal, and conveyancing fees paid when bought." },
    { name: "selling_costs", label: "Selling costs (£)", type: "number", defaultValue: 4500, helperText: "Estate agency and legal fees on sale." },
    { name: "improvement_costs", label: "Capital improvements (£)", type: "number", defaultValue: 15000, helperText: "Structural alterations and enhancements (excluding repairs)." },
    { name: "total_ownership_months", label: "Total ownership period (months)", type: "number", defaultValue: 120 },
    { name: "months_as_main_residence", label: "Months lived in as your main home (months)", type: "number", defaultValue: 36 },
    { name: "taxable_income", label: "Other taxable income in tax year (£)", type: "number", defaultValue: 35000, helperText: "Salary, pension, trading, or rental income to determine CGT rate band." },
    { name: "joint_owners", label: "Number of joint owners", type: "number", defaultValue: 1, helperText: "Number of spouses / owners sharing the gain." },
    { name: "loss_brought_forward", label: "Capital losses brought forward (£)", type: "number", defaultValue: 0 }
  ],

  // INV-025: Portfolio Withdrawal Calculator
  "INV-025": [
    { name: "initial_balance", label: "Starting portfolio balance (£)", type: "number", defaultValue: 500000 },
    { name: "annual_withdrawal", label: "Initial annual withdrawal (£)", type: "number", defaultValue: 20000 },
    { name: "annual_return", label: "Expected investment return (% p.a.)", type: "number", defaultValue: 5.0 },
    { name: "inflation_rate", label: "Annual inflation rate (%)", type: "number", defaultValue: 2.5 },
    { name: "adjust_for_inflation", label: "Increase withdrawals with inflation?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "management_fee", label: "Total fees & charges (% p.a.)", type: "number", defaultValue: 0.5 },
    { name: "planning_years", label: "Planning horizon (years)", type: "number", defaultValue: 30 }
  ],

  // INV-026: Safe Withdrawal Rate Calculator
  "INV-026": [
    { name: "portfolio_value", label: "Total retirement pot value (£)", type: "number", defaultValue: 600000 },
    { name: "retirement_years", label: "Retirement duration (years)", type: "number", defaultValue: 30 },
    { name: "equity_allocation_pct", label: "Equity allocation (%)", type: "number", defaultValue: 60, helperText: "Remainder allocated to bonds / cash." },
    { name: "expected_equity_return", label: "Expected equity real return (% p.a.)", type: "number", defaultValue: 5.0, helperText: "Real return above inflation." },
    { name: "expected_bond_return", label: "Expected bond real return (% p.a.)", type: "number", defaultValue: 1.5, helperText: "Real return above inflation." },
    { name: "custom_withdrawal_pct", label: "Test withdrawal rate (%)", type: "number", defaultValue: 4.0 },
    { name: "use_guardrails", label: "Enable Guyton-Klinger dynamic guardrails?", type: "select", defaultValue: "false", options: YES_NO }
  ],

  // INV-027: Portfolio Rebalancing Calculator
  "INV-027": [
    { name: "assets_json", label: "Holdings & Target Weights (JSON)", type: "text", defaultValue: JSON.stringify([{"name":"Global Equities","current_value":65000,"target_pct":60},{"name":"UK Equities","current_value":15000,"target_pct":20},{"name":"Government Bonds","current_value":12000,"target_pct":15},{"name":"Cash","current_value":8000,"target_pct":5}]) },
    { name: "cash_flow", label: "Cash injection (+) or withdrawal (-) (£)", type: "number", defaultValue: 5000 },
    { name: "rebalance_mode", label: "Rebalancing strategy", type: "select", defaultValue: "full", options: [{ label: "Full Rebalance (Buy & Sell)", value: "full" }, { label: "Cash Only (Buy Underweight Assets Only)", value: "cash_only" }] }
  ],

  // INV-029: Monte Carlo Investment Simulator
  "INV-029": [
    { name: "initial_investment", label: "Initial investment (£)", type: "number", defaultValue: 100000 },
    { name: "annual_contribution", label: "Annual contribution / savings (£)", type: "number", defaultValue: 12000 },
    { name: "annual_withdrawal", label: "Annual retirement spending (£)", type: "number", defaultValue: 0 },
    { name: "expected_return_pct", label: "Expected mean return (% p.a.)", type: "number", defaultValue: 7.0 },
    { name: "volatility_pct", label: "Annual volatility / standard deviation (%)", type: "number", defaultValue: 15.0 },
    { name: "horizon_years", label: "Simulation timeframe (years)", type: "number", defaultValue: 20 },
    { name: "simulations_count", label: "Number of simulated paths", type: "number", defaultValue: 1000 },
    { name: "target_wealth", label: "Target wealth goal (£)", type: "number", defaultValue: 1000000 }
  ],

  // ISA-007: SIPP vs ISA Calculator
  "ISA-007": [
    { name: "monthly_contribution_net", label: "Monthly net contribution (£)", type: "number", defaultValue: 500, helperText: "Amount from take-home pay to save each month." },
    { name: "years_to_invest", label: "Years until retirement", type: "number", defaultValue: 25 },
    { name: "annual_growth_rate", label: "Expected annual investment return (%)", type: "number", defaultValue: 6.0 },
    { name: "current_tax_band", label: "Current income tax band", type: "select", defaultValue: "higher", options: TAX_BANDS },
    { name: "retirement_tax_band", label: "Expected retirement tax band", type: "select", defaultValue: "basic", options: RETIREMENT_TAX_BANDS },
    { name: "reinvest_tax_relief", label: "Reinvest tax refund into SIPP?", type: "select", defaultValue: "true", options: YES_NO }
  ],

  // TAX-013: General Investment Account Tax Calculator
  "TAX-013": [
    { name: "annual_dividends", label: "Annual dividend income (£)", type: "number", defaultValue: 2500 },
    { name: "realised_capital_gains", label: "Realised capital gains in year (£)", type: "number", defaultValue: 6000 },
    { name: "interest_income", label: "Interest distributions from bonds/cash (£)", type: "number", defaultValue: 800 },
    { name: "other_taxable_income", label: "Other taxable income (£)", type: "number", defaultValue: 55000, helperText: "Salary and other income to determine tax bracket." },
    { name: "capital_losses_brought_forward", label: "Capital losses brought forward (£)", type: "number", defaultValue: 0 }
  ],

  // TAX-019: High Income Child Benefit Charge Calculator
  "TAX-019": [
    { name: "gross_salary", label: "Gross annual salary (£)", type: "number", defaultValue: 68000 },
    { name: "other_taxable_income", label: "Other taxable income (£)", type: "number", defaultValue: 2000 },
    { name: "pension_contributions_gross", label: "Gross pension contributions (£)", type: "number", defaultValue: 4000, helperText: "Personal/workplace contributions that reduce Adjusted Net Income." },
    { name: "gift_aid_net", label: "Net Gift Aid charitable donations (£)", type: "number", defaultValue: 0 },
    { name: "children_count", label: "Number of qualifying children", type: "number", defaultValue: 2 }
  ],

  // PEN-011: FIRE Calculator
  "PEN-011": [
    { name: "current_age", label: "Current age", type: "number", defaultValue: 30 },
    { name: "annual_net_income", label: "Annual take-home pay (£)", type: "number", defaultValue: 45000 },
    { name: "current_annual_spending", label: "Current annual living expenses (£)", type: "number", defaultValue: 25000 },
    { name: "current_invested_assets", label: "Current invested net worth (£)", type: "number", defaultValue: 50000 },
    { name: "desired_retirement_spending", label: "Target annual spending in retirement (£)", type: "number", defaultValue: 30000 },
    { name: "safe_withdrawal_rate", label: "Safe withdrawal rate (%)", type: "number", defaultValue: 4.0 },
    { name: "investment_return_rate", label: "Expected real investment return (% p.a.)", type: "number", defaultValue: 5.0 }
  ]
};

export const wave3ResultConfig: Record<string, string> = {
  "PRO-008": "fixed_deal_total_cost",
  "PRO-028": "total_cgt_due",
  "INV-025": "final_balance",
  "INV-026": "recommended_annual_income",
  "INV-027": "total_buys_amount",
  "INV-029": "median_terminal_wealth",
  "ISA-007": "net_retirement_difference",
  "TAX-013": "total_gia_tax_due",
  "TAX-019": "hicbc_tax_charge",
  "PEN-011": "fire_number"
};
