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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto py-12 px-4">
      <span className="text-sm font-semibold tracking-wider uppercase text-blue-600 mb-2">
        404 — Page Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
        Calculator or Page Not Found
      </h1>
      <p className="text-slate-600 mb-8 max-w-md leading-relaxed">
        The calculator or page you requested could not be located. You can search our full catalogue of 253 free UK calculators or browse by category.
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Link 
          href="/"
          className="px-5 py-2.5 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          Search All Calculators
        </Link>
      </div>

      <div className="border-t border-slate-200 pt-6 w-full">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Popular Categories
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {POPULAR_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={categoryPath(cat)}
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

