"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  isAnalyticsConfigured,
} from "@/lib/analytics/consent";
import { ConsentStatus } from "@/lib/analytics/types";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("ukcalc_consent_changed", callback);
  return () => window.removeEventListener("ukcalc_consent_changed", callback);
}

function getSnapshot(): ConsentStatus {
  return getAnalyticsConsent();
}

function getServerSnapshot(): ConsentStatus {
  return "unanswered";
}

export function ConsentManager() {
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [feedback, setFeedback] = useState("");
  const configured = isAnalyticsConfigured();

  const handleUpdate = (newStatus: "granted" | "denied") => {
    setAnalyticsConsent(newStatus);
    setFeedback(
      newStatus === "granted"
        ? "Analytics enabled. Thank you for helping us understand which calculators are most useful."
        : "Analytics disabled. No telemetry or performance tracking will occur."
    );
    setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <div className="not-prose my-6 p-6 rounded-lg border border-slate-200 bg-slate-50" data-testid="consent-manager">
      <h3 className="text-base font-semibold text-slate-900 mb-2">
        Manage Your Analytics Preferences
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        You have complete control over analytics tracking on this platform.
        Even when enabled, our telemetry never captures your calculator inputs, results, personal finances, or health figures.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-md border border-slate-200 bg-white">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            Current Status
          </span>
          <span className="text-sm font-medium text-slate-900">
            {!configured
              ? "Disabled (No third-party analytics configured)"
              : status === "granted"
              ? "Enabled (Anonymous usage tracking active)"
              : status === "denied"
              ? "Disabled (Tracking explicitly blocked by user)"
              : "Default / No choice recorded"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleUpdate("denied")}
            disabled={status === "denied"}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Disable Analytics
          </button>
          <button
            type="button"
            onClick={() => handleUpdate("granted")}
            disabled={status === "granted"}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Enable Analytics
          </button>
        </div>
      </div>

      {feedback && (
        <p className="mt-3 text-xs font-medium text-emerald-700" role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
