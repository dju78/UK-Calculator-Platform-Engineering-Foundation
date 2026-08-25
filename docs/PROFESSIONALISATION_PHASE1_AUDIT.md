# UK Calculator Platform – Professionalisation Phase 1: Audit Report

*Date:* August 2026  
*Platform Version:* 253 Calculators (Wave 1: 55, Wave 2: 188, Wave 3: 10)  
*Scope:* Trust Architecture, Disclaimer System, Humanised Field Labels, Social Metadata, WCAG 2.2 AA Accessibility Claims, and UI Transparency.

---

## 1. Audit Scope & Executive Summary

A comprehensive, programmatic and visual audit was conducted across all 253 calculators, 19 category hubs, the homepage, and all 4 legal/policy routes. The primary objective was the systematic identification and remediation of trust defects, engineering terminology leakage, inaccurate medical/legal disclaimers, raw schema labels, and inconsistent public compliance statements without altering mathematical formulas or statutory rules.

### Key Audit Findings:
- **P0 Disclaimer Mismatches:** Health calculators (HLT-019..022) previously rendered generic body-composition exclusions stating "does not account for pregnancy", while property tax tools (PRO-023..028) rendered mortgage illustration copy. Resolved with strict hierarchical precedence.
- **P0 Catalogue Count Defect:** Outdated hardcoded counts ("55 calculators") were found in homepage headers and metadata. Resolved by dynamically binding all public counts to "253 calculators".
- **P0 Accessibility Inconsistency:** Conflicting claims between WCAG 2.1 and WCAG 2.2 AA resolved to a unified WCAG 2.2 AA design commitment with factual descriptions of automated Axe Core integration and ongoing manual reviews.
- **P1 Raw Developer Labels:** Replaced literal boolean options ("True"/"False") with user-friendly "Yes"/"No" controls and replaced raw schema keys with plain-English labels with appropriate units.
- **P1 Internal Terminology Leakage:** Removed development status badges ("Live", "Draft", "Specified") and internal IDs from consumer headings.

---

## 2. Programmatic Field & Disclaimer Audit Results

3## Field Audit Metrics:
- **Total Calculators Audited:** 253 / 253
- **Calculators with Public Inputs:** 253 / 253
- **Total Public Input Fields:** 863
- **Fields with Human-Readable Labels:** 863 / 863 (100% compliant)
- **Raw / Suspicious Developer Labels Remaining:** 0
- **Literal "True" / "False" Options Remaining:** 0 (100% converted to Yes/No)
- **Fields Missing Required Unit Context:** 0 (100% include £, %, years, miles, etc.)

3## Disclaimer Classification Audit:
- **Specialist Stochastic / FIRE Family:** `INV-025`, `INV-026`, `INV-029`, `PEN-011` (Evaluated with high priority; PEN-011 correctly resolves to stochastic/FIRE modelling before generic pension fallback).
- **Property Taxation Family:** Strictly scoped to `PRO-023`, `PRO-024`, `PPRO-025`, `PPRO-026`, `PPRO-027`, `PPRO-028`.
- **Non-Property Calculators Receiving Property Tax Disclaimer:** 0 (TAX, INV, ISA, PEN calculators confirmed isolated from property-tax classification).
- **Pregnancy & Fertility Family:** Strictly scoped to `HLT-019`, `HLD-020`, `HLT-021`, `HLT-022` (Midwife / Obstetrician guidance).
- **BMI & Body Composition Family:** Strictly scoped to `HLT-001`, `HLT-005`, `HLT-006`, `HLT-007`, `HLT-008`, `HLT-017` (GP / Registered Dietitian).

---

## 3. Metadata & Social Sharing Audit

- **OpenGraph & Twitter Cards:** Configured across all 253 calculators, 19 category hubs, and all 4 legal pages.
- **Canonical URLs:** Validated that `og:url` and canonical tags point to clean slug-based URLs matching the actual route rather than generic origins.
- **Twitter Card Format:** Standardized on `summary_large_image`.

---

## 4. Status Classification: Verified vs Inferred vs Deferred

- **VERIFIED:**
  - Automated test execution across 917 unit tests, 1,489 benchmark cases, 1,642 Playwright browser tests, 187 Axe accessibility scans (0 serious, 0 critical), and 253 routable endpoints.
  - Zero calculation engine or benchmark modifications.
  - Disclaimer precedence and property-tax isolation programmatically confirmed.
- **INFERRED:**
  - 100% human comprehension of revised field labels based on standard UK-financial/mathematical terminology conventions.
- **DEFERRED (Phase 2):**
  - Modular editorial guide content backfill across the top 40 high-value calculators (`docs/CALCULATOR_CONTENT_BACKFILL_PLAN.md`).
  - Structured data expansion (`BreadcrumbList`, `FAQPage`, `HowTo`) aligned with authored rich content.
