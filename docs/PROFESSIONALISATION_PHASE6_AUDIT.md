# Professionalisation Phase 6 Audit

This audit examines the platform readiness across measurement, growth, monetization governance, search verification, and B2B embedding.

---

## Audit Findings & Risk Register

### ISSUE 1: Accidental Telemetry Leakage of User Financial and Health Inputs
* **SEVERITY:** Critical
* **AREA:** Privacy & Analytics Architecture
* **RISK:** Transmission of sensitive user figures (salaries, taxes, mortgage balances, BMI, pregnancy dates) to external analytics or log servers would violate UK GDPR and compromise platform trust.
* **RESOLUTION:** Created a strict, fail-closed payload sanitizer (`apps/web/src/lib/analytics/sanitizer.ts`) with a regex blocklist for all financial, personal, and clinical terms. Handlers in `DynamicCalculator.tsx` transmit only calculator slugs and categories, strictly omitting input and output objects.
* **EVIDENCE:** Unit test suite in `tests/growth-phase6.test.ts` validates that all sensitive keys and calculator result objects are rejected.
* **DEFERRED ACTION:** None.

---

### ISSUE 2: Telemetry Execution Prior to User Consent
* **SEVERITY:** High
* **AREA:** Consent Management & PECR Compliance
* **RISK:** Loading non-essential analytics tracking without consent in the UK violates PECR regulations.
* **RESOLUTION:** Built a zero-dependency consent controller (`consent.ts`) defaulting to disabled. No tracking requests fire unless consent is granted. Added unmanipulative consent banner (`ConsentBanner.tsx`) and privacy page management control (`ConsentManager.tsx`).
* **EVIDENCE:** Verified by automated unit tests and Playwright E2E browser tests.
* **DEFERRED ACTION:** None.

---

### ISSUE 3: Unintentional Indexation of Embed Duplicate Pages
* **SEVERITY:** Medium
* **AREA:** Search Engine Optimization (SEO)
* **RISK:** Creating embeddable iframe pages at `/embed/[slug]` could cause search engines to index stripped-down versions as duplicate content, diluting canonical rankings.
* **RESOLUTION:** Configured `robots: { index: false, follow: false }` and set the canonical tag to point to the canonical `/calculators/[slug]` URL. Excluded all `/embed/*` routes from `sitemap.xml`.
* **EVIDENCE:** Verified via SEO unit tests and Next.js build route inspection.
* **DEFERRED ACTION:** None.

---

### ISSUE 4: Global Anti-Framing Header Conflict with Embed Routes
* **SEVERITY:** High
* **AREA:** Security & Iframe Framing
* **RISK:** Global `X-Frame-Options: SAMEORIGIN` would block legitimate iframe embeds on third-party partner sites.
* **RESOLUTION:** Updated `apps/web/next.config.ts` to apply route-specific security headers: standard routes maintain `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'`, while `/embed/:path*` routes enforce `Content-Security-Policy: frame-ancestors *;`.
* **EVIDENCE:** Verified header configuration in `next.config.ts`.
* **DEFERRED ACTION:** None.

---

### ISSUE 5: Cumulative Layout Shift (CLS) from Dynamic Ad Slots
* **SEVERITY:** Medium
* **AREA:** Web Performance & User Experience
* **RISK:** Uncontrolled ad placements cause jarring layout shifts that degrade Core Web Vitals and user trust.
* **RESOLUTION:** `AdSlot` components are disabled by default (returning `null`). When enabled in staging/testing, they enforce reserved minimum dimensions, accessible labelling, and placement strictly outside calculation areas.
* **EVIDENCE:** Automated component tests confirm null rendering by default.
* **DEFERRED ACTION:** None.
