import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: `Accessibility Statement | ${SITE_NAME}`,
  description:
    "Our commitment to WCAG 2.2 AA standards, how we test the UK Calculator Platform, known limitations, and how to report an accessibility barrier.",
  alternates: { canonical: "/accessibility" },
  openGraph: {
    title: `Accessibility Statement | ${SITE_NAME}`,
    description:
      "Our commitment to WCAG 2.2 AA standards, how we test the UK Calculator Platform, known limitations, and how to report an accessibility barrier.",
    url: absoluteUrl("/accessibility"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Accessibility Statement | ${SITE_NAME}`,
    description:
      "Our commitment to WCAG 2.2 AA standards, how we test the UK Calculator Platform, known limitations, and how to report an accessibility barrier.",
  },
};

export default function AccessibilityStatement() {
  return (
    <div className="prose max-w-none">
      <Breadcrumbs items={[{ label: "Accessibility Statement" }]} className="mb-6 not-prose" />
      <h1>Accessibility Statement</h1>
      <p>Last updated: August 2026</p>

      <p>
        Jomovate is committed to making the UK Calculator Platform accessible to everyone, regardless of technology or ability. We strive to provide a positive, inclusive user experience for all our visitors.
      </p>

      <h2>1. Our Commitment</h2>
      <p>
        The platform is designed to meet WCAG 2.2 AA requirements. Automated accessibility testing is integrated into development, with manual accessibility review forming part of ongoing quality assurance.
      </p>

      <h2>2. Testing and Validation</h2>
      <p>
        To support accessible design and usability, our engineering practices include:
      </p>
      <ul>
        <li><strong>Automated Testing:</strong> Automated Axe Core accessibility scans are integrated into our test suite to detect and prevent regressions across all supported form layouts and interactive components.</li>
        <li><strong>Semantic Structure:</strong> Clean, semantic HTML forms, explicit labels, ARIA landmarks, and live regions are implemented across all calculators.</li>
        <li><strong>Continuous Improvement:</strong> Manual accessibility reviews and user feedback inform ongoing refinements to keyboard navigation and assistive technology support.</li>
      </ul>
      <p>
        The platform undergoes continuous automated and internal engineering review; formal third-party external certification has not been conducted.
      </p>

      <h2>3. Known Limitations</h2>
      <p>
        Despite our best efforts, there may be some pages or features that are not fully accessible. If you find an issue, we want to hear about it so we can fix it.
      </p>

      <h2>4. Feedback and Contact</h2>
      <p>
        We welcome your feedback on the accessibility of the UK Calculator Platform. If you encounter any barriers, or if you need assistance using any of our tools, please contact us:
      </p>
      <ul>
        <li>Email: <a href="mailto:dju78@jomovate.com">dju78@jomovate.com</a></li>
      </ul>
      <p>
        We try to respond to all accessibility feedback within 5 business days.
      </p>
    </div>
  );
}
