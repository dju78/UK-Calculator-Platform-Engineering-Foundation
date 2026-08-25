/**
 * Wave 2 Science & Engineering calculators (SCI-001 to SCI-011).
 *
 * Three principles run through this module.
 *
 * SOLVE, DON'T ASSUME. Ohm's law, density and molarity each relate several
 * quantities. Rather than fixing which one is the output, the user supplies
 * whichever they know and the rest follow. Where more are supplied than are
 * needed, the surplus is treated as a CONSISTENCY CHECK and a contradiction is
 * reported rather than quietly ignored.
 *
 * REFUSE OUTSIDE THE DOMAIN. Several published formulas are empirical fits
 * valid only over a stated range. Wind chill is defined only at or below
 * 10 degrees Celsius and above 4.8 km/h; the heat index regression only above
 * about 80 Fahrenheit. Extrapolating them produces confident nonsense, so the
 * engine refuses and says why instead.
 *
 * CONSTANTS COME FROM THE RULESET. Resistivities, atomic weights, energy
 * conversions and the BS 7671 voltage drop limits are all held in the
 * versioned ruleset with provenance, so no two calculators can disagree.
 */
import { assertFiniteNumber } from "../common/validation.js";

export interface EngineeringConstants {
  resistivity_ohm_metre_at_20c: { copper: number; aluminium: number };
  temperature_coefficient_per_c_at_20c: { copper: number; aluminium: number };
  voltage_drop_limits_bs7671: {
    lighting_pct: number;
    other_circuits_pct: number;
    reference: string;
    caveat: string;
  };
  energy_conversions: {
    btu_it_joules: number;
    therm_joules: number;
    calorie_it_joules: number;
    kwh_joules: number;
  };
  standard_atomic_weights: Record<string, number | string>;
}

export function engineeringFrom(rules: any): EngineeringConstants {
  const e = rules?.engineering;
  if (!e || !e.resistivity_ohm_metre_at_20c) {
    throw new Error(
      "The engineering constants are missing from the ruleset for this tax year, so this calculator cannot run."
    );
  }
  return e as EngineeringConstants;
}

/**
 * Round to significant figures rather than to a fixed number of decimals.
 *
 * A fixed-decimal round is wrong for physical quantities, because they span
 * many orders of magnitude. The volume of a 127 cubic centimetre object is
 * 0.000127389 cubic metres, and rounding that to six decimal places leaves
 * three significant figures; a resistivity of 2e-8 rounds to zero outright.
 * Money has a natural smallest unit and a fixed round is right for it, so the
 * two are kept separate and named for what they do.
 */
const sig = (n: number, digits = 10): number => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};
const r6 = (n: number) => sig(n);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A value the user left blank, as distinct from a value of zero. */
function optional(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a valid number, or left blank.`);
  }
  return n;
}

function positive(value: number, label: string): number {
  if (!(value > 0)) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return value;
}

// ===========================================================================
// SCI-001 Ohm's Law
// ===========================================================================

export interface OhmsLawResult {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  supplied: string[];
  derived: string[];
}

/**
 * Ohm's law and the power relations, solved from any two of the four.
 *
 * Supplying three or four is allowed and is treated as a consistency check:
 * a contradiction is REPORTED rather than silently resolved by preferring one
 * pair over another, because a user who mistypes one figure should be told,
 * not handed an answer built from the two the code happened to look at first.
 */
export function ohmsLaw(
  voltage: number | null,
  current: number | null,
  resistance: number | null,
  power: number | null
): OhmsLawResult {
  const given: Record<string, number | null> = { voltage, current, resistance, power };
  const supplied = Object.entries(given).filter(([, v]) => v !== null).map(([k]) => k);

  if (supplied.length < 2) {
    throw new Error(
      "Enter any TWO of voltage, current, resistance and power. Two is enough to work out the other two; one is not enough to work out anything."
    );
  }
  for (const [k, v] of Object.entries(given)) {
    if (v !== null && v < 0) {
      throw new Error(`${k[0].toUpperCase()}${k.slice(1)} cannot be negative in this calculator.`);
    }
  }

  let V = voltage;
  let I = current;
  let R = resistance;
  let P = power;

  // Resolve from the first available pair. Each branch is written out rather
  // than looped, so the relation used is visible at the point of use.
  if (V !== null && I !== null) {
    if (I === 0) throw new Error("A current of zero has no resistance to report. Enter a current above zero.");
    R = R ?? V / I; P = P ?? V * I;
  } else if (V !== null && R !== null) {
    if (R === 0) throw new Error("A resistance of zero implies an infinite current. Enter a resistance above zero.");
    I = I ?? V / R; P = P ?? (V * V) / R;
  } else if (V !== null && P !== null) {
    if (V === 0) throw new Error("A voltage of zero delivers no power. Enter a voltage above zero.");
    I = I ?? P / V; R = R ?? (V * V) / P;
  } else if (I !== null && R !== null) {
    V = V ?? I * R; P = P ?? I * I * R;
  } else if (I !== null && P !== null) {
    if (I === 0) throw new Error("A current of zero delivers no power. Enter a current above zero.");
    V = V ?? P / I; R = R ?? P / (I * I);
  } else if (R !== null && P !== null) {
    if (R === 0) throw new Error("A resistance of zero implies an infinite current. Enter a resistance above zero.");
    V = V ?? Math.sqrt(P * R); I = I ?? Math.sqrt(P / R);
  }

  if (V === null || I === null || R === null || P === null) {
    throw new Error("Those two values are not enough to determine the others. Try a different pair.");
  }

  // Consistency check on anything supplied beyond the two that were needed.
  const tolerance = 1e-6;
  const rel = (a: number, b: number) => (Math.abs(b) < 1 ? Math.abs(a - b) : Math.abs(a - b) / Math.abs(b));
  if (rel(V, I * R) > tolerance) {
    throw new Error(
      `Those figures contradict each other: ${I} A through ${R} ohms gives ${r6(I * R)} V, not ${V} V. Check the values, or leave one blank so it can be worked out.`
    );
  }
  if (rel(P, V * I) > tolerance) {
    throw new Error(
      `Those figures contradict each other: ${V} V at ${I} A is ${r6(V * I)} W, not ${P} W. Check the values, or leave one blank so it can be worked out.`
    );
  }

  return {
    voltage: r6(V),
    current: r6(I),
    resistance: r6(R),
    power: r6(P),
    supplied,
    derived: ["voltage", "current", "resistance", "power"].filter(k => !supplied.includes(k))
  };
}

// ===========================================================================
// SCI-002 Voltage drop
// ===========================================================================

export type Conductor = "copper" | "aluminium";
export type SupplySystem = "dc" | "single_phase" | "three_phase";
export type CircuitUse = "lighting" | "other";

export interface VoltageDropResult {
  resistivity_at_operating_temperature: number;
  conductor_resistance_ohms: number;
  voltage_drop: number;
  voltage_drop_pct: number;
  permitted_pct: number;
  permitted_volts: number;
  within_limit: boolean;
  maximum_length_within_limit: number;
  voltage_at_load: number;
  power_lost_watts: number;
  system_factor: number;
  reactance_note_applies: boolean;
}

/**
 * Resistive voltage drop along a run of cable.
 *
 * The factor is 2 for direct current and for single-phase alternating current,
 * because the current travels out along one conductor and back along another.
 * For a balanced three-phase circuit the line-to-line drop uses the square root
 * of three. Using 2 for a three-phase circuit overstates the drop by about
 * fifteen per cent, which is the commonest error in a voltage drop calculation.
 */
export function voltageDrop(
  current: number,
  lengthMetres: number,
  csaMm2: number,
  conductor: Conductor,
  system: SupplySystem,
  operatingTempC: number,
  nominalVoltage: number,
  use: CircuitUse,
  eng: EngineeringConstants
): VoltageDropResult {
  const I = positive(assertFiniteNumber(current, "Design current"), "Design current");
  const L = positive(assertFiniteNumber(lengthMetres, "Cable length"), "Cable length");
  const A = positive(assertFiniteNumber(csaMm2, "Conductor cross-sectional area"), "Conductor cross-sectional area");
  const T = assertFiniteNumber(operatingTempC, "Operating temperature");
  const U = positive(assertFiniteNumber(nominalVoltage, "Nominal voltage"), "Nominal voltage");

  if (I > 5000) throw new Error("A design current above 5,000 A is beyond what this calculator models.");
  if (L > 10000) throw new Error("A cable run longer than 10 km is beyond what this calculator models.");
  if (A > 1000) throw new Error("A conductor larger than 1,000 square millimetres is beyond what this calculator models.");
  if (T < -50 || T > 250) {
    throw new Error("The operating temperature must be between -50 and 250 degrees Celsius.");
  }

  const rho20 = eng.resistivity_ohm_metre_at_20c[conductor];
  const alpha = eng.temperature_coefficient_per_c_at_20c[conductor];
  // Resistivity rises with temperature, and a cable at its 70 degree operating
  // temperature is about twenty per cent more resistive than at 20 degrees.
  // Calculating at 20 degrees flatters every design.
  const rhoT = rho20 * (1 + alpha * (T - 20));

  const factor = system === "three_phase" ? Math.sqrt(3) : 2;
  const areaM2 = A * 1e-6;
  const resistanceOneWay = (rhoT * L) / areaM2;
  const drop = factor * resistanceOneWay * I;
  const dropPct = (drop / U) * 100;

  const permittedPct = use === "lighting"
    ? eng.voltage_drop_limits_bs7671.lighting_pct
    : eng.voltage_drop_limits_bs7671.other_circuits_pct;
  const permittedVolts = (permittedPct / 100) * U;
  const maxLength = drop > 0 ? (permittedVolts / drop) * L : L;

  // Above about 25 square millimetres the inductive reactance of the cable
  // becomes a material part of the drop, and the tabulated BS 7671 millivolt
  // per amp per metre figures should be used instead of this resistive
  // calculation. Saying so is more useful than silently being optimistic.
  const reactanceMatters = A > 25;

  return {
    resistivity_at_operating_temperature: rhoT,
    conductor_resistance_ohms: r6(resistanceOneWay),
    voltage_drop: r6(drop),
    voltage_drop_pct: r6(dropPct),
    permitted_pct: permittedPct,
    permitted_volts: r6(permittedVolts),
    within_limit: drop <= permittedVolts,
    maximum_length_within_limit: r2(maxLength),
    voltage_at_load: r6(U - drop),
    power_lost_watts: r6(factor === 2 ? I * I * resistanceOneWay * 2 : 3 * I * I * resistanceOneWay),
    system_factor: r6(factor),
    reactance_note_applies: reactanceMatters
  };
}

// ===========================================================================
// SCI-003 Electricity running cost
// ===========================================================================

export interface ElectricityCostResult {
  energy_kwh: number;
  energy_cost: number;
  standing_charge_cost: number;
  total_cost: number;
  cost_per_day: number;
  cost_per_use: number | null;
  kwh_per_year: number;
  cost_per_year: number;
  standing_charge_share_pct: number;
}

export function electricityCost(
  powerWatts: number,
  hoursPerDay: number,
  days: number,
  pencePerKwh: number,
  standingChargePencePerDay: number,
  usesPerDay: number | null
): ElectricityCostResult {
  const W = assertFiniteNumber(powerWatts, "Appliance power");
  const h = assertFiniteNumber(hoursPerDay, "Hours a day");
  const d = assertFiniteNumber(days, "Number of days");
  const ppk = assertFiniteNumber(pencePerKwh, "Unit rate");
  const sc = assertFiniteNumber(standingChargePencePerDay, "Standing charge");

  if (W < 0) throw new Error("Appliance power cannot be negative.");
  if (W > 100000) throw new Error("An appliance drawing more than 100 kW is beyond a domestic supply. Check the figure.");
  if (h < 0 || h > 24) throw new Error("Hours a day must be between 0 and 24.");
  if (d <= 0) throw new Error("The number of days must be greater than zero.");
  if (d > 36500) throw new Error("A period longer than a hundred years is beyond what this calculator models.");
  if (ppk < 0 || sc < 0) throw new Error("Prices cannot be negative.");

  const kwh = (W / 1000) * h * d;
  const energyCost = (kwh * ppk) / 100;
  const standingCost = (sc * d) / 100;
  const total = energyCost + standingCost;

  let perUse: number | null = null;
  if (usesPerDay !== null && usesPerDay !== undefined) {
    const u = assertFiniteNumber(usesPerDay, "Uses a day");
    if (u <= 0) throw new Error("Uses a day must be greater than zero, or left blank.");
    perUse = energyCost / (u * d);
  }

  const kwhPerYear = (W / 1000) * h * 365;

  return {
    energy_kwh: r6(kwh),
    energy_cost: r2(energyCost),
    standing_charge_cost: r2(standingCost),
    total_cost: r2(total),
    cost_per_day: r2(total / d),
    cost_per_use: perUse === null ? null : r2(perUse),
    kwh_per_year: r6(kwhPerYear),
    cost_per_year: r2((kwhPerYear * ppk) / 100 + (sc * 365) / 100),
    standing_charge_share_pct: total > 0 ? r6((standingCost / total) * 100) : 0
  };
}

// ===========================================================================
// SCI-004 Resistor
// ===========================================================================

const BAND_DIGITS: Record<string, number> = {
  black: 0, brown: 1, red: 2, orange: 3, yellow: 4,
  green: 5, blue: 6, violet: 7, grey: 8, white: 9
};

const BAND_MULTIPLIERS: Record<string, number> = {
  black: 1, brown: 10, red: 100, orange: 1e3, yellow: 1e4,
  green: 1e5, blue: 1e6, violet: 1e7, grey: 1e8, white: 1e9,
  gold: 0.1, silver: 0.01
};

const BAND_TOLERANCES: Record<string, number> = {
  brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1,
  grey: 0.05, gold: 5, silver: 10
};

const BAND_TEMPCO: Record<string, number> = {
  brown: 100, red: 50, orange: 15, yellow: 25, blue: 10, violet: 5
};

export interface ResistorColourResult {
  resistance_ohms: number;
  tolerance_pct: number;
  minimum_ohms: number;
  maximum_ohms: number;
  temperature_coefficient_ppm_per_k: number | null;
  bands_read: string[];
  formatted: string;
}

/** Present a resistance the way a datasheet would: 4k7 rather than 4700. */
function formatResistance(ohms: number): string {
  const units: Array<[number, string]> = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""]];
  for (const [scale, suffix] of units) {
    if (Math.abs(ohms) >= scale) {
      const v = ohms / scale;
      const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
      return `${s} ${suffix}Ω`.replace("  ", " ");
    }
  }
  return `${Math.round(ohms * 1000) / 1000} Ω`;
}

export function resistorColourCode(bands: string[]): ResistorColourResult {
  const cleaned = bands.map(b => String(b ?? "").trim().toLowerCase()).filter(b => b.length > 0);
  if (cleaned.length < 3 || cleaned.length > 6) {
    throw new Error("A resistor has between three and six colour bands. Enter the bands in order, left to right.");
  }

  // The digit bands are all but the last two on a 4-band resistor (digits,
  // multiplier, tolerance) and all but the last two or three on longer ones.
  let digitCount: number;
  let hasTolerance: boolean;
  let hasTempco: boolean;
  if (cleaned.length === 3) { digitCount = 2; hasTolerance = false; hasTempco = false; }
  else if (cleaned.length === 4) { digitCount = 2; hasTolerance = true; hasTempco = false; }
  else if (cleaned.length === 5) { digitCount = 3; hasTolerance = true; hasTempco = false; }
  else { digitCount = 3; hasTolerance = true; hasTempco = true; }

  let digits = 0;
  for (let i = 0; i < digitCount; i++) {
    const colour = cleaned[i];
    const d = BAND_DIGITS[colour];
    if (d === undefined) {
      throw new Error(`"${colour}" is not a digit colour. Digit bands are black, brown, red, orange, yellow, green, blue, violet, grey or white.`);
    }
    digits = digits * 10 + d;
  }

  const multColour = cleaned[digitCount];
  const multiplier = BAND_MULTIPLIERS[multColour];
  if (multiplier === undefined) {
    throw new Error(`"${multColour}" is not a multiplier colour. The multiplier band also allows gold and silver, for divide by ten and by a hundred.`);
  }

  let tolerance = 20; // no tolerance band means plus or minus twenty per cent
  if (hasTolerance) {
    const tolColour = cleaned[digitCount + 1];
    const t = BAND_TOLERANCES[tolColour];
    if (t === undefined) {
      throw new Error(`"${tolColour}" is not a tolerance colour. Tolerance bands are brown, red, green, blue, violet, grey, gold or silver.`);
    }
    tolerance = t;
  }

  let tempco: number | null = null;
  if (hasTempco) {
    const tcColour = cleaned[digitCount + 2];
    const tc = BAND_TEMPCO[tcColour];
    if (tc === undefined) {
      throw new Error(`"${tcColour}" is not a temperature coefficient colour. That band is brown, red, orange, yellow, blue or violet.`);
    }
    tempco = tc;
  }

  const ohms = digits * multiplier;
  return {
    resistance_ohms: r6(ohms),
    tolerance_pct: tolerance,
    minimum_ohms: r6(ohms * (1 - tolerance / 100)),
    maximum_ohms: r6(ohms * (1 + tolerance / 100)),
    temperature_coefficient_ppm_per_k: tempco,
    bands_read: cleaned,
    formatted: formatResistance(ohms)
  };
}

export interface ResistorNetworkResult {
  series_ohms: number;
  parallel_ohms: number;
  count: number;
  series_formatted: string;
  parallel_formatted: string;
  smallest_ohms: number;
}

export function resistorNetwork(values: number[]): ResistorNetworkResult {
  if (values.length === 0) {
    throw new Error("Enter at least one resistance, separated by commas.");
  }
  for (const v of values) {
    if (!Number.isFinite(v) || v <= 0) {
      throw new Error("Every resistance must be a number greater than zero.");
    }
  }
  const series = values.reduce((a, b) => a + b, 0);
  const parallel = 1 / values.reduce((a, b) => a + 1 / b, 0);
  return {
    series_ohms: r6(series),
    parallel_ohms: r6(parallel),
    count: values.length,
    series_formatted: formatResistance(series),
    parallel_formatted: formatResistance(parallel),
    smallest_ohms: r6(Math.min(...values))
  };
}

// ===========================================================================
// SCI-005 Density
// ===========================================================================

const MASS_TO_KG: Record<string, number> = {
  kg: 1, g: 0.001, mg: 1e-6, tonne: 1000, lb: 0.45359237, oz: 0.028349523125,
  stone: 6.35029318
};

const VOLUME_TO_M3: Record<string, number> = {
  m3: 1, cm3: 1e-6, litre: 0.001, ml: 1e-6, ft3: 0.028316846592,
  in3: 0.000016387064, uk_gallon: 0.00454609, us_gallon: 0.003785411784
};

export interface DensityResult {
  density_kg_per_m3: number;
  density_g_per_cm3: number;
  density_lb_per_ft3: number;
  mass_kg: number;
  volume_m3: number;
  relative_to_water: number;
  floats_in_fresh_water: boolean;
  solved_for: string;
}

export function density(
  mass: number | null,
  massUnit: string,
  volume: number | null,
  volumeUnit: string,
  densityKgM3: number | null
): DensityResult {
  const mFactor = MASS_TO_KG[massUnit];
  const vFactor = VOLUME_TO_M3[volumeUnit];
  if (mFactor === undefined) throw new Error(`"${massUnit}" is not a mass unit this calculator knows.`);
  if (vFactor === undefined) throw new Error(`"${volumeUnit}" is not a volume unit this calculator knows.`);

  const known = [mass, volume, densityKgM3].filter(v => v !== null).length;
  if (known < 2) {
    throw new Error(
      "Enter any TWO of mass, volume and density, and the third is worked out. One on its own determines nothing."
    );
  }

  let mKg = mass === null ? null : mass * mFactor;
  let vM3 = volume === null ? null : volume * vFactor;
  let rho = densityKgM3;
  let solvedFor: string;

  if (mKg !== null && vM3 !== null) {
    if (vM3 <= 0) throw new Error("The volume must be greater than zero; dividing by it is the whole calculation.");
    const computed = mKg / vM3;
    if (rho !== null && Math.abs(computed - rho) / Math.max(1, Math.abs(rho)) > 1e-6) {
      throw new Error(
        `Those figures contradict each other: that mass in that volume is ${r6(computed)} kg per cubic metre, not ${rho}. Leave one blank so it can be worked out.`
      );
    }
    rho = computed;
    solvedFor = "density";
  } else if (mKg !== null && rho !== null) {
    if (rho <= 0) throw new Error("The density must be greater than zero.");
    vM3 = mKg / rho;
    solvedFor = "volume";
  } else {
    if (rho === null || vM3 === null) throw new Error("Enter any two of mass, volume and density.");
    if (vM3 <= 0) throw new Error("The volume must be greater than zero.");
    mKg = rho * vM3;
    solvedFor = "mass";
  }

  if (mKg === null || vM3 === null || rho === null) {
    throw new Error("Enter any two of mass, volume and density.");
  }
  if (mKg < 0) throw new Error("Mass cannot be negative.");

  const WATER = 1000; // kg per cubic metre, fresh water at about 4 degrees
  return {
    density_kg_per_m3: r6(rho),
    density_g_per_cm3: r6(rho / 1000),
    density_lb_per_ft3: r6(rho * 0.028316846592 / 0.45359237),
    mass_kg: r6(mKg),
    volume_m3: r6(vM3),
    relative_to_water: r6(rho / WATER),
    floats_in_fresh_water: rho < WATER,
    solved_for: solvedFor
  };
}

// ===========================================================================
// SCI-007 Molecular weight
// ===========================================================================

export interface ElementBreakdown {
  element: string;
  atoms: number;
  atomic_weight: number;
  mass_contribution: number;
  mass_percent: number;
}

export interface MolecularWeightResult {
  formula: string;
  molar_mass: number;
  elements: ElementBreakdown[];
  distinct_elements: number;
  total_atoms: number;
}

/**
 * Parse a chemical formula, including nested brackets and hydrates.
 *
 * Handles Ca(OH)2, Fe2(SO4)3 and CuSO4.5H2O. An element symbol that is not in
 * the ruleset is REFUSED BY NAME rather than treated as weightless, because a
 * silently skipped element understates the molar mass and the result would
 * still look like a number.
 */
export function molecularWeight(
  formula: string,
  weights: Record<string, number | string>
): MolecularWeightResult {
  const raw = String(formula ?? "").trim();
  if (raw.length === 0) {
    throw new Error("Enter a chemical formula, for example H2O, Ca(OH)2 or CuSO4.5H2O.");
  }
  if (raw.length > 200) {
    throw new Error("That formula is longer than this calculator will parse.");
  }
  if (!/^[A-Za-z0-9()\[\]·.* ]+$/.test(raw)) {
    throw new Error(
      "A formula may contain element symbols, digits, brackets and a dot or middle dot for a hydrate. Remove any other characters."
    );
  }

  // A hydrate dot means "plus this many of the following unit", which is the
  // same as multiplying the remainder through.
  const parts = raw.split(/[·.*]/).map(p => p.trim()).filter(p => p.length > 0);

  const counts: Record<string, number> = {};

  const addPart = (text: string, outerMultiplier: number) => {
    // A leading number on a hydrate part multiplies the whole part.
    const lead = text.match(/^(\d+)/);
    let body = text;
    let multiplier = outerMultiplier;
    if (lead) {
      multiplier *= Number(lead[1]);
      body = text.slice(lead[1].length);
    }

    const stack: Array<Record<string, number>> = [{}];
    let i = 0;
    while (i < body.length) {
      const ch = body[i];
      if (ch === " ") { i++; continue; }
      if (ch === "(" || ch === "[") {
        stack.push({});
        i++;
        continue;
      }
      if (ch === ")" || ch === "]") {
        if (stack.length === 1) {
          throw new Error("The brackets in that formula do not balance. Check for a missing opening bracket.");
        }
        const group = stack.pop() as Record<string, number>;
        i++;
        const num = body.slice(i).match(/^\d+/);
        const n = num ? Number(num[0]) : 1;
        if (num) i += num[0].length;
        const target = stack[stack.length - 1];
        for (const [el, c] of Object.entries(group)) {
          target[el] = (target[el] ?? 0) + c * n;
        }
        continue;
      }
      const symbol = body.slice(i).match(/^[A-Z][a-z]?/);
      if (!symbol) {
        throw new Error(
          `Could not read "${body.slice(i, i + 8)}" in that formula. Element symbols start with a capital letter, as in Na or Cl.`
        );
      }
      i += symbol[0].length;
      const num = body.slice(i).match(/^\d+/);
      const n = num ? Number(num[0]) : 1;
      if (num) i += num[0].length;
      const target = stack[stack.length - 1];
      target[symbol[0]] = (target[symbol[0]] ?? 0) + n;
    }
    if (stack.length !== 1) {
      throw new Error("The brackets in that formula do not balance. Check for a missing closing bracket.");
    }
    for (const [el, c] of Object.entries(stack[0])) {
      counts[el] = (counts[el] ?? 0) + c * multiplier;
    }
  };

  for (const part of parts) addPart(part, 1);

  if (Object.keys(counts).length === 0) {
    throw new Error("No elements were found in that formula.");
  }

  let molarMass = 0;
  const rows: Array<{ element: string; atoms: number; weight: number; contribution: number }> = [];
  for (const [el, atoms] of Object.entries(counts)) {
    const w = weights[el];
    if (typeof w !== "number") {
      throw new Error(
        `"${el}" is not an element this calculator holds a standard atomic weight for. It is refused rather than assumed, because skipping it would silently understate the molar mass.`
      );
    }
    const contribution = w * atoms;
    molarMass += contribution;
    rows.push({ element: el, atoms, weight: w, contribution });
  }

  rows.sort((a, b) => b.contribution - a.contribution);

  return {
    formula: raw,
    molar_mass: r6(molarMass),
    elements: rows.map(r => ({
      element: r.element,
      atoms: r.atoms,
      atomic_weight: r.weight,
      mass_contribution: r6(r.contribution),
      mass_percent: r6((r.contribution / molarMass) * 100)
    })),
    distinct_elements: rows.length,
    total_atoms: rows.reduce((a, b) => a + b.atoms, 0)
  };
}

// ===========================================================================
// SCI-006 Molarity
// ===========================================================================

export interface MolarityResult {
  molarity_mol_per_litre: number;
  moles: number;
  volume_litres: number;
  mass_grams: number | null;
  molar_mass: number | null;
  solved_for: string;
  dilution_volume_litres: number | null;
  dilution_solvent_to_add_litres: number | null;
}

export function molarity(
  molarityGiven: number | null,
  molesGiven: number | null,
  volumeLitres: number | null,
  massGrams: number | null,
  molarMass: number | null,
  targetMolarity: number | null
): MolarityResult {
  let M = molarityGiven;
  let n = molesGiven;
  let V = volumeLitres;

  // Moles can also come from a mass and a molar mass, which is how a bench
  // chemist actually works: they weigh a solid, they do not count moles.
  if (n === null && massGrams !== null && molarMass !== null) {
    if (molarMass <= 0) throw new Error("The molar mass must be greater than zero.");
    if (massGrams < 0) throw new Error("The mass cannot be negative.");
    n = massGrams / molarMass;
  }

  const known = [M, n, V].filter(v => v !== null).length;
  if (known < 2) {
    throw new Error(
      "Enter any TWO of concentration, moles and volume, or a mass with a molar mass in place of the moles."
    );
  }

  let solvedFor: string;
  if (n !== null && V !== null) {
    if (V <= 0) throw new Error("The volume must be greater than zero.");
    const computed = n / V;
    if (M !== null && Math.abs(computed - M) / Math.max(1e-9, Math.abs(M)) > 1e-6) {
      throw new Error(
        `Those figures contradict each other: ${r6(n)} moles in ${V} litres is ${r6(computed)} molar, not ${M}. Leave one blank so it can be worked out.`
      );
    }
    M = computed;
    solvedFor = "concentration";
  } else if (M !== null && V !== null) {
    if (M < 0 || V <= 0) throw new Error("The concentration cannot be negative and the volume must be above zero.");
    n = M * V;
    solvedFor = "moles";
  } else {
    if (M === null || n === null) throw new Error("Enter any two of concentration, moles and volume.");
    if (M <= 0) throw new Error("A concentration of zero has no finite volume. Enter a concentration above zero.");
    V = n / M;
    solvedFor = "volume";
  }

  if (M === null || n === null || V === null) {
    throw new Error("Enter any two of concentration, moles and volume.");
  }

  let dilutionVolume: number | null = null;
  let solventToAdd: number | null = null;
  if (targetMolarity !== null && targetMolarity !== undefined) {
    if (targetMolarity <= 0) throw new Error("The target concentration must be greater than zero.");
    if (targetMolarity > M) {
      throw new Error(
        "The target concentration is higher than the stock. Diluting cannot concentrate a solution; you would need to start from a stronger stock or evaporate solvent."
      );
    }
    // C1 V1 = C2 V2.
    dilutionVolume = (M * V) / targetMolarity;
    solventToAdd = dilutionVolume - V;
  }

  return {
    molarity_mol_per_litre: r6(M),
    moles: r6(n),
    volume_litres: r6(V),
    mass_grams: massGrams === null && molarMass === null ? null : r6(molarMass !== null ? n * molarMass : (massGrams as number)),
    molar_mass: molarMass,
    solved_for: solvedFor,
    dilution_volume_litres: dilutionVolume === null ? null : r6(dilutionVolume),
    dilution_solvent_to_add_litres: solventToAdd === null ? null : r6(solventToAdd)
  };
}

// ===========================================================================
// SCI-008 Heat index
// ===========================================================================

export interface HeatIndexResult {
  heat_index_c: number;
  heat_index_f: number;
  temperature_c: number;
  temperature_f: number;
  relative_humidity: number;
  category: string;
  regression_applied: boolean;
  adjustment_applied: string | null;
  feels_hotter_by_c: number;
}

const cToF = (c: number) => (c * 9) / 5 + 32;
const fToC = (f: number) => ((f - 32) * 5) / 9;

/**
 * The US National Weather Service heat index, implemented exactly as the NWS
 * publishes it, including the order of operations that most reimplementations
 * get wrong.
 *
 * The simple formula is applied FIRST and averaged with the temperature; only
 * if that average is 80 F or above is the Rothfusz regression used at all.
 * Applying the regression unconditionally gives badly wrong answers in mild
 * conditions, which is exactly the British case.
 */
export function heatIndex(temperatureC: number, relativeHumidity: number): HeatIndexResult {
  const tC = assertFiniteNumber(temperatureC, "Temperature");
  const rh = assertFiniteNumber(relativeHumidity, "Relative humidity");
  if (rh < 0 || rh > 100) {
    throw new Error("Relative humidity must be between 0 and 100 per cent.");
  }
  if (tC < -60 || tC > 60) {
    throw new Error("The temperature must be between -60 and 60 degrees Celsius.");
  }

  const T = cToF(tC);
  const simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + rh * 0.094);

  let hi: number;
  let regression = false;
  let adjustment: string | null = null;

  if ((simple + T) / 2 < 80) {
    hi = simple;
  } else {
    regression = true;
    hi =
      -42.379 +
      2.04901523 * T +
      10.14333127 * rh -
      0.22475541 * T * rh -
      0.00683783 * T * T -
      0.05481717 * rh * rh +
      0.00122874 * T * T * rh +
      0.00085282 * T * rh * rh -
      0.00000199 * T * T * rh * rh;

    if (rh < 13 && T >= 80 && T <= 112) {
      hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
      adjustment = "low humidity";
    } else if (rh > 85 && T >= 80 && T <= 87) {
      hi += ((rh - 85) / 10) * ((87 - T) / 5);
      adjustment = "high humidity";
    }
  }

  const hiC = fToC(hi);
  let category: string;
  if (hi < 80) category = "No heat stress indicated";
  else if (hi < 90) category = "Caution: fatigue possible with prolonged exposure or activity";
  else if (hi < 103) category = "Extreme caution: heat cramps and heat exhaustion possible";
  else if (hi < 125) category = "Danger: heat cramps and heat exhaustion likely, heat stroke possible";
  else category = "Extreme danger: heat stroke highly likely";

  return {
    heat_index_c: r6(hiC),
    heat_index_f: r6(hi),
    temperature_c: r6(tC),
    temperature_f: r6(T),
    relative_humidity: r6(rh),
    category,
    regression_applied: regression,
    adjustment_applied: adjustment,
    feels_hotter_by_c: r6(hiC - tC)
  };
}

// ===========================================================================
// SCI-009 Wind chill
// ===========================================================================

export interface WindChillResult {
  wind_chill_c: number;
  wind_chill_f: number;
  temperature_c: number;
  wind_speed_kmh: number;
  wind_speed_mph: number;
  feels_colder_by_c: number;
  frostbite_risk: string;
}

/**
 * The 2001 JAG/TI wind chill index, used by the Met Office and by the North
 * American weather services.
 *
 * The formula is an empirical fit valid ONLY at or below 10 degrees Celsius and
 * above 4.8 km/h of wind. Outside that range it is refused rather than
 * extrapolated: at 20 degrees in a light breeze it would return a "wind chill"
 * warmer than the air, which is meaningless.
 */
export function windChill(temperatureC: number, windSpeedKmh: number): WindChillResult {
  const T = assertFiniteNumber(temperatureC, "Temperature");
  const V = assertFiniteNumber(windSpeedKmh, "Wind speed");

  if (V < 0) throw new Error("The wind speed cannot be negative.");
  if (T > 10) {
    throw new Error(
      "Wind chill is only defined at or below 10 degrees Celsius. Above that the wind cools you by evaporation rather than by conduction, and this index does not describe it."
    );
  }
  if (V <= 4.8) {
    throw new Error(
      "Wind chill is only defined above 4.8 km/h, which is about 3 mph. In still air the index reads warmer than the actual temperature, which is why it is refused rather than extrapolated."
    );
  }
  if (T < -60) throw new Error("The temperature must be at or above -60 degrees Celsius.");
  if (V > 200) throw new Error("A wind speed above 200 km/h is beyond the range this index was fitted over.");

  const v16 = Math.pow(V, 0.16);
  const wc = 13.12 + 0.6215 * T - 11.37 * v16 + 0.3965 * T * v16;

  let risk: string;
  if (wc > -10) risk = "Low: frostbite unlikely on exposed skin";
  else if (wc > -28) risk = "Increasing: uncomfortable, but frostbite is unlikely in under half an hour";
  else if (wc > -40) risk = "High: exposed skin can freeze in 10 to 30 minutes";
  else if (wc > -48) risk = "Very high: exposed skin can freeze in 5 to 10 minutes";
  else risk = "Extreme: exposed skin can freeze in under 5 minutes";

  return {
    wind_chill_c: r6(wc),
    wind_chill_f: r6(cToF(wc)),
    temperature_c: r6(T),
    wind_speed_kmh: r6(V),
    wind_speed_mph: r6(V / 1.609344),
    feels_colder_by_c: r6(T - wc),
    frostbite_risk: risk
  };
}

// ===========================================================================
// SCI-010 Dew point
// ===========================================================================

export interface DewPointResult {
  dew_point_c: number;
  dew_point_f: number;
  relative_humidity: number;
  temperature_c: number;
  saturation_vapour_pressure_hpa: number;
  actual_vapour_pressure_hpa: number;
  absolute_humidity_g_per_m3: number;
  is_frost_point: boolean;
  comfort: string;
  solved_for: string;
}

// Arden Buck coefficients for water, which fit better than the older
// Magnus-Tetens pair over the range a weather calculator meets.
const BUCK_A = 6.1121;
const BUCK_B = 18.678;
const BUCK_C = 257.14;
const BUCK_D = 234.5;

function saturationVapourPressure(tC: number): number {
  return BUCK_A * Math.exp((BUCK_B - tC / BUCK_D) * (tC / (BUCK_C + tC)));
}

export function dewPoint(
  temperatureC: number,
  relativeHumidity: number | null,
  dewPointC: number | null
): DewPointResult {
  const T = assertFiniteNumber(temperatureC, "Temperature");
  if (T < -80 || T > 80) {
    throw new Error("The temperature must be between -80 and 80 degrees Celsius.");
  }

  const es = saturationVapourPressure(T);
  let rh: number;
  let dp: number;
  let solvedFor: string;

  if (relativeHumidity !== null && relativeHumidity !== undefined) {
    rh = assertFiniteNumber(relativeHumidity, "Relative humidity");
    if (rh <= 0 || rh > 100) {
      throw new Error("Relative humidity must be above 0 and no more than 100 per cent. At exactly zero there is no dew point.");
    }
    // Invert the Buck relation EXACTLY.
    //
    // The familiar one-line inversion, dew point = C*gamma/(B - gamma), belongs
    // to the simpler Magnus form and silently DROPS Buck's enhancement term in
    // -T/D. Using it against a Buck forward function is inconsistent, and the
    // error grows with temperature: at 28 degrees and 80 per cent humidity it
    // is about 0.15 degrees, and at saturation it fails the one identity that
    // must hold exactly, that the dew point equals the air temperature.
    //
    // Setting gamma = (B - Td/D)(Td/(C + Td)) and clearing denominators gives
    // a quadratic in the dew point:
    //
    //     Td^2 - D(B - gamma)Td + gamma*D*C = 0
    //
    // whose SMALLER root is the physical one; the larger is an artefact of
    // squaring and lies far above any real temperature.
    const gamma = Math.log(rh / 100) + (BUCK_B - T / BUCK_D) * (T / (BUCK_C + T));
    const b = BUCK_D * (BUCK_B - gamma);
    const c = gamma * BUCK_D * BUCK_C;
    const discriminant = b * b - 4 * c;
    if (discriminant < 0) {
      throw new Error(
        "No dew point exists for that combination of temperature and humidity. Check the figures."
      );
    }
    dp = (b - Math.sqrt(discriminant)) / 2;
    solvedFor = "dew point";
  } else if (dewPointC !== null && dewPointC !== undefined) {
    dp = assertFiniteNumber(dewPointC, "Dew point");
    if (dp > T) {
      throw new Error(
        "The dew point cannot be higher than the air temperature. At equal values the air is saturated, which is 100 per cent humidity."
      );
    }
    if (dp < -80) throw new Error("The dew point must be at or above -80 degrees Celsius.");
    rh = (saturationVapourPressure(dp) / es) * 100;
    solvedFor = "relative humidity";
  } else {
    throw new Error("Enter either the relative humidity or the dew point, and the other is worked out.");
  }

  const e = (rh / 100) * es;
  // Absolute humidity from the ideal gas law for water vapour.
  const absolute = (e * 100 * 18.01528) / (8.31446261815324 * (T + 273.15)) ;

  let comfort: string;
  if (dp < 5) comfort = "Very dry: static and dry skin are likely";
  else if (dp < 10) comfort = "Dry and comfortable";
  else if (dp < 13) comfort = "Comfortable";
  else if (dp < 16) comfort = "Becoming sticky";
  else if (dp < 18) comfort = "Humid and uncomfortable";
  else if (dp < 21) comfort = "Very humid, quite oppressive";
  else comfort = "Oppressive: severely uncomfortable";

  return {
    dew_point_c: r6(dp),
    dew_point_f: r6(cToF(dp)),
    relative_humidity: r6(rh),
    temperature_c: r6(T),
    saturation_vapour_pressure_hpa: r6(es),
    actual_vapour_pressure_hpa: r6(e),
    absolute_humidity_g_per_m3: r6(absolute),
    is_frost_point: dp < 0,
    comfort,
    solved_for: solvedFor
  };
}

// ===========================================================================
// SCI-011 BTU and energy
// ===========================================================================

export interface BtuResult {
  room_volume_m3: number;
  heat_requirement_watts: number;
  heat_requirement_btu_per_hour: number;
  heat_requirement_kw: number;
  watts_per_cubic_metre_used: number;
  running_cost_pence_per_hour: number | null;
  energy_per_hour_kwh: number;
  therms_per_hour: number;
}

/**
 * Room heating requirement, and the conversions between the units a radiator,
 * a boiler and a gas bill are each quoted in.
 *
 * THE WATTS PER CUBIC METRE FACTOR IS AN INPUT, not a constant invented here.
 * A room's heat loss depends on its insulation, glazing, exposed walls and
 * air changes, and the published rules of thumb differ by a factor of two.
 * Publishing one as though it were authoritative would be a guess wearing the
 * costume of a calculation.
 */
export function btuRequirement(
  lengthM: number,
  widthM: number,
  heightM: number,
  wattsPerM3: number,
  pencePerKwh: number | null,
  eng: EngineeringConstants
): BtuResult {
  const L = positive(assertFiniteNumber(lengthM, "Room length"), "Room length");
  const W = positive(assertFiniteNumber(widthM, "Room width"), "Room width");
  const H = positive(assertFiniteNumber(heightM, "Room height"), "Room height");
  const factor = positive(assertFiniteNumber(wattsPerM3, "Watts per cubic metre"), "Watts per cubic metre");

  if (L > 100 || W > 100 || H > 20) {
    throw new Error("Those room dimensions are beyond a domestic or small commercial space. Check the figures, in metres.");
  }
  if (factor > 500) {
    throw new Error("A heat requirement above 500 watts per cubic metre is beyond any normal building. Check the figure.");
  }

  const volume = L * W * H;
  const watts = volume * factor;
  // One watt is one joule per second, so watt-hours convert straight into BTU.
  const btuPerHour = (watts * 3600) / eng.energy_conversions.btu_it_joules;

  let costPerHour: number | null = null;
  if (pencePerKwh !== null && pencePerKwh !== undefined) {
    const ppk = assertFiniteNumber(pencePerKwh, "Fuel price");
    if (ppk < 0) throw new Error("The fuel price cannot be negative.");
    // Reported in pence an hour: a small room costs single-digit pence and a
    // large one tens, so pounds to two places would round most rooms to zero.
    costPerHour = (watts / 1000) * ppk;
  }

  return {
    room_volume_m3: r6(volume),
    heat_requirement_watts: r6(watts),
    heat_requirement_btu_per_hour: r6(btuPerHour),
    heat_requirement_kw: r6(watts / 1000),
    watts_per_cubic_metre_used: r6(factor),
    running_cost_pence_per_hour: costPerHour === null ? null : r6(costPerHour),
    energy_per_hour_kwh: r6(watts / 1000),
    therms_per_hour: r6((watts * 3600) / eng.energy_conversions.therm_joules)
  };
}
