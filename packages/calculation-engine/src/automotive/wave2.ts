/**
 * Wave 2 Automotive & Travel calculators (AUT-001 to AUT-012).
 *
 * Two themes run through this module and are worth stating once.
 *
 * UNITS. Every fuel and distance figure is derived from the constants held in
 * the versioned ruleset, not from literals scattered through the code. The
 * single most common defect in a British fuel calculator is quoting miles per
 * gallon on the US gallon, which flatters economy by about twenty per cent
 * because a US gallon is 3.785 litres against the imperial 4.546.
 *
 * CAR FINANCE. Personal loan, hire purchase, personal contract purchase and
 * personal contract hire are FOUR DIFFERENT CONTRACTS, not four presentations
 * of one. They differ in who owns the car, in whether interest is charged on
 * a balloon that is never repaid from capital, and in whether mileage is
 * capped. They are therefore modelled separately rather than through one
 * parameterised routine with the differences hidden in flags.
 */
import { assertMoney, assertFiniteNumber } from "../common/validation.js";

/** Longest finance or lease term this module will model, in months. */
export const MAX_TERM_MONTHS = 120;

export interface MotoringUnits {
  imperial_gallon_litres: number;
  us_gallon_litres: number;
  mile_kilometres: number;
  mechanical_horsepower_watts: number;
  metric_horsepower_ps_watts: number;
}

/** Pull the unit constants from the ruleset, refusing to fall back to guesses. */
export function unitsFrom(rules: any): MotoringUnits {
  const u = rules?.motoring?.units;
  if (!u || typeof u.imperial_gallon_litres !== "number") {
    throw new Error(
      "The motoring unit constants are missing from the ruleset for this tax year, so this calculator cannot run."
    );
  }
  return u as MotoringUnits;
}

export function assertTermMonths(value: unknown, label = "Term"): number {
  const months = assertFiniteNumber(value, label);
  if (!Number.isInteger(months)) {
    throw new Error(`${label} must be a whole number of months.`);
  }
  if (months < 1) {
    throw new Error(`${label} must be at least one month.`);
  }
  if (months > MAX_TERM_MONTHS) {
    throw new Error(`${label} cannot be longer than ${MAX_TERM_MONTHS} months.`);
  }
  return months;
}

export function assertRatePct(value: unknown, label: string): number {
  const rate = assertFiniteNumber(value, label);
  if (rate < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  if (rate > 100) {
    throw new Error(`${label} above 100% is not something this calculator will model.`);
  }
  return rate;
}

/**
 * The monthly rate that compounds to a given APR.
 *
 * APR is an ANNUAL EFFECTIVE rate under the Consumer Credit Directive, so the
 * monthly rate is the twelfth root of one plus the APR, not the APR divided by
 * twelve. Dividing by twelve is the nominal convention, and using it where a
 * lender quotes APR understates the monthly payment: at 9.9% APR over four
 * years the difference is real money, not rounding. Both are exposed so a
 * quote can be reproduced whichever convention the lender used.
 */
export function monthlyRateFromApr(aprPct: number): number {
  return Math.pow(1 + aprPct / 100, 1 / 12) - 1;
}

/** The nominal convention: annual rate divided by twelve. */
export function monthlyRateNominal(annualPct: number): number {
  return annualPct / 100 / 12;
}

/** Ordinary annuity factor: present value of 1 per period for n periods. */
export function annuityFactor(i: number, n: number): number {
  if (i === 0) return n;
  return (1 - Math.pow(1 + i, -n)) / i;
}

/** Payment that amortises `principal` over `n` months at monthly rate `i`,
 *  leaving `balloon` outstanding at the end. */
export function paymentWithBalloon(
  principal: number,
  i: number,
  n: number,
  balloon: number
): number {
  const pvBalloon = balloon / Math.pow(1 + i, n);
  const financed = principal - pvBalloon;
  const factor = annuityFactor(i, n);
  if (factor <= 0) {
    throw new Error("The term must be at least one month.");
  }
  return financed / factor;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// AUT-001 Car Loan (unsecured personal loan)
// ---------------------------------------------------------------------------

export interface CarLoanResult {
  amount_borrowed: number;
  monthly_payment: number;
  total_repayable: number;
  total_interest: number;
  total_cost_including_deposit: number;
  monthly_payment_nominal_convention: number;
  effective_monthly_rate_pct: number;
}

export function carLoan(
  vehiclePrice: number,
  deposit: number,
  partExchange: number,
  aprPct: number,
  termMonths: number,
  fee: number,
  feeFinanced: boolean
): CarLoanResult {
  const price = assertMoney(vehiclePrice, "Vehicle price");
  const dep = assertMoney(deposit, "Deposit");
  const px = assertMoney(partExchange, "Part exchange value");
  const apr = assertRatePct(aprPct, "APR");
  const n = assertTermMonths(termMonths, "Term");
  const f = assertMoney(fee, "Fee");

  const contributed = dep + px;
  if (contributed > price) {
    throw new Error(
      "The deposit and part exchange together are more than the vehicle price, so there is nothing to borrow. Check the figures."
    );
  }
  const borrowed = price - contributed + (feeFinanced ? f : 0);
  const i = monthlyRateFromApr(apr);
  const payment = borrowed / annuityFactor(i, n);
  const totalRepayable = payment * n;

  const iNominal = monthlyRateNominal(apr);
  const paymentNominal = borrowed / annuityFactor(iNominal, n);

  return {
    amount_borrowed: round2(borrowed),
    monthly_payment: round2(payment),
    total_repayable: round2(totalRepayable),
    total_interest: round2(totalRepayable - borrowed),
    total_cost_including_deposit: round2(totalRepayable + contributed + (feeFinanced ? 0 : f)),
    monthly_payment_nominal_convention: round2(paymentNominal),
    effective_monthly_rate_pct: Math.round(i * 1e10) / 1e8
  };
}

// ---------------------------------------------------------------------------
// AUT-004 Hire Purchase
// ---------------------------------------------------------------------------

export interface HirePurchaseResult {
  amount_financed: number;
  monthly_payment: number;
  total_of_monthly_payments: number;
  option_to_purchase_fee: number;
  total_amount_payable: number;
  total_charge_for_credit: number;
  /** Point at which the Consumer Credit Act 1974 s.90 protection begins. */
  one_third_paid_amount: number;
  months_until_one_third_paid: number;
  half_paid_amount: number;
  months_until_half_paid: number;
}

export function hirePurchase(
  vehiclePrice: number,
  deposit: number,
  aprPct: number,
  termMonths: number,
  optionFee: number
): HirePurchaseResult {
  const price = assertMoney(vehiclePrice, "Vehicle price");
  const dep = assertMoney(deposit, "Deposit");
  const apr = assertRatePct(aprPct, "APR");
  const n = assertTermMonths(termMonths, "Term");
  const optFee = assertMoney(optionFee, "Option to purchase fee");

  if (dep > price) {
    throw new Error("The deposit is more than the vehicle price. Check the figures.");
  }
  const financed = price - dep;
  const i = monthlyRateFromApr(apr);
  const payment = financed / annuityFactor(i, n);
  const totalMonthly = payment * n;
  const totalPayable = totalMonthly + dep + optFee;

  // Statutory protection thresholds are measured against the TOTAL amount
  // payable under the agreement, which includes the deposit and the option fee,
  // not against the amount financed.
  const oneThird = totalPayable / 3;
  const half = totalPayable / 2;

  const monthsTo = (target: number): number => {
    let paid = dep;
    if (paid >= target) return 0;
    for (let m = 1; m <= n; m++) {
      paid += payment;
      if (paid >= target) return m;
    }
    return n;
  };

  return {
    amount_financed: round2(financed),
    monthly_payment: round2(payment),
    total_of_monthly_payments: round2(totalMonthly),
    option_to_purchase_fee: round2(optFee),
    total_amount_payable: round2(totalPayable),
    total_charge_for_credit: round2(totalPayable - price),
    one_third_paid_amount: round2(oneThird),
    months_until_one_third_paid: monthsTo(oneThird),
    half_paid_amount: round2(half),
    months_until_half_paid: monthsTo(half)
  };
}

// ---------------------------------------------------------------------------
// AUT-003 Personal Contract Purchase
// ---------------------------------------------------------------------------

export interface PcpResult {
  amount_financed: number;
  monthly_payment: number;
  total_of_monthly_payments: number;
  guaranteed_future_value: number;
  option_to_purchase_fee: number;
  total_if_car_handed_back: number;
  total_if_car_purchased: number;
  total_charge_for_credit_if_purchased: number;
  /** Interest that accrues on the balloon and is paid in the monthlies. */
  interest_on_balloon: number;
  contracted_miles: number;
  projected_excess_miles: number;
  excess_mileage_charge: number;
  total_if_handed_back_with_excess: number;
}

export function pcp(
  vehiclePrice: number,
  deposit: number,
  dealerContribution: number,
  aprPct: number,
  termMonths: number,
  gmfv: number,
  optionFee: number,
  annualMileageAllowance: number,
  projectedAnnualMileage: number,
  excessPencePerMile: number
): PcpResult {
  const price = assertMoney(vehiclePrice, "Vehicle price");
  const dep = assertMoney(deposit, "Deposit");
  const contrib = assertMoney(dealerContribution, "Dealer contribution");
  const apr = assertRatePct(aprPct, "APR");
  const n = assertTermMonths(termMonths, "Term");
  const balloon = assertMoney(gmfv, "Guaranteed future value");
  const optFee = assertMoney(optionFee, "Option to purchase fee");
  const allowance = assertFiniteNumber(annualMileageAllowance, "Annual mileage allowance");
  const projected = assertFiniteNumber(projectedAnnualMileage, "Expected annual mileage");
  const excessPence = assertFiniteNumber(excessPencePerMile, "Excess mileage charge");

  if (allowance < 0 || projected < 0 || excessPence < 0) {
    throw new Error("Mileage figures and the excess charge cannot be negative.");
  }
  const upfront = dep + contrib;
  if (upfront > price) {
    throw new Error(
      "The deposit and dealer contribution together are more than the vehicle price. Check the figures."
    );
  }
  if (balloon > price - upfront) {
    throw new Error(
      "The guaranteed future value is more than the amount being financed, so there would be nothing to repay. Check the figures."
    );
  }

  const financed = price - upfront;
  const i = monthlyRateFromApr(apr);
  const payment = paymentWithBalloon(financed, i, n, balloon);
  const totalMonthly = payment * n;

  // The debt splits exactly into two parts: an amortising part, repaid by the
  // monthly payments, and a deferred part equal to the present value of the
  // balloon, which is never repaid from capital and simply accrues until the
  // balloon falls due. The interest attributable to the balloon is therefore
  // the balloon less its present value. That figure is the whole reason a PCP
  // monthly looks cheap and the cost of actually owning the car does not.
  const pvBalloon = balloon / Math.pow(1 + i, n);
  const balloonInterest = balloon - pvBalloon;
  const totalInterest = totalMonthly + balloon - financed;

  const years = n / 12;
  const contracted = allowance * years;
  const projectedTotal = projected * years;
  const excessMiles = Math.max(0, projectedTotal - contracted);
  const excessCharge = (excessMiles * excessPence) / 100;

  const handedBack = totalMonthly + dep;
  const purchased = totalMonthly + dep + balloon + optFee;

  return {
    amount_financed: round2(financed),
    monthly_payment: round2(payment),
    total_of_monthly_payments: round2(totalMonthly),
    guaranteed_future_value: round2(balloon),
    option_to_purchase_fee: round2(optFee),
    total_if_car_handed_back: round2(handedBack),
    total_if_car_purchased: round2(purchased),
    total_charge_for_credit_if_purchased: round2(totalInterest),
    interest_on_balloon: round2(balloonInterest),
    contracted_miles: Math.round(contracted),
    projected_excess_miles: Math.round(excessMiles),
    excess_mileage_charge: round2(excessCharge),
    total_if_handed_back_with_excess: round2(handedBack + excessCharge)
  };
}

// ---------------------------------------------------------------------------
// AUT-002 Personal Contract Hire (car lease)
// ---------------------------------------------------------------------------

export interface CarLeaseResult {
  monthly_rental: number;
  initial_rental: number;
  initial_rental_months: number;
  documentation_fee: number;
  number_of_monthly_rentals: number;
  total_cost: number;
  effective_monthly_cost: number;
  contracted_miles: number;
  projected_excess_miles: number;
  excess_mileage_charge: number;
  total_cost_with_excess: number;
  /** The dealer money-factor approximation, for comparison only. */
  money_factor_monthly_rental: number | null;
  rental_was_derived: boolean;
}

/**
 * A UK personal contract hire quote.
 *
 * Quotes are expressed as "9+35": nine monthly rentals up front, then
 * thirty-five. The initial rental is NOT a deposit; it is rent paid in
 * advance, it buys no equity, and it is not refundable.
 *
 * If a monthly rental is supplied it is used as given. Otherwise it is derived
 * from the vehicle price and residual value as an annuity in advance, which is
 * exact. The money-factor formula dealers use is reported alongside so the two
 * can be compared: it is an approximation, and it is not the same number.
 */
export function carLease(
  monthlyRentalGiven: number | null,
  vehiclePrice: number,
  residualValue: number,
  aprPct: number,
  termMonths: number,
  initialRentalMonths: number,
  documentationFee: number,
  annualMileageAllowance: number,
  projectedAnnualMileage: number,
  excessPencePerMile: number
): CarLeaseResult {
  const n = assertTermMonths(termMonths, "Term");
  const initMonths = assertFiniteNumber(initialRentalMonths, "Initial rental months");
  if (initMonths < 0 || !Number.isInteger(initMonths)) {
    throw new Error("The initial rental must be a whole number of monthly rentals, and cannot be negative.");
  }
  if (initMonths >= n) {
    throw new Error(
      "The initial rental cannot be as large as the whole term. A 9+35 quote means nine rentals up front and thirty-five afterwards, so the term is 44 months."
    );
  }
  const fee = assertMoney(documentationFee, "Documentation fee");
  const allowance = assertFiniteNumber(annualMileageAllowance, "Annual mileage allowance");
  const projected = assertFiniteNumber(projectedAnnualMileage, "Expected annual mileage");
  const excessPence = assertFiniteNumber(excessPencePerMile, "Excess mileage charge");
  if (allowance < 0 || projected < 0 || excessPence < 0) {
    throw new Error("Mileage figures and the excess charge cannot be negative.");
  }

  let rental: number;
  let derived = false;
  let moneyFactorRental: number | null = null;

  if (monthlyRentalGiven !== null && monthlyRentalGiven !== undefined) {
    rental = assertMoney(monthlyRentalGiven, "Monthly rental");
  } else {
    const price = assertMoney(vehiclePrice, "Vehicle price");
    const residual = assertMoney(residualValue, "Residual value");
    const apr = assertRatePct(aprPct, "APR");
    if (residual > price) {
      throw new Error("The residual value cannot be more than the vehicle price.");
    }
    const i = monthlyRateFromApr(apr);
    // Rentals are paid in advance, so the annuity is an annuity-due.
    const dueFactor = annuityFactor(i, n) * (1 + i);
    const pvResidual = residual / Math.pow(1 + i, n);
    rental = (price - pvResidual) / dueFactor;
    derived = true;
    // The money-factor rule of thumb, shown so the gap is visible.
    const moneyFactor = apr / 2400;
    moneyFactorRental = (price - residual) / n + (price + residual) * moneyFactor;
  }

  // A 9+35 quote is 44 rentals in total: nine paid up front and thirty-five
  // monthly afterwards. The term is the whole 44 months.
  const total = rental * n + fee;
  const years = n / 12;
  const contracted = allowance * years;
  const projectedTotal = projected * years;
  const excessMiles = Math.max(0, projectedTotal - contracted);
  const excessCharge = (excessMiles * excessPence) / 100;

  return {
    monthly_rental: round2(rental),
    initial_rental: round2(rental * initMonths),
    initial_rental_months: initMonths,
    documentation_fee: round2(fee),
    number_of_monthly_rentals: n - initMonths,
    total_cost: round2(total),
    effective_monthly_cost: round2(total / n),
    contracted_miles: Math.round(contracted),
    projected_excess_miles: Math.round(excessMiles),
    excess_mileage_charge: round2(excessCharge),
    total_cost_with_excess: round2(total + excessCharge),
    money_factor_monthly_rental: moneyFactorRental === null ? null : round2(moneyFactorRental),
    rental_was_derived: derived
  };
}

// ---------------------------------------------------------------------------
// AUT-005 Dealer contribution versus low APR
// ---------------------------------------------------------------------------

export interface OfferComparisonResult {
  offer_a_monthly_payment: number;
  offer_a_total_cost: number;
  offer_b_monthly_payment: number;
  offer_b_total_cost: number;
  cheaper_offer: "A" | "B" | "equal";
  saving: number;
  /** Contribution at which offer A would exactly match offer B. */
  breakeven_contribution: number;
  monthly_difference: number;
}

/**
 * Two finance offers on the SAME car, compared on total cost to own.
 *
 * The comparison is genuinely counter-intuitive: a large deposit contribution
 * at a high APR and a small one at 0% cannot be ranked by inspection, and the
 * answer flips with the term and with the size of any balloon.
 */
export function compareOffers(
  vehiclePrice: number,
  deposit: number,
  termMonths: number,
  balloon: number,
  contributionA: number,
  aprA: number,
  contributionB: number,
  aprB: number
): OfferComparisonResult {
  const price = assertMoney(vehiclePrice, "Vehicle price");
  const dep = assertMoney(deposit, "Deposit");
  const n = assertTermMonths(termMonths, "Term");
  const bal = assertMoney(balloon, "Final payment");
  const cA = assertMoney(contributionA, "Offer A contribution");
  const cB = assertMoney(contributionB, "Offer B contribution");
  const rA = assertRatePct(aprA, "Offer A APR");
  const rB = assertRatePct(aprB, "Offer B APR");

  const cost = (contribution: number, aprPct: number): { payment: number; total: number } => {
    const financed = price - dep - contribution;
    if (financed < 0) {
      throw new Error("A contribution larger than the price after the deposit cannot be modelled.");
    }
    if (bal > financed) {
      throw new Error("The final payment is more than the amount financed. Check the figures.");
    }
    const i = monthlyRateFromApr(aprPct);
    const payment = paymentWithBalloon(financed, i, n, bal);
    return { payment, total: payment * n + dep + bal };
  };

  const a = cost(cA, rA);
  const b = cost(cB, rB);
  const diff = a.total - b.total;

  // Solve for the contribution that makes A's total equal B's. Total cost is
  // linear in the contribution at a fixed APR, so one secant step is exact.
  const i = monthlyRateFromApr(rA);
  const factor = annuityFactor(i, n);
  const perPound = n / factor; // change in total cost per £1 of contribution
  const breakeven = perPound === 0 ? cA : cA + diff / perPound;

  return {
    offer_a_monthly_payment: round2(a.payment),
    offer_a_total_cost: round2(a.total),
    offer_b_monthly_payment: round2(b.payment),
    offer_b_total_cost: round2(b.total),
    cheaper_offer: Math.abs(diff) < 0.005 ? "equal" : diff < 0 ? "A" : "B",
    saving: round2(Math.abs(diff)),
    breakeven_contribution: round2(breakeven),
    monthly_difference: round2(a.payment - b.payment)
  };
}

// ---------------------------------------------------------------------------
// AUT-007 Fuel Economy
// ---------------------------------------------------------------------------

export interface FuelEconomyResult {
  mpg_imperial: number;
  mpg_us: number;
  litres_per_100km: number;
  km_per_litre: number;
  miles_per_litre: number;
  fuel_used_litres: number;
  distance_miles: number;
  cost_per_mile_pence: number | null;
  total_fuel_cost: number | null;
}

/**
 * Fuel economy from a distance and a quantity of fuel.
 *
 * The imperial figure is the headline because that is what a British car
 * quotes and what a British driver means by "miles per gallon". The US figure
 * is given alongside precisely so the two are never confused: the same car is
 * about twenty per cent worse in US mpg.
 */
export function fuelEconomy(
  distance: number,
  distanceUnit: "miles" | "km",
  fuelUsed: number,
  fuelUnit: "litres" | "imperial_gallons" | "us_gallons",
  pencePerLitre: number | null,
  units: MotoringUnits
): FuelEconomyResult {
  const dist = assertFiniteNumber(distance, "Distance");
  const fuel = assertFiniteNumber(fuelUsed, "Fuel used");
  if (dist <= 0) {
    throw new Error("The distance must be greater than zero, otherwise there is no economy to measure.");
  }
  if (fuel <= 0) {
    throw new Error("The fuel used must be greater than zero, otherwise the economy would be infinite.");
  }

  const miles = distanceUnit === "km" ? dist / units.mile_kilometres : dist;
  const km = miles * units.mile_kilometres;
  const litres =
    fuelUnit === "imperial_gallons"
      ? fuel * units.imperial_gallon_litres
      : fuelUnit === "us_gallons"
        ? fuel * units.us_gallon_litres
        : fuel;

  const mpgImperial = miles / (litres / units.imperial_gallon_litres);
  const mpgUs = miles / (litres / units.us_gallon_litres);

  let costPerMile: number | null = null;
  let totalCost: number | null = null;
  if (pencePerLitre !== null && pencePerLitre !== undefined) {
    const ppl = assertFiniteNumber(pencePerLitre, "Fuel price");
    if (ppl < 0) throw new Error("The fuel price cannot be negative.");
    totalCost = (litres * ppl) / 100;
    costPerMile = totalCost / miles;
  }

  return {
    mpg_imperial: Math.round(mpgImperial * 1e6) / 1e6,
    mpg_us: Math.round(mpgUs * 1e6) / 1e6,
    litres_per_100km: Math.round((litres / km) * 100 * 1e6) / 1e6,
    km_per_litre: Math.round((km / litres) * 1e6) / 1e6,
    miles_per_litre: Math.round((miles / litres) * 1e6) / 1e6,
    fuel_used_litres: Math.round(litres * 1e6) / 1e6,
    distance_miles: Math.round(miles * 1e6) / 1e6,
    // Reported in PENCE a mile, because that is the unit a British driver
    // compares running costs in, and because rounding a per-mile figure to
    // whole pence of a pound would throw away the difference between 14.5p
    // and 15p, which is fifty pounds over ten thousand miles.
    cost_per_mile_pence: costPerMile === null ? null : Math.round(costPerMile * 100 * 1e6) / 1e6,
    total_fuel_cost: totalCost === null ? null : round2(totalCost)
  };
}

// ---------------------------------------------------------------------------
// AUT-008 HMRC business mileage
// ---------------------------------------------------------------------------

export type VehicleType = "car_or_van" | "motorcycle" | "bicycle";

export interface MileageResult {
  business_miles: number;
  vehicle_type: VehicleType;
  miles_at_higher_rate: number;
  miles_at_lower_rate: number;
  approved_amount_tax: number;
  passenger_payment: number;
  approved_amount_including_passengers: number;
  amount_paid_by_employer: number;
  taxable_excess: number;
  mileage_allowance_relief: number;
  relief_value_at_marginal_rate: number | null;
  approved_amount_national_insurance: number;
  national_insurance_excess: number;
  tax_and_ni_approved_amounts_differ: boolean;
}

export function businessMileage(
  businessMiles: number,
  vehicleType: VehicleType,
  passengerMiles: number,
  passengers: number,
  amountPaid: number,
  marginalRatePct: number | null,
  rules: any
): MileageResult {
  const amap = rules?.motoring?.approved_mileage_allowance_payments;
  const niRules = rules?.motoring?.national_insurance_mileage;
  if (!amap || !niRules) {
    throw new Error(
      "The HMRC approved mileage rates are missing from the ruleset for this tax year, so this calculator cannot run."
    );
  }

  const miles = assertFiniteNumber(businessMiles, "Business miles");
  if (miles < 0) throw new Error("Business miles cannot be negative.");
  if (miles > 500000) {
    throw new Error("That is more business miles than a year contains driving hours. Check the figure.");
  }
  const paid = assertMoney(amountPaid, "Amount paid by your employer");
  const paxMiles = assertFiniteNumber(passengerMiles, "Passenger miles");
  const pax = assertFiniteNumber(passengers, "Passengers carried");
  if (paxMiles < 0 || pax < 0) throw new Error("Passenger figures cannot be negative.");
  if (paxMiles > miles) {
    throw new Error("Passenger miles cannot be more than your total business miles.");
  }

  let approvedTax: number;
  let higherMiles = 0;
  let lowerMiles = 0;
  if (vehicleType === "car_or_van") {
    const threshold = amap.car_or_van.threshold_miles;
    higherMiles = Math.min(miles, threshold);
    lowerMiles = Math.max(0, miles - threshold);
    approvedTax =
      (higherMiles * amap.car_or_van.first_10000_miles_pence +
        lowerMiles * amap.car_or_van.above_10000_miles_pence) /
      100;
  } else {
    higherMiles = miles;
    const pence =
      vehicleType === "motorcycle" ? amap.motorcycle_pence : amap.bicycle_pence;
    approvedTax = (miles * pence) / 100;
  }

  // Passenger payments sit OUTSIDE the approved amount for the vehicle and
  // are only relevant if the employer actually pays them. There is no relief
  // for passenger payments an employer chooses not to make.
  const passengerPayment =
    vehicleType === "car_or_van"
      ? (paxMiles * pax * amap.passenger_pence_per_passenger_per_mile) / 100
      : 0;

  const niPence =
    vehicleType === "car_or_van"
      ? niRules.car_or_van_pence
      : vehicleType === "motorcycle"
        ? niRules.motorcycle_pence
        : niRules.bicycle_pence;
  const approvedNi = (miles * niPence) / 100;

  const taxableExcess = Math.max(0, paid - approvedTax);
  const relief = Math.max(0, approvedTax - paid);
  let reliefValue: number | null = null;
  if (marginalRatePct !== null && marginalRatePct !== undefined) {
    const rate = assertFiniteNumber(marginalRatePct, "Marginal tax rate");
    if (rate < 0 || rate > 100) {
      throw new Error("The marginal tax rate must be between 0 and 100 per cent.");
    }
    reliefValue = (relief * rate) / 100;
  }

  return {
    business_miles: miles,
    vehicle_type: vehicleType,
    miles_at_higher_rate: higherMiles,
    miles_at_lower_rate: lowerMiles,
    approved_amount_tax: round2(approvedTax),
    passenger_payment: round2(passengerPayment),
    approved_amount_including_passengers: round2(approvedTax + passengerPayment),
    amount_paid_by_employer: round2(paid),
    taxable_excess: round2(taxableExcess),
    mileage_allowance_relief: round2(relief),
    relief_value_at_marginal_rate: reliefValue === null ? null : round2(reliefValue),
    approved_amount_national_insurance: round2(approvedNi),
    national_insurance_excess: round2(Math.max(0, paid - approvedNi)),
    tax_and_ni_approved_amounts_differ: Math.abs(approvedTax - approvedNi) > 0.005
  };
}

// ---------------------------------------------------------------------------
// AUT-009 EV charging cost
// ---------------------------------------------------------------------------

export interface EvChargingResult {
  energy_into_battery_kwh: number;
  energy_drawn_from_supply_kwh: number;
  charging_losses_kwh: number;
  energy_cost: number;
  session_fee: number;
  total_cost: number;
  cost_per_kwh_into_battery_pence: number;
  miles_added: number | null;
  cost_per_mile_pence: number | null;
  petrol_cost_per_mile_pence: number | null;
  saving_per_mile_pence: number | null;
  charging_hours: number | null;
}

export function evChargingCost(
  batteryKwh: number,
  startPct: number,
  endPct: number,
  pencePerKwh: number,
  efficiencyPct: number,
  sessionFee: number,
  milesPerKwh: number | null,
  chargerKw: number | null,
  petrolPencePerLitre: number | null,
  petrolMpgImperial: number | null,
  units: MotoringUnits
): EvChargingResult {
  const battery = assertFiniteNumber(batteryKwh, "Battery capacity");
  if (battery <= 0) throw new Error("The battery capacity must be greater than zero.");
  if (battery > 500) throw new Error("That battery capacity is larger than any road car. Check the figure.");
  const start = assertFiniteNumber(startPct, "Starting charge");
  const end = assertFiniteNumber(endPct, "Target charge");
  if (start < 0 || start > 100 || end < 0 || end > 100) {
    throw new Error("Charge levels must be between 0 and 100 per cent.");
  }
  if (end <= start) {
    throw new Error("The target charge must be higher than the starting charge.");
  }
  const ppk = assertFiniteNumber(pencePerKwh, "Electricity price");
  if (ppk < 0) throw new Error("The electricity price cannot be negative.");
  const eff = assertFiniteNumber(efficiencyPct, "Charging efficiency");
  if (eff <= 0 || eff > 100) {
    throw new Error("Charging efficiency must be above 0 and no more than 100 per cent.");
  }
  const fee = assertMoney(sessionFee, "Session fee");

  const intoBattery = (battery * (end - start)) / 100;
  // You are billed for what the meter draws, which is more than what reaches
  // the battery. Ignoring this understates the cost of every AC charge.
  const drawn = intoBattery / (eff / 100);
  const energyCost = (drawn * ppk) / 100;
  const total = energyCost + fee;

  let milesAdded: number | null = null;
  let costPerMile: number | null = null;
  if (milesPerKwh !== null && milesPerKwh !== undefined) {
    const mpk = assertFiniteNumber(milesPerKwh, "Miles per kWh");
    if (mpk <= 0) throw new Error("Miles per kWh must be greater than zero.");
    milesAdded = intoBattery * mpk;
    costPerMile = total / milesAdded;
  }

  let petrolPerMile: number | null = null;
  if (
    petrolPencePerLitre !== null && petrolPencePerLitre !== undefined &&
    petrolMpgImperial !== null && petrolMpgImperial !== undefined
  ) {
    const ppl = assertFiniteNumber(petrolPencePerLitre, "Petrol price");
    const mpg = assertFiniteNumber(petrolMpgImperial, "Petrol car mpg");
    if (ppl < 0) throw new Error("The petrol price cannot be negative.");
    if (mpg <= 0) throw new Error("The comparison car's mpg must be greater than zero.");
    const litresPerMile = units.imperial_gallon_litres / mpg;
    petrolPerMile = (litresPerMile * ppl) / 100;
  }

  let hours: number | null = null;
  if (chargerKw !== null && chargerKw !== undefined) {
    const kw = assertFiniteNumber(chargerKw, "Charger power");
    if (kw <= 0) throw new Error("The charger power must be greater than zero.");
    hours = drawn / kw;
  }

  return {
    energy_into_battery_kwh: Math.round(intoBattery * 1e6) / 1e6,
    energy_drawn_from_supply_kwh: Math.round(drawn * 1e6) / 1e6,
    charging_losses_kwh: Math.round((drawn - intoBattery) * 1e6) / 1e6,
    energy_cost: round2(energyCost),
    session_fee: round2(fee),
    total_cost: round2(total),
    // Per-unit running costs are reported in PENCE throughout, which is the
    // unit a British driver compares in and which keeps the precision that
    // rounding to whole pence of a pound would destroy.
    cost_per_kwh_into_battery_pence: Math.round((total / intoBattery) * 100 * 1e6) / 1e6,
    miles_added: milesAdded === null ? null : Math.round(milesAdded * 1e6) / 1e6,
    cost_per_mile_pence: costPerMile === null ? null : Math.round(costPerMile * 100 * 1e6) / 1e6,
    petrol_cost_per_mile_pence:
      petrolPerMile === null ? null : Math.round(petrolPerMile * 100 * 1e6) / 1e6,
    saving_per_mile_pence:
      costPerMile === null || petrolPerMile === null
        ? null
        : Math.round((petrolPerMile - costPerMile) * 100 * 1e6) / 1e6,
    charging_hours: hours === null ? null : Math.round(hours * 1e6) / 1e6
  };
}

// ---------------------------------------------------------------------------
// AUT-010 EV range
// ---------------------------------------------------------------------------

export interface EvRangeResult {
  usable_battery_kwh: number;
  effective_consumption_mi_per_kwh: number;
  range_from_full: number;
  range_at_current_charge: number;
  range_to_reserve: number;
  energy_needed_for_journey: number | null;
  journey_possible: boolean | null;
  charge_needed_pct: number | null;
  practical_range_to_80_pct: number;
}

/**
 * Usable range from a real consumption figure.
 *
 * The derating is an input the driver controls rather than a factor invented
 * here. Cold weather, motorway speed and a roof box all cut range, and by
 * amounts that depend on the car and the journey. Publishing a fabricated
 * "winter factor" would look authoritative and be wrong; asking for one and
 * explaining what typically drives it is honest.
 */
export function evRange(
  usableBatteryKwh: number,
  consumptionMiPerKwh: number,
  currentChargePct: number,
  deratingPct: number,
  reservePct: number,
  journeyMiles: number | null
): EvRangeResult {
  const battery = assertFiniteNumber(usableBatteryKwh, "Usable battery capacity");
  if (battery <= 0) throw new Error("The usable battery capacity must be greater than zero.");
  if (battery > 500) throw new Error("That battery capacity is larger than any road car. Check the figure.");
  const consumption = assertFiniteNumber(consumptionMiPerKwh, "Consumption");
  if (consumption <= 0) throw new Error("Consumption in miles per kWh must be greater than zero.");
  if (consumption > 20) {
    throw new Error(
      "More than 20 miles per kWh is beyond any production car. Check whether your figure is in watt-hours per mile instead; 280 watt-hours per mile is about 3.6 miles per kWh."
    );
  }
  const charge = assertFiniteNumber(currentChargePct, "Current charge");
  if (charge < 0 || charge > 100) throw new Error("The current charge must be between 0 and 100 per cent.");
  const derate = assertFiniteNumber(deratingPct, "Range reduction");
  if (derate < 0 || derate >= 100) {
    throw new Error("The range reduction must be at least 0 and less than 100 per cent.");
  }
  const reserve = assertFiniteNumber(reservePct, "Reserve");
  if (reserve < 0 || reserve > 50) {
    throw new Error("The reserve must be between 0 and 50 per cent.");
  }

  const effective = consumption * (1 - derate / 100);
  const rangeFull = battery * effective;
  const rangeNow = (battery * charge / 100) * effective;
  const usableCharge = Math.max(0, charge - reserve);
  const rangeToReserve = (battery * usableCharge / 100) * effective;
  // Rapid charging slows sharply above 80%, so the charge a long journey is
  // actually planned around is 80%, not 100%.
  const rangeTo80 = (battery * 0.8) * effective;

  let energyNeeded: number | null = null;
  let possible: boolean | null = null;
  let chargeNeeded: number | null = null;
  if (journeyMiles !== null && journeyMiles !== undefined) {
    const journey = assertFiniteNumber(journeyMiles, "Journey distance");
    if (journey < 0) throw new Error("The journey distance cannot be negative.");
    energyNeeded = journey / effective;
    possible = rangeToReserve >= journey;
    const pct = (energyNeeded / battery) * 100 + reserve;
    chargeNeeded = Math.min(100, Math.round(pct * 1e6) / 1e6);
  }

  return {
    usable_battery_kwh: Math.round(battery * 1e6) / 1e6,
    effective_consumption_mi_per_kwh: Math.round(effective * 1e6) / 1e6,
    range_from_full: Math.round(rangeFull * 1e6) / 1e6,
    range_at_current_charge: Math.round(rangeNow * 1e6) / 1e6,
    range_to_reserve: Math.round(rangeToReserve * 1e6) / 1e6,
    energy_needed_for_journey: energyNeeded === null ? null : Math.round(energyNeeded * 1e6) / 1e6,
    journey_possible: possible,
    charge_needed_pct: chargeNeeded,
    practical_range_to_80_pct: Math.round(rangeTo80 * 1e6) / 1e6
  };
}

// ---------------------------------------------------------------------------
// AUT-011 Vehicle depreciation
// ---------------------------------------------------------------------------

export interface DepreciationYear {
  year: number;
  opening_value: number;
  depreciation: number;
  closing_value: number;
  cumulative_depreciation: number;
  percentage_retained: number;
}

export interface DepreciationResult {
  purchase_price: number;
  years: number;
  value_at_end: number;
  total_depreciation: number;
  percentage_retained: number;
  average_annual_depreciation: number;
  first_year_depreciation: number;
  depreciation_per_mile_pence: number | null;
  implied_annual_rate_pct: number | null;
  schedule: DepreciationYear[];
}

export function vehicleDepreciation(
  purchasePrice: number,
  years: number,
  firstYearRatePct: number,
  subsequentRatePct: number,
  knownFutureValue: number | null,
  annualMileage: number | null
): DepreciationResult {
  const price = assertMoney(purchasePrice, "Purchase price");
  if (price <= 0) throw new Error("The purchase price must be greater than zero.");
  const n = assertFiniteNumber(years, "Years");
  if (!Number.isInteger(n) || n < 1 || n > 30) {
    throw new Error("The number of years must be a whole number between 1 and 30.");
  }

  let firstRate: number;
  let laterRate: number;
  let impliedRate: number | null = null;

  if (knownFutureValue !== null && knownFutureValue !== undefined) {
    // Fit a single constant rate to a known resale value instead of using the
    // supplied percentages, so a real advertised price can drive the schedule.
    const fv = assertMoney(knownFutureValue, "Expected value at the end");
    if (fv > price) {
      throw new Error("The expected value at the end is more than the purchase price. This calculator models depreciation, not appreciation.");
    }
    const r = fv === 0 ? 1 : 1 - Math.pow(fv / price, 1 / n);
    firstRate = r * 100;
    laterRate = r * 100;
    impliedRate = Math.round(r * 100 * 1e6) / 1e6;
  } else {
    firstRate = assertRatePct(firstYearRatePct, "First year depreciation rate");
    laterRate = assertRatePct(subsequentRatePct, "Depreciation rate after the first year");
  }

  const schedule: DepreciationYear[] = [];
  let value = price;
  let cumulative = 0;
  for (let y = 1; y <= n; y++) {
    const rate = (y === 1 ? firstRate : laterRate) / 100;
    const opening = value;
    const dep = opening * rate;
    value = opening - dep;
    cumulative += dep;
    schedule.push({
      year: y,
      opening_value: round2(opening),
      depreciation: round2(dep),
      closing_value: round2(value),
      cumulative_depreciation: round2(cumulative),
      percentage_retained: Math.round((value / price) * 100 * 1e4) / 1e4
    });
  }

  let perMile: number | null = null;
  if (annualMileage !== null && annualMileage !== undefined) {
    const m = assertFiniteNumber(annualMileage, "Annual mileage");
    if (m < 0) throw new Error("Annual mileage cannot be negative.");
    perMile = m * n > 0 ? cumulative / (m * n) : null;
  }

  return {
    purchase_price: round2(price),
    years: n,
    value_at_end: round2(value),
    total_depreciation: round2(cumulative),
    percentage_retained: Math.round((value / price) * 100 * 1e4) / 1e4,
    average_annual_depreciation: round2(cumulative / n),
    first_year_depreciation: schedule[0].depreciation,
    depreciation_per_mile_pence: perMile === null ? null : Math.round(perMile * 100 * 1e6) / 1e6,
    implied_annual_rate_pct: impliedRate,
    schedule
  };
}

// ---------------------------------------------------------------------------
// AUT-012 Engine horsepower
// ---------------------------------------------------------------------------

export interface HorsepowerResult {
  horsepower_bhp: number;
  kilowatts: number;
  metric_horsepower_ps: number;
  torque_lb_ft: number | null;
  torque_nm: number | null;
  rpm: number | null;
  method: string;
  trap_speed_estimate_bhp: number | null;
  elapsed_time_estimate_bhp: number | null;
}

/**
 * Power from torque and engine speed, or estimated from a quarter-mile run.
 *
 * The constant 5252 in the imperial formula is not arbitrary: it is
 * 33,000 / (2 pi), from James Watt's definition of a horsepower as 33,000
 * foot-pounds per minute. Power and torque curves therefore always cross at
 * 5252 rpm on a dyno chart, which is a useful check that a plot is honest.
 */
export function horsepower(
  method: "torque" | "trap_speed" | "elapsed_time",
  torque: number | null,
  torqueUnit: "lb_ft" | "nm",
  rpm: number | null,
  weightLb: number | null,
  trapSpeedMph: number | null,
  elapsedTimeSeconds: number | null,
  units: MotoringUnits
): HorsepowerResult {
  const NM_PER_LB_FT = 1.3558179483314004;
  let bhp: number;
  let torqueLbFt: number | null = null;
  let torqueNm: number | null = null;
  let usedRpm: number | null = null;
  let trapEstimate: number | null = null;
  let etEstimate: number | null = null;

  if (method === "torque") {
    const t = assertFiniteNumber(torque, "Torque");
    const r = assertFiniteNumber(rpm, "Engine speed");
    if (t <= 0) throw new Error("Torque must be greater than zero.");
    if (r <= 0) throw new Error("Engine speed must be greater than zero.");
    if (r > 20000) throw new Error("An engine speed above 20,000 rpm is beyond any road car. Check the figure.");
    torqueLbFt = torqueUnit === "nm" ? t / NM_PER_LB_FT : t;
    torqueNm = torqueUnit === "nm" ? t : t * NM_PER_LB_FT;
    usedRpm = r;
    bhp = (torqueLbFt * r) / 5252;
  } else if (method === "trap_speed") {
    const w = assertFiniteNumber(weightLb, "Vehicle weight");
    const v = assertFiniteNumber(trapSpeedMph, "Trap speed");
    if (w <= 0) throw new Error("The vehicle weight must be greater than zero.");
    if (v <= 0) throw new Error("The trap speed must be greater than zero.");
    bhp = w * Math.pow(v / 234, 3);
    trapEstimate = bhp;
  } else {
    const w = assertFiniteNumber(weightLb, "Vehicle weight");
    const et = assertFiniteNumber(elapsedTimeSeconds, "Elapsed time");
    if (w <= 0) throw new Error("The vehicle weight must be greater than zero.");
    if (et <= 0) throw new Error("The elapsed time must be greater than zero.");
    bhp = w / Math.pow(et / 5.825, 3);
    etEstimate = bhp;
  }

  const watts = bhp * units.mechanical_horsepower_watts;

  return {
    horsepower_bhp: Math.round(bhp * 1e6) / 1e6,
    kilowatts: Math.round((watts / 1000) * 1e6) / 1e6,
    metric_horsepower_ps: Math.round((watts / units.metric_horsepower_ps_watts) * 1e6) / 1e6,
    torque_lb_ft: torqueLbFt === null ? null : Math.round(torqueLbFt * 1e6) / 1e6,
    torque_nm: torqueNm === null ? null : Math.round(torqueNm * 1e6) / 1e6,
    rpm: usedRpm,
    method,
    trap_speed_estimate_bhp: trapEstimate === null ? null : Math.round(trapEstimate * 1e6) / 1e6,
    elapsed_time_estimate_bhp: etEstimate === null ? null : Math.round(etEstimate * 1e6) / 1e6
  };
}
