import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  compareFixedVsTracker,
  calculatePropertyCgt,
  simulatePortfolioDrawdown,
  calculateSafeWithdrawalRate,
  rebalancePortfolio,
  simulateMonteCarlo,
  compareSippVsIsa,
  calculateGiaTax,
  calculateHicbc,
  calculateFire,
  pro008Handler,
  pro028Handler,
  inv025Handler,
  inv026Handler,
  inv027Handler,
  inv029Handler,
  isa007Handler,
  tax013Handler,
  tax019Handler,
  pen011Handler,
  type UKRulesetLike
} from "../packages/calculation-engine/src/finance/wave3/index.js";
import { getUKRuleset } from "../packages/rules-uk/src/index.js";

const benchmarksPath = path.resolve("packages/test-fixtures/fixtures/wave3-benchmarks.json");
const wave3Benchmarks = JSON.parse(fs.readFileSync(benchmarksPath, "utf8"));

test("Wave 3 Fixtures Integrity", () => {
  const ids = Object.keys(wave3Benchmarks);
  assert.equal(ids.length, 10, "Must contain exactly 10 Wave 3 calculators");
  let totalCases = 0;
  for (const id of ids) {
    const cases = wave3Benchmarks[id];
    assert.ok(cases.length >= 5, `${id} must have at least 5 benchmark cases`);
    totalCases += cases.length;
  }
  assert.ok(totalCases >= 50, `Total benchmark cases must be at least 50 (got ${totalCases})`);
});

test("Wave 3 Benchmarks Execution", async (t: TestContext) => {
  const handlers: Record<string, Function> = {
    "PRO-008": pro008Handler,
    "PRO-028": pro028Handler,
    "INV-025": inv025Handler,
    "INV-026": inv026Handler,
    "INV-027": inv027Handler,
    "INV-029": inv029Handler,
    "ISA-007": isa007Handler,
    "TAX-013": tax013Handler,
    "TAX-019": tax019Handler,
    "PEN-011": pen011Handler
  };

  for (const [id, cases] of Object.entries(wave3Benchmarks) as [string, any[]][]) {
    await t.test(`Benchmarks for ${id}`, async (subT: TestContext) => {
      const handler = handlers[id];
      assert.ok(handler, `Handler exists for ${id}`);

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i];
        await subT.test(`Case ${i + 1}: ${c.scenario}`, async () => {
          const result = await handler(c.inputs, {});
          assert.ok(result && result.outputs, `Output produced for ${c.scenario}`);

          for (const [expKey, expVal] of Object.entries(c.expected)) {
            const actualVal = result.outputs[expKey];
            assert.notEqual(actualVal, undefined, `Expected key ${expKey} in outputs`);

            if (typeof expVal === "number") {
              const diff = Math.abs((actualVal as number) - expVal);
              const tolerance = id === "INV-029" ? 300000 : id === "INV-025" ? 10000 : id === "INV-026" ? 200 : id === "PEN-011" ? 1.0 : 2.0;
              assert.ok(
                diff <= tolerance,
                `${id} ${c.scenario}: ${expKey} expected ~${expVal}, got ${actualVal} (diff: ${diff})`
              );
            } else if (typeof expVal === "boolean" || typeof expVal === "string") {
              assert.equal(actualVal, expVal, `${id} ${c.scenario}: ${expKey} mismatch`);
            }
          }
        });
      }
    });
  }
});

test("PRO-008: Fixed vs Tracker Edge Cases and Numerical Stability", () => {
  const rEqual = compareFixedVsTracker({
    loan_amount: 200000,
    term_years: 25,
    fixed_rate: 4.0,
    fixed_fee: 0,
    tracker_margin: 0.5,
    current_base_rate: 3.5,
    tracker_fee: 0,
    deal_years: 2,
    expected_rate_change: 0
  });
  assert.equal(rEqual.cheaper_option, "equal");
  assert.equal(rEqual.deal_cost_difference, 0);

  const rFin = compareFixedVsTracker({
    loan_amount: 100000,
    term_years: 20,
    fixed_rate: 5.0,
    fixed_fee: 1000,
    tracker_margin: 0,
    current_base_rate: 5.0,
    deal_years: 2,
    fee_financed: true
  });
  assert.ok(rFin.fixed_monthly_payment > 0);
  assert.equal(rFin.fixed_deal_total_cost > 0, true);
});

test("PRO-028: Property CGT Statutory Slices and PRR", () => {
  const rLoss = calculatePropertyCgt({
    disposal_price: 200000,
    acquisition_price: 250000,
    total_ownership_months: 60
  });
  assert.equal(rLoss.gross_gain, -50000);
  assert.equal(rLoss.taxable_gain, 0);
  assert.equal(rLoss.total_cgt_due, 0);

  const rPRR = calculatePropertyCgt({
    disposal_price: 400000,
    acquisition_price: 200000,
    total_ownership_months: 100,
    months_as_main_residence: 100
  });
  assert.equal(rPRR.prr_relief_amount, 200000);
  assert.equal(rPRR.total_cgt_due, 0);
});

test("INV-025: Portfolio Drawdown Bounds and Exhaustion", () => {
  const r = simulatePortfolioDrawdown({
    initial_balance: 100000,
    annual_withdrawal: 10000,
    annual_return: 0,
    inflation_rate: 0,
    adjust_for_inflation: false,
    management_fee: 0,
    planning_years: 20
  });
  assert.equal(r.portfolio_survived, false);
  assert.equal(r.years_until_depleted, 10);
  assert.equal(r.final_balance, 0);
});

test("INV-026: Safe Withdrawal Rate Horizons", () => {
  const r = calculateSafeWithdrawalRate({
    portfolio_value: 500000,
    retirement_years: 30,
    equity_allocation_pct: 70,
    expected_equity_return: 5.0,
    expected_bond_return: 1.5,
    custom_withdrawal_pct: 4.0
  });
  assert.ok(r.recommended_swr_pct > 3.5);
  assert.ok(r.recommended_annual_income > 0);
});

test("INV-027: Portfolio Rebalancing Allocations", () => {
  const r = rebalancePortfolio({
    assets_json: [
      { name: "A", current_value: 50000, target_pct: 50 },
      { name: "B", current_value: 50000, target_pct: 50 }
    ],
    cash_flow: 0,
    rebalance_mode: "full"
  });
  assert.equal(r.portfolio_drift_pct, 0);
  assert.equal(r.total_buys_amount, 0);
});

test("INV-029: Monte Carlo Simulator Reproducibility", () => {
  const r1 = simulateMonteCarlo({
    initial_investment: 100000,
    expected_return_pct: 7.0,
    volatility_pct: 15.0,
    horizon_years: 10,
    simulations_count: 500,
    seed: 42
  });
  const r2 = simulateMonteCarlo({
    initial_investment: 100000,
    expected_return_pct: 7.0,
    volatility_pct: 15.0,
    horizon_years: 10,
    simulations_count: 500,
    seed: 42
  });
  assert.equal(r1.median_terminal_wealth, r2.median_terminal_wealth);
  assert.equal(r1.percentile_10th, r2.percentile_10th);
  assert.equal(r1.percentile_90th, r2.percentile_90th);
});

test("ISA-007: SIPP vs ISA Tax Arbitrage", () => {
  const r = compareSippVsIsa({
    monthly_contribution_net: 500,
    years_to_invest: 20,
    annual_growth_rate: 5.0,
    current_tax_band: "higher",
    retirement_tax_band: "basic",
    reinvest_tax_relief: true
  });
  assert.equal(r.more_effective_wrapper, "sipp");
  assert.ok(r.sipp_net_after_tax_value > r.isa_final_value);
});

test("TAX-013: GIA Tax Allowances Ordering", () => {
  const rules = getUKRuleset() as unknown as UKRulesetLike;
  const r = calculateGiaTax({
    annual_dividends: 1000,
    realised_capital_gains: 5000,
    interest_income: 1500,
    other_taxable_income: 60000
  }, rules);
  assert.equal(r.taxpayer_band, "higher");
  assert.equal(r.dividend_tax_due, (1000 - 500) * rules.dividends.rates.higher);
  assert.equal(r.capital_gains_tax_due, (5000 - 3000) * 0.24);
  assert.equal(r.interest_tax_due, (1500 - 500) * 0.40);
});

test("TAX-019: High Income Child Benefit Charge Taper", () => {
  const r60k = calculateHicbc({
    gross_salary: 60000,
    children_count: 2
  });
  assert.equal(r60k.charge_percentage, 0);
  assert.equal(r60k.hicbc_tax_charge, 0);

  const r80k = calculateHicbc({
    gross_salary: 80000,
    children_count: 2
  });
  assert.equal(r80k.charge_percentage, 100);
  assert.equal(r80k.hicbc_tax_charge, r80k.total_child_benefit_received);
});

test("PEN-011: FIRE Runway and Milestones", () => {
  const r = calculateFire({
    current_age: 30,
    annual_net_income: 50000,
    current_annual_spending: 30000,
    current_invested_assets: 0,
    desired_retirement_spending: 30000,
    safe_withdrawal_rate: 4.0,
    investment_return_rate: 5.0
  });
  assert.equal(r.fire_number, 750000);
  assert.equal(r.current_savings_rate_pct, 40.0);
  assert.ok(r.years_to_fire > 0);
  assert.equal(r.projected_fire_age, 30 + r.years_to_fire);
});
