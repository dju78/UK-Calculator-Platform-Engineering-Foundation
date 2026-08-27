"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/exportUtils";
import { useIsFavourite, toggleFavourite } from "@/lib/storage";
import { SITE_URL } from "@/lib/site";

export interface ResultActionsProps {
  calculatorSlug: string;
  summaryText: string;
}

export function ResultActions({ calculatorSlug, summaryText }: ResultActionsProps) {
  const [copyResultStatus, setCopyResultStatus] = useState<"idle" | "success" | "error">("idle");
  const [copyLinkStatus, setCopyLinkStatus] = useState<"idle" | "success" | "error">("idle");
  const [announcement, setAnnouncement] = useState("");
  const favourited = useIsFavourite(calculatorSlug);

  const handleCopyResult = async () => {
    const ok = await copyToClipboard(summaryText);
    if (ok) {
      setCopyResultStatus("success");
      setAnnouncement("Calculation summary copied to clipboard.");
      setTimeout(() => {
        setCopyResultStatus("idle");
      }, 3000);
    } else {
      setCopyResultStatus("error");
      setAnnouncement("Failed to copy calculation summary.");
      setTimeout(() => {
        setCopyResultStatus("idle");
      }, 3000);
    }
  };

  const handleCopyLink = async () => {
    const url = `${SITE_URL}/calculators/${calculatorSlug}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopyLinkStatus("success");
      setAnnouncement("Calculator link copied to clipboard.");
      setTimeout(() => {
        setCopyLinkStatus("idle");
      }, 3000);
    } else {
      setCopyLinkStatus("error");
      setAnnouncement("Failed to copy calculator link.");
      setTimeout(() => {
        setCopyLinkStatus("idle");
      }, 3000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleToggleFavourite = () => {
    const newState = toggleFavourite(calculatorSlug);
    setAnnouncement(newState ? "Calculator saved to favourites." : "Calculator removed from favourites.");
  };

  return (
    <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 mt-4 no-print" data-testid="result-actions">
      {/* Live announcement region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Copy Result Button */}
        <button
          type="button"
          onClick={handleCopyResult}
          aria-label="Copy calculation summary to clipboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 transition-colors"
        >
          {copyResultStatus === "success" ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold">Summary Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Result</span>
            </>
          )}
        </button>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          aria-label="Print calculation or save as PDF"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print / PDF</span>
        </button>

        {/* Copy Link / Share Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="Copy calculator web link"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 transition-colors"
        >
          {copyLinkStatus === "success" ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Share Link</span>
            </>
          )}
        </button>

        {/* Favourite Toggle Button */}
        <button
          type="button"
          onClick={handleToggleFavourite}
          aria-label={favourited ? "Remove favourite" : "Add favourite"}
          aria-pressed={favourited}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 ${
            favourited
              ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
          <span>{favourited ? "Favourited" : "Save"}</span>
        </button>
      </div>
    </div>
  );
}
