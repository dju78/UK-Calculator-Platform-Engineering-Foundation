/**
 * Wave 2 Conversions calculators (CON-002 to CON-009).
 *
 * ONE TABLE, ONE DEFINITION. Every unit is defined by its exact factor to the
 * SI base unit, in one table per dimension, and every conversion goes through
 * that base. Converting directly between two units needs n squared factors and
 * is where conversion tables drift apart; going through a base needs n, and
 * the round trip is then exact by construction.
 *
 * TEMPERATURE IS NOT LIKE THE OTHERS. Length, mass, area, volume and speed are
 * all ratio scales with a shared zero, so a single multiplier converts them.
 * Temperature has an offset, so it needs its own treatment, and fuel economy is
 * worse still: miles per gallon and litres per 100 km are RECIPROCAL, so a
 * multiplier is not merely inaccurate but structurally wrong.
 *
 * Shoe sizes are not a physical dimension at all. They are conventional and
 * the conventions genuinely conflict, so that calculator states what it cannot
 * know rather than inventing precision.
 */
import { assertFiniteNumber } from "../common/validation.js";

const sig = (n: number, digits = 12): number => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};

export interface UnitTable {
  [unit: string]: number;
}

/**
 * LENGTH, in metres. The imperial units are exact by the 1959 international
 * agreement that defined the yard as 0.9144 m exactly.
 */
export const LENGTH_UNITS: UnitTable = {
  nanometre: 1e-9,
  micrometre: 1e-6,
  millimetre: 0.001,
  centimetre: 0.01,
  metre: 1,
  kilometre: 1000,
  inch: 0.0254,
  foot: 0.3048,
  yard: 0.9144,
  chain: 20.1168,
  furlong: 201.168,
  mile: 1609.344,
  nautical_mile: 1852,
  thou: 0.0000254
};

/** MASS, in kilograms. The pound is 0.45359237 kg exactly. */
export const MASS_UNITS: UnitTable = {
  microgram: 1e-9,
  milligram: 1e-6,
  gram: 0.001,
  kilogram: 1,
  tonne: 1000,
  ounce: 0.028349523125,
  pound: 0.45359237,
  stone: 6.35029318,
  hundredweight: 50.80234544,
  imperial_ton: 1016.0469088,
  us_ton: 907.18474,
  troy_ounce: 0.0311034768,
  carat: 0.0002
};

/** AREA, in square metres. */
export const AREA_UNITS: UnitTable = {
  square_millimetre: 1e-6,
  square_centimetre: 1e-4,
  square_metre: 1,
  hectare: 10000,
  square_kilometre: 1e6,
  square_inch: 0.00064516,
  square_foot: 0.09290304,
  square_yard: 0.83612736,
  acre: 4046.8564224,
  square_mile: 2589988.110336
};

/** VOLUME, in litres. */
export const VOLUME_UNITS: UnitTable = {
  millilitre: 0.001,
  centilitre: 0.01,
  litre: 1,
  cubic_centimetre: 0.001,
  cubic_metre: 1000,
  cubic_inch: 0.016387064,
  cubic_foot: 28.316846592,
  uk_pint: 0.56826125,
  uk_quart: 1.1365225,
  uk_gallon: 4.54609,
  uk_fluid_ounce: 0.0284130625,
  us_pint: 0.473176473,
  us_quart: 0.946352946,
  us_gallon: 3.785411784,
  us_fluid_ounce: 0.0295735295625
};

/** SPEED, in metres per second. */
export const SPEED_UNITS: UnitTable = {
  metres_per_second: 1,
  kilometres_per_hour: 1000 / 3600,
  miles_per_hour: 1609.344 / 3600,
  feet_per_second: 0.3048,
  knot: 1852 / 3600,
  mach: 340.29
};

function factorFor(table: UnitTable, unit: string, label: string): number {
  const f = table[unit];
  if (f === undefined) {
    throw new Error(
      `"${unit}" is not a ${label} unit this calculator knows. Choose one from the list.`
    );
  }
  return f;
}

export interface ConversionResult {
  value: number;
  from_unit: string;
  to_unit: string;
  result: number;
  factor: number;
  reverse_check: number;
  all_units: Array<{ unit: string; value: number }>;
}

/**
 * Convert through the base unit, and report the round trip.
 *
 * The reverse check is an output rather than a test because it is the one
 * property a user can verify without trusting the table: converting back must
 * return the number they started with.
 */
export function convert(
  table: UnitTable,
  label: string,
  value: number,
  fromUnit: string,
  toUnit: string,
  maxMagnitude = 1e15
): ConversionResult {
  const v = assertFiniteNumber(value, "Value");
  if (Math.abs(v) > maxMagnitude) {
    throw new Error("That value is larger than this calculator will convert.");
  }
  const fromFactor = factorFor(table, fromUnit, label);
  const toFactor = factorFor(table, toUnit, label);

  const base = v * fromFactor;
  const result = base / toFactor;

  return {
    value: v,
    from_unit: fromUnit,
    to_unit: toUnit,
    result: sig(result),
    factor: sig(fromFactor / toFactor),
    reverse_check: sig((result * toFactor) / fromFactor),
    all_units: Object.keys(table)
      .map(u => ({ unit: u, value: sig(base / table[u]) }))
      .sort((a, b) => a.unit.localeCompare(b.unit))
  };
}

// ===========================================================================
// CON-004 Temperature
// ===========================================================================

export interface TemperatureResult {
  celsius: number;
  fahrenheit: number;
  kelvin: number;
  rankine: number;
  result: number;
  from_unit: string;
  to_unit: string;
  below_absolute_zero: boolean;
}

const ABSOLUTE_ZERO_C = -273.15;

/**
 * Temperature conversion, which is NOT a multiplication.
 *
 * Celsius and Fahrenheit are INTERVAL scales: their zeros are arbitrary, so a
 * conversion needs an offset as well as a scale, and "twice as hot" means
 * nothing on either of them. Kelvin and Rankine are ratio scales with a true
 * zero, and only on those does doubling the number double the thermal energy.
 */
export function temperature(
  value: number,
  fromUnit: string,
  toUnit: string
): TemperatureResult {
  const v = assertFiniteNumber(value, "Temperature");
  const known = ["celsius", "fahrenheit", "kelvin", "rankine"];
  for (const [u, label] of [[fromUnit, "from"], [toUnit, "to"]] as const) {
    if (!known.includes(u)) {
      throw new Error(`"${u}" is not a temperature scale this calculator knows. Use Celsius, Fahrenheit, Kelvin or Rankine.`);
    }
  }

  // Everything goes through Celsius.
  let celsius: number;
  switch (fromUnit) {
    case "celsius": celsius = v; break;
    case "fahrenheit": celsius = ((v - 32) * 5) / 9; break;
    case "kelvin": celsius = v - 273.15; break;
    default: celsius = (v - 491.67) * 5 / 9; break;   // rankine
  }

  if (celsius < ABSOLUTE_ZERO_C - 1e-9) {
    throw new Error(
      `That is below absolute zero, which is ${ABSOLUTE_ZERO_C} degrees Celsius, 0 kelvin or -459.67 Fahrenheit. No temperature can be lower.`
    );
  }

  const fahrenheit = (celsius * 9) / 5 + 32;
  const kelvin = celsius + 273.15;
  const rankine = (celsius + 273.15) * 9 / 5;

  const result =
    toUnit === "celsius" ? celsius
      : toUnit === "fahrenheit" ? fahrenheit
        : toUnit === "kelvin" ? kelvin
          : rankine;

  return {
    celsius: sig(celsius),
    fahrenheit: sig(fahrenheit),
    kelvin: sig(kelvin),
    rankine: sig(rankine),
    result: sig(result),
    from_unit: fromUnit,
    to_unit: toUnit,
    below_absolute_zero: false
  };
}

// ===========================================================================
// CON-008 Fuel economy
// ===========================================================================

export interface FuelEconomyConversionResult {
  mpg_imperial: number;
  mpg_us: number;
  litres_per_100km: number;
  km_per_litre: number;
  miles_per_litre: number;
  result: number;
  from_unit: string;
  to_unit: string;
  is_reciprocal_pair: boolean;
}

const IMPERIAL_GALLON_LITRES = 4.54609;
const US_GALLON_LITRES = 3.785411784;
const MILE_KM = 1.609344;

/**
 * Fuel economy conversion.
 *
 * The units split into two families that run in OPPOSITE directions. Miles per
 * gallon, kilometres per litre and miles per litre are all distance per fuel,
 * so higher is better. Litres per 100 km is fuel per distance, so LOWER is
 * better. Converting between the families is a reciprocal, not a multiplier,
 * and treating it as a multiplier is not an inaccuracy but a category error
 * that gets the ranking of two cars backwards.
 */
export function fuelEconomyConvert(
  value: number,
  fromUnit: string,
  toUnit: string
): FuelEconomyConversionResult {
  const v = assertFiniteNumber(value, "Value");
  if (v <= 0) {
    throw new Error("Fuel economy must be greater than zero in any unit.");
  }
  const known = ["mpg_imperial", "mpg_us", "litres_per_100km", "km_per_litre", "miles_per_litre"];
  for (const u of [fromUnit, toUnit]) {
    if (!known.includes(u)) {
      throw new Error(`"${u}" is not a fuel economy unit this calculator knows.`);
    }
  }

  // Everything goes through kilometres per litre, a distance-per-fuel unit.
  let kmPerLitre: number;
  switch (fromUnit) {
    case "mpg_imperial": kmPerLitre = (v * MILE_KM) / IMPERIAL_GALLON_LITRES; break;
    case "mpg_us": kmPerLitre = (v * MILE_KM) / US_GALLON_LITRES; break;
    case "km_per_litre": kmPerLitre = v; break;
    case "miles_per_litre": kmPerLitre = v * MILE_KM; break;
    default: kmPerLitre = 100 / v; break;    // litres per 100 km, a reciprocal
  }

  if (kmPerLitre > 1000) {
    throw new Error("That economy is beyond any vehicle. Check the value and the unit.");
  }

  const mpgImperial = (kmPerLitre / MILE_KM) * IMPERIAL_GALLON_LITRES;
  const mpgUs = (kmPerLitre / MILE_KM) * US_GALLON_LITRES;
  const litresPer100 = 100 / kmPerLitre;
  const milesPerLitre = kmPerLitre / MILE_KM;

  const result =
    toUnit === "mpg_imperial" ? mpgImperial
      : toUnit === "mpg_us" ? mpgUs
        : toUnit === "km_per_litre" ? kmPerLitre
          : toUnit === "miles_per_litre" ? milesPerLitre
            : litresPer100;

  const isReciprocal =
    (fromUnit === "litres_per_100km") !== (toUnit === "litres_per_100km");

  return {
    mpg_imperial: sig(mpgImperial),
    mpg_us: sig(mpgUs),
    litres_per_100km: sig(litresPer100),
    km_per_litre: sig(kmPerLitre),
    miles_per_litre: sig(milesPerLitre),
    result: sig(result),
    from_unit: fromUnit,
    to_unit: toUnit,
    is_reciprocal_pair: isReciprocal
  };
}

// ===========================================================================
// CON-009 Shoe sizes
// ===========================================================================

export interface ShoeSizeResult {
  uk_size: number;
  us_size: number;
  eu_size: number;
  foot_length_mm: number;
  from_system: string;
  gender: string;
  approximate: boolean;
}

/**
 * Shoe size conversion.
 *
 * These are CONVENTIONS, not measurements, and the conventions genuinely
 * disagree. UK and US sizing both run in barleycorns, a third of an inch, but
 * from different starting points and with a different offset for men and women.
 * Continental sizing runs in Paris points, two thirds of a centimetre, and does
 * not divide the same way, so many conversions land between whole sizes.
 *
 * Manufacturers also differ from each other by a full size in either direction,
 * so the honest output is a FOOT LENGTH alongside the sizes, because that is
 * the only figure that means anything across brands.
 */
export function shoeSize(
  size: number,
  fromSystem: "uk" | "us" | "eu" | "foot_length_mm",
  gender: "men" | "women"
): ShoeSizeResult {
  const v = assertFiniteNumber(size, "Size");
  if (v <= 0) throw new Error("A shoe size must be greater than zero.");

  // A barleycorn is a third of an inch; the UK scale starts from a nominal
  // foot length and the men's and women's scales are offset from each other.
  const BARLEYCORN_MM = 25.4 / 3;
  // UK child size 0 is a nominal 4 inch last. Child sizes run 0 to 13, and the
  // ADULT scale continues from there, so adult size N is 13 + N barleycorns
  // above the 4 inch start. Taking adult 0 as 12 barleycorns instead, which is
  // the easy off-by-one here, shifts every adult size down by a third of an
  // inch and lands UK 9 on EU 42 instead of the correct 43.
  const UK_ZERO_MM = 4 * 25.4 + 13 * BARLEYCORN_MM;
  // A shoe is longer than the foot inside it; this last allowance is why a
  // "foot length" table and a "shoe length" table differ by about 15 mm.
  const LAST_ALLOWANCE_MM = 15;

  const ukToFootMm = (uk: number) => UK_ZERO_MM + uk * BARLEYCORN_MM - LAST_ALLOWANCE_MM;
  const footMmToUk = (mm: number) => (mm + LAST_ALLOWANCE_MM - UK_ZERO_MM) / BARLEYCORN_MM;

  // The men's US scale runs one size above the UK; the women's runs two above.
  const usOffset = gender === "men" ? 1 : 2;

  let uk: number;
  switch (fromSystem) {
    case "uk": uk = v; break;
    case "us": uk = v - usOffset; break;
    case "eu":
      // A Paris point is two thirds of a centimetre, measured on the last.
      uk = footMmToUk((v * 20) / 3 - LAST_ALLOWANCE_MM);
      break;
    default: uk = footMmToUk(v); break;
  }

  if (uk < 0 || uk > 20) {
    throw new Error(
      "That size is outside the adult range this calculator covers. Check the value and the system it is in."
    );
  }

  const footMm = ukToFootMm(uk);
  const eu = ((footMm + LAST_ALLOWANCE_MM) * 3) / 20;

  const half = (n: number) => Math.round(n * 2) / 2;

  return {
    uk_size: half(uk),
    us_size: half(uk + usOffset),
    eu_size: half(eu),
    foot_length_mm: Math.round(footMm * 10) / 10,
    from_system: fromSystem,
    gender,
    approximate: true
  };
}
