# Wave 3 Statutory Rules Verification (2026/27 Tax Year)

This document establishes the primary official sources and statutory parameters used for all rules-sensitive Wave 3 calculators on the UK Calculator Platform.

---

## 1. Property Capital Gains Tax (PRO-028)

- **Jurisdiction**: United Kingdom (England, Wales, Scotland, Northern Ireland)
- **Effective Tax Year**: 2026/27 (and from 6 April 2024 / 30 October 2024)
- **Date Verified**: 2026-08-24
- **Primary Sources**:
  - [GOV.UK: Capital Gains Tax rates and allowances](https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances)
  - [GOV.UK: Tax when you sell property](https://www.gov.uk/tax-sell-property)
  - [HMRC Capital Gains Manual (CG64200 - Private Residence Relief)](https://www.gov.uk/hmrc-internal-manuals/capital-gains-manual/cg64200)
  - [Finance Act 2024 / Autumn Budget 2024](https://www.gov.uk/government/publications/capital-gains-tax-rates-increase-and-annual-exempt-amount)

### Statutory Rules & Parameters:
1. **Annual Exempt Amount (AEA)**: £3,000 for individuals (£1,500 for trusts).
2. **Residential Property Rates**:
   - Basic Rate Band: **18%**
   - Higher / Additional Rate Band: **24%**
3. **Allowable Deductions**:
   - Purchase price & incidental acquisition costs (stamp duty / SDLT / LBTT / LTT, legal fees, survey).
   - Capital improvement costs (enhancement expenditure extending beyond repair/maintenance).
   - Incidental disposal costs (estate agent fees, legal fees, marketing).
4. **Private Residence Relief (PRR)**:
   - Proportional relief: Relief = Net Gain * ((Period of Main Residence Occupation + Deemed Final Period) / Total Ownership Period).
   - Deemed final period exemption: **9 months** (or 36 months if disabled or moving into residential care).
5. **Letting Relief**:
   - Only available where the owner shares occupancy with the tenant (capped at lower of PRR amount, £40,000, or letting gain).
6. **Payment & Reporting Deadline**:
   - **60 days** from completion date for UK residential property disposals via HMRC Capital Gains Tax on UK property service.

---

## 2. High Income Child Benefit Charge (TAX-019)

- **Jurisdiction**: United Kingdom (UK-wide)
- **Effective Tax Year**: 2026/27 (effective from 6 April 2024)
- **Date Verified**: 2026-08-24
- **Primary Sources**:
  - [GOV.UK: High Income Child Benefit Charge](https://www.gov.uk/child-benefit-tax-charge)
  - [GOV.UK: Child Benefit rates](https://www.gov.uk/child-benefit/what-youll-get)
  - [HMRC Rates and Thresholds for 2026/27](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027)

### Statutory Rules & Parameters:
1. **Adjusted Net Income (ANI) Thresholds**:
   - Lower threshold: **£60,000** (Charge starts)
   - Upper threshold: **£80,000** (Charge reaches 100% of Child Benefit received)
2. **Taper Formula**:
   - For ANI between £60,000 and £80,000:
     $$	ext{Charge Percentage} = rac{	ext{ANI} - £60,000}{£200} 	imes 1%$$
   - At ANI >= £80,000, Charge Percentage = 100%.
3. **Child Benefit Rates (Weekly)**:
   - Eldest or only child: **£25.60 per week** (£1,331.20 annual)
   - Each additional child: **£16.95 per week** (£881.40 annual)
4. **Adjusted Net Income (ANI) Computation**:
   - Gross taxable income
   - Minus Gross pension contributions (grossed up Relief at Source or Net Pay / Salary Sacrifice deductions)
   - Minus Gross Gift Aid donations (Donation * 100 / 80)
   - Minus Trading losses.

---

## 3. General Investment Account (GIA) Tax (TAX-013)

- **Jurisdiction**: United Kingdom
- **Effective Tax Year**: 2026/27
- **Date Verified**: 2026-08-24
- **Primary Sources**:
  - [GOV.UK: Tax on dividends](https://www.gov.uk/tax-on-dividends)
  - [GOV.UK: Tax on savings and investments](https://www.gov.uk/apply-tax-free-interest-on-savings)
  - [GOV.UK: Capital Gains Tax rates and allowances](https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances)

### Statutory Rules & Parameters:
1. **Dividend Allowance & Rates**:
   - Dividend Allowance: **£500** tax-free per year.
   - Basic Rate: **8.75%** (or ruleset standard 10.75% / 8.75% harmonised).
   - Higher Rate: **33.75%** (or ruleset standard 35.75% / 33.75%).
   - Additional Rate: **39.35%**.
2. **Capital Gains on Equities/Investments**:
   - Annual Exempt Amount (AEA): **£3,000**.
   - Basic Rate: **18%**
   - Higher / Additional Rate: **24%**
3. **Personal Savings Allowance (PSA)**:
   - Basic Rate Taxpayer: **£1,000**
   - Higher Rate Taxpayer: **£500**
   - Additional Rate Taxpayer: **£0**
   - Interest above PSA taxed at marginal income tax rate (20% basic, 40% higher, 45% additional).

---

## 4. SIPP vs ISA (ISA-007)

- **Jurisdiction**: United Kingdom
- **Effective Tax Year**: 2026/27
- **Date Verified**: 2026-08-24
- **Primary Sources**:
  - [GOV.UK: Individual Savings Accounts (ISAs)](https://www.gov.uk/individual-savings-accounts)
  - [GOV.UK: Tax on private pension contributions](https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief)
  - [GOV.UK: Lump Sum Allowance and Lump Sum & Death Benefit Allowance](https://www.gov.uk/tax-on-pension)

### Statutory Rules & Parameters:
1. **ISA Rules**:
   - Annual contribution limit: **£20,000**.
   - Growth inside wrapper: 100% tax-free.
   - Withdrawals: 100% tax-free at any age without restriction.
2. **SIPP Rules**:
   - Annual contribution limit: **£60,000** (capped at 100% of relevant UK earnings).
   - Upfront Tax Relief:
     - Basic Rate: 20% added at source (£80 net investment becomes £100 gross pension pot).
     - Higher Rate: additional 20% claimed via Self Assessment (effective net cost £60 for £100 gross).
     - Additional Rate: additional 25% claimed via Self Assessment (effective net cost £55 for £100 gross).
   - Growth inside wrapper: 100% tax-free.
   - Withdrawals in Retirement:
     - Tax-Free Lump Sum: **25%** (subject to Lump Sum Allowance of £268,275).
     - Remaining **75%**: Taxable as standard income at retiree marginal income tax rate.
   - Access age: Normal minimum pension age (NMPA) 57 from April 2028.
