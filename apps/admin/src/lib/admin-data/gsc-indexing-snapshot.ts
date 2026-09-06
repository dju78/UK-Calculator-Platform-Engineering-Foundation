/**
 * Google Search Console — Page Indexing & Coverage Snapshot Data Layer
 *
 * Provides structured models, verified snapshot storage, and practical indexing analysis
 * for Google Search Console indexation state on https://ukcalc.jomovate.com.
 *
 * Data Provenance:
 * - Observed Search Console Dataset Date: 28 August 2026
 * - Validation Initiated: 6 September 2026
 * - Sourced from official Google Search Console property reports (not repository estimates).
 */

export interface GscExclusionReason {
  reason: string;
  count: number;
  description: string;
  status: "INVESTIGATING" | "VALIDATION_IN_PROGRESS" | "UNCONFIRMED" | "RESOLVED";
  statusLabel: string;
  lastCrawled: string;
}

export interface GscValidationState {
  startedDate: string; // "2026-09-06"
  status: "IN_PROGRESS" | "PASSED" | "FAILED" | "NOT_STARTED";
  statusLabel: string;
  failuresCount: number;
  notes: string;
}

export interface GscIndexingAnalysis {
  summary: string;
  discoveredNotIndexedExplanation: string;
  recommendedActions: string[];
  cautions: string[];
}

export interface GscIndexingSnapshot {
  propertyUrl: string;
  datasetDate: string;
  capturedDate: string;
  source: "Search Console snapshot";
  isImportedSnapshot: true;
  indexedCount: number;
  notIndexedCount: number;
  totalSubmittedInSitemap: number;
  exclusionReasons: GscExclusionReason[];
  validation: GscValidationState;
  analysis: GscIndexingAnalysis;
}

/**
 * Verified production snapshot seeded from Google Search Console report.
 *
 * Verified Data Points:
 * - 27 indexed pages
 * - 266 not indexed
 * - 260 classified as "Discovered – currently not indexed" (Last crawled: N/A)
 * - Validation started: 6 September 2026 (0 validation failures shown)
 * - Second exclusion reason covers ~6 URLs (unconfirmed / awaiting confirmation)
 * - Displayed dataset last updated on: 28 August 2026
 */
export const VERIFIED_GSC_INDEXING_SNAPSHOT: GscIndexingSnapshot = {
  propertyUrl: "https://ukcalc.jomovate.com/",
  datasetDate: "2026-08-28",
  capturedDate: "2026-09-06",
  source: "Search Console snapshot",
  isImportedSnapshot: true,
  indexedCount: 27,
  notIndexedCount: 266,
  totalSubmittedInSitemap: 284,
  exclusionReasons: [
    {
      reason: "Discovered – currently not indexed",
      count: 260,
      description:
        "Google is aware of these URLs (via sitemap or internal linking) and has queued them for crawling, but has not yet fetched or rendered them.",
      status: "VALIDATION_IN_PROGRESS",
      statusLabel: "Validation in progress",
      lastCrawled: "N/A",
    },
    {
      reason: "Unconfirmed exclusion category",
      count: 6,
      description:
        "Secondary exclusion category covering approximately 6 URLs awaiting confirmation in the next Search Console dataset refresh.",
      status: "UNCONFIRMED",
      statusLabel: "Under investigation (Unconfirmed)",
      lastCrawled: "N/A",
    },
  ],
  validation: {
    startedDate: "2026-09-06",
    status: "IN_PROGRESS",
    statusLabel: "Validation in progress (Started 6 Sep 2026)",
    failuresCount: 0,
    notes: "Validation initiated in Search Console with 0 recorded failures.",
  },
  analysis: {
    summary:
      "Google Search Console currently reports 27 indexed URLs and 266 not indexed URLs. 260 of the excluded URLs are in the 'Discovered – currently not indexed' queue. Validation was initiated on 6 September 2026 with 0 failures.",
    discoveredNotIndexedExplanation:
      "The 'Discovered – currently not indexed' status indicates that Google has discovered the pages (via the submitted sitemap.xml or internal links) but has not yet crawled them due to crawl queue scheduling. This is standard behavior for newly launched or rapidly expanded platforms as Google establishes initial domain authority and allocates crawl budget over time.",
    recommendedActions: [
      "Allow Google's validation cycle (started 6 Sep 2026) to progress without manual intervention.",
      "Monitor Search Console weekly indexing reports as Google processes the crawl queue.",
      "Maintain strict technical SEO hygiene: valid self-referential canonical tags, complete sitemap coverage (284 URLs), open robots.txt, and fast response times.",
      "Ensure internal cross-linking pathways (e.g. Related Calculators and Category Hubs) route crawl equity to deep calculators.",
      "Inspect high-priority priority pages (e.g. Take-Home Pay, Mortgage Calculator, Stamp Duty Calculator) using Search Console URL Inspection.",
    ],
    cautions: [
      "Do NOT manually submit all 260 URLs via the URL Inspection tool. Mass manual requests exceed daily quotas, risk throttling, and do not bypass Google's algorithmic quality assessment.",
      "Google does not use IndexNow for indexation. IndexNow delivers real-time notifications to Bing, Yandex, Naver, and Seznam, whereas Google crawls independently.",
      "Do NOT treat 'Discovered – currently not indexed' as an error or penalty; it represents normal crawl queuing for newly published URL sets.",
    ],
  },
};

/**
 * Returns the current Google Search Console indexing snapshot.
 */
export function getGscIndexingSnapshot(): GscIndexingSnapshot {
  return VERIFIED_GSC_INDEXING_SNAPSHOT;
}

/**
 * Formats snapshot summary figures safely with zero NaN or undefined values.
 */
export function formatGscIndexingMetrics(snapshot: GscIndexingSnapshot = VERIFIED_GSC_INDEXING_SNAPSHOT) {
  const indexed = typeof snapshot.indexedCount === "number" && !isNaN(snapshot.indexedCount) ? Math.max(0, snapshot.indexedCount) : 0;
  const notIndexed = typeof snapshot.notIndexedCount === "number" && !isNaN(snapshot.notIndexedCount) ? Math.max(0, snapshot.notIndexedCount) : 0;
  const totalTracked = indexed + notIndexed;
  const indexationRate = totalTracked > 0 ? `${((indexed / totalTracked) * 100).toFixed(1)}%` : "0.0%";

  return {
    indexed,
    notIndexed,
    totalTracked,
    indexationRate,
    datasetDate: snapshot.datasetDate,
    capturedDate: snapshot.capturedDate,
    sourceLabel: "Search Console snapshot",
    validationStatus: snapshot.validation.statusLabel,
    validationFailures: snapshot.validation.failuresCount,
  };
}
