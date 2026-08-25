/**
 * Phase 2 Batch 1: UK Tax and Salary guides.
 *
 * Every statutory figure quoted here was checked against the named GOV.UK page
 * on 25 August 2026, not taken from the backfill plan and not recalled. Where
 * the plan's figures disagreed with GOV.UK, GOV.UK won and the plan is noted as
 * stale in docs/PHASE2_SOURCE_VERIFICATION_REGISTER.md.
 *
 * Every worked example figure came from a live run of the calculation engine.
 * tests/calculator-guides.test.ts re-runs each one and fails on any drift.
 *
 * Two entries in the plan's Tier 1 name calculator ids that do not exist in the
 * 253-calculator registry. Both substitutions are recorded in `editorialNotes`
 * and in the Phase 2 report rather than made silently:
 *   - Plan item 5 lists "TAX-005 Scottish Income Tax Calculator". TAX-005 is
 *     the Salary Sacrifice Calculator and no standalone Scottish calculator
 *     exists. Scottish bands are covered inside the TAX-001 guide.
 *   - Plan item 10 lists "TAX-021 Dividend Tax Calculator". There is no
 *     TAX-021; the dividend calculator is TAX-011.
 */
import type { CalculatorGuideDefinition, OfficialSource } from "./types.js";

const REVIEWED = "2026-08-25";
const RULESET = { id: "uk-2026-27-v1", taxYear: "2026/27" } as const;

// --- Sources cited by more than one guide ---------------------------------

const SRC_INCOME_TAX: OfficialSource = {
  title: "Income Tax rates and Personal Allowances",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/income-tax-rates",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Personal Allowance £12,570; basic 20% to £50,270; higher 40% to £125,140; additional 45% above; taper from £100,000",
  effectivePeriod: "6 April 2026 to 5 April 2027",
};

const SRC_SCOTTISH: OfficialSource = {
  title: "Income Tax in Scotland",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/scottish-income-tax",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Scottish bands: starter 19%, basic 20%, intermediate 21%, higher 42%, advanced 45%, top 48%",
  effectivePeriod: "2026 to 2027",
};

const SRC_NI: OfficialSource = {
  title: "National Insurance rates and categories",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/national-insurance-rates-letters",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Category A employee Class 1: nothing to £242 a week, 8% to £967 a week, 2% above",
  effectivePeriod: "2026 to 2027",
};

const SRC_STUDENT_LOANS: OfficialSource = {
  title: "Repaying your student loan: what you pay",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/repaying-your-student-loan/what-you-pay",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Plan 5 £25,000 at 9%; Postgraduate £21,000 at 6%",
};

const SRC_ITA_2007: OfficialSource = {
  title: "Income Tax Act 2007",
  publisher: "legislation.gov.uk",
  url: "https://www.legislation.gov.uk/ukpga/2007/3/contents",
  sourceType: "legislation",
  verificationStatus: "VERIFIED",
  applicableRule: "Statutory basis for the Income Tax charge, rates and allowances",
};

const SRC_DIVIDENDS: OfficialSource = {
  title: "Tax on dividends",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/tax-on-dividends",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Dividend allowance £500; dividend rates 10.75% basic, 35.75% higher, 39.35% additional",
  effectivePeriod: "2026 to 2027",
};

const SRC_CGT_ALLOWANCE: OfficialSource = {
  title: "Capital Gains Tax: allowances",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/capital-gains-tax/allowances",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule: "Annual exempt amount £3,000 for individuals",
};

const SRC_CGT_RATES: OfficialSource = {
  title: "Capital Gains Tax: rates",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/capital-gains-tax/rates",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule: "18% on gains within the basic rate band, 24% above it",
  effectivePeriod: "from 6 April 2026",
};

const SRC_PSA: OfficialSource = {
  title: "Tax on savings interest: Personal Savings Allowance",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/apply-tax-free-interest-on-savings",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Personal Savings Allowance £1,000 basic, £500 higher, £0 additional; starting rate for savings £5,000, withdrawn by £1 per £1 of other income above the Personal Allowance",
};

export const batch1TaxSalaryGuides: CalculatorGuideDefinition[] = [
  // ======================================================== TAX-001 ========
  {
    calculatorId: "TAX-001",
    title: "How UK Income Tax is worked out",
    summary:
      "Income Tax is charged in slices, not at one flat rate, and only the income inside a band is charged at that band's rate. This calculator applies the 2026/27 bands for either England, Wales and Northern Ireland or Scotland.",
    purpose: [
      "Works out the Income Tax due on a given income for the 2026/27 tax year.",
      "Applies either the three England, Wales and Northern Ireland bands or the six Scottish bands.",
      "Handles the withdrawal of the Personal Allowance above £100,000, which creates the 60% effective marginal band.",
      "Converts the annual figure into monthly, weekly and hourly equivalents.",
      "Does not include National Insurance, pension deductions or student loan repayments — those are separate charges with their own calculators.",
    ],
    methodology:
      "The engine starts from gross income for the year and subtracts the Personal Allowance to give taxable income. For 2026/27 the Personal Allowance is £12,570, but it is withdrawn once adjusted net income passes £100,000: every £2 above that threshold removes £1 of allowance, so the allowance reaches zero at £125,140. Taxable income is then cut into statutory slices and each slice is charged at its own rate. In England, Wales and Northern Ireland there are three: 20% on the first £37,700 of taxable income, 40% up to £125,140, and 45% above. Scotland applies six, running from a 19% starter rate to a 48% top rate. Only the income falling inside a band is charged at that band's rate — moving into the higher rate never re-taxes the income below it. That single point is the most common misunderstanding about UK Income Tax, and it is why a pay rise across a threshold always leaves you better off in absolute terms.",
    formulaExplanation: {
      formula:
        "Taxable income = gross income − Personal Allowance (withdrawn above £100,000). Income Tax = the sum, across bands, of (income falling in that band × that band's rate).",
      steps: [
        "Take gross annual income, converting from the frequency you entered if needed.",
        "Reduce the £12,570 Personal Allowance by £1 for every £2 of income above £100,000.",
        "Subtract the resulting allowance from gross income to give taxable income.",
        "Split taxable income across the statutory bands for your jurisdiction.",
        "Charge each slice at its own rate and add the results together.",
      ],
    },
    workedExample: {
      scenario:
        "Priya earns £55,000 a year in Manchester and wants to know her Income Tax, and how it would differ if she moved to Glasgow.",
      engineInputs: {
        income: 55000,
        income_frequency: "annual",
        hours_week: 37.5,
        weeks: 52,
        jurisdiction: "England/Wales/NI",
      },
      displayInputs: [
        { label: "Income", display: "£55,000" },
        { label: "Income frequency", display: "Annual" },
        { label: "Jurisdiction", display: "England/Wales/NI" },
      ],
      steps: [
        "£55,000 is well below the £100,000 taper, so the full £12,570 Personal Allowance applies.",
        "Taxable income is £55,000 − £12,570 = £42,430.",
        "The first £37,700 of that is charged at the 20% basic rate: £7,540.",
        "The remaining £4,730 falls into the higher rate at 40%: £1,892.",
        "Total Income Tax is £7,540 + £1,892 = £9,432, or £786 a month.",
        "A Scottish taxpayer on the same £55,000 would pay £11,082.05, because the same £42,430 is spread across six bands reaching 42% rather than three reaching 40%.",
      ],
      outputs: [
        { key: "personal_allowance", label: "Personal Allowance", value: 12570, format: "currency" },
        { key: "taxable_income", label: "Taxable income", value: 42430, format: "currency" },
        { key: "tax_yearly", label: "Income Tax for the year", value: 9432, format: "currency" },
        { key: "tax_monthly", label: "Income Tax per month", value: 786, format: "currency" },
      ],
    },
    assumptions: [
      "The 2026/27 rates are assumed to apply for the whole tax year.",
      "The standard Personal Allowance applies. Marriage Allowance transfers and blind person's allowance are not modelled.",
      "Income is treated as non-savings, non-dividend income; dividends and savings interest have their own rates and allowances.",
      "Scottish rates are applied on the basis that you are a Scottish taxpayer for the whole year.",
    ],
    limitations: [
      "This is an annual estimate. Real payroll operates cumulative PAYE period by period, so a payslip can differ because of rounding, a mid-year code change, a bonus, or earlier earnings in the year.",
      "K codes and Week 1 / Month 1 markers are outside the annual model and are not supported.",
      "Scottish taxpayer status is determined by where your main residence is, not where you work, and the calculator takes your selection at face value.",
      "Benefits in kind, taxable state benefits and income taxed at source are not included.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_INCOME_TAX,
      SRC_SCOTTISH,
      {
        title: "Income over £100,000",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/income-tax-rates/income-over-100000",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Personal Allowance reduced by £1 for every £2 of adjusted net income above £100,000",
      },
      SRC_ITA_2007,
    ],
    relatedCalculators: [
      { calculatorId: "TAX-003", why: "See Income Tax alongside National Insurance, pension and student loan for an actual take-home figure." },
      { calculatorId: "TAX-004", why: "National Insurance is a separate charge with its own thresholds and its own shape." },
      { calculatorId: "TAX-002", why: "Convert the same pay between yearly, monthly, weekly and hourly." },
      { calculatorId: "TAX-005", why: "Salary sacrifice reduces the income taxed here, and is the usual route out of the 60% band." },
    ],
    faqs: [
      {
        question: "If I move into the 40% band, is all my income taxed at 40%?",
        answer:
          "No. Only the part of your taxable income inside the higher-rate band is charged at 40%. Everything below stays at 20%, and the Personal Allowance stays untaxed. A pay rise that crosses the threshold never leaves you worse off overall.",
      },
      {
        question: "Why is there an effective 60% tax rate around £100,000?",
        answer:
          "Between £100,000 and £125,140 you lose £1 of Personal Allowance for every £2 earned. That withdrawn allowance becomes taxable at 40% on top of the 40% already charged on the new income, so each extra £100 of salary costs £60 in tax. Pension contributions and Gift Aid reduce adjusted net income and can bring you back below the threshold.",
      },
      {
        question: "Does this include National Insurance?",
        answer:
          "No — it returns Income Tax only, which is why the figure is smaller than the total deductions on a payslip. Use the Take-Home Pay calculator for a combined view.",
      },
      {
        question: "Am I a Scottish taxpayer if I commute into Scotland for work?",
        answer:
          "Generally no. Scottish taxpayer status follows where your main place of residence is during the tax year, not where your employer is based. Living in England and working in Scotland means you pay the England, Wales and Northern Ireland rates.",
      },
    ],
    editorialNotes: [
      "Scottish band coverage lives here because the backfill plan's 'TAX-005 Scottish Income Tax Calculator' does not exist; TAX-005 is Salary Sacrifice and there is no standalone Scottish calculator in the registry.",
      "GOV.UK publishes the Scottish bands inclusive of the Personal Allowance (starter £12,571–£16,537). The ruleset stores them as taxable income above the allowance (0–£3,967). Both were checked and agree.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-002 ========
  {
    calculatorId: "TAX-002",
    title: "Converting pay between yearly, monthly, weekly and hourly",
    summary:
      "Pay is quoted in whatever unit suits whoever is quoting it. This calculator takes your pay once, in any frequency, and shows the equivalent amounts before and after Income Tax and National Insurance.",
    purpose: [
      "Converts a single pay figure into yearly, monthly, weekly and hourly equivalents.",
      "Shows both gross and net figures, so job offers quoted in different units can be compared directly.",
      "Applies 2026/27 Income Tax and employee National Insurance for your jurisdiction.",
      "Uses your stated hours per week and paid weeks per year to derive the hourly figures.",
      "Does not model pension contributions or student loans.",
    ],
    methodology:
      "Whatever you enter is first normalised into a single annual gross figure, using your working pattern where the conversion needs it. Income Tax is then computed by applying the Personal Allowance and the statutory bands for your jurisdiction, and employee Class 1 National Insurance is charged on earnings above the £12,570 primary threshold at 8%, dropping to 2% above the £50,270 upper earnings limit. Subtracting both from gross annual pay gives net annual pay. Every periodic figure is then derived from those annual totals by division: monthly is the annual figure divided by twelve, weekly by the paid weeks you entered, hourly by paid weeks multiplied by hours per week. Deriving the periods from the annual result, rather than taxing each period separately, is what keeps the four rows internally consistent with one another — and it is also precisely why the output is an annual estimate rather than a payslip reproduction.",
    formulaExplanation: {
      formula:
        "Net annual = gross annual − Income Tax − Class 1 National Insurance. Hourly = annual ÷ (paid weeks × hours per week).",
      steps: [
        "Convert the pay you entered into an annual gross figure.",
        "Apply the Personal Allowance and the Income Tax bands for your jurisdiction.",
        "Charge National Insurance at 8% between £12,570 and £50,270, then 2% above.",
        "Subtract both deductions to give net annual pay.",
        "Divide the annual figures into monthly, weekly and hourly equivalents.",
      ],
    },
    workedExample: {
      scenario:
        "Tom is offered £42,000 a year for a 37.5-hour week and wants to know what that is per month and per hour after tax and National Insurance.",
      engineInputs: {
        salary: 42000,
        income_frequency: "annual",
        hours_week: 37.5,
        weeks: 52,
        jurisdiction: "England/Wales/NI",
      },
      displayInputs: [
        { label: "Pay amount", display: "£42,000" },
        { label: "Income frequency", display: "Annual" },
        { label: "Hours per week", display: "37.5" },
        { label: "Paid weeks per year", display: "52" },
        { label: "Jurisdiction", display: "England/Wales/NI" },
      ],
      steps: [
        "£42,000 a year is £3,500 a month and £21.54 an hour across 52 weeks at 37.5 hours.",
        "Taxable income is £42,000 − £12,570 = £29,430, all inside the basic rate band, so Income Tax is 20%: £5,886.",
        "National Insurance is charged on the same £29,430 of earnings above the primary threshold at 8%: £2,354.40.",
        "Net annual pay is £42,000 − £5,886 − £2,354.40 = £33,759.60.",
        "That is £2,813.30 a month, £649.22 a week, and an effective £17.31 an hour.",
      ],
      outputs: [
        { key: "gross_annual", label: "Gross pay for the year", value: 42000, format: "currency" },
        { key: "gross_hourly", label: "Gross hourly rate", value: 21.54, format: "currency" },
        { key: "income_tax", label: "Income Tax", value: 5886, format: "currency" },
        { key: "ni", label: "National Insurance", value: 2354.4, format: "currency" },
        { key: "net_annual", label: "Net pay for the year", value: 33759.6, format: "currency" },
        { key: "net_hourly_equivalent", label: "Net hourly equivalent", value: 17.31, format: "currency" },
      ],
    },
    assumptions: [
      "The standard position is assumed: one job, the full Personal Allowance, no other income.",
      "Employee Class 1 National Insurance at category A is applied.",
      "The working pattern you enter is treated as representative of the whole year.",
    ],
    limitations: [
      "Hourly and weekly equivalents are only as good as the working pattern you enter — unpaid overtime is invisible to the calculator and makes your real hourly rate lower.",
      "Pension contributions and student loan repayments are not deducted here.",
      "Employer National Insurance is a cost to your employer, not a deduction from your pay, and is not shown.",
      "Periodic figures divide an annual result and will not match a payslip to the penny.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_INCOME_TAX, SRC_NI, SRC_SCOTTISH],
    relatedCalculators: [
      { calculatorId: "TAX-003", why: "Adds pension arrangements, student loans and tax codes for a fuller take-home figure." },
      { calculatorId: "TAX-006", why: "Start from an hourly rate instead and convert upwards to an annual salary." },
      { calculatorId: "TAX-004", why: "Look at the National Insurance component on its own." },
    ],
    faqs: [
      {
        question: "Is the hourly figure my real hourly rate?",
        answer:
          "It is your pay divided by the hours you told the calculator you are paid for. If you regularly work unpaid overtime, your effective rate is lower. Changing the hours-per-week input to what you actually work shows this quickly.",
      },
      {
        question: "Should I enter 52 paid weeks?",
        answer:
          "For a normal salaried contract with paid holiday, yes — you are paid across all 52 weeks. Enter fewer only for term-time-only or seasonal work where you genuinely are not paid for part of the year.",
      },
      {
        question: "Does it matter which frequency I enter my pay in?",
        answer:
          "No. Whatever you choose is converted to an annual figure first and every other row derives from that, so £3,500 monthly and £42,000 annually give identical results.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-003 ========
  {
    calculatorId: "TAX-003",
    title: "What actually reaches your bank account",
    summary:
      "Take-home pay is gross pay minus the full stack of deductions, applied in the order payroll applies them. The pension arrangement you are on materially changes the answer.",
    purpose: [
      "Models pension, Income Tax, National Insurance and student loan deductions together.",
      "Distinguishes salary sacrifice, net pay and relief at source arrangements, which are taxed differently.",
      "Supports standard and flat-rate tax codes.",
      "Shows both what you keep and what lands in your pension.",
    ],
    methodology:
      "Pay is converted to an annual gross figure, then deductions are applied in payroll order. A salary sacrifice contribution is removed from gross pay before anything else, so it reduces Income Tax, National Insurance and student loan repayments together. A net pay contribution comes out before Income Tax but after National Insurance has been assessed, so it saves tax but not National Insurance. A relief at source contribution comes from pay that has already been taxed, with basic rate relief added back into the pension by the provider. Your tax code then sets the allowance: 1257L gives the standard £12,570, while BR, D0 and D1 charge the whole of that employment at a single band rate with no allowance at all. Income Tax is computed on the resulting taxable pay using your jurisdiction's bands. National Insurance is charged on earnings above £12,570 at 8%, then 2% above £50,270. Student loan repayments take 9% of income above your plan's threshold, and a postgraduate loan takes a further 6% above £21,000.",
    formulaExplanation: {
      formula:
        "Net pay = gross − pension deduction (arrangement-dependent) − Income Tax − National Insurance − student loan − postgraduate loan.",
      steps: [
        "Convert entered pay to an annual gross figure.",
        "Apply the pension arrangement: a sacrifice before all assessments, a net pay contribution before Income Tax only.",
        "Resolve the tax code to a Personal Allowance or a flat band.",
        "Charge Income Tax on taxable pay using your jurisdiction's bands.",
        "Charge National Insurance on gross earnings above the primary threshold.",
        "Charge student loan and postgraduate loan above their own thresholds.",
        "Subtract every deduction from gross pay and divide into periods.",
      ],
    },
    workedExample: {
      scenario:
        "Aisha earns £45,000, pays 5% into a net pay workplace pension with a 3% employer match, and is repaying a Plan 2 student loan.",
      engineInputs: {
        gross: 45000,
        income_frequency: "annual",
        payroll_frequency: "monthly",
        hours_per_week: 37.5,
        paid_weeks_per_year: 52,
        jurisdiction: "England/Wales/NI",
        tax_code: "1257L",
        pension_arrangement: "net_pay",
        pension_pct: 0.05,
        employer_pension_pct: 0.03,
        student_plan: "Plan 2",
        postgraduate: false,
      },
      displayInputs: [
        { label: "Gross income", display: "£45,000" },
        { label: "Tax code", display: "1257L" },
        { label: "Pension arrangement", display: "Net pay" },
        { label: "Pension contribution", display: "5%" },
        { label: "Employer contribution", display: "3%" },
        { label: "Student loan plan", display: "Plan 2" },
      ],
      steps: [
        "The 5% net pay contribution of £2,250 is deducted before Income Tax is assessed.",
        "Taxable pay is £45,000 − £2,250 − £12,570 = £30,180, taxed at 20%: £6,036.",
        "National Insurance is assessed on the full £45,000, because a net pay arrangement does not reduce it: 8% of £32,430 = £2,594.40.",
        "Plan 2 takes 9% of income above the £29,385 threshold: 9% of £15,615 = £1,405.35.",
        "Net pay is £45,000 − £2,250 − £6,036 − £2,594.40 − £1,405.35 = £32,714.25, or £2,726.19 a month.",
        "The pension receives £2,250 from Aisha plus £1,350 from her employer: £3,600 in total.",
      ],
      outputs: [
        { key: "tax", label: "Income Tax", value: 6036, format: "currency" },
        { key: "ni", label: "National Insurance", value: 2594.4, format: "currency" },
        { key: "student_loan", label: "Student loan repayment", value: 1405.35, format: "currency" },
        { key: "employee_pension", label: "Your pension contribution", value: 2250, format: "currency" },
        { key: "total_pension_contribution", label: "Total into your pension", value: 3600, format: "currency" },
        { key: "net_yearly", label: "Take-home pay for the year", value: 32714.25, format: "currency" },
        { key: "net_monthly", label: "Take-home pay per month", value: 2726.19, format: "currency" },
      ],
    },
    assumptions: [
      "Employer pension contributions are shown for completeness and are never deducted from take-home pay.",
      "The pension percentage is applied to full gross pay, not to qualifying earnings only.",
      "Student loan repayments are estimated annually rather than per pay period.",
    ],
    limitations: [
      "K codes and Week 1 / Month 1 markers are not supported by an annual estimate and are deliberately excluded.",
      "Taxable benefits in kind, company car charges and salary advances are not modelled.",
      "Real payroll assesses student loan repayments each pay period, so a month of variable earnings can differ noticeably from one twelfth of the annual figure.",
      "Where an employer operates a qualifying-earnings pension basis, the pension figures here will be higher than your scheme's.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_INCOME_TAX,
      SRC_NI,
      SRC_STUDENT_LOANS,
      {
        title: "Tax codes",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/tax-codes",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Meaning of 1257L, BR, D0 and D1 codes",
      },
    ],
    relatedCalculators: [
      { calculatorId: "TAX-005", why: "See what the same contribution would save if it were a salary sacrifice instead." },
      { calculatorId: "TAX-020", why: "Look at the student loan repayment on its own, across every plan type." },
      { calculatorId: "TAX-001", why: "Isolate the Income Tax component without the other deductions." },
      { calculatorId: "TAX-004", why: "Isolate the National Insurance component." },
    ],
    faqs: [
      {
        question: "Which pension arrangement should I choose?",
        answer:
          "The one your employer actually operates — it will be named on your payslip or in your scheme documents. Salary sacrifice reduces gross pay so it saves both Income Tax and National Insurance. Net pay saves Income Tax at your marginal rate but not National Insurance. Relief at source adds 20% into the pension automatically, with higher-rate taxpayers claiming the rest through Self Assessment.",
      },
      {
        question: "Why is National Insurance charged on my full salary when my pension is not?",
        answer:
          "Under a net pay arrangement the contribution is deducted after earnings have been assessed for National Insurance, so only Income Tax is reduced. Only salary sacrifice lowers the earnings figure National Insurance is charged on.",
      },
      {
        question: "Do I repay a student loan and a postgraduate loan at the same time?",
        answer:
          "Yes, if you have both. They are assessed independently against their own thresholds, so an undergraduate plan takes 9% above its threshold and the postgraduate loan takes a further 6% above £21,000.",
      },
      {
        question: "What if my tax code is not 1257L?",
        answer:
          "Choose the code from the list or enter a custom one. BR, D0 and D1 tax that employment entirely at the basic, higher and additional rates with no allowance, which is normal for a second job. A different number such as 1100L simply sets the allowance to that number times ten.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-004 ========
  {
    calculatorId: "TAX-004",
    title: "How employee National Insurance is charged",
    summary:
      "National Insurance works in the opposite direction to Income Tax: the rate falls as you earn more, dropping from 8% to 2% above the upper earnings limit.",
    purpose: [
      "Works out employee Class 1 National Insurance on a category A record for 2026/27.",
      "Shows the charge yearly, monthly, weekly and as an hourly equivalent.",
      "Makes the two-slice structure visible, including the rate drop above £50,270.",
      "Does not cover employer contributions or self-employed Class 2 and Class 4.",
    ],
    methodology:
      "Employee Class 1 National Insurance is charged in two slices. Nothing is due on earnings up to the primary threshold of £12,570 a year. Earnings between that threshold and the upper earnings limit of £50,270 are charged at the main rate of 8%. Earnings above the upper earnings limit are charged at just 2%. That falling structure is the reverse of Income Tax, and it is why the marginal deduction rate actually drops when you cross £50,270 even as Income Tax rises from 20% to 40%. This ruleset assesses contributions on annual earnings. HMRC also publishes weekly and monthly thresholds that are not exact divisions of the annual figures — £242 a week and £1,048 a month against £12,570 a year — and real payroll assesses each pay period against those. The calculator records that difference in its own output rather than hiding it, so periodic figures here are an annual result divided into periods.",
    formulaExplanation: {
      formula:
        "National Insurance = 8% × (earnings between £12,570 and £50,270) + 2% × (earnings above £50,270).",
      steps: [
        "Convert entered earnings to an annual gross figure.",
        "Charge nothing on the first £12,570.",
        "Charge 8% on earnings between £12,570 and £50,270.",
        "Charge 2% on any earnings above £50,270.",
        "Divide the annual total into the periodic figures.",
      ],
    },
    workedExample: {
      scenario:
        "Daniel earns £45,000 a year and wants to see his National Insurance separately from his Income Tax.",
      engineInputs: {
        earnings: 45000,
        income_frequency: "annual",
        payroll_frequency: "monthly",
        hours_week: 37.5,
        weeks: 52,
      },
      displayInputs: [
        { label: "Earnings", display: "£45,000" },
        { label: "Income frequency", display: "Annual" },
        { label: "Payroll frequency", display: "Monthly" },
      ],
      steps: [
        "The first £12,570 of earnings carries no National Insurance.",
        "£45,000 is below the £50,270 upper earnings limit, so none of it reaches the 2% rate.",
        "Earnings in the 8% band are £45,000 − £12,570 = £32,430.",
        "National Insurance is 8% of £32,430 = £2,594.40 for the year.",
        "That is £216.20 a month, or £49.89 a week.",
      ],
      outputs: [
        { key: "ni_yearly", label: "National Insurance for the year", value: 2594.4, format: "currency" },
        { key: "ni_monthly", label: "National Insurance per month", value: 216.2, format: "currency" },
        { key: "ni_weekly", label: "National Insurance per week", value: 49.89, format: "currency" },
      ],
    },
    assumptions: [
      "Category A employee contributions are modelled — the standard category for most employees.",
      "Contributions are assessed on annual earnings rather than per pay period.",
    ],
    limitations: [
      "Categories for deferred, reduced-rate and over-State-Pension-age records are not modelled.",
      "Employer secondary Class 1 contributions are excluded; they are a cost to your employer, not a payslip deduction.",
      "HMRC's weekly and monthly thresholds are not exact divisions of the annual figures, so a payslip can differ by pence per period.",
      "With more than one employment each employer applies the thresholds independently, which can cause under- or overpayment the calculator cannot detect.",
      "Self-employed Class 2 and Class 4 contributions follow different rules entirely.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_NI,
      {
        title: "National Insurance: what it is and how you pay",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/national-insurance",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Purpose of contributions and the classes that exist",
      },
    ],
    relatedCalculators: [
      { calculatorId: "TAX-003", why: "See National Insurance in the context of full take-home pay." },
      { calculatorId: "TAX-001", why: "Compare the National Insurance charge with the Income Tax on the same earnings." },
      { calculatorId: "TAX-005", why: "Salary sacrifice is the main legitimate way to reduce the earnings National Insurance is charged on." },
    ],
    faqs: [
      {
        question: "Why does my National Insurance rate fall when I earn more?",
        answer:
          "Above the upper earnings limit of £50,270 the employee rate drops from 8% to 2%. National Insurance is designed to build benefit entitlement, and entitlement stops accruing above that limit, so the charge above it is much lower.",
      },
      {
        question: "Do contributions affect my State Pension?",
        answer:
          "Yes. Qualifying years build entitlement to the new State Pension. Check your actual record on GOV.UK rather than inferring it from a calculator, because gaps, credits and contracted-out periods all affect it.",
      },
      {
        question: "Does my employer pay National Insurance too?",
        answer:
          "Yes, employers pay secondary Class 1 contributions on your earnings. That is a cost to them rather than a deduction from your pay, so it does not appear on your payslip or in this figure.",
      },
      {
        question: "I have two jobs — is my National Insurance right?",
        answer:
          "Each employer applies the thresholds independently, so two jobs can mean getting the £12,570 threshold twice, or overpaying above the upper earnings limit. HMRC can review this after the year end; this calculator models a single employment.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-005 ========
  {
    calculatorId: "TAX-005",
    title: "What salary sacrifice actually costs you",
    summary:
      "Sacrificed pay is given up before it is assessed, so it escapes Income Tax, National Insurance and student loan repayments together. This calculator shows both what you give up and what lands in the pension.",
    purpose: [
      "Compares take-home pay with and without a salary sacrifice arrangement.",
      "Shows the Income Tax, National Insurance and student loan saved.",
      "Calculates the total landing in the pension including the employer contribution.",
      "Expresses the trade-off as a cost per pound of pension funding.",
    ],
    methodology:
      "The calculator runs your full PAYE position twice — once on the unreduced salary and once on the reduced salary — and compares the two, rather than adjusting a single figure. That matters, because the saving depends on which tax and National Insurance bands the sacrificed slice actually occupied. The sacrificed amount is removed from gross pay first. Income Tax is then charged on the reduced salary, so the saving is the sacrificed amount multiplied by whatever marginal rate that slice sat in. National Insurance is likewise charged on the reduced salary: a slice above the upper earnings limit saves only 2%, while a slice below it saves the full 8%. Student loan repayments fall by 9% of the sacrificed amount where a plan applies. The employer contribution is calculated as a percentage of the reduced salary and added to your sacrifice to give the total landing in the pension. Cost per pound is then the fall in take-home pay divided by that total.",
    formulaExplanation: {
      formula:
        "Cost per £1 in the pension = (take-home before − take-home after) ÷ (sacrificed amount + employer contribution).",
      steps: [
        "Compute the full PAYE position on the unreduced salary.",
        "Reduce gross salary by the sacrificed percentage.",
        "Recompute Income Tax, National Insurance and student loan on the reduced salary.",
        "Calculate the employer contribution as a percentage of the reduced salary.",
        "Compare take-home pay across the two runs and divide the difference by the total paid into the pension.",
      ],
    },
    workedExample: {
      scenario:
        "Rachel earns £60,000 and is considering sacrificing 10% of salary, with her employer contributing 3% of the reduced figure.",
      engineInputs: {
        gross_salary: 60000,
        sacrifice_percentage: 10,
        employer_contribution_percentage: 3,
        jurisdiction: "England/Wales/NI",
        student_plan: "None",
        postgraduate: false,
      },
      displayInputs: [
        { label: "Gross annual salary", display: "£60,000" },
        { label: "Salary sacrifice", display: "10%" },
        { label: "Employer contribution", display: "3%" },
        { label: "Jurisdiction", display: "England/Wales/NI" },
        { label: "Student loan plan", display: "None" },
      ],
      steps: [
        "Sacrificing 10% gives up £6,000, reducing salary from £60,000 to £54,000.",
        "That £6,000 slice sat entirely in the 40% higher rate band, so Income Tax falls by £2,400.",
        "It also sat above the £50,270 upper earnings limit, so National Insurance falls by only 2% of £6,000 = £120.",
        "Take-home pay falls from £45,357.40 to £41,877.40 — a reduction of £3,480 a year, or £290 a month.",
        "The employer adds 3% of the reduced £54,000 salary, which is £1,620, so £7,620 lands in the pension.",
        "Each £1 in the pension therefore costs about 46p of take-home pay.",
      ],
      outputs: [
        { key: "sacrificed_amount", label: "Salary sacrificed", value: 6000, format: "currency" },
        { key: "employer_contribution", label: "Employer contribution", value: 1620, format: "currency" },
        { key: "total_into_pension", label: "Total into pension", value: 7620, format: "currency" },
        { key: "take_home_reduction", label: "Fall in take-home pay", value: 3480, format: "currency" },
        { key: "income_tax_saved", label: "Income Tax saved", value: 2400, format: "currency" },
        { key: "national_insurance_saved", label: "National Insurance saved", value: 120, format: "currency" },
      ],
    },
    assumptions: [
      "The employer contribution is applied as a percentage of the reduced salary, which is the common scheme design. Some schemes base it on pre-sacrifice pay instead.",
      "Employer National Insurance savings are not modelled; if your employer shares them, enter that as part of the employer contribution.",
    ],
    limitations: [
      "Sacrifice cannot lawfully reduce pay below the National Minimum Wage, and the calculator does not enforce that limit.",
      "Reducing contractual pay can affect mortgage affordability assessments, statutory maternity and paternity pay, life cover and other salary-linked benefits.",
      "The £60,000 annual allowance caps tax-relieved pension input; exceeding it creates a charge this calculator does not model.",
      "A sacrifice is a contractual variation, so it is not something you can simply switch on and off at will.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      {
        title: "Salary sacrifice for employers",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Effect of a salary sacrifice on PAYE, National Insurance and contractual pay",
      },
      SRC_NI,
      {
        title: "Tax on your private pension contributions: annual allowance",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/tax-on-your-private-pension/annual-allowance",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "£60,000 annual allowance on tax-relieved pension input",
      },
    ],
    relatedCalculators: [
      { calculatorId: "TAX-003", why: "Compare the same contribution under a net pay or relief at source arrangement." },
      { calculatorId: "TAX-019", why: "Sacrifice reduces adjusted net income, which is exactly what the Child Benefit charge is assessed on." },
      { calculatorId: "TAX-001", why: "See which band the sacrificed slice of salary was sitting in." },
    ],
    faqs: [
      {
        question: "Why did I save only 2% National Insurance rather than 8%?",
        answer:
          "Because the sacrificed slice sat above the upper earnings limit of £50,270, where the employee rate is already 2%. Sacrifice saves whatever rate applied to the specific slice of pay given up, so sacrificing from earnings below the limit saves the full 8%.",
      },
      {
        question: "Is salary sacrifice better than a normal pension contribution?",
        answer:
          "For the same amount into the pension it usually costs less take-home pay, because it saves National Insurance as well as Income Tax. The trade-off is that it reduces your contractual salary, which can affect borrowing and salary-linked benefits.",
      },
      {
        question: "Can I stop or change a salary sacrifice arrangement?",
        answer:
          "It is a contractual variation, so changes need your employer's agreement, and most schemes limit how often you can change — often to set points in the year or on a lifestyle event such as a birth or a change of hours.",
      },
      {
        question: "Does sacrifice help with the 60% band or the Child Benefit charge?",
        answer:
          "Yes, and it is one of the most effective tools for both, because it reduces the income figure those charges are assessed on. Bringing income below £100,000 or below £60,000 respectively can be worth considerably more than the headline rate saving.",
      },
    ],
    editorialNotes: [
      "The backfill plan listed TAX-005 as a 'Scottish Income Tax Calculator'. The registry's TAX-005 is the Salary Sacrifice Calculator, and no standalone Scottish calculator exists among the 253. This guide documents the real calculator; Scottish bands are covered in the TAX-001 guide.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-011 ========
  {
    calculatorId: "TAX-011",
    title: "How dividends are taxed on top of your other income",
    summary:
      "Dividends are treated as the top slice of your income, so the rate they attract depends on everything else you earn first. The £500 dividend allowance is a nil-rate band, not an exemption.",
    purpose: [
      "Works out the Income Tax due on dividend income for 2026/27.",
      "Applies the £500 dividend allowance and the dividend rates of 10.75%, 35.75% and 39.35%.",
      "Shows how much of your dividend income falls into each band once other income is taken into account.",
      "Also reports the tax on your other income, so the two can be seen together.",
    ],
    methodology:
      "Dividends sit at the top of the income stack. The calculator first applies your Personal Allowance to your other income and taxes that in the usual bands, which establishes how much band space remains. Your dividends are then dropped into whatever space is left. The first £500 of dividends is covered by the dividend allowance — but the allowance is a nil-rate band, not an exemption, which means it still consumes band space rather than pushing later dividends into a cheaper band. Whatever remains of the basic rate band is charged at the 10.75% dividend basic rate, the higher rate band at 35.75%, and anything above at 39.35%. This top-slicing is why the same £12,000 of dividends can attract very different amounts of tax depending on the salary underneath it, and why increasing your salary can raise the tax on dividends you have not changed.",
    formulaExplanation: {
      formula:
        "Dividend tax = 10.75% × (dividends in remaining basic band, after the £500 allowance) + 35.75% × (dividends in the higher band) + 39.35% × (dividends above).",
      steps: [
        "Apply the Personal Allowance to your other income and tax it in the usual bands.",
        "Work out how much of each band remains unused.",
        "Place dividends on top, using the £500 allowance first — it occupies band space at a nil rate.",
        "Charge the remaining dividends at the dividend rate for each band they fall into.",
      ],
    },
    workedExample: {
      scenario:
        "Marcus takes a £40,000 salary from his company and £12,000 in dividends, and wants to know the tax on the dividends.",
      engineInputs: {
        dividend_income: 12000,
        other_income: 40000,
        jurisdiction: "England/Wales/NI",
      },
      displayInputs: [
        { label: "Dividend income", display: "£12,000" },
        { label: "Other income", display: "£40,000" },
        { label: "Jurisdiction", display: "England/Wales/NI" },
      ],
      steps: [
        "The £12,570 Personal Allowance is used against the £40,000 of other income, leaving £27,430 taxable at 20%: £5,486.",
        "The basic rate band covers £37,700 of taxable income, so £37,700 − £27,430 = £10,270 of band space remains.",
        "The first £500 of dividends uses the dividend allowance at a nil rate, but still occupies band space.",
        "That leaves £9,770 of dividends inside the basic band, charged at 10.75%.",
        "The remaining £1,730 of dividends spills into the higher band at 35.75%.",
        "Total dividend tax is £1,668.75, an effective 13.9% across the whole £12,000.",
      ],
      outputs: [
        { key: "dividend_allowance_used", label: "Dividend allowance used", value: 500, format: "currency" },
        { key: "dividends_taxed_at_basic", label: "Dividends taxed at the basic rate", value: 9770, format: "currency" },
        { key: "dividends_taxed_at_higher", label: "Dividends taxed at the higher rate", value: 1730, format: "currency" },
        { key: "dividend_tax", label: "Dividend tax", value: 1668.75, format: "currency" },
        { key: "net_dividends", label: "Dividends after tax", value: 10331.25, format: "currency" },
      ],
    },
    assumptions: [
      "Dividends are treated as the top slice of income, which is the statutory ordering.",
      "The dividend rates are the same across the UK; only the tax on your other income varies by jurisdiction.",
      "All dividends are UK dividends received in the same tax year.",
    ],
    limitations: [
      "Dividends inside an ISA or a pension are not taxable and should not be entered here.",
      "Foreign dividends, dividend income within a trust, and stock dividends follow different rules.",
      "The calculator does not model the interaction with the Personal Savings Allowance or the starting rate for savings.",
      "It estimates Income Tax only; it is not a Self Assessment computation.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_DIVIDENDS, SRC_INCOME_TAX, SRC_ITA_2007],
    relatedCalculators: [
      { calculatorId: "TAX-013", why: "Dividends, gains and interest inside a general investment account, assessed together." },
      { calculatorId: "TAX-001", why: "Work out the tax on the other income that determines which bands your dividends land in." },
      { calculatorId: "TAX-012", why: "Capital gains use their own allowance and rates alongside dividends." },
    ],
    faqs: [
      {
        question: "Why did my dividend tax rise when my salary went up, even though the dividends did not change?",
        answer:
          "Dividends sit on top of your other income, so a higher salary uses up more of the basic rate band and pushes more of your dividends into the higher dividend rate. The dividends themselves are unchanged; the band space beneath them is not.",
      },
      {
        question: "Is the £500 dividend allowance tax-free income?",
        answer:
          "It is charged at a nil rate rather than being exempt, and that distinction matters. The allowance still uses up band space, so it does not shelter later dividends from being pushed into a higher band.",
      },
      {
        question: "Do dividends inside an ISA count?",
        answer:
          "No. Dividends received inside a stocks and shares ISA are not taxable and do not use your dividend allowance, so leave them out of the figure you enter.",
      },
      {
        question: "Do Scottish taxpayers pay different dividend rates?",
        answer:
          "No. Dividend rates are set UK-wide and are identical in Scotland. Your jurisdiction only changes the tax on your non-dividend income, which in turn changes how much band space your dividends land in.",
      },
    ],
    editorialNotes: [
      "The backfill plan listed this calculator as 'TAX-021' and quoted the older 8.75% / 33.75% / 39.35% rates. There is no TAX-021 in the registry, and GOV.UK publishes 10.75% / 35.75% / 39.35% for 2026/27. The engine agrees with GOV.UK.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-013 ========
  {
    calculatorId: "TAX-013",
    title: "Tax on a general investment account",
    summary:
      "A general investment account has no tax wrapper, so dividends, capital gains and interest are each assessed separately against their own allowances and their own rates.",
    purpose: [
      "Brings the three taxable streams from an unwrapped investment account into one view.",
      "Applies the £500 dividend allowance, the £3,000 capital gains annual exempt amount and the Personal Savings Allowance.",
      "Determines your tax band from your other income and applies the corresponding rates.",
      "Shows the total allowances used, which is a useful measure of what an ISA would have sheltered.",
    ],
    methodology:
      "Unlike an ISA or a pension, a general investment account gives no shelter, so each type of return is taxed under its own regime. The calculator first uses your other income to place you in a band: basic, higher or additional. Dividends are then reduced by the £500 dividend allowance and the remainder taxed at the dividend rate for your band. Capital gains are reduced by any losses brought forward, then by the £3,000 annual exempt amount, with the remainder charged at 18% for a basic rate taxpayer or 24% for a higher or additional rate taxpayer. Interest distributions are reduced by the Personal Savings Allowance — £1,000 for a basic rate taxpayer, £500 for a higher rate taxpayer and nothing at all for an additional rate taxpayer — and the remainder is charged at your marginal Income Tax rate. The three charges are then added together.",
    formulaExplanation: {
      formula:
        "Total = dividend tax on (dividends − £500) + CGT on (gains − losses − £3,000) + Income Tax on (interest − Personal Savings Allowance).",
      steps: [
        "Use other income to place the investor in the basic, higher or additional band.",
        "Deduct the £500 dividend allowance and tax the remaining dividends at the band's dividend rate.",
        "Deduct brought-forward losses and the £3,000 annual exempt amount from gains, then charge 18% or 24%.",
        "Deduct the Personal Savings Allowance from interest and charge the remainder at the marginal Income Tax rate.",
        "Add the three charges together.",
      ],
    },
    workedExample: {
      scenario:
        "Elena earns £55,000 and holds an unwrapped portfolio that produced £2,500 in dividends, £6,000 of realised gains and £800 of interest.",
      engineInputs: {
        annual_dividends: 2500,
        realised_capital_gains: 6000,
        interest_income: 800,
        other_taxable_income: 55000,
        capital_losses_brought_forward: 0,
      },
      displayInputs: [
        { label: "Annual dividend income", display: "£2,500" },
        { label: "Realised capital gains in year", display: "£6,000" },
        { label: "Interest distributions", display: "£800" },
        { label: "Other taxable income", display: "£55,000" },
        { label: "Capital losses brought forward", display: "£0" },
      ],
      steps: [
        "£55,000 of other income puts Elena in the higher rate band.",
        "Gains of £6,000 less the £3,000 annual exempt amount leave £3,000 taxable at the higher CGT rate of 24%: £720.",
        "Interest of £800 less the £500 higher-rate Personal Savings Allowance leaves £300 taxable at 40%: £120.",
        "Across dividends, gains and interest, £4,000 of allowances were used — the amount an ISA would have made unnecessary.",
      ],
      outputs: [
        { key: "capital_gains_tax_due", label: "Capital Gains Tax", value: 720, format: "currency" },
        { key: "interest_tax_due", label: "Tax on interest", value: 120, format: "currency" },
        { key: "total_allowances_utilised", label: "Allowances used", value: 4000, format: "currency" },
      ],
    },
    assumptions: [
      "All three income streams arise in the same tax year and in the same account.",
      "Gains are treated as non-residential assets; residential property has its own rates and a 60-day reporting requirement.",
      "The band is determined from other income alone, before the investment returns are added.",
    ],
    limitations: [
      "The dividend element of this calculator is under review — see the note below — and the dividend figure it produces should not be relied on until that review concludes.",
      "The calculator places you in a single band rather than splitting a gain that straddles the basic and higher rate thresholds.",
      "Accumulation funds produce notional distributions that are taxable even though no cash is received; those are not modelled.",
      "Equalisation payments, excess reportable income on offshore funds and bed-and-breakfasting rules are not covered.",
      "This is an estimate, not a Self Assessment computation.",
    ],
    ruleStatus: "SOURCE VERIFICATION REQUIRED",
    ruleset: RULESET,
    officialSources: [SRC_DIVIDENDS, SRC_CGT_ALLOWANCE, SRC_CGT_RATES, SRC_PSA],
    relatedCalculators: [
      { calculatorId: "TAX-011", why: "Dividend tax on its own, with the band interaction shown step by step." },
      { calculatorId: "TAX-012", why: "Capital Gains Tax on a single disposal, including the band split." },
      { calculatorId: "ISA-001", why: "See what the same portfolio would have returned inside a tax-free ISA wrapper." },
    ],
    faqs: [
      {
        question: "Why is an ISA usually better than a general investment account?",
        answer:
          "Inside an ISA, dividends, gains and interest are not taxable at all and never need reporting. The 'allowances used' figure here is a reasonable proxy for what an ISA would have saved you the trouble of tracking, on top of any tax actually paid.",
      },
      {
        question: "Do I pay Capital Gains Tax on gains I have not sold?",
        answer:
          "No. Capital Gains Tax applies to realised gains — you have to dispose of the asset. Unrealised growth in a general investment account is not taxable, which is why the calculator asks for gains realised in the year.",
      },
      {
        question: "Does the Personal Savings Allowance apply to bond fund distributions?",
        answer:
          "Interest distributions from bond funds are taxed as interest, so the Personal Savings Allowance applies. Dividend distributions from equity funds are taxed as dividends and use the dividend allowance instead. Which one applies depends on the fund's holdings, not its name.",
      },
      {
        question: "Do I need to file a tax return?",
        answer:
          "It depends on the amounts and on your wider circumstances, and the thresholds change. Check the current requirements on GOV.UK rather than inferring them from a calculator result.",
      },
    ],
    editorialNotes: [
      "ENGINE/RULE REVIEW REQUIRED. packages/calculation-engine/src/finance/wave3/gia-tax.ts hardcodes dividend rates of 8.75% basic and 33.75% higher. GOV.UK publishes 10.75% and 35.75% for 2026/27, the approved ruleset uk-2026-27-v1 records 10.75% / 35.75% / 39.35%, and TAX-011 applies those. TAX-013 therefore contradicts both the ruleset and its sibling calculator. Not fixed here: Phase 2 must not modify the engine. The dividend outputs are deliberately excluded from the worked example above.",
      "The plan's Tier 1 description for this calculator quoted a £1,000 / £500 / £0 Personal Savings Allowance and a £3,000 CGT exemption; both were confirmed correct against GOV.UK.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-015 ========
  {
    calculatorId: "TAX-015",
    title: "Adding and removing VAT",
    summary:
      "Adding VAT and removing it are not the same arithmetic. Removing 20% VAT means dividing by 1.2, not taking 20% off the gross price.",
    purpose: [
      "Adds VAT to a net figure, or extracts the VAT already contained in a gross figure.",
      "Supports the standard 20%, reduced 5% and zero rates, or any rate you enter.",
      "Shows the net, the VAT and the gross so the three can be checked against an invoice.",
    ],
    methodology:
      "VAT is charged as a percentage of the net price, which means the direction of the calculation changes the arithmetic. Going up from a net figure is straightforward multiplication: the VAT is the net amount times the rate, and the gross is the net plus that VAT. Coming down from a gross figure is where the common mistake happens. The gross already represents 120% of the net at the standard rate, so recovering the net means dividing the gross by 1.2 — not subtracting 20% of the gross. Taking 20% off a £120 gross gives £96, when the correct net is £100. The difference grows with the value of the invoice, which is why this is a routine source of bookkeeping error. The calculator applies whichever direction you select, so the net, VAT and gross it returns are always internally consistent.",
    formulaExplanation: {
      formula:
        "Adding VAT: VAT = net × rate, gross = net × (1 + rate). Extracting VAT: net = gross ÷ (1 + rate), VAT = gross − net.",
      steps: [
        "Take the amount you entered and the rate you selected.",
        "If adding, multiply the net by the rate to get the VAT, then add it on.",
        "If extracting, divide the gross by one plus the rate to recover the net, then subtract to get the VAT.",
      ],
    },
    workedExample: {
      scenario:
        "A supplier quotes £250 excluding VAT at the standard rate and the invoice needs to show all three figures.",
      engineInputs: { amount: 250, direction: "add", rate: 0.2 },
      displayInputs: [
        { label: "Amount", display: "£250" },
        { label: "Calculation direction", display: "Add VAT" },
        { label: "VAT rate", display: "20%" },
      ],
      steps: [
        "The net amount is £250.",
        "VAT at the standard 20% rate is £250 × 0.20 = £50.",
        "The gross invoice total is £250 + £50 = £300.",
        "Checking in reverse: £300 ÷ 1.2 returns £250, which confirms the figures are consistent. Taking 20% off £300 would have given £240 — the classic error.",
      ],
      outputs: [
        { key: "net", label: "Net amount", value: 250, format: "currency" },
        { key: "vat", label: "VAT", value: 50, format: "currency" },
        { key: "gross", label: "Gross amount", value: 300, format: "currency" },
      ],
    },
    assumptions: [
      "A single VAT rate applies to the whole amount entered.",
      "The rate you select is the correct rate for the goods or services in question.",
    ],
    limitations: [
      "The calculator does not decide which rate applies — that depends on what is being supplied, and the classifications are detailed.",
      "Zero-rated and exempt supplies are not the same thing: zero-rated supplies are taxable at 0% and count towards the registration threshold, exempt supplies do not.",
      "VAT registration thresholds, the flat rate scheme, partial exemption and the reverse charge are not modelled.",
      "Rounding conventions on multi-line invoices can produce small differences from a single-line calculation.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      {
        title: "VAT rates",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/vat-rates",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Standard rate 20%, reduced rate 5%, zero rate 0%",
      },
      {
        title: "VAT rates on different goods and services",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Which rate applies to which supply",
      },
    ],
    relatedCalculators: [
      { calculatorId: "BUS-002", why: "Work through business margins once VAT has been separated out." },
      { calculatorId: "TAX-018", why: "Corporation Tax is charged on profit after VAT has been accounted for." },
    ],
    faqs: [
      {
        question: "Why can I not just take 20% off the gross price?",
        answer:
          "Because the 20% was charged on the net, not the gross. A £120 gross is 120% of a £100 net, so recovering the net means dividing by 1.2. Taking 20% off £120 gives £96, which is £4 short.",
      },
      {
        question: "What is the difference between zero-rated and exempt?",
        answer:
          "Zero-rated supplies are taxable at 0%, so they count towards the VAT registration threshold and the supplier can generally reclaim input VAT. Exempt supplies are outside the charge entirely and do not carry that reclaim right.",
      },
      {
        question: "Which rate should I use?",
        answer:
          "Most goods and services are standard-rated at 20%. The reduced 5% rate covers things like domestic energy and children's car seats, and the zero rate covers most food and children's clothing. GOV.UK publishes the detailed classifications, and the boundaries are narrower than they look.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-019 ========
  {
    calculatorId: "TAX-019",
    title: "The High Income Child Benefit Charge",
    summary:
      "The charge claws back Child Benefit once adjusted net income passes £60,000, at 1% for every £200 above it, reaching 100% at £80,000. It is assessed on one individual, not on household income.",
    purpose: [
      "Works out the charge from adjusted net income and the number of qualifying children.",
      "Shows how pension contributions and Gift Aid reduce adjusted net income and therefore the charge.",
      "Reports how much more you would need to contribute to remove the charge entirely.",
      "Does not decide whether you should claim Child Benefit — only what the charge would be.",
    ],
    methodology:
      "The charge is assessed on the higher earner in a household, using adjusted net income rather than salary. Adjusted net income is total taxable income less gross pension contributions and less the grossed-up value of Gift Aid donations, which is why a £4,000 pension contribution reduces the figure by the full £4,000. Once adjusted net income exceeds £60,000, the charge takes back 1% of the Child Benefit received for every £200 above that threshold, in whole percentage steps. At £80,000 the charge reaches 100% and claws back the entire amount. Between the two thresholds the effect stacks on top of Income Tax: each extra £100 of income is charged at 40% and also triggers a further half a percent of clawback, which is what makes this band unusually expensive. Because the assessment is individual, two parents each earning £59,000 face no charge at all while a single earner on £80,000 loses the lot.",
    formulaExplanation: {
      formula:
        "Charge % = 1% for every £200 of adjusted net income above £60,000, capped at 100%. Charge = Child Benefit received × charge %.",
      steps: [
        "Add salary and other taxable income together.",
        "Deduct gross pension contributions and the grossed-up value of Gift Aid to give adjusted net income.",
        "If adjusted net income is £60,000 or less, there is no charge.",
        "Otherwise take the excess above £60,000, divide by £200, and round down to whole percentage points.",
        "Apply that percentage to the Child Benefit received, capping at 100% once income reaches £80,000.",
      ],
    },
    workedExample: {
      scenario:
        "Sam earns £68,000 with £2,000 of other income, contributes £4,000 gross to a pension, and has two qualifying children.",
      engineInputs: {
        gross_salary: 68000,
        other_taxable_income: 2000,
        pension_contributions_gross: 4000,
        gift_aid_net: 0,
        children_count: 2,
      },
      displayInputs: [
        { label: "Gross annual salary", display: "£68,000" },
        { label: "Other taxable income", display: "£2,000" },
        { label: "Gross pension contributions", display: "£4,000" },
        { label: "Net Gift Aid donations", display: "£0" },
        { label: "Number of qualifying children", display: "2" },
      ],
      steps: [
        "Total taxable income is £68,000 + £2,000 = £70,000.",
        "The £4,000 gross pension contribution reduces adjusted net income to £66,000.",
        "£66,000 is £6,000 above the £60,000 threshold.",
        "£6,000 ÷ £200 = 30, so 30% of the Child Benefit is clawed back.",
        "Contributing a further £6,000 gross to the pension would bring adjusted net income to £60,000 and remove the charge entirely.",
      ],
      outputs: [
        { key: "adjusted_net_income", label: "Adjusted net income", value: 66000, format: "currency" },
        { key: "charge_percentage", label: "Proportion clawed back", value: 30, format: "percentValue" },
        { key: "pension_top_up_needed_to_eliminate_charge", label: "Further pension contribution to remove the charge", value: 6000, format: "currency" },
      ],
    },
    assumptions: [
      "The charge is assessed on the individual with the higher adjusted net income, and the figures entered are that person's.",
      "Pension contributions entered are gross amounts, which is what reduces adjusted net income.",
      "Gift Aid donations are entered net and grossed up at the basic rate.",
    ],
    limitations: [
      "The Child Benefit amounts this calculator uses are under review — see the note below — so the cash charge it reports should be treated with caution even though the percentage clawed back is correct.",
      "The charge is collected through Self Assessment or, in some cases, through your tax code; the calculator does not model how you will pay it.",
      "Claiming Child Benefit and opting out of payments still protects National Insurance credits and secures a child's National Insurance number, which can matter more than the cash.",
      "Adjusted net income includes rental profits, savings interest, dividends and taxable benefits in kind, and the calculator only knows what you enter.",
    ],
    ruleStatus: "SOURCE VERIFICATION REQUIRED",
    ruleset: RULESET,
    officialSources: [
      {
        title: "High Income Child Benefit Charge",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/child-benefit-tax-charge",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule:
          "Charge applies above £60,000 adjusted net income at 1% per £200, reaching 100% at £80,000",
      },
      {
        title: "Child Benefit rates",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/child-benefit-rates",
        sourceType: "government-guidance",
        verificationStatus: "SOURCE VERIFICATION REQUIRED",
        applicableRule:
          "Weekly Child Benefit rates. GOV.UK shows £27.05 eldest and £17.90 per additional child; the page did not state a tax year, so the applicable period could not be confirmed",
      },
      {
        title: "Tax on your private pension contributions",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/tax-on-your-private-pension",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Gross pension contributions reduce adjusted net income",
      },
    ],
    relatedCalculators: [
      { calculatorId: "TAX-005", why: "Salary sacrifice is the most efficient way to bring adjusted net income back below £60,000." },
      { calculatorId: "TAX-001", why: "See the Income Tax charged on the same income the charge is assessed against." },
      { calculatorId: "PEN-002", why: "Model the pension contribution that would remove the charge." },
    ],
    faqs: [
      {
        question: "Is the charge based on household income?",
        answer:
          "No, and this is the most common misunderstanding. It is assessed on the individual with the higher adjusted net income. Two parents each earning £59,000 face no charge, while a single earner on £80,000 loses the entire benefit.",
      },
      {
        question: "Should I just stop claiming Child Benefit?",
        answer:
          "Not necessarily. You can claim and opt out of receiving payments, which still gives you National Insurance credits towards your State Pension if you are caring for a child under 12, and secures the child's National Insurance number automatically. Stopping the claim entirely forfeits both.",
      },
      {
        question: "How do pension contributions help?",
        answer:
          "Gross pension contributions reduce adjusted net income pound for pound, so they reduce the charge directly. Between £60,000 and £80,000 the combined effect of Income Tax relief and avoided clawback can make contributions unusually efficient — more so with more children.",
      },
      {
        question: "How is the charge actually collected?",
        answer:
          "Usually through Self Assessment, which means registering if you are not already in the system. HMRC has also introduced routes to collect it through PAYE in some circumstances. Check the current position on GOV.UK.",
      },
    ],
    editorialNotes: [
      "ENGINE/RULE REVIEW REQUIRED. packages/calculation-engine/src/finance/wave3/hicbc.ts hardcodes weekly Child Benefit of £25.60 for the eldest child and £16.95 for each additional child, commented as 2026/27 rates. GOV.UK's Child Benefit rates page currently shows £27.05 and £17.90. The GOV.UK page did not state which tax year it covers, so this is recorded as requiring source verification rather than asserted as an error. If confirmed, the engine's annual benefit figure and the resulting cash charge are understated. Not fixed here: Phase 2 must not modify the engine. The benefit and cash-charge outputs are deliberately excluded from the worked example above; the threshold, taper and adjusted-net-income outputs were all verified and are shown.",
      "The £60,000 to £80,000 thresholds and the 1%-per-£200 taper in the plan were confirmed correct against GOV.UK.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== TAX-020 ========
  {
    calculatorId: "TAX-020",
    title: "How student loan repayments are worked out",
    summary:
      "A student loan repayment is a fixed percentage of income above your plan's threshold, not a repayment schedule. The size of the debt makes no difference to what you pay each month.",
    purpose: [
      "Works out repayments for Plan 1, Plan 2, Plan 4, Plan 5 and Postgraduate loans.",
      "Shows the repayment yearly, monthly and weekly.",
      "Makes clear that the amount owed does not affect the monthly repayment.",
      "Does not project when a loan will be cleared or written off.",
    ],
    methodology:
      "UK student loan repayments behave more like a graduate contribution than a conventional loan. Nothing is due on income up to your plan's threshold. Above it, you repay a fixed percentage of the excess: 9% for Plan 1, Plan 2, Plan 4 and Plan 5, and 6% for a Postgraduate loan. The thresholds differ substantially — £26,900 for Plan 1, £29,385 for Plan 2, £33,795 for Plan 4 in Scotland, £25,000 for Plan 5 and £21,000 for Postgraduate — so which plan you are on can change the repayment considerably at the same salary. The outstanding balance is irrelevant to the calculation: someone owing £15,000 and someone owing £60,000 on the same plan and the same salary repay exactly the same amount each month. Interest accrues on the balance and outstanding debt is written off after a period that depends on the plan, so many borrowers never repay in full.",
    formulaExplanation: {
      formula:
        "Annual repayment = repayment rate × (income − plan threshold), where the result is never below zero.",
      steps: [
        "Convert entered income to an annual figure.",
        "Subtract your plan's annual threshold.",
        "If the result is zero or negative, no repayment is due.",
        "Otherwise multiply the excess by 9%, or 6% for a Postgraduate loan.",
        "Divide the annual figure into periodic amounts.",
      ],
    },
    workedExample: {
      scenario:
        "Chloe earns £34,000 and is repaying a Plan 2 loan.",
      engineInputs: {
        income: 34000,
        income_frequency: "annual",
        payroll_frequency: "monthly",
        hours_week: 37.5,
        weeks: 52,
        plan: "Plan 2",
      },
      displayInputs: [
        { label: "Income", display: "£34,000" },
        { label: "Income frequency", display: "Annual" },
        { label: "Repayment plan", display: "Plan 2" },
      ],
      steps: [
        "The Plan 2 annual threshold is £29,385.",
        "Income above the threshold is £34,000 − £29,385 = £4,615.",
        "The repayment rate is 9%, so the annual repayment is £415.35.",
        "That is £34.61 a month, or £7.99 a week.",
        "The balance outstanding does not enter the calculation at any point.",
      ],
      outputs: [
        { key: "repayment_yearly", label: "Repayment for the year", value: 415.35, format: "currency" },
        { key: "repayment_monthly", label: "Repayment per month", value: 34.61, format: "currency" },
        { key: "repayment_weekly", label: "Repayment per week", value: 7.99, format: "currency" },
      ],
    },
    assumptions: [
      "The plan you select is the plan you are actually on, which is recorded by the Student Loans Company rather than chosen.",
      "Repayments are estimated from annual income against the annual threshold.",
      "Income is treated as employment income subject to PAYE.",
    ],
    limitations: [
      "Real payroll assesses each pay period separately, so a bonus month can trigger a repayment even where annual income sits below the threshold — and the annual estimate will not show that.",
      "The calculator does not model interest, the outstanding balance, or the write-off date, so it cannot tell you when the loan will be cleared.",
      "Voluntary overpayments are not modelled, and for many borrowers they are not worthwhile.",
      "Self-employed borrowers repay through Self Assessment on a different assessment basis.",
      "Someone with both an undergraduate and a postgraduate loan repays on both simultaneously; select the undergraduate plan here and use the Take-Home Pay calculator to see the two together.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_STUDENT_LOANS,
      {
        title: "Repaying your student loan",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/repaying-your-student-loan",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How repayments are collected and which plan applies",
      },
    ],
    relatedCalculators: [
      { calculatorId: "TAX-003", why: "See the repayment alongside Income Tax, National Insurance and pension in one take-home figure." },
      { calculatorId: "TAX-001", why: "Understand the Income Tax charged on the same income." },
      { calculatorId: "TAX-005", why: "Salary sacrifice reduces the income student loan repayments are assessed on." },
    ],
    faqs: [
      {
        question: "Does repaying more reduce my monthly payment?",
        answer:
          "No. The monthly repayment depends only on your income and your plan's threshold, never on the balance. Voluntary overpayments shorten the time to clear the loan but change nothing about what comes out of your pay each month.",
      },
      {
        question: "Which plan am I on?",
        answer:
          "It depends on where and when you studied, and it is recorded by the Student Loans Company rather than chosen by you. Plan 4 applies to Scottish borrowers, Plan 5 to more recent English starters. Your online repayment account shows the plan definitively.",
      },
      {
        question: "Should I overpay my student loan?",
        answer:
          "Often not. Because the debt is written off after a set period and repayments are income-based, many borrowers never repay it in full, and overpaying simply hands over money that would otherwise have been written off. Whether it makes sense depends on your expected lifetime earnings and the balance — this is a genuine financial planning question rather than an arithmetic one.",
      },
      {
        question: "Why did my payslip show a repayment when my annual salary is below the threshold?",
        answer:
          "Payroll assesses each pay period against a periodic threshold. A bonus or a month of overtime can push a single period above it and trigger a repayment, even if your annual income is below the annual threshold. This annual estimate cannot reproduce that effect.",
      },
    ],
    lastReviewed: REVIEWED,
  },
];
