import { AnalyticsEventName, AnalyticsProvider } from "../types";
import { hasAnalyticsConsent } from "../consent";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

export class PlausibleAnalyticsProvider implements AnalyticsProvider {
  name = "plausible";

  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN)
    );
  }

  track(event: AnalyticsEventName, payload: Record<string, unknown>): void {
    if (!this.isAvailable()) return;

    // Plausible is privacy-friendly by default, but if user explicitly denied consent, respect choice
    if (typeof window !== "undefined" && !hasAnalyticsConsent()) {
      return;
    }

    try {
      if (typeof window.plausible === "function") {
        window.plausible(event, { props: payload });
      }
    } catch {
      // Telemetry errors must never disrupt core calculator experience
    }
  }
}
