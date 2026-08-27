# Phase 6 Privacy Review

This review audits the measurement, growth, monetisation-readiness, and embedding features introduced in Phase 6 against UK GDPR, PECR, and privacy engineering standards.

---

## 1. Executive Summary

Phase 6 introduces growth and measurement infrastructure while strictly maintaining the zero-knowledge client-side computation model established in Phases 1–5.

* **Default State:** Analytics is disabled by default.
* **Consent Control:** Implemented with equal button hierarchy; user choice stored locally in browser `localStorage`.
* **Zero Input/Result Telemetry:** All calculation inputs (salaries, taxes, debts, savings, health, pregnancy) and outputs are strictly prohibited from event tracking.
* **Fail-Closed Sanitizer:** Implemented in `apps/web/src/lib/analytics/sanitizer.ts`.

---

## 2. Telemetry & Data Flow Audit

| Data Category | Transmitted to Server? | Transmitted to Third Parties? | Handled in LocalStorage? | Audit Status |
|---|---|---|---|---|
| **Calculator Inputs** (e.g. Salary, Loan) | **NO** | **NO** | NO | **PASS** |
| **Calculation Outputs** (e.g. Take-home) | **NO** | **NO** | NO | **PASS** |
| **Health / Pregnancy Inputs** | **NO** | **NO** | NO | **PASS** |
| **Analytics Event Names** (e.g. `page_view`) | Only if enabled | Only if enabled | NO | **PASS** |
| **Calculator Slugs / Categories** | Only if enabled | Only if enabled | NO | **PASS** |
| **Aggregated Search Result Counts** | Only if enabled | Only if enabled | NO | **PASS** |
| **Raw Search Text / Query Strings** | **NO** (Blocked) | **NO** (Blocked) | NO | **PASS** |
| **Favourites & Recents** | **NO** | **NO** | YES (Client-only) | **PASS** |
| **Analytics Consent Choice** | **NO** | **NO** | YES (Client-only) | **PASS** |

---

## 3. Advertising & Affiliate Privacy Controls

* No third-party advertising network scripts (e.g. Google AdSense, Meta Pixel) are loaded.
* `AdSlot` components render `null` by default.
* Outbound commercial links enforce `rel="sponsored nofollow noopener"`.

---

## 4. Embed Privacy Model

* Iframe embed routes (`/embed/[slug]`) execute calculations strictly in the client's browser inside the iframe sandbox.
* Host pages embedding our iframe have no access to user inputs or results within the iframe.
* Embed routes do not store cookies or personal profiles.
