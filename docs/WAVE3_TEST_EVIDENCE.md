# UK Calculator Platform — Wave 3 Test Evidence

**Evaluation Date:** 2026-08-25  
**Platform Scope:** Waves 1, 2, and 3 (253 Total Calculators)  
**Branch:** `wave3-development`

---

## 1. Test Execution Summary

```
========================================================================================
Suite / Check                  Total Cases    Passed    Failed    Skipped    Duration
========================================================================================
Root & Web TypeScript Types           N/A      PASS         0          0        ~18s
ESLint Code Quality                   N/A      PASS         0          0        ~10s
Node Unit Test Suite                  904       904         0          0       19.8s
Reference Benchmark Suite            1489      1489         0          0        ~8s
Route Integrity & Slugs               253       253         0          0        ~2s
Next.js Production Build (SSG)        282       282         0          0       28.7s
Playwright Browser & Parity Suite    1642      1642         0          0       12.6m
Axe Core Accessibility Audit         1642      PASS         0          0         N/A
========================================================================================
```

---

## 2. Reference Benchmark Wave Breakdown

```
=== BENCHMARK SUMMARY ===
Wave 1   total   275  executed   275  passed   275  failed    0  skipped     0
Wave 2   total  1164  executed  1164  passed  1164  failed    0  skipped     0
Wave 3   total    50  executed    50  passed    50  failed    0  skipped     0
COMBINED total  1489  executed  1489  passed  1489  failed    0  skipped     0

Wave 1 fixture cases: 275
Wave 2 fixture cases: 1164 (minimum for full Wave 2: 940)
Wave 3 fixture cases: 50 (minimum for full Wave 3: 50)
```

---

## 3. Wave 3 Benchmark Fixtures Evidence (50/50 Passed)

### PRO-008: Fixed vs Tracker Mortgage Calculator (5 Cases)
- Case 1: Standard 25y mortgage 2y fixed vs tracker at same initial rate — **PASS**
- Case 2: 5y deal with falling interest rates — **PASS**
- Case 3: 2y deal with rising interest rates — **PASS**
- Case 4: Zero fees comparison on 30y term — **PASS**
- Case 5: Financed product fee into loan balance — **PASS**

### PRO-028: Property Capital Gains Tax Calculator (5 Cases)
- Case 1: Standard Buy-to-let property sale with basic band remaining — **PASS**
- Case 2: Partial Private Residence Relief with higher rate taxpayer — **PASS**
- Case 3: 100% Main Residence Relief (no CGT) — **PASS**
- Case 4: Joint ownership by spouses / civil partners — **PASS**
- Case 5: Disposal at a capital loss — **PASS**

### INV-025: Portfolio Withdrawal Calculator (5 Cases)
- Case 1: Baseline 30-year retirement drawdown with inflation — **PASS**
- Case 2: Pure cash drawdown without growth or inflation — **PASS**
- Case 3: High growth perpetual growth portfolio — **PASS**
- Case 4: Fixed nominal drawdown without inflation — **PASS**
- Case 5: High fee drag premature depletion — **PASS**

### INV-026: Safe Withdrawal Rate Calculator (5 Cases)
- Case 1: Traditional 30-year 60/40 balanced retirement — **PASS**
- Case 2: 50-year ultra-long FIRE early retirement — **PASS**
- Case 3: 100% Equity aggressive portfolio — **PASS**
- Case 4: 100% Bond defensive portfolio — **PASS**
- Case 5: Short 15-year bridge retirement — **PASS**

### INV-027: Portfolio Rebalancing Calculator (5 Cases)
- Case 1: 4-Asset portfolio rebalance with £5,000 cash injection — **PASS**
- Case 2: Cash injection only rebalancing without selling — **PASS**
- Case 3: Perfectly balanced portfolio (zero trades) — **PASS**
- Case 4: Cash withdrawal rebalancing — **PASS**
- Case 5: Severe drift 2-asset portfolio — **PASS**

### INV-029: Monte Carlo Investment Simulator (5 Cases)
- Case 1: Standard 20-year wealth accumulation with seeded PRNG — **PASS**
- Case 2: Zero volatility deterministic compounding equivalence — **PASS**
- Case 3: Retirement decumulation with sequence risk — **PASS**
- Case 4: High growth aggressive accumulation — **PASS**
- Case 5: Short 5-year goal — **PASS**

### ISA-007: SIPP vs ISA Calculator (5 Cases)
- Case 1: Higher rate taxpayer now (40%) to basic rate in retirement (20%) — **PASS**
- Case 2: Basic rate taxpayer staying basic rate in retirement — **PASS**
- Case 3: Additional rate taxpayer (45%) to higher rate (40%) — **PASS**
- Case 4: Zero investment growth structural wrapper test — **PASS**
- Case 5: Higher rate taxpayer staying higher rate in retirement — **PASS**

### TAX-013: General Investment Account Tax Calculator (5 Cases)
- Case 1: Higher rate taxpayer with dividends, gains, and interest — **PASS**
- Case 2: Basic rate taxpayer within all statutory allowances — **PASS**
- Case 3: Additional rate taxpayer (£0 PSA and highest tax rates) — **PASS**
- Case 4: Capital losses offsetting realised capital gains — **PASS**
- Case 5: Pure dividend income portfolio at higher rate — **PASS**

### TAX-019: High Income Child Benefit Charge Calculator (5 Cases)
- Case 1: Mid-taper Adjusted Net Income (£70,000) for 2 children — **PASS**
- Case 2: Below £60,000 threshold (zero charge) — **PASS**
- Case 3: Above £80,000 threshold (100% clawback) — **PASS**
- Case 4: Pension contribution successfully eliminating HICBC charge — **PASS**
- Case 5: Gift Aid donations reducing Adjusted Net Income — **PASS**

### PEN-011: FIRE Calculator (5 Cases)
- Case 1: Standard 30yo FIRE roadmap — **PASS**
- Case 2: High earner rapid FIRE accumulation — **PASS**
- Case 3: Already reached Financial Independence (0 years) — **PASS**
- Case 4: LeanFIRE low spending early start — **PASS**
- Case 5: FatFIRE high lifestyle milestone — **PASS**

---

## 4. Route Verification Evidence

```
Wave 1: 55/55 routable, 55/55 verified
Wave 2: 188/188 routable, 188/188 verified
Wave 3: 10/10 routable, 10/10 verified
Total routable: 253/253
Registry integrity and route uniqueness verified.
```
