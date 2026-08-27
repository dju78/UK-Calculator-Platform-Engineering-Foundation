/**
 * Privacy-Safe Analytics Types & Event Taxonomy
 *
 * All events strictly forbid capturing user-entered financial, personal, or health data.
 * Event payloads must adhere to strict allowlists and fail closed.
 */

export type AnalyticsEventName =
  | "page_view"
  | "calculator_view"
  | "calculation_completed"
  | "calculator_favourited"
  | "calculator_unfavourited"
  | "calculator_print"
  | "calculator_copy_result"
  | "calculator_share_link"
  | "calculator_search"
  | "calculator_search_no_results"
  | "category_view"
  | "related_calculator_opened"
  | "governance_page_view"
  | "embed_loaded"
  | "for_organisations_view"
  | "commercial_disclosure_view";

export interface PageViewPayload {
  path: string;
  title?: string;
  page_type?: "home" | "category" | "calculator" | "governance" | "embed" | "b2b" | "legal" | "other";
}

export interface CalculatorViewPayload {
  calculator_slug: string;
  calculator_category: string;
}

export interface CalculationCompletedPayload {
  calculator_slug: string;
  calculator_category: string;
  has_assumptions?: boolean;
  has_warnings?: boolean;
}

export interface CalculatorActionPayload {
  calculator_slug: string;
  calculator_category?: string;
}

export interface SearchPayload {
  result_count: number;
  category_filter?: string;
  alias_matched_id?: string;
}

export interface SearchNoResultsPayload {
  query_length: number;
  category_filter?: string;
}

export interface CategoryViewPayload {
  category: string;
  calculator_count?: number;
}

export interface RelatedCalculatorOpenedPayload {
  source_slug: string;
  target_slug: string;
}

export interface GovernancePageViewPayload {
  page_slug: string;
}

export interface EmbedLoadedPayload {
  calculator_slug: string;
}

export interface EventPayloadMap {
  page_view: PageViewPayload;
  calculator_view: CalculatorViewPayload;
  calculation_completed: CalculationCompletedPayload;
  calculator_favourited: CalculatorActionPayload;
  calculator_unfavourited: CalculatorActionPayload;
  calculator_print: CalculatorActionPayload;
  calculator_copy_result: CalculatorActionPayload;
  calculator_share_link: CalculatorActionPayload;
  calculator_search: SearchPayload;
  calculator_search_no_results: SearchNoResultsPayload;
  category_view: CategoryViewPayload;
  related_calculator_opened: RelatedCalculatorOpenedPayload;
  governance_page_view: GovernancePageViewPayload;
  embed_loaded: EmbedLoadedPayload;
  for_organisations_view: Record<string, never>;
  commercial_disclosure_view: Record<string, never>;
}

export type ConsentStatus = "granted" | "denied" | "unanswered";

export interface AnalyticsProvider {
  name: string;
  isAvailable(): boolean;
  init?(): void;
  track(event: AnalyticsEventName, payload: Record<string, unknown>): void;
}
