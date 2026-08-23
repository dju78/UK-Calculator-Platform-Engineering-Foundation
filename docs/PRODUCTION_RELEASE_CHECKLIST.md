# PRODUCTION RELEASE CHECKLIST

## Phase 1: Code and Configuration (Complete)
- [x] Security headers added to `next.config.ts`.
- [x] Dynamic `sitemap.ts` configured for root, categories, and calculator routes.
- [x] `robots.txt` added and points to the sitemap.
- [x] SEO Metadata and OpenGraph tags dynamically populated.
- [x] Global Layout includes standard `Footer`.
- [x] Financial disclaimer banner added to Calculator views.
- [x] `not-found.tsx` implemented.
- [x] `error.tsx` implemented.

## Phase 2: Testing and Validation (Complete)
- [x] Linter passing with zero errors.
- [x] Unit tests passing.
- [x] E2E Tests (Playwright) passing.
- [x] Build successfully compiles without fatal errors.

## Phase 3: Legal & Compliance (Pending Legal Review)
- [x] Drafted robust text for `/privacy` (Privacy Policy).
- [x] Drafted robust text for `/terms` (Terms of Use).
- [x] Drafted robust text for `/disclaimer` (Disclaimer).
- [x] Drafted robust text for `/accessibility` (Accessibility Statement).
- [ ] Have a legal representative review all compliance wording and replace placeholders.

## Phase 4: Final Sign-off
- [ ] Codebase deployed to Staging.
- [ ] QA / UAT testing complete.
- [ ] Legal approval confirmed.
- [ ] Go-live switch.
