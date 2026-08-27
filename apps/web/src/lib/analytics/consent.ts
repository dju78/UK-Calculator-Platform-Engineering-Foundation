import { ConsentStatus } from "./types";

export const ANALYTICS_CONSENT_KEY = "ukcalc_analytics_consent";

/**
 * Checks whether any analytics provider is actually configured in the environment.
 */
export function isAnalyticsConfigured(): boolean {
  if (typeof process === "undefined" || !process.env) return false;
  return Boolean(
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ||
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true"
  );
}

/**
 * Retrieves the current user consent status from localStorage.
 * Safe to call during SSR (returns 'unanswered').
 */
export function getAnalyticsConsent(): ConsentStatus {
  if (typeof window === "undefined" || !window.localStorage) {
    return "unanswered";
  }

  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (stored === "granted" || stored === "denied") {
      return stored;
    }
  } catch {
    // localStorage unavailable or restricted
  }

  return "unanswered";
}

/**
 * Stores the user's explicit consent choice.
 */
export function setAnalyticsConsent(status: "granted" | "denied"): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, status);
    // Dispatch standard custom event so UI components can re-render immediately
    window.dispatchEvent(new CustomEvent("ukcalc_consent_changed", { detail: status }));
  } catch {
    // localStorage unavailable or full
  }
}

/**
 * Checks whether analytics tracking is permitted.
 */
export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === "granted";
}

/**
 * Determines whether a consent banner should be presented.
 * Only displays if an analytics provider is configured AND the user has not made a decision.
 */
export function shouldShowConsentBanner(): boolean {
  if (!isAnalyticsConfigured()) return false;
  return getAnalyticsConsent() === "unanswered";
}
