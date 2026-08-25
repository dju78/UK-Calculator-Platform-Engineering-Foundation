/**
 * Narrative specification sections for Wave 2 tranche 2L, Date & Time.
 * Run: node scripts/wave2_2l_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const UTC =
  'All calendar arithmetic is performed in UTC rather than in the browser\'s local time zone. A date calculator that used local time would give a different answer to a reader in Sydney than to one in London for the same inputs, and would shift by an hour twice a year in Britain alone.';

const DIVISIONS =
  'Bank holidays differ across the United Kingdom, so a division must be chosen: England & Wales, Scotland, or Northern Ireland. Scotland does not observe Easter Monday and does observe 2 January and St Andrew\'s Day; Northern Ireland adds St Patrick\'s Day and the Twelfth. Treating "UK bank holidays" as one list is simply wrong, and the calculator refuses to guess.';

const HOLIDAY_RANGE =
  'The holiday data covers 2026 and 2027 only, taken from the GOV.UK bank holidays register. A working-day request for a year outside that range is REFUSED with a message saying so, rather than silently returning a weekday count dressed up as a working-day count.';

const TIME_FORMAT =
  'Times are accepted as HH:MM or HH:MM:SS on a 24-hour clock. Anything else is refused with the expected format shown, because "5.30" is ambiguous between half past five and five hours thirty of something.';

Object.assign(notes, {

  "DAT-002": {
    purpose: "Add or subtract a period of years, months and days from a date.",
    scope: "One start date and any combination of years, months and days, in either direction.",
    assumptions: ["The Gregorian calendar throughout, with no allowance for the 1752 changeover."],
    validation: [
      "A malformed or impossible date is refused with the expected ISO format.",
      "The three period fields may be mixed freely and may be zero."
    ],
    formula: "Years and months are applied first, then days. Where the resulting day of the month does not exist, the date is clamped to the last day of that month.",
    boundary: "MONTH ARITHMETIC IS NOT ASSOCIATIVE AND THE ORDER MATTERS. Adding one month to 31 January gives 28 February in a common year, not 3 March, and the clamping is reported through a dedicated output and a warning rather than left for the reader to notice. Applying the days before the months would give a different answer for the same inputs, so the order is fixed, documented and asserted in tests. " + UTC,
    methodology: "The oracle builds result dates by counted day numbers from a fixed epoch and by explicit month-length tables, never by the Date object the engine uses, so a shared library bug could not hide. Month-end clamping is asserted in both directions and across a leap year.",
    rules: "Not rules-sensitive; the calendar contains no statutory values.",
    related: ["DAT-003 Day Counter", "DAT-004 Day of the Week Calculator"]
  },

  "DAT-003": {
    purpose: "Count the days, weekdays, working days and bank holidays between two dates.",
    scope: "Two dates, optionally with a UK division for working-day counting.",
    assumptions: ["Working days are Monday to Friday excluding bank holidays for the chosen division."],
    validation: [
      "An end date before the start date is refused rather than returning a negative count.",
      HOLIDAY_RANGE
    ],
    formula: "Days are counted directly. Working days subtract weekends and then bank holidays that fall on a weekday, so a holiday falling on a Saturday is not double counted.",
    boundary: "TWO DAY COUNTS ARE RETURNED, NOT ONE, because the question is genuinely ambiguous. The inclusive total counts both end dates and is what you want for the length of a hotel stay or a period of leave; the exclusive figure omits the start and is what you want for an interval or a notice period. Presenting a single number would be wrong for half of all readers. The month and year figures are labelled approximate because calendar months differ in length and no single conversion is exact. " + DIVISIONS,
    methodology: "The oracle counts days one at a time from the start date, classifying each by Zeller's congruence and against a re-typed holiday list, rather than by any arithmetic the engine performs. A test asserts that the same range yields one more working day in Scotland than in England & Wales across an Easter that Scotland does not observe.",
    rules: "Rules-sensitive. The bank holiday dates live in the versioned ruleset with a source-register entry naming the GOV.UK register they were taken from and the date they were checked.",
    related: ["DAT-002 Date Calculator", "DAT-004 Day of the Week Calculator"]
  },

  "DAT-004": {
    purpose: "Identify the weekday, ISO week, quarter and position in the year for a date.",
    scope: "A single date.",
    assumptions: ["ISO 8601 week numbering."],
    validation: ["A malformed or impossible date is refused with the expected ISO format."],
    formula: "The weekday comes from the calendar; the week number follows ISO 8601, where weeks begin on Monday and week 1 is the week containing the first Thursday of the year.",
    boundary: "THE ISO WEEK IS NOT THE DAY OF THE YEAR DIVIDED BY SEVEN. That naive calculation is wrong for most of January in most years. Under the ISO rule, 1 January 2027 falls in week 53 of 2026, and the calculator says so rather than reporting week 1. Payroll and reporting systems that mix the two conventions produce silent off-by-one-week errors. " + UTC,
    methodology: "The oracle derives the weekday from Zeller's congruence and the ISO week from the Thursday rule applied by explicit counting, both independent of the engine. Year-boundary cases in both directions are included specifically.",
    rules: "Not rules-sensitive.",
    related: ["DAT-002 Date Calculator", "DAT-003 Day Counter"]
  },

  "DAT-005": {
    purpose: "Add or subtract hours, minutes and seconds from a time of day.",
    scope: "A start time and a period, in either direction.",
    assumptions: ["A 24-hour clock with no daylight saving transition inside the calculation."],
    validation: [TIME_FORMAT],
    formula: "The whole calculation is done in seconds, then reduced modulo a day, with the number of whole days carried reported separately.",
    boundary: "THE DAYS CARRIED FIGURE IS AN OUTPUT, NOT A DETAIL. Adding nine hours to 20:00 gives 05:00 the following day, and returning the bare time would be actively misleading; a warning states which day the result falls on. Negative results wrap backwards correctly, which a plain remainder operator in most languages does not do.",
    methodology: "The oracle works in total seconds from midnight using floor division, so a truncating remainder in the engine would show up immediately on the backwards-wrapping cases, of which several are included.",
    rules: "Not rules-sensitive.",
    related: ["DAT-006 Time Duration Calculator", "DAT-007 Hours Calculator"]
  },

  "DAT-006": {
    purpose: "Measure the duration between two times of day.",
    scope: "A start and an end time.",
    assumptions: ["An end time earlier than the start means the period crosses midnight."],
    validation: [TIME_FORMAT],
    formula: "The difference in seconds, with a day added when the end precedes the start, expressed as hours, minutes and seconds and also as decimal hours.",
    boundary: "AN END TIME BEFORE THE START IS A NIGHT SHIFT, NOT A NEGATIVE DURATION. 22:00 to 06:00 is eight hours, and the crossing is reported as an output so the reader can confirm the interpretation matches what they meant. The decimal hours figure is given because payroll systems want 7.5 for seven hours thirty, and readers who type 7.30 into a payroll sheet under-report themselves by eighteen minutes.",
    methodology: "The oracle computes durations from independently derived second counts and asserts the decimal conversion separately from the hours-and-minutes breakdown, so a shared conversion error could not pass both.",
    rules: "Not rules-sensitive.",
    related: ["DAT-005 Time Calculator", "DAT-009 Time Card Calculator"]
  },

  "DAT-007": {
    purpose: "Total the hours across a set of shifts, separating regular from overtime.",
    scope: "A list of shifts, each with a start, an end and an optional unpaid break, and a weekly overtime threshold.",
    assumptions: ["Breaks given in the shift are unpaid."],
    validation: [
      TIME_FORMAT,
      "A break longer than the shift itself is refused.",
      "The shift list must be a list; a malformed entry names the expected shape."
    ],
    formula: "Each shift's worked time is its span less its break. The totals are summed, and hours above the weekly threshold are classified as overtime.",
    boundary: "BREAKS ARE DEDUCTED PER SHIFT BEFORE ANYTHING IS TOTALLED. Deducting the total break from the total hours gives the same answer here but not once a per-shift maximum or a daily threshold is introduced, so the order is fixed now and asserted. Overtime is measured against a WEEKLY threshold rather than a daily one, because that is how most UK contracts express it; a twelve-hour Monday followed by a quiet week is not overtime.",
    methodology: "The oracle totals shifts in minutes as integers, avoiding the floating-point accumulation the engine's hour figures could mask, and a test asserts the break deduction happens before the totalling by using a case where the two orders would diverge.",
    rules: "Not rules-sensitive.",
    related: ["DAT-006 Time Duration Calculator", "DAT-009 Time Card Calculator"]
  },

  "DAT-008": {
    purpose: "Convert a date and time between two time zones.",
    scope: "A date, a time, a source zone and a target zone, given as IANA names.",
    assumptions: ["The runtime's own IANA time zone database is authoritative for the date entered."],
    validation: [
      TIME_FORMAT,
      "An unrecognised zone name is refused with a note that IANA names such as Europe/London are expected."
    ],
    formula: "Both offsets are resolved for the actual instant by a short fixed-point iteration against the runtime's zone data, then applied.",
    boundary: "OFFSETS ARE RESOLVED FOR THE DATE ENTERED, NOT TAKEN FROM A FIXED TABLE. A fixed table is wrong for roughly half of every year in any zone observing daylight saving, and the zones rarely switch on the same day: London is five hours ahead of New York for most of the year but FOUR for about two weeks each spring, when the United States has moved and Britain has not. A test asserts exactly that three-way pattern, winter, spring gap and summer, because a table-driven implementation would pass the first and last and fail the middle.",
    methodology: "The oracle derives offsets through a separate formatting path and asserts the gap fortnight explicitly, so an implementation that resolved the offset for the wrong instant, a real and easy mistake near a transition, would be caught.",
    rules: "Not rules-sensitive; zone data comes from the runtime rather than the ruleset.",
    related: ["DAT-005 Time Calculator", "DAT-006 Time Duration Calculator"]
  },

  "DAT-009": {
    purpose: "Turn a week of shifts into hours and gross pay, separating overtime.",
    scope: "A list of shifts with breaks, an hourly rate, a weekly overtime threshold and an overtime multiplier.",
    assumptions: ["Breaks are unpaid.", "The rate given is the gross hourly rate."],
    validation: [
      TIME_FORMAT,
      "A break longer than the shift is refused.",
      "A negative rate or multiplier is refused."
    ],
    formula: "Hours are totalled as in DAT-007, split at the weekly threshold, and paid at the rate and at the rate times the multiplier respectively.",
    boundary: "THE PAY FIGURES ARE GROSS, BEFORE INCOME TAX AND NATIONAL INSURANCE, and the output says so rather than leaving a reader to assume it is take-home. Two points of UK law are stated because they are widely misunderstood: there is NO legal right to a premium rate for overtime unless the contract provides one, and average pay across all hours worked must still meet the National Minimum Wage, so a low basic rate is not cured by unpaid overtime. Pay is omitted entirely rather than shown as zero when no rate is supplied.",
    methodology: "Pay is asserted against integer-minute hour totals in the oracle, and a case with no rate asserts that the pay outputs are absent rather than zero, which a reader could otherwise mistake for unpaid work.",
    rules: "Not rules-sensitive. The National Minimum Wage point is narrative; the calculator does not test compliance against it.",
    related: ["DAT-007 Hours Calculator", "DAT-006 Time Duration Calculator"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
