"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { liveCalculators, liveCategories } from "@/lib/calculators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, getCategoryFilterClass } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { getCalculatorIdsForQuery } from "@/lib/searchAliases";
import { useFavourites, useRecents, toggleFavourite } from "@/lib/storage";
import { trackSearch, trackSearchNoResults } from "@/lib/analytics";

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

const POPULAR_SUGGESTIONS = [
  "Income Tax",
  "Mortgage",
  "Stamp Duty",
  "Pension",
  "Compound Interest",
  "BMI",
  "Salary"
];

export function CalculatorBrowser() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "favourites" | "recents">("all");
  
  const favouriteSlugs = useFavourites();
  const recentSlugs = useRecents();

  const featuredCalculators = useMemo(() => {
    return FEATURED_IDS
      .map((id) => liveCalculators.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const aliasMatchedIds = query ? getCalculatorIdsForQuery(query) : new Set<string>();
    const queryTokens = query ? query.split(/\s+/).filter(Boolean) : [];

    return liveCalculators.filter((calc) => {
      // 1. Tab filters (favourites / recents)
      if (activeFilterTab === "favourites") {
        if (!favouriteSlugs.includes(calc.slug.toLowerCase())) return false;
      } else if (activeFilterTab === "recents") {
        if (!recentSlugs.includes(calc.slug.toLowerCase())) return false;
      }

      // 2. Category filter
      const matchesCat =
        selectedCategory === "All" ||
        calc.category.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCat) return false;

      // 3. Search query matching
      if (!query) return true;

      const calcName = calc.name.toLowerCase();
      const calcSlug = calc.slug.toLowerCase();
      const calcSubcat = calc.subcategory ? calc.subcategory.toLowerCase() : "";
      const calcCatName = calc.category.toLowerCase();

      // Check alias dictionary match
      if (aliasMatchedIds.has(calc.id)) return true;

      // Check exact / substring matches
      if (calcName.includes(query) || calcSlug.includes(query)) return true;
      if (calcSubcat && calcSubcat.includes(query)) return true;
      if (calcCatName.includes(query)) return true;

      // Check all query tokens
      if (queryTokens.length > 0 && queryTokens.every(tok => calcName.includes(tok) || calcSubcat.includes(tok) || calcCatName.includes(tok))) {
        return true;
      }

      return false;
    });
  }, [search, selectedCategory, activeFilterTab, favouriteSlugs, recentSlugs]);

  const isFiltering = search.trim().length > 0 || selectedCategory !== "All" || activeFilterTab !== "all";

  // Privacy-Safe Search Analytics
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      const aliasMatched = getCalculatorIdsForQuery(trimmed.toLowerCase());
      const aliasId = aliasMatched.size === 1 ? Array.from(aliasMatched)[0] : undefined;

      if (filtered.length === 0) {
        trackSearchNoResults({
          query_length: trimmed.length,
          category_filter: selectedCategory !== "All" ? selectedCategory : undefined,
        });
      } else {
        trackSearch({
          result_count: filtered.length,
          category_filter: selectedCategory !== "All" ? selectedCategory : undefined,
          alias_matched_id: aliasId,
        });
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [search, filtered.length, selectedCategory]);

  const handleCardFavouriteToggle = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavourite(slug);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setActiveFilterTab("all");
  };

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-2xs">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-950">Calculators</h1>
          <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
            Browse and search {liveCalculators.length} free UK calculators across {liveCategories.length} categories for tax, property, finance, investments and everyday calculations.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Search input bar */}
          <div className="max-w-lg">
            <Input
              placeholder="Search calculators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search calculators"
            />
          </div>

          {/* View Mode Filters: All / Favourites / Recents */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setActiveFilterTab("all")}
              aria-pressed={activeFilterTab === "all"}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeFilterTab === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950"
              }`}
            >
              All Calculators
            </button>

            {favouriteSlugs.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilterTab("favourites")}
                aria-pressed={activeFilterTab === "favourites"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilterTab === "favourites"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/80"
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span>Favourites ({favouriteSlugs.length})</span>
              </button>
            )}

            {recentSlugs.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilterTab("recents")}
                aria-pressed={activeFilterTab === "recents"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilterTab === "recents"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100/80"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                </svg>
                <span>Recently Used ({recentSlugs.length})</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mr-1">Category:</span>
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === "All"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950"
              }`}
            >
              All {!search && activeFilterTab === "all" && `(${liveCalculators.length})`}
            </button>
            {liveCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${getCategoryFilterClass(cat, selectedCategory === cat)}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Calculators (Only shown when not searching/filtering) */}
      {!isFiltering && featuredCalculators.length > 0 && (
        <section aria-labelledby="featured-heading" className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h2 id="featured-heading" className="text-xl font-bold text-slate-950 tracking-tight">
              Featured Calculators
            </h2>
            <span className="text-xs text-slate-600">
              Popular UK calculators for tax, mortgages &amp; finance
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {featuredCalculators.map((calc) => {
              const favourited = favouriteSlugs.includes(calc.slug.toLowerCase());
              return (
                <div key={calc.id} className="group block rounded-xl focus-within:ring-2 focus-within:ring-slate-900">
<Card className="relative h-full border-slate-200/90 group-hover:border-slate-300 group-hover:shadow-sm transition-all duration-150 flex flex-col bg-white" data-calculator-id={calc.id}>

                    <CardHeader className="px-6 py-4.5 pb-2 flex flex-row items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">
<Link href={`/calculators/${calc.slug}`} className="before:absolute before:inset-0 before:z-0 focus:outline-none" aria-label={calc.name}>{calc.name}</Link>
</CardTitle>
                      <button
                        type="button"
                        onClick={(e) => handleCardFavouriteToggle(e, calc.slug)}
                        aria-label={favourited ? "Remove favourite" : "Add favourite"}
                        className="p-1 text-slate-400 hover:text-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded cursor-pointer z-10 relative pointer-events-auto"
                      >
                        <svg
                          className={`w-4 h-4 ${favourited ? "text-amber-500 fill-amber-400" : "fill-none"}`}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                    </CardHeader>
                    <CardContent className="px-6 py-5 pt-0 flex-1 flex flex-col justify-end gap-3">
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
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Filtered Calculators Section */}
      <section aria-labelledby="all-calculators-heading" className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <h2 id="all-calculators-heading" className="text-xl font-bold text-slate-950 tracking-tight">
            {activeFilterTab === "favourites"
              ? "Favourite Calculators"
              : activeFilterTab === "recents"
              ? "Recently Used Calculators"
              : isFiltering
              ? "Matching Calculators"
              : "All Calculators"}
          </h2>
          <span className="text-xs font-semibold text-slate-600" aria-live="polite">
            Showing {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {filtered.map(calc => {
            const favourited = favouriteSlugs.includes(calc.slug.toLowerCase());
            return (
              <div key={calc.id} className="group block rounded-xl focus-within:ring-2 focus-within:ring-slate-900">
<Card className="relative h-full border-slate-200/90 group-hover:border-slate-300 group-hover:shadow-sm transition-all duration-150 flex flex-col bg-white" data-calculator-id={calc.id}>

                  <CardHeader className="px-6 py-4.5 pb-2 flex flex-row items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">
<Link href={`/calculators/${calc.slug}`} className="before:absolute before:inset-0 before:z-0 focus:outline-none" aria-label={calc.name}>{calc.name}</Link>
</CardTitle>
                    <button
                      type="button"
                      onClick={(e) => handleCardFavouriteToggle(e, calc.slug)}
                      aria-label={favourited ? "Remove favourite" : "Add favourite"}
                      className="p-1 text-slate-400 hover:text-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded cursor-pointer z-10 relative pointer-events-auto"
                    >
                      <svg
                        className={`w-4 h-4 ${favourited ? "text-amber-500 fill-amber-400" : "fill-none"}`}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </CardHeader>
                  <CardContent className="px-6 py-5 pt-0 flex-1 flex flex-col justify-end gap-3">
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
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 px-6 text-center bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col items-center gap-5">
              <div>
                <p className="text-slate-800 font-semibold text-base mb-1.5">
                  No calculators found matching &quot;{search}&quot;{selectedCategory !== "All" && ` in ${selectedCategory}`}.
                </p>
                <p className="text-sm text-slate-600">
                  Try checking your spelling or search using keywords like &quot;PAYE&quot;, &quot;SDLT&quot;, or &quot;Pension&quot;.
                </p>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                <span className="text-xs font-semibold text-slate-700 mr-1">Popular:</span>
                {POPULAR_SUGGESTIONS.map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => { setSearch(sug); setSelectedCategory("All"); setActiveFilterTab("all"); }}
                    className="px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700 hover:bg-slate-200/80 hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors shadow-2xs cursor-pointer"
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
