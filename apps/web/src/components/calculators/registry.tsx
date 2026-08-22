import { DynamicCalculator, FieldDef } from "./DynamicCalculator";

const mappings: Record<string, FieldDef[]> = {
  "FIN-001": [
    { name: "principal", label: "Loan Amount (£)", type: "number", defaultValue: 10000 },
    { name: "annual_rate", label: "Annual Interest Rate (%)", type: "number", defaultValue: 6 },
    { name: "years", label: "Loan Term (Years)", type: "number", defaultValue: 5 }
  ],
  "FIN-002": [
    { name: "principal", label: "Loan Amount (£)", type: "number", defaultValue: 5000 },
    { name: "annual_rate", label: "Annual Interest Rate (%)", type: "number", defaultValue: 5.5 },
    { name: "months", label: "Loan Term (Months)", type: "number", defaultValue: 36 },
    { name: "fee", label: "Upfront Fee (£)", type: "number", defaultValue: 0 }
  ],
  "PRO-001": [
    { name: "price", label: "Property Price (£)", type: "number", defaultValue: 300000 },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 60000 },
    { name: "rate", label: "Interest Rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Mortgage Term (Years)", type: "number", defaultValue: 25 },
    { name: "type", label: "Repayment Type", type: "select", options: [{label: "Repayment", value: "repayment"}, {label: "Interest Only", value: "interest_only"}], defaultValue: "repayment" }
  ],
  "PRO-003": [
    { name: "loan", label: "Mortgage Amount (£)", type: "number", defaultValue: 200000 },
    { name: "rate", label: "Interest Rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Mortgage Term (Years)", type: "number", defaultValue: 25 }
  ],
  "PRO-004": [
    { name: "loan", label: "Mortgage Amount (£)", type: "number", defaultValue: 200000 },
    { name: "rate", label: "Interest Rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Mortgage Term (Years)", type: "number", defaultValue: 25 },
    { name: "overpayment_monthly", label: "Monthly Overpayment (£)", type: "number", defaultValue: 200 },
    { name: "overpayment_lump_sum", label: "Lump Sum Overpayment (£)", type: "number", defaultValue: 0 }
  ],
  "INV-001": [
    { name: "start", label: "Initial Investment (£)", type: "number", defaultValue: 10000 },
    { name: "monthly", label: "Monthly Contribution (£)", type: "number", defaultValue: 500 },
    { name: "return", label: "Expected Annual Return (e.g. 0.06)", type: "number", defaultValue: 0.06 },
    { name: "fee", label: "Annual Platform/Fund Fee (e.g. 0.0025)", type: "number", defaultValue: 0 },
    { name: "years", label: "Investment Term (Years)", type: "number", defaultValue: 20 }
  ],
  "INV-002": [
    { name: "P", label: "Initial Investment (£)", type: "number", defaultValue: 1000 },
    { name: "nominal_rate", label: "Annual Interest Rate (e.g. 0.05)", type: "number", defaultValue: 0.05 },
    { name: "years", label: "Investment Term (Years)", type: "number", defaultValue: 10 },
    { name: "m", label: "Compounding Frequency", type: "select", options: [
      {label: "Annually", value: "1"},
      {label: "Quarterly", value: "4"},
      {label: "Monthly", value: "12"}
    ], defaultValue: "1" }
  ],
  "INV-003": [
    { name: "P", label: "Principal Amount (£)", type: "number", defaultValue: 1000 },
    { name: "r", label: "Interest Rate (e.g. 0.05)", type: "number", defaultValue: 0.05 },
    { name: "t", label: "Time (Years)", type: "number", defaultValue: 5 }
  ],
  "INV-006": [
    { name: "pv", label: "Present Value (£)", type: "number", defaultValue: 1000 },
    { name: "r", label: "Interest Rate (e.g. 0.05)", type: "number", defaultValue: 0.05 },
    { name: "n", label: "Number of Periods", type: "number", defaultValue: 10 }
  ],
  "INV-007": [
    { name: "fv", label: "Future Value (£)", type: "number", defaultValue: 10000 },
    { name: "r", label: "Discount Rate (e.g. 0.05)", type: "number", defaultValue: 0.05 },
    { name: "n", label: "Number of Periods", type: "number", defaultValue: 10 }
  ],
  "INV-008": [
    { name: "cost", label: "Initial Cost (£)", type: "number", defaultValue: 10000 },
    { name: "end", label: "Final Value (£)", type: "number", defaultValue: 12000 },
    { name: "income", label: "Additional Income/Dividends (£)", type: "number", defaultValue: 0 }
  ],
  "INV-009": [
    { name: "start", label: "Beginning Value (£)", type: "number", defaultValue: 10000 },
    { name: "end", label: "Ending Value (£)", type: "number", defaultValue: 20000 },
    { name: "years", label: "Number of Years", type: "number", defaultValue: 10 }
  ],
  "INV-011": [
    { name: "cashflows", label: "Cash Flows (JSON array)", type: "text", defaultValue: "[-1000, 1100]" }
  ],
  "INV-014": [
    { name: "start", label: "Initial Investment (£)", type: "number", defaultValue: 100000 },
    { name: "monthly", label: "Monthly Contribution (£)", type: "number", defaultValue: 0 },
    { name: "gross_return", label: "Gross Return (e.g. 0.07)", type: "number", defaultValue: 0.07 },
    { name: "fee", label: "Total Annual Fees (e.g. 0.01)", type: "number", defaultValue: 0.01 },
    { name: "years", label: "Investment Term (Years)", type: "number", defaultValue: 25 }
  ],
  "INV-015": [
    { name: "nominal", label: "Nominal Return (e.g. 0.06)", type: "number", defaultValue: 0.06 },
    { name: "inflation", label: "Inflation Rate (e.g. 0.025)", type: "number", defaultValue: 0.025 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
    { name: "future_amount", label: "Future Amount (£)", type: "number", defaultValue: 100000 }
  ],
  "STA-001": [
    { name: "values", label: "Dataset Values (comma separated)", type: "text", defaultValue: "1, 2, 3, 4, 5" }
  ],
  "STA-003": [
    { name: "values", label: "Dataset Values (comma separated)", type: "text", defaultValue: "2, 4, 4, 4, 5, 5, 7, 9" },
    { name: "definition", label: "Definition", type: "select", options: [
      {label: "Sample", value: "sample"},
      {label: "Population", value: "population"}
    ], defaultValue: "sample" }
  ],
  "STA-006": [
    { name: "mean", label: "Sample Mean", type: "number", defaultValue: 100 },
    { name: "sd", label: "Standard Deviation", type: "number", defaultValue: 15 },
    { name: "n", label: "Sample Size (n)", type: "number", defaultValue: 100 },
    { name: "confidence", label: "Confidence Level (e.g. 0.95)", type: "number", defaultValue: 0.95 }
  ],
  "STA-008": [
    { name: "confidence", label: "Confidence Level (e.g. 0.95)", type: "number", defaultValue: 0.95 },
    { name: "margin", label: "Margin of Error (e.g. 0.05)", type: "number", defaultValue: 0.05 },
    { name: "p", label: "Expected Proportion (0-1)", type: "number", defaultValue: 0.5 },
    { name: "population", label: "Population Size (optional)", type: "number" }
  ],
  "STA-014": [
    { name: "x", label: "X Values (comma separated)", type: "text", defaultValue: "1, 2, 3, 4, 5" },
    { name: "y", label: "Y Values (comma separated)", type: "text", defaultValue: "2, 4, 5, 4, 5" }
  ],
  "CON-010": [
    { name: "amount", label: "Amount", type: "number", defaultValue: 100 },
    { name: "from", label: "From Currency", type: "select", options: [
      {label: "GBP", value: "GBP"}, {label: "USD", value: "USD"}, {label: "EUR", value: "EUR"}, {label: "JPY", value: "JPY"}, {label: "AUD", value: "AUD"}
    ], defaultValue: "GBP" },
    { name: "to", label: "To Currency", type: "select", options: [
      {label: "GBP", value: "GBP"}, {label: "USD", value: "USD"}, {label: "EUR", value: "EUR"}, {label: "JPY", value: "JPY"}, {label: "AUD", value: "AUD"}
    ], defaultValue: "USD" }
  ]
};

export function getCalculatorComponent(id: string) {
  const fields = mappings[id];
  if (!fields) return null;
  return <DynamicCalculator calculatorId={id} fields={fields} />;
}
