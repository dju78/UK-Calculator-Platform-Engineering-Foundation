/**
 * Narrative specification sections for Wave 2 tranche 2M, Automotive & Travel.
 * Run: node scripts/wave2_2m_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const NOT_A_QUOTE =
  'This illustrates the arithmetic in a finance quote. It is NOT a regulated finance quotation, NOT a credit decision and NOT an indication that credit would be offered. Only the lender\'s own pre-contract credit information is binding, and the figures a lender gives will differ where its rounding, fee treatment or payment dates differ from the conventions here.';

const APR_CONVENTION =
  'APR is an annual EFFECTIVE rate under the Consumer Credit Directive, so the monthly rate used is the twelfth root of one plus the APR, not the APR divided by twelve. The divide-by-twelve figure is reported alongside on the car loan so a quote built on the nominal convention can still be reproduced, because lenders do differ.';

const SOLVED_BY_SIMULATION =
  'The benchmark oracle finds every payment by BISECTING on a month-by-month balance simulation until the balance closes on its target, while the engine uses the closed-form annuity. The two share no algebra, so a sign error on a balloon discount or an off-by-one on the number of periods would move one and not the other.';

const GALLON =
  'Miles per gallon means the IMPERIAL gallon of 4.54609 litres. The US gallon of 3.785411784 litres is a fifth smaller, so the same car reads about twenty per cent worse in US mpg: 50 mpg here is about 42 there. The constants live in the versioned ruleset rather than in the code, so no two calculators on the platform can disagree about them.';

Object.assign(notes, {

  "AUT-001": {
    purpose: "Cost an unsecured personal loan used to buy a car outright.",
    scope: "A price, a deposit, a part exchange, an APR, a term in months and an optional arrangement fee.",
    assumptions: [
      "Equal monthly payments in arrears over a whole number of months.",
      "The APR quoted is the effective annual rate."
    ],
    validation: [
      "A deposit and part exchange together exceeding the price are refused, because there would be nothing to borrow.",
      "Terms outside 1 to 120 months and APRs outside 0 to 100 per cent are refused.",
      "Whether the fee is financed or paid up front is an explicit choice, because it changes the monthly payment rather than only the total."
    ],
    formula: "The payment amortises the amount borrowed to zero over the term at the monthly rate implied by the APR.",
    boundary: "A PERSONAL LOAN BUYS THE CAR OUTRIGHT, and that is the point of the calculator rather than the monthly figure. The car is yours from day one: no mileage cap, no condition inspection, no final payment to make and nothing to hand back. Against hire purchase or a PCP that is worth more than a small difference in the monthly, and it is invisible in any comparison that looks only at the payment. " + APR_CONVENTION + " " + NOT_A_QUOTE,
    methodology: SOLVED_BY_SIMULATION + " A zero-APR case is included specifically because that is where a closed-form annuity divides by zero and needs its own branch.",
    rules: "Not rules-sensitive; the arithmetic contains no statutory values.",
    related: ["AUT-004 HP Finance", "AUT-003 PCP Finance", "AUT-005 Dealer Contribution vs Low APR"]
  },

  "AUT-002": {
    purpose: "Cost a personal contract hire agreement, and show what the mileage terms could add to it.",
    scope: "A quoted monthly rental, or a price and end value from which the rental is derived, plus the initial rental, term, fees and mileage terms.",
    assumptions: [
      "Rentals are paid in ADVANCE, at the start of each month, which is what personal contract hire means.",
      "The end value used to derive a rental is the funder's expectation, not a guarantee to the hirer."
    ],
    validation: [
      "An initial rental as large as the whole term is refused, with the 9+35 convention explained.",
      "An end value above the vehicle price is refused.",
      "The initial rental must be a whole number of monthly rentals."
    ],
    formula: "Where a rental is not quoted, it is solved as an annuity IN ADVANCE so that the discounted rentals plus the discounted end value equal the price.",
    boundary: "THE INITIAL RENTAL IS NOT A DEPOSIT. A 9+35 quote means nine monthly rentals paid up front and thirty-five afterwards; that money is rent, it buys no equity, none of it comes back and at the end the car goes back. The effective monthly cost spreads it across the whole term so a lease can be compared with a PCP monthly on the same footing, which the headline rental does not allow. Mileage is contractual and the excess charge is levied at the end whether or not the hirer was watching it accrue. The dealer money-factor rental is shown beside the derived one precisely BECAUSE THEY DIFFER: the money-factor rule of thumb is an approximation and should not be used to check a quote. " + NOT_A_QUOTE,
    methodology: "The oracle bisects on a simulation in which the rental is taken at the START of each month. Solving it as an ordinary annuity instead would give a rental too high by a factor of one plus the monthly rate, which is the classic lease modelling error, and the in-advance construction is what catches it.",
    rules: "Not rules-sensitive.",
    related: ["AUT-003 PCP Finance", "AUT-001 Car Loan"]
  },

  "AUT-003": {
    purpose: "Cost a personal contract purchase across all three of its possible endings.",
    scope: "Price, deposit, dealer contribution, APR, term, guaranteed future value, option fee and mileage terms.",
    assumptions: [
      "The guaranteed future value is the funder's figure and is guaranteed only in the sense that the funder will take the car for it.",
      "Equal monthly payments in arrears."
    ],
    validation: [
      "A guaranteed future value above the amount being financed is refused, because there would be nothing to repay.",
      "Deposit and contribution together above the price are refused.",
      "Negative mileage figures or excess charges are refused."
    ],
    formula: "The payment amortises the financed amount down to the guaranteed future value rather than to zero, so the debt splits exactly into an amortising part and a deferred part equal to the present value of the balloon.",
    boundary: "YOU PAY INTEREST ON THE BALLOON FOR THE WHOLE TERM even though none of it is repaid until the end, and that figure is reported on its own line because it is the entire reason the monthly looks cheap. THREE ENDINGS EXIST AND THEY COST DIFFERENT AMOUNTS: hand the car back and you have paid for depreciation only; pay the guaranteed future value and the option fee and you own it; or part-exchange, where any equity above the guaranteed value is yours and is routinely less than a dealer implies. All three totals are shown rather than one headline. Mileage and condition are contractual and the excess is charged at the end. " + APR_CONVENTION + " " + NOT_A_QUOTE,
    methodology: SOLVED_BY_SIMULATION + " Here the simulation must close exactly on the guaranteed future value rather than on zero. A zero-APR case asserts that deferring the balloon then costs nothing, which is the only rate at which that is true and therefore a sharp test of the decomposition.",
    rules: "Not rules-sensitive.",
    related: ["AUT-004 HP Finance", "AUT-002 Car Lease", "AUT-005 Dealer Contribution vs Low APR"]
  },

  "AUT-004": {
    purpose: "Cost a hire purchase agreement and show when its statutory protections begin.",
    scope: "Price, deposit, APR, term and the option to purchase fee.",
    assumptions: ["Equal monthly payments in arrears.", "The agreement is a regulated consumer hire purchase agreement."],
    validation: [
      "A deposit above the price is refused.",
      "Terms outside 1 to 120 months and APRs outside 0 to 100 per cent are refused."
    ],
    formula: "The payment amortises the financed balance to zero. The statutory thresholds are measured against the TOTAL AMOUNT PAYABLE under the agreement, which includes the deposit and the option fee.",
    boundary: "YOU DO NOT OWN THE CAR UNTIL THE FINAL PAYMENT AND THE OPTION FEE ARE MADE; until then it belongs to the finance company and cannot be sold. Two statutory points follow and both are widely misunderstood. Once a THIRD of the total amount payable has been paid the car is protected goods under section 90 of the Consumer Credit Act 1974 and cannot be repossessed from the hirer without a court order. Once HALF has been paid, section 99 gives a right of voluntary termination: the agreement can be ended, the car handed back and nothing further owed, provided it is in reasonable condition. Both thresholds are reported as the month they are reached on this schedule, and a large deposit can put the first of them at month zero, which is exactly the case a formula based on a fraction of the term would get wrong. " + APR_CONVENTION + " " + NOT_A_QUOTE,
    methodology: "The thresholds are counted in the oracle by accumulating actual payments month by month starting from the deposit, so an agreement whose deposit already exceeds a third correctly reports month zero. A benchmark case exists for precisely that.",
    rules: "Not rules-sensitive. The statutory thresholds are fractions fixed in primary legislation rather than annually set figures, so they are not held in the versioned ruleset.",
    related: ["AUT-003 PCP Finance", "AUT-001 Car Loan"]
  },

  "AUT-005": {
    purpose: "Decide which of two finance offers on the same car actually costs less.",
    scope: "One car, one deposit, one term and one final payment, with two combinations of deposit contribution and APR.",
    assumptions: ["Both offers are available on the same vehicle at the same price."],
    validation: [
      "A contribution larger than the price after the deposit is refused.",
      "A final payment larger than the amount financed is refused, on either offer."
    ],
    formula: "Each offer is costed as an amortising agreement with the same final payment, and the totals compared. The breakeven contribution is the one at which the two totals coincide.",
    boundary: "A DEPOSIT CONTRIBUTION AND A LOW APR CANNOT BE RANKED BY INSPECTION, and the ranking genuinely FLIPS with the term: a contribution is a fixed sum while an interest saving grows with how long and how much is borrowed. Benchmarks include the same headline offer at 36 and at 60 months for exactly that reason. The comparison holds the car, the deposit, the term and the final payment constant, because a comparison across different terms is not a comparison at all, and that is the most common way a showroom comparison misleads. " + NOT_A_QUOTE,
    methodology: "The oracle bisects on the contribution using the full cost simulation to find the breakeven, rather than computing it from a linear sensitivity as the engine does, so a wrong sensitivity would not be reproduced.",
    rules: "Not rules-sensitive.",
    related: ["AUT-003 PCP Finance", "AUT-004 HP Finance", "AUT-001 Car Loan"]
  },

  "AUT-007": {
    purpose: "Turn a distance and a quantity of fuel into economy, in every unit anyone uses.",
    scope: "A distance in miles or kilometres and fuel in litres or in either kind of gallon, with an optional price.",
    assumptions: ["A single tankful is a sample of real driving, not a specification."],
    validation: [
      "A zero or negative distance is refused, because there is no economy to measure.",
      "A zero or negative quantity of fuel is refused, because the economy would be infinite.",
      "A negative fuel price is refused."
    ],
    formula: "Litres per mile is computed first and then inverted into each unit, so every figure comes from one quantity rather than from separate conversions that could drift apart.",
    boundary: "THE HEADLINE IS IMPERIAL MPG. " + GALLON + " The US figure is shown deliberately, not as a courtesy but because the two are constantly confused and a reader who has copied a figure from an American source needs to see the gap. LITRES PER 100 KM RUNS THE OTHER WAY: a lower number is better, and readers who treat it like mpg reach the opposite conclusion. Real economy varies with speed, load, weather and tyre pressure, so one tankful is an observation rather than a rating. Cost is reported in PENCE a mile, which is how running costs are compared in Britain and which keeps the precision that rounding pounds to two places would destroy.",
    methodology: "The oracle re-types the gallon constants from their definitions rather than reading the ruleset, so agreement corroborates the ruleset rather than merely echoing it, and it derives economy through litres per mile inverted rather than by dividing miles by gallons. A US-gallon case is included so that treating a US figure as imperial would fail by twenty per cent rather than pass unnoticed.",
    rules: "Rules-sensitive only for the unit constants, which are held in the versioned ruleset with a source-register entry recording that they are exact by definition.",
    related: ["AUT-006 Fuel Cost", "AUT-009 EV Charging Cost"]
  },

  "AUT-008": {
    purpose: "Work out the HMRC approved amount for business mileage, what is taxable, and what relief can be claimed.",
    scope: "Business miles in a tax year by vehicle type, passengers carried, and what the employer actually paid.",
    assumptions: [
      "The miles entered are business miles as HMRC defines them, which excludes ordinary commuting.",
      "The 10,000 mile threshold runs per employee per tax year."
    ],
    validation: [
      "Passenger miles above total business miles are refused.",
      "A marginal rate outside 0 to 100 per cent is refused.",
      "An implausibly large annual mileage is refused rather than answered."
    ],
    formula: "The approved amount is the miles in each band at that band's pence rate. The National Insurance qualifying amount uses a single rate for every mile.",
    boundary: "THE CAR AND VAN RATE ROSE TO 55p FOR THE FIRST 10,000 BUSINESS MILES FROM 6 APRIL 2026. The familiar 45p applies to earlier tax years only, and almost every third-party mileage calculator still shows it. TAX AND NATIONAL INSURANCE ARE NOT THE SAME CALCULATION: for National Insurance a single rate applies to every business mile, there is no 10,000 mile step and there is NO Mileage Allowance Relief, so an employee driving well over 10,000 miles has two different approved amounts at once. Both are shown rather than one. RELIEF IS A DEDUCTION, NOT A REFUND: being under-reimbursed by £500 is worth £100 to a basic rate taxpayer. Passenger payments of 5p a mile matter only where an employer actually makes them, and there is no relief for passenger payments an employer declines to pay.",
    methodology: "The oracle accumulates the approved amount ONE MILE AT A TIME at whichever rate that mile attracts, rather than multiplying two bands, because that is the only construction that catches an off-by-one at the threshold. Cases at exactly 10,000 and at 10,001 miles exist for that purpose: the extra mile must add 25p for tax and 55p for National Insurance.",
    rules: "Rules-sensitive. Every rate is held in the versioned ruleset with source-register entries citing two separate GOV.UK pages, both checked because the figure changed for 2026/27. A benchmark built on the familiar 45p would have been a wrong benchmark rather than a wrong engine.",
    related: ["AUT-007 Fuel Economy", "TAX-001 Take-Home Pay"]
  },

  "AUT-009": {
    purpose: "Cost a charging session honestly, including the energy that never reaches the battery.",
    scope: "A battery, a start and target state of charge, a tariff, a charging efficiency and optional fees, with an optional petrol comparison.",
    assumptions: ["The efficiency entered covers the whole path from meter to battery."],
    validation: [
      "A target charge at or below the starting charge is refused.",
      "Charge levels outside 0 to 100 per cent are refused.",
      "An efficiency of zero or above 100 per cent is refused.",
      "An implausible battery capacity is refused rather than answered."
    ],
    formula: "Energy into the battery is the capacity times the change in state of charge. Energy drawn from the supply is that divided by the efficiency, and the bill follows the energy drawn.",
    boundary: "YOU ARE BILLED FOR WHAT THE METER DRAWS, NOT FOR WHAT REACHES THE BATTERY. Charging is not lossless: the on-board charger, the cable and the battery itself give up energy as heat, and on a home AC charger the gap is commonly around a tenth. A calculator that multiplies capacity by tariff therefore understates every home charge, and the losses are shown on their own line so the difference is visible rather than buried. The charging time is an IDEAL: real rapid charging tapers sharply as the battery fills, so the last fifth takes disproportionately long. The petrol comparison uses the IMPERIAL gallon; a US gallon would show petrol about twenty per cent cheaper per mile and understate the saving.",
    methodology: "The oracle sums energy in one-per-cent steps rather than multiplying out in one go, and a hundred-per-cent efficiency case pins the boundary where losses must be exactly zero.",
    rules: "Rules-sensitive only for the gallon constant used in the petrol comparison.",
    related: ["AUT-010 EV Range", "AUT-007 Fuel Economy"]
  },

  "AUT-010": {
    purpose: "Say how far an electric car will actually go, and whether a given journey fits.",
    scope: "A usable battery, a real consumption figure, a state of charge, a reduction the driver sets, a reserve and an optional journey.",
    assumptions: ["The consumption entered is what the car achieves in practice, not its WLTP figure."],
    validation: [
      "A consumption above 20 miles per kWh is refused with a note that the figure may be watt-hours per mile.",
      "A reduction of 100 per cent or more is refused.",
      "A reserve above 50 per cent is refused.",
      "An implausible battery capacity is refused."
    ],
    formula: "Effective consumption is the entered consumption less the reduction. The reserve is applied to the STATE OF CHARGE before the range is taken, not subtracted from the range afterwards.",
    boundary: "THE RANGE REDUCTION IS THE DRIVER'S TO SET AND THIS CALCULATOR DOES NOT INVENT ONE. Cold weather, motorway speed, a roof box and a full car all cut range by amounts that depend on the car and the journey; publishing a fabricated winter factor would look authoritative and be wrong, so the honest design asks for one and explains what drives it. TWO RANGES ARE GIVEN FOR A REASON: the range to the reserve is what can safely be planned around, and the range to eighty per cent is what matters on a long trip, because rapid charging slows so sharply above that point that filling the last fifth is rarely worth the time. WLTP figures are measured on a cycle no real journey resembles.",
    methodology: "The oracle drains the pack MILE BY MILE as well as computing the range in closed form, and applies the reserve to the state of charge before taking the range. Those two orders differ whenever the reserve and the current charge differ, and a failing-journey case is chosen so the distinction is visible in the benchmarks.",
    rules: "Not rules-sensitive.",
    related: ["AUT-009 EV Charging Cost"]
  },

  "AUT-011": {
    purpose: "Show what a car will be worth after a period of ownership and what that costs per year and per mile.",
    scope: "A price, a number of years, a first-year and a later annual rate, or a known value at the end.",
    assumptions: ["Reducing-balance depreciation, which is front-loaded, as real car values are."],
    validation: [
      "A value at the end above the purchase price is refused, because this models depreciation rather than appreciation.",
      "A period outside 1 to 30 whole years is refused.",
      "Rates outside 0 to 100 per cent are refused."
    ],
    formula: "Each year's fall is the opening value times that year's rate. Where a known end value is given, a single constant rate is fitted to it and the supplied rates are ignored.",
    boundary: "DEPRECIATION IS USUALLY THE LARGEST COST OF RUNNING A CAR, larger than fuel, insurance and servicing together on a newer one, and it is invisible because nobody sends a bill for it. It is also FRONT-LOADED, which is why the first year is reported separately and why a two-year-old car is often the better buy. The rates are the user's to set because depreciation depends on the model, the mileage, the specification and the market rather than on any formula, and inventing default rates would dress a guess as a calculation. Where a real advertised resale value is known, entering it and letting the rate be fitted is the more honest route.",
    methodology: "The oracle computes closing values from a closed-form power expression, the opposite construction from the engine's accumulating loop, so a compounding error in either would separate them. The fitted case inverts the same relation to recover a rate from a known value, which is a third route again.",
    rules: "Not rules-sensitive.",
    related: ["AUT-003 PCP Finance", "AUT-002 Car Lease"]
  },

  "AUT-012": {
    purpose: "Convert torque and engine speed into power, in each of the units a specification uses.",
    scope: "Torque in pound-feet or newton metres with an engine speed, or a quarter-mile trap speed or elapsed time with a weight.",
    assumptions: ["A torque figure is a flywheel figure unless it came from a rolling road."],
    validation: [
      "Zero or negative torque, speed, weight or time is refused.",
      "An engine speed above 20,000 rpm is refused as beyond any road car."
    ],
    formula: "Power in bhp is torque in pound-feet times rpm divided by 5252. The quarter-mile methods are empirical: weight times the cube of trap speed over 234, and weight over the cube of elapsed time over 5.825.",
    boundary: "THE 5252 IS NOT ARBITRARY: it is 33,000 divided by two pi, from Watt's definition of a horsepower as thirty-three thousand foot-pounds per minute. It follows that power and torque curves ALWAYS cross at 5252 rpm on an honest dyno chart, which is a quick way to tell whether a plot has been massaged. THREE UNITS APPEAR IN SPECIFICATIONS AND THEY ARE DIFFERENT SIZES: bhp is about 745.7 watts, PS is 735.5, so 300 PS is about 296 bhp, and quoting one figure under the other unit is the commonest way a specification flatters itself. A torque calculation gives FLYWHEEL power; a rolling road measures at the wheels and reads lower by whatever the transmission absorbs. The quarter-mile methods are ESTIMATES fitted to typical cars, not measurements, and say nothing about a car that cannot put its power down.",
    methodology: "The oracle derives power in SI from first principles as torque in newton metres times angular velocity in radians per second, never through the imperial shortcut. The two agreeing IS the check that 5252 is right. A case at exactly 5252 rpm asserts the classic identity that power in bhp then equals torque in pound-feet.",
    rules: "Rules-sensitive only for the horsepower and metric horsepower constants, which are held in the versioned ruleset.",
    related: ["AUT-007 Fuel Economy"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
