# Growth Measurement & KPI Framework

This document outlines the growth measurement architecture, key performance indicators (KPIs), event taxonomy, and privacy boundaries for the UK Calculator Platform.

---

## 1. Principles of Privacy-First Measurement

1. **Calculations are Private:** The platform operates on a strict zero-knowledge architecture. No salary, tax, debt, investment, pension, health, pregnancy, or numerical result is ever collected, transmitted, or logged.
2. **Aggregated & Anonymous:** Analytics measurement is focused on tool utility, discoverability, navigation flow, and aggregate engagement rather than personal identity tracking.
3. **Fail Closed:** The telemetry layer uses strict schema allowlists and blocklists (`sanitizer.ts`). Unknown or unapproved properties are dropped immediately.
4. **Resilient to Failure:** Telemetry errors or ad-blocker suppression never disrupt calculator execution or user experience.

---

## 2. Core Growth KPIs

### A. Acquisition
* **Organic Search Traffic:** Monthly visits originating from search engines (Google, Bing).
* **Direct Visits:** High-intent returning traffic typing canonical URLs directly.
* **Referral & B2B Visits:** Inbound traffic from embedded widgets, partner websites, and educational links.
* **Category Entry Distribution:** Proportion of first-touch landings across our 19 calculator categories.

### B. Engagement & Utility
* **Calculator Views:** Volume of visits to individual calculator tool pages.
* **Calculation Completion Rate:** Ratio of `calculation_completed` events to `calculator_view` events.
* **Calculators per Session:** Depth of tool exploration across a single visit.
* **Action Engagement:** Volume and distribution of post-calculation utility actions:
  - Copy Result Summary (`calculator_copy_result`)
  - Share Link (`calculator_share_link`)
  - Print Page (`calculator_print`)
  - Favourites Saved (`calculator_favourited`)
* **Related Tool Discovery:** Internal navigation through related calculator recommendations (`related_calculator_opened`).

### C. Search & Discovery
* **Internal Search Volume:** Total searches initiated via the homepage browser.
* **Zero-Result Rate:** Searches yielding no matching calculators (`calculator_search_no_results`), used to identify user intent gaps and catalogue expansion opportunities.
* **Alias Discovery Match Rate:** Proportion of search queries resolving via colloquial alias mapping (e.g. "SDLT", "PAYE", "HICBC").

### D. Content & Category Depth
* **Category Landing Page Traffic:** Aggregate visits to `/category/[category]`.
* **Calculator Guide Engagement:** Reading and interaction depth on statutory guidance sections.
* **Catalogue Tiering:** Identification of top quartile calculators vs long-tail tools.

### E. Commercial & B2B Readiness
* **Organisation Inbound Inquiries:** Visits and contact submissions from `/for-organisations`.
* **Embed Widget Activations:** Total `embed_loaded` events on allowlisted embed tools.
* **Commercial Disclosure Views:** Visits to `/commercial-disclosure`.

---

## 3. Event Taxonomy & Payload Reference

| Event Name | Purpose | Permitted Properties | Forbidden Properties |
|---|---|---|---|
| `page_view` | Page navigation tracking | `path`, `title`, `page_type` | Query strings with personal data |
| `calculator_view` | Calculator tool page load | `calculator_slug`, `calculator_category` | Any user state |
| `calculation_completed` | User completed a calculation | `calculator_slug`, `calculator_category`, `has_assumptions`, `has_warnings` | **ALL inputs, ALL outputs, ALL user figures** |
| `calculator_favourited` | Calculator pinned to favourites | `calculator_slug`, `calculator_category` | User identity |
| `calculator_unfavourited`| Calculator removed from favourites | `calculator_slug`, `calculator_category` | User identity |
| `calculator_copy_result` | Result copied to clipboard | `calculator_slug`, `calculator_category` | Clipboard content / result numbers |
| `calculator_share_link` | Share URL copied | `calculator_slug`, `calculator_category` | Share target |
| `calculator_print` | Print dialog triggered | `calculator_slug`, `calculator_category` | Print output |
| `calculator_search` | Internal search executed | `result_count`, `category_filter`, `alias_matched_id` | **Raw free-text query string** |
| `calculator_search_no_results` | Search yielded 0 results | `query_length`, `category_filter` | **Raw free-text query string** |
| `category_view` | Category taxonomy viewed | `category`, `calculator_count` | None |
| `related_calculator_opened`| Related tool clicked | `source_slug`, `target_slug` | None |
| `governance_page_view`| Governance / editorial page viewed | `page_slug` | None |
| `embed_loaded` | Iframe embed instantiated | `calculator_slug` | Host site user data |

---

## 4. Growth Dashboard Specification

When a production analytics backend (e.g. Plausible / GA4) is activated, the recommended executive dashboard should structure widgets into four distinct tabs:

1. **Executive Summary:**
   - 30-Day Unique Visitors & Pageviews
   - Total Calculations Completed
   - Top 10 Most Used Calculators
   - Completion Rate by Category

2. **Calculator Portfolio Performance:**
   - Table of all 253 Calculators (Views, Completions, Completion %, Copy Actions)
   - Category Performance Distribution
   - High-Traffic vs Low-Traffic Quadrants

3. **User Discovery & Search Intent:**
   - Zero-Result Search Volume & Character Length
   - Filter Tab Usage (All vs Favourites vs Recents)
   - Related Calculator Click-Through Rates

4. **B2B & Partner Syndication:**
   - Embed Impressions by Calculator Slug
   - `/for-organisations` Funnel Progression
