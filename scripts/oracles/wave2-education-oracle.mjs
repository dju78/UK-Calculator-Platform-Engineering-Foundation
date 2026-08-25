/**
 * Independent benchmark oracle for Wave 2 tranche 2R, Education plus the two
 * remaining Everyday & Lifestyle calculators.
 *
 * Imports nothing from the calculation engine. Independence of METHOD:
 *
 *   - Weighted averages are computed by SUMMING the products first and
 *     dividing ONCE at the end, rather than by dividing each contribution and
 *     summing, which is the engine's order. Those two orders differ in their
 *     rounding, so agreeing to twelve figures checks both.
 *   - UCAS tables are RE-TYPED here from the published tariff rather than read
 *     from the ruleset, so agreement corroborates the ruleset data.
 *   - Budgets are accumulated WEEK BY WEEK and course costs YEAR BY YEAR,
 *     rather than multiplied out.
 *   - Tips are computed in INTEGER PENCE throughout.
 *   - Tyre dimensions are derived entirely in INCHES and converted to
 *     millimetres at the end, the opposite way round from the engine.
 *
 * Run: node scripts/oracles/wave2-education-oracle.mjs > /tmp/education.json
 */

const sig = (n, digits = 12) => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};
const r2 = (n) => Math.round(n * 100) / 100;

// --- UCAS tariff, re-typed from the published tables ----------------------
const A_LEVEL = { "A*": 56, A: 48, B: 40, C: 32, D: 24, E: 16 };
const AS_LEVEL = { A: 20, B: 16, C: 12, D: 10, E: 6 };
const EPQ = { "A*": 28, A: 24, B: 20, C: 16, D: 12, E: 8 };

// --- Student finance England 2026/27, re-typed from GOV.UK ----------------
const FEE_MAX = 9790;
const MAINT_HOME = 9118;
const MAINT_AWAY = 10830;
const MAINT_LONDON = 14135;

const fixtures = {};

function add(id, scenario, inputs, expected, note, ruleset = "None") {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±0.011 on money, 1e-6 on averages and ratios",
    ruleset,
    note: note ?? "Independently derived; no engine code used."
  });
}

/** Weighted average: sum the products first, divide ONCE at the end. */
function weightedAverage(rows) {
  let numerator = 0;
  let denominator = 0;
  for (const r of rows) {
    numerator += r.score * r.weight;
    denominator += r.weight;
  }
  return { average: numerator / denominator, totalWeight: denominator };
}

// ===========================================================================
// EDU-001 Grade calculator
// ===========================================================================

for (const c of [
  { scenario: "Coursework and an exam, weights reaching a hundred", rows: [["Coursework", 68, 40], ["Exam", 72, 60]] },
  { scenario: "Four assessments across a module", rows: [["Essay", 62, 20], ["Report", 71, 30], ["Presentation", 58, 10], ["Exam", 66, 40]] },
  { scenario: "Only half the assessments sat, so the weights fall short", rows: [["Midterm", 74, 30], ["Essay", 68, 20]] },
  { scenario: "Equal weights throughout", rows: [["Unit 1", 55, 25], ["Unit 2", 65, 25], ["Unit 3", 75, 25], ["Unit 4", 85, 25]] },
  { scenario: "One dominant assessment", rows: [["Quiz", 90, 5], ["Dissertation", 64, 95]] },
  { scenario: "A single assessment carrying everything", rows: [["Exam", 71, 100]] }
]) {
  const rows = c.rows.map(([name, score, weight]) => ({ name, score, weight }));
  const { average, totalWeight } = weightedAverage(rows);
  const sorted = [...rows].sort((a, b) => b.score - a.score);

  const boundaries = [40, 50, 60, 70];
  const above = boundaries.filter(b => b > average).sort((a, b) => a - b);

  add("EDU-001", c.scenario,
    { assessments: c.rows.map(r => `${r[0]}:${r[1]}:${r[2]}`).join("; ") },
    {
      weighted_average: sig(average),
      total_weight: sig(totalWeight),
      weights_sum_to_100: Math.abs(totalWeight - 100) < 1e-9,
      best_component: sorted[0].name,
      worst_component: sorted[sorted.length - 1].name,
      next_boundary: above.length > 0 ? above[0] : null,
      points_from_next_boundary: above.length > 0 ? sig(above[0] - average) : null
    },
    "The average is computed by summing the products and dividing ONCE at the end, the opposite order from the engine, which divides each contribution and sums. The partial-weights case asserts that a half-finished module reports the average so far rather than a mark deflated by the assessments not yet sat.");
}

// ===========================================================================
// EDU-002 Degree classification
// ===========================================================================

for (const c of [
  { scenario: "A comfortable 2:1 on the common 25/75 split", rows: [[2, 64, 25], [3, 69, 75]] },
  { scenario: "A first", rows: [[2, 71, 25], [3, 74, 75]] },
  { scenario: "Two marks below the first boundary, inside the borderline zone", rows: [[2, 66, 25], [3, 69, 75]] },
  { scenario: "A 2:2", rows: [[2, 54, 25], [3, 57, 75]] },
  { scenario: "All three years weighted equally", rows: [[1, 58, 33.33], [2, 62, 33.33], [3, 66, 33.34]] },
  { scenario: "A third", rows: [[2, 44, 40], [3, 46, 60]] }
]) {
  const rows = c.rows.map(([year, average, weight]) => ({ year, score: average, weight }));
  const { average } = weightedAverage(rows);

  const bands = [[70, "First class honours"], [60, "Upper second class honours (2:1)"], [50, "Lower second class honours (2:2)"], [40, "Third class honours"]];
  let classification = "Below third class";
  let nextClass = null;
  let marksFrom = null;
  for (let i = 0; i < bands.length; i++) {
    if (average >= bands[i][0]) {
      classification = bands[i][1];
      nextClass = i > 0 ? bands[i - 1][1] : null;
      marksFrom = i > 0 ? sig(bands[i - 1][0] - average) : null;
      break;
    }
  }
  if (classification === "Below third class") {
    nextClass = "Third class honours";
    marksFrom = sig(40 - average);
  }
  const near = [70, 60, 50, 40].find(v => average < v && v - average <= 2);

  add("EDU-002", c.scenario,
    { years: c.rows.map(r => `${r[0]}:${r[1]}:${r[2]}`).join("; ") },
    {
      overall_average: sig(average),
      classification,
      next_classification: nextClass,
      marks_from_next_classification: marksFrom,
      in_borderline_zone: near !== undefined
    },
    "The borderline case sits deliberately within two marks of the first boundary, because that is where the average stops deciding anything and the university's own profile rule takes over. A calculator that reported a bare classification there would be overstating what it knows.",
    "uk-2026-27-v1");
}

// ===========================================================================
// EDU-003 UCAS points
// ===========================================================================

for (const c of [
  { scenario: "Three A levels and an EPQ", entries: [["a_level", "A"], ["a_level", "A"], ["a_level", "B"], ["epq", "A"]] },
  { scenario: "Three A stars", entries: [["a_level", "A*"], ["a_level", "A*"], ["a_level", "A*"]] },
  { scenario: "A mixed profile with AS levels", entries: [["a_level", "B"], ["a_level", "C"], ["as_level", "B"], ["as_level", "C"]] },
  { scenario: "Three B grades, a common offer level", entries: [["a_level", "B"], ["a_level", "B"], ["a_level", "B"]] },
  { scenario: "A single A level", entries: [["a_level", "C"]] },
  { scenario: "Four A levels plus an EPQ at the top grade", entries: [["a_level", "A*"], ["a_level", "A"], ["a_level", "A"], ["a_level", "B"], ["epq", "A*"]] }
]) {
  const tables = { a_level: A_LEVEL, as_level: AS_LEVEL, epq: EPQ };
  const rows = c.entries.map(([q, g]) => ({ qualification: q, grade: g, points: tables[q][g] }));
  const total = rows.reduce((a, r) => a + r.points, 0);
  const sumOf = (q) => rows.filter(r => r.qualification === q).reduce((a, r) => a + r.points, 0);

  // Express as A level equivalents, greedily from the top grade down.
  const order = ["A*", "A", "B", "C", "D", "E"];
  let remaining = total;
  const counts = {};
  for (const g of order) {
    while (remaining >= A_LEVEL[g]) {
      counts[g] = (counts[g] ?? 0) + 1;
      remaining -= A_LEVEL[g];
    }
  }
  let equivalent = order.filter(g => counts[g]).map(g => `${counts[g]}${g}`).join(" ") || "less than one A level at grade E";
  if (remaining > 0 && equivalent !== "less than one A level at grade E") {
    equivalent += ` plus ${sig(remaining)} points`;
  }

  add("EDU-003", c.scenario,
    { qualifications: c.entries.map(e => `${e[0]}:${e[1]}`).join("; ") },
    {
      total_points: total,
      a_level_points: sumOf("a_level"),
      as_level_points: sumOf("as_level"),
      epq_points: sumOf("epq"),
      qualification_count: rows.length,
      equivalent_a_level_grades: equivalent
    },
    "The tariff tables are RE-TYPED here from the published values rather than read from the ruleset, so agreement corroborates the ruleset data rather than merely echoing it. The three-A-star case pins the top of the scale at 168 points, which is checkable by inspection.",
    "uk-2026-27-v1");
}

// ===========================================================================
// EDU-004 University cost
// ===========================================================================

for (const c of [
  { scenario: "A three year course away from home outside London", years: 3, fee: FEE_MAX, arrangement: "away_outside_london", loan: null, rent: 650, other: 400, months: 9 },
  { scenario: "Living at home, where the loan is smaller but so are the costs", years: 3, fee: FEE_MAX, arrangement: "at_home", loan: null, rent: 200, other: 350, months: 9 },
  { scenario: "London, where both the loan and the rent are higher", years: 3, fee: FEE_MAX, arrangement: "away_in_london", loan: null, rent: 1100, other: 500, months: 9 },
  { scenario: "A means tested loan well below the maximum", years: 3, fee: FEE_MAX, arrangement: "away_outside_london", loan: 6500, rent: 650, other: 400, months: 9 },
  { scenario: "A four year course with a placement year", years: 4, fee: FEE_MAX, arrangement: "away_outside_london", loan: 9000, rent: 600, other: 380, months: 10 },
  { scenario: "A lower tuition fee, as some providers charge", years: 3, fee: 6500, arrangement: "away_outside_london", loan: 8000, rent: 550, other: 350, months: 9 }
]) {
  const maxByArrangement =
    c.arrangement === "at_home" ? MAINT_HOME
      : c.arrangement === "away_in_london" ? MAINT_LONDON
        : MAINT_AWAY;
  const loan = c.loan ?? maxByArrangement;

  // Accumulate YEAR BY YEAR rather than multiplying out.
  let totalTuition = 0, totalLoan = 0, totalLiving = 0;
  const livingPerYear = (c.rent + c.other) * c.months;
  for (let y = 0; y < c.years; y++) {
    totalTuition += c.fee;
    totalLoan += loan;
    totalLiving += livingPerYear;
  }

  add("EDU-004", c.scenario,
    {
      years: c.years, tuition_per_year: c.fee, living_arrangement: c.arrangement,
      maintenance_loan: c.loan, rent_per_month: c.rent,
      other_living_per_month: c.other, months_per_year: c.months
    },
    {
      total_tuition: r2(totalTuition),
      total_maintenance_loan: r2(totalLoan),
      total_borrowed: r2(totalTuition + totalLoan),
      living_costs_per_year: r2(livingPerYear),
      total_living_costs: r2(totalLiving),
      shortfall_per_year: r2(livingPerYear - loan),
      total_shortfall: r2(totalLiving - totalLoan),
      maintenance_loan_per_year: r2(loan),
      maintenance_loan_max_for_circumstances: maxByArrangement
    },
    "Totals are accumulated year by year rather than multiplied out. The three living arrangements are all present because the loan maximum and the realistic rent move TOGETHER: the London figures are both higher, and comparing one without the other is how a student concludes London is affordable.",
    "uk-2026-27-v1");
}

// ===========================================================================
// EDU-005 Student budget
// ===========================================================================

for (const c of [
  { scenario: "A term that balances comfortably", loan: 3610, other: 500, rent: 150, spend: 120, weeks: 13 },
  { scenario: "A term where the money runs out early", loan: 3000, other: 0, rent: 160, spend: 140, weeks: 13 },
  { scenario: "Rent taking most of the income", loan: 3200, other: 200, rent: 200, spend: 60, weeks: 13 },
  { scenario: "A longer term", loan: 4200, other: 800, rent: 145, spend: 110, weeks: 16 },
  { scenario: "Living at home with low rent and part-time work", loan: 2200, other: 1800, rent: 40, spend: 130, weeks: 13 },
  { scenario: "No spending at all, a boundary rather than a life", loan: 3000, other: 0, rent: 0, spend: 0, weeks: 13 }
]) {
  const income = c.loan + c.other;
  const perWeek = c.rent + c.spend;

  // Accumulate WEEK BY WEEK.
  let spent = 0;
  for (let w = 0; w < c.weeks; w++) spent += perWeek;

  const weeksLasting = perWeek > 0 ? income / perWeek : null;

  add("EDU-005", c.scenario,
    {
      loan_per_term: c.loan, other_income_per_term: c.other,
      rent_per_week: c.rent, other_spending_per_week: c.spend,
      weeks_in_term: c.weeks
    },
    {
      total_income_per_term: r2(income),
      total_spending_per_term: r2(spent),
      surplus_per_term: r2(income - spent),
      weekly_budget: r2(income / c.weeks),
      weekly_spending: r2(perWeek),
      weekly_surplus: r2(income / c.weeks - perWeek),
      rent_share_of_income_pct: income > 0 ? sig(((c.rent * c.weeks) / income) * 100) : 0,
      weeks_money_lasts: weeksLasting === null ? null : sig(weeksLasting),
      runs_out: weeksLasting !== null && weeksLasting < c.weeks
    },
    "Spending is accumulated one week at a time. The zero-spending case pins the boundary where the money never runs out and the weeks-lasting figure must be null rather than infinite, which is the one input that would otherwise divide by zero.");
}

// ===========================================================================
// EVE-001 Tip
// ===========================================================================

for (const c of [
  { scenario: "A bill with a service charge already added and a further tip", bill: 120, tip: 10, service: 12.5, people: 4, round: 1 },
  { scenario: "A straightforward ten per cent, split three ways", bill: 87.5, tip: 10, service: 0, people: 3, round: 0 },
  { scenario: "No tip at all", bill: 45.6, tip: 0, service: 0, people: 2, round: 0 },
  { scenario: "Service charge only, with no additional tip", bill: 200, tip: 0, service: 12.5, people: 6, round: 5 },
  { scenario: "Rounded up to the nearest five pounds", bill: 63.4, tip: 15, service: 0, people: 2, round: 5 },
  { scenario: "A single diner", bill: 24.75, tip: 12.5, service: 0, people: 1, round: 1 }
]) {
  // Work in integer pence throughout.
  const billPence = Math.round(c.bill * 100);
  const servicePence = (billPence * c.service) / 100;
  const tipPence = (billPence * c.tip) / 100;
  const totalPence = billPence + servicePence + tipPence;
  const roundPence = c.round * 100;
  const roundedPence = roundPence > 0 ? Math.ceil(totalPence / roundPence) * roundPence : totalPence;

  add("EVE-001", c.scenario,
    {
      bill: c.bill, tip_pct: c.tip, service_charge_pct: c.service,
      people: c.people, round_to: c.round
    },
    {
      bill: r2(billPence / 100),
      service_charge: r2(servicePence / 100),
      tip: r2(tipPence / 100),
      total: r2(totalPence / 100),
      rounded_total: r2(roundedPence / 100),
      rounding_adjustment: r2((roundedPence - totalPence) / 100),
      per_person: r2(roundedPence / 100 / c.people),
      tip_per_person: r2((servicePence + tipPence) / 100 / c.people),
      effective_tip_pct: c.bill > 0 ? sig(((servicePence + tipPence) / billPence) * 100) : 0
    },
    "Computed in integer pence throughout. The first case asserts the rule that matters: the tip is taken on the BILL, not on the bill plus the service charge, so a 10% tip on a bill already carrying 12.5% service comes to 22.5% overall rather than 23.75%. Tipping on the service-inclusive total is paying twice for the same thing.");
}

// ===========================================================================
// EVE-003 Tyre size
// ===========================================================================

for (const c of [
  { scenario: "A common performance size against a taller original", w: 225, a: 45, r: 17, rw: 205, ra: 55, rr: 16 },
  { scenario: "A standard family car size, no comparison", w: 195, a: 65, r: 15 },
  { scenario: "A plus-one fitment that stays within tolerance", w: 215, a: 50, r: 17, rw: 205, ra: 55, rr: 17 },
  { scenario: "A change that breaks the three per cent rule", w: 265, a: 70, r: 17, rw: 225, ra: 45, rr: 17 },
  { scenario: "A low profile tyre on a large rim", w: 245, a: 35, r: 20 },
  { scenario: "A small city car tyre", w: 155, a: 65, r: 14 }
]) {
  // Derived entirely in INCHES, converted at the end.
  const MM_PER_INCH = 25.4;
  const widthInches = c.w / MM_PER_INCH;
  const sidewallInches = (widthInches * c.a) / 100;
  const diameterInches = c.r + 2 * sidewallInches;
  const diameterMm = diameterInches * MM_PER_INCH;
  const circumferenceMm = Math.PI * diameterMm;

  const expected = {
    sidewall_height_mm: sig(sidewallInches * MM_PER_INCH),
    overall_diameter_mm: sig(diameterMm),
    overall_diameter_inches: sig(diameterInches),
    circumference_mm: sig(circumferenceMm),
    revolutions_per_km: sig(1000000 / circumferenceMm)
  };

  const inputs = {
    width_mm: c.w, aspect_ratio: c.a, rim_inches: c.r,
    reference_width_mm: c.rw ?? null,
    reference_aspect_ratio: c.ra ?? null,
    reference_rim_inches: c.rr ?? null
  };

  if (c.rw !== undefined) {
    const refWidthInches = c.rw / MM_PER_INCH;
    const refDiameterInches = c.rr + 2 * ((refWidthInches * c.ra) / 100);
    const diffPct = ((diameterInches - refDiameterInches) / refDiameterInches) * 100;
    expected.diameter_difference_pct = sig(diffPct);
    expected.speedometer_reading_at_true_70 = sig(70 * (refDiameterInches / diameterInches));
    expected.within_recommended_tolerance = Math.abs(diffPct) <= 3;
  }

  add("EVE-003", c.scenario, inputs, expected,
    "Derived entirely in INCHES and converted to millimetres at the end, the opposite way round from the engine, which works in millimetres and converts the rim. The out-of-tolerance case exists because a tyre change beyond about three per cent of rolling diameter puts the speedometer, the odometer and every distance-based driver aid out of calibration.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
