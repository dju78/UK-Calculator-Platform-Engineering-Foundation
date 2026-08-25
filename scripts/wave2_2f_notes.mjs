/**
 * Narrative specification sections for Wave 2 tranche 2F, Pensions & Retirement.
 * Merged into docs/specs/wave2/_notes.json for the spec generator.
 *
 * Run: node scripts/wave2_2f_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const RULES_NOTE =
  'Rules-sensitive. Every statutory figure is read from the versioned UK Rules Engine ruleset `uk-2026-27-v1`, whose source register names the primary GOV.UK or HMRC page each value came from. No statutory value is hard-coded in a React component or in this calculator.';

const NOT_ADVICE =
  'A projection on the assumptions entered. Investment returns are not guaranteed, and this is not pension, investment or financial advice. Pension decisions are difficult to reverse; the calculator points users to MoneyHelper and Pension Wise rather than implying it can replace them.';

const POUND_METHOD =
  'Benchmarks come from an independent oracle that re-types the statutory tables from the primary sources and sums Income Tax one pound at a time, rather than walking the band table the engine uses.';

Object.assign(notes, {

  "PEN-004": {
    purpose: "Show what an employer and employee actually pay into a workplace pension, and whether that meets the automatic enrolment minimum.",
    scope: "One salary, a contribution basis, and an employer and employee percentage, compared against the statutory minimums.",
    assumptions: [
      "The salary entered is the annual figure the scheme uses.",
      "Statutory minimums are always measured on qualifying earnings, whatever basis the scheme itself uses."
    ],
    validation: [
      "Contribution rates must be between 0% and 100% of the contribution basis.",
      "Where earnings are below the automatic enrolment trigger, the calculator says the employer need not enrol the worker, and that the worker can usually ask to join."
    ],
    formula: "Qualifying earnings are the band between the lower and upper limits: `min(salary, upper) - lower`, floored at zero. Pensionable earnings are that band on a qualifying earnings basis, or the whole salary on a basic pay or total pay basis. Contributions are the chosen rates applied to pensionable earnings. The statutory minimums are the employer minimum rate and the total minimum rate applied to qualifying earnings.",
    boundary: "The BASIS is the whole point. A scheme quoting the same headline percentage can contribute very different amounts depending on whether it uses the statutory band or whole pay, and the benchmark set proves this with a matched pair on the same salary. This calculator does not model salary definitions unique to an individual scheme, tiered contribution ladders, or defined benefit accrual.",
    methodology: "Benchmarks were derived independently from the re-typed qualifying earnings band, and include a matched pair on the same salary differing only in basis, an earner above the upper limit, and an earner below the trigger.",
    rules: RULES_NOTE,
    related: ["PEN-003 Workplace Pension", "PEN-005 Pension Tax Relief", "TAX-005 Salary Sacrifice"]
  },

  "PEN-005": {
    purpose: "Show how much tax relief a pension contribution attracts, how much of it must be claimed rather than given automatically, and whether the annual allowance is exceeded.",
    scope: "One tax year: gross income, a personal contribution under one of the three arrangements, an employer contribution, and the annual allowance including the taper and the money purchase allowance.",
    assumptions: [
      "Relief at source contributions are entered net, as they leave the member's bank account, and the provider adds basic-rate relief.",
      "Net pay and salary sacrifice contributions are entered gross.",
      "Carry forward of unused allowance from earlier years is not modelled."
    ],
    validation: [
      "Relief on personal contributions is limited to relevant UK earnings, and the calculator warns when the gross contribution exceeds income.",
      "An excess over the annual allowance is reported with a note that carry forward may cover it."
    ],
    formula: "Under relief at source the gross contribution is `payment / (1 - basic rate)`, and the higher or additional rate relief still claimable is the total Income Tax relief less the basic-rate relief already added. Under net pay and salary sacrifice the full relief is immediate and nothing is claimable. Total Income Tax relief is measured as the difference in tax with and without the gross contribution, so band effects and the Personal Allowance taper are captured automatically. The annual allowance taper applies only where BOTH the threshold income and the adjusted income limits are exceeded, reducing the allowance by £1 for every £2 of adjusted income above its limit, down to the minimum.",
    boundary: "Higher and additional rate relief under relief at source is NOT automatic: it must be claimed through Self Assessment or from HMRC, and a great deal of it goes unclaimed. The calculator says so rather than quietly including it in a headline. National Insurance savings under salary sacrifice are not shown here; TAX-005 covers them. Carry forward, defined benefit pension input amounts and scheme pays are out of scope. " + NOT_ADVICE,
    methodology: POUND_METHOD + " Benchmarks include a case with high adjusted income but threshold income below its limit, which must NOT be tapered - the test that catches the most common implementation of the taper.",
    rules: RULES_NOTE,
    related: ["PEN-004 Employer Pension Contribution", "TAX-005 Salary Sacrifice", "TAX-003 Take-Home Pay"]
  },

  "PEN-007": {
    purpose: "Bring a pension pot, the State Pension and other income together into one retirement income figure, after tax.",
    scope: "A pot with an optional tax-free lump sum, a drawdown rate, State Pension entitlement from qualifying years, and other income, for one year.",
    assumptions: [
      "The drawdown rate is applied to the pot after any tax-free lump sum.",
      "State Pension entitlement is proportionate to qualifying years above the ten-year minimum.",
      "Income is assessed for one year; the pot is not projected forward."
    ],
    validation: [
      "The drawdown rate must be between 0% and 100% of the pot.",
      "Where a quarter of the pot exceeds the lump sum allowance, the lump sum is capped and the user is told."
    ],
    formula: "The tax-free lump sum is the smaller of a quarter of the pot and the lump sum allowance. Drawdown income is the rate applied to what remains. Taxable income is drawdown plus State Pension plus other income, and Income Tax is charged on that total.",
    boundary: "The tax-free lump sum is not income and is excluded from the taxable total. The State Pension IS taxable even though it is paid without deduction, and the tax is collected through the code on other income, which is what catches people out. This is a one-year snapshot, not a sustainability projection; PEN-008 answers how long the pot lasts. " + NOT_ADVICE,
    methodology: POUND_METHOD + " Benchmarks include a pot large enough for the lump sum allowance to bite, a record below the ten-year State Pension minimum, and a total income inside the Personal Allowance.",
    rules: RULES_NOTE,
    related: ["PEN-008 Pension Drawdown", "PEN-009 Annuity", "PEN-010 State Pension", "TAX-001 Income Tax"]
  },

  "PEN-008": {
    purpose: "Answer how long a pension pot lasts under drawdown, and what a sustainable withdrawal would be instead.",
    scope: "A pot with an optional tax-free lump sum, a first-year withdrawal that rises with inflation, investment growth, and a projection period.",
    assumptions: [
      "The withdrawal is taken at the start of each year and the remaining balance grows for the rest of it.",
      "Withdrawals rise with inflation each year.",
      "Growth and inflation are constant."
    ],
    validation: [
      "Where the pot runs out, the calculator says in which year and offers the withdrawal that would have lasted."
    ],
    formula: "The pot is simulated year by year: withdraw, then grow the remainder, then index the next withdrawal to inflation. The sustainable withdrawal is the first-year figure that leaves the pot at zero exactly at the end of the projection, found by bisection because inflation indexing and growth together have no closed form.",
    boundary: "Withdrawals above the tax-free lump sum are taxable as income, which this projection does NOT deduct - the figures are gross. Constant returns are a modelling convenience: real sequence-of-returns risk means a fall in the early years does far more damage than the same fall later. Drawdown also leaves the saver exposed to living longer than the projection. " + NOT_ADVICE,
    methodology: "Benchmarks were derived by an independent year-by-year simulation. The sustainable withdrawal is deliberately NOT pinned to the penny in the benchmarks, because comparing two root searches tests their convergence rather than the model; it is covered instead by a property test that withdraws the engine's own answer and checks the pot really ends at zero.",
    rules: RULES_NOTE,
    related: ["PEN-007 Retirement Income", "PEN-009 Annuity", "PEN-012 Retirement Target"]
  },

  "PEN-009": {
    purpose: "Show the income a pot buys at a quoted annuity rate, and what the options cost in starting income.",
    scope: "A pot with an optional tax-free lump sum, an annuity rate, escalation, a guarantee period and a spouse's pension, projected over a chosen period.",
    assumptions: [
      "The annuity rate quoted applies to the amount used to buy the annuity.",
      "Income escalates at a constant rate each year.",
      "The guarantee period pays the same escalating income to the estate."
    ],
    validation: [
      "The annuity rate must be above zero; a guarantee period cannot be negative; a spouse's pension is between 0% and 100%."
    ],
    formula: "Income in the first year is the purchase amount times the annuity rate, rising by the escalation rate each year. The guaranteed minimum is the sum of the escalating income across the guarantee period. Years to recover the purchase price is the first year in which cumulative income reaches the amount handed over.",
    boundary: "The annuity rate is an INPUT, not a market figure this calculator knows: it is set by the insurer and depends on age, health, postcode and the options chosen. The calculator prices the options the buyer selects rather than pretending to quote. Annuity income is taxable, and a level annuity loses buying power every year. " + NOT_ADVICE,
    methodology: "Benchmarks were derived by independent year-by-year accumulation, and include a level annuity, an escalating one, a guarantee period, a joint-life option and a pot large enough for the lump sum allowance to cap the tax-free amount.",
    rules: "Uses only the tax-free lump sum proportion and the lump sum allowance from the ruleset. The annuity rate itself is not a statutory value.",
    related: ["PEN-007 Retirement Income", "PEN-008 Pension Drawdown"]
  },

  "PEN-010": {
    purpose: "Estimate new State Pension entitlement from qualifying years, and show what another year is worth.",
    scope: "Qualifying years to date and further years expected, converted into a weekly and annual entitlement.",
    assumptions: [
      "The record began after April 2016, so entitlement is proportionate to qualifying years.",
      "Years above the full requirement add nothing."
    ],
    validation: [
      "Qualifying years cannot be negative.",
      "Below the minimum the entitlement is reported as nil, with an explanation that this is a threshold and not a sliding scale."
    ],
    formula: "Entitlement is the full weekly amount times qualifying years divided by the years needed for the full amount, capped at the full amount, and NIL below the minimum qualifying years. The value of one more year is the difference the next year would make, which is zero once the record is full and can be a jump from nothing to a real income at the threshold.",
    boundary: "The minimum is a CLIFF, not a taper: a calculator that scales linearly from zero would tell someone with eight qualifying years that they will receive a pension they will not receive. This is an estimate, not a forecast: records that began before April 2016 are worked out under transitional rules using a starting amount. It also does not work out State Pension AGE, which depends on date of birth; users are sent to the GOV.UK tool for that.",
    methodology: "Benchmarks were derived independently and include a matched pair at nine qualifying years, with and without one further year, so the threshold behaviour is proved rather than assumed.",
    rules: RULES_NOTE,
    related: ["PEN-007 Retirement Income", "PEN-012 Retirement Target"]
  },

  "PEN-012": {
    purpose: "Work back from a target retirement income to the pot it needs and the monthly saving that reaches it.",
    scope: "A target income, current pot, current monthly contribution, years to retirement, growth, a withdrawal rate, and optionally the State Pension.",
    assumptions: [
      "Contributions are made monthly and grow at the stated rate.",
      "The withdrawal rate chosen is sustainable for as long as the saver lives.",
      "The State Pension, if included, is payable from the start of retirement."
    ],
    validation: [
      "The withdrawal rate must be above zero, because a target pot is undefined otherwise."
    ],
    formula: "The pot must supply the target income less any State Pension, so the target pot is that shortfall divided by the withdrawal rate. The projected pot is the current pot grown to retirement plus the future value of the monthly contributions. The required contribution is solved DIRECTLY by inverting that same future-value relation, `(target pot - grown pot) / annuity factor`, rather than searched for.",
    boundary: "Whether a withdrawal rate is safe is a judgement, not a fact, and this calculator uses whichever the user enters. Figures are in today's money only if the growth rate entered is a real rate above inflation - a point stated plainly, because mixing a nominal growth rate with a today's-money target is the most common way to overstate readiness. " + NOT_ADVICE,
    methodology: "Benchmarks were derived independently, including a matched pair differing only in whether the State Pension is counted, which changes the target pot sharply, and a pair differing only in the withdrawal rate.",
    rules: RULES_NOTE,
    related: ["PEN-008 Pension Drawdown", "PEN-010 State Pension", "PEN-005 Pension Tax Relief"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
