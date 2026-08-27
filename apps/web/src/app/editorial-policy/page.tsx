import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { sourceHierarchy } from "@/lib/governance";

const DESCRIPTION =
  "The standards behind calculator content on the UK Calculator Platform: our source hierarchy, corrections policy, how rules-sensitive figures are handled, and where AI-assisted tooling is and is not trusted.";

export const metadata: Metadata = {
  title: `Editorial Policy | ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/editorial-policy" },
  openGraph: {
    title: `Editorial Policy | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/editorial-policy"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Editorial Policy | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

export default function EditorialPolicy() {
  return (
    <div className="prose max-w-none">
      <Breadcrumbs items={[{ label: "Editorial Policy" }]} className="mb-6 not-prose" />
      <h1>Editorial Policy</h1>
      <p>Last updated: August 2026</p>

      <p>
        This policy sets out the standards that calculator content on the UK
        Calculator Platform is held to, and how those standards are enforced in
        practice. It is written to be checkable: most of what follows is
        something you could hold a specific page against and find it wanting.
      </p>

      <h2>1. Scope</h2>
      <p>
        This policy covers everything editorial on the platform — calculator
        guides, methodology explanations, worked examples, assumptions,
        limitations, category descriptions, FAQs and the governance pages
        themselves. It does not cover the arithmetic itself, which is governed
        by code and automated verification and is described in{" "}
        <Link href="/how-we-check-our-figures">
          how we check our figures
        </Link>
        .
      </p>

      <h2>2. Content principles</h2>
      <ul>
        <li>
          <strong>Say what the calculator actually does.</strong> Every guide
          states the model being applied, not a flattering description of it.
        </li>
        <li>
          <strong>Show the working.</strong> The governing formula and the
          ordered steps behind it are published, so a reader can follow the
          reasoning rather than take the number on trust.
        </li>
        <li>
          <strong>State the limits as prominently as the capability.</strong>{" "}
          Assumptions and limitations are required sections, not optional
          extras appended when there is room.
        </li>
        <li>
          <strong>Plain English.</strong> Technical terms are used where they
          are the accurate word and explained on first use. Internal
          engineering identifiers never appear in reader-facing content.
        </li>
        <li>
          <strong>No content written to rank.</strong> Pages are written to
          answer the question the reader arrived with. FAQs cover questions
          people genuinely ask, not keyword variants of the page title.
        </li>
      </ul>

      <h2>3. UK-first approach</h2>
      <p>
        The platform models UK rules and states figures in pounds sterling
        using UK conventions. Where a rule differs between England, Northern
        Ireland, Scotland and Wales — Income Tax bands, Stamp Duty and its
        devolved equivalents, and student loan plans among them — the
        difference is modelled and named rather than averaged into a single
        national figure. Where a calculator applies to one nation only, its
        guide says so.
      </p>

      <h2>4. Source hierarchy</h2>
      <p>
        Sources are ranked, and the rank determines what a source is allowed to
        prove. The hierarchy is enforced automatically: a source is placed in a
        tier by the publishing body it comes from, not by an author&apos;s
        assessment of it.
      </p>
      {sourceHierarchy.map((tier) => (
        <div key={tier.tier}>
          <h3>
            Tier {tier.tier} — {tier.name}
          </h3>
          <p>{tier.description}</p>
          <p>
            <strong>Standing:</strong> {tier.standing}
          </p>
          <ul>
            {tier.publishers.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
      <p>
        Four rules follow from that ranking, and they are the ones that do the
        real work:
      </p>
      <ul>
        <li>
          <strong>A primary official source is mandatory</strong> for any
          statutory value — a rate, threshold, band, allowance, benefit amount
          or statutory formula. A Tier 2 or Tier 3 source may explain such a
          figure but may never be the only evidence for it.
        </li>
        <li>
          <strong>A search-result snippet is not a source.</strong> Neither is
          an AI-generated summary, nor a secondary page quoting a figure
          without citing where it came from. The underlying official page must
          be located and read; if it cannot be, the figure is not published as
          verified.
        </li>
        <li>
          <strong>Inaccessible sources are recorded, not worked around.</strong>{" "}
          If an official page has moved, been withdrawn or cannot be reached,
          the claim it supported is marked as requiring verification and is
          shown that way on the page. It is not quietly re-attributed to a
          weaker source that happens to agree.
        </li>
        <li>
          <strong>Conflicts escalate towards legislation.</strong> Where two
          sources disagree, the more primary one governs, with legislation
          above departmental guidance and guidance above explanatory material.
          Where two Tier 1 sources genuinely conflict, the figure is treated as
          unresolved and marked as requiring verification until it is settled,
          rather than resolved by picking the more convenient answer.
        </li>
      </ul>
      <p>
        Every cited source records the rule it supports and whether it has been
        verified, and — where the source itself stated one — the period the
        figure applies to. An absent period means the source did not say, which
        is deliberately different from a guess.
      </p>

      <h2>5. Methodology writing</h2>
      <p>
        Each guide explains how the calculation works in prose, then states the
        governing formula plainly and breaks it into ordered steps. The
        methodology describes what the engine actually does. Where the engine
        simplifies — and it usually does — the simplification is named in the
        assumptions rather than glossed over in the method.
      </p>

      <h2>6. Worked examples</h2>
      <p>
        Every guide carries a worked example built from a realistic scenario,
        with the inputs shown as the reader would enter them and the steps
        followed through to the result.
      </p>
      <p>
        Published example figures are not typed in by hand. Each example stores
        the exact inputs it was computed from, and the automated test suite
        re-runs the calculation engine against those inputs and compares the
        result to every figure published in the guide. If an engine change
        moves a number, the suite fails. A worked example on this platform
        therefore cannot drift away from the arithmetic it claims to
        demonstrate — the two are checked against each other on every build.
        Examples that depend on the current date pin the date they were
        computed on, so they neither drift nor quietly fall outside the
        calculator&apos;s own validation window as time passes.
      </p>

      <h2>7. Assumptions and limitations</h2>
      <p>
        Both are required sections. Assumptions record the modelling choices
        the reader is entitled to know about — which reliefs are and are not
        applied, what is assumed about growth or inflation, what is treated as
        constant. Limitations state where the model stops being a reliable
        guide, including the circumstances it does not attempt to handle.
      </p>
      <p>
        A calculator that presents itself as more capable than it is causes
        more harm than one that is plainly bounded, because the reader has no
        way to know when to stop trusting it.
      </p>

      <h2>8. Corrections policy</h2>
      <p>
        Errors are corrected rather than quietly overwritten.
      </p>
      <ul>
        <li>
          <strong>Report.</strong> Anyone can report a suspected error via the{" "}
          <Link href="/contact">contact page</Link>. A report with inputs, the
          observed result and a supporting official source can be investigated
          immediately.
        </li>
        <li>
          <strong>Reproduce.</strong> The reported inputs are run against the
          engine to establish what the platform actually produces, before any
          judgement is made about whether it is wrong.
        </li>
        <li>
          <strong>Verify independently.</strong> The disputed rule is checked
          against a primary official source. The expected value is derived
          independently rather than by reading it off the code that is under
          suspicion.
        </li>
        <li>
          <strong>Fix and prove.</strong> A confirmed defect is corrected, and
          regression cases covering it are added so the same error cannot
          return unnoticed. Benchmark expectations are never edited to match
          what the code happens to produce.
        </li>
        <li>
          <strong>Record.</strong> Corrections that change a published result
          are listed on the{" "}
          <Link href="/updates">updates page</Link>, naming the calculators
          affected.
        </li>
      </ul>

      <h2>9. Rules-sensitive calculators</h2>
      <p>
        A calculator is treated as rules-sensitive when its output depends on
        rules that can change when legislation or official rates change. Those
        calculators carry extra obligations: the tax year is named on the page,
        the figures are stated against a specific versioned ruleset, every
        statutory value is evidenced by a primary official source, and the
        review date is shown so a reader can see how current the content is.
      </p>
      <p>
        Review freshness is derived from the editorial content itself rather
        than maintained as a separate list, so a review date cannot exist for
        work nobody did. Rules-sensitive content falls due for review at the
        start of each UK tax year; general content is revisited on a fixed
        cycle to catch link rot and drifting explanation.
      </p>

      <h2>10. AI-assisted development and editorial use</h2>
      <p>
        AI-assisted tooling is used in building and maintaining this platform,
        and we would rather say so plainly than let you discover it. It
        supports software development, organising research, drafting
        explanatory prose, generating test scaffolding and quality assurance
        work.
      </p>
      <p>
        What matters is what it is <em>not</em> trusted to do. No calculation
        result, statutory rate, threshold or rule reaches this platform on the
        authority of a language model. Figures are anchored to four things
        instead:
      </p>
      <ul>
        <li>
          <strong>Deterministic code.</strong> Results come from a calculation
          engine that produces the same output for the same input every time,
          not from generated text.
        </li>
        <li>
          <strong>Approved rule configuration.</strong> Rates and thresholds
          live in versioned rule data tied to a named tax year, reviewed as a
          deliberate change.
        </li>
        <li>
          <strong>Independently derived benchmark cases.</strong> Expected
          values are worked out from the rules themselves, not by running the
          code and recording whatever it produced. A benchmark that simply
          agreed with the implementation would prove nothing.
        </li>
        <li>
          <strong>Official sources.</strong> Rule-sensitive figures are checked
          against primary official sources under the hierarchy above, and
          published with a link so a reader can check them too.
        </li>
      </ul>
      <p>
        An AI-drafted explanation is treated as a draft requiring verification,
        exactly like any other unchecked draft. Where a figure has not been
        confirmed against an official source, the page says so rather than
        presenting it as verified.
      </p>

      <h2>11. Human accountability</h2>
      <p>
        The platform is operated by Jomovate, and responsibility for what is
        published rests there. Changes to calculation logic, statutory rules
        and editorial content are reviewed before release and are recorded in
        version control, so any published figure can be traced to the change
        that introduced it.
      </p>
      <p>
        We do not claim an editorial board, named external reviewers,
        professional memberships or third-party certification, because we have
        none. Where content would benefit from professional review we say so
        rather than implying it has already happened.
      </p>

      <h2>12. Advertising and independence</h2>
      <p>
        The platform carries no advertising, no sponsored content and no
        affiliate links, and no product provider pays for placement or
        mention. Nothing in a calculator result or a guide is influenced by a
        commercial relationship, because there are none to influence it. If
        that ever changes, this section will be updated to say so, and any
        paid or affiliate relationship will be disclosed on the pages it
        affects.
      </p>
      <p>
        The platform does not use marketing, advertising or tracking cookies —
        see the <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>13. Updates and review</h2>
      <p>
        Content is reviewed on a schedule rather than only when something
        breaks. The review cycle covers the annual UK tax year rollover,
        Budgets and other fiscal events, benefit and pension uprating,
        mid-year statutory changes, and periodic checks that cited sources
        still resolve and still say what they said. Material user-facing
        changes are published on the{" "}
        <Link href="/updates">updates page</Link>.
      </p>

      <h2>14. Medical, financial and tax boundaries</h2>
      <p>
        The platform provides general information and estimates. It is not
        regulated, and it does not provide financial, investment, tax, legal or
        medical advice, nor personal recommendations of any kind.
      </p>
      <ul>
        <li>
          <strong>Tax.</strong> Calculators apply simplified standard rules and
          cannot account for the full range of individual circumstances,
          reliefs and elections. HMRC or a qualified accountant is the
          authority on your position.
        </li>
        <li>
          <strong>Financial products.</strong> Projections are illustrations
          built on assumptions that will not hold exactly. They are not
          lending offers, quotations or recommendations. Advice on a financial
          product should come from an FCA-regulated adviser.
        </li>
        <li>
          <strong>Health.</strong> Health calculators are general educational
          tools using population-level formulas. They do not diagnose, do not
          account for individual clinical circumstances, and do not replace
          advice from a medical professional.
        </li>
      </ul>
      <p>
        Where health content cites clinical guidance, it is sourced from the
        NHS or NICE. We do not claim clinical review of that content by named
        practitioners, because none has taken place.
      </p>

      <h2>Questions about this policy</h2>
      <p>
        Get in touch via the <Link href="/contact">contact page</Link>.
      </p>
    </div>
  );
}
