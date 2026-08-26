# Phase 2 Source Verification Register

Every factual claim in the top-40 calculator guides was checked against a
primary source on **25 August 2026**. This register records what was checked,
what was confirmed, and what was not.

"VERIFIED" here means the figure was read from the named official page during
this work. It does not mean the figure looked plausible, and it does not mean
the backfill plan asserted it — several of the plan's figures turned out to be
stale and are listed at the end of this document.

## Status definitions

| Status | Meaning |
| --- | --- |
| `VERIFIED` | Every rule-sensitive claim in the guide was confirmed against a primary source. |
| `SOURCE VERIFICATION REQUIRED` | At least one claim could not be confirmed, or the engine's figure conflicts with the source. The guide does not present the affected figure as settled. |
| `NOT RULE-SENSITIVE` | The calculator implements arithmetic or a modelling convention, not a statutory rule. |

## Summary

| Measure | Count |
| --- | --- |
| Guides | 40 |
| `VERIFIED` | 19 |
| `SOURCE VERIFICATION REQUIRED` | 3 |
| `NOT RULE-SENSITIVE` | 18 |
| Source citations recorded | 109 |
| Distinct source URLs | 62 |
| Sources verified | 107 |
| Sources awaiting verification | 2 |

## Register

| ID | Calculator | Rule-sensitive | Sources | Verification | Outstanding requirement |
| --- | --- | --- | --- | --- | --- |
| TAX-001 | UK Income Tax Calculator | Yes | 4 | VERIFIED | None |
| TAX-002 | UK Salary Calculator | Yes | 3 | VERIFIED | None |
| TAX-003 | Take-Home Pay Calculator | Yes | 4 | VERIFIED | None |
| TAX-004 | National Insurance Calculator | Yes | 2 | VERIFIED | None |
| TAX-005 | Salary Sacrifice Calculator | Yes | 3 | VERIFIED | None |
| TAX-011 | Dividend Tax Calculator | Yes | 3 | VERIFIED | None |
| TAX-013 | General Investment Account Tax Calculator | Yes | 4 | SOURCE VERIFICATION REQUIRED | Sources confirmed; the **engine** conflicts with them — see ENGINE/RULE REVIEW 1 |
| TAX-015 | VAT Calculator | Yes | 2 | VERIFIED | None |
| TAX-019 | High Income Child Benefit Charge Calculator | Yes | 3 | SOURCE VERIFICATION REQUIRED | Child Benefit weekly rates — see ENGINE/RULE REVIEW 2 |
| TAX-020 | Student Loan Repayment Calculator | Yes | 2 | VERIFIED | None |
| PRO-001 | UK Mortgage Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| PRO-002 | Mortgage Affordability Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| PRO-003 | Mortgage Amortisation Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| PRO-004 | Mortgage Overpayment Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| PRO-008 | Fixed vs Tracker Mortgage Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| PRO-010 | Loan-to-Value (LTV) Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| PRO-018 | Buy-to-Let Calculator | Yes | 4 | SOURCE VERIFICATION REQUIRED | PRA SS13/16 underwriting standards — source unreachable |
| PRO-023 | Stamp Duty Land Tax Calculator | Yes | 2 | VERIFIED | None |
| PRO-026 | Scotland LBTT Calculator | Yes | 3 | VERIFIED | None |
| PRO-028 | Property Capital Gains Tax Calculator | Yes | 5 | VERIFIED | None |
| PEN-001 | Pension Growth Calculator | Yes | 3 | VERIFIED | None |
| PEN-002 | SIPP Growth Calculator | Yes | 3 | VERIFIED | None |
| PEN-003 | Workplace Pension Calculator | Yes | 3 | VERIFIED | None |
| PEN-006 | Retirement Calculator | No | 3 | NOT RULE-SENSITIVE | None |
| PEN-007 | Retirement Income Calculator | Yes | 4 | VERIFIED | None |
| PEN-009 | Annuity Calculator | No | 3 | NOT RULE-SENSITIVE | None |
| PEN-011 | FIRE Calculator | No | 3 | NOT RULE-SENSITIVE | None |
| PEN-012 | Retirement Target Calculator | No | 3 | VERIFIED | None |
| ISA-001 | Stocks & Shares ISA Growth Calculator | Yes | 3 | VERIFIED | None |
| ISA-002 | ISA Allowance Calculator | Yes | 3 | VERIFIED | None |
| ISA-007 | SIPP vs ISA Calculator | Yes | 4 | VERIFIED | None |
| INV-001 | Investment Growth Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| INV-002 | Compound Interest Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| INV-026 | Safe Withdrawal Rate Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| INV-029 | Monte Carlo Investment Simulator | No | 2 | NOT RULE-SENSITIVE | None |
| HLT-001 | BMI Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| HLT-002 | BMR Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| HLT-020 | Pregnancy Due Date Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| FIN-009 | Credit Card Calculator | No | 2 | NOT RULE-SENSITIVE | None |
| AUT-006 | Fuel Cost Calculator | No | 2 | NOT RULE-SENSITIVE | None |

## Key figures confirmed

| Figure | Confirmed value | Source |
| --- | --- | --- |
| Personal Allowance | £12,570, tapering from £100,000 to nil at £125,140 | GOV.UK Income Tax rates |
| Income Tax bands (England, Wales, NI) | 20% to £50,270, 40% to £125,140, 45% above | GOV.UK Income Tax rates |
| Scottish bands | 19% / 20% / 21% / 42% / 45% / 48% | GOV.UK Income Tax in Scotland |
| Employee Class 1 NI | Nil to £242/wk, 8% to £967/wk, 2% above | GOV.UK NI rates and categories |
| Dividend allowance and rates | £500; 10.75% / 35.75% / 39.35% | GOV.UK Tax on dividends |
| VAT rates | 20% standard, 5% reduced, 0% zero | GOV.UK VAT rates |
| Student loan thresholds | Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Plan 5 £25,000 at 9%; Postgraduate £21,000 at 6% | GOV.UK Repaying your student loan |
| HICBC | Charge above £60,000 at 1% per £200, 100% at £80,000 | GOV.UK Child Benefit tax charge |
| Capital Gains Tax | £3,000 annual exempt amount; 18% basic band, 24% above | GOV.UK Capital Gains Tax |
| Private Residence Relief | Final 9 months always qualify (36 for disabled persons and care home residents) | HMRC CG64985 |
| CGT property reporting | 60 days from completion | GOV.UK CGT on UK residential property |
| SDLT | Nil to £125,000, 2% to £250,000, 5% to £925,000, 10% to £1.5m, 12% above; 5% additional-property surcharge; first-time buyer nil to £300,000 then 5% to £500,000 | GOV.UK SDLT residential rates |
| LBTT | Nil to £145,000, 2% to £250,000, 5% to £325,000, 10% to £750,000, 12% above; first-time buyer nil band £175,000 | Revenue Scotland |
| Additional Dwelling Supplement | 8% of the whole price where consideration is £40,000 or more, from 5 December 2024 | Revenue Scotland |
| Mortgage affordability stress | MCOB 11.6.18R: assume a rise of at least 1% over five years | FCA Handbook |
| Landlord finance costs | Relieved as a basic rate tax reduction, not deductible from rental income | GOV.UK |
| New State Pension | £241.30 a week; 35 qualifying years for the full rate | GOV.UK New State Pension |
| Pension annual allowance | £60,000; tapered above £200,000 threshold / £260,000 adjusted income | GOV.UK |
| Lump sum allowance | £268,275 | GOV.UK |
| Normal minimum pension age | Rises from 55 to 57 on 6 April 2028 | HMRC Pensions Tax Manual |
| Auto-enrolment | 8% of qualifying earnings — 3% employer, 5% employee — on £6,240 to £50,270 | GOV.UK Workplace pensions |
| ISA allowance | £20,000 for 2026/27, shared across all ISA types | GOV.UK ISAs |
| Lifetime ISA | £4,000 sub-limit counting towards the £20,000; 25% bonus capped at £1,000; £450,000 property cap; 25% charge on other withdrawals | GOV.UK Lifetime ISA |
| BMI thresholds | Healthy 18.5–24.9, overweight 25–29.9, obesity from 30; for South Asian, Chinese, other Asian, Middle Eastern, Black African and African-Caribbean backgrounds, overweight from 23 and obesity from 27.5 | NICE NG246 |
| Pregnancy | Normally 37 to 42 weeks from the first day of the last period; a dating scan is more accurate | NHS |

## ENGINE/RULE REVIEW REQUIRED

Phase 2 does not modify the calculation engine. These were found during source
verification and are recorded for a separate review.

### 1. TAX-013 dividend rates contradict the approved ruleset and TAX-011

- **Calculator:** TAX-013, General Investment Account Tax Calculator
- **Issue:** `packages/calculation-engine/src/finance/wave3/gia-tax.ts` hardcodes
  dividend rates of `0.0875` (basic) and `0.3375` (higher).
- **Evidence:** With `other_taxable_income` of £55,000 and `annual_dividends`
  of £2,500, the engine returns `dividend_tax_due` of £675. That is 33.75% of
  the £2,000 above the dividend allowance. TAX-011 on the same facts applies
  35.75%, and the approved ruleset `uk-2026-27-v1` records
  `dividends.rates.higher` as `0.3575`.
- **Official source:** GOV.UK, *Tax on dividends*
  (https://www.gov.uk/tax-on-dividends) — 10.75% basic, 35.75% higher, 39.35%
  additional for 2026 to 2027.
- **Why review is required:** A live, registry-verified calculator understates
  dividend tax and disagrees with its sibling calculator on identical facts.
  Two calculators on the same platform give different answers for the same
  dividend income. Correcting it will change approved benchmark expectations
  for TAX-013, which is a decision for the engine and rules owners.
- **Phase 2 handling:** The guide is marked `SOURCE VERIFICATION REQUIRED`, the
  dividend outputs are excluded from its worked example, and the limitation is
  stated in the public content.

### 2. TAX-019 Child Benefit weekly rates appear to be a year out of date

- **Calculator:** TAX-019, High Income Child Benefit Charge Calculator
- **Issue:** `packages/calculation-engine/src/finance/wave3/hicbc.ts` hardcodes
  weekly Child Benefit of `25.60` for the eldest child and `16.95` for each
  additional child, commented as 2026/27 rates.
- **Evidence:** GOV.UK's Child Benefit rates page shows £27.05 for the eldest
  or only child and £17.90 per additional child. On the engine's figures, two
  children produce annual benefit of £2,212.60; on the GOV.UK figures the same
  family would receive £2,337.40.
- **Official source:** GOV.UK, *Child Benefit rates*
  (https://www.gov.uk/child-benefit-rates).
- **Caveat:** The GOV.UK page did not state which tax year it covers, so this
  is recorded as requiring verification rather than asserted as an error.
- **Why review is required:** If confirmed, the benefit received and the
  resulting cash charge are both understated. The thresholds and the taper are
  correct, so only the cash amounts are affected.
- **Phase 2 handling:** The guide is marked `SOURCE VERIFICATION REQUIRED`, the
  benefit and cash-charge outputs are excluded from its worked example — the
  adjusted net income, taper percentage and pension top-up figures were all
  verified and are shown — and the limitation is stated in the public content.

### 3. PRO-018 buy-to-let underwriting source unreachable

- **Calculator:** PRO-018, Buy-to-Let Calculator
- **Issue:** Not an engine defect. The primary source for interest cover ratio
  and stress rate conventions could not be retrieved.
- **Evidence:** The Bank of England page for supervisory statement SS13/16,
  *Underwriting standards for buy-to-let mortgage contracts*, returned HTTP 403
  during verification.
- **Why review is required:** The backfill plan asserts an ICR of 125%–145% at
  a 5.5% stress rate. Those are widely used lender conventions, but they were
  not confirmed against the primary source, so no threshold is asserted in the
  public content.
- **Phase 2 handling:** The guide is marked `SOURCE VERIFICATION REQUIRED`, the
  source carries the same status, and the guide states that no specific
  threshold is asserted.

## Backfill plan figures that did not survive verification

The plan was treated as a scope document, not as an authority. These of its
figures were superseded by primary sources.

| Plan figure | Plan value | Verified value | Notes |
| --- | --- | --- | --- |
| Dividend tax rates | 8.75% / 33.75% / 39.35% | 10.75% / 35.75% / 39.35% | Engine's TAX-011 is correct; TAX-013 is not — see review 1 |
| Additional Dwelling Supplement | 6% | 8% from 5 December 2024 | Engine already applies 8% |
| Mortgage stress test | "3% above standard variable rate" | MCOB 11.6.18R: at least a 1% rise over five years | Plan describes an older convention |
| Full new State Pension | £221.20 a week (2024/25) | £241.30 a week | Engine already applies £241.30 |
| Scottish higher rate band | "£43,663 to £75,000" implied by plan summary | Confirmed correct against GOV.UK | Plan correct here |
| BMI ethnic thresholds | Asserted without figures | NICE NG246: overweight from 23, obesity from 27.5 | Engine applies standard thresholds only |

## Calculator ids in the plan that do not exist or do not match

Recorded in `packages/calculator-content/src/top40.ts` as
`planSubstitutions` and `planLabelCorrections`. The calculator id was treated
as the authoritative identity throughout, because that is what the registry,
the engine and the routes all key on.

| Plan entry | Reality | Handling |
| --- | --- | --- |
| TAX-021 "Dividend Tax Calculator" | No TAX-021 exists in the 253-calculator registry | Guide written for TAX-011, the actual Dividend Tax Calculator |
| TAX-005 "Scottish Income Tax Calculator" | TAX-005 is the Salary Sacrifice Calculator; no standalone Scottish calculator exists | Guide written for Salary Sacrifice; Scottish bands covered in the TAX-001 guide |
| PEN-006 "Retirement Income Calculator" | PEN-006 is the Retirement Calculator | Guide written for the actual calculator |
| PEN-007 "Pension Drawdown Calculator" | PEN-007 is the Retirement Income Calculator, which does model drawdown | Guide written for the actual calculator |
| PEN-009 "25% Tax-Free Lump Sum (PCLS) Calculator" | PEN-009 is the Annuity Calculator; no standalone PCLS calculator exists | Guide written for the Annuity Calculator; the tax-free lump sum is covered inside it and inside PEN-007 |
| PEN-012 "State Pension Age & Forecast Calculator" | PEN-012 is the Retirement Target Calculator; no State Pension forecast calculator exists | Guide written for the actual calculator |
| ISA-002 "Lifetime ISA (LISA) Calculator" | ISA-002 is the ISA Allowance Calculator | Guide written for the actual calculator; LISA rules covered within it |
| HLT-002 "Calorie & TDEE Calculator" | HLT-002 is the BMR Calculator | Guide written for BMR, and explicit that BMR is not a calorie target |

No calculator was silently replaced. Every divergence appears above, in
`top40.ts`, and in the affected guide's editorial notes.
