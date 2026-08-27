# Phase 6 Integration Notes

This document provides engineering guidance on how Phase 6 Growth modules integrate with the existing Next.js web application and monorepo packages.

---

## 1. Analytics & Consent Integration

* **Location:** `apps/web/src/lib/analytics/`
* **Entry Point:** `trackEvent(event, payload)` in `analytics.ts`.
* **Safe Helpers:** Convenience dispatchers in `events.ts` (e.g. `trackCalculatorView`, `trackCalculationCompleted`).
* **Consent Architecture:** `ConsentBanner.tsx` displays in root layout when an analytics provider is configured. `ConsentManager.tsx` is embedded on `/privacy`.

---

## 2. Search Verification Integration

* Configured in `apps/web/src/app/layout.tsx` using `metadata.verification`.
* Read from `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`.

---

## 3. Commercial & Advertising Components

* `AdSlot.tsx`: Placed on calculator pages; disabled unless `NEXT_PUBLIC_ENABLE_ADS="true"`.
* `AffiliateLink.tsx`: Outbound commercial links with `rel="sponsored nofollow noopener"`.

---

## 4. Embed Route Architecture

* `apps/web/src/app/embed/[slug]/page.tsx`
* Configured in `next.config.ts` for iframe embedding.
* Uses allowlist in `apps/web/src/lib/embed.ts`.
