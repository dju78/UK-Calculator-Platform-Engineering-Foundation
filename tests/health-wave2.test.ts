import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";

/**
 * Behavioural tests for Wave 2 tranche 2K, Health & Fitness.
 *
 * The safety behaviour is the point of this file. A calorie calculator that
 * will return whatever a user asks for is not a neutral tool, so these tests
 * assert that it refuses, caps and floors - and that it says so.
 */

const CTX = { now: new Date("2026-08-22T08:00:00Z") };
const closeTo = (a: number, e: number, tol = 0.011) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// HLT-004: the safety behaviour, which is structural rather than advisory
// ---------------------------------------------------------------------------

test("HLT-004 will not produce an unsafe calorie target", async (t: any) => {
  await t.test("an unsafe rate of loss is capped, not obeyed", async () => {
    const { outputs, warnings } = await calculate("HLT-004", {
      maintenance_calories: 2200, goal: "lose", rate_kg_per_week: 2,
      current_weight: 90, target_weight: 70, sex: "female"
    }, CTX);
    assert.strictEqual(outputs.applied_rate_kg_per_week, 1);
    assert.ok(warnings.some((w: string) => /reduced to 1 kg/i.test(w)));
  });

  await t.test("the daily deficit never exceeds the published safe figure", async () => {
    const { outputs } = await calculate("HLT-004", {
      maintenance_calories: 4000, goal: "lose", rate_kg_per_week: 1,
      current_weight: 120, target_weight: 90, sex: "male"
    }, CTX);
    // 1 kg a week implies about 1,100 calories a day. It is capped at 600.
    closeTo(outputs.daily_adjustment as number, -600);
  });

  await t.test("the target is floored, and the floor is announced", async () => {
    const { outputs, warnings } = await calculate("HLT-004", {
      maintenance_calories: 1600, goal: "lose", rate_kg_per_week: 1,
      current_weight: 60, target_weight: 55, sex: "female"
    }, CTX);
    // 1,600 less 600 is 1,000, which is below the floor.
    assert.strictEqual(outputs.target_calories, 1400);
    assert.ok(warnings.some((w: string) => /raised to 1400/i.test(w) || /raised to 1,400/i.test(w)));
  });

  await t.test("no combination of inputs can produce a starvation target", async () => {
    // Sweep the whole input space a determined user might try.
    for (const sex of ["female", "male"] as const) {
      const floor = sex === "female" ? 1400 : 1900;
      for (const maintenance of [1200, 1500, 1800, 2200, 3000]) {
        for (const rate of [0.1, 0.5, 1, 2, 5, 100]) {
          const { outputs } = await calculate("HLT-004", {
            maintenance_calories: maintenance, goal: "lose", rate_kg_per_week: rate,
            current_weight: 80, target_weight: 60, sex
          }, CTX);
          assert.ok(
            (outputs.target_calories as number) >= floor,
            `${sex} at ${maintenance} kcal losing ${rate} kg/week produced ${outputs.target_calories}, below the floor of ${floor}`
          );
        }
      }
    }
  });

  await t.test("maintaining weight changes nothing", async () => {
    const { outputs } = await calculate("HLT-004", {
      maintenance_calories: 2200, goal: "maintain", rate_kg_per_week: 2,
      current_weight: 70, target_weight: "", sex: "female"
    }, CTX);
    assert.strictEqual(outputs.daily_adjustment, 0);
    assert.strictEqual(outputs.target_calories, 2200);
  });
});

// ---------------------------------------------------------------------------
// HLT-007: the thresholds most BMI calculators get wrong
// ---------------------------------------------------------------------------

test("HLT-007 uses the NHS thresholds adjusted for ethnic background", async () => {
  const standard = await calculate("HLT-007", {
    weight: 68, height: 170, higher_risk_background: false
  }, CTX);
  const adjusted = await calculate("HLT-007", {
    weight: 68, height: 170, higher_risk_background: true
  }, CTX);

  // The same person: BMI 23.5. Healthy on the standard thresholds, overweight
  // on the ones the NHS uses for groups at risk at a lower BMI. A calculator
  // that ignores this understates risk for a large part of the UK population.
  closeTo(standard.outputs.bmi as number, 23.53, 0.02);
  assert.strictEqual(standard.outputs.category, "Healthy weight");
  assert.strictEqual(adjusted.outputs.category, "Overweight");
  assert.strictEqual(standard.outputs.overweight_threshold, 25);
  assert.strictEqual(adjusted.outputs.overweight_threshold, 23);
  assert.strictEqual(adjusted.outputs.obese_threshold, 27.5);
});

test("HLT-007 treats underweight as something to raise, not to celebrate", async () => {
  const { outputs, warnings } = await calculate("HLT-007", {
    weight: 45, height: 170, higher_risk_background: false
  }, CTX);
  assert.strictEqual(outputs.category, "Underweight");
  assert.ok((outputs.weight_to_gain_kg as number) > 0);
  assert.ok(warnings.some((w: string) => /GP is the right place to start/i.test(w)));
});

// ---------------------------------------------------------------------------
// HLT-008: no single ideal weight
// ---------------------------------------------------------------------------

test("HLT-008 returns a range and shows the formulas disagreeing", async () => {
  const { outputs } = await calculate("HLT-008", { sex: "female", height: 165 }, CTX);
  assert.ok((outputs.healthy_range_upper_kg as number) > (outputs.healthy_range_lower_kg as number));
  // The four classical formulas differ by several kilograms for one height,
  // which is the evidence that no single ideal exists.
  assert.ok((outputs.formulas_disagree_by_kg as number) > 2);
  assert.match(String(outputs.basis), /no such thing as one ideal weight/i);
});

// ---------------------------------------------------------------------------
// Body composition consistency
// ---------------------------------------------------------------------------

test("HLT-005 fat mass and lean mass always add back to body weight", async (t: any) => {
  const cases = [
    { sex: "male", height: 180, neck: 38, waist: 85, hip: 0, weight: 80 },
    { sex: "female", height: 165, neck: 32, waist: 74, hip: 96, weight: 63 }
  ];
  for (const c of cases) {
    await t.test(c.sex, async () => {
      const { outputs } = await calculate("HLT-005", c, CTX);
      closeTo(
        (outputs.fat_mass_kg as number) + (outputs.lean_mass_kg as number),
        c.weight,
        0.02
      );
    });
  }
});

test("HLT-005 refuses measurements that cannot be right", async () => {
  await assert.rejects(
    () => calculate("HLT-005", {
      sex: "male", height: 180, neck: 45, waist: 40, hip: 0, weight: 80
    }, CTX),
    /waist measurement must be larger than the neck/
  );
});

test("body measurements outside human range are refused", async (t: any) => {
  await t.test("height in metres rather than centimetres", async () => {
    await assert.rejects(
      () => calculate("HLT-002", {
        sex: "female", weight: 65, height: 1.65, age: 30, body_fat_percentage: "", activity: "moderate"
      }, CTX),
      /Enter your height in centimetres/
    );
  });
  await t.test("weight in stones rather than kilograms", async () => {
    await assert.rejects(
      () => calculate("HLT-002", {
        sex: "female", weight: 10, height: 165, age: 30, body_fat_percentage: "", activity: "moderate"
      }, CTX),
      /Enter your weight in kilograms/
    );
  });
  await t.test("a child's age", async () => {
    await assert.rejects(
      () => calculate("HLT-002", {
        sex: "female", weight: 40, height: 145, age: 12, body_fat_percentage: "", activity: "moderate"
      }, CTX),
      /for adults aged 18 to 120/
    );
  });
});

// ---------------------------------------------------------------------------
// HLT-009 to HLT-012: the split must be internally consistent
// ---------------------------------------------------------------------------

test("macronutrient grams always reconstitute the calories", async (t: any) => {
  for (const id of ["HLT-009", "HLT-010", "HLT-011", "HLT-012"]) {
    await t.test(id, async () => {
      const { outputs } = await calculate(id, {
        calories: 2000, protein_percentage: 30, carbohydrate_percentage: 40,
        fat_percentage: 30, body_weight: 70
      }, CTX);
      const reconstituted =
        (outputs.protein_grams as number) * 4 +
        (outputs.carbohydrate_grams as number) * 4 +
        (outputs.fat_grams as number) * 9;
      closeTo(reconstituted, 2000, 0.05);
    });
  }
});

test("macronutrient percentages that do not add to 100 are refused", async () => {
  await assert.rejects(
    () => calculate("HLT-012", {
      calories: 2000, protein_percentage: 40, carbohydrate_percentage: 40,
      fat_percentage: 40, body_weight: 70
    }, CTX),
    /add up to 100. They currently add up to 120/
  );
});

// ---------------------------------------------------------------------------
// HLT-015: the conservative estimate, deliberately
// ---------------------------------------------------------------------------

test("HLT-015 reports the LOWEST one rep max estimate", async () => {
  const { outputs } = await calculate("HLT-015", { weight: 100, reps: 5 }, CTX);
  const estimates = [outputs.epley, outputs.brzycki, outputs.lombardi] as number[];
  assert.strictEqual(outputs.one_rep_max, Math.min(...estimates));
  // Over-estimating a one rep max is how people get hurt, so the headline is
  // never the highest of the three.
  assert.ok((outputs.one_rep_max as number) < Math.max(...estimates));
});

test("HLT-015 refuses rep counts where the formulas stop working", async () => {
  await assert.rejects(
    () => calculate("HLT-015", { weight: 60, reps: 20 }, CTX),
    /stop being reliable/
  );
});

test("HLT-015 a single repetition is already the maximum", async () => {
  const { outputs } = await calculate("HLT-015", { weight: 120, reps: 1 }, CTX);
  closeTo(outputs.epley as number, 120);
  closeTo(outputs.brzycki as number, 120);
});

// ---------------------------------------------------------------------------
// HLT-014: pace round trips
// ---------------------------------------------------------------------------

test("HLT-014 pace and speed describe the same run", async () => {
  const { outputs } = await calculate("HLT-014", {
    distance_km: 10, hours: 0, minutes: 50, seconds: 0
  }, CTX);
  // 10 km in 50 minutes is 5:00 per km and 12 km/h.
  assert.strictEqual(outputs.pace_per_km, "5:00");
  closeTo(outputs.speed_kmh as number, 12);
  // The 10 km prediction must return the time actually run.
  assert.strictEqual(outputs.finish_time_10k, "50:00");
});

test("HLT-014 needs a time", async () => {
  await assert.rejects(
    () => calculate("HLT-014", { distance_km: 5, hours: 0, minutes: 0, seconds: 0 }, CTX),
    /Enter the time it took/
  );
});

// ---------------------------------------------------------------------------
// HLT-016: Karvonen when a resting rate is known
// ---------------------------------------------------------------------------

test("HLT-016 personalises the zones when a resting rate is given", async () => {
  const withoutResting = await calculate("HLT-016", { age: 30, resting_heart_rate: "" }, CTX);
  const withResting = await calculate("HLT-016", { age: 30, resting_heart_rate: 50 }, CTX);

  assert.match(String(withoutResting.outputs.method), /Percentage of maximum/);
  assert.match(String(withResting.outputs.method), /Karvonen/);
  // A low resting rate raises the whole zone, because the reserve is larger.
  assert.ok(
    (withResting.outputs.moderate_lower as number) >
      (withoutResting.outputs.moderate_lower as number)
  );
  // 208 - 0.7 x 30 = 187.
  closeTo(withoutResting.outputs.maximum_heart_rate as number, 187);
});

test("HLT-016 warns that the fat burning zone is not a shortcut", async () => {
  const { outputs } = await calculate("HLT-016", { age: 40, resting_heart_rate: "" }, CTX);
  assert.match(String(outputs.basis), /not the shortcut it is often sold as/i);
});

// ---------------------------------------------------------------------------
// HLT-017: clinical use is explicitly out of scope
// ---------------------------------------------------------------------------

test("HLT-017 says it must not be used for dosing", async () => {
  const { outputs } = await calculate("HLT-017", { weight: 75, height: 175 }, CTX);
  assert.match(String(outputs.basis), /must NOT be used to work out a dose/);
  // Mosteller for 175 cm and 75 kg is sqrt(175 x 75 / 3600) = 1.9094.
  closeTo(outputs.body_surface_area as number, 1.9094, 0.001);
});

// ---------------------------------------------------------------------------
// HLT-019 / HLT-020: due dates, with the cycle adjustment
// ---------------------------------------------------------------------------

test("HLT-019 adjusts the due date for cycle length", async () => {
  const standard = await calculate("HLT-019", {
    last_period_date: "2026-02-01", cycle_length: 28
  }, CTX);
  const longer = await calculate("HLT-019", {
    last_period_date: "2026-02-01", cycle_length: 35
  }, CTX);

  // 280 days from 1 February 2026 is 8 November 2026. A 35-day cycle moves it
  // exactly a week later; the unadjusted classical rule would get this wrong.
  assert.strictEqual(standard.outputs.estimated_due_date, "2026-11-08");
  assert.strictEqual(longer.outputs.estimated_due_date, "2026-11-15");
});

test("HLT-019 and HLT-020 agree, and state that a scan is more accurate", async () => {
  const inputs = { last_period_date: "2026-02-01", cycle_length: 28 };
  const a = await calculate("HLT-019", inputs, CTX);
  const b = await calculate("HLT-020", inputs, CTX);
  assert.strictEqual(a.outputs.estimated_due_date, b.outputs.estimated_due_date);
  assert.match(String(a.outputs.basis), /dating scan is more accurate/i);
});

test("HLT-019 refuses impossible dates", async (t: any) => {
  await t.test("a future date", async () => {
    await assert.rejects(
      () => calculate("HLT-019", { last_period_date: "2027-01-01", cycle_length: 28 }, CTX),
      /cannot be in the future/
    );
  });
  await t.test("a date beyond any pregnancy", async () => {
    await assert.rejects(
      () => calculate("HLT-019", { last_period_date: "2024-01-01", cycle_length: 28 }, CTX),
      /beyond any pregnancy/
    );
  });
  await t.test("a malformed date", async () => {
    await assert.rejects(
      () => calculate("HLT-019", { last_period_date: "1 Feb 2026", cycle_length: 28 }, CTX),
      /must be a date in the form YYYY-MM-DD/
    );
  });
});

// ---------------------------------------------------------------------------
// HLT-022: explicitly not contraception
// ---------------------------------------------------------------------------

test("HLT-022 states plainly that it is not contraception", async () => {
  const { outputs } = await calculate("HLT-022", {
    last_period_date: "2026-06-01", cycle_length: 28, luteal_phase: 14, cycles_to_show: 3
  }, CTX);
  assert.match(String(outputs.basis), /NOT a form of contraception/);
  // Ovulation on day 14 of a cycle starting 1 June is 15 June, and the
  // fertile window runs from five days before to one day after.
  assert.strictEqual(outputs.ovulation_date_estimate, "2026-06-15");
  assert.strictEqual(outputs.fertile_window_start, "2026-06-10");
  assert.strictEqual(outputs.fertile_window_end, "2026-06-16");
});

test("HLT-022 moves ovulation with the cycle length", async () => {
  const short = await calculate("HLT-022", {
    last_period_date: "2026-06-01", cycle_length: 24, luteal_phase: 14, cycles_to_show: 1
  }, CTX);
  const long = await calculate("HLT-022", {
    last_period_date: "2026-06-01", cycle_length: 32, luteal_phase: 14, cycles_to_show: 1
  }, CTX);
  // Ovulation is the cycle length less the luteal phase: day 10 and day 18.
  assert.strictEqual(short.outputs.ovulation_date_estimate, "2026-06-11");
  assert.strictEqual(long.outputs.ovulation_date_estimate, "2026-06-19");
});

test("cycle lengths outside the usual range are refused with advice", async () => {
  await assert.rejects(
    () => calculate("HLT-022", {
      last_period_date: "2026-06-01", cycle_length: 60, luteal_phase: 14, cycles_to_show: 1
    }, CTX),
    /speak to a GP/i
  );
});

// ---------------------------------------------------------------------------
// HLT-023: flags cycles worth mentioning to a GP
// ---------------------------------------------------------------------------

test("HLT-023 notes a cycle outside the usual range", async () => {
  const usual = await calculate("HLT-023", {
    last_period_date: "2026-06-01", cycle_length: 28, period_length: 5, cycles_to_show: 3
  }, CTX);
  const unusual = await calculate("HLT-023", {
    last_period_date: "2026-06-01", cycle_length: 22, period_length: 5, cycles_to_show: 3
  }, CTX);
  assert.match(String(usual.outputs.cycle_note), /within the usual range/);
  assert.match(String(unusual.outputs.cycle_note), /worth mentioning to a GP/);
});

// ---------------------------------------------------------------------------
// HLT-025: total sleep matters more than cycle alignment
// ---------------------------------------------------------------------------

test("HLT-025 marks which options actually give enough sleep", async () => {
  const { outputs, schedule } = await calculate("HLT-025", {
    mode: "wake_time", time: "07:00", fall_asleep_minutes: 15, cycle_minutes: 90
  }, CTX);
  const rows = schedule as Array<{ cycles: number; hours_of_sleep: number; meets_recommendation: boolean }>;

  // Four cycles at 90 minutes is six hours: neatly aligned and not enough.
  const fourCycles = rows.find((r) => r.cycles === 4);
  assert.strictEqual(fourCycles?.hours_of_sleep, 6);
  assert.strictEqual(fourCycles?.meets_recommendation, false);
  // Five and six cycles are 7.5 and 9 hours, both within the recommendation.
  assert.strictEqual(outputs.options_meeting_recommendation, 2);
  assert.match(String(outputs.basis), /chasing cycle alignment at the cost of total sleep is the wrong trade/);
});

test("HLT-025 refuses a malformed time", async () => {
  await assert.rejects(
    () => calculate("HLT-025", {
      mode: "wake_time", time: "7am", fall_asleep_minutes: 15, cycle_minutes: 90
    }, CTX),
    /24-hour form/
  );
});

// ---------------------------------------------------------------------------
// Every health calculator points somewhere better than itself
// ---------------------------------------------------------------------------

test("every health calculator refuses to pose as medical advice", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>, RegExp]> = [
    ["HLT-002", { sex: "female", weight: 65, height: 165, age: 30, body_fat_percentage: "", activity: "moderate" }, /not medical advice/i],
    ["HLT-003", { sex: "female", weight: 65, height: 165, age: 30, body_fat_percentage: "", activity: "moderate" }, /not medical advice/i],
    ["HLT-004", { maintenance_calories: 2200, goal: "maintain", rate_kg_per_week: 0, current_weight: 70, target_weight: "", sex: "female" }, /eating disorder/i],
    ["HLT-005", { sex: "male", height: 180, neck: 38, waist: 85, hip: 0, weight: 80 }, /not medical advice/i],
    ["HLT-007", { weight: 68, height: 170, higher_risk_background: false }, /not medical advice/i],
    ["HLT-008", { sex: "female", height: 165 }, /not medical advice/i],
    ["HLT-012", { calories: 2000, protein_percentage: 30, carbohydrate_percentage: 40, fat_percentage: 30, body_weight: 70 }, /eating disorder/i],
    ["HLT-016", { age: 30, resting_heart_rate: "" }, /not medical advice/i],
    ["HLT-017", { weight: 75, height: 175 }, /not medical advice/i],
    ["HLT-022", { last_period_date: "2026-06-01", cycle_length: 28, luteal_phase: 14, cycles_to_show: 1 }, /not a test and not a diagnosis/i],
    ["HLT-023", { last_period_date: "2026-06-01", cycle_length: 28, period_length: 5, cycles_to_show: 3 }, /not a test and not a diagnosis/i]
  ];
  for (const [id, inputs, pattern] of cases) {
    await t.test(id, async () => {
      const { outputs } = await calculate(id, inputs, CTX);
      assert.match(String(outputs.basis), pattern);
    });
  }
});

test("no health calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["HLT-002", { sex: "female", weight: 45, height: 150, age: 18, body_fat_percentage: "", activity: "sedentary" }],
    ["HLT-003", { sex: "male", weight: 45, height: 150, age: 120, body_fat_percentage: "", activity: "sedentary" }],
    ["HLT-004", { maintenance_calories: 1200, goal: "lose", rate_kg_per_week: 0, current_weight: 45, target_weight: "", sex: "female" }],
    ["HLT-006", { sex: "female", weight: 45, height: 150, body_fat_percentage: "" }],
    ["HLT-007", { weight: 45, height: 150, higher_risk_background: false }],
    ["HLT-008", { sex: "female", height: 150 }],
    ["HLT-012", { calories: 1, protein_percentage: 0, carbohydrate_percentage: 100, fat_percentage: 0, body_weight: "" }],
    ["HLT-013", { met_value: 1, weight: 45, duration_minutes: 1, times_per_week: 0 }],
    ["HLT-014", { distance_km: 0.001, hours: 0, minutes: 0, seconds: 1 }],
    ["HLT-015", { weight: 1, reps: 1 }],
    ["HLT-016", { age: 18, resting_heart_rate: "" }],
    ["HLT-017", { weight: 45, height: 150 }],
    ["HLT-025", { mode: "bedtime", time: "00:00", fall_asleep_minutes: 0, cycle_minutes: 60 }]
  ];
  for (const [id, inputs] of cases) {
    await t.test(`${id} at its boundary`, async () => {
      const { outputs } = await calculate(id, inputs, CTX);
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === "number") {
          assert.ok(Number.isFinite(value), `${id}.${key} is ${value}`);
        }
        assert.notStrictEqual(String(value), "[object Object]", `${id}.${key} rendered as an object`);
        assert.notStrictEqual(String(value), "undefined", `${id}.${key} is undefined`);
      }
    });
  }
});
