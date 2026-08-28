# Admin Console Data Source Mapping

This document provides a strict, unambiguous mapping of every visible metric, status indicator, and data field in the UK Calculator Platform Management Console (`apps/admin`) to its authoritative source in the repository.

This mapping prevents metrics from becoming fabricated, stale, or decoupled from underlying platform reality.

---

## 1. Calculator Inventory & Registry Metrics

| Dashboard Field | UI Location | Repository Source of Truth | Derivation Logic |
| :--- | :--- | :--- | :--- |
| **Total Calculators** | Overview & Calculators | `packages/calculator-registry/src/index.ts` | `calculatorRegistry.length` (253) |
| **Total Categories** | Overview & Calculators | `packages/calculator-registry/src/index.ts` | `new Set(calculatorRegistry.map(c => c.category)).size` (19) |
| **Implemented Calculators** | Overview & Calculators | `packages/calculator-registry/src/index.ts` | Count where `c.implementationStatus === "implemented"` (253) |
| **Verified Calculators** | Overview & Calculators | `packages/calculator-registry/src/index.ts` | Count where `c.status === "verified"` (253) |
| **Rules-Sensitive Count** | Overview & Calculators | `packages/calculator-registry/src/index.ts` | Count where `c.rulesSensitive === true` (51) |
| **Wave Counts** | Overview & Calculators | `packages/calculator-registry/src/index.ts` | `wave1Registry` (55), `wave2Registry` (188), `wave3Registry` (10) |
| **Risk Distribution** | Overview & Filters | `packages/calculator-registry/src/index.ts` | Group by `c.risk` ("low", "medium", "high") |
| **Calculator Metadata** | Calculator Detail Page | `packages/calculator-registry/src/index.ts` | Definition record (`id`, `name`, `slug`, `risk`, `jurisdiction`) |
| **Purpose & Scope** | Calculator Detail Page | `docs/specs/wave[1/2/3]/<ID>.md` | Parsed from markdown `## Purpose` & `## Scope` |
| **Methodology** | Calculator Detail Page | `docs/specs/wave[1/2/3]/<ID>.md` | Parsed from markdown `## Methodology` |
| **Assumptions** | Calculator Detail Page | `docs/specs/wave[1/2/3]/<ID>.md` | Parsed from markdown `## Assumptions` list |
| **Sources & References** | Calculator Detail Page | `docs/specs/wave[1/2/3]/<ID>.md` | Parsed from markdown `## Source provenance` / `## Sources` |
| **Related Calculators** | Calculator Detail Page | `docs/specs/wave[1/2/3]/<ID>.md` | Parsed from markdown `## Related calculators` list |

---

## 2. Rules & Governance Metrics

| Dashboard Field | UI Location | Repository Source of Truth | Derivation Logic |
| :--- | :--- | :--- | :--- |
| **Active Ruleset ID** | Overview & Rules | `packages/rules-uk/src/rulesets/uk-2026-27-v1.json` | `ruleset.ruleset_id` ("uk-2026-27-v1") |
| **Tax Year** | Overview & Rules | `packages/rules-uk/src/rulesets/uk-2026-27-v1.json` | `ruleset.tax_year` ("2026/27") |
| **Ruleset Status** | Overview & Rules | `packages/rules-uk/src/rulesets/uk-2026-27-v1.json` | `ruleset.status` ("approved") |
| **Effective Period** | Overview & Rules | `packages/rules-uk/src/rulesets/uk-2026-27-v1.json` | `ruleset.effective_from` to `ruleset.effective_to` |
| **Source Check Date** | Overview & Rules | `packages/rules-uk/src/rulesets/uk-2026-27-v1.json` | `ruleset.checked_at` ("2026-08-22") |
| **Rule Regimes & Parameters** | Rules Page | `packages/rules-uk/src/rulesets/uk-2026-27-v1.json` | Direct extraction of Income Tax, NI, Pension, ISA, SDLT, LBTT, LTT, CGT, Student Loans, Corporation Tax |
| **Dependent Calculator Count** | Rules Page | `packages/calculator-registry/src/index.ts` | Filter calculators by category and id prefix |

---

## 3. QA & Verification Metrics

| Dashboard Field | UI Location | Repository Source of Truth | Derivation Logic |
| :--- | :--- | :--- | :--- |
| **Verification Evidence Label** | Overview & QA | `docs/platform-verification-latest.json` | Label: `LAST RECORDED VERIFICATION: 2026-08-28` |
| **Unit Test Suite** | Overview & QA | `tests/*.test.ts` & `docs/platform-verification-latest.json` | 1112 tests across 30 suites (all passing) |
| **Reference Benchmarks** | Overview & QA | `packages/test-fixtures/fixtures/*` | 1489 passing fixture cases (275 Wave 1, 1164 Wave 2, 50 Wave 3) |
| **Browser E2E Parity** | Overview & QA | `docs/platform-verification-latest.json` | 1642 passing assertions across 1489 calculation parity tests |
| **Route Generation (SSG)** | Overview & QA | `apps/web/src/app/` build output | 299 generated static pages (253 calcs + 19 categories + 27 static) |
| **Accessibility Violations** | Overview & QA | `docs/platform-verification-latest.json` | 0 serious / 0 critical violations across Axe assertions |

---

## 4. Search & SEO Metrics

| Dashboard Field | UI Location | Repository Source of Truth | Derivation Logic |
| :--- | :--- | :--- | :--- |
| **Canonical Domain** | Overview & SEO | `apps/web/src/lib/site.ts` | `SITE_URL = "https://ukcalc.jomovate.com"` |
| **Sitemap Route Count** | Overview & SEO | `apps/web/src/app/sitemap.ts` | Derived: 284 total URLs (6 static + 6 governance + 19 categories + 253 calcs) |
| **Robots Configuration** | SEO Page | `apps/web/src/app/robots.ts` | `userAgent: '*', allow: '/'`, sitemap referenced |
| **IndexNow Status** | Overview & SEO | `apps/web/public/ce8ca55ad5124f4bbf57355ed840f53f.txt` & `scripts/indexnow-submit.mjs` | Verified presence of key file AND submission script |
| **IndexNow Key Location** | SEO Page | `apps/web/public/` | Masked representation: `https://ukcalc.jomovate.com/ce8c...0f53f.txt` |
| **Metadata Coverage** | SEO Page | `apps/web/src/lib/site.ts` & `calculatorRegistry` | Evaluated across all 253 calculators and 19 categories |

---

## 5. Releases & System Health

| Dashboard Field | UI Location | Repository Source of Truth | Derivation Logic |
| :--- | :--- | :--- | :--- |
| **Platform Version** | Overview & Releases | Root `package.json` | `version: "0.1.0"` |
| **Admin Version** | Overview & Releases | `apps/admin/package.json` | `version: "0.1.0"` |
| **Monorepo Packages** | System Page | Root `package.json` | `workspaces: ["packages/*", "apps/*"]` |
| **Security Headers** | System Page | `apps/admin/next.config.ts` | Direct mapping of configured HTTP response headers |
| **Node Runtime Version** | System Page | `process.version` | Node runtime execution context |