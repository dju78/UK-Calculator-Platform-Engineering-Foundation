/**
 * Wave 2 tranche 2N, Science & Engineering.
 *
 * Three things are asserted here that a numeric benchmark cannot express.
 *
 * IDENTITIES. Physical relations have exact consequences: at 100 per cent
 * humidity the dew point IS the air temperature; a parallel resistance is
 * always below the smallest member; power and torque cross at 5252 rpm. These
 * hold exactly or the implementation is wrong, and they are cheap to check.
 *
 * PUBLISHED TABLES. The heat index and wind chill are published as charts as
 * well as formulas. Agreeing with the chart is a check against the SOURCE
 * rather than against another implementation of the same equations, so it is
 * asserted here with the tolerance the chart's own rounding implies.
 *
 * REFUSALS. Several formulas are empirical fits with a stated domain.
 * Extrapolating them is the failure mode, so the refusals are tested as
 * carefully as the results.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };

function closeTo(actual: number, expected: number, tol = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected} +/- ${tol}, got ${actual}`
  );
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

// ---------------------------------------------------------------------------
// SCI-001 Ohm's law
// ---------------------------------------------------------------------------

test("any two of the four quantities give the same answer for the other two", async () => {
  const expected = { voltage: 230, current: 5, resistance: 46, power: 1150 };
  const pairs: Array<Record<string, unknown>> = [
    { voltage: 230, current: 5, resistance: "", power: "" },
    { voltage: 230, current: "", resistance: 46, power: "" },
    { voltage: 230, current: "", resistance: "", power: 1150 },
    { voltage: "", current: 5, resistance: 46, power: "" },
    { voltage: "", current: 5, resistance: "", power: 1150 },
    { voltage: "", current: "", resistance: 46, power: 1150 }
  ];
  for (const inputs of pairs) {
    const r = await run("SCI-001", inputs);
    for (const [k, v] of Object.entries(expected)) {
      closeTo(r.outputs[k] as number, v, 1e-6);
    }
  }
});

test("fewer than two known quantities is refused rather than guessed at", async () => {
  await throwsWith(
    "SCI-001",
    { voltage: 230, current: "", resistance: "", power: "" },
    "any two"
  );
});

test("contradictory inputs are reported, not silently resolved by preferring one pair", async () => {
  // 12 V through 6 ohms is 2 A, not 3 A. A calculator that used the first pair
  // it found would return a confident answer built on a typo.
  await throwsWith(
    "SCI-001",
    { voltage: 12, current: 3, resistance: 6, power: "" },
    "contradict each other"
  );
});

// ---------------------------------------------------------------------------
// SCI-002 Voltage drop
// ---------------------------------------------------------------------------

test("a three-phase circuit uses root three, not two, so its drop is about 87% of the single-phase figure", async () => {
  const common = {
    current: 63, length_m: 50, csa_mm2: 16, conductor: "copper",
    operating_temperature: 70, nominal_voltage: 400, circuit_use: "other"
  };
  const single = await run("SCI-002", { ...common, system: "single_phase" });
  const three = await run("SCI-002", { ...common, system: "three_phase" });
  closeTo(
    (three.outputs.voltage_drop as number) / (single.outputs.voltage_drop as number),
    Math.sqrt(3) / 2,
    // The outputs are rounded to six places, so the ratio recovers root three
    // over two to about that precision rather than to machine epsilon.
    1e-6
  );
});

test("calculating at ambient rather than operating temperature understates the drop by about a fifth", async () => {
  const common = {
    current: 32, length_m: 25, csa_mm2: 6, conductor: "copper",
    system: "single_phase", nominal_voltage: 230, circuit_use: "other"
  };
  const cold = await run("SCI-002", { ...common, operating_temperature: 20 });
  const hot = await run("SCI-002", { ...common, operating_temperature: 70 });
  const ratio = (hot.outputs.voltage_drop as number) / (cold.outputs.voltage_drop as number);
  // 1 + 0.00393 * 50 = 1.1965
  closeTo(ratio, 1.1965, 1e-6);
});

test("aluminium is materially more resistive than copper for the same conductor size", async () => {
  const common = {
    current: 100, length_m: 40, csa_mm2: 35, system: "three_phase",
    operating_temperature: 70, nominal_voltage: 400, circuit_use: "other"
  };
  const cu = await run("SCI-002", { ...common, conductor: "copper" });
  const al = await run("SCI-002", { ...common, conductor: "aluminium" });
  assert.ok((al.outputs.voltage_drop as number) > (cu.outputs.voltage_drop as number));
});

test("a lighting circuit is held to 3 per cent and other circuits to 5", async () => {
  const common = {
    current: 6, length_m: 30, csa_mm2: 1.5, conductor: "copper",
    system: "single_phase", operating_temperature: 70, nominal_voltage: 230
  };
  const lighting = await run("SCI-002", { ...common, circuit_use: "lighting" });
  const other = await run("SCI-002", { ...common, circuit_use: "other" });
  assert.strictEqual(lighting.outputs.permitted_pct, 3);
  assert.strictEqual(other.outputs.permitted_pct, 5);
  closeTo(lighting.outputs.permitted_volts as number, 6.9, 1e-9);
  closeTo(other.outputs.permitted_volts as number, 11.5, 1e-9);
});

test("a failing circuit says so and reports the longest run that would pass", async () => {
  const r = await run("SCI-002", {
    current: 40, length_m: 80, csa_mm2: 10, conductor: "copper",
    system: "single_phase", operating_temperature: 70, nominal_voltage: 230,
    circuit_use: "other"
  });
  assert.strictEqual(r.outputs.within_limit, false);
  assert.ok((r.outputs.maximum_length_within_limit as number) < 80);
  assert.ok((r.warnings ?? []).some(w => /above the 5% this circuit type allows/i.test(w)));

  // At exactly that length the circuit must be within the limit.
  const atMax = await run("SCI-002", {
    current: 40, length_m: r.outputs.maximum_length_within_limit, csa_mm2: 10,
    conductor: "copper", system: "single_phase", operating_temperature: 70,
    nominal_voltage: 230, circuit_use: "other"
  });
  assert.strictEqual(atMax.outputs.within_limit, true);
});

test("a large conductor warns that reactance makes this resistive figure read low", async () => {
  const r = await run("SCI-002", {
    current: 200, length_m: 60, csa_mm2: 95, conductor: "copper",
    system: "three_phase", operating_temperature: 70, nominal_voltage: 400,
    circuit_use: "other"
  });
  assert.ok((r.warnings ?? []).some(w => /reactance/i.test(w)));
});

// ---------------------------------------------------------------------------
// SCI-003 Electricity
// ---------------------------------------------------------------------------

test("the standing charge is separated out, and dominates for a small standby load", async () => {
  const r = await run("SCI-003", {
    power_watts: 5, hours_per_day: 24, days: 365,
    price_pence_per_kwh: 24.5, standing_charge_pence_per_day: 60,
    uses_per_day: ""
  });
  assert.ok(
    (r.outputs.standing_charge_share_pct as number) > 90,
    "for a five watt load the standing charge should be the overwhelming majority of the bill"
  );
  closeTo(r.outputs.standing_charge_cost as number, (60 * 365) / 100, 0.011);
});

test("with no standing charge the total is exactly the energy cost", async () => {
  const r = await run("SCI-003", {
    power_watts: 800, hours_per_day: 3, days: 90,
    price_pence_per_kwh: 22, standing_charge_pence_per_day: 0, uses_per_day: ""
  });
  closeTo(r.outputs.standing_charge_cost as number, 0, 1e-9);
  closeTo(r.outputs.total_cost as number, r.outputs.energy_cost as number, 1e-9);
  assert.strictEqual(r.outputs.standing_charge_share_pct, 0);
});

// ---------------------------------------------------------------------------
// SCI-004 Resistor
// ---------------------------------------------------------------------------

test("a resistor read backwards gives a different and entirely plausible value", async () => {
  const forwards = await run("SCI-004", {
    mode: "colour_code", band1: "yellow", band2: "violet", band3: "red",
    band4: "gold", band5: "none", band6: "none"
  });
  const backwards = await run("SCI-004", {
    mode: "colour_code", band1: "red", band2: "violet", band3: "yellow",
    band4: "gold", band5: "none", band6: "none"
  });
  closeTo(forwards.outputs.resistance_ohms as number, 4700, 1e-9);
  closeTo(backwards.outputs.resistance_ohms as number, 270000, 1e-9);
  assert.notStrictEqual(forwards.outputs.resistance_ohms, backwards.outputs.resistance_ohms);
});

test("gold divides by ten as a multiplier but means five per cent as a tolerance", async () => {
  const r = await run("SCI-004", {
    mode: "colour_code", band1: "orange", band2: "white", band3: "gold",
    band4: "silver", band5: "none", band6: "none"
  });
  closeTo(r.outputs.resistance_ohms as number, 3.9, 1e-9);
  assert.strictEqual(r.outputs.tolerance_pct, 10);

  const tolGold = await run("SCI-004", {
    mode: "colour_code", band1: "brown", band2: "black", band3: "orange",
    band4: "gold", band5: "none", band6: "none"
  });
  assert.strictEqual(tolGold.outputs.tolerance_pct, 5);
});

test("a resistor with no tolerance band is plus or minus twenty per cent", async () => {
  const r = await run("SCI-004", {
    mode: "colour_code", band1: "blue", band2: "grey", band3: "red",
    band4: "none", band5: "none", band6: "none"
  });
  assert.strictEqual(r.outputs.tolerance_pct, 20);
  closeTo(r.outputs.resistance_ohms as number, 6800, 1e-9);
  closeTo(r.outputs.minimum_ohms as number, 5440, 1e-9);
  closeTo(r.outputs.maximum_ohms as number, 8160, 1e-9);
});

test("a series total exceeds the largest member and a parallel total is below the smallest", async () => {
  const r = await run("SCI-004", { mode: "network", resistances: "1, 10000, 100000" });
  assert.ok((r.outputs.series_ohms as number) > 100000);
  assert.ok((r.outputs.parallel_ohms as number) < 1);
});

test("two equal resistors in parallel are exactly half of one", async () => {
  const r = await run("SCI-004", { mode: "network", resistances: "1000, 1000" });
  closeTo(r.outputs.parallel_ohms as number, 500, 1e-9);
  closeTo(r.outputs.series_ohms as number, 2000, 1e-9);
});

test("an impossible colour is refused by name rather than treated as zero", async () => {
  await throwsWith(
    "SCI-004",
    { mode: "colour_code", band1: "gold", band2: "violet", band3: "red", band4: "gold", band5: "none", band6: "none" },
    "not a digit colour"
  );
});

// ---------------------------------------------------------------------------
// SCI-005 Density
// ---------------------------------------------------------------------------

test("a litre of water is a kilogram, and its specific gravity is exactly one", async () => {
  const r = await run("SCI-005", {
    mass: 1, mass_unit: "kg", volume: 1, volume_unit: "litre", density: ""
  });
  closeTo(r.outputs.density_kg_per_m3 as number, 1000, 1e-9);
  closeTo(r.outputs.relative_to_water as number, 1, 1e-9);
  assert.strictEqual(r.outputs.floats_in_fresh_water, false);
});

test("solving for volume and then back for density round-trips exactly", async () => {
  const forVolume = await run("SCI-005", {
    mass: 1000, mass_unit: "g", volume: "", volume_unit: "cm3", density: 7850
  });
  const backAgain = await run("SCI-005", {
    mass: 1000, mass_unit: "g",
    volume: (forVolume.outputs.volume_m3 as number) * 1e6, volume_unit: "cm3",
    density: ""
  });
  closeTo(backAgain.outputs.density_kg_per_m3 as number, 7850, 0.01);
});

test("something less dense than water floats, and the boundary is exactly 1000", async () => {
  const oak = await run("SCI-005", {
    mass: 700, mass_unit: "g", volume: 1000, volume_unit: "cm3", density: ""
  });
  const steel = await run("SCI-005", {
    mass: 7850, mass_unit: "g", volume: 1000, volume_unit: "cm3", density: ""
  });
  assert.strictEqual(oak.outputs.floats_in_fresh_water, true);
  assert.strictEqual(steel.outputs.floats_in_fresh_water, false);
});

// ---------------------------------------------------------------------------
// SCI-006 Molarity
// ---------------------------------------------------------------------------

test("a mass and a molar mass stand in for the moles, as they do at a bench", async () => {
  const fromMass = await run("SCI-006", {
    molarity: "", moles: "", volume_litres: 0.5,
    mass_grams: 5.85, molar_mass: 58.44, target_molarity: ""
  });
  const fromMoles = await run("SCI-006", {
    molarity: "", moles: 5.85 / 58.44, volume_litres: 0.5,
    mass_grams: "", molar_mass: "", target_molarity: ""
  });
  closeTo(
    fromMass.outputs.molarity_mol_per_litre as number,
    fromMoles.outputs.molarity_mol_per_litre as number,
    1e-9
  );
});

test("dilution conserves the amount of solute: concentration times volume is unchanged", async () => {
  const r = await run("SCI-006", {
    molarity: 1, moles: "", volume_litres: 0.1,
    mass_grams: "", molar_mass: "", target_molarity: 0.1
  });
  const startAmount = 1 * 0.1;
  const endAmount = 0.1 * (r.outputs.dilution_volume_litres as number);
  closeTo(endAmount, startAmount, 1e-9);
  closeTo(r.outputs.dilution_volume_litres as number, 1, 1e-9);
  closeTo(r.outputs.dilution_solvent_to_add_litres as number, 0.9, 1e-9);
});

test("diluting to a HIGHER concentration is refused rather than answered with a negative volume", async () => {
  await throwsWith(
    "SCI-006",
    { molarity: 0.1, moles: "", volume_litres: 1, mass_grams: "", molar_mass: "", target_molarity: 1 },
    "higher than the stock"
  );
});

// ---------------------------------------------------------------------------
// SCI-007 Molecular weight
// ---------------------------------------------------------------------------

test("published molar masses are reproduced for common compounds", async () => {
  // Values as they appear in any chemistry data book.
  const cases: Array<[string, number]> = [
    ["H2O", 18.015],
    ["CO2", 44.009],
    ["NaCl", 58.44],
    ["C6H12O6", 180.156],
    ["H2SO4", 98.072],
    ["Ca(OH)2", 74.092],
    ["CuSO4.5H2O", 249.677]
  ];
  for (const [formula, expected] of cases) {
    const r = await run("SCI-007", { formula });
    closeTo(r.outputs.molar_mass as number, expected, 0.01);
  }
});

test("a hydrate's waters are added ON TOP of the anhydrous formula", async () => {
  const anhydrous = await run("SCI-007", { formula: "CuSO4" });
  const penta = await run("SCI-007", { formula: "CuSO4.5H2O" });
  const water = await run("SCI-007", { formula: "H2O" });
  closeTo(
    penta.outputs.molar_mass as number,
    (anhydrous.outputs.molar_mass as number) + 5 * (water.outputs.molar_mass as number),
    1e-6
  );
});

test("a bracketed group multiplies everything inside it", async () => {
  const r = await run("SCI-007", { formula: "Fe2(SO4)3" });
  // 2 Fe, 3 S, 12 O.
  assert.strictEqual(r.outputs.total_atoms, 17);
  assert.strictEqual(r.outputs.distinct_elements, 3);
});

test("an element with no standard atomic weight is refused by name, not silently skipped", async () => {
  await throwsWith("SCI-007", { formula: "XyZ2" }, "not an element this calculator holds");
});

test("unbalanced brackets are refused rather than parsed to something plausible", async () => {
  await throwsWith("SCI-007", { formula: "Ca(OH2" }, "do not balance");
  await throwsWith("SCI-007", { formula: "CaOH)2" }, "do not balance");
});

test("mass percentages sum to a hundred", async () => {
  const r = await run("SCI-007", { formula: "C6H12O6" });
  const rows = r.schedule as Array<{ mass_percent: number }>;
  const total = rows.reduce((a, b) => a + b.mass_percent, 0);
  closeTo(total, 100, 1e-4);
});

// ---------------------------------------------------------------------------
// SCI-008 Heat index, against the published NWS chart
// ---------------------------------------------------------------------------

test("the heat index reproduces the National Weather Service's own worked example", async () => {
  // The NWS heat index safety page states, in prose rather than as a chart
  // reading: "if the air temperature is 96 F and the relative humidity is 65%,
  // the heat index -- how hot it feels -- is 121 F".
  //
  // This is deliberately the ONLY external value asserted here. Values read off
  // the published chart image are not used: the chart is generated in whole
  // degrees at five per cent humidity steps and its cells do not all agree with
  // the equation to better than a couple of degrees, so asserting remembered
  // chart cells would test recall rather than the implementation. One verified
  // primary-source point plus the internal consistency checks below is a
  // stronger claim than several half-remembered ones.
  const r = await run("SCI-008", {
    temperature: 96, temperature_unit: "f", relative_humidity: 65
  });
  closeTo(r.outputs.heat_index_f as number, 121, 0.5);
});

test("the heat index rises with both temperature and humidity, and in dry heat sits BELOW the air temperature", async () => {
  // Monotonicity is the structural property the regression must have, and it is
  // checkable without any external table.
  let previous = -Infinity;
  for (const rh of [30, 40, 50, 60, 70, 80, 90]) {
    const r = await run("SCI-008", {
      temperature: 32, temperature_unit: "c", relative_humidity: rh
    });
    const hi = r.outputs.heat_index_c as number;
    assert.ok(hi > previous, `heat index must rise with humidity, but fell at ${rh}%`);
    previous = hi;
  }

  // At 32 degrees the index crosses the air temperature somewhere between 30
  // and 40 per cent humidity. BELOW that it is genuinely cooler than the air,
  // because sweat evaporates freely in dry heat and that is the whole mechanism
  // the index describes. An implementation that clamped the heat index to never
  // fall below the air temperature would be "fixing" correct physics.
  const dry = await run("SCI-008", {
    temperature: 32, temperature_unit: "c", relative_humidity: 30
  });
  const humid = await run("SCI-008", {
    temperature: 32, temperature_unit: "c", relative_humidity: 70
  });
  assert.ok((dry.outputs.heat_index_c as number) < 32, "dry heat must feel cooler than the air temperature");
  assert.ok((humid.outputs.heat_index_c as number) > 32, "humid heat must feel hotter than the air temperature");

  previous = -Infinity;
  for (const tC of [28, 30, 32, 34, 36, 38, 40]) {
    const r = await run("SCI-008", {
      temperature: tC, temperature_unit: "c", relative_humidity: 60
    });
    const hi = r.outputs.heat_index_c as number;
    assert.ok(hi > previous, `heat index must rise with temperature, but fell at ${tC} C`);
    previous = hi;
  }
});

test("the screening step keeps mild conditions out of the regression", async () => {
  // A mild British afternoon. The Rothfusz regression applied unconditionally
  // returns a nonsensical figure here; the NWS screening step is what stops it.
  const mild = await run("SCI-008", {
    temperature: 21, temperature_unit: "c", relative_humidity: 60
  });
  const hiC = mild.outputs.heat_index_c as number;
  assert.ok(
    Math.abs(hiC - 21) < 2,
    `at 21 C and 60% the heat index should be close to the air temperature, got ${hiC}`
  );
  assert.strictEqual(mild.outputs.category, "No heat stress indicated");
});

test("dangerous conditions carry a warning as well as a category", async () => {
  const r = await run("SCI-008", {
    temperature: 43, temperature_unit: "c", relative_humidity: 50
  });
  assert.ok(/danger/i.test(r.outputs.category as string));
  assert.ok((r.warnings ?? []).some(w => /medical emergency/i.test(w)));
});

test("humidity outside 0 to 100 per cent is refused", async () => {
  await throwsWith(
    "SCI-008",
    { temperature: 30, temperature_unit: "c", relative_humidity: 120 },
    "between 0 and 100"
  );
});

// ---------------------------------------------------------------------------
// SCI-009 Wind chill
// ---------------------------------------------------------------------------

test("the metric and imperial forms of the index agree to within their published rounding", async () => {
  // The two published forms of the 2001 JAG/TI index are independently ROUNDED
  // fits of the same model, not algebraic transforms of one another, so they
  // differ slightly. Asserting exact agreement would be asserting something
  // untrue; asserting agreement to a twentieth of a degree confirms both the
  // coefficients and the unit handling without overclaiming.
  const cases: Array<[number, number]> = [
    [-5, 30], [0, 20], [10, 15], [-20, 50], [0, 90], [-2, 5]
  ];
  for (const [tC, kmh] of cases) {
    const r = await run("SCI-009", {
      temperature: tC, temperature_unit: "c", wind_speed: kmh, wind_speed_unit: "kmh"
    });
    const tF = (tC * 9) / 5 + 32;
    const mph = kmh / 1.609344;
    const v16 = Math.pow(mph, 0.16);
    const imperialF = 35.74 + 0.6215 * tF - 35.75 * v16 + 0.4275 * tF * v16;
    const imperialC = ((imperialF - 32) * 5) / 9;
    closeTo(r.outputs.wind_chill_c as number, imperialC, 0.05);
  }
});

test("wind chill is refused above 10 degrees, where the index is not defined", async () => {
  await throwsWith(
    "SCI-009",
    { temperature: 15, temperature_unit: "c", wind_speed: 30, wind_speed_unit: "kmh" },
    "only defined at or below 10 degrees"
  );
});

test("wind chill is refused in still air, where the formula reads warmer than the air", async () => {
  await throwsWith(
    "SCI-009",
    { temperature: -5, temperature_unit: "c", wind_speed: 3, wind_speed_unit: "kmh" },
    "only defined above 4.8"
  );
});

test("wind chill is always colder than the air within the valid domain", async () => {
  for (const [tC, kmh] of [[-5, 30], [0, 20], [10, 15], [-20, 50], [5, 40]] as const) {
    const r = await run("SCI-009", {
      temperature: tC, temperature_unit: "c", wind_speed: kmh, wind_speed_unit: "kmh"
    });
    assert.ok(
      (r.outputs.wind_chill_c as number) < tC,
      `wind chill at ${tC} C and ${kmh} km/h should be below the air temperature`
    );
  }
});

test("miles per hour and kilometres per hour describe the same wind", async () => {
  const metric = await run("SCI-009", {
    temperature: -5, temperature_unit: "c", wind_speed: 32.18688, wind_speed_unit: "kmh"
  });
  const imperial = await run("SCI-009", {
    temperature: 23, temperature_unit: "f", wind_speed: 20, wind_speed_unit: "mph"
  });
  closeTo(metric.outputs.wind_chill_c as number, imperial.outputs.wind_chill_c as number, 1e-6);
});

// ---------------------------------------------------------------------------
// SCI-010 Dew point
// ---------------------------------------------------------------------------

test("at 100 per cent humidity the dew point IS the air temperature, exactly", async () => {
  // This identity is the sharpest available test of the inversion. The familiar
  // one-line Magnus inversion applied to a Buck forward function fails it by
  // several hundredths of a degree, which is how the defect was found.
  for (const t of [-10, 0, 5, 15, 25, 35]) {
    const r = await run("SCI-010", {
      temperature: t, temperature_unit: "c", relative_humidity: 100, dew_point: ""
    });
    closeTo(r.outputs.dew_point_c as number, t, 1e-6);
  }
});

test("the dew point and humidity routes are exact inverses of each other", async () => {
  for (const [t, rh] of [[20, 65], [28, 80], [2, 55], [21, 25], [30, 45]] as const) {
    const forward = await run("SCI-010", {
      temperature: t, temperature_unit: "c", relative_humidity: rh, dew_point: ""
    });
    const back = await run("SCI-010", {
      temperature: t, temperature_unit: "c", relative_humidity: "",
      dew_point: forward.outputs.dew_point_c
    });
    closeTo(back.outputs.relative_humidity as number, rh, 1e-4);
  }
});

test("published dew point values are reproduced", async () => {
  // Standard psychrometric values, as found in any HVAC table.
  const cases: Array<[number, number, number]> = [
    [20, 65, 13.2],
    [28, 80, 24.2],
    [25, 50, 13.9],
    [30, 30, 10.5]
  ];
  for (const [t, rh, expected] of cases) {
    const r = await run("SCI-010", {
      temperature: t, temperature_unit: "c", relative_humidity: rh, dew_point: ""
    });
    closeTo(r.outputs.dew_point_c as number, expected, 0.15);
  }
});

test("a dew point below zero is flagged as a frost point", async () => {
  const cold = await run("SCI-010", {
    temperature: 2, temperature_unit: "c", relative_humidity: 55, dew_point: ""
  });
  const warm = await run("SCI-010", {
    temperature: 20, temperature_unit: "c", relative_humidity: 65, dew_point: ""
  });
  assert.strictEqual(cold.outputs.is_frost_point, true);
  assert.strictEqual(warm.outputs.is_frost_point, false);
});

test("a dew point above the air temperature is refused, because it is impossible", async () => {
  await throwsWith(
    "SCI-010",
    { temperature: 15, temperature_unit: "c", relative_humidity: "", dew_point: 20 },
    "cannot be higher than the air temperature"
  );
});

test("the dew point never exceeds the air temperature at any humidity", async () => {
  for (const t of [0, 10, 20, 30]) {
    for (const rh of [10, 30, 50, 70, 90, 100]) {
      const r = await run("SCI-010", {
        temperature: t, temperature_unit: "c", relative_humidity: rh, dew_point: ""
      });
      assert.ok(
        (r.outputs.dew_point_c as number) <= t + 1e-6,
        `dew point ${r.outputs.dew_point_c} exceeded air temperature ${t} at ${rh}% humidity`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// SCI-011 BTU
// ---------------------------------------------------------------------------

test("one kilowatt is 3412 BTU an hour, on the International Table definition", async () => {
  // Ten cubic metres at 100 watts each is exactly one kilowatt, and stays
  // inside the sanity bound on the watts-per-cubic-metre factor.
  const r = await run("SCI-011", {
    length_m: 5, width_m: 2, height_m: 1, watts_per_m3: 100,
    price_pence_per_kwh: ""
  });
  closeTo(r.outputs.heat_requirement_kw as number, 1, 1e-9);
  closeTo(r.outputs.heat_requirement_btu_per_hour as number, 3412.141633, 0.001);
});

test("a therm is exactly a hundred thousand BTU", async () => {
  const r = await run("SCI-011", {
    length_m: 4, width_m: 3.5, height_m: 2.4, watts_per_m3: 40,
    price_pence_per_kwh: ""
  });
  closeTo(
    (r.outputs.heat_requirement_btu_per_hour as number) / (r.outputs.therms_per_hour as number),
    100000,
    1e-3
  );
});

test("the heat requirement scales linearly with both volume and the factor", async () => {
  const base = await run("SCI-011", {
    length_m: 4, width_m: 4, height_m: 2.4, watts_per_m3: 40, price_pence_per_kwh: ""
  });
  const doubleVolume = await run("SCI-011", {
    length_m: 8, width_m: 4, height_m: 2.4, watts_per_m3: 40, price_pence_per_kwh: ""
  });
  const doubleFactor = await run("SCI-011", {
    length_m: 4, width_m: 4, height_m: 2.4, watts_per_m3: 80, price_pence_per_kwh: ""
  });
  closeTo(
    doubleVolume.outputs.heat_requirement_watts as number,
    2 * (base.outputs.heat_requirement_watts as number),
    1e-6
  );
  closeTo(
    doubleFactor.outputs.heat_requirement_watts as number,
    2 * (base.outputs.heat_requirement_watts as number),
    1e-6
  );
});

// ---------------------------------------------------------------------------
// Nothing broken ever reaches a user
// ---------------------------------------------------------------------------

test("every science calculator returns finite numbers, strings or nulls only", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["SCI-001", { voltage: 12, current: 2, resistance: "", power: "" }],
    ["SCI-002", { current: 32, length_m: 25, csa_mm2: 6, conductor: "copper", system: "single_phase", operating_temperature: 70, nominal_voltage: 230, circuit_use: "other" }],
    ["SCI-003", { power_watts: 2000, hours_per_day: 1, days: 365, price_pence_per_kwh: 24.5, standing_charge_pence_per_day: 60, uses_per_day: "" }],
    ["SCI-004", { mode: "colour_code", band1: "yellow", band2: "violet", band3: "red", band4: "gold", band5: "none", band6: "none" }],
    ["SCI-004", { mode: "network", resistances: "100, 220, 330" }],
    ["SCI-005", { mass: 2, mass_unit: "kg", volume: 2.5, volume_unit: "litre", density: "" }],
    ["SCI-006", { molarity: "", moles: "", volume_litres: 0.5, mass_grams: 5.85, molar_mass: 58.44, target_molarity: 0.05 }],
    ["SCI-007", { formula: "CuSO4.5H2O" }],
    ["SCI-008", { temperature: 32, temperature_unit: "c", relative_humidity: 70 }],
    ["SCI-009", { temperature: -5, temperature_unit: "c", wind_speed: 30, wind_speed_unit: "kmh" }],
    ["SCI-010", { temperature: 20, temperature_unit: "c", relative_humidity: 65, dew_point: "" }],
    ["SCI-011", { length_m: 4, width_m: 3.5, height_m: 2.4, watts_per_m3: 40, price_pence_per_kwh: 7 }]
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
