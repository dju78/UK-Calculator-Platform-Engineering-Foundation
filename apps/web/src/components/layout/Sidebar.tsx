"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar({ categories }: { categories: string[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0 px-4 py-2 md:py-8 md:pr-6 md:border-r md:border-slate-200/90 md:sticky md:top-16 md:overflow-y-auto md:max-h-[calc(100vh-4rem)] no-print">
      <h2 className="mb-2 md:mb-4 text-xs font-bold tracking-wider text-slate-700 uppercase">
        Categories
      </h2>
      <nav aria-label="Category Navigation" className="flex flex-row overflow-x-auto gap-2 pb-1 md:flex-col md:overflow-visible md:pb-0 snap-x">
        <Link 
          href="/" 
          className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[2.5rem] whitespace-nowrap shrink-0 snap-start ${
            pathname === "/" ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-950"
          }`}
        >
          All Calculators
        </Link>
        {categories.map((cat) => {
          const href = `/category/${encodeURIComponent(cat.toLowerCase())}`;
          const isActive = pathname === href;
          return (
            <Link
              key={cat}
              href={href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[2.5rem] whitespace-nowrap shrink-0 snap-start ${
                isActive ? "bg-slate-900 text-white shadow-xs" : "text-slate-700 hover:bg-slate-200/60 hover:text-slate-950"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
