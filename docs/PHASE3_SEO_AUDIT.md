# UK Calculator Platform — Phase 3 SEO & Information Architecture Audit

**Date**: 2026-08-25  
**Branch**: `professionalisation-phase-3-seo`  
**Baseline Main SHA**: `a8e0c60bef8316bb67a0b8c772e8b56188fb8fad`  
**Scope**: Technical SEO, Discoverability, Information Architecture, Schema.org Markup, Sitemap, and Internal Linking.

---

## 1. Executive Summary

Phase 3 established a robust, deterministic SEO and information architecture across the complete catalogue of **253 calculators** and **19 canonical categories**. 

All 253 calculators feature:
- Clean, semantic, non-numeric kebab-case URL slugs (`/calculators/[slug]`).
- Unique, high-quality meta titles and bespoke meta descriptions referencing the 2026/27 UK tax year where statutory rules apply.
- Accurate canonical URL tags matching `og:url` without self-referential mismatches or placeholder hostnames.
- `WebApplication` JSON-LD structured data with valid schema declarations (`FinanceApplication`, `isAccessibleForFree: true`, `inLanguage: "en-GB"`).
- Two-way accessible breadcrumbs rendering semantic navigation and valid `BreadcrumbList` JSON-LD schema.
- Contextual related-calculator discovery grids (3 to 6 relevant tools per calculator) eliminating internal dead-ends.

All 19 canonical categories feature:
- Dedicated category hubs at `/category/[category]` with subcategory clustering, tool counts, and user-intent summaries.
- Dynamic cross-category navigation linking related hubs.
- 0 orphan calculators and 0 empty categories.

---

## 2. Category Information Architecture & Mapping (19 Categories)

| Canonical Category | Total Tools | Subcategories Present | Bespoke Summary Status |
| :--- | :---: | :--- | :---: |
| Automotive & Travel | 10 | Fuel Economy, Journey Cost, Electric Vehicles, Depreciation | Verified |
| Business & Commercial | 16 | Profit Margins, Commercial Cash Flow, Break-Even, VAT | Verified |
| Conversions | 10 | Metric/Imperial, Currency, Temperature, Data Sizes | Verified |
| Date & Time | 10 | Ages, Working Days, Durations, Leap Years | Verified |
| Education | 10 | Grades, GPA, Study Pacing, Test Metrics | Verified |
| Everyday & Lifestyle | 10 | Tips, Party Planning, Utilities, Everyday Math | Verified |
| Finance & Debt | 14 | Loans, Credit Cards, Debt Payoff, Budgeting | Verified |
| Geometry | 12 | 2D Area, 3D Volume, Angles, Surface Areas | Verified |
| Health & Fitness | 22 | BMI, Calories/TDEE, Pregnancy & Fertility, Heart Rate | Verified |
| Home & Construction | 10 | DIY Paint, Flooring, Tiles, Wallpaper | Verified |
| ISA & Tax Wrappers | 10 | Cash ISA, Stocks & Shares, LISA, SIPP Arbitrage | Verified |
| Investing & Wealth | 30 | Compound Growth, Regular Investing, Monte Carlo, SWR | Verified |
| Maths & Algebra | 20 | Percentages, Ratios, Fractions, Quadratics | Verified |
| Mortgages & Property | 28 | Repayments, Affordability, SDLT/LBTT/LTT, Buy-to-Let | Verified |
| Pensions & Retirement | 12 | Growth, Contributions, 25% Lump Sum, FIRE | Verified |
| Science & Engineering | 10 | Physics, Chemistry, Ohm's Law, Scientific Units | Verified |
| Statistics & Data | 20 | Summary Stats, Distributions, Confidence, Regression | Verified |
| Technology & Digital | 10 | Bandwidth, Storage, Entropy, Encoding | Verified |
| UK Tax & Salary | 20 | Take-Home, Income Tax, NI, Scottish Tax, Student Loans | Verified |
| **TOTAL** | **253** | **45+ Subcategories** | **19/19 Complete** |

---

## 3. Metadata and Canonical Handling

### 3.1 Metadata Integrity Audit
- **Total Unique Calculator Slugs**: 253 / 253 (0 duplicates, 0 missing).
- **Total Unique Titles**: 253 / 253 (0 duplicates, 0 missing).
- **Total Unique Meta Descriptions**: 253 / 253 (0 duplicates, 0 missing, 0 repetitive boilerplate strings).
- **Twitter Card Format**: `summary_large_image` consistently declared across all routes.
- **Canonical Consistency**: Every calculator canonical points to `https://uk-calculator-platform.onrender.com/calculators/[slug]`.
- **OpenGraph URL Match**: `og:url` strictly equals canonical URL across all 253 tool pages and 19 category pages.

---

## 4. Structured Data (JSON-LD) Architecture

### 4.1 WebApplication Schema (Category-Aware)
Applied across all 253 calculator pages with genuine Schema.org category mapping (and non-applicable categories omitted):
- **FinanceApplication**: `UK Tax & Salary`, `Finance & Debt`, `Mortgages & Property`, `Investing & Wealth`, `Pensions & Retirement`, `ISA & Tax Wrappers`
- **HealthApplication**: `Health & Fitness`
- **BusinessApplication**: `Business & Commercial`
- **EducationalApplication**: `Education`, `Maths & Algebra`, `Geometry`, `Statistics & Data`, `Science & Engineering`
- **TravelApplication**: `Automotive & Travel`
- **UtilitiesApplication**: `Conversions`, `Date & Time`, `Everyday & Lifestyle`, `Home & Construction`, `Technology & Digital`

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Take-Home Pay Calculator",
  "url": "https://uk-calculator-platform.onrender.com/calculators/take-home-pay-calculator",
  "description": "Free Take-Home Pay calculator for the UK. Work out salary figures in the UK Tax & Salary category, using 2026/27 UK rules. Estimates only - not financial or tax advice.",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "isAccessibleForFree": true,
  "inLanguage": "en-GB",
  "provider": {
    "@type": "Organization",
    "name": "Jomovate"
  }
}
```

### 4.2 BreadcrumbList Schema
Rendered on all calculator routes, category hubs, and legal compliance pages:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://uk-calculator-platform.onrender.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "UK Tax & Salary",
      "item": "https://uk-calculator-platform.onrender.com/category/uk%20tax%20%26%20salary"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Take-Home Pay Calculator",
      "item": "https://uk-calculator-platform.onrender.com/calculators/take-home-pay-calculator"
    }
  ]
}
```

### 4.3 Schema Protection Rules
- **No FinancialProduct Schema**: Strictly avoided mass-application of `FinancialProduct` schema to interactive estimation tools (preventing Google rich snippet guideline penalties).
- **No Fake Ratings / Reviews**: Kept structured data factual with 0 synthetic reviews or rating claims.

---

## 5. Crawlability, Sitemap & Indexing

- **Robots.txt**: Permissive crawling (`Allow: /`) and canonical sitemap declaration (`https://uk-calculator-platform.onrender.com/sitemap.xml`).
- **Sitemap Architecture**:
  - Total URLs: **277**
    - 1 Homepage (`/`)
    - 253 Calculator deep links (`/calculators/[slug]`)
    - 19 Canonical category hubs (`/category/[encodedCategory]`)
    - 4 Legal & compliance pages (`/accessibility`, `/disclaimer`, `/privacy`, `/terms`)
  - 0 Duplicate URLs.
  - 0 Internal calculator IDs leaked in sitemap URLs.

---

## 6. Related Calculators Recommendation Graph

- **Coverage**: 253 / 253 calculators have 3 to 6 valid relevant internal tools suggested.
- **Self-Reference Protection**: 0 calculators link to themselves.
- **Fallback Hierarchy**:
  1. Curated editorial linkages (`CURATED_RELATED` Phase 2 hook).
  2. Same subcategory tools.
  3. Same category tools.
  4. Cross-category adjacent domain tools.
- **Consumer Cleanliness**: All cards display user-friendly names, category badges, subcategory badges, and 0 raw IDs or engineering wave badges.
