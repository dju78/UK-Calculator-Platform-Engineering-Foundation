# Wave 2 Test Evidence

Generated 2026-08-24. Every figure below was produced by running the check.

## Executed results

| Check | Result |
|---|---|
| Typecheck (root) | PASS |
| Typecheck (web) | PASS |
| Lint | PASS |
| Unit tests | 828/828, failed 0, skipped 0 |
| Wave 1 benchmarks | 275/275 |
| Wave 2 benchmarks | 1164/1164 |
| Combined benchmarks | 1439/1439, failed 0, skipped 0 |
| Routes | 243/243 |
| Browser suite | 1592/1592 |
| Axe serious | 0 |
| Axe critical | 0 |
| Production build | PASS |

## How the numbers are produced

`scripts/final_verification.mjs` RUNS each check and parses its real output.
A check that fails to run is recorded as an error rather than skipped, so a
broken harness can never be mistaken for a passing one. The browser suite is
read from a Playwright log the caller produced, and the log path is recorded.

## Accessibility method

Axe runs inside the browser suite and every scan asserts an empty list of serious and critical violations, so a passing suite is exactly a zero count. The platform-a11y spec scans one calculator from every category WITH RESULTS SHOWN, plus every category route and every legal route.

## Benchmark tolerances

Money is compared to +/- 0.011, which is a penny plus rounding slack. Values
below 1 use 1e-6, because a flat penny tolerance on a rate would accept an
error of 1.1 percentage points. Tightening that split is what exposed the
inverse-normal defect in Wave 1 STA-006. No tolerance was loosened at any
point, and no expected value was changed to make a test pass.
