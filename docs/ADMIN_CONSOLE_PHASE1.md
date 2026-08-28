# UK Calculator Platform Management Console (Phase 1)

## 1. Executive Summary

Phase 1 of the **UK Calculator Platform Management Console** (`apps/admin`) establishes a private, read-only operational and governance hub for the platform owner, product team, and compliance analysts. 

The console operates on an isolated Vercel subdomain (`https://admin.ukcalc.jomovate.com`) and strictly decouples internal administrative observation from the public consumer application (`https://ukcalc.jomovate.com`).

---

## 2. Architecture & Monorepo Boundaries

```
UK-Calculator-Platform-Engineering-Foundation/
├── apps/
│   ├── web/                     # Public consumer application (ukcalc.jomovate.com)
│   └── admin/                   # Private management console (admin.ukcalc.jomovate.com)
│       ├── src/
│       │   ├── app/             # Next.js App Router console pages & API routes
│       │   ├── components/      # Analytical tables, status badges, metric cards
│       │   ├── lib/
│       │   │   ├── auth.ts      # HMAC-SHA256 session token management
│       │   │   └── admin-data/  # Read-only data adapter layer
│       │   └── middleware.ts    # Route protection & unauthenticated redirects
│       ├── next.config.ts       # Strict CSP ('frame-ancestors none'), HSTS, externalDir
│       └── package.json
├── packages/                    # PROTECTED SHARED CORE
│   ├── calculation-engine/      # Pure mathematical & financial models
│   ├── calculator-registry/     # Canonical calculator inventory & metadata
│   ├── rules-uk/                # Statutory UK tax rates & parameters (2026/27)
│   └── test-fixtures/           # 1489 reference benchmark cases
└── docs/                        # Verification registers, specs, and evidence
```

### Protection Guarantee
The admin console consumes shared packages (`packages/*`) via a dedicated read-only adapter layer (`apps/admin/src/lib/admin-data/`). It does **NOT** duplicate calculation formulas, modify rulesets, alter test fixtures, or provide mutation endpoints in Phase 1.

---

## 3. Authentication & Security Model

The management console is completely private and enforces authentication across all routes.

- **Authentication Mechanism:** Password-authenticated session with cryptographically signed, HTTP-Only cookies (`ukcalc_admin_session`).
- **Signature Algorithm:** HMAC-SHA256 with timing-safe comparison (`node:crypto` / Web Crypto API).
- **Session Duration:** 8 hours (28,800 seconds).
- **Route Guard:** Next.js Edge Middleware (`apps/admin/src/middleware.ts`) intercepts all incoming requests. Unauthenticated requests are immediately redirected to `/login?from=<destination>`.
- **Security Headers:**
  - `Content-Security-Policy: frame-ancestors 'none';`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: origin-when-cross-origin`
- **Zero-Secret Exposure:** Administrator passwords and session secrets are never bundled into client-side JavaScript or rendered in HTML markup.

### Environment Variables

| Variable | Required | Default / Fallback | Description |
| :--- | :---: | :--- | :--- |
| `ADMIN_PASSWORD` | **Yes (Prod)** | `admin` *(Dev only)* | Secret master password for console access. |
| `ADMIN_SESSION_SECRET` | Optional | Derived from `ADMIN_PASSWORD` | 32+ character key for HMAC-SHA256 session cookie signing. |

---

## 4. Console Navigation & Sections

The console provides text-first, high-density analytical navigation across seven core operational sections:

### 1. Overview (`/`)
- **Calculator Inventory:** Total calculators (253), categories (19), verified rate (100%), rules-sensitive tools count (35).
- **Governance & Rulesets:** Active ruleset (`uk-2026-27-v1`), approved statutory status, primary source verification date (`2026-08-22`).
- **Quality Assurance Evidence:** Latest recorded audit summary (1098 unit tests, 1489 benchmarks, 1642 browser tests, 0 WCAG violations).
- **Search & SEO Readiness:** Canonical host (`ukcalc.jomovate.com`), 277 sitemap entries, IndexNow status (`INTEGRATED`).
- **Release Progression:** Summary of launch milestones from Wave 1 through Growth Phase 6.

### 2. Calculator Registry (`/calculators` & `/calculators/[slug]`)
- Filterable and searchable data table for all 253 calculators.
- Multi-dimensional filtering: Category, Launch Wave (Wave 1 / 2 / 3), Risk Level (Low / Medium / High), Registry Status (Verified / Specified / Planned), Rules-Sensitivity (Yes / No).
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
  - Pensions & Retirement Allowances (Annual allowance, MPAA, LSA, LSDBA)
  - ISA & Lifetime ISA (LISA) Rules
  - Stamp Duty Land Tax (SDLT), Land & Buildings Transaction Tax (LBTT), Land Transaction Tax (LTT)
  - Capital Gains Tax (CGT)
  - Student Loan Repayment Thresholds (Plans 1, 2, 4, 5, Postgraduate)
  - High Income Child Benefit Charge (HICBC)
- Displays sample parameters, effective dates (`2026-04-06 to 2027-04-05`), and dependent calculator counts.

### 4. QA & Verification (`/qa`)
- Full repository evidence breakdown clearly marked with **LAST RECORDED VERIFICATION (2026-08-25)**.
- Benchmark coverage matrix across Wave 1 (275/275), Wave 2 (1164/1164), Wave 3 (50/50), Combined (1489/1489).
- Quality assurance register detailing unit tests, browser E2E parity, static route generation (299 pages), accessibility assertions (187 Axe checks, 0 violations), and linter compliance.
- Repository links to primary verification reports.

### 5. Search & SEO (`/seo`)
- Canonical host enforcement: `https://ukcalc.jomovate.com`.
- Sitemap routing: 277 total routes (home, 253 calculators, 19 categories, 4 legal).
- **IndexNow Integration Status:** Confirmed active with verification key file `ce8ca55ad5124f4bbf57355ed840f53f.txt`, endpoint `https://api.indexnow.org/indexnow`, and CLI command `npm run indexnow -- <url>`.
- 100% metadata and Schema.org applicationCategory coverage.

### 6. Releases (`/releases`)
- Documented launch history: Wave 1 (55 calcs) -> Wave 2 (243 calcs) -> Wave 3 (253 calcs) -> Professionalisation Phases 1-6 -> Admin Console Phase 1.
- Clear extension points prepared for future GitHub Actions and Vercel Deployment API integrations.

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

1. In the Vercel Dashboard, create a new Project connected to the repository:
   - **Project Name:** `ukcalc-admin`
   - **Root Directory:** `apps/admin`
   - **Framework Preset:** `Next.js`
2. Configure Custom Domain:
   - Add `admin.ukcalc.jomovate.com`
   - Point DNS CNAME to `cname.vercel-dns.com`
3. Configure Environment Variables in Vercel:
   - `ADMIN_PASSWORD` = `<secure-random-passphrase>`
   - `ADMIN_SESSION_SECRET` = `<secure-64char-hex-string>`
   - `NODE_ENV` = `production`
4. Deploy the application.

---

## 6. Phase 1 Limitations & Future Roadmap

### Phase 1 Invariants (Out of Scope for Phase 1)
- **Read-Only Guarantee:** No mutations, formula editing, or tax rate overrides.
- **No Direct Third-Party API Keys:** Google Search Console API and Bing Webmaster API integrations are staged as extension points for Phase 2.
- **Single-Tenant Ownership:** Single operator password authentication without multi-user role management.

### Planned for Phase 2
1. **Live Search Engine Telemetry:** OAuth integration with Google Search Console and Bing Webmaster APIs.
2. **Live CI/CD Monitoring:** GitHub Actions API integration for real-time build and test execution status.
3. **Automated Statutory Rate Staging:** Draft ruleset staging workflow with audit logging.
