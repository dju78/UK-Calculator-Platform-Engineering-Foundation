import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  AS_OF,
  governanceSummary,
  verificationSnapshot,
  sourceHierarchy,
  formatGovernanceDate,
  formatGovernanceMonth,
} from "@/lib/governance";

const DESCRIPTION =
  "The verification architecture behind the UK Calculator Platform: deterministic engines, versioned UK rules, independently derived benchmarks, automated regression and accessibility testing, and what all of that does and does not prove.";

export const metadata: Metadata = {
  title: `How We Check Our Figures | ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/how-we-check-our-figures" },
  openGraph: {
    title: `How We Check Our Figures | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/how-we-check-our-figures"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `How We Check Our Figures | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

/** A labelled figure in the dated snapshot panel. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

export default function HowWeCheckOurFigures() {
  const summary = governanceSummary(AS_OF);
  const snapshot = verificationSnapshot;
  const number = new Intl.NumberFormat("en-GB");

  return (
    <div className="prose max-w-none">
      <Breadcrumbs
        items={[{ label: "How We Check Our Figures" }]}
        className="mb-6 not-prose"
      />
      <h1>How we check our figures</h1>

      <p>
        Anyone can publish a calculator. The useful question is what stands
        behind the number it gives you. This page describes the verification
        actually in place on this platform, and — just as importantly — what it
        does not prove.
      </p>

      <h2>The architecture</h2>
      <p>
        The platform is deliberately built in layers that can be checked
        separately. Presentation is kept apart from calculation, and
        calculation is kept apart from the rules it applies. That separation is
        what makes verification possible at all: you cannot meaningfully test
        arithmetic that only exists inside a page.
      </p>

      <h3>1. A calculator registry</h3>
      <p>
        Every calculator is declared in a single registry with its identifier,
        name, public address, category, jurisdiction and whether it is
        rules-sensitive. The registry is validated automatically: identifiers
        and public addresses must be unique and well formed, categories must be
        real, and a calculator only becomes visible on the site once a
        calculation engine actually exists for it. That gate is why an
        unfinished calculator cannot appear as though it were finished.
      </p>

      <h3>2. Deterministic calculation engines</h3>
      <p>
        The arithmetic lives in code that takes inputs and returns outputs, with
        no dependence on the browser, the page or anything ambient. The same
        inputs always produce the same outputs. Inputs are validated at the
        engine boundary, so an out-of-range or nonsensical value produces a
        clear error rather than a confidently wrong number.
      </p>

      <h3>3. Versioned UK rules</h3>
      <p>
        Rates, thresholds and bands are held as data tied to a named tax year,
        not scattered through the code as bare numbers. Progressive band
        arithmetic — the kind used for Income Tax, National Insurance and Stamp
        Duty — is implemented once and shared, so a band boundary behaves the
        same way everywhere rather than being reimplemented, slightly
        differently, in a dozen places.
      </p>

      <h3>4. Independently derived benchmark cases</h3>
      <p>
        This is the part that does the heavy lifting, and the detail that
        matters is the word <em>independently</em>.
      </p>
      <p>
        Each calculator has reference cases: a set of inputs with the expected
        outputs stated alongside. Those expected values are derived from the
        rules themselves — worked out from the legislation and official
        guidance — rather than produced by running the code and recording
        whatever came out. A benchmark generated from the implementation cannot
        detect an error in that implementation; it only proves the code still
        agrees with itself. Deriving the expected value separately is what
        turns the suite into an actual check.
      </p>
      <p>
        Benchmark expectations are treated as fixed. When code and benchmark
        disagree, the disagreement is investigated and one of them is proved
        wrong. Editing an expected value so a failing test passes is the one
        move that would hollow out everything else on this page.
      </p>

      <h3>5. Automated regression suites</h3>
      <p>
        The repository maintains several suites that run together before any
        release:
      </p>
      <ul>
        <li>
          <strong>Reference benchmarks</strong> execute every calculator
          against its derived expected values.
        </li>
        <li>
          <strong>Unit and integrity tests</strong> cover engine behaviour,
          registry validity, rule data, input validation and edge cases.
        </li>
        <li>
          <strong>Content verification</strong> re-runs the engine against the
          exact inputs behind every published worked example and fails if any
          published figure no longer matches. Published explanation cannot
          drift away from the arithmetic it describes.
        </li>
        <li>
          <strong>Browser-level parity checks</strong> drive the real pages in
          a real browser and confirm that what a user sees matches what the
          engine computed — closing the gap between a correct engine and a
          field wired to the wrong input.
        </li>
        <li>
          <strong>Route and metadata checks</strong> confirm that pages
          resolve, that canonical addresses are correct, and that the sitemap
          matches what is actually published.
        </li>
        <li>
          <strong>Automated accessibility scans</strong> run Axe against
          calculator and content pages to catch accessibility regressions.
        </li>
        <li>
          <strong>Type checking and build verification</strong> run across the
          whole repository, so a change that breaks a contract between two
          parts of the system fails before it can reach the site.
        </li>
      </ul>

      <h3>6. Source verification</h3>
      <p>
        Rule-sensitive figures are checked against primary official sources,
        under a hierarchy that determines what a given source is allowed to
        prove:
      </p>
      <ul>
        {sourceHierarchy.map((tier) => (
          <li key={tier.tier}>
            <strong>
              Tier {tier.tier} — {tier.name}.
            </strong>{" "}
            {tier.standing}
          </li>
        ))}
      </ul>
      <p>
        A source&apos;s tier is determined by the body that published it, not by an
        author&apos;s judgement of how authoritative it felt. Where a figure has not
        been confirmed against an official source, the guide says so on the
        page instead of presenting it as verified. The{" "}
        <Link href="/editorial-policy">editorial policy</Link> sets out how
        inaccessible sources and conflicting sources are handled.
      </p>

      <h2 id="snapshot">Verification snapshot</h2>
      <p>
        Test totals change as the platform grows, so they are published as a
        dated snapshot rather than as a permanent claim. The figures below come
        from suites actually executed on this date, not from a planning
        document.
      </p>
      <p className="not-prose mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Verification snapshot — {formatGovernanceDate(snapshot.date)}
      </p>
      <div className="not-prose mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat
          value={number.format(snapshot.calculators)}
          label="Calculators published"
        />
        <Stat
          value={number.format(snapshot.categories)}
          label="Categories"
        />
        <Stat
          value={number.format(snapshot.referenceBenchmarkCases)}
          label="Reference benchmark cases executed"
        />
        <Stat
          value={number.format(snapshot.unitAndContentTests)}
          label="Unit, content and governance assertions"
        />
        <Stat
          value={number.format(snapshot.browserChecks)}
          label="Browser-level regression checks"
        />
        <Stat
          value={number.format(snapshot.publishedGuides)}
          label="Calculators with a published guide"
        />
      </div>

      <h2>Editorial coverage, stated honestly</h2>
      <p>
        Automated verification covers every published calculator. Authored
        editorial guides — with methodology, a verified worked example,
        assumptions, limitations and cited official sources — currently cover{" "}
        {summary.guided} of {summary.totalCalculators} calculators,
        concentrated on the rule-sensitive and most-used tools where the
        explanation matters most.
      </p>
      <p>
        We are not going to describe that as full editorial review, because it
        is not. A calculator without a published guide still runs on the same
        verified engine and the same benchmark cases; what it lacks is the
        written explanation and the source citations. Coverage is stated here
        so you can see exactly where the platform stands.
      </p>
      <ul>
        <li>
          {summary.rulesSensitive} of {summary.totalCalculators} calculators
          depend on rules that change when legislation changes; the remaining{" "}
          {summary.general} apply general mathematical or scientific methods
          that do not move with a Budget.
        </li>
        <li>
          Guides cite {summary.totalSources} official sources, of which{" "}
          {summary.tier1Sources} are Tier 1 primary official sources and{" "}
          {summary.tier2Sources} are Tier 2 authoritative institutional
          sources.
        </li>
        <li>
          {summary.byReviewState["verification-required"] > 0 ? (
            <>
              {summary.byReviewState["verification-required"]} guides carry at
              least one figure still marked as requiring source verification,
              and say so on the page.
            </>
          ) : (
            <>
              No published guide currently carries a figure marked as requiring
              source verification.
            </>
          )}
        </li>
        {summary.latestReviewDate && (
          <li>
            Published guides were last reviewed against their sources in{" "}
            {formatGovernanceMonth(summary.latestReviewDate)}.
          </li>
        )}
      </ul>

      <h2>Review and maintenance</h2>
      <p>
        Rule-sensitive content falls due for review at the start of each UK tax
        year, which is when its figures actually go stale — rates change on 6
        April, not a fixed number of months after somebody last read the
        guidance. General content is revisited on a fixed cycle to catch link
        rot and drifting explanation. Budgets, mid-year statutory changes and
        benefit or pension uprating trigger review outside that cycle.
      </p>
      <p>
        Review dates shown on calculator pages are derived from the editorial
        content itself rather than kept in a separate list. A review date
        therefore cannot exist for a review nobody performed.
      </p>

      <h2>What this does not prove</h2>
      <p>
        Verification reduces risk. It does not eliminate it, and a page like
        this one is worth very little unless it says so.
      </p>
      <ul>
        <li>
          <strong>Benchmarks cover cases somebody thought of.</strong> A large,
          independently derived suite catches a great deal, but no finite set
          of cases can prove that every possible combination of inputs produces
          a correct result.
        </li>
        <li>
          <strong>Legislation changes, sometimes without warning.</strong>{" "}
          Rates and thresholds move at Budgets and fiscal events, and
          occasionally mid-year. There will be periods between a change taking
          effect and this platform reflecting it.
        </li>
        <li>
          <strong>Every calculator simplifies.</strong> Real tax and benefit
          law is full of interactions, reliefs, elections and edge cases that a
          general-purpose tool does not attempt to model. Where your
          circumstances exceed the stated assumptions, the result will not
          describe your position.
        </li>
        <li>
          <strong>Correct arithmetic is not the same as the right answer for
          you.</strong> A calculator can apply its model perfectly and still
          give you a figure that is wrong for your situation, because the model
          was never built for it.
        </li>
        <li>
          <strong>Automated accessibility testing has limits.</strong> Axe
          catches many defects, but automated scanning cannot substitute for
          testing with real assistive technology, and we do not claim to have
          completed formal external accessibility certification. See our{" "}
          <Link href="/accessibility">accessibility statement</Link>.
        </li>
      </ul>
      <p>
        We do not guarantee that any calculation is accurate, and nothing here
        is financial, tax, legal or medical advice. Where a decision carries
        real consequences, check the result with someone qualified to advise on
        your circumstances. See the{" "}
        <Link href="/disclaimer">disclaimer</Link>.
      </p>

      <h2>Found something wrong?</h2>
      <p>
        Reports of suspected errors are prioritised, and a report with the
        inputs you used, the result you saw and an official source supporting
        the figure you expected can be investigated straight away. The{" "}
        <Link href="/contact">contact page</Link> explains what to include.
        Corrections already made are recorded on the{" "}
        <Link href="/updates">updates page</Link>.
      </p>
    </div>
  );
}
