# Professionalisation Phase 1 — Trust, UX & Public Credibility Audit

## 1. Audit Overview & Scope

- **Total Calculators Audited:** 253/253 (Wave 1: 55, Wave 2: 188, Wave 3: 10)
- **Scope:** Public trust integrity, input field label quality, boolean option phrasing, disclaimer accuracy, legal/regulatory transparency, social metadata, internal engineering language leakage, and WCAG accessibility statements.
- **Audit Date:** August 2026

---

## 2. Defect Classification & Summary Counts

| Defect Class | Severity | Pre-Audit Count | Post-Repair Count | Status |
| :--- | :--- | :---: | :---: | :---: |
| **P0: Legal / Regulatory / Trust Inaccuracies** | Critical | 15 | 0 | **RESOLVED** |
| **P1: UX / Accessibility / Metadata Defects** | High | 58 | 0 | **RESOLVED** |
| **P2: Content & Polish Enhancements** | Normal | 40 | 0 (Planned) | **SCHEDULED (Phase 2)** |

### P0 Defect Summary:
1. **Disclaimer Mismatches on Health/Fertility Tools:** Pregnancy & fertility calculators (`HLT-019`, `HLT-020`, `HLT-021`, `HLT-022`) received a body-composition disclaimer stating "does not account for pregnancy". *(Fixed: Replaced with reproductive/clinical disclaimer citing midwives and healthcare professionals).*
2. **Disclaimer Mismatches on Property Tax Tools:** SDLT, LBTT, LTT, and Property CGT calculators (`PRO-023`, `PRO-024`, `PRO-025`, `PRO-026`, `PRO-027`, `PRO-028`) received mortgage lending disclaimers. *(Fixed: Replaced with property taxation disclaimer citing licensed conveyancers and qualified tax advisers).*
3. **Hard-coded Outdated Calculator Counts:** Public metadata and homepage copy advertised "55 calculators". *(Fixed: Dynamically derived from `liveCalculators.length` = 253).*
4. **Conflicting WCAG Standards:** Accessibility Statement claimed WCAG 2.2 AA in metadata but WCAG 2.1 level AA in body copy. *(Fixed: Unified to WCAG 2.2 AA standard with factual description of Axe Core and manual keyboard/screen-reader reviews).*

### P1 Defect Summary:
1. **Literal `True / False` Select Options:** Form controls presented developers' raw boolean literals `True` and `False` to consumer users across Wave 1 calculators. *(Fixed: Converted 100% to natural `Yes` / `No` labels with matching accessible values).*
2. **Raw Schema Key Field Labels:** Technical identifiers like `annual_rate (%)`, `rate (%)`, `periodic_rate (%)`, `apr (%)`, `discount (%)`, `First Time`, `Nonresident`, `Type`, `gross_return (%)`, `P`, `pv`, `fv` presented as labels. *(Fixed: Replaced with descriptive plain-English labels and contextual units like "Annual interest rate (%)", "Loan amount requested (£)", "Are you a first-time buyer?").*
3. **Internal Engineering Leakage:** Public cards and headers displayed internal calculator IDs (`TAX-001`, `PRO-023`) and internal development lifecycle badges (`Live`, `Draft`, `Specified`). *(Fixed: Removed visible engineering badges and raw ID spans from consumer views; retained IDs in `data-calculator-id` attributes).*
4. **Missing OpenGraph & Twitter Social Cards on Legal Routes:** Legal pages (`/accessibility`, `/disclaimer`, `/privacy`, `/terms`) lacked dedicated `openGraph` and `twitter:card` properties. *(Fixed: Full metadata configurations added).*

---

## 3. Detailed Category & Calculator Audit Findings

### 3.1 UK Tax & Salary (32 Calculators)
- **Calculators Audited:** `TAX-001` to `TAX-032`
- **Disclaimers:** Unified to statutory 2026/27 UK tax & payroll disclaimer referencing HMRC and qualified tax advisers. Specialized disclaimers for VAT (`TAX-015`) and Student Loans (`TAX-020`).
- **Transparency:** Visible 2026/27 tax year indicator and regulatory context banner displaying active versioned ruleset ID.
- **Labels & Units:** Form inputs humanized with frequency selectors, working pattern hours/weeks, and standard HMRC tax code labels (`1257L - standard`, Scottish bands, Welsh codes).

### 3.2 Mortgages & Property (34 Calculators)
- **Calculators Audited:** `PRO-001` to `PRO-034`
- **Disclaimers:** Bifurcated into:
  - *Lending & Affordability Family:* Mortgage borrowing, stress testing, and amortisation referencing FCA-regulated mortgage advisers.
  - *Property Tax Family:* SDLT, LBTT, LTT, and CGT referencing licensed conveyancers and tax advisers.
- **Labels & Units:** Converted `first_time`, `additional_property`, `nonresident` to clean `Yes / No` radio/select questions.

### 3.3 Investing & Wealth (29 Calculators)
- **Calculators Audited:** `INV-001` to `INV-029`
- **Disclaimers:** Clear capital risk warning ("values can fall as well as rise") naming FCA-regulated financial advisers. Dedicated stochastic warning on Monte Carlo simulator (`INV-029`) and SWR engines (`INV-026`).
- **Labels & Units:** Replaced abbreviations (`P`, `pv`, `fv`, `r`, `n`) with clear financial labels ("Principal amount (£)", "Target future value (£)", "Investment horizon (years)").

### 3.4 ISA & Tax Wrappers (10 Calculators)
- **Calculators Audited:** `ISA-001` to `ISA-010`
- **Disclaimers:** Tax wrapper modelling disclaimer highlighting annual subscription limits (£20,000 ISA allowance, Lifetime ISA 25% bonus rules).
- **Labels & Units:** Structured breakdown between Cash, Stocks & Shares, Innovative Finance, and Lifetime ISAs.

### 3.5 Pensions & Retirement (16 Calculators)
- **Calculators Audited:** `PEN-001` to `PEN-016`
- **Disclaimers:** Pension projection disclaimer naming FCA-regulated advisers and Pension Wise.
- **Labels & Units:** Plain-English contribution rates (member %, employer %), salary sacrifice options, and 25% tax-free lump sum selectors.

### 3.6 Health & Fitness (25 Calculators)
- **Calculators Audited:** `HLT-001` to `HLT-025`
- **Disclaimers:** Separated into:
  - *Pregnancy & Fertility:* Midwife / obstetrician advice requirement.
  - *BMI & Body Composition:* Population formula limitations and dietitian consultation.
  - *General Fitness & Calorie:* General training notice.

### 3.7 Remaining Platform Categories (107 Calculators)
- **Categories:** Automotive & Travel, Business & Commercial, Conversions, Date & Time, Education, Everyday & Lifestyle, Geometry, Maths & Algebra, Science & Engineering, Statistics & Data, Technology & Digital.
- **Audit Result:** 100% compliant with professional mathematical disclaimers, clear input labels, and accessible responsive form layouts.

---

## 4. Verification & Prevention Suite

To ensure zero regression of trust defects, a dedicated test suite (`tests/trust-ux.test.ts`) has been introduced into the automated CI pipeline asserting:
1. Strict prohibition of literal `True / False` option labels.
2. Protection of pregnancy calculators from body-composition exclusion text.
3. Protection of property tax calculators from mortgage lender wording.
4. Dynamic synchronisation of public calculator counts.
5. Complete absence of internal Wave terminology across consumer pages.
6. Clean suppression of raw internal IDs from visible consumer headings.
7. Unification of WCAG 2.2 AA claims.
8. Complete OpenGraph and Twitter card metadata across all legal and category pages.
