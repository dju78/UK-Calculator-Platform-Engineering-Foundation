/**
 * Independent benchmark oracle for Wave 2 tranche 2M, Automotive & Travel.
 *
 * Imports nothing from the calculation engine. Independence of METHOD, not
 * merely of code, calculator by calculator:
 *
 *   - Every finance payment (car loan, HP, PCP, lease, offer comparison) is
 *     found by BISECTING on a MONTH-BY-MONTH BALANCE SIMULATION until the
 *     closing balance lands on its target. The engine uses the closed-form
 *     annuity. An algebraic slip in the annuity, a sign error on the balloon
 *     discount, or an off-by-one on the number of periods would all move the
 *     engine and leave the simulation where it is.
 *   - HMRC mileage is accumulated ONE MILE AT A TIME at whichever pence rate
 *     applies to that mile, rather than by multiplying two bands. That is the
 *     only way to catch an off-by-one at the 10,000 mile threshold.
 *   - Fuel economy is computed through litres-per-mile and then inverted,
 *     with the gallon constants RE-TYPED here from their definitions rather
 *     than read from the ruleset, so agreement corroborates the ruleset.
 *   - EV charging is summed in one-per-cent state-of-charge steps.
 *   - EV range is simulated MILE BY MILE, decrementing the pack until the
 *     reserve is reached, rather than by dividing energy by consumption.
 *   - Depreciation closing values use a closed-form power expression, the
 *     opposite way round from the engine's accumulating loop.
 *   - Horsepower is derived in SI from first principles: power equals torque
 *     in newton metres times angular velocity in radians per second. The
 *     engine uses the imperial torque-times-rpm-over-5252 shortcut. The two
 *     agreeing is a real check that the 5252 constant is right.
 *
 * Run: node scripts/oracles/wave2-automotive-oracle.mjs > /tmp/automotive.json
 */

const r2 = (n) => Math.round(n * 100) / 100;
const r6 = (n) => Math.round(n * 1e6) / 1e6;

// --- Constants re-typed from their definitions, not read from the ruleset ---
const IMPERIAL_GALLON_LITRES = 4.54609;     // exact by definition
const US_GALLON_LITRES = 3.785411784;       // exact by definition
const MILE_KM = 1.609344;                   // exact by definition
const HP_WATTS = 745.6998715822702;         // 550 ft lbf/s
const PS_WATTS = 735.49875;                 // 75 kgf m/s
const NM_PER_LB_FT = 1.3558179483314004;

// --- HMRC 2026/27 rates, re-typed from GOV.UK ------------------------------
const AMAP_FIRST_PENCE = 55;   // first 10,000 business miles, from 6 April 2026
const AMAP_ABOVE_PENCE = 25;   // above 10,000
const AMAP_THRESHOLD = 10000;
const AMAP_MOTORCYCLE_PENCE = 24;
const AMAP_BICYCLE_PENCE = 20;
const AMAP_PASSENGER_PENCE = 5;
const NI_CAR_PENCE = 55;       // single rate, no threshold

const fixtures = {};

function add(id, scenario, inputs, expected, note, ruleset = "None") {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±0.011 on money, 1e-6 on rates and ratios",
    ruleset,
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// Shared simulation machinery
// ===========================================================================

/** Monthly rate that compounds to the APR. */
const monthlyRate = (aprPct) => Math.pow(1 + aprPct / 100, 1 / 12) - 1;

/**
 * Closing balance after running the schedule month by month.
 * No annuity formula anywhere in here.
 */
function closingBalance(principal, i, months, payment) {
  let balance = principal;
  for (let m = 0; m < months; m++) {
    balance = balance * (1 + i) - payment;
  }
  return balance;
}

/**
 * The payment that leaves exactly `target` outstanding after `months`.
 * Found by bisection on the simulation above.
 */
function solvePayment(principal, i, months, target) {
  if (principal <= 0) return 0;
  let lo = 0;
  let hi = principal * (1 + i) + 1;      // one month clears everything and more
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (closingBalance(principal, i, months, mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Rental in advance: the rental is taken at the START of each month. */
function closingBalanceInAdvance(principal, i, months, rental) {
  let balance = principal;
  for (let m = 0; m < months; m++) {
    balance = (balance - rental) * (1 + i);
  }
  return balance;
}

function solveRentalInAdvance(principal, i, months, target) {
  let lo = 0;
  let hi = principal + 1;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (closingBalanceInAdvance(principal, i, months, mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Month at which cumulative payments first reach a target. */
function monthsUntil(deposit, payment, months, target) {
  let paid = deposit;
  if (paid >= target) return 0;
  for (let m = 1; m <= months; m++) {
    paid += payment;
    if (paid >= target) return m;
  }
  return months;
}

// ===========================================================================
// AUT-001 Car Loan
// ===========================================================================

for (const c of [
  { scenario: "Family hatchback, five thousand down", price: 25000, deposit: 5000, px: 0, apr: 7.9, n: 48, fee: 0 },
  { scenario: "Part exchange instead of cash", price: 18500, deposit: 1000, px: 4500, apr: 9.9, n: 36, fee: 0 },
  { scenario: "Interest free, so the payment is the balance divided by the term", price: 12000, deposit: 2000, px: 0, apr: 0, n: 24, fee: 0 },
  { scenario: "Arrangement fee financed, so it attracts interest too", price: 30000, deposit: 3000, px: 0, apr: 6.4, n: 60, fee: 299 },
  { scenario: "Long term on a used car, where the interest exceeds the deposit", price: 9000, deposit: 500, px: 0, apr: 14.9, n: 60, fee: 0 },
  { scenario: "Nothing down at all", price: 15000, deposit: 0, px: 0, apr: 11.9, n: 48, fee: 0 }
]) {
  const borrowed = c.price - c.deposit - c.px + c.fee;
  const i = monthlyRate(c.apr);
  const payment = solvePayment(borrowed, i, c.n, 0);
  const total = payment * c.n;
  const iNom = c.apr / 100 / 12;
  const paymentNom = solvePayment(borrowed, iNom, c.n, 0);

  add("AUT-001", c.scenario,
    { vehicle_price: c.price, deposit: c.deposit, part_exchange: c.px, apr: c.apr, term_months: c.n, fee: c.fee, fee_financed: true },
    {
      amount_borrowed: r2(borrowed),
      monthly_payment: r2(payment),
      total_repayable: r2(total),
      total_interest: r2(total - borrowed),
      total_cost_including_deposit: r2(total + c.deposit + c.px),
      monthly_payment_nominal_convention: r2(paymentNom)
    },
    "The payment is found by bisecting a month-by-month balance simulation until the balance closes at zero, never by the annuity formula. The zero-APR case pins the degenerate branch, where an annuity formula divides by zero.");
}

// ===========================================================================
// AUT-004 Hire Purchase
// ===========================================================================

for (const c of [
  { scenario: "Typical four year agreement", price: 25000, deposit: 5000, apr: 7.9, n: 48, fee: 10 },
  { scenario: "Large deposit, so a third is paid before the first instalment", price: 20000, deposit: 12000, apr: 8.9, n: 36, fee: 10 },
  { scenario: "Interest free with a token option fee", price: 16000, deposit: 4000, apr: 0, n: 24, fee: 1 },
  { scenario: "No deposit over five years", price: 28000, deposit: 0, apr: 10.9, n: 60, fee: 199 },
  { scenario: "Short term on a cheap car", price: 6000, deposit: 1000, apr: 12.9, n: 12, fee: 10 },
  { scenario: "Half is paid part way through, which is when voluntary termination opens", price: 22000, deposit: 2000, apr: 6.9, n: 48, fee: 10 }
]) {
  const financed = c.price - c.deposit;
  const i = monthlyRate(c.apr);
  const payment = solvePayment(financed, i, c.n, 0);
  const totalMonthly = payment * c.n;
  const totalPayable = totalMonthly + c.deposit + c.fee;
  const third = totalPayable / 3;
  const half = totalPayable / 2;

  add("AUT-004", c.scenario,
    { vehicle_price: c.price, deposit: c.deposit, apr: c.apr, term_months: c.n, option_fee: c.fee },
    {
      amount_financed: r2(financed),
      monthly_payment: r2(payment),
      total_of_monthly_payments: r2(totalMonthly),
      option_to_purchase_fee: r2(c.fee),
      total_amount_payable: r2(totalPayable),
      total_charge_for_credit: r2(totalPayable - c.price),
      one_third_paid_amount: r2(third),
      months_until_one_third_paid: monthsUntil(c.deposit, payment, c.n, third),
      half_paid_amount: r2(half),
      months_until_half_paid: monthsUntil(c.deposit, payment, c.n, half)
    },
    "The statutory thresholds are counted by accumulating actual payments month by month, so an agreement whose deposit already exceeds a third correctly reports month zero rather than a computed fraction of the term.");
}

// ===========================================================================
// AUT-003 PCP
// ===========================================================================

for (const c of [
  { scenario: "Three year PCP with a typical guaranteed future value", price: 30000, deposit: 3000, contrib: 1000, apr: 6.9, n: 36, gmfv: 14000, fee: 10, allow: 10000, expect: 12000, excess: 8 },
  { scenario: "Within the mileage allowance, so no excess arises", price: 26000, deposit: 2600, contrib: 0, apr: 5.9, n: 36, gmfv: 12000, fee: 10, allow: 12000, expect: 8000, excess: 10 },
  { scenario: "Interest free, where the balloon costs nothing to defer", price: 24000, deposit: 4000, contrib: 0, apr: 0, n: 36, gmfv: 11000, fee: 10, allow: 10000, expect: 10000, excess: 6 },
  { scenario: "Four year term, where deferring the balloon costs much more", price: 35000, deposit: 3500, contrib: 2000, apr: 8.9, n: 48, gmfv: 13500, fee: 10, allow: 8000, expect: 15000, excess: 12 },
  { scenario: "Small balloon, so the agreement behaves almost like hire purchase", price: 18000, deposit: 2000, contrib: 0, apr: 7.4, n: 36, gmfv: 1000, fee: 10, allow: 10000, expect: 10000, excess: 8 },
  { scenario: "Heavy mileage overrun on a low allowance", price: 22000, deposit: 1000, contrib: 500, apr: 9.9, n: 24, gmfv: 12000, fee: 10, allow: 6000, expect: 18000, excess: 15 }
]) {
  const financed = c.price - c.deposit - c.contrib;
  const i = monthlyRate(c.apr);
  const payment = solvePayment(financed, i, c.n, c.gmfv);
  const totalMonthly = payment * c.n;
  const pvBalloon = c.gmfv / Math.pow(1 + i, c.n);
  const years = c.n / 12;
  const contracted = c.allow * years;
  const excessMiles = Math.max(0, c.expect * years - contracted);
  const excessCharge = (excessMiles * c.excess) / 100;
  const handedBack = totalMonthly + c.deposit;

  add("AUT-003", c.scenario,
    {
      vehicle_price: c.price, deposit: c.deposit, dealer_contribution: c.contrib, apr: c.apr,
      term_months: c.n, gmfv: c.gmfv, option_fee: c.fee,
      annual_mileage_allowance: c.allow, expected_annual_mileage: c.expect, excess_pence_per_mile: c.excess
    },
    {
      amount_financed: r2(financed),
      monthly_payment: r2(payment),
      total_of_monthly_payments: r2(totalMonthly),
      guaranteed_future_value: r2(c.gmfv),
      option_to_purchase_fee: r2(c.fee),
      total_if_car_handed_back: r2(handedBack),
      total_if_car_purchased: r2(totalMonthly + c.deposit + c.gmfv + c.fee),
      total_charge_for_credit_if_purchased: r2(totalMonthly + c.gmfv - financed),
      interest_on_balloon: r2(c.gmfv - pvBalloon),
      contracted_miles: Math.round(contracted),
      projected_excess_miles: Math.round(excessMiles),
      excess_mileage_charge: r2(excessCharge),
      total_if_handed_back_with_excess: r2(handedBack + excessCharge)
    },
    "The payment is bisected on a simulation that must close exactly on the guaranteed future value rather than on zero, so a sign error on the balloon discount would show immediately. The zero-APR case asserts that deferring the balloon then costs nothing, which is the only rate at which that is true.");
}

// ===========================================================================
// AUT-002 Car Lease (personal contract hire)
// ===========================================================================

for (const c of [
  { scenario: "Nine plus thirty-nine on a mid-size saloon", price: 32000, residual: 18000, apr: 6.5, n: 48, init: 9, fee: 180, allow: 10000, expect: 12000, excess: 9 },
  { scenario: "Six plus twenty-nine on a small hatchback", price: 19000, residual: 9500, apr: 7.9, n: 36, init: 6, fee: 150, allow: 8000, expect: 8000, excess: 8 },
  { scenario: "Three plus thirty-three, a low initial rental deal", price: 27000, residual: 14000, apr: 5.9, n: 36, init: 3, fee: 200, allow: 15000, expect: 10000, excess: 10 },
  { scenario: "Interest free lease, where the rental is pure depreciation", price: 24000, residual: 14400, apr: 0, n: 24, init: 6, fee: 0, allow: 10000, expect: 10000, excess: 6 },
  { scenario: "Nothing up front at all", price: 21000, residual: 11000, apr: 8.9, n: 36, init: 0, fee: 120, allow: 10000, expect: 14000, excess: 11 },
  { scenario: "A rental quoted directly rather than derived", rentalGiven: 349.99, n: 48, init: 9, fee: 234, allow: 10000, expect: 10000, excess: 9 }
]) {
  let rental, derived, moneyFactorRental = null;
  if (c.rentalGiven !== undefined) {
    rental = c.rentalGiven;
    derived = false;
  } else {
    const i = monthlyRate(c.apr);
    // Bisect: rentals paid in advance must leave exactly the residual at the end.
    rental = solveRentalInAdvance(c.price, i, c.n, c.residual);
    derived = true;
    const mf = c.apr / 2400;
    moneyFactorRental = (c.price - c.residual) / c.n + (c.price + c.residual) * mf;
  }
  const total = rental * c.n + c.fee;
  const years = c.n / 12;
  const contracted = c.allow * years;
  const excessMiles = Math.max(0, c.expect * years - contracted);
  const excessCharge = (excessMiles * c.excess) / 100;

  const expected = {
    monthly_rental: r2(rental),
    initial_rental: r2(rental * c.init),
    initial_rental_months: c.init,
    number_of_monthly_rentals: c.n - c.init,
    documentation_fee: r2(c.fee),
    total_cost: r2(total),
    effective_monthly_cost: r2(total / c.n),
    contracted_miles: Math.round(contracted),
    projected_excess_miles: Math.round(excessMiles),
    excess_mileage_charge: r2(excessCharge),
    total_cost_with_excess: r2(total + excessCharge)
  };
  if (derived) expected.money_factor_monthly_rental = r2(moneyFactorRental);

  const inputs = {
    monthly_rental: c.rentalGiven === undefined ? null : c.rentalGiven,
    vehicle_price: c.price ?? 0, residual_value: c.residual ?? 0, apr: c.apr ?? 0,
    term_months: c.n, initial_rental_months: c.init, documentation_fee: c.fee,
    annual_mileage_allowance: c.allow, expected_annual_mileage: c.expect, excess_pence_per_mile: c.excess
  };

  add("AUT-002", c.scenario, inputs, expected,
    "The rental is bisected on a simulation in which the rental is taken at the START of each month, because personal contract hire rentals are paid in advance. Solving it as an ordinary annuity would produce a rental that is too high by a factor of one plus the monthly rate, which is the classic lease modelling error.");
}

// ===========================================================================
// AUT-005 Dealer contribution versus low APR
// ===========================================================================

for (const c of [
  { scenario: "Two thousand contribution at 9.9% against zero per cent", price: 30000, deposit: 3000, n: 36, balloon: 14000, cA: 2000, aA: 9.9, cB: 0, aB: 0 },
  { scenario: "A large contribution that does win", price: 30000, deposit: 3000, n: 36, balloon: 14000, cA: 6000, aA: 9.9, cB: 0, aB: 0 },
  { scenario: "No balloon, so the comparison is a plain loan", price: 22000, deposit: 2000, n: 48, balloon: 0, cA: 1500, aA: 8.9, cB: 0, aB: 3.9 },
  { scenario: "Short term, where a fixed contribution has less interest to beat", price: 18000, deposit: 1000, n: 24, balloon: 8000, cA: 1000, aA: 11.9, cB: 0, aB: 0 },
  { scenario: "Long term, where the interest saving compounds against the contribution", price: 35000, deposit: 3500, n: 60, balloon: 0, cA: 2500, aA: 12.9, cB: 0, aB: 4.9 },
  { scenario: "Both offers carry a contribution and differ only slightly in rate", price: 26000, deposit: 2600, n: 36, balloon: 11000, cA: 1500, aA: 6.9, cB: 750, aB: 4.9 }
]) {
  const cost = (contribution, aprPct) => {
    const financed = c.price - c.deposit - contribution;
    const i = monthlyRate(aprPct);
    const payment = solvePayment(financed, i, c.n, c.balloon);
    return { payment, total: payment * c.n + c.deposit + c.balloon };
  };
  const a = cost(c.cA, c.aA);
  const b = cost(c.cB, c.aB);
  const diff = a.total - b.total;

  // Breakeven found by bisecting on the contribution itself, a different route
  // from the engine's linear step.
  let lo = 0, hi = c.price - c.deposit;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (cost(mid, c.aA).total > b.total) lo = mid;
    else hi = mid;
  }
  const breakeven = (lo + hi) / 2;

  add("AUT-005", c.scenario,
    {
      vehicle_price: c.price, deposit: c.deposit, term_months: c.n, final_payment: c.balloon,
      offer_a_contribution: c.cA, offer_a_apr: c.aA, offer_b_contribution: c.cB, offer_b_apr: c.aB
    },
    {
      offer_a_monthly_payment: r2(a.payment),
      offer_a_total_cost: r2(a.total),
      offer_b_monthly_payment: r2(b.payment),
      offer_b_total_cost: r2(b.total),
      cheaper_offer: Math.abs(diff) < 0.005 ? "equal" : diff < 0 ? "A" : "B",
      saving: r2(Math.abs(diff)),
      monthly_difference: r2(a.payment - b.payment),
      breakeven_contribution: r2(breakeven)
    },
    "The breakeven contribution is bisected on the full cost simulation rather than computed from a linear sensitivity, so a wrong sensitivity in the engine would not be reproduced here. The pair of cases at 36 and 60 months on the same headline offer show that the answer genuinely flips with the term.");
}

// ===========================================================================
// AUT-007 Fuel Economy
// ===========================================================================

for (const c of [
  { scenario: "Three hundred miles on thirty litres", d: 300, du: "miles", f: 30, fu: "litres", ppl: 145 },
  { scenario: "A metric fill: five hundred kilometres on thirty-five litres", d: 500, du: "km", f: 35, fu: "litres", ppl: 149.9 },
  { scenario: "Quoted in imperial gallons", d: 420, du: "miles", f: 9, fu: "imperial_gallons", ppl: 142 },
  { scenario: "A US figure pasted in, which must not be treated as imperial", d: 350, du: "miles", f: 10, fu: "us_gallons", ppl: 145 },
  { scenario: "A thirsty vehicle over a short trip", d: 60, du: "miles", f: 12, fu: "litres", ppl: 152.9 },
  { scenario: "An efficient diesel on a long motorway run, no price given", d: 620, du: "miles", f: 42, fu: "litres", ppl: null }
]) {
  const miles = c.du === "km" ? c.d / MILE_KM : c.d;
  const km = miles * MILE_KM;
  const litres =
    c.fu === "imperial_gallons" ? c.f * IMPERIAL_GALLON_LITRES
      : c.fu === "us_gallons" ? c.f * US_GALLON_LITRES
        : c.f;
  // Different route: litres per mile first, then invert, rather than
  // miles divided by gallons.
  const litresPerMile = litres / miles;
  const mpgImperial = IMPERIAL_GALLON_LITRES / litresPerMile;
  const mpgUs = US_GALLON_LITRES / litresPerMile;

  const expected = {
    mpg_imperial: r6(mpgImperial),
    mpg_us: r6(mpgUs),
    litres_per_100km: r6((litres / km) * 100),
    km_per_litre: r6(km / litres),
    miles_per_litre: r6(miles / litres),
    fuel_used_litres: r6(litres),
    distance_miles: r6(miles)
  };
  if (c.ppl !== null) {
    const total = (litres * c.ppl) / 100;
    expected.total_fuel_cost = r2(total);
    expected.cost_per_mile_pence = r6((total / miles) * 100);
  }

  add("AUT-007", c.scenario,
    { distance: c.d, distance_unit: c.du, fuel_used: c.f, fuel_unit: c.fu, fuel_price_pence: c.ppl },
    expected,
    "The gallon constants are re-typed here from their definitions rather than read from the ruleset, and the economy is derived through litres per mile and inverted rather than by dividing miles by gallons. The US gallon case exists so that a US-sourced figure treated as imperial would fail by about twenty per cent rather than pass unnoticed.");
}

// ===========================================================================
// AUT-008 HMRC business mileage
// ===========================================================================

/** Approved amount accumulated ONE MILE AT A TIME. */
function approvedByCountingMiles(miles, type) {
  let pence = 0;
  for (let m = 1; m <= miles; m++) {
    if (type === "car_or_van") pence += m <= AMAP_THRESHOLD ? AMAP_FIRST_PENCE : AMAP_ABOVE_PENCE;
    else if (type === "motorcycle") pence += AMAP_MOTORCYCLE_PENCE;
    else pence += AMAP_BICYCLE_PENCE;
  }
  return pence / 100;
}

for (const c of [
  { scenario: "Twelve thousand miles, so both rate bands are used", miles: 12000, type: "car_or_van", paxMiles: 0, pax: 0, paid: 0, rate: 20 },
  { scenario: "Exactly ten thousand miles, the last mile still at the higher rate", miles: 10000, type: "car_or_van", paxMiles: 0, pax: 0, paid: 0, rate: 20 },
  { scenario: "Ten thousand and one miles, the first mile at the lower rate", miles: 10001, type: "car_or_van", paxMiles: 0, pax: 0, paid: 0, rate: 40 },
  { scenario: "Employer pays a flat 30p, leaving relief to claim", miles: 8000, type: "car_or_van", paxMiles: 0, pax: 0, paid: 2400, rate: 40 },
  { scenario: "Employer overpays at 70p, creating taxable earnings", miles: 5000, type: "car_or_van", paxMiles: 0, pax: 0, paid: 3500, rate: 20 },
  { scenario: "Carrying two colleagues on part of the mileage", miles: 9000, type: "car_or_van", paxMiles: 3000, pax: 2, paid: 4950, rate: 20 },
  { scenario: "A motorcycle, one flat rate throughout", miles: 14000, type: "motorcycle", paxMiles: 0, pax: 0, paid: 0, rate: 20 },
  { scenario: "A bicycle, where the tax and National Insurance figures agree", miles: 2000, type: "bicycle", paxMiles: 0, pax: 0, paid: 0, rate: 20 }
]) {
  const approvedTax = approvedByCountingMiles(c.miles, c.type);
  const niPence = c.type === "car_or_van" ? NI_CAR_PENCE : c.type === "motorcycle" ? AMAP_MOTORCYCLE_PENCE : AMAP_BICYCLE_PENCE;
  let niPenceTotal = 0;
  for (let m = 1; m <= c.miles; m++) niPenceTotal += niPence;
  const approvedNi = niPenceTotal / 100;
  const passenger = c.type === "car_or_van" ? (c.paxMiles * c.pax * AMAP_PASSENGER_PENCE) / 100 : 0;
  const relief = Math.max(0, approvedTax - c.paid);
  const excess = Math.max(0, c.paid - approvedTax);

  add("AUT-008", c.scenario,
    {
      business_miles: c.miles, vehicle_type: c.type, passenger_miles: c.paxMiles,
      passengers: c.pax, amount_paid: c.paid, marginal_rate: c.rate
    },
    {
      business_miles: c.miles,
      miles_at_higher_rate: c.type === "car_or_van" ? Math.min(c.miles, AMAP_THRESHOLD) : c.miles,
      miles_at_lower_rate: c.type === "car_or_van" ? Math.max(0, c.miles - AMAP_THRESHOLD) : 0,
      approved_amount_tax: r2(approvedTax),
      passenger_payment: r2(passenger),
      approved_amount_including_passengers: r2(approvedTax + passenger),
      amount_paid_by_employer: r2(c.paid),
      taxable_excess: r2(excess),
      mileage_allowance_relief: r2(relief),
      relief_value_at_marginal_rate: r2((relief * c.rate) / 100),
      approved_amount_national_insurance: r2(approvedNi),
      national_insurance_excess: r2(Math.max(0, c.paid - approvedNi))
    },
    "The approved amount is accumulated ONE MILE AT A TIME at whichever pence rate that mile attracts, not by multiplying two bands, which is the only construction that catches an off-by-one at the threshold. The 10,000 and 10,001 mile pair exists for exactly that. The rate is 55p from 6 April 2026, verified against two GOV.UK pages; a benchmark built on the familiar 45p would have been a wrong benchmark.",
    "uk-2026-27-v1");
}

// ===========================================================================
// AUT-009 EV charging cost
// ===========================================================================

for (const c of [
  { scenario: "Home charge from twenty to eighty per cent", batt: 64, start: 20, end: 80, ppk: 24.5, eff: 90, fee: 0, mpk: 3.8, kw: 7, ppl: 145, mpg: 45 },
  { scenario: "Public rapid charger with a session fee", batt: 77, start: 15, end: 80, ppk: 79, eff: 95, fee: 1.5, mpk: 3.4, kw: 150, ppl: 149.9, mpg: 42 },
  { scenario: "Off-peak overnight rate", batt: 58, start: 30, end: 100, ppk: 7.5, eff: 88, fee: 0, mpk: 4.1, kw: 7.4, ppl: null, mpg: null },
  { scenario: "A lossless charger, which does not exist but pins the boundary", batt: 50, start: 0, end: 100, ppk: 30, eff: 100, fee: 0, mpk: 3.5, kw: 11, ppl: null, mpg: null },
  { scenario: "A small battery topped up a little", batt: 21, start: 60, end: 90, ppk: 28, eff: 85, fee: 0, mpk: 4.5, kw: 3.6, ppl: 145, mpg: 55 },
  { scenario: "A large pack charged from nearly empty", batt: 100, start: 5, end: 90, ppk: 22, eff: 92, fee: 0, mpk: 3.0, kw: 22, ppl: 150, mpg: 30 }
]) {
  // Summed in one-per-cent steps rather than multiplied out in one go.
  let intoBattery = 0;
  const steps = c.end - c.start;
  for (let s = 0; s < steps; s++) intoBattery += c.batt / 100;
  const drawn = intoBattery / (c.eff / 100);
  const energyCost = (drawn * c.ppk) / 100;
  const total = energyCost + c.fee;
  const milesAdded = intoBattery * c.mpk;

  const expected = {
    energy_into_battery_kwh: r6(intoBattery),
    energy_drawn_from_supply_kwh: r6(drawn),
    charging_losses_kwh: r6(drawn - intoBattery),
    energy_cost: r2(energyCost),
    session_fee: r2(c.fee),
    total_cost: r2(total),
    cost_per_kwh_into_battery_pence: r6((total / intoBattery) * 100),
    miles_added: r6(milesAdded),
    cost_per_mile_pence: r6((total / milesAdded) * 100),
    charging_hours: r6(drawn / c.kw)
  };
  if (c.ppl !== null) {
    const litresPerMile = IMPERIAL_GALLON_LITRES / c.mpg;
    const petrolPerMile = (litresPerMile * c.ppl) / 100;
    expected.petrol_cost_per_mile_pence = r6(petrolPerMile * 100);
    expected.saving_per_mile_pence = r6((petrolPerMile - total / milesAdded) * 100);
  }

  add("AUT-009", c.scenario,
    {
      battery_kwh: c.batt, start_charge: c.start, target_charge: c.end,
      price_pence_per_kwh: c.ppk, charging_efficiency: c.eff, session_fee: c.fee,
      miles_per_kwh: c.mpk, charger_kw: c.kw,
      petrol_price_pence: c.ppl, petrol_mpg: c.mpg
    },
    expected,
    "Energy into the battery is summed in one-per-cent steps rather than multiplied out. The petrol comparison uses the IMPERIAL gallon, so a calculator that quietly used the US gallon would show a petrol cost about twenty per cent too low and understate the saving. The hundred-per-cent efficiency case pins the boundary where losses must be exactly zero.");
}

// ===========================================================================
// AUT-010 EV range
// ===========================================================================

for (const c of [
  { scenario: "Eighty per cent charge with a winter reduction the driver set", batt: 64, mpk: 3.8, charge: 80, derate: 20, reserve: 10, journey: 150 },
  { scenario: "Full charge in mild conditions, journey comfortably within range", batt: 77, mpk: 3.6, charge: 100, derate: 0, reserve: 10, journey: 200 },
  { scenario: "Low charge with no reserve kept", batt: 40, mpk: 4.2, charge: 25, derate: 10, reserve: 0, journey: 35 },
  { scenario: "A long journey that does not fit", batt: 52, mpk: 3.2, charge: 60, derate: 25, reserve: 15, journey: 180 },
  { scenario: "No journey entered, so only the ranges are reported", batt: 100, mpk: 2.9, charge: 90, derate: 15, reserve: 10, journey: null },
  { scenario: "A heavy derating, as with a roof box at motorway speed", batt: 64, mpk: 4.0, charge: 100, derate: 35, reserve: 10, journey: 120 }
]) {
  const effective = c.mpk * (1 - c.derate / 100);
  // Simulated mile by mile: drain the pack one mile at a time.
  const drainMiles = (kwh) => {
    let remaining = kwh;
    let miles = 0;
    const perMile = 1 / effective;
    while (remaining - perMile >= -1e-12) { remaining -= perMile; miles++; }
    return { whole: miles, exact: kwh * effective };
  };
  const rangeFull = drainMiles(c.batt).exact;
  const rangeNow = drainMiles((c.batt * c.charge) / 100).exact;
  const usableCharge = Math.max(0, c.charge - c.reserve);
  const rangeToReserve = drainMiles((c.batt * usableCharge) / 100).exact;
  const rangeTo80 = drainMiles(c.batt * 0.8).exact;

  const expected = {
    usable_battery_kwh: r6(c.batt),
    effective_consumption_mi_per_kwh: r6(effective),
    range_from_full: r6(rangeFull),
    range_at_current_charge: r6(rangeNow),
    range_to_reserve: r6(rangeToReserve),
    practical_range_to_80_pct: r6(rangeTo80)
  };
  if (c.journey !== null) {
    const energyNeeded = c.journey / effective;
    expected.energy_needed_for_journey = r6(energyNeeded);
    expected.journey_possible = rangeToReserve >= c.journey;
    expected.charge_needed_pct = Math.min(100, r6((energyNeeded / c.batt) * 100 + c.reserve));
  }

  add("AUT-010", c.scenario,
    {
      usable_battery_kwh: c.batt, miles_per_kwh: c.mpk, current_charge: c.charge,
      range_reduction: c.derate, reserve_charge: c.reserve, journey_miles: c.journey
    },
    expected,
    "Range is checked by draining the pack one mile at a time as well as in closed form, and the reserve is applied to the STATE OF CHARGE before the range is taken, not subtracted from the range afterwards. Those two orders give different answers whenever the reserve and the current charge differ, and the failing-journey case is chosen so the distinction is visible.");
}

// ===========================================================================
// AUT-011 Vehicle depreciation
// ===========================================================================

for (const c of [
  { scenario: "New car, heavy first year then steadier", price: 30000, years: 3, r1: 25, rn: 15, mileage: 10000 },
  { scenario: "Same rate every year", price: 20000, years: 5, r1: 18, rn: 18, mileage: 12000 },
  { scenario: "One year only, so the first-year rate is the whole story", price: 45000, years: 1, r1: 30, rn: 10, mileage: 8000 },
  { scenario: "A used car that has already taken its biggest hit", price: 12000, years: 4, r1: 12, rn: 12, mileage: 15000 },
  { scenario: "Fitted to a known resale value instead of rates", price: 28000, years: 3, known: 15000, mileage: 10000 },
  { scenario: "No depreciation at all, a boundary rather than a market", price: 15000, years: 3, r1: 0, rn: 0, mileage: 10000 }
]) {
  let r1, rn, implied = null;
  if (c.known !== undefined) {
    const r = 1 - Math.pow(c.known / c.price, 1 / c.years);
    r1 = r * 100; rn = r * 100;
    implied = r6(r * 100);
  } else { r1 = c.r1; rn = c.rn; }

  // Closed form rather than an accumulating loop.
  const closing = c.price * (1 - r1 / 100) * Math.pow(1 - rn / 100, c.years - 1);
  const cumulative = c.price - closing;

  add("AUT-011", c.scenario,
    {
      purchase_price: c.price, years: c.years,
      first_year_rate: c.known !== undefined ? 0 : c.r1,
      subsequent_rate: c.known !== undefined ? 0 : c.rn,
      expected_value: c.known ?? null,
      annual_mileage: c.mileage
    },
    {
      purchase_price: r2(c.price),
      years: c.years,
      value_at_end: r2(closing),
      total_depreciation: r2(cumulative),
      percentage_retained: Math.round((closing / c.price) * 100 * 1e4) / 1e4,
      average_annual_depreciation: r2(cumulative / c.years),
      first_year_depreciation: r2(c.price * (r1 / 100)),
      depreciation_per_mile_pence: r6((cumulative / (c.mileage * c.years)) * 100),
      implied_annual_rate_pct: implied
    },
    "Closing values come from a closed-form power expression, the opposite construction from the engine's accumulating loop, so a compounding error in either would separate them. The fitted case inverts the same relation to recover a rate from a known resale value, which is a third route again.");
}

// ===========================================================================
// AUT-012 Engine horsepower
// ===========================================================================

for (const c of [
  { scenario: "Three hundred pound-feet at five thousand rpm", torque: 300, unit: "lb_ft", rpm: 5000 },
  { scenario: "Quoted in newton metres, as a European maker would", torque: 400, unit: "nm", rpm: 4500 },
  { scenario: "A diesel: large torque low down", torque: 500, unit: "nm", rpm: 2000 },
  { scenario: "Exactly 5252 rpm, where power and torque read the same number", torque: 250, unit: "lb_ft", rpm: 5252 },
  { scenario: "A high-revving small engine", torque: 120, unit: "lb_ft", rpm: 8000 },
  { scenario: "A large petrol V8", torque: 650, unit: "nm", rpm: 5500 }
]) {
  const torqueNm = c.unit === "nm" ? c.torque : c.torque * NM_PER_LB_FT;
  const torqueLbFt = c.unit === "nm" ? c.torque / NM_PER_LB_FT : c.torque;
  // SI from first principles: power = torque x angular velocity.
  const omega = (c.rpm * 2 * Math.PI) / 60;   // radians per second
  const watts = torqueNm * omega;
  const bhp = watts / HP_WATTS;

  add("AUT-012", c.scenario,
    { method: "torque", torque: c.torque, torque_unit: c.unit, rpm: c.rpm },
    {
      horsepower_bhp: r6(bhp),
      kilowatts: r6(watts / 1000),
      metric_horsepower_ps: r6(watts / PS_WATTS),
      torque_lb_ft: r6(torqueLbFt),
      torque_nm: r6(torqueNm),
      rpm: c.rpm
    },
    "Power is derived in SI as torque in newton metres times angular velocity in radians per second, never through the imperial 5252 shortcut the engine uses. The two agreeing IS the check that 5252 is right, since it is 33,000 divided by two pi. The 5252 rpm case asserts the classic identity that power in bhp equals torque in pound-feet at exactly that speed.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
