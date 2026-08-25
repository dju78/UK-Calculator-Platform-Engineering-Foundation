import type { NumericInputs, CalculatorHandler } from "../types.js";
import {
  convert, temperature, fuelEconomyConvert, shoeSize,
  LENGTH_UNITS, MASS_UNITS, AREA_UNITS, VOLUME_UNITS, SPEED_UNITS
} from "./wave2.js";

function str(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : fallback;
}

const THROUGH_BASE =
  "Every conversion goes through the SI base unit rather than through a direct factor between the two units chosen. That matters for consistency: a table of direct factors needs one entry per pair and they drift apart as it grows, while going through a base needs one per unit and makes the round trip exact by construction. The reverse check is reported so you can see that converting back returns exactly what you started with.";

const EXACT_DEFINITIONS =
  "The imperial figures here are EXACT BY DEFINITION rather than measured: the 1959 international agreement fixed the yard at 0.9144 metres and the pound at 0.45359237 kilograms exactly, and everything else follows. Any difference from another table is that table rounding, not this one.";

/** CON-002 Length Converter */
export const con002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = convert(
    LENGTH_UNITS, "length",
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "metre"),
    str(inputs.to_unit, "foot")
  );
  return {
    outputs: {
      result: r.result,
      factor: r.factor,
      reverse_check: r.reverse_check,
      basis:
        EXACT_DEFINITIONS + " " + THROUGH_BASE + " " +
        "A NAUTICAL MILE IS NOT A ROUNDED-UP LAND MILE. It is 1,852 metres exactly, defined as one minute of latitude, which is why it is the unit at sea and in the air: a degree of latitude is sixty of them anywhere on the globe."
    },
    schedule: r.all_units
  };
};

/** CON-003 Weight / Mass Converter */
export const con003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = convert(
    MASS_UNITS, "mass",
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "kilogram"),
    str(inputs.to_unit, "pound")
  );
  return {
    outputs: {
      result: r.result,
      factor: r.factor,
      reverse_check: r.reverse_check,
      basis:
        EXACT_DEFINITIONS + " " + THROUGH_BASE + " " +
        "A UK TON AND A US TON ARE DIFFERENT WEIGHTS. The imperial ton is 2,240 pounds and the US short ton 2,000, a difference of over ten per cent, and neither is the metric tonne of 1,000 kilograms. A TROY OUNCE, used for precious metals, is about ten per cent heavier than the ordinary avoirdupois ounce, which is why a quoted gold price is never in the same ounce as a kitchen scale. " +
        "Strictly these are MASSES rather than weights. Weight is a force and changes with gravity; mass does not, and a kitchen scale reads mass."
    },
    schedule: r.all_units
  };
};

/** CON-004 Temperature Converter */
export const con004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = temperature(
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "celsius"),
    str(inputs.to_unit, "fahrenheit")
  );
  return {
    outputs: {
      result: r.result,
      celsius: r.celsius,
      fahrenheit: r.fahrenheit,
      kelvin: r.kelvin,
      rankine: r.rankine,
      basis:
        "TEMPERATURE IS NOT A MULTIPLICATION. Celsius and Fahrenheit are INTERVAL scales whose zeros are arbitrary, so converting needs an offset as well as a scale, and 'twice as hot' means nothing on either: 20 degrees Celsius is not twice as warm as 10. Kelvin and Rankine are RATIO scales with a true zero, and only on those does doubling the number double the thermal energy. " +
        "ABSOLUTE ZERO IS A FLOOR, and a value below it is refused rather than converted: minus 273.15 Celsius, 0 kelvin and minus 459.67 Fahrenheit are the same point, and nothing can be colder. " +
        "The two scales cross at minus 40, where Celsius and Fahrenheit read the same number, which is a useful check on any conversion."
    }
  };
};

/** CON-005 Area Converter */
export const con005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = convert(
    AREA_UNITS, "area",
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "square_metre"),
    str(inputs.to_unit, "square_foot")
  );
  return {
    outputs: {
      result: r.result,
      factor: r.factor,
      reverse_check: r.reverse_check,
      basis:
        THROUGH_BASE + " " +
        "AREA FACTORS ARE THE SQUARE OF LENGTH FACTORS, which is why they are so much less intuitive. A yard is three feet, but a square yard is NINE square feet, and doubling a room's dimensions quadruples its floor. " +
        "AN ACRE IS NOT A SQUARE. It is 4,840 square yards, historically the area a team of oxen could plough in a day, which is why it is a long thin shape in origin and has no neat side length. A hectare is 10,000 square metres and is about two and a half acres."
    },
    schedule: r.all_units
  };
};

/** CON-006 Volume Converter */
export const con006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = convert(
    VOLUME_UNITS, "volume",
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "litre"),
    str(inputs.to_unit, "uk_pint")
  );
  return {
    outputs: {
      result: r.result,
      factor: r.factor,
      reverse_check: r.reverse_check,
      basis:
        THROUGH_BASE + " " +
        "UK AND US LIQUID MEASURES SHARE THEIR NAMES AND NOT THEIR SIZES, and this is the single most common source of error in a converted recipe. A UK pint is 568 ml and a US pint 473, a fifth smaller. A UK gallon is 4.546 litres and a US gallon 3.785. Even the fluid ounce differs, though the other way: the UK ounce is slightly SMALLER, so a UK pint holds 20 fluid ounces and a US pint 16. Both are offered here, always labelled, and never silently defaulted."
    },
    schedule: r.all_units
  };
};

/** CON-007 Speed Converter */
export const con007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = convert(
    SPEED_UNITS, "speed",
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "miles_per_hour"),
    str(inputs.to_unit, "kilometres_per_hour")
  );
  return {
    outputs: {
      result: r.result,
      factor: r.factor,
      reverse_check: r.reverse_check,
      basis:
        THROUGH_BASE + " " +
        "A KNOT IS ONE NAUTICAL MILE AN HOUR, and a nautical mile is one minute of latitude, which is why knots are used at sea and in the air rather than out of tradition: a speed in knots converts directly into degrees of latitude covered. " +
        "MACH IS NOT A FIXED SPEED. It is the ratio to the local speed of sound, which falls with temperature and therefore with altitude: roughly 1,225 km/h at sea level and about 1,062 at cruising height. The figure used here is a sea-level standard, and it is an approximation in a way the other units are not."
    },
    schedule: r.all_units
  };
};

/** CON-008 Fuel Economy Converter */
export const con008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = fuelEconomyConvert(
    Number(inputs.value ?? 0),
    str(inputs.from_unit, "mpg_imperial"),
    str(inputs.to_unit, "litres_per_100km")
  );
  return {
    outputs: {
      result: r.result,
      mpg_imperial: r.mpg_imperial,
      mpg_us: r.mpg_us,
      litres_per_100km: r.litres_per_100km,
      km_per_litre: r.km_per_litre,
      miles_per_litre: r.miles_per_litre,
      basis:
        "THESE UNITS RUN IN TWO OPPOSITE DIRECTIONS. Miles per gallon, kilometres per litre and miles per litre are distance per fuel, so HIGHER IS BETTER. Litres per 100 km is fuel per distance, so LOWER IS BETTER. Converting between the families is a RECIPROCAL, not a multiplication, and treating it as a multiplication is not an inaccuracy but a category error that ranks two cars the wrong way round. " +
        "A CONSEQUENCE THAT SURPRISES PEOPLE: equal steps in mpg are not equal savings. Going from 20 to 25 mpg saves far more fuel over the same distance than going from 40 to 45, because the saving lives in the reciprocal. Litres per 100 km is the better unit for comparing running costs for exactly that reason. " +
        "The imperial and US gallon differ by a fifth, so both mpg figures are shown and always labelled."
    }
  };
};

/** CON-009 Shoe Size Converter */
export const con009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const genderRaw = str(inputs.gender, "men");
  const gender = (genderRaw === "women" ? "women" : "men") as "men" | "women";
  const systemRaw = str(inputs.from_system, "uk");
  const system = (["uk", "us", "eu", "foot_length_mm"].includes(systemRaw) ? systemRaw : "uk") as
    "uk" | "us" | "eu" | "foot_length_mm";

  const r = shoeSize(Number(inputs.size ?? 0), system, gender);
  return {
    outputs: {
      uk_size: r.uk_size,
      us_size: r.us_size,
      eu_size: r.eu_size,
      foot_length_mm: r.foot_length_mm,
      basis:
        "THESE ARE CONVENTIONS, NOT MEASUREMENTS, and the conventions genuinely disagree. UK and US sizes both run in barleycorns, a third of an inch, but from different starting points, and the men's and women's scales are offset from each other by different amounts. Continental sizes run in Paris points, two thirds of a centimetre, and do not divide the same way, so many conversions land between whole sizes. " +
        "THE FOOT LENGTH IS THE ONLY FIGURE THAT MEANS ANYTHING ACROSS BRANDS, which is why it is given. Manufacturers differ from one another by a full size in either direction, and a size that fits in one brand routinely does not in another. Measure your foot, standing, in the afternoon when it is at its largest, and treat the size numbers as a starting point rather than an answer."
    },
    warnings: [
      "Shoe size conversions are approximate by nature. Manufacturers vary by up to a full size in either direction, so use the foot length in millimetres where a brand publishes one."
    ]
  };
};
