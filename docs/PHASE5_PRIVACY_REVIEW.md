# Professionalisation Phase 5 — Privacy & Data Protection Review

## 1. Privacy Architecture Principles

The UK Calculator Platform operates under a strict privacy-by-design architecture:
- **Zero Server-Side User Data Storage**: All calculations execute locally in the user's browser runtime.
- **Zero Tracking / Advertising / Analytics**: No third-party trackers, affiliate cookies, or analytics scripts are loaded.
- **No User Accounts / Authentication Required**: Users do not need an account or email to use any feature on the platform.

---

## 2. Phase 5 Utility Privacy Safeguards

### A. Shareable URL Security (Workstream C)
- When users click "Share Link" or copy the calculator web address, the system generates the clean canonical URL:
  `https://ukcalc.jomovate.com/calculators/[slug]`
- User financial inputs (e.g. annual gross salary, mortgage balances, debt amounts, medical metrics) are **never** appended to query strings or URL fragments by default.
- This prevents accidental disclosure of confidential financial data when links are emailed, shared in messaging apps, or logged in browser histories/proxies.

### B. Local Storage Invariants (Workstream E)
- Browser `localStorage` is used exclusively for user convenience features (Favourites & Recents).
- The platform stores **only canonical calculator slugs (strings)**:
  - `ukcalc_favourites`: e.g. `["uk-income-tax-calculator", "uk-mortgage-calculator"]`
  - `ukcalc_recents`: e.g. `["bmi-calculator", "uk-salary-calculator"]` (capped at 8 items)
- **What is NEVER stored in `localStorage`**:
  - User input values (e.g. £45,000)
  - Calculated output values (e.g. £32,450 net pay)
  - Timestamps, IP addresses, or device identifiers
  - Form field interaction history

### C. Clipboard Copy & Export (Workstream D)
- Copying calculation summaries is an explicit user-initiated action.
- The clipboard summary text is formatted locally and placed directly into the operating system clipboard buffer without network transmission.

---

## 3. Compliance Summary

- **UK GDPR & Data Protection Act 2018**: Full compliance; zero personal data processed on backend servers.
- **PECR (Privacy and Electronic Communications Regulations)**: Full compliance; no non-essential cookies or tracking technologies deployed.
