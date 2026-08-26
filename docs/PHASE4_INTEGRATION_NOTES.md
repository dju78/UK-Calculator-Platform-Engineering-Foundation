# Phase 4 Integration Notes

**Branch:** `professionalisation-phase-4-governance`
**Base:** `origin/main` at `2809222` (Merge pull request #7 from dju78/public-domain-ukcalc)
**Purpose:** record exactly which shared files Phase 4 touched, why, and what
Phase 5 needs to know when the two branches meet.

---

## 1. Phase 5 protection stance

Phase 5 is developing calculator utility and result-state functionality in
parallel. Phase 4 was scoped to stay out of its way, and did.

**Files Phase 4 did not touch at all:**

- `apps/web/src/components/home/CalculatorBrowser.tsx`
- `apps/web/src/components/calculators/DynamicCalculator.tsx`
- `apps/web/src/components/calculators/registry.tsx`
- `apps/web/src/components/calculators/CalculatorGuide.tsx`
- `apps/web/src/components/calculators/RelatedCalculators.tsx`
- all field mapping, field type and output format modules
- `apps/web/src/app/calculators/[slug]/page.tsx`
- `apps/web/src/app/category/[category]/page.tsx`
- `apps/web/src/app/page.tsx` and `apps/web/src/app/layout.tsx`
- `apps/web/src/lib/calculators.ts`, `disclaimers.ts`, `relatedCalculators.ts`
- `apps/web/src/components/layout/Header.tsx` and `Sidebar.tsx`
- every package under `packages/calculation-engine`, `packages/rules-uk`,
  `packages/test-fixtures` and `packages/calculator-registry`

No result rendering, form state, copy/share, print/export, favourites, recent
calculators, localStorage, search ranking, mobile control, result persistence,
URL-encoded state, analytics or auth code was read from or written to.

---

## 2. Shared files Phase 4 did modify

Six. Three are additive changes to application files; three are corrections to
existing e2e specs, described in §2.4. Each is listed with the reason it was
unavoidable and the shape of the change, so a merge conflict can be resolved
without reading the whole diff.

### 2.1 `apps/web/src/components/layout/Footer.tsx`

**Why unavoidable.** New governance pages that nothing links to are unreachable
by browsing and weakly discovered by search. The brief directed integration
through "the least conflict-prone existing legal/footer area", and the footer
is that area.

**Change shape.** The existing four-column grid gains one column. Concretely:

- a new `<div>` column listing the five governance routes, inserted before the
  existing Legal column;
- the copyright column's span narrowed from `md:col-span-3` to
  `md:col-span-2` to make room. The grid remains `md:grid-cols-4`.

**Nothing else in the footer changed.** No link was removed, no text altered.

**One thing deliberately *not* done.** An earlier revision wrapped both link
columns in `<nav>` landmarks, which reads as the more accessible choice. It was
reverted. The Sidebar already provides the page's single navigation landmark,
and adding two more made the existing `getByRole('navigation')` assertion in
`smoke.spec.ts` ambiguous under Playwright strict mode. The links are reachable
and correctly grouped under their headings either way, so the landmark was not
worth breaking an existing contract for. A comment in the file records this so
nobody "fixes" it back.

**If Phase 5 also edits Footer.tsx:** the conflict will be structural, not
semantic. Keep both new columns and whichever span value makes the resulting
column count add up.

### 2.2 `apps/web/src/app/sitemap.ts`

**Why unavoidable.** A page absent from the sitemap is a page search engines
are not told about, and sitemap inclusion was an explicit Phase 4 requirement.

**Change shape.** One new `governancePages` array mapping the five routes at
priority 0.6, and one changed line in the return statement to spread it. The
existing `calculators`, `categories` and `staticPages` blocks are untouched.

### 2.3 `apps/web/src/types.d.ts`

**Why unavoidable.** The web app consumes compiled foundation packages from
`dist/` via ambient module declarations. A new package needs a new declaration
block; there is no way to type the import without one.

**Change shape.** Purely additive — one appended
`declare module "*/dist/packages/governance/src/index.js"` block. No existing
declaration was modified.

### 2.4 Three e2e specs — and a warning Phase 5 needs

**`apps/web/e2e/seo-routing.spec.ts`.** The sitemap test asserted
`locs.length === 5 + categories.length + calculators.length`, where `5` encoded
the pre-Phase-4 static route set. Adding five governance routes to the sitemap
made that number stale. It is now an explicit `standalonePages` array naming all
nine standalone routes, so adding a page means naming it and the assertion keeps
meaning something. It still fails on a duplicated or orphaned entry.

**`apps/web/e2e/parity.spec.ts` and `apps/web/e2e/fin001.spec.ts`.** Both called
`page.goto` with an absolute `http://localhost:3000/...` URL instead of the
`baseURL` the Playwright config already sets. Changed to relative paths. One
line each.

**Why this matters to Phase 5 specifically.** The Phase 5 Utility worktree runs
its own `next start` on port 3000. Because `playwright.config.ts` sets
`reuseExistingServer: !process.env.CI`, a default `npm run test:e2e` in either
worktree does **not** start its own server when one is already listening — it
attaches to whatever is there. During Phase 4 verification this produced three
invalid runs, one of which executed 1,669 Phase 4 tests against Phase 5's
application and reported 627 failures that had nothing to do with either branch.

With the absolute URLs still in place, `fin001.spec.ts` **passed** while
pointing at the other worktree's build — a false green, which is worse than a
false red.

Run the browser suite on a dedicated port with `CI=1`, which forces
`reuseExistingServer: false` so Playwright starts its own server and fails
loudly on a collision instead of silently attaching:

```
CI=1 PORT=3411 npx playwright test --workers=4 --retries=0
```

Then confirm by process inspection that the listener on that port is `next
start` from your own worktree before trusting any result.

---

## 3. New files added by Phase 4

Nothing in this list exists on `main`, so none of it can conflict.

**New package** — `packages/governance/src/`:

| File | Responsibility |
| --- | --- |
| `types.ts` | Provenance, source tier and update type model |
| `source-hierarchy.ts` | The three-tier hierarchy and domain-based tier classification |
| `provenance.ts` | Derives review freshness from registry and editorial content |
| `updates.ts` | The public change record |
| `verification-snapshot.ts` | Dated record of what the suites actually executed |
| `index.ts` | Public surface |

**New routes** — `apps/web/src/app/{about,contact,editorial-policy,how-we-check-our-figures,updates}/page.tsx`

**New web module** — `apps/web/src/lib/governance.ts`

**New tests** — `tests/governance-phase4.test.ts` (52 assertions),
`apps/web/e2e/governance.spec.ts` (27 browser checks)

**New docs** — this file, plus `PROFESSIONALISATION_PHASE4_AUDIT.md`,
`PROFESSIONALISATION_PHASE4_REPORT.md`, `RULES_MAINTENANCE_POLICY.md`,
`RULES_REVIEW_CALENDAR.md`

---

## 4. Architectural decisions worth knowing

### 4.1 Provenance is derived, not authored

The obvious way to build a freshness framework is a table of calculators with
`reviewedAt` and `reviewStatus` columns. Phase 4 deliberately did not do that.

A hand-maintained provenance table is a second source of truth that drifts from
the guides it describes, and the first time it drifts the platform publishes a
"verified" badge it cannot substantiate. Instead, every provenance value is
computed from data that already existed:

| Derived value | Source of truth |
| --- | --- |
| `ruleSensitivity` | Registry `rulesSensitive` (Waves 1–3) |
| `jurisdiction` | Registry `jurisdiction`, defaulting to United Kingdom |
| `sourcesReviewedAt` | Guide `lastReviewed` (Phase 2) |
| `rulesetId` / `rulesetTaxYear` | Guide `ruleset` (Phase 2) |
| `reviewState` | Guide `ruleStatus` and per-source `verificationStatus` |
| `nextReviewDue` | Computed from the review date under a documented policy |

The only judgement Phase 4 added is the review *policy* — how long a review
stays valid — and it is a single documented constant, not a per-calculator
field that could be quietly relaxed.

**Consequence for Phase 5:** no migration, no new data to populate, and no
duplicate metadata to keep in step. Adding a guide automatically produces a
provenance record; it cannot be forgotten.

### 4.2 No new UI on calculator pages

Calculator pages already display ruleset and review date through
`CalculatorGuide.tsx` (Phase 2). Phase 4 added no badge, banner or metadata
strip to calculator pages — partly to avoid cluttering them with developer
metadata, and partly because that file sits close to Phase 5's territory.

### 4.3 Source tier is computed from the domain

A source's tier is derived from its registrable domain, not from an authored
field, because a hand-set tier is exactly what gets set wrong under deadline.
Matching is on domain suffix rather than substring, so `gov.uk.example.com`
correctly falls to Tier 3 instead of inheriting statutory authority.

### 4.4 Types are derived in the web bridge

`apps/web/src/lib/governance.ts` derives its exported types from the imported
values (`typeof`, `ReturnType`) rather than importing type aliases by name.

This is not stylistic. Two TypeScript projects compile that file: the root
project resolves the ambient declaration in `types.d.ts`, while the web project
resolves the emitted JavaScript, which carries no type exports. Only value-based
derivation satisfies both. `calculators.ts` uses the same technique for the
registry, for the same reason.

---

## 5. Deliberate non-changes

- **Legal pages** (`/privacy`, `/terms`, `/disclaimer`, `/accessibility`) were
  reviewed and left unmodified. See the audit for the findings; in short, the
  Phase 1 wording is already appropriately hedged, states no unsupported
  compliance claim, and does not contradict the new governance pages.
- **Historical audit documents** containing the old `onrender.com` host were
  preserved as written. They are records of what was true when written, not
  live configuration. No active app, script or test file references that host,
  and a test now enforces that.
- **No FAQPage structured data** was added. The governance pages are prose, not
  question-and-answer content, so FAQPage markup would not honestly describe
  them.
- **Organization structured data** was added on `/about` only, carrying just a
  name, URL, description and contact email — the properties the repository can
  substantiate.

---

## 6. Merge guidance

1. Phase 4 does not merge `main`, rebase published history or force push.
2. On merge, the only files likely to conflict are the three in §2.
3. If Phase 5 adds a navigation component that supersedes footer links, the
   governance links must move rather than disappear —
   `tests/governance-phase4.test.ts` asserts they are reachable from shared
   navigation and will fail if they are dropped.
4. If Phase 5 changes the published calculator count, the verification snapshot
   test fails by design until the snapshot is regenerated from an actual run.
   That is the mechanism working, not a broken test.
