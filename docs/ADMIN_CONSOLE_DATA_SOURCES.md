# UK Calculator Platform Management Console — Data Sources & Telemetry Reference

This document details the telemetry, metadata, and data sources powering the UK Calculator Platform Management Console (`apps/admin`).

---

## 1. Primary Platform Data Sources

### A. Internal Static & Build-Time Sources
1. **Calculator Registry (`packages/calculator-registry`)**:
   - Authoritative list of all 253 calculators, 19 categories, launch waves (Wave 1: 55, Wave 2: 188, Wave 3: 10), and risk tiers.
2. **Statutory Ruleset (`packages/rules-uk`)**:
   - Active 2026/27 tax year ruleset (`uk-2026-27-v1`) spanning 9 statutory rule families.
3. **Platform Verification Artifact (`docs/platform-verification-latest.json`)**:
   - Bundled at build time via `@docs/*` static import.
   - Authoritative record of 1,120 unit tests, 1,489 reference benchmarks, and WCAG 2.2 AA accessibility audit results.
4. **Canonical Sitemap Generator (`apps/web/src/app/sitemap.ts`)**:
   - Exact derivation of all 284 production routes.
5. **Governance Review Calendar (`governance-calendar.ts`)**:
   - Derives scheduled statutory review deadlines based on UK fiscal timetable (Autumn Statement, Spring Budget, Scottish Budget Resolution, DfE updates).

---

## 2. External Growth & Operations Telemetry Sources

### B. Cloudflare Web Analytics (Public Visits & Page Views)
- **Purpose**: Privacy-first aggregate traffic analytics for the public website.
- **Metrics**: Total Visits, Page Views, Top Countries, Top Paths, Referrers, Device Types.
- **Privacy Model**: Privacy-first and cookie-free. Does not collect or use visitors' personal data and does not track individual end users across customers' sites.
- **Freshness / Cache**: Cached on admin server for 5 minutes (`revalidate: 300`).

### C. Google Search Console API (Organic Search Performance)
- **Purpose**: Official search performance metrics from Google Organic Search (`https://www.googleapis.com/auth/webmasters.readonly`).
- **Property**: Configurable URL-prefix property (`https://ukcalc.jomovate.com/`).
- **Metrics**: Total clicks, impressions, average click-through rate (CTR), average SERP ranking position, top keywords, landing pages.
- **Distinction**: Measures search engine result visibility only; does not represent total website traffic (which includes direct and referral visitors).
- **Freshness**: Finalized 28-day data window.

### D. GitHub Actions REST API (Engineering Health)
- **Purpose**: Read-only continuous integration status.
- **Metrics**: Latest workflow status (Success, Failure, In Progress), commit SHA, branch, duration, recent 10 runs.
- **Freshness / Cache**: Cached for 60 seconds (`revalidate: 60`).

---

## 3. Telemetry Distinction: Total Traffic vs. Google Search

| Attribute | Cloudflare Web Analytics | Google Search Console |
| :--- | :--- | :--- |
| **Measurement Point** | Edge network / Browser beacon | Google Search Engine Result Pages (SERPs) |
| **Traffic Types Included** | Direct, Organic Search, Referrals, Social | Google Organic Search only |
| **Primary Units** | Visits & Total Page Views | Search Clicks & Search Impressions |
| **Query Breakdown** | Not applicable (Referrer source only) | Keyword query strings and SERP ranking positions |
| **Privacy Scope** | Aggregate visit counts without tracking cookies | Aggregated anonymized search terms |