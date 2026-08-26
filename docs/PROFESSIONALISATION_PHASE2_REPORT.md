# UK Calculator Platform — Professionalisation Phase 2: Content, Methodology & Editorial Quality

*Date:* 25 August 2026
*Branch:* `professionalisation-phase-2-content`
*Base:* `origin/main` at `a8e0c60`

---

## Executive summary

Phase 2 added bespoke, source-verified editorial content to the forty priority
calculators defined in `docs/CALCULATOR_CONTENT_BACKFILL_PLAN.md`, without
changing a single line of calculation logic, statutory rules or approved
benchmark values.

The distinguishing feature of this work is not the prose. It is that the prose
is **verifiable**. Every figure in every worked example is re-derived by running
the real calculation engine with the exact inputs the guide records, and the
regression suite fails if any published figure drifts. Content on this platform
cannot silently diverge from the arithmetic it claims to explain.

Source verification was done against primary sources rather than against the
backfill plan, and that decision mattered: **five of the plan's figures were
stale**, and **eight of its forty entries named calculator ids that do not
exist or do not match the calculator at that id**. Two genuine engine
discrepancies were found and recorded rather than fixed.

## Status classification

| Classification | Count | Meaning |
| --- | --- | --- |
| VERIFIED | 19 guides | Every rule-sensitive claim confirmed against a primary source |
| IMPLEMENTED | 40 guides | Authored, rendered and validated |
| DEFERRED | 213 calculators | Outside the priority forty; no guide, renders as before |
| ENGINE/RULE REVIEW REQUIRED | 3 items | Recorded, not fixed — Phase 2 does not touch the engine |

## What was delivered

### Content architecture

A typed workspace package, `packages/calculator-content`, holding a
`CalculatorGuideDefinition` per calculator. Content is structured data rather
than prose in page components, which is what allows the regression suite to
validate it.

Content lives in `packages/` rather than under `apps/web/src` for a concrete
reason. `apps/web` has no `"type": "module"`, so `tsc` emits CommonJS for
anything beneath it, while the repository root declares `"type": "module"` and
`dist/` carries no `package.json`. A content module under `apps/web` therefore
compiles as CommonJS but loads as ESM, and the root test suite cannot import it
at all. This was found by hitting it, and the package boundary is the fix.

### Guides

Forty guides, each carrying a practical overview, what the calculator does, how
the calculation works, a formula and methodology explanation, a worked UK
example, key assumptions, limitations, the applicable ruleset where relevant,
official sources, related calculators and FAQs.

Length follows informational need. A VAT guide is shorter than a Capital Gains
Tax guide because VAT is simpler, not because a word count was met.

### Rendering

One component, `CalculatorGuide.tsx`, exporting `CalculatorGuideSection` for the
page to call. It is a server component with no client JavaScript; the FAQ
accordion uses native `<details>`/`<summary>`, which is keyboard operable and
screen-reader announced without a script.

### Validation

`tests/calculator-guides.test.ts` — 55 tests, all passing.

The load-bearing check runs the engine for every worked example and asserts each
published figure matches, then re-runs three days later and asserts nothing
moved. That second run exists because the pregnancy calculator reads the current
date: without it, a published gestational age would be wrong the following day.

The rest validates structure — target ids are live calculators, related links
resolve, sources are HTTPS on official domains and state which rule they
support, rule-sensitive guides name their ruleset, a guide claiming VERIFIED
cites no unverified source, and no placeholder text, internal wave terminology,
raw calculator id or promissory language reaches the public surface.

## ENGINE/RULE REVIEW REQUIRED

Full detail in `docs/PHASE2_SOURCE_VERIFICATION_REGISTER.md`.

### 1. TAX-013 dividend rates contradict the approved ruleset and TAX-011

`packages/calculation-engine/src/finance/wave3/gia-tax.ts` hardcodes dividend
rates of 8.75% basic and 33.75% higher. GOV.UK publishes 10.75% and 35.75% for
2026/27, the approved ruleset `uk-2026-27-v1` records those rates, and TAX-011
applies them.

The result is that two live calculators give different answers for the same
dividend income. On £2,500 of dividends with £55,000 of other income, TAX-013
returns £675 of dividend tax where the correct figure on the approved ruleset
is £715.

Not fixed: correcting it changes approved benchmark expectations for TAX-013,
which is a decision for the engine and rules owners. The guide is marked
`SOURCE VERIFICATION REQUIRED`, its dividend outputs are excluded from the
worked example, and the limitation is stated in the public content.

### 2. TAX-019 Child Benefit weekly rates appear a year out of date

`packages/calculation-engine/src/finance/wave3/hicbc.ts` hardcodes weekly Child
Benefit of £25.60 and £16.95, commented as 2026/27 rates. GOV.UK shows £27.05
and £17.90. For two children that is £2,212.60 against £2,337.40 a year.

The GOV.UK page did not state which tax year it covers, so this is recorded as
requiring verification rather than asserted as an error. The thresholds and the
taper are correct; only the cash amounts are affected. The guide publishes the
verified adjusted net income, taper percentage and pension top-up figures, and
excludes the benefit and cash-charge outputs.

### 3. PRO-018 buy-to-let underwriting source unreachable

Not an engine defect. The Bank of England page for supervisory statement
SS13/16 returned HTTP 403 during verification, so the interest cover ratio and
stress rate conventions the plan asserts could not be confirmed. No threshold is
asserted in the public content.

## Plan corrections

The backfill plan was treated as a scope document, not as an authority.

### Stale figures

| Plan figure | Plan value | Verified value |
| --- | --- | --- |
| Dividend tax rates | 8.75% / 33.75% / 39.35% | 10.75% / 35.75% / 39.35% |
| Additional Dwelling Supplement | 6% | 8% from 5 December 2024 |
| Mortgage stress test | "3% above standard variable rate" | MCOB 11.6.18R: at least 1% over five years |
| Full new State Pension | £221.20 a week | £241.30 a week |
| BMI ethnic thresholds | Asserted without figures | NICE NG246: overweight from 23, obesity from 27.5 |

In three of these five the engine was already correct and the plan was not.

### Calculator ids that do not exist or do not match

One plan entry names an id that does not exist anywhere in the registry
(TAX-021), and seven name ids whose calculator is a different tool from the one
described. The calculator id was treated as the authoritative identity
throughout, because that is what the registry, the engine and the routes key
on. All eight are recorded in `packages/calculator-content/src/top40.ts` as
`planSubstitutions` and `planLabelCorrections`, and in each affected guide's
editorial notes.

No calculator was silently replaced.

## Phase 3 boundary

Phase 2 modified exactly one file owned by Phase 3:
`apps/web/src/app/calculators/[slug]/page.tsx`, by four lines — one import, one
blank line, one comment and one JSX element. Nothing else in that file changed.

No metadata helper, sitemap, robots file, category page or JSON-LD
infrastructure was touched. The guide component deliberately emits **no**
JSON-LD: structured data is Phase 3's responsibility, and two phases writing
competing `FAQPage` blocks onto the same page would be worse than none.

The guide data is shaped for Phase 3 to consume: `faqs` for honest `FAQPage`
markup, `formulaExplanation.steps` for `HowTo`, `relatedCalculators` for
internal-link architecture, and `officialSources` for citations.
`getCalculatorGuide(id)` is the single entry point.

## Verification results

All results below are from live execution on 25 August 2026, not carried
forward from earlier phases.

| Check | Result |
| --- | --- |
| Calculators | 253 / 253 |
| Routes | 253 / 253 |
| Reference benchmarks | 1489 / 1489 |
| Unit tests | 972 / 972 |
| Phase 2 content validation | 55 / 55 |
| Browser / parity tests (Playwright) | 1642 / 1642 |
| Axe accessibility violations (serious or critical) | 0 |
| Typecheck (root) | PASS |
| Typecheck (web) | PASS |
| Lint | PASS |
| Production build | PASS — 253 calculator paths prerendered |
| Calculation engine changes | NONE |
| Ruleset changes | NONE |
| Approved benchmark changes | NONE |
| Registry changes | NONE |

`git diff --stat origin/main...HEAD -- packages/calculation-engine` returns
empty, as do the equivalents for `packages/rules-uk`,
`packages/test-fixtures` and `packages/calculator-registry`.

The Playwright run was executed against a production build served by
`next start`, with the guide content rendering on every affected page. The Axe
checks in `platform-a11y.spec.ts` and `tax-frequency.spec.ts` cover pages that
now carry a full guide, so the zero-violation result reflects the new content
rather than the pre-Phase-2 page.

Rendering was also confirmed directly: a guided calculator page emits
`data-guide-for`, all nine guide sections and the engine-verified worked-example
figures, while a calculator outside the priority forty emits none of it.

## What Phase 2 did not do

- Did not modify the calculation engine, any ruleset, any benchmark fixture or
  the calculator registry.
- Did not author guides for the 213 calculators outside the priority forty.
- Did not implement structured data, sitemap, robots or metadata changes.
- Did not merge, deploy, open a pull request or modify `main`.
- Did not assert any figure it could not verify against a primary source.
