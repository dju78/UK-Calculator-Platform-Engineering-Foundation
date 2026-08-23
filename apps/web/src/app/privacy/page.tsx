export const metadata = {
  title: "Privacy Policy | UK Calculator Platform",
  description:
    "How the UK Calculator Platform handles your data. Calculations run in your browser and we do not store the figures you enter.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicy() {
  return (
    <div className="prose max-w-none">
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

      <h3>B. Server Logs & Telemetry</h3>
      <p>
        When you visit our website, our standard web servers may automatically log standard diagnostic information. This includes your IP address, browser type, referring URL, and access times. We use this strictly for security, monitoring server health, and debugging.
      </p>

      <h3>C. Third-Party APIs</h3>
      <p>
        To provide up-to-date currency conversion rates, we use the <a href="https://www.frankfurter.app/docs/" target="_blank" rel="noopener noreferrer">Frankfurter API</a>. When you use calculators involving currency exchange, your browser makes a direct request to the Frankfurter API. Consequently, your IP address and standard browser request headers will be visible to the Frankfurter API to process the request. The Frankfurter API does not receive your specific financial inputs (other than the base currency being requested). We encourage you to review their privacy policies regarding their data handling.
      </p>

      <h2>3. Cookies and Tracking Technologies</h2>
      <p>
        We do not use any marketing, advertising, or tracking cookies on this platform. If we introduce functional cookies in the future (for example, to save your preferences locally), we will update this policy accordingly.
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
  );
}
