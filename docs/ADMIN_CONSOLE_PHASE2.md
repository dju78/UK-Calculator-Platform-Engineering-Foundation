# UK Calculator Platform Management Console — Phase 2 Architecture & Integration Guide

**Application URI**: `https://admin.ukcalc.jomovate.com`  
**Public Platform URI**: `https://ukcalc.jomovate.com`  
**Hosting**: Vercel (Standalone deployment root: `apps/admin`)  
**Phase Name**: Phase 2 — Live Growth & Operations

---

## 1. Executive Summary & Cost Model

Phase 2 enhances the UK Calculator Platform Management Console with live, privacy-first operational and growth telemetry under a strict zero-paid-dependency architecture.

### Cost Model Summary

| Integration | Purpose | Tier | Monthly Cost | Required / Optional | Credentials Needed |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Cloudflare Web Analytics** | Public visit & page view telemetry | Free tier | **£0.00** | Optional | `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` (public beacon)<br>`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (admin API) |
| **Google Search Console** | Organic search clicks, impressions, queries | Free API | **£0.00** | Optional | `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (`webmasters.readonly` scope) |
| **GitHub Actions REST API** | CI health & regression execution monitoring | Public REST | **£0.00** | Optional | None (public) or optional `GITHUB_READ_TOKEN` |
| **Statutory Governance Calendar** | Regulatory timetable review tracking | Internal metadata | **£0.00** | Included | None (derived from `@foundation/rules-uk`) |

> [!NOTE]
> **Free Operation Statement**:
> Phase 2 can operate without any paid analytics subscription. The platform does NOT require or depend on Vercel Web Analytics paid upgrades, Speed Insights paid upgrades, paid SaaS tracking, external databases, or third-party paid monitoring services. All external integrations operate within free limits or fail gracefully with clear "Not connected" statuses without blocking application compilation.

---

## 2. Environment Variables & Secret Isolation

All credentials (except the public Cloudflare beacon site token) are strictly **server-side only** and are never exposed to browser bundles or client-rendered HTML.

| Variable Name | Scope | Application | Required for Build | Description |
| :--- | :--- | :--- | :---: | :--- |
| `ADMIN_PASSWORD` | Server only | `apps/admin` | **Yes** (in production) | Primary secret passphrase for admin console access. |
| `ADMIN_SESSION_SECRET` | Server only | `apps/admin` | **Yes** (in production) | 32+ character secret for HMAC-SHA256 session token generation. |
| `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Public client | `apps/web` | **No** | Public site token for Cloudflare Web Analytics JS beacon. |
| `CLOUDFLARE_ACCOUNT_ID` | Server only | `apps/admin` | **No** | Cloudflare Account ID for GraphQL analytics ingestion. |
| `CLOUDFLARE_API_TOKEN` | Server only | `apps/admin` | **No** | Read-only Cloudflare API token with Analytics read permissions. |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Server only | `apps/admin` | **No** | Target URL-prefix property (default: `https://ukcalc.jomovate.com/`). |
| `GOOGLE_CLIENT_EMAIL` | Server only | `apps/admin` | **No** | Service account client email with property access in Search Console. |
| `GOOGLE_PRIVATE_KEY` | Server only | `apps/admin` | **No** | RSA private key for Google Cloud service account authentication. |
| `GITHUB_READ_TOKEN` | Server only | `apps/admin` | **No** | Optional fine-grained GitHub token for high-rate CI polling. |

---

## 3. Integration Details & Manual Configuration

### A. Cloudflare Web Analytics (Visits & Page Views)
- **Public Beacon Model**: When `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` is set, `apps/web` loads Cloudflare's lightweight JavaScript beacon.
- **Metric Terminology**: The platform uses official Cloudflare metrics: **Visits** and **Page Views**. (Not mislabeled as unique people).
- **Status Model**:
  - `BEACON_CONFIGURED`: Public beacon active on `apps/web`.
  - `LIVE_API_CONNECTED`: Server-side GraphQL query active and returning data.
  - `LIVE_API_UNAVAILABLE`: Server token missing or GraphQL endpoint unreachable; displays "Live analytics unavailable" with `null` metric values (no fake zeros).
- **Privacy Model**: Privacy-first and cookie-free. Does not collect or use visitors' personal data and does not track individual end users across customers' sites.

### B. Google Search Console (Organic Search Performance)
- **Property Configuration**: URL-prefix property configured at `https://ukcalc.jomovate.com/`.
- **Property Permission**: The Google Cloud service account email (`GOOGLE_CLIENT_EMAIL`) must be added in the Google Search Console user settings for the property with appropriate access (Restricted or Full).
- **OAuth / API Scope**: The server-side client authorizes requests using the read-only OAuth scope `https://www.googleapis.com/auth/webmasters.readonly`.
- **Metrics**: Total Organic Clicks, Total Impressions, Average CTR, Average Position, Top Queries, Top Landing Pages, Countries, and Devices.

### C. GitHub Actions CI Health
- **Scope**: Read-only GitHub Actions workflow runs API (`/actions/runs`) for repository `dju78/UK-Calculator-Platform-Engineering-Foundation`.
- **Authentication**: Unauthenticated public reads supported; optional `GITHUB_READ_TOKEN` for higher rate limits. Zero write actions or mutation controls.

### D. Statutory Governance Calendar
- **Scope**: Derived from `@foundation/rules-uk` active ruleset (`uk-2026-27-v1`) and statutory review timetables (Autumn Statement, Spring Budget, Scottish Budget Resolution, DfE schedules).
