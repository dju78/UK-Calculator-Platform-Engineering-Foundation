/**
 * Author the narrative specification sections for Wave 2 tranches 2D and 2E.
 *
 * These sections cannot be derived from code - purpose, scope, model boundary
 * and methodology are editorial judgements - so they are written by hand here
 * and merged into docs/specs/wave2/_notes.json, which the spec generator then
 * reads. Everything else in a specification stays derived.
 *
 * Run: node scripts/wave2_2de_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const p = path.join(ROOT, 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const RULES_NOTE =
  'Rules-sensitive. Every statutory figure is read from the versioned UK Rules Engine ruleset `uk-2026-27-v1`, which carries a source register naming the primary GOV.UK or HMRC page each value came from. No statutory value is hard-coded in a React component or in this calculator.';

const NOT_ADVICE =
  'An estimate on the figures entered, not a tax computation, an HMRC liability, or tax advice. Individual circumstances change the answer.';

const POUND_METHOD =
  'Benchmarks were derived by an independent oracle that re-types the statutory tables from the primary sources and sums tax one pound at a time, looking the marginal rate up for each pound, rather than walking the band table the engine uses. A band-boundary error therefore cannot be reproduced identically on both sides.';

const CLOSED_FORM_METHOD =
  'Benchmarks were derived by an independent oracle that solves the same recurrence in closed form, where the engine iterates period by period. Neither side calls the other, and a shared iteration slip cannot pass unnoticed.';

Object.assign(notes, {

  "ISA-003": {
    purpose: "Show how much of a portfolio's return is lost to tax when it is held outside an ISA, so the value of the wrapper is a number rather than a slogan.",
    scope: "A single portfolio with capital growth and a dividend yield, held for a fixed term and realised at the end, compared inside a stocks and shares ISA and inside a taxable general investment account.",
    assumptions: [
      "The portfolio itself performs identically in both wrappers; only the tax differs.",
      "Dividends are reinvested each month and therefore raise the cost basis of the taxable holding.",
      "Dividend tax on the taxable account is settled from money outside the portfolio.",
      "The whole gain is realised in a single tax year at the end of the term.",
      "The dividend allowance and the capital gains annual exempt amount are entirely available to this holding."
    ],
    validation: [
      "The projection warns when contributions exceed the annual ISA subscription limit, because that much could not actually be sheltered in one tax year."
    ],
    formula: "The holding follows `v_k = v_{k-1} (1 + g_m)(1 + d_m) + c` each month, where `g_m` is the monthly capital growth, `d_m` the monthly dividend yield and `c` the contribution. The cost basis rises by contributions and by reinvested dividends. Dividend tax is charged once every twelve months on the year's dividends above the allowance. Capital gains tax is charged on the final gain above the annual exempt amount, split between the 18% and 24% rates by how much basic rate band the investor has left.",
    boundary: "A projection, not a recommendation between two products. Selling units to pay the dividend tax would itself be a disposal and create a further gain, which is deliberately not modelled; the tax is shown as a cost instead. Not investment advice.",
    methodology: CLOSED_FORM_METHOD,
    rules: RULES_NOTE,
    related: ["ISA-001 ISA Allowance", "ISA-006 Cash ISA", "TAX-011 Dividend Tax", "TAX-012 Capital Gains Tax"]
  },

  "ISA-004": {
    purpose: "Project a Lifetime ISA and show plainly what the 25% withdrawal charge costs, which is the single most misunderstood feature of the product.",
    scope: "Contributions up to the annual Lifetime ISA limit, the 25% government bonus, growth to a chosen withdrawal date, and the withdrawal charge where the withdrawal does not qualify.",
    assumptions: [
      "Contributions are made once a year and the bonus is credited at the same point.",
      "The bonus is 25% of the contribution, capped at the published annual maximum.",
      "Growth is applied after the contribution and bonus each year."
    ],
    validation: [
      "Contributions above the annual limit are capped, and the user is told they earn no bonus.",
      "A first-home withdrawal for a property above the price cap is treated as NOT charge free, because it is not."
    ],
    formula: "Each year `v = (v + c + b) G`, where `c` is the capped contribution, `b` the bonus and `G` one plus the growth rate. The withdrawal charge is 25% of the amount withdrawn. Because the bonus was 25% of the contribution, a 25% charge on the larger post-bonus balance recovers the entire bonus and a further 6.25% of the saver's own money, which is reported as its own output.",
    boundary: "A projection of one product on stated assumptions. Eligibility depends on age at opening and at contribution, and on the withdrawal reason; those rules are stated but not enforced against a date of birth. Not investment or financial advice.",
    methodology: CLOSED_FORM_METHOD + " One benchmark deliberately isolates the charge at zero growth over one year, so the 6.25% claim is proved arithmetically rather than asserted.",
    rules: RULES_NOTE,
    related: ["ISA-001 ISA Allowance", "ISA-003 ISA vs GIA", "PRO-013 First-Time Buyer"]
  },

  "ISA-005": {
    purpose: "Project a Junior ISA to the child's eighteenth birthday, and make clear that the money becomes theirs at that point.",
    scope: "Annual contributions up to the Junior ISA limit, growth to maturity at 18, from the child's current age.",
    assumptions: [
      "Contributions are made once a year and growth applied after them.",
      "The account matures at 18 and no withdrawals are made before then."
    ],
    validation: [
      "The child's age must be from 0 to one year below the maturity age; anything else is rejected with a readable message rather than silently producing a nonsense term.",
      "Contributions above the annual limit are capped and the user is told."
    ],
    formula: "Each year `v = (v + c) G`, where `c` is the capped contribution and `G` one plus the growth rate. The term is the maturity age less the child's current age.",
    boundary: "The money in a Junior ISA belongs to the child. They take control of the account at 16 and can withdraw the whole balance at 18, whatever it was saved for, and nothing can be withdrawn before then except in tightly limited circumstances. That is a product fact the projection states rather than a risk it can model. Not investment advice.",
    methodology: CLOSED_FORM_METHOD,
    rules: RULES_NOTE,
    related: ["ISA-001 ISA Allowance", "ISA-003 ISA vs GIA"]
  },

  "ISA-006": {
    purpose: "Compare a Cash ISA with an ordinary taxable savings account, and say honestly when the ISA gives no advantage at all.",
    scope: "An opening balance and monthly contributions at a fixed rate, over a fixed term, with tax on the taxable account deducted annually.",
    assumptions: [
      "Interest compounds monthly at a rate equivalent to the stated annual rate.",
      "Tax on the taxable account is deducted from that account each year, so the drag compounds.",
      "The Personal Savings Allowance and the starting rate for savings are entirely available to this account.",
      "The saver's other income determines their band and their starting rate band."
    ],
    validation: [
      "The comparison reports when the advantage is nil, rather than presenting a zero difference without explanation."
    ],
    formula: "Both accounts follow `v_k = v_{k-1}(1 + i) + c` monthly. At each year end the taxable account's interest for the year is reduced first by any remaining starting rate for savings band, then by the Personal Savings Allowance; whatever is left is taxed at the saver's marginal rate and deducted from the balance.",
    boundary: "If the saver holds other interest-bearing accounts, those use the same allowances, so the real advantage of the ISA would be larger than shown. Rates are assumed constant; in practice introductory rates expire. Not financial advice.",
    methodology: CLOSED_FORM_METHOD + " The closed form is applied within each tax year and the tax deducted between years, which reproduces the engine's annual settlement without reproducing its loop.",
    rules: RULES_NOTE,
    related: ["ISA-001 ISA Allowance", "ISA-003 ISA vs GIA", "INV-018 Savings"]
  },

  "TAX-005": {
    purpose: "Show what a salary sacrifice pension arrangement actually costs in take-home pay, and how much reaches the pension for that cost.",
    scope: "An annual salary, a percentage sacrificed, and an employer contribution expressed as a percentage of the reduced salary, with Income Tax, National Insurance and student loan recalculated on the reduced pay.",
    assumptions: [
      "The sacrifice reduces gross pay before Income Tax, National Insurance and student loan are assessed.",
      "The employer contribution is a percentage of post-sacrifice pay, as scheme rules normally express it.",
      "The full-year position is compared; payroll rounding within the year is not modelled."
    ],
    validation: [
      "A sacrifice below 0% or above 100% of salary is rejected."
    ],
    formula: "The same full-year PAYE position function is run twice, once on gross salary and once on gross less the sacrifice. Every saving reported is a difference between those two positions, so the two sides cannot drift apart. The cost per pound in the pension is the reduction in take-home divided by the total reaching the pension.",
    boundary: "Employer National Insurance savings are deliberately not modelled: whether an employer passes any of that on is a matter of scheme design rather than statute, so inventing a share would put an unearned figure in front of the user. A sacrifice cannot lawfully reduce pay below the National Minimum Wage for the hours worked, and it reduces the salary figure used for mortgages, redundancy pay and some benefits. " + NOT_ADVICE,
    methodology: POUND_METHOD,
    rules: RULES_NOTE,
    related: ["TAX-003 Take-Home Pay", "TAX-009 Bonus Tax", "PEN-003 Workplace Pension"]
  },

  "TAX-006": {
    purpose: "Convert an hourly rate into the equivalent annual, monthly, weekly and daily gross pay.",
    scope: "Gross pay conversion on a stated working pattern. No tax or National Insurance is applied.",
    assumptions: [
      "Every paid week is worked at the stated hours.",
      "Paid weeks per year default to 52 and hours per week to 37.5 only when the user has supplied neither."
    ],
    validation: [
      "Hours per week are required, because an hourly rate cannot be annualised without them; the calculator refuses rather than assuming a figure the user never saw.",
      "Hours must be above zero and paid weeks between 1 and 53."
    ],
    formula: "Annual pay is `rate x hours per week x paid weeks per year`. Every other frequency is derived from that single annual figure, so the four views can never disagree with one another.",
    boundary: "Gross pay before any deductions. Unpaid leave, sickness and variable rotas will change the annual figure.",
    methodology: "Benchmarks were derived by direct arithmetic on the stated pattern, independent of the engine, and each case is asserted twice: once forwards through TAX-006 and once backwards through TAX-007, so the pair must be exact inverses.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["TAX-007 Salary to Hourly", "TAX-002 Salary Calculator", "TAX-008 Overtime Pay"]
  },

  "TAX-007": {
    purpose: "Convert an annual salary into the equivalent hourly, daily, weekly and monthly gross pay.",
    scope: "Gross pay conversion on a stated working pattern. No tax or National Insurance is applied.",
    assumptions: [
      "Pay is spread evenly across the hours entered.",
      "Defaults of 37.5 hours and 52 paid weeks apply only when the user supplies neither."
    ],
    validation: [
      "Hours must be above zero and paid weeks between 1 and 53."
    ],
    formula: "Hourly pay is `annual salary / (hours per week x paid weeks per year)`. This is the exact inverse of TAX-006 on the same pattern, and shares the same conversion layer rather than reimplementing it.",
    boundary: "Gross pay before any deductions. Salaried work often involves unpaid additional hours, which would lower the true hourly rate.",
    methodology: "Every benchmark is the inverse of the matching TAX-006 case, so a rounding or convention drift between the two directions would fail immediately.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["TAX-006 Hourly to Salary", "TAX-002 Salary Calculator"]
  },

  "TAX-008": {
    purpose: "Work out gross pay for a period that includes overtime at one or two premium rates, and the blended rate that results.",
    scope: "One pay period: standard hours at the base rate, overtime hours at a multiplier, and an optional second premium tier such as double time.",
    assumptions: [
      "All hours in a tier are paid at that tier's rate.",
      "The annualised figure assumes every pay period looks like this one, which overtime rarely does."
    ],
    validation: [
      "Negative hours are rejected.",
      "A multiplier below 1 is rejected, because it would pay less than the standard rate and is almost always a typing error."
    ],
    formula: "`total = rate x standard + rate x overtime multiplier x overtime hours + rate x premium multiplier x premium hours`. The blended rate is the total divided by all hours worked.",
    boundary: "Gross pay before deductions. There is no legal right to a higher rate for overtime in the UK unless the contract provides one, and average pay across all hours worked must still meet the National Minimum Wage.",
    methodology: "Benchmarks were derived by direct arithmetic independent of the engine, covering plain-time overtime, a single premium tier, both tiers together, and no overtime at all.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["TAX-006 Hourly to Salary", "TAX-002 Salary Calculator"]
  },

  "TAX-009": {
    purpose: "Show what a bonus is actually worth after tax, and reveal the effective rate when it lands in the Personal Allowance taper.",
    scope: "An annual salary plus a one-off bonus, with an optional share of the bonus sacrificed into a pension.",
    assumptions: [
      "The bonus is paid in the same tax year as the salary.",
      "Any share sacrificed into a pension is removed from pay before tax and National Insurance.",
      "The full-year position is used; the payslip in the bonus month may deduct more and correct itself later through cumulative PAYE."
    ],
    validation: [
      "The pension share must be between 0% and 100% of the bonus."
    ],
    formula: "A bonus has no tax rate of its own: it is taxed at the rate of the band it lands in on top of salary. The calculation is therefore the difference between two full-year positions, with and without the taxable part of the bonus. Where the bonus crosses £100,000 the withdrawal of the Personal Allowance is captured automatically, because the second position simply has a smaller allowance.",
    boundary: "A full-year estimate. " + NOT_ADVICE,
    methodology: POUND_METHOD + " One benchmark deliberately places a bonus across the Personal Allowance taper and asserts an effective rate of exactly 60%, which is the case simplified calculators get wrong.",
    rules: RULES_NOTE,
    related: ["TAX-003 Take-Home Pay", "TAX-005 Salary Sacrifice"]
  },

  "TAX-010": {
    purpose: "Decide whether a couple qualifies for Marriage Allowance and what the household actually gains.",
    scope: "Two incomes, a test of the eligibility conditions, and the household tax position before and after the transfer.",
    assumptions: [
      "Both partners are married or in a civil partnership.",
      "The transferring partner has income at or below the Personal Allowance and the receiving partner is a basic-rate taxpayer."
    ],
    validation: [
      "Where the couple does not qualify, the calculator says which condition failed rather than returning a bare zero."
    ],
    formula: "The transfer is asymmetric, and this is where simplified calculators go wrong. The lower earner gives up a fixed slice of Personal Allowance, which is modelled as a fixed-allowance tax code run back through the same Income Tax function so that a Scottish transferor is charged Scottish rates. The higher earner receives a fixed tax REDUCER, capped at the tax they actually owe, not extra allowance. Modelling the recipient side as an allowance increase would overstate the benefit for anyone near a band edge.",
    boundary: "The household figure is the one that matters: where the lower earner has some income, transferring can create a small tax bill for them that offsets part of the gain. A claim is made by the lower earner and can be backdated up to four tax years, which this calculator does not compute. " + NOT_ADVICE,
    methodology: POUND_METHOD + " Benchmarks include every failing eligibility condition as well as the qualifying case.",
    rules: RULES_NOTE,
    related: ["TAX-001 Income Tax", "TAX-003 Take-Home Pay"]
  },

  "TAX-011": {
    purpose: "Work out the tax on dividend income when it sits on top of other income, which is the position of most company directors and many investors.",
    scope: "Non-dividend income plus dividend income for one tax year, with the Personal Allowance, the dividend allowance and the three dividend rates applied in the statutory order.",
    assumptions: [
      "The Personal Allowance is set against non-dividend income first, which is the outcome of HMRC's ordering rules for almost every taxpayer.",
      "Dividends are the top slice of income."
    ],
    validation: [
      "The Personal Allowance taper is applied to total income including dividends, not to earnings alone."
    ],
    formula: "Dividends are stacked on top of non-dividend taxable income and charged at the basic, higher or additional dividend rate according to where each pound falls. The dividend allowance is a NIL RATE BAND, not an exemption: it uses up band space, so it does not push later dividends down into a cheaper band.",
    boundary: "Dividend taxation is reserved rather than devolved. A Scottish taxpayer pays Scottish rates on earnings but UK rates, using UK band widths, on dividends. That is modelled explicitly and proved by a benchmark. " + NOT_ADVICE,
    methodology: POUND_METHOD + " The Scottish benchmark asserts only the reserved dividend figures, so it proves that a Scottish taxpayer gets the SAME dividend tax as an English one on identical income, rather than merely re-checking devolved bands.",
    rules: RULES_NOTE,
    related: ["TAX-001 Income Tax", "ISA-003 ISA vs GIA", "TAX-018 Corporation Tax"]
  },

  "TAX-012": {
    purpose: "Estimate Capital Gains Tax on a disposal, including how much of the gain falls in each rate band.",
    scope: "One disposal: proceeds, acquisition cost, allowable costs, losses brought forward, and the taxpayer's other income.",
    assumptions: [
      "Losses are set against the gain before the annual exempt amount, which is the order that preserves the most allowance.",
      "The annual exempt amount is entirely available to this disposal."
    ],
    validation: [
      "A disposal at a loss produces no tax and says so, and the unused loss is reported as carried forward."
    ],
    formula: "Gain is proceeds less acquisition cost less allowable costs. Losses reduce it, then the annual exempt amount. What remains sits on top of taxable income: the part within the remaining basic rate band is charged at the lower rate and the rest at the higher rate.",
    boundary: "The gain uses the UK basic rate band even for a Scottish taxpayer, because Capital Gains Tax is reserved. Business Asset Disposal Relief, Investors' Relief, Private Residence Relief, gains inside trusts and non-resident charges are outside scope. " + NOT_ADVICE,
    methodology: POUND_METHOD + " The gain is placed on top of taxable income one pound at a time, so a band-split error cannot pass.",
    rules: RULES_NOTE,
    related: ["TAX-011 Dividend Tax", "ISA-003 ISA vs GIA", "PRO-017 Buy-to-Let"]
  },

  "TAX-014": {
    purpose: "Estimate Inheritance Tax on a death estate, including the residence nil rate band, a transferred band from a late spouse, and the reduced rate for leaving a tenth to charity.",
    scope: "A death estate with an optional home passing to direct descendants, optional charitable gifts, and optional transferred nil rate bands.",
    assumptions: [
      "The transferable bands are entered as a percentage of one band, so a wholly unused spouse's allowance is 100%.",
      "The residence nil rate band is capped at the value of the home actually passing to direct descendants.",
      "The 10% charity test is applied on a single-component simplification."
    ],
    validation: [
      "Transferred percentages outside 0 to 100 are rejected.",
      "Charitable gifts greater than the estate are rejected."
    ],
    formula: "Allowances are the nil rate band, any transferred nil rate band, and the residence nil rate band capped at the qualifying property value and then reduced by £1 for every £2 of estate above the taper threshold. Tax is charged on the estate less charitable gifts less allowances, at the standard rate, or at the reduced rate where charitable gifts reach a tenth of the estate after the nil rate bands.",
    boundary: "This does NOT model Business Relief, Agricultural Relief, trusts, lifetime transfers within seven years and their taper relief, gifts with reservation of benefit, or the statutory division of the estate into components for the charity test. An estate with any of those features needs professional advice, and the calculator says so. " + NOT_ADVICE,
    methodology: "Benchmarks were derived by independent arithmetic from the re-typed statutory figures, and include a matched pair either side of the 10% charity threshold to prove the rate cliff behaves correctly.",
    rules: RULES_NOTE,
    related: ["TAX-012 Capital Gains Tax", "PEN-007 Pension Drawdown"]
  },

  "TAX-016": {
    purpose: "Estimate the Income Tax and National Insurance a self-employed person owes on their profits, and the cash they will actually be asked for in January.",
    scope: "Trading profit from turnover less allowable expenses and capital allowances, with optional other income, for one tax year.",
    assumptions: [
      "Income Tax is charged on total income; Class 4 National Insurance is charged on trading profit alone.",
      "Class 2 is treated as paid, with no charge, once profits reach the small profits threshold.",
      "The payments on account figure assumes none of the liability was collected at source."
    ],
    validation: [
      "Profit cannot go below zero for tax purposes here; losses are not carried between years."
    ],
    formula: "Profit is turnover less allowable expenses less capital allowances. Income Tax is calculated on profit plus other income. Class 4 is charged at the main rate between the lower and upper profits limits and at the upper rate above. Where the total reaches the payments on account threshold, the January demand is the balancing payment plus the first payment on account.",
    boundary: "Class 1 National Insurance already paid on employment income is not offset against Class 4, because the annual maximum rules are outside scope. Losses are not carried, and the payments on account calculation assumes a standard position. " + NOT_ADVICE,
    methodology: POUND_METHOD + " Class 4 is also summed pound by pound on profits alone, so mixing the Income Tax base and the Class 4 base would fail immediately.",
    rules: RULES_NOTE,
    related: ["TAX-017 Sole Trader Profit & Tax", "TAX-018 Corporation Tax", "TAX-001 Income Tax"]
  },

  "TAX-017": {
    purpose: "Take a sole trader from turnover through to take-home, showing profit, tax, National Insurance and what is left each month.",
    scope: "Turnover, allowable expenses and capital allowances, with optional other income, for one tax year.",
    assumptions: [
      "The same tax and National Insurance basis as TAX-016; this calculator differs in starting from turnover and reporting margin and monthly take-home.",
      "Drawings are not an expense."
    ],
    validation: [
      "Where expenses exceed turnover, profit is nil rather than negative, and no tax arises."
    ],
    formula: "Gross profit is turnover less allowable expenses. Taxable profit additionally deducts capital allowances. Tax and Class 4 National Insurance follow the same computation as TAX-016, sharing one implementation rather than a second copy of it.",
    boundary: "A sole trader is taxed on profit, not on what they take out of the business, so the monthly take-home shown is profit after tax spread evenly and not a salary. VAT registration is a separate obligation and is flagged, not calculated. " + NOT_ADVICE,
    methodology: POUND_METHOD + " Each TAX-016 benchmark scenario is asserted again through TAX-017, so the two calculators cannot diverge on the same facts.",
    rules: RULES_NOTE,
    related: ["TAX-016 Self-Employment Tax", "TAX-018 Corporation Tax", "BUS-001 Profit Margin"]
  },

  "TAX-018": {
    purpose: "Calculate Corporation Tax including marginal relief, with the profit limits correctly adjusted for associated companies and short accounting periods.",
    scope: "One company's taxable profit for one accounting period, with a count of associated companies.",
    assumptions: [
      "The profit entered is already the taxable total profit after adjustments.",
      "Limits are divided by the number of associated companies plus one, and prorated by period length."
    ],
    validation: [
      "Associated companies must be a whole number of 0 or more.",
      "An accounting period must be between 1 and 18 months."
    ],
    formula: "Below the lower limit the small profits rate applies. At or above the upper limit the main rate applies. Between them, tax is main rate on the whole profit less marginal relief of the standard fraction times the shortfall from the upper limit. The marginal relief fraction is DERIVED from the two published boundary conditions rather than copied from a secondary source: `tax = 0.25A - F(250000 - A)` must give 19% at the lower limit, so `F = 3/200`.",
    boundary: "This estimates the charge on a stated taxable profit. It does not compute the taxable profit itself, and does not model loss relief, group relief, R&D relief, patent box, capital allowances, or quarterly instalment obligations. " + NOT_ADVICE,
    methodology: "Benchmarks were derived independently and include both published boundary points exactly, the middle of the marginal band, an associated company, and a short accounting period. Missing the associated company or the proration adjustment is the most common error in company tax estimates, so both have dedicated cases.",
    rules: RULES_NOTE,
    related: ["TAX-016 Self-Employment Tax", "TAX-011 Dividend Tax", "BUS-001 Profit Margin"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
