# Wave 2 Rules Verification Report

Ruleset `uk-2026-27-v1`, status **approved**, tax year 2026/27, checked 2026-08-22.

**45 sources. 30 source-register entries.**

No statutory value in this ruleset was invented. Where a figure could not be
verified from a primary source it was omitted rather than guessed; where a
figure is derived rather than published, the derivation is recorded beside it.

## Source register

The register carries two schemas. Earlier entries use topic/verified_on/
source/finding; later ones use key/verified_value/source/note. Both are kept
as written: rewriting provenance records to fit a newer shape would mean
editing an audit trail. A test asserts every entry, in either shape, names a
source that is a URL or a stated basis, and records what was found.

### 1. Class 1 employee NI weekly and monthly thresholds

**Source:** https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027

**Verified:** Primary Threshold 242 weekly / 1,048 monthly / 12,570 annual; Upper Earnings Limit 967 weekly / 4,189 monthly / 50,270 annual; employee rates 8% and 2%. Recorded under national_insurance_employee_class1_category_a.period_thresholds_gbp for disclosure; not applied as the calculation basis in this ruleset version.

### 2. PAYE tax code semantics and 2026/27 default code

**Source:** https://assets.publishing.service.gov.uk/media/6996e9b3b33a4db7ff889e08/P9X_2026_Tax_codes_to_use_from_6_April_2026.pdf

**Verified:** The emergency and standard code for 2026/27 is 1257L. S prefix denotes a Scottish taxpayer and C a Welsh taxpayer. BR/D0/D1 charge basic/higher/additional rates on all income from the employment; 0T applies no Personal Allowance; NT deducts no Income Tax; K codes represent a negative allowance; W1/M1/X denote non-cumulative operation.

### 3. LBTT residential rates, first-time buyer relief and ADS

**Source:** https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property

**Verified:** Bands 0% to 145,000; 2% to 250,000; 5% to 325,000; 10% to 750,000; 12% above. First-time buyer relief raises the nil-rate band to 175,000. Matches this ruleset.

### 4. LBTT Additional Dwelling Supplement

**Source:** https://revenue.scot/taxes/land-buildings-transaction-tax/additional-dwelling-supplement-ads

**Verified:** ADS is 8% for transactions on or after 5 December 2024, payable where consideration is 40,000 or more. Rate matched; the 40,000 minimum consideration was missing and has been added.

### 5. LTT main and higher residential rates

**Source:** https://www.gov.wales/welsh-government-draft-budget-changes-land-transaction-tax-and-landfill-disposals-tax

**Verified:** Higher residential rates from 11 December 2024 are 5%/8.5%/10%/12.5%/15%/17% at 180,000/250,000/400,000/750,000/1,500,000. This CONFIRMS the ruleset. A general rates page still showed the pre-December-2024 figures (4%/7.5%/9%/11.5%/14%/16%); the ruleset was NOT changed to match that stale page. Wales has no first-time buyer relief.

### 6. Junior ISA subscription limit

**Source:** https://www.gov.uk/junior-individual-savings-accounts

**Verified:** 9,000 for the 2026 to 2027 tax year.

### 7. Marriage Allowance

**Source:** https://www.gov.uk/marriage-allowance

**Verified:** 1,260 of Personal Allowance transferable, worth up to 252 of tax. The transferor must have income below the Personal Allowance and the recipient must be a basic-rate taxpayer.

### 8. Inheritance Tax rates and bands

**Source:** https://www.gov.uk/inheritance-tax

**Verified:** Nil-rate band 325,000; standard rate 40%; reduced rate 36% where at least 10% of the net estate passes to charity. The combined threshold of 500,000 when a home passes to direct descendants implies a residence nil-rate band of 175,000 (500,000 - 325,000).

### 9. Residence nil-rate band taper

**Source:** https://www.gov.uk/guidance/inheritance-tax-residence-nil-rate-band

**Verified:** Taper begins at an estate value of 2,000,000 and withdraws 1 for every 2 above it. The band is transferable between spouses, which this calculator does NOT model.

### 10. Self-employed National Insurance

**Source:** https://www.gov.uk/self-employed-national-insurance-rates

**Verified:** 2026/27: Class 2 3.65 a week; small profits threshold 7,105; Class 4 6% between 12,570 and 50,270 and 2% above; at or above the small profits threshold Class 2 is treated as paid.

### 11. Corporation Tax rates and marginal relief

**Source:** https://www.gov.uk/corporation-tax-rates

**Verified:** 19% small profits rate up to 50,000; 25% main rate above 250,000; marginal relief between. GOV.UK does not publish the standard fraction on the rates page, so it is DERIVED from the two published boundary conditions as 3/200 - see corporation_tax.marginal_relief_fraction_derivation.

### 12. isa.lifetime_isa_*

**Source:** https://www.gov.uk/lifetime-isa and https://www.gov.uk/lifetime-isa/withdrawing-money-from-your-lifetime-isa

**Verified:** 25% government bonus, maximum 1,000 per year on the 4,000 subscription limit; 25% withdrawal charge on non-qualifying withdrawals; first-home property price cap 450,000; open between 18 and 39, contribute until 50, penalty-free from 60.

**Note:** The withdrawal charge is 25% of the amount withdrawn, not 25% of the bonus. Because the bonus was 25% of the contribution, a charge of 25% of the larger post-bonus balance recovers the bonus AND takes about 6.25% of the saver own money. The calculator must show this, not present the charge as merely clawing back the bonus.

### 13. savings.personal_savings_allowance_gbp / starting_rate_for_savings_band_gbp

**Source:** https://www.gov.uk/apply-tax-free-interest-on-savings

**Verified:** Personal Savings Allowance 1,000 basic rate, 500 higher rate, 0 additional rate. Starting rate for savings band 5,000 at 0%, reduced by 1 for every 1 of other income above the Personal Allowance and unavailable once other income reaches 17,570.

**Note:** Needed to compare a Cash ISA against a taxable savings account honestly. Without it a Cash ISA comparison overstates the ISA advantage for every basic-rate saver with under 1,000 of interest, for whom the advantage is nil.

### 14. dividends.* and capital_gains.* (re-verified for Wave 2 tranche 2E)

**Source:** https://www.gov.uk/tax-on-dividends and https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances

**Verified:** Dividend allowance 500; dividend rates 10.75% basic, 35.75% higher, 39.35% additional for 6 April 2026 to 5 April 2027. CGT annual exempt amount 3,000; rates 18% and 24% for individuals from 6 April 2026, with no separate residential property rates.

**Note:** Re-checked against the primary sources before TAX-011 and TAX-012 were built rather than trusted from the Wave 1 approval. Both matched the existing ruleset values, so no change was made.

### 15. self_assessment.payment_on_account_threshold_gbp

**Source:** https://www.gov.uk/understand-self-assessment-bill/payments-on-account

**Verified:** No payments on account where the tax owed last year was under 1,000, or where more than 80% of it was collected at source. Each payment on account is half the previous year liability, due 31 January and 31 July.

**Note:** Used by TAX-016 and TAX-017 so a newly self-employed user sees the real January demand, which is the balancing payment plus the first payment on account and therefore about 150% of the tax they expected for the year.

### 16. state_pension.*

**Source:** https://www.gov.uk/new-state-pension/what-youll-get and https://www.gov.uk/new-state-pension/eligibility

**Verified:** Full new State Pension 241.30 a week. 35 qualifying years for the full amount, 10 qualifying years to get any new State Pension at all.

**Note:** The 10-year minimum is a cliff, not a taper: below it the entitlement is nil, not a small amount. A calculator that scales entitlement linearly from zero years would tell someone with 8 years that they will receive a pension they will not receive.

### 17. pension.tax_free_lump_sum_proportion / normal_minimum_pension_age

**Source:** https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance and https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm062100

**Verified:** Usually up to 25% of a pension can be taken tax free, capped by the lump sum allowance of 268,275. The normal minimum pension age is 55, rising to 57 on 6 April 2028.

**Note:** The 25% is capped in cash terms, so a pot above 1,073,100 cannot take 25% of it tax free. The age rise matters to anyone currently planning to retire between 2028 and 2030 and is surfaced rather than assumed away.

### 18. health.bmi.*

**Source:** https://www.nhs.uk/conditions/obesity/diagnosis/ and https://www.nhs.uk/common-health-questions/lifestyle/what-is-the-body-mass-index-bmi/

**Verified:** Overweight from BMI 25, obese from 30. For people from South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean backgrounds: overweight from 23, obese from 27.5.

**Note:** PROVENANCE IS SPLIT AND THIS MATTERS. The 25 and 30 thresholds, and the adjusted 23 and 27.5, are stated by the NHS on the pages cited. The underweight threshold of 18.5 is NOT stated on any NHS page reachable here; it is the World Health Organization figure, which the NHS uses in practice. It is recorded as such rather than attributed to the NHS. The ethnicity-adjusted thresholds are the point most BMI calculators get wrong, and omitting them understates risk for a large part of the UK population.

### 19. health.daily_calorie_guide / recommended_daily_deficit_kcal / minimum_daily_calories

**Source:** https://www.nhs.uk/better-health/lose-weight/calorie-counting/

**Verified:** NHS daily guide 2,000 kcal for women and 2,500 for men. A reduction of around 600 kcal a day is described as a safe and sustainable way to lose weight.

**Note:** The NHS does not publish a minimum daily calorie floor on that page, so none is invented. The floors of 1,400 and 1,900 are DERIVED from the two figures it does publish - the maintenance guide less the 600 kcal reduction - and the deficit itself is capped at 600 so a user cannot ask the calculator for a starvation target. The NHS page also says to speak to a GP first if you have a history of an eating disorder, and the calculators repeat that.

### 20. bank_holidays.*

**Source:** https://www.gov.uk/bank-holidays.json

**Verified:** Taken verbatim from the official GOV.UK feed for 2026 and 2027, for all three divisions. Includes the Scotland-only World Cup bank holiday on 15 June 2026, and reflects that Scotland has no Easter Monday.

**Note:** Verified twice against the feed, the second time specifically to confirm the two facts a naive list gets wrong: the Scotland-only World Cup holiday, and the absence of Easter Monday in Scotland. Working-day calculations are only correct if the division is chosen, so the calculators require it rather than defaulting silently. Coverage is limited to the years in the feed, and any date outside them is refused rather than answered from an assumption.

### 21. motoring.approved_mileage_allowance_payments.*

**Source:** https://www.gov.uk/government/publications/rates-and-allowances-travel-mileage-and-fuel-allowances/travel-mileage-and-fuel-rates-and-allowances

**Verified:** 55p for the first 10,000 business miles in the tax year and 25p thereafter for cars and vans; 24p for motorcycles; 20p for bicycles; 5p per passenger per business mile.

**Note:** Checked against two separate GOV.UK pages because this figure CHANGED for 2026/27. Both the rates-and-allowances table and the employer guidance state 55p from 6 April 2026, with 45p shown as the pre-April-2026 figure. Almost every third-party mileage calculator still carries 45p, so a benchmark asserting 45p would have been a wrong benchmark rather than a wrong engine. The 10,000 mile threshold is per employee per tax year.

### 22. motoring.national_insurance_mileage.*

**Source:** https://www.gov.uk/expenses-and-benefits-business-travel-mileage/rules-for-national-insurance

**Verified:** A single 55p rate for all business miles for National Insurance, with no 10,000 mile step and no Mileage Allowance Relief.

**Note:** The tax and National Insurance treatments genuinely differ and are routinely conflated. For NI the qualifying amount uses one rate for every business mile, so an employee driving 15,000 miles has a different tax-free figure for tax than for NI. The page states explicitly that there is no Mileage Allowance Relief for National Insurance and that a shortfall cannot be carried forward to a later earnings period.

### 23. motoring.units.*

**Source:** Defined constants: imperial gallon and mile are exact by definition; the mechanical horsepower follows from 550 ft lbf/s with the international foot and pound.

**Verified:** Imperial gallon 4.54609 litres; US gallon 3.785411784 litres; mile 1.609344 kilometres; mechanical horsepower 745.6998715822702 W; metric horsepower (PS) 735.49875 W.

**Note:** Recorded in the ruleset rather than scattered through the code because the single most common defect in a UK fuel calculator is quoting mpg on the US gallon, which overstates economy by about twenty per cent. Holding one definition makes that impossible to do accidentally in one calculator and not another.

### 24. engineering.voltage_drop_limits_bs7671.*

**Source:** BS 7671 section 525 and Appendix 4 section 6.4, as reported in NAPIT technical guidance

**Verified:** 3 per cent of nominal voltage for lighting circuits and 5 per cent for all other circuits, for low voltage installations supplied from a public distribution network.

**Note:** BS 7671 itself is a copyrighted standard and cannot be quoted from a free primary source, so the figures were checked across several independent UK electrical trade sources which agree on both the percentages and the regulation reference. At 230 V that is 6.9 V for lighting and 11.5 V for other circuits. The limits are reported as a CHECK rather than as a compliance certificate, and the calculator states that a real design must consult the standard. The caveat about private supplies is recorded because a calculator that always applies the public-supply limit would wrongly fail a legitimate design.

### 25. engineering.standard_atomic_weights.*

**Source:** IUPAC Commission on Isotopic Abundances and Atomic Weights, conventional atomic-weight values

**Verified:** IUPAC conventional atomic weights for the elements listed.

**Note:** Conventional values are used rather than interval values because a molecular weight calculator must return a single number. Elements outside the list are REFUSED BY NAME rather than defaulted to zero, which would silently understate a molar mass.

### 26. engineering.energy_conversions.*

**Source:** Definitional values of the International Table units.

**Verified:** One International Table BTU is 1055.05585262 joules exactly; one therm is 100,000 of them; one IT calorie is 4.1868 joules; one kilowatt hour is 3,600,000 joules.

**Note:** The IT BTU is the definition used for gas billing and appliance ratings in the UK. The thermochemical BTU differs in the fourth significant figure, which is immaterial for a room heating estimate but not for a units conversion, so the definition is stated rather than left implicit.

### 27. building.private_stairs_approved_document_k.*

**Source:** Approved Document K to the Building Regulations for England, as reported by two independent UK stair-design references that agree on every figure

**Verified:** Maximum rise 220 mm, minimum going 220 mm, maximum pitch 42 degrees, and twice the rise plus the going between 550 mm and 700 mm, for a private stair serving a single dwelling. Headroom 2000 mm, maximum 36 consecutive risers, handrail 900 to 1100 mm above the pitch line.

**Note:** The four core figures were cross-checked across two unrelated sources which agree exactly. The calculator reports these as a CHECK and never as a compliance certificate: the Approved Documents are guidance on one way of meeting the Regulations rather than the Regulations themselves, they apply to England, and Scotland, Wales and Northern Ireland publish their own. A real design is signed off by building control, not by a calculator. The private-stair qualification is recorded because common, institutional and assembly stairs have tighter limits and applying the private figures to them would wrongly pass a non-compliant design.

### 28. education.ucas_tariff.*

**Source:** UCAS Tariff tables, cross-checked across two independent published tables that agree on every value

**Verified:** A level A*=56, A=48, B=40, C=32, D=24, E=16. AS level A=20, B=16, C=12, D=10, E=6. EPQ A*=28, A=24, B=20, C=16, D=12, E=8.

**Note:** The UCAS site serves these figures from an interactive tool rather than as page text, so two separate published tables were compared instead and agree exactly on all seventeen values. The rule that points cannot be claimed for both an AS and the full A level in the same subject is recorded because it is the commonest way a self-calculated total comes out too high.

### 29. education.student_finance_england.*

**Source:** https://www.gov.uk/student-finance/new-fulltime-students

**Verified:** Tuition fee loan up to 9,790 pounds; maintenance loan up to 9,118 living at home, 10,830 living away outside London and 14,135 living away in London, for 2026/27.

**Note:** These are ENGLAND figures and the maxima only. Student finance is devolved and Scotland, Wales and Northern Ireland differ substantially in both fees and support. The maintenance figures are means tested against household income, so most students receive less; the calculator says so rather than presenting the maximum as an entitlement.

### 30. education.degree_classification_boundaries.*

**Source:** The conventional UK honours degree classification bands.

**Verified:** First 70 and above, upper second 60 to 69, lower second 50 to 59, third 40 to 49.

**Note:** These are the BANDS, not an algorithm for awarding a degree. Universities differ in how they weight years, whether they discount the worst credits, and how they treat borderline cases, and those rules change the outcome far more often than the boundaries do. The calculator states this rather than implying a computed average is a classification.

## All sources

- https://www.gov.uk/individual-savings-accounts
- https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past
- https://www.gov.uk/tax-on-dividends
- https://www.gov.uk/guidance/capital-gains-tax-rates-and-allowances
- https://www.gov.uk/government/publications/rates-and-allowances-pension-schemes/pension-schemes-rates
- https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
- https://www.gov.scot/publications/scottish-budget-2026-2027-scottish-tax-ready-reckoners/pages/4/
- https://www.gov.wales/land-transaction-tax-rates-and-bands
- https://www.bankofengland.co.uk/monetary-policy-report/2026/july-2026
- https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/latest
- https://www.gov.uk/income-tax-rates
- https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
- https://www.gov.uk/vat-rates
- https://www.gov.uk/repaying-your-student-loan/what-you-pay
- https://www.gov.uk/government/publications/review-of-the-automatic-enrolment-earnings-trigger-and-qualifying-earnings-band-for-202627/review-of-the-automatic-enrolment-earnings-trigger-and-qualifying-earnings-band-for-202627
- https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief
- https://www.gov.uk/guidance/rates-of-stamp-duty-land-tax-for-non-uk-residents
- https://www.gov.uk/tax-codes/what-your-tax-code-means
- https://www.gov.uk/employee-tax-codes/letters
- https://assets.publishing.service.gov.uk/media/6996e9b3b33a4db7ff889e08/P9X_2026_Tax_codes_to_use_from_6_April_2026.pdf
- https://www.gov.uk/self-employed-national-insurance-rates
- https://www.gov.uk/marriage-allowance
- https://www.gov.uk/inheritance-tax
- https://www.gov.uk/guidance/inheritance-tax-residence-nil-rate-band
- https://www.gov.uk/corporation-tax-rates
- https://www.gov.uk/junior-individual-savings-accounts
- https://www.gov.uk/lifetime-isa
- https://www.gov.uk/lifetime-isa/withdrawing-money-from-your-lifetime-isa
- https://www.gov.uk/apply-tax-free-interest-on-savings
- https://www.gov.uk/understand-self-assessment-bill/payments-on-account
- https://www.gov.uk/new-state-pension/what-youll-get
- https://www.gov.uk/new-state-pension/eligibility
- https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance
- https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm062100
- https://www.nhs.uk/better-health/lose-weight/calorie-counting/
- https://www.nhs.uk/conditions/obesity/diagnosis/
- https://www.nhs.uk/common-health-questions/lifestyle/what-is-the-body-mass-index-bmi/
- https://www.gov.uk/bank-holidays.json
- https://www.gov.uk/government/publications/rates-and-allowances-travel-mileage-and-fuel-allowances/travel-mileage-and-fuel-rates-and-allowances
- https://www.gov.uk/expenses-and-benefits-business-travel-mileage/rules-for-national-insurance
- https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
- https://professional-electrician.com/technical/how-to-determine-voltage-drop-limits-within-electrical-installations-napit/
- https://www.firstinarchitecture.co.uk/stair-design-guide-03-regulations-2/
- https://www.gov.uk/student-finance/new-fulltime-students
- https://en.wikipedia.org/wiki/UCAS_Tariff

## Ruleset sections

- `bank_holidays`
- `building`
- `capital_gains`
- `checked_at`
- `corporation_tax`
- `dividends`
- `education`
- `effective_from`
- `effective_to`
- `engineering`
- `health`
- `income_tax_england_wales_ni`
- `income_tax_scotland`
- `inheritance_tax`
- `isa`
- `marriage_allowance`
- `motoring`
- `national_insurance_employee_class1_category_a`
- `national_insurance_self_employed`
- `pension`
- `planned_changes`
- `property_transaction_tax`
- `reference_indicators`
- `ruleset_id`
- `savings`
- `self_assessment`
- `source_register_notes`
- `sources`
- `state_pension`
- `status`
- `student_loans`
- `tax_codes`
- `tax_year`
- `vat`
- `workplace_pension_auto_enrolment`
