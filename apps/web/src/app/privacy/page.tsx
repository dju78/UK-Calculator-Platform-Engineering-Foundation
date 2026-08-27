import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ConsentManager } from "@/components/privacy/ConsentManager";

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description:
    "How the UK Calculator Platform handles your data. Calculations run in your browser and we do not store the figures you enter.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description:
      "How the UK Calculator Platform handles your data. Calculations run in your browser and we do not store the figures you enter.",
    url: absoluteUrl("/privacy"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy | ${SITE_NAME}`,
    description:
      "How the UK Calculator Platform handles your data. Calculations run in your browser and we do not store the figures you enter.",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-10 shadow-2xs">
      <div className="prose max-w-none">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} className="mb-6 not-prose" />
      <h1>Privacy Policy</h1>
      <p>Last updated: August 2026</p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to the UK Calculator Platform, operated by Jomovate. We are committed to protecting your privacy. This Privacy Policy explains how we handle data when you visit and use our website.
      </p>

      <h2>2. What Data We Collect and How We Use It</h2>
      <h3>A. Calculation Data</h3>
      <p>
        All calculations performed on the UK Calculator Platform happen directly within your web browser (client-side). We do not transmit, collect, or store any of the financial inputs, values, or outputs you enter into our calculators on our servers.
      </p>

      <h3>B. Privacy-Safe Analytics & Measurement</h3>
      <p>
        To understand which tools are useful and improve the platform, we may use privacy-friendly analytics to count aggregate page views and calculator usage.
      </p>
      <p>
        Our analytics infrastructure operates under strict privacy safeguards:
      </p>
      <ul>
        <li><strong>No sensitive data:</strong> We never collect salaries, tax amounts, debt figures, pension values, property values, investment balances, pregnancy dates, health measurements, or calculation results.</li>
        <li><strong>No personal profiles:</strong> We do not track individuals across the web or build user dossiers.</li>
        <li><strong>User control:</strong> Analytics is disabled by default until configured, and you can grant or revoke consent at any time using the preferences control below.</li>
      </ul>

      <ConsentManager />

      <h3>C. Server Logs & Telemetry</h3>
      <p>
        When you visit our website, our standard web servers may automatically log standard diagnostic information. This includes your IP address, browser type, referring URL, and access times. We use this strictly for security, monitoring server health, and debugging.
      </p>

      <h3>D. Third-Party APIs</h3>
      <p>
        To provide up-to-date currency conversion rates, we use the <a href="https://www.frankfurter.app/docs/" target="_blank" rel="noopener noreferrer">Frankfurter API</a>. When you use calculators involving currency exchange, your browser makes a direct request to the Frankfurter API. Consequently, your IP address and standard browser request headers will be visible to the Frankfurter API to process the request. The Frankfurter API does not receive your specific financial inputs (other than the base currency being requested). We encourage you to review their privacy policies regarding their data handling.
      </p>

      <h2>3. Cookies and Local Storage</h2>
      <p>
        We do not use advertising or marketing tracking cookies. We use browser LocalStorage solely for functional preferences:
      </p>
      <ul>
        <li>Saving your pinned favourite calculators.</li>
        <li>Remembering recently visited calculators on your device.</li>
        <li>Recording your analytics consent preference.</li>
      </ul>
      <p>
        These preferences never leave your browser and can be cleared at any time in your browser settings.
      </p>

      <h2>4. Your Rights</h2>
      <p>
        Because we do not collect or store your personal data or calculation inputs, there is no personal data for us to export or delete upon request.
      </p>

      <h2>5. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:dju78@jomovate.com">dju78@jomovate.com</a>.
      </p>
      </div>
    </div>
  );
}
