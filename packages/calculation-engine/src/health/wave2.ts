/**
 * Wave 2 Health & Fitness calculators.
 *
 * SAFETY IS BUILT IN, NOT BOLTED ON.
 *
 * Calorie, macronutrient and weight calculators can do real harm if they will
 * cheerfully return a starvation target because someone asked for one. The
 * safety behaviour here is therefore structural rather than a disclaimer:
 *
 *   - The daily deficit is CAPPED at the figure the NHS calls safe and
 *     sustainable. A user cannot request a larger one.
 *   - Calorie targets are FLOORED at a level derived from published NHS
 *     guidance, and the floor is reported when it binds.
 *   - Weight-loss rates faster than the published safe range are refused,
 *     not merely warned about.
 *   - "Ideal weight" is presented as a RANGE, never a single number, because
 *     a single target invites people to chase it.
 *   - Every calculator that touches eating or weight points to a GP or a
 *     registered dietitian, and specifically to speaking to a GP first where
 *     there is a history of an eating disorder.
 *
 * Nothing here is a diagnosis or a treatment plan, and the fertility
 * calculators are explicitly not contraception.
 */
import { assertFiniteNumber } from "../common/validation.js";

export type Sex = "female" | "male";

export function normaliseSex(value: unknown): Sex {
  return String(value ?? "female").toLowerCase().trim().startsWith("m") ? "male" : "female";
}

export type ActivityLevel =
  | "sedentary" | "light" | "moderate" | "very_active" | "extra_active";

/**
 * Activity multipliers from the Harris-Benedict tradition, used unchanged by
 * essentially every TDEE calculator. They are estimates of a population
 * average, not a measurement of an individual.
 */
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9
};

export function normaliseActivity(value: unknown): ActivityLevel {
  const raw = String(value ?? "moderate").toLowerCase().trim();
  return (Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).includes(raw as ActivityLevel)
    ? (raw as ActivityLevel)
    : "moderate";
}

export function activityFactor(level: ActivityLevel): number {
  return ACTIVITY_FACTORS[level];
}

function requirePositive(value: number, label: string): number {
  const n = assertFiniteNumber(value, label);
  if (n <= 0) throw new Error(`${label} must be greater than zero.`);
  return n;
}

/**
 * Bounds on the human body. Values outside these are almost always a typing
 * error - a height entered in metres instead of centimetres, say - and a
 * calculator that silently accepts them produces confident nonsense.
 */
function requireAdultHeight(cm: number): number {
  const h = requirePositive(cm, "Height");
  if (h < 50 || h > 260) {
    throw new Error("Enter your height in centimetres, between 50 and 260. For example, 5 feet 9 inches is about 175 cm.");
  }
  return h;
}

function requireWeight(kg: number): number {
  const w = requirePositive(kg, "Weight");
  if (w < 20 || w > 400) {
    throw new Error("Enter your weight in kilograms, between 20 and 400. For example, 12 stone is about 76 kg.");
  }
  return w;
}

function requireAge(years: number): number {
  const a = assertFiniteNumber(years, "Age");
  if (a < 18 || a > 120) {
    throw new Error(
      "These calculators are for adults aged 18 to 120. Children and young people need different formulas, and a GP or practice nurse is the right place to start."
    );
  }
  return a;
}

const NOT_MEDICAL =
  "An estimate from population formulas, not a measurement of you and not medical advice. Individual needs vary widely with genetics, medical conditions, medication and body composition. Speak to a GP or a registered dietitian before making significant changes, and speak to a GP first if you have ever had an eating disorder.";

// ---------------------------------------------------------------------------
// HLT-002 BMR and HLT-003 TDEE
// ---------------------------------------------------------------------------

export interface BmrResult {
  bmr_mifflin_st_jeor: number;
  bmr_harris_benedict: number;
  bmr_katch_mcardle: number | null;
  bmr_used: number;
  formula_used: string;
  tdee: number;
  activity_factor: number;
  calories_per_hour_at_rest: number;
}

/**
 * Basal metabolic rate.
 *
 * Three formulas are returned rather than one, because they disagree by a
 * few hundred calories and presenting a single figure implies a precision
 * that does not exist. Mifflin-St Jeor is used as the headline because it is
 * the most accurate of the three for the general population; Katch-McArdle is
 * offered only when body fat is known, since it needs lean mass.
 */
export function basalMetabolicRate(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  ageYears: number,
  bodyFatPercentage: number | null,
  activity: ActivityLevel
): BmrResult {
  const w = requireWeight(weightKg);
  const h = requireAdultHeight(heightCm);
  const age = requireAge(ageYears);

  const mifflin =
    10 * w + 6.25 * h - 5 * age + (sex === "male" ? 5 : -161);

  const harris =
    sex === "male"
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * age
      : 447.593 + 9.247 * w + 3.098 * h - 4.33 * age;

  let katch: number | null = null;
  if (bodyFatPercentage !== null && bodyFatPercentage > 0 && bodyFatPercentage < 70) {
    const leanMass = w * (1 - bodyFatPercentage / 100);
    katch = 370 + 21.6 * leanMass;
  }

  const factor = activityFactor(activity);

  return {
    bmr_mifflin_st_jeor: mifflin,
    bmr_harris_benedict: harris,
    bmr_katch_mcardle: katch,
    bmr_used: mifflin,
    formula_used: "Mifflin-St Jeor",
    tdee: mifflin * factor,
    activity_factor: factor,
    calories_per_hour_at_rest: mifflin / 24
  };
}

// ---------------------------------------------------------------------------
// HLT-004 Calorie target
// ---------------------------------------------------------------------------

export type WeightGoal = "lose" | "maintain" | "gain";

export function normaliseGoal(value: unknown): WeightGoal {
  const raw = String(value ?? "maintain").toLowerCase().trim();
  if (raw === "lose") return "lose";
  if (raw === "gain") return "gain";
  return "maintain";
}

export interface CalorieTargetResult {
  maintenance_calories: number;
  goal: WeightGoal;
  requested_rate_kg_per_week: number;
  applied_rate_kg_per_week: number;
  rate_was_capped: boolean;
  daily_adjustment: number;
  target_calories: number;
  floor_applied: boolean;
  minimum_safe_calories: number;
  weeks_to_target_weight: number | null;
  nhs_daily_guide: number;
}

/**
 * A daily calorie target for a stated goal.
 *
 * The deficit is capped and the result floored. Someone asking to lose 2 kg a
 * week gets the safe rate and is told plainly that the request was reduced,
 * rather than being handed a number that would harm them.
 */
export function calorieTarget(
  maintenanceCalories: number,
  goal: WeightGoal,
  ratePerWeekKg: number,
  currentWeightKg: number,
  targetWeightKg: number | null,
  sex: Sex,
  rules: any
): CalorieTargetResult {
  const maintenance = requirePositive(maintenanceCalories, "Maintenance calories");
  const requestedRate = Math.abs(assertFiniteNumber(ratePerWeekKg, "Rate of change"));
  const current = requireWeight(currentWeightKg);

  const health = rules.health;
  const maxRate = health.safe_weight_loss_kg_per_week.max;
  const kcalPerKg = health.kcal_per_kg_body_fat;
  const maxDeficit = health.maximum_daily_deficit_kcal;
  const floor = health.minimum_daily_calories[sex];

  const appliedRate = goal === "maintain" ? 0 : Math.min(requestedRate, maxRate);

  // The daily adjustment implied by the rate, then capped at the published
  // safe deficit. Both limits bind, and whichever is tighter wins.
  let adjustment = (appliedRate * kcalPerKg) / 7;
  if (goal === "lose") adjustment = -Math.min(adjustment, maxDeficit);
  else if (goal === "gain") adjustment = Math.min(adjustment, maxDeficit);
  else adjustment = 0;

  const uncapped = maintenance + adjustment;
  const target = goal === "lose" ? Math.max(uncapped, floor) : uncapped;

  let weeks: number | null = null;
  if (targetWeightKg !== null && targetWeightKg > 0 && appliedRate > 0) {
    const change = Math.abs(current - targetWeightKg);
    weeks = change / appliedRate;
  }

  return {
    maintenance_calories: maintenance,
    goal,
    requested_rate_kg_per_week: requestedRate,
    applied_rate_kg_per_week: appliedRate,
    rate_was_capped: goal !== "maintain" && requestedRate > maxRate,
    daily_adjustment: adjustment,
    target_calories: target,
    floor_applied: goal === "lose" && uncapped < floor,
    minimum_safe_calories: floor,
    weeks_to_target_weight: weeks,
    nhs_daily_guide: health.daily_calorie_guide[sex]
  };
}

// ---------------------------------------------------------------------------
// HLT-005 Body Fat and HLT-006 Lean Body Mass
// ---------------------------------------------------------------------------

export interface BodyFatResult {
  body_fat_percentage: number;
  fat_mass_kg: number;
  lean_mass_kg: number;
  method: string;
  category: string;
  bmi_estimate: number;
}

/**
 * Body fat by the US Navy circumference method.
 *
 * It is a circumference estimate, not a measurement, and it is typically
 * within three to four percentage points of a proper assessment. That is
 * stated rather than implied, because people treat a decimal place as
 * precision.
 */
export function bodyFat(
  sex: Sex,
  heightCm: number,
  neckCm: number,
  waistCm: number,
  hipCm: number,
  weightKg: number
): BodyFatResult {
  const h = requireAdultHeight(heightCm);
  const neck = requirePositive(neckCm, "Neck measurement");
  const waist = requirePositive(waistCm, "Waist measurement");
  const w = requireWeight(weightKg);

  let percentage: number;
  if (sex === "male") {
    if (waist <= neck) {
      throw new Error("The waist measurement must be larger than the neck measurement. Check that both are in centimetres.");
    }
    percentage =
      495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
  } else {
    const hip = requirePositive(hipCm, "Hip measurement");
    if (waist + hip <= neck) {
      throw new Error("The waist and hip measurements together must be larger than the neck measurement. Check that all three are in centimetres.");
    }
    percentage =
      495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(h)) - 450;
  }

  if (!Number.isFinite(percentage) || percentage <= 0 || percentage >= 70) {
    throw new Error(
      "Those measurements do not produce a sensible body fat estimate. Check that every measurement is in centimetres and taken at the right place."
    );
  }

  // Categories from the widely used American Council on Exercise bands. They
  // are population descriptions, not targets.
  const bands = sex === "male"
    ? [[6, "Essential fat"], [14, "Athletic"], [18, "Fitness"], [25, "Average"]] as const
    : [[14, "Essential fat"], [21, "Athletic"], [25, "Fitness"], [32, "Average"]] as const;
  let category = "Above average";
  for (const [limit, name] of bands) {
    if (percentage < limit) { category = name; break; }
  }

  const heightM = h / 100;

  return {
    body_fat_percentage: percentage,
    fat_mass_kg: (w * percentage) / 100,
    lean_mass_kg: w * (1 - percentage / 100),
    method: "US Navy circumference method",
    category,
    bmi_estimate: w / (heightM * heightM)
  };
}

export interface LeanMassResult {
  lean_body_mass_kg: number;
  fat_mass_kg: number;
  lean_mass_percentage: number;
  boer_estimate: number;
  james_estimate: number;
  method: string;
}

export function leanBodyMass(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  bodyFatPercentage: number | null
): LeanMassResult {
  const w = requireWeight(weightKg);
  const h = requireAdultHeight(heightCm);

  const boer = sex === "male"
    ? 0.407 * w + 0.267 * h - 19.2
    : 0.252 * w + 0.473 * h - 48.3;

  const james = sex === "male"
    ? 1.1 * w - 128 * Math.pow(w / h, 2)
    : 1.07 * w - 148 * Math.pow(w / h, 2);

  // A measured body fat percentage beats any formula, so it is used when
  // available and the formulas are shown alongside for comparison.
  const fromBodyFat =
    bodyFatPercentage !== null && bodyFatPercentage > 0 && bodyFatPercentage < 70
      ? w * (1 - bodyFatPercentage / 100)
      : null;

  const lean = fromBodyFat ?? boer;

  return {
    lean_body_mass_kg: lean,
    fat_mass_kg: w - lean,
    lean_mass_percentage: (lean / w) * 100,
    boer_estimate: boer,
    james_estimate: james,
    method: fromBodyFat !== null
      ? "From your measured body fat percentage"
      : "Boer formula, because no body fat percentage was given"
  };
}

// ---------------------------------------------------------------------------
// HLT-007 Healthy Weight and HLT-008 Ideal Weight
// ---------------------------------------------------------------------------

export interface HealthyWeightResult {
  bmi: number;
  category: string;
  healthy_weight_lower_kg: number;
  healthy_weight_upper_kg: number;
  weight_to_lose_kg: number;
  weight_to_gain_kg: number;
  is_within_healthy_range: boolean;
  thresholds_used: string;
  overweight_threshold: number;
  obese_threshold: number;
}

/**
 * Healthy weight range from BMI.
 *
 * The thresholds differ by ethnic background, and this is the point most BMI
 * calculators get wrong: the NHS uses 23 and 27.5 rather than 25 and 30 for
 * people from South Asian, Chinese, other Asian, Middle Eastern, Black African
 * or African-Caribbean backgrounds, who face health risks at a lower BMI.
 * Ignoring that understates risk for a large part of the UK population.
 */
export function healthyWeight(
  weightKg: number,
  heightCm: number,
  higherRiskBackground: boolean,
  rules: any
): HealthyWeightResult {
  const w = requireWeight(weightKg);
  const h = requireAdultHeight(heightCm);
  const heightM = h / 100;
  const bmi = w / (heightM * heightM);

  const bmiRules = rules.health.bmi;
  const overweightFrom = higherRiskBackground
    ? bmiRules.higher_risk_ethnic_groups.overweight_from
    : bmiRules.overweight_from;
  const obeseFrom = higherRiskBackground
    ? bmiRules.higher_risk_ethnic_groups.obese_from
    : bmiRules.obese_from;

  const category =
    bmi < bmiRules.underweight_below ? "Underweight"
      : bmi < overweightFrom ? "Healthy weight"
        : bmi < obeseFrom ? "Overweight"
          : "Obese";

  const lower = bmiRules.underweight_below * heightM * heightM;
  const upper = overweightFrom * heightM * heightM;

  return {
    bmi,
    category,
    healthy_weight_lower_kg: lower,
    healthy_weight_upper_kg: upper,
    weight_to_lose_kg: Math.max(0, w - upper),
    weight_to_gain_kg: Math.max(0, lower - w),
    is_within_healthy_range: bmi >= bmiRules.underweight_below && bmi < overweightFrom,
    thresholds_used: higherRiskBackground
      ? `Overweight from ${overweightFrom}, obese from ${obeseFrom}, the NHS thresholds for people at risk of health problems at a lower BMI.`
      : `Overweight from ${overweightFrom}, obese from ${obeseFrom}, the NHS thresholds for most adults.`,
    overweight_threshold: overweightFrom,
    obese_threshold: obeseFrom
  };
}

export interface IdealWeightResult {
  range_lower_kg: number;
  range_upper_kg: number;
  robinson: number;
  miller: number;
  devine: number;
  hamwi: number;
  bmi_based_lower: number;
  bmi_based_upper: number;
  formulas_disagree_by_kg: number;
}

/**
 * "Ideal" weight.
 *
 * Deliberately returned as a RANGE with the individual formulas shown, never
 * as a single number. The four classical formulas disagree with each other by
 * several kilograms for the same person, and none of them accounts for build
 * or muscle. Presenting one figure as an ideal invites people to chase it.
 */
export function idealWeight(sex: Sex, heightCm: number, rules: any): IdealWeightResult {
  const h = requireAdultHeight(heightCm);
  const inchesOver5Feet = Math.max(0, h / 2.54 - 60);

  const robinson = sex === "male" ? 52 + 1.9 * inchesOver5Feet : 49 + 1.7 * inchesOver5Feet;
  const miller = sex === "male" ? 56.2 + 1.41 * inchesOver5Feet : 53.1 + 1.36 * inchesOver5Feet;
  const devine = sex === "male" ? 50 + 2.3 * inchesOver5Feet : 45.5 + 2.3 * inchesOver5Feet;
  const hamwi = sex === "male" ? 48 + 2.7 * inchesOver5Feet : 45.5 + 2.2 * inchesOver5Feet;

  const heightM = h / 100;
  const bmiRules = rules.health.bmi;
  const bmiLower = bmiRules.underweight_below * heightM * heightM;
  const bmiUpper = bmiRules.overweight_from * heightM * heightM;

  const all = [robinson, miller, devine, hamwi];

  return {
    // The healthy BMI range is the honest answer; the formulas are context.
    range_lower_kg: bmiLower,
    range_upper_kg: bmiUpper,
    robinson, miller, devine, hamwi,
    bmi_based_lower: bmiLower,
    bmi_based_upper: bmiUpper,
    formulas_disagree_by_kg: Math.max(...all) - Math.min(...all)
  };
}

// ---------------------------------------------------------------------------
// HLT-009 to HLT-012 Macronutrients
// ---------------------------------------------------------------------------

export interface MacroResult {
  calories: number;
  protein_grams: number;
  carbohydrate_grams: number;
  fat_grams: number;
  protein_calories: number;
  carbohydrate_calories: number;
  fat_calories: number;
  protein_percentage: number;
  carbohydrate_percentage: number;
  fat_percentage: number;
  protein_grams_per_kg: number | null;
  fibre_grams_recommended: number;
}

/**
 * Split a calorie target into macronutrients.
 *
 * Protein and carbohydrate provide 4 kcal per gram and fat 9, so the three
 * percentages must sum to 100 or the grams will not add back up to the
 * calories. That is enforced rather than assumed.
 */
export function macros(
  calories: number,
  proteinPct: number,
  carbPct: number,
  fatPct: number,
  bodyWeightKg: number | null
): MacroResult {
  const kcal = requirePositive(calories, "Calories");
  const p = assertFiniteNumber(proteinPct, "Protein percentage");
  const c = assertFiniteNumber(carbPct, "Carbohydrate percentage");
  const f = assertFiniteNumber(fatPct, "Fat percentage");

  for (const [name, value] of [["Protein", p], ["Carbohydrate", c], ["Fat", f]] as const) {
    if (value < 0 || value > 100) throw new Error(`${name} must be between 0% and 100%.`);
  }
  const total = p + c + f;
  if (Math.abs(total - 100) > 0.01) {
    throw new Error(
      `The three percentages must add up to 100. They currently add up to ${Math.round(total * 100) / 100}.`
    );
  }

  const proteinCals = (kcal * p) / 100;
  const carbCals = (kcal * c) / 100;
  const fatCals = (kcal * f) / 100;

  return {
    calories: kcal,
    protein_grams: proteinCals / 4,
    carbohydrate_grams: carbCals / 4,
    fat_grams: fatCals / 9,
    protein_calories: proteinCals,
    carbohydrate_calories: carbCals,
    fat_calories: fatCals,
    protein_percentage: p / 100,
    carbohydrate_percentage: c / 100,
    fat_percentage: f / 100,
    protein_grams_per_kg:
      bodyWeightKg !== null && bodyWeightKg > 0 ? proteinCals / 4 / bodyWeightKg : null,
    // The UK recommendation for adults, from the government's Eatwell advice.
    fibre_grams_recommended: 30
  };
}

// ---------------------------------------------------------------------------
// HLT-013 Calories Burned
// ---------------------------------------------------------------------------

export interface CaloriesBurnedResult {
  calories_burned: number;
  met_value: number;
  duration_minutes: number;
  calories_per_minute: number;
  equivalent_kg_of_fat: number;
  weekly_if_repeated: number;
}

/**
 * Calories burned from a MET value.
 *
 * MET values are population averages for an activity performed at a stated
 * intensity. Real expenditure varies a great deal with fitness, technique and
 * terrain, and fitness trackers routinely overestimate.
 */
export function caloriesBurned(
  metValue: number,
  weightKg: number,
  durationMinutes: number,
  timesPerWeek: number,
  rules: any
): CaloriesBurnedResult {
  const met = requirePositive(metValue, "MET value");
  const w = requireWeight(weightKg);
  const minutes = requirePositive(durationMinutes, "Duration");
  const perWeek = Math.max(0, assertFiniteNumber(timesPerWeek, "Times per week"));

  if (met > 25) {
    throw new Error("A MET value above 25 is beyond even elite competition. Check the figure.");
  }
  if (minutes > 1440) throw new Error("A single session cannot be longer than a day.");

  // The standard relation: 1 MET is 1 kcal per kilogram per hour.
  const perMinute = (met * w) / 60;
  const burned = perMinute * minutes;

  return {
    calories_burned: burned,
    met_value: met,
    duration_minutes: minutes,
    calories_per_minute: perMinute,
    equivalent_kg_of_fat: burned / rules.health.kcal_per_kg_body_fat,
    weekly_if_repeated: burned * perWeek
  };
}

// ---------------------------------------------------------------------------
// HLT-014 Pace
// ---------------------------------------------------------------------------

export interface PaceResult {
  pace_seconds_per_km: number;
  pace_per_km: string;
  pace_per_mile: string;
  speed_kmh: number;
  speed_mph: number;
  total_seconds: number;
  finish_time_5k: string;
  finish_time_10k: string;
  finish_time_half_marathon: string;
  finish_time_marathon: string;
}

const MILES_PER_KM = 0.621371192237334;

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "-";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  // Rounding seconds can carry into the minute, so normalise afterwards.
  const carryMinutes = seconds === 60 ? minutes + 1 : minutes;
  const displaySeconds = seconds === 60 ? 0 : seconds;
  const carryHours = carryMinutes === 60 ? hours + 1 : hours;
  const displayMinutes = carryMinutes === 60 ? 0 : carryMinutes;
  const pad = (n: number) => String(n).padStart(2, "0");
  return carryHours > 0
    ? `${carryHours}:${pad(displayMinutes)}:${pad(displaySeconds)}`
    : `${displayMinutes}:${pad(displaySeconds)}`;
}

export function pace(distanceKm: number, hours: number, minutes: number, seconds: number): PaceResult {
  const distance = requirePositive(distanceKm, "Distance");
  const h = Math.max(0, assertFiniteNumber(hours, "Hours"));
  const m = Math.max(0, assertFiniteNumber(minutes, "Minutes"));
  const s = Math.max(0, assertFiniteNumber(seconds, "Seconds"));

  const totalSeconds = h * 3600 + m * 60 + s;
  if (totalSeconds <= 0) throw new Error("Enter the time it took, as hours, minutes and seconds.");

  const perKm = totalSeconds / distance;
  const perMile = perKm / MILES_PER_KM;
  const speedKmh = distance / (totalSeconds / 3600);

  return {
    pace_seconds_per_km: perKm,
    pace_per_km: formatDuration(perKm),
    pace_per_mile: formatDuration(perMile),
    speed_kmh: speedKmh,
    speed_mph: speedKmh * MILES_PER_KM,
    total_seconds: totalSeconds,
    // Straight extrapolation at the same pace. Real races slow over distance,
    // and the handler says so.
    finish_time_5k: formatDuration(perKm * 5),
    finish_time_10k: formatDuration(perKm * 10),
    finish_time_half_marathon: formatDuration(perKm * 21.0975),
    finish_time_marathon: formatDuration(perKm * 42.195)
  };
}

// ---------------------------------------------------------------------------
// HLT-015 One Rep Max
// ---------------------------------------------------------------------------

export interface OneRepMaxResult {
  one_rep_max: number;
  epley: number;
  brzycki: number;
  lombardi: number;
  lowest_estimate: number;
  highest_estimate: number;
  percentage_table: Array<{ percentage: number; weight: number; approximate_reps: number }>;
  reps_used: number;
}

/**
 * One repetition maximum from a submaximal set.
 *
 * Three formulas are given and the LOWEST is used as the headline, because
 * over-estimating a one rep max is how people get hurt. The estimates diverge
 * sharply above about ten repetitions, so higher rep counts are refused.
 */
export function oneRepMax(weight: number, reps: number): OneRepMaxResult {
  const w = requirePositive(weight, "Weight lifted");
  const r = assertFiniteNumber(reps, "Repetitions");

  if (!Number.isInteger(r) || r < 1) {
    throw new Error("Enter a whole number of repetitions, at least 1.");
  }
  if (r > 10) {
    throw new Error(
      "Above about ten repetitions these formulas diverge sharply and stop being reliable. Use a heavier weight for fewer repetitions and try again."
    );
  }

  const epley = r === 1 ? w : w * (1 + r / 30);
  const brzycki = r === 1 ? w : w * (36 / (37 - r));
  const lombardi = w * Math.pow(r, 0.1);

  const all = [epley, brzycki, lombardi];
  const lowest = Math.min(...all);

  const table = [100, 95, 90, 85, 80, 75, 70, 65, 60].map((percentage) => ({
    percentage,
    weight: (lowest * percentage) / 100,
    approximate_reps: Math.max(1, Math.round((100 - percentage) / 2.5) + 1)
  }));

  return {
    // The most conservative estimate, deliberately.
    one_rep_max: lowest,
    epley, brzycki, lombardi,
    lowest_estimate: lowest,
    highest_estimate: Math.max(...all),
    percentage_table: table,
    reps_used: r
  };
}

// ---------------------------------------------------------------------------
// HLT-016 Target Heart Rate
// ---------------------------------------------------------------------------

export interface HeartRateResult {
  maximum_heart_rate: number;
  resting_heart_rate: number | null;
  heart_rate_reserve: number | null;
  moderate_lower: number;
  moderate_upper: number;
  vigorous_lower: number;
  vigorous_upper: number;
  fat_burn_lower: number;
  fat_burn_upper: number;
  method: string;
}

/**
 * Training heart rate zones.
 *
 * Where a resting heart rate is known the Karvonen method is used, because it
 * personalises the zones to the individual's reserve rather than to their age
 * alone. Maximum heart rate from age is a population average with a standard
 * deviation of around ten to twelve beats per minute, so the zones are a
 * guide, not a limit.
 */
export function heartRateZones(ageYears: number, restingHeartRate: number | null): HeartRateResult {
  const age = requireAge(ageYears);
  // Tanaka: 208 - 0.7 x age, which fits the data better than 220 - age,
  // particularly for older adults, where 220 - age underestimates.
  const maximum = 208 - 0.7 * age;

  const resting =
    restingHeartRate !== null && restingHeartRate >= 30 && restingHeartRate <= 120
      ? restingHeartRate
      : null;

  if (resting !== null) {
    const reserve = maximum - resting;
    const zone = (lower: number, upper: number) => [
      resting + reserve * lower,
      resting + reserve * upper
    ];
    const [modLow, modHigh] = zone(0.5, 0.7);
    const [vigLow, vigHigh] = zone(0.7, 0.85);
    const [fatLow, fatHigh] = zone(0.5, 0.6);
    return {
      maximum_heart_rate: maximum,
      resting_heart_rate: resting,
      heart_rate_reserve: reserve,
      moderate_lower: modLow, moderate_upper: modHigh,
      vigorous_lower: vigLow, vigorous_upper: vigHigh,
      fat_burn_lower: fatLow, fat_burn_upper: fatHigh,
      method: "Karvonen, using your heart rate reserve"
    };
  }

  return {
    maximum_heart_rate: maximum,
    resting_heart_rate: null,
    heart_rate_reserve: null,
    moderate_lower: maximum * 0.5, moderate_upper: maximum * 0.7,
    vigorous_lower: maximum * 0.7, vigorous_upper: maximum * 0.85,
    fat_burn_lower: maximum * 0.5, fat_burn_upper: maximum * 0.6,
    method: "Percentage of maximum heart rate, because no resting rate was given"
  };
}

// ---------------------------------------------------------------------------
// HLT-017 Body Surface Area
// ---------------------------------------------------------------------------

export interface BodySurfaceAreaResult {
  du_bois: number;
  mosteller: number;
  haycock: number;
  boyd: number;
  bsa_used: number;
  formulas_disagree_by: number;
  method: string;
}

export function bodySurfaceArea(weightKg: number, heightCm: number): BodySurfaceAreaResult {
  const w = requireWeight(weightKg);
  const h = requireAdultHeight(heightCm);

  const duBois = 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425);
  const mosteller = Math.sqrt((h * w) / 3600);
  const haycock = 0.024265 * Math.pow(h, 0.3964) * Math.pow(w, 0.5378);
  const boyd =
    0.0003207 *
    Math.pow(h, 0.3) *
    Math.pow(w * 1000, 0.7285 - 0.0188 * Math.log10(w * 1000));

  const all = [duBois, mosteller, haycock, boyd];

  return {
    du_bois: duBois,
    mosteller,
    haycock,
    boyd,
    // Mosteller is the one most used clinically, because it is simple enough
    // to check by hand.
    bsa_used: mosteller,
    formulas_disagree_by: Math.max(...all) - Math.min(...all),
    method: "Mosteller"
  };
}

// ---------------------------------------------------------------------------
// HLT-019 / HLT-020 Pregnancy, HLT-022 Ovulation, HLT-023 Period
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: unknown, label: string): Date {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${label} must be a date in the form YYYY-MM-DD.`);
  }
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a real date.`);
  return date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface PregnancyResult {
  last_period_date: string;
  cycle_length_used: number;
  estimated_due_date: string;
  conception_date_estimate: string;
  gestational_age_weeks: number;
  gestational_age_days: number;
  trimester: number;
  days_remaining: number;
  first_trimester_ends: string;
  second_trimester_ends: string;
  is_full_term: boolean;
}

/**
 * Estimated due date by Naegele's rule, adjusted for cycle length.
 *
 * The classical rule assumes a 28-day cycle. Someone with a 35-day cycle
 * ovulates a week later and their due date moves accordingly, which the
 * unadjusted rule gets wrong by a week. Only about 4% of babies arrive on
 * the estimated date, and the calculator says so.
 */
export function pregnancy(
  lastPeriodDate: unknown,
  cycleLengthDays: number,
  today: Date
): PregnancyResult {
  const lmp = parseDate(lastPeriodDate, "The first day of your last period");
  const cycle = assertFiniteNumber(cycleLengthDays, "Cycle length");

  if (cycle < 20 || cycle > 45) {
    throw new Error("Enter a cycle length between 20 and 45 days. Outside that range, speak to a GP or midwife.");
  }
  if (lmp.getTime() > today.getTime()) {
    throw new Error("The first day of your last period cannot be in the future.");
  }

  const daysSince = Math.floor((today.getTime() - lmp.getTime()) / DAY_MS);
  if (daysSince > 320) {
    throw new Error(
      "That date is more than 45 weeks ago, which is beyond any pregnancy. Check the date."
    );
  }

  // Naegele's rule is 280 days from the last period on a 28-day cycle; the
  // adjustment shifts it by the difference in cycle length.
  const adjustment = cycle - 28;
  const dueDate = addDays(lmp, 280 + adjustment);
  const conception = addDays(lmp, 14 + adjustment);

  const weeks = Math.floor(daysSince / 7);
  const days = daysSince % 7;
  const trimester = daysSince < 14 * 7 ? 1 : daysSince < 28 * 7 ? 2 : 3;

  return {
    last_period_date: isoDate(lmp),
    cycle_length_used: cycle,
    estimated_due_date: isoDate(dueDate),
    conception_date_estimate: isoDate(conception),
    gestational_age_weeks: weeks,
    gestational_age_days: days,
    trimester,
    days_remaining: Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS)),
    first_trimester_ends: isoDate(addDays(lmp, 13 * 7 + 6)),
    second_trimester_ends: isoDate(addDays(lmp, 27 * 7 + 6)),
    is_full_term: daysSince >= 37 * 7
  };
}

export interface OvulationResult {
  cycle_length_used: number;
  luteal_phase_used: number;
  next_period_date: string;
  ovulation_date_estimate: string;
  fertile_window_start: string;
  fertile_window_end: string;
  fertile_days: number;
  cycles_shown: Array<{ cycle: number; period_starts: string; ovulation: string; fertile_from: string; fertile_to: string }>;
}

/**
 * Estimated ovulation and fertile window.
 *
 * This is an ESTIMATE from a calendar, not a test. Ovulation moves between
 * cycles even for people whose cycles are regular, and this method is NOT a
 * form of contraception. Both facts are stated by the handler rather than
 * being left to inference.
 */
export function ovulation(
  lastPeriodDate: unknown,
  cycleLengthDays: number,
  lutealPhaseDays: number,
  cyclesToShow: number
): OvulationResult {
  const lmp = parseDate(lastPeriodDate, "The first day of your last period");
  const cycle = assertFiniteNumber(cycleLengthDays, "Cycle length");
  const luteal = assertFiniteNumber(lutealPhaseDays, "Luteal phase length");
  const count = Math.max(1, Math.min(12, Math.round(assertFiniteNumber(cyclesToShow, "Cycles to show"))));

  if (cycle < 20 || cycle > 45) {
    throw new Error("Enter a cycle length between 20 and 45 days. Outside that range, speak to a GP.");
  }
  if (luteal < 9 || luteal > 17) {
    throw new Error("The luteal phase is normally between 9 and 17 days. 14 is the usual assumption.");
  }

  const ovulationDay = cycle - luteal;
  const cycles = [];
  for (let i = 0; i < count; i++) {
    const start = addDays(lmp, cycle * i);
    const ov = addDays(start, ovulationDay);
    cycles.push({
      cycle: i + 1,
      period_starts: isoDate(start),
      ovulation: isoDate(ov),
      // Sperm survive up to five days; the egg about one.
      fertile_from: isoDate(addDays(ov, -5)),
      fertile_to: isoDate(addDays(ov, 1))
    });
  }

  const first = cycles[0];
  return {
    cycle_length_used: cycle,
    luteal_phase_used: luteal,
    next_period_date: isoDate(addDays(lmp, cycle)),
    ovulation_date_estimate: first.ovulation,
    fertile_window_start: first.fertile_from,
    fertile_window_end: first.fertile_to,
    fertile_days: 6,
    cycles_shown: cycles
  };
}

export interface PeriodResult {
  cycle_length_used: number;
  period_length_used: number;
  next_period_date: string;
  next_period_ends: string;
  days_until_next: number;
  average_cycle_note: string;
  upcoming: Array<{ cycle: number; starts: string; ends: string }>;
}

export function periodTracker(
  lastPeriodDate: unknown,
  cycleLengthDays: number,
  periodLengthDays: number,
  cyclesToShow: number,
  today: Date
): PeriodResult {
  const lmp = parseDate(lastPeriodDate, "The first day of your last period");
  const cycle = assertFiniteNumber(cycleLengthDays, "Cycle length");
  const periodLength = assertFiniteNumber(periodLengthDays, "Period length");
  const count = Math.max(1, Math.min(12, Math.round(assertFiniteNumber(cyclesToShow, "Cycles to show"))));

  if (cycle < 20 || cycle > 45) {
    throw new Error("Enter a cycle length between 20 and 45 days. Outside that range, speak to a GP.");
  }
  if (periodLength < 1 || periodLength > 14) {
    throw new Error("Enter a period length between 1 and 14 days. Bleeding for longer than that is worth discussing with a GP.");
  }

  const upcoming = [];
  for (let i = 1; i <= count; i++) {
    const start = addDays(lmp, cycle * i);
    upcoming.push({
      cycle: i,
      starts: isoDate(start),
      ends: isoDate(addDays(start, periodLength - 1))
    });
  }

  const next = addDays(lmp, cycle);

  return {
    cycle_length_used: cycle,
    period_length_used: periodLength,
    next_period_date: isoDate(next),
    next_period_ends: isoDate(addDays(next, periodLength - 1)),
    days_until_next: Math.ceil((next.getTime() - today.getTime()) / DAY_MS),
    average_cycle_note:
      cycle < 24 || cycle > 35
        ? "Cycles shorter than 24 days or longer than 35 are outside the usual range and are worth mentioning to a GP."
        : "This cycle length is within the usual range.",
    upcoming
  };
}

// ---------------------------------------------------------------------------
// HLT-025 Sleep
// ---------------------------------------------------------------------------

export interface SleepResult {
  mode: string;
  cycle_length_minutes: number;
  fall_asleep_minutes: number;
  times: Array<{ cycles: number; time: string; hours_of_sleep: number; meets_recommendation: boolean }>;
  recommended_hours_lower: number;
  recommended_hours_upper: number;
}

/**
 * Bedtimes or wake times aligned to sleep cycles.
 *
 * A cycle averages ninety minutes but genuinely varies between 70 and 120,
 * and between nights for the same person, so these are a rough guide. The
 * calculator marks which options actually meet the recommended 7 to 9 hours
 * for an adult, because a "perfect" four-cycle option is only six hours and
 * chasing cycle alignment at the cost of total sleep is the wrong trade.
 */
export function sleep(
  mode: "bedtime" | "wake_time",
  timeText: string,
  fallAsleepMinutes: number,
  cycleMinutes: number
): SleepResult {
  const text = String(timeText ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) throw new Error("Enter a time in 24-hour form, for example 22:30.");
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("That is not a valid time of day.");

  const fallAsleep = Math.max(0, assertFiniteNumber(fallAsleepMinutes, "Time to fall asleep"));
  const cycle = assertFiniteNumber(cycleMinutes, "Cycle length");
  if (cycle < 60 || cycle > 120) {
    throw new Error("A sleep cycle is between 60 and 120 minutes. 90 is the usual assumption.");
  }
  if (fallAsleep > 120) {
    throw new Error("Taking more than two hours to fall asleep is worth discussing with a GP.");
  }

  const base = hours * 60 + minutes;
  const times = [];
  for (let cycles = 3; cycles <= 6; cycles++) {
    const sleepMinutes = cycles * cycle;
    // Working backwards from a wake time, or forwards from a bedtime.
    const raw = mode === "wake_time"
      ? base - sleepMinutes - fallAsleep
      : base + fallAsleep + sleepMinutes;
    const normalised = ((raw % 1440) + 1440) % 1440;
    const hh = Math.floor(normalised / 60);
    const mm = normalised % 60;
    const hoursOfSleep = sleepMinutes / 60;
    times.push({
      cycles,
      time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
      hours_of_sleep: hoursOfSleep,
      meets_recommendation: hoursOfSleep >= 7 && hoursOfSleep <= 9
    });
  }

  return {
    mode,
    cycle_length_minutes: cycle,
    fall_asleep_minutes: fallAsleep,
    times,
    recommended_hours_lower: 7,
    recommended_hours_upper: 9
  };
}
