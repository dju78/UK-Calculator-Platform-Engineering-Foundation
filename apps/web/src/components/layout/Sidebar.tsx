"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar({ categories }: { categories: string[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0 px-4 py-6 md:border-r md:border-slate-200 min-h-[calc(100vh-4rem)] bg-slate-50 md:bg-transparent">
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-slate-900 uppercase">
        Categories
      </h2>
      <nav className="flex flex-col gap-1">
        <Link 
          href="/" 
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            pathname === "/" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
