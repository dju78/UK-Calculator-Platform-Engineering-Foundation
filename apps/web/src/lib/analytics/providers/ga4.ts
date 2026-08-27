import { AnalyticsEventName, AnalyticsProvider } from "../types";
import { hasAnalyticsConsent } from "../consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export class GA4AnalyticsProvider implements AnalyticsProvider {
  name = "ga4";

  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID)
    );
  }

  track(event: AnalyticsEventName, payload: Record<string, unknown>): void {
    if (!this.isAvailable()) return;

    // GA4 requires explicit user consent before sending telemetry
    if (!hasAnalyticsConsent()) {
      return;
    }

    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", event, payload);
      }
    } catch {
      // Fail closed: telemetry errors must never throw or break calculations
    }
  }
}
