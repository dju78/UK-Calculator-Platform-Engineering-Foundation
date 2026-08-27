import { AnalyticsEventName, AnalyticsProvider } from "../types";

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = "console";

  isAvailable(): boolean {
    return (
      typeof process !== "undefined" &&
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true"
    );
  }

  track(event: AnalyticsEventName, payload: Record<string, unknown>): void {
    if (this.isAvailable() && typeof console !== "undefined") {
      console.log(`[UKCalc Analytics: ${event}]`, payload);
    }
  }
}
