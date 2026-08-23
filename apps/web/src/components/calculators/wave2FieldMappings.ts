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
  ]
};
