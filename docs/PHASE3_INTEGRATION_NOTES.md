# Phase 3 -> Phase 2 Parallel Integration Notes

**Author**: Phase 3 SEO & Information Architecture Lead  
**Recipient**: Phase 2 Content Team (Claude)  
**Status**: Ready for Content Injection  
**Target Branch for Merge**: `main` (post Phase 2 & Phase 3 verification)

---

## 1. Overview & Clean Interface Contracts

Phase 3 established the complete SEO, discovery, breadcrumbs, sitemap, and category routing foundation without modifying calculation formulas or overwriting Phase 2 calculator guides.

To ensure seamless merging between `professionalisation-phase-3-seo` and `professionalisation-phase-2-content`, this document details the consumption points and content extension hooks designed specifically for Phase 2.

---

## 2. Curated Related Calculators Extension Hook

**File Location**: `apps/web/src/lib/relatedCalculators.ts`

Phase 2 content specialists can curate bespoke editorially linked tools per calculator by populating the `CURATED_RELATED` map:

```typescript
export const CURATED_RELATED: Record<string, string[]> = {
  // Authoritative Contract: Source keys and target array items support either
  // canonical Calculator IDs (e.g. "TAX-001") or canonical Slugs (e.g. "take-home-pay-calculator").
  "TAX-001": ["TAX-002", "TAX-003", "TAX-004", "TAX-005", "ISA-007"],
  "take-home-pay-calculator": [
    "uk-salary-calculator",
    "national-insurance-calculator",
    "pension-calculator",
  ],
};
```

### Identifier Contract & Runtime Validation:
1. **Dual Resolution**: Both canonical Calculator IDs (e.g. `"TAX-001"`) and canonical Slugs (e.g. `"take-home-pay-calculator"`) are supported and resolved automatically to live calculators in the registry.
2. **Integrity Validation**: The helper `validateCuratedRelationships()` dynamically tests that every source key and every target entry resolves to an active live calculator (preventing broken internal references).
3. **Fallback Resolution**: If a calculator has fewer than the requested limit of curated tools (or none configured), the recommendation engine automatically supplements with matching subcategory, category, and adjacent domain tools.

---

## 3. Guide & Editorial Content Layout Hook

**File Location**: `apps/web/src/app/calculators/[slug]/page.tsx`

The calculator page layout is structured to cleanly host Phase 2 rich guide content beneath the calculator tool:

- **Breadcrumbs Component**: Accessible `<Breadcrumbs>` top bar (already wired with Schema.org `BreadcrumbList`).
- **Calculator Header**: H1, Category badge, Subcategory badge, 2026/27 Tax Year indicator.
- **Interactive Calculator Card**: Primary user computation interface.
- **Guide Content Section (Phase 2 Slot)**: Location for "How It Works", "Formula & Methodology", "Worked Examples", and "Key UK Rules / Thresholds".
- **Disclaimer Banner**: Dynamic legal & regulatory disclaimer.
- **Related Calculators Grid**: `<RelatedCalculators currentSlug={calc.slug} />` rendering 3-4 discovery cards.

---

## 4. Category Descriptions & Educational Content Hook

**File Location**: `apps/web/src/lib/site.ts` -> `CATEGORY_DETAILS`

All 19 canonical categories are mapped with titles, summaries, and related categories. Phase 2 can expand on category guides or FAQ items by extending `CATEGORY_DETAILS`.

---

## 5. Structured Data & FAQ Page Schema Readiness

Should Phase 2 add FAQ accordions to calculator pages, `FAQPage` structured data can be passed alongside the existing `WebApplication` schema block without conflict.
