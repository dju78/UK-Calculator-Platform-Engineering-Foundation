import type { NumericInputs, CalculationContext, CalculatorHandler } from "../types.js";
import { resolveRules } from "../../../rules-uk/src/index.js";
import {
  unitsFrom, carLoan, hirePurchase, pcp, carLease, compareOffers,
  fuelEconomy, businessMileage, evChargingCost, evRange,
  vehicleDepreciation, horsepower,
  type VehicleType
} from "./wave2.js";

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

/** Optional numeric input: blank means "not supplied", not zero. */
function opt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bool(value: unknown, fallback = false): boolean {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

const APR_NOTE =
  "APR is an annual effective rate, so the monthly rate is the twelfth root of one plus the APR rather than the APR divided by twelve. Using the divide-by-twelve shortcut understates the payment, which is why a quote reproduced that way comes out a little low.";

const NOT_ADVICE =
  "This is an illustration of the arithmetic in a quote, not a recommendation and not a credit decision. The lender's own figures govern, and only the lender's pre-contract information is binding.";

// ---------------------------------------------------------------------------

/** AUT-001 Car Loan */
export const aut001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const feeFinanced = bool(inputs.fee_financed, true);
  const r = carLoan(
    Number(inputs.vehicle_price ?? 0),
    Number(inputs.deposit ?? 0),
    Number(inputs.part_exchange ?? 0),
    Number(inputs.apr ?? 0),
    Number(inputs.term_months ?? 48),
    Number(inputs.fee ?? 0),
    feeFinanced
  );
  return {
    outputs: {
      amount_borrowed: r.amount_borrowed,
      monthly_payment: r.monthly_payment,
      total_repayable: r.total_repayable,
      total_interest: r.total_interest,
      total_cost_including_deposit: r.total_cost_including_deposit,
      monthly_payment_nominal_convention: r.monthly_payment_nominal_convention,
      basis:
        "An unsecured personal loan buys the car outright: it is YOURS FROM DAY ONE, there is no mileage limit, no condition charge at the end and nothing to hand back. That is the difference from hire purchase and from a PCP, and it is worth more than a small difference in the monthly figure. " +
        APR_NOTE + " " + NOT_ADVICE
    }
  };
};

/** AUT-002 Car Lease (personal contract hire) */
export const aut002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = carLease(
    opt(inputs.monthly_rental),
    Number(inputs.vehicle_price ?? 0),
    Number(inputs.residual_value ?? 0),
    Number(inputs.apr ?? 0),
    Number(inputs.term_months ?? 48),
    Number(inputs.initial_rental_months ?? 9),
    Number(inputs.documentation_fee ?? 0),
    Number(inputs.annual_mileage_allowance ?? 10000),
    Number(inputs.expected_annual_mileage ?? 10000),
    Number(inputs.excess_pence_per_mile ?? 0)
  );
  const warnings: string[] = [];
  if (r.projected_excess_miles > 0) {
    warnings.push(
      `On the mileage you expect to drive you would exceed the contracted allowance by ${r.projected_excess_miles.toLocaleString()} miles, costing about £${r.excess_mileage_charge.toLocaleString()} at the end. Excess mileage is charged whether or not you noticed it accruing.`
    );
  }
  return {
    outputs: {
      monthly_rental: r.monthly_rental,
      initial_rental: r.initial_rental,
      initial_rental_months: r.initial_rental_months,
      number_of_monthly_rentals: r.number_of_monthly_rentals,
      documentation_fee: r.documentation_fee,
      total_cost: r.total_cost,
      effective_monthly_cost: r.effective_monthly_cost,
      contracted_miles: r.contracted_miles,
      projected_excess_miles: r.projected_excess_miles,
      excess_mileage_charge: r.excess_mileage_charge,
      total_cost_with_excess: r.total_cost_with_excess,
      money_factor_monthly_rental: r.money_factor_monthly_rental,
      basis:
        "THE INITIAL RENTAL IS NOT A DEPOSIT. A '9+35' quote means nine monthly rentals paid up front and thirty-five afterwards, and that money is rent: it buys no equity, there is nothing to get back, and at the end you hand the car over. Leasing can still be the cheapest way to drive a new car, but it is renting, and the effective monthly cost shown here spreads the initial rental across the whole term so it can be compared with a PCP monthly on the same footing. " +
        (r.rental_was_derived
          ? "The rental shown is derived from the price and residual value as an annuity in advance, which is exact; the money-factor figure beside it is the dealer rule of thumb, and the gap between them is why the rule of thumb should not be used to check a quote. "
          : "") +
        NOT_ADVICE
    },
    warnings
  };
};

/** AUT-003 PCP Finance */
export const aut003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = pcp(
    Number(inputs.vehicle_price ?? 0),
    Number(inputs.deposit ?? 0),
    Number(inputs.dealer_contribution ?? 0),
    Number(inputs.apr ?? 0),
    Number(inputs.term_months ?? 36),
    Number(inputs.gmfv ?? 0),
    Number(inputs.option_fee ?? 0),
    Number(inputs.annual_mileage_allowance ?? 10000),
    Number(inputs.expected_annual_mileage ?? 10000),
    Number(inputs.excess_pence_per_mile ?? 0)
  );
  const warnings: string[] = [];
  if (r.projected_excess_miles > 0) {
    warnings.push(
      `On the mileage you expect to drive you would exceed the allowance by ${r.projected_excess_miles.toLocaleString()} miles, costing about £${r.excess_mileage_charge.toLocaleString()} if you hand the car back.`
    );
  }
  return {
    outputs: {
      amount_financed: r.amount_financed,
      monthly_payment: r.monthly_payment,
      total_of_monthly_payments: r.total_of_monthly_payments,
      guaranteed_future_value: r.guaranteed_future_value,
      option_to_purchase_fee: r.option_to_purchase_fee,
      total_if_car_handed_back: r.total_if_car_handed_back,
      total_if_car_purchased: r.total_if_car_purchased,
      total_charge_for_credit_if_purchased: r.total_charge_for_credit_if_purchased,
      interest_on_balloon: r.interest_on_balloon,
      contracted_miles: r.contracted_miles,
      projected_excess_miles: r.projected_excess_miles,
      excess_mileage_charge: r.excess_mileage_charge,
      total_if_handed_back_with_excess: r.total_if_handed_back_with_excess,
      basis:
        "YOU PAY INTEREST ON THE BALLOON FOR THE WHOLE TERM even though none of it is repaid until the end, and the figure is shown separately because it is the entire reason a PCP monthly looks low. Three endings exist and they cost different amounts: hand the car back and you have paid for depreciation only; pay the guaranteed future value plus the option fee and you own it; or part-exchange, in which case any equity above the guaranteed value is yours and is often less than the dealer implies. Mileage and condition are contractual, and excess charges are levied at the end whether or not you were watching. " +
        APR_NOTE + " " + NOT_ADVICE
    },
    warnings
  };
};

/** AUT-004 HP Finance */
export const aut004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = hirePurchase(
    Number(inputs.vehicle_price ?? 0),
    Number(inputs.deposit ?? 0),
    Number(inputs.apr ?? 0),
    Number(inputs.term_months ?? 48),
    Number(inputs.option_fee ?? 0)
  );
  return {
    outputs: {
      amount_financed: r.amount_financed,
      monthly_payment: r.monthly_payment,
      total_of_monthly_payments: r.total_of_monthly_payments,
      option_to_purchase_fee: r.option_to_purchase_fee,
      total_amount_payable: r.total_amount_payable,
      total_charge_for_credit: r.total_charge_for_credit,
      one_third_paid_amount: r.one_third_paid_amount,
      months_until_one_third_paid: r.months_until_one_third_paid,
      half_paid_amount: r.half_paid_amount,
      months_until_half_paid: r.months_until_half_paid,
      basis:
        "YOU DO NOT OWN THE CAR UNTIL THE LAST PAYMENT AND THE OPTION FEE ARE MADE; until then it belongs to the finance company, which is why you cannot sell it. Two statutory points follow from that, and both are measured against the total amount payable under the agreement rather than against the amount financed. Once a THIRD has been paid the car becomes protected goods under section 90 of the Consumer Credit Act 1974, and the lender cannot repossess it from you without a court order. Once HALF has been paid you have the right of voluntary termination under section 99: you can end the agreement, hand the car back and owe nothing further, provided the car is in reasonable condition. The months shown are when each threshold is reached on this schedule. " +
        APR_NOTE + " " + NOT_ADVICE
    }
  };
};

/** AUT-005 Dealer Contribution vs Low APR */
export const aut005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = compareOffers(
    Number(inputs.vehicle_price ?? 0),
    Number(inputs.deposit ?? 0),
    Number(inputs.term_months ?? 36),
    Number(inputs.final_payment ?? 0),
    Number(inputs.offer_a_contribution ?? 0),
    Number(inputs.offer_a_apr ?? 0),
    Number(inputs.offer_b_contribution ?? 0),
    Number(inputs.offer_b_apr ?? 0)
  );
  return {
    outputs: {
      offer_a_monthly_payment: r.offer_a_monthly_payment,
      offer_a_total_cost: r.offer_a_total_cost,
      offer_b_monthly_payment: r.offer_b_monthly_payment,
      offer_b_total_cost: r.offer_b_total_cost,
      cheaper_offer: r.cheaper_offer,
      saving: r.saving,
      monthly_difference: r.monthly_difference,
      breakeven_contribution: r.breakeven_contribution,
      basis:
        "A DEPOSIT CONTRIBUTION AND A LOW APR CANNOT BE RANKED BY INSPECTION, and the answer genuinely flips with the term and with the size of any final payment: a contribution is a fixed sum, while an interest saving grows with how long and how much you borrow. The breakeven figure is the contribution at which the two offers cost exactly the same, so you can see how much of the advertised contribution is real. Both offers are costed on the same car, the same deposit, the same term and the same final payment, because a comparison across different terms is not a comparison. " +
        NOT_ADVICE
    }
  };
};

/** AUT-007 Fuel Economy */
export const aut007Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const units = unitsFrom(rulesFor(context));
  const fuelUnitRaw = String(inputs.fuel_unit ?? "litres");
  const fuelUnit =
    fuelUnitRaw === "imperial_gallons" || fuelUnitRaw === "us_gallons" ? fuelUnitRaw : "litres";
  const r = fuelEconomy(
    Number(inputs.distance ?? 0),
    String(inputs.distance_unit ?? "miles") === "km" ? "km" : "miles",
    Number(inputs.fuel_used ?? 0),
    fuelUnit as "litres" | "imperial_gallons" | "us_gallons",
    opt(inputs.fuel_price_pence),
    units
  );
  return {
    outputs: {
      mpg_imperial: r.mpg_imperial,
      mpg_us: r.mpg_us,
      litres_per_100km: r.litres_per_100km,
      km_per_litre: r.km_per_litre,
      miles_per_litre: r.miles_per_litre,
      fuel_used_litres: r.fuel_used_litres,
      distance_miles: r.distance_miles,
      cost_per_mile_pence: r.cost_per_mile_pence,
      total_fuel_cost: r.total_fuel_cost,
      basis:
        "THE HEADLINE FIGURE IS IMPERIAL MPG, on the 4.54609 litre gallon. The US figure is shown beside it, not because anyone here wants it, but because the two are constantly confused: the same car reads about twenty per cent lower in US mpg, and a car that does 50 mpg in Britain does about 42 in America without anything changing. Litres per 100 km is the European convention and runs the other way, so a LOWER number is better. Real economy also depends on speed, load, weather and tyre pressure, so a single tankful is a sample rather than a specification."
    }
  };
};

/** AUT-008 Mileage Calculator (HMRC business mileage) */
export const aut008Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const typeRaw = String(inputs.vehicle_type ?? "car_or_van");
  const vehicleType: VehicleType =
    typeRaw === "motorcycle" || typeRaw === "bicycle" ? typeRaw : "car_or_van";
  const r = businessMileage(
    Number(inputs.business_miles ?? 0),
    vehicleType,
    Number(inputs.passenger_miles ?? 0),
    Number(inputs.passengers ?? 0),
    Number(inputs.amount_paid ?? 0),
    opt(inputs.marginal_rate),
    rules
  );
  const warnings: string[] = [];
  if (r.taxable_excess > 0) {
    warnings.push(
      `Your employer has paid £${r.taxable_excess.toLocaleString()} more than the approved amount. That excess is taxable earnings and should be reported.`
    );
  }
  if (r.mileage_allowance_relief > 0) {
    warnings.push(
      `You have been paid £${r.mileage_allowance_relief.toLocaleString()} less than the approved amount. You can claim Mileage Allowance Relief on the difference; this is a deduction from taxable income, not a refund of the full amount.`
    );
  }
  return {
    outputs: {
      business_miles: r.business_miles,
      miles_at_higher_rate: r.miles_at_higher_rate,
      miles_at_lower_rate: r.miles_at_lower_rate,
      approved_amount_tax: r.approved_amount_tax,
      passenger_payment: r.passenger_payment,
      approved_amount_including_passengers: r.approved_amount_including_passengers,
      amount_paid_by_employer: r.amount_paid_by_employer,
      taxable_excess: r.taxable_excess,
      mileage_allowance_relief: r.mileage_allowance_relief,
      relief_value_at_marginal_rate: r.relief_value_at_marginal_rate,
      approved_amount_national_insurance: r.approved_amount_national_insurance,
      national_insurance_excess: r.national_insurance_excess,
      basis:
        "THE RATE ROSE TO 55p FOR THE FIRST 10,000 BUSINESS MILES FROM 6 APRIL 2026. The 45p figure that almost every mileage calculator still shows applies to earlier tax years only. Above 10,000 miles the rate is 25p, and the threshold runs per employee per tax year. " +
        "TAX AND NATIONAL INSURANCE ARE NOT THE SAME CALCULATION. For National Insurance a single rate applies to every business mile with no 10,000 mile step and there is no Mileage Allowance Relief, so an employee driving well over 10,000 miles has two different approved amounts at once. Both are shown. " +
        "Relief is a deduction from taxable income rather than a payment: being under-reimbursed by £500 is worth £100 to a basic rate taxpayer, not £500. Passenger payments of 5p a mile are only relevant if your employer actually makes them; there is no relief for passenger payments an employer declines to pay."
    },
    warnings
  };
};

/** AUT-009 EV Charging Cost */
export const aut009Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const units = unitsFrom(rulesFor(context));
  const r = evChargingCost(
    Number(inputs.battery_kwh ?? 0),
    Number(inputs.start_charge ?? 0),
    Number(inputs.target_charge ?? 80),
    Number(inputs.price_pence_per_kwh ?? 0),
    Number(inputs.charging_efficiency ?? 90),
    Number(inputs.session_fee ?? 0),
    opt(inputs.miles_per_kwh),
    opt(inputs.charger_kw),
    opt(inputs.petrol_price_pence),
    opt(inputs.petrol_mpg),
    units
  );
  return {
    outputs: {
      energy_into_battery_kwh: r.energy_into_battery_kwh,
      energy_drawn_from_supply_kwh: r.energy_drawn_from_supply_kwh,
      charging_losses_kwh: r.charging_losses_kwh,
      energy_cost: r.energy_cost,
      session_fee: r.session_fee,
      total_cost: r.total_cost,
      cost_per_kwh_into_battery_pence: r.cost_per_kwh_into_battery_pence,
      miles_added: r.miles_added,
      cost_per_mile_pence: r.cost_per_mile_pence,
      petrol_cost_per_mile_pence: r.petrol_cost_per_mile_pence,
      saving_per_mile_pence: r.saving_per_mile_pence,
      charging_hours: r.charging_hours,
      basis:
        "YOU ARE BILLED FOR WHAT THE METER DRAWS, NOT FOR WHAT REACHES THE BATTERY. Charging is not lossless: the on-board charger, the cable and the battery itself give up energy as heat, and on a home AC charger the gap is commonly around a tenth. A calculator that multiplies the battery capacity by the tariff therefore understates every home charge, and this one shows the losses as their own line so the difference is visible. The charging time is the time to move that energy at the stated power and is an ideal: real rapid charging tapers sharply as the battery fills, so the last twenty per cent takes disproportionately long."
    }
  };
};

/** AUT-010 EV Range */
export const aut010Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = evRange(
    Number(inputs.usable_battery_kwh ?? 0),
    Number(inputs.miles_per_kwh ?? 0),
    Number(inputs.current_charge ?? 100),
    Number(inputs.range_reduction ?? 0),
    Number(inputs.reserve_charge ?? 10),
    opt(inputs.journey_miles)
  );
  const warnings: string[] = [];
  if (r.journey_possible === false) {
    warnings.push(
      "On the charge you have now, and keeping the reserve you asked for, this journey does not fit. Plan a charging stop rather than arriving on the reserve."
    );
  }
  return {
    outputs: {
      usable_battery_kwh: r.usable_battery_kwh,
      effective_consumption_mi_per_kwh: r.effective_consumption_mi_per_kwh,
      range_from_full: r.range_from_full,
      range_at_current_charge: r.range_at_current_charge,
      range_to_reserve: r.range_to_reserve,
      practical_range_to_80_pct: r.practical_range_to_80_pct,
      energy_needed_for_journey: r.energy_needed_for_journey,
      journey_possible: r.journey_possible,
      charge_needed_pct: r.charge_needed_pct,
      basis:
        "THE RANGE REDUCTION IS YOURS TO SET, AND THIS CALCULATOR DOES NOT INVENT ONE. Cold weather, motorway speed, a roof box and a full car all cut range, and by amounts that depend on the car and the journey; publishing a fabricated winter factor would look authoritative and be wrong. Enter the consumption your car actually achieves rather than its WLTP figure, which is measured on a cycle no real journey resembles. Two ranges are given for a reason: the range to your reserve is what you can safely plan around, and the range to eighty per cent is what matters on a long trip, because rapid charging slows so sharply above that point that filling the last fifth is rarely worth the time."
    },
    warnings
  };
};

/** AUT-011 Vehicle Depreciation */
export const aut011Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = vehicleDepreciation(
    Number(inputs.purchase_price ?? 0),
    Number(inputs.years ?? 3),
    Number(inputs.first_year_rate ?? 0),
    Number(inputs.subsequent_rate ?? 0),
    opt(inputs.expected_value),
    opt(inputs.annual_mileage)
  );
  return {
    outputs: {
      purchase_price: r.purchase_price,
      years: r.years,
      value_at_end: r.value_at_end,
      total_depreciation: r.total_depreciation,
      percentage_retained: r.percentage_retained,
      average_annual_depreciation: r.average_annual_depreciation,
      first_year_depreciation: r.first_year_depreciation,
      depreciation_per_mile_pence: r.depreciation_per_mile_pence,
      implied_annual_rate_pct: r.implied_annual_rate_pct,
      basis:
        "DEPRECIATION IS USUALLY THE LARGEST COST OF RUNNING A CAR, larger than fuel, insurance and servicing together for a newer one, and it is invisible because nobody sends a bill for it. It is also FRONT-LOADED: the reducing-balance method used here takes the biggest bite in year one, which is why the first year is shown separately and why a two-year-old car can be the better buy. The rates are yours to set, because depreciation depends on the model, the mileage, the specification and the market rather than on any formula; if you know what the car is likely to be worth at the end, enter that instead and the implied annual rate is fitted to it.",
      schedule_note: "The year-by-year table shows opening value, the fall, and what is left."
    },
    schedule: r.schedule
  };
};

/** AUT-012 Engine Horsepower */
export const aut012Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const units = unitsFrom(rulesFor(context));
  const methodRaw = String(inputs.method ?? "torque");
  const method =
    methodRaw === "trap_speed" || methodRaw === "elapsed_time" ? methodRaw : "torque";
  const r = horsepower(
    method as "torque" | "trap_speed" | "elapsed_time",
    opt(inputs.torque),
    String(inputs.torque_unit ?? "lb_ft") === "nm" ? "nm" : "lb_ft",
    opt(inputs.rpm),
    opt(inputs.weight_lb),
    opt(inputs.trap_speed_mph),
    opt(inputs.elapsed_time),
    units
  );
  return {
    outputs: {
      horsepower_bhp: r.horsepower_bhp,
      kilowatts: r.kilowatts,
      metric_horsepower_ps: r.metric_horsepower_ps,
      torque_lb_ft: r.torque_lb_ft,
      torque_nm: r.torque_nm,
      rpm: r.rpm,
      basis:
        "THE 5252 IN THE FORMULA IS NOT ARBITRARY: it is 33,000 divided by two pi, from Watt's definition of a horsepower as thirty-three thousand foot-pounds per minute. It follows that power and torque curves ALWAYS cross at 5252 rpm on an honest dyno chart, which is a quick way to tell whether a plot has been massaged. " +
        "Three units appear in car specifications and they are not the same size: bhp is the mechanical horsepower of about 745.7 watts, PS is the metric horse of 735.5 watts, so a 300 PS car is about 296 bhp. Quoting one figure under the other unit is the commonest way a specification flatters itself. " +
        (method === "torque"
          ? "This is FLYWHEEL power from a torque figure. A rolling road measures power at the wheels, which is lower by whatever the transmission absorbs."
          : "This is an ESTIMATE from a quarter-mile run, not a measurement. Trap-speed and elapsed-time formulas are empirical rules fitted to typical cars; traction, launch and conditions move the answer, and they say nothing about a car that cannot put its power down.")
    }
  };
};
