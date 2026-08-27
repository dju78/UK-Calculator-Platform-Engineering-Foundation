# Phase 6 Security Review

This review audits the security architecture of Phase 6 Growth additions, focusing on Content Security Policy (CSP), clickjacking protection, iframe isolation, and parameter injection.

---

## 1. Frame Security & Clickjacking Protection

### Standard Web Routes
* All standard application routes enforce:
  - `X-Frame-Options: SAMEORIGIN`
  - `Content-Security-Policy: frame-ancestors 'self';`
* This completely protects canonical calculation pages and governance routes from third-party framing, clickjacking, and UI redressing attacks.

### Embed Routes (`/embed/:path*`)
* Embed routes are specifically scoped in `next.config.ts`:
  - Enforce `Content-Security-Policy: frame-ancestors *;`
  - Exclude `X-Frame-Options: SAMEORIGIN`
* Because `/embed/[slug]` routes are intentionally designed for public syndication, sandboxed, and stripped of personal state or administrative actions, framing is safe.

---

## 2. Event Payload Sanitisation & Injection Prevention

* The telemetry layer in `apps/web/src/lib/analytics/sanitizer.ts` strictly validates every outgoing event against an allowlist of keys.
* Raw user search strings and URL query strings are stripped of potential XSS payloads, URLs, or parameter pollution before passing to telemetry providers.
* No `eval()` or unsafe dynamic code execution is introduced anywhere in the analytics or commercial modules.

---

## 3. Environment Variables & Secret Handling

* All public client-facing configuration uses `NEXT_PUBLIC_*` prefixes.
* No secret API keys, payment tokens, or internal credentials exist in the codebase.
