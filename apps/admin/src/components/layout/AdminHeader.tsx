"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview", matchExact: true },
  { href: "/calculators", label: "Calculators", matchExact: false },
  { href: "/rules", label: "Rules & Governance", matchExact: false },
  { href: "/qa", label: "QA & Verification", matchExact: false },
  { href: "/seo", label: "Search & SEO", matchExact: false },
  { href: "/traffic", label: "Traffic & Audience", matchExact: false },
  { href: "/releases", label: "Releases", matchExact: false },
  { href: "/system", label: "System", matchExact: false },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-100">
                UK
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  UKCalc Console
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Management & Governance
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              READ-ONLY
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>Production: ukcalc.jomovate.com</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>

        {/* Text-First Primary Navigation Bar */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto border-t border-slate-800 py-1.5 table-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchExact
              ? pathname === item.href
              : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
