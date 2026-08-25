/**
 * Narrative specification sections for Wave 2 tranche 2P, Conversions.
 * Run: node scripts/wave2_2p_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const THROUGH_BASE =
  'Every conversion goes through the SI base unit rather than through a direct factor between the two units chosen. A table of direct factors needs one entry per PAIR and those entries drift apart as the table grows; going through a base needs one per unit and makes the round trip exact by construction. The reverse check is reported as an output rather than hidden in a test, because it is the one property a user can verify without trusting the table.';

const EXACT =
  'The imperial figures are EXACT BY DEFINITION rather than measured. The 1959 international agreement fixed the yard at 0.9144 metres and the pound at 0.45359237 kilograms exactly, and every other imperial unit is built from those. Any disagreement with another table is that table rounding.';

const TABLE_ORACLE =
  'For a table-driven calculator the risk is not the arithmetic but a WRONG TABLE ENTRY, and an oracle that read the same table would confirm an error rather than catch it. Every benchmark case therefore carries a factor DERIVED IN THE CASE ITSELF from primitive definitions, written out as an expression: 1760 yards to a mile, 16 ounces to a pound, 4840 square yards to an acre, 231 cubic inches to a US gallon. The engine and the oracle share no constant beyond the two 1959 primitives.';

Object.assign(notes, {

  "CON-002": {
    purpose: "Convert a length between metric, imperial and nautical units.",
    scope: "Fourteen units from nanometres to nautical miles.",
    assumptions: ["The 1959 international definitions of the yard and its derivatives."],
    validation: [
      "An unknown unit is refused BY NAME rather than silently defaulted.",
      "Values above 1e15 are refused."
    ],
    formula: "Value times the source unit's factor to metres, divided by the target unit's factor.",
    boundary: EXACT + " " + THROUGH_BASE + " " +
      "A NAUTICAL MILE IS NOT A ROUNDED-UP LAND MILE. It is 1,852 metres exactly, defined as one minute of latitude, which is why it is the unit at sea and in the air rather than out of tradition: a degree of latitude is sixty of them anywhere on the globe.",
    methodology: TABLE_ORACLE + " Unit tests assert the relations that must be exact: an inch is exactly 25.4 mm, a yard exactly three feet, a furlong exactly ten chains. Anything that must be exact is asserted as exact rather than to a tolerance.",
    rules: "Not rules-sensitive.",
    related: ["CON-005 Area Converter", "CON-006 Volume Converter", "CON-007 Speed Converter"]
  },

  "CON-003": {
    purpose: "Convert a mass between metric, avoirdupois and troy units.",
    scope: "Thirteen units from micrograms to imperial tons, including troy ounces and carats.",
    assumptions: ["The 1959 definition of the pound."],
    validation: ["An unknown unit is refused by name."],
    formula: "Value times the source unit's factor to kilograms, divided by the target unit's factor.",
    boundary: EXACT + " " + THROUGH_BASE + " " +
      "A UK TON AND A US TON ARE DIFFERENT WEIGHTS. The imperial ton is 2,240 pounds and the US short ton 2,000, over ten per cent apart, and neither is the metric tonne of 1,000 kilograms. All three are offered and all three are labelled. " +
      "A TROY OUNCE IS ABOUT TEN PER CENT HEAVIER than the ordinary avoirdupois ounce, which is why a quoted gold price is never in the same ounce as a kitchen scale. " +
      "Strictly these are MASSES rather than weights: weight is a force and changes with gravity, mass does not, and a kitchen scale reads mass.",
    methodology: TABLE_ORACLE + " Unit tests assert that a pound is exactly sixteen ounces, a stone exactly fourteen pounds, and that the three tons order correctly by size.",
    rules: "Not rules-sensitive.",
    related: ["CON-002 Length Converter", "SCI-005 Density Calculator"]
  },

  "CON-004": {
    purpose: "Convert a temperature between Celsius, Fahrenheit, Kelvin and Rankine.",
    scope: "The four scales in general use.",
    assumptions: ["None; the scales are defined exactly relative to one another."],
    validation: [
      "A temperature below absolute zero is REFUSED on every scale, with all three equivalent values quoted.",
      "An unknown scale is refused by name."
    ],
    formula: "Everything goes through Celsius, with the offset applied as well as the scale factor.",
    boundary: "TEMPERATURE IS NOT A MULTIPLICATION, which is what makes it different from every other converter here. Celsius and Fahrenheit are INTERVAL scales whose zeros are arbitrary, so a conversion needs an offset as well as a scale, and 'twice as hot' means nothing on either: 20 degrees Celsius is not twice as warm as 10. Kelvin and Rankine are RATIO scales with a true zero, and only on those does doubling the number double the thermal energy. " +
      "ABSOLUTE ZERO IS A FLOOR and a value below it is refused rather than converted, because it does not describe anything. Minus 273.15 Celsius, 0 kelvin and minus 459.67 Fahrenheit are the same point. " +
      "The two everyday scales cross at MINUS FORTY, where both read the same number, which is a useful check on any conversion and is asserted directly.",
    methodology: "The oracle writes the scale factor as 1.8 rather than as nine fifths and derives Rankine directly rather than through Fahrenheit, so the two implementations share no expression. Unit tests pin the fixed points, the crossing at minus forty, the absolute zero refusals on all four scales, and the fact that doubling a Celsius figure does not double the corresponding Fahrenheit one.",
    rules: "Not rules-sensitive.",
    related: ["SCI-008 Heat Index Calculator", "SCI-010 Dew Point Calculator"]
  },

  "CON-005": {
    purpose: "Convert an area between metric and imperial units.",
    scope: "Ten units from square millimetres to square miles, including hectares and acres.",
    assumptions: ["Areas derived by squaring the corresponding length definitions."],
    validation: ["An unknown unit is refused by name."],
    formula: "Value times the source unit's factor to square metres, divided by the target unit's factor.",
    boundary: "AREA FACTORS ARE THE SQUARE OF LENGTH FACTORS, which is exactly why they defeat intuition. A yard is three feet, but a square yard is NINE square feet, and doubling a room's dimensions quadruples its floor. Estimating materials from a remembered length factor is the commonest way a quantity comes out three times too small. " +
      "AN ACRE IS NOT A SQUARE. It is 4,840 square yards, historically the area a team of oxen could plough in a day, so it is a long thin shape in origin and has no neat side length. A hectare is 10,000 square metres and is about two and a half acres. A square mile is exactly 640 acres. " + THROUGH_BASE,
    methodology: TABLE_ORACLE + " A unit test asserts directly that the area factor between two units is the SQUARE of the length factor between the same two, which catches a table entry that squared the wrong thing.",
    rules: "Not rules-sensitive.",
    related: ["CON-002 Length Converter", "HOM-003 Tile Calculator"]
  },

  "CON-006": {
    purpose: "Convert a volume between metric, UK imperial and US customary measures.",
    scope: "Fifteen units, with UK and US pints, quarts, gallons and fluid ounces all held separately.",
    assumptions: ["The UK gallon of 4.54609 litres and the US gallon of 231 cubic inches."],
    validation: ["An unknown unit is refused by name."],
    formula: "Value times the source unit's factor to litres, divided by the target unit's factor.",
    boundary: "UK AND US LIQUID MEASURES SHARE THEIR NAMES AND NOT THEIR SIZES, and this is the single most common source of error in a converted recipe. A UK pint is 568 ml and a US pint 473, a fifth smaller. A UK gallon is 4.546 litres and a US gallon 3.785. " +
      "THE FLUID OUNCE DIFFERS THE OTHER WAY: the UK ounce is slightly SMALLER, which is why a UK pint holds 20 fluid ounces and a US pint only 16. So a US pint is smaller than a UK pint while a US ounce is larger than a UK ounce, and anyone reasoning from one to the other goes wrong twice. Both families are offered, always labelled, and never silently defaulted. " + THROUGH_BASE,
    methodology: TABLE_ORACLE + " The US gallon is derived in the oracle from 231 CUBIC INCHES rather than taken as a decimal, so the table entry is checked against its definition. Unit tests assert the 8 pints to a UK gallon, the 20 and 16 fluid ounces respectively, and that the pint and ounce comparisons genuinely run in opposite directions.",
    rules: "Not rules-sensitive.",
    related: ["CON-003 Weight Converter", "AUT-007 Fuel Economy Calculator"]
  },

  "CON-007": {
    purpose: "Convert a speed between metric, imperial, nautical and Mach.",
    scope: "Six units including knots and Mach at sea level.",
    assumptions: ["A sea-level standard speed of sound for Mach."],
    validation: ["An unknown unit is refused by name."],
    formula: "Value times the source unit's factor to metres per second, divided by the target unit's factor.",
    boundary: "A KNOT IS ONE NAUTICAL MILE AN HOUR, and a nautical mile is one minute of latitude, which is why knots are used at sea and in the air: a speed in knots converts directly into degrees of latitude covered. " +
      "MACH IS NOT A FIXED SPEED. It is the ratio to the LOCAL speed of sound, which falls with temperature and therefore with altitude: roughly 1,225 km/h at sea level against about 1,062 at cruising height. The figure used here is a sea-level standard and is an approximation in a way none of the other units in this converter are, which is why it is said rather than assumed. " + THROUGH_BASE,
    methodology: TABLE_ORACLE + " A unit test asserts that ten metres a second is exactly 36 kilometres an hour, which is checkable by inspection and pins the seconds-to-hours handling.",
    rules: "Not rules-sensitive.",
    related: ["CON-002 Length Converter"]
  },

  "CON-008": {
    purpose: "Convert fuel economy between the units that run in opposite directions.",
    scope: "Imperial and US miles per gallon, litres per 100 km, kilometres per litre and miles per litre.",
    assumptions: ["The imperial and US gallon definitions."],
    validation: [
      "A zero or negative economy is refused in any unit.",
      "An economy beyond any vehicle is refused, which usually means the unit was chosen wrongly.",
      "An unknown unit is refused by name."
    ],
    formula: "Everything goes through kilometres per litre. Litres per 100 km enters and leaves as a RECIPROCAL rather than a multiple.",
    boundary: "THESE UNITS RUN IN TWO OPPOSITE DIRECTIONS. Miles per gallon, kilometres per litre and miles per litre are distance per fuel, so higher is better. Litres per 100 km is fuel per distance, so LOWER is better. Converting between the families is a reciprocal, and treating it as a multiplication is not an inaccuracy but a category error that ranks two cars the wrong way round. " +
      "A CONSEQUENCE THAT SURPRISES PEOPLE: equal steps in mpg are not equal savings. Going from 20 to 25 mpg saves several times more fuel over the same distance than going from 40 to 45, because the saving lives in the reciprocal. That is why litres per 100 km is the better unit for comparing running costs, and why replacing an old thirsty car saves more than upgrading an efficient one. Three benchmark cases at 20, 25 and 45 mpg sit in the fixtures so the effect is visible there, and a unit test asserts it directly.",
    methodology: "The oracle routes everything through LITRES PER MILE, a unit the engine never uses, and derives the US gallon from 231 cubic inches. A unit test asserts the invariant that mpg times litres per 100 km is the same constant for every car, which is the algebraic signature of a reciprocal relationship.",
    rules: "Not rules-sensitive.",
    related: ["AUT-007 Fuel Economy Calculator", "CON-006 Volume Converter"]
  },

  "CON-009": {
    purpose: "Convert a shoe size between UK, US and continental sizing, and to a foot length.",
    scope: "Adult men's and women's sizes, or a measured foot length.",
    assumptions: [
      "UK and US sizing in barleycorns, a third of an inch, from a four inch child zero.",
      "Continental sizing in Paris points, two thirds of a centimetre, measured on the last.",
      "A last allowance of about 15 mm between the shoe and the foot inside it."
    ],
    validation: ["A size outside the adult range is refused, with a note that the system may have been chosen wrongly."],
    formula: "Everything goes through a UK size, then to a last length and a foot length; continental sizes are derived from the last rather than from the foot.",
    boundary: "THESE ARE CONVENTIONS, NOT MEASUREMENTS, and the conventions genuinely disagree. UK and US sizes both run in barleycorns but from different starting points, and the men's and women's scales are offset from each other by DIFFERENT amounts: US men's runs one size above UK, US women's two. Continental sizing runs in Paris points and does not divide the same way, so many conversions land between whole sizes. " +
      "THE FOOT LENGTH IS THE ONLY FIGURE THAT MEANS ANYTHING ACROSS BRANDS, which is why it is reported and why the result carries an explicit warning that the conversion is approximate. Manufacturers differ from one another by up to a full size in either direction, and a size that fits in one brand routinely does not in another. Measure the foot standing, in the afternoon when it is at its largest, and treat the size numbers as a starting point rather than an answer.",
    methodology: "The oracle computes entirely in INCHES and converts to millimetres only at the end, the opposite way round from the engine. THE ORACLE CAUGHT AN OFF-BY-ONE HERE during construction: the adult scale continues from child size 13, not 12, and taking the wrong one shifts every adult size by a third of an inch and lands UK 9 on EU 42 rather than the correct 43. Unit tests now assert five conversions against published tables, that every system round-trips back to the same UK size, and that the men's and women's US offsets differ while the underlying foot length does not.",
    rules: "Not rules-sensitive.",
    related: ["CON-002 Length Converter"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
