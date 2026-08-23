import { DynamicCalculator, FieldDef } from "./DynamicCalculator";

const mappings: Record<string, FieldDef[]> = {
  "AUT-006": [
    { name: "distance_miles", label: "Distance Miles", type: "number", defaultValue: 100 },
    { name: "mpg_uk", label: "Mpg Uk", type: "number", defaultValue: 40 },
    { name: "price_p_per_litre", label: "Price P Per Litre", type: "number", defaultValue: 150 },
    { name: "trips", label: "Trips", type: "number", defaultValue: 1 },
  ],
  "BUS-001": [
    { name: "cost", label: "Cost", type: "number", defaultValue: 60 },
    { name: "price", label: "Price", type: "number", defaultValue: 100 },
  ],
  "BUS-006": [
    { name: "fixed", label: "Fixed", type: "number", defaultValue: 10000 },
    { name: "price", label: "Price", type: "number", defaultValue: 50 },
    { name: "variable", label: "Variable", type: "number", defaultValue: 30 },
  ],
  "BUS-008": [
    { name: "original", label: "Original", type: "number", defaultValue: 100 },
    { name: "discount", label: "discount (%)", type: "number", defaultValue: 20, scale: 0.01 },
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
    { name: "annual_rate", label: "annual_rate (%)", type: "number", defaultValue: 6, scale: 0.01 },
    { name: "years", label: "Years", type: "number", defaultValue: 5 },
  ],
  "FIN-002": [
    { name: "cash_received", label: "Cash Received", type: "number", defaultValue: 8000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 7.5, scale: 0.01 },
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
  ],
  "MAT-003": [
    { name: "mode", label: "Mode", type: "text", defaultValue: "percent_of" },
    { name: "pct", label: "Pct", type: "number", defaultValue: 20 },
    { name: "value", label: "Value", type: "number", defaultValue: 50 },
  ],
  "MAT-005": [
    { name: "a", label: "A", type: "number", defaultValue: 12 },
    { name: "b", label: "B", type: "number", defaultValue: 18 },
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
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5, scale: 0.01 },
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
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5, scale: 0.01 },
    { name: "years", label: "Years", type: "number", defaultValue: 25 },
    { name: "months_elapsed", label: "Months Elapsed", type: "number", defaultValue: 12 },
  ],
  "PRO-004": [
    { name: "balance", label: "Balance", type: "number", defaultValue: 200000 },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 4.5, scale: 0.01 },
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
    { name: "target_ltv", label: "Target Ltv", type: "number", defaultValue: 0.8 },
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
  ],
  "STA-014": [
    { name: "x", label: "X", type: "text", defaultValue: "[1,2,3,4,5]" },
    { name: "y", label: "Y", type: "text", defaultValue: "[2,4,5,4,5]" },
  ],
  "TAX-001": [
    { name: "income", label: "Income", type: "number", defaultValue: 10000 },
    { name: "jurisdiction", label: "Jurisdiction", type: "text", defaultValue: "England/Wales/NI" },
  ],
  "TAX-002": [
    { name: "salary", label: "Salary", type: "number", defaultValue: 40000 },
    { name: "jurisdiction", label: "Jurisdiction", type: "text", defaultValue: "England/Wales/NI" },
    { name: "hours_week", label: "Hours Week", type: "number", defaultValue: 37.5 },
    { name: "weeks", label: "Weeks", type: "number", defaultValue: 52 },
  ],
  "TAX-003": [
    { name: "gross", label: "Gross", type: "number", defaultValue: 50000 },
    { name: "jurisdiction", label: "Jurisdiction", type: "text", defaultValue: "England/Wales/NI" },
    { name: "salary_sacrifice_pct", label: "Salary Sacrifice Pct", type: "number", defaultValue: 0.05 },
    { name: "student_plan", label: "Student Plan", type: "text", defaultValue: "None" },
    { name: "postgraduate", label: "Postgraduate", type: "select", defaultValue: "false", options: [{label: "True", value: "true"}, {label: "False", value: "false"}] },
  ],
  "TAX-004": [
    { name: "earnings", label: "Earnings", type: "number", defaultValue: 12000 },
  ],
  "TAX-015": [
    { name: "amount", label: "Amount", type: "number", defaultValue: 100 },
    { name: "direction", label: "Direction", type: "text", defaultValue: "add" },
    { name: "rate", label: "rate (%)", type: "number", defaultValue: 20, scale: 0.01 },
  ],
  "TAX-020": [
    { name: "income", label: "Income", type: "number", defaultValue: 33000 },
    { name: "plan", label: "Plan", type: "text", defaultValue: "Plan 1" },
  ],
};

export function getCalculatorComponent(id: string) {
  const fields = mappings[id];
  if (!fields) return null;
  return <DynamicCalculator calculatorId={id} fields={fields} />;
}
