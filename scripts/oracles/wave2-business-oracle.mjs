/**
 * Independent benchmark oracle for Wave 2 tranche 2G, Business & Commercial.
 *
 * Imports nothing from the calculation engine. Where the engine uses a closed
 * form the oracle simulates, and where the engine searches for a root the
 * oracle uses a different search, so a shared algebraic slip cannot pass
 * unnoticed on both sides.
 *
 * The only statutory value used is the VAT standard rate, re-typed here from
 * https://www.gov.uk/vat-rates.
 *
 * Run: node scripts/oracles/wave2-business-oracle.mjs > /tmp/business.json
 */

const r2 = (n) => Math.round(n * 100) / 100;
const r8 = (n) => Math.round(n * 1e8) / 1e8;

// https://www.gov.uk/vat-rates
const VAT_STANDARD = 0.2;

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±£0.01 / ±0.0001 as applicable",
    ruleset: id === "BUS-011" ? "uk-2026-27-v1" : "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// BUS-002 Markup
// ===========================================================================

for (const p of [
  { scenario: "A 50% markup is a 33.3% margin, not a 50% one", cost: 100, price: 150, mk: null },
  { scenario: "Price derived from a markup percentage", cost: 80, price: null, mk: 25 },
  { scenario: "Doubling the cost is a 100% markup and a 50% margin", cost: 40, price: 80, mk: null },
  { scenario: "Thin markup on a high-value item", cost: 9500, price: 9900, mk: null },
  { scenario: "Selling at cost gives no markup and no margin", cost: 250, price: 250, mk: null },
  { scenario: "Selling below cost gives a negative markup", cost: 100, price: 85, mk: null },
  { scenario: "Large markup from a percentage", cost: 12.5, price: null, mk: 300 }
]) {
  const price = p.price !== null ? p.price : p.cost * (1 + p.mk / 100);
  const profit = price - p.cost;
  add("BUS-002", p.scenario,
    p.price !== null
      ? { cost: p.cost, price: p.price, markup_percentage: "" }
      : { cost: p.cost, price: "", markup_percentage: p.mk },
    {
      cost: r2(p.cost),
      price: r2(price),
      profit: r2(profit),
      markup: r8(profit / p.cost),
      margin: price === 0 ? 0 : r8(profit / price)
    },
    "Markup is profit over cost; margin is profit over price. Both are asserted on every case so the two can never be swapped.");
}

// ===========================================================================
// BUS-003 / BUS-004 / BUS-005 Profit
// ===========================================================================

const profitCases = [
  { scenario: "Healthy trading year", rev: 500000, cogs: 200000, opex: 150000, other: 0, interest: 0, tax: 19 },
  { scenario: "Thin margins", rev: 250000, cogs: 200000, opex: 40000, other: 0, interest: 5000, tax: 19 },
  { scenario: "Loss-making year pays no tax", rev: 120000, cogs: 90000, opex: 60000, other: 0, interest: 2000, tax: 19 },
  { scenario: "Service business with no cost of sales", rev: 180000, cogs: 0, opex: 90000, other: 0, interest: 0, tax: 25 },
  { scenario: "With other income and interest costs", rev: 400000, cogs: 180000, opex: 120000, other: 15000, interest: 25000, tax: 25 },
  { scenario: "Break-even exactly", rev: 100000, cogs: 60000, opex: 40000, other: 0, interest: 0, tax: 19 },
  { scenario: "No tax rate applied", rev: 300000, cogs: 100000, opex: 80000, other: 0, interest: 0, tax: 0 }
];

for (const p of profitCases) {
  const gross = p.rev - p.cogs;
  const operating = gross - p.opex;
  const pbt = operating + p.other - p.interest;
  const tax = pbt > 0 ? pbt * (p.tax / 100) : 0;
  const net = pbt - tax;

  const shared = {
    gross_profit: r2(gross),
    gross_margin: p.rev === 0 ? 0 : r8(gross / p.rev),
    operating_profit: r2(operating),
    operating_margin: p.rev === 0 ? 0 : r8(operating / p.rev),
    profit_before_tax: r2(pbt),
    tax: r2(tax),
    net_profit: r2(net),
    net_margin: p.rev === 0 ? 0 : r8(net / p.rev)
  };

  add("BUS-003", p.scenario,
    {
      revenue: p.rev, cost_of_goods_sold: p.cogs, operating_expenses: p.opex,
      other_income: p.other, interest_and_other_costs: p.interest, tax_rate: p.tax
    }, shared,
    "Tax is charged on a profit and not on a loss, which the loss-making case proves.");

  add("BUS-005", p.scenario,
    {
      revenue: p.rev, cost_of_goods_sold: p.cogs, operating_expenses: p.opex,
      other_income: p.other, interest_and_other_costs: p.interest, tax_rate: p.tax
    },
    {
      ...shared,
      other_income: r2(p.other),
      interest_and_other_costs: r2(p.interest)
    },
    "BUS-003 and BUS-005 share one profit computation, so the same facts must give the same figures in both.");

  // BUS-004 stops at gross profit.
  add("BUS-004", p.scenario,
    { revenue: p.rev, cost_of_goods_sold: p.cogs },
    {
      revenue: r2(p.rev),
      cost_of_goods_sold: r2(p.cogs),
      gross_profit: r2(gross),
      gross_margin: p.rev === 0 ? 0 : r8(gross / p.rev),
      markup_on_cost: p.cogs === 0 ? 0 : r8(gross / p.cogs)
    });
}

// ===========================================================================
// BUS-007 Commission
// ===========================================================================

for (const p of [
  { scenario: "Flat commission with no threshold", sales: 100000, threshold: 0, rate: 5, target: 0, accel: 0, base: 25000 },
  { scenario: "Threshold means commission is not paid on everything sold", sales: 100000, threshold: 40000, rate: 5, target: 0, accel: 0, base: 25000 },
  { scenario: "Accelerator above target", sales: 150000, threshold: 20000, rate: 4, target: 120000, accel: 8, base: 30000 },
  { scenario: "Sales below the threshold earn nothing", sales: 30000, threshold: 40000, rate: 5, target: 0, accel: 0, base: 25000 },
  { scenario: "Sales exactly at target", sales: 120000, threshold: 20000, rate: 4, target: 120000, accel: 8, base: 30000 },
  { scenario: "No base salary, commission only", sales: 200000, threshold: 0, rate: 10, target: 0, accel: 0, base: 0 },
  { scenario: "Well above target so the accelerator dominates", sales: 400000, threshold: 20000, rate: 4, target: 120000, accel: 8, base: 30000 }
]) {
  const commissionable = Math.max(0, p.sales - p.threshold);
  const aboveTarget = p.target > 0 ? Math.max(0, p.sales - p.target) : 0;
  const atBase = commissionable - aboveTarget;
  const baseComm = atBase * (p.rate / 100);
  const accelComm = aboveTarget * (p.accel / 100);
  const total = baseComm + accelComm;

  add("BUS-007", p.scenario,
    {
      sales: p.sales, threshold: p.threshold, commission_rate: p.rate,
      target: p.target, accelerator_rate: p.accel, base_salary: p.base
    },
    {
      commissionable_sales: r2(commissionable),
      base_commission: r2(baseComm),
      accelerator_sales: r2(aboveTarget),
      accelerator_commission: r2(accelComm),
      total_commission: r2(total),
      total_earnings: r2(p.base + total),
      monthly_earnings: r2((p.base + total) / 12),
      effective_commission_rate: p.sales === 0 ? 0 : r8(total / p.sales)
    },
    "The accelerator applies only above target; sales between the threshold and target stay at the base rate.");
}

// ===========================================================================
// BUS-009 Depreciation
// ===========================================================================

function depreciationSim(cost, residual, years, method, rbRate, totalUnits, units) {
  const depreciable = cost - residual;
  const sumDigits = (years * (years + 1)) / 2;
  let book = cost, accumulated = 0, first = 0, last = 0;
  for (let y = 1; y <= years; y++) {
    let charge;
    if (method === "straight_line") charge = depreciable / years;
    else if (method === "reducing_balance") charge = book * rbRate;
    else if (method === "sum_of_years_digits") charge = (depreciable * (years - y + 1)) / sumDigits;
    else charge = (depreciable * (units[y - 1] ?? 0)) / totalUnits;
    charge = Math.max(0, Math.min(charge, book - residual));
    book -= charge;
    accumulated += charge;
    if (y === 1) first = charge;
    last = charge;
  }
  return { depreciable, first, last, accumulated, book, average: accumulated / years };
}

for (const p of [
  { scenario: "Straight line over five years", cost: 25000, res: 5000, years: 5, method: "straight_line", rb: 25, tu: 0, units: [] },
  { scenario: "Reducing balance at 25%", cost: 25000, res: 5000, years: 5, method: "reducing_balance", rb: 25, tu: 0, units: [] },
  { scenario: "Reducing balance floored at the residual value", cost: 10000, res: 4000, years: 10, method: "reducing_balance", rb: 40, tu: 0, units: [] },
  { scenario: "Sum of the years' digits front-loads the charge", cost: 25000, res: 5000, years: 5, method: "sum_of_years_digits", rb: 25, tu: 0, units: [] },
  { scenario: "Units of production", cost: 60000, res: 10000, years: 4, method: "units_of_production", rb: 25, tu: 100000, units: [30000, 30000, 25000, 15000] },
  { scenario: "No residual value", cost: 12000, res: 0, years: 3, method: "straight_line", rb: 25, tu: 0, units: [] },
  { scenario: "Single-year life", cost: 5000, res: 1000, years: 1, method: "straight_line", rb: 25, tu: 0, units: [] }
]) {
  const o = depreciationSim(p.cost, p.res, p.years, p.method, p.rb / 100, p.tu, p.units);
  // Only the inputs a user actually sees for the chosen method are recorded.
  // The UI hides the method-specific fields behind the method selector, so a
  // fixture listing all of them would describe a form that never exists.
  const inputs = {
    cost: p.cost, residual_value: p.res, useful_life_years: p.years, method: p.method
  };
  if (p.method === "reducing_balance") inputs.reducing_balance_rate = p.rb;
  if (p.method === "units_of_production") {
    inputs.total_units = p.tu;
    inputs.units_per_year = JSON.stringify(p.units);
  }

  add("BUS-009", p.scenario, inputs,
    {
      depreciable_amount: r2(o.depreciable),
      first_year_depreciation: r2(o.first),
      final_year_depreciation: r2(o.last),
      total_depreciation: r2(o.accumulated),
      average_annual_depreciation: r2(o.average),
      closing_book_value: r2(o.book)
    },
    "Simulated year by year. The 40% reducing balance case proves the charge is floored so the book value never falls below the residual value.");
}

// ===========================================================================
// BUS-010 Cash Flow
// ===========================================================================

for (const p of [
  {
    scenario: "Profitable year that still runs out of cash mid-year",
    opening: 10000,
    inflows: [10000, 10000, 10000, 10000, 10000, 10000, 35000, 35000, 35000, 35000, 35000, 35000],
    outflows: [20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000]
  },
  {
    scenario: "Steady positive cash flow",
    opening: 5000,
    inflows: [10000, 10000, 10000, 10000],
    outflows: [8000, 8000, 8000, 8000]
  },
  {
    scenario: "Never goes negative but comes close",
    opening: 3000,
    inflows: [5000, 4000, 6000],
    outflows: [7000, 5000, 4000]
  },
  {
    scenario: "Negative from the first period",
    opening: 0,
    inflows: [1000, 1000],
    outflows: [3000, 2000]
  },
  {
    scenario: "Single period",
    opening: 2000,
    inflows: [5000],
    outflows: [1000]
  },
  {
    scenario: "Seasonal business with a deep winter trough",
    opening: 40000,
    inflows: [8000, 6000, 9000, 20000, 45000, 70000, 90000, 85000, 40000, 15000, 9000, 7000],
    outflows: [25000, 25000, 25000, 28000, 32000, 38000, 40000, 38000, 30000, 26000, 25000, 25000]
  }
]) {
  let balance = p.opening, lowest = p.opening, lowestPeriod = 0, negatives = 0;
  let totalIn = 0, totalOut = 0;
  for (let i = 0; i < p.inflows.length; i++) {
    totalIn += p.inflows[i];
    totalOut += p.outflows[i];
    balance += p.inflows[i] - p.outflows[i];
    if (balance < lowest) { lowest = balance; lowestPeriod = i + 1; }
    if (balance < 0) negatives++;
  }
  add("BUS-010", p.scenario,
    {
      opening_balance: p.opening,
      inflows: JSON.stringify(p.inflows),
      outflows: JSON.stringify(p.outflows)
    },
    {
      total_inflows: r2(totalIn),
      total_outflows: r2(totalOut),
      net_cash_flow: r2(totalIn - totalOut),
      closing_balance: r2(balance),
      lowest_balance: r2(lowest),
      lowest_balance_period: lowestPeriod,
      periods_negative: negatives,
      average_net_flow: r2((totalIn - totalOut) / p.inflows.length)
    },
    "The first case is deliberately profitable over the year while going negative in the middle of it, which is the whole reason the lowest balance is reported.");
}

// ===========================================================================
// BUS-011 Pricing
// ===========================================================================

for (const p of [
  { scenario: "30% target margin, VAT registered", cost: 70, margin: 30, vat: true, discount: 0, fixed: 0 },
  { scenario: "A 20% discount on a 30% margin leaves 12.5%, not 10%", cost: 70, margin: 30, vat: true, discount: 20, fixed: 0 },
  { scenario: "Not VAT registered", cost: 40, margin: 50, vat: false, discount: 0, fixed: 0 },
  { scenario: "High margin product", cost: 5, margin: 80, vat: true, discount: 0, fixed: 0 },
  { scenario: "Discount that wipes out the margin entirely", cost: 70, margin: 20, vat: true, discount: 25, fixed: 0 },
  { scenario: "With fixed costs to cover", cost: 12, margin: 40, vat: true, discount: 0, fixed: 30000 },
  { scenario: "Zero margin sells at cost", cost: 100, margin: 0, vat: true, discount: 0, fixed: 0 }
]) {
  const vatRate = p.vat ? VAT_STANDARD : 0;
  const m = p.margin / 100;
  const price = p.cost / (1 - m);
  const vat = price * vatRate;
  const discounted = price * (1 - p.discount / 100);
  const profitAfter = discounted - p.cost;
  const contribution = discounted - p.cost;

  add("BUS-011", p.scenario,
    {
      unit_cost: p.cost, target_margin: p.margin, vat_registered: p.vat,
      discount: p.discount, fixed_costs: p.fixed
    },
    {
      price_excluding_vat: r2(price),
      vat_amount: r2(vat),
      price_including_vat: r2(price + vat),
      profit_per_unit: r2(price - p.cost),
      markup_on_cost: p.cost === 0 ? 0 : r8((price - p.cost) / p.cost),
      price_after_discount_excluding_vat: r2(discounted),
      margin_after_discount: discounted === 0 ? 0 : r8(profitAfter / discounted),
      break_even_units: contribution > 0 ? r2(p.fixed / contribution) : null
    },
    "Price is cost divided by one minus the margin. The discount pair proves a discount comes off profit rather than off the margin percentage.");
}

// ===========================================================================
// BUS-012 ROI for a business project
// ===========================================================================

/** NPV at a rate, by direct summation. */
function npvAt(investment, net, rate) {
  let v = -investment;
  for (let y = 1; y <= net.length; y++) v += net[y - 1] / Math.pow(1 + rate, y);
  return v;
}

/**
 * IRR by a fine linear scan followed by linear interpolation across the sign
 * change. Deliberately NOT the engine's bracketed secant/bisection hybrid.
 */
function irrByScan(investment, net) {
  const step = 0.000001;
  let previous = npvAt(investment, net, -0.9999);
  for (let r = -0.9999 + step; r <= 5; r += step) {
    const current = npvAt(investment, net, r);
    if (previous === 0) return r - step;
    if (previous * current < 0) {
      // Linear interpolation between the two rates straddling the root.
      return r - step + (step * previous) / (previous - current);
    }
    previous = current;
  }
  return null;
}

for (const p of [
  { scenario: "Straightforward payback in year three", inv: 100000, benefits: [40000, 40000, 40000, 40000, 40000], costs: [5000, 5000, 5000, 5000, 5000], rate: 8 },
  { scenario: "Benefits arriving late, where simple ROI flatters the project", inv: 100000, benefits: [5000, 10000, 30000, 60000, 90000], costs: [0, 0, 0, 0, 0], rate: 10 },
  { scenario: "Project that never pays back", inv: 200000, benefits: [20000, 20000, 20000], costs: [5000, 5000, 5000], rate: 8 },
  { scenario: "High return, short life", inv: 50000, benefits: [40000, 40000], costs: [2000, 2000], rate: 12 },
  { scenario: "Zero discount rate makes net present value equal net benefit", inv: 80000, benefits: [30000, 30000, 30000, 30000], costs: [0, 0, 0, 0], rate: 0 },
  { scenario: "Ongoing costs consuming most of the benefit", inv: 60000, benefits: [40000, 40000, 40000], costs: [30000, 30000, 30000], rate: 6 },
  { scenario: "Ten-year infrastructure project", inv: 500000, benefits: Array(10).fill(90000), costs: Array(10).fill(15000), rate: 5 }
]) {
  const net = p.benefits.map((b, i) => b - p.costs[i]);
  const totalB = p.benefits.reduce((a, b) => a + b, 0);
  const totalC = p.costs.reduce((a, b) => a + b, 0);
  const netBenefit = totalB - totalC - p.inv;
  const rate = p.rate / 100;

  const npv = npvAt(p.inv, net, rate);
  let pvInflows = 0;
  for (let y = 1; y <= net.length; y++) pvInflows += net[y - 1] / Math.pow(1 + rate, y);

  let cumulative = -p.inv, simplePayback = null;
  for (let y = 1; y <= net.length; y++) {
    const previous = cumulative;
    cumulative += net[y - 1];
    if (simplePayback === null && cumulative >= 0 && net[y - 1] !== 0) {
      simplePayback = y - 1 + -previous / net[y - 1];
    }
  }
  let dCumulative = -p.inv, discountedPayback = null;
  for (let y = 1; y <= net.length; y++) {
    const d = net[y - 1] / Math.pow(1 + rate, y);
    const previous = dCumulative;
    dCumulative += d;
    if (discountedPayback === null && dCumulative >= 0 && d !== 0) {
      discountedPayback = y - 1 + -previous / d;
    }
  }

  const irr = irrByScan(p.inv, net);
  const simpleRoi = netBenefit / p.inv;

  const expected = {
    total_benefits: r2(totalB),
    total_ongoing_costs: r2(totalC),
    net_benefit: r2(netBenefit),
    simple_roi: r8(simpleRoi),
    annualised_roi: simpleRoi > -1 ? r8(Math.pow(1 + simpleRoi, 1 / net.length) - 1) : 0,
    net_present_value: r2(npv),
    simple_payback_years: simplePayback === null ? null : r8(simplePayback),
    discounted_payback_years: discountedPayback === null ? null : r8(discountedPayback),
    profitability_index: r8(pvInflows / p.inv)
  };
  // The two searches are different algorithms - a bracketed secant/bisection
  // hybrid in the engine, a fine linear scan with interpolation here - and
  // they agree to well inside the harness tolerance, so the rate is asserted
  // at full precision rather than being rounded off to hide a disagreement
  // that does not exist.
  if (irr !== null) expected.internal_rate_of_return = r8(irr);

  add("BUS-012", p.scenario,
    {
      initial_investment: p.inv,
      annual_benefits: JSON.stringify(p.benefits),
      annual_costs: JSON.stringify(p.costs),
      discount_rate: p.rate
    },
    expected,
    "Net present value by direct summation; the internal rate of return by a fine linear scan with interpolation, which is a different search from the engine's bracketed method.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
