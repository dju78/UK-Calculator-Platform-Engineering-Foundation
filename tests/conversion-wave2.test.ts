/**
 * Wave 2 tranche 2P, Conversions.
 *
 * A unit converter is only as good as its table, so most of what matters here
 * is checkable as an EXACT IDENTITY rather than as an approximation: three feet
 * make a yard exactly, nine square feet make a square yard exactly, a round
 * trip must return the number you started with, and Celsius and Fahrenheit
 * cross at minus forty. Anything that must be exact is asserted as exact.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };

function closeTo(actual: number, expected: number, tol = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected} +/- ${tol}, got ${actual}`);
}

async function run(id: string, inputs: Record<string, unknown>) {
  return calculate(id, inputs as never, CTX);
}

async function throwsWith(id: string, inputs: Record<string, unknown>, fragment: string) {
  await assert.rejects(
    () => run(id, inputs),
    (err: Error) => {
      assert.ok(
        err.message.toLowerCase().includes(fragment.toLowerCase()),
        `expected a message containing "${fragment}", got "${err.message}"`
      );
      return true;
    }
  );
}

async function conv(id: string, value: number, from: string, to: string) {
  const r = await run(id, { value, from_unit: from, to_unit: to });
  return r.outputs.result as number;
}

// ---------------------------------------------------------------------------
// Exact identities
// ---------------------------------------------------------------------------

test("relations that are exact by definition come out exact", async () => {
  // Length.
  closeTo(await conv("CON-002", 1, "inch", "millimetre"), 25.4, 1e-12);
  closeTo(await conv("CON-002", 1, "yard", "foot"), 3, 1e-12);
  closeTo(await conv("CON-002", 1, "mile", "yard"), 1760, 1e-9);
  closeTo(await conv("CON-002", 1, "furlong", "chain"), 10, 1e-12);
  closeTo(await conv("CON-002", 1, "nautical_mile", "metre"), 1852, 1e-9);

  // Mass.
  closeTo(await conv("CON-003", 1, "pound", "ounce"), 16, 1e-12);
  closeTo(await conv("CON-003", 1, "stone", "pound"), 14, 1e-12);
  closeTo(await conv("CON-003", 1, "imperial_ton", "pound"), 2240, 1e-9);
  closeTo(await conv("CON-003", 1, "us_ton", "pound"), 2000, 1e-9);

  // Area: the squares are where intuition fails.
  closeTo(await conv("CON-005", 1, "square_yard", "square_foot"), 9, 1e-12);
  closeTo(await conv("CON-005", 1, "square_mile", "acre"), 640, 1e-9);
  closeTo(await conv("CON-005", 1, "square_kilometre", "hectare"), 100, 1e-9);
  closeTo(await conv("CON-005", 1, "acre", "square_yard"), 4840, 1e-9);

  // Volume.
  closeTo(await conv("CON-006", 1, "uk_gallon", "uk_pint"), 8, 1e-12);
  closeTo(await conv("CON-006", 1, "uk_pint", "uk_fluid_ounce"), 20, 1e-9);
  closeTo(await conv("CON-006", 1, "us_pint", "us_fluid_ounce"), 16, 1e-9);
  closeTo(await conv("CON-006", 1, "cubic_metre", "litre"), 1000, 1e-9);

  // Speed.
  closeTo(await conv("CON-007", 1, "metres_per_second", "kilometres_per_hour"), 3.6, 1e-12);
});

test("area factors are the SQUARE of length factors, which is where estimates go wrong", async () => {
  const lengthFactor = await conv("CON-002", 1, "yard", "metre");
  const areaFactor = await conv("CON-005", 1, "square_yard", "square_metre");
  closeTo(areaFactor, lengthFactor * lengthFactor, 1e-12);

  const mileFactor = await conv("CON-002", 1, "mile", "metre");
  const sqMileFactor = await conv("CON-005", 1, "square_mile", "square_metre");
  closeTo(sqMileFactor, mileFactor * mileFactor, 1e-3);
});

test("a round trip returns exactly what it started with, across every dimension", async () => {
  const cases: Array<[string, number, string, string]> = [
    ["CON-002", 12.345, "mile", "furlong"],
    ["CON-003", 78.9, "kilogram", "stone"],
    ["CON-005", 3.21, "hectare", "acre"],
    ["CON-006", 5.5, "uk_gallon", "us_pint"],
    ["CON-007", 88.8, "miles_per_hour", "knot"]
  ];
  for (const [id, value, from, to] of cases) {
    const there = await conv(id, value, from, to);
    const back = await conv(id, there, to, from);
    closeTo(back, value, Math.abs(value) * 1e-9);
  }
});

test("the reverse check reported to the user really does recover the input", async () => {
  const r = await run("CON-002", { value: 26.2, from_unit: "mile", to_unit: "kilometre" });
  closeTo(r.outputs.reverse_check as number, 26.2, 1e-9);
});

// ---------------------------------------------------------------------------
// The units that share a name and not a size
// ---------------------------------------------------------------------------

test("UK and US liquid measures differ, and the fluid ounce differs the other way", async () => {
  const ukPintMl = await conv("CON-006", 1, "uk_pint", "millilitre");
  const usPintMl = await conv("CON-006", 1, "us_pint", "millilitre");
  closeTo(ukPintMl, 568.26125, 1e-6);
  closeTo(usPintMl, 473.176473, 1e-6);
  assert.ok(usPintMl < ukPintMl, "a US pint is smaller than a UK pint");

  // But a UK fluid ounce is SMALLER than a US one, which is why a UK pint
  // holds 20 of them and a US pint 16.
  const ukOz = await conv("CON-006", 1, "uk_fluid_ounce", "millilitre");
  const usOz = await conv("CON-006", 1, "us_fluid_ounce", "millilitre");
  assert.ok(ukOz < usOz, "the UK fluid ounce is the smaller of the two");
});

test("a UK ton, a US ton and a metric tonne are three different weights", async () => {
  const uk = await conv("CON-003", 1, "imperial_ton", "kilogram");
  const us = await conv("CON-003", 1, "us_ton", "kilogram");
  const metric = await conv("CON-003", 1, "tonne", "kilogram");
  assert.ok(us < metric && metric < uk, "the US ton is lightest and the imperial ton heaviest");
  closeTo(metric, 1000, 1e-9);
});

test("a troy ounce is about ten per cent heavier than an ordinary ounce", async () => {
  const ratio = await conv("CON-003", 1, "troy_ounce", "ounce");
  assert.ok(ratio > 1.09 && ratio < 1.11, `expected about 1.097, got ${ratio}`);
});

// ---------------------------------------------------------------------------
// Temperature: an interval scale, not a ratio scale
// ---------------------------------------------------------------------------

test("Celsius and Fahrenheit cross at minus forty and nowhere else", async () => {
  closeTo(await conv("CON-004", -40, "celsius", "fahrenheit"), -40, 1e-9);
  for (const c of [-100, -50, 0, 20, 100]) {
    const f = await conv("CON-004", c, "celsius", "fahrenheit");
    assert.notStrictEqual(f, c);
  }
});

test("the fixed points of the Celsius scale convert correctly", async () => {
  closeTo(await conv("CON-004", 0, "celsius", "fahrenheit"), 32, 1e-9);
  closeTo(await conv("CON-004", 100, "celsius", "fahrenheit"), 212, 1e-9);
  closeTo(await conv("CON-004", 0, "celsius", "kelvin"), 273.15, 1e-9);
  closeTo(await conv("CON-004", 0, "kelvin", "celsius"), -273.15, 1e-9);
  closeTo(await conv("CON-004", 0, "kelvin", "fahrenheit"), -459.67, 1e-9);
});

test("below absolute zero is refused on every scale", async () => {
  await throwsWith("CON-004", { value: -300, from_unit: "celsius", to_unit: "kelvin" }, "below absolute zero");
  await throwsWith("CON-004", { value: -1, from_unit: "kelvin", to_unit: "celsius" }, "below absolute zero");
  await throwsWith("CON-004", { value: -500, from_unit: "fahrenheit", to_unit: "celsius" }, "below absolute zero");
  await throwsWith("CON-004", { value: -1, from_unit: "rankine", to_unit: "kelvin" }, "below absolute zero");
});

test("temperature is an offset conversion, so doubling the number does not double anything", async () => {
  const tenC = await conv("CON-004", 10, "celsius", "fahrenheit");
  const twentyC = await conv("CON-004", 20, "celsius", "fahrenheit");
  assert.notStrictEqual(twentyC, tenC * 2);

  // On the kelvin scale, which has a true zero, the ratio is meaningful.
  const tenK = await conv("CON-004", 10, "celsius", "kelvin");
  const twentyK = await conv("CON-004", 20, "celsius", "kelvin");
  assert.ok(twentyK / tenK < 1.04, "kelvin ratios reflect real thermal energy, and 10 to 20 C is a small step");
});

// ---------------------------------------------------------------------------
// Fuel economy: reciprocal, not proportional
// ---------------------------------------------------------------------------

test("mpg and litres per 100 km are reciprocals, so the ranking of two cars inverts", async () => {
  const thirsty = await run("CON-008", { value: 20, from_unit: "mpg_imperial", to_unit: "litres_per_100km" });
  const frugal = await run("CON-008", { value: 60, from_unit: "mpg_imperial", to_unit: "litres_per_100km" });

  assert.ok(
    (frugal.outputs.litres_per_100km as number) < (thirsty.outputs.litres_per_100km as number),
    "the more economical car must have the LOWER litres per 100 km"
  );
  // The product of the two figures is the same constant for any car.
  const productA = 20 * (thirsty.outputs.litres_per_100km as number);
  const productB = 60 * (frugal.outputs.litres_per_100km as number);
  closeTo(productA, productB, 1e-6);
});

test("equal steps in mpg are NOT equal savings, which is the practical consequence", async () => {
  const at20 = await conv("CON-008", 20, "mpg_imperial", "litres_per_100km");
  const at25 = await conv("CON-008", 25, "mpg_imperial", "litres_per_100km");
  const at40 = await conv("CON-008", 40, "mpg_imperial", "litres_per_100km");
  const at45 = await conv("CON-008", 45, "mpg_imperial", "litres_per_100km");

  const lowRangeSaving = at20 - at25;
  const highRangeSaving = at40 - at45;
  assert.ok(
    lowRangeSaving > 3 * highRangeSaving,
    `five mpg at the bottom of the range should save several times more fuel than five at the top; got ${lowRangeSaving} against ${highRangeSaving}`
  );
});

test("a US mpg figure is a fifth lower than the imperial one for the same car", async () => {
  const r = await run("CON-008", { value: 50, from_unit: "mpg_imperial", to_unit: "mpg_us" });
  closeTo(
    (r.outputs.mpg_imperial as number) / (r.outputs.mpg_us as number),
    4.54609 / 3.785411784,
    1e-9
  );
});

test("a zero or negative economy is refused in any unit", async () => {
  await throwsWith("CON-008", { value: 0, from_unit: "mpg_imperial", to_unit: "litres_per_100km" }, "greater than zero");
  await throwsWith("CON-008", { value: -5, from_unit: "litres_per_100km", to_unit: "mpg_imperial" }, "greater than zero");
});

// ---------------------------------------------------------------------------
// Shoe sizes
// ---------------------------------------------------------------------------

test("standard shoe conversions match the published tables", async () => {
  const cases: Array<[number, string, number, number]> = [
    // [UK size, gender, expected US, expected EU]
    [8, "men", 9, 42],
    [9, "men", 10, 43],
    [10, "men", 11, 44.5],
    [5, "women", 7, 38],
    [6, "women", 8, 39.5]
  ];
  for (const [uk, gender, us, eu] of cases) {
    const r = await run("CON-009", { size: uk, from_system: "uk", gender });
    assert.strictEqual(r.outputs.us_size, us, `UK ${uk} ${gender} should be US ${us}`);
    assert.strictEqual(r.outputs.eu_size, eu, `UK ${uk} ${gender} should be EU ${eu}`);
  }
});

test("the men's and women's US offsets genuinely differ", async () => {
  const men = await run("CON-009", { size: 7, from_system: "uk", gender: "men" });
  const women = await run("CON-009", { size: 7, from_system: "uk", gender: "women" });
  assert.strictEqual(men.outputs.us_size, 8);
  assert.strictEqual(women.outputs.us_size, 9);
  // The FOOT is the same size in both; only the label differs.
  closeTo(men.outputs.foot_length_mm as number, women.outputs.foot_length_mm as number, 1e-9);
});

test("every system round-trips back to the same UK size", async () => {
  for (const uk of [6, 7, 8, 9, 10, 11]) {
    const base = await run("CON-009", { size: uk, from_system: "uk", gender: "men" });
    const fromUs = await run("CON-009", { size: base.outputs.us_size, from_system: "us", gender: "men" });
    const fromFoot = await run("CON-009", {
      size: base.outputs.foot_length_mm, from_system: "foot_length_mm", gender: "men"
    });
    assert.strictEqual(fromUs.outputs.uk_size, uk);
    assert.strictEqual(fromFoot.outputs.uk_size, uk);
  }
});

test("the approximate nature of shoe sizing is stated, not implied", async () => {
  const r = await run("CON-009", { size: 9, from_system: "uk", gender: "men" });
  assert.ok(
    (r.warnings ?? []).some(w => /approximate/i.test(w)),
    "a conversion between conventions that genuinely disagree must say so"
  );
});

// ---------------------------------------------------------------------------
// Unknown units are refused by name
// ---------------------------------------------------------------------------

test("an unknown unit is refused by name rather than silently defaulted", async () => {
  await throwsWith("CON-002", { value: 1, from_unit: "parsec", to_unit: "metre" }, "not a length unit");
  await throwsWith("CON-003", { value: 1, from_unit: "kilogram", to_unit: "slug" }, "not a mass unit");
  await throwsWith("CON-004", { value: 1, from_unit: "reaumur", to_unit: "celsius" }, "not a temperature scale");
  await throwsWith("CON-008", { value: 1, from_unit: "gallons_per_furlong", to_unit: "mpg_imperial" }, "not a fuel economy unit");
});

// ---------------------------------------------------------------------------
// Nothing broken ever reaches a user
// ---------------------------------------------------------------------------

test("every conversion calculator returns finite numbers, strings or nulls only", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["CON-002", { value: 1, from_unit: "mile", to_unit: "kilometre" }],
    ["CON-003", { value: 1, from_unit: "stone", to_unit: "kilogram" }],
    ["CON-004", { value: 20, from_unit: "celsius", to_unit: "fahrenheit" }],
    ["CON-005", { value: 1, from_unit: "acre", to_unit: "square_metre" }],
    ["CON-006", { value: 1, from_unit: "uk_pint", to_unit: "millilitre" }],
    ["CON-007", { value: 60, from_unit: "miles_per_hour", to_unit: "kilometres_per_hour" }],
    ["CON-008", { value: 40, from_unit: "mpg_imperial", to_unit: "litres_per_100km" }],
    ["CON-009", { size: 9, from_system: "uk", gender: "men" }]
  ];
  for (const [id, inputs] of cases) {
    const r = await run(id, inputs);
    for (const [key, value] of Object.entries(r.outputs)) {
      if (value === null) continue;
      const kind = typeof value;
      assert.ok(
        kind === "number" || kind === "string" || kind === "boolean",
        `${id}.${key} is a ${kind}, which would render as [object Object]`
      );
      if (kind === "number") {
        assert.ok(Number.isFinite(value as number), `${id}.${key} is not finite`);
      }
      if (kind === "string") {
        assert.ok(
          !/NaN|Infinity|undefined|\[object/.test(value as string),
          `${id}.${key} contains a broken value: ${value}`
        );
      }
    }
  }
});
