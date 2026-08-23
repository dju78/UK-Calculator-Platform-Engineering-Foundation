/**
 * Independent benchmark oracle for Wave 2 Investing & Wealth.
 * Imports nothing from the calculation engine.
 */
const r2 = (n) => Math.round(n * 100) / 100;
const r8 = (n) => Math.round(n * 1e8) / 1e8;

/**
 * XIRR by pure BISECTION on NPV - deliberately the crudest reliable method,
 * so it shares no code path or cleverness with the engine's bracketed solver.
 * The oracle also asserts NPV(root) is essentially zero, which is the
 * defining property an IRR must satisfy.
 */
function xirrByBisection(flows) {
  const parsed = flows.map(f => ({ t: Date.parse(f.date), a: f.amount })).sort((x, y) => x.t - y.t);
  const start = parsed[0].t, DAY = 86400000;
  const npv = (r) => parsed.reduce((s, c) => s + c.a / Math.pow(1 + r, (c.t - start) / DAY / 365), 0);
  let lo = -0.9999, hi = 10;
  if (npv(lo) * npv(hi) > 0) return { rate: null, npv: null };
  for (let i = 0; i < 500; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid; else lo = mid;
  }
  const rate = (lo + hi) / 2;
  return { rate, npv: npv(rate) };
}

const fixtures = {};
const add = (id, scenario, inputs, expected, note) => {
  (fixtures[id] ??= []).push({
    scenario, inputs, expected,
    tolerance: "±£0.01 / ±0.0001 as applicable",
    ruleset: "None",
    note: note ?? "Independently derived; no engine code used."
  });
};

// ---------------------------------------------------------------- INV-004 ---
for (const [scenario, p, rate, years, m] of [
  ["Annual compounding", 10000, 5, 10, 1],
  ["Monthly compounding", 10000, 5, 10, 12],
  ["Zero rate", 5000, 0, 5, 1],
  ["Short term", 2000, 8, 1, 4],
  ["Long term", 25000, 6, 30, 12]
]) {
  const simple = p * (rate / 100) * years;
  const compound = p * Math.pow(1 + rate / 100 / m, m * years);
  add("INV-004", scenario, { principal: p, annual_rate: rate, years, compounds_per_year: m }, {
    simple_interest: r2(simple),
    simple_total: r2(p + simple),
    compound_interest: r2(compound - p),
    compound_total: r2(compound),
    difference: r2(compound - p - simple)
  });
}

// ---------------------------------------------------------------- INV-005 ---
for (const [scenario, pv, fv, years, m] of [
  ["Double in 10 years", 10000, 20000, 10, 1],
  ["Monthly compounding", 5000, 8000, 7, 12],
  ["Small growth", 10000, 10500, 1, 1],
  ["Large growth", 1000, 10000, 20, 1],
  ["Quarterly", 15000, 25000, 8, 4]
]) {
  add("INV-005", scenario, { present_value: pv, future_value: fv, years, compounds_per_year: m }, {
    required_annual_rate: r8(m * (Math.pow(fv / pv, 1 / (m * years)) - 1))
  });
}

// ---------------------------------------------------------------- INV-010 ---
for (const [scenario, returns] of [
  ["Steady returns", [5, 5, 5, 5, 5]],
  ["Volatile returns", [20, -10, 15, -5, 10]],
  ["A loss year", [10, -20, 10]],
  ["Two years", [10, 10]],
  ["Mixed decade", [8, -3, 12, 5, -7, 15, 2, 9, -1, 6]]
]) {
  const rates = returns.map(r => r / 100);
  const arithmetic = rates.reduce((a, b) => a + b, 0) / rates.length;
  const growth = rates.reduce((p, r) => p * (1 + r), 1);
  const geometric = Math.pow(growth, 1 / rates.length) - 1;
  add("INV-010", scenario, { returns: JSON.stringify(returns) }, {
    arithmetic_mean: r8(arithmetic),
    geometric_mean: r8(geometric),
    cumulative_return: r8(growth - 1),
    difference: r8(arithmetic - geometric),
    years: rates.length
  });
}

// ---------------------------------------------------------------- INV-012 ---
const xirrCases = [
  ["Simple two flows", [{ date: "2024-01-01", amount: -10000 }, { date: "2025-01-01", amount: 11000 }]],
  ["Irregular contributions", [{ date: "2023-01-15", amount: -5000 }, { date: "2023-07-20", amount: -3000 }, { date: "2025-03-10", amount: 9500 }]],
  ["Loss", [{ date: "2022-06-01", amount: -20000 }, { date: "2025-06-01", amount: 15000 }]],
  ["Multiple inflows", [{ date: "2021-01-01", amount: -50000 }, { date: "2022-01-01", amount: 10000 }, { date: "2023-01-01", amount: 15000 }, { date: "2024-01-01", amount: 35000 }]],
  ["Long horizon", [{ date: "2010-01-01", amount: -1000 }, { date: "2026-01-01", amount: 4000 }]]
];
for (const [scenario, flows] of xirrCases) {
  const { rate, npv } = xirrByBisection(flows);
  if (rate === null) { console.error(`  ! INV-012 ${scenario}: no bracketed root`); continue; }
  if (Math.abs(npv) > 1e-6) console.error(`  ! INV-012 ${scenario}: NPV at root is ${npv}`);
  add("INV-012", scenario, { cashflows: JSON.stringify(flows) }, { xirr: r8(rate) },
    `Independently solved by bisection on NPV; NPV at the root is ${npv.toExponential(2)}, confirming it is a genuine root.`);
}

// ---------------------------------------------------------------- INV-013 ---
for (const [scenario, initial, flows, discount] of [
  ["Even cash flows", 10000, [3000, 3000, 3000, 3000, 3000], 0],
  ["With discounting", 10000, [3000, 3000, 3000, 3000, 3000], 8],
  ["Never pays back", 50000, [5000, 5000, 5000], 0],
  ["Fast payback", 5000, [4000, 4000], 0],
  ["Uneven flows", 20000, [2000, 5000, 8000, 10000], 5]
]) {
  const cross = (arr) => {
    let cum = -initial;
    for (let i = 0; i < arr.length; i++) {
      const prev = cum; cum += arr[i];
      if (cum >= 0) return arr[i] === 0 ? i + 1 : i + (-prev) / arr[i];
    }
    return null;
  };
  const disc = flows.map((c, i) => c / Math.pow(1 + discount / 100, i + 1));
  const total = flows.reduce((a, b) => a + b, 0);
  add("INV-013", scenario,
    { initial_investment: initial, annual_cashflows: JSON.stringify(flows), discount_rate: discount },
    {
      payback_years: cross(flows) === null ? null : r8(cross(flows)),
      discounted_payback_years: cross(disc) === null ? null : r8(cross(disc)),
      total_cash_returned: r2(total),
      net_gain: r2(total - initial)
    });
}

// ---------------------------------------------------------------- INV-016 ---
for (const [scenario, monthly, ret, goal, delay, start] of [
  ["Five year delay", 300, 7, 30, 5, 0],
  ["No delay", 300, 7, 30, 0, 0],
  ["With starting pot", 250, 6, 25, 5, 10000],
  ["Short goal", 500, 5, 10, 2, 0],
  ["Zero return", 200, 0, 20, 5, 0]
]) {
  const r = ret / 100 / 12;
  const fv = (months, growthMonths) => {
    const gs = start * Math.pow(1 + r, growthMonths);
    const ann = r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
    return gs + ann;
  };
  const total = Math.round(goal * 12), later = Math.round((goal - delay) * 12);
  const now = fv(total, total), delayed = fv(later, total);
  add("INV-016", scenario,
    { monthly_contribution: monthly, annual_return: ret, years_to_goal: goal, years_delayed: delay, starting_amount: start },
    {
      value_if_starting_now: r2(now),
      value_if_delayed: r2(delayed),
      cost_of_waiting: r2(now - delayed),
      contributions_if_starting_now: r2(monthly * total),
      contributions_if_delayed: r2(monthly * later)
    });
}

// ------------------------------------------------- INV-017 / 018 / 019 / 020 ---
function contributionFv(start, monthly, ratePct, years, timing) {
  const r = ratePct / 100 / 12, n = Math.round(years * 12);
  // Explicit month-by-month simulation, not the annuity formula.
  let bal = start;
  for (let i = 0; i < n; i++) {
    if (timing === "start") bal += monthly;
    bal *= 1 + r;
    if (timing === "end") bal += monthly;
  }
  return bal;
}
for (const [scenario, start, monthly, rate, years, timing] of [
  ["End of month", 5000, 300, 6, 20, "end"],
  ["Start of month", 5000, 300, 6, 20, "start"],
  ["No starting amount", 0, 500, 5, 10, "end"],
  ["Zero rate", 1000, 100, 0, 5, "end"],
  ["Long horizon", 10000, 250, 7, 30, "end"]
]) {
  const fv = contributionFv(start, monthly, rate, years, timing);
  const n = Math.round(years * 12);
  add("INV-017", scenario,
    { starting_amount: start, monthly_contribution: monthly, annual_rate: rate, years, contribution_timing: timing },
    {
      final_value: r2(fv),
      total_contributions: r2(monthly * n),
      growth: r2(fv - start - monthly * n),
      effective_annual_rate: r8(Math.pow(1 + rate / 100 / 12, 12) - 1)
    });
}
for (const [scenario, start, monthly, rate, years] of [
  ["Regular saving", 1000, 200, 4, 10],
  ["No starting balance", 0, 150, 3.5, 5],
  ["Zero rate", 500, 100, 0, 3],
  ["High rate", 2000, 300, 6, 15],
  ["Small amounts", 100, 25, 2, 2]
]) {
  const fv = contributionFv(start, monthly, rate, years, "end");
  const n = Math.round(years * 12);
  add("INV-018", scenario,
    { starting_amount: start, monthly_contribution: monthly, annual_rate: rate, years },
    {
      final_value: r2(fv),
      total_contributions: r2(monthly * n),
      interest_earned: r2(fv - start - monthly * n),
      effective_annual_rate: r8(Math.pow(1 + rate / 100 / 12, 12) - 1)
    });
}
for (const id of ["INV-019", "INV-020"]) {
  for (const [scenario, p, rate, years, m] of [
    ["One year bond", 10000, 4.5, 1, 1],
    ["Three year bond", 20000, 4.75, 3, 1],
    ["Monthly interest", 15000, 4.2, 2, 12],
    ["Zero rate", 5000, 0, 2, 1],
    ["Five year bond", 50000, 5, 5, 1]
  ]) {
    const fv = p * Math.pow(1 + rate / 100 / m, m * years);
    add(id, scenario, { principal: p, annual_rate: rate, years, compounds_per_year: m }, {
      final_value: r2(fv),
      interest_earned: r2(fv - p),
      effective_annual_rate: r8(Math.pow(1 + rate / 100 / m, m) - 1),
      gross_annual_interest: r2(p * rate / 100)
    });
  }
}

// ---------------------------------------------------------------- INV-021 ---
for (const [scenario, face, coupon, yieldPct, years, m] of [
  ["Par bond", 1000, 5, 5, 10, 2],
  ["Premium bond", 1000, 6, 4, 10, 2],
  ["Discount bond", 1000, 3, 5, 10, 2],
  ["Zero yield", 1000, 4, 0, 5, 2],
  ["Annual coupons", 1000, 5, 6, 8, 1]
]) {
  const n = Math.round(years * m);
  const c = face * (coupon / 100) / m;
  const y = yieldPct / 100 / m;
  // Explicit summation of discounted cash flows, not the annuity shortcut.
  let price = 0;
  for (let t = 1; t <= n; t++) price += c / Math.pow(1 + y, t);
  price += face / Math.pow(1 + y, n);
  add("INV-021", scenario,
    { face_value: face, coupon_rate: coupon, yield_rate: yieldPct, years, coupons_per_year: m },
    {
      price: r2(price),
      total_coupons: r2(c * n),
      current_yield: r8((face * coupon / 100) / price),
      premium_or_discount: r2(price - face)
    });
}

// ---------------------------------------------------------------- INV-022 ---
for (const [scenario, inv, yld, growth, years] of [
  ["Growing dividend", 50000, 4, 5, 10],
  ["No growth", 50000, 4, 0, 10],
  ["High yield", 25000, 6, 3, 5],
  ["One year", 10000, 5, 5, 1],
  ["Long horizon", 100000, 3.5, 6, 20]
]) {
  const first = inv * yld / 100;
  let income = first, total = 0;
  for (let y = 0; y < years; y++) { total += income; if (y < years - 1) income *= 1 + growth / 100; }
  add("INV-022", scenario,
    { investment: inv, starting_yield: yld, dividend_growth: growth, years },
    {
      first_year_income: r2(first),
      final_year_income: r2(income),
      total_income: r2(total),
      yield_on_cost: r8(first / inv),
      final_yield_on_cost: r8(income / inv)
    });
}

// ---------------------------------------------------------------- INV-023 ---
for (const [scenario, inv, yld, priceGrowth, divGrowth, years] of [
  ["Reinvested ten years", 20000, 4, 5, 4, 10],
  ["No price growth", 20000, 4, 0, 0, 10],
  ["High yield short", 10000, 6, 3, 2, 5],
  ["One year", 5000, 5, 5, 5, 1],
  ["Twenty years", 50000, 3.5, 6, 5, 20]
]) {
  const startPrice = 100;
  let shares = inv / startPrice, price = startPrice, dps = startPrice * yld / 100, totalDiv = 0;
  for (let y = 0; y < years; y++) {
    const income = shares * dps;
    totalDiv += income;
    price *= 1 + priceGrowth / 100;
    shares += income / price;
    dps *= 1 + divGrowth / 100;
  }
  const without = (inv / startPrice) * price;
  add("INV-023", scenario,
    { initial_investment: inv, starting_yield: yld, price_growth: priceGrowth, dividend_growth: divGrowth, years },
    {
      final_value: r2(shares * price),
      final_value_without_reinvestment: r2(without),
      reinvestment_benefit: r2(shares * price - without),
      total_dividends: r2(totalDiv),
      final_shares: r8(shares)
    });
}

// ---------------------------------------------------------------- INV-024 ---
for (const [scenario, init, monthly, gross, ocf, platform, years] of [
  ["Typical fund", 10000, 200, 7, 0.22, 0.25, 20],
  ["No contributions", 50000, 0, 6, 0.75, 0.35, 15],
  ["Zero charges", 10000, 200, 7, 0, 0, 20],
  ["High charges", 10000, 200, 7, 1.5, 0.45, 20],
  ["Short horizon", 5000, 100, 5, 0.3, 0.25, 5]
]) {
  const months = Math.round(years * 12);
  const mg = Math.pow(1 + gross / 100, 1 / 12) - 1;
  const mf = (ocf + platform) / 100 / 12;
  let g = init, n = init, fees = 0;
  for (let i = 0; i < months; i++) {
    g = g * (1 + mg) + monthly;
    n = n * (1 + mg);
    const fee = n * mf; fees += fee;
    n = n - fee + monthly;
  }
  const contributions = init + monthly * months;
  add("INV-024", scenario,
    { initial_investment: init, monthly_contribution: monthly, gross_return: gross, ongoing_charge: ocf, platform_fee: platform, years },
    {
      gross_value: r2(g),
      net_value: r2(n),
      total_fees: r2(fees),
      total_contributions: r2(contributions),
      fee_drag_percentage: r8((g - n) / g),
      net_annualised_return: r8(Math.pow(n / contributions, 1 / years) - 1)
    });
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`\nOracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
