import type { Metadata } from "next";
import { CalculatorBrowser } from "@/components/home/CalculatorBrowser";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Dynamic catalogue rendered via CalculatorBrowser (liveCalculators.length)
const homeTitle = `${SITE_NAME} | Free UK Tax, Mortgage and Savings Calculators`;
const homeDesc =
  "Free UK calculators for tax, salary, mortgages, pensions, investments, property and everyday calculations, with transparent methods and UK-specific rules.";

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

