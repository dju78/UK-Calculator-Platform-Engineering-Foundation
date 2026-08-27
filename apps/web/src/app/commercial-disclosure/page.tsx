import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: `Commercial Disclosure | ${SITE_NAME}`,
  description:
    "Our commercial disclosure policy: why calculations remain independent, how future partnerships are handled, and our editorial standards.",
  alternates: { canonical: "/commercial-disclosure" },
  openGraph: {
    title: `Commercial Disclosure | ${SITE_NAME}`,
    description:
      "Our commercial disclosure policy: why calculations remain independent, how future partnerships are handled, and our editorial standards.",
    url: absoluteUrl("/commercial-disclosure"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Commercial Disclosure | ${SITE_NAME}`,
    description:
      "Our commercial disclosure policy: why calculations remain independent, how future partnerships are handled, and our editorial standards.",
  },
};

export default function CommercialDisclosurePage() {
  return (
    <div className="prose max-w-none">
      <Breadcrumbs items={[{ label: "Commercial Disclosure" }]} className="mb-6 not-prose" />
      <h1>Commercial Disclosure</h1>
      <p>Last updated: August 2026</p>

      <h2>1. Current Operating Model</h2>
      <p>
        The UK Calculator Platform is currently provided free of charge for personal and professional reference.
        At present, the platform operates without third-party advertising banners, sponsored product placements, or affiliate compensation links.
      </p>

      <h2>2. Future Commercial Principles</h2>
      <p>
        To support the ongoing hosting, maintenance, and regular tax-year updates of our tools, the platform may introduce clearly labelled commercial arrangements in the future.
      </p>
      <p>
        Should commercial relationships or advertising be introduced, we adhere strictly to the following non-negotiable principles:
      </p>
      <ul>
        <li>
          <strong>Editorial & Mathematical Independence:</strong> Calculation formulas, mathematical algorithms, and statutory rule interpretations will never be influenced by commercial considerations, advertisers, or sponsors.
        </li>
        <li>
          <strong>No Altered Results:</strong> Commercial arrangements will never alter, inflate, or suppress calculation outputs or recommendations.
        </li>
        <li>
          <strong>Unambiguous Labelling:</strong> Any paid advertising, sponsored placement, or affiliate link will be clearly identified to users with explicit labels (e.g. &ldquo;Advertisement&rdquo; or &ldquo;Sponsored&rdquo;).
        </li>
        <li>
          <strong>Data Isolation:</strong> User inputs and calculation figures are never shared with commercial partners or advertising networks. Calculations run client-side in your browser.
        </li>
        <li>
          <strong>Vulnerable & Clinical Categories:</strong> Health, clinical, pregnancy, and debt guidance calculators remain free from intrusive or predatory commercial placements.
        </li>
      </ul>

      <h2>3. No Regulated Advice</h2>
      <p>
        Calculators and content on this platform are for informational and educational purposes only. They do not constitute regulated financial, investment, tax, legal, or medical advice.
        For personalised guidance, always consult an FCA-authorised financial adviser, qualified tax specialist, or medical practitioner.
      </p>

      <h2>4. Learn More</h2>
      <p>
        For further details on our standards and verification procedures, please review our{" "}
        <Link href="/editorial-policy" className="text-blue-600 underline hover:text-blue-800">
          Editorial Policy
        </Link>{" "}
        and{" "}
        <Link href="/how-we-check-our-figures" className="text-blue-600 underline hover:text-blue-800">
          How We Check Our Figures
        </Link>
        .
      </p>
    </div>
  );
}
