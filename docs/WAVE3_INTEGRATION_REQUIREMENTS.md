# Wave 3 Deferred Integration Requirements

This document specifies the exact shared infrastructure changes deferred to post-Wave 2 merge.
These files are kept unmodified or minimally decoupled during Phase 1-6 to protect against concurrency conflicts with active Wave 2 development.

---

## 1. Calculator Registry Package

- **File**: `packages/calculator-registry/src/index.ts` and `packages/calculator-registry/src/wave3-registry.json`
- **Required Change**:
  1. Add `import rawWave3 from "./wave3-registry.json" with { type: "json" };`
  2. Export `export const wave3Registry = rawWave3 as CalculatorDefinition[];`
  3. Update `calculatorRegistry = [...wave1Registry, ...wave2Registry, ...wave3Registry];`
  4. Add `"Wave 3"` to `VALID_WAVES`.
- **Reason**: Central catalogue registration for all 10 canonical Wave 3 calculators.
- **Dependency**: Wave 2 registry reconciliation in main.

---

## 2. Calculation Engine Router

- **File**: `packages/calculation-engine/src/engine.ts`
- **Required Change**:
  1. Import Wave 3 handlers from `./finance/wave3/handlers.js`
  2. Register all 10 handler keys:
     - `PRO-008`: `pro008Handler` (Fixed vs Tracker Mortgage)
     - `PRO-028`: `pro028Handler` (Property CGT)
     - `INV-025`: `inv025Handler` (Portfolio Withdrawal)
     - `INV-026`: `inv026Handler` (Safe Withdrawal Rate)
     - `INV-027`: `inv027Handler` (Portfolio Rebalancing)
     - `INV-029`: `inv029Handler` (Monte Carlo Simulator)
     - `ISA-007`: `isa007Handler` (SIPP vs ISA)
     - `TAX-013`: `tax013Handler` (General Investment Account Tax)
     - `TAX-019`: `tax019Handler` (High Income Child Benefit Charge)
     - `PEN-011`: `pen011Handler` (FIRE Calculator)
- **Reason**: Connects isolated Wave 3 engines to the universal `calculate()` dispatcher.
- **Dependency**: Completion of Wave 2 calculation engine handlers in main.

---

## 3. Web UI Registry & Staging Gate

- **File**: `apps/web/src/components/calculators/fieldMappings.ts` and `apps/web/src/components/calculators/outputFormats.ts`
- **Required Change**:
  1. Import `wave3FieldMappings` and `wave3ResultConfig` from `./wave3FieldMappings.js`.
  2. Merge into `mappings` and `calculatorResultConfig`.
  3. Register custom display formatters for Wave 3 output keys (e.g. `fire_age`, `runway_years`, `tax_charge_pct`, `swr_percentage`).
- **Reason**: Enables dynamic rendering for all Wave 3 calculators in the Next.js UI once approved for release.
- **Dependency**: Wave 2 UI component and formatting stabilization.

---

## 4. Test Fixtures Manifest

- **File**: `packages/test-fixtures/src.ts`
- **Required Change**:
  1. Export Wave 3 benchmark suite from `./fixtures/wave3-benchmarks.json`.
- **Reason**: Universal benchmark runner inclusion.
- **Dependency**: Wave 2 test suite integration.
