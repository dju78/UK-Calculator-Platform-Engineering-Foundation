import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { liveCategories } from "@/lib/calculators";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = liveCategories;

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col bg-white">
          <Header />
          <div className="container mx-auto flex-1 items-start md:grid md:grid-cols-[256px_minmax(0,1fr)]">
            <Sidebar categories={categories} />
            <main className="flex w-full flex-col overflow-hidden px-4 py-6 md:px-8">
              {children}
            </main>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
