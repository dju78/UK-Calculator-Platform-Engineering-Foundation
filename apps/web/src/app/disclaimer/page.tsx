import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: `Disclaimer | ${SITE_NAME}`,
  description:
    "Results on the UK Calculator Platform are illustrative estimates and do not constitute financial, tax, legal, lending or medical advice.",
  alternates: { canonical: "/disclaimer" },
  openGraph: {
    title: `Disclaimer | ${SITE_NAME}`,
    description:
      "Results on the UK Calculator Platform are illustrative estimates and do not constitute financial, tax, legal, lending or medical advice.",
    url: absoluteUrl("/disclaimer"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Disclaimer | ${SITE_NAME}`,
    description:
      "Results on the UK Calculator Platform are illustrative estimates and do not constitute financial, tax, legal, lending or medical advice.",
  },
};

export default function Disclaimer() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-10 shadow-2xs">
      <div className="prose max-w-none">
        <Breadcrumbs items={[{ label: "Disclaimer" }]} className="mb-6 not-prose" />
        <h1>Disclaimer</h1>
        <p>Last updated: August 2026</p>

        <p>
          The UK Calculator Platform is operated by Jomovate. By using this website, you acknowledge and agree to the following disclaimers:
        </p>

        <h2>1. General Informational Purposes Only</h2>
        <p>
          All calculators, tools, articles, and information provided on the UK Calculator Platform are intended for broad, general illustrative purposes only. None of the content provided on this platform constitutes financial, tax, legal, investment, or mortgage advice.
        </p>

        <h2>2. Specific Disclaimers</h2>
        <ul>
          <li>
            <strong>Tax Calculators:</strong> Tax estimates are based on simplified standard rules for the selected tax year. They do not account for individual circumstances, deductions, blind person&apos;s allowance, Scottish/Welsh specific variations (unless explicitly selected), or complex corporate structures. Always consult HM Revenue & Customs (HMRC) or a certified accountant.
          </li>
          <li>
            <strong>Pension Calculators:</strong> Pension projections make assumptions about future growth, inflation, and annuity rates which are entirely unpredictable. Your actual pension pot and income could be significantly higher or lower than the estimates provided.
          </li>
          <li>
            <strong>Mortgage & Loan Calculators:</strong> Mortgage and loan results do not constitute a lending offer. Actual interest rates, repayment amounts, and terms will depend on your credit score, the lender&apos;s policies, and market conditions at the time of application. Early repayment charges and other fees may apply.
          </li>
          <li>
            <strong>Foreign Exchange (FX):</strong> Currency conversion figures are estimated using delayed third-party data. They do not include spread fees, transaction fees, or commission charged by banks and brokers.
          </li>
          <li>
            <strong>Health & Lifestyle Calculators:</strong> Any health-related calculators are for general educational purposes and do not replace professional medical advice, diagnosis, or treatment.
          </li>
        </ul>

        <h2>3. No Guarantees</h2>
        <p>
          We make no warranties or representations regarding the accuracy, completeness, or suitability of the calculations. You are solely responsible for any decisions you make based on the outputs of this platform. We highly recommend verifying all figures with a qualified professional before taking any financial action.
        </p>

        <h2>4. Contact</h2>
        <p>
          If you have questions regarding this disclaimer, please contact us at <a href="mailto:dju78@jomovate.com">dju78@jomovate.com</a>.
        </p>
      </div>
    </div>
  );
}
