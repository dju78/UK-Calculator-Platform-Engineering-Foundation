import type { NumericInputs, CalculationContext, CalculatorHandler } from "../types.js";
import { resolveRules } from "../../../rules-uk/src/index.js";
import {
  basalMetabolicRate, normaliseSex, normaliseActivity, activityFactor,
  calorieTarget, normaliseGoal, bodyFat, leanBodyMass, healthyWeight,
  idealWeight, macros, caloriesBurned, pace, oneRepMax, heartRateZones,
  bodySurfaceArea, pregnancy, ovulation, periodTracker, sleep
} from "./wave2.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
function orNull(n: number | null | undefined, fn: (v: number) => number): number | null {
  return n === null || n === undefined ? null : fn(n);
}
function optional(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

const NOT_MEDICAL =
  "An estimate from population formulas, not a measurement of you, and not medical advice. Individual needs vary a great deal with genetics, medical conditions, medication and body composition. Speak to a GP or a registered dietitian before making significant changes, and speak to a GP first if you have ever had an eating disorder.";

const NOT_A_TEST =
  "An estimate from a calendar, not a test and not a diagnosis. Speak to a GP, a midwife or a sexual health service for anything that matters.";

/** HLT-002 BMR */
export const hlt002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = basalMetabolicRate(
    normaliseSex(inputs.sex), Number(inputs.weight), Number(inputs.height),
    Number(inputs.age), optional(inputs.body_fat_percentage), normaliseActivity(inputs.activity)
  );
  return {
    outputs: {
      bmr: round2(r.bmr_used),
      bmr_mifflin_st_jeor: round2(r.bmr_mifflin_st_jeor),
      bmr_harris_benedict: round2(r.bmr_harris_benedict),
      bmr_katch_mcardle: orNull(r.bmr_katch_mcardle, round2),
      calories_per_hour_at_rest: round2(r.calories_per_hour_at_rest),
      formula_used: r.formula_used,
      basis:
        "Your basal metabolic rate is what your body uses at complete rest, before any activity at all. Three formulas are shown because they disagree by a few hundred calories for the same person, and a single figure would imply a precision that does not exist. Mifflin-St Jeor is used as the headline because it is the most accurate of the three for the general population; Katch-McArdle appears only when you supply a body fat percentage, because it works from lean mass. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-003 TDEE */
export const hlt003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const activity = normaliseActivity(inputs.activity);
  const r = basalMetabolicRate(
    normaliseSex(inputs.sex), Number(inputs.weight), Number(inputs.height),
    Number(inputs.age), optional(inputs.body_fat_percentage), activity
  );
  return {
    outputs: {
      bmr: round2(r.bmr_used),
      tdee: round2(r.tdee),
      activity_factor: r.activity_factor,
      calories_from_activity: round2(r.tdee - r.bmr_used),
      sedentary_tdee: round2(r.bmr_used * activityFactor("sedentary")),
      very_active_tdee: round2(r.bmr_used * activityFactor("very_active")),
      basis:
        "Total daily energy expenditure is your basal rate multiplied by an activity factor. Those factors are population averages and are the single largest source of error here: the gap between the sedentary and very active figures shown is far wider than the difference between the BMR formulas. Most people overestimate their activity level. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-004 Calorie target */
export const hlt004Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const sex = normaliseSex(inputs.sex);
  const goal = normaliseGoal(inputs.goal);
  const r = calorieTarget(
    Number(inputs.maintenance_calories),
    goal,
    Number(inputs.rate_kg_per_week ?? 0.5),
    Number(inputs.current_weight),
    optional(inputs.target_weight),
    sex,
    rules
  );

  const warnings: string[] = [];
  if (r.rate_was_capped) {
    warnings.push(
      `You asked to change weight by ${r.requested_rate_kg_per_week} kg a week. That has been reduced to ${r.applied_rate_kg_per_week} kg, the fastest rate the NHS describes as safe and sustainable. Losing weight faster than this costs muscle as well as fat and is very hard to keep off.`
    );
  }
  if (r.floor_applied) {
    warnings.push(
      `The target has been raised to ${round2(r.minimum_safe_calories)} calories a day. Anything below that is not something this calculator will produce: very low calorie diets need medical supervision, and eating too little slows the very metabolism you are trying to work with.`
    );
  }

  return {
    outputs: {
      maintenance_calories: round2(r.maintenance_calories),
      target_calories: round2(r.target_calories),
      daily_adjustment: round2(r.daily_adjustment),
      applied_rate_kg_per_week: round8(r.applied_rate_kg_per_week),
      weeks_to_target_weight: orNull(r.weeks_to_target_weight, (v) => Math.round(v * 10) / 10),
      minimum_safe_calories: round2(r.minimum_safe_calories),
      nhs_daily_guide: r.nhs_daily_guide,
      basis:
        "The daily change is capped at 600 calories, which the NHS calls a safe and sustainable reduction, and the target is never allowed below a floor derived from NHS guidance. The conversion of calories to weight uses the conventional 7,700 calories per kilogram of fat; real weight change also involves water, glycogen and lean mass, so the scales will not follow this smoothly. " +
        NOT_MEDICAL
    },
    warnings
  };
};

/** HLT-005 Body Fat */
export const hlt005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = bodyFat(
    normaliseSex(inputs.sex), Number(inputs.height), Number(inputs.neck),
    Number(inputs.waist), Number(inputs.hip ?? 0), Number(inputs.weight)
  );
  return {
    outputs: {
      body_fat_percentage: round2(r.body_fat_percentage),
      fat_mass_kg: round2(r.fat_mass_kg),
      lean_mass_kg: round2(r.lean_mass_kg),
      category: r.category,
      bmi_estimate: round2(r.bmi_estimate),
      method: r.method,
      basis:
        "The US Navy circumference method estimates body fat from tape measurements, and is typically within three to four percentage points of a proper assessment such as a DEXA scan. Treat the decimal place as false precision. The categories are descriptions of a population, not targets: very low body fat carries its own health risks, particularly for women. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-006 Lean Body Mass */
export const hlt006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = leanBodyMass(
    normaliseSex(inputs.sex), Number(inputs.weight), Number(inputs.height),
    optional(inputs.body_fat_percentage)
  );
  return {
    outputs: {
      lean_body_mass_kg: round2(r.lean_body_mass_kg),
      fat_mass_kg: round2(r.fat_mass_kg),
      lean_mass_percentage: round2(r.lean_mass_percentage),
      boer_estimate: round2(r.boer_estimate),
      james_estimate: round2(r.james_estimate),
      method: r.method,
      basis:
        "Lean body mass is everything that is not fat: muscle, bone, organs and water. A measured body fat percentage beats any formula, so it is used whenever you supply one, and the two formulas are shown alongside for comparison. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-007 Healthy Weight */
export const hlt007Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const higherRisk = inputs.higher_risk_background === true || String(inputs.higher_risk_background) === "true";
  const r = healthyWeight(Number(inputs.weight), Number(inputs.height), higherRisk, rules);

  const warnings: string[] = [];
  if (r.category === "Underweight") {
    warnings.push(
      "This BMI is in the underweight range. Being underweight carries real health risks, and a GP is the right place to start rather than a calculator."
    );
  }
  return {
    outputs: {
      bmi: round2(r.bmi),
      category: r.category,
      healthy_weight_lower_kg: round2(r.healthy_weight_lower_kg),
      healthy_weight_upper_kg: round2(r.healthy_weight_upper_kg),
      weight_to_lose_kg: round2(r.weight_to_lose_kg),
      weight_to_gain_kg: round2(r.weight_to_gain_kg),
      is_within_healthy_range: r.is_within_healthy_range,
      overweight_threshold: r.overweight_threshold,
      obese_threshold: r.obese_threshold,
      thresholds_used: r.thresholds_used,
      basis:
        "The NHS uses LOWER BMI thresholds - 23 and 27.5 rather than 25 and 30 - for people from South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean backgrounds, who face health risks at a lower BMI. Most BMI calculators ignore this and understate risk for a large part of the UK population. BMI takes no account of muscle, build or where fat is carried, so a very muscular person can register as overweight while being nothing of the kind. " +
        NOT_MEDICAL
    },
    warnings
  };
};

/** HLT-008 Ideal Weight */
export const hlt008Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = idealWeight(normaliseSex(inputs.sex), Number(inputs.height), rules);
  return {
    outputs: {
      healthy_range_lower_kg: round2(r.range_lower_kg),
      healthy_range_upper_kg: round2(r.range_upper_kg),
      robinson_formula: round2(r.robinson),
      miller_formula: round2(r.miller),
      devine_formula: round2(r.devine),
      hamwi_formula: round2(r.hamwi),
      formulas_disagree_by_kg: round2(r.formulas_disagree_by_kg),
      basis:
        "There is no such thing as one ideal weight, which is why this returns a RANGE and never a single number. The four classical formulas shown disagree with each other by several kilograms for the same height, none of them accounts for build, muscle or frame, and all of them were derived for drug dosing rather than for health. The healthy BMI range is the more useful answer. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-009 Protein, HLT-010 Carbohydrate, HLT-011 Fat, HLT-012 Macros */
function macroHandler(defaults: { protein: number; carb: number; fat: number }, focus: string): CalculatorHandler {
  return (inputs: NumericInputs) => {
    const r = macros(
      Number(inputs.calories),
      Number(inputs.protein_percentage ?? defaults.protein),
      Number(inputs.carbohydrate_percentage ?? defaults.carb),
      Number(inputs.fat_percentage ?? defaults.fat),
      optional(inputs.body_weight)
    );
    return {
      outputs: {
        protein_grams: round2(r.protein_grams),
        carbohydrate_grams: round2(r.carbohydrate_grams),
        fat_grams: round2(r.fat_grams),
        protein_calories: round2(r.protein_calories),
        carbohydrate_calories: round2(r.carbohydrate_calories),
        fat_calories: round2(r.fat_calories),
        protein_grams_per_kg: orNull(r.protein_grams_per_kg, round2),
        fibre_grams_recommended: r.fibre_grams_recommended,
        basis:
          `${focus} Protein and carbohydrate provide 4 calories per gram and fat provides 9, so the three percentages must add up to 100 or the grams would not add back up to the calories. Fibre is not a macronutrient split but the UK recommendation for adults is 30 g a day, which most people fall well short of. ` +
          NOT_MEDICAL
      }
    };
  };
}

export const hlt009Handler = macroHandler(
  { protein: 30, carb: 40, fat: 30 },
  "Protein needs are usually quoted per kilogram of body weight rather than as a percentage: around 0.75 g/kg is the UK reference nutrient intake for a sedentary adult, and 1.2 to 2.0 g/kg is commonly used by people training seriously."
);
export const hlt010Handler = macroHandler(
  { protein: 25, carb: 50, fat: 25 },
  "Carbohydrate is the body's most accessible fuel, and endurance training raises the requirement considerably."
);
export const hlt011Handler = macroHandler(
  { protein: 25, carb: 45, fat: 30 },
  "Fat is essential, not optional: it carries the fat-soluble vitamins and is needed for hormone production. Intakes below about 20% of calories are rarely a good idea."
);
export const hlt012Handler = macroHandler(
  { protein: 30, carb: 40, fat: 30 },
  "There is no single correct macronutrient split. Total calories and food quality matter far more than the ratio for most people."
);

/** HLT-013 Calories Burned */
export const hlt013Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = caloriesBurned(
    Number(inputs.met_value), Number(inputs.weight),
    Number(inputs.duration_minutes), Number(inputs.times_per_week ?? 0), rules
  );
  return {
    outputs: {
      calories_burned: round2(r.calories_burned),
      calories_per_minute: round2(r.calories_per_minute),
      weekly_if_repeated: round2(r.weekly_if_repeated),
      equivalent_kg_of_fat: round8(r.equivalent_kg_of_fat),
      basis:
        "One MET is the energy your body uses sitting still, so a 6 MET activity uses six times that. MET values are population averages for an activity at a stated intensity, and real expenditure varies a great deal with fitness, technique and terrain. Fitness trackers routinely overestimate. This figure includes the energy you would have used anyway simply by existing during that time. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-014 Pace */
export const hlt014Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = pace(
    Number(inputs.distance_km), Number(inputs.hours ?? 0),
    Number(inputs.minutes ?? 0), Number(inputs.seconds ?? 0)
  );
  return {
    outputs: {
      pace_per_km: r.pace_per_km,
      pace_per_mile: r.pace_per_mile,
      speed_kmh: round2(r.speed_kmh),
      speed_mph: round2(r.speed_mph),
      finish_time_5k: r.finish_time_5k,
      finish_time_10k: r.finish_time_10k,
      finish_time_half_marathon: r.finish_time_half_marathon,
      finish_time_marathon: r.finish_time_marathon,
      basis:
        "The race predictions extrapolate your current pace to longer distances unchanged, which is optimistic: almost everyone slows as the distance grows, and the marathon figure in particular should be treated as a ceiling rather than a target."
    }
  };
};

/** HLT-015 One Rep Max */
export const hlt015Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = oneRepMax(Number(inputs.weight), Number(inputs.reps));
  return {
    outputs: {
      one_rep_max: round2(r.one_rep_max),
      epley: round2(r.epley),
      brzycki: round2(r.brzycki),
      lombardi: round2(r.lombardi),
      lowest_estimate: round2(r.lowest_estimate),
      highest_estimate: round2(r.highest_estimate),
      basis:
        "The LOWEST of the three estimates is used as the headline, deliberately: over-estimating a one rep max is how people get injured. These are estimates from a submaximal set, not a tested maximum, and they become unreliable above about ten repetitions, which is why higher rep counts are refused. Never attempt a true maximum without a spotter and a proper warm-up."
    },
    schedule: r.percentage_table.map((row) => ({
      percentage: row.percentage,
      weight: round2(row.weight),
      approximate_reps: row.approximate_reps
    }))
  };
};

/** HLT-016 Target Heart Rate */
export const hlt016Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = heartRateZones(Number(inputs.age), optional(inputs.resting_heart_rate));
  return {
    outputs: {
      maximum_heart_rate: round2(r.maximum_heart_rate),
      heart_rate_reserve: orNull(r.heart_rate_reserve, round2),
      moderate_lower: round2(r.moderate_lower),
      moderate_upper: round2(r.moderate_upper),
      vigorous_lower: round2(r.vigorous_lower),
      vigorous_upper: round2(r.vigorous_upper),
      fat_burn_lower: round2(r.fat_burn_lower),
      fat_burn_upper: round2(r.fat_burn_upper),
      method: r.method,
      basis:
        "Maximum heart rate is estimated as 208 less 0.7 times your age, which fits the evidence better than the familiar 220 minus age, particularly for older adults. It is still a population average with a spread of ten to twelve beats either side, so these zones are a guide and not a limit. The so-called fat burning zone burns a higher PROPORTION of fat but fewer calories overall, so it is not the shortcut it is often sold as. Stop and seek advice if you feel chest pain, faint or unusually breathless. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-017 Body Surface Area */
export const hlt017Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = bodySurfaceArea(Number(inputs.weight), Number(inputs.height));
  return {
    outputs: {
      body_surface_area: round8(r.bsa_used),
      mosteller: round8(r.mosteller),
      du_bois: round8(r.du_bois),
      haycock: round8(r.haycock),
      boyd: round8(r.boyd),
      formulas_disagree_by: round8(r.formulas_disagree_by),
      method: r.method,
      basis:
        "Body surface area is used clinically for dosing some medicines. This is a general-purpose estimate and must NOT be used to work out a dose: that is a decision for a prescriber, using the formula their own protocol specifies. Mosteller is shown as the headline because it is the one most used clinically and can be checked by hand. " +
        NOT_MEDICAL
    }
  };
};

/** HLT-019 Pregnancy and HLT-020 Due Date */
function pregnancyHandler(): CalculatorHandler {
  return (inputs: NumericInputs, context: CalculationContext) => {
    const today = context.now ? new Date(context.now) : new Date();
    const r = pregnancy(inputs.last_period_date, Number(inputs.cycle_length ?? 28), today);
    return {
      outputs: {
        estimated_due_date: r.estimated_due_date,
        conception_date_estimate: r.conception_date_estimate,
        gestational_age_weeks: r.gestational_age_weeks,
        gestational_age_days: r.gestational_age_days,
        trimester: r.trimester,
        days_remaining: r.days_remaining,
        first_trimester_ends: r.first_trimester_ends,
        second_trimester_ends: r.second_trimester_ends,
        is_full_term: r.is_full_term,
        cycle_length_used: r.cycle_length_used,
        basis:
          "The due date is Naegele's rule - 280 days from the first day of your last period - ADJUSTED for your cycle length. The classical rule assumes a 28-day cycle, so for a 35-day cycle it is a week out. Only about one baby in twenty five arrives on the estimated date, and a dating scan is more accurate than any calculation. " +
          NOT_A_TEST
      }
    };
  };
}
export const hlt019Handler = pregnancyHandler();
export const hlt020Handler = pregnancyHandler();

/** HLT-022 Ovulation */
export const hlt022Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = ovulation(
    inputs.last_period_date, Number(inputs.cycle_length ?? 28),
    Number(inputs.luteal_phase ?? 14), Number(inputs.cycles_to_show ?? 3)
  );
  return {
    outputs: {
      ovulation_date_estimate: r.ovulation_date_estimate,
      fertile_window_start: r.fertile_window_start,
      fertile_window_end: r.fertile_window_end,
      next_period_date: r.next_period_date,
      fertile_days: r.fertile_days,
      cycle_length_used: r.cycle_length_used,
      luteal_phase_used: r.luteal_phase_used,
      basis:
        "This is NOT a form of contraception and must not be used as one. Ovulation moves between cycles even for people whose periods are regular, sperm can survive up to five days, and a calendar cannot detect any of that. The fertile window shown is the five days before ovulation plus the day after. If you are trying to conceive and it is taking longer than you expected, a GP can help. " +
        NOT_A_TEST
    },
    schedule: r.cycles_shown
  };
};

/** HLT-023 Period */
export const hlt023Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const today = context.now ? new Date(context.now) : new Date();
  const r = periodTracker(
    inputs.last_period_date, Number(inputs.cycle_length ?? 28),
    Number(inputs.period_length ?? 5), Number(inputs.cycles_to_show ?? 6), today
  );
  return {
    outputs: {
      next_period_date: r.next_period_date,
      next_period_ends: r.next_period_ends,
      days_until_next: r.days_until_next,
      cycle_length_used: r.cycle_length_used,
      period_length_used: r.period_length_used,
      cycle_note: r.average_cycle_note,
      basis:
        "This assumes every cycle is the same length, which almost nobody's is. Treat the dates as a rough guide. Bleeding that is unusually heavy or painful, cycles that change markedly, or bleeding between periods are all worth discussing with a GP. " +
        NOT_A_TEST
    },
    schedule: r.upcoming
  };
};

/** HLT-025 Sleep */
export const hlt025Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const mode = String(inputs.mode ?? "wake_time") === "bedtime" ? "bedtime" : "wake_time";
  const r = sleep(
    mode, String(inputs.time), Number(inputs.fall_asleep_minutes ?? 15),
    Number(inputs.cycle_minutes ?? 90)
  );
  const recommended = r.times.filter((t) => t.meets_recommendation);
  return {
    outputs: {
      mode: r.mode,
      cycle_length_minutes: r.cycle_length_minutes,
      options_meeting_recommendation: recommended.length,
      recommended_hours_lower: r.recommended_hours_lower,
      recommended_hours_upper: r.recommended_hours_upper,
      basis:
        "A sleep cycle averages ninety minutes but genuinely varies between about seventy and a hundred and twenty, and between nights for the same person, so waking 'between cycles' is a rough idea rather than a precise one. Total sleep matters more: the options below are marked according to whether they actually give an adult the recommended seven to nine hours, because a neat four-cycle option is only six hours and chasing cycle alignment at the cost of total sleep is the wrong trade."
    },
    schedule: r.times
  };
};
