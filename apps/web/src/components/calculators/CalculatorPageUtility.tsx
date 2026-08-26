"use client";

import { useEffect, useState } from "react";
import { addRecent, useIsFavourite, toggleFavourite } from "@/lib/storage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function CalculatorPageUtility({
  slug,
  name,
  rulesSensitive
}: {
  slug: string;
  name: string;
  rulesSensitive?: boolean;
}) {
  const favourited = useIsFavourite(slug);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    // Record recent visit (slug only, no user data)
    addRecent(slug);
  }, [slug]);

  const handleToggleFavourite = () => {
    const newState = toggleFavourite(slug);
    setAnnouncement(newState ? `${name} saved.` : `${name} removed.`);
  };

  return (
    <>
      {/* Screen reader live announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Dedicated Print-Only Header */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              {SITE_NAME}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{name}</h1>
            {rulesSensitive && (
              <p className="text-xs text-slate-700 font-medium mt-1">
                UK Statutory Basis: 2026/27 Tax Year
              </p>
            )}
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="text-slate-500 text-[10px] mt-0.5 break-all">
              {SITE_URL}/calculators/{slug}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Quick Favourite Toggle for Screen View */}
      <div className="no-print self-start mt-1">
        <button
          type="button"
          onClick={handleToggleFavourite}
          aria-label={favourited ? "Remove favourite" : "Add favourite"}
          aria-pressed={favourited}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 ${
            favourited
              ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${favourited ? "text-amber-500 fill-amber-400" : "text-slate-400 fill-none"}`}
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
          <span>{favourited ? "Saved in Favourites" : "Save Calculator"}</span>
        </button>
      </div>
    </>
  );
}
