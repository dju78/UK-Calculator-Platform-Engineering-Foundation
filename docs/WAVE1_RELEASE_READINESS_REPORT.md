# WAVE 1 RELEASE READINESS REPORT

## 1. Executive Summary
The Next.js app (`apps/web`) has been audited and remediated for P0/P1 issues concerning SEO, Security, Legal/UX, and stability.
Status: **ENGINEERING RELEASE READY WITH BLOCKERS**
**PUBLIC LAUNCH BLOCKERS REMAIN** (Missing actual legal text).

## 2. Issues Addressed
### P0 - Security & Stability
- Added security headers (Strict-Transport-Security, X-DNS-Prefetch-Control, X-XSS-Protection, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) in `next.config.ts`.
- Verified & implemented `error.tsx` (Error Boundary) and `not-found.tsx` (404 UI) to ensure graceful error handling.

### P1 - SEO & Legal UX
- Implemented dynamic `sitemap.ts` and `robots.ts` using the registry to ensure search indexability.
- Added OpenGraph and standard SEO `<meta>` tags dynamically in the calculator pages and `layout.tsx`.
- Implemented `Footer` with links to Privacy Policy, Terms of Use, Disclaimer, and Accessibility Statement.
- Implemented global `DisclaimerBanner` specifically for financial/tax/pension calculators.
- Created stub pages for Privacy, Terms, Disclaimer, and Accessibility.

## 3. Outstanding Blockers
- **LEGAL REVIEW REQUIRED**: The Legal pages (Privacy Policy, Terms of Use, Disclaimer, and Accessibility Statement) have been drafted based on a data flow audit, but await formal Legal Review (Legal review = REQUIRED) but Owner details supplied = COMPLETE.

## 4. Quality Metrics
- Codebase tested and builds successfully (`npm run build`).
- Linter passes with no errors (`npm run lint`).
- Tests and E2E pass (`npm run test` & `npm run test:e2e`).

## 5. Deployment Status
- **PRODUCTION PROVIDER**: Vercel
- **DEPLOYMENT**: BLOCKED
- **REASON**: Vercel CLI requires authentication. Run `vercel deploy --temporary` or `vercel login` manually to resolve.
- **PRODUCTION URL**: BLOCKED
- **POST-DEPLOYMENT SMOKE TESTS**: BLOCKED (Cannot run against live URL yet).

---

## 6. UK Tax & Salary Frequency, Tax Code and Pension Enhancement

### 6.1 Scope

Enhanced so users can work naturally in annual, monthly, weekly or hourly pay,
and so TAX-003 supports tax codes, pension arrangements and employer
contributions.

| Calculator | Income frequency | Payroll frequency | Notes |
|---|---|---|---|
| TAX-001 UK Income Tax | Yes | n/a | Periodic tax equivalents; hourly only when hours are supplied |
| TAX-002 UK Salary | Yes | n/a | Now a full gross-pay frequency converter |
| TAX-003 Take-Home Pay | Yes | Yes | Tax codes, pension arrangements, employer contribution, periodic take-home |
| TAX-004 National Insurance | Yes | Yes | Periodic NI with an explicit basis statement |
| TAX-015 VAT | **Unchanged** | **Unchanged** | A transaction tax with no pay-period dimension; a frequency model would be meaningless |
| TAX-020 Student Loan | Yes | Yes | Periodic repayments with an explicit basis statement |

### 6.2 Conventions established

- **Human percentages.** Users type `5` for 5%; normalisation to `0.05` happens
  once, at the UI/engine boundary, declared per field. The engine contract is
  unchanged and still takes decimal fractions.
- **Income frequency is not payroll frequency.** An hourly worker paid monthly
  and an hourly worker paid weekly are separate, selectable states.
- **Working-hour assumptions are visible, editable and never invisible.**
  Defaults 37.5 hours/week and 52 paid weeks/year. Where hours are unknown the
  hourly equivalent is omitted rather than invented.
- **Hourly results are labelled equivalents,** never exact payroll take-home.
- **Statutory values live only in the versioned ruleset.** No tax rate,
  threshold or tax-code rule exists in any React component.

### 6.3 Tax codes

Supported: `1257L` and other numeric codes with an `L`/`M`/`N`/`T` suffix
(allowance = number x 10), `BR`, `D0`, `D1`, `0T`, `NT`, the Welsh `C`-prefixed
equivalents, and the Scottish `S1257L`, `SBR`, `SD0`, `SD1`, `SD2`, `SD3`.

Unsupported and explicitly reported as such: **K codes** and **W1/M1/X
non-cumulative codes**. Both need pay-period and year-to-date PAYE context that
an annual estimator does not have. The calculator returns no figures for them,
never falls back to `1257L`, and never strips an emergency marker.

### 6.4 Pay-period basis - disclosed limitation

Ruleset `uk-2026-27-v1` carries **annual** NI and student-loan thresholds only.
HMRC's published weekly/monthly NI thresholds are not exact divisions of the
annual figures (£242/wk x 52 = £12,584 against a £12,570 annual threshold), so
they are recorded in the ruleset for disclosure with `period_basis_applied:
false` and are **not** applied as the calculation basis. Periodic figures are
therefore annual estimates divided into periods, and both the UI and the engine
output say so. Adopting the period basis in a future ruleset requires
re-approving the affected benchmark expectations.

### 6.5 Verification

| Check | Result |
|---|---|
| Wave 1 calculators | 55/55 |
| Engine benchmarks | 275/275 |
| UI parity | 275/275 |
| Unit tests | 200/200 |
| Browser tests | 345/345 |
| Routes | 55/55 |
| Serious Axe | 0 |
| Critical Axe | 0 |
| Typecheck / Lint / Production build | PASS |

Existing coverage was not reduced: the 319-test browser baseline and all 275
benchmark expectations are intact, with 26 browser tests and 48 unit tests
added. The FIN-001 production correction (£193.33 monthly, £11,599.68 total,
£1,599.68 interest) remains verified.

### 6.6 Status

Engineering status for this enhancement: **VERIFIED**. The launch blocker
recorded in section 3 (formal legal review of the legal pages) is unrelated to
this work and still stands.
