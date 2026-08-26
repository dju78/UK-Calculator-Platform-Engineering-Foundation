# Professionalisation Phase 4 — Verification Report

**Phase:** Governance, transparency, editorial trust and rules maintenance
**Completed:** August 2026

---

## 1. Branch and baseline

| Field | Value |
| --- | --- |
| Branch | `professionalisation-phase-4-governance` |
| Base `origin/main` SHA | `28092228674c9e32023954c6d476b576b0538573` |
| Base commit | Merge pull request #7 from dju78/public-domain-ukcalc |
| Starting SHA of this branch | `28092228674c9e32023954c6d476b576b0538573` |
| Head SHA at completion | recorded in §14 |
| Production domain | `https://ukcalc.jomovate.com` |

**Startup safety gate.** Executed before any change was made:

- `git branch --show-current` → `professionalisation-phase-4-governance` ✓
- `git status` → clean working tree ✓
- `git rev-parse HEAD` → `2809222` ✓
- `git fetch origin` then `git rev-parse origin/main` → `2809222` ✓
- `git rev-list --left-right --count HEAD...origin/main` → `0  0` ✓

**`origin/main` had not advanced.** The branch point matched the expected
baseline exactly, so no synchronisation decision was required and no merge or
rebase was performed.

### Divergences from the briefing figures

Every briefed figure was checked against repository evidence:

| Metric | Briefing | Repository evidence | Note |
| --- | --- | --- | --- |
| Calculators | 253 | 253 | Confirmed |
| Categories | 19 | 19 | Confirmed |
| Reference benchmark cases | 1489 | 1489 | Confirmed |
| Unit/content/SEO tests before Phase 4 | 1005 | 1005 | Confirmed by baseline run |
| Generated pages before Phase 4 | 282 | 282 | Confirmed |
| Browser/parity baseline | 1642 | 1642 | Confirmed. The suite now executes 1669, of which exactly 27 are the new Phase 4 governance checks: 1669 − 27 = 1642. |

Every briefed figure was confirmed against repository evidence. No divergence
was found that would invalidate any briefing assumption.

---

## 2. Files and routes created

### New public routes (5)

| Route | File |
| --- | --- |
| `/about` | `apps/web/src/app/about/page.tsx` |
| `/contact` | `apps/web/src/app/contact/page.tsx` |
| `/editorial-policy` | `apps/web/src/app/editorial-policy/page.tsx` |
| `/how-we-check-our-figures` | `apps/web/src/app/how-we-check-our-figures/page.tsx` |
| `/updates` | `apps/web/src/app/updates/page.tsx` |

### New package — `packages/governance`

`types.ts`, `source-hierarchy.ts`, `provenance.ts`, `updates.ts`,
`verification-snapshot.ts`, `index.ts`

### Other new files

- `apps/web/src/lib/governance.ts` — web consumption bridge
- `tests/governance-phase4.test.ts` — 52 governance assertions
- `apps/web/e2e/governance.spec.ts` — 27 browser and accessibility checks
- `docs/PROFESSIONALISATION_PHASE4_AUDIT.md`
- `docs/PROFESSIONALISATION_PHASE4_REPORT.md` (this file)
- `docs/PHASE4_INTEGRATION_NOTES.md`
- `docs/RULES_MAINTENANCE_POLICY.md`
- `docs/RULES_REVIEW_CALENDAR.md`

### Shared files modified (6)

| File | Change | Why |
| --- | --- | --- |
| `apps/web/src/app/sitemap.ts` | Added a governance page block; existing blocks untouched | Sitemap inclusion was a Phase 4 requirement |
| `apps/web/src/components/layout/Footer.tsx` | Added an About column; narrowed the copyright column's grid span by one | Governance pages nothing links to are unreachable by browsing |
| `apps/web/src/types.d.ts` | Appended one ambient module declaration | A new package needs a declaration to be typed |
| `apps/web/e2e/seo-routing.spec.ts` | Replaced a hard-coded static-page count with an explicit `standalonePages` list | The count encoded the pre-Phase-4 route set and went stale when five routes were added |
| `apps/web/e2e/parity.spec.ts` | Absolute `http://localhost:3000/...` → relative path | The spec ignored its own `baseURL`; see §8 |
| `apps/web/e2e/fin001.spec.ts` | Absolute `http://localhost:3000/...` → relative path | Same defect; it was silently passing against another worktree's app |

Total diff against `origin/main`: **25 files, 4523 insertions, 6 deletions**.

None of these weakens a test. The `seo-routing` change replaces a magic number
with the named routes it stood for, and still fails on a duplicated or orphaned
sitemap entry. The two URL changes make specs honour the `baseURL` the config
already sets, which is what allowed Phase 4 to be verified in isolation at all.

---

## 3. Governance pages

| Page | Status | Notes |
| --- | --- | --- |
| About | PASS | Operator identity, UK-first focus, three-layer build, why methodology is shown, simplification and professional-advice limits. Organization structured data with substantiable properties only. |
| Contact | PASS | Five contact purposes with prefilled subjects; structured error-report guidance; explicit warning against sending sensitive data. No form backend. |
| Editorial Policy | PASS | All 14 required areas. Source hierarchy rendered from the shared definition. |
| How We Check Our Figures | PASS | Full assurance architecture, dated verification snapshot, explicit "what this does not prove" section, stated editorial coverage. |
| Updates | PASS | Data-driven, 9 entries, every date from git history, affected calculators validated against the live registry. |

**Design system.** All five pages use the existing `prose` layout, `Breadcrumbs`
and `Badge` components. No redesign; no new design primitives.

**Claims discipline.** No invented company registration, FCA authorisation,
office address, legal counsel, professional membership, external certification,
named legal or clinical reviewer, audit date, or manual screen-reader testing.
No claim of financial advice, regulated status, guaranteed accuracy or
government endorsement. Three test groups enforce this.

---

## 4. Source hierarchy

**Status: PASS.**

Three tiers defined in `packages/governance/src/source-hierarchy.ts` and
rendered on both `/editorial-policy` and `/how-we-check-our-figures` from the
same definition, so page and enforcement cannot diverge.

| Tier | Standing |
| --- | --- |
| 1 — Primary official | Mandatory for statutory values; may stand alone |
| 2 — Authoritative institutional | Explanation and corroboration; never sole evidence for a statutory value |
| 3 — Secondary explanatory | Background only; never sufficient for a rule-sensitive figure |

**Tier assignment is computed from the source's registrable domain**, not from
an authored field. Matching is on domain suffix, so `gov.uk.example.com`
correctly resolves to Tier 3 rather than inheriting statutory authority — this
is asserted by test.

**Live corpus at the snapshot date:** 109 cited sources — **86 Tier 1**, **23
Tier 2**, **0 Tier 3**.

Documented in the policy: when primary sources are mandatory; how inaccessible
sources are handled; how conflicts escalate towards legislation; that
search-result snippets and AI summaries are not sources at any tier; and that
verification dates are recorded per source.

**No claim of Tier 1 review for all 253 calculators is made anywhere.**

---

## 5. Provenance framework

**Status: PASS.**

Built as a **derivation layer over existing data**, not a parallel metadata
table. No new authored fields, no migration, and no possibility of the
provenance record disagreeing with the guide it describes.

| Derived value | Source of truth |
| --- | --- |
| `ruleSensitivity` | Registry `rulesSensitive` |
| `jurisdiction` | Registry `jurisdiction`, default United Kingdom |
| `sourcesReviewedAt` | Guide `lastReviewed` |
| `rulesetId` / `rulesetTaxYear` | Guide `ruleset` |
| `reviewState` | Guide `ruleStatus` + per-source `verificationStatus` |
| `nextReviewDue` | Computed under the documented review policy |

**Review policy** (the only judgement Phase 4 adds): rules-sensitive content
falls due at the next 6 April; general content on a 24-month cycle.

**Four review states**, exceeding the required three: `current`, `review-due`,
`verification-required`, `not-yet-reviewed`. The fourth exists so that "no
guide authored yet" is not conflated with "a figure needs checking".

**Position as at 26 August 2026:**

| State | Count |
| --- | --- |
| current | 37 |
| review-due | 0 |
| verification-required | 3 |
| not-yet-reviewed | 213 |
| **Total** | **253** |

Rules-sensitive: 51. General: 202. Guided: 40.

**Constraints honoured.** No calculator is marked verified without evidence. No
historical review date was manufactured — the only review dates in the system
are the Phase 2 `lastReviewed` values, reused unchanged. Metadata for all 253
calculators was deliberately **not** populated, because doing so would have
required inventing dates.

**UI.** No new metadata was added to calculator pages. Ruleset and review date
already render through the Phase 2 guide component in human wording ("Figures
stated for the 2026/27 UK tax year", "Content last reviewed …"). Public review
state labels are asserted by test to contain no internal jargon.

---

## 6. Rules maintenance

| Deliverable | Status |
| --- | --- |
| `docs/RULES_MAINTENANCE_POLICY.md` | PASS |
| `docs/RULES_REVIEW_CALENDAR.md` | PASS |

The policy covers the annual tax-year rollover, Budget and fiscal-event
monitoring, emergency mid-year changes, pension rules, benefit uprating,
property-tax divergence across the UK nations, external data and source
deprecation, health guidance review, benchmark regeneration, independent
derivation requirements, and the regression gate.

The calendar is explicit that it is a human schedule, not automation, and
**never predicts a fiscal event date** — a test asserts it makes no specific
future Budget date claim.

---

## 7. Testing

### Phase 4 governance suite

`tests/governance-phase4.test.ts` — **52 assertions** across eight groups:
routes, sitemap and canonical domain, truthfulness of claims, source hierarchy,
provenance and review freshness, verification snapshot, public updates record,
and rules-maintenance documentation.

All 17 required coverage areas are addressed. Tests assert contracts rather
than exact prose: no brittle full-string snapshots of editorial copy.

Two techniques worth noting:

- The stale-host check assembles its needle at runtime, so the test file and
  the e2e spec do not trip their own rule — cheaper and more honest than
  exempting files from the rule they enforce.
- Prose assertions run against whitespace-normalised, tag-stripped source, so
  they check what a page says rather than how the formatter wrapped it.

### Full suite

| Suite | Result |
| --- | --- |
| Unit / content / SEO / governance | **1057 / 1057 pass**, 0 fail, 0 skipped |
| Baseline before Phase 4 | 1005 / 1005 |
| Net increase | **+52**, all Phase 4 governance assertions |

### Reference benchmarks

```
Wave 1   total   275  executed  275   passed  275   failed 0  skipped 0
Wave 2   total  1164  executed 1164   passed 1164   failed 0  skipped 0
Wave 3   total    50  executed   50   passed   50   failed 0  skipped 0
COMBINED total  1489  executed 1489   passed 1489   failed 0  skipped 0
```

**1489 / 1489 pass.** Unchanged from baseline, as required — Phase 4 modified
no benchmark values and no calculation code.

---

## 8. Browser, parity and accessibility

**Result: 1669 / 1669 passed, 0 failed, 0 skipped** (25.6 minutes, exit code 0).

### Server provenance — and three invalid runs before this one

This gate took four attempts. The first three produced results that had to be
discarded, and the reason matters enough to record in full.

A parallel **Phase 5 Utility** worktree runs its own `next start` on port 3000.
This repository's Playwright config sets `reuseExistingServer: !process.env.CI`,
so a default run does not start its own server when one is already listening —
it attaches to whatever is there. Three runs therefore exercised Phase 5's
build while reporting on Phase 4:

| Run | Result | Why discarded |
| --- | --- | --- |
| 1 (port 3000) | 1663/1669, 6 failed | Server contention mid-run |
| 2 (targeted, port 3000) | 120/129, 9 failed | `ERR_CONNECTION_REFUSED` — attached to a dying server |
| 3 (port 3000) | 1042/1669, 627 failed | Served Phase 5's application entirely |

Run 3 proved it. The failing pages carried `<nav aria-label="Main Navigation">`
and `<nav aria-label="Category Navigation">` — neither string exists anywhere in
this worktree's `Header.tsx` or `Sidebar.tsx` — and the served sitemap contained
no `/about`. Process inspection confirmed port 3000 was held by a `next start`
from the **Phase 5 Utility** worktree.

**No attempt was made to stop Phase 5's server.** It belongs to a parallel
session's active work.

### How isolation was achieved

The final run used a dedicated port with `CI=1`, which forces
`reuseExistingServer: false`, so Playwright must start its own server and fails
loudly on a port collision rather than silently attaching:

```
CI=1 PORT=3411 npx playwright test --workers=4 --retries=0
```

Process inspection during the run confirmed the listener on port 3411 was
`next start` from this exact worktree's own `node_modules` — the Phase 4
Governance build. `--retries=0` was deliberate, so no failure could be masked
by a retry.

### A latent test defect this exposed, and fixed

Isolation initially still failed with 23 errors, because two specs called
`page.goto` with an **absolute** `http://localhost:3000/...` URL instead of the
configured `baseURL`:

- `apps/web/e2e/parity.spec.ts`
- `apps/web/e2e/fin001.spec.ts`

Running on port 3411, those specs still reached port 3000 — Phase 5's server —
producing `ERR_CONNECTION_REFUSED` and four assertion errors ("Could not find
result for `discriminant`", "`affordable_rent_by_ratio`") that were Phase 4
fixtures being checked against Phase 5's UI.

Worse, `fin001.spec.ts` **passed** in that state — a false pass against another
branch's application.

Both were changed to relative paths so they honour the `baseURL` the config
already sets. This is a two-line strengthening of the suite, not a relaxation:
a spec that ignores its own `baseURL` silently asserts against whatever process
happens to hold port 3000.

### Accessibility

Axe scans run across calculator, legal and the new governance pages, including
the "with results shown" variants. **0 serious and 0 critical violations**, and
the suite passed with no failures of any kind.

---

## 9. Build and type checking

| Gate | Result |
| --- | --- |
| Root typecheck (`tsc -p tsconfig.json`) | PASS |
| Web typecheck (`tsc --noEmit`) | PASS |
| Lint (`eslint .`) | PASS |
| Web production build | PASS |
| Generated pages | **287** (was 282; +5 governance routes) |

The page-count increase is the expected consequence of adding five routes, not
a regression.

---

## 10. Sitemap and discoverability

- All five governance routes added at priority 0.6 — above legal boilerplate
  (0.5), below categories (0.7).
- Canonical origin is `https://ukcalc.jomovate.com` throughout.
- Every governance page declares a unique title, a unique description of at
  least 60 characters, its own canonical path and an absolute Open Graph URL —
  uniqueness asserted by test.
- Breadcrumb navigation with `BreadcrumbList` structured data on every page.
- Robots behaviour unchanged.
- **No stale Render host in any active app, script or test file** — verified by
  a repository walk, and now enforced by test. The two historical audit
  documents containing the old host were preserved as historical records.

**Structured data restraint.** `Organization` was added on `/about` only,
carrying name, URL, description and contact email — the properties the
repository can substantiate. **No `FAQPage` schema was added**: the governance
pages are prose, not question-and-answer content, so the markup would not
honestly describe them.

---

## 11. Legal and trust language review

Reviewed; **not rewritten**. No surgical change proved necessary.

| Page | Finding |
| --- | --- |
| Disclaimer | Accurate and appropriately hedged. No guarantees claimed. Consistent with new pages. |
| Privacy | Accurate. Confirms no advertising or tracking cookies, which substantiates the independence section of the editorial policy. |
| Terms | States that accuracy is not guaranteed. No conflict introduced. |
| Accessibility | Says "designed to meet WCAG 2.2 AA requirements" and explicitly states that external certification has not been conducted. **Does not claim compliance.** Left unchanged. |

No contradictory WCAG statements, unsupported compliance claims, incorrect
regulatory wording, misleading guarantees or stale domain references were found
in the active pages. Regression tests now guard the accessibility wording
against being hardened into a compliance claim.

---

## 12. Protection diffs

```
git diff origin/main -- packages/calculation-engine   → empty
git diff origin/main -- packages/test-fixtures        → empty
git diff origin/main -- packages/rules-uk             → empty
git diff origin/main -- packages/calculator-registry  → empty
git diff --check                                      → clean
```

| Protected area | Result |
| --- | --- |
| Calculation engine changes | **NONE** |
| Approved benchmark value changes | **NONE** |
| UK statutory rule changes | **NONE** |
| Test tolerances weakened | **NONE** |
| Tests removed | **NONE** |

No potential calculation or rules defect was discovered during Phase 4. No
engine code was read into or written from this branch.

---

## 13. Phase 5 overlap

**Three shared files touched, all additively:** `Footer.tsx`, `sitemap.ts`,
`types.d.ts`. Each is documented in `PHASE4_INTEGRATION_NOTES.md` §2 with the
reason and the change shape.

**Untouched, as required:** `CalculatorBrowser.tsx`, `DynamicCalculator.tsx`,
`CalculatorGuide.tsx`, `RelatedCalculators.tsx`, the calculator registry
component, all field mapping and output format modules, the calculator and
category route components, the homepage, the root layout, `Header.tsx`,
`Sidebar.tsx`, and `lib/calculators.ts`.

No result rendering, form state, copy/share, print/export, favourites, recent
calculators, localStorage, search ranking, mobile controls, result persistence,
URL-encoded state, analytics or auth code was modified.

---

## 14. Executed evidence

| Gate | Command | Result |
| --- | --- | --- |
| Root typecheck | `npx tsc -p tsconfig.json` | PASS |
| Web typecheck | `npx tsc --noEmit` | PASS |
| Unit / content / SEO / governance | `npm test` | **1057 / 1057**, 0 fail, 0 skipped |
| Reference benchmarks | `npm run bench:reference` | **1489 / 1489**, 0 fail, 0 skipped |
| Lint | `npm run lint` | PASS |
| Web build | `npm --workspace=web run build` | PASS — **287 pages** |
| Browser / parity / Axe | `CI=1 PORT=3411 npx playwright test` | **1669 / 1669**, 0 fail, exit 0 |

### Verification snapshot published on /how-we-check-our-figures

| Figure | Value |
| --- | --- |
| Snapshot date | 2026-08-26 (UTC) |
| Calculators | 253 |
| Categories | 19 |
| Reference benchmark cases | 1489 |
| Unit, content and governance assertions | 1057 |
| Browser-level regression checks | 1669 |
| Calculators with a published guide | 40 |

Every figure came from an executed run. An earlier draft of this file carried
placeholder values of 1043 and 1662; both were replaced with the real executed
totals before commit. A test asserts the snapshot is never dated in the future,
and it did its job: a snapshot briefly dated 2026-08-27 (local time had rolled
over while UTC had not) failed the suite and was corrected to the UTC date the
runs actually executed on.

---

## 15. Unresolved and deferred items

| Item | Reason | Tracking |
| --- | --- | --- |
| 3 guides carry figures flagged `SOURCE VERIFICATION REQUIRED` | Editorial work outside governance scope; correctly disclosed on-page today | Quarterly provenance sweep in the review calendar |
| 213 of 253 calculators have no editorial guide | Content programme, not a governance task | Coverage stated publicly from live data |
| Manual assistive-technology testing | Not performed — and must not be claimed | Accessibility statement already discloses this |
| Named external legal, clinical or financial review | Has not occurred | Editorial policy §11 states this plainly |
| Automated source-link health checking | Currently a manual quarterly task | Review calendar; future automation candidate |

None of these blocks the Phase 4 PR. Each is disclosed rather than concealed,
which was the governance requirement.

---

## 16. Compliance with Phase 4 safety rules

| Rule | Status |
| --- | --- |
| Did not work on `main` | ✓ |
| Did not merge `main` | ✓ |
| Did not deploy production | ✓ |
| Did not create or merge a PR | ✓ |
| Did not rebase published history | ✓ |
| Did not force push | ✓ |
| Did not modify calculator mathematics | ✓ |
| Did not modify approved benchmark values | ✓ |
| Did not weaken test tolerances | ✓ |
| Did not remove tests | ✓ |
| Did not alter UK statutory rates or rules | ✓ |
| Did not invent legal facts | ✓ |
| Did not invent registrations, authorisations, memberships, reviewers, certifications, audit dates or screen-reader testing | ✓ |
| Did not claim financial advice, regulated status, guaranteed accuracy or government endorsement | ✓ |
| Preserved historical audit documents | ✓ |
| Did not modify Phase 5 utility/result-state functionality | ✓ |
| Kept the branch narrowly Phase-4 focused | ✓ |
