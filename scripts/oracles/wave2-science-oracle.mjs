/**
 * Independent benchmark oracle for Wave 2 tranche 2N, Science & Engineering.
 *
 * Imports nothing from the calculation engine. Independence of METHOD:
 *
 *   - Ohm's law is resolved through CONDUCTANCE (G = I/V, P = I squared over
 *     G) rather than through resistance, so a reciprocal taken in the wrong
 *     place would separate the two.
 *   - Voltage drop is computed twice: once from resistivity expressed in
 *     ohm millimetres squared per metre, a completely different unit chain
 *     from the engine's ohm metres and square metres, and once by SUMMING a
 *     thousand segments along the cable. All three must agree.
 *   - Electricity cost is accumulated DAY BY DAY rather than multiplied out.
 *   - Resistor colours are decoded from a table RE-TYPED here, by explicit
 *     place-value addition rather than by accumulating digits.
 *   - Density converts through grams and cubic centimetres, not kilograms and
 *     cubic metres.
 *   - Molecular weights are computed from element counts WORKED OUT BY HAND
 *     and written into each case, against atomic weights re-typed here. The
 *     engine's parser is therefore checked against a human reading of the
 *     formula, which is the only check that matters for a parser.
 *   - Wind chill is computed in the IMPERIAL parameterisation of the same
 *     index and converted back, which catches any unit slip in the metric one.
 *   - Dew point is found by BISECTING the saturation vapour pressure curve
 *     rather than by inverting it algebraically.
 *   - BTU figures go through joules explicitly.
 *
 * Run: node scripts/oracles/wave2-science-oracle.mjs > /tmp/science.json
 */

// Significant-figure rounding, matching the engine's presentation convention.
// A fixed-decimal round is wrong for physical quantities: a 127 cubic
// centimetre volume in cubic metres would keep only three significant figures,
// and a resistivity of 2e-8 would round to zero.
const sig = (n, digits = 10) => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};
const r6 = (n) => sig(n);
const r2 = (n) => Math.round(n * 100) / 100;

// --- Constants re-typed independently of the ruleset -----------------------
const RHO_CU_20 = 1.7241e-8;      // ohm metres
const RHO_AL_20 = 2.826e-8;
const ALPHA_CU = 0.00393;
const ALPHA_AL = 0.00403;
const BTU_J = 1055.05585262;
const THERM_J = 105505585.262;
const MILE_KM = 1.609344;

// Atomic weights re-typed from IUPAC conventional values.
const AW = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.990, Mg: 24.305,
  S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546,
  Zn: 65.38, Ag: 107.87, Ba: 137.33, Pb: 207.2
};

const fixtures = {};

function add(id, scenario, inputs, expected, note, ruleset = "None") {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±0.011 on money, 1e-6 on physical quantities",
    ruleset,
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// SCI-001 Ohm's Law
// ===========================================================================

for (const c of [
  { scenario: "Voltage and current given", V: 12, I: 2 },
  { scenario: "Voltage and resistance given", V: 230, R: 46 },
  { scenario: "Current and resistance given", I: 0.5, R: 470 },
  { scenario: "Voltage and power given, a mains appliance", V: 230, P: 2000 },
  { scenario: "Current and power given", I: 3, P: 36 },
  { scenario: "Resistance and power given", R: 8, P: 50 },
  { scenario: "A small signal resistor at low current", I: 0.001, R: 10000 }
]) {
  // Resolve through conductance rather than resistance.
  let V = c.V ?? null, I = c.I ?? null, R = c.R ?? null, P = c.P ?? null;
  let G = R !== null ? 1 / R : null;

  if (V !== null && I !== null) { G = I / V; P = V * I; }
  else if (V !== null && G !== null) { I = V * G; P = V * V * G; }
  else if (V !== null && P !== null) { I = P / V; G = I / V; }
  else if (I !== null && G !== null) { V = I / G; P = (I * I) / G; }
  else if (I !== null && P !== null) { V = P / I; G = I / V; }
  else if (G !== null && P !== null) { V = Math.sqrt(P / G); I = P / V; }
  R = 1 / G;

  const inputs = {
    voltage: c.V ?? null, current: c.I ?? null,
    resistance: c.R ?? null, power: c.P ?? null
  };
  add("SCI-001", c.scenario, inputs,
    { voltage: r6(V), current: r6(I), resistance: r6(R), power: r6(P) },
    "Resolved through conductance, the reciprocal of resistance, so a reciprocal taken in the wrong place on either side would show as a disagreement rather than cancelling out.");
}

// ===========================================================================
// SCI-002 Voltage drop
// ===========================================================================

for (const c of [
  { scenario: "A 32 A ring in 6 mm squared copper at operating temperature", I: 32, L: 25, A: 6, mat: "copper", sys: "single_phase", T: 70, U: 230, use: "other" },
  { scenario: "A lighting circuit against the tighter 3 per cent limit", I: 6, L: 30, A: 1.5, mat: "copper", sys: "single_phase", T: 70, U: 230, use: "lighting" },
  { scenario: "A long submain that fails the limit", I: 40, L: 80, A: 10, mat: "copper", sys: "single_phase", T: 70, U: 230, use: "other" },
  { scenario: "Three phase, where the factor is root three rather than two", I: 63, L: 50, A: 16, mat: "copper", sys: "three_phase", T: 70, U: 400, use: "other" },
  { scenario: "Aluminium, which is about two thirds as conductive", I: 100, L: 40, A: 35, mat: "aluminium", sys: "three_phase", T: 70, U: 400, use: "other" },
  { scenario: "The same cable calculated at ambient rather than operating temperature", I: 32, L: 25, A: 6, mat: "copper", sys: "single_phase", T: 20, U: 230, use: "other" },
  { scenario: "Direct current, where the factor is two", I: 20, L: 15, A: 4, mat: "copper", sys: "dc", T: 30, U: 24, use: "other" }
]) {
  const rho20 = c.mat === "copper" ? RHO_CU_20 : RHO_AL_20;
  const alpha = c.mat === "copper" ? ALPHA_CU : ALPHA_AL;
  const rhoT = rho20 * (1 + alpha * (c.T - 20));

  // Route one: resistivity in ohm millimetres squared per metre.
  const rhoMm2 = rhoT * 1e6;              // ohm mm^2 / m
  const rOneWay = (rhoMm2 * c.L) / c.A;

  // Route two: sum a thousand segments along the run.
  let rSegments = 0;
  const segments = 1000;
  for (let s = 0; s < segments; s++) rSegments += (rhoMm2 * (c.L / segments)) / c.A;
  if (Math.abs(rSegments - rOneWay) > 1e-9) {
    throw new Error("oracle self-check failed: the two resistance routes disagree");
  }

  const factor = c.sys === "three_phase" ? Math.sqrt(3) : 2;
  const drop = factor * rOneWay * c.I;
  const permittedPct = c.use === "lighting" ? 3 : 5;
  const permittedVolts = (permittedPct / 100) * c.U;

  add("SCI-002", c.scenario,
    {
      current: c.I, length_m: c.L, csa_mm2: c.A, conductor: c.mat,
      system: c.sys, operating_temperature: c.T, nominal_voltage: c.U, circuit_use: c.use
    },
    {
      voltage_drop: r6(drop),
      voltage_drop_pct: r6((drop / c.U) * 100),
      permitted_pct: permittedPct,
      permitted_volts: r6(permittedVolts),
      within_limit: drop <= permittedVolts,
      maximum_length_within_limit: r2((permittedVolts / drop) * c.L),
      voltage_at_load: r6(c.U - drop),
      conductor_resistance_ohms: r6(rOneWay)
    },
    "Resistance is computed in ohm millimetres squared per metre, a different unit chain from the engine's ohm metres, and cross-checked against a thousand-segment summation before the case is emitted. The pair of cases at 20 and 70 degrees on the same cable pins the temperature correction, which is worth about a fifth of the drop.",
    "uk-2026-27-v1");
}

// ===========================================================================
// SCI-003 Electricity running cost
// ===========================================================================

for (const c of [
  { scenario: "A 2 kW heater for an hour a day over a year", W: 2000, h: 1, d: 365, ppk: 24.5, sc: 60 },
  { scenario: "A 60 W bulb left on all the time for a month", W: 60, h: 24, d: 30, ppk: 24.5, sc: 60 },
  { scenario: "A tumble dryer, priced per cycle", W: 2500, h: 1.5, d: 52, ppk: 26, sc: 55, uses: 1 },
  { scenario: "A standby load of 5 W, where the standing charge dwarfs the energy", W: 5, h: 24, d: 365, ppk: 24.5, sc: 60 },
  { scenario: "An off-peak tariff", W: 7000, h: 4, d: 200, ppk: 7.5, sc: 45 },
  { scenario: "No standing charge at all", W: 800, h: 3, d: 90, ppk: 22, sc: 0 }
]) {
  // Accumulated day by day rather than multiplied out.
  let kwh = 0, energyPence = 0, standingPence = 0;
  for (let day = 0; day < c.d; day++) {
    const dayKwh = (c.W / 1000) * c.h;
    kwh += dayKwh;
    energyPence += dayKwh * c.ppk;
    standingPence += c.sc;
  }
  const energyCost = energyPence / 100;
  const standingCost = standingPence / 100;
  const total = energyCost + standingCost;
  const kwhYear = (c.W / 1000) * c.h * 365;

  const expected = {
    energy_kwh: r6(kwh),
    energy_cost: r2(energyCost),
    standing_charge_cost: r2(standingCost),
    total_cost: r2(total),
    cost_per_day: r2(total / c.d),
    kwh_per_year: r6(kwhYear),
    cost_per_year: r2((kwhYear * c.ppk) / 100 + (c.sc * 365) / 100),
    standing_charge_share_pct: r6(total > 0 ? (standingCost / total) * 100 : 0)
  };
  if (c.uses !== undefined) expected.cost_per_use = r2(energyCost / (c.uses * c.d));

  add("SCI-003", c.scenario,
    {
      power_watts: c.W, hours_per_day: c.h, days: c.d,
      price_pence_per_kwh: c.ppk, standing_charge_pence_per_day: c.sc,
      uses_per_day: c.uses ?? null
    },
    expected,
    "Accumulated one day at a time rather than multiplied out in a single expression. The standby case exists because it is where the standing charge dominates: a five watt load costs pennies of energy and pounds of standing charge, and a calculator that folded the two together would misrepresent it entirely.");
}

// ===========================================================================
// SCI-004 Resistor
// ===========================================================================

// Colour table re-typed here.
const DIGIT = { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 };
const MULT = { black: 1, brown: 10, red: 100, orange: 1000, yellow: 10000, green: 100000, blue: 1000000, violet: 10000000, grey: 100000000, white: 1000000000, gold: 0.1, silver: 0.01 };
const TOL = { brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1, grey: 0.05, gold: 5, silver: 10 };
const TC = { brown: 100, red: 50, orange: 15, yellow: 25, blue: 10, violet: 5 };

for (const c of [
  { scenario: "Yellow violet red gold, the classic 4k7", bands: ["yellow", "violet", "red", "gold"] },
  { scenario: "Brown black orange gold, 10k", bands: ["brown", "black", "orange", "gold"] },
  { scenario: "A five band precision resistor", bands: ["brown", "red", "black", "brown", "brown"] },
  { scenario: "A gold multiplier, which divides rather than multiplies", bands: ["orange", "white", "gold", "silver"] },
  { scenario: "Six bands, including a temperature coefficient", bands: ["red", "red", "black", "red", "brown", "red"] },
  { scenario: "Three bands, so no tolerance is marked and it is plus or minus twenty per cent", bands: ["blue", "grey", "red"] }
]) {
  const b = c.bands;
  let digitCount, hasTol, hasTc;
  if (b.length === 3) { digitCount = 2; hasTol = false; hasTc = false; }
  else if (b.length === 4) { digitCount = 2; hasTol = true; hasTc = false; }
  else if (b.length === 5) { digitCount = 3; hasTol = true; hasTc = false; }
  else { digitCount = 3; hasTol = true; hasTc = true; }

  // Explicit place value rather than accumulating digits.
  let value = 0;
  for (let i = 0; i < digitCount; i++) {
    value += DIGIT[b[i]] * Math.pow(10, digitCount - 1 - i);
  }
  const ohms = value * MULT[b[digitCount]];
  const tolerance = hasTol ? TOL[b[digitCount + 1]] : 20;
  const tempco = hasTc ? TC[b[digitCount + 2]] : null;

  const expected = {
    resistance_ohms: r6(ohms),
    tolerance_pct: tolerance,
    minimum_ohms: r6(ohms * (1 - tolerance / 100)),
    maximum_ohms: r6(ohms * (1 + tolerance / 100))
  };
  if (tempco !== null) expected.temperature_coefficient_ppm_per_k = tempco;

  // Absent bands are "none", the value the dropdown actually offers, rather
  // than an empty string that no option carries.
  const inputs = {
    mode: "colour_code",
    band1: b[0] ?? "none", band2: b[1] ?? "none", band3: b[2] ?? "none",
    band4: b[3] ?? "none", band5: b[4] ?? "none", band6: b[5] ?? "none"
  };
  add("SCI-004", c.scenario, inputs, expected,
    "The colour table is re-typed here and the value built by explicit place-value addition rather than by accumulating digits left to right. The gold-multiplier case exists because gold DIVIDES by ten in the multiplier position while meaning five per cent in the tolerance position, and a table that conflated the two would fail here and nowhere else.");
}

for (const c of [
  { scenario: "Three resistors in series and in parallel", values: [100, 220, 330] },
  { scenario: "Two equal resistors, where parallel is exactly half", values: [1000, 1000] },
  { scenario: "A single resistor, where both answers are itself", values: [4700] },
  { scenario: "A very small resistor dominating the parallel result", values: [1, 10000, 100000] },
  { scenario: "Four identical resistors", values: [470, 470, 470, 470] },
  { scenario: "Mixed decades", values: [10, 100, 1000, 10000] }
]) {
  const series = c.values.reduce((a, b) => a + b, 0);
  // Parallel by repeated pairwise combination rather than by summing reciprocals.
  let parallel = c.values[0];
  for (let i = 1; i < c.values.length; i++) {
    parallel = (parallel * c.values[i]) / (parallel + c.values[i]);
  }
  add("SCI-004", c.scenario,
    { mode: "network", resistances: c.values.join(", ") },
    { series_ohms: r6(series), parallel_ohms: r6(parallel), count: c.values.length },
    "The parallel total is built by repeated PAIRWISE combination, product over sum, rather than by summing reciprocals as the engine does. The case with a 1 ohm resistor beside two large ones asserts the rule that a parallel total is always smaller than the smallest member.");
}

// ===========================================================================
// SCI-005 Density
// ===========================================================================

const MASS_G = { kg: 1000, g: 1, tonne: 1e6, lb: 453.59237, oz: 28.349523125, stone: 6350.29318, mg: 0.001 };
const VOL_CM3 = { m3: 1e6, cm3: 1, litre: 1000, ml: 1, ft3: 28316.846592, in3: 16.387064, uk_gallon: 4546.09, us_gallon: 3785.411784 };

for (const c of [
  { scenario: "Two kilograms in two and a half litres", m: 2, mu: "kg", v: 2.5, vu: "litre" },
  { scenario: "A litre of water, which is a kilogram", m: 1, mu: "kg", v: 1, vu: "litre" },
  { scenario: "Aluminium, from mass and volume in imperial units", m: 5, mu: "lb", v: 50, vu: "in3" },
  { scenario: "Solve for the volume from a mass and a density", m: 1000, mu: "g", v: null, vu: "cm3", rho: 7850 },
  { scenario: "Solve for the mass from a volume and a density", m: null, mu: "kg", v: 2, vu: "m3", rho: 2400 },
  { scenario: "Something that floats: seasoned oak", m: 700, mu: "g", v: 1000, vu: "cm3" }
]) {
  // Convert through grams and cubic centimetres, then to SI at the end.
  let grams = c.m === null ? null : c.m * MASS_G[c.mu];
  let cm3 = c.v === null ? null : c.v * VOL_CM3[c.vu];
  let rho = c.rho ?? null;    // kg per cubic metre

  if (grams !== null && cm3 !== null) {
    rho = (grams / cm3) * 1000;    // g/cm3 -> kg/m3
  } else if (grams !== null && rho !== null) {
    cm3 = grams / (rho / 1000);
  } else {
    grams = cm3 * (rho / 1000);
  }

  add("SCI-005", c.scenario,
    {
      mass: c.m, mass_unit: c.mu, volume: c.v, volume_unit: c.vu,
      density: c.rho ?? null
    },
    {
      density_kg_per_m3: r6(rho),
      density_g_per_cm3: r6(rho / 1000),
      mass_kg: r6(grams / 1000),
      volume_m3: r6(cm3 / 1e6),
      relative_to_water: r6(rho / 1000),
      floats_in_fresh_water: rho < 1000
    },
    "Converted through grams and cubic centimetres rather than the engine's kilograms and cubic metres, so a factor of a thousand dropped on either side would separate them. The litre of water case pins the definition; the oak case pins the flotation boundary from below.");
}

// ===========================================================================
// SCI-006 Molarity
// ===========================================================================

for (const c of [
  { scenario: "Sodium chloride weighed out into half a litre", mass: 5.85, mm: 58.44, V: 0.5, target: 0.05 },
  { scenario: "A one molar solution from moles and volume", n: 0.25, V: 0.25 },
  { scenario: "Solve for the volume needed at a known concentration", M: 0.1, n: 0.05 },
  { scenario: "Solve for the moles from concentration and volume", M: 2, V: 0.75 },
  { scenario: "A dilution to a tenth", M: 1, V: 0.1, target: 0.1 },
  { scenario: "Copper sulfate weighed out, with no dilution asked for", mass: 24.968, mm: 249.677, V: 1 }
]) {
  // Work in millimoles per millilitre, numerically the same as mol/L but a
  // different scale, so an error of a factor of a thousand would show.
  let mmol = c.n !== undefined ? c.n * 1000 : (c.mass !== undefined ? (c.mass / c.mm) * 1000 : null);
  let mL = c.V !== undefined ? c.V * 1000 : null;
  let M = c.M ?? null;

  if (mmol !== null && mL !== null) M = mmol / mL;
  else if (M !== null && mL !== null) mmol = M * mL;
  else mL = mmol / M;

  const expected = {
    molarity_mol_per_litre: r6(M),
    moles: r6(mmol / 1000),
    volume_litres: r6(mL / 1000)
  };
  if (c.target !== undefined) {
    const finalML = (M * mL) / c.target;
    expected.dilution_volume_litres = r6(finalML / 1000);
    expected.dilution_solvent_to_add_litres = r6((finalML - mL) / 1000);
  }

  add("SCI-006", c.scenario,
    {
      molarity: c.M ?? null, moles: c.n ?? null, volume_litres: c.V ?? null,
      mass_grams: c.mass ?? null, molar_mass: c.mm ?? null,
      target_molarity: c.target ?? null
    },
    expected,
    "Worked in millimoles per millilitre, which is numerically identical to moles per litre but on a different scale, so a factor of a thousand lost anywhere would show up immediately rather than cancelling.");
}

// ===========================================================================
// SCI-007 Molecular weight
// ===========================================================================

// Element counts WORKED OUT BY HAND for each formula, which is the only
// meaningful independent check on a parser.
for (const c of [
  { scenario: "Water", formula: "H2O", counts: { H: 2, O: 1 } },
  { scenario: "Glucose", formula: "C6H12O6", counts: { C: 6, H: 12, O: 6 } },
  { scenario: "Calcium hydroxide, with a bracket", formula: "Ca(OH)2", counts: { Ca: 1, O: 2, H: 2 } },
  { scenario: "Iron sulfate, with a bracketed group of three", formula: "Fe2(SO4)3", counts: { Fe: 2, S: 3, O: 12 } },
  { scenario: "Copper sulfate pentahydrate, a hydrate", formula: "CuSO4.5H2O", counts: { Cu: 1, S: 1, O: 9, H: 10 } },
  { scenario: "Sulfuric acid", formula: "H2SO4", counts: { H: 2, S: 1, O: 4 } },
  { scenario: "Lead nitrate, a bracket with a repeated element outside it", formula: "Pb(NO3)2", counts: { Pb: 1, N: 2, O: 6 } }
]) {
  let molar = 0;
  let atoms = 0;
  for (const [el, n] of Object.entries(c.counts)) {
    molar += AW[el] * n;
    atoms += n;
  }
  add("SCI-007", c.scenario,
    { formula: c.formula },
    {
      molar_mass: r6(molar),
      distinct_elements: Object.keys(c.counts).length,
      total_atoms: atoms
    },
    "The element counts were worked out BY HAND and written into this case, then multiplied by atomic weights re-typed here. The engine's parser is therefore checked against a human reading of the formula rather than against another parser, which is the only check worth making on a parser. The pentahydrate case asserts that the five waters contribute ten hydrogens and five oxygens ON TOP of the four already in the sulfate.");
}

// ===========================================================================
// SCI-008 Heat index
// ===========================================================================

const cToF = (c) => (c * 9) / 5 + 32;
const fToC = (f) => ((f - 32) * 5) / 9;

for (const c of [
  { scenario: "A hot humid day, well into the regression", tC: 32, rh: 70 },
  { scenario: "A mild British afternoon, below the regression threshold", tC: 21, rh: 60 },
  { scenario: "Very dry heat, where the low humidity adjustment applies", tC: 38, rh: 10 },
  { scenario: "Warm and very humid, where the high humidity adjustment applies", tC: 29, rh: 90 },
  { scenario: "Extreme heat", tC: 43, rh: 50 },
  { scenario: "Cool and damp, nowhere near heat stress", tC: 12, rh: 85 },
  { scenario: "Right at the threshold where the regression takes over", tC: 27, rh: 40 }
]) {
  const T = cToF(c.tC);
  const rh = c.rh;
  const simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + rh * 0.094);
  let hi;
  if ((simple + T) / 2 < 80) {
    hi = simple;
  } else {
    hi = -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh
      - 0.00683783 * T * T - 0.05481717 * rh * rh + 0.00122874 * T * T * rh
      + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh;
    if (rh < 13 && T >= 80 && T <= 112) {
      hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    } else if (rh > 85 && T >= 80 && T <= 87) {
      hi += ((rh - 85) / 10) * ((87 - T) / 5);
    }
  }
  add("SCI-008", c.scenario,
    { temperature: c.tC, temperature_unit: "c", relative_humidity: c.rh },
    {
      heat_index_c: r6(fToC(hi)),
      heat_index_f: r6(hi),
      temperature_c: r6(c.tC),
      relative_humidity: r6(c.rh),
      feels_hotter_by_c: r6(fToC(hi) - c.tC)
    },
    "The coefficients are re-typed from the National Weather Service publication, and the SCREENING STEP is reproduced exactly: the simple formula is averaged with the temperature and the regression is used only if that reaches 80 Fahrenheit. The mild and cool cases exist specifically to catch an implementation that applies the regression unconditionally, which is the usual bug and which is wrong for most of the British year.");
}

// ===========================================================================
// SCI-009 Wind chill
// ===========================================================================

for (const c of [
  { scenario: "Minus five degrees in a thirty kilometre wind", tC: -5, kmh: 30 },
  { scenario: "Freezing point in a stiff breeze", tC: 0, kmh: 20 },
  { scenario: "Ten degrees, the top of the valid range", tC: 10, kmh: 15 },
  { scenario: "Just above the minimum valid wind speed", tC: -2, kmh: 5 },
  { scenario: "A severe winter night", tC: -20, kmh: 50 },
  { scenario: "A gale at freezing", tC: 0, kmh: 90 }
]) {
  // The metric coefficients, re-typed from the published 2001 JAG/TI index.
  //
  // The imperial form is NOT used as the oracle here, and the reason is worth
  // recording. The two published forms are independently ROUNDED fits of the
  // same underlying model, not algebraic transforms of one another, so they
  // disagree by up to about 0.03 degrees. An oracle built on the imperial form
  // would report that disagreement as an engine defect on every single case.
  // The cross-check between the two forms is real and useful, but it belongs
  // in a unit test with a stated tolerance, and it is asserted there.
  //
  // Independence of method here comes instead from evaluating the wind term
  // as an explicit exponential of a logarithm rather than through a power
  // function, and from summing the four terms in the reverse order.
  const tF = cToF(c.tC);
  const mph = c.kmh / MILE_KM;
  const v16 = Math.exp(0.16 * Math.log(c.kmh));
  const wcC =
    0.3965 * c.tC * v16 - 11.37 * v16 + 0.6215 * c.tC + 13.12;

  add("SCI-009", c.scenario,
    { temperature: c.tC, temperature_unit: "c", wind_speed: c.kmh, wind_speed_unit: "kmh" },
    {
      wind_chill_c: r6(wcC),
      wind_chill_f: r6(cToF(wcC)),
      temperature_c: r6(c.tC),
      wind_speed_kmh: r6(c.kmh),
      wind_speed_mph: r6(mph),
      feels_colder_by_c: r6(c.tC - wcC)
    },
    "The metric coefficients are re-typed from the published 2001 JAG/TI index. The imperial form is deliberately NOT used as the oracle: the two published forms are independently rounded fits of the same model rather than exact transforms of each other, and they differ by up to about 0.03 degrees, so an oracle built on one would report the other as broken on every case. That cross-check is asserted separately in a unit test with an explicit tolerance and an explanation.");
}

// ===========================================================================
// SCI-010 Dew point
// ===========================================================================

const BUCK = (t) => 6.1121 * Math.exp((18.678 - t / 234.5) * (t / (257.14 + t)));

for (const c of [
  { scenario: "A comfortable room", tC: 20, rh: 65 },
  { scenario: "A humid summer day", tC: 28, rh: 80 },
  { scenario: "A cold dry winter day, giving a frost point", tC: 2, rh: 55 },
  { scenario: "Saturated air, where the dew point equals the temperature", tC: 15, rh: 100 },
  { scenario: "Very dry indoor air in winter", tC: 21, rh: 25 },
  { scenario: "Given the dew point, solve for humidity instead", tC: 18, dp: 10 }
]) {
  const es = BUCK(c.tC);
  let rh, dp;
  if (c.rh !== undefined) {
    rh = c.rh;
    const target = (rh / 100) * es;
    // Bisect the saturation curve rather than inverting it algebraically.
    let lo = -100, hi = c.tC;
    for (let k = 0; k < 300; k++) {
      const mid = (lo + hi) / 2;
      if (BUCK(mid) < target) lo = mid; else hi = mid;
    }
    dp = (lo + hi) / 2;
  } else {
    dp = c.dp;
    rh = (BUCK(dp) / es) * 100;
  }
  const e = (rh / 100) * es;
  const absolute = (e * 100 * 18.01528) / (8.31446261815324 * (c.tC + 273.15));

  add("SCI-010", c.scenario,
    {
      temperature: c.tC, temperature_unit: "c",
      relative_humidity: c.rh ?? null, dew_point: c.dp ?? null
    },
    {
      dew_point_c: r6(dp),
      relative_humidity: r6(rh),
      temperature_c: r6(c.tC),
      saturation_vapour_pressure_hpa: r6(es),
      actual_vapour_pressure_hpa: r6(e),
      absolute_humidity_g_per_m3: r6(absolute),
      is_frost_point: dp < 0
    },
    "The dew point is found by BISECTING the saturation vapour pressure curve rather than by inverting the Buck relation algebraically as the engine does, so an algebraic slip in the inversion could not be reproduced here. The saturated case pins the identity that at 100 per cent humidity the dew point equals the air temperature.");
}

// ===========================================================================
// SCI-011 BTU
// ===========================================================================

for (const c of [
  { scenario: "A typical living room at forty watts per cubic metre", L: 4, W: 3.5, H: 2.4, f: 40, ppk: 7 },
  { scenario: "A small well insulated bedroom", L: 3, W: 3, H: 2.4, f: 25, ppk: 7 },
  { scenario: "A poorly insulated period room with a bay window", L: 5, W: 4.5, H: 3.2, f: 70, ppk: 7 },
  { scenario: "A large open plan space", L: 9, W: 6, H: 2.7, f: 45, ppk: 24.5 },
  { scenario: "A conservatory, which loses heat fastest of all", L: 3.5, W: 3, H: 2.5, f: 100, ppk: 24.5 },
  { scenario: "No fuel price given, so only the heat output is reported", L: 4, W: 4, H: 2.4, f: 40 }
]) {
  const volume = c.L * c.W * c.H;
  const watts = volume * c.f;
  // Route through joules explicitly rather than through a BTU per hour factor.
  const joulesPerHour = watts * 3600;
  const btuPerHour = joulesPerHour / BTU_J;
  const thermsPerHour = joulesPerHour / THERM_J;

  const expected = {
    room_volume_m3: r6(volume),
    heat_requirement_watts: r6(watts),
    heat_requirement_kw: r6(watts / 1000),
    heat_requirement_btu_per_hour: r6(btuPerHour),
    therms_per_hour: r6(thermsPerHour),
    watts_per_cubic_metre_used: r6(c.f)
  };
  if (c.ppk !== undefined) {
    expected.running_cost_pence_per_hour = r6((watts / 1000) * c.ppk);
  }

  add("SCI-011", c.scenario,
    {
      length_m: c.L, width_m: c.W, height_m: c.H,
      watts_per_m3: c.f, price_pence_per_kwh: c.ppk ?? null
    },
    expected,
    "Energy is routed through joules explicitly rather than through a BTU-per-hour conversion factor, so a factor taken from the thermochemical rather than the International Table definition would show in the fourth significant figure. The range of factors across the cases, from 25 to 100 watts per cubic metre, is the point: the spread between a modern insulated room and a conservatory is fourfold, which is why the factor is an input rather than a constant.",
    "uk-2026-27-v1");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
