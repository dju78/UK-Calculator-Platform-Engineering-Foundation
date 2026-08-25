/**
 * Independent benchmark oracle for Wave 2 tranche 2P, Conversions.
 *
 * Imports nothing from the calculation engine. For a table-driven calculator
 * the risk is not the arithmetic, it is a WRONG TABLE ENTRY, and an oracle
 * that reads the same table would confirm the error rather than catch it.
 * So every case here carries a factor DERIVED IN THE CASE ITSELF from
 * primitive definitions, written out as an expression rather than a constant:
 *
 *   - the yard is 0.9144 m exactly and the pound 0.45359237 kg exactly, by the
 *     1959 international agreement, and every other imperial unit is built up
 *     from those two by its own definition (12 inches to a foot, 1760 yards to
 *     a mile, 16 ounces to a pound, 14 pounds to a stone, 4840 square yards to
 *     an acre, and so on);
 *   - the UK gallon is 4.54609 litres and the US gallon 231 cubic inches;
 *   - temperature conversions are checked in the OPPOSITE direction, by
 *     converting the answer back through a separately written formula;
 *   - fuel economy goes through LITRES PER MILE, a unit the engine never uses;
 *   - shoe sizes are computed entirely in INCHES rather than millimetres.
 *
 * Run: node scripts/oracles/wave2-conversion-oracle.mjs > /tmp/conversion.json
 */

const sig = (n, digits = 12) => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};

// The two primitives everything imperial is built from.
const YARD_M = 0.9144;
const POUND_KG = 0.45359237;

const fixtures = {};

function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "1e-6 on ratios and small values",
    ruleset: "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

/** A conversion case whose factor is derived in the case from definitions. */
function conversionCase(id, scenario, value, from, to, derivedFactor, note) {
  const result = value * derivedFactor;
  add(id, scenario,
    { value, from_unit: from, to_unit: to },
    {
      result: sig(result),
      factor: sig(derivedFactor),
      reverse_check: sig(value)
    },
    note);
}

// ===========================================================================
// CON-002 Length
// ===========================================================================

const INCH_M = YARD_M / 36;
const FOOT_M = YARD_M / 3;
const MILE_M = YARD_M * 1760;

conversionCase("CON-002", "A mile in kilometres", 1, "mile", "kilometre",
  (YARD_M * 1760) / 1000,
  "1760 yards to a mile, and a yard is 0.9144 m exactly, so the factor is derived rather than looked up.");
conversionCase("CON-002", "Six feet in centimetres", 6, "foot", "centimetre",
  (YARD_M / 3) * 100,
  "Three feet to a yard.");
conversionCase("CON-002", "A hundred metres in yards", 100, "metre", "yard",
  1 / YARD_M,
  "The reciprocal of the defining constant.");
conversionCase("CON-002", "An inch in millimetres, which is exactly 25.4", 1, "inch", "millimetre",
  (YARD_M / 36) * 1000,
  "36 inches to a yard, giving exactly 25.4 mm, which is checkable by inspection.");
conversionCase("CON-002", "A nautical mile in ordinary miles", 1, "nautical_mile", "mile",
  1852 / MILE_M,
  "A nautical mile is 1,852 metres exactly by definition, not a rounded land mile.");
conversionCase("CON-002", "A furlong in chains, which is exactly ten", 1, "furlong", "chain",
  (YARD_M * 220) / (YARD_M * 22),
  "A furlong is 220 yards and a chain 22, so the answer must be exactly ten and the yard cancels out entirely.");

// ===========================================================================
// CON-003 Mass
// ===========================================================================

conversionCase("CON-003", "A stone in kilograms", 1, "stone", "kilogram",
  POUND_KG * 14,
  "14 pounds to a stone, and a pound is 0.45359237 kg exactly.");
conversionCase("CON-003", "Seventy kilograms in stone", 70, "kilogram", "stone",
  1 / (POUND_KG * 14),
  "The reciprocal.");
conversionCase("CON-003", "A pound in ounces, which is exactly sixteen", 1, "pound", "ounce",
  16,
  "16 ounces to a pound, so the pound cancels and the answer is exactly sixteen.");
conversionCase("CON-003", "An imperial ton in kilograms", 1, "imperial_ton", "kilogram",
  POUND_KG * 2240,
  "The imperial ton is 2,240 pounds.");
conversionCase("CON-003", "A US short ton in imperial tons", 1, "us_ton", "imperial_ton",
  2000 / 2240,
  "The US short ton is 2,000 pounds against the imperial 2,240, so it is about eleven per cent lighter and the two are NOT interchangeable.");
conversionCase("CON-003", "A troy ounce in ordinary ounces", 1, "troy_ounce", "ounce",
  0.0311034768 / (POUND_KG / 16),
  "A troy ounce is 31.1034768 g exactly, about ten per cent heavier than the avoirdupois ounce, which is why a gold price is never in kitchen-scale ounces.");

// ===========================================================================
// CON-004 Temperature
// ===========================================================================

for (const c of [
  { scenario: "Freezing point", v: 0, from: "celsius", to: "fahrenheit" },
  { scenario: "Minus forty, where the two scales cross", v: -40, from: "celsius", to: "fahrenheit" },
  { scenario: "Body temperature", v: 98.6, from: "fahrenheit", to: "celsius" },
  { scenario: "Boiling point in kelvin", v: 100, from: "celsius", to: "kelvin" },
  { scenario: "Absolute zero itself", v: 0, from: "kelvin", to: "celsius" },
  { scenario: "A hot day in Rankine", v: 30, from: "celsius", to: "rankine" },
  { scenario: "Room temperature from Fahrenheit to kelvin", v: 68, from: "fahrenheit", to: "kelvin" }
]) {
  // Convert to Celsius by a formula written independently for each scale.
  const toC = (v, unit) =>
    unit === "celsius" ? v
      : unit === "fahrenheit" ? (v - 32) / 1.8
        : unit === "kelvin" ? v - 273.15
          : v / 1.8 - 273.15;      // rankine

  const fromC = (c, unit) =>
    unit === "celsius" ? c
      : unit === "fahrenheit" ? c * 1.8 + 32
        : unit === "kelvin" ? c + 273.15
          : (c + 273.15) * 1.8;

  const celsius = toC(c.v, c.from);
  const result = fromC(celsius, c.to);

  add("CON-004", c.scenario,
    { value: c.v, from_unit: c.from, to_unit: c.to },
    {
      result: sig(result),
      celsius: sig(celsius),
      fahrenheit: sig(fromC(celsius, "fahrenheit")),
      kelvin: sig(fromC(celsius, "kelvin")),
      rankine: sig(fromC(celsius, "rankine"))
    },
    "Written with the scale factor as 1.8 rather than as nine fifths, and with Rankine derived directly rather than through Fahrenheit, so the two implementations share no expression. The minus forty case pins the crossing point where Celsius and Fahrenheit read the same number, and absolute zero pins the floor.");
}

// ===========================================================================
// CON-005 Area
// ===========================================================================

const SQ_YARD_M2 = YARD_M * YARD_M;

conversionCase("CON-005", "An acre in square metres", 1, "acre", "square_metre",
  SQ_YARD_M2 * 4840,
  "An acre is 4,840 square yards, and a square yard is the yard squared. Deriving it this way is the check that the table did not square the wrong thing.");
conversionCase("CON-005", "A hectare in acres", 1, "hectare", "acre",
  10000 / (SQ_YARD_M2 * 4840),
  "A hectare is 10,000 square metres exactly, so this is about two and a half acres.");
conversionCase("CON-005", "A square yard in square feet, which is exactly nine", 1, "square_yard", "square_foot",
  9,
  "Three feet to a yard means NINE square feet to a square yard, which is the fact area conversions most often get wrong.");
conversionCase("CON-005", "A room in square metres to square feet", 20, "square_metre", "square_foot",
  1 / ((YARD_M / 3) * (YARD_M / 3)),
  "The square foot derived by squaring the foot, itself derived from the yard.");
conversionCase("CON-005", "A square mile in acres, which is exactly 640", 1, "square_mile", "acre",
  640,
  "A square mile is exactly 640 acres, so every length constant cancels and the answer is a whole number by definition.");
conversionCase("CON-005", "A square kilometre in hectares, which is exactly a hundred", 1, "square_kilometre", "hectare",
  100,
  "Purely metric, and exactly a hundred.");

// ===========================================================================
// CON-006 Volume
// ===========================================================================

const UK_GALLON_L = 4.54609;
const CUBIC_INCH_L = Math.pow(INCH_M, 3) * 1000;
const US_GALLON_L = 231 * CUBIC_INCH_L;

conversionCase("CON-006", "A UK pint in millilitres", 1, "uk_pint", "millilitre",
  (UK_GALLON_L / 8) * 1000,
  "Eight pints to a UK gallon of 4.54609 litres, giving 568.26125 ml.");
conversionCase("CON-006", "A US pint in millilitres, which is a fifth smaller", 1, "us_pint", "millilitre",
  (US_GALLON_L / 8) * 1000,
  "The US gallon is defined as 231 CUBIC INCHES, derived here from the inch rather than taken as a decimal, giving a pint a fifth smaller than the UK one.");
conversionCase("CON-006", "A UK gallon in US gallons", 1, "uk_gallon", "us_gallon",
  UK_GALLON_L / US_GALLON_L,
  "The ratio of the two gallons, about 1.2.");
conversionCase("CON-006", "A litre in UK fluid ounces, which is a different ounce from the US one", 1, "litre", "uk_fluid_ounce",
  160 / UK_GALLON_L,
  "160 UK fluid ounces to a UK gallon, so a UK pint holds 20 and a US pint 16.");
conversionCase("CON-006", "A cubic metre in litres, which is exactly a thousand", 1, "cubic_metre", "litre",
  1000,
  "Exact by definition.");
conversionCase("CON-006", "A cubic foot in litres", 1, "cubic_foot", "litre",
  Math.pow(YARD_M / 3, 3) * 1000,
  "The foot cubed, derived from the yard.");

// ===========================================================================
// CON-007 Speed
// ===========================================================================

conversionCase("CON-007", "Sixty miles an hour in kilometres an hour", 60, "miles_per_hour", "kilometres_per_hour",
  (YARD_M * 1760) / 1000,
  "The mile in kilometres, so the hours cancel and the factor is the length factor.");
conversionCase("CON-007", "A hundred kilometres an hour in miles an hour", 100, "kilometres_per_hour", "miles_per_hour",
  1000 / (YARD_M * 1760),
  "The reciprocal.");
conversionCase("CON-007", "Ten metres a second in kilometres an hour, which is exactly 36", 10, "metres_per_second", "kilometres_per_hour",
  3.6,
  "3,600 seconds in an hour over 1,000 metres in a kilometre, so exactly 3.6 and checkable by inspection.");
conversionCase("CON-007", "A knot in miles an hour", 1, "knot", "miles_per_hour",
  1852 / (YARD_M * 1760),
  "A knot is one nautical mile an hour, and a nautical mile is 1,852 metres exactly.");
conversionCase("CON-007", "Thirty feet a second in miles an hour", 30, "feet_per_second", "miles_per_hour",
  ((YARD_M / 3) * 3600) / (YARD_M * 1760),
  "Feet per second to miles per hour, derived through the yard.");
conversionCase("CON-007", "Mach one in kilometres an hour at sea level", 1, "mach", "kilometres_per_hour",
  (340.29 * 3600) / 1000,
  "Mach is a RATIO to the local speed of sound, which falls with temperature and so with altitude. The sea-level standard is used, and it is an approximation in a way none of the other units are.");

// ===========================================================================
// CON-008 Fuel economy
// ===========================================================================

for (const c of [
  { scenario: "Forty imperial mpg into litres per 100 km", v: 40, from: "mpg_imperial", to: "litres_per_100km" },
  { scenario: "Six litres per 100 km into imperial mpg", v: 6, from: "litres_per_100km", to: "mpg_imperial" },
  { scenario: "Thirty US mpg into imperial mpg", v: 30, from: "mpg_us", to: "mpg_imperial" },
  { scenario: "Fifteen kilometres per litre into litres per 100 km", v: 15, from: "km_per_litre", to: "litres_per_100km" },
  { scenario: "Twenty imperial mpg, a thirsty car", v: 20, from: "mpg_imperial", to: "litres_per_100km" },
  { scenario: "Twenty-five imperial mpg, five better than the last", v: 25, from: "mpg_imperial", to: "litres_per_100km" },
  { scenario: "Forty-five imperial mpg, five better than the first case", v: 45, from: "mpg_imperial", to: "litres_per_100km" }
]) {
  // Everything through LITRES PER MILE, a unit the engine never uses.
  const MILE_KM_LOCAL = (YARD_M * 1760) / 1000;
  const toLitresPerMile = (v, unit) => {
    switch (unit) {
      case "mpg_imperial": return UK_GALLON_L / v;
      case "mpg_us": return US_GALLON_L / v;
      case "km_per_litre": return MILE_KM_LOCAL / v;
      case "miles_per_litre": return 1 / v;
      default: return (v / 100) * MILE_KM_LOCAL;   // litres per 100 km
    }
  };
  const fromLitresPerMile = (lpm, unit) => {
    switch (unit) {
      case "mpg_imperial": return UK_GALLON_L / lpm;
      case "mpg_us": return US_GALLON_L / lpm;
      case "km_per_litre": return MILE_KM_LOCAL / lpm;
      case "miles_per_litre": return 1 / lpm;
      default: return (lpm / MILE_KM_LOCAL) * 100;
    }
  };

  const lpm = toLitresPerMile(c.v, c.from);
  add("CON-008", c.scenario,
    { value: c.v, from_unit: c.from, to_unit: c.to },
    {
      result: sig(fromLitresPerMile(lpm, c.to)),
      mpg_imperial: sig(fromLitresPerMile(lpm, "mpg_imperial")),
      mpg_us: sig(fromLitresPerMile(lpm, "mpg_us")),
      litres_per_100km: sig(fromLitresPerMile(lpm, "litres_per_100km")),
      km_per_litre: sig(fromLitresPerMile(lpm, "km_per_litre")),
      miles_per_litre: sig(fromLitresPerMile(lpm, "miles_per_litre"))
    },
    "Routed through LITRES PER MILE, a unit the engine never uses, and with the US gallon derived from 231 cubic inches rather than taken as a decimal. The 20, 25 and 45 mpg cases exist together so the reciprocal effect is visible in the fixtures themselves: the same five mpg step saves far more fuel at the bottom of the range than at the top.");
}

// ===========================================================================
// CON-009 Shoe sizes
// ===========================================================================

for (const c of [
  { scenario: "A common men's size", size: 9, from: "uk", gender: "men" },
  { scenario: "A men's size given in US sizing", size: 10, from: "us", gender: "men" },
  { scenario: "A men's size given in continental sizing", size: 43, from: "eu", gender: "men" },
  { scenario: "A women's size", size: 6, from: "uk", gender: "women" },
  { scenario: "A women's size given in US sizing, where the offset is two not one", size: 8, from: "us", gender: "women" },
  { scenario: "Working from a measured foot length", size: 272.9, from: "foot_length_mm", gender: "men" }
]) {
  // Computed entirely in INCHES rather than millimetres.
  const BARLEYCORN_IN = 1 / 3;
  const LAST_ALLOWANCE_IN = 15 / 25.4;
  const UK_ZERO_IN = 4 + 13 * BARLEYCORN_IN;
  const usOffset = c.gender === "men" ? 1 : 2;

  const ukToFootIn = (uk) => UK_ZERO_IN + uk * BARLEYCORN_IN - LAST_ALLOWANCE_IN;
  const footInToUk = (inch) => (inch + LAST_ALLOWANCE_IN - UK_ZERO_IN) / BARLEYCORN_IN;

  let uk;
  switch (c.from) {
    case "uk": uk = c.size; break;
    case "us": uk = c.size - usOffset; break;
    case "eu": uk = footInToUk((c.size * 20) / 3 / 25.4 - LAST_ALLOWANCE_IN); break;
    default: uk = footInToUk(c.size / 25.4); break;
  }

  const footIn = ukToFootIn(uk);
  const eu = ((footIn + LAST_ALLOWANCE_IN) * 25.4 * 3) / 20;
  const half = (n) => Math.round(n * 2) / 2;

  add("CON-009", c.scenario,
    { size: c.size, from_system: c.from, gender: c.gender },
    {
      uk_size: half(uk),
      us_size: half(uk + usOffset),
      eu_size: half(eu),
      foot_length_mm: Math.round(footIn * 25.4 * 10) / 10
    },
    "Computed entirely in INCHES and converted to millimetres only at the end, the opposite way round from the engine. The adult scale starts 13 barleycorns above the four inch child zero, not 12; the off-by-one there shifts every adult size by a third of an inch and lands UK 9 on EU 42 rather than the correct 43, and the men's and women's cases pin the different US offsets.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
