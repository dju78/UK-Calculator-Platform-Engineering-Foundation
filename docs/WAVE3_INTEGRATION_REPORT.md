# UK Calculator Platform — Wave 3 Integration Report

**Date:** 2026-08-25  
**Branch:** `wave3-development`  
**Integrated Main Baseline:** `2948d94` (Merge pull request #1 from dju78/wave2-final-integration)  
**Status:** **FULLY INTEGRATED & VERIFIED**

---

## 1. Executive Summary

Wave 3 introduces 10 canonical, high-value personal finance, investment, and UK statutory calculators into the unified UK Calculator Platform. Following the merge of the completed Wave 2 `main` branch into `wave3-development`, all 10 Wave 3 calculators have been wired into the shared platform infrastructure.

The platform has expanded from 243 to **253 fully routable, verified calculators** backed by **1,489 reference benchmarks** and **1,642 browser/accessibility end-to-end tests** with zero failures.

---

## 2. Integrated Wave 3 Calculators (10/10)

| ID | Calculator Name | Category | Risk | Rules Sensitive | Benchmark Cases | Spec File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PRO-008** | Fixed vs Tracker Mortgage Calculator | Mortgages & Property | Medium | No | 5 | `docs/specs/wave3/PRO-008.md` |
| **PRO-028** | Property Capital Gains Tax Calculator | Mortgages & Property | High | **Yes** (`uk-2026-27-v1`) | 5 | `docs/specs/wave3/PRO-028.md` |
| **INV-025** | Portfolio Withdrawal Calculator | Investing & Wealth | Medium | No | 5 | `docs/specs/wave3/INV-025.md` |
| **INV-026** | Safe Withdrawal Rate Calculator | Investing & Wealth | Medium | No | 5 | `docs/specs/wave3/INV-026.md` |
| **INV-027** | Portfolio Rebalancing Calculator | Investing & Wealth | Medium | No | 5 | `docs/specs/wave3/INV-027.md` |
| **INV-029** | Monte Carlo Investment Simulator | Investing & Wealth | High | No (Deterministic Seeded PRNG) | 5 | `docs/specs/wave3/INV-029.md` |
| **ISA-007** | SIPP vs ISA Calculator | ISA & Tax Wrappers | High | **Yes** (`uk-2026-27-v1`) | 5 | `docs/specs/wave3/ISA-007.md` |
| **TAX-013** | General Investment Account Tax Calculator | UK Tax & Salary | High | **Yes** (`uk-2026-27-v1`) | 5 | `docs/specs/wave3/TAX-013.md` |
| **TAX-019** | High Income Child Benefit Charge Calculator | UK Tax & Salary | High | **Yes** (`uk-2026-27-v1`) | 5 | `docs/specs/wave3/TAX-019.md` |
| **PEN-011** | FIRE Calculator | Pensions & Retirement | Medium | No | 5 | `docs/specs/wave3/PEN-011.md` |

---

## 3. Platform Architecture & Wiring Summary

1. **Calculator Registry (`packages/calculator-registry`)**:
   - Extended `LaunchWave` type to include `"Wave 3"`.
   - Created `packages/calculator-registry/src/wave3-registry.json` containing 10 verified definitions.
   - Wired `wave3Registry` into `calculatorRegistry` and exported from the package entry point.
   - Updated `VALID_WAVES` validation in registry integrity checks.

2. **Calculation Engine (`packages/calculation-engine`)**:
   - Integrated Wave 3 calculation modules and handler mappings in `src/engine.ts`.
   - All 10 handlers (`pro008Handler`, `pro028Handler`, `inv025Handler`, `inv026Handler`, `inv027Handler`, `inv029Handler`, `isa007Handler`, `tax013Handler`, `tax019Handler`, `pen011Handler`) registered into the central router.

3. **Test Fixtures (`packages/test-fixtures`)**:
   - Added `wave3Benchmarks` (50 cases) to `src.ts` and merged into `allBenchmarks`.
   - Combined benchmark suite across all waves: **1,489 cases**.

4. **Web Frontend (`apps/web`)**:
   - Enabled `WAVE3_ENABLED = true` in `wave3Staging.ts`.
   - Merged `wave3Mappings` into main `mappings` dictionary in `fieldMappings.ts`.
   - Registered percentage, count, and non-money output formatting in `outputFormats.ts`.
   - Extended E2E parity harness `parity.spec.ts` to execute all Wave 3 fixtures against the live UI.

5. **Verification Tools (`scripts/`)**:
   - `scripts/benchmark-runner.ts`: Wave 1 (275), Wave 2 (1164), Wave 3 (50) -> 1489 total.
   - `scripts/verify_routes.ts`: Verified 253/253 routable calculators with zero slug collisions.
   - `scripts/final_verification.mjs`: Complete multi-suite automated runner.

---

## 4. Statutory Rules Sensitivity Verification (4/4)

The 4 rules-sensitive Wave 3 calculators were verified against the authoritative UK tax ruleset `uk-2026-27-v1.json`:

- **PRO-028 (Property CGT)**: Annual Exempt Amount (£3,000), Basic rate property CGT (18%), Higher rate property CGT (24%), Private Residence Relief (PRR) final 9-month statutory exemption, 60-day UK residential property reporting deadline.
- **ISA-007 (SIPP vs ISA)**: Basic rate tax relief top-up (20%), higher rate relief (40%), additional rate relief (45%), 25% tax-free pension commencement lump sum (PCLS up to £268,275), £20,000 ISA annual allowance.
- **TAX-013 (GIA Tax)**: Dividend Allowance (£500), Personal Savings Allowance (£1,000 basic / £500 higher / £0 additional), Capital Gains Annual Exempt Amount (£3,000), basic/higher/additional dividend and CGT tax rates.
- **TAX-019 (HICBC)**: Statutory £60,000 threshold (raised from £50,000), £80,000 100% clawback threshold (1% per £200 over £60k), Adjusted Net Income deductions for gross pension contributions and Gift Aid.

---

## 5. Comprehensive Verification Evidence

- **Typecheck**: Root TypeScript and Web Next.js TypeScript compilation: **PASS (0 errors)**.
- **Lint**: ESLint across all packages and web app: **PASS (0 warnings, 0 errors)**.
- **Unit Tests**: `npm test`: **904/904 PASS (0 failed, 0 skipped)**.
- **Reference Benchmarks**: `npm run bench:reference`: **1,489/1,489 PASS (0 failed, 0 skipped)**.
- **Route Integrity**: `node dist/scripts/verify_routes.js`: **253/253 routable, 253/253 verified (0 collisions)**.
- **Production Build**: `npm run build`: **PASS (282/282 static HTML pages rendered)**.
- **Browser & Accessibility Tests**: `npx playwright test`: **1,642/1,642 PASS (0 failed, 0 flaky)**.
- **Axe Core Accessibility**: **0 Serious, 0 Critical violations**.
