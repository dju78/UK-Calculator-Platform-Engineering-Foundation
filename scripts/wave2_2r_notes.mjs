/**
 * Narrative specification sections for Wave 2 tranche 2R, Education and the
 * two remaining Everyday & Lifestyle calculators.
 * Run: node scripts/wave2_2r_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

Object.assign(notes, {

  "EDU-001": {
    purpose: "Work out a weighted average across a set of assessments.",
    scope: "Any number of assessments, each with a mark out of 100 and a weight.",
    assumptions: ["Marks are percentages."],
    validation: [
      "A mark outside 0 to 100 is refused, naming the assessment.",
      "A negative weight is refused.",
      "Weights adding to zero are refused rather than dividing by zero.",
      "A malformed entry is refused with the expected shape quoted back."
    ],
    formula: "Each assessment contributes its mark times its weight, divided by the total weight actually entered.",
    boundary: "WEIGHTS ARE NORMALISED BY THEIR OWN TOTAL rather than assumed to reach 100. That single decision is what makes the calculator useful mid-module: if you have sat assessments worth 50 between them, this reports your average SO FAR rather than a figure halved by the assessments you have not taken. Whether the weights reached 100 is reported as its own output, and a warning names the percentage still to come, so a progress figure can never be mistaken for a final mark. " +
      "THE CONTRIBUTION COLUMN IS USUALLY MORE USEFUL THAN THE MARK. A 90 worth five per cent moves the average less than a 65 worth forty, and seeing that laid out is what tells a student where the remaining effort is worth spending.",
    methodology: "The oracle sums the products and divides ONCE at the end, the opposite order from the engine, which divides each contribution and sums. A benchmark case with partial weights pins the normalisation, and a unit test asserts the contributions add back to the reported average.",
    rules: "Not rules-sensitive for the arithmetic; the classification boundaries used to report the next threshold come from the versioned ruleset.",
    related: ["EDU-002 UK Degree Classification Calculator"]
  },

  "EDU-002": {
    purpose: "Estimate a UK honours degree classification from year averages and weightings.",
    scope: "Any number of years, each with an average and a weighting.",
    assumptions: ["The conventional UK classification boundaries."],
    validation: [
      "An average outside 0 to 100 is refused, naming the year.",
      "Weightings adding to zero are refused.",
      "A malformed entry is refused with the expected shape."
    ],
    formula: "The overall average is the year averages weighted by the weightings given, normalised by their total. The classification is the band it falls in.",
    boundary: "THIS IS AN ESTIMATE, NOT A CLASSIFICATION, and the calculator says so in those words. The boundaries are conventional across UK universities, but the rules that actually decide a degree are not: institutions differ in how they weight each year, whether they discount the worst credits, whether a strong final year alone can lift a classification, and how they handle borderline cases. Those rules change the outcome far more often than the boundaries do, and only the awarding university can classify a degree. " +
      "THE BORDERLINE ZONE IS THE HONEST PART OF THIS CALCULATOR. Within about two marks of a boundary most universities look at the PROFILE of individual module marks rather than the average alone, so the average genuinely stops deciding the outcome there. That zone is flagged with a warning telling the student to ask their department how its rule works, rather than reporting a bare classification that overstates what the figure knows. " +
      "YEAR WEIGHTINGS ARE AN INPUT because they vary widely: a common English pattern is nothing in the first year, then a quarter and three quarters, but plenty of universities use different splits and some weight all three years. A unit test shows the same two years' marks producing a first under one weighting and a 2:1 under another, which is exactly why the weighting cannot be assumed.",
    methodology: "The oracle computes the average by the same summed-products route as EDU-001, and one benchmark case sits deliberately within two marks of the first boundary so the borderline flag is exercised in the fixtures rather than only in a test.",
    rules: "Rules-sensitive. The boundaries are in the versioned ruleset, with a source-register note recording that they are BANDS rather than an algorithm and that institutional weighting, discounting and borderline rules govern the actual award.",
    related: ["EDU-001 Grade Calculator", "EDU-003 UCAS Points Calculator"]
  },

  "EDU-003": {
    purpose: "Total UCAS Tariff points across A levels, AS levels and the Extended Project.",
    scope: "Any combination of the three qualification types, up to thirty entries.",
    assumptions: ["Current UCAS Tariff values."],
    validation: [
      "An unknown qualification type is refused, listing what is covered.",
      "An invalid grade for a qualification is refused, listing the valid grades.",
      "More than thirty qualifications is refused."
    ],
    formula: "Each grade maps to a points value from the published tariff; the total is their sum.",
    boundary: "POINTS CANNOT BE CLAIMED FOR BOTH AN AS AND THE FULL A LEVEL IN THE SAME SUBJECT. That one rule is the commonest reason a self-calculated total comes out too high, which is why the AS and A level subtotals are shown separately and why entering both triggers a warning. " +
      "MANY COURSES DO NOT USE THE TARIFF AT ALL. A large share of the most selective universities make offers in GRADES rather than points, because AAB and BBB plus an EPQ can reach a similar total while meaning quite different things to an admissions tutor, and many subjects require specific grades in specific subjects that no total can express. A total is a rough currency, not an offer, and the calculator says so. " +
      "The A level equivalent is reported because that is the currency admissions conversations are actually held in: 160 points means little, 'about two A stars and an A' means something.",
    methodology: "The oracle RE-TYPES the tariff tables from the published values rather than reading them from the ruleset, so agreement corroborates the ruleset data instead of merely echoing it. Unit tests assert all seventeen published values individually, and the three-A-star case pins the top of the scale at 168, which is checkable by inspection.",
    rules: "Rules-sensitive. The tariff lives in the versioned ruleset, with a source-register note recording that UCAS serves these figures from an interactive tool rather than as page text, so two separate published tables were compared instead and agree exactly on every value.",
    related: ["EDU-002 UK Degree Classification Calculator", "EDU-004 UK University Cost Calculator"]
  },

  "EDU-004": {
    purpose: "Estimate the total cost of a degree and the gap between the maintenance loan and real living costs.",
    scope: "A course length, tuition fee, living arrangement, maintenance loan and monthly living costs.",
    assumptions: ["England student finance arrangements for the stated academic year."],
    validation: [
      "A tuition fee above the England cap is refused with the cap quoted.",
      "A maintenance loan above the maximum for the living arrangement is refused with that maximum quoted.",
      "A course length outside 1 to 10 whole years is refused.",
      "Months a year outside 0 to 12 is refused."
    ],
    formula: "Tuition and loan accumulate per year; living costs are the monthly figures times the months paid for.",
    boundary: "THE MAINTENANCE LOAN IS MEANS TESTED, SO THE MAXIMUM IS NOT AN ENTITLEMENT. Most students receive less once household income is taken into account, and presenting the maximum as the expected figure is how a budget goes wrong before term starts. The field is therefore blank by default with a note to use the award letter, and the maximum for the chosen circumstances is shown alongside so the gap is visible. " +
      "THE THREE LIVING ARRANGEMENTS MOVE TOGETHER. The London loan is the largest and so is London rent; comparing one without the other is how a student concludes London is affordable. All three are offered and both halves change with the choice. " +
      "THIS IS ENGLAND. Student finance is devolved and Scotland, Wales and Northern Ireland differ substantially in both fees and support; Scottish students studying in Scotland typically pay no tuition fee at all. " +
      "THE TOTAL BORROWED IS NOT WHAT YOU REPAY. A student loan is repaid as a percentage of income above a threshold and written off after a set period, so many graduates repay considerably more than they borrowed and many considerably less. It behaves far more like a graduate contribution than a commercial debt, and the balance shown is not a useful guide to what it will cost. Saying that plainly matters more than any figure on the page.",
    methodology: "The oracle accumulates totals YEAR BY YEAR rather than multiplying out. All three living arrangements are benchmarked with their own realistic rents, so the loan and the cost move together in the fixtures. A unit test asserts each arrangement's maximum against the published figure.",
    rules: "Rules-sensitive. Fee cap and maintenance maxima are in the versioned ruleset from GOV.UK, with a source-register note recording that these are England figures, that they are maxima rather than entitlements, and that the other three nations differ.",
    related: ["EDU-005 Student Budget Calculator", "TAX-014 Student Loan Repayment"]
  },

  "EDU-005": {
    purpose: "See whether a term's money lasts the term.",
    scope: "A loan instalment and other income for one term, against weekly rent and spending.",
    assumptions: ["Spending is even across the term."],
    validation: [
      "Negative income or spending is refused.",
      "Weeks outside 0 to 52 are refused."
    ],
    formula: "Income for the term against weekly spending times the weeks. The weeks the money lasts is income divided by weekly spending.",
    boundary: "THE WEEKS THE MONEY LASTS IS THE FIGURE THAT MATTERS, more than the term surplus. A maintenance instalment arrives as a single lump at the start of term, which makes overspending painless in the first month and unrecoverable by the last; a budget that balances over a term can still run dry in week nine, and that is what the warning names. " +
      "RENT AS A SHARE OF INCOME is watched for the same reason: it is fixed and it comes first, so a high share leaves everything else competing for what is left. Above about sixty per cent the calculator says so. " +
      "Where there is no spending at all the weeks-lasting figure is NULL rather than infinite, because an infinite answer is not a number a reader can act on and would be rejected by the engine's own output guard.",
    methodology: "The oracle accumulates spending one week at a time. A zero-spending case pins the only input that would otherwise divide by zero, and a unit test asserts it returns null rather than infinity.",
    rules: "Not rules-sensitive.",
    related: ["EDU-004 UK University Cost Calculator", "FIN-013 Budget Calculator"]
  },

  "EVE-001": {
    purpose: "Work out a tip and split a bill, showing what the service payment really comes to.",
    scope: "A bill, an optional service charge already added, an optional further tip, a number of people and an optional rounding step.",
    assumptions: ["The service charge percentage is as printed on the bill."],
    validation: [
      "Percentages outside 0 to 100 are refused.",
      "A number of people that is not a whole number of at least one is refused.",
      "A negative bill or rounding step is refused."
    ],
    formula: "The service charge and the tip are each a percentage OF THE BILL. The total is the bill plus both, optionally rounded up.",
    boundary: "THE TIP IS CALCULATED ON THE BILL, NOT ON THE BILL PLUS THE SERVICE CHARGE. Tipping on the service-inclusive total is paying twice for the same thing, and the difference is real: on a 120 pound bill with 12.5% service, a further 10% comes to 12 pounds rather than 13.50. The EFFECTIVE percentage across both is reported, and adding a tip on top of an existing service charge triggers a warning showing the combined figure, because the point is to make the decision visible rather than to discourage it. " +
      "TWO POINTS OF UK PRACTICE ARE STATED. A discretionary service charge can be REMOVED ON REQUEST. And since the Employment (Allocation of Tips) Act 2023 came into force, employers must pass on tips and service charges to staff in full, with cash and card treated alike, which answers the question people most often have when deciding how to tip. " +
      "Rounding always rounds UP, and the adjustment is reported so nobody wonders where the extra went.",
    methodology: "The oracle computes in integer pence throughout. A unit test asserts the per-person shares add back to the rounded total, and a case with a service charge and no tip sits beside one with both so the difference between the two is in the fixtures.",
    rules: "Not rules-sensitive.",
    related: ["FIN-013 Budget Calculator"]
  },

  "EVE-003": {
    purpose: "Turn a tyre's sidewall marking into real dimensions, and compare a fitment against the original.",
    scope: "A width, aspect ratio and rim diameter, optionally against a reference tyre.",
    assumptions: ["Nominal dimensions from the marking rather than measured ones."],
    validation: [
      "A width outside 100 to 500 mm, an aspect ratio outside 20 to 100, or a rim outside 8 to 30 inches is refused, each message naming which number on the sidewall it means and in what unit."
    ],
    formula: "The sidewall is the aspect ratio per cent of the width. The overall diameter is the rim in inches plus two sidewalls.",
    boundary: "A TYRE MARKING MIXES THREE UNITS. In 225/45R17 the width is 225 MILLIMETRES, the 45 is a PERCENTAGE of that width, and the 17 is the rim in INCHES. Reading them as three numbers in one unit gets the diameter badly wrong, and the sidewall height is reported separately because that is the part most often mistaken for a direct measurement. " +
      "A CONSEQUENCE THAT SURPRISES PEOPLE: because the aspect ratio is a percentage OF THE WIDTH, the same five point change moves the diameter roughly twice as far on a 305 tyre as on a 155. A unit test asserts exactly that. " +
      "A LARGER TYRE MAKES THE SPEEDOMETER READ LOW, because the speedometer counts wheel revolutions and each one now covers more ground. The reading at a true 70 mph is shown for that reason. Staying within about three per cent of the original rolling diameter is the usual guidance, because ABS, traction control, cruise control and the odometer are all calibrated against the original size, and a change beyond that is flagged. Load and speed ratings matter as much as the dimensions and are not covered here; check the vehicle handbook.",
    methodology: "The oracle derives everything in INCHES and converts to millimetres at the end, the opposite way round from the engine, which works in millimetres and converts the rim. An out-of-tolerance case is benchmarked alongside an in-tolerance one so the three per cent rule is exercised in both directions.",
    rules: "Not rules-sensitive.",
    related: ["AUT-007 Fuel Economy Calculator", "CON-002 Length Converter"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
