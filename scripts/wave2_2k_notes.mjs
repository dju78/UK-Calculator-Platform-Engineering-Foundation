/**
 * Narrative specification sections for Wave 2 tranche 2K, Health & Fitness.
 * Run: node scripts/wave2_2k_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const NOT_MEDICAL =
  'An estimate from population formulas, not a measurement of an individual, and not medical advice. The calculator points to a GP or a registered dietitian, and specifically says to speak to a GP first where there is any history of an eating disorder.';

const RULES_NOTE =
  'Rules-sensitive. The BMI thresholds, the NHS daily calorie guide, the maximum daily deficit and the derived calorie floor all come from the versioned ruleset, whose source register names the NHS page each came from and records that the underweight threshold of 18.5 is the World Health Organization figure rather than an NHS one.';

const ADULT_BOUNDS =
  'Heights outside 50 to 260 cm, weights outside 20 to 400 kg and ages outside 18 to 120 are refused with a message that explains the expected unit, because a height entered in metres or a weight in stones would otherwise produce confident nonsense.';

Object.assign(notes, {

  "HLT-002": {
    purpose: "Estimate basal metabolic rate, the energy the body uses at complete rest.",
    scope: "An adult's sex, age, height and weight, with body fat optional.",
    assumptions: ["The formulas are population averages, not measurements."],
    validation: [ADULT_BOUNDS],
    formula: "Mifflin-St Jeor is the headline because it is the most accurate of the three for the general population. Harris-Benedict is shown alongside, and Katch-McArdle only when a body fat percentage is supplied, because it works from lean mass rather than total weight.",
    boundary: "THREE formulas are returned rather than one. They disagree by a few hundred calories for the same person, and presenting a single figure would imply a precision that does not exist. " + NOT_MEDICAL,
    methodology: "Benchmarks assert all three formulas together, so substituting one for another would fail immediately.",
    rules: "Not rules-sensitive; the formulas contain no statutory values.",
    related: ["HLT-003 TDEE", "HLT-004 Calorie Calculator"]
  },

  "HLT-003": {
    purpose: "Estimate total daily energy expenditure from basal rate and activity.",
    scope: "As HLT-002, plus an activity level.",
    assumptions: ["Activity multipliers are population averages from the Harris-Benedict tradition."],
    validation: [ADULT_BOUNDS],
    formula: "Basal rate multiplied by an activity factor from 1.2 for sedentary to 1.9 for extra active.",
    boundary: "The activity factor is the LARGEST source of error here, and the calculator shows the sedentary and very active figures side by side so the reader can see that the gap between them dwarfs the difference between the BMR formulas. Most people overestimate their activity level. " + NOT_MEDICAL,
    methodology: "Each case asserts the sedentary and very active figures as well as the chosen one.",
    rules: "Not rules-sensitive.",
    related: ["HLT-002 BMR", "HLT-004 Calorie Calculator"]
  },

  "HLT-004": {
    purpose: "Turn a maintenance calorie figure and a goal into a daily target that is safe to follow.",
    scope: "Losing, maintaining or gaining weight at a chosen rate.",
    assumptions: [
      "7,700 calories per kilogram of body fat, the conventional dietetic figure.",
      "Maintenance calories come from the user, normally from the TDEE calculator."
    ],
    validation: [
      "The rate of change is CAPPED at 1 kg a week and the user is told the request was reduced.",
      "The daily deficit is CAPPED at the 600 calories the NHS calls safe and sustainable.",
      "The target is FLOORED at a figure derived from NHS guidance, and the floor is announced when it binds."
    ],
    formula: "The implied daily change is the weekly rate times 7,700 divided by 7, then capped. The result is floored for weight loss. Both limits bind independently and whichever is tighter wins.",
    boundary: "THE SAFETY BEHAVIOUR IS STRUCTURAL, NOT ADVISORY. A calorie calculator that returns whatever a user asks for is not a neutral tool: it will hand a starvation target to anyone who requests one. A test sweeps the entire plausible input space - both sexes, five maintenance levels and rates up to 100 kg a week - and asserts that no combination produces a target below the floor. Real weight change also involves water, glycogen and lean mass, so the scales will not follow this smoothly. " + NOT_MEDICAL,
    methodology: "The oracle applies the caps and the floor by EXPLICIT CASE ANALYSIS rather than by a min/max chain, so an inverted comparison in the engine would show up. Two benchmark cases exist purely to make the floor bind and one to make the rate cap bind.",
    rules: RULES_NOTE,
    related: ["HLT-003 TDEE", "HLT-007 Healthy Weight", "HLT-012 Macro Calculator"]
  },

  "HLT-005": {
    purpose: "Estimate body fat percentage from tape measurements.",
    scope: "The US Navy circumference method.",
    assumptions: ["Measurements are taken at the standard sites, in centimetres."],
    validation: [
      "A waist no larger than the neck, or measurements that produce an impossible percentage, are refused with an explanation.",
      ADULT_BOUNDS
    ],
    formula: "The US Navy logarithmic formula, which differs by sex and uses the hip measurement for women.",
    boundary: "This is an ESTIMATE from tape measurements, typically within three to four percentage points of a proper assessment such as a DEXA scan. The decimal place is false precision. The categories describe a population and are not targets: very low body fat carries its own health risks, particularly for women. " + NOT_MEDICAL,
    methodology: "Every case asserts fat mass and lean mass together, so the two must add back to total body weight.",
    rules: "Not rules-sensitive.",
    related: ["HLT-006 Lean Body Mass", "HLT-007 Healthy Weight"]
  },

  "HLT-006": {
    purpose: "Estimate lean body mass, the part of body weight that is not fat.",
    scope: "Boer and James formulas, or a direct calculation from a measured body fat percentage.",
    assumptions: [],
    validation: [ADULT_BOUNDS],
    formula: "A measured body fat percentage is used whenever supplied, because it beats any formula. Otherwise Boer is used and both formulas are shown for comparison.",
    boundary: NOT_MEDICAL,
    methodology: "Benchmarks assert both formulas separately as well as the figure used.",
    rules: "Not rules-sensitive.",
    related: ["HLT-005 Body Fat", "HLT-002 BMR"]
  },

  "HLT-007": {
    purpose: "Work out BMI, its category and the healthy weight range for a height.",
    scope: "Adult BMI with the NHS thresholds, adjusted for ethnic background.",
    assumptions: [],
    validation: [ADULT_BOUNDS, "An underweight result carries a warning that a GP is the right place to start."],
    formula: "BMI is weight in kilograms over height in metres squared. The healthy range is the weight interval that puts BMI between the underweight threshold and the overweight threshold FOR THAT PERSON.",
    boundary: "The NHS uses LOWER thresholds - 23 and 27.5 rather than 25 and 30 - for people from South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean backgrounds, who face health risks at a lower BMI. Most BMI calculators ignore this and understate risk for a large part of the UK population. BMI itself takes no account of muscle, build or where fat is carried. " + NOT_MEDICAL,
    methodology: "A matched benchmark pair uses the SAME height and weight and differs only in the threshold set, and must return different categories - healthy weight on one, overweight on the other. A unit test asserts that directly.",
    rules: RULES_NOTE,
    related: ["HLT-008 Ideal Weight", "HLT-005 Body Fat", "HLT-004 Calorie Calculator"]
  },

  "HLT-008": {
    purpose: "Show a healthy weight range for a height, alongside the classical formulas.",
    scope: "Height and sex.",
    assumptions: [],
    validation: [ADULT_BOUNDS],
    formula: "The healthy BMI range is the honest answer. Robinson, Miller, Devine and Hamwi are shown as context, along with how far apart they are.",
    boundary: "There is NO such thing as one ideal weight, which is why this returns a range and never a single number. The four classical formulas disagree by several kilograms for the same height, none accounts for build or muscle, and all were derived for drug dosing rather than for health. Presenting one figure as an ideal invites people to chase it. " + NOT_MEDICAL,
    methodology: "The spread between the four formulas is asserted as an output, which is the evidence for the claim.",
    rules: RULES_NOTE,
    related: ["HLT-007 Healthy Weight"]
  },

  "HLT-009": {
    purpose: "Split a calorie target into macronutrients with a protein focus.",
    scope: "A calorie figure and three percentages that must sum to 100.",
    assumptions: ["4 calories per gram for protein and carbohydrate, 9 for fat."],
    validation: ["The three percentages must add up to 100, and the error names the total they currently reach."],
    formula: "Each macronutrient's calories are its share of the total, converted to grams at its own calorie density.",
    boundary: "Protein needs are usually quoted per kilogram of body weight rather than as a percentage. Around 0.75 g/kg is the UK reference nutrient intake for a sedentary adult; 1.2 to 2.0 g/kg is commonly used by people training seriously. " + NOT_MEDICAL,
    methodology: "The oracle verifies that the three calorie shares reconstitute the total before recording a case, and a test reconstitutes the calories from the grams, so a wrong calorie density would fail.",
    rules: "Not rules-sensitive.",
    related: ["HLT-012 Macro Calculator", "HLT-004 Calorie Calculator"]
  },

  "HLT-010": {
    purpose: "Split a calorie target into macronutrients with a carbohydrate focus.",
    scope: "As HLT-009.",
    assumptions: ["As HLT-009; the four macro calculators share one implementation."],
    validation: ["As HLT-009."],
    formula: "As HLT-009, with defaults weighted towards carbohydrate.",
    boundary: "Carbohydrate is the body's most accessible fuel, and endurance training raises the requirement considerably. " + NOT_MEDICAL,
    methodology: "Shares the benchmark scenarios with the other three macro calculators, so they cannot disagree.",
    rules: "Not rules-sensitive.",
    related: ["HLT-012 Macro Calculator"]
  },

  "HLT-011": {
    purpose: "Split a calorie target into macronutrients with a fat focus.",
    scope: "As HLT-009.",
    assumptions: ["As HLT-009."],
    validation: ["As HLT-009."],
    formula: "As HLT-009, with defaults weighted towards fat.",
    boundary: "Fat is essential rather than optional: it carries the fat-soluble vitamins and is needed for hormone production, and intakes below about 20% of calories are rarely a good idea. " + NOT_MEDICAL,
    methodology: "As HLT-010.",
    rules: "Not rules-sensitive.",
    related: ["HLT-012 Macro Calculator"]
  },

  "HLT-012": {
    purpose: "Split a calorie target into protein, carbohydrate and fat.",
    scope: "As HLT-009.",
    assumptions: ["As HLT-009."],
    validation: ["As HLT-009."],
    formula: "As HLT-009.",
    boundary: "There is no single correct macronutrient split. Total calories and food quality matter far more than the ratio for most people. " + NOT_MEDICAL,
    methodology: "As HLT-010.",
    rules: "Not rules-sensitive.",
    related: ["HLT-009 Protein", "HLT-010 Carbohydrate", "HLT-011 Fat Intake"]
  },

  "HLT-013": {
    purpose: "Estimate the calories used by an activity from its MET value.",
    scope: "One activity of a stated MET value, duration and body weight.",
    assumptions: ["One MET is one calorie per kilogram per hour."],
    validation: [
      "A MET value above 25 is refused as beyond elite competition.",
      "A session longer than a day is refused."
    ],
    formula: "MET times weight in kilograms divided by 60 gives calories per minute.",
    boundary: "MET values are population averages for an activity at a stated intensity, and real expenditure varies with fitness, technique and terrain. Fitness trackers routinely overestimate. The figure INCLUDES the energy the body would have used anyway during that time, so it is not all additional. " + NOT_MEDICAL,
    methodology: "Independently derived from the MET relation, including a sedentary case at 1.5 MET.",
    rules: "The conversion to kilograms of fat uses the ruleset's 7,700 calories per kilogram.",
    related: ["HLT-003 TDEE", "HLT-004 Calorie Calculator"]
  },

  "HLT-014": {
    purpose: "Convert a run into pace, speed and predicted race times.",
    scope: "A distance and a time.",
    assumptions: ["Race predictions extrapolate the current pace unchanged."],
    validation: ["A time of zero is refused."],
    formula: "Pace is total seconds over distance; speed is distance over hours. Race predictions multiply the pace by the standard distances.",
    boundary: "The predictions are OPTIMISTIC: almost everyone slows as the distance grows, and the marathon figure in particular should be read as a ceiling rather than a target.",
    methodology: "The oracle verifies that the pace multiplied back by the distance returns the original time exactly, and a test checks that the 10 km prediction for a 10 km run equals the time actually run.",
    rules: "Not rules-sensitive.",
    related: ["HLT-013 Calories Burned"]
  },

  "HLT-015": {
    purpose: "Estimate a one repetition maximum from a submaximal set.",
    scope: "A weight and a rep count up to ten.",
    assumptions: [],
    validation: [
      "Rep counts above ten are REFUSED, because the formulas diverge sharply there and stop being reliable.",
      "A whole number of at least one repetition is required."
    ],
    formula: "Epley, Brzycki and Lombardi are all computed, and the LOWEST is used as the headline.",
    boundary: "The lowest estimate is deliberate: over-estimating a one rep max is how people get injured. These are estimates from a submaximal set, not a tested maximum, and a true maximum should never be attempted without a spotter and a proper warm-up.",
    methodology: "A test asserts that the headline equals the minimum of the three and is strictly below the maximum, so a change to the most optimistic formula would fail.",
    rules: "Not rules-sensitive.",
    related: ["HLT-016 Target Heart Rate"]
  },

  "HLT-016": {
    purpose: "Work out training heart rate zones.",
    scope: "Age, with resting heart rate optional.",
    assumptions: ["Maximum heart rate is estimated from age."],
    validation: ["Ages outside 18 to 120 are refused; a resting rate outside 30 to 120 is ignored rather than used."],
    formula: "Maximum heart rate uses Tanaka, 208 less 0.7 times age, which fits the evidence better than 220 minus age, particularly for older adults where the familiar formula underestimates. Where a resting rate is given, Karvonen is used, working from heart rate reserve rather than from maximum alone.",
    boundary: "Maximum heart rate from age is a population average with a spread of ten to twelve beats either side, so the zones are a guide and not a limit. The so-called fat burning zone burns a higher PROPORTION of fat but fewer calories overall, and is not the shortcut it is often sold as. The calculator says to stop and seek advice on chest pain, faintness or unusual breathlessness. " + NOT_MEDICAL,
    methodology: "Matched benchmark pairs at ages 30 and 50 differ only in whether a resting rate is supplied and must switch method.",
    rules: "Not rules-sensitive.",
    related: ["HLT-013 Calories Burned", "HLT-015 One Rep Max"]
  },

  "HLT-017": {
    purpose: "Estimate body surface area by the four standard formulas.",
    scope: "Height and weight.",
    assumptions: [],
    validation: [ADULT_BOUNDS],
    formula: "Du Bois, Mosteller, Haycock and Boyd, with Mosteller as the headline because it is the one most used clinically and simple enough to check by hand.",
    boundary: "Body surface area is used clinically for dosing some medicines. This is a general-purpose estimate and MUST NOT be used to work out a dose: that is a decision for a prescriber using the formula their own protocol specifies. " + NOT_MEDICAL,
    methodology: "All four formulas and their spread are asserted.",
    rules: "Not rules-sensitive.",
    related: ["HLT-005 Body Fat", "HLT-007 Healthy Weight"]
  },

  "HLT-019": {
    purpose: "Work out gestational age, trimester and estimated due date.",
    scope: "The first day of the last period and an average cycle length.",
    assumptions: ["Naegele's rule, adjusted for cycle length."],
    validation: [
      "A cycle length outside 20 to 45 days is refused with advice to speak to a GP or midwife.",
      "A future date, or one more than 45 weeks ago, is refused.",
      "A malformed date is refused with the expected format."
    ],
    formula: "280 days from the first day of the last period, PLUS the difference between the stated cycle length and 28. The classical rule assumes a 28-day cycle, so for a 35-day cycle it is a week out.",
    boundary: "Only about one baby in twenty five arrives on the estimated date, and a dating scan is more accurate than any calculation. Not a test and not a diagnosis.",
    methodology: "Three benchmark cases share a last period date and differ only in cycle length, so the adjustment must move the due date by exactly the difference. Date-relative outputs such as gestational age are deliberately NOT benchmarked, because the browser parity harness cannot pin a clock; they are covered by unit tests with a fixed context instead.",
    rules: "Not rules-sensitive.",
    related: ["HLT-020 Pregnancy Due Date", "HLT-022 Ovulation"]
  },

  "HLT-020": {
    purpose: "Estimate a due date from the last period.",
    scope: "As HLT-019; the two share one implementation.",
    assumptions: ["As HLT-019."],
    validation: ["As HLT-019."],
    formula: "As HLT-019.",
    boundary: "As HLT-019.",
    methodology: "Shares every benchmark scenario with HLT-019, and a test asserts the two return the same due date for the same inputs.",
    rules: "Not rules-sensitive.",
    related: ["HLT-019 Pregnancy Calculator"]
  },

  "HLT-022": {
    purpose: "Estimate ovulation and the fertile window across several cycles.",
    scope: "Last period, cycle length, luteal phase and a number of cycles.",
    assumptions: [
      "Ovulation is the cycle length less the luteal phase.",
      "The fertile window is the five days before ovulation plus the day after, reflecting sperm and egg survival."
    ],
    validation: [
      "Cycle lengths outside 20 to 45 days and luteal phases outside 9 to 17 days are refused with advice to speak to a GP."
    ],
    formula: "Ovulation day is cycle length minus luteal phase, projected forward for each cycle.",
    boundary: "THIS IS NOT A FORM OF CONTRACEPTION and must not be used as one. Ovulation moves between cycles even for people whose periods are regular, sperm can survive up to five days, and a calendar cannot detect any of that. Not a test and not a diagnosis.",
    methodology: "Benchmark cases vary the cycle length and the luteal phase independently, so ovulation must move in opposite directions for each.",
    rules: "Not rules-sensitive.",
    related: ["HLT-023 Period Calculator", "HLT-019 Pregnancy Calculator"]
  },

  "HLT-023": {
    purpose: "Project upcoming periods from the last one.",
    scope: "Last period, cycle length, period length and a number of cycles.",
    assumptions: ["Every cycle is the same length, which almost nobody's is."],
    validation: [
      "Cycle lengths outside 20 to 45 days and period lengths outside 1 to 14 days are refused, the latter noting that longer bleeding is worth discussing with a GP."
    ],
    formula: "Each period starts one cycle length after the previous one.",
    boundary: "The assumption of a constant cycle is the weakness, so the dates are a rough guide. Cycles shorter than 24 days or longer than 35 are flagged as outside the usual range. Unusually heavy or painful bleeding, marked changes, or bleeding between periods are all worth discussing with a GP. Not a test and not a diagnosis.",
    methodology: "Independently derived from epoch day arithmetic. Date-relative outputs are covered by unit tests rather than benchmarks.",
    rules: "Not rules-sensitive.",
    related: ["HLT-022 Ovulation Calculator"]
  },

  "HLT-025": {
    purpose: "Suggest bedtimes or wake times aligned to sleep cycles.",
    scope: "A target time, a sleep-onset allowance and a cycle length.",
    assumptions: ["Cycles are of constant length within a night, which they are not."],
    validation: [
      "A cycle length outside 60 to 120 minutes is refused.",
      "A sleep-onset time over two hours is refused, with a note that it is worth discussing with a GP.",
      "A malformed time is refused with the expected 24-hour format."
    ],
    formula: "Working backwards from a wake time or forwards from a bedtime, in whole cycles, allowing for time to fall asleep.",
    boundary: "TOTAL SLEEP MATTERS MORE THAN CYCLE ALIGNMENT. A cycle averages ninety minutes but genuinely varies between about seventy and a hundred and twenty, and between nights for the same person, so waking 'between cycles' is a rough idea. Each option is therefore marked according to whether it actually gives an adult the recommended seven to nine hours: a neat four-cycle option is only six, and chasing alignment at the cost of total sleep is the wrong trade. A test asserts exactly that.",
    methodology: "The count of options meeting the recommendation is asserted as an output rather than left implicit.",
    rules: "Not rules-sensitive.",
    related: ["HLT-016 Target Heart Rate"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
