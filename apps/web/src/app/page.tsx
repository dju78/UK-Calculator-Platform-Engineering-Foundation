import type { Metadata } from "next";
import { CalculatorBrowser } from "@/components/home/CalculatorBrowser";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// A server component so the homepage can declare its own canonical. The
// interactive search lives in CalculatorBrowser, which stays a client
// component.
export const metadata: Metadata = {
  title: `${SITE_NAME} | Free UK Tax, Mortgage and Savings Calculators`,
  description:
    "Browse 55 free UK calculators for tax, salary, mortgages, pensions, savings and everyday sums, using 2026/27 UK rules where applicable. Estimates only - not financial or tax advice.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} | Free UK Tax, Mortgage and Savings Calculators`,
    description:
      "Browse 55 free UK calculators for tax, salary, mortgages, pensions, savings and everyday sums.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
};

export default function Home() {
  return <CalculatorBrowser />;
}
