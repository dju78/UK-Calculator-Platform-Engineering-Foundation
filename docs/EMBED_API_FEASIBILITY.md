# B2B Embed & API Feasibility Study

This document evaluates the architectural feasibility, technical models, security considerations, and rollout strategy for distributing UK Calculator Platform capabilities to third-party organisations.

---

## 1. Technical Delivery Models

| Model | Implementation Complexity | Security / Sandboxing | Maintenance Overhead | Suitability for UKCalc |
|---|---|---|---|---|
| **A. Iframe Embed (`/embed/[slug]`)** | **Low–Medium** | **High** (Browser sandbox, isolated origin) | **Low** (Uses existing web app engine) | **Recommended (Implemented in Phase 6)** |
| **B. JavaScript Widget (`<script>`)** | High | Low (Namespace collisions, CSS leakage) | High | Not recommended (Security & styling fragility) |
| **C. Headless REST API** | Medium | Medium (Rate limits, token validation) | Medium | Recommended for Phase 7 / Enterprise |
| **D. NPM / Package Distribution** | Low | N/A (Code runs in client repo) | High (Client-side version drift) | Internal monorepo only |

---

## 2. Iframe Embed Architecture (Phase 6 Implementation)

### Route & Layout
* **URL Structure:** `/embed/[slug]`
* **Allowlist:** Strictly restricted to generic, low-risk, verified calculators (`loan-calculator`, `personal-loan-calculator`, `apr-calculator`, `compound-interest-calculator`, `percentage-calculator`, `vat-calculator`, `unit-conversion-calculator`, `fuel-cost-calculator`, `age-calculator`, `savings-calculator`).
* **SEO Isolation:** Explicitly marked `noindex, nofollow` and canonical tags point to parent `/calculators/[slug]`.
* **Attribution:** Clean, accessible footer attribution: &ldquo;Powered by UK Calculator Platform&rdquo;.

### Security & Frame Protection
* Standard routes enforce `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'`.
* Embed routes (`/embed/:path*`) override this via `next.config.ts` to allow `Content-Security-Policy: frame-ancestors *;`.

---

## 3. Commercial & Governance Considerations

1. **Brand Attribution:** Free tier embeds require unbroken attribution linking to the canonical platform tool.
2. **Data Privacy:** User calculation data remains completely in-browser inside the iframe sandbox and is never transmitted to our servers or the host domain.
3. **Usage Limits:** In future phases, origin allowlisting and referrer verification can be enforced for commercial white-label tiers.
