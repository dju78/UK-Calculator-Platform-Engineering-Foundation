"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import {
  trackPageView,
  trackCategoryView,
  trackGovernancePageView,
  trackEmbedLoaded,
  trackForOrganisationsView,
  trackCommercialDisclosureView
} from "@/lib/analytics";

export function AppShell({
  children,
  categories,
}: {
  children: React.ReactNode;
  categories: string[];
}) {
  const pathname = usePathname();
  const isEmbed = Boolean(pathname?.startsWith("/embed"));

  useEffect(() => {
    if (!pathname) return;

    // Determine page_type safely
    let page_type: "home" | "category" | "calculator" | "governance" | "embed" | "b2b" | "legal" | "other" = "other";
    if (pathname === "/") page_type = "home";
    else if (pathname.startsWith("/category")) page_type = "category";
    else if (pathname.startsWith("/calculators")) page_type = "calculator";
    else if (pathname.startsWith("/embed")) page_type = "embed";
    else if (pathname === "/for-organisations") page_type = "b2b";
    else if (["/about", "/methodology", "/editorial-policy", "/accessibility"].includes(pathname)) page_type = "governance";
    else if (["/privacy", "/terms", "/cookies", "/commercial-disclosure"].includes(pathname)) page_type = "legal";

    trackPageView({ path: pathname, page_type });

    // Route-specific analytics
    if (pathname.startsWith("/category/")) {
      const category = decodeURIComponent(pathname.replace("/category/", "")).trim();
      if (category) {
        trackCategoryView({ category });
      }
    } else if (pathname === "/for-organisations") {
      trackForOrganisationsView();
    } else if (pathname === "/commercial-disclosure") {
      trackCommercialDisclosureView();
    } else if (["/about", "/methodology", "/editorial-policy", "/accessibility"].includes(pathname)) {
      trackGovernancePageView({ page_slug: pathname.replace(/^\//, "") });
    } else if (pathname.startsWith("/embed/")) {
      const slug = pathname.replace("/embed/", "").split("/")[0].trim();
      if (slug) {
        trackEmbedLoaded({ calculator_slug: slug });
      }
    }
  }, [pathname]);

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
        <main className="flex w-full flex-col overflow-hidden px-4 py-4 md:py-8 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
      <Footer />
      <ConsentBanner />
    </div>
  );
}
