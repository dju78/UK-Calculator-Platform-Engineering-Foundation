import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { liveCategories } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Free UK Tax, Mortgage and Savings Calculators`,
    template: `%s`,
  },
  description:
    "Free UK calculators for tax, salary, mortgages, pensions, savings and everyday sums, using 2026/27 UK rules where applicable. Estimates only - not financial or tax advice.",
  openGraph: {
    title: `${SITE_NAME} | Free UK Tax, Mortgage and Savings Calculators`,
    description:
      "Free UK calculators for tax, salary, mortgages, pensions, savings and everyday sums, using 2026/27 UK rules where applicable.",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_GB',
    type: 'website',
  },
  verification: {
    google: googleVerification || undefined,
    other: bingVerification ? { 'msvalidate.01': bingVerification } : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = liveCategories;

  return (
    <html lang="en">
      <body>
        <AppShell categories={categories}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
