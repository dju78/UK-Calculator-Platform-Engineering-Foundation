"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { shouldShowConsentBanner, setAnalyticsConsent } from "@/lib/analytics/consent";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("ukcalc_consent_changed", callback);
  return () => window.removeEventListener("ukcalc_consent_changed", callback);
}

function getSnapshot(): boolean {
  return shouldShowConsentBanner();
}

function getServerSnapshot(): boolean {
  return false;
}

export function ConsentBanner() {
  const shouldShow = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (!shouldShow || dismissed) {
    return null;
  }

  const handleAccept = () => {
    setAnalyticsConsent("granted");
    setDismissed(true);
  };

  const handleReject = () => {
    setAnalyticsConsent("denied");
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Analytics preferences"
      className="fixed bottom-0 inset-x-0 z-50 bg-slate-900 text-white p-4 border-t border-slate-700 shadow-lg no-print"
      data-testid="consent-banner"
    >
      <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-sm text-slate-200">
          <p className="font-semibold text-white">Privacy & Analytics Preferences</p>
          <p className="mt-1">
            We use privacy-friendly analytics to count page views and improve our calculators.
            Calculations run locally in your browser — your financial numbers, inputs, and results are{" "}
            <strong className="text-white">never</strong> tracked or stored.
            Learn more in our{" "}
            <Link href="/privacy" className="text-blue-300 underline hover:text-blue-200">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium rounded-md border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
          >
            Reject analytics
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium rounded-md border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </aside>
  );
}
