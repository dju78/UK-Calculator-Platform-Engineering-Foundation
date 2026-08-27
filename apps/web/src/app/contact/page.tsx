import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const CONTACT_EMAIL = "dju78@jomovate.com";

const DESCRIPTION =
  "How to report a suspected calculation error, out-of-date UK tax or benefit figures, an accessibility barrier or a technical problem on the UK Calculator Platform.";

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/contact"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

/**
 * Contact is a page, not a form.
 *
 * A form would mean a backend, a database and somewhere for other people's
 * data to sit and be breached. A mailto link needs none of that, works with
 * assistive technology, is copyable by anyone whose device has no mail client
 * configured, and gives the sender a record of what they sent. The subject
 * lines below are prefilled so reports arrive already sorted.
 */
function MailtoLink({ subject, children }: { subject: string; children: React.ReactNode }) {
  return (
    <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`}>
      {children}
    </a>
  );
}

export default function Contact() {
  return (
    <div className="prose max-w-none">
      <Breadcrumbs items={[{ label: "Contact" }]} className="mb-6 not-prose" />
      <h1>Contact</h1>

      <p>
        The UK Calculator Platform is operated by Jomovate. Email is the way to
        reach us, and the address below is monitored for all of the purposes on
        this page:
      </p>
      <p className="not-prose my-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <a
          className="text-lg font-semibold text-slate-900 underline underline-offset-4"
          href={`mailto:${CONTACT_EMAIL}`}
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>
        There is no contact form, and no account is needed. We do not operate a
        telephone line.
      </p>

      <h2>Reporting a possible calculation error</h2>
      <p>
        This is the most valuable message you can send us, and it is worth
        being specific. A report we can reproduce gets investigated properly; a
        report that says only that a number looked wrong usually cannot be
        acted on at all.
      </p>
      <p>Please include, as far as you can:</p>
      <ul>
        <li>
          <strong>Which calculator</strong> — its name, or the page address you
          were on.
        </li>
        <li>
          <strong>The exact inputs you entered</strong>, including any options
          you selected, such as the tax year, the UK nation, or a
          first-time-buyer or Scottish taxpayer setting.
        </li>
        <li>
          <strong>The result you were shown.</strong>
        </li>
        <li>
          <strong>The result you expected</strong>, if you know it, and how you
          worked it out.
        </li>
        <li>
          <strong>A source that supports the expected figure</strong> — ideally
          a GOV.UK, HMRC or legislation.gov.uk page. This matters more than
          anything else on the list: it is the difference between a difference
          of opinion and a checkable claim.
        </li>
        <li>
          <strong>The date you saw it.</strong>
        </li>
      </ul>
      <p>
        <MailtoLink subject="Possible calculation error">
          Email a calculation report
        </MailtoLink>
        .
      </p>
      <p>
        Please do not send bank details, account numbers, National Insurance
        numbers, tax reference numbers, medical information or any other
        sensitive personal data. We do not need it, and we do not want to hold
        it. Rounded or made-up figures that still reproduce the problem are
        perfectly good for a bug report.
      </p>

      <h2>Reporting out-of-date UK rules</h2>
      <p>
        Tax rates, thresholds, benefit rates and allowances change, sometimes
        mid-year. If a calculator is still applying superseded figures, tell us
        which rule, which tax year it should now be, and the official page that
        sets it out. Rule corrections take priority over everything else in the
        queue.
      </p>
      <p>
        <MailtoLink subject="Out-of-date UK rules">
          Email a rules update
        </MailtoLink>
        . Our{" "}
        <Link href="/editorial-policy">corrections policy</Link> explains how
        reports are handled, and{" "}
        <Link href="/updates">updates</Link> records corrections already made.
      </p>

      <h2>Accessibility feedback</h2>
      <p>
        If any part of the platform is difficult or impossible to use with a
        screen reader, keyboard, magnification or any other assistive
        technology, we want to hear about it. Tell us the page, what you were
        trying to do, what happened, and the browser and assistive technology
        you were using.
      </p>
      <p>
        <MailtoLink subject="Accessibility feedback">
          Email accessibility feedback
        </MailtoLink>
        . See also our{" "}
        <Link href="/accessibility">accessibility statement</Link>.
      </p>

      <h2>Technical problems</h2>
      <p>
        For a page that will not load, a control that does not respond, a
        layout that breaks, or a result that fails to appear, tell us the page
        address, your browser and device, and what you did immediately before
        the problem.
      </p>
      <p>
        <MailtoLink subject="Technical problem">
          Email a technical problem
        </MailtoLink>
        .
      </p>

      <h2>General feedback and suggestions</h2>
      <p>
        Requests for a calculator that does not exist yet, a field that would
        make an existing one more useful, or an explanation that did not land —
        all welcome.
      </p>
      <p>
        <MailtoLink subject="Feedback">Email general feedback</MailtoLink>.
      </p>

      <h2>What we cannot help with</h2>
      <p>
        We cannot advise on your personal tax, benefits, pension, mortgage,
        investment or medical situation, and we cannot tell you what you should
        do. The platform is an educational resource, it is not regulated, and
        nothing on it is financial, tax, legal or medical advice. For advice on
        your own circumstances, speak to a qualified professional — HMRC or an
        accountant for tax, an FCA-regulated adviser for financial products,
        MoneyHelper for free impartial money guidance, a solicitor or
        conveyancer for property, or a medical professional for health. The{" "}
        <Link href="/disclaimer">disclaimer</Link> sets out these boundaries in
        full.
      </p>

      <h2>Response times</h2>
      <p>
        The platform is run by a small team, so we cannot promise a reply to
        every message. Reports of suspected calculation errors and accessibility
        barriers are prioritised, and we aim to acknowledge accessibility
        feedback within five business days.
      </p>
    </div>
  );
}
