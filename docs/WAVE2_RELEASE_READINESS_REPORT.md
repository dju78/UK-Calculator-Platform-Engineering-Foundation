# Wave 2 Release Readiness Report

**Verdict: WAVE 2 VERIFIED — READY FOR SAFE GIT INTEGRATION**

Generated 24 August 2026. Every figure in this report is derived by executing
the check and parsing its real output, not written by hand. The machine-readable
source is `docs/wave2-verification.json` and `docs/wave2-manifest.json`.

---

## 1. Counts, derived from the registry

| | |
|---|---|
| Baseline (canonical `origin/main`) | `df9f31f` |
| Wave 1 verified | **55 / 55** |
| Wave 2 expected | **188** |
| Wave 2 verified | **188 / 188** |
| Total platform | **243** |

All 19 categories are complete:

| Category | Verified | Category | Verified |
|---|---|---|---|
| Automotive & Travel | 11/11 | ISA & Tax Wrappers | 4/4 |
| Business & Commercial | 9/9 | Maths & Algebra | 18/18 |
| Conversions | 8/8 | Mortgages & Property | 15/15 |
| Date & Time | 8/8 | Pensions & Retirement | 7/7 |
| Education | 5/5 | Science & Engineering | 11/11 |
| Everyday & Lifestyle | 2/2 | Statistics & Data | 15/15 |
| Finance & Debt | 8/8 | Technology & Digital | 5/5 |
| Geometry | 9/9 | UK Tax & Salary | 12/12 |
| Health & Fitness | 21/21 | | |
| Home & Construction | 6/6 | | |
| Investing & Wealth | 14/14 | | |

---

## 2. Verification results

| Check | Result |
|---|---|
| Typecheck (root) | **PASS** |
| Typecheck (web) | **PASS** |
| Lint | **PASS** |
| Unit tests | **828 / 828**, 0 failed, 0 skipped |
| Registry validation | **PASS** |
| UK rules validation | **PASS** |
| Wave 1 benchmarks | **275 / 275** |
| Wave 2 benchmarks | **1,164 / 1,164** |
| Combined benchmarks | **1,439 / 1,439**, 0 failed, 0 skipped |
| UI parity | 1,439 parity assertions, all passing |
| Browser suite | **1,592 / 1,592** |
| Axe serious violations | **0** |
| Axe critical violations | **0** |
| Canonical calculator routes | **243 / 243** |
| Category routes | 19 / 19 |
| Legal routes | 4 / 4 |
| Sitemap | Lists every published calculator; no unpublished one leaks |
| robots.txt | Permits crawling, points at the sitemap |
| Mobile (320 px) | 19 / 19 representative pages, no horizontal overflow |
| Production Next.js build | **PASS** |

No tolerance was loosened and no expected benchmark value was altered to make a
test pass. Where a benchmark and the engine disagreed, the engine was corrected;
those cases are listed in section 5.

---

## 3. Feature gating

**No calculator is Live merely because an engine handler exists.**

`publishedRegistry()` requires both a handler *and* `status === "verified"`. This
was a real defect found and fixed during tranche 2I, when nine geometry
calculators would have gone live with no input fields the moment their engine
code was wired up.

The gate is now enforced by permanent tests rather than observed once:

- *the publish gate needs evidence, not just an engine handler* — asserts
  nothing unverified is published, and that a handler alone does not publish.
- *every verified Wave 2 calculator has all its evidence* — for all 188, asserts
  an engine handler exists, `implementationStatus` is `implemented`, at least
  five benchmark cases exist, the registry's declared `benchmarkCount` matches
  the fixtures exactly, UI field definitions exist, and a specification file
  exists.

That last check caught a real gap: tranche 2L promoted eight Date & Time
calculators without syncing their declared benchmark counts.

Current state: 243 published, 243 verified, 0 published-but-unverified, 0
handlers-without-verification.

---

## 4. Rules-sensitive review

The ruleset `uk-2026-27-v1` is `approved`, covers tax year 2026/27, and was
checked 22 August 2026. It carries **45 sources** and **30 source-register
entries**.

All required areas are present and asserted by test:

Income Tax (England/Wales/NI and Scotland) · National Insurance (employee and
self-employed) · Student Loans · Property transaction tax (**all three**
regimes: SDLT England & Northern Ireland, LBTT Scotland, LTT Wales) · ISA ·
Pensions · State Pension · Auto-enrolment · Dividends · Capital Gains ·
Corporation Tax · VAT · Inheritance Tax · Tax codes · Savings · Self Assessment ·
Marriage Allowance · Health · Bank holidays · HMRC mileage · Engineering
constants · Building Regulations · Education/UCAS.

Provenance governance was strengthened during this sweep. The previous check
only asserted that the sources array was non-empty — it would have passed on a
ruleset whose every figure was invented, so long as one URL sat at the bottom of
the file. It now asserts that **every** register entry names a source that is
either a URL or a stated definitional basis, and records both what was checked
and what was found.

**No statutory value was invented.** Two figures are worth flagging because they
contradict what most third-party calculators still show:

- **HMRC mileage is 55p** for the first 10,000 business miles from 6 April 2026,
  not the familiar 45p. Verified against two separate GOV.UK pages. A benchmark
  built on 45p would have been a wrong benchmark rather than a wrong engine.
- **Tax and National Insurance approved amounts genuinely differ.** For NI a
  single rate applies to every business mile with no 10,000-mile step and no
  Mileage Allowance Relief, so an employee driving 15,000 miles has two
  different approved amounts at once. Both are reported.

Where a value could not be verified from a primary source it was omitted rather
than guessed, and where a figure is derived rather than published (the
Corporation Tax marginal relief fraction, the NHS-derived calorie floors) the
derivation is recorded beside the value.

Three limits are reported as **checks, not compliance certificates**, because
the underlying standards are guidance or are copyrighted: BS 7671 voltage drop,
Approved Document K stair dimensions, and the degree classification boundaries.
Each says so in its output and its specification.

---

## 5. Defects found by the oracles and fixed in the engine

The benchmark oracles are written to use a *different method* from the engine,
not merely different code. That design paid for itself repeatedly. In every case
the engine was corrected; no expected value was adjusted to fit.

| Defect | How it was caught |
|---|---|
| Inverse normal accurate only to 4.5e-4, failing published critical values | Tightening the tolerance for values below 1 from ±0.011 to 1e-6 exposed two Wave 1 STA-006 failures. Replaced with Lanczos log-gamma plus Acklam with Halley refinement. |
| `parseDataset` silently dropping unparseable values — `[2, 4, 6]` parsed as `[4]` | A statistics oracle disagreeing on a dataset it had typed itself. |
| Dew point inversion using the Magnus algebraic form against a Buck forward function | An oracle that bisects the saturation curve instead of inverting it. At 100% humidity the dew point must *equal* the air temperature; it returned 14.95 °C for 15 °C. |
| PCP `on_track` false when contributing exactly the required amount | A half-penny rounding difference compounding to ~£2 over 240 months. |
| STA-010 understating required sample size by one against published tables | The oracle used the t-correction; the engine did not. |
| Shoe size scale off by one barleycorn (UK adult continues from child 13, not 12) | An oracle computing in inches rather than millimetres. UK 9 landed on EU 42 instead of 43. |
| Parity harness treating a null fixture value as "skip" rather than "clear" | The solve-for-any-of-these calculators saw form defaults and reported contradictions. |
| Resistor band dropdowns positional for a 4-band resistor only | 5- and 6-band resistors were impossible to enter at all. |
| Publish gate requiring only a handler | Nine geometry calculators would have gone live with no input fields. |

---

## 6. Open defects

**P0 open: none. P1 open: none.**

The register at `docs/wave2-open-defects.json` is a file rather than a claim, so
the manifest reports `UNKNOWN` if it is missing rather than reporting zero.

Six **known limitations** are recorded there and are deliberate rather than
defects — the engine models 2026/27 only; SCI-002 is resistive and says so above
25 mm²; HOM-006 covers England private stairs only; EDU-004 covers England
student finance only; TAX-003 refuses K and W1/M1/X codes rather than
approximating them; and date-relative outputs are unit-tested with a fixed clock
because the parity harness cannot pin the browser's.

---

## 7. Integration

The local repository is **working-tree source only**. Its history was
reinitialised after the build container was recycled and lost its `.git`
directory, so it has **no ancestry with `origin/main`** and must never be pushed.

- **Baseline:** `df9f31f` (Wave 1 + tranches 2A, 2B, 2C, already on origin, CI green)
- **Changes to apply:** 227 files added, 19 modified, 0 deleted
- **Method:** apply the archive contents over a checkout of `df9f31f` and create
  **new normal commits**. Do not push this repository, force-push, rebase, reset
  or recreate 2A–2C.

---

## 8. Verdict

**WAVE 2 VERIFIED — READY FOR SAFE GIT INTEGRATION**
