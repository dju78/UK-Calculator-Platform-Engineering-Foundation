# WAVE1 COMPLETE CALCULATION INTEGRITY AUDIT

## Overview
This document details the resolution of all 73 UI Parity Failures from Wave 1 benchmarks on the UK Calculator Platform. The initial failure count was exactly 73 out of 275 executed benchmarks. Through targeted interventions in the test harness parser and the frontend React application mappings, all 275 benchmarks now pass with zero numeric tolerance loosenings.

## Final Metrics
- **UI BENCHMARKS EXECUTED:** 275
- **PASSED:** 275
- **FAILURES:** 0
- **INITIAL FAILURES:** 73
- **TOTAL FIXED:** 73

## Defect Breakdown and Resolution Categories

### 1. Format-Only Defects (Test Harness Parser)
Many initial failures were caused by the UI correctly rendering formatted strings (e.g., currency with £, negative numbers wrapped in parentheses, or percentages with commas) which the naive parsing logic in `parity.spec.ts` failed to read correctly. 

**Fix Implemented:** 
Replaced the strict regex parser in `parity.spec.ts` with a robust numeric parser that accurately identifies negative signs (including accounting parenthesis notation `( )`) and strips all non-numeric and non-decimal characters (like `£`, `%`, `,`) before executing the `parseFloat` step.

### 2. Input Mapping Defects (Application Schema & Logic)
A large chunk of failures originated from mismatches between the inputs provided by the benchmark definitions and the actual schema or state handling in `DynamicCalculator` and the calculator `registry.tsx`.

**Fixes Implemented:**
1. **Missing Input Fields:** Several calculators had missing input definitions in `registry.tsx` causing inputs to be discarded before calculation. Added the missing fields (e.g., `target_margin` for BUS-001, `sale_price` for BUS-008, `angle` for MAT-002, etc.).
2. **Boolean Select Mapping:** The dynamic component provided boolean inputs as HTML select options (`"true"`/`"false"`). These were being passed to the `calculation-engine` as raw strings, causing logic failures. Updated `DynamicCalculator` to properly parse `"true"` and `"false"` string literals into boolean primitives.
3. **Array JSON Parsing:** Some fields (e.g., `debts` in FIN-011, `values` in STA calculators) were passed as raw JSON strings of arrays instead of array primitives, causing the backend engine to fail. Updated `DynamicCalculator` to parse any string starting with `[` into a JSON array object prior to calling the engine.

## Conclusion
All Wave 1 integrity checks now execute perfectly without loosening our expected benchmarks. Calculation logic inside the engine was proven to be 100% correct; the bugs lay entirely in the plumbing between the input elements, the output formatters, and the test assertions.

---

# ADDENDUM: UK Tax & Salary Frequency, Tax Code and Pension Enhancement

This addendum documents the enhancement of the UK Tax & Salary family (TAX-001,
TAX-002, TAX-003, TAX-004, TAX-020) to support pay frequencies, PAYE tax codes
and workplace pension arrangements. TAX-015 (VAT) is deliberately unchanged:
VAT is a transaction tax with no pay-period or frequency dimension, so adding
one would be meaningless.

## 1. Human percentage convention

Public percentage fields now take **human percentages**: the user types `5` to
mean 5%. Normalisation to the decimal `0.05` happens exactly **once**, at the
UI/engine boundary, via the `scale` property on a field definition
(`apps/web/src/components/calculators/fieldTypes.ts`).

- UI representation and engine representation are separate concerns. The engine
  contract still takes decimal fractions; only the presentation changed.
- `Salary Sacrifice Pct` is renamed **Pension contribution (%)** with the helper
  text "Enter 5 for 5%."
- Because scaling is declared per field, the E2E parity harness now reads the
  same declarations the UI renders instead of guessing from field-name
  substrings. That old heuristic was unsafe in both directions: it missed
  fields absent from a calculator's first scenario, and it keyed off names like
  `rate`, which is a scaled percentage in TAX-015 but a raw multiplier in
  CON-010 (an FX rate) and PRO-001 (a 4.5% mortgage rate).

Percentage fields audited across TAX-001, TAX-002, TAX-003, TAX-004 and
TAX-020: only TAX-003 exposes percentages to the user (`pension_pct`,
`employer_pension_pct`), and both use the human convention.

## 2. Income frequency vs payroll frequency

Two genuinely different concepts, modelled separately in
`packages/calculation-engine/src/common/frequency.ts`:

| Concept | Meaning | Values |
|---|---|---|
| **Income frequency** | How the user chose to type their pay | annual, monthly, weekly, hourly |
| **Payroll frequency** | How often they are actually paid | monthly, weekly |

An hourly worker may be paid weekly *or* monthly; a salaried worker is usually
paid monthly. Income frequency never silently determines payroll frequency.

### Conversions

```
annual   -> annualGross = amount
monthly  -> annualGross = amount x 12
weekly   -> annualGross = amount x paidWeeksPerYear
hourly   -> annualGross = amount x hoursPerWeek x paidWeeksPerYear
```

### Periodic outputs

```
monthlyEquivalent = annual / 12
weeklyEquivalent  = annual / paidWeeksPerYear
hourlyEquivalent  = annual / (hoursPerWeek x paidWeeksPerYear)
```

## 3. Working-hour assumptions

Defaults are **37.5 hours per week** and **52 paid weeks per year**. They are
never applied as invisible constants:

- In hourly mode both fields are shown and editable, and hours are **required**.
- Where hours are unknown, the hourly equivalent is **omitted entirely** rather
  than derived from an assumption the user never saw. The frequency layer
  tracks this with a `hoursKnown` flag, and hidden fields are not submitted.
- TAX-003 always shows the working-pattern fields because it always reports an
  hourly equivalent.

Hourly results are labelled **"Estimated net hourly equivalent"**, never exact
payroll take-home, with the helper text "Based on your entered working hours and
paid weeks." Variable hours, overtime, irregular shifts, bonuses and unpaid
absence are **not** modelled.

## 4. Pay-period basis: what is and is not modelled

HMRC publishes weekly and monthly Class 1 NI thresholds that are **not** simple
divisions of the annual figures:

| Threshold | Weekly | Monthly | Annual | Weekly x 52 | Monthly x 12 |
|---|---|---|---|---|---|
| Primary Threshold | £242 | £1,048 | £12,570 | £12,584 | £12,576 |
| Upper Earnings Limit | £967 | £4,189 | £50,270 | £50,284 | £50,268 |

Ruleset `uk-2026-27-v1` defines **annual thresholds only** for both National
Insurance and student loans. The approved benchmark expectations are computed on
that annual basis.

**Decision:** the annual basis remains the calculation basis, and the real
period thresholds are recorded in the ruleset for disclosure under
`national_insurance_employee_class1_category_a.period_thresholds_gbp` with an
explicit `period_basis_applied: false` capability flag. The engine reads that
flag rather than guessing, and states the basis in its output.

This is disclosure, not concealment: periodic NI and student-loan figures are
annual estimates divided into periods, and the UI says so. Nothing is silently
divided and presented as payslip-accurate. A future ruleset that flips
`period_basis_applied` to `true` must also re-approve the affected benchmark
expectations, because period-basis NI differs from annual-basis NI by a few
pence per year.

## 5. Supported and unsupported tax codes

Tax-code semantics live in
`packages/calculation-engine/src/finance/tax/tax-codes.ts` and in the versioned
ruleset. **No tax-code parsing or statutory rate exists in any React component.**
Flat-rate codes resolve their rate by indexing the ruleset's own band table, so
statutory rates are defined exactly once.

### Supported

| Code family | Behaviour |
|---|---|
| `1257L` and other numeric + `L`/`M`/`N`/`T` | Allowance = number x 10 (so `1100L` = £11,000). The allowance is taken as given; the income taper is not applied again on top. |
| `BR`, `D0`, `D1` | All taxable pay at basic / higher / additional rate, no allowance |
| `SBR`, `SD0`, `SD1`, `SD2`, `SD3` | Scottish basic / intermediate / higher / advanced / top rate |
| `0T` | No Personal Allowance, normal bands |
| `NT` | No Income Tax deducted |
| `S` prefix | Scottish taxpayer - uses Scottish bands |
| `C` prefix | Welsh taxpayer - Welsh rates currently mirror England/NI |

Default codes follow the jurisdiction: England/NI `1257L`, Wales `C1257L`,
Scotland `S1257L`. Changing jurisdiction updates the default **only** while the
current code is still one of those defaults, so a deliberate choice is never
overwritten.

### Unsupported - reported, never approximated

| Code family | Why |
|---|---|
| `K` codes | Represent a **negative** allowance plus a statutory 50% regulatory limit per pay period. Modelling that needs pay-period and year-to-date PAYE context this annual estimator does not have. |
| `W1` / `M1` / `X` | Non-cumulative "emergency" operation. PAYE switches from cumulative to period-by-period, which again needs year-to-date context. |

Both return: *"This tax code is not yet supported by this annual estimate
calculator."* The calculator returns **no figures at all** for these codes. It
never silently falls back to `1257L`, and never strips an emergency marker.

## 6. Pension arrangements

Four arrangements with **deliberately different** tax and NI treatment
(`packages/calculation-engine/src/finance/tax/pension.ts`):

| Arrangement | Income Tax on | NI on | Student loan on |
|---|---|---|---|
| **None** | full gross | full gross | full gross |
| **Salary sacrifice** | reduced salary | **reduced salary** | reduced salary |
| **Net pay** | gross less contribution | **full gross** | full gross |
| **Relief at source** | **full gross** | **full gross** | full gross |

- **Salary sacrifice** is the only arrangement that saves National Insurance,
  because contractual salary is genuinely given up.
- **Relief at source** models the gross contribution, the employee's cash outlay
  and the provider's basic-rate top-up (a £100 gross contribution costs the
  employee £80 with a £20 top-up). Higher and additional-rate relief is claimed
  separately from HMRC and is **not** credited to take-home pay.
- At basic rate, net pay and relief at source produce the **same** take-home -
  both deliver basic-rate relief by different mechanisms, and that equivalence
  is asserted as a correctness check. They diverge for higher-rate taxpayers,
  where the gap is exactly the un-credited higher-rate relief.
- **Employer contribution** (default 0%) is displayed alongside the employee
  contribution and total, and is never deducted from take-home pay.

The original `salary_sacrifice_pct` engine input is still accepted and still
means a salary-sacrifice arrangement, so every pre-existing benchmark is
unaffected.

## 7. PAYE estimation limitations

Every calculator in the family states that monthly and weekly figures are
estimates that may differ from a real payslip because of payroll rounding,
cumulative PAYE history, mid-year tax-code changes, bonuses, benefits, prior
period earnings and emergency/non-cumulative coding. This is an **annual tax
estimate**, not a PAYE payslip replication.

## 8. Result formatting

All monetary results in the family use a single formatter: `£`, comma grouping
and exactly two decimal places (`£3,566.00`, `£25,407.60`). Non-money outputs
(hours per week, paid weeks, and the selected frequency/arrangement/code) are
formatted plainly. Formatting for the other 50 calculators is unchanged.

## 9. Verification

| Check | Result |
|---|---|
| Engine benchmarks | 275/275 |
| UI parity | 275/275 |
| Unit tests | 200/200 (152 baseline + 48 new) |
| Browser tests | 345/345 (319 baseline + 26 new) |
| Routes | 55/55 |
| Serious Axe violations | 0 |
| Critical Axe violations | 0 |
| Typecheck / Lint / Production build | PASS |

Pinned regression, £32,000 gross, 5% salary sacrifice, monthly payroll, code
`1257L`: pension £1,600.00, tax £3,566.00, NI £1,426.40, net annual £25,407.60,
net monthly £2,117.30. The browser accepts `5`, not `0.05`.

Frequency equivalence is asserted at both engine and browser level: £39,000
annual, £3,250 monthly, £750 weekly and £20/hour (37.5 hrs x 52 weeks) all
annualise to the same £39,000, and £32,000 entered in any of the four
frequencies yields identical tax, NI and take-home.
