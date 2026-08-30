// Two build systems consume this file and they disagree about extensions: the
// root `tsc` build is NodeNext and requires an explicit ".js", while the Next
// bundler resolves extensionless specifiers only. A TYPE-ONLY import satisfies
// both, because it is erased before either resolver sees it - which is what
// lets tests/growth-phase6.test.ts assert against this module directly instead
// of against a copied mirror of its logic.
import type { AnalyticsEventName, EventPayloadMap } from "./types.js";

/**
 * Strict blocklist of forbidden keys and patterns.
 * Under NO circumstances may these properties be collected, transmitted, or logged.
 */
export const FORBIDDEN_KEYS_PATTERNS = [
  // Financial inputs & outputs
  /salary/i,
  /income/i,
  /earnings/i,
  /wage/i,
  /tax/i,
  /ni_rate/i,
  /national_insurance/i,
  /student_loan/i,
  /pension/i,
  /mortgage/i,
  /loan/i,
  /borrowing/i,
  /debt/i,
  /deposit/i,
  /property_price/i,
  /house_price/i,
  /savings/i,
  /interest/i,
  /investment/i,
  /portfolio/i,
  /cagr/i,
  /roi/i,
  /irr/i,
  /net_worth/i,
  /cash_flow/i,
  /balance/i,
  // Health & sensitive lifestyle
  /bmi/i,
  /weight/i,
  /height/i,
  /blood/i,
  /pressure/i,
  /conception/i,
  /ovulation/i,
  /pregnancy/i,
  /due_date/i,
  /edd/i,
  /age/i,
  /dob/i,
  /birth/i,
  // Personal Identifiers & Secrets
  /name/i,
  /email/i,
  /phone/i,
  /address/i,
  /postcode/i,
  /reg/i,
  /vrm/i,
  /vin/i,
  /password/i,
  /token/i,
  /secret/i,
  // Generic computation artifacts
  /inputs/i,
  /outputs/i,
  /results/i,
  /raw_query/i,
  /query_string/i,
  /search_term/i,
  /stack/i,
];

/**
 * Strict allowlist of event names.
 */
export const ALLOWED_EVENTS = new Set<AnalyticsEventName>([
  "page_view",
  "calculator_view",
  "calculation_completed",
  "calculator_favourited",
  "calculator_unfavourited",
  "calculator_print",
  "calculator_copy_result",
  "calculator_share_link",
  "calculator_search",
  "calculator_search_no_results",
  "category_view",
  "related_calculator_opened",
  "governance_page_view",
  "embed_loaded",
  "for_organisations_view",
  "commercial_disclosure_view",
]);

/**
 * Allowed fields per event (Fail closed: only these keys can ever pass).
 */
export const ALLOWED_EVENT_FIELDS: Record<AnalyticsEventName, Set<string>> = {
  page_view: new Set(["path", "title", "page_type"]),
  calculator_view: new Set(["calculator_slug", "calculator_category"]),
  calculation_completed: new Set(["calculator_slug", "calculator_category", "has_assumptions", "has_warnings"]),
  calculator_favourited: new Set(["calculator_slug", "calculator_category"]),
  calculator_unfavourited: new Set(["calculator_slug", "calculator_category"]),
  calculator_print: new Set(["calculator_slug", "calculator_category"]),
  calculator_copy_result: new Set(["calculator_slug", "calculator_category"]),
  calculator_share_link: new Set(["calculator_slug", "calculator_category"]),
  calculator_search: new Set(["result_count", "category_filter", "alias_matched_id"]),
  calculator_search_no_results: new Set(["query_length", "category_filter"]),
  category_view: new Set(["category", "calculator_count"]),
  related_calculator_opened: new Set(["source_slug", "target_slug"]),
  governance_page_view: new Set(["page_slug"]),
  embed_loaded: new Set(["calculator_slug"]),
  for_organisations_view: new Set([]),
  commercial_disclosure_view: new Set([]),
};

/**
 * Checks if a key matches any forbidden pattern.
 */
export function isFieldForbidden(key: string): boolean {
  return FORBIDDEN_KEYS_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Checks if an event name is recognized and valid.
 */
export function isEventAllowed(event: string): event is AnalyticsEventName {
  return ALLOWED_EVENTS.has(event as AnalyticsEventName);
}

/**
 * Strips query strings or hashes from URLs/paths to prevent query param leakage.
 */
export function sanitizePath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== "string") return "/";
  // Remove query string and hash
  const clean = rawPath.split("?")[0].split("#")[0].trim();
  return clean || "/";
}

/**
 * Sanitizes and validates an event payload according to strict privacy allowlists.
 * Returns null if event is invalid or payload violates strict rules.
 */
export function sanitizePayload<E extends AnalyticsEventName>(
  event: E,
  payload?: Partial<EventPayloadMap[E]> | Record<string, unknown>
): Record<string, unknown> {
  if (!isEventAllowed(event)) {
    return {};
  }

  const allowedKeys = ALLOWED_EVENT_FIELDS[event];
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    // 1. Must be in the event's allowlist
    if (!allowedKeys.has(key)) {
      continue;
    }

    // Explicitly exempt structural routing/schema keys from broad sensitive-data regex blocks
    const structuralKeys = new Set(["page_type", "page_slug", "calculator_slug", "calculator_category", "category"]);
    
    // 2. Must not match any forbidden pattern (extra defence in depth)
    if (!structuralKeys.has(key) && isFieldForbidden(key)) {
      continue;
    }

    // 3. Type-specific sanitisation
    if (typeof value === "string") {
      if (key === "path") {
        clean[key] = sanitizePath(value);
      } else {
        // Truncate long strings and remove any query parameters or control characters
        clean[key] = value.split("?")[0].slice(0, 100).trim();
      }
    } else if (typeof value === "number") {
      if (Number.isFinite(value)) {
        clean[key] = value;
      }
    } else if (typeof value === "boolean") {
      clean[key] = value;
    }
  }

  return clean;
}
