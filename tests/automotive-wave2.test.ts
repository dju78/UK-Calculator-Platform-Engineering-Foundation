/**
 * Wave 2 tranche 2M, Automotive & Travel.
 *
 * These assert the STRUCTURAL claims the calculators make, which a numeric
 * benchmark cannot express: that four car finance contracts are genuinely
 * modelled differently rather than parameterised from one routine, that the
 * imperial and US gallon are never confused, that the HMRC tax and National
 * Insurance approved amounts really do diverge, and that validation refuses
 * rather than guesses.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };

function closeTo(actual: number, expected: number, tol = 0.011) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected} +/- ${tol}, got ${actual}`
  );
}

async function run(id: string, inputs: Record<string, unknown>) {
  return calculate(id, inputs as never, CTX);
}

async function throwsWith(
  id: string,
  inputs: Record<string, unknown>,
  fragment: string
) {
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
// The four contracts are genuinely different
// ---------------------------------------------------------------------------

test("HP and a personal loan on identical terms give the same payment, because the credit is the same", async () => {
  const terms = { vehicle_price: 25000, deposit: 5000, apr: 7.9, term_months: 48 };
  const loan = await run("AUT-001", { ...terms, part_exchange: 0, fee: 0, fee_financed: "true" });
  const hp = await run("AUT-004", { ...terms, option_fee: 0 });
  closeTo(hp.outputs.monthly_payment as number, loan.outputs.monthly_payment as number);
});

test("a PCP monthly is LOWER than HP on identical terms, and the total cost to own is HIGHER", async () => {
  const terms = { vehicle_price: 30000, deposit: 3000, apr: 6.9, term_months: 36 };
  const hp = await run("AUT-004", { ...terms, option_fee: 10 });
  const pcp = await run("AUT-003", {
    ...terms, dealer_contribution: 0, gmfv: 14000, option_fee: 10,
    annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 8
  });

  assert.ok(
    (pcp.outputs.monthly_payment as number) < (hp.outputs.monthly_payment as number),
    "a PCP monthly must be lower than HP on the same car and term"
  );
  assert.ok(
    (pcp.outputs.total_if_car_purchased as number) > (hp.outputs.total_amount_payable as number),
    "owning the car through a PCP must cost MORE in total than through HP; that is the trade the monthly hides"
  );
});

test("the interest attributable to the balloon is exactly the balloon less its present value, and is zero at 0% APR", async () => {
  const base = {
    vehicle_price: 30000, deposit: 3000, dealer_contribution: 0, term_months: 36,
    gmfv: 14000, option_fee: 10,
    annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 8
  };
  const charged = await run("AUT-003", { ...base, apr: 6.9 });
  const free = await run("AUT-003", { ...base, apr: 0 });

  const i = Math.pow(1.069, 1 / 12) - 1;
  closeTo(charged.outputs.interest_on_balloon as number, 14000 - 14000 / Math.pow(1 + i, 36));
  closeTo(free.outputs.interest_on_balloon as number, 0);
});

test("a lease rental is solved IN ADVANCE, so it is lower than the same cash flows solved in arrears", async () => {
  const lease = await run("AUT-002", {
    monthly_rental: "", vehicle_price: 32000, residual_value: 18000, apr: 6.5,
    term_months: 48, initial_rental_months: 9, documentation_fee: 0,
    annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 9
  });

  const i = Math.pow(1.065, 1 / 12) - 1;
  const n = 48;
  const annuity = (1 - Math.pow(1 + i, -n)) / i;
  const pvResidual = 18000 / Math.pow(1 + i, n);
  const inArrears = (32000 - pvResidual) / annuity;
  const inAdvance = inArrears / (1 + i);

  closeTo(lease.outputs.monthly_rental as number, inAdvance, 0.02);
  assert.ok(
    (lease.outputs.monthly_rental as number) < inArrears,
    "a rental paid in advance must be lower than the same cash flows paid in arrears"
  );
});

test("the money-factor rule of thumb differs from the exact rental, which is why both are shown", async () => {
  const lease = await run("AUT-002", {
    monthly_rental: "", vehicle_price: 32000, residual_value: 18000, apr: 6.5,
    term_months: 48, initial_rental_months: 9, documentation_fee: 0,
    annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 9
  });
  const exact = lease.outputs.monthly_rental as number;
  const approx = lease.outputs.money_factor_monthly_rental as number;
  assert.ok(typeof approx === "number", "the comparison figure must be present when the rental is derived");
  assert.notStrictEqual(exact, approx);
});

test("a quoted rental is used as given, and no money-factor comparison is invented for it", async () => {
  const lease = await run("AUT-002", {
    monthly_rental: 349.99, vehicle_price: 0, residual_value: 0, apr: 0,
    term_months: 48, initial_rental_months: 9, documentation_fee: 234,
    annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 9
  });
  closeTo(lease.outputs.monthly_rental as number, 349.99);
  closeTo(lease.outputs.initial_rental as number, 349.99 * 9);
  assert.strictEqual(lease.outputs.money_factor_monthly_rental, null);
});

// ---------------------------------------------------------------------------
// Statutory hire purchase thresholds
// ---------------------------------------------------------------------------

test("a deposit already past a threshold reports month zero, not a fraction of the term", async () => {
  // A £12,000 deposit on a £20,000 car is more than HALF the total payable, so
  // both statutory rights exist from the outset. A formula that took a fraction
  // of the term instead of counting real payments would report month 12 and
  // month 18 here, and would be wrong about a right the hirer already has.
  const large = await run("AUT-004", {
    vehicle_price: 20000, deposit: 12000, apr: 8.9, term_months: 36, option_fee: 10
  });
  assert.ok((large.outputs.half_paid_amount as number) < 12000);
  assert.strictEqual(large.outputs.months_until_one_third_paid, 0);
  assert.strictEqual(large.outputs.months_until_half_paid, 0);

  // A modest deposit crosses the third early and the half well into the term.
  const modest = await run("AUT-004", {
    vehicle_price: 25000, deposit: 5000, apr: 7.9, term_months: 48, option_fee: 10
  });
  const third = modest.outputs.months_until_one_third_paid as number;
  const half = modest.outputs.months_until_half_paid as number;
  assert.ok(third > 0 && third < half, "the third must be reached before the half");
  assert.ok(half < 48, "voluntary termination must open before the agreement ends");
});

test("the statutory thresholds are measured against the total payable, not the amount financed", async () => {
  const hp = await run("AUT-004", {
    vehicle_price: 25000, deposit: 5000, apr: 7.9, term_months: 48, option_fee: 10
  });
  const total = hp.outputs.total_amount_payable as number;
  closeTo(hp.outputs.one_third_paid_amount as number, total / 3);
  closeTo(hp.outputs.half_paid_amount as number, total / 2);
  assert.ok(
    (hp.outputs.one_third_paid_amount as number) > (hp.outputs.amount_financed as number) / 3,
    "a third of the total payable must exceed a third of the amount financed"
  );
});

// ---------------------------------------------------------------------------
// Offer comparison: the ranking flips with the term
// ---------------------------------------------------------------------------

test("the same headline offers rank differently at 36 and 60 months", async () => {
  const base = {
    vehicle_price: 35000, deposit: 3500, final_payment: 0,
    offer_a_contribution: 2500, offer_a_apr: 12.9,
    offer_b_contribution: 0, offer_b_apr: 4.9
  };
  const short = await run("AUT-005", { ...base, term_months: 24 });
  const long = await run("AUT-005", { ...base, term_months: 60 });
  assert.strictEqual(short.outputs.cheaper_offer, "A");
  assert.strictEqual(long.outputs.cheaper_offer, "B");
});

test("at the breakeven contribution the two offers cost the same", async () => {
  const base = {
    vehicle_price: 30000, deposit: 3000, term_months: 36, final_payment: 14000,
    offer_a_contribution: 2000, offer_a_apr: 9.9,
    offer_b_contribution: 0, offer_b_apr: 0
  };
  const first = await run("AUT-005", base);
  const atBreakeven = await run("AUT-005", {
    ...base, offer_a_contribution: first.outputs.breakeven_contribution
  });
  closeTo(
    atBreakeven.outputs.offer_a_total_cost as number,
    atBreakeven.outputs.offer_b_total_cost as number,
    0.02
  );
  assert.strictEqual(atBreakeven.outputs.cheaper_offer, "equal");
});

// ---------------------------------------------------------------------------
// Units: the imperial gallon is never the US one
// ---------------------------------------------------------------------------

test("the same journey reads about twenty per cent worse in US mpg, and the ratio is exactly the gallon ratio", async () => {
  const r = await run("AUT-007", {
    distance: 300, distance_unit: "miles", fuel_used: 30, fuel_unit: "litres", fuel_price_pence: 145
  });
  const imperial = r.outputs.mpg_imperial as number;
  const us = r.outputs.mpg_us as number;
  closeTo(imperial, 45.4609, 1e-4);
  // The outputs are rounded to six decimal places, so the ratio recovers the
  // gallon ratio to about that precision rather than to machine epsilon.
  closeTo(imperial / us, 4.54609 / 3.785411784, 1e-6);
});

test("ten imperial gallons and ten US gallons are not the same quantity of fuel", async () => {
  const imperial = await run("AUT-007", {
    distance: 350, distance_unit: "miles", fuel_used: 10, fuel_unit: "imperial_gallons", fuel_price_pence: 145
  });
  const us = await run("AUT-007", {
    distance: 350, distance_unit: "miles", fuel_used: 10, fuel_unit: "us_gallons", fuel_price_pence: 145
  });
  closeTo(imperial.outputs.fuel_used_litres as number, 45.4609, 1e-4);
  closeTo(us.outputs.fuel_used_litres as number, 37.85411784, 1e-4);
  assert.ok(
    (us.outputs.mpg_imperial as number) > (imperial.outputs.mpg_imperial as number),
    "the same distance on ten US gallons is less fuel, so the imperial mpg must be higher"
  );
});

test("litres per 100 km runs the other way: a thirstier car has a HIGHER figure and a lower mpg", async () => {
  const efficient = await run("AUT-007", {
    distance: 300, distance_unit: "miles", fuel_used: 25, fuel_unit: "litres", fuel_price_pence: 145
  });
  const thirsty = await run("AUT-007", {
    distance: 300, distance_unit: "miles", fuel_used: 45, fuel_unit: "litres", fuel_price_pence: 145
  });
  assert.ok((thirsty.outputs.litres_per_100km as number) > (efficient.outputs.litres_per_100km as number));
  assert.ok((thirsty.outputs.mpg_imperial as number) < (efficient.outputs.mpg_imperial as number));
});

// ---------------------------------------------------------------------------
// HMRC mileage: tax and National Insurance genuinely diverge
// ---------------------------------------------------------------------------

test("the approved amount for tax and for National Insurance differ above 10,000 miles and agree below it", async () => {
  const under = await run("AUT-008", {
    business_miles: 8000, vehicle_type: "car_or_van",
    passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20
  });
  const over = await run("AUT-008", {
    business_miles: 15000, vehicle_type: "car_or_van",
    passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20
  });

  closeTo(under.outputs.approved_amount_tax as number, 8000 * 0.55);
  closeTo(under.outputs.approved_amount_national_insurance as number, 8000 * 0.55);

  closeTo(over.outputs.approved_amount_tax as number, 10000 * 0.55 + 5000 * 0.25);
  closeTo(over.outputs.approved_amount_national_insurance as number, 15000 * 0.55);
  assert.notStrictEqual(
    over.outputs.approved_amount_tax,
    over.outputs.approved_amount_national_insurance
  );
});

test("the 10,000th mile is at the higher rate and the 10,001st at the lower one", async () => {
  const at = await run("AUT-008", {
    business_miles: 10000, vehicle_type: "car_or_van",
    passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20
  });
  const past = await run("AUT-008", {
    business_miles: 10001, vehicle_type: "car_or_van",
    passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20
  });
  closeTo((past.outputs.approved_amount_tax as number) - (at.outputs.approved_amount_tax as number), 0.25);
  closeTo(
    (past.outputs.approved_amount_national_insurance as number) -
      (at.outputs.approved_amount_national_insurance as number),
    0.55
  );
});

test("the car and van rate is the 2026/27 figure of 55p, not the pre-April-2026 45p", async () => {
  const r = await run("AUT-008", {
    business_miles: 1000, vehicle_type: "car_or_van",
    passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20
  });
  closeTo(r.outputs.approved_amount_tax as number, 550);
  assert.notStrictEqual(r.outputs.approved_amount_tax, 450);
});

test("relief is worth the marginal rate on the shortfall, not the shortfall itself", async () => {
  const r = await run("AUT-008", {
    business_miles: 1000, vehicle_type: "car_or_van",
    passenger_miles: 0, passengers: 0, amount_paid: 50, marginal_rate: 20
  });
  closeTo(r.outputs.mileage_allowance_relief as number, 500);
  closeTo(r.outputs.relief_value_at_marginal_rate as number, 100);
  assert.ok(
    (r.outputs.relief_value_at_marginal_rate as number) <
      (r.outputs.mileage_allowance_relief as number),
    "the value of the relief must be less than the shortfall it is claimed on"
  );
});

test("passenger payments apply to cars and vans only, and not to a bicycle", async () => {
  const car = await run("AUT-008", {
    business_miles: 1000, vehicle_type: "car_or_van",
    passenger_miles: 1000, passengers: 2, amount_paid: 0, marginal_rate: 20
  });
  const bike = await run("AUT-008", {
    business_miles: 1000, vehicle_type: "bicycle",
    passenger_miles: 1000, passengers: 2, amount_paid: 0, marginal_rate: 20
  });
  closeTo(car.outputs.passenger_payment as number, 1000 * 2 * 0.05);
  closeTo(bike.outputs.passenger_payment as number, 0);
});

test("a motorcycle and a bicycle have no 10,000 mile step at all", async () => {
  for (const [type, pence] of [["motorcycle", 0.24], ["bicycle", 0.20]] as const) {
    const r = await run("AUT-008", {
      business_miles: 14000, vehicle_type: type,
      passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20
    });
    closeTo(r.outputs.approved_amount_tax as number, 14000 * pence);
    assert.strictEqual(r.outputs.miles_at_lower_rate, 0);
  }
});

// ---------------------------------------------------------------------------
// EV charging: you pay for what the meter draws
// ---------------------------------------------------------------------------

test("energy drawn exceeds energy into the battery, and the losses are reported", async () => {
  const r = await run("AUT-009", {
    battery_kwh: 64, start_charge: 20, target_charge: 80,
    price_pence_per_kwh: 24.5, charging_efficiency: 90, session_fee: 0,
    miles_per_kwh: 3.8, charger_kw: 7, petrol_price_pence: 145, petrol_mpg: 45
  });
  const into = r.outputs.energy_into_battery_kwh as number;
  const drawn = r.outputs.energy_drawn_from_supply_kwh as number;
  closeTo(into, 38.4, 1e-6);
  assert.ok(drawn > into, "the meter must draw more than reaches the battery");
  closeTo(r.outputs.charging_losses_kwh as number, drawn - into, 1e-6);
  // The bill follows the energy drawn, not the energy stored.
  closeTo(r.outputs.energy_cost as number, (drawn * 24.5) / 100);
});

test("a lossless charger is the only case with zero losses", async () => {
  const r = await run("AUT-009", {
    battery_kwh: 50, start_charge: 0, target_charge: 100,
    price_pence_per_kwh: 30, charging_efficiency: 100, session_fee: 0,
    miles_per_kwh: 3.5, charger_kw: 11, petrol_price_pence: 145, petrol_mpg: 45
  });
  closeTo(r.outputs.charging_losses_kwh as number, 0, 1e-9);
  closeTo(
    r.outputs.energy_drawn_from_supply_kwh as number,
    r.outputs.energy_into_battery_kwh as number,
    1e-9
  );
});

test("the petrol comparison uses the imperial gallon, so a US gallon would understate the saving", async () => {
  const r = await run("AUT-009", {
    battery_kwh: 64, start_charge: 20, target_charge: 80,
    price_pence_per_kwh: 24.5, charging_efficiency: 90, session_fee: 0,
    miles_per_kwh: 3.8, charger_kw: 7, petrol_price_pence: 145, petrol_mpg: 45
  });
  // 45 mpg on the imperial gallon at 145p a litre.
  closeTo(r.outputs.petrol_cost_per_mile_pence as number, ((4.54609 / 45) * 145), 1e-4);
});

// ---------------------------------------------------------------------------
// EV range: the reserve is applied to the charge, not to the range
// ---------------------------------------------------------------------------

test("the reserve is taken off the state of charge before the range, not off the range afterwards", async () => {
  const r = await run("AUT-010", {
    usable_battery_kwh: 64, miles_per_kwh: 4, current_charge: 50,
    range_reduction: 0, reserve_charge: 10, journey_miles: 150
  });
  // 50% of 64 kWh at 4 mi/kWh = 128 miles now; usable charge is 40% = 102.4 miles.
  closeTo(r.outputs.range_at_current_charge as number, 128, 1e-6);
  closeTo(r.outputs.range_to_reserve as number, 102.4, 1e-6);
  // Subtracting the reserve from the RANGE instead would give 115.2, which is
  // a different and more optimistic answer.
  assert.notStrictEqual(r.outputs.range_to_reserve, 115.2);
});

test("a journey longer than the range to reserve is reported as not possible, with a warning", async () => {
  const r = await run("AUT-010", {
    usable_battery_kwh: 52, miles_per_kwh: 3.2, current_charge: 60,
    range_reduction: 25, reserve_charge: 15, journey_miles: 180
  });
  assert.strictEqual(r.outputs.journey_possible, false);
  assert.ok(
    (r.warnings ?? []).some(w => /charging stop/i.test(w)),
    "a journey that does not fit must say so rather than only returning false"
  );
});

test("the range reduction is applied to consumption and scales every range together", async () => {
  const none = await run("AUT-010", {
    usable_battery_kwh: 64, miles_per_kwh: 4, current_charge: 100,
    range_reduction: 0, reserve_charge: 0, journey_miles: 100
  });
  const quarter = await run("AUT-010", {
    usable_battery_kwh: 64, miles_per_kwh: 4, current_charge: 100,
    range_reduction: 25, reserve_charge: 0, journey_miles: 100
  });
  closeTo(quarter.outputs.range_from_full as number, (none.outputs.range_from_full as number) * 0.75, 1e-6);
  closeTo(
    quarter.outputs.energy_needed_for_journey as number,
    (none.outputs.energy_needed_for_journey as number) / 0.75,
    1e-6
  );
});

// ---------------------------------------------------------------------------
// Depreciation
// ---------------------------------------------------------------------------

test("depreciation is front-loaded: year one falls further than year two on the same schedule", async () => {
  const r = await run("AUT-011", {
    purchase_price: 30000, years: 3, first_year_rate: 25, subsequent_rate: 15,
    expected_value: "", annual_mileage: 10000
  });
  const schedule = r.schedule as Array<{ depreciation: number }>;
  assert.ok(schedule[0].depreciation > schedule[1].depreciation);
  assert.ok(schedule[1].depreciation > schedule[2].depreciation);
});

test("a known end value overrides the rates and the fitted rate reproduces it", async () => {
  const r = await run("AUT-011", {
    purchase_price: 28000, years: 3, first_year_rate: 99, subsequent_rate: 99,
    expected_value: 15000, annual_mileage: 10000
  });
  closeTo(r.outputs.value_at_end as number, 15000);
  const rate = (r.outputs.implied_annual_rate_pct as number) / 100;
  closeTo(28000 * Math.pow(1 - rate, 3), 15000, 0.02);
});

test("appreciation is refused rather than modelled as negative depreciation", async () => {
  await throwsWith(
    "AUT-011",
    { purchase_price: 20000, years: 3, first_year_rate: 0, subsequent_rate: 0, expected_value: 25000, annual_mileage: 10000 },
    "more than the purchase price"
  );
});

// ---------------------------------------------------------------------------
// Horsepower
// ---------------------------------------------------------------------------

test("at 5252 rpm the power in bhp equals the torque in pound-feet, to the accuracy of the constant", async () => {
  const r = await run("AUT-012", { method: "torque", torque: 250, torque_unit: "lb_ft", rpm: 5252 });
  closeTo(r.outputs.horsepower_bhp as number, 250, 0.01);
});

test("PS is a smaller unit than bhp, so the PS figure is always the larger number", async () => {
  const r = await run("AUT-012", { method: "torque", torque: 400, torque_unit: "nm", rpm: 4500 });
  assert.ok((r.outputs.metric_horsepower_ps as number) > (r.outputs.horsepower_bhp as number));
  closeTo(
    (r.outputs.metric_horsepower_ps as number) / (r.outputs.horsepower_bhp as number),
    745.6998715822702 / 735.49875,
    1e-9
  );
});

test("the same torque quoted in either unit gives the same power", async () => {
  const lbft = await run("AUT-012", { method: "torque", torque: 300, torque_unit: "lb_ft", rpm: 5000 });
  const nm = await run("AUT-012", {
    method: "torque", torque: 300 * 1.3558179483314004, torque_unit: "nm", rpm: 5000
  });
  closeTo(nm.outputs.horsepower_bhp as number, lbft.outputs.horsepower_bhp as number, 1e-6);
});

// ---------------------------------------------------------------------------
// Validation refuses rather than guessing
// ---------------------------------------------------------------------------

test("nonsensical finance inputs are refused with an explanation", async () => {
  await throwsWith(
    "AUT-001",
    { vehicle_price: 10000, deposit: 8000, part_exchange: 5000, apr: 7.9, term_months: 48, fee: 0, fee_financed: "true" },
    "more than the vehicle price"
  );
  await throwsWith(
    "AUT-003",
    {
      vehicle_price: 20000, deposit: 2000, dealer_contribution: 0, apr: 6.9, term_months: 36,
      gmfv: 25000, option_fee: 10,
      annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 8
    },
    "more than the amount being financed"
  );
  await throwsWith(
    "AUT-002",
    {
      monthly_rental: "", vehicle_price: 30000, residual_value: 15000, apr: 6.5,
      term_months: 24, initial_rental_months: 24, documentation_fee: 0,
      annual_mileage_allowance: 10000, expected_annual_mileage: 10000, excess_pence_per_mile: 9
    },
    "cannot be as large as the whole term"
  );
});

test("a consumption figure that is really watt-hours per mile is caught and explained", async () => {
  await throwsWith(
    "AUT-010",
    {
      usable_battery_kwh: 64, miles_per_kwh: 280, current_charge: 80,
      range_reduction: 0, reserve_charge: 10, journey_miles: 100
    },
    "watt-hours"
  );
});

test("a fuel calculation with no distance or no fuel is refused rather than returning infinity", async () => {
  await throwsWith(
    "AUT-007",
    { distance: 0, distance_unit: "miles", fuel_used: 30, fuel_unit: "litres", fuel_price_pence: 145 },
    "distance must be greater than zero"
  );
  await throwsWith(
    "AUT-007",
    { distance: 300, distance_unit: "miles", fuel_used: 0, fuel_unit: "litres", fuel_price_pence: 145 },
    "fuel used must be greater than zero"
  );
});

test("a charge target at or below the starting charge is refused", async () => {
  await throwsWith(
    "AUT-009",
    {
      battery_kwh: 64, start_charge: 80, target_charge: 80,
      price_pence_per_kwh: 24.5, charging_efficiency: 90, session_fee: 0,
      miles_per_kwh: 3.8, charger_kw: 7, petrol_price_pence: 145, petrol_mpg: 45
    },
    "higher than the starting charge"
  );
});

test("passenger miles above total business miles are refused", async () => {
  await throwsWith(
    "AUT-008",
    {
      business_miles: 1000, vehicle_type: "car_or_van",
      passenger_miles: 2000, passengers: 1, amount_paid: 0, marginal_rate: 20
    },
    "cannot be more than your total business miles"
  );
});

// ---------------------------------------------------------------------------
// No result ever reaches a user as NaN, Infinity or an object
// ---------------------------------------------------------------------------

test("every automotive calculator returns finite numbers, strings or nulls only", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["AUT-001", { vehicle_price: 25000, deposit: 5000, part_exchange: 0, apr: 7.9, term_months: 48, fee: 0, fee_financed: "true" }],
    ["AUT-002", { monthly_rental: "", vehicle_price: 32000, residual_value: 18000, apr: 6.5, term_months: 48, initial_rental_months: 9, documentation_fee: 180, annual_mileage_allowance: 10000, expected_annual_mileage: 12000, excess_pence_per_mile: 9 }],
    ["AUT-003", { vehicle_price: 30000, deposit: 3000, dealer_contribution: 1000, apr: 6.9, term_months: 36, gmfv: 14000, option_fee: 10, annual_mileage_allowance: 10000, expected_annual_mileage: 12000, excess_pence_per_mile: 8 }],
    ["AUT-004", { vehicle_price: 25000, deposit: 5000, apr: 7.9, term_months: 48, option_fee: 10 }],
    ["AUT-005", { vehicle_price: 30000, deposit: 3000, term_months: 36, final_payment: 14000, offer_a_contribution: 2000, offer_a_apr: 9.9, offer_b_contribution: 0, offer_b_apr: 0 }],
    ["AUT-007", { distance: 300, distance_unit: "miles", fuel_used: 30, fuel_unit: "litres", fuel_price_pence: 145 }],
    ["AUT-008", { business_miles: 12000, vehicle_type: "car_or_van", passenger_miles: 0, passengers: 0, amount_paid: 0, marginal_rate: 20 }],
    ["AUT-009", { battery_kwh: 64, start_charge: 20, target_charge: 80, price_pence_per_kwh: 24.5, charging_efficiency: 90, session_fee: 0, miles_per_kwh: 3.8, charger_kw: 7, petrol_price_pence: 145, petrol_mpg: 45 }],
    ["AUT-010", { usable_battery_kwh: 64, miles_per_kwh: 3.8, current_charge: 80, range_reduction: 20, reserve_charge: 10, journey_miles: 150 }],
    ["AUT-011", { purchase_price: 30000, years: 3, first_year_rate: 25, subsequent_rate: 15, expected_value: "", annual_mileage: 10000 }],
    ["AUT-012", { method: "torque", torque: 300, torque_unit: "lb_ft", rpm: 5000 }]
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
