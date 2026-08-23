/**
 * Wave 2 field definitions.
 *
 * PERCENTAGE CONVENTION
 * ---------------------
 * Users always type human percentages (7.5 meaning 7.5%). Wave 2 engines take
 * that percentage directly and divide by 100 once, inside the engine core, so
 * these fields carry no `scale`. Wave 1 instead normalised at the UI boundary
 * with `scale: 0.01`. Both normalise exactly once, which is what matters; the
 * Wave 2 arrangement keeps the single conversion in one place per engine and
 * makes the benchmark fixtures read in the same units the user types.
 */
import type { FieldDef } from "./fieldTypes";

const YES_NO = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" }
];

const PROPERTY_JURISDICTION = [
  { label: "England & Northern Ireland (SDLT)", value: "england_ni" },
  { label: "Scotland (LBTT)", value: "scotland" },
  { label: "Wales (LTT)", value: "wales" }
];

export const wave2Mappings: Record<string, FieldDef[]> = {
  // ------------------------------------------------- Finance & Debt --------
  "FIN-003": [
    { name: "amount", label: "Loan amount (£)", type: "number", defaultValue: 50000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 7.5, helperText: "Enter 7.5 for 7.5%." },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 5 },
    { name: "fee", label: "Arrangement fee (£)", type: "number", defaultValue: 0 },
    { name: "fee_financed", label: "Add the fee to the loan?", type: "select", defaultValue: "true", options: YES_NO, helperText: "Adding the fee to the loan means you pay interest on it." }
  ],
  "FIN-004": [
    { name: "amount", label: "Loan amount (£)", type: "number", defaultValue: 25000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 8.9, helperText: "Enter 8.9 for 8.9%." },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 10 },
    { name: "fee", label: "Arrangement fee (£)", type: "number", defaultValue: 0 },
    { name: "fee_financed", label: "Add the fee to the loan?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "property_value", label: "Property value (£)", type: "number", defaultValue: 350000, group: "Security" },
    { name: "existing_mortgage", label: "Existing mortgage balance (£)", type: "number", defaultValue: 180000, group: "Security" }
  ],
  "FIN-007": [
    { name: "principal", label: "Loan amount (£)", type: "number", defaultValue: 200000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5, helperText: "Enter 4.5 for 4.5%." },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 25 }
  ],
  "FIN-008": [
    { name: "gross_monthly_income", label: "Gross monthly income (£)", type: "number", defaultValue: 4000, helperText: "Your income before tax." },
    { name: "total_monthly_debt", label: "Total monthly debt payments (£)", type: "number", defaultValue: 600, helperText: "Include mortgage or rent, loans, cards and car finance." },
    { name: "housing_payment", label: "Of which housing (£)", type: "number", defaultValue: 400, helperText: "Used for the housing-only ratio. Leave blank to skip." }
  ],
  "FIN-010": [
    { name: "balance", label: "Card balance (£)", type: "number", defaultValue: 3000 },
    { name: "apr", label: "APR (%)", type: "number", defaultValue: 21.9, helperText: "Enter 21.9 for 21.9%." },
    { name: "monthly_payment", label: "Monthly payment (£)", type: "number", defaultValue: 150 },
    { name: "target_months", label: "Clear it within (months)", type: "number", defaultValue: "", helperText: "Optional. We work out the payment needed to hit this target." }
  ],
  "FIN-012": [
    { name: "debts", label: "Existing debts", type: "text", defaultValue: '[{"balance":3000,"apr":21.9,"monthly_payment":150},{"balance":5000,"apr":18.9,"monthly_payment":200}]', helperText: 'One entry per debt: balance, APR as a percentage, and monthly payment.' },
    { name: "consolidation_apr", label: "Consolidation loan APR (%)", type: "number", defaultValue: 9.9 },
    { name: "consolidation_years", label: "Consolidation term (years)", type: "number", defaultValue: 5 },
    { name: "fee", label: "Arrangement fee (£)", type: "number", defaultValue: 0 }
  ],
  "FIN-014": [
    { name: "monthly_essentials", label: "Monthly essential spending (£)", type: "number", defaultValue: 1800, helperText: "Rent or mortgage, bills, food, transport and other unavoidable costs." },
    { name: "months_of_cover", label: "Months of cover wanted", type: "number", defaultValue: 3 },
    { name: "current_savings", label: "Current savings (£)", type: "number", defaultValue: 1000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 250 }
  ],
  "FIN-015": [
    { name: "target", label: "Savings target (£)", type: "number", defaultValue: 30000 },
    { name: "months", label: "Months to save", type: "number", defaultValue: 60 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4, helperText: "Enter 4 for 4%." },
    { name: "starting_amount", label: "Starting amount (£)", type: "number", defaultValue: 0 }
  ],

  // ------------------------------------------- Mortgages & Property --------
  "PRO-005": [
    { name: "balance", label: "Outstanding balance (£)", type: "number", defaultValue: 180000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5 },
    { name: "remaining_years", label: "Remaining term (years)", type: "number", defaultValue: 20 },
    { name: "monthly_overpayment", label: "Monthly overpayment (£)", type: "number", defaultValue: 200, helperText: "Many lenders cap overpayments at 10% of the balance a year." }
  ],
  "PRO-006": [
    { name: "balance", label: "Outstanding balance (£)", type: "number", defaultValue: 200000 },
    { name: "current_rate", label: "Current rate (%)", type: "number", defaultValue: 5.5, group: "Current mortgage" },
    { name: "current_remaining_years", label: "Remaining term (years)", type: "number", defaultValue: 20, group: "Current mortgage" },
    { name: "new_rate", label: "New rate (%)", type: "number", defaultValue: 4.2, group: "New mortgage" },
    { name: "new_term_years", label: "New term (years)", type: "number", defaultValue: 20, group: "New mortgage" },
    { name: "fees", label: "Product and legal fees (£)", type: "number", defaultValue: 999, group: "New mortgage" }
  ],
  "PRO-007": [
    { name: "balance", label: "Mortgage balance (£)", type: "number", defaultValue: 200000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 25 }
  ],
  "PRO-009": [
    { name: "balance", label: "Mortgage balance (£)", type: "number", defaultValue: 200000 },
    { name: "current_rate", label: "Current rate (%)", type: "number", defaultValue: 4.5 },
    { name: "remaining_years", label: "Remaining term (years)", type: "number", defaultValue: 20 },
    { name: "rate_increase", label: "Rate rise to test (percentage points)", type: "number", defaultValue: 2, helperText: "Enter 2 to test a rise of two percentage points." },
    { name: "gross_monthly_income", label: "Gross monthly income (£)", type: "number", defaultValue: 4000, helperText: "Optional. Used to show the payment as a share of income." }
  ],
  "PRO-012": [
    { name: "property_value", label: "Property value (£)", type: "number", defaultValue: 350000 },
    { name: "mortgage_balance", label: "Mortgage balance (£)", type: "number", defaultValue: 180000 },
    { name: "max_ltv", label: "Maximum LTV (%)", type: "number", defaultValue: 85, helperText: "The highest loan-to-value you expect a lender to allow." }
  ],
  "PRO-014": [
    { name: "gross_monthly_income", label: "Gross monthly income (£)", type: "number", defaultValue: 3000 },
    { name: "income_multiple", label: "Income multiple required", type: "number", defaultValue: 30, helperText: "Agents commonly require annual income of 30x the monthly rent." },
    { name: "proposed_rent", label: "Proposed monthly rent (£)", type: "number", defaultValue: "", helperText: "Optional. Leave blank to see the maximum rent your income supports." },
    { name: "deposit_weeks", label: "Deposit (weeks of rent)", type: "number", defaultValue: 5, helperText: "Capped at five weeks in England where annual rent is under £50,000." }
  ],
  "PRO-015": [
    { name: "property_price", label: "Property price (£)", type: "number", defaultValue: 300000, group: "Buying" },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 60000, group: "Buying" },
    { name: "mortgage_rate", label: "Mortgage rate (%)", type: "number", defaultValue: 4.5, group: "Buying" },
    { name: "mortgage_years", label: "Mortgage term (years)", type: "number", defaultValue: 25, group: "Buying" },
    { name: "jurisdiction", label: "Where is the property?", type: "select", defaultValue: "england_ni", options: PROPERTY_JURISDICTION, group: "Buying" },
    { name: "first_time_buyer", label: "First-time buyer?", type: "select", defaultValue: "false", options: YES_NO, group: "Buying" },
    { name: "maintenance_pct", label: "Annual maintenance (% of value)", type: "number", defaultValue: 1, group: "Buying" },
    { name: "property_growth", label: "Annual property growth (%)", type: "number", defaultValue: 3, group: "Buying" },
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1200, group: "Renting" },
    { name: "rent_increase", label: "Annual rent increase (%)", type: "number", defaultValue: 2, group: "Renting" },
    { name: "investment_return", label: "Return on invested deposit (%)", type: "number", defaultValue: 5, group: "Renting", helperText: "If you rent, the deposit stays invested instead." },
    { name: "years_held", label: "Years to compare", type: "number", defaultValue: 10 }
  ],
  "PRO-017": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 250000 },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 75000 },
    { name: "jurisdiction", label: "Where is the property?", type: "select", defaultValue: "england_ni", options: PROPERTY_JURISDICTION },
    { name: "mortgage_rate", label: "Mortgage rate (%)", type: "number", defaultValue: 4.5, group: "Mortgage" },
    { name: "mortgage_years", label: "Mortgage term (years)", type: "number", defaultValue: 25, group: "Mortgage" },
    { name: "interest_only", label: "Interest-only?", type: "select", defaultValue: "true", options: YES_NO, group: "Mortgage" },
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1300, group: "Income and costs" },
    { name: "vacancy", label: "Vacancy allowance (%)", type: "number", defaultValue: 5, group: "Income and costs" },
    { name: "annual_costs", label: "Annual running costs (£)", type: "number", defaultValue: 3000, group: "Income and costs" },
    { name: "other_purchase_costs", label: "Other purchase costs (£)", type: "number", defaultValue: 2000, group: "Income and costs" }
  ],
  "PRO-020": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 250000, group: "Property" },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 62500, group: "Property" },
    { name: "jurisdiction", label: "Where is the property?", type: "select", defaultValue: "england_ni", options: PROPERTY_JURISDICTION, group: "Property" },
    { name: "other_purchase_costs", label: "Other purchase costs (£)", type: "number", defaultValue: 2000, group: "Property" },
    { name: "mortgage_rate", label: "Mortgage rate (%)", type: "number", defaultValue: 4.5, group: "Property" },
    { name: "mortgage_years", label: "Mortgage term (years)", type: "number", defaultValue: 25, group: "Property" },
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1200, group: "Property" },
    { name: "annual_costs", label: "Annual running costs (£)", type: "number", defaultValue: 3000, group: "Property" },
    { name: "property_growth", label: "Annual property growth (%)", type: "number", defaultValue: 3, group: "Property" },
    { name: "stock_return", label: "Annual stock market return (%)", type: "number", defaultValue: 7, group: "Stocks" },
    { name: "years", label: "Years to compare", type: "number", defaultValue: 10 }
  ],
  "PRO-021": [
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1300 },
    { name: "vacancy", label: "Vacancy allowance (%)", type: "number", defaultValue: 5 },
    { name: "annual_costs", label: "Annual running costs (£)", type: "number", defaultValue: 3000 },
    { name: "monthly_mortgage_payment", label: "Monthly mortgage payment (£)", type: "number", defaultValue: 700 },
    { name: "cash_invested", label: "Cash invested (£)", type: "number", defaultValue: 90000 }
  ],
  "PRO-022": [
    { name: "initial_value", label: "Property value today (£)", type: "number", defaultValue: 300000 },
    { name: "annual_growth", label: "Annual growth (%)", type: "number", defaultValue: 3 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
    { name: "inflation", label: "Annual inflation (%)", type: "number", defaultValue: 2.5, helperText: "Used to show the value in today's money." }
  ],
  "PRO-024": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 400000, helperText: "First-time buyer relief in England and Northern Ireland. Relief is unavailable above £500,000." }
  ],
  "PRO-025": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 250000, helperText: "Higher rates for additional dwellings in England and Northern Ireland." }
  ],
  "PRO-026": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 300000, helperText: "Land and Buildings Transaction Tax applies to property in Scotland." },
    { name: "first_time_buyer", label: "First-time buyer?", type: "select", defaultValue: "false", options: YES_NO },
    { name: "additional_property", label: "Additional dwelling?", type: "select", defaultValue: "false", options: YES_NO }
  ],
  "PRO-027": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 300000, helperText: "Land Transaction Tax applies to property in Wales." },
    { name: "additional_property", label: "Additional property?", type: "select", defaultValue: "false", options: YES_NO }
  ]
};
