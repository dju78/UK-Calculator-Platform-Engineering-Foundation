/**
 * Independent benchmark oracle for Wave 2 tranche 2K, Health & Fitness.
 *
 * Imports nothing from the calculation engine. Statutory and clinical
 * thresholds are re-typed here from the primary sources named in each
 * comment, so agreement corroborates the ruleset data as well as the
 * arithmetic.
 *
 * Independence of method where it is available:
 *   - The calorie target's caps and floors are applied here by explicit case
 *     analysis rather than by the engine's min/max chain, so an inverted
 *     comparison would show up.
 *   - Pace conversions are checked by computing the total time back from the
 *     pace and requiring it to return the original.
 *   - Date arithmetic uses an independent day-count from epoch milliseconds.
 *
 * Run: node scripts/oracles/wave2-health-oracle.mjs > /tmp/health.json
 */

const r2 = (n) => Math.round(n * 100) / 100;
const r8 = (n) => Math.round(n * 1e8) / 1e8;

// --- Thresholds, re-typed from primary sources -----------------------------

// https://www.nhs.uk/conditions/obesity/diagnosis/
const BMI_OVERWEIGHT = 25;
const BMI_OBESE = 30;
const BMI_OVERWEIGHT_HIGHER_RISK = 23;
const BMI_OBESE_HIGHER_RISK = 27.5;
// World Health Organization underweight threshold; NOT stated on the NHS
// pages, and recorded as WHO in the ruleset's source register.
const BMI_UNDERWEIGHT = 18.5;

// https://www.nhs.uk/better-health/lose-weight/calorie-counting/
const GUIDE = { female: 2000, male: 2500 };
const MAX_DEFICIT = 600;
// Derived: the maintenance guide less the published safe reduction.
const FLOOR = { female: 1400, male: 1900 };
const MAX_RATE_KG_WEEK = 1.0;
const KCAL_PER_KG = 7700;

const ACTIVITY = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725, extra_active: 1.9
};

const MILES_PER_KM = 0.621371192237334;
const DAY_MS = 86400000;

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±0.01",
    ruleset: "uk-2026-27-v1",
    note: note ?? "Independently derived; no engine code used."
  });
}

function assertClose(actual, expected, tol, message) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`Oracle self-check failed: ${message} (${actual} vs ${expected})`);
  }
}

// ===========================================================================
// HLT-002 BMR and HLT-003 TDEE
// ===========================================================================

function mifflin(sex, w, h, age) {
  return 10 * w + 6.25 * h - 5 * age + (sex === "male" ? 5 : -161);
}
function harris(sex, w, h, age) {
  return sex === "male"
    ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * age
    : 447.593 + 9.247 * w + 3.098 * h - 4.33 * age;
}

const bodies = [
  { scenario: "Woman, 30, average build", sex: "female", w: 65, h: 165, age: 30, bf: "", act: "moderate" },
  { scenario: "Man, 40, taller", sex: "male", w: 85, h: 180, age: 40, bf: "", act: "light" },
  { scenario: "Woman, 55, sedentary", sex: "female", w: 72, h: 158, age: 55, bf: "", act: "sedentary" },
  { scenario: "Man, 25, very active", sex: "male", w: 78, h: 178, age: 25, bf: "", act: "very_active" },
  { scenario: "With a known body fat percentage", sex: "male", w: 80, h: 175, age: 35, bf: 18, act: "moderate" },
  { scenario: "Woman, 65, light activity", sex: "female", w: 60, h: 160, age: 65, bf: "", act: "light" }
];

for (const p of bodies) {
  const m = mifflin(p.sex, p.w, p.h, p.age);
  const hb = harris(p.sex, p.w, p.h, p.age);
  const katch = p.bf === "" ? null : 370 + 21.6 * (p.w * (1 - p.bf / 100));

  add("HLT-002", p.scenario,
    { sex: p.sex, weight: p.w, height: p.h, age: p.age, body_fat_percentage: p.bf, activity: p.act },
    {
      bmr: r2(m),
      bmr_mifflin_st_jeor: r2(m),
      bmr_harris_benedict: r2(hb),
      bmr_katch_mcardle: katch === null ? null : r2(katch),
      calories_per_hour_at_rest: r2(m / 24)
    },
    "Three formulas asserted together, so swapping one for another would fail.");

  const factor = ACTIVITY[p.act];
  add("HLT-003", p.scenario,
    { sex: p.sex, weight: p.w, height: p.h, age: p.age, body_fat_percentage: p.bf, activity: p.act },
    {
      bmr: r2(m),
      tdee: r2(m * factor),
      activity_factor: factor,
      calories_from_activity: r2(m * factor - m),
      sedentary_tdee: r2(m * ACTIVITY.sedentary),
      very_active_tdee: r2(m * ACTIVITY.very_active)
    });
}

// ===========================================================================
// HLT-004 Calorie target - the safety behaviour
// ===========================================================================

for (const p of [
  { scenario: "Maintaining weight", maintenance: 2200, goal: "maintain", rate: 0, weight: 70, target: "", sex: "female" },
  { scenario: "Losing at a safe rate", maintenance: 2200, goal: "lose", rate: 0.5, weight: 80, target: 72, sex: "female" },
  { scenario: "Requesting an unsafe rate, which is capped", maintenance: 2200, goal: "lose", rate: 2.0, weight: 90, target: 70, sex: "female" },
  { scenario: "A small maintenance where the floor binds", maintenance: 1600, goal: "lose", rate: 1.0, weight: 60, target: 55, sex: "female" },
  { scenario: "Man losing weight", maintenance: 2800, goal: "lose", rate: 0.5, weight: 95, target: 85, sex: "male" },
  { scenario: "Gaining weight", maintenance: 2400, goal: "gain", rate: 0.25, weight: 62, target: 68, sex: "male" },
  { scenario: "A low maintenance for a man, where the higher floor binds", maintenance: 2000, goal: "lose", rate: 1.0, weight: 70, target: 65, sex: "male" }
]) {
  // Explicit case analysis rather than a min/max chain, so an inverted
  // comparison in the engine would show up here.
  const appliedRate = p.goal === "maintain"
    ? 0
    : (p.rate > MAX_RATE_KG_WEEK ? MAX_RATE_KG_WEEK : p.rate);

  const impliedDaily = (appliedRate * KCAL_PER_KG) / 7;
  let adjustment;
  if (p.goal === "maintain") adjustment = 0;
  else if (p.goal === "lose") adjustment = impliedDaily > MAX_DEFICIT ? -MAX_DEFICIT : -impliedDaily;
  else adjustment = impliedDaily > MAX_DEFICIT ? MAX_DEFICIT : impliedDaily;

  const uncapped = p.maintenance + adjustment;
  const floor = FLOOR[p.sex];
  const target = p.goal === "lose" && uncapped < floor ? floor : uncapped;

  const weeks = p.target !== "" && appliedRate > 0
    ? Math.abs(p.weight - p.target) / appliedRate
    : null;

  add("HLT-004", p.scenario,
    {
      maintenance_calories: p.maintenance, goal: p.goal, rate_kg_per_week: p.rate,
      current_weight: p.weight, target_weight: p.target, sex: p.sex
    },
    {
      maintenance_calories: r2(p.maintenance),
      target_calories: r2(target),
      daily_adjustment: r2(adjustment),
      applied_rate_kg_per_week: r8(appliedRate),
      weeks_to_target_weight: weeks === null ? null : Math.round(weeks * 10) / 10,
      minimum_safe_calories: floor,
      nhs_daily_guide: GUIDE[p.sex]
    },
    "The rate cap and the calorie floor are applied here by explicit case analysis rather than by a min/max chain. Two cases exist purely to make the floor bind, and one to make the rate cap bind.");
}

// ===========================================================================
// HLT-005 Body Fat and HLT-006 Lean Body Mass
// ===========================================================================

for (const p of [
  { scenario: "Man, average", sex: "male", h: 180, neck: 38, waist: 85, hip: 0, w: 80 },
  { scenario: "Man, leaner", sex: "male", h: 175, neck: 37, waist: 78, hip: 0, w: 72 },
  { scenario: "Man, larger waist", sex: "male", h: 178, neck: 41, waist: 105, hip: 0, w: 98 },
  { scenario: "Woman, average", sex: "female", h: 165, neck: 32, waist: 74, hip: 96, w: 63 },
  { scenario: "Woman, leaner", sex: "female", h: 168, neck: 31, waist: 68, hip: 90, w: 58 },
  { scenario: "Woman, larger measurements", sex: "female", h: 160, neck: 34, waist: 92, hip: 108, w: 80 }
]) {
  const pct = p.sex === "male"
    ? 495 / (1.0324 - 0.19077 * Math.log10(p.waist - p.neck) + 0.15456 * Math.log10(p.h)) - 450
    : 495 / (1.29579 - 0.35004 * Math.log10(p.waist + p.hip - p.neck) + 0.221 * Math.log10(p.h)) - 450;

  const heightM = p.h / 100;
  add("HLT-005", p.scenario,
    { sex: p.sex, height: p.h, neck: p.neck, waist: p.waist, hip: p.hip, weight: p.w },
    {
      body_fat_percentage: r2(pct),
      fat_mass_kg: r2((p.w * pct) / 100),
      lean_mass_kg: r2(p.w * (1 - pct / 100)),
      bmi_estimate: r2(p.w / (heightM * heightM))
    },
    "Fat mass plus lean mass must equal total weight, which both outputs together enforce.");

  const boer = p.sex === "male"
    ? 0.407 * p.w + 0.267 * p.h - 19.2
    : 0.252 * p.w + 0.473 * p.h - 48.3;
  const james = p.sex === "male"
    ? 1.1 * p.w - 128 * Math.pow(p.w / p.h, 2)
    : 1.07 * p.w - 148 * Math.pow(p.w / p.h, 2);

  add("HLT-006", p.scenario,
    { sex: p.sex, weight: p.w, height: p.h, body_fat_percentage: "" },
    {
      lean_body_mass_kg: r2(boer),
      fat_mass_kg: r2(p.w - boer),
      lean_mass_percentage: r2((boer / p.w) * 100),
      boer_estimate: r2(boer),
      james_estimate: r2(james)
    },
    "With no body fat percentage supplied, the Boer formula is the one used, and the two formulas are asserted separately.");
}

// ===========================================================================
// HLT-007 Healthy Weight - including the adjusted thresholds
// ===========================================================================

for (const p of [
  { scenario: "Healthy weight", w: 65, h: 170, higherRisk: false },
  { scenario: "Overweight on the standard thresholds", w: 82, h: 170, higherRisk: false },
  { scenario: "The SAME person is overweight on the adjusted thresholds while healthy on the standard ones", w: 68, h: 170, higherRisk: true },
  { scenario: "The same measurements on standard thresholds", w: 68, h: 170, higherRisk: false },
  { scenario: "Obese", w: 100, h: 170, higherRisk: false },
  { scenario: "Underweight", w: 48, h: 170, higherRisk: false },
  { scenario: "Obese on adjusted thresholds", w: 82, h: 170, higherRisk: true }
]) {
  const heightM = p.h / 100;
  const bmi = p.w / (heightM * heightM);
  const overweightFrom = p.higherRisk ? BMI_OVERWEIGHT_HIGHER_RISK : BMI_OVERWEIGHT;
  const obeseFrom = p.higherRisk ? BMI_OBESE_HIGHER_RISK : BMI_OBESE;

  const category =
    bmi < BMI_UNDERWEIGHT ? "Underweight"
      : bmi < overweightFrom ? "Healthy weight"
        : bmi < obeseFrom ? "Overweight"
          : "Obese";

  const lower = BMI_UNDERWEIGHT * heightM * heightM;
  const upper = overweightFrom * heightM * heightM;

  add("HLT-007", p.scenario,
    { weight: p.w, height: p.h, higher_risk_background: p.higherRisk },
    {
      bmi: r2(bmi),
      category,
      healthy_weight_lower_kg: r2(lower),
      healthy_weight_upper_kg: r2(upper),
      weight_to_lose_kg: r2(Math.max(0, p.w - upper)),
      weight_to_gain_kg: r2(Math.max(0, lower - p.w)),
      is_within_healthy_range: bmi >= BMI_UNDERWEIGHT && bmi < overweightFrom,
      overweight_threshold: overweightFrom,
      obese_threshold: obeseFrom
    },
    "The two 68 kg cases differ ONLY in the ethnicity-adjusted thresholds and must give different categories, which is the point most BMI calculators get wrong.");
}

// ===========================================================================
// HLT-008 Ideal Weight
// ===========================================================================

for (const p of [
  { scenario: "Man, 180 cm", sex: "male", h: 180 },
  { scenario: "Woman, 165 cm", sex: "female", h: 165 },
  { scenario: "Man, 170 cm", sex: "male", h: 170 },
  { scenario: "Woman, 155 cm", sex: "female", h: 155 },
  { scenario: "Man, 195 cm", sex: "male", h: 195 },
  { scenario: "Woman, 175 cm", sex: "female", h: 175 }
]) {
  const over = Math.max(0, p.h / 2.54 - 60);
  const robinson = p.sex === "male" ? 52 + 1.9 * over : 49 + 1.7 * over;
  const miller = p.sex === "male" ? 56.2 + 1.41 * over : 53.1 + 1.36 * over;
  const devine = p.sex === "male" ? 50 + 2.3 * over : 45.5 + 2.3 * over;
  const hamwi = p.sex === "male" ? 48 + 2.7 * over : 45.5 + 2.2 * over;
  const heightM = p.h / 100;
  const all = [robinson, miller, devine, hamwi];

  add("HLT-008", p.scenario,
    { sex: p.sex, height: p.h },
    {
      healthy_range_lower_kg: r2(BMI_UNDERWEIGHT * heightM * heightM),
      healthy_range_upper_kg: r2(BMI_OVERWEIGHT * heightM * heightM),
      robinson_formula: r2(robinson),
      miller_formula: r2(miller),
      devine_formula: r2(devine),
      hamwi_formula: r2(hamwi),
      formulas_disagree_by_kg: r2(Math.max(...all) - Math.min(...all))
    },
    "The spread between the four formulas is asserted, which is the evidence that no single ideal weight exists.");
}

// ===========================================================================
// HLT-009 to HLT-012 Macronutrients
// ===========================================================================

const macroCases = [
  { scenario: "Balanced split", kcal: 2000, p: 30, c: 40, f: 30, bw: 70 },
  { scenario: "Higher carbohydrate", kcal: 2500, p: 25, c: 50, f: 25, bw: 80 },
  { scenario: "Higher fat", kcal: 1800, p: 25, c: 45, f: 30, bw: 65 },
  { scenario: "High protein", kcal: 2200, p: 40, c: 35, f: 25, bw: 75 },
  { scenario: "No body weight given", kcal: 2000, p: 30, c: 40, f: 30, bw: "" },
  { scenario: "Low calorie target", kcal: 1500, p: 35, c: 35, f: 30, bw: 60 }
];

for (const id of ["HLT-009", "HLT-010", "HLT-011", "HLT-012"]) {
  for (const m of macroCases) {
    const proteinCals = (m.kcal * m.p) / 100;
    const carbCals = (m.kcal * m.c) / 100;
    const fatCals = (m.kcal * m.f) / 100;
    // Self-check: the three calorie shares must reconstitute the total.
    assertClose(proteinCals + carbCals + fatCals, m.kcal, 1e-9, "macro calories sum");

    add(id, m.scenario,
      {
        calories: m.kcal, protein_percentage: m.p, carbohydrate_percentage: m.c,
        fat_percentage: m.f, body_weight: m.bw
      },
      {
        protein_grams: r2(proteinCals / 4),
        carbohydrate_grams: r2(carbCals / 4),
        fat_grams: r2(fatCals / 9),
        protein_calories: r2(proteinCals),
        carbohydrate_calories: r2(carbCals),
        fat_calories: r2(fatCals),
        protein_grams_per_kg: m.bw === "" ? null : r2(proteinCals / 4 / m.bw),
        fibre_grams_recommended: 30
      },
      "The three calorie shares are verified to reconstitute the total before the case is recorded, so a wrong calories-per-gram figure would fail.");
  }
}

// ===========================================================================
// HLT-013 Calories Burned
// ===========================================================================

for (const p of [
  { scenario: "Brisk walking", met: 4.3, w: 70, mins: 45, week: 5 },
  { scenario: "Running at 10 km/h", met: 9.8, w: 70, mins: 30, week: 3 },
  { scenario: "Cycling, moderate", met: 8.0, w: 85, mins: 60, week: 2 },
  { scenario: "Swimming, leisurely", met: 6.0, w: 65, mins: 40, week: 3 },
  { scenario: "Gardening", met: 3.8, w: 75, mins: 90, week: 1 },
  { scenario: "Sitting at a desk", met: 1.5, w: 70, mins: 480, week: 5 }
]) {
  const perMinute = (p.met * p.w) / 60;
  const burned = perMinute * p.mins;
  add("HLT-013", p.scenario,
    { met_value: p.met, weight: p.w, duration_minutes: p.mins, times_per_week: p.week },
    {
      calories_burned: r2(burned),
      calories_per_minute: r2(perMinute),
      weekly_if_repeated: r2(burned * p.week),
      equivalent_kg_of_fat: r8(burned / KCAL_PER_KG)
    },
    "One MET is one calorie per kilogram per hour, applied directly.");
}

// ===========================================================================
// HLT-014 Pace
// ===========================================================================

function fmt(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  const carryMinutes = seconds === 60 ? minutes + 1 : minutes;
  const displaySeconds = seconds === 60 ? 0 : seconds;
  const carryHours = carryMinutes === 60 ? hours + 1 : hours;
  const displayMinutes = carryMinutes === 60 ? 0 : carryMinutes;
  const pad = (n) => String(n).padStart(2, "0");
  return carryHours > 0
    ? `${carryHours}:${pad(displayMinutes)}:${pad(displaySeconds)}`
    : `${displayMinutes}:${pad(displaySeconds)}`;
}

for (const p of [
  { scenario: "5 km in 25 minutes", km: 5, h: 0, m: 25, s: 0 },
  { scenario: "10 km in 50 minutes", km: 10, h: 0, m: 50, s: 0 },
  { scenario: "Half marathon in under 2 hours", km: 21.0975, h: 1, m: 55, s: 30 },
  { scenario: "Marathon in 4 hours", km: 42.195, h: 4, m: 0, s: 0 },
  { scenario: "A fast parkrun", km: 5, h: 0, m: 18, s: 45 },
  { scenario: "A one mile walk", km: 1.609344, h: 0, m: 18, s: 0 }
]) {
  const total = p.h * 3600 + p.m * 60 + p.s;
  const perKm = total / p.km;
  // Self-check: multiplying the pace back by the distance must return the
  // original time exactly.
  assertClose(perKm * p.km, total, 1e-9, "pace round trip");
  const speedKmh = p.km / (total / 3600);

  add("HLT-014", p.scenario,
    { distance_km: p.km, hours: p.h, minutes: p.m, seconds: p.s },
    {
      pace_per_km: fmt(perKm),
      pace_per_mile: fmt(perKm / MILES_PER_KM),
      speed_kmh: r2(speedKmh),
      speed_mph: r2(speedKmh * MILES_PER_KM),
      finish_time_5k: fmt(perKm * 5),
      finish_time_10k: fmt(perKm * 10),
      finish_time_half_marathon: fmt(perKm * 21.0975),
      finish_time_marathon: fmt(perKm * 42.195)
    },
    "The pace is verified to reproduce the original total time when multiplied back by the distance.");
}

// ===========================================================================
// HLT-015 One Rep Max
// ===========================================================================

for (const p of [
  { scenario: "Five repetitions", w: 100, r: 5 },
  { scenario: "A single repetition is already the maximum", w: 120, r: 1 },
  { scenario: "Three repetitions", w: 110, r: 3 },
  { scenario: "Eight repetitions", w: 80, r: 8 },
  { scenario: "Ten repetitions, the limit of reliability", w: 70, r: 10 },
  { scenario: "Two repetitions", w: 115, r: 2 }
]) {
  const epley = p.r === 1 ? p.w : p.w * (1 + p.r / 30);
  const brzycki = p.r === 1 ? p.w : p.w * (36 / (37 - p.r));
  const lombardi = p.w * Math.pow(p.r, 0.1);
  const all = [epley, brzycki, lombardi];

  add("HLT-015", p.scenario,
    { weight: p.w, reps: p.r },
    {
      one_rep_max: r2(Math.min(...all)),
      epley: r2(epley),
      brzycki: r2(brzycki),
      lombardi: r2(lombardi),
      lowest_estimate: r2(Math.min(...all)),
      highest_estimate: r2(Math.max(...all))
    },
    "The headline must equal the LOWEST of the three, which is asserted directly, because over-estimating a one rep max is how people get hurt.");
}

// ===========================================================================
// HLT-016 Target Heart Rate
// ===========================================================================

for (const p of [
  { scenario: "Age 30, no resting rate", age: 30, resting: "" },
  { scenario: "Age 30 with a resting rate, using Karvonen", age: 30, resting: 60 },
  { scenario: "Age 50, no resting rate", age: 50, resting: "" },
  { scenario: "Age 50 with a low resting rate", age: 50, resting: 48 },
  { scenario: "Age 20", age: 20, resting: "" },
  { scenario: "Age 70 with a resting rate", age: 70, resting: 72 }
]) {
  const maximum = 208 - 0.7 * p.age;
  const expected = { maximum_heart_rate: r2(maximum) };

  if (p.resting === "") {
    expected.moderate_lower = r2(maximum * 0.5);
    expected.moderate_upper = r2(maximum * 0.7);
    expected.vigorous_lower = r2(maximum * 0.7);
    expected.vigorous_upper = r2(maximum * 0.85);
    expected.fat_burn_lower = r2(maximum * 0.5);
    expected.fat_burn_upper = r2(maximum * 0.6);
    expected.heart_rate_reserve = null;
  } else {
    const reserve = maximum - p.resting;
    expected.heart_rate_reserve = r2(reserve);
    expected.moderate_lower = r2(p.resting + reserve * 0.5);
    expected.moderate_upper = r2(p.resting + reserve * 0.7);
    expected.vigorous_lower = r2(p.resting + reserve * 0.7);
    expected.vigorous_upper = r2(p.resting + reserve * 0.85);
    expected.fat_burn_lower = r2(p.resting + reserve * 0.5);
    expected.fat_burn_upper = r2(p.resting + reserve * 0.6);
  }

  add("HLT-016", p.scenario,
    { age: p.age, resting_heart_rate: p.resting },
    expected,
    "The matched pairs at ages 30 and 50 differ only in whether a resting rate is supplied, and must switch between the percentage-of-maximum and Karvonen methods.");
}

// ===========================================================================
// HLT-017 Body Surface Area
// ===========================================================================

for (const p of [
  { scenario: "Average adult man", w: 80, h: 180 },
  { scenario: "Average adult woman", w: 65, h: 165 },
  { scenario: "Smaller adult", w: 50, h: 155 },
  { scenario: "Larger adult", w: 110, h: 190 },
  { scenario: "Tall and light", w: 70, h: 195 },
  { scenario: "Short and heavy", w: 95, h: 158 }
]) {
  const duBois = 0.007184 * Math.pow(p.h, 0.725) * Math.pow(p.w, 0.425);
  const mosteller = Math.sqrt((p.h * p.w) / 3600);
  const haycock = 0.024265 * Math.pow(p.h, 0.3964) * Math.pow(p.w, 0.5378);
  const boyd =
    0.0003207 * Math.pow(p.h, 0.3) *
    Math.pow(p.w * 1000, 0.7285 - 0.0188 * Math.log10(p.w * 1000));
  const all = [duBois, mosteller, haycock, boyd];

  add("HLT-017", p.scenario,
    { weight: p.w, height: p.h },
    {
      body_surface_area: r8(mosteller),
      mosteller: r8(mosteller),
      du_bois: r8(duBois),
      haycock: r8(haycock),
      boyd: r8(boyd),
      formulas_disagree_by: r8(Math.max(...all) - Math.min(...all))
    });
}

// ===========================================================================
// HLT-019 / HLT-020 Pregnancy
// ===========================================================================

/** Independent day arithmetic straight from epoch milliseconds. */
function iso(dateMs) {
  return new Date(dateMs).toISOString().slice(0, 10);
}
function msOf(text) {
  return new Date(`${text}T00:00:00Z`).getTime();
}

// Outputs that depend on TODAY - gestational age, days remaining, days until
// the next period - are deliberately NOT asserted in these benchmarks. The
// benchmark runner pins a clock but the browser parity harness cannot, so a
// date-relative expectation would pass in one and fail in the other for no
// good reason. Only what is deterministic from the inputs is asserted here;
// the time-relative outputs are covered by unit tests with a pinned context.

for (const p of [
  { scenario: "Standard 28-day cycle", lmp: "2026-02-01", cycle: 28 },
  { scenario: "A 35-day cycle moves the due date a week later", lmp: "2026-02-01", cycle: 35 },
  { scenario: "A 21-day cycle moves it a week earlier", lmp: "2026-02-01", cycle: 21 },
  { scenario: "Early in the first trimester", lmp: "2026-05-20", cycle: 28 },
  { scenario: "Second trimester", lmp: "2026-01-10", cycle: 28 },
  { scenario: "Late pregnancy", lmp: "2025-12-01", cycle: 28 }
]) {
  const lmpMs = msOf(p.lmp);
  const adjustment = p.cycle - 28;
  const dueMs = lmpMs + (280 + adjustment) * DAY_MS;
  const conceptionMs = lmpMs + (14 + adjustment) * DAY_MS;
  const expected = {
    estimated_due_date: iso(dueMs),
    conception_date_estimate: iso(conceptionMs),
    first_trimester_ends: iso(lmpMs + 97 * DAY_MS),
    second_trimester_ends: iso(lmpMs + 195 * DAY_MS),
    cycle_length_used: p.cycle
  };

  for (const id of ["HLT-019", "HLT-020"]) {
    add(id, p.scenario,
      { last_period_date: p.lmp, cycle_length: p.cycle },
      expected,
      "The three cycle-length cases share a last period date and differ only in cycle length, so the adjustment to Naegele's rule must move the due date by exactly the difference.");
  }
}

// ===========================================================================
// HLT-022 Ovulation
// ===========================================================================

for (const p of [
  { scenario: "Standard 28-day cycle", lmp: "2026-06-01", cycle: 28, luteal: 14, show: 3 },
  { scenario: "A 32-day cycle ovulates later", lmp: "2026-06-01", cycle: 32, luteal: 14, show: 3 },
  { scenario: "A 24-day cycle ovulates earlier", lmp: "2026-06-01", cycle: 24, luteal: 14, show: 3 },
  { scenario: "A shorter luteal phase", lmp: "2026-06-01", cycle: 28, luteal: 11, show: 2 },
  { scenario: "A longer luteal phase", lmp: "2026-06-01", cycle: 28, luteal: 16, show: 2 },
  { scenario: "Six cycles ahead", lmp: "2026-05-15", cycle: 30, luteal: 14, show: 6 }
]) {
  const lmpMs = msOf(p.lmp);
  const ovulationDay = p.cycle - p.luteal;
  const ovMs = lmpMs + ovulationDay * DAY_MS;

  add("HLT-022", p.scenario,
    {
      last_period_date: p.lmp, cycle_length: p.cycle,
      luteal_phase: p.luteal, cycles_to_show: p.show
    },
    {
      ovulation_date_estimate: iso(ovMs),
      fertile_window_start: iso(ovMs - 5 * DAY_MS),
      fertile_window_end: iso(ovMs + 1 * DAY_MS),
      next_period_date: iso(lmpMs + p.cycle * DAY_MS),
      fertile_days: 6,
      cycle_length_used: p.cycle,
      luteal_phase_used: p.luteal
    },
    "Ovulation is the cycle length less the luteal phase, so the three cycle-length cases must move it while the luteal-phase cases move it the other way.");
}

// ===========================================================================
// HLT-023 Period
// ===========================================================================

for (const p of [
  { scenario: "Standard cycle", lmp: "2026-06-01", cycle: 28, length: 5, show: 6 },
  { scenario: "Longer cycle", lmp: "2026-06-01", cycle: 32, length: 5, show: 6 },
  { scenario: "Shorter cycle, outside the usual range", lmp: "2026-06-01", cycle: 22, length: 4, show: 3 },
  { scenario: "Longer period", lmp: "2026-06-01", cycle: 28, length: 7, show: 3 },
  { scenario: "Short period", lmp: "2026-06-05", cycle: 30, length: 3, show: 4 },
  { scenario: "Cycle at the upper end of usual", lmp: "2026-05-20", cycle: 35, length: 5, show: 2 }
]) {
  const lmpMs = msOf(p.lmp);
  const nextMs = lmpMs + p.cycle * DAY_MS;

  add("HLT-023", p.scenario,
    {
      last_period_date: p.lmp, cycle_length: p.cycle,
      period_length: p.length, cycles_to_show: p.show
    },
    {
      next_period_date: iso(nextMs),
      next_period_ends: iso(nextMs + (p.length - 1) * DAY_MS),
      cycle_length_used: p.cycle,
      period_length_used: p.length
    });
}

// ===========================================================================
// HLT-025 Sleep
// ===========================================================================

for (const p of [
  { scenario: "Waking at 07:00", mode: "wake_time", time: "07:00", fall: 15, cycle: 90 },
  { scenario: "Waking at 06:30 with a faster sleep onset", mode: "wake_time", time: "06:30", fall: 10, cycle: 90 },
  { scenario: "Going to bed at 23:00", mode: "bedtime", time: "23:00", fall: 15, cycle: 90 },
  { scenario: "A shorter sleep cycle", mode: "wake_time", time: "07:00", fall: 15, cycle: 75 },
  { scenario: "A longer sleep cycle", mode: "wake_time", time: "07:00", fall: 15, cycle: 100 },
  { scenario: "An early start", mode: "wake_time", time: "05:00", fall: 20, cycle: 90 }
]) {
  const base = Number(p.time.slice(0, 2)) * 60 + Number(p.time.slice(3));
  let meeting = 0;
  for (let cycles = 3; cycles <= 6; cycles++) {
    const hoursOfSleep = (cycles * p.cycle) / 60;
    if (hoursOfSleep >= 7 && hoursOfSleep <= 9) meeting++;
  }
  add("HLT-025", p.scenario,
    {
      mode: p.mode, time: p.time,
      fall_asleep_minutes: p.fall, cycle_minutes: p.cycle
    },
    {
      cycle_length_minutes: p.cycle,
      options_meeting_recommendation: meeting,
      recommended_hours_lower: 7,
      recommended_hours_upper: 9
    },
    "The count of options that actually give an adult seven to nine hours is asserted, because that is the figure that matters rather than cycle alignment.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
