# Professionalisation Phase 4 — Trust and Governance Audit

**Branch:** `professionalisation-phase-4-governance`
**Base:** `origin/main` at `2809222`
**Audit performed:** August 2026
**Scope:** governance, transparency, editorial trust and rules-maintenance
readiness of the platform as it stood at the Phase 4 branch point.

---

## Method

The audit examined the repository as the source of truth: the published route
set, page metadata, legal and trust wording, the registry and content type
models, existing source verification records, git history, and the existing
test suites. Findings were confirmed against files rather than against planning
documents, and every count quoted below was produced by executing code or
reading the repository, not recalled.

Severity is assessed by the harm a reader could come to, or the credibility the
platform would lose, if the gap remained.

---

## Summary of findings

| # | Finding | Severity | Status |
| --- | --- | --- | --- |
| 1 | No page identified who operates the platform or why to trust it | High | Resolved |
| 2 | No route to report a calculation error | High | Resolved |
| 3 | No published editorial standards or source hierarchy | High | Resolved |
| 4 | Substantial verification work was entirely invisible to users | High | Resolved |
| 5 | No AI-use transparency | High | Resolved |
| 6 | Review freshness existed per guide but had no framework or public position | Medium | Resolved |
| 7 | No rules-maintenance policy for the annual rollover and fiscal events | Medium | Resolved |
| 8 | No public change record; statutory corrections were invisible | Medium | Resolved |
| 9 | Governance pages absent from sitemap (pre-existing routes only) | Medium | Resolved |
| 10 | Editorial coverage was not stated, risking an implied claim of full review | Medium | Resolved |
| 11 | Stale `onrender.com` host present in repository | Low | Verified benign; guarded |
| 12 | Accessibility statement wording | Low | Verified adequate; guarded |
| 13 | No FCA, company-number or endorsement fabrication anywhere | — | Verified clean; guarded |
| 14 | 3 guides carry unverified figures | Low | Correctly disclosed; tracked |
| 15 | 213 of 253 calculators have no editorial guide | Medium | Disclosed, not resolved |
| 16 | Two e2e specs ignored `baseURL`, silently testing whatever held port 3000 | High | Resolved |
| 17 | Sitemap route-count assertion encoded a stale static-page total | Low | Resolved |

---

## Detailed findings

### 1. No operator identity or purpose page — High — RESOLVED

**Evidence.** The route set at branch point was: `/`, `/calculators/[slug]`,
`/category/[category]`, `/privacy`, `/terms`, `/disclaimer`, `/accessibility`.
There was no `/about`. "Jomovate" appeared as operator inside the privacy,
disclaimer and accessibility pages and as `provider` in calculator structured
data, but a user had no page explaining what the platform was, who ran it, or
why its numbers should be believed.

**Why it matters.** For a site publishing tax and financial figures, absence of
an identifiable operator is a first-order trust failure, and a direct E-E-A-T
weakness.

**Resolution.** `/about` created. States operator identity, UK-first focus,
breadth, the three-layer build approach, why methodology is shown, and — at
comparable prominence — that calculators simplify and that professional advice
may still be needed. Organization structured data added carrying only
substantiable properties.

**Evidence of resolution.** Route builds and serves; `governance-phase4.test.ts`
asserts existence, single `h1`, canonical, Open Graph URL and cross-links;
`governance.spec.ts` asserts a 200 response and Axe cleanliness.

---

### 2. No route to report a calculation error — High — RESOLVED

**Evidence.** A contact address existed inside three legal pages but there was
no contact route, and no guidance anywhere on what a useful error report
contains.

**Why it matters.** A platform that invites reliance on its numbers but offers
no visible correction channel cannot claim to take correctness seriously. It
also loses its cheapest source of defect detection.

**Resolution.** `/contact` created, organised by purpose: calculation errors,
out-of-date rules, accessibility, technical problems, general feedback. Each
carries a prefilled `mailto:` subject. The calculation-error section specifies
calculator, inputs, observed result, expected result, supporting source and
date observed, and explicitly warns against sending sensitive personal data.

**Deliberate constraint.** No form backend, database or third-party service —
nothing to breach, and it works without JavaScript.

---

### 3. No published editorial standards — High — RESOLVED

**Evidence.** The Phase 2 content model already enforced real standards in code
— typed sources with verification status, required ruleset for rule-sensitive
guides, engine-verified worked examples — but none of it was stated publicly. A
reader had no way to know what "verified" meant here.

**Resolution.** `/editorial-policy` created covering all fourteen required
areas. The source hierarchy is rendered from the shared definition rather than
hand-copied, so page and enforcement cannot diverge.

---

### 4. Verification work invisible to users — High — RESOLVED

**Evidence.** At branch point the repository ran 1,005 unit/content/SEO tests,
1,489 reference benchmark cases and a large browser suite, with independently
derived benchmark expectations. None of this was visible to a user.

**Resolution.** `/how-we-check-our-figures` created, describing the actual
architecture — registry, deterministic engines, versioned rules, independently
derived benchmarks, the regression suites, source verification — followed by an
explicit "what this does not prove" section.

**Constraint honoured.** Counts appear only inside a panel labelled
"Verification snapshot — [date]", never in evergreen prose. A test asserts that
totals are not hardcoded into page prose.

---

### 5. No AI-use transparency — High — RESOLVED

**Evidence.** AI-assisted tooling is used in development; nothing disclosed it.

**Why it matters.** Undisclosed AI involvement discovered later is far more
damaging than disclosed AI involvement explained properly, particularly on a
site publishing statutory figures.

**Resolution.** Editorial policy §10 states plainly where AI tooling is used
and, more importantly, what it is not trusted to do: no calculation result,
statutory rate, threshold or rule reaches the platform on the authority of a
language model. Figures anchor to deterministic code, versioned rules,
independently derived benchmarks and official sources. A test asserts that
boundary statement is present.

---

### 6. Review freshness had no framework — Medium — RESOLVED

**Evidence.** Guides carried `lastReviewed` (all 40 at `2026-08-25`), a
`ruleset` and a `ruleStatus`, and `CalculatorGuide.tsx` displayed the ruleset
and review date. But there was no concept of when a review *expires*, no
platform-wide view, and no way to distinguish "reviewed and current" from
"reviewed a long time ago".

**Resolution.** A derived provenance layer in `packages/governance`. No new
authored data: `ruleSensitivity` and `jurisdiction` come from the registry;
`sourcesReviewedAt`, `rulesetId` and verification state come from the guides.
The only addition is the review policy — rules-sensitive content falls due at
the next 6 April, general content on a 24-month cycle.

Four states are modelled: `current`, `review-due`, `verification-required` and
`not-yet-reviewed`. The fourth exists because "no guide authored yet" is
genuinely different from "a figure needs checking", and collapsing them would
have meant either overstating coverage or maligning 213 working calculators.

**Position as at 26 August 2026:** 37 current, 0 review-due, 3
verification-required, 213 not-yet-reviewed.

**Explicitly not done.** Metadata for all 253 calculators was not populated,
because doing so would have required inventing review dates for reviews nobody
performed. The framework is complete; only defensible records exist.

---

### 7. No rules-maintenance policy — Medium — RESOLVED

**Evidence.** `Annual_Tax_Year_Update_Runbook.md` covered the April rollover
mechanics, but nothing covered fiscal events, emergency mid-year changes,
uprating, devolved property tax divergence, source deprecation, or the
benchmark and regression obligations attached to a rules change.

**Resolution.** `RULES_MAINTENANCE_POLICY.md` and `RULES_REVIEW_CALENDAR.md`.
The calendar is explicit that it is a human schedule, not automation, and never
predicts a fiscal event date. A test asserts it makes no specific future Budget
date claim.

---

### 8. No public change record — Medium — RESOLVED

**Evidence.** Two statutory corrections had shipped (TAX-013 dividend rates,
TAX-019 Child Benefit rates), documented internally in
`RULES_2026_27_CORRECTION_AUDIT.md`, with no public disclosure. A user who
relied on a pre-correction figure had no way to learn it had changed.

**Resolution.** `/updates` created, data-driven from
`packages/governance/src/updates.ts`. Nine entries, every date taken from git
history. Statutory corrections name affected calculators, which are validated
against the live registry by test and rendered as links.

---

### 9. Governance routes absent from sitemap — Medium — RESOLVED

**Resolution.** All five routes added at priority 0.6, above legal boilerplate
(0.5) and below categories (0.7). Asserted by both unit and browser tests.

---

### 10. Editorial coverage not stated — Medium — RESOLVED

**Evidence.** 40 of 253 calculators have an authored guide. Nothing said so.
Publishing a trust page without stating coverage would imply full editorial
review of all 253.

**Resolution.** `/how-we-check-our-figures` states coverage explicitly, from
live derived data rather than a hardcoded number, and says plainly that this is
not full editorial review. Coverage figures update automatically as guides are
added.

---

### 11. Stale `onrender.com` host — Low — VERIFIED BENIGN, GUARDED

**Evidence.** Repository-wide search found the host in exactly two files:
`docs/PHASE3_SEO_AUDIT.md` and `docs/WAVE1_COMPLETE_CALCULATION_INTEGRITY_AUDIT.md`.
Both are historical audit records. **No active app, script or test file
referenced it**, and `site.ts` already defaulted correctly to
`https://ukcalc.jomovate.com`.

**Action.** Historical documents preserved unmodified, per the instruction to
retain historical records. A test now walks `apps/web/src`, `apps/web/e2e`,
`scripts`, `tests` and `packages` and fails if the host reappears in active
code, so the clean state is enforced rather than merely observed.

---

### 12. Accessibility statement wording — Low — VERIFIED ADEQUATE, GUARDED

**Evidence.** The statement says the platform "is designed to meet WCAG 2.2 AA
requirements" and states explicitly that "formal third-party external
certification has not been conducted". It does not claim compliance, and does
not contradict the new pages.

**Action.** Left unmodified — surgical change was not required. A regression
test now asserts the statement never hardens into "is WCAG 2.2 AA compliant" or
"fully accessible to all".

---

### 13. Regulatory and corporate claims — VERIFIED CLEAN, GUARDED

**Evidence.** Every occurrence of "FCA" in the codebase directs users to
*consult* an FCA-regulated adviser. No file claimed FCA authorisation, a
company registration number, Companies House registration, VAT number, named
legal or clinical reviewers, professional memberships or external
certification.

**Action.** Nothing to fix. Three test groups now guard against introducing
such claims on any governance page: fabricated corporate/regulatory status;
endorsement, guaranteed accuracy or regulated-advice claims; and fabricated
reviewers, boards or certification.

---

### 14. Three guides carry unverified figures — Low — CORRECTLY DISCLOSED

**Evidence.** Of 40 guides: 19 `VERIFIED`, 18 `NOT RULE-SENSITIVE`, 3
`SOURCE VERIFICATION REQUIRED`. The three already disclose their status on the
page.

**Assessment.** This is the system behaving correctly — an unverified figure
declared as unverified is the honest outcome. The provenance layer now reports
these as `verification-required`, and a test asserts the flag is surfaced
rather than suppressed.

**Deferred.** Completing verification for those three is editorial work outside
Phase 4 scope. Tracked by the quarterly provenance sweep in the review calendar.

---

### 15. 213 calculators without an editorial guide — Medium — DISCLOSED, NOT RESOLVED

**Assessment.** Authoring 213 guides is a content programme, not a governance
task, and was never in Phase 4 scope. The governance requirement was to avoid
implying coverage that does not exist.

**Action.** Coverage stated explicitly on the public assurance page, derived
live. Those calculators report `not-yet-reviewed` and make no review claim. A
test asserts a calculator without a guide cannot carry a review date.

---

### 16. Two e2e specs ignored their own baseURL — High — RESOLVED

**Discovered during Phase 4 verification, not during the initial audit.**

**Evidence.** `apps/web/e2e/parity.spec.ts` and `apps/web/e2e/fin001.spec.ts`
called `page.goto` with an absolute `http://localhost:3000/...` URL rather than
the `baseURL` the Playwright config sets. Combined with
`reuseExistingServer: !process.env.CI`, this meant the suite tested whatever
process happened to hold port 3000.

A parallel Phase 5 Utility worktree was serving on that port. Three Phase 4
verification runs were consequently invalid, one of them executing the entire
1,669-test suite against Phase 5's application.

**Why it matters.** `fin001.spec.ts` **passed** in that state. A test that
silently asserts against a different branch's build and reports green is worse
than one that fails: it manufactures false confidence in exactly the gate meant
to prevent that.

**Resolution.** Both changed to relative paths, so every spec honours the
configured `baseURL`. Two lines. This strengthens the suite rather than
relaxing it, and it is what made isolated verification of Phase 4 possible.

**Guidance recorded** in `PHASE4_INTEGRATION_NOTES.md` §2.4 for Phase 5, which
shares the hazard.

---

### 17. Stale sitemap route-count assertion — Low — RESOLVED

**Evidence.** `seo-routing.spec.ts` asserted
`locs.length === 5 + categories.length + calculators.length`. The `5` encoded
the pre-Phase-4 static route set, so adding the five governance routes to the
sitemap — a Phase 4 requirement — made the expected value stale.

**Resolution.** Replaced the magic number with an explicit `standalonePages`
list naming all nine standalone routes, which the test also iterates for
presence. Adding a route now means naming it. The assertion still fails on a
duplicated or orphaned sitemap entry, so nothing was weakened.

---

## Cross-cutting verification

**No calculator mathematics, statutory rules or approved benchmark values were
modified.** Confirmed by protection diffs against
`packages/calculation-engine`, `packages/test-fixtures`, `packages/rules-uk`
and `packages/calculator-registry` — all empty. Recorded in the Phase 4 report.

**No potential calculation defect was discovered** during this audit. Phase 4
touched no engine code and had no cause to.

---

## Deferred items

| Item | Reason | Where tracked |
| --- | --- | --- |
| Complete source verification for 3 flagged guides | Editorial work, outside governance scope | Quarterly provenance sweep |
| Editorial guides for the remaining 213 calculators | Content programme | Coverage stated publicly; future content phase |
| Manual assistive-technology testing | Not performed, and must not be claimed | Accessibility statement already discloses this |
| Named external legal, clinical or financial review | No such review has occurred | Editorial policy §11 states this plainly |
| Automated source-link health checking | Currently a manual quarterly task | Review calendar; candidate for future automation |
