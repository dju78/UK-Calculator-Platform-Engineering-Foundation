import { AnalyticsEventName, AnalyticsProvider, EventPayloadMap } from "./types";
import { sanitizePayload, isEventAllowed } from "./sanitizer";
import { NoopAnalyticsProvider } from "./providers/noop";
import { ConsoleAnalyticsProvider } from "./providers/console";
import { PlausibleAnalyticsProvider } from "./providers/plausible";
import { GA4AnalyticsProvider } from "./providers/ga4";

const providers: AnalyticsProvider[] = [
  new NoopAnalyticsProvider(),
  new ConsoleAnalyticsProvider(),
  new PlausibleAnalyticsProvider(),
  new GA4AnalyticsProvider(),
];

/**
 * Dispatches an analytics event to all registered and active providers.
 *
 * Guarantees:
 * 1. Safe in SSR and Node environments.
 * 2. Safe if localStorage, window, or document are missing.
 * 3. Fail-closed: Payload is rigorously sanitized against forbidden patterns.
 * 4. Exception-isolated: Any provider failure is caught and suppressed.
 */
export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  payload?: EventPayloadMap[E] | Record<string, unknown>
): void {
  try {
    if (!isEventAllowed(event)) {
      return;
    }

    const sanitized = sanitizePayload(event, payload);

    for (const provider of providers) {
      if (provider.isAvailable()) {
        try {
          provider.track(event, sanitized);
        } catch {
          // Suppress provider error to guarantee calculator reliability
        }
      }
    }
  } catch {
    // Global safety catch
  }
}
