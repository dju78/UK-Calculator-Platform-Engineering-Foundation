import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: `For Organisations | ${SITE_NAME}`,
  description:
    "Explore embedding, bespoke calculator development, and calculation logic integration for businesses, educators, and public sector organisations.",
  alternates: { canonical: "/for-organisations" },
  openGraph: {
    title: `For Organisations | ${SITE_NAME}`,
    description:
      "Explore embedding, bespoke calculator development, and calculation logic integration for businesses, educators, and public sector organisations.",
    url: absoluteUrl("/for-organisations"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `For Organisations | ${SITE_NAME}`,
    description:
      "Explore embedding, bespoke calculator development, and calculation logic integration for businesses, educators, and public sector organisations.",
  },
};

export default function ForOrganisationsPage() {
  return (
    <div className="prose max-w-none">
      <Breadcrumbs items={[{ label: "For Organisations" }]} className="mb-6 not-prose" />
      <h1>For Organisations & Partners</h1>
      <p className="lead text-lg text-slate-700">
        Discover how the UK Calculator Platform can provide trusted, accurate, and accessible calculation tools for your team, website, or publication.
      </p>

      <h2>1. Embedding Calculation Tools</h2>
      <p>
        We offer streamlined, iframe-compatible embed versions of selected high-utility tools — including compound interest, loan repayments, VAT calculations, and unit conversions.
      </p>
      <p>
        Embeddable calculators are designed to be:
      </p>
      <ul>
        <li><strong>Responsive & Lightweight:</strong> Clean presentation that adapts seamlessly to desktop, tablet, and mobile containers.</li>
        <li><strong>Strictly Client-Side:</strong> User figures are calculated inside the visitor&apos;s browser with zero server transmission.</li>
        <li><strong>Maintained & Up to Date:</strong> Statutory thresholds and formulas are maintained to reflect relevant UK rates.</li>
      </ul>

      <h2>2. Custom Calculator Development & Logic Integration</h2>
      <p>
        If your business, charity, or educational institution requires specialised calculation workflows, tailored visual presentation, or specific rulesets, our engineering architecture is modular and extendable.
      </p>
      <p>
        Areas we can assist with include:
      </p>
      <ul>
        <li><strong>Bespoke Financial Workflows:</strong> Tailored debt payoff schedules, pension modelling, or commercial margin estimators.</li>
        <li><strong>Educational & Sector Tools:</strong> STEM calculators, conversion utilities, and data modelling aids.</li>
        <li><strong>White-Label Integration:</strong> Styled tools matching your corporate identity and brand guidelines.</li>
      </ul>

      <h2>3. Editorial Integrity & Independence</h2>
      <p>
        All calculations on our platform operate under strict editorial and mathematical independence. We do not alter calculation outputs, formulas, or assumptions to promote commercial products or sponsors.
      </p>

      <h2>4. Get in Touch</h2>
      <p>
        Interested in using or adapting a calculator for your organisation? We would be pleased to discuss your requirements.
      </p>
      <div className="not-prose my-6">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 transition-colors"
        >
          Contact Our Team
        </Link>
      </div>
    </div>
  );
}
