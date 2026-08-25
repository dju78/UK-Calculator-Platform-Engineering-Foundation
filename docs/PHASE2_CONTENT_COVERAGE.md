# Phase 2 Content Coverage

Coverage of the forty priority calculators defined in
`docs/CALCULATOR_CONTENT_BACKFILL_PLAN.md`. Generated from the content package
itself rather than compiled by hand.

Every guide carries all eleven content elements the Phase 2 standard asks for:
a practical overview, what the calculator does, how the calculation works, a
formula and methodology explanation, a worked UK example, key assumptions,
limitations, the applicable ruleset where relevant, official sources, related
calculators and FAQs.

The worked-example column means more than that a section exists. Every figure
published in it is re-derived by running the real calculation engine with the
exact inputs the guide records. `tests/calculator-guides.test.ts` fails if any
published figure drifts, and re-runs each example three days later so that no
date-dependent output can be quoted as though it were fixed.

## Summary

| Measure | Result |
| --- | --- |
| Target calculators | 40 |
| Guides published | 40 / 40 |
| UK Tax & Salary | 10 / 10 |
| Mortgages & Property | 10 / 10 |
| Pensions & Retirement | 8 / 8 |
| Investing, Wealth & ISA | 7 / 7 |
| Health, Finance & Automotive | 5 / 5 |
| Worked examples, engine-verified | 40 / 40 |
| Methodology sections | 40 / 40 |
| Formula explanations | 40 / 40 |
| Assumption sections | 40 / 40 |
| Limitation sections | 40 / 40 |
| Related-calculator maps | 40 / 40 |
| FAQ sets | 40 (154 questions) |
| Official source citations | 109 (62 distinct URLs) |
| Guides marked VERIFIED | 19 |
| Guides marked SOURCE VERIFICATION REQUIRED | 3 |
| Guides marked NOT RULE-SENSITIVE | 18 |

## Per-calculator coverage

The numeric columns give the count of items in each section.

### Batch 1: UK Tax & Salary

| ID | Calculator | Guide | Worked example | Methodology | Assumptions | Limitations | Sources | FAQs | Related | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TAX-001 | UK Income Tax Calculator | Yes | Yes | Yes | 4 | 4 | 4 | 4 | 4 | VERIFIED |
| TAX-002 | UK Salary Calculator | Yes | Yes | Yes | 3 | 4 | 3 | 3 | 3 | VERIFIED |
| TAX-003 | Take-Home Pay Calculator | Yes | Yes | Yes | 3 | 4 | 4 | 4 | 4 | VERIFIED |
| TAX-004 | National Insurance Calculator | Yes | Yes | Yes | 2 | 5 | 2 | 4 | 3 | VERIFIED |
| TAX-005 | Salary Sacrifice Calculator | Yes | Yes | Yes | 2 | 4 | 3 | 4 | 3 | VERIFIED |
| TAX-011 | Dividend Tax Calculator | Yes | Yes | Yes | 3 | 4 | 3 | 4 | 3 | VERIFIED |
| TAX-013 | General Investment Account Tax Calculator | Yes | Yes | Yes | 3 | 5 | 4 | 4 | 3 | SOURCE VERIFICATION REQUIRED |
| TAX-015 | VAT Calculator | Yes | Yes | Yes | 2 | 4 | 2 | 3 | 2 | VERIFIED |
| TAX-019 | High Income Child Benefit Charge Calculator | Yes | Yes | Yes | 3 | 4 | 3 | 4 | 3 | SOURCE VERIFICATION REQUIRED |
| TAX-020 | Student Loan Repayment Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | VERIFIED |

### Batch 2: Mortgages & Property

| ID | Calculator | Guide | Worked example | Methodology | Assumptions | Limitations | Sources | FAQs | Related | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRO-001 | UK Mortgage Calculator | Yes | Yes | Yes | 3 | 4 | 2 | 3 | 4 | NOT RULE-SENSITIVE |
| PRO-002 | Mortgage Affordability Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | NOT RULE-SENSITIVE |
| PRO-003 | Mortgage Amortisation Calculator | Yes | Yes | Yes | 2 | 4 | 2 | 3 | 3 | NOT RULE-SENSITIVE |
| PRO-004 | Mortgage Overpayment Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | NOT RULE-SENSITIVE |
| PRO-008 | Fixed vs Tracker Mortgage Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | NOT RULE-SENSITIVE |
| PRO-010 | Loan-to-Value (LTV) Calculator | Yes | Yes | Yes | 2 | 4 | 2 | 3 | 3 | NOT RULE-SENSITIVE |
| PRO-018 | Buy-to-Let Calculator | Yes | Yes | Yes | 3 | 5 | 4 | 4 | 4 | SOURCE VERIFICATION REQUIRED |
| PRO-023 | Stamp Duty Land Tax Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | VERIFIED |
| PRO-026 | Scotland LBTT Calculator | Yes | Yes | Yes | 3 | 5 | 3 | 4 | 3 | VERIFIED |
| PRO-028 | Property Capital Gains Tax Calculator | Yes | Yes | Yes | 4 | 6 | 5 | 5 | 3 | VERIFIED |

### Batch 3: Pensions & Retirement

| ID | Calculator | Guide | Worked example | Methodology | Assumptions | Limitations | Sources | FAQs | Related | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PEN-001 | Pension Growth Calculator | Yes | Yes | Yes | 4 | 5 | 3 | 4 | 4 | VERIFIED |
| PEN-002 | SIPP Growth Calculator | Yes | Yes | Yes | 3 | 5 | 3 | 4 | 3 | VERIFIED |
| PEN-003 | Workplace Pension Calculator | Yes | Yes | Yes | 3 | 5 | 3 | 4 | 3 | VERIFIED |
| PEN-006 | Retirement Calculator | Yes | Yes | Yes | 4 | 5 | 3 | 4 | 3 | NOT RULE-SENSITIVE |
| PEN-007 | Retirement Income Calculator | Yes | Yes | Yes | 4 | 5 | 4 | 4 | 4 | VERIFIED |
| PEN-009 | Annuity Calculator | Yes | Yes | Yes | 3 | 6 | 3 | 4 | 3 | NOT RULE-SENSITIVE |
| PEN-011 | FIRE Calculator | Yes | Yes | Yes | 4 | 6 | 3 | 4 | 4 | NOT RULE-SENSITIVE |
| PEN-012 | Retirement Target Calculator | Yes | Yes | Yes | 3 | 5 | 3 | 4 | 4 | VERIFIED |

### Batch 4: Investing, Wealth & ISA

| ID | Calculator | Guide | Worked example | Methodology | Assumptions | Limitations | Sources | FAQs | Related | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ISA-001 | Stocks & Shares ISA Growth Calculator | Yes | Yes | Yes | 3 | 5 | 3 | 4 | 4 | VERIFIED |
| ISA-002 | ISA Allowance Calculator | Yes | Yes | Yes | 2 | 5 | 3 | 4 | 3 | VERIFIED |
| ISA-007 | SIPP vs ISA Calculator | Yes | Yes | Yes | 4 | 6 | 4 | 4 | 4 | VERIFIED |
| INV-001 | Investment Growth Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 3 | 4 | NOT RULE-SENSITIVE |
| INV-002 | Compound Interest Calculator | Yes | Yes | Yes | 3 | 4 | 2 | 3 | 3 | NOT RULE-SENSITIVE |
| INV-026 | Safe Withdrawal Rate Calculator | Yes | Yes | Yes | 4 | 6 | 2 | 4 | 3 | NOT RULE-SENSITIVE |
| INV-029 | Monte Carlo Investment Simulator | Yes | Yes | Yes | 3 | 6 | 2 | 4 | 3 | NOT RULE-SENSITIVE |

### Batch 5: Health, Finance & Automotive

| ID | Calculator | Guide | Worked example | Methodology | Assumptions | Limitations | Sources | FAQs | Related | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HLT-001 | BMI Calculator | Yes | Yes | Yes | 2 | 6 | 2 | 4 | 2 | NOT RULE-SENSITIVE |
| HLT-002 | BMR Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 2 | NOT RULE-SENSITIVE |
| HLT-020 | Pregnancy Due Date Calculator | Yes | Yes | Yes | 3 | 6 | 2 | 4 | 2 | NOT RULE-SENSITIVE |
| FIN-009 | Credit Card Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | NOT RULE-SENSITIVE |
| AUT-006 | Fuel Cost Calculator | Yes | Yes | Yes | 3 | 5 | 2 | 4 | 3 | NOT RULE-SENSITIVE |

## Coverage beyond the top forty

The other 213 calculators have no authored guide. A calculator without one
renders exactly as it did before Phase 2, so partial coverage is a supported
state rather than a defect: `getCalculatorGuide` returns `undefined` and the
guide section renders nothing.

## What is deliberately absent

- **Structured data.** The guide component emits no JSON-LD. Phase 3 owns
  structured data infrastructure, and the guide data exposes `faqs`,
  `formulaExplanation.steps`, `relatedCalculators` and `officialSources` for it
  to drive `FAQPage`, `HowTo` and internal-link markup honestly.
- **Global related-link rendering.** Phase 2 authors the editorial
  relationships; Phase 3 owns how they are rendered platform-wide.
- **Engine corrections.** Three items are recorded in
  `docs/PHASE2_SOURCE_VERIFICATION_REGISTER.md` under ENGINE/RULE REVIEW
  REQUIRED, and none was fixed.
