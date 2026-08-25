/**
 * Narrative specification sections for Wave 2 tranche 2G, Business & Commercial.
 * Run: node scripts/wave2_2g_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const NOT_ACCOUNTING_ADVICE =
  'A management estimate on the figures entered. It is not a statutory account, a tax computation, or accounting advice, and it follows no particular accounting standard.';

const SHARED_PROFIT =
  'BUS-003, BUS-004 and BUS-005 share ONE profit computation and differ only in how much of the profit and loss account they expose. Every benchmark scenario is asserted through more than one of them, so the three can never disagree about the same figures.';

Object.assign(notes, {

  "BUS-002": {
    purpose: "Convert between cost, price, markup and margin, and show both percentages side by side so they cannot be confused.",
    scope: "One product: a cost with either a selling price or a markup percentage.",
    assumptions: [
      "Cost is the full cost of the item being priced.",
      "Percentages are entered as human percentages."
    ],
    validation: [
      "Cost must be greater than zero, because a markup on nothing is undefined.",
      "Either a price or a markup percentage must be supplied; the calculator says so rather than guessing."
    ],
    formula: "Markup is profit divided by COST. Margin is profit divided by PRICE. Where a markup percentage is supplied instead of a price, the price is `cost x (1 + markup)`.",
    boundary: "Markup and margin are never the same number, and mixing them up is the most common pricing error in a small business: a 50% markup is a 33.3% margin. Both are therefore always returned together, never one alone.",
    methodology: "Benchmarks were derived by direct independent arithmetic, and every case asserts BOTH markup and margin, so the two could not be swapped without failing.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["BUS-001 Margin Calculator", "BUS-011 Pricing", "BUS-004 Gross Profit"]
  },

  "BUS-003": {
    purpose: "Work a business from revenue down to net profit, with the margin at each level.",
    scope: "One period: revenue, cost of sales, operating expenses, other income, interest and a tax rate.",
    assumptions: [
      "All figures are for the same period.",
      "The tax rate entered is the effective rate on taxable profit."
    ],
    validation: [
      "The tax rate must be between 0% and 100%.",
      "Tax is charged on a profit and never on a loss, so a loss-making period shows no tax rather than a refund."
    ],
    formula: "Gross profit is revenue less cost of sales. Operating profit deducts operating expenses. Profit before tax adds other income and deducts interest. Tax applies only where profit before tax is positive.",
    boundary: NOT_ACCOUNTING_ADVICE,
    methodology: "Benchmarks were derived independently and include a loss-making period, which proves the no-tax-on-a-loss rule. " + SHARED_PROFIT,
    rules: "Not rules-sensitive. The tax rate is entered by the user.",
    related: ["BUS-004 Gross Profit", "BUS-005 Net Profit", "TAX-018 Corporation Tax"]
  },

  "BUS-004": {
    purpose: "Work out gross profit and gross margin from revenue and the direct cost of sales.",
    scope: "Revenue and cost of goods sold for one period.",
    assumptions: [
      "Cost of goods sold covers direct costs only, not overheads."
    ],
    validation: [
      "A zero revenue produces a zero margin rather than a division by zero."
    ],
    formula: "Gross profit is revenue less cost of goods sold. Gross margin is gross profit over revenue; markup on cost is the same profit over cost.",
    boundary: "Gross profit excludes rent, salaries outside production and every other overhead, so it is always larger than the profit that reaches the bank account. Reading it as 'profit' is a common and expensive mistake. " + NOT_ACCOUNTING_ADVICE,
    methodology: SHARED_PROFIT,
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["BUS-003 Profit", "BUS-005 Net Profit", "BUS-002 Markup"]
  },

  "BUS-005": {
    purpose: "Show the full path from revenue to net profit, including what happens below the operating line.",
    scope: "One period, exposing gross, operating and net levels with other income, interest and tax.",
    assumptions: [
      "The same basis as BUS-003, presented with every intermediate level shown."
    ],
    validation: [
      "A loss is reported as a loss, with a warning, rather than being presented as a small profit."
    ],
    formula: "Identical to BUS-003; this calculator differs only in exposing other income and interest as separate outputs.",
    boundary: NOT_ACCOUNTING_ADVICE,
    methodology: SHARED_PROFIT,
    rules: "Not rules-sensitive. The tax rate is entered by the user.",
    related: ["BUS-003 Profit", "BUS-004 Gross Profit"]
  },

  "BUS-007": {
    purpose: "Work out commission earnings, including a threshold and an accelerator above target.",
    scope: "One commission period: sales, a threshold, a base rate, an optional accelerator target and rate, and a base salary.",
    assumptions: [
      "Commission is paid on sales above the threshold only.",
      "The accelerator rate applies only to sales above target; sales between the threshold and target stay at the base rate."
    ],
    validation: [
      "Commission rates cannot be negative.",
      "An accelerator target below the commission threshold is rejected as incoherent."
    ],
    formula: "Commissionable sales are sales less the threshold, floored at zero. Sales above target attract the accelerator rate; the remainder of commissionable sales attracts the base rate. Total earnings add the base salary.",
    boundary: "Quoting a headline commission rate without the threshold overstates earnings badly at low volumes, which is why the threshold is a first-class input rather than an optional extra. Figures are gross, before Income Tax and National Insurance.",
    methodology: "Benchmarks were derived independently and include sales below the threshold, sales exactly at target, and sales well above it, so the boundary between the two rates is pinned from both sides.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["TAX-003 Take-Home Pay", "BUS-003 Profit"]
  },

  "BUS-009": {
    purpose: "Produce a depreciation schedule under any of the four common methods.",
    scope: "One asset: cost, residual value, useful life, and the method, with a full year-by-year schedule.",
    assumptions: [
      "Depreciation is charged annually.",
      "Under units of production, the units for each year are supplied."
    ],
    validation: [
      "The residual value cannot exceed the cost.",
      "The useful life must be at least one year.",
      "Total expected units must be above zero when the units of production method is chosen.",
      "Every charge is floored so the book value can never fall below the residual value."
    ],
    formula: "Straight line charges the depreciable amount evenly. Reducing balance charges a fixed percentage of the opening book value. Sum of the years' digits weights the charge towards the early years by `(remaining life) / (sum of digits)`. Units of production apportions by output.",
    boundary: "This is accounting depreciation for management purposes, NOT capital allowances. HMRC does not accept depreciation as a deductible expense, and the tax relief actually available comes through capital allowances instead - a distinction the calculator states rather than leaves the user to discover. " + NOT_ACCOUNTING_ADVICE,
    methodology: "Benchmarks were derived by an independent year-by-year simulation, and include a 40% reducing balance over ten years specifically to prove the charge is floored at the residual value rather than running away below scrap.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["BUS-005 Net Profit", "TAX-016 Self-Employment Tax", "AUT-011 Vehicle Depreciation"]
  },

  "BUS-010": {
    purpose: "Track cash period by period and surface the point of greatest strain.",
    scope: "An opening balance with a list of inflows and outflows, one figure per period.",
    assumptions: [
      "Each period's net flow is applied in full at the end of that period."
    ],
    validation: [
      "The two lists must have the same number of periods.",
      "At least one period is required."
    ],
    formula: "The balance carries forward, adding each period's inflow and deducting its outflow. The lowest balance and the period it occurs in are tracked throughout, along with how many periods end negative.",
    boundary: "The output that matters is the LOWEST balance and when it happens, not the closing balance. A business can be profitable across the year and still be unable to meet payroll in month seven, and a calculator reporting only the year-end figure would conceal exactly that. This models cash, not profit, and does not attempt payment terms or debtor days.",
    methodology: "Benchmarks were derived independently and the leading case is deliberately profitable over the year while going negative in the middle of it, which is the whole reason the lowest balance is reported.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["BUS-005 Net Profit", "BUS-012 Project ROI", "FIN-014 Emergency Fund"]
  },

  "BUS-011": {
    purpose: "Price a product from a target margin, and show what a discount does to that margin.",
    scope: "One product: unit cost, target margin, VAT registration, an optional discount and fixed costs to cover.",
    assumptions: [
      "The margin entered is a margin, not a markup.",
      "VAT is the standard rate, read from the versioned ruleset."
    ],
    validation: [
      "A margin of 100% or more is rejected, because the price would have to be infinite.",
      "A negative margin, or a discount outside 0% to 100%, is rejected.",
      "Where the discount takes the price to or below cost, the calculator warns that every sale loses money."
    ],
    formula: "Price is `cost / (1 - margin)`. Multiplying cost by one plus the margin would be a MARKUP and would miss the target badly at high percentages. Break-even volume is fixed costs divided by the contribution per unit after any discount.",
    boundary: "A discount comes straight off profit, not off the margin percentage, which is why a 20% discount on a 30% margin leaves 12.5% and not 10%. Businesses routinely discount themselves into a loss by subtracting the discount from the margin, so a matched benchmark pair proves the correct behaviour.",
    methodology: "Benchmarks were derived independently, with the VAT standard rate re-typed from the primary source rather than read from the ruleset, so agreement corroborates the ruleset value as well as the arithmetic.",
    rules: "The VAT standard rate is read from the versioned UK Rules Engine rather than being typed into a form, so a rate change is a ruleset change.",
    related: ["BUS-002 Markup", "BUS-001 Margin Calculator", "BUS-006 Break-Even"]
  },

  "BUS-012": {
    purpose: "Appraise a project on both an undiscounted and a discounted basis, so the answer cannot be flattered by timing.",
    scope: "An initial investment with annual benefits and ongoing costs, appraised at a discount rate.",
    assumptions: [
      "The investment is made at the start and cash flows arrive at the end of each year.",
      "The discount rate is constant."
    ],
    validation: [
      "The benefit and cost lists must cover the same number of years.",
      "Where the cash flows never change sign in a way that produces a solution, no internal rate of return exists and none is reported rather than a misleading number being invented."
    ],
    formula: "Net present value discounts each year's net flow and deducts the investment. The internal rate of return is found by bracketed root finding on the net present value function, deliberately not by Newton iteration, which diverges on flat or multiply-signed cash flow polynomials. Payback is reported on both an undiscounted and a discounted basis, interpolated within the year it occurs.",
    boundary: "Simple ROI ignores timing altogether and flatters any project whose benefits arrive late, so it is never shown alone: net present value, the internal rate of return and both payback measures accompany it. This does not model risk, option value, or the cost of doing nothing.",
    methodology: "Benchmarks come from an independent oracle that computes net present value by direct summation and the internal rate of return by a fine linear scan with interpolation across the sign change - a different search from the engine's bracketed secant and bisection hybrid. The two agree to well inside the harness tolerance, so the rate is asserted at full precision. One case has benefits arriving late specifically so that simple ROI and net present value disagree in direction.",
    rules: "Not rules-sensitive. No statutory values are used.",
    related: ["INV-011 IRR", "INV-013 Payback Period", "BUS-010 Cash Flow"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
