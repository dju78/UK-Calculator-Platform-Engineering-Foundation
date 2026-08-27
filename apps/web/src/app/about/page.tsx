import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { governanceSummary, AS_OF } from "@/lib/governance";

const DESCRIPTION =
  "Who runs the UK Calculator Platform, what it is for, how its calculators are built and checked, and where their limits are.";

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/about"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

export default function About() {
  const summary = governanceSummary(AS_OF);

  // Organization markup describing the operator. Only properties the
  // repository can substantiate: a name, the site, and a working contact
  // address. No registration number, no address, no regulatory status.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jomovate",
    url: absoluteUrl("/"),
    description: `Operator of the ${SITE_NAME}, a free UK-focused calculator resource.`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "dju78@jomovate.com",
      availableLanguage: "en-GB",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-10 shadow-2xs">
      <div className="prose max-w-none">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Breadcrumbs items={[{ label: "About" }]} className="mb-6 not-prose" />
        <h1>About the UK Calculator Platform</h1>

      <p>
        The UK Calculator Platform is a free collection of{" "}
        {summary.totalCalculators} calculators, operated by Jomovate. It exists
        to answer a specific kind of question well: the everyday numerical
        question a person in the UK actually has, worked out using UK rules,
        with the reasoning shown rather than hidden.
      </p>

      <h2>UK-first, not UK-flavoured</h2>
      <p>
        Most calculators on the open web are built for a different tax system
        and relabelled. This one is not. Income Tax, National Insurance,
        student loan repayments, Stamp Duty and its Scottish and Welsh
        equivalents, ISA and pension allowances, and Child Benefit are modelled
        against UK legislation and HMRC guidance, and the tax year the figures
        belong to is stated on the page rather than assumed.
      </p>
      <p>
        Where a rule genuinely differs across the UK nations, that difference is
        modelled rather than averaged away. Of the{" "}
        {summary.totalCalculators} published calculators,{" "}
        {summary.rulesSensitive} depend on rules that can change when
        legislation changes; the remaining {summary.general} are general
        mathematical, scientific or everyday tools whose method does not move
        with a Budget.
      </p>

      <h2>What the platform covers</h2>
      <p>
        The calculators span UK tax and salary, mortgages and property,
        pensions and retirement, investing and wealth, ISAs and tax wrappers,
        business and commercial finance, health and fitness, conversions,
        maths, geometry, statistics, science, dates, motoring, home
        construction, technology and everyday life. Each one sits in a category
        so that related tools are easy to find from any starting point.
      </p>

      <h2>How the calculators are built</h2>
      <p>
        Three things sit behind every result, and they are deliberately kept
        apart from one another.
      </p>
      <ul>
        <li>
          <strong>A calculation engine.</strong> The arithmetic lives in
          deterministic code, separate from the page that displays it. The same
          inputs always produce the same outputs, and the engine can be run and
          checked without a browser involved.
        </li>
        <li>
          <strong>Versioned UK rules.</strong> Rates, thresholds and bands are
          held as data tied to a named tax year, rather than being scattered
          through the code as loose numbers. That is what makes an annual
          rollover a reviewable change instead of an archaeology exercise.
        </li>
        <li>
          <strong>Editorial content.</strong> Where a calculator has a
          published guide, the method, worked example, assumptions, limitations
          and official sources are authored as structured data. A worked
          example carries the exact inputs that produced it, so the automated
          suite re-runs the engine and fails if a published figure no longer
          matches the arithmetic it claims to explain.
        </li>
      </ul>
      <p>
        Automated verification runs across all three. There are reference
        benchmark cases with independently derived expected values, unit tests,
        browser-level regression checks and automated accessibility scans.{" "}
        <Link href="/how-we-check-our-figures">
          How we check our figures
        </Link>{" "}
        sets out that process in full, including what it does and does not
        prove.
      </p>

      <h2>Why we show the method</h2>
      <p>
        A number on its own is not much use. If you cannot see which rules were
        applied, what was assumed, and where the figures came from, you have no
        way to judge whether the answer fits your situation — or to spot when it
        does not.
      </p>
      <p>
        So the platform publishes the governing formula, a worked example, the
        assumptions built into the model, the limitations of that model, and
        links to the official sources behind rule-sensitive figures. Our{" "}
        <Link href="/editorial-policy">editorial policy</Link> sets out the
        standards that content is held to, including the hierarchy of sources
        that statutory figures must be evidenced against.
      </p>

      <h2>What these calculators are not</h2>
      <p>
        The platform is an educational and informational resource. It is not
        regulated, it does not provide financial, tax, legal or medical advice,
        and it makes no personal recommendations.
      </p>
      <p>
        Every calculator simplifies. Real legislation is full of interactions,
        reliefs, elections and edge cases that a general-purpose tool cannot
        reasonably capture, and real circumstances are frequently more
        complicated than any set of input fields. A calculator here will tell
        you what its stated model produces for the figures you entered. It
        cannot know about your other income, your particular scheme rules, a
        relief you are eligible for, or a change in the law that has not yet
        been reflected here.
      </p>
      <p>
        Where a decision carries real financial, legal or health consequences,
        treat a result from this platform as a starting point for a better
        question, and check it with someone qualified to advise on your
        circumstances — an accountant, an FCA-regulated adviser, a solicitor or
        conveyancer, or a medical professional as appropriate. The{" "}
        <Link href="/disclaimer">disclaimer</Link> sets out the limits in full.
      </p>

      <h2>Corrections</h2>
      <p>
        If a figure looks wrong, we want to know, and a specific report is far
        more useful than a general impression. The{" "}
        <Link href="/contact">contact page</Link> explains what to include so
        that a suspected error can be reproduced and checked quickly, and{" "}
        <Link href="/updates">updates</Link> records the corrections and changes
        that have already been made.
      </p>
    </div>
  </div>
  );
}
