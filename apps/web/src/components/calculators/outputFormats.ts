/**
 * Central output formatting registry.
 *
 * One place decides how every calculator result is presented, so no calculator
 * grows its own ad-hoc formatting. Pure data and pure functions - no React - so
 * the E2E parity harness can import the same rules it needs to invert when
 * reading a rendered value back into a number.
 *
 * Classification is per calculator AND per key, never by key name alone,
 * because the same name means different things in different calculators:
 * `margin` is a ratio in BUS-001 but an absolute confidence-interval width in
 * STA-006, and `rate` is a percentage in TAX-015 but an FX multiplier in
 * CON-010.
 */

export type OutputFormat =
  /** £ with comma grouping and 2 decimal places. */
  | "currency"
  /** A decimal fraction shown as a percentage: 0.917 -> 91.7%. */
  | "percent"
  /** Already expressed in percentage units: 25 -> 25%. */
  | "percentValue"
  /** A whole count: months, units, sample size. */
  | "count"
  /** A plain number that is neither money nor a percentage. */
  | "number"
  /** A ratio conventionally read as a multiple, e.g. ICR 1.5009. */
  | "ratio";

/**
 * Decimal fractions that should be shown to people as percentages.
 * Key: calculator id. Value: output keys.
 */
const PERCENT_OUTPUTS: Record<string, string[]> = {
  "BUS-001": ["margin", "markup"],
  "BUS-008": ["discount_rate"],
  "FIN-006": ["effective_apr"],
  "FIN-013": ["savings_rate"],
  "INV-002": ["effective_annual_rate"],
  "INV-008": ["roi"],
  "INV-009": ["cagr"],
  "INV-011": ["irr"],
  "INV-015": ["real_return"],
  "ISA-001": ["allowance_used"],
  "PEN-006": ["funding_ratio"],
  "PRO-001": ["ltv"],
  "PRO-010": ["ltv"],
  "PRO-011": ["ltv"],
  "PRO-016": ["gross_yield", "net_yield"],
  "PRO-018": ["gross_yield", "net_yield"],
  "PRO-023": ["effective_rate"],
  "PRO-019": ["annualised_return", "total_return"],
  // --- Wave 2 ---
  "FIN-004": ["combined_ltv"],
  "FIN-008": ["dti_ratio", "front_end_ratio"],
  "PRO-009": ["percentage_increase", "payment_to_income_now", "payment_to_income_stressed"],
  "PRO-012": ["equity_percentage", "ltv"],
  "PRO-014": ["rent_to_income"],
  "PRO-017": ["gross_yield", "net_yield", "cash_on_cash_return"],
  "PRO-021": ["cash_on_cash_return"],
  "PRO-022": ["total_growth_percentage", "real_total_growth_percentage"],
  "PRO-024": ["effective_rate"],
  "PRO-025": ["effective_rate"],
  "PRO-026": ["effective_rate"],
  "PRO-027": ["effective_rate"],
  "INV-005": ["required_annual_rate"],
  "INV-010": ["arithmetic_mean", "geometric_mean", "cumulative_return", "difference"],
  "INV-012": ["xirr"],
  "INV-017": ["effective_annual_rate"],
  "INV-018": ["effective_annual_rate"],
  "INV-019": ["effective_annual_rate"],
  "INV-020": ["effective_annual_rate"],
  "INV-021": ["current_yield"],
  "INV-022": ["yield_on_cost", "final_yield_on_cost"],
  "INV-024": ["fee_drag_percentage", "net_annualised_return"],
  // --- Wave 2 tranche 2D: ISA & tax wrappers ---
  "ISA-003": ["isa_advantage_percentage"],
  // --- Wave 2 tranche 2E: UK Tax & Salary ---
  // `cost_per_pound_in_pension` is the share of each pound reaching the
  // pension that actually comes out of take-home pay, so a percentage is the
  // honest reading: 60% means 60p of every pound is your own money.
  "TAX-005": ["cost_per_pound_in_pension"],
  "TAX-008": ["overtime_share_of_pay"],
  "TAX-009": ["effective_rate_on_bonus"],
  "TAX-011": ["effective_rate_on_dividends"],
  "TAX-012": ["effective_rate_on_gain"],
  "TAX-014": ["rate_applied", "effective_rate_on_estate"],
  "TAX-016": ["effective_rate"],
  "TAX-017": ["effective_rate", "profit_margin"],
  "TAX-018": ["effective_rate", "marginal_rate_on_next_pound"],
  // --- Wave 2 tranche 2F: Pensions & Retirement ---
  "PEN-004": ["contribution_as_share_of_salary"],
  "PEN-005": ["relief_rate"],
  "PEN-007": ["effective_tax_rate"],
  "PEN-010": ["proportion_of_full"],
  // --- Wave 2 tranche 2G: Business & Commercial ---
  "BUS-002": ["markup", "margin"],
  "BUS-003": ["gross_margin", "operating_margin", "net_margin"],
  "BUS-004": ["gross_margin", "markup_on_cost"],
  "BUS-005": ["gross_margin", "operating_margin", "net_margin"],
  "BUS-007": ["effective_commission_rate"],
  "BUS-011": ["markup_on_cost", "margin_after_discount"],
  "BUS-012": ["simple_roi", "annualised_roi", "internal_rate_of_return"],
  // --- Wave 2 tranche 2H: Statistics & Data ---
  // Conversion rates and lifts read as percentages; test statistics, p-values
  // and effect sizes are conventionally written as decimals in statistics and
  // are deliberately NOT converted.
  "STA-019": [
    "control_rate", "variant_rate", "absolute_difference", "relative_lift",
    "confidence_interval_lower", "confidence_interval_upper"
  ],
  // --- Wave 2 tranche 2I: Maths & Algebra ---
  "MAT-004": ["effective_single_discount", "sum_of_discounts_would_have_been"],
  // --- Wave 2 tranche 2K ---
  // Macronutrient shares are stored as decimal fractions and read as
  // percentages; body fat and lean mass are already in percentage units and
  // are deliberately NOT listed here.
  "HLT-009": ["protein_percentage", "carbohydrate_percentage", "fat_percentage"],
  "HLT-010": ["protein_percentage", "carbohydrate_percentage", "fat_percentage"],
  "HLT-011": ["protein_percentage", "carbohydrate_percentage", "fat_percentage"],
  "HLT-012": ["protein_percentage", "carbohydrate_percentage", "fat_percentage"]
};

/** Values already carried in percentage units. */
const PERCENT_VALUE_OUTPUTS: Record<string, string[]> = {
  "MAT-003": ["result_percent"],
  // A percentile and a percent error are already carried in percentage units.
  "STA-005": ["percentile"],
  "STA-020": ["percent_error", "signed_percent_error"],
  // --- Wave 2 tranche 2M: Automotive & Travel ---
  "AUT-010": ["charge_needed_pct"],
  "AUT-011": ["percentage_retained", "implied_annual_rate_pct"],
  // --- Wave 2 tranche 2N: Science & Engineering ---
  "SCI-002": ["voltage_drop_pct", "permitted_pct"],
  "SCI-003": ["standing_charge_share_pct"],
  "SCI-004": ["tolerance_pct"],
  "SCI-008": ["relative_humidity"],
  "SCI-010": ["relative_humidity"],
  // --- Wave 2 tranche 2O: Home & Construction ---
  "HOM-001": ["wastage_pct"],
  "HOM-003": ["wastage_pct"],
  // --- Wave 2 tranche 2Q: Technology & Digital ---
  "TEC-002": ["overhead_pct"],
  "TEC-003": ["size_change_pct"],
  // --- Wave 2 tranche 2R: Education and Everyday & Lifestyle ---
  "EDU-005": ["rent_share_of_income_pct"],
  "EVE-001": ["effective_tip_pct"],
  "EVE-003": ["diameter_difference_pct"]
};

/** Ratios read as a multiple rather than a percentage. */
const RATIO_OUTPUTS: Record<string, string[]> = {
  "PRO-018": ["icr"]
};

/** Whole counts. */
const COUNT_OUTPUTS: Record<string, string[]> = {
  "BUS-006": ["break_even_units"],
  "DAT-001": ["years", "months", "days", "total_days"],
  "FIN-009": ["months"],
  "FIN-011": ["months"],
  "PRO-004": ["payoff_months", "months_saved"],
  "STA-008": ["n"],
  // --- Wave 2 ---
  "FIN-007": ["payoff_months"],
  "FIN-010": ["months"],
  "FIN-012": ["current_payoff_months"],
  "FIN-014": ["months_to_target"],
  "PRO-005": ["original_payoff_months", "new_payoff_months", "months_saved"],
  "PRO-006": ["break_even_months"],
  "PRO-015": ["breakeven_year"],
  // --- Wave 2 tranche 2D/2E ---
  "ISA-003": ["years_dividend_allowance_exceeded"],
  "ISA-005": ["years_to_maturity"],
  "PEN-008": ["years_pot_lasts"],
  "PEN-009": ["years_to_recover_purchase_price"],
  "PEN-010": ["qualifying_years", "years_short_of_full", "projected_qualifying_years"],
  "BUS-010": ["lowest_balance_period", "periods_negative"],
  // --- Wave 2 tranche 2H ---
  "STA-002": ["count"],
  "STA-004": ["count"],
  "STA-010": ["required_sample_size_per_group"],
  "STA-009": ["sample_size_for_half_the_margin"],
  "STA-012": [
    "permutations", "combinations", "permutations_with_repetition",
    "combinations_with_repetition", "factorial_n"
  ],
  "STA-013": ["n", "degrees_of_freedom"],
  "STA-017": ["degrees_of_freedom", "total_observations"],
  "STA-018": ["groups", "total_observations", "between_groups_df", "within_groups_df"],
  "STA-019": ["required_sample_per_group_for_this_lift"],
  // --- Wave 2 tranche 2I: Maths & Algebra ---
  "MAT-011": ["exponent", "engineering_exponent", "order_of_magnitude"],
  "MAT-014": ["number_of_divisors", "sum_of_divisors", "eulers_totient"],
  "MAT-015": ["factor_count", "sum_of_proper_divisors", "largest_proper_factor"],
  "MAT-016": ["greatest_common_factor", "least_common_multiple", "gcf_times_lcm", "product_of_all"],
  "MAT-017": ["greatest_common_factor", "least_common_multiple", "product_of_all"],
  "MAT-018": ["quotient", "remainder"],
  "MAT-021": ["rows", "columns"],
  "MAT-022": ["decimal_result", "bit_length"],
  "MAT-023": ["decimal_result", "bit_length"],
  // --- Wave 2 tranche 2J: Geometry ---
  "GEO-009": ["rooms_counted", "packs_needed"],
  // --- Wave 2 tranche 2K: Health & Fitness ---
  // NOTE: HLT-003's activity_factor is NOT a count. It is 1.375 for a lightly
  // active person, and classifying it as a whole number displayed "1" to the
  // user. It belongs in the plain-number list below.
  "HLT-019": ["gestational_age_weeks", "gestational_age_days", "trimester", "days_remaining", "cycle_length_used"],
  "HLT-020": ["gestational_age_weeks", "gestational_age_days", "trimester", "days_remaining", "cycle_length_used"],
  "HLT-022": ["fertile_days", "cycle_length_used", "luteal_phase_used"],
  "HLT-023": ["days_until_next", "cycle_length_used", "period_length_used"],
  "HLT-025": ["cycle_length_minutes", "options_meeting_recommendation", "recommended_hours_lower", "recommended_hours_upper"],
  "HLT-009": ["fibre_grams_recommended"],
  "HLT-010": ["fibre_grams_recommended"],
  "HLT-011": ["fibre_grams_recommended"],
  "HLT-012": ["fibre_grams_recommended"],
  "HLT-007": ["overweight_threshold", "obese_threshold"],
  // --- Wave 2 tranche 2L: Date & Time ---
  "DAT-002": ["years_added", "months_added", "days_added"],
  "DAT-003": [
    "total_days", "days_between_exclusive", "weeks", "remaining_days",
    "weekdays", "weekend_days", "working_days", "bank_holidays_in_range"
  ],
  "DAT-004": [
    "day_of_year", "week_of_year", "quarter", "days_in_month", "days_remaining_in_year"
  ],
  "DAT-005": ["days_carried", "total_seconds"],
  "DAT-006": ["hours", "minutes", "seconds", "total_seconds"],
  "DAT-007": ["days_worked", "total_break_minutes"],
  "DAT-008": ["source_offset_minutes", "target_offset_minutes"],
  "DAT-009": ["days_worked", "total_break_minutes"],
  // --- Wave 2 tranche 2M: Automotive & Travel ---
  // Mileage figures are counts of miles, not sums of money, even inside
  // calculators whose other outputs are all money.
  "AUT-002": [
    "initial_rental_months", "number_of_monthly_rentals",
    "contracted_miles", "projected_excess_miles"
  ],
  "AUT-003": ["contracted_miles", "projected_excess_miles"],
  "AUT-004": ["months_until_one_third_paid", "months_until_half_paid"],
  "AUT-008": ["business_miles", "miles_at_higher_rate", "miles_at_lower_rate"],
  "AUT-011": ["years"],
  "AUT-012": ["rpm"],
  // --- Wave 2 tranche 2N: Science & Engineering ---
  "SCI-004": ["count"],
  "SCI-007": ["distinct_elements", "total_atoms"],
  // Wave 2 tranche 2R note: the EDU- and EVE- families are NOT money-prefixed,
  // so their marks, points and physical dimensions already fall to the
  // plain-number default and need no entry here. Their genuine money outputs
  // are named individually in MONEY_OUTPUTS instead, which is the safe way
  // round: a missed entry there shows an amount as a bare number rather than
  // showing a tyre diameter as a price.
  // --- Wave 2 tranche 2O: Home & Construction ---
  // Quantities to order are whole things: you cannot buy 8.4 bags.
  "HOM-001": ["cement_bags_25kg", "ready_mix_loads"],
  "HOM-002": ["tiles_needed", "underlay_rolls"],
  "HOM-003": ["tiles_needed", "tiles_with_wastage", "boxes_needed"],
  "HOM-004": ["bags_needed", "bulk_bags_needed"],
  "HOM-005": ["bags_needed", "bulk_bags_needed"],
  "HOM-006": ["number_of_risers", "number_of_treads", "failed_checks"],
  // --- Wave 2 tranche 2P: Conversions ---
  // CON-010 (Wave 1) is an FX calculator whose outputs are money. The Wave 2
  // converters are physical, so nothing here is currency and the plain-number
  // default is correct for all of them; only genuine counts are named.
  "CON-009": [],
  // --- Wave 2 tranche 2Q: Technology & Digital ---
  "TEC-001": ["total_addresses", "usable_hosts"],
  "TEC-002": ["transfer_hours", "transfer_minutes"],
  "TEC-003": ["input_length", "output_length", "padding_characters"],
  "TEC-004": ["input_length", "output_length", "characters_changed"],
  "TEC-005": ["character_set_size", "length"],
  // --- Wave 2 tranche 2R: Education and Everyday & Lifestyle ---
  "EDU-003": ["total_points", "a_level_points", "as_level_points", "epq_points", "qualification_count"],
  "EDU-004": ["years"]
};

/**
 * Numeric outputs inside otherwise money-oriented calculators that are NOT
 * money - working assumptions, physical quantities and the like.
 */
const NON_MONEY_OUTPUTS: Record<string, string[]> = {
  "AUT-006": ["litres"],
  "CON-010": ["converted"],
  "TAX-002": ["hours_per_week_used", "paid_weeks_per_year_used"],
  "TAX-003": ["hours_per_week_used", "paid_weeks_per_year_used"],
  // --- Wave 2 ---
  "FIN-014": ["months_covered_now"],
  "INV-010": ["years"],
  "INV-013": ["payback_years", "discounted_payback_years"],
  "INV-023": ["final_shares"],
  // --- Wave 2 tranche 2E: working patterns and company facts are not money ---
  "TAX-006": ["annual_hours", "hours_per_week_used", "paid_weeks_per_year_used"],
  "TAX-007": ["annual_hours", "hours_per_week_used", "paid_weeks_per_year_used"],
  "TAX-008": ["total_hours"],
  "TAX-018": ["associated_companies", "accounting_period_months"],
  // Payback and unit counts are durations and quantities, not money.
  "BUS-011": ["break_even_units"],
  "BUS-012": ["simple_payback_years", "discounted_payback_years", "profitability_index"],
  // --- Wave 2 tranche 2K: quantities that are neither money nor whole ---
  "HLT-003": ["activity_factor"],
  "HLT-005": ["body_fat_percentage", "fat_mass_kg", "lean_mass_kg", "bmi_estimate"],
  "HLT-006": ["lean_body_mass_kg", "fat_mass_kg", "lean_mass_percentage", "boer_estimate", "james_estimate"],
  "HLT-007": ["bmi", "healthy_weight_lower_kg", "healthy_weight_upper_kg", "weight_to_lose_kg", "weight_to_gain_kg"],
  "HLT-008": [
    "healthy_range_lower_kg", "healthy_range_upper_kg", "robinson_formula",
    "miller_formula", "devine_formula", "hamwi_formula", "formulas_disagree_by_kg"
  ],
  "HLT-013": ["equivalent_kg_of_fat"],
  "HLT-015": ["one_rep_max", "epley", "brzycki", "lombardi", "lowest_estimate", "highest_estimate"],
  "HLT-017": ["body_surface_area", "mosteller", "du_bois", "haycock", "boyd", "formulas_disagree_by"],
  // --- Wave 2 tranche 2L: hours and offsets are quantities, not money ---
  "DAT-003": ["months_approx", "years_approx"],
  "DAT-006": ["total_hours", "total_minutes", "decimal_hours"],
  "DAT-007": ["total_hours", "total_minutes", "regular_hours", "overtime_hours", "average_hours_per_day"],
  "DAT-008": ["difference_hours"],
  "DAT-009": ["total_hours", "regular_hours", "overtime_hours", "average_hours_per_day"],
  // --- Wave 2 tranche 2M: Automotive & Travel ---
  // The AUT- family defaults to money, so every physical quantity in it has to
  // be named here. A range in miles or an economy in mpg rendered as "£194.56"
  // would be absurd, and the default is deliberately the safe way round: an
  // unclassified financial figure reads as money rather than a bare number.
  "AUT-007": [
    "mpg_imperial", "mpg_us", "litres_per_100km", "km_per_litre",
    "miles_per_litre", "fuel_used_litres", "distance_miles",
    // Pence a mile: a plain number beside a label that says pence.
    "cost_per_mile_pence"
  ],
  "AUT-009": [
    "energy_into_battery_kwh", "energy_drawn_from_supply_kwh",
    "charging_losses_kwh", "miles_added", "charging_hours",
    "cost_per_kwh_into_battery_pence", "cost_per_mile_pence",
    "petrol_cost_per_mile_pence", "saving_per_mile_pence"
  ],
  "AUT-010": [
    "usable_battery_kwh", "effective_consumption_mi_per_kwh",
    "range_from_full", "range_at_current_charge", "range_to_reserve",
    "practical_range_to_80_pct", "energy_needed_for_journey"
  ],
  "AUT-011": ["depreciation_per_mile_pence"],
  "AUT-012": [
    "horsepower_bhp", "kilowatts", "metric_horsepower_ps",
    "torque_lb_ft", "torque_nm"
  ]
};

/**
 * Calculator families whose unclassified numeric outputs are money.
 * Everything else defaults to a plain number.
 */
const MONEY_PREFIXES = ["FIN-", "PRO-", "TAX-", "INV-", "ISA-", "PEN-", "BUS-", "AUT-"];

/**
 * Individual money outputs inside calculators that are not money-oriented as a
 * family. GEO-009 is a geometry calculator, but the cost of the materials it
 * works out really is a price and should read as one.
 */
const MONEY_OUTPUTS: Record<string, string[]> = {
  "GEO-009": ["total_cost"],
  // A timesheet is a date calculator, but the pay it works out really is pay.
  "DAT-009": ["regular_pay", "overtime_pay", "total_pay"],
  // --- Wave 2 tranche 2N: Science & Engineering ---
  // The SCI- family is physical rather than financial, so its handful of money
  // outputs are named individually rather than defaulted.
  "SCI-003": [
    "energy_cost", "standing_charge_cost", "total_cost",
    "cost_per_day", "cost_per_use", "cost_per_year"
  ],
  // --- Wave 2 tranche 2R: Education and Everyday & Lifestyle ---
  "EDU-004": [
    "total_tuition", "total_maintenance_loan", "total_borrowed",
    "living_costs_per_year", "total_living_costs",
    "shortfall_per_year", "total_shortfall",
    "maintenance_loan_per_year", "maintenance_loan_max_for_circumstances"
  ],
  "EDU-005": [
    "total_income_per_term", "total_spending_per_term", "surplus_per_term",
    "weekly_budget", "weekly_spending", "weekly_surplus"
  ],
  "EVE-001": [
    "bill", "service_charge", "tip", "total", "rounded_total",
    "rounding_adjustment", "per_person", "tip_per_person"
  ]
};

function listed(map: Record<string, string[]>, calculatorId: string, key: string): boolean {
  return (map[calculatorId] ?? []).includes(key);
}

export function classifyOutput(calculatorId: string, key: string): OutputFormat {
  if (listed(MONEY_OUTPUTS, calculatorId, key)) return "currency";
  if (listed(PERCENT_OUTPUTS, calculatorId, key)) return "percent";
  if (listed(PERCENT_VALUE_OUTPUTS, calculatorId, key)) return "percentValue";
  if (listed(RATIO_OUTPUTS, calculatorId, key)) return "ratio";
  if (listed(COUNT_OUTPUTS, calculatorId, key)) return "count";
  if (listed(NON_MONEY_OUTPUTS, calculatorId, key)) return "number";
  if (MONEY_PREFIXES.some(p => calculatorId.startsWith(p))) return "currency";
  return "number";
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const plain = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 8 });
const twoDp = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const integer = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});
const ratioFmt = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
});

/**
 * Format one output value for display.
 *
 * Non-finite numbers never reach the screen as "NaN" or "Infinity"; they are
 * rendered as an em dash, because a broken number is not a result.
 */
export function formatOutputValue(calculatorId: string, key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value !== "number") {
    const text = String(value);
    return text === "[object Object]" ? "—" : text;
  }
  if (!Number.isFinite(value)) return "—";

  switch (classifyOutput(calculatorId, key)) {
    case "currency":
      return gbp.format(value);
    case "percent":
      // Round the scaled value so 0.917 reads 91.7%, not 91.70000000000001%.
      return `${pct.format(Math.round(value * 100 * 1e6) / 1e6)}%`;
    case "percentValue":
      return `${pct.format(value)}%`;
    case "count":
      return integer.format(value);
    case "ratio":
      return ratioFmt.format(value);
    case "number":
      return key === "converted" ? twoDp.format(value) : plain.format(value);
  }
}

/**
 * Invert the display transform to recover the engine-domain number from a
 * rendered string. Used by the E2E parity harness so it compares like with
 * like instead of re-implementing the formatting rules.
 */
export function parseDisplayedValue(
  calculatorId: string,
  key: string,
  text: string
): number {
  const negative = text.includes("-") || (text.includes("(") && text.includes(")"));
  const digits = text.replace(/[^0-9.]/g, "");
  let n = parseFloat(digits);
  if (negative) n = -n;
  return classifyOutput(calculatorId, key) === "percent" ? n / 100 : n;
}
