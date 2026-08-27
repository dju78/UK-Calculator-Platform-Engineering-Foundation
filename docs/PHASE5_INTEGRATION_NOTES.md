# Professionalisation Phase 5 — Integration Notes & Maintenance Guide

## 1. Overview & File Map

Phase 5 introduces client utilities and layout hardening. The table below outlines all new and modified components for ongoing maintainability:

| File Path | Description / Responsibility |
| :--- | :--- |
| `apps/web/src/lib/storage.ts` | Browser `localStorage` module for Favourites & Recents with React `useSyncExternalStore` hooks. |
| `apps/web/src/lib/exportUtils.ts` | Formats calculation results into clean human-readable summaries and handles clipboard copying. |
| `apps/web/src/lib/searchAliases.ts` | Deterministic aliases dictionary mapping colloquial UK terms (PAYE, SDLT, HICBC, etc.) to IDs. |
| `apps/web/src/components/calculators/ResultActions.tsx` | Post-calculation actions UI (Copy Result, Print/PDF, Share Link, Favourite toggle). |
| `apps/web/src/components/calculators/CalculatorPageUtility.tsx` | Client utility for recent tracking, quick bookmarking, and dedicated print header. |
| `apps/web/src/components/calculators/DynamicCalculator.tsx` | Integrates `ResultActions`, decimal numeric keypad mode, and memoized calculation outputs. |
| `apps/web/src/components/home/CalculatorBrowser.tsx` | Enhanced search with aliases, Favourites/Recents view tabs, and empty state guidance. |
| `apps/web/src/app/globals.css` | Print styling rules (`@media print`) and layout constraints. |
| `tests/utility-phase5.test.ts` | Unit tests for storage invariants, recovery, text exporter, and search alias mapping. |
| `apps/web/e2e/utility-phase5.spec.ts` | Playwright E2E tests for result actions, clipboard, tabs, mobile viewports, and Axe a11y. |

---

## 2. Phase 4 Parallel Development Coordination

- **Phase 4 Worktree**: `C:\Users\Inspiron\OneDrive\Documents\workplace\UK Calculator Platform - Phase 4 Governance` on branch `professionalisation-phase-4-governance`.
- **Phase 4 Scope**: Governance pages (`/about`, `/contact`, `/editorial-policy`, `/how-we-check-our-figures`, `/updates`), provenance metadata, and rules maintenance docs.
- **Merge Strategy**:
  - Phase 5 commits are strictly isolated to utility, navigation, mobile UX, and layout styling.
  - No merge conflicts with Phase 4 governance pages or documentation files.

---

## 3. Maintenance Guide for Adding Search Aliases

To add new search synonyms for future calculators:
1. Open `apps/web/src/lib/searchAliases.ts`.
2. Add the term to `SEARCH_ALIASES`:
   ```ts
   "new_alias": ["CALC-ID-001", "CALC-ID-002"],
   ```
3. Run `npm test` to verify dictionary integrity.
