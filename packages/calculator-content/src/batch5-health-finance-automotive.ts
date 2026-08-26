/**
 * Phase 2 Batch 5: Health, Finance and Automotive guides.
 *
 * Health content here is informational only. It does not diagnose, does not
 * treat, and signposts to the NHS and to professionals for anything that
 * matters. The pregnancy guide in particular is written on the assumption that
 * some readers will be anxious, so it leads with what the estimate is and is
 * not, and points at a midwife or GP rather than at another calculator.
 *
 * BMI thresholds were checked against NICE NG246 on 25 August 2026, including
 * the lower thresholds recommended for South Asian, Chinese, other Asian,
 * Middle Eastern, Black African and African-Caribbean backgrounds. The
 * calculator applies the standard thresholds only, which is recorded as a
 * limitation rather than presented as a complete picture.
 */
import type { CalculatorGuideDefinition, OfficialSource } from "./types.js";

const REVIEWED = "2026-08-25";

const SRC_NICE_BMI: OfficialSource = {
  title: "Overweight and obesity management (NG246): identifying and assessing overweight, obesity and central adiposity",
  publisher: "NICE",
  url: "https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity",
  sourceType: "clinical-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Healthy weight 18.5–24.9, overweight 25–29.9, obesity from 30. For South Asian, Chinese, other Asian, Middle Eastern, Black African and African-Caribbean backgrounds, overweight is 23–27.4 and obesity 27.5 or above",
};

const SRC_NHS_BMI: OfficialSource = {
  title: "Calculate your body mass index (BMI) for adults",
  publisher: "NHS",
  url: "https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults/",
  sourceType: "clinical-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "People from an Asian, Black African, African-Caribbean or Middle Eastern background have a higher chance of developing health problems at a lower BMI",
};

const SRC_NHS_DUE_DATE: OfficialSource = {
  title: "Due date calculator",
  publisher: "NHS",
  url: "https://www.nhs.uk/pregnancy/finding-out/due-date-calculator/",
  sourceType: "clinical-guidance",
  verificationStatus: "VERIFIED",
  applicableRule:
    "Pregnancy normally lasts from 37 to 42 weeks from the first day of the last period; a 12-week scan estimates gestation more accurately",
};

export const batch5HealthFinanceAutomotiveGuides: CalculatorGuideDefinition[] = [
  // ======================================================== HLT-001 ========
  {
    calculatorId: "HLT-001",
    title: "What BMI measures, and what it does not",
    summary:
      "BMI compares weight to height squared. It is a useful population screening tool and a crude individual one, because it cannot tell muscle from fat or say where fat is carried.",
    purpose: [
      "Calculates body mass index from weight in kilograms and height in metres.",
      "Places the result in the standard adult categories.",
      "Is intended as a starting point for a conversation, not as a health assessment.",
    ],
    methodology:
      "BMI divides weight in kilograms by height in metres squared. Squaring the height is what makes the measure roughly independent of size, so that tall and short people with similar body composition land in a similar place. The standard adult categories put a healthy weight at 18.5 to 24.9, overweight at 25 to 29.9, and obesity from 30 upwards. Those cut-offs come from population-level associations between BMI and health outcomes, which is exactly what BMI is good for and exactly why it is weak for any individual. It uses only two numbers, so it cannot distinguish muscle from fat, cannot see where fat is carried, and takes no account of age, sex or build. NICE recommends lower thresholds for people from South Asian, Chinese, other Asian, Middle Eastern, Black African and African-Caribbean backgrounds — overweight from 23 and obesity from 27.5 — because cardiometabolic risk appears at a lower BMI in these groups. This calculator applies the standard thresholds only.",
    formulaExplanation: {
      formula: "BMI = weight in kilograms ÷ (height in metres)².",
      steps: [
        "Take weight in kilograms.",
        "Square the height in metres.",
        "Divide the weight by that figure.",
        "Compare the result against the standard adult categories.",
      ],
    },
    workedExample: {
      scenario:
        "An adult weighing 82 kg and standing 1.78 m tall works out their BMI.",
      engineInputs: { weight_kg: 82, height_m: 1.78 },
      displayInputs: [
        { label: "Weight", display: "82 kg" },
        { label: "Height", display: "1.78 m" },
      ],
      steps: [
        "Height squared is 1.78 × 1.78 = 3.1684.",
        "BMI is 82 ÷ 3.1684 = 25.88.",
        "That sits just inside the overweight band, which starts at 25.",
        "The result is barely above the boundary, and a boundary drawn from population data says very little about one person a fraction over it.",
        "Someone with high muscle mass could reach the same figure with low body fat, which is the clearest illustration of what BMI cannot see.",
      ],
      outputs: [
        { key: "bmi", label: "BMI", value: 25.88, format: "number" },
        { key: "category", label: "Category", value: "Overweight", format: "text" },
      ],
    },
    assumptions: [
      "The categories applied are the standard adult thresholds.",
      "Height and weight are entered accurately in metres and kilograms.",
    ],
    limitations: [
      "BMI cannot distinguish muscle from fat. Athletic or muscular people are routinely classified as overweight while carrying low body fat.",
      "It says nothing about where fat is carried, and central adiposity carries more cardiometabolic risk than the same weight distributed elsewhere. A waist measurement adds information BMI cannot.",
      "This calculator applies the standard thresholds only. NICE recommends lower cut-offs for several ethnic backgrounds, so the category shown may understate risk for some people.",
      "It is not designed for children and young people, who are assessed against age and sex-specific centiles instead.",
      "It is not valid during pregnancy, and is unreliable for older adults and for people with certain medical conditions.",
      "This is information, not a diagnosis or a health assessment. A GP or practice nurse can interpret it alongside everything else that matters.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [SRC_NICE_BMI, SRC_NHS_BMI],
    relatedCalculators: [
      { calculatorId: "HLT-002", why: "Estimate the energy your body uses at rest, which is a different question from body composition." },
      { calculatorId: "HLT-003", why: "A waist-based measure adds the information about fat distribution that BMI cannot capture." },
    ],
    faqs: [
      {
        question: "I lift weights and BMI says I am overweight — is it wrong?",
        answer:
          "It is doing what it does, which is compare weight to height without knowing what the weight is made of. Muscle is denser than fat, so muscular people routinely land in the overweight band at low body fat. For you the number carries little information.",
      },
      {
        question: "Does my ethnic background change the thresholds?",
        answer:
          "NICE recommends lower thresholds for people from South Asian, Chinese, other Asian, Middle Eastern, Black African and African-Caribbean backgrounds — overweight from 23 and obesity from 27.5 — because health risks appear at a lower BMI. This calculator applies the standard thresholds, so discuss the result with a clinician who can apply the right ones.",
      },
      {
        question: "Is a waist measurement better?",
        answer:
          "It adds something BMI cannot see. Where fat is carried matters to cardiometabolic risk, and two people with the same BMI can have very different waist measurements. NICE guidance uses both together rather than either alone.",
      },
      {
        question: "Can I use this for my child?",
        answer:
          "No. Children and young people are assessed against age and sex-specific centile charts, not adult categories, because body composition changes throughout growth. The NHS has a separate tool for under-18s.",
      },
    ],
    editorialNotes: [
      "The backfill plan referred to 'ethnic-specific health risk thresholds (NICE guidelines for South Asian/Black/Middle Eastern groups)'. NICE NG246 was checked directly and does specify overweight at 23–27.4 and obesity at 27.5 or above for those groups. The engine applies standard thresholds only, which is a scope limitation rather than a defect, and is stated as such in the public content.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== HLT-002 ========
  {
    calculatorId: "HLT-002",
    title: "Basal metabolic rate, and why three formulas disagree",
    summary:
      "BMR is the energy your body uses at complete rest. Three established formulas give different answers for the same person, which is the most honest thing this calculator shows you.",
    purpose: [
      "Estimates basal metabolic rate using the Mifflin-St Jeor formula.",
      "Shows the Harris-Benedict result alongside it for comparison.",
      "Adds the Katch-McArdle estimate where a body fat percentage is supplied.",
      "Reports resting energy use per hour.",
    ],
    methodology:
      "Basal metabolic rate is what the body uses at complete rest, before any movement at all — keeping organs running, maintaining temperature, everything involuntary. It is not the same as the total energy you use in a day, which is BMR multiplied by an activity factor. All three formulas here are regressions fitted to population data, taking height, weight, age and sex as inputs. Mifflin-St Jeor is used as the headline figure because it is generally the most accurate of the three for the general population. Harris-Benedict is older and tends to read higher. Katch-McArdle works from lean body mass instead, so it only appears when a body fat percentage is supplied, and it is often the better estimate for people whose body composition is far from average. Showing all three is deliberate: they can disagree by a couple of hundred calories for the same person, and presenting one figure alone would imply a precision that none of them has.",
    formulaExplanation: {
      formula:
        "Mifflin-St Jeor: BMR = 10 × weight in kg + 6.25 × height in cm − 5 × age, then −161 for women or +5 for men.",
      steps: [
        "Take weight in kilograms, height in centimetres and age in years.",
        "Apply the Mifflin-St Jeor regression to give the headline BMR.",
        "Apply Harris-Benedict to the same inputs for comparison.",
        "If a body fat percentage was given, apply Katch-McArdle from lean mass.",
        "Divide the headline figure by 24 to give resting energy use per hour.",
      ],
    },
    workedExample: {
      scenario:
        "A 34-year-old woman, 165 cm tall and 68 kg, with a moderate activity level and no body fat percentage entered.",
      engineInputs: {
        sex: "female",
        age: 34,
        height: 165,
        weight: 68,
        activity: "moderate",
        body_fat_percentage: "",
      },
      displayInputs: [
        { label: "Sex", display: "Female" },
        { label: "Age", display: "34" },
        { label: "Height", display: "165 cm" },
        { label: "Weight", display: "68 kg" },
        { label: "Activity level", display: "Moderate" },
        { label: "Body fat (%) if known", display: "Not given" },
      ],
      steps: [
        "Mifflin-St Jeor gives 10 × 68 + 6.25 × 165 − 5 × 34 − 161 = 1,380.25 calories a day.",
        "Harris-Benedict gives 1,440.34 for the same person — about 60 calories higher.",
        "Katch-McArdle is unavailable, because no body fat percentage was entered.",
        "The headline figure works out at about 57.51 calories an hour at complete rest.",
        "The 60-calorie gap between two established formulas is the useful signal: these are estimates with real uncertainty, not measurements.",
      ],
      outputs: [
        { key: "bmr", label: "Basal metabolic rate", value: 1380.25, format: "number" },
        { key: "bmr_harris_benedict", label: "Harris-Benedict estimate", value: 1440.34, format: "number" },
        { key: "calories_per_hour_at_rest", label: "Calories per hour at rest", value: 57.51, format: "number" },
        { key: "formula_used", label: "Headline formula", value: "Mifflin-St Jeor", format: "text" },
      ],
    },
    assumptions: [
      "The formulas are population regressions applied to the details entered.",
      "The sex option reflects the basis on which the formulas were originally derived.",
      "The calculator is intended for adults aged 18 and over.",
    ],
    limitations: [
      "This is BMR, not the total energy you use in a day. Daily need is BMR multiplied by an activity factor, and that multiplier is itself a rough approximation.",
      "Individual metabolic rates vary considerably around the population average, and genetics, medical conditions, medication and body composition all move them.",
      "The formulas were derived on particular populations and are less reliable for people far from those averages — very muscular, very lean, or at the extremes of height and weight.",
      "It is not suitable for children, and not appropriate during pregnancy or breastfeeding.",
      "This is information, not medical or dietary advice. A GP or registered dietitian should be involved before making significant changes, and anyone who has experienced an eating disorder should speak to a GP first.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Understanding calories",
        publisher: "NHS",
        url: "https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/understanding-calories/",
        sourceType: "clinical-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How calorie needs relate to activity and body size",
      },
      SRC_NICE_BMI,
    ],
    relatedCalculators: [
      { calculatorId: "HLT-001", why: "BMI describes body size relative to height, a different question from energy use." },
      { calculatorId: "HLT-003", why: "Body composition measures add what a weight-based estimate cannot see." },
    ],
    faqs: [
      {
        question: "Is this how many calories I should eat?",
        answer:
          "No. This is what your body uses at complete rest. Your daily need is higher, because it includes everything you actually do. Turning a BMR into a target is a question for a GP or a registered dietitian, not for a calculator.",
      },
      {
        question: "Why do the formulas disagree?",
        answer:
          "They were fitted to different populations at different times. Harris-Benedict is older and generally reads higher; Mifflin-St Jeor is usually more accurate for the general population. The gap between them is a fair indication of the uncertainty involved.",
      },
      {
        question: "Should I enter my body fat percentage?",
        answer:
          "If you have a reliable measurement, yes — it unlocks the Katch-McArdle formula, which works from lean mass and tends to be the better estimate for people whose body composition is well away from average. A rough guess will not improve the answer.",
      },
      {
        question: "Why does the calculator ask for sex?",
        answer:
          "Because the formulas were derived using sex at birth as a variable, and they produce different constants accordingly. They are population averages either way, and they describe groups rather than individuals.",
      },
    ],
    editorialNotes: [
      "The backfill plan labels HLT-002 a 'Calorie & TDEE Calculator'. The registry's HLT-002 is the BMR Calculator. BMR is the input to a TDEE figure rather than the TDEE itself, and the guide is explicit that the two are different so a reader does not treat the number as a calorie target.",
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== HLT-020 ========
  {
    calculatorId: "HLT-020",
    title: "How a due date is estimated",
    summary:
      "A due date is an estimate counted from the first day of your last period, adjusted for your cycle length. A dating scan is more accurate, and very few babies arrive on the date itself.",
    purpose: [
      "Estimates a due date from the first day of the last period and the average cycle length.",
      "Adjusts for cycle lengths other than 28 days, which the classical rule does not.",
      "Estimates the conception date and the trimester boundaries.",
      "Is a calendar calculation, not a clinical assessment.",
    ],
    methodology:
      "The estimate uses Naegele's rule: 280 days, or forty weeks, from the first day of the last menstrual period. That rule assumes ovulation around day 14, which is true for a 28-day cycle and progressively less true as cycles get longer or shorter. This calculator adjusts for the cycle length you enter, so a 35-day cycle moves the estimate a week later than the classical rule would place it — a correction that matters and that many due date calculations simply omit. Trimester boundaries are then derived from the same starting point. What the method fundamentally cannot do is observe the pregnancy. It works from dates alone, and it assumes the date you give is accurate and that ovulation followed your usual pattern that month. A dating scan, usually offered at around twelve weeks in the UK, measures the pregnancy directly and is more accurate than any calculation from a calendar.",
    formulaExplanation: {
      formula:
        "Estimated due date = first day of the last period + 280 days + (cycle length − 28 days).",
      steps: [
        "Start from the first day of the last menstrual period.",
        "Add 280 days.",
        "Adjust by the difference between your cycle length and 28 days.",
        "Estimate conception as roughly two weeks after the period began, adjusted the same way.",
        "Derive the trimester boundaries from the same starting date.",
      ],
    },
    workedExample: {
      scenario:
        "Someone whose last period began on 1 February 2026, with an average 28-day cycle.",
      engineInputs: { last_period_date: "2026-02-01", cycle_length: 28 },
      engineNow: "2026-08-25",
      displayInputs: [
        { label: "First day of your last period", display: "1 February 2026" },
        { label: "Average cycle length", display: "28 days" },
      ],
      steps: [
        "The cycle is 28 days, so no adjustment to the classical rule is needed.",
        "280 days from 1 February 2026 gives an estimated due date of 8 November 2026.",
        "Conception is estimated at around 15 February 2026, roughly two weeks after the period began.",
        "The first trimester ends on 9 May 2026 and the second on 15 August 2026.",
        "With a 35-day cycle instead, the estimate would move a week later — which is why the adjustment matters.",
      ],
      outputs: [
        { key: "estimated_due_date", label: "Estimated due date", value: "2026-11-08", format: "date" },
        { key: "conception_date_estimate", label: "Estimated conception date", value: "2026-02-15", format: "date" },
        { key: "first_trimester_ends", label: "First trimester ends", value: "2026-05-09", format: "date" },
        { key: "second_trimester_ends", label: "Second trimester ends", value: "2026-08-15", format: "date" },
      ],
    },
    assumptions: [
      "The date entered is the first day of the last menstrual period, not the day it ended.",
      "Ovulation followed the usual pattern for the cycle length given.",
      "Cycle length is reasonably regular.",
    ],
    limitations: [
      "This is a calendar calculation, not a clinical assessment, and it is not a pregnancy test.",
      "A dating scan measures the pregnancy directly and is more accurate than any date-based estimate. In the UK one is usually offered at around twelve weeks.",
      "Very few babies arrive on the estimated date. A pregnancy is considered to run normally anywhere from 37 to 42 weeks, so the estimate is the middle of a wide range rather than a prediction.",
      "Irregular cycles, recent hormonal contraception, breastfeeding and uncertainty about the date of the last period all reduce reliability considerably.",
      "It does not apply to IVF pregnancies, where dating is worked out from the transfer date instead.",
      "For anything concerning — bleeding, pain, reduced movements, or simply worry — contact a midwife, a GP or NHS 111 rather than a calculator.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      SRC_NHS_DUE_DATE,
      {
        title: "Your antenatal care",
        publisher: "NHS",
        url: "https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-care/",
        sourceType: "clinical-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Antenatal appointments and scans offered during pregnancy in the UK",
      },
    ],
    relatedCalculators: [
      { calculatorId: "HLT-019", why: "Estimate the fertile window from the same cycle information." },
      { calculatorId: "DAT-002", why: "Count the days between any two dates, if you want to check an interval yourself." },
    ],
    faqs: [
      {
        question: "How accurate is a due date?",
        answer:
          "It is the middle of a range, not a prediction. A pregnancy is considered normal anywhere from 37 to 42 weeks, and only a small minority of babies arrive on the estimated date itself. A dating scan narrows the estimate considerably.",
      },
      {
        question: "Why does it count from my last period rather than conception?",
        answer:
          "Because the first day of the last period is a date you are likely to know, whereas the date of conception usually is not. It is why the count starts roughly two weeks before conception actually occurred.",
      },
      {
        question: "My cycle is not 28 days — does that matter?",
        answer:
          "Yes, and it is why the calculator asks. The classical rule assumes ovulation on day 14, so for a 35-day cycle it lands about a week early. Entering your actual cycle length corrects for that.",
      },
      {
        question: "Should I rely on this instead of a scan?",
        answer:
          "No. A dating scan measures the pregnancy directly and is more accurate than any calculation from dates. This is a rough guide between appointments, and your midwife or GP should be your first call for anything that matters.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== FIN-009 ========
  {
    calculatorId: "FIN-009",
    title: "Clearing a credit card balance",
    summary:
      "Interest is charged on the balance, so paying a fixed amount each month clears the debt far faster than paying the minimum — which is designed to keep the balance alive.",
    purpose: [
      "Works out how long a card balance takes to clear at a fixed monthly repayment.",
      "Totals the interest paid over that period.",
      "Makes the cost of a slower repayment visible.",
    ],
    methodology:
      "The APR is converted to a monthly rate and charged on the outstanding balance each month. Your payment covers that interest first, and only the remainder reduces the debt. That ordering is what makes credit card debt so persistent: at a high APR a large share of a small payment is absorbed by interest before any of it touches the balance. Raising the payment attacks the balance directly, and because next month's interest is charged on a smaller balance, the effect compounds in your favour — the time to clear falls much faster than the payment rises. The minimum payment is the mirror image of this. It is typically calculated as a small percentage of the balance, so it falls as the balance falls, stretching repayment over many years and maximising total interest. Paying a fixed amount rather than a shrinking percentage is the single most effective change available.",
    formulaExplanation: {
      formula:
        "Each month: interest = balance × (APR ÷ 12), then balance = balance + interest − payment. Repeat until the balance reaches zero.",
      steps: [
        "Convert the APR to a monthly interest rate.",
        "Charge that rate on the outstanding balance.",
        "Deduct the monthly payment, so the remainder reduces the balance.",
        "Repeat until the balance is cleared, counting the months.",
        "Total the interest charged along the way.",
      ],
    },
    workedExample: {
      scenario:
        "A £3,000 balance on a card charging 24.9% APR, repaid at a fixed £150 a month.",
      engineInputs: { balance: 3000, apr: 0.249, monthly_payment: 150 },
      displayInputs: [
        { label: "Current card balance", display: "£3,000" },
        { label: "Annual Percentage Rate (APR)", display: "24.9%" },
        { label: "Monthly repayment", display: "£150" },
      ],
      steps: [
        "24.9% APR is about 2.075% a month.",
        "The first month's interest is roughly £62, so only about £88 of the first £150 payment reduces the balance.",
        "As the balance falls the interest falls with it, so more of each payment goes to capital.",
        "The balance clears in 27 months.",
        "Total interest paid is £915.95 — about 31% of the original balance.",
        "Paying £200 a month instead would clear it appreciably sooner and cut the interest substantially, because every month saved is a month of interest avoided.",
      ],
      outputs: [
        { key: "months", label: "Months to clear", value: 27, format: "number" },
        { key: "total_interest", label: "Total interest paid", value: 915.95, format: "currency" },
      ],
    },
    assumptions: [
      "The interest rate stays the same throughout.",
      "The monthly payment is fixed and made on time every month.",
      "No further spending is put on the card.",
    ],
    limitations: [
      "Any new spending on the card resets the arithmetic, and this is the most common reason a repayment plan fails.",
      "Real cards may apply different rates to purchases, cash advances and balance transfers, and payments are usually allocated to the highest-rate debt first.",
      "Minimum payments, late fees and over-limit charges are not modelled.",
      "A promotional 0% period would change the picture entirely until it ends.",
      "If the debt is unmanageable, free and confidential debt advice is available from organisations such as MoneyHelper and Citizens Advice — that is a better first step than a calculator.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Credit cards: how they work",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/everyday-money/types-of-credit/how-credit-cards-work",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "How credit card interest and minimum payments work",
      },
      {
        title: "Get free debt advice",
        publisher: "MoneyHelper",
        url: "https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt/debt-advice-locator",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Where to obtain free, impartial debt advice",
      },
    ],
    relatedCalculators: [
      { calculatorId: "FIN-006", why: "Compare the true cost of borrowing across different loan products." },
      { calculatorId: "PRO-004", why: "Weigh clearing expensive card debt against overpaying a much cheaper mortgage." },
      { calculatorId: "FIN-013", why: "See how much of your income is available to direct at the balance." },
    ],
    faqs: [
      {
        question: "Why does paying the minimum take so long?",
        answer:
          "Because the minimum is usually a percentage of the balance, so it shrinks as the balance shrinks. That stretches repayment over many years and maximises the interest charged. A fixed payment attacks the balance instead.",
      },
      {
        question: "Why does a small increase in payment help so much?",
        answer:
          "Because the extra goes entirely to capital, and every month you cut from the schedule is a month of interest you never pay. The saving compounds, so raising the payment by a third can cut the time and the interest by considerably more than a third.",
      },
      {
        question: "Should I clear the card before overpaying my mortgage?",
        answer:
          "Almost always, on the arithmetic alone. Card rates are typically several times mortgage rates, so a pound aimed at the card avoids far more interest than the same pound aimed at the mortgage.",
      },
      {
        question: "What if I cannot afford the payment?",
        answer:
          "Free, confidential and impartial debt advice is available from MoneyHelper and Citizens Advice, and speaking to them early opens more options than waiting. Creditors are generally required to treat customers in financial difficulty fairly.",
      },
    ],
    lastReviewed: REVIEWED,
  },

  // ======================================================== AUT-006 ========
  {
    calculatorId: "AUT-006",
    title: "What a journey costs in fuel",
    summary:
      "UK fuel economy is quoted in miles per gallon but fuel is sold in litres, so costing a journey means converting between the two. An imperial gallon is 4.54609 litres.",
    purpose: [
      "Works out the fuel used and the cost for a journey of a given distance.",
      "Handles the miles-per-gallon to litres conversion.",
      "Multiplies up for repeated trips, such as a commute.",
    ],
    methodology:
      "The awkward part of costing a UK journey is that the two units do not match: economy is quoted in miles per imperial gallon, while fuel is priced in pence per litre. The calculation divides the total distance by the fuel economy to give gallons used, converts those to litres using the imperial gallon of 4.54609 litres, and multiplies by the price. The imperial gallon matters here — a US gallon is about 3.785 litres, and using it would understate consumption by around 17%, which is a large error on a long journey. Multiplying by the number of trips turns a single journey into a commute or a regular run, which is usually the more useful figure. The arithmetic itself is straightforward; the accuracy depends almost entirely on whether the miles-per-gallon figure you enter reflects the driving you actually do.",
    formulaExplanation: {
      formula:
        "Litres = (distance in miles ÷ miles per gallon) × 4.54609. Cost = litres × price per litre.",
      steps: [
        "Multiply the trip distance by the number of trips to give total miles.",
        "Divide by the fuel economy in miles per imperial gallon to give gallons used.",
        "Multiply by 4.54609 to convert gallons to litres.",
        "Multiply by the price per litre to give the cost.",
      ],
    },
    workedExample: {
      scenario:
        "A 240-mile journey made twice, in a car returning 45 mpg, with fuel at 148p a litre.",
      engineInputs: { distance_miles: 240, mpg_uk: 45, price_p_per_litre: 148, trips: 2 },
      displayInputs: [
        { label: "Trip distance", display: "240 miles" },
        { label: "Fuel economy", display: "45 UK MPG" },
        { label: "Fuel price", display: "148p per litre" },
        { label: "Number of trips", display: "2" },
      ],
      steps: [
        "Two trips of 240 miles is 480 miles in total.",
        "At 45 mpg that is 480 ÷ 45 = 10.67 imperial gallons.",
        "Converting at 4.54609 litres per gallon gives 48.49 litres.",
        "At 148p a litre the fuel cost is £71.77.",
        "That works out at about 15p a mile — a figure worth knowing before agreeing to share costs.",
      ],
      outputs: [
        { key: "litres", label: "Fuel used (litres)", value: 48.491627, format: "number" },
        { key: "cost_gbp", label: "Fuel cost", value: 71.77, format: "currency" },
      ],
    },
    assumptions: [
      "The economy figure is in miles per imperial gallon, not US gallons.",
      "The same economy is achieved for the whole journey.",
      "The fuel price is the price actually paid per litre.",
    ],
    limitations: [
      "Real-world fuel economy is usually below the official figure, and varies a great deal with speed, load, traffic, weather, tyre pressure and driving style. Motorway cruising and urban stop-start driving can differ by a third or more.",
      "This covers fuel only. It is not the cost of running the vehicle, which also includes depreciation, insurance, tax, servicing and tyres.",
      "Fuel prices vary noticeably between forecourts and regions, and motorway services are typically the most expensive option.",
      "Electric vehicles are not covered, since their running costs are worked out from kilowatt-hours and a tariff rather than from litres.",
      "Tolls, congestion and clean air zone charges and parking are not included.",
    ],
    ruleStatus: "NOT RULE-SENSITIVE",
    officialSources: [
      {
        title: "Fuel consumption and emissions data for cars",
        publisher: "GOV.UK",
        url: "https://www.gov.uk/co2-and-vehicle-tax-tools",
        sourceType: "government-guidance",
        verificationStatus: "VERIFIED",
        applicableRule: "Official fuel consumption figures published for UK vehicles",
      },
      {
        title: "Weights and Measures Act 1985",
        publisher: "legislation.gov.uk",
        url: "https://www.legislation.gov.uk/ukpga/1985/72/contents",
        sourceType: "legislation",
        verificationStatus: "VERIFIED",
        applicableRule: "Statutory definition of the imperial gallon used in the litre conversion",
      },
    ],
    relatedCalculators: [
      { calculatorId: "AUT-005", why: "Convert between miles per gallon and litres per 100 km directly." },
      { calculatorId: "CON-002", why: "Convert distances between miles and kilometres." },
      { calculatorId: "AUT-001", why: "Look at the wider running costs a fuel figure leaves out." },
    ],
    faqs: [
      {
        question: "Is a gallon here the same as a US gallon?",
        answer:
          "No, and the difference is large. A UK imperial gallon is 4.54609 litres against about 3.785 for a US gallon. Using the US figure would understate fuel used by roughly 17%, which is a substantial error on a long journey.",
      },
      {
        question: "Why does my real economy fall short of the official figure?",
        answer:
          "Official figures come from standardised test conditions that no real journey matches. Speed, traffic, load, weather, tyre pressure and driving style all reduce economy, and short cold-start journeys are particularly costly.",
      },
      {
        question: "Is this the full cost of the journey?",
        answer:
          "No — it is fuel only. Depreciation, insurance, tax, servicing and tyres all accrue with mileage too, and per-mile running cost is typically well above the fuel cost alone.",
      },
      {
        question: "Can I use this for an electric car?",
        answer:
          "No. Electric running costs are worked out from kilowatt-hours consumed and the tariff you charge at, which is a different calculation with very different numbers.",
      },
    ],
    lastReviewed: REVIEWED,
  },
];
