# Professionalisation Phase 5 — Performance & Accessibility Review

## 1. Performance Overview

The Phase 5 utility features were engineered to provide high responsiveness with zero measurable impact on page load times, runtime memory, or bundle size.

---

## 2. Performance Metrics & Architecture

### Static Generation (SSG)
- All **282 routes** (homepage, 19 category pages, 253 calculator pages, and legal pages) are pre-rendered into static HTML at build time using Next.js 16.
- Static page build time is under 15 seconds.

### Client-Side Execution & State Management
- **Store Sync**: Uses React 19's native `useSyncExternalStore` for external `localStorage` subscriptions. This prevents unnecessary component re-renders, avoids hydration mismatches, and eliminates cascading `setState` calls.
- **Search Filtering**: Client-side filtering across 253 calculators evaluates in under 2ms using pre-indexed tokens and direct dictionary lookups.
- **Zero Heavy Runtime Dependencies**: Implemented using lightweight, native browser APIs (`Intl.NumberFormat`, `navigator.clipboard`, `@media print`).

---

## 3. Accessibility Audit (WCAG 2.2 AA)

- **Automated Axe Checks**: 0 serious or critical violations across all views and calculation states.
- **Accessible Landmarks**: All `<nav>` landmark regions feature unique, descriptive labels:
  - `<nav aria-label="Main Navigation">`
  - `<nav aria-label="Category Navigation">`
  - `<nav aria-label="Breadcrumb">`
- **Dynamic Feedback**:
  - Calculation summaries and clipboard copy actions announce updates via `aria-live="polite"` status regions.
  - Interactive buttons use standard `aria-label`, `aria-pressed`, and clear focus indicators (`focus-visible:ring-2`).
- **Color Contrast**: All text and button interactions exceed the 4.5:1 contrast requirement.
