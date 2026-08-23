import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { wave1Registry } from "../../../../dist/packages/calculator-registry/src/index.js";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "UK Calculator Platform",
  description: "Wave 1 Financial & Tax Calculators",
  openGraph: {
    title: "UK Calculator Platform",
    description: "Wave 1 Financial & Tax Calculators",
    url: 'https://ukcalculatorplatform.co.uk',
    siteName: 'UK Calculator Platform',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = Array.from(new Set(wave1Registry.map(c => c.category))).sort();

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
