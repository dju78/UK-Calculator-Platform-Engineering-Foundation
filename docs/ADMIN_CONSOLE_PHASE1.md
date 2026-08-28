# UK Calculator Platform Management Console (Phase 1)

This document details the architectural design, security mechanisms, data sources, and operational specifications for the **Phase 1 UK Calculator Platform Management Console** (`apps/admin`).

---

## 1. Executive Summary & Core Principles

The Management Console is a private, read-only operational tool for the platform owner to oversee:
- **Calculator Inventory:** Complete visibility into 253 tools across 19 categories.
- **Rules & Governance:** Statutory compliance with the approved 2026/27 UK ruleset (`uk-2026-27-v1`).
- **Quality Assurance & Verification:** Test execution audit evidence (1112 unit tests, 1489 reference benchmarks, 1642 browser tests).
- **Search & SEO Readiness:** Verification of IndexNow key integration and sitemap coverage (284 canonical URLs).
- **System Health:** Monorepo package boundary monitoring and HTTP security header compliance.

### Core Architectural Invariants
1. **Isolated Workspace:** Located strictly in `apps/admin`, completely separated from the public application `apps/web`.
2. **Zero Modification to Protected Code:** Zero changes to `packages/calculation-engine`, `packages/rules-uk`, `packages/calculator-registry`, `packages/test-fixtures`, or `apps/web/src/lib/analytics`.
3. **Strictly Read-Only:** No data mutation, formula editing, or tax rate overrides in Phase 1.
4. **Zero-Secret Exposure:** No credentials, API tokens, or session secrets are exposed in client bundles or HTML markup.
5. **Deterministic Monorepo Path Safety:** Deterministic monorepo root resolver ensures adapters work cleanly whether run from repository root or when Vercel uses `apps/admin` as Root Directory.

---

## 2. Monorepo Structure & Applications

```
UK-Calculator-Platform-Engineering-Foundation/
├── apps/
│   ├── web/                    # Public calculator application (ukcalc.jomovate.com)
│   └── admin/                  # Private management console (admin.ukcalc.jomovate.com)
│       ├── src/
│       │   ├── app/            # Next.js 16 App Router (force-dynamic protected pages)
│       │   ├── components/     # UI design system & layout components
│       │   ├── lib/            # Auth and read-only data adapters
│       │   └── middleware.ts   # Route protection middleware (Edge compatible)
│       ├── next.config.ts      # Security headers and externalDir configuration
│       └── package.json        # Workspace configuration
├── packages/
│   ├── calculation-engine/     # Core calculation logic
│   ├── calculator-registry/    # 253 calculator specifications & category records
│   ├── rules-uk/               # UK statutory rulesets (2026/27)
│   └── test-fixtures/          # 1489 reference benchmark cases
├── docs/                       # Specifications and platform verification artifacts
└── tests/                      # Automated test suites
```

---

## 3. Security, Authentication & Headers

### Authentication Mechanism
- **HMAC-SHA256 Signed Session Tokens:** Edge-compatible Web Crypto API (`crypto.subtle`) generates cryptographically signed session tokens.
- **Session Cookie:** Stored in HTTP-only, `SameSite=Lax`, Secure cookies (`ukcalc_admin_session`, 8 hours duration).
- **Constant-Time Verification:** Password comparison uses bitwise XOR timing-safe comparisons.
- **Post-Login Redirect Sanitization:** Post-login `from` parameter is validated to prevent open redirect vulnerabilities.

### Security Headers & Directives
Configured via `apps/admin/next.config.ts`:
- `Content-Security-Policy: frame-ancestors 'none';` (Clickjacking prevention)
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Cache-Control: no-store, max-age=0, must-revalidate` on all authentication endpoints.

### Environment Variables

| Variable | Required | Default / Fallback | Description |
| :--- | :---: | :--- | :--- |
| `ADMIN_PASSWORD` | **Yes (Prod)** | `admin` *(Dev only)* | Secret master password for console access. Fails closed if missing in production. |
| `ADMIN_SESSION_SECRET` | **Yes (Prod)** | Dev fallback key *(Dev only)* | 32+ character key for HMAC-SHA256 session cookie signing. Strictly required in production. |

---

## 4. Console Navigation & Sections

### 1. Overview (`/`)
- **Calculator Inventory:** Total calculators (253), categories (19), verified rate (100%), rules-sensitive tools count (51).
- **Governance & Rulesets:** Active ruleset (`uk-2026-27-v1`), approved statutory status, primary source verification date (`2026-08-22`).
- **Quality Assurance Evidence:** Latest recorded audit summary (1112 unit tests, 1489 benchmarks, 1642 browser tests, 0 WCAG violations).
- **Search & SEO Readiness:** Canonical host (`ukcalc.jomovate.com`), 284 sitemap entries (derived), IndexNow status (`INTEGRATED`).
- **Release Progression:** Summary of launch milestones from Wave 1 through Growth Phase 6.

### 2. Calculator Registry (`/calculators` & `/calculators/[slug]`)
- Filterable and searchable data table for all 253 calculators.
- Multi-dimensional filtering: Category, Launch Wave (Wave 1 / 2 / 3), Risk Level (Low / Medium / High), Registry Status, Rules-Sensitivity (Yes / No).
- Read-only detail view (`/calculators/[slug]`):
  - Identity, version, jurisdiction, risk level, canonical path, public production link.
  - Functional purpose, scope, and model assumptions.
  - Mathematical & statutory methodology.
  - Statutory source references and regulatory provenance.
  - SEO title, meta description, and Schema.org structured data.
  - Benchmark coverage case count and specification file path.

### 3. Rules & Governance (`/rules`)
- Complete register of approved statutory UK rule families for the **2026/27 tax year**:
  - Income Tax (England, Wales, NI) & Scottish Devolved Income Tax
  - National Insurance Contributions (NICs)
  - Pensions & Retirement Allowances
  - ISA & Lifetime ISA (LISA) Rules
  - Stamp Duty Land Tax (SDLT), Land & Buildings Transaction Tax (LBTT), Land Transaction Tax (LTT)
  - Capital Gains Tax (CGT)
  - Student Loan Repayment Thresholds (Plans 1, 2, 4, 5, Postgraduate)
  - Corporation Tax & Marginal Relief
- Displays derived sample parameters directly from `packages/rules-uk`, effective dates (`2026-04-06 to 2027-04-05`), and dependent calculator counts.

### 4. QA & Verification (`/qa`)
- Full repository evidence breakdown clearly marked with **LAST RECORDED VERIFICATION: 2026-08-28**.
- Benchmark coverage matrix across Wave 1 (275/275), Wave 2 (1164/1164), Wave 3 (50/50), Combined (1489/1489).
- Quality assurance register detailing unit tests (1112), browser E2E parity (1642), static route generation (299 pages), accessibility assertions (0 violations), and linter compliance.

### 5. Search & SEO (`/seo`)
- Canonical host enforcement: `https://ukcalc.jomovate.com`.
- Sitemap routing: Derived 284 total routes (6 static, 6 governance, 19 categories, 253 calculators).
- **IndexNow Integration Status:** Evaluated with 4-state logic (`INTEGRATED` requires both key file `ce8ca55ad5124f4bbf57355ed840f53f.txt` and CLI submission script `scripts/indexnow-submit.mjs`).
- Measured metadata and Schema.org applicationCategory coverage.

### 6. Releases (`/releases`)
- Documented launch history: Wave 1 (55 calcs) -> Wave 2 (243 calcs) -> Wave 3 (253 calcs) -> Professionalisation Phases 1-6 -> Admin Console Phase 1.

### 7. System (`/system`)
- Monorepo package inventory and protection status.
- HTTP security headers policy.
- Runtime environment details and session policy.

---

## 5. Local Development & Deployment

### Local Development
```bash
# Start the admin console on port 3001
npm --workspace=admin run dev

# Or run root build & admin build
npm run build
npm --workspace=admin run build

# Run admin test suite
npm run test:admin
```

Visit `http://localhost:3001`. Log in using default password `admin` (or value of `ADMIN_PASSWORD` in `.env.local`).

### Vercel Deployment Setup

1. In Vercel, create a **New Project** pointing to repository `dju78/UK-Calculator-Platform-Engineering-Foundation`.
2. Configure **Root Directory**: `apps/admin`.
3. Set **Framework Preset**: `Next.js`.
4. Configure **Custom Domain**: `admin.ukcalc.jomovate.com`.
5. Provision **Environment Variables**:
   - `ADMIN_PASSWORD`: Long, randomly generated administrator passphrase.
   - `ADMIN_SESSION_SECRET`: 32+ character random hex/string for HMAC-SHA256 cookie signing.