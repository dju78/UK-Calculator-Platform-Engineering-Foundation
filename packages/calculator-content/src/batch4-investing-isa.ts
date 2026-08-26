/**
 * Phase 2 Batch 4: Investing, Wealth and ISA guides.
 *
 * ISA figures checked against GOV.UK on 25 August 2026: the overall
 * subscription limit is £20,000 for 2026/27, the Lifetime ISA sub-limit is
 * £4,000 with a 25% bonus capped at £1,000, accounts must be opened before 40
 * and contributions stop at 50, the first-home property cap is £450,000 and
 * unauthorised withdrawals carry a 25% charge.
 *
 * Two of these calculators produce model output rather than statutory figures.
 * INV-026 returns a withdrawal rate derived from the return assumptions you
 * give it, and INV-029 returns a distribution from a stochastic simulation.
 * Neither is a safe-withdrawal recommendation, and the guides say so plainly
 * rather than letting a large number speak for itself.
 */
import type { CalculatorGuideDefinition, OfficialSource } from "./types.js";

const REVIEWED = "2026-08-25";
const RULESET = { id: "uk-2026-27-v1", taxYear: "2026/27" } as const;

const SRC_ISA: OfficialSource = {
  title: "Individual Savings Accounts (ISAs)",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/individual-savings-accounts",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Overall ISA subscription limit £20,000, shared across cash, stocks and shares, innovative finance and Lifetime ISAs",
  effectivePeriod: "2026 to 2027 tax year",
};

const SRC_LISA: OfficialSource = {
  title: "Lifetime ISA",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/lifetime-isa",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "£4,000 annual limit counting towards the overall ISA allowance; 25% government bonus capped at £1,000 a year; account opened before 40, contributions until 50",
};

const SRC_LISA_WITHDRAWAL: OfficialSource = {
  title: "Withdrawing money from your Lifetime ISA",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/lifetime-isa/withdrawing-money-from-your-lifetime-isa",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Charge-free withdrawal for a first home costing £450,000 or less, from age 60, or on terminal illness; 25% charge otherwise",
};

const SRC_CGT_ALLOWANCE: OfficialSource = {
  title: "Capital Gains Tax: allowances",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/capital-gains-tax/allowances",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule: "Annual exempt amount £3,000 for individuals",
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

const SRC_PENSION_RELIEF: OfficialSource = {
  title: "Tax on your private pension contributions: tax relief",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule: "Pension contributions receive relief at your marginal rate",
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

export const batch4InvestingIsaGuides: CalculatorGuideDefinition[] = [
  // ======================================================== ISA-001 ========
  {
    calculatorId: "ISA-001",
    title: "Growing a stocks and shares ISA",
    summary:
      "Everything inside an ISA is free of Income Tax and Capital Gains Tax, and none of it ever needs reporting. The allowance is annual and cannot be carried forward.",
    purpose: [
      "Projects a stocks and shares ISA forward from a starting balance and annual subscriptions.",
      "Applies an annual account charge, so the projection is net of costs.",
      "Shows how much of the £20,000 allowance the subscription uses.",
      "Reports the allowance still available in the current tax year.",
    ],
    methodology:
      "The projection compounds the existing balance and each year's subscription forward at the return you enter, net of the account charge. What makes an ISA distinct is not the arithmetic — it is what does not happen. Dividends inside the wrapper are not taxed, gains are not subject to Capital Gains Tax, and nothing has to be declared on a tax return however large the account grows. That matters more over time than it does at first, because a small unwrapped portfolio may fall within the dividend allowance and the annual exempt amount anyway, while a large one will not. The £20,000 limit is per tax year and use-it-or-lose-it: unused allowance cannot be carried into the next year, which is why the calculator reports what is left. Charges work against you in exactly the way returns work for you, compounding on a growing balance, so a difference of a quarter of a percent is worth considerably more than it looks.",
    formulaExplanation: {
      formula:
        "Each year: balance = (balance + annual subscription) × (1 + return − charge). Allowance used = subscription ÷ £20,000.",
      steps: [
        "Start from the current ISA balance.",
        "Add the annual subscription.",
        "Compound at the expected return, net of the account charge.",
        "Repeat for each year of the horizon.",
        "Compare the subscription against the £20,000 annual allowance.",
      ],
    },
    workedExample: {
      scenario:
        "Someone with £10,000 in a stocks and shares ISA subscribing £12,000 a year for twenty years, assuming 6% growth and a 0.25% account charge.",
      engineInputs: {
        start: 10000,
        annual_subscription: 12000,
        return: 0.06,
        fee: 0.0025,
        years: 20,
      },
      displayInputs: [
        { label: "Starting ISA balance", display: "£10,000" },
        { label: "Annual ISA contribution", display: "£12,000" },
        { label: "Expected annual return", display: "6%" },
        { label: "Annual account fee", display: "0.25%" },
        { label: "Investment horizon", display: "20 years" },
      ],
      steps: [
        "£12,000 a year uses 60% of the £20,000 allowance, leaving £8,000 unused each year.",
        "Over twenty years £240,000 is subscribed, on top of the starting £10,000.",
        "Compounded at 6% less the 0.25% charge, the projected value is about £470,726.",
        "So roughly £220,726 of the final balance is investment growth.",
        "All of that growth is free of Capital Gains Tax and Income Tax, and none of it needs reporting.",
        "The £8,000 of allowance left unused each year cannot be carried forward — it is simply lost.",
      ],
      outputs: [
        { key: "projected_value", label: "Projected ISA value", value: 470725.78, format: "currency" },
        { key: "remaining_allowance", label: "Allowance still available this year", value: 8000, format: "currency" },
      ],
    },
    assumptions: [
      "Returns are steady at the rate entered, with no volatility.",
      "The full subscription is made every year for the whole horizon.",
      "The account charge is applied annually to the balance.",
    ],
    limitations: [
      "Real investment returns are not steady, and a twenty-year average conceals years that are very good and very bad.",
      "Figures are in nominal terms unless the return you entered is already net of inflation.",
      "Charges are frequently layered — a platform fee plus a fund charge plus transaction costs — so a single headline figure may understate the true drag.",
      "The £20,000 limit is shared across all ISA types you subscribe to in the same tax year, not per account.",
      "Investments can fall as well as rise, and an ISA wrapper protects against tax, not against loss.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_ISA, SRC_CGT_ALLOWANCE, SRC_DIVIDENDS],
    relatedCalculators: [
      { calculatorId: "ISA-002", why: "Check how much of the £20,000 allowance you have already used across every ISA type." },
      { calculatorId: "TAX-013", why: "See what the same portfolio would cost in tax outside an ISA wrapper." },
      { calculatorId: "ISA-007", why: "Compare the ISA wrapper against a pension for long-term saving." },
      { calculatorId: "INV-001", why: "Model the same contributions without the wrapper." },
    ],
    faqs: [
      {
        question: "Can I carry unused allowance into next year?",
        answer:
          "No. The ISA allowance is strictly per tax year and any part you do not use is lost on 6 April. That is why people subscribe before the end of the tax year rather than waiting.",
      },
      {
        question: "Do I have to declare ISA income on a tax return?",
        answer:
          "No. Income and gains inside an ISA are not taxable and are not reportable, however large the account becomes. That administrative simplicity is a real part of the value, separate from the tax saved.",
      },
      {
        question: "Is the £20,000 limit per ISA or in total?",
        answer:
          "In total, across every ISA you subscribe to in the same tax year. Putting £12,000 into a stocks and shares ISA leaves £8,000 to share between any cash, innovative finance or Lifetime ISA subscriptions.",
      },
      {
        question: "Does a 0.25% charge really matter?",
        answer:
          "More than it looks. It is charged on the whole balance each year, so its cash cost grows as the account grows, and it compounds against you for the entire horizon. Over twenty years the difference between 0.25% and 1% is a large sum.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== ISA-002 ========
  {
    calculatorId: "ISA-002",
    title: "Tracking your ISA allowance across accounts",
    summary:
      "The £20,000 allowance is shared across every ISA you subscribe to in the same tax year. It is the total that counts, not the number of accounts.",
    purpose: [
      "Adds up subscriptions across cash, stocks and shares, innovative finance and Lifetime ISAs.",
      "Compares the total against the £20,000 annual limit.",
      "Reports the allowance still available before the tax year ends.",
    ],
    methodology:
      "There is no arithmetic subtlety here — the value is in the aggregation. The overall ISA subscription limit is £20,000 for the tax year, and it applies to the sum of what you put into every type of ISA, not separately to each one. The Lifetime ISA has its own lower sub-limit of £4,000, and crucially that £4,000 counts towards the overall £20,000 rather than sitting on top of it, which is the single most commonly misunderstood part of the rules. So someone paying the maximum £4,000 into a Lifetime ISA has £16,000 left for everything else, not £20,000. Because subscriptions are frequently spread across providers, and because the allowance resets on 6 April with no carry-forward, keeping a running total is the practical problem this calculator solves.",
    formulaExplanation: {
      formula:
        "Total subscribed = cash + stocks and shares + innovative finance + Lifetime ISA. Remaining = £20,000 − total subscribed.",
      steps: [
        "Add together everything subscribed to each ISA type in the current tax year.",
        "Check the Lifetime ISA element against its own £4,000 sub-limit.",
        "Subtract the total from the £20,000 overall allowance.",
      ],
    },
    workedExample: {
      scenario:
        "Someone has paid £3,000 into a cash ISA, £12,000 into a stocks and shares ISA and £4,000 into a Lifetime ISA this tax year.",
      engineInputs: { cash: 3000, stocks: 12000, innovative: 0, lisa: 4000 },
      displayInputs: [
        { label: "Cash ISA contributions this tax year", display: "£3,000" },
        { label: "Stocks & Shares ISA contributions", display: "£12,000" },
        { label: "Innovative Finance ISA contributions", display: "£0" },
        { label: "Lifetime ISA contributions", display: "£4,000" },
      ],
      steps: [
        "Total subscriptions are £3,000 + £12,000 + £0 + £4,000 = £19,000.",
        "The Lifetime ISA element is exactly at its £4,000 sub-limit, so it will attract the maximum £1,000 government bonus.",
        "That £4,000 counts towards the overall £20,000 — it is not additional to it.",
        "£1,000 of allowance remains for the rest of the tax year.",
        "Any part of that £1,000 not used by 5 April is lost, with no carry-forward.",
      ],
      outputs: [
        { key: "total", label: "Total subscribed this tax year", value: 19000, format: "currency" },
        { key: "remaining", label: "Allowance remaining", value: 1000, format: "currency" },
      ],
    },
    assumptions: [
      "All figures are subscriptions made in the current tax year.",
      "The overall limit is £20,000 and the Lifetime ISA sub-limit is £4,000.",
    ],
    limitations: [
      "Transfers of ISA money from previous years do not count as new subscriptions and should not be entered here.",
      "Junior ISAs have a separate allowance in the child's name and are outside this calculation.",
      "The calculator does not check eligibility for a Lifetime ISA, which depends on your age.",
      "Rules on subscribing to more than one ISA of the same type in a tax year have changed over time; check the current position on GOV.UK.",
      "Withdrawing and replacing money is only allowed without using fresh allowance in a flexible ISA, and not all providers offer one.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_ISA, SRC_LISA, SRC_LISA_WITHDRAWAL],
    relatedCalculators: [
      { calculatorId: "ISA-001", why: "Project what a stocks and shares ISA subscription will grow into." },
      { calculatorId: "ISA-007", why: "Decide whether the next contribution is better in an ISA or a pension." },
      { calculatorId: "TAX-013", why: "See the tax cost of investing outside a wrapper once the allowance is used up." },
    ],
    faqs: [
      {
        question: "Does the Lifetime ISA £4,000 come out of the £20,000?",
        answer:
          "Yes, and this is the most commonly misunderstood ISA rule. Paying the full £4,000 into a Lifetime ISA leaves £16,000 for all other ISA types, not £20,000.",
      },
      {
        question: "Do transfers use up my allowance?",
        answer:
          "No. Moving existing ISA money between providers or between ISA types is a transfer, not a new subscription, provided you use the formal transfer process rather than withdrawing and re-paying it yourself.",
      },
      {
        question: "What happens if I go over £20,000?",
        answer:
          "The excess is not entitled to ISA treatment. HMRC will normally identify it after the tax year and instruct the provider to remove the excess subscription along with any income on it, so it is worth tracking as you go.",
      },
      {
        question: "Is the Lifetime ISA bonus worth the restrictions?",
        answer:
          "The 25% bonus is substantial, but the money is only accessible without charge for a first home costing £450,000 or less, from age 60, or on terminal illness. Other withdrawals carry a 25% charge, which removes more than the bonus added.",
      },
    ],
    editorialNotes: [
      "The backfill plan labels ISA-002 the 'Lifetime ISA (LISA) Calculator'. The registry's ISA-002 is the ISA Allowance Calculator, which tracks the overall limit including the Lifetime ISA sub-limit. The plan's LISA figures — £4,000 limit, 25% bonus, £1,000 maximum, £450,000 property cap — were all confirmed correct against GOV.UK and are covered here.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== ISA-007 ========
  {
    calculatorId: "ISA-007",
    title: "SIPP or ISA: where the next contribution should go",
    summary:
      "A pension gives relief now and taxes withdrawals later; an ISA does the reverse. The gap between your tax rate now and in retirement is what decides the answer.",
    purpose: [
      "Compares the same net monthly contribution routed into a SIPP and into an ISA.",
      "Applies tax relief on the way into the pension and Income Tax on the way out.",
      "Accounts for the 25% tax-free lump sum.",
      "Reports which wrapper leaves more in your hands after tax.",
    ],
    methodology:
      "Both wrappers grow free of tax internally, so the difference is entirely about when tax is charged. Money into a SIPP is grossed up by basic rate relief immediately, and a higher rate taxpayer can reclaim more, so a given amount of take-home pay buys a materially larger invested balance. That advantage is repaid later, because withdrawals above the tax-free lump sum are taxed as income. An ISA gets no relief going in, but nothing at all is taxed coming out. The arithmetic therefore turns on rate arbitrage: contributing at a 40% marginal rate and withdrawing at 20% captures the difference, while contributing and withdrawing at the same rate makes the two wrappers nearly equivalent apart from the tax-free lump sum, which tips it towards the pension. The comparison here assumes the higher rate relief is actually reinvested into the SIPP; if it is spent instead, much of the pension's advantage disappears.",
    formulaExplanation: {
      formula:
        "SIPP net value = (grossed-up contributions compounded) × (25% tax-free + 75% taxed at the retirement rate). ISA net value = net contributions compounded, taxed at nothing.",
      steps: [
        "Gross up the net contribution by basic rate relief, and add reclaimed higher rate relief if it is reinvested.",
        "Compound both the SIPP and the ISA balances at the same return.",
        "Take 25% of the SIPP tax-free, capped by the lump sum allowance.",
        "Tax the remaining SIPP balance at the expected retirement rate.",
        "Compare the two net figures.",
      ],
    },
    workedExample: {
      scenario:
        "A higher rate taxpayer saving £500 net a month for twenty-five years at 6%, expecting to be a basic rate taxpayer in retirement, reinvesting the tax refund into the SIPP.",
      engineInputs: {
        monthly_contribution_net: 500,
        years_to_invest: 25,
        annual_growth_rate: 6.0,
        current_tax_band: "higher",
        retirement_tax_band: "basic",
        reinvest_tax_relief: true,
      },
      displayInputs: [
        { label: "Monthly net contribution", display: "£500" },
        { label: "Years until retirement", display: "25" },
        { label: "Expected annual investment return", display: "6%" },
        { label: "Current income tax band", display: "Higher" },
        { label: "Expected retirement tax band", display: "Basic" },
        { label: "Reinvest tax refund into SIPP?", display: "Yes" },
      ],
      steps: [
        "£500 of take-home pay buys £625 gross in the SIPP after basic rate relief, and the reclaimed higher rate relief is reinvested on top.",
        "The same £500 buys exactly £500 of ISA.",
        "After twenty-five years at 6% the ISA is worth about £346,497, all of it accessible tax-free.",
        "The SIPP is worth about £577,495 gross — considerably more, because more was invested from the start.",
        "A quarter of that, £144,374, is taken tax-free; the remainder is taxed at the basic rate in retirement.",
        "The SIPP is worth about £490,871 net, roughly £144,374 more than the ISA.",
        "The advantage comes from contributing at 40% and withdrawing mostly at 20%.",
      ],
      outputs: [
        { key: "isa_final_value", label: "ISA value", value: 346496.98, format: "currency" },
        { key: "sipp_gross_pot_value", label: "SIPP value before tax", value: 577494.97, format: "currency" },
        { key: "sipp_tax_free_lump_sum", label: "SIPP tax-free lump sum", value: 144373.74, format: "currency" },
        { key: "sipp_net_after_tax_value", label: "SIPP value after tax", value: 490870.72, format: "currency" },
        { key: "net_retirement_difference", label: "Difference in favour of the pension", value: 144373.74, format: "currency" },
      ],
    },
    assumptions: [
      "The tax refund on higher rate relief is reinvested into the SIPP rather than spent.",
      "The retirement tax band entered is the rate that will apply to withdrawals.",
      "Both wrappers earn the same return and carry no charges in this comparison.",
      "The whole SIPP is withdrawn under the assumed retirement rate rather than drawn gradually across bands.",
    ],
    limitations: [
      "The comparison ignores access. ISA money is available at any time; pension money is locked until the normal minimum pension age, which rises to 57 in April 2028. For anyone who may need the money sooner, that is decisive regardless of the arithmetic.",
      "It assumes a single retirement tax rate. In practice withdrawals can be spread across years and bands, often at a lower effective rate than assumed here.",
      "The State Pension is taxable and uses part of the Personal Allowance, which raises the effective rate on pension withdrawals for many people.",
      "Employer contributions are not modelled, and where they exist they usually dominate this comparison entirely.",
      "Charges, the annual allowance and its taper, and inheritance treatment all differ between the wrappers and are not covered.",
      "This is a projection, not advice. Pension decisions are difficult to reverse.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [SRC_PENSION_RELIEF, SRC_LUMP_SUM, SRC_ISA, SRC_PENSION_WISE],
    relatedCalculators: [
      { calculatorId: "PEN-002", why: "Model the SIPP side in detail, including the relief you have to claim yourself." },
      { calculatorId: "ISA-001", why: "Model the ISA side on its own." },
      { calculatorId: "PEN-007", why: "See what the pension would actually pay after tax in retirement." },
      { calculatorId: "TAX-005", why: "Salary sacrifice can beat both by saving National Insurance as well." },
    ],
    faqs: [
      {
        question: "Why does the pension win here?",
        answer:
          "Because relief is given at 40% going in and tax is charged at 20% coming out, with a quarter escaping tax entirely. That rate difference is the whole advantage — contributing and withdrawing at the same rate would make the two wrappers close to equivalent.",
      },
      {
        question: "What if I spend the tax refund instead of reinvesting it?",
        answer:
          "Much of the pension's advantage disappears. The refund is a real part of what makes the pension larger, and it only compounds if it goes back in. Many higher rate taxpayers never even claim it.",
      },
      {
        question: "Does the ISA have any advantage at all?",
        answer:
          "Access, which the arithmetic here cannot price. ISA money is available at any age for any reason. Pension money is locked until at least 57 from April 2028, so for a goal before then the ISA is the only realistic option.",
      },
      {
        question: "Should I use one or the other?",
        answer:
          "Most people end up using both, for different time horizons. This calculator compares them on tax alone; access, employer contributions and your own circumstances usually matter more than the tax difference.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== INV-001 ========
  {
    calculatorId: "INV-001",
    title: "What regular investing builds",
    summary:
      "Regular contributions and compounding do most of the work over a long horizon. Fees compound too, quietly, in the opposite direction.",
    purpose: [
      "Projects an investment forward from a lump sum plus regular monthly contributions.",
      "Applies an annual platform or fund charge to the growth.",
      "Shows the effect of a horizon on the final value.",
    ],
    methodology:
      "The projection compounds an opening balance forward while adding contributions each month, so money invested early has longer to grow than money invested late. That timing effect is why the final figure is dominated by the early years of a long horizon even though the contributions are identical throughout. The annual charge is deducted from the return, and the important point about it is that it is charged on the whole balance rather than on the growth, so its cash cost rises every year as the balance rises. On a twenty-year horizon that turns a fraction of a percent into a meaningful share of the final value. Nothing here models tax, so the figure represents a wrapper-free view: inside an ISA or a pension it is the full amount, while in a general investment account dividends and gains would be taxable along the way and on disposal.",
    formulaExplanation: {
      formula:
        "Each month: value = value × (1 + net monthly rate) + monthly contribution, where the net rate is the expected return less the annual charge.",
      steps: [
        "Start from the initial investment.",
        "Compound it at the expected return, net of the annual charge.",
        "Add the monthly contribution each month.",
        "Repeat for every month of the horizon.",
      ],
    },
    workedExample: {
      scenario:
        "£10,000 invested with £500 a month added for twenty years, assuming 6% growth and a 0.25% annual charge.",
      engineInputs: { start: 10000, monthly: 500, return: 0.06, fee: 0.0025, years: 20 },
      displayInputs: [
        { label: "Initial investment", display: "£10,000" },
        { label: "Monthly contribution", display: "£500" },
        { label: "Expected annual return", display: "6%" },
        { label: "Annual platform/fund fee", display: "0.25%" },
        { label: "Investment horizon", display: "20 years" },
      ],
      steps: [
        "£500 a month over twenty years is £120,000 of contributions.",
        "Adding the initial £10,000 gives £130,000 of money actually paid in.",
        "Compounded at 6% less the 0.25% charge, the projected value is about £250,616.",
        "So roughly £120,616 — about 48% of the final value — is growth rather than contributions.",
        "Extending the horizon lengthens the period the early contributions compound over, which is where most of the additional value would come from.",
      ],
      outputs: [
        { key: "projected_value", label: "Projected value", value: 250615.54, format: "currency" },
      ],
    },
    assumptions: [
      "Returns are steady at the rate entered, with no volatility.",
      "Contributions are made every month without fail and are never increased.",
      "The annual charge is applied to the balance each year.",
    ],
    limitations: [
      "Real returns are volatile. Two portfolios averaging 6% can end up materially apart depending on when the good and bad years fall, particularly if money is being withdrawn.",
      "Inflation is not applied unless the return you entered is a real rate, so the figure is in future pounds.",
      "Tax is not modelled. Outside an ISA or pension, dividends and gains are taxable, which reduces the outcome.",
      "Charges are often layered across a platform fee, a fund charge and transaction costs, so one figure may understate the drag.",
      "Investments can fall as well as rise, and past returns are not a reliable indicator of future ones.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Investing beginner's guide",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/savings/investing/investing-beginners-guide",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Investment risk, charges and time horizon",
      },
      SRC_ISA,
    ],
    relatedCalculators: [
      { calculatorId: "ISA-001", why: "Run the same contributions inside a tax-free ISA wrapper." },
      { calculatorId: "INV-002", why: "See the underlying compounding mechanics on a single lump sum." },
      { calculatorId: "INV-029", why: "Replace the single average return with a range of possible outcomes." },
      { calculatorId: "TAX-013", why: "See what the tax would be if this were held outside a wrapper." },
    ],
    faqs: [
      {
        question: "Why does the horizon matter more than the contribution?",
        answer:
          "Because each contribution compounds for however long remains. Money added in year one compounds for twenty years; money added in year nineteen compounds for one. Lengthening the horizon multiplies the effect on everything already invested.",
      },
      {
        question: "Is this figure in today's money?",
        answer:
          "Only if the return you entered is a real rate net of inflation. A nominal 6% produces a nominal figure, which will buy noticeably less in twenty years than the same number does today.",
      },
      {
        question: "Should I invest a lump sum or spread it out?",
        answer:
          "The arithmetic generally favours investing sooner, because more time compounding beats less. Spreading it out reduces the risk of investing everything just before a fall, which is a question about how much volatility you can tolerate rather than about expected return.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== INV-002 ========
  {
    calculatorId: "INV-002",
    title: "How compounding frequency changes the answer",
    summary:
      "Interest compounded more often earns interest on interest sooner, so 5% compounded monthly is worth more than 5% compounded annually. The effective annual rate is what makes the two comparable.",
    purpose: [
      "Compounds a lump sum forward at a nominal rate and a chosen compounding frequency.",
      "Reports the interest earned separately from the final value.",
      "Converts the nominal rate into an effective annual rate for comparison.",
    ],
    methodology:
      "A nominal rate on its own is not enough to know what you will earn, because it says nothing about how often interest is added. Compounding divides the nominal rate by the number of periods in a year and applies it that many times, so each period's interest starts earning interest immediately rather than waiting until the year end. That is why 5% compounded monthly beats 5% compounded annually, and why daily beats monthly by a smaller further margin — the benefit rises with frequency but with diminishing returns, approaching a ceiling as compounding becomes continuous. The effective annual rate expresses the whole arrangement as the single annual rate that would produce the same result if compounded just once, which is the only sound basis for comparing two products quoted differently. It is the same idea as the AER on a savings account.",
    formulaExplanation: {
      formula:
        "Future value = P × (1 + r ÷ m)^(m × t), where P is the principal, r the nominal annual rate, m the compounding periods per year and t the years. Effective annual rate = (1 + r ÷ m)^m − 1.",
      steps: [
        "Divide the nominal annual rate by the number of compounding periods per year.",
        "Raise one plus that periodic rate to the power of the total number of periods.",
        "Multiply by the principal to give the future value.",
        "Subtract the principal to give the interest earned.",
        "Compute the effective annual rate to make the quote comparable.",
      ],
    },
    workedExample: {
      scenario:
        "£10,000 invested for ten years at a nominal 5% a year, compounded monthly.",
      engineInputs: { P: 10000, nominal_rate: 0.05, m: 12, years: 10 },
      displayInputs: [
        { label: "Principal amount", display: "£10,000" },
        { label: "Nominal annual interest rate", display: "5%" },
        { label: "Compounding periods per year", display: "12" },
        { label: "Investment term", display: "10 years" },
      ],
      steps: [
        "The monthly rate is 5% ÷ 12, applied 120 times over ten years.",
        "£10,000 grows to £16,470.09.",
        "Interest earned is £6,470.09.",
        "The effective annual rate is 5.1162%, not 5% — the extra 0.1162 points is the value of compounding twelve times rather than once.",
        "At annual compounding the same £10,000 would reach £16,288.95, so monthly compounding is worth about £181 more over the decade.",
      ],
      outputs: [
        { key: "future_value", label: "Future value", value: 16470.0949769028, format: "currency" },
        { key: "interest_earned", label: "Interest earned", value: 6470.094976902801, format: "currency" },
      ],
    },
    assumptions: [
      "The rate stays fixed for the whole term.",
      "No money is added or withdrawn during the term.",
      "Interest is reinvested rather than paid away.",
    ],
    limitations: [
      "Tax is not modelled. Interest outside an ISA may be taxable beyond the Personal Savings Allowance.",
      "Inflation is not applied, so the future value is in nominal pounds.",
      "Real savings and investment rates rarely stay fixed for a decade.",
      "If interest is paid out rather than reinvested, compounding does not happen at all and the result is simple interest.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Tax on savings interest",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/apply-tax-free-interest-on-savings",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Personal Savings Allowance on interest earned outside an ISA",
      },
      {
        title: "Savings accounts explained",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/savings/types-of-savings/savings-accounts-what-you-need-to-know",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "AER and comparing accounts quoted on different compounding bases",
      },
    ],
    relatedCalculators: [
      { calculatorId: "INV-001", why: "Add regular contributions to the same compounding engine." },
      { calculatorId: "ISA-001", why: "Compound the same money inside a tax-free wrapper." },
      { calculatorId: "PEN-001", why: "See compounding applied over a full working life." },
    ],
    faqs: [
      {
        question: "Why is the effective rate higher than the rate quoted?",
        answer:
          "Because interest is added twelve times a year rather than once, and each addition immediately starts earning interest itself. The effective annual rate restates that as the single annual rate producing the same result.",
      },
      {
        question: "Is daily compounding much better than monthly?",
        answer:
          "Only marginally. The benefit of more frequent compounding rises quickly from annual to monthly and then flattens, approaching a ceiling. Going from monthly to daily changes the effective rate by a very small amount.",
      },
      {
        question: "Which rate should I compare between accounts?",
        answer:
          "The effective annual rate, or the AER that savings accounts quote, since it puts products with different compounding frequencies on the same basis. Comparing nominal rates alone can point you at the worse account.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== INV-026 ========
  {
    calculatorId: "INV-026",
    title: "Testing a withdrawal rate against a portfolio",
    summary:
      "This models what a portfolio's own return assumptions imply about sustainable withdrawals. It is a model output, not a safe rate — and it will often exceed the familiar 4% rule.",
    purpose: [
      "Tests a chosen withdrawal rate against a portfolio over a stated retirement length.",
      "Derives a rate implied by your equity and bond return assumptions.",
      "Reports how long the portfolio would last at the tested rate.",
      "Shows the rate at which capital would be preserved rather than depleted.",
    ],
    methodology:
      "The calculation blends your equity and bond real return assumptions in proportion to the allocation you set, giving a portfolio return net of inflation. From that it derives two figures. The capital preservation rate is simply the blended real return: withdraw only that and the portfolio's real value is maintained indefinitely. The recommended rate is higher, because it permits the capital to be drawn down across the retirement length you specified rather than preserved forever. The tested rate you enter is then run against the portfolio to see how long it lasts. The critical caveat is what this model does not contain: it uses a constant return, so it cannot express sequence of returns risk — the fact that a bad first decade can exhaust a portfolio whose average return looked perfectly adequate. That is the dominant risk in retirement drawdown, and its absence is why the derived rate should be treated as an upper bound from a smooth model rather than as a safe withdrawal rate.",
    formulaExplanation: {
      formula:
        "Blended real return = equity share × equity real return + bond share × bond real return. Capital preservation rate = the blended real return. The tested rate is applied annually to see how long the portfolio survives.",
      steps: [
        "Blend the equity and bond real returns by the allocation.",
        "Report the blended return as the capital preservation rate.",
        "Derive a rate that depletes the portfolio over the stated retirement length.",
        "Apply the tested withdrawal rate to the portfolio and project its longevity.",
      ],
    },
    workedExample: {
      scenario:
        "A £600,000 portfolio, 60% equities and 40% bonds, assuming 5% real on equities and 1.5% real on bonds, tested at a 4% withdrawal rate over a 30-year retirement.",
      engineInputs: {
        portfolio_value: 600000,
        retirement_years: 30,
        equity_allocation_pct: 60,
        expected_equity_return: 5.0,
        expected_bond_return: 1.5,
        custom_withdrawal_pct: 4.0,
        use_guardrails: false,
      },
      displayInputs: [
        { label: "Total retirement pot value", display: "£600,000" },
        { label: "Retirement duration", display: "30 years" },
        { label: "Equity allocation", display: "60%" },
        { label: "Expected equity real return", display: "5% a year" },
        { label: "Expected bond real return", display: "1.5% a year" },
        { label: "Test withdrawal rate", display: "4%" },
        { label: "Guyton-Klinger guardrails", display: "Off" },
      ],
      steps: [
        "The blended real return is 60% × 5% + 40% × 1.5% = 3.6% above inflation.",
        "That 3.6% is the capital preservation rate: withdraw only that and the portfolio's real value is maintained.",
        "The tested 4% gives £24,000 a year, or £2,000 a month.",
        "Because 4% is only slightly above the 3.6% preservation rate, the portfolio depletes very slowly and the model projects it lasting 66 years.",
        "The rate the model derives for depleting the portfolio across 30 years is 5.51%, giving £33,060 a year.",
        "That 5.51% is well above the familiar 4% rule, which is a signal about the smoothness of the model rather than about safety.",
      ],
      outputs: [
        { key: "recommended_swr_pct", label: "Rate implied by these assumptions", value: 5.51, format: "percentValue" },
        { key: "tested_annual_income", label: "Income at the tested rate", value: 24000, format: "currency" },
        { key: "projected_longevity_years", label: "Projected portfolio longevity", value: 66, format: "number" },
        { key: "capital_preservation_rate_pct", label: "Capital preservation rate", value: 3.6, format: "percentValue" },
      ],
    },
    assumptions: [
      "Returns are entered as real returns, already net of inflation.",
      "The blended return is achieved smoothly every year, with no volatility.",
      "The allocation is held constant and rebalanced throughout retirement.",
      "Withdrawals are taken at the start of each year at the stated rate.",
    ],
    limitations: [
      "The model uses a constant return, so it cannot represent sequence of returns risk — the single most important danger in drawdown. A portfolio that meets its average return but suffers a poor first decade can fail where this model shows success.",
      "The derived rate is an output of the assumptions you supplied. Optimistic return inputs produce an optimistic rate, and it should not be read as a safe withdrawal rate.",
      "Longevity figures beyond a normal retirement length are an artefact of a smooth model rather than a meaningful prediction.",
      "Tax on withdrawals is not modelled, and it materially reduces spendable income from a pension.",
      "Charges are not deducted, and they come directly out of the return the whole model rests on.",
      "This is a projection, not advice. Free impartial guidance is available.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      SRC_PENSION_WISE,
      {
        title: "Taking your pension as a number of lump sums or flexible income",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/taking-your-pension/flexible-retirement-income-pension-drawdown",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How flexible drawdown works and the risk of exhausting the pot",
      },
    ],
    relatedCalculators: [
      { calculatorId: "INV-029", why: "Replace the smooth return with a distribution, which is where sequence risk becomes visible." },
      { calculatorId: "PEN-007", why: "See what a drawdown income actually delivers after tax." },
      { calculatorId: "PEN-011", why: "The withdrawal rate chosen here determines the size of a financial independence target." },
    ],
    faqs: [
      {
        question: "Why is the derived rate higher than the 4% rule?",
        answer:
          "Because this model assumes a smooth constant return, while the 4% rule was derived from historical sequences that included severe downturns. Removing volatility removes the main reason a portfolio fails, so a smooth model will always look more generous.",
      },
      {
        question: "What is sequence of returns risk?",
        answer:
          "The risk that poor returns arrive early, while the portfolio is at its largest and you are still withdrawing from it. Two retirements with identical average returns can end very differently depending on the order those returns come in — and a constant-return model cannot show that.",
      },
      {
        question: "What is the capital preservation rate?",
        answer:
          "The blended real return on your portfolio. Withdraw only that and, on these assumptions, the portfolio's real value is maintained rather than run down. It is the cautious end of the range.",
      },
      {
        question: "Should I use the rate this produces?",
        answer:
          "Treat it as an upper bound produced by smooth assumptions, not as a plan. Running the same portfolio through a simulation that includes volatility gives a much more realistic picture of the risk.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== INV-029 ========
  {
    calculatorId: "INV-029",
    title: "Modelling a range of outcomes instead of one",
    summary:
      "A single average return hides the range. Simulating many volatile paths shows the spread of outcomes, and the spread is usually much wider than people expect.",
    purpose: [
      "Simulates many possible investment paths using a mean return and a volatility assumption.",
      "Reports the median outcome and the 10th, 25th, 75th and 90th percentiles.",
      "Estimates the probability of reaching a target and of running out entirely.",
      "Replaces a single point projection with a distribution.",
    ],
    methodology:
      "Instead of applying one return every year, the simulation draws a different random return for each year of each path, from a distribution defined by the mean return and volatility you enter. Running a thousand such paths produces a thousand different endings, and the useful information is in their spread rather than in any single one. The median is the middle outcome — half of the paths did better, half worse — and it sits below the mean because a few very good paths pull the average up without being typical. The percentiles describe the range: the 10th is a poor but entirely plausible outcome, the 90th a good one. The probability of ruin counts the paths that hit zero, which is the number that matters most when withdrawals are being taken. Presenting a distribution rather than a point estimate is the whole purpose, because a single projection implies a precision that volatile markets do not offer.",
    formulaExplanation: {
      formula:
        "For each of many paths, and each year: value = (value + contribution − withdrawal) × (1 + a return drawn at random from a distribution with the given mean and volatility). The endings are then sorted into percentiles.",
      steps: [
        "Draw a random annual return from the distribution defined by the mean and volatility.",
        "Apply contributions or withdrawals for the year, then the return.",
        "Repeat for every year of the horizon to complete one path.",
        "Repeat for the number of simulated paths requested.",
        "Sort the outcomes and report the median, the percentiles, and how many paths reached the target or hit zero.",
      ],
    },
    workedExample: {
      scenario:
        "£100,000 invested with £12,000 added each year for twenty years, assuming a 7% mean return with 15% volatility, against a £1,000,000 target, over a thousand simulated paths.",
      engineInputs: {
        initial_investment: 100000,
        annual_contribution: 12000,
        annual_withdrawal: 0,
        expected_return_pct: 7.0,
        volatility_pct: 15.0,
        horizon_years: 20,
        simulations_count: 1000,
        target_wealth: 1000000,
      },
      displayInputs: [
        { label: "Initial investment", display: "£100,000" },
        { label: "Annual contribution / savings", display: "£12,000" },
        { label: "Annual retirement spending", display: "£0" },
        { label: "Expected mean return", display: "7% a year" },
        { label: "Annual volatility", display: "15%" },
        { label: "Simulation timeframe", display: "20 years" },
        { label: "Number of simulated paths", display: "1,000" },
        { label: "Target wealth goal", display: "£1,000,000" },
      ],
      steps: [
        "The median outcome is about £779,979 — half the paths finished above this and half below.",
        "The 10th percentile is about £415,590 and the 90th about £1,529,945, a spread of more than a million pounds on identical inputs.",
        "Only 33.1% of paths reached the £1,000,000 target, despite the mean return of 7% suggesting it should be close.",
        "No path ran out of money, because contributions are being added and nothing is withdrawn.",
        "The mean outcome of about £908,349 is well above the median, because a minority of very strong paths pull the average up.",
        "The gap between the mean and the median is exactly why a single average-return projection misleads.",
      ],
      outputs: [
        { key: "median_terminal_wealth", label: "Median outcome", value: 779978.56, format: "currency" },
        { key: "percentile_10th", label: "10th percentile", value: 415589.99, format: "currency" },
        { key: "percentile_90th", label: "90th percentile", value: 1529945.06, format: "currency" },
        { key: "probability_of_reaching_target_pct", label: "Chance of reaching the target", value: 33.1, format: "percentValue" },
        { key: "probability_of_ruin_pct", label: "Chance of running out", value: 0, format: "percentValue" },
        { key: "expected_mean_wealth", label: "Mean outcome", value: 908349.49, format: "currency" },
      ],
    },
    assumptions: [
      "Annual returns are drawn independently from a distribution defined by the mean and volatility you enter.",
      "Contributions and withdrawals happen once a year.",
      "The simulation is reproducible, so the same inputs always produce the same distribution.",
    ],
    limitations: [
      "The model assumes returns are independent from year to year and follow a well-behaved distribution. Real markets show crashes, recoveries and correlations that such a model understates, so the true tails are usually fatter than the simulation suggests.",
      "Everything depends on the mean and volatility you supply. Those are assumptions, not knowledge, and the output inherits all their uncertainty.",
      "Inflation is not applied unless the mean return you entered is a real return.",
      "Tax and charges are not modelled, and both reduce every path.",
      "A probability from a simulation is a property of the model, not a fact about the future.",
      "This is a projection, not advice.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Investing beginner's guide: understanding risk",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/savings/investing/investing-beginners-guide",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Investment risk, volatility and the range of possible outcomes",
      },
      SRC_PENSION_WISE,
    ],
    relatedCalculators: [
      { calculatorId: "INV-001", why: "Compare the single average-return projection this distribution replaces." },
      { calculatorId: "INV-026", why: "See what the same assumptions imply for a withdrawal rate, without volatility." },
      { calculatorId: "PEN-011", why: "Test how robust a financial independence target is to a poor sequence of returns." },
    ],
    faqs: [
      {
        question: "Why is the median lower than the mean?",
        answer:
          "Because the distribution of outcomes is skewed. A small number of exceptionally strong paths pull the average up without being typical, so the median — the middle outcome — is the more representative figure to plan around.",
      },
      {
        question: "Why did only a third of paths reach the target when the mean return was 7%?",
        answer:
          "Because volatility drags on compounded growth. A sequence of returns averaging 7% ends up below what a steady 7% would produce, and only the better paths clear the target. This is precisely the gap a single-rate projection hides.",
      },
      {
        question: "Does a 0% chance of ruin mean it is safe?",
        answer:
          "No. Nothing is being withdrawn here and contributions are being added every year, so no path can reach zero. The ruin probability only becomes meaningful once withdrawals are being taken.",
      },
      {
        question: "Can I rely on these probabilities?",
        answer:
          "They describe the model, not the future. The assumptions about mean return and volatility drive everything, and real markets behave less politely than the distribution assumes, so extreme outcomes are more likely in reality than the simulation implies.",
      },
    ],
    lastReviewed: REVIEWED,
  },
];
