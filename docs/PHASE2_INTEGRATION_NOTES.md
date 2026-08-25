# Phase 2 Integration Notes

How the Phase 2 content layer attaches to the application, and exactly which
shared files it touches. Written so that Phase 3 can see the whole surface at a
glance without reading the diff.

## Where the content lives

```
packages/calculator-content/src/
  types.ts               CalculatorGuideDefinition and its supporting types
  top40.ts               the priority target set, plus recorded plan corrections
  batch1-tax-salary.ts   authored guides, one file per batch
  index.ts               allGuides, getCalculatorGuide(), guidedCalculatorIds()
```

Content is a workspace package rather than a folder under `apps/web/src`. That
is deliberate and it is not cosmetic. `apps/web` has no `"type": "module"` of
its own, so `tsc` emits CommonJS for anything beneath it, while the repository
root declares `"type": "module"` and `dist/` carries no `package.json`. A
content module under `apps/web` therefore compiles to CommonJS but is *loaded*
as ESM, and the root test suite cannot import it at all. Putting the content in
`packages/` makes it plain ESM, which is what the rest of the test suite already
consumes.

## Rendering

One component, owned by Phase 2:

```
apps/web/src/components/calculators/CalculatorGuide.tsx
```

It exports two things:

- `CalculatorGuide({ guide })` — renders an authored guide.
- `CalculatorGuideSection({ calculatorId })` — looks the guide up and renders
  `null` when none exists. This is the page-level entry point.

The lookup lives in the component rather than in the route so that the shared
calculator page carries a single import and a single line. The runtime value is
imported from `dist/packages/calculator-content/src/index.js`, matching how the
app already consumes the registry and the engine; the *type* is imported from
source through the existing `@foundation/*` alias, so the cast inside
`CalculatorGuideSection` is re-checked against the real interface whenever the
content types change.

The component is a server component with no client JavaScript. The FAQ
accordion uses native `<details>`/`<summary>`, which is keyboard operable and
screen-reader announced without a script.

## Shared files modified

Exactly one file owned by Phase 3 was touched:

`apps/web/src/app/calculators/[slug]/page.tsx`

- one added import: `CalculatorGuideSection`
- one added line in the returned JSX, after `<DisclaimerBanner />`:
  `<CalculatorGuideSection calculatorId={calc.id} />`

Nothing else in that file changed. No metadata helper, sitemap, robots file,
category page or JSON-LD infrastructure was modified.

## Structured data: deliberately not emitted

`CalculatorGuide.tsx` emits **no** JSON-LD. Structured data infrastructure is
Phase 3's responsibility, and two phases writing competing `FAQPage` blocks onto
the same page would be worse than none.

The guide data is shaped so Phase 3 can drive structured data from it directly:

- `guide.faqs` — genuine authored questions and answers. `FAQPage` markup is
  only honest on a page where these are actually rendered, and the presence of
  the guide is the signal for that.
- `guide.formulaExplanation.steps` — ordered procedural steps, the honest basis
  for `HowTo` markup where Phase 3 wants it.
- `guide.relatedCalculators` — editorial relationships, already validated
  against the live registry, for internal-link architecture.
- `guide.officialSources` — citations with publisher and verification status.

`getCalculatorGuide(id)` is the single entry point Phase 3 needs.

## Validation

`tests/calculator-guides.test.ts` runs as part of the root `npm test`.

The load-bearing check is the worked-example suite: every published figure is
re-derived by calling the real engine with the exact inputs the guide records.
A drifting engine, or a mistyped figure, fails the suite rather than leaving a
wrong number on a public page.

The rest of the suite validates structure: target ids are live calculators,
related links resolve, sources are HTTPS on an official domain and say which
rule they support, rule-sensitive guides name their ruleset, a guide claiming
`VERIFIED` cites no unverified source, and no placeholder text, internal wave
terminology, raw calculator id or guaranteed-outcome language reaches the
public surface.

`a started batch is a finished batch` enforces that a group is never shipped
half-authored, while still allowing later batches to be absent.

## Engine protection

Phase 2 modifies nothing under `packages/calculation-engine` and no benchmark
fixture. Two genuine discrepancies were found during source verification and
recorded rather than fixed; see `docs/PHASE2_SOURCE_VERIFICATION_REGISTER.md`
and the `ENGINE/RULE REVIEW REQUIRED` entries in
`docs/PROFESSIONALISATION_PHASE2_REPORT.md`.
