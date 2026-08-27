"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";

export function AppShell({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: string[];
}) {
  const pathname = usePathname();
  const isEmbed = Boolean(pathname?.startsWith("/embed"));

  if (isEmbed) {
    return (
      <div className="min-h-screen bg-white">
        <main className="w-full max-w-4xl mx-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <div className="container mx-auto flex-1 items-start md:grid md:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar categories={categories} />
        <main className="flex w-full flex-col overflow-hidden px-4 py-8 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
      <Footer />
      <ConsentBanner />
    </div>
  );
}
