/**
 * Wave 2 Education calculators (EDU-001 to EDU-005) and the two remaining
 * Everyday & Lifestyle calculators (EVE-001, EVE-003).
 *
 * The education family shares one honesty problem: several of these figures
 * look like rules and are not. A degree classification is set by each
 * university's own regulations, not by an average; a maintenance loan is means
 * tested, so the published maximum is not an entitlement; and a UCAS total is
 * only useful for the courses that actually use the Tariff, which many of the
 * most selective ones do not. Each calculator states its own limit rather than
 * presenting an arithmetic result as an outcome.
 */
import { assertFiniteNumber } from "../common/validation.js";

const sig = (n: number, digits = 12): number => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface EducationRules {
  ucas_tariff: {
    a_level: Record<string, number>;
    as_level: Record<string, number>;
    epq: Record<string, number>;
  };
  degree_classification_boundaries: {
    first: number;
    upper_second: number;
    lower_second: number;
    third: number;
  };
  student_finance_england: {
    academic_year: string;
    tuition_fee_loan_max: number;
    maintenance_loan_max_living_at_home: number;
    maintenance_loan_max_away_outside_london: number;
    maintenance_loan_max_away_in_london: number;
  };
}

export function educationFrom(rules: any): EducationRules {
  const e = rules?.education;
  if (!e?.ucas_tariff) {
    throw new Error(
      "The education figures are missing from the ruleset for this year, so this calculator cannot run."
    );
  }
  return e as EducationRules;
}

// ===========================================================================
// EDU-001 Grade calculator (weighted average)
// ===========================================================================

export interface GradeComponent {
  name: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface GradeResult {
  weighted_average: number;
  total_weight: number;
  weights_sum_to_100: boolean;
  components: GradeComponent[];
  best_component: string;
  worst_component: string;
  points_from_next_boundary: number | null;
  next_boundary: number | null;
}

/**
 * A weighted average across assessments.
 *
 * Weights are normalised by their own total rather than assumed to sum to 100,
 * so a partial set of assessments gives the average SO FAR rather than a figure
 * silently deflated by the missing weight. Whether they summed to 100 is
 * reported, because that is the difference between a final mark and a
 * progress check and the reader needs to know which they are looking at.
 */
export function gradeAverage(
  components: Array<{ name: string; score: number; weight: number }>,
  boundaries: number[]
): GradeResult {
  if (components.length === 0) {
    throw new Error("Enter at least one assessment, with a mark and a weight.");
  }
  if (components.length > 100) {
    throw new Error("More than a hundred assessments is beyond what this calculator models.");
  }

  for (const c of components) {
    const score = assertFiniteNumber(c.score, `Mark for ${c.name}`);
    const weight = assertFiniteNumber(c.weight, `Weight for ${c.name}`);
    if (score < 0 || score > 100) {
      throw new Error(`The mark for ${c.name} must be between 0 and 100.`);
    }
    if (weight < 0) {
      throw new Error(`The weight for ${c.name} cannot be negative.`);
    }
  }

  const totalWeight = components.reduce((a, c) => a + c.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("The weights add up to zero, so there is nothing to average. Give at least one assessment a weight.");
  }

  const rows: GradeComponent[] = components.map(c => ({
    name: c.name,
    score: sig(c.score),
    weight: sig(c.weight),
    contribution: sig((c.score * c.weight) / totalWeight)
  }));

  const average = rows.reduce((a, r) => a + r.contribution, 0);

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const above = boundaries.filter(b => b > average).sort((a, b) => a - b);
  const nextBoundary = above.length > 0 ? above[0] : null;

  return {
    weighted_average: sig(average),
    total_weight: sig(totalWeight),
    weights_sum_to_100: Math.abs(totalWeight - 100) < 1e-9,
    components: rows,
    best_component: sorted[0].name,
    worst_component: sorted[sorted.length - 1].name,
    next_boundary: nextBoundary,
    points_from_next_boundary: nextBoundary === null ? null : sig(nextBoundary - average)
  };
}

// ===========================================================================
// EDU-002 UK degree classification
// ===========================================================================

export interface DegreeYear {
  year: number;
  average: number;
  weight: number;
  contribution: number;
}

export interface DegreeResult {
  overall_average: number;
  classification: string;
  years: DegreeYear[];
  next_classification: string | null;
  marks_from_next_classification: number | null;
  in_borderline_zone: boolean;
  borderline_of: string | null;
}

export function degreeClassification(
  years: Array<{ year: number; average: number; weight: number }>,
  rules: EducationRules
): DegreeResult {
  if (years.length === 0) {
    throw new Error("Enter at least one year, with an average and a weighting.");
  }
  for (const y of years) {
    const avg = assertFiniteNumber(y.average, `Year ${y.year} average`);
    const w = assertFiniteNumber(y.weight, `Year ${y.year} weighting`);
    if (avg < 0 || avg > 100) throw new Error(`The year ${y.year} average must be between 0 and 100.`);
    if (w < 0) throw new Error(`The year ${y.year} weighting cannot be negative.`);
  }
  const totalWeight = years.reduce((a, y) => a + y.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("The year weightings add up to zero. At least one year must carry weight.");
  }

  const rows: DegreeYear[] = years.map(y => ({
    year: y.year,
    average: sig(y.average),
    weight: sig(y.weight),
    contribution: sig((y.average * y.weight) / totalWeight)
  }));
  const overall = rows.reduce((a, r) => a + r.contribution, 0);

  const b = rules.degree_classification_boundaries;
  const bands: Array<[number, string]> = [
    [b.first, "First class honours"],
    [b.upper_second, "Upper second class honours (2:1)"],
    [b.lower_second, "Lower second class honours (2:2)"],
    [b.third, "Third class honours"]
  ];

  let classification = "Below third class";
  let nextClass: string | null = null;
  let marksFrom: number | null = null;

  for (let i = 0; i < bands.length; i++) {
    if (overall >= bands[i][0]) {
      classification = bands[i][1];
      nextClass = i > 0 ? bands[i - 1][1] : null;
      marksFrom = i > 0 ? sig(bands[i - 1][0] - overall) : null;
      break;
    }
  }
  if (classification === "Below third class") {
    nextClass = bands[bands.length - 1][1];
    marksFrom = sig(b.third - overall);
  }

  // Most universities have a discretionary zone of a couple of marks below a
  // boundary, where the profile of individual marks is looked at rather than
  // the average alone. Flagging it matters more than the average does.
  const boundaryValues = [b.first, b.upper_second, b.lower_second, b.third];
  const nearBoundary = boundaryValues.find(v => overall < v && v - overall <= 2);

  return {
    overall_average: sig(overall),
    classification,
    years: rows,
    next_classification: nextClass,
    marks_from_next_classification: marksFrom,
    in_borderline_zone: nearBoundary !== undefined,
    borderline_of: nearBoundary === undefined ? null : String(nearBoundary)
  };
}

// ===========================================================================
// EDU-003 UCAS Tariff points
// ===========================================================================

export interface UcasEntry {
  qualification: string;
  grade: string;
  points: number;
}

export interface UcasResult {
  total_points: number;
  entries: UcasEntry[];
  a_level_points: number;
  as_level_points: number;
  epq_points: number;
  qualification_count: number;
  equivalent_a_level_grades: string;
}

export function ucasPoints(
  entries: Array<{ qualification: string; grade: string }>,
  rules: EducationRules
): UcasResult {
  if (entries.length === 0) {
    throw new Error("Enter at least one qualification and grade.");
  }
  if (entries.length > 30) {
    throw new Error("More than thirty qualifications is beyond what this calculator models.");
  }

  const tables: Record<string, Record<string, number>> = {
    a_level: rules.ucas_tariff.a_level,
    as_level: rules.ucas_tariff.as_level,
    epq: rules.ucas_tariff.epq
  };

  const rows: UcasEntry[] = entries.map(e => {
    const table = tables[e.qualification];
    if (!table) {
      throw new Error(
        `"${e.qualification}" is not a qualification this calculator holds Tariff points for. It covers A levels, AS levels and the Extended Project.`
      );
    }
    const grade = String(e.grade ?? "").trim().toUpperCase();
    const points = table[grade];
    if (points === undefined) {
      throw new Error(
        `"${e.grade}" is not a grade for that qualification. Valid grades are ${Object.keys(table).join(", ")}.`
      );
    }
    return { qualification: e.qualification, grade, points };
  });

  const sum = (q: string) => rows.filter(r => r.qualification === q).reduce((a, r) => a + r.points, 0);
  const total = rows.reduce((a, r) => a + r.points, 0);

  // Express the total in the currency admissions tutors actually speak: how
  // many A levels at what grade it corresponds to.
  const aLevel = rules.ucas_tariff.a_level;
  const gradeOrder = ["A*", "A", "B", "C", "D", "E"];
  let equivalent = "";
  let remaining = total;
  const counts: Record<string, number> = {};
  for (const g of gradeOrder) {
    const value = aLevel[g];
    while (remaining >= value) {
      counts[g] = (counts[g] ?? 0) + 1;
      remaining -= value;
    }
  }
  equivalent = gradeOrder
    .filter(g => counts[g])
    .map(g => `${counts[g]}${g}`)
    .join(" ") || "less than one A level at grade E";
  if (remaining > 0 && equivalent !== "less than one A level at grade E") {
    equivalent += ` plus ${sig(remaining)} points`;
  }

  return {
    total_points: total,
    entries: rows,
    a_level_points: sum("a_level"),
    as_level_points: sum("as_level"),
    epq_points: sum("epq"),
    qualification_count: rows.length,
    equivalent_a_level_grades: equivalent
  };
}

// ===========================================================================
// EDU-004 University cost
// ===========================================================================

export interface UniversityCostResult {
  years: number;
  tuition_per_year: number;
  total_tuition: number;
  maintenance_loan_per_year: number;
  total_maintenance_loan: number;
  total_borrowed: number;
  living_costs_per_year: number;
  total_living_costs: number;
  shortfall_per_year: number;
  total_shortfall: number;
  maintenance_loan_max_for_circumstances: number;
  loan_covers_living_costs: boolean;
}

export function universityCost(
  years: number,
  tuitionPerYear: number,
  livingArrangement: "at_home" | "away_outside_london" | "away_in_london",
  maintenanceLoanPerYear: number | null,
  rentPerMonth: number,
  otherLivingPerMonth: number,
  monthsPerYear: number,
  rules: EducationRules
): UniversityCostResult {
  const n = assertFiniteNumber(years, "Course length");
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    throw new Error("The course length must be a whole number of years between 1 and 10.");
  }
  const tuition = assertFiniteNumber(tuitionPerYear, "Tuition fee");
  if (tuition < 0) throw new Error("The tuition fee cannot be negative.");

  const sf = rules.student_finance_england;
  if (tuition > sf.tuition_fee_loan_max) {
    throw new Error(
      `A publicly funded university in England cannot charge more than £${sf.tuition_fee_loan_max.toLocaleString()} a year for a standard full-time undergraduate course in ${sf.academic_year}. Check the figure, or note that this calculator covers England only.`
    );
  }

  const maxByArrangement =
    livingArrangement === "at_home" ? sf.maintenance_loan_max_living_at_home
      : livingArrangement === "away_in_london" ? sf.maintenance_loan_max_away_in_london
        : sf.maintenance_loan_max_away_outside_london;

  const loan = maintenanceLoanPerYear === null || maintenanceLoanPerYear === undefined
    ? maxByArrangement
    : assertFiniteNumber(maintenanceLoanPerYear, "Maintenance loan");
  if (loan < 0) throw new Error("The maintenance loan cannot be negative.");
  if (loan > maxByArrangement) {
    throw new Error(
      `The maximum maintenance loan for that living arrangement in ${sf.academic_year} is £${maxByArrangement.toLocaleString()}. Enter that or less.`
    );
  }

  const rent = assertFiniteNumber(rentPerMonth, "Rent");
  const other = assertFiniteNumber(otherLivingPerMonth, "Other living costs");
  if (rent < 0 || other < 0) throw new Error("Living costs cannot be negative.");
  const months = assertFiniteNumber(monthsPerYear, "Months a year");
  if (months <= 0 || months > 12) {
    throw new Error("The number of months a year must be above 0 and no more than 12.");
  }

  const livingPerYear = (rent + other) * months;
  const shortfall = livingPerYear - loan;

  return {
    years: n,
    tuition_per_year: r2(tuition),
    total_tuition: r2(tuition * n),
    maintenance_loan_per_year: r2(loan),
    total_maintenance_loan: r2(loan * n),
    total_borrowed: r2((tuition + loan) * n),
    living_costs_per_year: r2(livingPerYear),
    total_living_costs: r2(livingPerYear * n),
    shortfall_per_year: r2(shortfall),
    total_shortfall: r2(shortfall * n),
    maintenance_loan_max_for_circumstances: maxByArrangement,
    loan_covers_living_costs: shortfall <= 0
  };
}

// ===========================================================================
// EDU-005 Student budget
// ===========================================================================

export interface StudentBudgetResult {
  total_income_per_term: number;
  total_spending_per_term: number;
  surplus_per_term: number;
  weekly_budget: number;
  weekly_spending: number;
  weekly_surplus: number;
  rent_share_of_income_pct: number;
  weeks_money_lasts: number | null;
  runs_out: boolean;
}

export function studentBudget(
  maintenanceLoanPerTerm: number,
  otherIncomePerTerm: number,
  rentPerWeek: number,
  otherSpendingPerWeek: number,
  weeksInTerm: number
): StudentBudgetResult {
  const loan = assertFiniteNumber(maintenanceLoanPerTerm, "Loan instalment");
  const other = assertFiniteNumber(otherIncomePerTerm, "Other income");
  const rent = assertFiniteNumber(rentPerWeek, "Rent");
  const spending = assertFiniteNumber(otherSpendingPerWeek, "Other spending");
  const weeks = assertFiniteNumber(weeksInTerm, "Weeks in the term");

  if (loan < 0 || other < 0) throw new Error("Income cannot be negative.");
  if (rent < 0 || spending < 0) throw new Error("Spending cannot be negative.");
  if (weeks <= 0 || weeks > 52) {
    throw new Error("The number of weeks must be above 0 and no more than 52.");
  }

  const income = loan + other;
  const perWeekSpend = rent + spending;
  const termSpend = perWeekSpend * weeks;
  const surplus = income - termSpend;

  // How long the money actually lasts, which is the figure that matters when
  // a term's money arrives as one lump.
  const weeksLasting = perWeekSpend > 0 ? income / perWeekSpend : null;

  return {
    total_income_per_term: r2(income),
    total_spending_per_term: r2(termSpend),
    surplus_per_term: r2(surplus),
    weekly_budget: r2(income / weeks),
    weekly_spending: r2(perWeekSpend),
    weekly_surplus: r2(income / weeks - perWeekSpend),
    rent_share_of_income_pct: income > 0 ? sig(((rent * weeks) / income) * 100) : 0,
    weeks_money_lasts: weeksLasting === null ? null : sig(weeksLasting),
    runs_out: weeksLasting !== null && weeksLasting < weeks
  };
}

// ===========================================================================
// EVE-001 Tip calculator
// ===========================================================================

export interface TipResult {
  bill: number;
  service_charge: number;
  tip: number;
  total: number;
  per_person: number;
  tip_per_person: number;
  rounded_total: number;
  rounding_adjustment: number;
  service_already_included: boolean;
  effective_tip_pct: number;
}

export function tip(
  bill: number,
  tipPct: number,
  serviceChargePct: number,
  people: number,
  roundTo: number
): TipResult {
  const amount = assertFiniteNumber(bill, "Bill");
  if (amount < 0) throw new Error("The bill cannot be negative.");
  const pct = assertFiniteNumber(tipPct, "Tip");
  if (pct < 0 || pct > 100) throw new Error("The tip must be between 0 and 100 per cent.");
  const servicePct = assertFiniteNumber(serviceChargePct, "Service charge");
  if (servicePct < 0 || servicePct > 100) {
    throw new Error("The service charge must be between 0 and 100 per cent.");
  }
  const n = assertFiniteNumber(people, "People");
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("The number of people must be a whole number of at least one.");
  }
  if (n > 1000) throw new Error("More than a thousand people is beyond what this calculator models.");
  const rounding = assertFiniteNumber(roundTo, "Round to");
  if (rounding < 0) throw new Error("The rounding step cannot be negative.");

  const service = (amount * servicePct) / 100;
  // The tip is calculated on the BILL, not on the bill plus the service
  // charge. Tipping on top of a service charge already added is paying twice
  // for the same thing.
  const tipAmount = (amount * pct) / 100;
  const total = amount + service + tipAmount;

  const rounded = rounding > 0 ? Math.ceil(total / rounding) * rounding : total;

  return {
    bill: r2(amount),
    service_charge: r2(service),
    tip: r2(tipAmount),
    total: r2(total),
    per_person: r2(rounded / n),
    tip_per_person: r2((service + tipAmount) / n),
    rounded_total: r2(rounded),
    rounding_adjustment: r2(rounded - total),
    service_already_included: servicePct > 0,
    effective_tip_pct: amount > 0 ? sig(((service + tipAmount) / amount) * 100) : 0
  };
}

// ===========================================================================
// EVE-003 Tyre size
// ===========================================================================

export interface TyreResult {
  width_mm: number;
  aspect_ratio: number;
  rim_inches: number;
  sidewall_height_mm: number;
  overall_diameter_mm: number;
  overall_diameter_inches: number;
  circumference_mm: number;
  revolutions_per_km: number;
  /** Difference against a reference tyre, if one was given. */
  diameter_difference_pct: number | null;
  speedometer_reading_at_true_70: number | null;
  within_recommended_tolerance: boolean | null;
}

/**
 * Tyre dimensions from the standard sidewall marking.
 *
 * A marking like 225/45R17 mixes units: the width is MILLIMETRES, the aspect
 * ratio is a PERCENTAGE of that width, and the rim is INCHES. Anyone reading
 * it as three numbers in one unit gets the diameter badly wrong.
 */
export function tyreSize(
  widthMm: number,
  aspectRatio: number,
  rimInches: number,
  referenceWidth: number | null,
  referenceAspect: number | null,
  referenceRim: number | null
): TyreResult {
  const width = assertFiniteNumber(widthMm, "Tyre width");
  const aspect = assertFiniteNumber(aspectRatio, "Aspect ratio");
  const rim = assertFiniteNumber(rimInches, "Rim diameter");

  if (width < 100 || width > 500) {
    throw new Error("The tyre width must be between 100 and 500 mm. It is the first number on the sidewall, in millimetres.");
  }
  if (aspect < 20 || aspect > 100) {
    throw new Error("The aspect ratio must be between 20 and 100. It is the second number on the sidewall, a percentage of the width.");
  }
  if (rim < 8 || rim > 30) {
    throw new Error("The rim diameter must be between 8 and 30 inches. It is the number after the R on the sidewall, in inches.");
  }

  const MM_PER_INCH = 25.4;
  const sidewall = (width * aspect) / 100;
  const diameter = rim * MM_PER_INCH + 2 * sidewall;
  const circumference = Math.PI * diameter;
  const revsPerKm = 1000000 / circumference;

  let diffPct: number | null = null;
  let speedoAt70: number | null = null;
  let withinTolerance: boolean | null = null;

  if (referenceWidth !== null && referenceAspect !== null && referenceRim !== null) {
    const refSidewall = (referenceWidth * referenceAspect) / 100;
    const refDiameter = referenceRim * MM_PER_INCH + 2 * refSidewall;
    diffPct = ((diameter - refDiameter) / refDiameter) * 100;
    // A larger tyre travels further per revolution, so the speedometer, which
    // counts revolutions, reads LOW.
    speedoAt70 = 70 * (refDiameter / diameter);
    // The usual guidance is to stay within about three per cent of the
    // original rolling diameter.
    withinTolerance = Math.abs(diffPct) <= 3;
  }

  return {
    width_mm: sig(width),
    aspect_ratio: sig(aspect),
    rim_inches: sig(rim),
    sidewall_height_mm: sig(sidewall),
    overall_diameter_mm: sig(diameter),
    overall_diameter_inches: sig(diameter / MM_PER_INCH),
    circumference_mm: sig(circumference),
    revolutions_per_km: sig(revsPerKm),
    diameter_difference_pct: diffPct === null ? null : sig(diffPct),
    speedometer_reading_at_true_70: speedoAt70 === null ? null : sig(speedoAt70),
    within_recommended_tolerance: withinTolerance
  };
}
