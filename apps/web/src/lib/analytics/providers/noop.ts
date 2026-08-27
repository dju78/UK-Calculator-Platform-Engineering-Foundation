import { AnalyticsProvider } from "../types";

export class NoopAnalyticsProvider implements AnalyticsProvider {
  name = "noop";

  isAvailable(): boolean {
    return true;
  }

  track(): void {
    // No-op
  }
}
