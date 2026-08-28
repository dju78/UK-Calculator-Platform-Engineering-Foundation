import React from "react";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
      <AdminHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">UK Calculator Platform</span> — Private Management Console (Phase 1)
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>253 Calculators</span>
            <span>•</span>
            <span>19 Categories</span>
            <span>•</span>
            <span>2026/27 Rules</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

