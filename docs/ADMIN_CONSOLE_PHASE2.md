# UK Calculator Platform Management Console — Phase 2 Architecture & Integration Guide

**Application URI**: `https://admin.ukcalc.jomovate.com`  
**Public Platform URI**: `https://ukcalc.jomovate.com`  
**Hosting**: Vercel (Standalone deployment root: `apps/admin`)  
**Phase Name**: Phase 2 — Live Growth & Operations

---

## 1. Executive Summary & £0 Cost Guarantee

Phase 2 enhances the UK Calculator Platform Management Console with live, privacy-preserving operational and growth telemetry under a strict **£0 cost guarantee**.

### Cost Model Summary

| Integration | Purpose | Tier | Monthly Cost | Required / Optional | Credentials Needed |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Cloudflare Web Analytics** | Public visitor & page view telemetry | Free tier | **£0.00** | Optional | `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` (public beacon)<br>`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (admin API) |
| **Google Search Console** | Organic search clicks, impressions, queries | Free API | **£0.00** | Optional | `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (`webmasters.readonly`) |
| **GitHub Actions REST API** | CI health & regression execution monitoring | Public REST | **£0.00** | Optional | None (public) or optional `GITHUB_READ_TOKEN` |
| **Statutory Governance Calendar** | Regulatory timetable review tracking | Internal metadata | **£0.00** | Included | None (derived from `@foundation/rules-uk`) |

> [!IMPORTANT]
> **No Paid Dependencies**:
> The platform does NOT use or depend on Vercel Web Analytics paid tiers, Speed Insights paid tiers, paid SaaS tracking, external databases, or third-party paid monitoring services. All integrations operate within free limits or fail gracefully with clear "Not connected" statuses without blocking application compilation.

---

## 2. Environment Variables & Secret Isolation

All credentials (except the public Cloudflare beacon site token) are strictly **server-side only** and are never exposed to browser bundles or client-rendered HTML.

| Variable Name | Scope | Application | Required for Build | Description |
| :--- | :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Public client | `apps/web` | **No** | Public site token for Cloudflare Web Analytics JS beacon. |
| `CLOUDFLARE_ACCOUNT_ID` | Server only | `apps/admin` | **No** | Cloudflare Account ID for GraphQL analytics ingestion. |
| `CLOUDFLARE_API_TOKEN` | Server only | `apps/admin` | **No** | Read-only Cloudflare API token with Analytics read permissions. |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | Server only | `apps/admin` | **No** | Target URL property (default: `https://ukcalc.jomovate.com/`). |
| `GOOGLE_CLIENT_EMAIL` | Server only | `apps/admin` | **No** | Service account client email with `webmasters.readonly` permission. |
| `GOOGLE_PRIVATE_KEY` | Server only | `apps/admin` | **No** | RSA private key for Google Cloud service account. |
| `GITHUB_READ_TOKEN` | Server only | `apps/admin` | **No** | Optional fine-grained GitHub token for high-rate CI polling. |
| `ADMIN_ACCESS_KEY` | Server only | `apps/admin` | **Yes** (in production) | Bearer secret for admin console session authentication. |

---

## 3. Provider Architecture & Graceful Degradation

Every external provider adapter implements the standard 5-state lifecycle model:
- `CONNECTED`: Live credentials configured and active data received.
- `CONFIGURED`: Credentials present, awaiting initial synchronization.
- `NOT_CONFIGURED`: Default out-of-the-box state (displays truthful "Not connected" UI without throwing runtime errors).
- `UNAVAILABLE`: Remote API endpoint rate-limited or temporarily unreachable.
- `ERROR`: Remote API returned an error status code.

### Null vs. Measured Zero Semantics
The admin console strictly maintains the distinction between measured zero and unavailable data:
- `null`: Metric is unavailable / uncollected / unconfigured (rendered in UI as `Not available`).
- `0`: Metric was measured by the connected provider and is genuinely zero (e.g. `0 Violations` or `0 Clicks`).

---

## 4. Privacy & Compliance Boundaries

- **Cloudflare Web Analytics**: Privacy-first aggregate analytics. Operates without cookies, local storage, IP logging, or cross-site fingerprinting.
- **Google Search Console**: Aggregated search engine query and click metrics. Contains no user identifiers.
- **Admin Console**: Purely read-only management interface. Never collects or stores visitor analytics.
