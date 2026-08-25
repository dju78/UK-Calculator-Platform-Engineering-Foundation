/**
 * Phase 2 Batch 3: Pensions and Retirement guides.
 *
 * Pension figures checked against GOV.UK on 25 August 2026: the full new State
 * Pension is £241.30 a week (the backfill plan's £221.20 was a 2024/25 figure),
 * 35 qualifying years are needed for the full amount, the annual allowance is
 * £60,000, the lump sum allowance is £268,275, and the normal minimum pension
 * age rises from 55 to 57 on 6 April 2028.
 *
 * Three of this batch's plan labels named calculators that do not exist at the
 * ids given. The ids were treated as authoritative and the corrections are
 * recorded in top40.ts and in each guide's editorial notes.
 *
 * These guides describe how the calculators work. They are not pension advice,
 * and they say so where a reader might reasonably mistake one for the other.
 */
import type { CalculatorGuideDefinition, OfficialSource } from "./types.js";

const REVIEWED = "2026-08-25";
const RULESET = { id: "uk-2026-27-v1", taxYear: "2026/27" } as const;

const SRC_ANNUAL_ALLOWANCE: OfficialSource = {
  title: "Tax on your private pension contributions: annual allowance",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/tax-on-your-private-pension/annual-allowance",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Annual allowance £60,000; tapered where threshold income exceeds £200,000 and adjusted income exceeds £260,000",
};

const SRC_STATE_PENSION: OfficialSource = {
  title: "The new State Pension: what you'll get",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/new-state-pension/what-youll-get",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Full new State Pension £241.30 a week; 35 qualifying years for the full rate where the record began after April 2016",
};

const SRC_AUTO_ENROLMENT: OfficialSource = {
  title: "Workplace pensions: what you, your employer and the government pay",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Minimum total contribution 8% of qualifying earnings — 3% employer, 5% employee — on earnings between £6,240 and £50,270",
  effectivePeriod: "from April 2019",
};

const SRC_LUMP_SUM: OfficialSource = {
  title: "Tax on your private pension contributions: lump sum allowance",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Usually up to 25% of a pension can be taken tax-free, capped by a lump sum allowance of £268,275",
};

const SRC_PENSION_WISE: OfficialSource = {
  title: "Pension Wise: free pension guidance",
  publisher: "MoneyHelper",
  url: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule: "Free impartial guidance on pension options, available from age 50",
};

const SRC_TAX_RELIEF: OfficialSource = {
  title: "Tax on your private pension contributions: tax relief",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Relief is given at your marginal rate; basic rate relief is added automatically under relief at source and higher rates are claimed separately",
};

export const batch3PensionsRetirementGuides: CalculatorGuideDefinition[] = [
  // ======================================================== PEN-001 ========
  {
    calculatorId: "PEN-001",
    title: "Projecting a pension pot",
    summary:
      "A pension pot grows from three things: what you pay in, what your employer pays in, and compounding on both. Charges quietly work in the other direction throughout.",
    purpose: [
      "Projects a pension pot forward from a starting balance and monthly contributions.",
      "Includes employer contributions, which are usually the largest single source of growth early on.",
      "Applies an annual charge, so the projection is net of costs rather than gross.",
      "Flags where contributions approach the annual allowance.",
    ],
    methodology:
      "The projection compounds the existing pot forward at the growth rate you enter, and adds each month's contributions as they are made so that later contributions have less time to grow than earlier ones. Both your contribution and your employer's are included, which matters because for most people the employer contribution is free money that would be lost entirely by opting out. The annual charge is deducted from the growth each year rather than added to the return, which is the honest way round: a 0.5% charge against a 5% return does not leave 4.5% of growth compounding, it removes a share of a growing balance every year, so its cost rises as the pot rises. Over decades that is a substantial number. The calculator also watches total annual contributions against the £60,000 annual allowance, above which a tax charge applies.",
    formulaExplanation: {
      formula:
        "Each month: pot = pot × (1 + net monthly rate) + monthly contributions, where the net rate is the growth rate less the annual charge.",
      steps: [
        "Start from the current pot value.",
        "Compound it forward at the growth rate, net of the annual charge.",
        "Add your monthly contribution and your employer's each month.",
        "Repeat for every month until retirement.",
        "Compare total annual contributions against the annual allowance.",
      ],
    },
    workedExample: {
      scenario:
        "Someone with £50,000 already saved, paying in £300 a month with £200 from their employer, twenty years from retirement, assuming 5% growth and a 0.5% annual charge.",
      engineInputs: {
        current_pot: 50000,
        member_monthly: 300,
        employer_monthly: 200,
        return: 0.05,
        fee: 0.005,
        years: 20,
      },
      displayInputs: [
        { label: "Current pension pot", display: "£50,000" },
        { label: "Your monthly contribution", display: "£300" },
        { label: "Employer monthly contribution", display: "£200" },
        { label: "Expected annual growth rate", display: "5%" },
        { label: "Annual pension fee", display: "0.5%" },
        { label: "Years until retirement", display: "20" },
      ],
      steps: [
        "Total contributions are £500 a month, or £6,000 a year — well below the £60,000 annual allowance.",
        "Over twenty years £120,000 is paid in, of which £48,000 comes from the employer.",
        "The starting £50,000 compounds alongside those contributions at 5% less the 0.5% charge.",
        "The projected pot is about £311,567.",
        "Of that, £170,000 is contributions and the starting balance; the remaining £141,567 is investment growth.",
      ],
      outputs: [
        { key: "projected_pot", label: "Projected pension pot", value: 311566.5982012881, format: "currency" },
        { key: "annual_contributions", label: "Total annual contributions", value: 6000, format: "currency" },
      ],
    },
    assumptions: [
      "Growth is steady at the rate entered, with no volatility.",
      "Contributions continue unchanged for the whole period, with no pay rises, breaks or increases.",
      "The annual charge is applied to the pot each year.",
      "Figures are in nominal terms unless the growth rate you enter is already net of inflation.",
    ],
    limitations: [
      "Real returns are not steady. A pot that averages 5% but arrives at it through good and bad years can end up in a materially different place, especially close to retirement.",
      "Inflation is not applied. A £311,567 pot in twenty years will buy considerably less than £311,567 buys today.",
      "Charges vary and are often layered — a platform fee, a fund charge and transaction costs — so one headline figure may understate the total.",
      "The annual allowance can be tapered for high earners, and is replaced by a much lower money purchase allowance once a pension has been flexibly accessed.",
      "This is a projection, not advice. Pension decisions are difficult to reverse and free impartial guidance is available.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_ANNUAL_ALLOWANCE, SRC_TAX_RELIEF, SRC_PENSION_WISE],
    relatedCalculators: [
      { calculatorId: "PEN-003", why: "See what the auto-enrolment minimum actually contributes on qualifying earnings." },
      { calculatorId: "PEN-002", why: "Model a personal pension where you claim the tax relief yourself." },
      { calculatorId: "PEN-012", why: "Work backwards from the income you want to the pot you need." },
      { calculatorId: "TAX-005", why: "Salary sacrifice changes what a given contribution costs your take-home pay." },
    ],
    faqs: [
      {
        question: "Why does a 0.5% charge matter so much?",
        answer:
          "Because it is charged on the whole pot every year, so its cash cost grows as the pot grows. Over twenty or thirty years the compounded effect of a small percentage is a large sum, and it is one of the few variables you can actually control.",
      },
      {
        question: "Should I include my employer's contribution?",
        answer:
          "Yes. It is part of what lands in the pension, and for most people it is the single strongest argument against opting out — declining it is declining pay.",
      },
      {
        question: "Is the projected pot in today's money?",
        answer:
          "Only if the growth rate you entered is a real rate, already net of inflation. If you entered a nominal rate such as 5%, the figure is in future pounds and will buy less than the same number today.",
      },
      {
        question: "What happens if I go over the annual allowance?",
        answer:
          "Contributions above £60,000 in a year generally attract a tax charge that removes the relief. Unused allowance from the previous three years can sometimes be carried forward, and the allowance is lower for high earners and for anyone who has flexibly accessed a pension.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-002 ========
  {
    calculatorId: "PEN-002",
    title: "How SIPP tax relief actually reaches your pension",
    summary:
      "Under relief at source your provider adds basic rate relief automatically, turning £400 into £500. A higher rate taxpayer must claim the rest separately — and many never do.",
    purpose: [
      "Shows what a net personal contribution becomes once basic rate relief is added.",
      "Identifies the additional relief a higher or additional rate taxpayer can claim.",
      "Projects the resulting pot forward, net of platform charges.",
      "Flags where contributions approach the annual allowance.",
    ],
    methodology:
      "A personal pension such as a SIPP normally operates relief at source. You pay from money that has already been taxed, and the provider reclaims basic rate relief from HMRC and adds it to your pot. Because relief is calculated as a proportion of the gross contribution rather than added on top of the net one, £400 of your money becomes £500 in the pension: the £100 added is 20% of the £500 gross, not 20% of the £400 you paid. If you pay tax above the basic rate, you are entitled to further relief at your marginal rate — but that part does not arrive automatically. It has to be claimed, through Self Assessment or by contacting HMRC, and it is paid to you rather than into the pension. That is the single most commonly missed piece of UK pension tax relief. The projection then compounds the gross contributions forward net of the platform charge.",
    formulaExplanation: {
      formula:
        "Gross contribution = net contribution ÷ 0.8. Provider relief = gross − net. Further relief claimable = gross × (marginal rate − 20%).",
      steps: [
        "Take the net monthly amount you actually pay.",
        "Divide by 0.8 to give the gross contribution the pension receives.",
        "The difference is the basic rate relief the provider reclaims for you.",
        "Multiply the gross contribution by your marginal rate less 20% to give the relief you must claim yourself.",
        "Compound the gross contributions and starting pot forward, net of the platform charge.",
      ],
    },
    workedExample: {
      scenario:
        "A higher rate taxpayer with a £20,000 SIPP paying £400 net a month for twenty years, assuming 5% growth and a 0.5% platform charge.",
      engineInputs: {
        pot: 20000,
        net_monthly: 400,
        marginal_rate: 0.4,
        return: 0.05,
        fee: 0.005,
        years: 20,
      },
      displayInputs: [
        { label: "Current SIPP pot value", display: "£20,000" },
        { label: "Your net monthly contribution", display: "£400" },
        { label: "Marginal tax relief rate", display: "40%" },
        { label: "Expected annual return", display: "5%" },
        { label: "Annual platform fee", display: "0.5%" },
        { label: "Years until retirement", display: "20" },
      ],
      steps: [
        "£400 net divided by 0.8 gives a gross contribution of £500 a month.",
        "The provider reclaims £100 a month of basic rate relief and adds it to the pot automatically.",
        "As a 40% taxpayer, a further £100 a month of relief is claimable — but only if actually claimed.",
        "Unclaimed, that is £1,200 a year, or £24,000 over the twenty years, simply left with HMRC.",
        "Compounding £500 a month plus the starting £20,000 at 5% less charges gives a projected pot of about £239,561.",
      ],
      outputs: [
        { key: "gross_monthly", label: "Gross monthly contribution", value: 500, format: "currency" },
        { key: "provider_relief_monthly", label: "Relief added by your provider", value: 100, format: "currency" },
        { key: "potential_extra_relief_monthly", label: "Further relief you can claim", value: 100, format: "currency" },
        { key: "projected_value", label: "Projected SIPP value", value: 239560.5708604189, format: "currency" },
      ],
    },
    assumptions: [
      "The pension operates relief at source, which is standard for a personal pension or SIPP.",
      "Your marginal rate stays the same throughout, and you have enough income taxed at that rate to claim the relief.",
      "Growth is steady at the rate entered and the platform charge is applied annually.",
    ],
    limitations: [
      "The extra relief above basic rate is paid to you, not into the pension, so it only compounds if you choose to reinvest it.",
      "Tax relief is limited to the higher of your relevant UK earnings and £3,600 gross a year, so you cannot get relief on more than you earn.",
      "Scottish taxpayers have different marginal rates, so the claimable amount differs.",
      "The annual allowance, its taper for high earners, and the much lower money purchase allowance after flexible access are not modelled here.",
      "This is a projection, not advice, and investment returns are not certain.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_TAX_RELIEF, SRC_ANNUAL_ALLOWANCE, SRC_PENSION_WISE],
    relatedCalculators: [
      { calculatorId: "ISA-007", why: "Compare relief now in a pension against tax-free withdrawals from an ISA." },
      { calculatorId: "PEN-001", why: "Model a workplace pension with employer contributions instead." },
      { calculatorId: "TAX-005", why: "Salary sacrifice reaches the same place with a National Insurance saving as well." },
    ],
    faqs: [
      {
        question: "Why does £400 become £500 rather than £480?",
        answer:
          "Because relief is 20% of the gross contribution, not 20% added to the net one. £500 gross taxed at 20% leaves £400, so the £100 added is exactly the tax that would have been paid on £500.",
      },
      {
        question: "How do I claim the higher rate relief?",
        answer:
          "Through your Self Assessment return, or by contacting HMRC directly if you do not file one. It is not automatic, and it is not added to your pension — it comes back to you, usually as a tax code adjustment or a repayment.",
      },
      {
        question: "Can I contribute more than I earn?",
        answer:
          "You can pay in more, but relief is capped at the higher of your relevant UK earnings and £3,600 gross a year. Contributions above that get no relief, which removes most of the point.",
      },
      {
        question: "Is a SIPP better than my workplace pension?",
        answer:
          "Not usually, if your employer contributes to the workplace scheme — that contribution is money a SIPP will not give you. A SIPP is generally a complement rather than a replacement, and this is a genuine planning question rather than an arithmetic one.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-003 ========
  {
    calculatorId: "PEN-003",
    title: "What auto-enrolment actually pays in",
    summary:
      "The 8% minimum is charged on qualifying earnings, not on your whole salary. That band starts at £6,240, so the real contribution is meaningfully lower than 8% of pay.",
    purpose: [
      "Works out employer and employee contributions on the auto-enrolment qualifying earnings basis.",
      "Shows the qualifying earnings figure explicitly, which is where most confusion starts.",
      "Projects the resulting pot forward to retirement.",
    ],
    methodology:
      "Automatic enrolment sets a minimum total contribution of 8% of qualifying earnings, made up of at least 3% from the employer and 5% from the employee. The critical detail is the base. Qualifying earnings are not your whole salary: they are the slice between £6,240 and £50,270 a year. So someone on £35,000 has qualifying earnings of £28,760, not £35,000, and the 8% is charged on the smaller figure. That gap is why real contributions routinely come in below what people expect from the headline percentage — and it also means the effective rate as a share of total pay rises as salary approaches the upper limit and then falls away above it. Many employers use a more generous basis, contributing on full pay rather than the qualifying band, so it is worth checking which basis your scheme uses before assuming the minimum.",
    formulaExplanation: {
      formula:
        "Qualifying earnings = the part of annual pay between £6,240 and £50,270. Contribution = qualifying earnings × the contribution rate.",
      steps: [
        "Take annual pensionable salary.",
        "Deduct the £6,240 lower limit, capping at the £50,270 upper limit, to give qualifying earnings.",
        "Apply the employer rate to give the employer contribution.",
        "Apply the employee rate to give the employee contribution.",
        "Compound the combined contributions and any existing pot forward to retirement.",
      ],
    },
    workedExample: {
      scenario:
        "Someone earning £35,000 on the auto-enrolment minimum of 3% employer and 5% employee, starting from nothing, twenty-five years from retirement at 5% growth.",
      engineInputs: {
        annual_pay: 35000,
        employer_rate: 0.03,
        employee_rate: 0.05,
        current_pot: 0,
        return: 0.05,
        years: 25,
      },
      displayInputs: [
        { label: "Annual pensionable salary", display: "£35,000" },
        { label: "Employer contribution rate", display: "3%" },
        { label: "Employee contribution rate", display: "5%" },
        { label: "Current pot balance", display: "£0" },
        { label: "Expected annual growth rate", display: "5%" },
        { label: "Years until retirement", display: "25" },
      ],
      steps: [
        "Qualifying earnings are £35,000 − £6,240 = £28,760, not the full salary.",
        "The employer's 3% is £862.80 a year.",
        "The employee's 5% is £1,438 a year.",
        "Combined, £2,300.80 goes in annually — which is 6.6% of the £35,000 salary, not 8%.",
        "Compounded at 5% over twenty-five years that produces a pot of about £112,305.",
      ],
      outputs: [
        { key: "qualifying_earnings", label: "Qualifying earnings", value: 28760, format: "currency" },
        { key: "employer_annual", label: "Employer contribution a year", value: 862.8, format: "currency" },
        { key: "employee_annual", label: "Your contribution a year", value: 1438, format: "currency" },
        { key: "projected_pot", label: "Projected pot", value: 112304.83206511481, format: "currency" },
      ],
    },
    assumptions: [
      "The scheme uses the qualifying earnings basis, which is the statutory minimum.",
      "Salary stays flat in nominal terms for the whole period.",
      "Growth is steady at the rate entered, with no charges deducted separately.",
    ],
    limitations: [
      "Many employers contribute on full pay rather than qualifying earnings, or match above the minimum. Check your scheme, because the difference over a career is large.",
      "Salary is held flat, which understates a real career where pay rises and contributions rise with it.",
      "Charges are not deducted in this projection, so the pot is optimistic relative to a real scheme.",
      "The employee's 5% attracts tax relief, so the cost to take-home pay is lower than the cash figure shown.",
      "Defined benefit schemes work on an entirely different basis and are not modelled.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_AUTO_ENROLMENT, SRC_TAX_RELIEF, SRC_ANNUAL_ALLOWANCE],
    relatedCalculators: [
      { calculatorId: "PEN-001", why: "Project a pot from cash contributions rather than percentage rates." },
      { calculatorId: "TAX-003", why: "See what the employee contribution costs your actual take-home pay." },
      { calculatorId: "TAX-005", why: "Salary sacrifice reaches the same contribution for less take-home pay." },
    ],
    faqs: [
      {
        question: "Why is 8% not 8% of my salary?",
        answer:
          "Because the statutory minimum is charged on qualifying earnings — the slice between £6,240 and £50,270 — rather than on total pay. On a £35,000 salary that reduces the effective rate to about 6.6% of what you actually earn.",
      },
      {
        question: "Should I opt out to increase my take-home pay?",
        answer:
          "Opting out forfeits the employer contribution and the tax relief, which together are usually worth considerably more than the increase in take-home pay. It is one of the few decisions where the arithmetic is fairly one-sided.",
      },
      {
        question: "Does my employer have to use the qualifying earnings basis?",
        answer:
          "No — that is the minimum. Many schemes contribute on full basic pay or on total earnings, which produces a bigger pension for the same headline percentage. Your scheme documents will say which basis applies.",
      },
      {
        question: "What if I earn less than £6,240?",
        answer:
          "There are no qualifying earnings, so the statutory minimum produces nothing. Automatic enrolment itself is triggered at a higher earnings level, though you can usually ask to join a scheme voluntarily.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-006 ========
  {
    calculatorId: "PEN-006",
    title: "Are you on track for the retirement you want?",
    summary:
      "This compares the pot you are heading for with the pot your target income would need, after inflation has been applied to that target. The gap is usually larger than people expect.",
    purpose: [
      "Projects your pot to your target retirement age.",
      "Inflates your target income to what it will cost by the time you retire.",
      "Converts that future income into the pot required at your chosen withdrawal rate.",
      "Reports the shortfall or surplus, and the funding ratio between the two.",
    ],
    methodology:
      "The calculation runs from both ends and compares them. Forwards, your existing pot and monthly contributions are compounded to your retirement age. Backwards, your target income is first inflated — because an income that supports you today will cost considerably more in twenty-seven years — and then divided by your withdrawal rate to give the pot needed to sustain it. Dividing by the withdrawal rate is what converts an income into a capital requirement: at 4%, every £1 of annual income needs £25 of pot behind it, so the multiplier is large and small changes in the target income move the required pot enormously. The funding ratio is simply the projected pot as a proportion of the required one, and it is the most useful single number here because it turns two large and slightly unreal figures into one proportion you can act on.",
    formulaExplanation: {
      formula:
        "Future target income = target today × (1 + inflation)^years. Required pot = future target income ÷ withdrawal rate. Funding ratio = projected pot ÷ required pot.",
      steps: [
        "Compound the current pot and monthly contributions forward to the retirement age.",
        "Inflate the target income from today's money to the retirement date.",
        "Divide the inflated income by the withdrawal rate to give the pot required.",
        "Compare the two to give the gap and the funding ratio.",
      ],
    },
    workedExample: {
      scenario:
        "A 40-year-old with £80,000 saved, paying in £500 a month, aiming to retire at 67 on the equivalent of £30,000 a year today, assuming 5% growth, 2.5% inflation and a 4% withdrawal rate.",
      engineInputs: {
        age: 40,
        retirement_age: 67,
        pot: 80000,
        monthly_contribution: 500,
        return: 0.05,
        inflation: 0.025,
        target_today: 30000,
        withdrawal_rate: 0.04,
      },
      displayInputs: [
        { label: "Current age", display: "40" },
        { label: "Target retirement age", display: "67" },
        { label: "Current pension pot", display: "£80,000" },
        { label: "Total monthly contribution", display: "£500" },
        { label: "Expected annual growth rate", display: "5%" },
        { label: "Expected annual inflation rate", display: "2.5%" },
        { label: "Target annual retirement income", display: "£30,000" },
        { label: "Annual withdrawal rate", display: "4%" },
      ],
      steps: [
        "There are twenty-seven years to retirement.",
        "£80,000 plus £500 a month compounded at 5% projects to about £634,142.",
        "£30,000 of income today, inflated at 2.5% for twenty-seven years, costs about £58,434 a year by 67.",
        "At a 4% withdrawal rate that income needs a pot of about £1,460,850 — twenty-five times the income.",
        "The projected pot covers about 43% of that, leaving a gap of roughly £826,708.",
        "The gap is driven mostly by inflation on the target rather than by weak growth on the pot.",
      ],
      outputs: [
        { key: "projected_pot", label: "Projected pot at retirement", value: 634142.0521843818, format: "currency" },
        { key: "future_target_income", label: "Target income in retirement-date money", value: 58434.00054899131, format: "currency" },
        { key: "required_pot", label: "Pot required", value: 1460850.0137247827, format: "currency" },
        { key: "gap", label: "Shortfall", value: -826707.961540401, format: "currency" },
      ],
    },
    assumptions: [
      "Growth and inflation are steady at the rates entered.",
      "Contributions continue unchanged, with no increases as pay rises.",
      "The withdrawal rate you choose is sustainable for as long as you need the income.",
      "The target income is entered in today's money and inflated by the calculator.",
    ],
    limitations: [
      "The State Pension is not included, and for most people it covers a meaningful part of a £30,000 target — so this shortfall overstates the true gap.",
      "Other pensions, ISAs, property and any inheritance are not counted.",
      "A withdrawal rate is a rule of thumb, not a guarantee. Sequence of returns risk means the same average return can succeed or fail depending on the order the years arrive in.",
      "Contributions held flat in nominal terms understate a career where they rise with earnings.",
      "This is a projection, not advice. Free impartial guidance is available, and Pension Wise offers a free appointment from age 50.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      SRC_PENSION_WISE,
      {
        title: "Plan your retirement income",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/plan-retirement-income",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Sources of retirement income and how to check what you will have",
      },
      SRC_STATE_PENSION,
    ],
    relatedCalculators: [
      { calculatorId: "PEN-012", why: "The same question with the State Pension included, which closes much of this gap." },
      { calculatorId: "PEN-007", why: "See what income a given pot would actually produce after tax." },
      { calculatorId: "INV-026", why: "Test whether the withdrawal rate you assumed is realistic over a long retirement." },
    ],
    faqs: [
      {
        question: "Why is the required pot so enormous?",
        answer:
          "Two multipliers stack. Inflation nearly doubles the cost of your target income over twenty-seven years, and a 4% withdrawal rate then requires twenty-five times that income in capital. Small changes to either input move the answer dramatically.",
      },
      {
        question: "Does this include the State Pension?",
        answer:
          "No, and that materially overstates the gap. The full new State Pension is £241.30 a week — around £12,548 a year — which covers a substantial share of a £30,000 target. The retirement target calculator includes it.",
      },
      {
        question: "Is a 4% withdrawal rate safe?",
        answer:
          "It is a widely used rule of thumb derived largely from historical US data, not a guarantee, and it says nothing about your particular sequence of returns. A lower rate needs a bigger pot but survives bad early years better.",
      },
      {
        question: "The gap looks hopeless — what actually moves it?",
        answer:
          "Contributions early, because they compound longest; retiring later, which both shortens the drawdown and lengthens the accumulation; and being realistic about the target. Counting your other pensions and the State Pension usually improves the picture considerably before you change anything at all.",
      },
    ],
    editorialNotes: [
      "The backfill plan labels PEN-006 'Retirement Income Calculator'. That is PEN-007. PEN-006 is the Retirement Calculator and models accumulation towards a target.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-007 ========
  {
    calculatorId: "PEN-007",
    title: "What a pension pot pays you after tax",
    summary:
      "The tax-free lump sum is not income, but the State Pension is — even though it is paid without tax deducted. That combination is what catches people out in the first year of retirement.",
    purpose: [
      "Works out drawdown income from a pot after taking the tax-free lump sum.",
      "Adds the State Pension and any other income to give a total.",
      "Calculates the Income Tax due on the taxable portion.",
      "Reports net annual and monthly income, and the effective tax rate.",
    ],
    methodology:
      "The calculation separates what is taxable from what is not. Up to 25% of the pot can normally be taken as a tax-free lump sum, capped by the lump sum allowance of £268,275, and that money is not income — it never enters the tax calculation. The remainder of the pot is what drawdown income is taken from, at the withdrawal rate you choose. The State Pension is then added, and this is the part that surprises people: it is taxable income, even though it is always paid gross with no tax deducted. HMRC collects the tax on it through the tax code applied to your other income, so a retiree with a modest private pension can find an unexpectedly large deduction taken from that pension to cover tax owed on the State Pension. The Personal Allowance is applied to the combined taxable total and Income Tax charged in the normal bands, giving net income and an effective rate across everything received.",
    formulaExplanation: {
      formula:
        "Taxable income = drawdown income + State Pension + other income. Income Tax is charged on that total after the Personal Allowance. The tax-free lump sum is excluded entirely.",
      steps: [
        "Take the tax-free lump sum, up to 25% of the pot and capped at the lump sum allowance.",
        "Apply the drawdown rate to the remaining pot to give drawdown income.",
        "Add the State Pension entitlement and any other income.",
        "Apply the Personal Allowance and charge Income Tax in the normal bands.",
        "Subtract the tax to give net income.",
      ],
    },
    workedExample: {
      scenario:
        "Someone retiring with a £300,000 pot, taking the 25% tax-free lump sum, drawing 4% of the remainder, with a full State Pension record of 35 qualifying years.",
      engineInputs: {
        pension_pot: 300000,
        take_tax_free_lump_sum: true,
        drawdown_rate: 4,
        qualifying_years: 35,
        other_income: 0,
        jurisdiction: "England/Wales/NI",
      },
      displayInputs: [
        { label: "Pension pot", display: "£300,000" },
        { label: "Take the 25% tax-free lump sum?", display: "Yes" },
        { label: "Drawdown rate", display: "4%" },
        { label: "State Pension qualifying years", display: "35" },
        { label: "Other annual income", display: "£0" },
      ],
      steps: [
        "25% of £300,000 is a £75,000 tax-free lump sum, well within the £268,275 lump sum allowance.",
        "That leaves £225,000 in drawdown, and 4% of it is £9,000 a year.",
        "A full 35-year record gives a State Pension of £241.30 a week, which is £12,547.60 a year.",
        "Total gross income is £21,547.60 — and all of it is taxable, including the State Pension.",
        "After the £12,570 Personal Allowance, £8,977.60 is taxed at 20%: £1,795.52.",
        "Net income is £19,752.08 a year, or £1,646.01 a month, an effective rate of about 8.3%.",
      ],
      outputs: [
        { key: "tax_free_lump_sum", label: "Tax-free lump sum", value: 75000, format: "currency" },
        { key: "drawdown_income", label: "Drawdown income", value: 9000, format: "currency" },
        { key: "state_pension_income", label: "State Pension", value: 12547.6, format: "currency" },
        { key: "total_gross_income", label: "Total gross income", value: 21547.6, format: "currency" },
        { key: "income_tax", label: "Income Tax", value: 1795.52, format: "currency" },
        { key: "total_net_income", label: "Net income for the year", value: 19752.08, format: "currency" },
        { key: "monthly_net_income", label: "Net income a month", value: 1646.01, format: "currency" },
      ],
    },
    assumptions: [
      "The full tax-free lump sum is taken at outset, which is one of several possible approaches.",
      "The State Pension entitlement is estimated from qualifying years alone.",
      "The drawdown rate is applied to the pot after the lump sum has been removed.",
      "The Personal Allowance is available in full against this income.",
    ],
    limitations: [
      "This is an estimate, not a State Pension forecast. Records that began before April 2016 are worked out under transitional rules, and contracted-out periods change the answer. Check your own forecast on GOV.UK.",
      "The pot is not projected forward or drawn down over time, so this is a single year's picture rather than a sustainability test.",
      "Taking the whole lump sum immediately is not always optimal; phasing withdrawals can use allowances more efficiently.",
      "Drawing income flexibly triggers the money purchase annual allowance, sharply reducing what you can still contribute — this is not modelled.",
      "Pension decisions are difficult to reverse. Pension Wise offers a free appointment from age 50 and this is not advice.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_LUMP_SUM,
      SRC_STATE_PENSION,
      {
        title: "Tax when you get a pension",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/tax-on-pension",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Pension income is taxable; tax-free lump sums are limited by the lump sum allowance",
      },
      SRC_PENSION_WISE,
    ],
    relatedCalculators: [
      { calculatorId: "PEN-009", why: "Compare drawdown with buying a guaranteed income through an annuity." },
      { calculatorId: "PEN-012", why: "Work out whether the pot will be there in the first place." },
      { calculatorId: "TAX-001", why: "See how the Income Tax on retirement income is calculated in detail." },
      { calculatorId: "INV-026", why: "Test whether the drawdown rate is sustainable across a long retirement." },
    ],
    faqs: [
      {
        question: "Is the State Pension really taxable?",
        answer:
          "Yes, though it is always paid gross with no tax deducted. HMRC collects the tax through the code applied to your other pension income, which is why that deduction can look surprisingly large in the first year of retirement.",
      },
      {
        question: "Is the 25% lump sum always tax-free?",
        answer:
          "Up to the lump sum allowance of £268,275, yes. Beyond that, the excess is taxable as income. For most pots the 25% figure is the binding one; the allowance only bites on pots above roughly £1.07 million.",
      },
      {
        question: "Will this income last?",
        answer:
          "This calculator shows one year, not a sustainability projection. Whether 4% of the remaining pot is sustainable depends on how long you live, what returns you get and — critically — the order those returns arrive in.",
      },
      {
        question: "Should I take the lump sum all at once?",
        answer:
          "Not necessarily. Phasing withdrawals can spread the use of allowances and keep more of the pot invested, though it also delays access to the cash. It depends on your circumstances, and it is exactly the kind of decision Pension Wise exists to talk through.",
      },
    ],
    editorialNotes: [
      "The backfill plan labels PEN-007 'Pension Drawdown Calculator'. The registry name is Retirement Income Calculator; the calculator does model drawdown income, so the substance matches even though the label does not.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-009 ========
  {
    calculatorId: "PEN-009",
    title: "What an annuity buys you",
    summary:
      "An annuity converts a pot into a guaranteed income for life. The trade is certainty for flexibility — and a level annuity that never rises loses buying power every single year.",
    purpose: [
      "Converts a pension pot into an annuity income at a quoted rate.",
      "Applies the tax-free lump sum first, so only the remainder buys the annuity.",
      "Models escalation, a guarantee period and a spouse's pension.",
      "Shows how long the income takes to return the purchase price.",
    ],
    methodology:
      "The pot is reduced by any tax-free lump sum, and the remainder is the purchase price. The annuity rate you have been quoted is applied to that amount to give the first year's income. The rate is not a market figure the calculator knows — it is specific to you, depending on your age, your health, where you live and the options you select, which is why shopping around and declaring health conditions routinely improves it. Escalation raises the income each year to offset inflation, but it starts from a much lower base, so a level annuity pays more initially and less later. A guarantee period continues payments to your estate if you die early, and a spouse's pension continues a share to a surviving partner; both cost money in the form of a lower starting rate. The years-to-recover figure divides the purchase price by the annual income, showing how long you need to live simply to get your own capital back before the insurer's risk-taking starts to work in your favour.",
    formulaExplanation: {
      formula:
        "Purchase amount = pot − tax-free lump sum. First year income = purchase amount × annuity rate. Years to recover = purchase amount ÷ annual income.",
      steps: [
        "Deduct the tax-free lump sum from the pot to give the purchase amount.",
        "Apply the quoted annuity rate to give the first year's income.",
        "Escalate the income each year if escalation was selected.",
        "Apply any guarantee period and spouse's proportion.",
        "Divide the purchase amount by the annual income to give the recovery period.",
      ],
    },
    workedExample: {
      scenario:
        "Someone with a £300,000 pot takes the 25% tax-free lump sum and buys a level annuity at a quoted rate of 6%, projected over twenty-five years.",
      engineInputs: {
        pension_pot: 300000,
        take_tax_free_lump_sum: true,
        annuity_rate: 6,
        escalation: 0,
        guarantee_period: 0,
        spouse_proportion: 0,
        projection_years: 25,
      },
      displayInputs: [
        { label: "Pension pot", display: "£300,000" },
        { label: "Take the 25% tax-free lump sum?", display: "Yes" },
        { label: "Annuity rate quoted", display: "6%" },
        { label: "Annual escalation", display: "0% — level" },
        { label: "Guarantee period", display: "None" },
        { label: "Spouse's pension", display: "None" },
        { label: "Projection period", display: "25 years" },
      ],
      steps: [
        "A £75,000 tax-free lump sum leaves £225,000 to buy the annuity.",
        "At the quoted 6% rate that produces £13,500 a year, or £1,125 a month.",
        "The annuity is level, so the final year pays exactly the same £13,500 as the first — with far less buying power.",
        "Over twenty-five years the total income is £337,500.",
        "It takes about 17 years just to recover the £225,000 purchase price.",
        "With no guarantee period and no spouse's pension, payments stop entirely on death.",
      ],
      outputs: [
        { key: "tax_free_lump_sum", label: "Tax-free lump sum", value: 75000, format: "currency" },
        { key: "purchase_amount", label: "Amount buying the annuity", value: 225000, format: "currency" },
        { key: "first_year_income", label: "First year income", value: 13500, format: "currency" },
        { key: "monthly_income", label: "Monthly income", value: 1125, format: "currency" },
        { key: "total_income_over_period", label: "Total income over 25 years", value: 337500, format: "currency" },
        { key: "years_to_recover_purchase_price", label: "Years to recover the purchase price", value: 17, format: "number" },
      ],
    },
    assumptions: [
      "The annuity rate entered is one actually quoted to you, not a market average.",
      "Income is paid annually at the stated rate for the whole projection period.",
      "The projection period is a modelling choice, not a life expectancy.",
    ],
    limitations: [
      "Annuity income is taxable, and the figures here are before tax.",
      "A level annuity loses buying power every year. Over a twenty-five year retirement, inflation at even modest rates roughly halves what the same income buys.",
      "Buying an annuity is generally irreversible. Once purchased, the capital is gone and cannot be passed on except through the options selected at outset.",
      "Rates depend heavily on age, health and postcode. Enhanced rates for health conditions are common and are often missed by people who do not shop around.",
      "The years-to-recover figure is not a break-even test for whether an annuity is worthwhile — the point of an annuity is insuring against living a long time, not maximising expected return.",
      "This is a projection, not advice. Pension Wise offers a free appointment from age 50.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      SRC_LUMP_SUM,
      SRC_PENSION_WISE,
      {
        title: "Guaranteed retirement income (annuities) explained",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/taking-your-pension/guaranteed-retirement-income-annuities-explained",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How annuities work, the options available and the effect of shopping around",
      },
    ],
    relatedCalculators: [
      { calculatorId: "PEN-007", why: "Compare with keeping the pot invested and drawing income flexibly." },
      { calculatorId: "PEN-012", why: "Work out whether the pot will reach the size assumed here." },
      { calculatorId: "INV-026", why: "See what a drawdown withdrawal rate would need to be to match this income." },
    ],
    faqs: [
      {
        question: "Why would I accept 17 years just to get my money back?",
        answer:
          "Because an annuity is insurance against living a long time, not an investment. It pays for as long as you live, however long that is. Framing it as a break-even calculation misses what you are actually buying.",
      },
      {
        question: "Should I choose escalation?",
        answer:
          "It protects buying power but starts from a much lower income, so it takes many years to catch up in cash terms. Whether it is worth it depends on how long you expect to need the income and how much inflation risk you can absorb.",
      },
      {
        question: "Can I get a better rate?",
        answer:
          "Very often, yes. Rates vary between providers, and declaring health conditions or lifestyle factors such as smoking can materially increase the income offered. Accepting your existing provider's default quote without comparison is a common and expensive mistake.",
      },
      {
        question: "What happens to the money when I die?",
        answer:
          "With no guarantee period and no spouse's pension, payments simply stop and nothing passes to your estate. Adding either option protects some value but reduces the starting income.",
      },
    ],
    editorialNotes: [
      "The backfill plan labels PEN-009 a '25% Tax-Free Lump Sum (PCLS) Calculator'. The registry's PEN-009 is the Annuity Calculator, and no standalone PCLS calculator exists among the 253. The tax-free lump sum is modelled inside this calculator and inside PEN-007, so the topic is covered.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-011 ========
  {
    calculatorId: "PEN-011",
    title: "Financial independence: the savings rate is the whole game",
    summary:
      "The time to financial independence depends far more on the proportion of income you save than on the amount you earn, because saving more both builds the pot faster and lowers the target.",
    purpose: [
      "Calculates the pot needed to sustain your desired spending at your chosen withdrawal rate.",
      "Estimates how many years it takes to reach it at your current savings rate.",
      "Reports leaner and more generous variants of the target for context.",
      "Shows your current savings rate and progress towards the target.",
    ],
    methodology:
      "The target — often called the FIRE number — is your desired annual spending divided by the withdrawal rate you consider sustainable. At 4% that is twenty-five times your spending. The projection then compounds your current invested assets and your annual savings forward until they reach it. What makes savings rate so dominant is that it works on both sides of the equation at once: saving a larger share of your income means more going in each year, and it also means you are living on less, which lowers the target you are aiming at. Someone saving half their income is filling a smaller bucket faster from both directions, which is why the relationship between savings rate and years to independence is steep rather than linear. Income matters, but only through the savings rate it makes possible — a high earner who spends everything is no closer than a modest earner who saves half.",
    formulaExplanation: {
      formula:
        "Target = desired annual spending ÷ withdrawal rate. Years to reach it = the time for current assets plus annual savings, compounded at the expected return, to equal the target.",
      steps: [
        "Subtract current annual spending from net income to give annual savings.",
        "Divide desired retirement spending by the withdrawal rate to give the target.",
        "Compound current invested assets and annual savings forward at the expected return.",
        "Find the year the projection reaches the target.",
      ],
    },
    workedExample: {
      scenario:
        "A 30-year-old taking home £45,000, spending £25,000, with £20,000 invested, targeting £25,000 of spending in retirement at a 4% withdrawal rate and 5% returns.",
      engineInputs: {
        current_age: 30,
        annual_net_income: 45000,
        current_annual_spending: 25000,
        current_invested_assets: 20000,
        desired_retirement_spending: 25000,
        safe_withdrawal_rate: 4,
        investment_return_rate: 5,
      },
      displayInputs: [
        { label: "Current age", display: "30" },
        { label: "Annual take-home pay", display: "£45,000" },
        { label: "Current annual living expenses", display: "£25,000" },
        { label: "Current invested assets", display: "£20,000" },
        { label: "Desired retirement spending", display: "£25,000" },
        { label: "Safe withdrawal rate", display: "4%" },
        { label: "Investment return rate", display: "5%" },
      ],
      steps: [
        "Annual savings are £45,000 − £25,000 = £20,000, a savings rate of 44.4%.",
        "The target is £25,000 ÷ 4% = £625,000, which is twenty-five times the desired spending.",
        "£20,000 of existing assets is only 3.2% of the way there.",
        "Compounding £20,000 plus £20,000 a year at 5% reaches the target in about 17.9 years.",
        "That puts financial independence at roughly age 48.",
        "Living on £18,750 instead would cut the target to £468,750 and reach it appreciably sooner — from both directions at once.",
      ],
      outputs: [
        { key: "fire_number", label: "Target pot", value: 625000, format: "currency" },
        { key: "years_to_fire", label: "Years to reach it", value: 17.92, format: "number" },
        { key: "projected_fire_age", label: "Age reached", value: 47.92, format: "number" },
        { key: "current_savings_rate_pct", label: "Current savings rate", value: 44.44, format: "percentValue" },
        { key: "annual_savings_amount", label: "Annual savings", value: 20000, format: "currency" },
      ],
    },
    assumptions: [
      "Income, spending and savings all stay flat in real terms.",
      "Returns are steady at the rate entered, with no volatility.",
      "The withdrawal rate is treated as sustainable indefinitely.",
      "All savings are invested rather than held in cash.",
    ],
    limitations: [
      "Withdrawal-rate rules of thumb come largely from historical US market data over specific periods, and are not a guarantee for a UK investor over a different future.",
      "Sequence of returns risk is not modelled: a poor first decade of returns can exhaust a portfolio that the average return suggested was safe.",
      "Retiring well before pension age means bridging years before pensions and the State Pension become accessible — and the normal minimum pension age rises to 57 in April 2028.",
      "Tax on investment returns outside an ISA or pension is not modelled, and wrapper choice materially changes the outcome.",
      "Life is not flat. Children, health, career changes and inflation all move spending in ways a constant figure cannot capture.",
      "This is a projection, not advice.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      SRC_PENSION_WISE,
      {
        title: "Personal pensions: when you can take your pension",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/personal-pensions-your-rights",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Pension savings are not normally accessible before the normal minimum pension age",
      },
      SRC_STATE_PENSION,
    ],
    relatedCalculators: [
      { calculatorId: "INV-026", why: "Test the withdrawal rate this target depends on against different retirement lengths." },
      { calculatorId: "INV-029", why: "See the range of outcomes rather than a single average path." },
      { calculatorId: "ISA-001", why: "An ISA is the usual wrapper for the years before a pension can be touched." },
      { calculatorId: "PEN-012", why: "Model the pension side of the same plan, including the State Pension." },
    ],
    faqs: [
      {
        question: "Why does the savings rate matter more than income?",
        answer:
          "Because it works on both sides at once. Saving more puts more in each year and also lowers the spending you need to fund, which shrinks the target. Income only helps to the extent it raises the savings rate.",
      },
      {
        question: "Where does twenty-five times spending come from?",
        answer:
          "It is the reciprocal of a 4% withdrawal rate. Choosing 3% instead means thirty-three times spending, which is a substantially larger and slower target — the choice of rate is not a detail.",
      },
      {
        question: "Can I access my pension at 48?",
        answer:
          "No. Pension savings are locked until the normal minimum pension age, which rises from 55 to 57 on 6 April 2028, and the State Pension comes much later. Early independence needs assets outside a pension to bridge those years.",
      },
      {
        question: "Is a 4% withdrawal rate safe over forty years?",
        answer:
          "It is far less tested over forty years than over thirty, and the research it comes from was based on a particular market history. A longer retirement generally argues for a lower rate, more flexibility in spending, or both.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PEN-012 ========
  {
    calculatorId: "PEN-012",
    title: "The pot you need, once the State Pension is counted",
    summary:
      "Counting the State Pension changes the arithmetic completely. It covers a large share of a typical target income, so the pot only has to fund what is left.",
    purpose: [
      "Works out the pot needed to hit a target retirement income.",
      "Deducts the State Pension entitlement from the income the pot must provide.",
      "Compares the required pot with what your contributions are projected to reach.",
      "Solves for the monthly contribution needed to close any shortfall.",
    ],
    methodology:
      "The calculation starts from the income you want and subtracts what the State Pension will provide, because only the remainder has to come from your own savings. That step matters more than any other input: a full State Pension is £12,547.60 a year, so on a £30,000 target it covers over 40% of the requirement before your pot does anything at all. The income still needed is divided by your chosen withdrawal rate to give the target pot. Separately, your current pot and monthly contributions are compounded forward to retirement. Comparing the two gives a surplus or a shortfall, and where there is a shortfall the required monthly contribution is solved directly rather than found by trial and error, so the answer is exact rather than approximate.",
    formulaExplanation: {
      formula:
        "Income needed from the pot = target income − State Pension. Target pot = income needed ÷ withdrawal rate. Compare against the projected pot to give the surplus or shortfall.",
      steps: [
        "Estimate the State Pension from qualifying years, if it is being included.",
        "Subtract it from the target income to give the income the pot must provide.",
        "Divide by the withdrawal rate to give the target pot.",
        "Compound the current pot and monthly contributions forward to retirement.",
        "Compare the two, and solve for the contribution needed to close any gap.",
      ],
    },
    workedExample: {
      scenario:
        "Someone wanting £30,000 a year in retirement, with £100,000 saved, paying in £500 a month for twenty-five years at 5% growth, a 4% withdrawal rate and a full State Pension record.",
      engineInputs: {
        target_annual_income: 30000,
        current_pot: 100000,
        monthly_contribution: 500,
        years_to_retirement: 25,
        annual_growth: 5,
        safe_withdrawal_rate: 4,
        include_state_pension: true,
        qualifying_years: 35,
      },
      displayInputs: [
        { label: "Target retirement income", display: "£30,000 a year" },
        { label: "Current pension pot", display: "£100,000" },
        { label: "Monthly contribution", display: "£500" },
        { label: "Years to retirement", display: "25" },
        { label: "Annual growth", display: "5%" },
        { label: "Withdrawal rate in retirement", display: "4%" },
        { label: "Include the State Pension?", display: "Yes" },
        { label: "State Pension qualifying years", display: "35" },
      ],
      steps: [
        "A full 35-year record gives a State Pension of £12,547.60 a year.",
        "That leaves £30,000 − £12,547.60 = £17,452.40 to come from the pot.",
        "At a 4% withdrawal rate the pot needs to be £436,310.",
        "£100,000 plus £500 a month compounded at 5% for twenty-five years projects to about £631,503.",
        "That is a surplus of roughly £195,193, so this plan is comfortably on track.",
        "Only about £167 a month would be needed to hit the target — the current £500 is building a considerable margin.",
      ],
      outputs: [
        { key: "state_pension_income", label: "State Pension", value: 12547.6, format: "currency" },
        { key: "income_needed_from_pot", label: "Income needed from your pot", value: 17452.4, format: "currency" },
        { key: "target_pot", label: "Target pot", value: 436310, format: "currency" },
        { key: "projected_pot", label: "Projected pot", value: 631502.75, format: "currency" },
        { key: "surplus", label: "Surplus", value: 195192.75, format: "currency" },
        { key: "required_monthly_contribution", label: "Monthly contribution actually required", value: 166.76, format: "currency" },
      ],
    },
    assumptions: [
      "The State Pension is estimated from qualifying years, and is assumed to be payable from the start of retirement.",
      "The target income is treated in the same money terms as the growth rate entered.",
      "The withdrawal rate is assumed sustainable for as long as the income is needed.",
    ],
    limitations: [
      "This is not a State Pension forecast. Records that began before April 2016 follow transitional rules, contracted-out periods reduce entitlement, and the State Pension age is later than most target retirement ages — so it may not be payable from day one.",
      "Figures are in today's money only if the growth rate you entered is a real rate above inflation. A nominal rate makes the projected pot look larger than it is.",
      "Tax in retirement is not deducted, and the State Pension is taxable, so the net income will be lower than the target.",
      "Other pensions, ISAs and property are not counted, which understates most people's position.",
      "This is a projection, not advice.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_STATE_PENSION,
      {
        title: "Check your State Pension forecast",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/check-state-pension",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Where to obtain an actual State Pension forecast rather than an estimate",
      },
      SRC_PENSION_WISE,
    ],
    relatedCalculators: [
      { calculatorId: "PEN-006", why: "The same question without the State Pension, and with inflation applied to the target." },
      { calculatorId: "PEN-007", why: "See what the pot would actually pay you after tax." },
      { calculatorId: "PEN-001", why: "Model the contributions building the pot in more detail." },
      { calculatorId: "TAX-020", why: "Understand the deductions from pay before contributions are made." },
    ],
    faqs: [
      {
        question: "How much difference does the State Pension make?",
        answer:
          "A great deal. At £12,547.60 a year it covers over 40% of a £30,000 target, and because the pot only has to fund the remainder at a 4% withdrawal rate, including it cuts the required pot by more than £300,000 in this example.",
      },
      {
        question: "Can I rely on 35 qualifying years?",
        answer:
          "Only if your record supports it. Thirty-five years gives the full new State Pension where your record began after April 2016; records starting earlier, particularly with contracted-out periods, often need more. Check your actual forecast on GOV.UK.",
      },
      {
        question: "Is the projected pot in today's money?",
        answer:
          "Only if the growth rate you entered is already net of inflation. If you entered a nominal rate, both the pot and the target are in future pounds and the comparison still holds — but the figures buy less than they appear to.",
      },
      {
        question: "Why is the required contribution so much lower than what I am paying?",
        answer:
          "Because the existing pot is doing a lot of the work: £100,000 compounding for twenty-five years grows substantially on its own. The surplus is the margin your current contributions are building beyond the target.",
      },
    ],
    editorialNotes: [
      "The backfill plan labels PEN-012 a 'State Pension Age & Forecast Calculator'. The registry's PEN-012 is the Retirement Target Calculator. It uses the State Pension as an input but does not forecast State Pension age; no such calculator exists among the 253.",
      "The plan quoted a full new State Pension of £221.20 a week, described as a 2024/25 figure. GOV.UK publishes £241.30 a week, which is what the engine applies.",
    ],
    lastReviewed: REVIEWED,
  },
];
