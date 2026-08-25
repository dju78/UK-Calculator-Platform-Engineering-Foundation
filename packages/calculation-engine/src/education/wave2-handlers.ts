import type { NumericInputs, CalculationContext, CalculatorHandler } from "../types.js";
import { resolveRules } from "../../../rules-uk/src/index.js";
import {
  educationFrom, gradeAverage, degreeClassification, ucasPoints,
  universityCost, studentBudget, tip, tyreSize
} from "./wave2.js";

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

function opt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : fallback;
}

/** Parse "name:score:weight, name:score:weight" or a JSON array. */
function parseComponents(raw: unknown, what: string) {
  if (Array.isArray(raw)) return raw as Array<{ name: string; score: number; weight: number }>;
  const text = String(raw ?? "").trim();
  if (text.startsWith("[")) {
    try {
      return JSON.parse(text) as Array<{ name: string; score: number; weight: number }>;
    } catch {
      throw new Error(`Could not read the list of ${what}. Check the punctuation.`);
    }
  }
  return text
    .split(/[;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(entry => {
      const parts = entry.split(":").map(p => p.trim());
      if (parts.length !== 3) {
        throw new Error(
          `Could not read "${entry}". Each ${what} needs a name, a mark and a weight, separated by colons, for example "Coursework:68:40".`
        );
      }
      const score = Number(parts[1]);
      const weight = Number(parts[2]);
      if (!Number.isFinite(score) || !Number.isFinite(weight)) {
        throw new Error(`The mark and weight in "${entry}" must both be numbers.`);
      }
      return { name: parts[0], score, weight };
    });
}

/** EDU-001 Grade Calculator */
export const edu001Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const edu = educationFrom(rulesFor(context));
  const components = parseComponents(inputs.assessments, "assessment");
  const b = edu.degree_classification_boundaries;
  const r = gradeAverage(components, [b.third, b.lower_second, b.upper_second, b.first]);

  const warnings: string[] = [];
  if (!r.weights_sum_to_100) {
    warnings.push(
      `The weights add up to ${r.total_weight} rather than 100, so this is your average across the assessments entered rather than a final mark. The remaining ${Math.round((100 - r.total_weight) * 100) / 100}% is still to come.`
    );
  }

  return {
    outputs: {
      weighted_average: r.weighted_average,
      total_weight: r.total_weight,
      weights_sum_to_100: r.weights_sum_to_100,
      best_component: r.best_component,
      worst_component: r.worst_component,
      next_boundary: r.next_boundary,
      points_from_next_boundary: r.points_from_next_boundary,
      basis:
        "WEIGHTS ARE NORMALISED BY THEIR OWN TOTAL rather than assumed to reach 100. If you have only sat half your assessments, this is your average SO FAR, not a mark deflated by the half you have not taken yet, and whether the weights reached 100 is reported so you can tell which you are looking at. " +
        "The contribution column shows what each assessment adds to the final figure, which is usually more useful than its raw mark: a 90 worth five per cent moves the average less than a 65 worth forty."
    },
    warnings,
    schedule: r.components
  };
};

/** EDU-002 UK Degree Classification */
export const edu002Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const edu = educationFrom(rulesFor(context));
  const raw = parseComponents(inputs.years, "year");
  const years = raw.map((y, i) => ({ year: Number(y.name) || i + 1, average: y.score, weight: y.weight }));
  const r = degreeClassification(years, edu);

  const warnings: string[] = [];
  if (r.in_borderline_zone) {
    warnings.push(
      `This average is within two marks of the ${r.borderline_of} boundary. Most universities look at the profile of individual module marks in that zone rather than the average alone, so the outcome is genuinely not decided by this figure. Ask your department how its borderline rule works.`
    );
  }

  return {
    outputs: {
      overall_average: r.overall_average,
      classification: r.classification,
      next_classification: r.next_classification,
      marks_from_next_classification: r.marks_from_next_classification,
      in_borderline_zone: r.in_borderline_zone,
      basis:
        "THIS IS AN ESTIMATE, NOT A CLASSIFICATION. The boundaries are conventional across UK universities, but the rules that decide a degree are not: institutions differ in how they weight each year, whether they discount the worst credits, whether the final year alone can lift a classification, and how they treat borderline cases. Those rules change the outcome far more often than the boundaries do. " +
        "YEAR WEIGHTINGS ARE YOURS TO ENTER because they vary widely: a common English pattern is nothing in the first year, then a quarter and three quarters, but plenty of universities use different splits and some weight all three years. Check your own programme regulations rather than assuming. " +
        "Only the awarding university can classify a degree, and this calculator cannot see your module profile, your credit weightings or any mitigating circumstances.",
      schedule_note: "Each year's contribution to the overall average."
    },
    warnings,
    schedule: r.years
  };
};

/** EDU-003 UCAS Points Calculator */
export const edu003Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const edu = educationFrom(rulesFor(context));
  const raw = String(inputs.qualifications ?? "").trim();

  let entries: Array<{ qualification: string; grade: string }>;
  if (raw.startsWith("[")) {
    try {
      entries = JSON.parse(raw);
    } catch {
      throw new Error("Could not read the list of qualifications. Check the punctuation.");
    }
  } else {
    entries = raw
      .split(/[;,\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(entry => {
        const parts = entry.split(":").map(p => p.trim());
        if (parts.length !== 2) {
          throw new Error(
            `Could not read "${entry}". Each qualification needs a type and a grade separated by a colon, for example "a_level:A" or "epq:B".`
          );
        }
        return { qualification: parts[0], grade: parts[1] };
      });
  }

  const r = ucasPoints(entries, edu);
  const warnings: string[] = [];
  if (r.as_level_points > 0 && r.a_level_points > 0) {
    warnings.push(
      "You have entered both AS levels and A levels. Points cannot be claimed for both an AS and the full A level IN THE SAME SUBJECT, so check that none of these overlap; it is the commonest reason a self-calculated total comes out too high."
    );
  }

  return {
    outputs: {
      total_points: r.total_points,
      a_level_points: r.a_level_points,
      as_level_points: r.as_level_points,
      epq_points: r.epq_points,
      qualification_count: r.qualification_count,
      equivalent_a_level_grades: r.equivalent_a_level_grades,
      basis:
        "POINTS CANNOT BE CLAIMED FOR BOTH AN AS AND THE FULL A LEVEL IN THE SAME SUBJECT. That single rule is the commonest reason a self-calculated total is too high, and it is why the AS and A level totals are shown separately here. " +
        "MANY COURSES DO NOT USE THE TARIFF AT ALL. A large share of the most selective universities make offers in GRADES rather than points, because AAB and BBB+EPQ can reach a similar total while meaning quite different things, and some subjects require specific grades in specific subjects that no total can express. Check each course's own entry requirements rather than treating a total as an offer. " +
        "The A level equivalent is shown because that is the currency admissions conversations are actually held in."
    },
    warnings,
    schedule: r.entries
  };
};

/** EDU-004 UK University Cost Calculator */
export const edu004Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const edu = educationFrom(rulesFor(context));
  const arrangementRaw = str(inputs.living_arrangement, "away_outside_london");
  const arrangement = (["at_home", "away_outside_london", "away_in_london"].includes(arrangementRaw)
    ? arrangementRaw
    : "away_outside_london") as "at_home" | "away_outside_london" | "away_in_london";

  const r = universityCost(
    Number(inputs.years ?? 3),
    Number(inputs.tuition_per_year ?? edu.student_finance_england.tuition_fee_loan_max),
    arrangement,
    opt(inputs.maintenance_loan),
    Number(inputs.rent_per_month ?? 0),
    Number(inputs.other_living_per_month ?? 0),
    Number(inputs.months_per_year ?? 9),
    edu
  );

  const warnings: string[] = [];
  if (!r.loan_covers_living_costs) {
    warnings.push(
      `The maintenance loan falls short of your living costs by about £${Math.round(r.shortfall_per_year).toLocaleString()} a year, or £${Math.round(r.total_shortfall).toLocaleString()} over the course. That gap has to come from work, savings or family, and it is the figure most worth planning around.`
    );
  }

  const sf = edu.student_finance_england;
  return {
    outputs: {
      total_tuition: r.total_tuition,
      total_maintenance_loan: r.total_maintenance_loan,
      total_borrowed: r.total_borrowed,
      living_costs_per_year: r.living_costs_per_year,
      total_living_costs: r.total_living_costs,
      shortfall_per_year: r.shortfall_per_year,
      total_shortfall: r.total_shortfall,
      maintenance_loan_per_year: r.maintenance_loan_per_year,
      maintenance_loan_max_for_circumstances: r.maintenance_loan_max_for_circumstances,
      basis:
        `THE MAINTENANCE LOAN IS MEANS TESTED, so the maximum is not an entitlement. For ${sf.academic_year} the England maxima are £${sf.maintenance_loan_max_living_at_home.toLocaleString()} living at home, £${sf.maintenance_loan_max_away_outside_london.toLocaleString()} living away outside London and £${sf.maintenance_loan_max_away_in_london.toLocaleString()} living away in London, and most students receive less once household income is taken into account. Enter your own figure from your award letter rather than assuming the maximum. ` +
        "THIS IS ENGLAND. Student finance is devolved and Scotland, Wales and Northern Ireland differ substantially in both fees and support; Scottish students studying in Scotland typically pay no tuition fee at all. " +
        "THE TOTAL BORROWED IS NOT WHAT YOU REPAY. A student loan is repaid as a percentage of income above a threshold and is written off after a set period, so many graduates repay considerably more than they borrowed and many repay considerably less. It behaves far more like a graduate contribution than like a commercial debt, and the balance shown here is not a useful guide to what it will cost you."
    },
    warnings
  };
};

/** EDU-005 Student Budget Calculator */
export const edu005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = studentBudget(
    Number(inputs.loan_per_term ?? 0),
    Number(inputs.other_income_per_term ?? 0),
    Number(inputs.rent_per_week ?? 0),
    Number(inputs.other_spending_per_week ?? 0),
    Number(inputs.weeks_in_term ?? 13)
  );

  const warnings: string[] = [];
  if (r.runs_out && r.weeks_money_lasts !== null) {
    warnings.push(
      `At this rate the money runs out after about ${Math.floor(r.weeks_money_lasts)} weeks of a ${inputs.weeks_in_term} week term. The instalment arrives as one lump, which makes this easy to miss until it happens.`
    );
  }
  if (r.rent_share_of_income_pct > 60) {
    warnings.push(
      `Rent is taking about ${Math.round(r.rent_share_of_income_pct)}% of your income for the term, which leaves very little for everything else.`
    );
  }

  return {
    outputs: {
      total_income_per_term: r.total_income_per_term,
      total_spending_per_term: r.total_spending_per_term,
      surplus_per_term: r.surplus_per_term,
      weekly_budget: r.weekly_budget,
      weekly_spending: r.weekly_spending,
      weekly_surplus: r.weekly_surplus,
      rent_share_of_income_pct: r.rent_share_of_income_pct,
      weeks_money_lasts: r.weeks_money_lasts,
      runs_out: r.runs_out,
      basis:
        "THE WEEKS THE MONEY LASTS IS THE FIGURE THAT MATTERS, more than the term surplus. A maintenance instalment arrives as a single lump at the start of term, which makes overspending painless for the first month and unrecoverable by the last, and a budget that balances over a term can still run dry in week nine. " +
        "RENT AS A SHARE OF INCOME is worth watching for the same reason: it is fixed and it comes first, so a high share leaves everything else competing for what remains. Term-time work, a hardship fund or a discretionary grant are all worth asking your university about before the gap becomes urgent."
    },
    warnings
  };
};

/** EVE-001 Tip Calculator */
export const eve001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = tip(
    Number(inputs.bill ?? 0),
    Number(inputs.tip_pct ?? 0),
    Number(inputs.service_charge_pct ?? 0),
    Number(inputs.people ?? 1),
    Number(inputs.round_to ?? 0)
  );

  const warnings: string[] = [];
  if (r.service_already_included && (inputs.tip_pct as number) > 0) {
    warnings.push(
      `A service charge of ${inputs.service_charge_pct}% is already on this bill. Adding a further ${inputs.tip_pct}% tip takes the total service payment to about ${Math.round(r.effective_tip_pct * 10) / 10}% of the bill. That is entirely your choice, but it is worth seeing the combined figure rather than only the one you just added.`
    );
  }

  return {
    outputs: {
      bill: r.bill,
      service_charge: r.service_charge,
      tip: r.tip,
      total: r.total,
      rounded_total: r.rounded_total,
      rounding_adjustment: r.rounding_adjustment,
      per_person: r.per_person,
      tip_per_person: r.tip_per_person,
      effective_tip_pct: r.effective_tip_pct,
      basis:
        "THE TIP IS CALCULATED ON THE BILL, NOT ON THE BILL PLUS THE SERVICE CHARGE. Tipping on top of a service charge that has already been added is paying twice for the same thing, and the combined figure is shown as an effective percentage so you can see what you are actually giving. " +
        "In the UK a discretionary service charge can be REMOVED ON REQUEST, and since the Employment (Allocation of Tips) Act 2023 came into force employers must pass on tips and service charges to staff in full. Cash and card tips are treated the same way under that Act."
    },
    warnings
  };
};

/** EVE-003 Tyre Size Calculator */
export const eve003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = tyreSize(
    Number(inputs.width_mm ?? 0),
    Number(inputs.aspect_ratio ?? 0),
    Number(inputs.rim_inches ?? 0),
    opt(inputs.reference_width_mm),
    opt(inputs.reference_aspect_ratio),
    opt(inputs.reference_rim_inches)
  );

  const warnings: string[] = [];
  if (r.within_recommended_tolerance === false) {
    warnings.push(
      `This tyre is ${Math.round((r.diameter_difference_pct ?? 0) * 100) / 100}% different in rolling diameter from the reference. The usual guidance is to stay within about 3%: beyond that the speedometer reads noticeably wrong, and ABS, traction control and any distance-based systems are all calibrated against the original size.`
    );
  }

  return {
    outputs: {
      sidewall_height_mm: r.sidewall_height_mm,
      overall_diameter_mm: r.overall_diameter_mm,
      overall_diameter_inches: r.overall_diameter_inches,
      circumference_mm: r.circumference_mm,
      revolutions_per_km: r.revolutions_per_km,
      diameter_difference_pct: r.diameter_difference_pct,
      speedometer_reading_at_true_70: r.speedometer_reading_at_true_70,
      within_recommended_tolerance: r.within_recommended_tolerance,
      basis:
        "A TYRE MARKING MIXES THREE UNITS. In 225/45R17 the width is 225 MILLIMETRES, the 45 is a PERCENTAGE of that width giving the sidewall height, and the 17 is the rim in INCHES. Reading them as three numbers in one unit gets the overall diameter badly wrong, and the sidewall height is shown separately here because it is the part people most often assume is a direct measurement. " +
        "A CONSEQUENCE THAT SURPRISES PEOPLE: changing the aspect ratio changes the sidewall by a percentage OF THE WIDTH, so on a wide tyre a five point change moves the diameter more than it does on a narrow one. " +
        "A LARGER TYRE MAKES THE SPEEDOMETER READ LOW, because it counts wheel revolutions and each one now covers more ground. The reading shown is what the dial would say at a true 70 mph. Staying within about three per cent of the original rolling diameter is the usual guidance, because ABS, traction control, cruise control and the odometer are all calibrated against the original size. Check the vehicle handbook and the load and speed ratings as well as the dimensions."
    },
    warnings
  };
};
