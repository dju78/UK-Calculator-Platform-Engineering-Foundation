import {
  PageViewPayload,
  CalculatorViewPayload,
  CalculationCompletedPayload,
  CalculatorActionPayload,
  SearchPayload,
  SearchNoResultsPayload,
  CategoryViewPayload,
  RelatedCalculatorOpenedPayload,
  GovernancePageViewPayload,
  EmbedLoadedPayload,
} from "./types";
import { trackEvent } from "./analytics";

/**
 * Tracks a page view with sanitized path and title.
 */
export function trackPageView(payload: PageViewPayload): void {
  trackEvent("page_view", payload);
}

/**
 * Tracks when a user views a calculator.
 */
export function trackCalculatorView(payload: CalculatorViewPayload): void {
  trackEvent("calculator_view", payload);
}

/**
 * Tracks when a calculation completes.
 * NEVER includes user inputs or numerical output values.
 */
export function trackCalculationCompleted(payload: CalculationCompletedPayload): void {
  trackEvent("calculation_completed", payload);
}

/**
 * Tracks when a calculator is saved to favourites.
 */
export function trackCalculatorFavourited(payload: CalculatorActionPayload): void {
  trackEvent("calculator_favourited", payload);
}

/**
 * Tracks when a calculator is removed from favourites.
 */
export function trackCalculatorUnfavourited(payload: CalculatorActionPayload): void {
  trackEvent("calculator_unfavourited", payload);
}

/**
 * Tracks when a calculation result summary is copied to clipboard.
 */
export function trackCopyResult(payload: CalculatorActionPayload): void {
  trackEvent("calculator_copy_result", payload);
}

/**
 * Tracks when a calculator link is copied/shared.
 */
export function trackShareLink(payload: CalculatorActionPayload): void {
  trackEvent("calculator_share_link", payload);
}

/**
 * Tracks when a calculator page is printed.
 */
export function trackPrint(payload: CalculatorActionPayload): void {
  trackEvent("calculator_print", payload);
}

/**
 * Tracks internal search queries (aggregated count / alias ID only - never raw free-text).
 */
export function trackSearch(payload: SearchPayload): void {
  trackEvent("calculator_search", payload);
}

/**
 * Tracks search queries that returned zero results.
 */
export function trackSearchNoResults(payload: SearchNoResultsPayload): void {
  trackEvent("calculator_search_no_results", payload);
}

/**
 * Tracks when a category taxonomy page is viewed.
 */
export function trackCategoryView(payload: CategoryViewPayload): void {
  trackEvent("category_view", payload);
}

/**
 * Tracks when a user navigates to a related calculator.
 */
export function trackRelatedCalculatorOpened(payload: RelatedCalculatorOpenedPayload): void {
  trackEvent("related_calculator_opened", payload);
}

/**
 * Tracks when a governance page is viewed.
 */
export function trackGovernancePageView(payload: GovernancePageViewPayload): void {
  trackEvent("governance_page_view", payload);
}

/**
 * Tracks when an embeddable calculator frame is loaded.
 */
export function trackEmbedLoaded(payload: EmbedLoadedPayload): void {
  trackEvent("embed_loaded", payload);
}

/**
 * Tracks when the For Organisations B2B page is viewed.
 */
export function trackForOrganisationsView(): void {
  trackEvent("for_organisations_view");
}

/**
 * Tracks when the Commercial Disclosure page is viewed.
 */
export function trackCommercialDisclosureView(): void {
  trackEvent("commercial_disclosure_view");
}
