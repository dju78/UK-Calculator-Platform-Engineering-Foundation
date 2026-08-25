/**
 * Phase 2 Batch 2: Mortgages and Property guides.
 *
 * Statutory figures checked against GOV.UK and Revenue Scotland on 25 August
 * 2026. Two of the backfill plan's property figures were stale and were not
 * carried across: the plan states an Additional Dwelling Supplement of 6% when
 * Revenue Scotland publishes 8% from 5 December 2024, and it describes lender
 * stress testing as "3% above standard variable rate" when the FCA rule in
 * MCOB 11.6.18R is a minimum assumed rise of 1% over five years. The engine
 * applies 8% ADS, which is correct.
 *
 * Every worked example figure came from a live run of the calculation engine.
 */
import type { CalculatorGuideDefinition, OfficialSource } from "./types.js";

const REVIEWED = "2026-08-25";
const RULESET = { id: "uk-2026-27-v1", taxYear: "2026/27" } as const;

const SRC_SDLT: OfficialSource = {
  title: "Stamp Duty Land Tax: residential property rates",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Nil to £125,000; 2% to £250,000; 5% to £925,000; 10% to £1.5m; 12% above. Additional property surcharge 5%. First-time buyer relief: nil to £300,000, 5% to £500,000, withdrawn above £500,000",
};

const SRC_LBTT: OfficialSource = {
  title: "Land and Buildings Transaction Tax: residential property",
  publisher: "Revenue Scotland",
  url: "https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Nil to £145,000; 2% to £250,000; 5% to £325,000; 10% to £750,000; 12% above. First-time buyer relief raises the nil rate band to £175,000",
  effectivePeriod: "from 1 April 2021",
};

const SRC_ADS: OfficialSource = {
  title: "Additional Dwelling Supplement",
  publisher: "Revenue Scotland",
  url: "https://revenue.scot/taxes/land-buildings-transaction-tax/additional-dwelling-supplement-ads",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "8% of the whole purchase price where consideration is £40,000 or more",
  effectivePeriod: "transactions on or after 5 December 2024",
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

const SRC_CGT_ALLOWANCE: OfficialSource = {
  title: "Capital Gains Tax: allowances",
  publisher: "GOV.UK",
  url: "https://www.gov.uk/capital-gains-tax/allowances",
  sourceType: "government-guidance",
  verificationStatus: "VERIFIED",
  applicableRule: "Annual exempt amount £3,000 for individuals",
};

const SRC_MCOB: OfficialSource = {
  title: "MCOB 11.6: Responsible lending, and responsible financing of home purchase plans",
  publisher: "Financial Conduct Authority",
  url: "https://www.handbook.fca.org.uk/handbook/MCOB/11/6.html",
  sourceType: "regulator",
  verificationStatus: "VERIFIED",
  applicableRule:
    "MCOB 11.6.18R: lenders must consider likely interest rates over at least five years and must assume a rise of at least 1% over that period, unless the rate is fixed for five years or more",
};

export const batch2MortgagesPropertyGuides: CalculatorGuideDefinition[] = [
  // ======================================================== PRO-001 ========
  {
    calculatorId: "PRO-001",
    title: "How a repayment mortgage is calculated",
    summary:
      "A repayment mortgage charges interest on the balance outstanding each month, so the monthly payment is fixed but the split between interest and capital shifts steadily over the term.",
    purpose: [
      "Works out the monthly payment on a repayment mortgage from price, deposit, rate and term.",
      "Shows the loan amount and the loan-to-value that results from your deposit.",
      "Totals the interest payable across the full term.",
      "Assumes one interest rate for the whole term, which is not how UK mortgages are actually sold.",
    ],
    methodology:
      "The monthly payment comes from the standard amortising loan formula. Interest is charged each month on whatever capital is still outstanding, and the payment is set at the level that clears the balance exactly at the end of the term. Because the balance falls every month, the interest portion of each payment falls and the capital portion rises, which is why progress feels slow at first and accelerates later. Two things dominate the total interest: the rate and the term. Extending a term reduces the monthly payment but increases total interest substantially, because the balance stays high for longer. The loan itself is simply the price less your deposit, and the ratio between them is the loan-to-value that determines which rate tier a lender will offer you in the first place.",
    formulaExplanation: {
      formula:
        "Monthly payment = L × r ÷ (1 − (1 + r)^−n), where L is the loan, r is the monthly interest rate and n is the number of monthly payments.",
      steps: [
        "Subtract the deposit from the purchase price to give the loan amount.",
        "Divide the annual interest rate by twelve to get a monthly rate.",
        "Multiply the term in years by twelve to get the number of payments.",
        "Apply the amortising payment formula to find the fixed monthly payment.",
        "Multiply the payment by the number of months and subtract the loan to give total interest.",
      ],
    },
    workedExample: {
      scenario:
        "A couple buy a £320,000 house with a £64,000 deposit on a 25-year repayment mortgage at 4.5%.",
      engineInputs: { price: 320000, deposit: 64000, rate: 4.5, years: 25, type: "repayment" },
      displayInputs: [
        { label: "Property purchase price", display: "£320,000" },
        { label: "Deposit amount", display: "£64,000" },
        { label: "Annual interest rate", display: "4.5%" },
        { label: "Mortgage term", display: "25 years" },
        { label: "Mortgage repayment type", display: "Repayment" },
      ],
      steps: [
        "The loan is £320,000 − £64,000 = £256,000.",
        "A £64,000 deposit on a £320,000 property is 20%, so the loan-to-value is 80%.",
        "At 4.5% over 300 monthly payments the amortising formula gives £1,422.93 a month.",
        "Across the full term the payments total £426,879.34, of which £170,879.34 is interest.",
        "Interest exceeds two thirds of the original loan, which is what a quarter-century of borrowing costs at this rate.",
      ],
      outputs: [
        { key: "loan", label: "Loan amount", value: 256000, format: "currency" },
        { key: "monthly_payment", label: "Monthly payment", value: 1422.93, format: "currency" },
        { key: "total_interest", label: "Total interest over the term", value: 170879.34, format: "currency" },
      ],
    },
    assumptions: [
      "One interest rate applies for the whole term.",
      "Payments are made monthly, on time, and are never varied.",
      "Interest is calculated monthly on the outstanding balance.",
    ],
    limitations: [
      "UK mortgages are almost never fixed for the full term. You will typically remortgage every two to five years onto a different rate, so the total interest figure is an illustration of one scenario rather than a forecast.",
      "Product fees, valuation fees, legal costs and any early repayment charges are excluded.",
      "Stamp duty, insurance and ground rent are not included in the monthly figure.",
      "Interest-only mortgages behave completely differently: the balance never falls, so no capital is repaid.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Mortgages: how they work",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/mortgage-types",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Repayment versus interest-only mortgage structures",
      },
      SRC_MCOB,
    ],
    relatedCalculators: [
      { calculatorId: "PRO-002", why: "Work out how much a lender would actually be willing to advance you." },
      { calculatorId: "PRO-003", why: "See how the interest and capital split changes across the term." },
      { calculatorId: "PRO-004", why: "See what overpaying would do to the term and the total interest." },
      { calculatorId: "PRO-010", why: "Loan-to-value decides which rate tier you can access." },
    ],
    faqs: [
      {
        question: "Why does a longer term cost so much more overall?",
        answer:
          "Because interest is charged on the balance outstanding, and a longer term keeps that balance high for longer. The monthly payment falls, but you pay it many more times and on a slower-shrinking debt, so total interest rises sharply.",
      },
      {
        question: "Will my payment really stay the same?",
        answer:
          "Only while your rate does. Most UK mortgages fix for two to five years and then revert to a variable rate, so the payment usually changes at least once. This calculation shows what one constant rate would produce.",
      },
      {
        question: "Why is so much of my early payment interest?",
        answer:
          "Interest is charged on the balance, and the balance is at its largest at the start. As capital is repaid the interest portion shrinks and the capital portion grows, so the balance falls slowly at first and much faster later.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-002 ========
  {
    calculatorId: "PRO-002",
    title: "How much a lender will actually advance",
    summary:
      "Affordability is capped twice: once by a multiple of income, and again by whether you could still afford the payments at a stressed interest rate. The lower cap wins.",
    purpose: [
      "Estimates the maximum mortgage from an income multiple and a stressed affordability test.",
      "Takes existing monthly debt commitments into account.",
      "Applies whichever of the two caps is lower, which is how lenders actually decide.",
      "Adds your deposit to give an indicative maximum purchase price.",
    ],
    methodology:
      "Lenders apply two separate ceilings and lend the lower of them. The first is a straightforward multiple of income, commonly around 4.5 times, which acts as a blunt cap on total borrowing. The second is an affordability test: the lender works out what monthly payment you could sustain — a proportion of your income, less existing debt commitments — and then asks how much could be borrowed at a stressed interest rate rather than the rate you are being offered. The stress matters because the FCA requires lenders to consider likely rates over at least five years and to assume a rise of at least one percentage point, unless the rate is fixed for five years or longer. Stressing the payment shrinks the sustainable loan considerably: the same monthly capacity buys much less borrowing at 8% than at 4.5%. Existing debt bites twice, because it reduces the payment you can sustain before the stressed calculation even begins.",
    formulaExplanation: {
      formula:
        "Maximum mortgage = the lower of (income × multiple) and the loan whose payment at the stress rate equals (income × payment ratio ÷ 12) − monthly debt.",
      steps: [
        "Multiply income by the income multiple to get the first cap.",
        "Take the payment-to-income ratio to find the monthly payment you could sustain.",
        "Subtract existing monthly debt commitments from that figure.",
        "Work out the loan whose monthly payment at the stress rate equals that remaining capacity.",
        "Take the lower of the two caps, and add the deposit to give a maximum purchase price.",
      ],
    },
    workedExample: {
      scenario:
        "Someone earning £60,000 with a £50,000 deposit and £250 a month of existing debt, tested at an 8% stress rate over 25 years.",
      engineInputs: {
        income: 60000,
        deposit: 50000,
        stress_rate: 0.08,
        term: 25,
        multiple: 4.5,
        payment_ratio: 0.35,
        monthly_debt: 250,
      },
      displayInputs: [
        { label: "Primary annual income", display: "£60,000" },
        { label: "Deposit amount", display: "£50,000" },
        { label: "Stress test interest rate", display: "8%" },
        { label: "Mortgage term", display: "25 years" },
        { label: "Income multiple", display: "4.5" },
        { label: "Max payment-to-income ratio", display: "0.35" },
        { label: "Monthly debt commitments", display: "£250" },
      ],
      steps: [
        "The income multiple cap is £60,000 × 4.5 = £270,000.",
        "A 35% payment-to-income ratio gives £60,000 × 0.35 ÷ 12 = £1,750 a month.",
        "Existing debt of £250 a month reduces sustainable capacity to £1,500.",
        "A £1,500 monthly payment at the stressed 8% over 25 years supports a loan of about £194,347.",
        "The stress test is the binding constraint, so the maximum mortgage is £194,347 rather than £270,000.",
        "Adding the £50,000 deposit gives an indicative maximum purchase price of about £244,347.",
        "Clearing the £250 of monthly debt would lift sustainable capacity back to £1,750 and raise the cap materially.",
      ],
      outputs: [
        { key: "max_mortgage", label: "Maximum mortgage", value: 194346.78390388627, format: "currency" },
        { key: "max_price", label: "Indicative maximum purchase price", value: 244346.78390388627, format: "currency" },
        { key: "monthly_payment_cap", label: "Sustainable monthly payment", value: 1500, format: "currency" },
      ],
    },
    assumptions: [
      "The income multiple and payment-to-income ratio you enter reflect the lender you intend to approach; both vary between lenders.",
      "The stress rate is the rate the lender tests against, not the rate you would pay.",
      "Income is treated as a single annual figure before tax.",
    ],
    limitations: [
      "This is an estimate, not a decision in principle. Lenders assess credit history, employment type, dependants, committed expenditure and the property itself, none of which appear here.",
      "Self-employed, contract, bonus and commission income are assessed differently and often more conservatively.",
      "Some lenders allow higher multiples above an income threshold, or for specific professions, and some apply a lower multiple at high loan-to-value.",
      "The calculator does not model the deposit's effect on the rate you would be offered, which itself affects affordability.",
      "Stamp duty, legal fees and moving costs come out of the same deposit, so the maximum purchase price is optimistic if the deposit is all you have.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      SRC_MCOB,
      {
        title: "How much can I borrow for a mortgage?",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/how-much-can-you-afford-to-borrow-for-a-mortgage",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How lenders assess borrowing capacity",
      },
    ],
    relatedCalculators: [
      { calculatorId: "PRO-001", why: "Turn the maximum borrowing into an actual monthly payment at a real rate." },
      { calculatorId: "PRO-010", why: "Check what loan-to-value your deposit gives at the price you are considering." },
      { calculatorId: "PRO-023", why: "Stamp duty comes out of the same cash as the deposit." },
    ],
    faqs: [
      {
        question: "Why is the stress test lower than my income multiple?",
        answer:
          "Because it asks a harder question. The multiple caps borrowing against income; the stress test asks whether you could still make the payments if rates rose. At a stressed rate the same monthly capacity supports a much smaller loan, so it frequently binds first.",
      },
      {
        question: "Does clearing a credit card really increase what I can borrow?",
        answer:
          "Often substantially. Monthly commitments come straight off the payment you can sustain before the stressed loan is calculated, and at stressed rates each £100 a month of freed capacity supports several thousand pounds of extra borrowing.",
      },
      {
        question: "Is 4.5 times income a hard limit?",
        answer:
          "No. It is a common cap rather than a statutory one, and lenders operate above it in a limited proportion of their lending, often for higher earners or specific professions. Do not assume it, and do not assume it is unavailable.",
      },
      {
        question: "Why do two lenders give me very different answers?",
        answer:
          "Because the multiple, the payment ratio, the stress rate and the treatment of your particular income are all lender choices. That variation is exactly why a broker or a decision in principle is worth more than any calculator.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-003 ========
  {
    calculatorId: "PRO-003",
    title: "Where your mortgage balance actually is",
    summary:
      "Amortisation explains why the balance barely moves in the early years. The payment is level, but the split between interest and capital is not.",
    purpose: [
      "Shows the balance still outstanding after a given number of months.",
      "Confirms the level monthly payment for the loan, rate and term.",
      "Makes the shape of the capital and interest split visible.",
    ],
    methodology:
      "The monthly payment on a repayment mortgage is set once, at the level that clears the balance exactly at the end of the term. What changes month by month is what that payment is doing. Interest is charged on the balance outstanding, so at the start — when the balance is at its largest — most of the payment is absorbed by interest and only a small remainder reduces the debt. Each month the balance is slightly smaller, so slightly less interest is charged and slightly more capital is repaid. The effect compounds, which is why the balance curve is shallow at first and steepens noticeably in the second half of the term. Working out the balance at any point means applying the payment forward month by month, or equivalently valuing the remaining payments at the loan's own interest rate.",
    formulaExplanation: {
      formula:
        "Remaining balance = L × (1 + r)^m − P × ((1 + r)^m − 1) ÷ r, where m is the number of monthly payments already made and P is the monthly payment.",
      steps: [
        "Work out the level monthly payment for the original loan, rate and term.",
        "For each elapsed month, charge interest on the outstanding balance.",
        "Deduct the payment, so the difference reduces the capital.",
        "Repeat for the number of months elapsed to give the balance now.",
      ],
    },
    workedExample: {
      scenario:
        "A £240,000 mortgage at 4.5% over 25 years, five years in.",
      engineInputs: { balance: 240000, rate: 4.5, years: 25, months_elapsed: 60 },
      displayInputs: [
        { label: "Mortgage loan balance", display: "£240,000" },
        { label: "Annual interest rate", display: "4.5%" },
        { label: "Total mortgage term", display: "25 years" },
        { label: "Months already elapsed", display: "60" },
      ],
      steps: [
        "The level monthly payment on £240,000 at 4.5% over 300 months is £1,334.",
        "Sixty payments of £1,334 total £80,040 paid in.",
        "The balance after those five years is £210,858.97.",
        "So £80,040 went in and the debt fell by only £29,141.03 — the rest was interest.",
        "A fifth of the term has passed but only about 12% of the capital has been repaid.",
      ],
      outputs: [
        { key: "monthly_payment", label: "Monthly payment", value: 1334, format: "currency" },
        { key: "remaining_balance", label: "Balance after 60 months", value: 210858.97, format: "currency" },
      ],
    },
    assumptions: [
      "One interest rate applies throughout the elapsed period.",
      "Every payment was made in full and on time, with no overpayments or payment holidays.",
    ],
    limitations: [
      "A real mortgage that has been remortgaged part-way through will not match this, because the rate changed.",
      "Overpayments, underpayments and payment holidays all move the balance and are not modelled.",
      "Some lenders calculate interest daily rather than monthly, which produces small differences.",
      "Fees added to the loan at the outset are not separated out.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Mortgages: how they work",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/mortgage-types",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How capital and interest repayment mortgages amortise",
      },
      SRC_MCOB,
    ],
    relatedCalculators: [
      { calculatorId: "PRO-001", why: "Set up the original payment, loan and total interest." },
      { calculatorId: "PRO-004", why: "See how overpaying changes the shape of the balance curve." },
      { calculatorId: "PRO-010", why: "Turn the remaining balance into a current loan-to-value." },
    ],
    faqs: [
      {
        question: "Why has my balance hardly moved after five years?",
        answer:
          "Because interest is charged on the balance, and the balance was at its largest at the start. Most of your early payments were absorbed by interest. The capital portion grows every month, so the debt falls far faster in the second half of the term.",
      },
      {
        question: "Does this tell me my remortgage loan-to-value?",
        answer:
          "It gives you the numerator. Take the remaining balance here and put it into the loan-to-value calculator alongside a current valuation, since the property's value has probably moved too.",
      },
      {
        question: "Why does my lender's figure differ slightly?",
        answer:
          "Lenders may charge interest daily rather than monthly, apply payments on a specific day, and round differently. Small differences of a few pounds are normal; large ones usually mean a rate change or a fee added to the loan.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-004 ========
  {
    calculatorId: "PRO-004",
    title: "What overpaying a mortgage actually saves",
    summary:
      "An overpayment reduces the balance immediately, so every month afterwards is charged less interest. The saving compounds, which is why early overpayments are worth far more than late ones.",
    purpose: [
      "Shows how much sooner the mortgage clears if you overpay monthly, as a lump sum, or both.",
      "Quantifies the interest saved over the remaining term.",
      "Reports the new payoff period in months.",
    ],
    methodology:
      "Interest is charged on the balance outstanding, so anything that reduces the balance reduces every interest charge that follows. An overpayment therefore does two things at once: it removes capital, and it removes all the future interest that capital would have attracted. The saving compounds, which is why the timing matters enormously — an overpayment made in year two avoids far more interest than the same amount in year eighteen, because it has more remaining months to work across. The calculator runs the amortisation twice, once with the contractual payment and once with your overpayments applied, and compares the two. Holding the monthly payment level while the balance falls faster is what shortens the term: the alternative, asking your lender to reduce the payment instead, keeps the term the same and saves considerably less.",
    formulaExplanation: {
      formula:
        "Run the amortisation with (contractual payment + overpayment) each month, applying any lump sum in the month given, until the balance reaches zero. Interest saved is the original total interest less the new total.",
      steps: [
        "Work out the contractual monthly payment for the balance, rate and remaining term.",
        "Add the regular overpayment to each month's payment.",
        "Apply any lump sum in the month specified.",
        "Continue until the balance clears, counting the months taken.",
        "Compare total interest against the original schedule.",
      ],
    },
    workedExample: {
      scenario:
        "A £200,000 balance at 4.5% with 20 years left, overpaying £200 a month.",
      engineInputs: {
        balance: 200000,
        rate: 4.5,
        years: 20,
        monthly_overpayment: 200,
        lump_sum: 0,
        lump_month: 1,
      },
      displayInputs: [
        { label: "Current mortgage balance", display: "£200,000" },
        { label: "Current interest rate", display: "4.5%" },
        { label: "Remaining mortgage term", display: "20 years" },
        { label: "Regular monthly overpayment", display: "£200" },
        { label: "One-off lump sum overpayment", display: "£0" },
      ],
      steps: [
        "The contractual term is 240 months.",
        "Adding £200 a month clears the balance in 192 months instead.",
        "That is 48 months — four years — off the mortgage.",
        "Interest over the shortened schedule is £80,735.45.",
        "Compared with the original schedule that is £22,936.25 of interest avoided.",
        "The total overpaid is £200 × 192 = £38,400, so roughly 60p of interest was saved for every extra pound paid in.",
      ],
      outputs: [
        { key: "payoff_months", label: "New payoff period (months)", value: 192, format: "number" },
        { key: "months_saved", label: "Months saved", value: 48, format: "number" },
        { key: "interest_saved", label: "Interest saved", value: 22936.25, format: "currency" },
        { key: "new_interest", label: "Interest over the new schedule", value: 80735.45, format: "currency" },
      ],
    },
    assumptions: [
      "The interest rate stays the same for the whole remaining term.",
      "Overpayments are applied to the balance in the month they are made.",
      "The contractual monthly payment is held level, so the benefit is taken as a shorter term.",
    ],
    limitations: [
      "Most fixed-rate deals cap penalty-free overpayments, commonly at 10% of the balance a year. Exceeding the cap triggers an early repayment charge, which this calculator does not model — check your own deal before acting.",
      "Some lenders apply overpayments only at the year end, or only once they exceed a minimum, which reduces the benefit.",
      "Asking the lender to reduce your monthly payment instead of shortening the term saves considerably less interest.",
      "Whether overpaying beats saving or investing the same money depends on rates, tax and your circumstances, and is not an arithmetic question.",
      "Clearing higher-interest debt, or keeping an accessible emergency fund, is usually the better first call.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Should you pay off your mortgage early?",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/should-i-overpay-my-mortgage",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Overpayment limits, early repayment charges and the trade-offs",
      },
      SRC_MCOB,
    ],
    relatedCalculators: [
      { calculatorId: "PRO-003", why: "See where the balance would otherwise have been at any point." },
      { calculatorId: "PRO-001", why: "Compare against the original schedule and total interest." },
      { calculatorId: "FIN-009", why: "Clearing expensive card debt usually beats overpaying a mortgage." },
    ],
    faqs: [
      {
        question: "Is there a limit on how much I can overpay?",
        answer:
          "Usually yes while you are on a fixed deal — commonly 10% of the outstanding balance a year. Going over it typically triggers an early repayment charge that can wipe out the saving. Check your mortgage offer, because the cap and the charge vary a great deal.",
      },
      {
        question: "Should I shorten the term or reduce the payment?",
        answer:
          "Shortening the term saves far more interest, because you keep paying at the higher level against a falling balance. Reducing the payment gives you monthly breathing room instead. The calculator models the term-shortening approach.",
      },
      {
        question: "Does it matter when in the term I overpay?",
        answer:
          "Enormously. An overpayment avoids interest on every remaining month, so the earlier it lands the more months it works across. The same £5,000 saves several times more in year two than in year eighteen.",
      },
      {
        question: "Is overpaying better than saving the money?",
        answer:
          "It depends on your mortgage rate, the return available after tax on savings or investments, and whether you would need the money back. Overpayments are hard to reverse, so an accessible emergency fund normally comes first. This is a planning question rather than an arithmetic one.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-008 ========
  {
    calculatorId: "PRO-008",
    title: "Fixed or tracker: comparing the deal period",
    summary:
      "A fixed rate buys certainty; a tracker buys exposure to the Bank of England base rate. This compares the total cost of each over the deal period, fees included.",
    purpose: [
      "Compares the total cost of a fixed and a tracker deal over the same period.",
      "Includes product fees on both sides, and can add them to the balance.",
      "Reports the average base rate at which the two would break even.",
      "Shows the balance remaining under each at the end of the deal.",
    ],
    methodology:
      "The comparison runs both products over the deal period and totals what each actually costs, rather than comparing headline rates. The fixed side is straightforward: one rate, one payment, plus the product fee. The tracker side starts at the base rate plus the lender's margin and then moves as you expect the base rate to move, so its payment changes over the period. Adding the fees to each side matters more than people expect over a short deal, because a £999 fee spread across 24 months is worth about £42 a month — often more than the rate difference being argued about. The most useful output is the break-even average base rate: the average level the base rate would have to sit at across the deal for the two to cost the same. That converts a forecast you cannot make into a threshold you can reason about, because you only need a view on whether the average will be above or below it.",
    formulaExplanation: {
      formula:
        "Total deal cost = payments over the deal period + product fee, computed separately for the fixed rate and for the tracker at (base rate + margin) as the base rate moves.",
      steps: [
        "Work out the fixed payment and total it across the deal period, then add the fixed product fee.",
        "Start the tracker at the current base rate plus the lender's margin.",
        "Move the base rate by the expected annual change across the deal period.",
        "Total the tracker payments and add the tracker product fee.",
        "Compare the totals, and solve for the average base rate that would make them equal.",
      ],
    },
    workedExample: {
      scenario:
        "A £250,000 mortgage over 25 years: a 4.5% two-year fix with a £999 fee, against a tracker at base plus 0.75% with no fee, with the base rate at 3.75% and expected to fall by 0.25% a year.",
      engineInputs: {
        loan_amount: 250000,
        term_years: 25,
        fixed_rate: 4.5,
        fixed_fee: 999,
        tracker_margin: 0.75,
        current_base_rate: 3.75,
        tracker_fee: 0,
        deal_years: 2,
        expected_rate_change: -0.25,
        fee_financed: false,
      },
      displayInputs: [
        { label: "Mortgage borrowing amount", display: "£250,000" },
        { label: "Mortgage term", display: "25 years" },
        { label: "Fixed interest rate", display: "4.5%" },
        { label: "Fixed product fee", display: "£999" },
        { label: "Tracker margin over base rate", display: "0.75%" },
        { label: "Current Bank of England Base Rate", display: "3.75%" },
        { label: "Comparison deal period", display: "2 years" },
        { label: "Expected annual base rate change", display: "−0.25%" },
      ],
      steps: [
        "The tracker starts at 3.75% + 0.75% = 4.50%, exactly matching the fix, so both open at £1,389.58 a month.",
        "Over two years the fixed deal costs £34,348.95 including its £999 fee.",
        "The tracker costs £32,940.41, because the expected fall in the base rate reduces its payments while the fix cannot move.",
        "On these expectations the tracker is £1,408.54 cheaper across the deal.",
        "The break-even average base rate is 4.04%: if the base rate averages above that, the fix wins instead.",
        "Since the base rate starts at 3.75%, it would have to rise materially and quickly for the fix to come out ahead.",
      ],
      outputs: [
        { key: "fixed_monthly_payment", label: "Fixed monthly payment", value: 1389.58, format: "currency" },
        { key: "fixed_deal_total_cost", label: "Fixed total cost over the deal", value: 34348.95, format: "currency" },
        { key: "tracker_deal_total_cost", label: "Tracker total cost over the deal", value: 32940.41, format: "currency" },
        { key: "deal_cost_difference", label: "Difference over the deal", value: 1408.54, format: "currency" },
        { key: "breakeven_average_base_rate", label: "Break-even average base rate", value: 4.04, format: "percentValue" },
      ],
    },
    assumptions: [
      "The base rate moves smoothly by the annual change you entered, rather than in the steps the Bank of England actually uses.",
      "The lender passes base rate changes straight through to the tracker rate, which is what a true tracker does.",
      "Both products are compared over the same deal period and the same mortgage term.",
    ],
    limitations: [
      "Nobody can forecast the base rate. The break-even figure is the useful output precisely because it does not require one.",
      "The value of certainty is not modelled. A fix that costs slightly more but makes the household budget predictable can be the right choice on numbers that say otherwise.",
      "Early repayment charges, which usually apply to a fix and often not to a tracker, are not included and can matter if you may need to move or repay early.",
      "Some trackers carry a floor below which the rate will not fall, and some revert to a different rate mid-deal.",
      "Adding fees to the balance means paying interest on them for the rest of the term, which costs more than the fee itself.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Bank Rate",
        publisher: "Bank of England",
        url: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",
        sourceType: "regulator",
        verificationStatus: "VERIFIED",
        applicableRule: "The base rate a tracker mortgage follows",
      },
      {
        title: "Fixed, variable or tracker mortgage?",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/mortgage-types",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Differences between fixed, tracker and variable products",
      },
    ],
    relatedCalculators: [
      { calculatorId: "PRO-001", why: "Work out the payment on either product across the full term." },
      { calculatorId: "PRO-003", why: "See where the balance lands at the end of the deal period." },
      { calculatorId: "PRO-004", why: "Trackers often allow unlimited overpayments where fixes do not." },
    ],
    faqs: [
      {
        question: "What does the break-even base rate actually tell me?",
        answer:
          "It is the average base rate across the deal period at which the two products cost exactly the same. You do not need to forecast rates — you only need a view on whether the average will land above or below that figure.",
      },
      {
        question: "Should I add the product fee to the mortgage?",
        answer:
          "It preserves cash now but you then pay interest on the fee for the remaining term, often for decades, which costs several times the fee itself. Paying it upfront is usually cheaper if you can.",
      },
      {
        question: "Is a tracker riskier?",
        answer:
          "It exposes you to rate rises, which a fix does not. Whether that is a risk you can carry depends on how much headroom is in your budget, not on the arithmetic. Many trackers do, however, allow unlimited overpayments and carry no early repayment charge.",
      },
      {
        question: "Why do both products start at the same payment here?",
        answer:
          "Coincidence of the inputs: a 3.75% base rate plus a 0.75% margin is exactly the 4.5% fixed rate. That makes the comparison unusually clean, because the entire difference comes from the fee and the expected rate movement.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-010 ========
  {
    calculatorId: "PRO-010",
    title: "Loan-to-value and why the thresholds matter",
    summary:
      "Loan-to-value is the loan as a percentage of the property's value. Lenders price in tiers, so crossing a threshold changes the rate available to you — nothing in between does.",
    purpose: [
      "Works out loan-to-value from a property valuation and an outstanding loan.",
      "Shows the equity that implies.",
      "Helps you see how far you are from the next pricing threshold.",
    ],
    methodology:
      "Loan-to-value is simply the loan divided by the property's value, expressed as a percentage, and the equity is the remainder. Its importance is entirely about how lenders price. Rates are not set on a sliding scale: they are set in tiers, typically at 95%, 90%, 85%, 80%, 75% and 60%. Within a tier the rate is the same, so reducing loan-to-value from 84% to 81% changes nothing at all, while reducing it from 81% to 79% can move you into a cheaper tier and cut the rate meaningfully. This is why the distance to the next threshold is the number worth knowing before a remortgage: a modest overpayment, or simply a rise in the property's value, can be worth far more than its size suggests. Both sides of the ratio move over time — the balance falls as you repay, and the valuation changes with the market — so loan-to-value at remortgage is often materially better than at purchase.",
    formulaExplanation: {
      formula:
        "Loan-to-value = outstanding loan ÷ property value. Equity = property value − outstanding loan.",
      steps: [
        "Take the current market value of the property.",
        "Take the outstanding mortgage balance.",
        "Divide the balance by the value to give loan-to-value.",
        "Subtract the balance from the value to give equity.",
      ],
    },
    workedExample: {
      scenario:
        "A property now valued at £300,000 with £225,000 still outstanding on the mortgage.",
      engineInputs: { value: 300000, loan: 225000 },
      displayInputs: [
        { label: "Property market value", display: "£300,000" },
        { label: "Outstanding mortgage loan", display: "£225,000" },
      ],
      steps: [
        "Loan-to-value is £225,000 ÷ £300,000 = 75%.",
        "Equity is £300,000 − £225,000 = £75,000.",
        "75% sits exactly on a common pricing threshold, so this borrower qualifies for the 75% tier rather than the more expensive 80% tier.",
        "Reaching the next tier at 60% would need the balance down to £180,000, or the valuation up to £375,000.",
      ],
      outputs: [
        { key: "ltv", label: "Loan-to-value", value: 0.75, format: "number" },
        { key: "equity", label: "Equity", value: 75000, format: "currency" },
      ],
    },
    assumptions: [
      "The property value entered is a realistic current market value.",
      "The loan figure is the full outstanding balance, including any fees added to it.",
    ],
    limitations: [
      "The lender's valuation is the one that counts, and a surveyor may value the property below your estimate — which is the single most common reason a remortgage lands in a worse tier than expected.",
      "Where more than one loan is secured on the property, all of them count towards loan-to-value.",
      "Threshold levels are lender conventions, not rules, and differ between lenders and between products.",
      "New-build properties, flats and non-standard construction are sometimes capped at a lower maximum loan-to-value regardless of the arithmetic.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "What is loan to value?",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/homes/buying-a-home/what-is-loan-to-value",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Definition of loan-to-value and its effect on mortgage pricing",
      },
      SRC_MCOB,
    ],
    relatedCalculators: [
      { calculatorId: "PRO-003", why: "Find the outstanding balance to use as the numerator." },
      { calculatorId: "PRO-004", why: "See what overpaying would do to your loan-to-value tier." },
      { calculatorId: "PRO-001", why: "See how the rate a tier unlocks changes the monthly payment." },
    ],
    faqs: [
      {
        question: "Why does dropping a few percent make no difference?",
        answer:
          "Because lenders price in tiers rather than on a sliding scale. Moving from 84% to 81% stays inside the same tier and changes nothing. Moving from 81% to 79% crosses into a cheaper tier and can cut the rate noticeably.",
      },
      {
        question: "Whose valuation counts?",
        answer:
          "The lender's. They will instruct their own valuation, and if it comes in below your estimate your loan-to-value is worse than you calculated — which can push you into a more expensive tier at exactly the wrong moment.",
      },
      {
        question: "Does my loan-to-value improve on its own?",
        answer:
          "Usually, from both directions: the balance falls as you repay, and the valuation may rise with the market. That is why remortgaging after a few years often unlocks a better tier without you doing anything in particular.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-018 ========
  {
    calculatorId: "PRO-018",
    title: "Whether a buy-to-let actually stacks up",
    summary:
      "A buy-to-let has to clear two separate bars: the lender's interest cover ratio, and your own return after costs, voids and tax. The stamp duty surcharge alone changes the arithmetic materially.",
    purpose: [
      "Works out gross and net rental yield after voids and running costs.",
      "Calculates the interest cover ratio lenders test against.",
      "Estimates the stamp duty payable including the additional-property surcharge.",
      "Totals the cash required to complete the purchase.",
    ],
    methodology:
      "The calculation starts with rent and works down. Expected rent is reduced by a void allowance, because no property is let every week of every year, and then by running costs — letting agency fees, insurance, maintenance, safety certificates, service charges. What remains is net operating income. The mortgage cost is then set against it. The interest cover ratio is that income divided by the mortgage interest, and it is the test lenders apply before they will lend at all. Note the difference in basis: lenders normally compute the ratio on gross rent before costs, so their published figure is more generous than the one shown here, which uses income after voids and costs. Yields are expressed two ways — gross yield against the purchase price, and net yield after costs — because the gap between them is where most optimistic buy-to-let arithmetic falls apart. Stamp duty includes the additional-property surcharge of 5% on the whole price, which is a substantial upfront cost that never appears in a headline yield.",
    formulaExplanation: {
      formula:
        "Net operating income = rent × (1 − void rate) − running costs. Interest cover ratio = net operating income ÷ annual mortgage cost. Gross yield = annual rent ÷ purchase price.",
      steps: [
        "Reduce annual rent by the expected void rate to give effective rent.",
        "Subtract annual running and maintenance costs to give net operating income.",
        "Work out the annual mortgage cost on the borrowing.",
        "Divide net operating income by the mortgage cost to give the interest cover ratio.",
        "Subtract the mortgage cost from net operating income to give pre-tax cash flow.",
        "Add stamp duty including the surcharge to the deposit to give the cash required.",
      ],
    },
    workedExample: {
      scenario:
        "A £250,000 flat bought as an additional property with a £75,000 deposit, let at £1,300 a month on an interest-only mortgage at 4.5%, with a 5% void allowance and £3,000 of annual costs.",
      engineInputs: {
        price: 250000,
        deposit: 75000,
        rate: 0.045,
        term: 25,
        rent: 1300,
        vacancy: 0.05,
        costs: 3000,
        repayment: false,
        additional_property: true,
      },
      displayInputs: [
        { label: "Property purchase price", display: "£250,000" },
        { label: "Deposit amount", display: "£75,000" },
        { label: "Mortgage interest rate", display: "4.5%" },
        { label: "Monthly rental income", display: "£1,300" },
        { label: "Expected void / vacancy rate", display: "5%" },
        { label: "Annual running & maintenance costs", display: "£3,000" },
        { label: "Repayment mortgage", display: "No — interest only" },
        { label: "Is this an additional residential property?", display: "Yes" },
      ],
      steps: [
        "Annual rent of £15,600 less a 5% void allowance gives effective rent of £14,820.",
        "Deducting £3,000 of running costs leaves net operating income of £11,820.",
        "The mortgage is £250,000 − £75,000 = £175,000, costing £7,875 a year at 4.5% interest only.",
        "The interest cover ratio is £11,820 ÷ £7,875 = 1.50 on this after-costs basis.",
        "Pre-tax cash flow is £11,820 − £7,875 = £3,945 a year.",
        "Stamp duty is £15,000: £2,500 of standard duty plus £12,500 from the 5% additional-property surcharge.",
        "Cash required is the £75,000 deposit plus £15,000 of stamp duty = £90,000, before legal fees and any refurbishment.",
        "Gross yield is 6.24% but net yield is 4.73% — the gap is the voids and running costs.",
      ],
      outputs: [
        { key: "effective_rent", label: "Effective rent after voids", value: 14820, format: "currency" },
        { key: "net_operating_income", label: "Net operating income", value: 11820, format: "currency" },
        { key: "annual_mortgage_cost", label: "Annual mortgage cost", value: 7875, format: "currency" },
        { key: "pre_tax_cashflow", label: "Pre-tax cash flow", value: 3945, format: "currency" },
        { key: "estimated_sdlt", label: "Estimated stamp duty", value: 15000, format: "currency" },
        { key: "cash_required", label: "Cash required to complete", value: 90000, format: "currency" },
      ],
    },
    assumptions: [
      "The void rate and running costs you enter are realistic for the property and the area.",
      "Stamp duty is estimated on the England and Northern Ireland basis including the additional-property surcharge.",
      "The interest cover ratio here uses income after voids and costs, which is more conservative than the gross-rent basis lenders normally quote.",
    ],
    limitations: [
      "Income tax on rental profit is not modelled, and it is the single biggest omission. Finance costs on residential lettings are no longer deductible from rental income: relief is given instead as a basic rate tax reduction, so a higher-rate landlord pays materially more tax than a naive profit calculation suggests.",
      "The stamp duty figure applies to England and Northern Ireland only. Scotland charges Land and Buildings Transaction Tax with an 8% Additional Dwelling Supplement, and Wales charges Land Transaction Tax.",
      "Lender interest cover ratio requirements and the stressed rate they apply were not confirmed against a primary source for this guide, so no specific threshold is asserted here.",
      "Capital growth, or its absence, is not modelled and usually dominates the long-run outcome.",
      "Letting a property carries legal obligations — deposit protection, safety certificates, licensing in some areas — with costs and risks not captured by any yield figure.",
    ],
    ruleStatus: "SOURCE VERIFICATION REQUIRED",
    ruleset: RULESET,
    officialSources: [
      SRC_SDLT,
      {
        title: "Tax relief for residential landlords: how it's worked out",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/guidance/changes-to-tax-relief-for-residential-landlords-how-its-worked-out-including-case-studies",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule:
          "Finance costs are not deductible from rental income; relief is a basic rate tax reduction, fully in force from 6 April 2020",
      },
      {
        title: "Underwriting standards for buy-to-let mortgage contracts (SS13/16)",
        publisher: "Bank of England",
        url: "https://www.bankofengland.co.uk/prudential-regulation/publication/2016/underwriting-standards-for-buy-to-let-mortgage-contracts-ss",
        sourceType: "regulator",
        verificationStatus: "SOURCE VERIFICATION REQUIRED",
        applicableRule:
          "Interest cover ratio testing and stressed interest rate expectations for buy-to-let lending. The publication could not be retrieved during verification, so no specific ratio or stress rate is asserted in this guide",
      },
      {
        title: "Work out your rental income when you let property",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/guidance/income-tax-when-you-rent-out-a-property-working-out-your-rental-income",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "What counts as rental income and which expenses are allowable",
      },
    ],
    relatedCalculators: [
      { calculatorId: "PRO-023", why: "Work the stamp duty out properly, including first-time buyer and surcharge cases." },
      { calculatorId: "PRO-026", why: "For a Scottish property, Land and Buildings Transaction Tax applies instead." },
      { calculatorId: "PRO-028", why: "Model the Capital Gains Tax due when the property is eventually sold." },
      { calculatorId: "PRO-010", why: "Buy-to-let lending is usually capped at a lower maximum loan-to-value." },
    ],
    faqs: [
      {
        question: "Why is the interest cover ratio here lower than my lender's?",
        answer:
          "Because the basis differs. Lenders normally calculate the ratio on gross rent before voids and running costs, which produces a higher number. This calculator uses income after both, which is a more conservative view of whether the property actually covers itself.",
      },
      {
        question: "Why is the stamp duty so much higher than on a home?",
        answer:
          "An additional residential property attracts a surcharge of 5% on the whole purchase price, on top of the standard rates. On a £250,000 property that is £12,500 of extra tax, which has to be found in cash at completion.",
      },
      {
        question: "Does the cash flow figure account for tax?",
        answer:
          "No — it is pre-tax. That matters more than it used to, because finance costs can no longer be deducted from rental income. Relief comes instead as a basic rate tax reduction, so a higher-rate taxpayer's after-tax position is significantly worse than the pre-tax figure suggests.",
      },
      {
        question: "Is gross yield or net yield the number to look at?",
        answer:
          "Net yield, always. Gross yield ignores voids and running costs, and the gap between the two is where most buy-to-let projections quietly fail. In this example the difference is around 1.5 percentage points.",
      },
    ],
    editorialNotes: [
      "The backfill plan quoted an interest cover ratio of 125%–145% at a 5.5% stress rate. Those are widely used lender conventions but the primary source (PRA SS13/16) returned HTTP 403 during verification, so no threshold is asserted in the public content and the source is marked SOURCE VERIFICATION REQUIRED.",
      "The plan's reference to 'Section 24 mortgage interest relief restrictions' was confirmed against GOV.UK: finance costs are relieved as a basic rate tax reduction rather than deducted, fully in force from 6 April 2020.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-023 ========
  {
    calculatorId: "PRO-023",
    title: "Stamp Duty Land Tax on a residential purchase",
    summary:
      "Stamp duty is charged in slices, like Income Tax, so crossing a threshold only taxes the portion above it. First-time buyer relief and the additional-property surcharge change the answer substantially.",
    purpose: [
      "Calculates Stamp Duty Land Tax on a residential purchase in England or Northern Ireland.",
      "Applies first-time buyer relief where it is available.",
      "Applies the additional-property surcharge for second homes and buy-to-let.",
      "Reports the effective rate across the whole price.",
    ],
    methodology:
      "Stamp duty is a slice tax, not a slab tax, and that distinction is worth being clear about because it used to work the other way. Nothing is charged on the first £125,000. The portion between £125,000 and £250,000 is charged at 2%, the portion from £250,000 to £925,000 at 5%, from £925,000 to £1.5 million at 10%, and anything above that at 12%. Because only the slice inside each band is charged at that band's rate, a purchase at £250,001 costs five pence more than one at £250,000, not thousands more. First-time buyers get a different set of thresholds: nothing to £300,000 and 5% from £300,000 to £500,000, with the relief withdrawn entirely — not tapered — above £500,000, which creates a genuine cliff edge at that price. Where the purchase means you will own more than one residential property, a surcharge of 5% applies to the whole price, not just the portion above a threshold.",
    formulaExplanation: {
      formula:
        "Stamp duty = the sum, across bands, of (the portion of the price in that band × that band's rate), plus 5% of the whole price where the additional-property surcharge applies.",
      steps: [
        "Identify whether first-time buyer relief or the additional-property surcharge applies.",
        "Split the purchase price across the relevant thresholds.",
        "Charge each slice at its own rate.",
        "Add 5% of the whole price where the surcharge applies.",
        "Divide the total by the price to give the effective rate.",
      ],
    },
    workedExample: {
      scenario:
        "A £425,000 house bought in England as a main residence, by someone who has owned before.",
      engineInputs: { price: 425000, first_time: false, additional: false, nonresident: false },
      displayInputs: [
        { label: "Property purchase price", display: "£425,000" },
        { label: "Are you a first-time buyer?", display: "No" },
        { label: "Is this an additional property or second home?", display: "No" },
        { label: "Are you a non-UK resident for SDLT?", display: "No" },
      ],
      steps: [
        "Nothing is charged on the first £125,000.",
        "The slice from £125,000 to £250,000 is £125,000, charged at 2%: £2,500.",
        "The slice from £250,000 to £425,000 is £175,000, charged at 5%: £8,750.",
        "Total stamp duty is £2,500 + £8,750 = £11,250.",
        "Across the whole £425,000 price that is an effective rate of about 2.65%.",
        "A first-time buyer on the same purchase would pay £6,250 — nothing to £300,000, then 5% of £125,000 — saving £5,000.",
      ],
      outputs: [
        { key: "sdlt", label: "Stamp Duty Land Tax", value: 11250, format: "currency" },
      ],
    },
    assumptions: [
      "The property is in England or Northern Ireland.",
      "The purchase is of a single residential freehold or leasehold dwelling.",
      "First-time buyer status means neither purchaser has ever owned a residential property anywhere in the world.",
    ],
    limitations: [
      "Scotland charges Land and Buildings Transaction Tax and Wales charges Land Transaction Tax. Neither is covered here, and both have different thresholds.",
      "First-time buyer relief is withdrawn entirely above £500,000 rather than tapered, so a purchase at £500,001 costs considerably more than one at £500,000.",
      "Multiple dwellings, mixed-use property, shared ownership, non-residential purchases and companies buying residential property all follow different rules.",
      "A non-UK resident surcharge applies in addition where relevant.",
      "The surcharge can sometimes be reclaimed if a previous main residence is sold within a set period, which the calculator does not model.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_SDLT,
      {
        title: "Stamp Duty Land Tax",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/stamp-duty-land-tax",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "When SDLT is due, filing deadlines and which transactions are covered",
      },
    ],
    relatedCalculators: [
      { calculatorId: "PRO-026", why: "For a Scottish property, Land and Buildings Transaction Tax applies instead." },
      { calculatorId: "PRO-002", why: "Stamp duty comes out of the same cash as your deposit, so it caps what you can buy." },
      { calculatorId: "PRO-018", why: "See the surcharge in the context of a full buy-to-let appraisal." },
    ],
    faqs: [
      {
        question: "Does crossing a threshold cost me thousands?",
        answer:
          "No. Only the portion of the price above the threshold is charged at the higher rate, so paying £250,001 rather than £250,000 costs five extra pence. The one real cliff edge is first-time buyer relief, which disappears entirely above £500,000.",
      },
      {
        question: "Am I still a first-time buyer if I inherited a property?",
        answer:
          "Generally no. The relief requires that you have never owned a residential property anywhere in the world, and inheriting a share counts as owning. If you are buying jointly, both of you must qualify.",
      },
      {
        question: "Do I pay the surcharge if I am replacing my main home?",
        answer:
          "Not if the sale of your previous main residence completes on the same day or earlier. If there is a gap you may have to pay the surcharge upfront and reclaim it once the old property sells, within the time limit HMRC sets.",
      },
      {
        question: "When does the money actually have to be paid?",
        answer:
          "It is due shortly after completion, and in practice your conveyancer files the return and pays it on your behalf from funds you provide. It cannot be added to the mortgage, so it has to be available in cash.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-026 ========
  {
    calculatorId: "PRO-026",
    title: "Land and Buildings Transaction Tax in Scotland",
    summary:
      "Scotland charges LBTT rather than stamp duty, with its own bands starting at £145,000 and an Additional Dwelling Supplement of 8% on the whole price.",
    purpose: [
      "Calculates LBTT on a residential purchase in Scotland.",
      "Applies first-time buyer relief, which raises the nil rate band to £175,000.",
      "Applies the Additional Dwelling Supplement where a second dwelling is being bought.",
      "Separates the base tax from the supplement so the two are visible.",
    ],
    methodology:
      "LBTT works on the same progressive slice principle as stamp duty but with entirely different thresholds, and it is collected by Revenue Scotland rather than HMRC. Nothing is charged on the first £145,000. The slice to £250,000 is charged at 2%, to £325,000 at 5%, to £750,000 at 10%, and anything above at 12%. The higher rates therefore begin at lower prices than in England, which means a mid-priced Scottish property can attract more tax than an equivalently priced English one. First-time buyer relief raises the nil rate band from £145,000 to £175,000, worth up to £600. The Additional Dwelling Supplement is a separate charge on top for anyone buying a property that means they will own more than one dwelling: 8% of the whole purchase price where the consideration is £40,000 or more. Because it applies to the entire price rather than a slice, it is a large and immediate cost.",
    formulaExplanation: {
      formula:
        "LBTT = the sum, across bands, of (the portion of the price in that band × that band's rate), plus 8% of the whole price where the Additional Dwelling Supplement applies.",
      steps: [
        "Apply first-time buyer relief if it is available, raising the nil rate band to £175,000.",
        "Split the price across the LBTT thresholds.",
        "Charge each slice at its own rate to give the base tax.",
        "Add 8% of the whole price where the Additional Dwelling Supplement applies.",
        "Divide by the price to give the effective rate.",
      ],
    },
    workedExample: {
      scenario:
        "A £300,000 house bought in Scotland as a main residence, by someone who has owned before.",
      engineInputs: { price: 300000, first_time_buyer: false, additional_property: false },
      displayInputs: [
        { label: "Property price", display: "£300,000" },
        { label: "First-time buyer?", display: "No" },
        { label: "Additional dwelling?", display: "No" },
      ],
      steps: [
        "Nothing is charged on the first £145,000.",
        "The slice from £145,000 to £250,000 is £105,000, charged at 2%: £2,100.",
        "The slice from £250,000 to £300,000 is £50,000, charged at 5%: £2,500.",
        "Total LBTT is £2,100 + £2,500 = £4,600, an effective rate of about 1.53%.",
        "Had this been an additional dwelling, the Additional Dwelling Supplement would add 8% of the full £300,000 — a further £24,000, taking the total to £28,600.",
      ],
      outputs: [
        { key: "tax", label: "Land and Buildings Transaction Tax", value: 4600, format: "currency" },
        { key: "base_tax", label: "Base tax before any supplement", value: 4600, format: "currency" },
        { key: "surcharge", label: "Additional Dwelling Supplement", value: 0, format: "currency" },
      ],
    },
    assumptions: [
      "The property is in Scotland, where LBTT replaces Stamp Duty Land Tax entirely.",
      "The purchase is of a single residential dwelling.",
      "First-time buyer relief requires that no purchaser has previously owned a dwelling.",
    ],
    limitations: [
      "England and Northern Ireland charge Stamp Duty Land Tax, and Wales charges Land Transaction Tax; neither is covered here.",
      "The Additional Dwelling Supplement can sometimes be reclaimed where a previous main residence is sold within the permitted period, which is not modelled.",
      "Non-residential and mixed-use transactions follow a different set of rates.",
      "Lease transactions are charged differently and are not covered.",
      "The return must be filed with Revenue Scotland and the tax paid within the statutory deadline, usually handled by your solicitor.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_LBTT,
      SRC_ADS,
      {
        title: "Land and Buildings Transaction Tax",
        publisher: "Revenue Scotland",
        url: "https://revenue.scot/taxes/land-buildings-transaction-tax",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Scope of LBTT and filing obligations",
      },
    ],
    relatedCalculators: [
      { calculatorId: "PRO-023", why: "Compare with Stamp Duty Land Tax for an equivalent purchase in England." },
      { calculatorId: "PRO-018", why: "The Additional Dwelling Supplement is a major upfront cost in a buy-to-let appraisal." },
      { calculatorId: "PRO-002", why: "Transaction tax comes out of the same cash as your deposit." },
    ],
    faqs: [
      {
        question: "Why is Scottish tax higher than English stamp duty on the same price?",
        answer:
          "The bands are different and the higher rates start earlier: LBTT reaches 5% at £250,000 and 10% at £325,000, while stamp duty stays at 5% right up to £925,000. On a mid-priced property that gap can be several thousand pounds.",
      },
      {
        question: "How much is first-time buyer relief worth?",
        answer:
          "It raises the nil rate band from £145,000 to £175,000, so the maximum saving is 2% of £30,000, which is £600. It is more modest than the equivalent English relief.",
      },
      {
        question: "Does the Additional Dwelling Supplement apply to the whole price?",
        answer:
          "Yes, and that is what makes it expensive. Unlike the banded tax it is 8% of the entire purchase price, not just a slice, and it applies whenever the consideration is £40,000 or more.",
      },
      {
        question: "Who do I actually pay?",
        answer:
          "Revenue Scotland, not HMRC. Your solicitor normally files the return and pays from funds you provide around completion.",
      },
    ],
    editorialNotes: [
      "The backfill plan states an Additional Dwelling Supplement of 6%. Revenue Scotland publishes 8% for transactions on or after 5 December 2024, and the engine applies 8%. The plan figure is stale; the engine is correct.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== PRO-028 ========
  {
    calculatorId: "PRO-028",
    title: "Capital Gains Tax when you sell a property",
    summary:
      "Tax is charged on the gain, not the sale price, and Private Residence Relief removes the proportion of that gain covering the period you lived there — plus the final nine months of ownership regardless.",
    purpose: [
      "Works out the chargeable gain after purchase price, buying, selling and improvement costs.",
      "Applies Private Residence Relief for the period the property was your main home.",
      "Splits the taxable gain across the 18% and 24% rates.",
      "Reports the 60-day reporting and payment deadline.",
    ],
    methodology:
      "The starting point is the gross gain: the sale price less what you paid, less the costs of buying and selling and any capital improvements. Repairs and maintenance do not count — only genuine enhancements. Private Residence Relief then removes the proportion of that gain matching the period the property was your only or main residence, and the final nine months of ownership always qualify regardless of how the property was used in that time. So a property owned for 120 months and lived in for 36 gets relief on 45 of those months, not 36. The annual exempt amount of £3,000 is deducted from what remains. The taxable gain is then stacked on top of your income for the year: the part that still fits inside the basic rate band is charged at 18%, and everything above at 24%. Because the gain sits on top of income, a large gain will nearly always spill into the higher rate even for a basic rate taxpayer.",
    formulaExplanation: {
      formula:
        "Taxable gain = (sale price − purchase price − buying, selling and improvement costs) × (1 − relieved months ÷ months owned) − £3,000. Tax = 18% on the part within the basic rate band, 24% above.",
      steps: [
        "Deduct the purchase price and all allowable costs from the sale price to give the gross gain.",
        "Add nine months to the period lived in as a main residence, and relieve that proportion of the gain.",
        "Deduct any capital losses brought forward.",
        "Deduct the £3,000 annual exempt amount.",
        "Stack the remaining gain on top of your income and charge 18% within the basic rate band and 24% above.",
      ],
    },
    workedExample: {
      scenario:
        "A property bought for £220,000 and sold for £350,000 after ten years, lived in as a main home for the first three, by someone with £35,000 of other income.",
      engineInputs: {
        disposal_price: 350000,
        acquisition_price: 220000,
        buying_costs: 7500,
        selling_costs: 4500,
        improvement_costs: 15000,
        total_ownership_months: 120,
        months_as_main_residence: 36,
        taxable_income: 35000,
        joint_owners: 1,
        loss_brought_forward: 0,
      },
      displayInputs: [
        { label: "Sale / Disposal price", display: "£350,000" },
        { label: "Original purchase price", display: "£220,000" },
        { label: "Buying costs", display: "£7,500" },
        { label: "Selling costs", display: "£4,500" },
        { label: "Capital improvements", display: "£15,000" },
        { label: "Total ownership period", display: "120 months" },
        { label: "Months lived in as your main home", display: "36 months" },
        { label: "Other taxable income in tax year", display: "£35,000" },
      ],
      steps: [
        "Allowable costs total £7,500 + £4,500 + £15,000 = £27,000.",
        "The gross gain is £350,000 − £220,000 − £27,000 = £103,000.",
        "Relief covers the 36 months lived in plus the final 9 months, so 45 of 120 months — 37.5% of the gain, which is £38,625.",
        "That leaves £64,375, reduced by the £3,000 annual exempt amount to a taxable gain of £61,375.",
        "With £35,000 of income there is only £2,700 of basic rate band left, taxed at 18%: £486.",
        "The remaining £58,675 is charged at 24%: £14,082.",
        "Total Capital Gains Tax is £14,568, and it must be reported and paid within 60 days of completion.",
      ],
      outputs: [
        { key: "gross_gain", label: "Gross gain", value: 103000, format: "currency" },
        { key: "prr_relief_amount", label: "Private Residence Relief", value: 38625, format: "currency" },
        { key: "taxable_gain", label: "Taxable gain", value: 61375, format: "currency" },
        { key: "tax_at_basic_rate", label: "Tax at 18%", value: 486, format: "currency" },
        { key: "tax_at_higher_rate", label: "Tax at 24%", value: 14082, format: "currency" },
        { key: "total_cgt_due", label: "Total Capital Gains Tax", value: 14568, format: "currency" },
        { key: "reporting_deadline_days", label: "Reporting deadline (days)", value: 60, format: "number" },
      ],
    },
    assumptions: [
      "The property was your only or main residence for the months entered, and relief is given on a straight time-apportioned basis.",
      "The final nine months of ownership qualify for relief regardless of use.",
      "Improvement costs are genuine capital enhancements rather than repairs or maintenance.",
      "The gain is stacked on top of the other income entered for the same tax year.",
    ],
    limitations: [
      "Time apportionment is a simplification. Periods of absence, job-related accommodation and elections between two residences can all extend relief in ways this calculator does not model.",
      "A longer final period of 36 months applies for disabled people and those moving into a care home.",
      "Lettings relief, where it still applies, is not modelled.",
      "Transfers between spouses and civil partners happen at no gain and no loss, which changes the arithmetic substantially and is not covered.",
      "Where a property is jointly owned, each owner has their own annual exempt amount and their own rate band, so a joint disposal is not simply this figure halved.",
      "This is an estimate, not a Self Assessment computation, and the 60-day deadline is strict.",
    ],
    ruleStatus: "VERIFIED",
    ruleset: RULESET,
    officialSources: [
      SRC_CGT_RATES,
      SRC_CGT_ALLOWANCE,
      {
        title: "CG64985: Private residence relief: final period exemption",
        publisher: "HMRC",
        url: "https://www.gov.uk/hmrc-internal-manuals/capital-gains-manual/cg64985",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule:
          "The final 9 months of ownership qualify for relief for disposals on or after 6 April 2020, or 36 months for disabled persons and care home residents",
      },
      {
        title: "Tax when you sell your home",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/tax-sell-home",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Conditions for full Private Residence Relief",
      },
      {
        title: "Capital Gains Tax for non-residents: UK residential property",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/guidance/capital-gains-tax-for-non-residents-uk-residential-property",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule:
          "Residential property gains must be reported and paid within 60 days of completion where completion was on or after 27 October 2021",
      },
    ],
    relatedCalculators: [
      { calculatorId: "TAX-012", why: "Capital Gains Tax on assets other than property, using the same allowance and rates." },
      { calculatorId: "PRO-018", why: "Model the letting years before the eventual disposal." },
      { calculatorId: "TAX-001", why: "The income the gain stacks on top of decides how much falls at 24%." },
    ],
    faqs: [
      {
        question: "Do I pay Capital Gains Tax when I sell my own home?",
        answer:
          "Usually not. If it has been your only or main residence for the whole period you owned it, and you meet the other conditions, Private Residence Relief covers the entire gain. Tax typically arises where the property was let, left empty, or was a second home for part of the time.",
      },
      {
        question: "Why do I get relief for nine months I did not live there?",
        answer:
          "The final nine months of ownership always qualify once the property has been your main residence at some point. The rule exists so that someone who moves out before finding a buyer is not penalised for the gap.",
      },
      {
        question: "Can I deduct the kitchen I replaced?",
        answer:
          "Only if it was a genuine capital improvement rather than a repair or replacement of something worn out. Extensions and structural alterations generally qualify; redecoration and like-for-like replacement generally do not.",
      },
      {
        question: "How quickly do I have to pay?",
        answer:
          "Within 60 days of completion for UK residential property — considerably tighter than the normal Self Assessment timetable, and penalties apply for missing it. It is worth working the figure out before you complete, not after.",
      },
      {
        question: "We own it jointly — is the tax just halved?",
        answer:
          "Not exactly. Each owner is taxed on their own share, with their own £3,000 annual exempt amount and their own rate band. Two owners with different incomes will pay different amounts on identical shares.",
      },
    ],
    lastReviewed: REVIEWED,
  },
];
