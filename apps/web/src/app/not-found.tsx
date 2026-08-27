import Link from "next/link";
import { categoryPath } from "@/lib/site";

const POPULAR_CATEGORIES = [
  "UK Tax & Salary",
  "Mortgages & Property",
  "Pensions & Retirement",
  "Finance & Debt",
  "Investing & Wealth",
  "Health & Fitness",
];

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 md:p-12 shadow-2xs max-w-2xl mx-auto text-center my-8">
      <span className="text-xs font-bold tracking-wider uppercase text-slate-700 mb-2 block">
        404 — Page Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 mb-4">
        Calculator or Page Not Found
      </h1>
      <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
        The calculator or page you requested could not be located. You can search our full catalogue of 253 free UK calculators or browse by category.
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Link 
          href="/"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
        >
          Search All Calculators
        </Link>
      </div>

      <div className="border-t border-slate-200/80 pt-6 w-full">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Popular Categories
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {POPULAR_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={categoryPath(cat)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 hover:bg-slate-200 hover:text-slate-950 text-xs font-medium transition-colors cursor-pointer"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

