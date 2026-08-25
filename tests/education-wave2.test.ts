/**
 * Wave 2 tranche 2R, Education plus the two remaining Everyday & Lifestyle
 * calculators.
 *
 * The recurring risk in this family is a number that LOOKS like a rule and is
 * not: a degree classification is set by a university's own regulations rather
 * than by an average, a maintenance loan maximum is not an entitlement, and a
 * UCAS total is only meaningful for courses that use the Tariff. These tests
 * assert the arithmetic AND that each calculator says what it cannot know.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };

function closeTo(actual: number, expected: number, tol = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected} +/- ${tol}, got ${actual}`);
}

async function run(id: string, inputs: Record<string, unknown>) {
  return calculate(id, inputs as never, CTX);
}

async function throwsWith(id: string, inputs: Record<string, unknown>, fragment: string) {
  await assert.rejects(
    () => run(id, inputs),
    (err: Error) => {
      assert.ok(
        err.message.toLowerCase().includes(fragment.toLowerCase()),
        `expected a message containing "${fragment}", got "${err.message}"`
      );
      return true;
    }
  );
}

// ---------------------------------------------------------------------------
// EDU-001 Grade calculator
// ---------------------------------------------------------------------------

test("partial weights give the average so far, not a deflated final mark", async () => {
  // Two assessments worth 50 between them. The average of 74 and 68 weighted
  // 30 and 20 is 71.6, NOT 35.8, which is what dividing by 100 would give.
  const r = await run("EDU-001", { assessments: "Midterm:74:30; Essay:68:20" });
  closeTo(r.outputs.weighted_average as number, (74 * 30 + 68 * 20) / 50, 1e-9);
  assert.strictEqual(r.outputs.weights_sum_to_100, false);
  assert.ok(
    (r.warnings ?? []).some(w => /average across the assessments entered/i.test(w)),
    "a partial set must say it is a progress figure rather than a final mark"
  );
});

test("a complete set of weights is reported as complete and carries no warning", async () => {
  const r = await run("EDU-001", { assessments: "Coursework:68:40; Exam:72:60" });
  closeTo(r.outputs.weighted_average as number, 70.4, 1e-9);
  assert.strictEqual(r.outputs.weights_sum_to_100, true);
  assert.strictEqual((r.warnings ?? []).length, 0);
});

test("contributions sum to the weighted average", async () => {
  const r = await run("EDU-001", {
    assessments: "Essay:62:20; Report:71:30; Presentation:58:10; Exam:66:40"
  });
  const rows = r.schedule as Array<{ contribution: number }>;
  const total = rows.reduce((a, b) => a + b.contribution, 0);
  closeTo(total, r.outputs.weighted_average as number, 1e-6);
});

test("a malformed assessment list is refused with the expected shape", async () => {
  await throwsWith("EDU-001", { assessments: "Coursework 68 40" }, "separated by colons");
  await throwsWith("EDU-001", { assessments: "Coursework:abc:40" }, "must both be numbers");
});

test("weights that add to zero are refused rather than dividing by zero", async () => {
  await throwsWith("EDU-001", { assessments: "Essay:70:0; Exam:60:0" }, "add up to zero");
});

// ---------------------------------------------------------------------------
// EDU-002 Degree classification
// ---------------------------------------------------------------------------

test("the standard boundaries classify correctly", async () => {
  const cases: Array<[string, string]> = [
    ["2:71:25; 3:74:75", "First class honours"],
    ["2:64:25; 3:69:75", "Upper second class honours (2:1)"],
    ["2:54:25; 3:57:75", "Lower second class honours (2:2)"],
    ["2:44:40; 3:46:60", "Third class honours"]
  ];
  for (const [years, expected] of cases) {
    const r = await run("EDU-002", { years });
    assert.strictEqual(r.outputs.classification, expected, `for ${years}`);
  }
});

test("a mark within two of a boundary is flagged as borderline, because the average stops deciding there", async () => {
  const borderline = await run("EDU-002", { years: "2:66:25; 3:69:75" });
  assert.strictEqual(borderline.outputs.in_borderline_zone, true);
  assert.ok(
    (borderline.warnings ?? []).some(w => /profile of individual module marks/i.test(w)),
    "the borderline warning must explain that the university's own rule governs"
  );

  const clear = await run("EDU-002", { years: "2:64:25; 3:65:75" });
  assert.strictEqual(clear.outputs.in_borderline_zone, false);
});

test("year weightings drive the result, which is why they are an input", async () => {
  // The same two years' marks, weighted two different ways, give different
  // classifications. That is the whole reason the weighting cannot be assumed.
  //   62 and 73 at 25:75 -> 15.5 + 54.75 = 70.25, a first.
  //   the same marks at 50:50 -> 31 + 36.5 = 67.5, a 2:1.
  const finalHeavy = await run("EDU-002", { years: "2:62:25; 3:73:75" });
  const evenSplit = await run("EDU-002", { years: "2:62:50; 3:73:50" });
  closeTo(finalHeavy.outputs.overall_average as number, 70.25, 1e-9);
  closeTo(evenSplit.outputs.overall_average as number, 67.5, 1e-9);
  assert.strictEqual(finalHeavy.outputs.classification, "First class honours");
  assert.strictEqual(evenSplit.outputs.classification, "Upper second class honours (2:1)");
});

test("the calculator states that only the university can classify a degree", async () => {
  const r = await run("EDU-002", { years: "2:64:25; 3:69:75" });
  const basis = r.outputs.basis as string;
  assert.ok(/ESTIMATE, NOT A CLASSIFICATION/i.test(basis));
  assert.ok(/Only the awarding university can classify a degree/i.test(basis));
});

// ---------------------------------------------------------------------------
// EDU-003 UCAS points
// ---------------------------------------------------------------------------

test("the published tariff values are reproduced exactly", async () => {
  const grades: Array<[string, number]> = [
    ["A*", 56], ["A", 48], ["B", 40], ["C", 32], ["D", 24], ["E", 16]
  ];
  for (const [grade, points] of grades) {
    const r = await run("EDU-003", { qualifications: `a_level:${grade}` });
    assert.strictEqual(r.outputs.total_points, points, `A level ${grade}`);
  }
  const as: Array<[string, number]> = [["A", 20], ["B", 16], ["C", 12], ["D", 10], ["E", 6]];
  for (const [grade, points] of as) {
    const r = await run("EDU-003", { qualifications: `as_level:${grade}` });
    assert.strictEqual(r.outputs.total_points, points, `AS level ${grade}`);
  }
  const epq: Array<[string, number]> = [["A*", 28], ["A", 24], ["B", 20], ["C", 16], ["D", 12], ["E", 8]];
  for (const [grade, points] of epq) {
    const r = await run("EDU-003", { qualifications: `epq:${grade}` });
    assert.strictEqual(r.outputs.total_points, points, `EPQ ${grade}`);
  }
});

test("three A stars is 168 points, the top of the usual scale", async () => {
  const r = await run("EDU-003", { qualifications: "a_level:A*; a_level:A*; a_level:A*" });
  assert.strictEqual(r.outputs.total_points, 168);
  assert.strictEqual(r.outputs.equivalent_a_level_grades, "3A*");
});

test("an AS level is worth much less than the full A level in the same subject", async () => {
  const asLevel = await run("EDU-003", { qualifications: "as_level:A" });
  const aLevel = await run("EDU-003", { qualifications: "a_level:A" });
  assert.ok((asLevel.outputs.total_points as number) < (aLevel.outputs.total_points as number) / 2);
});

test("entering both AS and A levels warns about the double-counting rule", async () => {
  const r = await run("EDU-003", {
    qualifications: "a_level:B; a_level:C; as_level:B; as_level:C"
  });
  assert.ok(
    (r.warnings ?? []).some(w => /same subject/i.test(w)),
    "the AS-and-A-level rule is the commonest reason a self-calculated total is too high"
  );
});

test("the calculator says that many courses do not use the Tariff at all", async () => {
  const r = await run("EDU-003", { qualifications: "a_level:A; a_level:A; a_level:B" });
  assert.ok(/MANY COURSES DO NOT USE THE TARIFF/i.test(r.outputs.basis as string));
});

test("an unknown qualification or grade is refused by name", async () => {
  await throwsWith("EDU-003", { qualifications: "btec:D*" }, "not a qualification this calculator holds");
  await throwsWith("EDU-003", { qualifications: "a_level:F" }, "not a grade for that qualification");
});

// ---------------------------------------------------------------------------
// EDU-004 University cost
// ---------------------------------------------------------------------------

test("the maintenance loan maximum depends on where you live, and so does the rent", async () => {
  const common = { years: 3, tuition_per_year: 9790, maintenance_loan: "", rent_per_month: 650, other_living_per_month: 400, months_per_year: 9 };
  const home = await run("EDU-004", { ...common, living_arrangement: "at_home" });
  const away = await run("EDU-004", { ...common, living_arrangement: "away_outside_london" });
  const london = await run("EDU-004", { ...common, living_arrangement: "away_in_london" });

  assert.strictEqual(home.outputs.maintenance_loan_max_for_circumstances, 9118);
  assert.strictEqual(away.outputs.maintenance_loan_max_for_circumstances, 10830);
  assert.strictEqual(london.outputs.maintenance_loan_max_for_circumstances, 14135);
});

test("a loan above the maximum for the circumstances is refused", async () => {
  await throwsWith(
    "EDU-004",
    {
      years: 3, tuition_per_year: 9790, living_arrangement: "at_home",
      maintenance_loan: 14000, rent_per_month: 650,
      other_living_per_month: 400, months_per_year: 9
    },
    "maximum maintenance loan for that living arrangement"
  );
});

test("a tuition fee above the England cap is refused with the cap quoted", async () => {
  await throwsWith(
    "EDU-004",
    {
      years: 3, tuition_per_year: 12000, living_arrangement: "away_outside_london",
      maintenance_loan: "", rent_per_month: 650,
      other_living_per_month: 400, months_per_year: 9
    },
    "cannot charge more than"
  );
});

test("a shortfall between loan and living costs is surfaced as a warning", async () => {
  const r = await run("EDU-004", {
    years: 3, tuition_per_year: 9790, living_arrangement: "away_outside_london",
    maintenance_loan: 6500, rent_per_month: 650,
    other_living_per_month: 400, months_per_year: 9
  });
  assert.ok((r.outputs.shortfall_per_year as number) > 0);
  assert.ok((r.warnings ?? []).some(w => /has to come from work, savings or family/i.test(w)));
});

test("the calculator says the amount borrowed is not the amount repaid", async () => {
  const r = await run("EDU-004", {
    years: 3, tuition_per_year: 9790, living_arrangement: "away_outside_london",
    maintenance_loan: "", rent_per_month: 650,
    other_living_per_month: 400, months_per_year: 9
  });
  const basis = r.outputs.basis as string;
  assert.ok(/TOTAL BORROWED IS NOT WHAT YOU REPAY/i.test(basis));
  assert.ok(/MEANS TESTED/i.test(basis));
  assert.ok(/THIS IS ENGLAND/i.test(basis));
});

// ---------------------------------------------------------------------------
// EDU-005 Student budget
// ---------------------------------------------------------------------------

test("the weeks the money lasts is reported, and a shortfall warns before the term ends", async () => {
  const r = await run("EDU-005", {
    loan_per_term: 3000, other_income_per_term: 0,
    rent_per_week: 160, other_spending_per_week: 140, weeks_in_term: 13
  });
  closeTo(r.outputs.weeks_money_lasts as number, 3000 / 300, 1e-9);
  assert.strictEqual(r.outputs.runs_out, true);
  assert.ok((r.warnings ?? []).some(w => /runs out after about/i.test(w)));
});

test("a comfortable term does not warn", async () => {
  const r = await run("EDU-005", {
    loan_per_term: 3610, other_income_per_term: 500,
    rent_per_week: 150, other_spending_per_week: 120, weeks_in_term: 13
  });
  assert.strictEqual(r.outputs.runs_out, false);
  assert.ok((r.outputs.surplus_per_term as number) > 0);
});

test("rent taking most of the income is called out", async () => {
  const r = await run("EDU-005", {
    loan_per_term: 3200, other_income_per_term: 0,
    rent_per_week: 200, other_spending_per_week: 30, weeks_in_term: 13
  });
  assert.ok((r.outputs.rent_share_of_income_pct as number) > 60);
  assert.ok((r.warnings ?? []).some(w => /of your income for the term/i.test(w)));
});

test("zero spending gives a null weeks-lasting rather than infinity", async () => {
  const r = await run("EDU-005", {
    loan_per_term: 3000, other_income_per_term: 0,
    rent_per_week: 0, other_spending_per_week: 0, weeks_in_term: 13
  });
  assert.strictEqual(r.outputs.weeks_money_lasts, null);
  assert.strictEqual(r.outputs.runs_out, false);
});

// ---------------------------------------------------------------------------
// EVE-001 Tip
// ---------------------------------------------------------------------------

test("the tip is taken on the bill, NOT on the bill plus the service charge", async () => {
  const r = await run("EVE-001", {
    bill: 120, tip_pct: 10, service_charge_pct: 12.5, people: 4, round_to: 0
  });
  closeTo(r.outputs.service_charge as number, 15, 1e-9);
  // 10% of 120 is 12. Tipping on 135 would give 13.50, which is paying twice
  // for the same service.
  closeTo(r.outputs.tip as number, 12, 1e-9);
  closeTo(r.outputs.total as number, 147, 1e-9);
  closeTo(r.outputs.effective_tip_pct as number, 22.5, 1e-9);
});

test("adding a tip on top of a service charge is flagged with the combined figure", async () => {
  const r = await run("EVE-001", {
    bill: 120, tip_pct: 10, service_charge_pct: 12.5, people: 4, round_to: 0
  });
  assert.ok((r.warnings ?? []).some(w => /already on this bill/i.test(w)));

  const noService = await run("EVE-001", {
    bill: 120, tip_pct: 10, service_charge_pct: 0, people: 4, round_to: 0
  });
  assert.strictEqual((noService.warnings ?? []).length, 0);
});

test("rounding always rounds UP and the adjustment is never negative", async () => {
  const r = await run("EVE-001", {
    bill: 63.4, tip_pct: 15, service_charge_pct: 0, people: 2, round_to: 5
  });
  const total = r.outputs.total as number;
  const rounded = r.outputs.rounded_total as number;
  assert.ok(rounded >= total);
  assert.ok((r.outputs.rounding_adjustment as number) >= 0);
  closeTo(rounded % 5, 0, 1e-9);
});

test("the split is of the rounded total, so the parts add back to what is paid", async () => {
  const r = await run("EVE-001", {
    bill: 87.5, tip_pct: 10, service_charge_pct: 0, people: 3, round_to: 0
  });
  closeTo((r.outputs.per_person as number) * 3, r.outputs.rounded_total as number, 0.011);
});

test("the UK tipping law points are stated", async () => {
  const r = await run("EVE-001", {
    bill: 100, tip_pct: 10, service_charge_pct: 0, people: 1, round_to: 0
  });
  const basis = r.outputs.basis as string;
  assert.ok(/REMOVED ON REQUEST/i.test(basis));
  assert.ok(/Employment \(Allocation of Tips\) Act 2023/i.test(basis));
});

// ---------------------------------------------------------------------------
// EVE-003 Tyre size
// ---------------------------------------------------------------------------

test("a tyre marking mixes millimetres, a percentage and inches", async () => {
  const r = await run("EVE-003", {
    width_mm: 225, aspect_ratio: 45, rim_inches: 17,
    reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: ""
  });
  // Sidewall is 45% of 225 mm; diameter is the rim in inches plus two sidewalls.
  closeTo(r.outputs.sidewall_height_mm as number, 101.25, 1e-9);
  closeTo(r.outputs.overall_diameter_mm as number, 17 * 25.4 + 2 * 101.25, 1e-9);
});

test("the aspect ratio is a percentage OF THE WIDTH, so it bites harder on a wide tyre", async () => {
  const narrow45 = await run("EVE-003", { width_mm: 155, aspect_ratio: 45, rim_inches: 17, reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: "" });
  const narrow50 = await run("EVE-003", { width_mm: 155, aspect_ratio: 50, rim_inches: 17, reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: "" });
  const wide45 = await run("EVE-003", { width_mm: 305, aspect_ratio: 45, rim_inches: 17, reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: "" });
  const wide50 = await run("EVE-003", { width_mm: 305, aspect_ratio: 50, rim_inches: 17, reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: "" });

  const narrowChange = (narrow50.outputs.overall_diameter_mm as number) - (narrow45.outputs.overall_diameter_mm as number);
  const wideChange = (wide50.outputs.overall_diameter_mm as number) - (wide45.outputs.overall_diameter_mm as number);
  assert.ok(wideChange > narrowChange * 1.9, "the same five point change moves a wide tyre roughly twice as far");
});

test("a larger tyre makes the speedometer read LOW", async () => {
  const r = await run("EVE-003", {
    width_mm: 265, aspect_ratio: 70, rim_inches: 17,
    reference_width_mm: 225, reference_aspect_ratio: 45, reference_rim_inches: 17
  });
  assert.ok((r.outputs.diameter_difference_pct as number) > 0, "this is the larger tyre");
  assert.ok(
    (r.outputs.speedometer_reading_at_true_70 as number) < 70,
    "a larger tyre covers more ground per revolution, so the dial under-reads"
  );
  assert.strictEqual(r.outputs.within_recommended_tolerance, false);
  assert.ok((r.warnings ?? []).some(w => /within about 3%/i.test(w)));
});

test("a fitment within three per cent passes and carries no warning", async () => {
  const r = await run("EVE-003", {
    width_mm: 215, aspect_ratio: 50, rim_inches: 17,
    reference_width_mm: 205, reference_aspect_ratio: 55, reference_rim_inches: 17
  });
  assert.strictEqual(r.outputs.within_recommended_tolerance, true);
  assert.strictEqual((r.warnings ?? []).length, 0);
});

test("revolutions per kilometre is consistent with the circumference", async () => {
  const r = await run("EVE-003", {
    width_mm: 195, aspect_ratio: 65, rim_inches: 15,
    reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: ""
  });
  closeTo(
    (r.outputs.revolutions_per_km as number) * (r.outputs.circumference_mm as number),
    1000000,
    1e-3
  );
});

test("a sidewall figure entered as a measurement rather than a percentage is refused", async () => {
  await throwsWith(
    "EVE-003",
    { width_mm: 225, aspect_ratio: 101, rim_inches: 17, reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: "" },
    "second number on the sidewall"
  );
  await throwsWith(
    "EVE-003",
    { width_mm: 225, aspect_ratio: 45, rim_inches: 432, reference_width_mm: "", reference_aspect_ratio: "", reference_rim_inches: "" },
    "in inches"
  );
});

// ---------------------------------------------------------------------------
// Nothing broken ever reaches a user
// ---------------------------------------------------------------------------

test("every education and lifestyle calculator returns finite numbers, strings or nulls only", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["EDU-001", { assessments: "Coursework:68:40; Exam:72:60" }],
    ["EDU-002", { years: "2:64:25; 3:69:75" }],
    ["EDU-003", { qualifications: "a_level:A; a_level:A; a_level:B; epq:A" }],
    ["EDU-004", { years: 3, tuition_per_year: 9790, living_arrangement: "away_outside_london", maintenance_loan: "", rent_per_month: 650, other_living_per_month: 400, months_per_year: 9 }],
    ["EDU-005", { loan_per_term: 3610, other_income_per_term: 500, rent_per_week: 150, other_spending_per_week: 120, weeks_in_term: 13 }],
    ["EVE-001", { bill: 120, tip_pct: 10, service_charge_pct: 12.5, people: 4, round_to: 1 }],
    ["EVE-003", { width_mm: 225, aspect_ratio: 45, rim_inches: 17, reference_width_mm: 205, reference_aspect_ratio: 55, reference_rim_inches: 16 }]
  ];
  for (const [id, inputs] of cases) {
    const r = await run(id, inputs);
    for (const [key, value] of Object.entries(r.outputs)) {
      if (value === null) continue;
      const kind = typeof value;
      assert.ok(
        kind === "number" || kind === "string" || kind === "boolean",
        `${id}.${key} is a ${kind}, which would render as [object Object]`
      );
      if (kind === "number") {
        assert.ok(Number.isFinite(value as number), `${id}.${key} is not finite`);
      }
      if (kind === "string") {
        assert.ok(
          !/NaN|Infinity|undefined|\[object/.test(value as string),
          `${id}.${key} contains a broken value: ${value}`
        );
      }
    }
  }
});
