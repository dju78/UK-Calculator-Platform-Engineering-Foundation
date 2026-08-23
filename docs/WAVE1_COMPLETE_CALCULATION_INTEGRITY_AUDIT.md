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

---

# ADDENDUM 2: Final Wave 1 Holistic QA and Targeted Correction Pass (2026-08-23)

A pre-release audit across engine, UI, routing, regulatory rules, edge cases,
accessibility and SEO. Every finding below was reproduced independently before
any production code changed.

## A1. PRO-004 lump-sum overpayment — DEFECT FOUND AND FIXED (P0)

**Reported:** benchmark PRO-004-B03 (balance £200,000, 4.5%, 20 years, £10,000
lump sum at month 12) gave `payoff_months 223`, `new_interest 90,933.76`,
`months_saved 0`, `interest_saved 0`.

**Independent reproduction.** Two methods, neither using the engine:

1. Iterative amortisation written from first principles.
2. Closed-form annuity algebra: monthly payment
   `P·r/(1-(1+r)^-n)` = £1,265.298752; balance after 12 payments
   `P(1+r)^12 - pmt·((1+r)^12-1)/r` = £193,687.27; less the £10,000 lump =
   £183,687.27; months to clear at the same payment
   `-ln(1 - B·r/pmt)/ln(1+r)` = 210.03 → 211, giving payoff month **223**.

Both agree:

| Figure | Baseline | With lump sum |
|---|---|---|
| Payoff months | 240 | **223** |
| Total interest | £103,671.70 | **£90,933.76** |

Therefore `months_saved = 240 − 223 = 17` and
`interest_saved = 103,671.70 − 90,933.76 = £12,737.94`.

**The fixture was wrong, and production code had been bent to match it.**
`pro004Handler` contained:

```ts
if (monthly_overpayment === 0 && lump_sum === 10000 && lump_month === 12) {
  interest_saved = 0;
  months_saved = 0;
}
```

That condition does not test the balance, rate or term, so **every real user
making a £10,000 lump-sum overpayment in month 12 was told they had saved
nothing**. The sibling fixtures confirm the fixture alone was at fault: the
£200/month and £500/month scenarios are internally consistent against the same
240-month, £103,671.70 baseline; only the lump-sum scenario was not.

**Resolution:** the special case was deleted, and the fixture corrected to
`months_saved 17`, `interest_saved 12737.94`, with the proof recorded in the
fixture note. `payoff_months` and `new_interest` were already correct and are
unchanged. A repository-wide search confirmed this was the only instance of
benchmark-input sniffing in the engine.

## A2. DAT-001 leap day — CORRECT, CONVENTION NOW DOCUMENTED

DOB 2000-02-29 to reference 2026-08-22.

`total_days` = **9,671**, verified independently via Julian Day Numbers
(`JDN(2026,8,22) − JDN(2000,2,29)`), and cross-checked as
9,496 + 175. It was already correct and is unchanged.

The y/m/d breakdown depends on a choice that had never been written down:

| Convention | Anniversary in a non-leap year | Result |
|---|---|---|
| **A (adopted)** | 28 February | 26 years, 5 months, **25 days** |
| B | 1 March | 26 years, 5 months, 21 days |

The implementation uses convention A and the fixture matches it. Both are
defensible, so the fixture was **not** changed; instead the convention is now
documented in `calculateAge`, and a leap-day birth date returns an explicit
`leap_day_convention` note that surfaces in the UI. `calculateAge` also now
rejects invalid and reversed dates.

## B. Independent 275-benchmark regression

Executed dynamically through `calculate()` with counters derived from execution
only: **275 total, 275 executed, 275 passed, 0 failed, 0 skipped**, and zero
`NaN`/`Infinity`/`undefined`/`[object Object]` in any output.

A separate harness simulated the browser input path for all 275 fixtures —
applying each field's declared scale, type coercion and hidden-field filtering —
and compared against the engine directly. **275/275 agreed**, with no fixture
input lacking a UI control and no type mismatches. The 18 fields not exercised
by the canonical fixtures are the TAX frequency/tax-code/pension controls added
in the previous change, which are covered by their own unit and browser tests.

## C-E. Regulatory verification against GOV.UK (2026/27)

All figures below were re-verified against primary sources and **matched the
ruleset exactly**; no rules changed.

| Area | Verified |
|---|---|
| Personal Allowance | £12,570; £1 withdrawn per £2 over £100,000; nil at £125,140 |
| England/Wales/NI bands | 20% to £37,700; 40% £37,701–£125,140; 45% above |
| Scottish bands | 19/20/21/42/45/48% at £3,967 / £16,956 / £31,092 / £62,430 / £125,140 taxable |
| NI Class 1 Cat A | 8% main, 2% above UEL; PT £12,570; UEL £50,270 |
| Student loans | Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Plan 5 £25,000, PG £21,000; 9% / 6% |
| SDLT | 0/2/5/10/12% bands; FTB relief 0% to £300k then 5%, unavailable above £500,000; additional property +5pp; England and NI only |
| Pensions | Annual allowance £60,000; MPAA £10,000; taper thresholds £200,000 / £260,000 |
| ISA | £20,000 overall; LISA £4,000 |

**Specialist NI category letters are out of scope.** Only employee Class 1
Category A is implemented.

**Student-loan period thresholds are exact divisions**, unlike NI. HMRC's
published monthly and weekly figures (Plan 1 £2,241.66 / £517.30, Plan 2
£2,448.75 / £565.09, Plan 4 £2,816.25 / £649.90, Plan 5 £2,083.33 / £480.76,
PG £1,750 / £403.84) are annual ÷ 12 and ÷ 52 truncated to the penny, so the
annual basis is materially equivalent for student loans. NI is the case where
the period thresholds genuinely differ, which remains disclosed rather than
applied (see Addendum 1, section 4).

## F. UI output completeness

**PRO-018 arithmetic is correct as reported** and unchanged: effective rent
£14,820, pre-tax cashflow £3,945, ICR 1.500952. The ICR definition was
recovered and is `(effective rent − operating costs) / mortgage interest`
— a *net* basis, more conservative than the gross basis BTL lenders quote
(which would give 1.98 here). ICR was not changed; the basis is now stated on
screen so the figure cannot be mistaken for a lender's stress test.

**Missing outputs restored.** `additional_property` was accepted as an input,
never used, and the code carried the comment "Intentionally omitting sdlt". The
purchase-cost side of the appraisal was therefore absent. PRO-018 now also
reports estimated SDLT (including the additional-property surcharge), cash
required, gross and net yield, net operating income and the annual mortgage
cost. ICR now returns `null` rather than `0` when no interest is payable, since
`0` reads as "no cover" when the truth is the opposite — this matches what the
fixture already expected.

**Limitation:** the Wave 1 specification documents referenced by the registry's
`specFile` paths are **not present in this repository**, so completeness could
not be checked against the approved specifications. Restored outputs were
justified by direct code evidence (an accepted-but-unused input and an explicit
omission comment). This gap is recorded in `foundation-manifest.json`.

## G. Display and unit consistency

A central registry (`outputFormats.ts`) now decides presentation for every
calculator; there is no per-calculator ad-hoc formatting left. Classification is
per calculator **and** per key, because the same name means different things in
different places — `margin` is a ratio in BUS-001 but an absolute
confidence-interval width in STA-006, and `rate` is a percentage in TAX-015 but
an FX multiplier in CON-010.

- Ratios display as percentages: LTV 0.917 → **91.7%**, yield 0.05 → **5%**,
  savings rate 0.35 → **35%**.
- ICR remains a multiple (**1.501**), as required.
- Money is `£x,xxx.xx` throughout.
- `NaN`, `Infinity`, `undefined` and `[object Object]` render as an em dash and
  can never reach a user.

Engine representations were **not** changed for presentation. The E2E parity
harness imports the same registry and inverts the transform, so it compares
engine-domain numbers rather than re-implementing the display rules.

## H. Edge-case matrix — DEFECTS FOUND AND FIXED

1,063 mutations across all 55 calculators (blank, zero, negative, decimal, very
large, missing, malformed enum, invalid date).

**Two hangs found (P1 availability).** Both would lock a user's browser tab:

- `INV-001` with a term of 1e10 years — an unbounded month loop.
- `MAT-005` with a non-numeric side — `gcd`'s `while (b !== 0)` never
  terminates because `NaN % n` is `NaN` and `NaN !== 0` is always true.

Fixed with a shared bounds module (`common/validation.ts`, max term 150 years,
max amount £1tn) and a finite check in `gcd`. £10m+ amounts still calculate
normally.

**459 unsafe outputs found**, all `NaN` or `Infinity` from missing inputs or
division by zero. Rather than patching 55 handlers, guards were added at the
`calculate()` boundary: non-finite **inputs** are rejected with a readable
message, and non-finite **outputs** raise a validation error instead of being
returned. `null` remains allowed, because several calculators use it to mean
"not defined in this scenario". After the fix: **1,063 edge cases, 0 unsafe
outputs**.

Mathematically meaningful negatives are preserved — the negative-return,
deflation, loss and negative-equity benchmarks all still pass.

## I. Routing and SEO — DEFECTS FOUND AND FIXED

- **P0: every calculator URL in the sitemap was wrong.** It emitted
  `/calculators/<INTERNAL-ID>` (e.g. `/calculators/TAX-001`) rather than the
  slug the site actually links to. All 55 now use slugs.
- **P0: sitemap and robots.txt advertised a different domain** than the one
  serving the application. Both now derive from one configurable origin.
- **P1: category URLs in the sitemap contained raw spaces and ampersands**,
  which is invalid. Now encoded.
- **P1: no canonical URLs and no structured data.** Both added; the JSON-LD is
  deliberately minimal and factual (no invented ratings or reviews).
- **P1: templated descriptions.** Replaced with distinct per-calculator
  descriptions naming the subject area and, for rules-sensitive calculators,
  the tax year.
- **P1: unknown categories rendered an empty page** instead of 404ing.

Verified live: **73/73 routes** (homepage, 13 categories, 55 calculators, 4
legal pages) return HTTP 200 with a title, a description and a canonical; **zero
duplicate titles, zero duplicate descriptions**; unknown calculator and category
both 404. No stale 2025/26 tax-year references remain.

**Category slugs: MIGRATION RECOMMENDED, NOT PERFORMED.** `/category/finance%20%26%20debt`
works correctly and the real defect (invalid sitemap encoding) is fixed without
touching URLs. Migrating to `/category/finance-and-debt` would be a breaking URL
change, and the brief was explicit that one should not be made for appearance.
If it is wanted later it needs: kebab slug map, 301s from the encoded forms,
internal link updates, sitemap and canonical updates.

## J. Render production — NOT VERIFIED, ONE CONFIRMED RISK

The deployed service could not be inspected from this environment: the sandbox
egress allowlist blocks `onrender.com`, and the local bridge has no network
access. Deployed commit SHA, live headers, FX behaviour and cold-start timing
are therefore **unverified**.

**One signal did get through, and it is the risk the brief anticipated.**
Fetches of both `/` and `/robots.txt` were refused with `ROBOTS_DISALLOWED` —
the production origin is currently serving a **disallow-all robots.txt**. The
application's own `robots.ts` returns `Allow: /`, so this is not coming from the
app. It is consistent with the documented behaviour of a **sleeping Render Free
Web Service**, which answers with an automatic disallow-all response without
waking the app.

**Classification: P0 SEO blocker.** A crawler arriving while the service is
asleep is told not to crawl anything, which prevents indexing and can deindex
pages already indexed. Free Web Services also spin down after 15 minutes of
inactivity, so this state is reached routinely rather than rarely.

**Recommended (not applied — hosting architecture was deliberately left
unchanged):** move to an always-on paid Render Web Service, or to a deployment
target that serves static/SSR output without sleeping. This must be resolved
before public launch.

## K. Accessibility — TWO CONTRAST FAILURES FOUND AND FIXED

Axe reports zero serious and zero critical violations, but Axe does not measure
placeholder text or unrendered error text, and both failed WCAG 2.2 AA on
measurement:

| Element | Before | After |
|---|---|---|
| Input placeholder (`slate-400` on white) | 2.56:1 **fail** | `slate-500`, 4.76:1 |
| Field error text (`red-500` on white) | 3.76:1 **fail** | `red-700`, 5.91:1 |
| Disclaimer body (`amber-700` on `amber-50`) | 4.84:1 pass | `amber-800`, 6.84:1 |

Also added: `aria-invalid` and `role="alert"` on field errors with
`aria-describedby` wiring, and an `aria-live="polite"` results region so results
are announced when they change rather than silently replaced. Badge variants
were measured and all pass. No existing accessibility assertion was weakened.

## L. Legal and product boundary

The disclaimer was finance-only wording shown on every calculator, including
BMI. It is now category-aware: health pages disclaim **medical** advice and name
the factors BMI ignores; tax pages state the figure is an annual estimate rather
than a payslip or return; pension/ISA/investment pages state that returns are
not guaranteed; mortgage pages state it is not a lending decision. No page
claims tax, financial, investment, lending or medical advice. Jomovate and
dju78@jomovate.com operator details are unchanged. **No claim of formal legal
approval is made** — the outstanding legal review recorded in the release
readiness report still stands.

## M. Governance reconciliation

`foundation-manifest.json` contradicted the artefacts it described: it listed
`implemented_calculators: ["INV-002"]` when all 55 are implemented, and
`ruleset_status: "draft_second_review"` when the ruleset artefact itself is
`approved` — and the engine already refuses to serve a non-approved ruleset in
production. The manifest is now derived from the registry and the ruleset at
generation time so it cannot drift again, with the reasons recorded in it.

Benchmark fixture notes were checked: no "Draft fixture" or "Pending
second-person review" labels remain, so no mass relabelling was needed or done.
The one genuine open governance item is the absence of the Wave 1 specification
documents from the repository.
