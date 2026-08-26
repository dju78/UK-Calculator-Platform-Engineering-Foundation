# 2026/27 Rule Correction Audit — TAX-013 and TAX-019

*Date:* 25 August 2026
*Branch:* `rules-2026-27-corrections`
*Base:* `origin/main` at `a8e0c60`

Two live, registry-verified calculators carried statutory figures that had
fallen a year behind. Both were identified during Phase 2 independent source
verification and recorded there rather than fixed, because Phase 2 was not
permitted to touch the engine. This branch corrects them.

Every benchmark expected value below was re-derived from the statutory rule
**independently of the production function**, using a separate derivation
script, and only then compared against the corrected engine. No expected value
was changed simply to make a test pass.

---

## Defect 1 — TAX-013 dividend rates

### The rule

| Figure | 2026/27 value | Source |
| --- | --- | --- |
| Dividend allowance | £500 | [GOV.UK, Tax on dividends](https://www.gov.uk/tax-on-dividends) |
| Ordinary (basic) rate | 10.75% | as above |
| Upper (higher) rate | 35.75% | as above |
| Additional rate | 39.35% | as above |
| Effective period | 6 April 2026 to 5 April 2027 | as above |

The approved ruleset `uk-2026-27-v1` already recorded these figures correctly at
`dividends.allowance_gbp` and `dividends.rates`, and TAX-011 already applied
them. The ruleset was therefore **not changed**.

### What was wrong

`packages/calculation-engine/src/finance/wave3/gia-tax.ts` hardcoded:

```
let divTaxRate = 0.0875; // basic
if (band === "higher") divTaxRate = 0.3375;
```

Those are the rates for the year before this ruleset. The consequence was that
two calculators on the same platform gave different answers for identical
facts: on £2,500 of dividends with £55,000 of other income, TAX-013 returned
£675 where TAX-011 and the ruleset give £715.

### What was changed

The rates and the allowance are now read from the ruleset rather than corrected
in place. Hardcoding the right number would have left the same failure mode
available next April; reading from the one place that owns the statutory
figures removes it. The handler resolves the ruleset from the calculation
context, which is the pattern the Wave 2 tax handlers already use.

The allowance ordering, band mechanics, Capital Gains Tax treatment and
Personal Savings Allowance handling are untouched, and a test asserts that.

### Benchmarks changed: 3 of 5

Fixture: `packages/test-fixtures/fixtures/wave3-benchmarks.json`, key `TAX-013`.

| Case | Field | Old | New | Independent derivation |
| --- | --- | --- | --- | --- |
| 1 — Higher rate taxpayer, mixed portfolio | `dividend_tax_due` | 675 | **715** | (£2,500 − £500) × 35.75% = £715 |
| | `total_gia_tax_due` | 1515 | **1555** | £715 + £720 CGT + £120 interest = £1,555 |
| | `net_investment_income_after_tax` | 7785 | **7745** | £9,300 gross − £1,555 = £7,745 |
| 4 — Basic rate, losses brought forward | `dividend_tax_due` | 393.75 | **483.75** | (£5,000 − £500) × 10.75% = £483.75 |
| | `total_gia_tax_due` | 393.75 | **483.75** | no CGT (net gain within the £3,000 annual exempt amount), no interest |
| 5 — Pure dividend portfolio, higher rate | `dividend_tax_due` | 2531.25 | **2681.25** | (£8,000 − £500) × 35.75% = £2,681.25 |
| | `total_gia_tax_due` | 2531.25 | **2681.25** | dividends only |

**Cases deliberately unchanged (2 of 5):**

- Case 2 — every figure sits within the allowances, so no dividend charge
  arises at any rate.
- Case 3 — charged at the additional rate of 39.35%, which did not change
  between years.

### Tests added

`tests/tax-013-dividend-rates.test.ts` — 9 tests. Covers each band at the
2026/27 rate, asserts the ruleset itself carries the right figures, asserts the
stale rates are no longer reachable, asserts the gains and interest treatment
was not disturbed, and asserts TAX-011 and TAX-013 apply the same dividend
rate and allowance to identical facts.

The consistency test compares the **shared statutory treatment** only. The two
calculators have different scopes — TAX-011 also taxes other income, TAX-013
also taxes gains and interest — so their totals differ by design and are not
asserted to be equal.

`tests/wave3.test.ts` was updated to assert against the ruleset rate rather
than the literal 0.3375.

---

## Defect 2 — TAX-019 Child Benefit weekly rates

### The rule

| Figure | 2026/27 value | Source |
| --- | --- | --- |
| Eldest or only child | £27.05 per week | [GOV.UK, Child Benefit rates](https://www.gov.uk/child-benefit-rates) |
| Each additional child | £17.90 per week | as above |

The HICBC thresholds and taper were confirmed correct and left alone:

| Figure | Value | Source |
| --- | --- | --- |
| Charge starts | £60,000 adjusted net income | [GOV.UK, High Income Child Benefit Charge](https://www.gov.uk/child-benefit-tax-charge) |
| Full clawback | £80,000 | as above |
| Taper | 1% of benefit per £200 above the threshold | as above |

Child Benefit rates are **not** present in the `uk-2026-27-v1` ruleset. Adding
them would mean modifying an approved ruleset artefact, which is a larger change
than this task authorises, so the two figures remain named constants in the
engine with the source and date recorded beside them. Moving them into the
ruleset is a reasonable follow-up and is noted below.

### What was wrong

`packages/calculation-engine/src/finance/wave3/hicbc.ts` hardcoded:

```
// 2026/27 Child Benefit rates: £25.60/wk eldest child, £16.95/wk subsequent
const weeklyBenefit = 25.60 + Math.max(0, children - 1) * 16.95;
```

Those are the preceding year's rates, and the comment asserted they were
2026/27. Both the benefit received and the resulting cash charge were
understated; the percentage clawed back was correct throughout.

### Annualisation

The engine annualises at 52 weeks and rounds to the penny. That is its existing,
documented behaviour and it was **not** changed. A 52/53-week treatment is a
different modelling decision, so a test now asserts the 52-week basis explicitly
rather than leaving it implicit.

### Benchmarks changed: 5 of 5

Fixture: `packages/test-fixtures/fixtures/wave3-benchmarks.json`, key `TAX-019`.

All five cases carry a benefit amount, so all five are affected. Independent
derivation: annual benefit = 52 × (£27.05 + (children − 1) × £17.90), rounded to
the penny; charge = benefit × taper percentage.

| Case | Field | Old | New | Independent derivation |
| --- | --- | --- | --- | --- |
| 1 — 2 children, ANI £70,000 | `total_child_benefit_received` | 2212.6 | **2337.4** | 52 × £44.95 |
| | `hicbc_tax_charge` | 1106.3 | **1168.7** | 50% taper × £2,337.40 |
| | `net_benefit_retained` | 1106.3 | **1168.7** | £2,337.40 − £1,168.70 |
| 2 — 3 children, ANI £58,000 | `total_child_benefit_received` | 3094 | **3268.2** | 52 × £62.85 |
| | `net_benefit_retained` | 3094 | **3268.2** | below £60,000, no charge |
| 3 — 1 child, ANI £85,000 | `total_child_benefit_received` | 1331.2 | **1406.6** | 52 × £27.05 |
| | `hicbc_tax_charge` | 1331.2 | **1406.6** | 100% clawback at or above £80,000 |
| 4 — 2 children, ANI £60,000 after pension | `total_child_benefit_received` | 2212.6 | **2337.4** | 52 × £44.95 |
| | `net_benefit_retained` | 2212.6 | **2337.4** | exactly at the threshold, no charge |
| 5 — 1 child, Gift Aid, ANI £64,000 | `total_child_benefit_received` | 1331.2 | **1406.6** | 52 × £27.05 |
| | `hicbc_tax_charge` | 266.24 | **281.32** | 20% taper × £1,406.60 |
| | `net_benefit_retained` | 1064.96 | **1125.28** | £1,406.60 − £281.32 |

The `adjusted_net_income`, `charge_percentage` and
`pension_top_up_needed_to_eliminate_charge` values were **not** changed in any
case, because the thresholds and taper were already correct. That is the clearest
evidence the correction was confined to the weekly rates.

### Tests added

`tests/tax-019-child-benefit-rates.test.ts` — 12 tests. Covers one, two, three
and four children; asserts each additional child adds exactly one
additional-child rate across a range of counts; asserts the previous year's
figures are no longer reachable; asserts the 52-week annualisation basis; and
asserts the threshold, the taper, the pension deduction and the Gift Aid
gross-up are all unchanged.

---

## Change summary

| Measure | Count |
| --- | --- |
| TAX-013 benchmark cases changed | 3 |
| TAX-019 benchmark cases changed | 5 |
| Other benchmark cases changed | 0 |
| Tolerances changed | 0 |
| Rulesets changed | 0 |
| Registry changes | 0 |
| Unrelated calculators changed | 0 |

### Files changed

| File | Reason |
| --- | --- |
| `packages/calculation-engine/src/finance/wave3/gia-tax.ts` | Read dividend allowance and rates from the ruleset |
| `packages/calculation-engine/src/finance/wave3/handlers.ts` | Resolve the ruleset for TAX-013 from the calculation context |
| `packages/calculation-engine/src/finance/wave3/hicbc.ts` | Correct the Child Benefit weekly rates |
| `packages/test-fixtures/fixtures/wave3-benchmarks.json` | 8 corrected benchmark cases, with derivations updated |
| `tests/tax-013-dividend-rates.test.ts` | New focused tests |
| `tests/tax-019-child-benefit-rates.test.ts` | New focused tests |
| `tests/wave3.test.ts` | Assert against the ruleset rate rather than a stale literal |
| `docs/specs/wave3/TAX-013.md` | The spec stated the stale rates as intended behaviour |
| `docs/specs/wave3/TAX-019.md` | The spec stated the stale rates as intended behaviour |

The two spec files are the only changes outside the code, tests and fixtures.
They are included because each stated the superseded figures as the
calculator's intended behaviour, so leaving them would have left the
repository asserting two different rules for the same calculator.

`docs/WAVE3_RULES_VERIFICATION.md` was deliberately **not** changed. It is a
dated verification record of what was checked at the time, and rewriting
history to match a later correction would destroy its value as evidence.

---

## Follow-up worth considering

Child Benefit weekly rates remain hardcoded in the engine, because adding them
to an approved ruleset artefact was outside this task's authorisation. TAX-013
now demonstrates the alternative: statutory figures living in the ruleset and
read from it. Moving Child Benefit into `uk-2026-27-v1` would close the same
failure mode for TAX-019, and would be a natural next step when the ruleset is
next revised.
