import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

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
      <h1>Accessibility Statement</h1>
      <p>Last updated: August 2026</p>

      <p>
        Jomovate is committed to making the UK Calculator Platform accessible to everyone, regardless of technology or ability. We strive to provide a positive, inclusive user experience for all our visitors.
      </p>

      <h2>1. Our Commitment</h2>
      <p>
        The platform is designed to meet WCAG 2.2 AA requirements. Automated accessibility testing with Axe Core is integrated into development, alongside ongoing manual review of keyboard navigation, focus management, and screen reader compatibility.
      </p>

      <h2>2. Testing and Validation</h2>
      <p>
        To ensure our platform meets these standards, we employ the following practices:
      </p>
      <ul>
        <li><strong>Automated Testing:</strong> We integrate Axe accessibility testing into our development pipeline to catch and resolve accessibility issues early.</li>
        <li><strong>Manual Review:</strong> We conduct periodic manual reviews using keyboard navigation and screen reader software.</li>
        <li><strong>Semantic HTML:</strong> We use appropriate HTML elements to ensure compatibility with assistive technologies.</li>
      </ul>
      <p>
        While we perform rigorous internal testing, please note that the UK Calculator Platform is not currently formally certified by an external third-party accessibility auditor.
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
