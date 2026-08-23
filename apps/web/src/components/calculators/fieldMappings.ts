/**
 * Field definitions for every Wave 1 calculator.
 *
 * Pure data - no React, no engine imports - so the E2E parity harness can
 * import the exact definitions the UI renders (see fieldTypes.ts).
 */
import type { CalculatorConfig, FieldDef } from "./fieldTypes";
import { wave2Mappings } from "./wave2FieldMappings";

// --- Shared option lists for the UK Tax & Salary family --------------------
// Statutory rates and thresholds are NEVER listed here; these are only the
// labels users pick between. The engine and the versioned ruleset own all
// numeric tax semantics.

export const INCOME_FREQUENCY_OPTIONS = [
  { label: "Annual", value: "annual" },
  { label: "Monthly", value: "monthly" },
  { label: "Weekly", value: "weekly" },
  { label: "Hourly", value: "hourly" }
];

export const PAYROLL_FREQUENCY_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Weekly", value: "weekly" }
];

export const JURISDICTION_OPTIONS = [
  { label: "England/Wales/NI", value: "England/Wales/NI" },
  { label: "Scotland", value: "Scotland" }
];

export const PENSION_ARRANGEMENT_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Salary sacrifice", value: "salary_sacrifice" },
  { label: "Net pay arrangement", value: "net_pay" },
  { label: "Relief at source", value: "relief_at_source" }
];

export const STUDENT_PLAN_OPTIONS = [
  { label: "None", value: "None" },
  { label: "Plan 1", value: "Plan 1" },
  { label: "Plan 2", value: "Plan 2" },
  { label: "Plan 4", value: "Plan 4" },
  { label: "Plan 5", value: "Plan 5" }
];

export const REPAYMENT_PLAN_OPTIONS = [
  ...STUDENT_PLAN_OPTIONS.filter(o => o.value !== "None"),
  { label: "Postgraduate", value: "Postgraduate" }
];

/**
 * Tax codes offered in the dropdown. The engine resolves each code against the
 * versioned ruleset - these are only the choices, never the rates.
 */
export const TAX_CODE_OPTIONS = [
  { label: "1257L - standard", value: "1257L" },
  { label: "BR - all at basic rate", value: "BR" },
  { label: "D0 - all at higher rate", value: "D0" },
  { label: "D1 - all at additional rate", value: "D1" },
  { label: "0T - no Personal Allowance", value: "0T" },
  { label: "NT - no tax deducted", value: "NT" },
  { label: "C1257L - Welsh standard", value: "C1257L" },
  { label: "CBR - Welsh basic rate", value: "CBR" },
  { label: "CD0 - Welsh higher rate", value: "CD0" },
  { label: "CD1 - Welsh additional rate", value: "CD1" },
  { label: "C0T - Welsh, no allowance", value: "C0T" },
  { label: "S1257L - Scottish standard", value: "S1257L" },
  { label: "SBR - Scottish basic rate", value: "SBR" },
  { label: "SD0 - Scottish intermediate rate", value: "SD0" },
  { label: "SD1 - Scottish higher rate", value: "SD1" },
  { label: "SD2 - Scottish advanced rate", value: "SD2" },
  { label: "SD3 - Scottish top rate", value: "SD3" },
  { label: "Other / custom code", value: "custom" }
];

/**
 * Working-pattern assumptions. Shown only while the user is entering an hourly
 * rate, because that is the only mode where they are required inputs - but
 * always visible in that mode, never applied as an invisible constant.
 */
export const WORKING_PATTERN_FIELDS = (frequencyField: string): FieldDef[] => [
  {
    name: "hours_per_week",
    label: "Hours per week",
    type: "number",
    defaultValue: 37.5,
    group: "Working pattern",
    showWhen: { field: frequencyField, equals: ["hourly"] },
    helperText: "Assumes these hours stay representative. Overtime and irregular shifts are not modelled."
  },
  {
    name: "paid_weeks_per_year",
    label: "Paid weeks per year",
    type: "number",
    defaultValue: 52,
    group: "Working pattern",
    showWhen: { field: frequencyField, equals: ["hourly"] }
  }
];

const wave1Mappings: Record<string, FieldDef[]> = {
  "AUT-006": [
    { name: "distance_miles", label: "Distance Miles", type: "number", defaultValue: 100 },
    { name: "mpg_uk", label: "Mpg Uk", type: "number", defaultValue: 40 },
    { name: "price_p_per_litre", label: "Price P Per Litre", type: "number", defaultValue: 150 },
    { name: "trips", label: "Trips", type: "number", defaultValue: 1 },
  ],
  "BUS-001": [
    { name: "cost", label: "Cost", type: "number", defaultValue: 60 },
    { name: "price", label: "Price", type: "number", defaultValue: "" },
    { name: "target_margin", label: "Target Margin", type: "number", defaultValue: "", scale: 0.01 },
  ],
  "BUS-006": [
    { name: "fixed", label: "Fixed", type: "number", defaultValue: 10000 },
    { name: "price", label: "Price", type: "number", defaultValue: 50 },
    { name: "variable", label: "Variable", type: "number", defaultValue: 30 },
  ],
  "BUS-008": [
    { name: "original", label: "Original", type: "number", defaultValue: 100 },
    { name: "discount", label: "discount (%)", type: "number", defaultValue: "", scale: 0.01 },
    { name: "sale_price", label: "Sale Price", type: "number", defaultValue: "" },
  ],
  "CON-001": [
    { name: "value", label: "Value", type: "number", defaultValue: 10 },
    { name: "from", label: "From", type: "text", defaultValue: "km" },
    { name: "to", label: "To", type: "text", defaultValue: "miles" },
  ],
  "CON-010": [
    { name: "amount", label: "Amount", type: "number", defaultValue: 100 },
    { name: "rate", label: "Rate", type: "number", defaultValue: 1.25 },
    { name: "from", label: "From", type: "text", defaultValue: "GBP" },
    { name: "to", label: "To", type: "text", defaultValue: "USD" },
  ],
  "DAT-001": [
    { name: "dob", label: "Dob", type: "text", defaultValue: "1990-01-01" },
    { name: "reference", label: "Reference", type: "text", defaultValue: "2026-08-22" },
  ],
  "FIN-001": [
    { name: "principal", label: "Principal", type: "number", defaultValue: 10000 },
    { name: "annual_rate", label: "annual_rate (%)", type: "number", defaultValue: 6 },
    { name: "years", label: "Years", type: "number", defaultValue: 5 },
  ],
  "FIN-002": [
    { name: "cash_received", label: "Cash Received", type: "number", defaultValue: 8000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 7.5 },
    { name: "years", label: "Years", type: "number", defaultValue: 4 },
    { name: "fee", label: "Fee", type: "number", defaultValue: 0 },
    { name: "fee_financed", label: "Fee Financed", type: "select", defaultValue: "true", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
  ],
  "FIN-006": [
    { name: "periodic_rate", label: "periodic_rate (%)", type: "number", defaultValue: 0.5, scale: 0.01 },
    { name: "periods", label: "Periods", type: "number", defaultValue: 12 },
  ],
  "FIN-009": [
    { name: "balance", label: "Balance", type: "number", defaultValue: 3000 },
    { name: "apr", label: "apr (%)", type: "number", defaultValue: 24.9, scale: 0.01 },
    { name: "monthly_payment", label: "Monthly Payment", type: "number", defaultValue: 150 },
  ],
  "FIN-011": [
    { name: "debts", label: "Debts", type: "text", defaultValue: "[{\"balance\":1000,\"apr\":0.2,\"min_payment\":50},{\"balance\":2000,\"apr\":0.1,\"min_payment\":60}]" },
    { name: "extra", label: "Extra", type: "number", defaultValue: 100 },
    { name: "strategy", label: "Strategy", type: "text", defaultValue: "avalanche" },
  ],
  "FIN-013": [
    { name: "income", label: "Income", type: "number", defaultValue: 3000 },
    { name: "fixed", label: "Fixed", type: "number", defaultValue: 1500 },
    { name: "variable", label: "Variable", type: "number", defaultValue: 800 },
    { name: "savings", label: "Savings", type: "number", defaultValue: 300 },
  ],
  "HLT-001": [
    { name: "weight_kg", label: "Weight Kg", type: "number", defaultValue: 70 },
    { name: "height_m", label: "Height M", type: "number", defaultValue: 1.75 },
  ],
  "INV-001": [
    { name: "start", label: "Start", type: "number", defaultValue: 10000 },
    { name: "monthly", label: "Monthly", type: "number", defaultValue: 500 },
    { name: "return", label: "return (%)", type: "number", defaultValue: 6, scale: 0.01 },
    { name: "fee", label: "Fee", type: "number", defaultValue: 0.0025 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 },
  ],
  "INV-002": [
    { name: "P", label: "P", type: "number", defaultValue: 10000 },
    { name: "nominal_rate", label: "nominal_rate (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "m", label: "M", type: "number", defaultValue: 12 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
  ],
  "INV-003": [
    { name: "P", label: "P", type: "number", defaultValue: 10000 },
    { name: "r", label: "R", type: "number", defaultValue: 0.05 },
    { name: "t", label: "T", type: "number", defaultValue: 3 },
  ],
  "INV-006": [
    { name: "pv", label: "Pv", type: "number", defaultValue: 10000 },
    { name: "r", label: "R", type: "number", defaultValue: 0.05 },
    { name: "n", label: "N", type: "number", defaultValue: 10 },
  ],
  "INV-007": [
    { name: "fv", label: "Fv", type: "number", defaultValue: 20000 },
    { name: "r", label: "R", type: "number", defaultValue: 0.05 },
    { name: "n", label: "N", type: "number", defaultValue: 10 },
  ],
  "INV-008": [
    { name: "cost", label: "Cost", type: "number", defaultValue: 10000 },
    { name: "end", label: "End", type: "number", defaultValue: 12000 },
    { name: "income", label: "Income", type: "number", defaultValue: 0 },
  ],
  "INV-009": [
    { name: "start", label: "Start", type: "number", defaultValue: 10000 },
    { name: "end", label: "End", type: "number", defaultValue: 15000 },
    { name: "years", label: "Years", type: "number", defaultValue: 5 },
  ],
  "INV-011": [
    { name: "cashflows", label: "Cashflows", type: "text", defaultValue: "[-10000,3000,4000,5000]" },
  ],
  "INV-014": [
    { name: "start", label: "Start", type: "number", defaultValue: 100000 },
    { name: "monthly", label: "Monthly", type: "number", defaultValue: 0 },
    { name: "gross_return", label: "gross_return (%)", type: "number", defaultValue: 7.000000000000001, scale: 0.01 },
    { name: "fee", label: "Fee", type: "number", defaultValue: 0.01 },
    { name: "years", label: "Years", type: "number", defaultValue: 25 },
  ],
  "INV-015": [
    { name: "nominal", label: "Nominal", type: "number", defaultValue: 0.06 },
    { name: "inflation", label: "inflation (%)", type: "number", defaultValue: 2.5, scale: 0.01 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
    { name: "future_amount", label: "Future Amount", type: "number", defaultValue: 100000 },
  ],
  "ISA-001": [
    { name: "start", label: "Start", type: "number", defaultValue: 10000 },
    { name: "annual_subscription", label: "Annual Subscription", type: "number", defaultValue: 12000 },
    { name: "return", label: "return (%)", type: "number", defaultValue: 6, scale: 0.01 },
    { name: "fee", label: "Fee", type: "number", defaultValue: 0.0025 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 },
  ],
  "ISA-002": [
    { name: "cash", label: "Cash", type: "number", defaultValue: 0 },
    { name: "stocks", label: "Stocks", type: "number", defaultValue: 15000 },
    { name: "innovative", label: "Innovative", type: "number", defaultValue: 0 },
    { name: "lisa", label: "Lisa", type: "number", defaultValue: 0 },
  ],
  "MAT-002": [
    { name: "expression", label: "Expression", type: "text", defaultValue: "2+3*4" },
    { name: "angle", label: "Angle", type: "text", defaultValue: "" },
  ],
  "MAT-003": [
    { name: "mode", label: "Mode", type: "text", defaultValue: "percent_of" },
    { name: "pct", label: "Pct", type: "number", defaultValue: 20 },
    { name: "value", label: "Value", type: "number", defaultValue: 50 },
      { name: "a", label: "A", type: "number", defaultValue: 10 },
      { name: "b", label: "B", type: "number", defaultValue: 20 },
      { name: "old", label: "Old", type: "number", defaultValue: 10 },
      { name: "new", label: "New", type: "number", defaultValue: 20 },
  ],
  "MAT-005": [
    { name: "a", label: "A", type: "number", defaultValue: 12 },
    { name: "b", label: "B", type: "number", defaultValue: 18 },
    { name: "c", label: "C", type: "number", defaultValue: "" },
    { name: "d", label: "D", type: "number", defaultValue: "" },
    { name: "scale", label: "Scale", type: "number", defaultValue: "" },
  ],
  "MAT-006": [
    { name: "a", label: "A", type: "text", defaultValue: "1/2" },
    { name: "b", label: "B", type: "text", defaultValue: "1/3" },
    { name: "op", label: "Op", type: "text", defaultValue: "+" },
  ],
  "PEN-001": [
    { name: "current_pot", label: "Current Pot", type: "number", defaultValue: 50000 },
    { name: "member_monthly", label: "Member Monthly", type: "number", defaultValue: 300 },
    { name: "employer_monthly", label: "Employer Monthly", type: "number", defaultValue: 200 },
    { name: "return", label: "return (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "fee", label: "Fee", type: "number", defaultValue: 0.005 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 },
  ],
  "PEN-002": [
    { name: "pot", label: "Pot", type: "number", defaultValue: 20000 },
    { name: "net_monthly", label: "Net Monthly", type: "number", defaultValue: 400 },
    { name: "marginal_rate", label: "marginal_rate (%)", type: "number", defaultValue: 40, scale: 0.01 },
    { name: "return", label: "return (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "fee", label: "Fee", type: "number", defaultValue: 0.005 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 },
  ],
  "PEN-003": [
    { name: "annual_pay", label: "Annual Pay", type: "number", defaultValue: 35000 },
    { name: "employer_rate", label: "employer_rate (%)", type: "number", defaultValue: 3, scale: 0.01 },
    { name: "employee_rate", label: "employee_rate (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "current_pot", label: "Current Pot", type: "number", defaultValue: 0 },
    { name: "return", label: "return (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "years", label: "Years", type: "number", defaultValue: 25 },
  ],
  "PEN-006": [
    { name: "age", label: "Age", type: "number", defaultValue: 40 },
    { name: "retirement_age", label: "Retirement Age", type: "number", defaultValue: 67 },
    { name: "pot", label: "Pot", type: "number", defaultValue: 80000 },
    { name: "monthly_contribution", label: "Monthly Contribution", type: "number", defaultValue: 500 },
    { name: "return", label: "return (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "inflation", label: "inflation (%)", type: "number", defaultValue: 2.5, scale: 0.01 },
    { name: "target_today", label: "Target Today", type: "number", defaultValue: 30000 },
    { name: "withdrawal_rate", label: "withdrawal_rate (%)", type: "number", defaultValue: 4, scale: 0.01 },
  ],
  "PRO-001": [
    { name: "price", label: "Price", type: "number", defaultValue: 300000 },
    { name: "deposit", label: "Deposit", type: "number", defaultValue: 60000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Years", type: "number", defaultValue: 25 },
    { name: "type", label: "Type", type: "text", defaultValue: "repayment" },
  ],
  "PRO-002": [
    { name: "income", label: "Income", type: "number", defaultValue: 60000 },
    { name: "deposit", label: "Deposit", type: "number", defaultValue: 50000 },
    { name: "stress_rate", label: "stress_rate (%)", type: "number", defaultValue: 6, scale: 0.01 },
    { name: "term", label: "Term", type: "number", defaultValue: 25 },
    { name: "multiple", label: "Multiple", type: "number", defaultValue: 4.5 },
    { name: "payment_ratio", label: "Payment Ratio", type: "number", defaultValue: 0.35 },
    { name: "monthly_debt", label: "Monthly Debt", type: "number", defaultValue: 0 },
  ],
  "PRO-003": [
    { name: "balance", label: "Balance", type: "number", defaultValue: 240000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Years", type: "number", defaultValue: 25 },
    { name: "months_elapsed", label: "Months Elapsed", type: "number", defaultValue: 12 },
  ],
  "PRO-004": [
    { name: "balance", label: "Balance", type: "number", defaultValue: 200000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 },
    { name: "monthly_overpayment", label: "Monthly Overpayment", type: "number", defaultValue: 200 },
    { name: "lump_sum", label: "Lump Sum", type: "number", defaultValue: 0 },
    { name: "lump_month", label: "Lump Month", type: "number", defaultValue: 1 },
  ],
  "PRO-010": [
    { name: "value", label: "Value", type: "number", defaultValue: 300000 },
    { name: "loan", label: "Loan", type: "number", defaultValue: 225000 },
  ],
  "PRO-011": [
    { name: "price", label: "Price", type: "number", defaultValue: 300000 },
    { name: "target_ltv", label: "Target Ltv", type: "number", defaultValue: "" },
    { name: "mortgage", label: "Mortgage", type: "number", defaultValue: "" },
  ],
  "PRO-016": [
    { name: "price", label: "Price", type: "number", defaultValue: 250000 },
    { name: "monthly_rent", label: "Monthly Rent", type: "number", defaultValue: 1300 },
    { name: "vacancy", label: "Vacancy", type: "number", defaultValue: 0.05 },
    { name: "annual_costs", label: "Annual Costs", type: "number", defaultValue: 2500 },
    { name: "extra_basis", label: "Extra Basis", type: "number", defaultValue: 0 },
  ],
  "PRO-018": [
    { name: "price", label: "Price", type: "number", defaultValue: 250000 },
    { name: "deposit", label: "Deposit", type: "number", defaultValue: 75000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5, scale: 0.01 },
    { name: "term", label: "Term", type: "number", defaultValue: 25 },
    { name: "rent", label: "Rent", type: "number", defaultValue: 1300 },
    { name: "vacancy", label: "Vacancy", type: "number", defaultValue: 0.05 },
    { name: "costs", label: "Costs", type: "number", defaultValue: 3000 },
    { name: "repayment", label: "Repayment", type: "select", defaultValue: "false", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
    { name: "additional_property", label: "Additional Property", type: "select", defaultValue: "true", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
  ],
  "PRO-019": [
    { name: "price", label: "Price", type: "number", defaultValue: 250000 },
    { name: "deposit", label: "Deposit", type: "number", defaultValue: 75000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5, scale: 0.01 },
    { name: "term", label: "Term", type: "number", defaultValue: 25 },
    { name: "rent", label: "Rent", type: "number", defaultValue: 1300 },
    { name: "vacancy", label: "Vacancy", type: "number", defaultValue: 0.05 },
    { name: "costs", label: "Costs", type: "number", defaultValue: 3000 },
    { name: "growth", label: "Growth", type: "number", defaultValue: 0.03 },
    { name: "holding_years", label: "Holding Years", type: "number", defaultValue: 10 },
  ],
  "PRO-023": [
    { name: "price", label: "Price", type: "number", defaultValue: 300000 },
    { name: "first_time", label: "First Time", type: "select", defaultValue: "false", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
    { name: "additional", label: "Additional", type: "select", defaultValue: "false", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
    { name: "nonresident", label: "Nonresident", type: "select", defaultValue: "false", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
  ],
  "STA-001": [
    { name: "values", label: "Values", type: "text", defaultValue: "[1,2,2,4,6]" },
  ],
  "STA-003": [
    { name: "values", label: "Values", type: "text", defaultValue: "[2,4,4,4,5,5,7,9]" },
    { name: "definition", label: "Definition", type: "text", defaultValue: "population" },
  ],
  "STA-006": [
    { name: "mean", label: "Mean", type: "number", defaultValue: 100 },
    { name: "sd", label: "Sd", type: "number", defaultValue: 15 },
    { name: "n", label: "N", type: "number", defaultValue: 100 },
    { name: "confidence", label: "Confidence", type: "number", defaultValue: 0.95 },
  ],
  "STA-008": [
    { name: "confidence", label: "Confidence", type: "number", defaultValue: 0.95 },
    { name: "margin", label: "margin (%)", type: "number", defaultValue: 5, scale: 0.01 },
    { name: "p", label: "P", type: "number", defaultValue: 0.5 },
    { name: "population", label: "Population", type: "number", defaultValue: "" },
  ],
  "STA-014": [
    { name: "x", label: "X", type: "text", defaultValue: "[1,2,3,4,5]" },
    { name: "y", label: "Y", type: "text", defaultValue: "[2,4,5,4,5]" },
  ],
  "TAX-001": [
    { name: "income", label: "Income (£)", type: "number", defaultValue: 10000, helperText: "Your gross income before tax, in the frequency you select below." },
    { name: "income_frequency", label: "Income frequency", type: "select", defaultValue: "annual", options: INCOME_FREQUENCY_OPTIONS },
    ...WORKING_PATTERN_FIELDS("income_frequency"),
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: JURISDICTION_OPTIONS },
  ],
  "TAX-002": [
    { name: "salary", label: "Pay amount (£)", type: "number", defaultValue: 40000, helperText: "Enter your pay once in any frequency and read the equivalents." },
    { name: "income_frequency", label: "Income frequency", type: "select", defaultValue: "annual", options: INCOME_FREQUENCY_OPTIONS },
    { name: "hours_week", label: "Hours per week", type: "number", defaultValue: 37.5, group: "Working pattern", helperText: "Used to work out hourly figures." },
    { name: "weeks", label: "Paid weeks per year", type: "number", defaultValue: 52, group: "Working pattern" },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: JURISDICTION_OPTIONS },
  ],
  "TAX-003": [
    { name: "gross", label: "Gross income (£)", type: "number", defaultValue: 32000, helperText: "Your pay before any deductions, in the frequency you select below." },
    { name: "income_frequency", label: "Income frequency", type: "select", defaultValue: "annual", options: INCOME_FREQUENCY_OPTIONS },
    { name: "payroll_frequency", label: "Payroll frequency", type: "select", defaultValue: "monthly", options: PAYROLL_FREQUENCY_OPTIONS, helperText: "How often you are actually paid. This can differ from how you entered your income." },
    { name: "hours_per_week", label: "Hours per week", type: "number", defaultValue: 37.5, group: "Working pattern", helperText: "Used for the hourly equivalent. Assumes these hours stay representative." },
    { name: "paid_weeks_per_year", label: "Paid weeks per year", type: "number", defaultValue: 52, group: "Working pattern" },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: JURISDICTION_OPTIONS, group: "Tax details" },
    { name: "tax_code", label: "Tax code", type: "select", defaultValue: "1257L", options: TAX_CODE_OPTIONS, group: "Tax details", helperText: "1257L is the standard code for most people with one job or pension. Welsh taxpayers use the C-prefixed codes.", defaultByField: { field: "jurisdiction", map: { "England/Wales/NI": "1257L", "Scotland": "S1257L" }, onlyIfCurrentIn: ["1257L", "C1257L", "S1257L"] } },
    { name: "tax_code_custom", label: "Custom tax code", type: "text", defaultValue: "", group: "Tax details", showWhen: { field: "tax_code", equals: ["custom"] }, helperText: "Enter a code such as 1100L. K codes and Week 1/Month 1 codes are not supported by this annual estimate." },
    { name: "pension_arrangement", label: "Pension arrangement", type: "select", defaultValue: "none", options: PENSION_ARRANGEMENT_OPTIONS, group: "Pension" },
    { name: "pension_pct", label: "Pension contribution (%)", type: "number", defaultValue: 0, scale: 0.01, group: "Pension", helperText: "Enter 5 for 5%.", showWhen: { field: "pension_arrangement", equals: ["salary_sacrifice", "net_pay", "relief_at_source"] } },
    { name: "employer_pension_pct", label: "Employer contribution (%)", type: "number", defaultValue: 0, scale: 0.01, group: "Pension", helperText: "Enter 3 for 3%. This is not deducted from your take-home pay." },
    { name: "student_plan", label: "Student loan plan", type: "select", defaultValue: "None", options: STUDENT_PLAN_OPTIONS, group: "Student loans" },
    { name: "postgraduate", label: "Postgraduate loan", type: "select", defaultValue: "false", group: "Student loans", options: [{ label: "No", value: "false" }, { label: "Yes", value: "true" }] },
  ],
  "TAX-004": [
    { name: "earnings", label: "Earnings (£)", type: "number", defaultValue: 12000, helperText: "Your gross earnings, in the frequency you select below." },
    { name: "income_frequency", label: "Income frequency", type: "select", defaultValue: "annual", options: INCOME_FREQUENCY_OPTIONS },
    { name: "payroll_frequency", label: "Payroll frequency", type: "select", defaultValue: "monthly", options: PAYROLL_FREQUENCY_OPTIONS },
    ...WORKING_PATTERN_FIELDS("income_frequency"),
  ],
  "TAX-015": [
    { name: "amount", label: "Amount", type: "number", defaultValue: 100 },
    { name: "direction", label: "Direction", type: "text", defaultValue: "add" },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 20, scale: 0.01 },
  ],
  "TAX-020": [
    { name: "income", label: "Income (£)", type: "number", defaultValue: 33000, helperText: "Your gross income, in the frequency you select below." },
    { name: "income_frequency", label: "Income frequency", type: "select", defaultValue: "annual", options: INCOME_FREQUENCY_OPTIONS },
    { name: "payroll_frequency", label: "Payroll frequency", type: "select", defaultValue: "monthly", options: PAYROLL_FREQUENCY_OPTIONS },
    ...WORKING_PATTERN_FIELDS("income_frequency"),
    { name: "plan", label: "Repayment plan", type: "select", defaultValue: "Plan 1", options: REPAYMENT_PLAN_OPTIONS },
  ],
};

/** Every wave's field definitions, keyed by calculator id. */
export const mappings: Record<string, FieldDef[]> = { ...wave1Mappings, ...wave2Mappings };

/**
 * Prominent periodic result cards, and which output keys are prose rather than
 * numbers. Keyed by calculator id; calculators without an entry keep the plain
 * list of result rows.
 */
export const calculatorResultConfig: Record<string, CalculatorConfig["primaryResult"]> = {
  "TAX-002": {
    title: "Gross pay",
    rows: [
      { label: "Yearly", key: "gross_annual" },
      { label: "Monthly", key: "gross_monthly" },
      { label: "Weekly", key: "gross_weekly" },
      { label: "Hourly", key: "gross_hourly" }
    ],
    note: "Weekly and hourly figures use the working pattern you entered above."
  },
  "TAX-003": {
    title: "Net take-home pay",
    rows: [
      { label: "Yearly", key: "net_yearly" },
      { label: "Monthly", key: "net_monthly" },
      { label: "Weekly", key: "net_weekly" },
      { label: "Estimated net hourly equivalent", key: "net_hourly_equivalent" }
    ],
    note: "Based on your entered working hours and paid weeks."
  },
  "TAX-004": {
    title: "National Insurance",
    rows: [
      { label: "Yearly", key: "ni_yearly" },
      { label: "Monthly", key: "ni_monthly" },
      { label: "Weekly", key: "ni_weekly" }
    ]
  },
  "TAX-020": {
    title: "Estimated repayment",
    rows: [
      { label: "Yearly", key: "repayment_yearly" },
      { label: "Monthly", key: "repayment_monthly" },
      { label: "Weekly", key: "repayment_weekly" }
    ]
  },
  "TAX-001": {
    title: "Income Tax",
    rows: [
      { label: "Yearly", key: "tax_yearly" },
      { label: "Monthly", key: "tax_monthly" },
      { label: "Weekly", key: "tax_weekly" }
    ]
  }
};

/** Output keys that are explanatory prose, rendered as notes not value rows. */
export const NOTE_OUTPUT_KEYS = [
  "estimation_basis",
  "calculation_basis",
  "tax_code_explanation",
  "tax_code_note",
  "jurisdiction_note",
  "first_time_buyer_note",
  "icr_basis",
  "sdlt_basis",
  "leap_day_convention"
];
