import type { Metadata } from "next";
import { CalculatorBrowser } from "@/components/home/CalculatorBrowser";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { liveCalculators } from "@/lib/calculators";

const calcCount = liveCalculators.length;
const homeTitle = `${SITE_NAME} | Free UK Tax, Mortgage and Savings Calculators`;
const homeDesc = `Browse ${calcCount} free UK calculators for tax, salary, mortgages, pensions, savings and everyday sums, using 2026/27 UK rules where applicable. Estimates only - not financial or tax advice.`;

// A server component so the homepage can declare its own canonical. The
// interactive search lives in CalculatorBrowser, which stays a client
// component.
export const metadata: Metadata = {
  title: homeTitle,
  description: homeDesc,
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description: homeDesc,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDesc,
  },
};

export default function Home() {
  return <CalculatorBrowser />;
}
