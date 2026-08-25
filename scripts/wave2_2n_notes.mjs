/**
 * Narrative specification sections for Wave 2 tranche 2N, Science & Engineering.
 * Run: node scripts/wave2_2n_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const SOLVE_ANY_TWO =
  'The quantities are related, so ANY TWO determine the rest. Enter the two you know and leave the others blank. Supplying more than the minimum is treated as a CONSISTENCY CHECK: a contradiction is reported and named rather than quietly resolved by preferring whichever pair the code happened to read first, because a user who mistypes a figure should be told rather than handed a confident answer built on the typo.';

const SIG_FIGURES =
  'Physical results are rounded to significant figures rather than to a fixed number of decimals. A fixed-decimal round is wrong for quantities that span orders of magnitude: the volume of a 127 cubic centimetre object is 0.000127389 cubic metres, which a six-decimal round reduces to three significant figures, and a resistivity of two hundredths of a microhm metre rounds to zero outright.';

Object.assign(notes, {

  "SCI-001": {
    purpose: "Relate voltage, current, resistance and power, solving for whichever are unknown.",
    scope: "Any two of the four quantities, for a resistive load at a steady direct current.",
    assumptions: ["A purely resistive load.", "Direct current, or alternating current at unity power factor."],
    validation: [
      "Fewer than two known quantities is refused, because one determines nothing.",
      "Negative values are refused.",
      "A zero where a division would follow is refused with an explanation rather than returning infinity."
    ],
    formula: "Voltage equals current times resistance; power equals voltage times current, and follows from either of the other two.",
    boundary: "THESE RELATIONS HOLD FOR A RESISTIVE LOAD. With alternating current and a reactive load, such as a motor or a fluorescent fitting, real power is voltage times current times the POWER FACTOR, and the simple product overstates it. A power factor of 0.8 means the supply carries a quarter more current than the power alone suggests, which is why industrial tariffs charge for it. " + SOLVE_ANY_TWO,
    methodology: "The oracle resolves everything through CONDUCTANCE, the reciprocal of resistance, rather than through resistance itself, so a reciprocal taken in the wrong place on either side would separate the two rather than cancelling out. Every one of the six possible input pairs is benchmarked, and a unit test asserts they all give the same answer.",
    rules: "Not rules-sensitive.",
    related: ["SCI-002 Voltage Drop", "SCI-003 Electricity Calculator"]
  },

  "SCI-002": {
    purpose: "Check the voltage lost along a cable run against the limits BS 7671 sets.",
    scope: "A design current, a run length, a conductor size and material, a supply system and an operating temperature.",
    assumptions: [
      "A resistive calculation, which is what the standard's own method reduces to for smaller cables.",
      "A balanced load on a three-phase circuit."
    ],
    validation: [
      "Currents, lengths and conductor sizes beyond any real installation are refused rather than answered.",
      "The operating temperature must be between -50 and 250 degrees Celsius."
    ],
    formula: "The drop is the system factor times the one-way conductor resistance times the current, where the resistance uses a resistivity corrected to the operating temperature.",
    boundary: "THE SYSTEM FACTOR IS 2 FOR DC AND SINGLE-PHASE, ROOT THREE FOR THREE-PHASE. The current goes out along one conductor and back along another, which is where the 2 comes from; a balanced three-phase circuit measured line to line uses the square root of three instead. Using 2 for three phase overstates the drop by about fifteen per cent and is the commonest error in a hand calculation. " +
      "RESISTIVITY RISES WITH TEMPERATURE, by about a fifth between 20 and 70 degrees for copper, so calculating at ambient flatters every design; the operating temperature is an explicit input for that reason. " +
      "ABOVE ABOUT 25 SQUARE MILLIMETRES the cable's inductive reactance becomes a material part of the drop and this resistive figure reads low; the calculator says so rather than being silently optimistic, and points to the tabulated millivolt per amp per metre values. " +
      "This is a CHECK, NOT A COMPLIANCE CERTIFICATE. A real design must consult the standard and must also satisfy current-carrying capacity, earth fault loop impedance and disconnection times, none of which this addresses.",
    methodology: "The oracle computes the conductor resistance in ohm millimetres squared per metre, a different unit chain from the engine's ohm metres and square metres, and cross-checks that against a thousand-segment summation along the run before emitting each case. Benchmarks include the same cable at 20 and at 70 degrees so the temperature correction is pinned, and a failing case whose reported maximum length is then fed back in and asserted to pass.",
    rules: "Rules-sensitive. Resistivities, temperature coefficients and the BS 7671 percentages are held in the versioned ruleset. The source register records that BS 7671 is a copyrighted standard which cannot be quoted from a free primary source, that the figures were checked across several independent UK trade sources agreeing on both the percentages and the regulation reference, and that higher drops may be permitted where the supply is the client's own rather than a public one.",
    related: ["SCI-001 Ohm's Law"]
  },

  "SCI-003": {
    purpose: "Cost running an appliance, separating the energy from the standing charge.",
    scope: "An appliance power, a usage pattern, a unit rate and a standing charge.",
    assumptions: ["The appliance draws its rated power for the whole time it is on."],
    validation: [
      "Hours a day must be between 0 and 24.",
      "A power beyond a domestic supply is refused.",
      "Negative prices are refused."
    ],
    formula: "Energy is power times hours; the bill is energy at the unit rate plus the standing charge for each day.",
    boundary: "THE STANDING CHARGE IS SHOWN SEPARATELY AND AS A SHARE OF THE TOTAL, because it is paid whether or not the appliance runs. Folding it into the unit rate makes a rarely-used appliance look far more expensive than it is: on a five watt standby load it is over ninety per cent of the bill, and a comparison that hid it would be meaningless. " +
      "THE RATED POWER IS A MAXIMUM, NOT AN AVERAGE. A fridge, a washing machine, an oven or anything thermostatically controlled draws its rated power only part of the time, so a plug-in energy monitor will read lower than this. The rate and standing charge are entered from your own bill rather than assumed, because they differ by supplier, tariff, payment method and region, and any figure hard-coded today would be wrong within months.",
    methodology: "The oracle accumulates cost one day at a time rather than multiplying out. A standby-load case exists specifically to make the standing charge dominate, and a zero-standing-charge case pins the boundary where the total must equal the energy cost exactly.",
    rules: "Not rules-sensitive. Energy prices are deliberately NOT held in the ruleset: they change quarterly and vary by region and tariff, so a stored figure would be a stale one.",
    related: ["SCI-011 BTU Calculator", "SCI-001 Ohm's Law"]
  },

  "SCI-004": {
    purpose: "Decode a resistor's colour bands, or combine resistors in series and parallel.",
    scope: "Three to six colour bands, or a list of resistances.",
    assumptions: ["Standard IEC colour coding."],
    validation: [
      "A colour that cannot appear in a given band position is refused BY NAME, so a mistake names the band rather than producing a wrong value.",
      "Fewer than three or more than six bands is refused.",
      "A non-numeric or non-positive resistance in a network is refused."
    ],
    formula: "The digit bands give a number, the multiplier band scales it, the tolerance band gives the spread. In series resistances add; in parallel their reciprocals add.",
    boundary: "READ THE BANDS FROM THE END WHERE THEY ARE CLOSEST TOGETHER. A resistor read backwards gives a completely different and entirely plausible value: yellow-violet-red is 4.7 kilohms and the same resistor reversed reads 270 kilohms. Both look like real resistors, which is why the mistake survives. " +
      "GOLD AND SILVER MEAN DIFFERENT THINGS IN DIFFERENT POSITIONS: in the multiplier band they DIVIDE, by ten and a hundred, while in the tolerance band they mean five and ten per cent. " +
      "THE TOLERANCE IS NOT DECORATION. A 4.7 kilohm resistor at five per cent is anywhere between 4,465 and 4,935 ohms, and both ends are reported. A resistor with no tolerance band at all is plus or minus twenty per cent. " +
      "Two useful checks on a network: a series total is always LARGER than the largest member, and a parallel total always SMALLER than the smallest.",
    methodology: "The oracle re-types the colour table and builds the value by explicit place-value addition rather than by accumulating digits, and combines parallel resistances by repeated pairwise product-over-sum rather than by summing reciprocals. A gold-multiplier case exists because a table conflating the multiplier and tolerance meanings of gold would fail there and nowhere else, and a reversed-resistor unit test asserts the two readings genuinely differ.",
    rules: "Not rules-sensitive.",
    related: ["SCI-001 Ohm's Law"]
  },

  "SCI-005": {
    purpose: "Relate mass, volume and density in whichever units are to hand.",
    scope: "Any two of mass, volume and density, across metric and imperial units.",
    assumptions: ["A uniform material at one temperature."],
    validation: [
      "An unknown unit is refused by name.",
      "Fewer than two known quantities is refused.",
      "A zero volume is refused, because dividing by it is the whole calculation."
    ],
    formula: "Density is mass divided by volume, rearranged for whichever quantity is unknown.",
    boundary: "THE FIGURE RELATIVE TO WATER IS THE SPECIFIC GRAVITY, and it is what decides flotation: below 1 an object floats in fresh water and above it it sinks. Sea water is denser at about 1.025, so a narrow band of materials floats in the sea and sinks in a lake. Density also changes with temperature, and for gases with pressure, so a single figure describes one set of conditions rather than a material. " + SOLVE_ANY_TWO + " " + SIG_FIGURES,
    methodology: "The oracle converts through grams and cubic centimetres rather than the engine's kilograms and cubic metres, so a factor of a thousand dropped on either side would separate them. A litre of water pins the definition and a case just under water density pins the flotation boundary from below.",
    rules: "Not rules-sensitive.",
    related: ["SCI-006 Molarity Calculator", "SCI-007 Molecular Weight Calculator"]
  },

  "SCI-006": {
    purpose: "Relate concentration, moles and volume, and work out a dilution.",
    scope: "Any two of concentration, moles and volume, with a mass and molar mass able to stand in for the moles.",
    assumptions: ["Volumes are additive, which is close enough for dilute aqueous solutions."],
    validation: [
      "Fewer than two known quantities is refused.",
      "A target concentration above the stock is refused, because dilution cannot concentrate.",
      "A zero or negative molar mass or volume is refused."
    ],
    formula: "Concentration is moles per litre. Moles may come from a mass divided by a molar mass. A dilution conserves the amount of solute, so concentration times volume is unchanged.",
    boundary: "A MASS AND A MOLAR MASS STAND IN FOR THE MOLES, because that is how the calculation is actually done at a bench: nobody counts moles, they weigh a solid. " +
      "THE DILUTION FIGURE IS THE FINAL VOLUME, and the solvent to add is the difference. Making up TO a mark is not the same as adding that much solvent, and confusing the two is the usual reason a dilution comes out wrong. Concentrating a solution by diluting it is impossible, so a target above the stock is refused rather than answered with a negative volume. Volumes are also not perfectly additive in concentrated solutions, so a serious preparation is made up to volume rather than by adding a calculated amount of solvent.",
    methodology: "The oracle works in millimoles per millilitre, numerically identical to moles per litre but on a different scale, so a factor of a thousand lost anywhere would show rather than cancel. A unit test asserts that the amount of solute is conserved across a dilution, which is the defining property.",
    rules: "Not rules-sensitive.",
    related: ["SCI-007 Molecular Weight Calculator", "SCI-005 Density Calculator"]
  },

  "SCI-007": {
    purpose: "Work out a molar mass from a chemical formula, with a per-element breakdown.",
    scope: "A formula with element symbols, subscripts, nested brackets and hydrates.",
    assumptions: ["IUPAC conventional atomic weights, which average over normal terrestrial isotopic composition."],
    validation: [
      "An element with no standard atomic weight is REFUSED BY NAME rather than skipped.",
      "Unbalanced brackets are refused in either direction.",
      "Characters that cannot appear in a formula are refused.",
      "A formula longer than 200 characters is refused."
    ],
    formula: "The parser expands brackets and hydrates into element counts, which are multiplied by atomic weights and summed.",
    boundary: "AN UNKNOWN ELEMENT IS REFUSED, NOT SKIPPED. A skipped element silently understates the molar mass and the answer still looks like a number, which is the worst possible failure for a calculator: wrong and confident. " +
      "A HYDRATE'S WATERS ARE ADDED ON TOP of the anhydrous formula, so copper sulfate pentahydrate has nine oxygens, four from the sulfate and five from the water, not four. " +
      "The weights are CONVENTIONAL VALUES averaged over normal terrestrial isotopic composition, so a sample enriched or depleted in an isotope, as heavy water is, has a different molar mass from the one shown.",
    methodology: "The element counts in every benchmark case were WORKED OUT BY HAND and written into the case, then multiplied by atomic weights re-typed in the oracle. The parser is therefore checked against a human reading of the formula rather than against another parser, which is the only check worth making on a parser. Unit tests additionally assert published molar masses for seven common compounds, that a pentahydrate equals the anhydrous salt plus five waters exactly, and that the mass percentages sum to a hundred.",
    rules: "Rules-sensitive. The atomic weights live in the versioned ruleset with a source-register entry recording that conventional rather than interval values are used, because a calculator must return a single number.",
    related: ["SCI-006 Molarity Calculator"]
  },

  "SCI-008": {
    purpose: "Say how hot it feels, combining temperature and humidity.",
    scope: "An air temperature and a relative humidity.",
    assumptions: ["Shade and a light wind, which is what the index is defined for."],
    validation: [
      "Humidity outside 0 to 100 per cent is refused.",
      "Temperatures outside -60 to 60 degrees Celsius are refused."
    ],
    formula: "The US National Weather Service algorithm: a simple formula is applied first, and only if its average with the temperature reaches 80 Fahrenheit is the Rothfusz regression used, with separate adjustments at very low and very high humidity.",
    boundary: "THE SCREENING STEP IS PART OF THE ALGORITHM AND MOST REIMPLEMENTATIONS OMIT IT. Applying the regression unconditionally gives badly wrong answers in mild conditions, which is most of the British year, so the simple formula is tried first exactly as the NWS specifies. " +
      "IN DRY HEAT THE INDEX SITS BELOW THE AIR TEMPERATURE, and that is correct rather than a bug: sweat evaporates freely in dry air and that is the whole mechanism the index describes. An implementation that clamped it to never fall below the air temperature would be overriding correct physics. " +
      "THE INDEX ASSUMES SHADE. In full sun it can understate the effective temperature by as much as 15 Fahrenheit, so a reading that looks merely uncomfortable can be dangerous on an exposed site. It is a guide to risk rather than a medical assessment, and individual tolerance varies widely with age, medication, acclimatisation and fitness.",
    methodology: "The coefficients are re-typed from the NWS publication and the screening step reproduced exactly, with mild and cool benchmark cases present specifically to catch an unconditional regression. The only external value asserted is the NWS's own worked example, that 96 Fahrenheit at 65 per cent humidity gives 121; values remembered from the published chart image are deliberately not used, because asserting recalled chart cells would test recall rather than the implementation. Monotonicity in both temperature and humidity is asserted separately, which needs no external table at all.",
    rules: "Not rules-sensitive.",
    related: ["SCI-010 Dew Point Calculator", "SCI-009 Wind Chill Calculator"]
  },

  "SCI-009": {
    purpose: "Say how cold it feels in wind.",
    scope: "An air temperature at or below 10 degrees Celsius and a wind speed above 4.8 km/h.",
    assumptions: ["Bare skin, no sunshine, at about face height."],
    validation: [
      "A temperature above 10 degrees is REFUSED, because the index is not defined there.",
      "A wind speed at or below 4.8 km/h is REFUSED, because the formula then reads warmer than the air.",
      "Speeds above 200 km/h are refused as outside the range the index was fitted over."
    ],
    formula: "The 2001 JAG/TI wind chill index, in its published metric form.",
    boundary: "THE DOMAIN IS PART OF THE DEFINITION AND IS ENFORCED. Outside it the formula returns confident nonsense: in still air it reads warmer than the actual temperature. Refusing and explaining is the only honest response, and it is what this calculator does. " +
      "WIND CHILL DESCRIBES HOW FAST EXPOSED SKIN LOSES HEAT, NOT HOW COLD ANYTHING GETS. A pipe, a car or a puddle will not freeze at a wind chill of minus five if the air is at plus two; only the rate of cooling changes, never the temperature things settle at. This is the single most common misunderstanding of the index and it matters practically, because people lag pipes against a wind chill that cannot freeze them. The index also assumes bare skin and no sun, so clothing and sunshine both make the felt cold less severe than the number suggests.",
    methodology: "The metric coefficients are re-typed from the published index. The imperial form is deliberately NOT used as the benchmark oracle: the two published forms are independently ROUNDED fits of the same model rather than exact transforms of one another, and they differ by up to about 0.03 degrees, so an oracle built on one would report the other as broken on every case. That cross-check is real and is asserted in a unit test with an explicit tolerance and an explanation of why exact agreement would be the wrong claim. A further test asserts that the index is always below the air temperature everywhere inside the valid domain.",
    rules: "Not rules-sensitive.",
    related: ["SCI-008 Heat Index Calculator", "SCI-010 Dew Point Calculator"]
  },

  "SCI-010": {
    purpose: "Convert between relative humidity and dew point, and say what condenses where.",
    scope: "An air temperature with either a relative humidity or a dew point.",
    assumptions: ["The Arden Buck relation for saturation vapour pressure over water."],
    validation: [
      "A dew point above the air temperature is refused, because it is impossible.",
      "Zero humidity is refused, because there is then no dew point.",
      "Temperatures outside -80 to 80 degrees Celsius are refused."
    ],
    formula: "Saturation vapour pressure follows the Arden Buck relation, and the dew point is recovered by inverting it EXACTLY, through the quadratic that the relation implies.",
    boundary: "THE DEW POINT, NOT THE RELATIVE HUMIDITY, IS WHAT YOU FEEL. Humidity is relative to temperature, so 70 per cent on a cold morning and 70 per cent on a warm afternoon describe completely different amounts of water; the dew point is absolute and directly comparable between days. It is also what decides CONDENSATION: any surface colder than the dew point will get wet, which is why cold-bridged walls and single-glazed windows stream while the room feels dry. Below zero it is properly a FROST POINT, with vapour depositing as frost rather than condensing as dew, and that is flagged when it applies.",
    methodology: "THE ORACLE FOUND A REAL DEFECT HERE, and the way it did is the argument for building oracles this way. The engine originally used the familiar one-line inversion, dew point equals C gamma over B minus gamma, which belongs to the simpler Magnus form and silently drops Buck's enhancement term. Against a Buck forward function that is inconsistent: the error grew with temperature, reaching about 0.15 degrees at 28 degrees and 80 per cent, and at saturation it failed the one identity that must hold exactly. The oracle, which bisects the saturation curve rather than inverting it algebraically, disagreed on four cases and the engine was corrected to invert the relation exactly through its implied quadratic. A unit test now asserts that at 100 per cent humidity the dew point equals the air temperature to within a millionth of a degree, at six different temperatures, and a second asserts the two directions are exact inverses.",
    rules: "Not rules-sensitive.",
    related: ["SCI-008 Heat Index Calculator", "SCI-009 Wind Chill Calculator"]
  },

  "SCI-011": {
    purpose: "Estimate the heat a room needs, in the units radiators, boilers and gas bills each use.",
    scope: "Room dimensions and a heat requirement per cubic metre.",
    assumptions: ["A single uniform space."],
    validation: [
      "Dimensions beyond a domestic or small commercial space are refused.",
      "A factor above 500 watts per cubic metre is refused as beyond any real building.",
      "A negative fuel price is refused."
    ],
    formula: "Volume times the watts-per-cubic-metre factor gives a power, which converts to BTU per hour and therms per hour through joules.",
    boundary: "THE FACTOR IS YOURS TO SET AND THIS CALCULATOR DOES NOT INVENT ONE. Heat loss depends on insulation, glazing, how many walls face outside and how draughty a room is, and the published rules of thumb differ FOURFOLD between a modern insulated room at around 25 watts per cubic metre and a conservatory at around 100. Publishing a single factor as though it were authoritative would be a guess wearing the costume of a calculation. A proper heat loss calculation follows a method such as BS EN 12831 and works room by room from fabric U-values and air change rates; this is a sizing estimate, not that. " +
      "BTU PER HOUR IS A RATE OF HEAT OUTPUT, NOT A QUANTITY OF ENERGY, which is why radiators are sold in it while gas is billed in therms. The BTU used is the International Table definition, the one behind UK gas billing; a therm is exactly a hundred thousand of them.",
    methodology: "The oracle routes energy through joules explicitly rather than through a BTU-per-hour factor, so a constant taken from the thermochemical rather than the International Table definition would show in the fourth significant figure. Unit tests assert that one kilowatt is 3,412 BTU an hour, that a therm is exactly a hundred thousand BTU, and that the requirement scales linearly with both volume and factor. The benchmark cases deliberately span 25 to 100 watts per cubic metre to make the spread visible.",
    rules: "Rules-sensitive for the energy conversion constants, which are held in the versioned ruleset with their definitions recorded.",
    related: ["SCI-003 Electricity Calculator"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
