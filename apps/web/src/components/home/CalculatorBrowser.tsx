"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { liveCalculators, liveCategories } from "@/lib/calculators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

// High-value canonical entry points for featured discovery
const FEATURED_IDS = [
  "TAX-001", // UK Income Tax
  "TAX-002", // Salary
  "PRO-001", // UK Mortgage
  "PRO-023", // Stamp Duty (SDLT)
  "INV-002", // Compound Interest
  "PEN-001", // Pension Growth
  "ISA-001", // Stocks & Shares ISA
  "HLT-001", // BMI
  "TAX-015", // VAT Calculator
  "PEN-011", // FIRE
  "INV-029", // Monte Carlo
  "PRO-008", // Fixed vs Tracker
];

export function CalculatorBrowser() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const featuredCalculators = useMemo(() => {
    return FEATURED_IDS
      .map((id) => liveCalculators.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return liveCalculators.filter((calc) => {
      const matchesCat =
        selectedCategory === "All" ||
        calc.category.toLowerCase() === selectedCategory.toLowerCase();

      if (!query) return matchesCat;

      const matchesName = calc.name.toLowerCase().includes(query);
      const matchesSubcat =
        calc.subcategory && calc.subcategory.toLowerCase().includes(query);
      const matchesCatName = calc.category.toLowerCase().includes(query);

      return matchesCat && (matchesName || matchesSubcat || matchesCatName);
    });
  }, [search, selectedCategory]);

  const isFiltering = search.trim().length > 0 || selectedCategory !== "All";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calculators</h1>
        <p className="text-slate-500">
          Browse and search {liveCalculators.length} free UK calculators across {liveCategories.length} categories for tax, property, finance, investments and everyday calculations.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="max-w-md">
          <Input 
            placeholder="Search calculators..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search calculators"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-slate-500 mr-1">Category:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === "All"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All {!search && `(${liveCalculators.length})`}
          </button>
          {liveCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {!isFiltering && featuredCalculators.length > 0 && (
        <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 id="featured-heading" className="text-xl font-bold text-slate-900">
              Featured Calculators
            </h2>
            <span className="text-xs text-slate-500">
              Popular UK calculators for tax, mortgages &amp; finance
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCalculators.map((calc) => (
              <Link key={calc.id} href={`/calculators/${calc.slug}`} className="group">
                <Card className="h-full hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col bg-gradient-to-b from-white to-slate-50/30" data-calculator-id={calc.id}>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {calc.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-end gap-2">
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Badge>{calc.category}</Badge>
                      {calc.subcategory && (
                        <Badge variant="outline">{calc.subcategory}</Badge>
                      )}
                      {calc.rulesSensitive && (
                        <Badge variant="outline">2026/27</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all-calculators-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 id="all-calculators-heading" className="text-xl font-bold text-slate-900">
            {isFiltering ? "Matching Calculators" : "All Calculators"}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Showing {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(calc => (
            <Link key={calc.id} href={`/calculators/${calc.slug}`} className="group">
              <Card className="h-full hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col" data-calculator-id={calc.id}>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {calc.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-end gap-2">
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Badge variant="neutral">{calc.category}</Badge>
                    {calc.subcategory && (
                      <Badge variant="outline">{calc.subcategory}</Badge>
                    )}
                    {calc.rulesSensitive && (
                      <Badge variant="outline">2026/27</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-slate-600 mb-4">
                No calculators found matching &quot;{search}&quot;{selectedCategory !== "All" && ` in ${selectedCategory}`}.
              </p>
              <button
                type="button"
                onClick={() => { setSearch(""); setSelectedCategory("All"); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Reset Search &amp; Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

