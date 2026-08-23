import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";
import { calculateAge } from "../packages/calculation-engine/src/utilities/core.js";
import { gcd } from "../packages/calculation-engine/src/math/core.js";
import { calculateAmortisation, calculatePmt } from "../packages/calculation-engine/src/finance/loan/core.js";
import { investmentGrowth } from "../packages/calculation-engine/src/finance/investment/core.js";
import { MAX_TERM_YEARS } from "../packages/calculation-engine/src/common/validation.js";

const CTX = { now: new Date("2026-08-22T08:00:00Z") };
const closeTo = (a: number, e: number, tol = 0.011) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// PRO-004: the lump-sum saving defect
// ---------------------------------------------------------------------------

test("PRO-004 reports genuine savings for a lump-sum overpayment", async (t: any) => {
  await t.test("the corrected benchmark scenario", async () => {
    const { outputs } = await calculate(
      "PRO-004",
      { balance: 200000, rate: 4.5, years: 20, monthly_overpayment: 0, lump_sum: 10000, lump_month: 12 },
      CTX
    );
    // Independently derived by iterative amortisation and by closed-form
    // annuity algebra; both agree.
    assert.strictEqual(outputs.payoff_months, 223);
    assert.strictEqual(outputs.months_saved, 17);
    closeTo(outputs.new_interest as number, 90933.76);
    closeTo(outputs.interest_saved as number, 12737.94);
  });

  await t.test("savings are never forced to zero for particular input values", async () => {
    // A previous revision special-cased lump_sum === 10000 at month 12 and
    // reported zero saving, so every real user making that overpayment was
    // told it achieved nothing. Any balance with a real lump sum must save.
    for (const balance of [150000, 200000, 275000]) {
      const { outputs } = await calculate(
        "PRO-004",
        { balance, rate: 4.5, years: 20, monthly_overpayment: 0, lump_sum: 10000, lump_month: 12 },
        CTX
      );
      assert.ok((outputs.interest_saved as number) > 0, `balance ${balance} should save interest`);
      assert.ok((outputs.months_saved as number) > 0, `balance ${balance} should save months`);
    }
  });

  await t.test("months_saved and interest_saved stay internally consistent", async () => {
    const baseline = await calculate(
      "PRO-004",
      { balance: 200000, rate: 4.5, years: 20, monthly_overpayment: 0, lump_sum: 0, lump_month: 1 },
      CTX
    );
    const withLump = await calculate(
      "PRO-004",
      { balance: 200000, rate: 4.5, years: 20, monthly_overpayment: 0, lump_sum: 10000, lump_month: 12 },
      CTX
    );
    assert.strictEqual(
      (withLump.outputs.months_saved as number),
      (baseline.outputs.payoff_months as number) - (withLump.outputs.payoff_months as number)
    );
    closeTo(
      withLump.outputs.interest_saved as number,
      (baseline.outputs.new_interest as number) - (withLump.outputs.new_interest as number)
    );
  });
});

// ---------------------------------------------------------------------------
// DAT-001: the leap-day convention
// ---------------------------------------------------------------------------

test("DAT-001 leap-day convention is explicit and stable", async (t: any) => {
  await t.test("29 February anniversaries clamp to 28 February in non-leap years", () => {
    const r = calculateAge("2000-02-29", "2026-08-22") as any;
    assert.strictEqual(r.years, 26);
    assert.strictEqual(r.months, 5);
    // Convention A (28 Feb) gives 25 days; convention B (1 Mar) would give 21.
    assert.strictEqual(r.days, 25);
  });

  await t.test("total_days is convention-independent and verified against Julian Day Numbers", () => {
    const jdn = (y: number, m: number, d: number) => {
      const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
      return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) -
        Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    };
    const r = calculateAge("2000-02-29", "2026-08-22") as any;
    assert.strictEqual(r.total_days, jdn(2026, 8, 22) - jdn(2000, 2, 29));
    assert.strictEqual(r.total_days, 9671);
  });

  await t.test("the convention is disclosed to leap-day users", () => {
    const leap = calculateAge("2000-02-29", "2026-08-22") as any;
    assert.match(leap.leap_day_convention, /28 February/);
    // and not shown to everyone else
    const ordinary = calculateAge("1990-01-01", "2026-08-22") as any;
    assert.strictEqual(ordinary.leap_day_convention, undefined);
  });

  await t.test("invalid and reversed dates are rejected", () => {
    assert.throws(() => calculateAge("not-a-date", "2026-08-22"), /valid date of birth/);
    assert.throws(() => calculateAge("1990-01-01", "nonsense"), /valid reference date/);
    assert.throws(() => calculateAge("2026-08-22", "1990-01-01"), /cannot be earlier/);
  });
});

// ---------------------------------------------------------------------------
// Availability: unbounded loops
// ---------------------------------------------------------------------------

test("Runaway inputs are rejected instead of hanging", async (t: any) => {
  await t.test("gcd rejects non-finite values rather than looping forever", () => {
    // NaN % n is NaN and NaN !== 0 is always true, so the loop never ends.
    assert.throws(() => gcd(NaN, 18), /valid numbers/);
    assert.throws(() => gcd(12, Infinity), /valid numbers/);
    assert.strictEqual(gcd(12, 18), 6);
  });

  await t.test("amortisation and growth reject implausible terms", () => {
    assert.throws(() => calculateAmortisation(200000, 0.045, 1e10), /longer than/);
    assert.throws(() => investmentGrowth(1000, 100, 0.05, 0.005, 1e10), /longer than/);
    assert.throws(() => calculatePmt(200000, 0.045, 1e9), /longer than/);
    // The boundary itself still calculates.
    assert.ok(Number.isFinite(calculatePmt(200000, 0.045, MAX_TERM_YEARS)));
  });

  await t.test("MAT-005 with a non-numeric side does not hang", async () => {
    await assert.rejects(
      () => calculate("MAT-005", { a: NaN, b: 18 }, CTX),
      /valid number/
    );
  });

  await t.test("a very large but legitimate amount still calculates", async () => {
    const { outputs } = await calculate(
      "FIN-001",
      { principal: 10_000_000, annual_rate: 6, years: 25 },
      CTX
    );
    assert.ok((outputs.monthly_payment as number) > 0);
  });
});

// ---------------------------------------------------------------------------
// Engine boundary guards
// ---------------------------------------------------------------------------

test("The engine never returns NaN or Infinity to a caller", async (t: any) => {
  await t.test("non-finite inputs are rejected with a readable message", async () => {
    await assert.rejects(
      () => calculate("FIN-001", { principal: NaN, annual_rate: 6, years: 5 }, CTX),
      /Principal must be a valid number/
    );
  });

  await t.test("a missing required input is a validation error, not NaN", async () => {
    await assert.rejects(
      () => calculate("FIN-001", { annual_rate: 6, years: 5 }, CTX),
      /could not be calculated/
    );
  });

  await t.test("division by zero is a validation error, not Infinity", async () => {
    // Fuel cost with zero mpg.
    await assert.rejects(
      () => calculate("AUT-006", { distance_miles: 100, mpg_uk: 0, price_p_per_litre: 150, trips: 1 }, CTX),
      /could not be calculated/
    );
    // A credit-card payment that never clears the balance.
    await assert.rejects(
      () => calculate("FIN-009", { balance: 3000, apr: 0.249, monthly_payment: 0 }, CTX),
      /could not be calculated/
    );
  });

  await t.test("null outputs are still allowed - they mean 'not defined here'", async () => {
    // Markup is undefined at zero cost; that is information, not an error.
    const { outputs } = await calculate("BUS-001", { cost: 0, price: 100 }, CTX);
    assert.strictEqual(outputs.markup, null);
    assert.strictEqual(outputs.profit, 100);
  });

  await t.test("legitimate negatives are preserved, not over-rejected", async () => {
    const loss = await calculate("BUS-001", { cost: 120, price: 100 }, CTX);
    closeTo(loss.outputs.profit as number, -20);
    const negativeReturn = await calculate(
      "INV-001",
      { start: 10000, monthly: 200, return: -0.05, fee: 0.005, years: 10 },
      CTX
    );
    assert.ok((negativeReturn.outputs.projected_value as number) > 0);
  });
});

// ---------------------------------------------------------------------------
// PRO-018 / PRO-023 output completeness and jurisdiction
// ---------------------------------------------------------------------------

test("Property calculators state their scope and show purchase costs", async (t: any) => {
  await t.test("PRO-018 keeps its verified arithmetic", async () => {
    const { outputs } = await calculate(
      "PRO-018",
      { price: 250000, deposit: 75000, rate: 0.045, term: 25, rent: 1300, vacancy: 0.05, costs: 3000, repayment: false, additional_property: true },
      CTX
    );
    closeTo(outputs.effective_rent as number, 14820);
    closeTo(outputs.pre_tax_cashflow as number, 3945);
    closeTo(outputs.icr as number, 1.500952, 1e-5);
  });

  await t.test("PRO-018 now uses additional_property instead of ignoring it", async () => {
    const additional = await calculate(
      "PRO-018",
      { price: 250000, deposit: 75000, rate: 0.045, term: 25, rent: 1300, vacancy: 0.05, costs: 3000, repayment: false, additional_property: true },
      CTX
    );
    const primary = await calculate(
      "PRO-018",
      { price: 250000, deposit: 75000, rate: 0.045, term: 25, rent: 1300, vacancy: 0.05, costs: 3000, repayment: false, additional_property: false },
      CTX
    );
    assert.ok(
      (additional.outputs.estimated_sdlt as number) > (primary.outputs.estimated_sdlt as number),
      "the additional-property surcharge must increase the estimated SDLT"
    );
    // Cash required is the deposit plus the tax.
    closeTo(
      additional.outputs.cash_required as number,
      75000 + (additional.outputs.estimated_sdlt as number)
    );
  });

  await t.test("PRO-018 reports no ICR when there is no interest", async () => {
    const { outputs } = await calculate(
      "PRO-018",
      { price: 180000, deposit: 60000, rate: 0, term: 20, rent: 1000, vacancy: 0.05, costs: 2000, repayment: false, additional_property: true },
      CTX
    );
    // 0 would read as "no cover" when the truth is the opposite.
    assert.strictEqual(outputs.icr, null);
  });

  await t.test("PRO-023 states that SDLT is England and Northern Ireland only", async () => {
    const { outputs } = await calculate("PRO-023", { price: 300000, first_time: false, additional: false, nonresident: false }, CTX);
    assert.match(outputs.jurisdiction_note as string, /England and Northern Ireland/);
    assert.match(outputs.jurisdiction_note as string, /LBTT/);
    assert.match(outputs.jurisdiction_note as string, /LTT/);
  });

  await t.test("PRO-023 explains when first-time buyer relief is lost", async () => {
    const eligible = await calculate("PRO-023", { price: 400000, first_time: true, additional: false, nonresident: false }, CTX);
    const tooExpensive = await calculate("PRO-023", { price: 600000, first_time: true, additional: false, nonresident: false }, CTX);
    assert.strictEqual(eligible.outputs.first_time_buyer_note, undefined);
    assert.match(tooExpensive.outputs.first_time_buyer_note as string, /not available above/);
  });
});
