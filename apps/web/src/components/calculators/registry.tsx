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
  "INV-002": [
    { name: "principal", label: "Initial Investment (£)", type: "number", defaultValue: 1000 },
    { name: "rate", label: "Annual Interest Rate (%)", type: "number", defaultValue: 5 },
    { name: "years", label: "Investment Term (Years)", type: "number", defaultValue: 10 },
    { name: "compounding_frequency", label: "Compounding Frequency", type: "select", options: [
      {label: "Annually", value: "1"},
      {label: "Quarterly", value: "4"},
      {label: "Monthly", value: "12"}
    ], defaultValue: "1" }
  ]
};

export function getCalculatorComponent(id: string) {
  const fields = mappings[id];
  if (!fields) return null;
  return <DynamicCalculator calculatorId={id} fields={fields} />;
}
