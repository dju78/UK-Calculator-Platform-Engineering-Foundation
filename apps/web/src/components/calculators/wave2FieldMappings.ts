/**
 * Wave 2 field definitions.
 *
 * PERCENTAGE CONVENTION
 * ---------------------
 * Users always type human percentages (7.5 meaning 7.5%). Wave 2 engines take
 * that percentage directly and divide by 100 once, inside the engine core, so
 * these fields carry no `scale`. Wave 1 instead normalised at the UI boundary
 * with `scale: 0.01`. Both normalise exactly once, which is what matters; the
 * Wave 2 arrangement keeps the single conversion in one place per engine and
 * makes the benchmark fixtures read in the same units the user types.
 */
import type { FieldDef } from "./fieldTypes";

const YES_NO = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" }
];

/**
 * Income-tax jurisdiction. The same two values Wave 1 uses, so a user moving
 * between a Wave 1 and a Wave 2 tax calculator never sees the wording change.
 */
const TAX_JURISDICTION = [
  { label: "England/Wales/NI", value: "England/Wales/NI" },
  { label: "Scotland", value: "Scotland" }
];

const STUDENT_PLAN = [
  { label: "None", value: "None" },
  { label: "Plan 1", value: "Plan 1" },
  { label: "Plan 2", value: "Plan 2" },
  { label: "Plan 4", value: "Plan 4" },
  { label: "Plan 5", value: "Plan 5" }
];

const ADD_SUBTRACT = [
  { label: "Add", value: "add" },
  { label: "Subtract", value: "subtract" }
];

const UK_DIVISION = [
  { label: "England and Wales", value: "england-and-wales" },
  { label: "Scotland", value: "scotland" },
  { label: "Northern Ireland", value: "northern-ireland" }
];

const DISTANCE_UNIT = [
  { label: "Miles", value: "miles" },
  { label: "Kilometres", value: "km" }
];

const FUEL_UNIT = [
  { label: "Litres", value: "litres" },
  { label: "Imperial gallons (UK)", value: "imperial_gallons" },
  { label: "US gallons", value: "us_gallons" }
];

const VEHICLE_TYPE = [
  { label: "Car or van", value: "car_or_van" },
  { label: "Motorcycle", value: "motorcycle" },
  { label: "Bicycle", value: "bicycle" }
];

const TORQUE_UNIT = [
  { label: "Pound-feet (lb ft)", value: "lb_ft" },
  { label: "Newton metres (Nm)", value: "nm" }
];

const POWER_METHOD = [
  { label: "From torque and engine speed", value: "torque" },
  { label: "Estimate from quarter-mile trap speed", value: "trap_speed" },
  { label: "Estimate from quarter-mile elapsed time", value: "elapsed_time" }
];

const CONDUCTOR = [
  { label: "Copper", value: "copper" },
  { label: "Aluminium", value: "aluminium" }
];

const SUPPLY_SYSTEM = [
  { label: "Single-phase AC (230 V)", value: "single_phase" },
  { label: "Three-phase AC (400 V)", value: "three_phase" },
  { label: "Direct current", value: "dc" }
];

const CIRCUIT_USE = [
  { label: "Lighting (3% limit)", value: "lighting" },
  { label: "Other circuits (5% limit)", value: "other" }
];

const RESISTOR_MODE = [
  { label: "Decode colour bands", value: "colour_code" },
  { label: "Combine resistors in series or parallel", value: "network" }
];

const BAND_COLOURS = [
  { label: "Black", value: "black" },
  { label: "Brown", value: "brown" },
  { label: "Red", value: "red" },
  { label: "Orange", value: "orange" },
  { label: "Yellow", value: "yellow" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue" },
  { label: "Violet", value: "violet" },
  { label: "Grey", value: "grey" },
  { label: "White", value: "white" }
];

/**
 * Bands three, four and five each mean different things depending on how many
 * bands the resistor has: on a four-band resistor band three is the multiplier
 * and band four the tolerance, while on a five-band resistor band three is a
 * third DIGIT and band four the multiplier. Offering a position-specific list
 * therefore makes five- and six-band resistors impossible to enter, which is
 * exactly what the parity harness caught.
 *
 * These positions offer the full set instead, and the engine validates by
 * position, refusing an impossible colour BY NAME with a message that says
 * which colours that band accepts. Validation in one place beats a dropdown
 * that silently forbids a legitimate resistor.
 */
const ANY_BAND_COLOUR = [
  { label: "None", value: "none" },
  ...BAND_COLOURS,
  { label: "Gold (×0.1 as a multiplier, ±5% as a tolerance)", value: "gold" },
  { label: "Silver (×0.01 as a multiplier, ±10% as a tolerance)", value: "silver" }
];

const TEMPCO_COLOURS = [
  { label: "None", value: "none" },
  { label: "Brown (100 ppm/K)", value: "brown" },
  { label: "Red (50 ppm/K)", value: "red" },
  { label: "Orange (15 ppm/K)", value: "orange" },
  { label: "Yellow (25 ppm/K)", value: "yellow" },
  { label: "Blue (10 ppm/K)", value: "blue" },
  { label: "Violet (5 ppm/K)", value: "violet" }
];

const MASS_UNIT = [
  { label: "Kilograms", value: "kg" },
  { label: "Grams", value: "g" },
  { label: "Milligrams", value: "mg" },
  { label: "Tonnes", value: "tonne" },
  { label: "Pounds", value: "lb" },
  { label: "Ounces", value: "oz" },
  { label: "Stone", value: "stone" }
];

const VOLUME_UNIT = [
  { label: "Cubic metres", value: "m3" },
  { label: "Cubic centimetres", value: "cm3" },
  { label: "Litres", value: "litre" },
  { label: "Millilitres", value: "ml" },
  { label: "Cubic feet", value: "ft3" },
  { label: "Cubic inches", value: "in3" },
  { label: "UK gallons", value: "uk_gallon" },
  { label: "US gallons", value: "us_gallon" }
];

const TEMPERATURE_UNIT = [
  { label: "Celsius", value: "c" },
  { label: "Fahrenheit", value: "f" }
];

const WIND_SPEED_UNIT = [
  { label: "km/h", value: "kmh" },
  { label: "mph", value: "mph" }
];

const CONCRETE_SHAPE = [
  { label: "Slab", value: "slab" },
  { label: "Footing or trench", value: "footing" },
  { label: "Round column", value: "column" },
  { label: "Steps", value: "steps" }
];

const CONCRETE_MIX = [
  { label: "1:2:4 — general purpose", value: "1:2:4" },
  { label: "1:1.5:3 — structural, higher strength", value: "1:1.5:3" },
  { label: "1:3:6 — lean, non-structural", value: "1:3:6" }
];

const ROOF_TYPE = [
  { label: "Gable (two slopes)", value: "gable" },
  { label: "Hip (four slopes)", value: "hip" },
  { label: "Lean-to (one slope)", value: "lean_to" }
];

const LENGTH_UNIT_OPTIONS = [
  { label: "Nanometre", value: "nanometre" },
  { label: "Micrometre", value: "micrometre" },
  { label: "Millimetre", value: "millimetre" },
  { label: "Centimetre", value: "centimetre" },
  { label: "Metre", value: "metre" },
  { label: "Kilometre", value: "kilometre" },
  { label: "Inch", value: "inch" },
  { label: "Foot", value: "foot" },
  { label: "Yard", value: "yard" },
  { label: "Chain", value: "chain" },
  { label: "Furlong", value: "furlong" },
  { label: "Mile", value: "mile" },
  { label: "Nautical Mile", value: "nautical_mile" },
  { label: "Thou", value: "thou" }
];

const MASS_UNIT_OPTIONS = [
  { label: "Microgram", value: "microgram" },
  { label: "Milligram", value: "milligram" },
  { label: "Gram", value: "gram" },
  { label: "Kilogram", value: "kilogram" },
  { label: "Tonne", value: "tonne" },
  { label: "Ounce", value: "ounce" },
  { label: "Pound", value: "pound" },
  { label: "Stone", value: "stone" },
  { label: "Hundredweight", value: "hundredweight" },
  { label: "Imperial Ton", value: "imperial_ton" },
  { label: "US Ton", value: "us_ton" },
  { label: "Troy Ounce", value: "troy_ounce" },
  { label: "Carat", value: "carat" }
];

const AREA_UNIT_OPTIONS = [
  { label: "Square Millimetre", value: "square_millimetre" },
  { label: "Square Centimetre", value: "square_centimetre" },
  { label: "Square Metre", value: "square_metre" },
  { label: "Hectare", value: "hectare" },
  { label: "Square Kilometre", value: "square_kilometre" },
  { label: "Square Inch", value: "square_inch" },
  { label: "Square Foot", value: "square_foot" },
  { label: "Square Yard", value: "square_yard" },
  { label: "Acre", value: "acre" },
  { label: "Square Mile", value: "square_mile" }
];

const VOLUME_UNIT_OPTIONS = [
  { label: "Millilitre", value: "millilitre" },
  { label: "Centilitre", value: "centilitre" },
  { label: "Litre", value: "litre" },
  { label: "Cubic Centimetre", value: "cubic_centimetre" },
  { label: "Cubic Metre", value: "cubic_metre" },
  { label: "Cubic Inch", value: "cubic_inch" },
  { label: "Cubic Foot", value: "cubic_foot" },
  { label: "UK Pint", value: "uk_pint" },
  { label: "UK Quart", value: "uk_quart" },
  { label: "UK Gallon", value: "uk_gallon" },
  { label: "UK Fluid Ounce", value: "uk_fluid_ounce" },
  { label: "US Pint", value: "us_pint" },
  { label: "US Quart", value: "us_quart" },
  { label: "US Gallon", value: "us_gallon" },
  { label: "US Fluid Ounce", value: "us_fluid_ounce" }
];

const SPEED_UNIT_OPTIONS = [
  { label: "Metres Per Second", value: "metres_per_second" },
  { label: "Kilometres Per Hour", value: "kilometres_per_hour" },
  { label: "Miles Per Hour", value: "miles_per_hour" },
  { label: "Feet Per Second", value: "feet_per_second" },
  { label: "Knot", value: "knot" },
  { label: "Mach", value: "mach" }
];

const TEMPERATURE_SCALE = [
  { label: "Celsius", value: "celsius" },
  { label: "Fahrenheit", value: "fahrenheit" },
  { label: "Kelvin", value: "kelvin" },
  { label: "Rankine", value: "rankine" }
];

const FUEL_ECONOMY_UNIT = [
  { label: "Miles per gallon (UK)", value: "mpg_imperial" },
  { label: "Miles per gallon (US)", value: "mpg_us" },
  { label: "Litres per 100 km", value: "litres_per_100km" },
  { label: "Kilometres per litre", value: "km_per_litre" },
  { label: "Miles per litre", value: "miles_per_litre" }
];

const SHOE_SYSTEM = [
  { label: "UK", value: "uk" },
  { label: "US", value: "us" },
  { label: "EU / Continental", value: "eu" },
  { label: "Foot length in mm", value: "foot_length_mm" }
];

const SHOE_GENDER = [
  { label: "Men's", value: "men" },
  { label: "Women's", value: "women" }
];

const DATA_SIZE_UNIT = [
  { label: "Bytes", value: "byte" },
  { label: "Kilobytes (1,000 bytes)", value: "kilobyte" },
  { label: "Megabytes (1,000,000 bytes)", value: "megabyte" },
  { label: "Gigabytes (decimal, as drives are sold)", value: "gigabyte" },
  { label: "Terabytes (decimal)", value: "terabyte" },
  { label: "Kibibytes (1,024 bytes)", value: "kibibyte" },
  { label: "Mebibytes (binary)", value: "mebibyte" },
  { label: "Gibibytes (binary, as an OS reports)", value: "gibibyte" },
  { label: "Tebibytes (binary)", value: "tebibyte" }
];

const CODEC_DIRECTION = [
  { label: "Encode", value: "encode" },
  { label: "Decode", value: "decode" }
];

const URL_ENCODE_MODE = [
  { label: "A single parameter value", value: "component" },
  { label: "A whole URL", value: "full_url" }
];

const LIVING_ARRANGEMENT = [
  { label: "Living at home with parents", value: "at_home" },
  { label: "Living away, outside London", value: "away_outside_london" },
  { label: "Living away, in London", value: "away_in_london" }
];

const SEX_OPTIONS = [
  { label: "Female", value: "female" },
  { label: "Male", value: "male" }
];

const ACTIVITY_LEVEL = [
  { label: "Sedentary: desk job, little exercise", value: "sedentary" },
  { label: "Lightly active: exercise 1 to 3 days a week", value: "light" },
  { label: "Moderately active: exercise 3 to 5 days a week", value: "moderate" },
  { label: "Very active: hard exercise 6 to 7 days a week", value: "very_active" },
  { label: "Extra active: physical job or twice-daily training", value: "extra_active" }
];

const WEIGHT_GOAL = [
  { label: "Maintain my weight", value: "maintain" },
  { label: "Lose weight", value: "lose" },
  { label: "Gain weight", value: "gain" }
];

const SLEEP_MODE = [
  { label: "I need to wake at a certain time", value: "wake_time" },
  { label: "I am going to bed now", value: "bedtime" }
];

const AREA_SHAPE = [
  { label: "Rectangle", value: "rectangle" },
  { label: "Square", value: "square" },
  { label: "Triangle", value: "triangle" },
  { label: "Circle", value: "circle" },
  { label: "Trapezium", value: "trapezium" },
  { label: "Parallelogram", value: "parallelogram" },
  { label: "Rhombus", value: "rhombus" },
  { label: "Ellipse", value: "ellipse" },
  { label: "Sector of a circle", value: "sector" }
];

const SOLID_SHAPE = [
  { label: "Cuboid", value: "cuboid" },
  { label: "Cube", value: "cube" },
  { label: "Sphere", value: "sphere" },
  { label: "Hemisphere", value: "hemisphere" },
  { label: "Cylinder", value: "cylinder" },
  { label: "Cone", value: "cone" },
  { label: "Square-based pyramid", value: "pyramid" },
  { label: "Triangular prism", value: "prism" }
];

const ROUNDING_MODE = [
  { label: "Half up (everyday rounding)", value: "half_up" },
  { label: "Half to even (banker's rounding)", value: "half_even" },
  { label: "Always up", value: "up" },
  { label: "Always down", value: "down" },
  { label: "Towards zero (truncate)", value: "towards_zero" }
];

const SEQUENCE_TYPE = [
  { label: "Arithmetic (add a fixed amount)", value: "arithmetic" },
  { label: "Geometric (multiply by a fixed amount)", value: "geometric" },
  { label: "Fibonacci (add the two before it)", value: "fibonacci" }
];

const MATRIX_OPERATION = [
  { label: "Multiply", value: "multiply" },
  { label: "Add", value: "add" },
  { label: "Subtract", value: "subtract" },
  { label: "Determinant", value: "determinant" },
  { label: "Inverse", value: "inverse" },
  { label: "Transpose", value: "transpose" }
];

const BASE_OPERATION = [
  { label: "Convert", value: "convert" },
  { label: "Add", value: "add" },
  { label: "Subtract", value: "subtract" },
  { label: "Multiply", value: "multiply" },
  { label: "Divide", value: "divide" }
];

const TEST_DISTRIBUTION = [
  { label: "Normal (z)", value: "z" },
  { label: "Student's t", value: "t" },
  { label: "Chi-square", value: "chi_square" },
  { label: "F", value: "f" }
];

const TAIL_TYPE = [
  { label: "Two-tailed", value: "two" },
  { label: "Right-tailed", value: "right" },
  { label: "Left-tailed", value: "left" }
];

const MEASURE_TYPE = [
  { label: "A proportion or percentage", value: "proportion" },
  { label: "A mean", value: "mean" }
];

const T_TEST_TYPE = [
  { label: "Two independent samples (equal variances)", value: "two_sample" },
  { label: "Two independent samples (Welch, unequal variances)", value: "welch" },
  { label: "Paired (before and after)", value: "paired" },
  { label: "One sample against a value", value: "one_sample" }
];

const CHI_SQUARE_TYPE = [
  { label: "Test of independence (contingency table)", value: "independence" },
  { label: "Goodness of fit", value: "goodness_of_fit" }
];

const DEPRECIATION_METHOD = [
  { label: "Straight line", value: "straight_line" },
  { label: "Reducing balance", value: "reducing_balance" },
  { label: "Sum of the years' digits", value: "sum_of_years_digits" },
  { label: "Units of production", value: "units_of_production" }
];

const CONTRIBUTION_BASIS = [
  { label: "Qualifying earnings (statutory band)", value: "qualifying_earnings" },
  { label: "Basic pay", value: "basic_pay" },
  { label: "Total pay", value: "total_pay" }
];

const RELIEF_ARRANGEMENT = [
  { label: "Relief at source", value: "relief_at_source" },
  { label: "Net pay arrangement", value: "net_pay" },
  { label: "Salary sacrifice", value: "salary_sacrifice" }
];

const LISA_PURPOSE = [
  { label: "Buying my first home", value: "first_home" },
  { label: "Withdrawing from age 60", value: "age_60" },
  { label: "Any other reason (25% charge applies)", value: "other" }
];

const PROPERTY_JURISDICTION = [
  { label: "England & Northern Ireland (SDLT)", value: "england_ni" },
  { label: "Scotland (LBTT)", value: "scotland" },
  { label: "Wales (LTT)", value: "wales" }
];

export const wave2Mappings: Record<string, FieldDef[]> = {
  // ------------------------------------------------- Finance & Debt --------
  "FIN-003": [
    { name: "amount", label: "Loan amount (£)", type: "number", defaultValue: 50000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 7.5, helperText: "Enter 7.5 for 7.5%." },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 5 },
    { name: "fee", label: "Arrangement fee (£)", type: "number", defaultValue: 0 },
    { name: "fee_financed", label: "Add the fee to the loan?", type: "select", defaultValue: "true", options: YES_NO, helperText: "Adding the fee to the loan means you pay interest on it." }
  ],
  "FIN-004": [
    { name: "amount", label: "Loan amount (£)", type: "number", defaultValue: 25000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 8.9, helperText: "Enter 8.9 for 8.9%." },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 10 },
    { name: "fee", label: "Arrangement fee (£)", type: "number", defaultValue: 0 },
    { name: "fee_financed", label: "Add the fee to the loan?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "property_value", label: "Property value (£)", type: "number", defaultValue: 350000, group: "Security" },
    { name: "existing_mortgage", label: "Existing mortgage balance (£)", type: "number", defaultValue: 180000, group: "Security" }
  ],
  "FIN-007": [
    { name: "principal", label: "Loan amount (£)", type: "number", defaultValue: 200000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5, helperText: "Enter 4.5 for 4.5%." },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 25 }
  ],
  "FIN-008": [
    { name: "gross_monthly_income", label: "Gross monthly income (£)", type: "number", defaultValue: 4000, helperText: "Your income before tax." },
    { name: "total_monthly_debt", label: "Total monthly debt payments (£)", type: "number", defaultValue: 600, helperText: "Include mortgage or rent, loans, cards and car finance." },
    { name: "housing_payment", label: "Of which housing (£)", type: "number", defaultValue: 400, helperText: "Used for the housing-only ratio. Leave blank to skip." }
  ],
  "FIN-010": [
    { name: "balance", label: "Card balance (£)", type: "number", defaultValue: 3000 },
    { name: "apr", label: "APR (%)", type: "number", defaultValue: 21.9, helperText: "Enter 21.9 for 21.9%." },
    { name: "monthly_payment", label: "Monthly payment (£)", type: "number", defaultValue: 150 },
    { name: "target_months", label: "Clear it within (months)", type: "number", defaultValue: "", helperText: "Optional. We work out the payment needed to hit this target." }
  ],
  "FIN-012": [
    { name: "debts", label: "Existing debts", type: "text", defaultValue: '[{"balance":3000,"apr":21.9,"monthly_payment":150},{"balance":5000,"apr":18.9,"monthly_payment":200}]', helperText: 'One entry per debt: balance, APR as a percentage, and monthly payment.' },
    { name: "consolidation_apr", label: "Consolidation loan APR (%)", type: "number", defaultValue: 9.9 },
    { name: "consolidation_years", label: "Consolidation term (years)", type: "number", defaultValue: 5 },
    { name: "fee", label: "Arrangement fee (£)", type: "number", defaultValue: 0 }
  ],
  "FIN-014": [
    { name: "monthly_essentials", label: "Monthly essential spending (£)", type: "number", defaultValue: 1800, helperText: "Rent or mortgage, bills, food, transport and other unavoidable costs." },
    { name: "months_of_cover", label: "Months of cover wanted", type: "number", defaultValue: 3 },
    { name: "current_savings", label: "Current savings (£)", type: "number", defaultValue: 1000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 250 }
  ],
  "FIN-015": [
    { name: "target", label: "Savings target (£)", type: "number", defaultValue: 30000 },
    { name: "months", label: "Months to save", type: "number", defaultValue: 60 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4, helperText: "Enter 4 for 4%." },
    { name: "starting_amount", label: "Starting amount (£)", type: "number", defaultValue: 0 }
  ],

  // ------------------------------------------- Mortgages & Property --------
  "PRO-005": [
    { name: "balance", label: "Outstanding balance (£)", type: "number", defaultValue: 180000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5 },
    { name: "remaining_years", label: "Remaining term (years)", type: "number", defaultValue: 20 },
    { name: "monthly_overpayment", label: "Monthly overpayment (£)", type: "number", defaultValue: 200, helperText: "Many lenders cap overpayments at 10% of the balance a year." }
  ],
  "PRO-006": [
    { name: "balance", label: "Outstanding balance (£)", type: "number", defaultValue: 200000 },
    { name: "current_rate", label: "Current rate (%)", type: "number", defaultValue: 5.5, group: "Current mortgage" },
    { name: "current_remaining_years", label: "Remaining term (years)", type: "number", defaultValue: 20, group: "Current mortgage" },
    { name: "new_rate", label: "New rate (%)", type: "number", defaultValue: 4.2, group: "New mortgage" },
    { name: "new_term_years", label: "New term (years)", type: "number", defaultValue: 20, group: "New mortgage" },
    { name: "fees", label: "Product and legal fees (£)", type: "number", defaultValue: 999, group: "New mortgage" }
  ],
  "PRO-007": [
    { name: "balance", label: "Mortgage balance (£)", type: "number", defaultValue: 200000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 25 }
  ],
  "PRO-009": [
    { name: "balance", label: "Mortgage balance (£)", type: "number", defaultValue: 200000 },
    { name: "current_rate", label: "Current rate (%)", type: "number", defaultValue: 4.5 },
    { name: "remaining_years", label: "Remaining term (years)", type: "number", defaultValue: 20 },
    { name: "rate_increase", label: "Rate rise to test (percentage points)", type: "number", defaultValue: 2, helperText: "Enter 2 to test a rise of two percentage points." },
    { name: "gross_monthly_income", label: "Gross monthly income (£)", type: "number", defaultValue: 4000, helperText: "Optional. Used to show the payment as a share of income." }
  ],
  "PRO-012": [
    { name: "property_value", label: "Property value (£)", type: "number", defaultValue: 350000 },
    { name: "mortgage_balance", label: "Mortgage balance (£)", type: "number", defaultValue: 180000 },
    { name: "max_ltv", label: "Maximum LTV (%)", type: "number", defaultValue: 85, helperText: "The highest loan-to-value you expect a lender to allow." }
  ],
  "PRO-014": [
    { name: "gross_monthly_income", label: "Gross monthly income (£)", type: "number", defaultValue: 3000 },
    { name: "income_multiple", label: "Income multiple required", type: "number", defaultValue: 30, helperText: "Agents commonly require annual income of 30x the monthly rent." },
    { name: "proposed_rent", label: "Proposed monthly rent (£)", type: "number", defaultValue: "", helperText: "Optional. Leave blank to see the maximum rent your income supports." },
    { name: "deposit_weeks", label: "Deposit (weeks of rent)", type: "number", defaultValue: 5, helperText: "Capped at five weeks in England where annual rent is under £50,000." }
  ],
  "PRO-015": [
    { name: "property_price", label: "Property price (£)", type: "number", defaultValue: 300000, group: "Buying" },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 60000, group: "Buying" },
    { name: "mortgage_rate", label: "Mortgage rate (%)", type: "number", defaultValue: 4.5, group: "Buying" },
    { name: "mortgage_years", label: "Mortgage term (years)", type: "number", defaultValue: 25, group: "Buying" },
    { name: "jurisdiction", label: "Where is the property?", type: "select", defaultValue: "england_ni", options: PROPERTY_JURISDICTION, group: "Buying" },
    { name: "first_time_buyer", label: "First-time buyer?", type: "select", defaultValue: "false", options: YES_NO, group: "Buying" },
    { name: "maintenance_pct", label: "Annual maintenance (% of value)", type: "number", defaultValue: 1, group: "Buying" },
    { name: "property_growth", label: "Annual property growth (%)", type: "number", defaultValue: 3, group: "Buying" },
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1200, group: "Renting" },
    { name: "rent_increase", label: "Annual rent increase (%)", type: "number", defaultValue: 2, group: "Renting" },
    { name: "investment_return", label: "Return on invested deposit (%)", type: "number", defaultValue: 5, group: "Renting", helperText: "If you rent, the deposit stays invested instead." },
    { name: "years_held", label: "Years to compare", type: "number", defaultValue: 10 }
  ],
  "PRO-017": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 250000 },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 75000 },
    { name: "jurisdiction", label: "Where is the property?", type: "select", defaultValue: "england_ni", options: PROPERTY_JURISDICTION },
    { name: "mortgage_rate", label: "Mortgage rate (%)", type: "number", defaultValue: 4.5, group: "Mortgage" },
    { name: "mortgage_years", label: "Mortgage term (years)", type: "number", defaultValue: 25, group: "Mortgage" },
    { name: "interest_only", label: "Interest-only?", type: "select", defaultValue: "true", options: YES_NO, group: "Mortgage" },
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1300, group: "Income and costs" },
    { name: "vacancy", label: "Vacancy allowance (%)", type: "number", defaultValue: 5, group: "Income and costs" },
    { name: "annual_costs", label: "Annual running costs (£)", type: "number", defaultValue: 3000, group: "Income and costs" },
    { name: "other_purchase_costs", label: "Other purchase costs (£)", type: "number", defaultValue: 2000, group: "Income and costs" }
  ],
  "PRO-020": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 250000, group: "Property" },
    { name: "deposit", label: "Deposit (£)", type: "number", defaultValue: 62500, group: "Property" },
    { name: "jurisdiction", label: "Where is the property?", type: "select", defaultValue: "england_ni", options: PROPERTY_JURISDICTION, group: "Property" },
    { name: "other_purchase_costs", label: "Other purchase costs (£)", type: "number", defaultValue: 2000, group: "Property" },
    { name: "mortgage_rate", label: "Mortgage rate (%)", type: "number", defaultValue: 4.5, group: "Property" },
    { name: "mortgage_years", label: "Mortgage term (years)", type: "number", defaultValue: 25, group: "Property" },
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1200, group: "Property" },
    { name: "annual_costs", label: "Annual running costs (£)", type: "number", defaultValue: 3000, group: "Property" },
    { name: "property_growth", label: "Annual property growth (%)", type: "number", defaultValue: 3, group: "Property" },
    { name: "stock_return", label: "Annual stock market return (%)", type: "number", defaultValue: 7, group: "Stocks" },
    { name: "years", label: "Years to compare", type: "number", defaultValue: 10 }
  ],
  "PRO-021": [
    { name: "monthly_rent", label: "Monthly rent (£)", type: "number", defaultValue: 1300 },
    { name: "vacancy", label: "Vacancy allowance (%)", type: "number", defaultValue: 5 },
    { name: "annual_costs", label: "Annual running costs (£)", type: "number", defaultValue: 3000 },
    { name: "monthly_mortgage_payment", label: "Monthly mortgage payment (£)", type: "number", defaultValue: 700 },
    { name: "cash_invested", label: "Cash invested (£)", type: "number", defaultValue: 90000 }
  ],
  "PRO-022": [
    { name: "initial_value", label: "Property value today (£)", type: "number", defaultValue: 300000 },
    { name: "annual_growth", label: "Annual growth (%)", type: "number", defaultValue: 3 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
    { name: "inflation", label: "Annual inflation (%)", type: "number", defaultValue: 2.5, helperText: "Used to show the value in today's money." }
  ],
  "PRO-024": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 400000, helperText: "First-time buyer relief in England and Northern Ireland. Relief is unavailable above £500,000." }
  ],
  "PRO-025": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 250000, helperText: "Higher rates for additional dwellings in England and Northern Ireland." }
  ],
  "PRO-026": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 300000, helperText: "Land and Buildings Transaction Tax applies to property in Scotland." },
    { name: "first_time_buyer", label: "First-time buyer?", type: "select", defaultValue: "false", options: YES_NO },
    { name: "additional_property", label: "Additional dwelling?", type: "select", defaultValue: "false", options: YES_NO }
  ],
  "PRO-027": [
    { name: "price", label: "Property price (£)", type: "number", defaultValue: 300000, helperText: "Land Transaction Tax applies to property in Wales." },
    { name: "additional_property", label: "Additional property?", type: "select", defaultValue: "false", options: YES_NO }
  ],

  // ------------------------------------------------ Investing & Wealth -----
  "INV-004": [
    { name: "principal", label: "Amount invested (£)", type: "number", defaultValue: 10000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 5 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
    { name: "compounds_per_year", label: "Compounding periods a year", type: "number", defaultValue: 1, helperText: "1 for annual, 12 for monthly." }
  ],
  "INV-005": [
    { name: "present_value", label: "Amount today (£)", type: "number", defaultValue: 10000 },
    { name: "future_value", label: "Target amount (£)", type: "number", defaultValue: 20000 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 },
    { name: "compounds_per_year", label: "Compounding periods a year", type: "number", defaultValue: 1 }
  ],
  "INV-010": [
    { name: "returns", label: "Annual returns (%)", type: "text", defaultValue: "[20,-10,15,-5,10]", helperText: "A list of yearly percentage returns, e.g. [8,-3,12]." }
  ],
  "INV-012": [
    { name: "cashflows", label: "Dated cash flows", type: "text", defaultValue: '[{"date":"2024-01-01","amount":-10000},{"date":"2025-01-01","amount":11000}]', helperText: "Money out is negative, money in is positive. Needs at least one of each." }
  ],
  "INV-013": [
    { name: "initial_investment", label: "Initial investment (£)", type: "number", defaultValue: 10000 },
    { name: "annual_cashflows", label: "Annual cash flows (£)", type: "text", defaultValue: "[3000,3000,3000,3000,3000]" },
    { name: "discount_rate", label: "Discount rate (%)", type: "number", defaultValue: 0, helperText: "Used for the discounted payback period." }
  ],
  "INV-016": [
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 300 },
    { name: "annual_return", label: "Annual return (%)", type: "number", defaultValue: 7 },
    { name: "years_to_goal", label: "Years until your goal", type: "number", defaultValue: 30 },
    { name: "years_delayed", label: "Years you delay starting", type: "number", defaultValue: 5 },
    { name: "starting_amount", label: "Starting amount (£)", type: "number", defaultValue: 0 }
  ],
  "INV-017": [
    { name: "starting_amount", label: "Starting amount (£)", type: "number", defaultValue: 5000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 300 },
    { name: "annual_rate", label: "Annual return (%)", type: "number", defaultValue: 6 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 },
    { name: "contribution_timing", label: "Contributions paid", type: "select", defaultValue: "end", options: [{ label: "At the end of each month", value: "end" }, { label: "At the start of each month", value: "start" }], helperText: "Paying at the start earns one extra month of growth." }
  ],
  "INV-018": [
    { name: "starting_amount", label: "Starting balance (£)", type: "number", defaultValue: 1000 },
    { name: "monthly_contribution", label: "Monthly saving (£)", type: "number", defaultValue: 200 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 }
  ],
  "INV-019": [
    { name: "principal", label: "Amount deposited (£)", type: "number", defaultValue: 10000 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4.5 },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 1 },
    { name: "compounds_per_year", label: "Interest paid times a year", type: "number", defaultValue: 1 }
  ],
  "INV-020": [
    { name: "principal", label: "Amount deposited (£)", type: "number", defaultValue: 20000 },
    { name: "annual_rate", label: "Fixed rate (%)", type: "number", defaultValue: 4.75 },
    { name: "years", label: "Term (years)", type: "number", defaultValue: 3 },
    { name: "compounds_per_year", label: "Interest paid times a year", type: "number", defaultValue: 1 }
  ],
  "INV-021": [
    { name: "face_value", label: "Face value (£)", type: "number", defaultValue: 1000 },
    { name: "coupon_rate", label: "Coupon rate (%)", type: "number", defaultValue: 5 },
    { name: "yield_rate", label: "Required yield (%)", type: "number", defaultValue: 5 },
    { name: "years", label: "Years to maturity", type: "number", defaultValue: 10 },
    { name: "coupons_per_year", label: "Coupons a year", type: "number", defaultValue: 2 }
  ],
  "INV-022": [
    { name: "investment", label: "Amount invested (£)", type: "number", defaultValue: 50000 },
    { name: "starting_yield", label: "Starting dividend yield (%)", type: "number", defaultValue: 4 },
    { name: "dividend_growth", label: "Annual dividend growth (%)", type: "number", defaultValue: 5 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 }
  ],
  "INV-023": [
    { name: "initial_investment", label: "Initial investment (£)", type: "number", defaultValue: 20000 },
    { name: "starting_yield", label: "Starting dividend yield (%)", type: "number", defaultValue: 4 },
    { name: "price_growth", label: "Annual share price growth (%)", type: "number", defaultValue: 5 },
    { name: "dividend_growth", label: "Annual dividend growth (%)", type: "number", defaultValue: 4 },
    { name: "years", label: "Years", type: "number", defaultValue: 10 }
  ],
  "INV-024": [
    { name: "initial_investment", label: "Initial investment (£)", type: "number", defaultValue: 10000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 200 },
    { name: "gross_return", label: "Gross annual return (%)", type: "number", defaultValue: 7 },
    { name: "ongoing_charge", label: "Ongoing charge (%)", type: "number", defaultValue: 0.22, helperText: "The fund's OCF, e.g. 0.22 for 0.22%." },
    { name: "platform_fee", label: "Platform fee (%)", type: "number", defaultValue: 0.25 },
    { name: "years", label: "Years", type: "number", defaultValue: 20 }
  ],

  // -------------------------------------------- ISA & tax wrappers ---------
  "ISA-003": [
    { name: "initial_investment", label: "Initial investment (£)", type: "number", defaultValue: 10000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 200 },
    { name: "annual_growth", label: "Annual capital growth (%)", type: "number", defaultValue: 6, helperText: "Enter 6 for 6%. Growth excluding dividends." },
    { name: "dividend_yield", label: "Dividend yield (%)", type: "number", defaultValue: 2, helperText: "The income the holding pays out each year, as a percentage of its value." },
    { name: "years", label: "Years held", type: "number", defaultValue: 10 },
    { name: "other_income", label: "Your other annual income (£)", type: "number", defaultValue: 35000, group: "Your tax position", helperText: "Used to work out your dividend and capital gains rates." }
  ],
  "ISA-004": [
    { name: "current_balance", label: "Current Lifetime ISA balance (£)", type: "number", defaultValue: 0 },
    { name: "annual_contribution", label: "Annual contribution (£)", type: "number", defaultValue: 4000, helperText: "The limit is £4,000 a year, and it counts towards your £20,000 overall ISA allowance." },
    { name: "annual_growth", label: "Annual growth (%)", type: "number", defaultValue: 5 },
    { name: "years", label: "Years until withdrawal", type: "number", defaultValue: 5 },
    { name: "withdrawal_purpose", label: "What will you withdraw it for?", type: "select", defaultValue: "first_home", options: LISA_PURPOSE, group: "Withdrawal" },
    { name: "property_price", label: "Property price (£)", type: "number", defaultValue: "", group: "Withdrawal", helperText: "Only used for a first-home withdrawal. A home above £450,000 does not qualify, so the 25% charge would apply." }
  ],
  "ISA-005": [
    { name: "current_balance", label: "Current Junior ISA balance (£)", type: "number", defaultValue: 0 },
    { name: "annual_contribution", label: "Annual contribution (£)", type: "number", defaultValue: 1200, helperText: "The limit is £9,000 a year." },
    { name: "annual_growth", label: "Annual growth (%)", type: "number", defaultValue: 5 },
    { name: "child_age", label: "Child's age now", type: "number", defaultValue: 5, helperText: "A Junior ISA matures at 18, when the money becomes the child's to do as they wish." }
  ],
  "ISA-006": [
    { name: "opening_balance", label: "Opening balance (£)", type: "number", defaultValue: 5000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 200 },
    { name: "annual_rate", label: "Interest rate (%)", type: "number", defaultValue: 4, helperText: "Enter 4 for 4% AER." },
    { name: "years", label: "Years", type: "number", defaultValue: 5 },
    { name: "other_income", label: "Your other annual income (£)", type: "number", defaultValue: 35000, group: "Your tax position", helperText: "Used to work out your Personal Savings Allowance and starting rate for savings." }
  ],

  // ------------------------------------------------ UK Tax & Salary --------
  "TAX-005": [
    { name: "gross_salary", label: "Gross annual salary (£)", type: "number", defaultValue: 32000 },
    { name: "sacrifice_percentage", label: "Salary sacrifice (%)", type: "number", defaultValue: 5, helperText: "Enter 5 for 5% of salary." },
    { name: "employer_contribution_percentage", label: "Employer contribution (%)", type: "number", defaultValue: 3, helperText: "As a percentage of your reduced salary. If your employer shares its National Insurance saving, include that here." },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, group: "Tax details" },
    { name: "student_plan", label: "Student loan plan", type: "select", defaultValue: "None", options: STUDENT_PLAN, group: "Tax details" },
    { name: "postgraduate", label: "Postgraduate loan", type: "select", defaultValue: "false", options: YES_NO, group: "Tax details" }
  ],
  "TAX-006": [
    { name: "hourly_rate", label: "Hourly rate (£)", type: "number", defaultValue: 15 },
    { name: "hours_per_week", label: "Hours per week", type: "number", defaultValue: 37.5 },
    { name: "paid_weeks_per_year", label: "Paid weeks per year", type: "number", defaultValue: 52, helperText: "Use 52 for a normal contract, or fewer for term-time-only work." },
    { name: "days_per_week", label: "Days per week", type: "number", defaultValue: 5 }
  ],
  "TAX-007": [
    { name: "annual_salary", label: "Annual salary (£)", type: "number", defaultValue: 30000 },
    { name: "hours_per_week", label: "Hours per week", type: "number", defaultValue: 37.5 },
    { name: "paid_weeks_per_year", label: "Paid weeks per year", type: "number", defaultValue: 52 },
    { name: "days_per_week", label: "Days per week", type: "number", defaultValue: 5 }
  ],
  "TAX-008": [
    { name: "base_hourly_rate", label: "Base hourly rate (£)", type: "number", defaultValue: 15 },
    { name: "standard_hours", label: "Standard hours this period", type: "number", defaultValue: 37.5 },
    { name: "overtime_hours", label: "Overtime hours", type: "number", defaultValue: 8 },
    { name: "overtime_multiplier", label: "Overtime multiplier", type: "number", defaultValue: 1.5, helperText: "1.5 for time and a half." },
    { name: "premium_hours", label: "Premium-rate hours", type: "number", defaultValue: 0, group: "Second premium tier" },
    { name: "premium_multiplier", label: "Premium multiplier", type: "number", defaultValue: 2, group: "Second premium tier", helperText: "2 for double time." },
    { name: "pay_periods_per_year", label: "Pay periods per year", type: "number", defaultValue: 52, helperText: "52 if you are paid weekly, 12 if monthly." }
  ],
  "TAX-009": [
    { name: "annual_salary", label: "Annual salary (£)", type: "number", defaultValue: 40000 },
    { name: "bonus", label: "Bonus (£)", type: "number", defaultValue: 5000 },
    { name: "pension_from_bonus_percentage", label: "Share of bonus into pension (%)", type: "number", defaultValue: 0, helperText: "Enter 50 to sacrifice half of it. Sacrificing removes it from pay before tax and National Insurance." },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, group: "Tax details" },
    { name: "student_plan", label: "Student loan plan", type: "select", defaultValue: "None", options: STUDENT_PLAN, group: "Tax details" },
    { name: "postgraduate", label: "Postgraduate loan", type: "select", defaultValue: "false", options: YES_NO, group: "Tax details" }
  ],
  "TAX-010": [
    { name: "lower_earner_income", label: "Lower earner's annual income (£)", type: "number", defaultValue: 8000, helperText: "The partner who would transfer part of their Personal Allowance." },
    { name: "higher_earner_income", label: "Higher earner's annual income (£)", type: "number", defaultValue: 40000 },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION }
  ],
  "TAX-011": [
    { name: "dividend_income", label: "Dividend income (£)", type: "number", defaultValue: 10000 },
    { name: "other_income", label: "Other income (£)", type: "number", defaultValue: 30000, helperText: "Salary, pension and any other non-dividend income." },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, helperText: "Dividend tax is the same across the UK. Your jurisdiction affects only the tax on your other income." }
  ],
  "TAX-012": [
    { name: "disposal_proceeds", label: "Sale proceeds (£)", type: "number", defaultValue: 50000 },
    { name: "acquisition_cost", label: "What you paid for it (£)", type: "number", defaultValue: 20000 },
    { name: "costs", label: "Buying, selling and improvement costs (£)", type: "number", defaultValue: 1000, helperText: "Legal fees, agent fees and capital improvements. Not repairs or maintenance." },
    { name: "allowable_losses", label: "Losses brought forward (£)", type: "number", defaultValue: 0, group: "Your tax position" },
    { name: "other_taxable_income", label: "Your other annual income (£)", type: "number", defaultValue: 35000, group: "Your tax position", helperText: "The gain sits on top of your income, so this decides how much is taxed at 18% and how much at 24%." }
  ],
  "TAX-014": [
    { name: "estate_value", label: "Total estate value (£)", type: "number", defaultValue: 700000 },
    { name: "property_to_direct_descendants", label: "Home passing to children or grandchildren (£)", type: "number", defaultValue: 400000, helperText: "Leave as 0 if no home passes to direct descendants; the residence nil rate band then does not apply." },
    { name: "charitable_gifts", label: "Gifts to charity (£)", type: "number", defaultValue: 0, group: "Reliefs", helperText: "Leaving at least a tenth of the taxable estate to charity cuts the rate from 40% to 36%." },
    { name: "transferred_nil_rate_band_percentage", label: "Nil rate band inherited from a late spouse (%)", type: "number", defaultValue: 0, group: "Reliefs", helperText: "Enter 100 if none of their allowance was used." },
    { name: "transferred_residence_nil_rate_band_percentage", label: "Residence band inherited from a late spouse (%)", type: "number", defaultValue: 0, group: "Reliefs" }
  ],
  "TAX-016": [
    { name: "turnover", label: "Turnover (£)", type: "number", defaultValue: 55000 },
    { name: "allowable_expenses", label: "Allowable expenses (£)", type: "number", defaultValue: 15000, helperText: "Costs incurred wholly and exclusively for the business. Not your own drawings." },
    { name: "capital_allowances", label: "Capital allowances (£)", type: "number", defaultValue: 0, helperText: "Relief claimed on equipment and vehicles." },
    { name: "other_income", label: "Other income (£)", type: "number", defaultValue: 0, group: "Your tax position", helperText: "Employment or pension income taxed alongside your profits." },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, group: "Your tax position" }
  ],
  "TAX-017": [
    { name: "turnover", label: "Turnover (£)", type: "number", defaultValue: 55000 },
    { name: "allowable_expenses", label: "Allowable expenses (£)", type: "number", defaultValue: 15000 },
    { name: "capital_allowances", label: "Capital allowances (£)", type: "number", defaultValue: 0 },
    { name: "other_income", label: "Other income (£)", type: "number", defaultValue: 0, group: "Your tax position" },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, group: "Your tax position" }
  ],
  "TAX-018": [
    { name: "taxable_profit", label: "Taxable profit (£)", type: "number", defaultValue: 100000 },
    { name: "associated_companies", label: "Associated companies", type: "number", defaultValue: 0, helperText: "The profit limits are divided by the number of associated companies plus one." },
    { name: "accounting_period_months", label: "Accounting period (months)", type: "number", defaultValue: 12, helperText: "The limits are reduced in proportion for a period shorter than twelve months." }
  ],

  // ------------------------------------------ Pensions & Retirement --------
  "PEN-004": [
    { name: "annual_salary", label: "Annual salary (£)", type: "number", defaultValue: 30000 },
    { name: "contribution_basis", label: "Contribution basis", type: "select", defaultValue: "qualifying_earnings", options: CONTRIBUTION_BASIS, helperText: "Qualifying earnings is the statutory band, not your whole salary. Check your scheme booklet, because the basis changes the answer a great deal." },
    { name: "employer_rate", label: "Employer contribution (%)", type: "number", defaultValue: 3 },
    { name: "employee_rate", label: "Your contribution (%)", type: "number", defaultValue: 5 }
  ],
  "PEN-005": [
    { name: "gross_income", label: "Gross annual income (£)", type: "number", defaultValue: 70000 },
    { name: "personal_contribution", label: "Your own contribution (£)", type: "number", defaultValue: 4000, helperText: "Under relief at source this is what leaves your bank account; your provider adds basic-rate relief on top." },
    { name: "arrangement", label: "Pension arrangement", type: "select", defaultValue: "relief_at_source", options: RELIEF_ARRANGEMENT },
    { name: "employer_contribution", label: "Employer contribution (£)", type: "number", defaultValue: 0, group: "Annual allowance", helperText: "Counts towards your annual allowance, and towards adjusted income for the taper." },
    { name: "flexibly_accessed", label: "Already flexibly accessed a pension?", type: "select", defaultValue: "false", options: YES_NO, group: "Annual allowance", helperText: "Taking taxable income flexibly triggers the money purchase annual allowance, which is far smaller." },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, group: "Annual allowance" }
  ],
  "PEN-007": [
    { name: "pension_pot", label: "Pension pot (£)", type: "number", defaultValue: 300000 },
    { name: "take_tax_free_lump_sum", label: "Take the 25% tax-free lump sum?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "drawdown_rate", label: "Drawdown rate (%)", type: "number", defaultValue: 4, helperText: "The percentage of the remaining pot you take each year." },
    { name: "qualifying_years", label: "State Pension qualifying years", type: "number", defaultValue: 35, group: "Other income", helperText: "35 years gives the full new State Pension; fewer than 10 gives none." },
    { name: "other_income", label: "Other annual income (£)", type: "number", defaultValue: 0, group: "Other income" },
    { name: "jurisdiction", label: "Jurisdiction", type: "select", defaultValue: "England/Wales/NI", options: TAX_JURISDICTION, group: "Other income" }
  ],
  "PEN-008": [
    { name: "pension_pot", label: "Pension pot (£)", type: "number", defaultValue: 400000 },
    { name: "take_tax_free_lump_sum", label: "Take the 25% tax-free lump sum?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "annual_withdrawal", label: "Withdrawal in the first year (£)", type: "number", defaultValue: 12000, helperText: "This rises with inflation each year, so it keeps its buying power." },
    { name: "annual_growth", label: "Annual investment growth (%)", type: "number", defaultValue: 5 },
    { name: "inflation", label: "Inflation (%)", type: "number", defaultValue: 2.5 },
    { name: "projection_years", label: "Projection period (years)", type: "number", defaultValue: 30 }
  ],
  "PEN-009": [
    { name: "pension_pot", label: "Pension pot (£)", type: "number", defaultValue: 300000 },
    { name: "take_tax_free_lump_sum", label: "Take the 25% tax-free lump sum?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "annuity_rate", label: "Annuity rate quoted (%)", type: "number", defaultValue: 6, helperText: "The rate the insurer has quoted you. It depends on your age, health and the options below, so shop around and declare any health conditions." },
    { name: "escalation", label: "Annual escalation (%)", type: "number", defaultValue: 0, group: "Options", helperText: "0 for a level annuity. A level income loses buying power every year." },
    { name: "guarantee_period", label: "Guarantee period (years)", type: "number", defaultValue: 0, group: "Options", helperText: "Income continues to your estate for this long if you die early." },
    { name: "spouse_proportion", label: "Spouse's pension (%)", type: "number", defaultValue: 0, group: "Options", helperText: "The share of your income that continues to a surviving partner." },
    { name: "projection_years", label: "Projection period (years)", type: "number", defaultValue: 25 }
  ],
  "PEN-010": [
    { name: "qualifying_years", label: "Qualifying years so far", type: "number", defaultValue: 20, helperText: "Check your National Insurance record on GOV.UK. You need 10 years for any State Pension and 35 for the full amount." },
    { name: "additional_years_planned", label: "Further years you expect to build", type: "number", defaultValue: 10 }
  ],
  "PEN-012": [
    { name: "target_annual_income", label: "Target retirement income (£ a year)", type: "number", defaultValue: 30000 },
    { name: "current_pot", label: "Current pension pot (£)", type: "number", defaultValue: 100000 },
    { name: "monthly_contribution", label: "Monthly contribution (£)", type: "number", defaultValue: 500 },
    { name: "years_to_retirement", label: "Years to retirement", type: "number", defaultValue: 25 },
    { name: "annual_growth", label: "Annual growth (%)", type: "number", defaultValue: 5 },
    { name: "safe_withdrawal_rate", label: "Withdrawal rate in retirement (%)", type: "number", defaultValue: 4, helperText: "The percentage of the pot you plan to take each year. A lower rate needs a bigger pot but is more cautious." },
    { name: "include_state_pension", label: "Include the State Pension?", type: "select", defaultValue: "true", options: YES_NO, group: "State Pension" },
    { name: "qualifying_years", label: "State Pension qualifying years", type: "number", defaultValue: 35, group: "State Pension" }
  ],

  // ------------------------------------------ Business & Commercial --------
  "BUS-002": [
    { name: "cost", label: "Unit cost (£)", type: "number", defaultValue: 100 },
    { name: "price", label: "Selling price (£)", type: "number", defaultValue: "", helperText: "Enter either a selling price or a markup percentage below." },
    { name: "markup_percentage", label: "Markup (%)", type: "number", defaultValue: "", helperText: "Used only when no selling price is entered." }
  ],
  "BUS-003": [
    { name: "revenue", label: "Revenue (£)", type: "number", defaultValue: 500000 },
    { name: "cost_of_goods_sold", label: "Cost of goods sold (£)", type: "number", defaultValue: 200000 },
    { name: "operating_expenses", label: "Operating expenses (£)", type: "number", defaultValue: 150000 },
    { name: "other_income", label: "Other income (£)", type: "number", defaultValue: 0, group: "Below the line" },
    { name: "interest_and_other_costs", label: "Interest and other costs (£)", type: "number", defaultValue: 0, group: "Below the line" },
    { name: "tax_rate", label: "Tax rate (%)", type: "number", defaultValue: 19, group: "Below the line", helperText: "Your company's effective rate. Use the Corporation Tax calculator to work it out." }
  ],
  "BUS-004": [
    { name: "revenue", label: "Revenue (£)", type: "number", defaultValue: 500000 },
    { name: "cost_of_goods_sold", label: "Cost of goods sold (£)", type: "number", defaultValue: 200000, helperText: "Direct costs of what you sold, not overheads." }
  ],
  "BUS-005": [
    { name: "revenue", label: "Revenue (£)", type: "number", defaultValue: 500000 },
    { name: "cost_of_goods_sold", label: "Cost of goods sold (£)", type: "number", defaultValue: 200000 },
    { name: "operating_expenses", label: "Operating expenses (£)", type: "number", defaultValue: 150000 },
    { name: "other_income", label: "Other income (£)", type: "number", defaultValue: 0, group: "Below the line" },
    { name: "interest_and_other_costs", label: "Interest and other costs (£)", type: "number", defaultValue: 0, group: "Below the line" },
    { name: "tax_rate", label: "Tax rate (%)", type: "number", defaultValue: 19, group: "Below the line" }
  ],
  "BUS-007": [
    { name: "sales", label: "Sales achieved (£)", type: "number", defaultValue: 100000 },
    { name: "commission_rate", label: "Commission rate (%)", type: "number", defaultValue: 5 },
    { name: "threshold", label: "Threshold before commission starts (£)", type: "number", defaultValue: 0, helperText: "Commission is paid only on sales above this figure." },
    { name: "target", label: "Accelerator target (£)", type: "number", defaultValue: 0, group: "Accelerator", helperText: "Leave at 0 if there is no accelerator." },
    { name: "accelerator_rate", label: "Accelerator rate (%)", type: "number", defaultValue: 0, group: "Accelerator" },
    { name: "base_salary", label: "Base salary (£)", type: "number", defaultValue: 25000 }
  ],
  "BUS-009": [
    { name: "cost", label: "Asset cost (£)", type: "number", defaultValue: 25000 },
    { name: "residual_value", label: "Residual value (£)", type: "number", defaultValue: 5000, helperText: "What you expect it to be worth at the end of its useful life." },
    { name: "useful_life_years", label: "Useful life (years)", type: "number", defaultValue: 5 },
    { name: "method", label: "Method", type: "select", defaultValue: "straight_line", options: DEPRECIATION_METHOD },
    { name: "reducing_balance_rate", label: "Reducing balance rate (%)", type: "number", defaultValue: 25, group: "Method settings", showWhen: { field: "method", equals: ["reducing_balance"] } },
    { name: "total_units", label: "Total expected units", type: "number", defaultValue: 0, group: "Method settings", showWhen: { field: "method", equals: ["units_of_production"] } },
    { name: "units_per_year", label: "Units each year", type: "text", defaultValue: "[]", group: "Method settings", showWhen: { field: "method", equals: ["units_of_production"] }, helperText: "A list, for example [30000, 30000, 25000, 15000]." }
  ],
  "BUS-010": [
    { name: "opening_balance", label: "Opening balance (£)", type: "number", defaultValue: 10000 },
    { name: "inflows", label: "Money in, each period", type: "text", defaultValue: "[20000, 18000, 15000, 12000]", helperText: "A list, one figure per period." },
    { name: "outflows", label: "Money out, each period", type: "text", defaultValue: "[22000, 24000, 26000, 25000]", helperText: "A list with the same number of periods." }
  ],
  "BUS-011": [
    { name: "unit_cost", label: "Unit cost (£)", type: "number", defaultValue: 70 },
    { name: "target_margin", label: "Target margin (%)", type: "number", defaultValue: 30, helperText: "Margin, not markup. Enter 30 for 30%." },
    { name: "vat_registered", label: "VAT registered?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "discount", label: "Discount you plan to offer (%)", type: "number", defaultValue: 0, group: "Discounting" },
    { name: "fixed_costs", label: "Fixed costs to cover (£)", type: "number", defaultValue: 0, group: "Discounting" }
  ],
  "BUS-012": [
    { name: "initial_investment", label: "Initial investment (£)", type: "number", defaultValue: 100000 },
    { name: "annual_benefits", label: "Benefits each year (£)", type: "text", defaultValue: "[40000, 40000, 40000, 40000, 40000]", helperText: "A list, one figure per year." },
    { name: "annual_costs", label: "Ongoing costs each year (£)", type: "text", defaultValue: "[5000, 5000, 5000, 5000, 5000]", helperText: "A list with the same number of years." },
    { name: "discount_rate", label: "Discount rate (%)", type: "number", defaultValue: 8, helperText: "Your cost of capital, or the return you could get elsewhere." }
  ],

  // ---------------------------------------------- Statistics & Data --------
  "STA-002": [
    { name: "data", label: "Your data", type: "text", defaultValue: "2, 4, 4, 6, 8", helperText: "Separate values with commas, spaces or new lines." },
    { name: "weights", label: "Weights (optional)", type: "text", defaultValue: "", helperText: "One weight per value, for a weighted average." }
  ],
  "STA-004": [
    { name: "data", label: "Your data", type: "text", defaultValue: "2, 4, 4, 4, 5, 5, 7, 9" }
  ],
  "STA-005": [
    { name: "value", label: "Value", type: "number", defaultValue: 115 },
    { name: "mean", label: "Mean", type: "number", defaultValue: 100 },
    { name: "standard_deviation", label: "Standard deviation", type: "number", defaultValue: 15 }
  ],
  "STA-007": [
    { name: "test_statistic", label: "Test statistic", type: "number", defaultValue: 1.96 },
    { name: "distribution", label: "Distribution", type: "select", defaultValue: "z", options: TEST_DISTRIBUTION },
    { name: "tail", label: "Tail", type: "select", defaultValue: "two", options: TAIL_TYPE, helperText: "Chi-square and F tests are right-tailed only." },
    { name: "degrees_of_freedom", label: "Degrees of freedom", type: "number", defaultValue: 0, showWhen: { field: "distribution", equals: ["t", "chi_square", "f"] } },
    { name: "degrees_of_freedom_2", label: "Denominator degrees of freedom", type: "number", defaultValue: 0, showWhen: { field: "distribution", equals: ["f"] } }
  ],
  "STA-009": [
    { name: "measure", label: "What are you measuring?", type: "select", defaultValue: "proportion", options: MEASURE_TYPE },
    { name: "proportion", label: "Proportion", type: "number", defaultValue: 0.5, showWhen: { field: "measure", equals: ["proportion"] }, helperText: "As a decimal. Use 0.5 for the widest, most cautious margin." },
    { name: "sample_mean", label: "Sample mean", type: "number", defaultValue: 0, showWhen: { field: "measure", equals: ["mean"] } },
    { name: "standard_deviation", label: "Standard deviation", type: "number", defaultValue: 0, showWhen: { field: "measure", equals: ["mean"] } },
    { name: "sample_size", label: "Sample size", type: "number", defaultValue: 1000 },
    { name: "confidence", label: "Confidence level", type: "number", defaultValue: 0.95, helperText: "As a decimal, for example 0.95 for 95%." },
    { name: "population_size", label: "Population size (optional)", type: "number", defaultValue: "", helperText: "Only needed when your sample is a large share of the whole group." }
  ],
  "STA-010": [
    { name: "effect_size", label: "Effect size (Cohen's d)", type: "number", defaultValue: 0.5, helperText: "0.2 small, 0.5 medium, 0.8 large." },
    { name: "sample_size_per_group", label: "Sample size per group", type: "number", defaultValue: 100 },
    { name: "alpha", label: "Significance level", type: "number", defaultValue: 0.05 },
    { name: "target_power", label: "Target power", type: "number", defaultValue: 0.8, helperText: "0.8 is the usual convention." },
    { name: "two_tailed", label: "Two-tailed test?", type: "select", defaultValue: "true", options: YES_NO }
  ],
  "STA-011": [
    { name: "probability_a", label: "Probability of A", type: "number", defaultValue: 0.5, helperText: "As a decimal between 0 and 1." },
    { name: "probability_b", label: "Probability of B", type: "number", defaultValue: 0.4 },
    { name: "probability_a_and_b", label: "Probability of A and B (optional)", type: "number", defaultValue: "", helperText: "Leave blank to treat the events as independent." }
  ],
  "STA-012": [
    { name: "n", label: "Total items (n)", type: "number", defaultValue: 52 },
    { name: "r", label: "Items chosen (r)", type: "number", defaultValue: 5 }
  ],
  "STA-013": [
    { name: "x_values", label: "X values", type: "text", defaultValue: "1, 2, 3, 4, 5, 6, 7, 8" },
    { name: "y_values", label: "Y values", type: "text", defaultValue: "2, 4, 5, 4, 5, 7, 8, 9", helperText: "The same number of values as X." }
  ],
  "STA-015": [
    { name: "x_values", label: "X values", type: "text", defaultValue: "1, 2, 3, 4, 5, 6, 7, 8" },
    { name: "y_values", label: "Y values", type: "text", defaultValue: "2, 4, 5, 4, 5, 7, 8, 9" },
    { name: "predictors", label: "Number of predictors", type: "number", defaultValue: 1, helperText: "Used for adjusted R-squared." }
  ],
  "STA-016": [
    { name: "test_type", label: "Type of t test", type: "select", defaultValue: "two_sample", options: T_TEST_TYPE },
    { name: "sample_a", label: "Sample A", type: "text", defaultValue: "12, 14, 15, 16, 18, 13" },
    { name: "sample_b", label: "Sample B", type: "text", defaultValue: "20, 22, 19, 24, 21, 23", showWhen: { field: "test_type", equals: ["two_sample", "welch", "paired"] } },
    { name: "hypothesised_mean", label: "Hypothesised mean", type: "number", defaultValue: 0, showWhen: { field: "test_type", equals: ["one_sample"] } },
    { name: "confidence", label: "Confidence level", type: "number", defaultValue: 0.95 },
    { name: "two_tailed", label: "Two-tailed test?", type: "select", defaultValue: "true", options: YES_NO }
  ],
  "STA-017": [
    { name: "test_type", label: "Type of test", type: "select", defaultValue: "independence", options: CHI_SQUARE_TYPE },
    { name: "contingency_table", label: "Contingency table", type: "text", defaultValue: "[[20, 30], [30, 20]]", showWhen: { field: "test_type", equals: ["independence"] }, helperText: "Rows of counts, for example [[20, 30], [30, 20]]." },
    { name: "observed", label: "Observed counts", type: "text", defaultValue: "", showWhen: { field: "test_type", equals: ["goodness_of_fit"] } },
    { name: "expected", label: "Expected counts", type: "text", defaultValue: "", showWhen: { field: "test_type", equals: ["goodness_of_fit"] } }
  ],
  "STA-018": [
    { name: "groups", label: "Groups", type: "text", defaultValue: "[[5, 6, 7, 8], [10, 11, 12, 13], [15, 16, 17, 18]]", helperText: "A list of groups, each a list of values." }
  ],
  "STA-019": [
    { name: "control_visitors", label: "Control visitors", type: "number", defaultValue: 10000 },
    { name: "control_conversions", label: "Control conversions", type: "number", defaultValue: 500 },
    { name: "variant_visitors", label: "Variant visitors", type: "number", defaultValue: 10000 },
    { name: "variant_conversions", label: "Variant conversions", type: "number", defaultValue: 600 },
    { name: "confidence", label: "Confidence level", type: "number", defaultValue: 0.95 }
  ],
  "STA-020": [
    { name: "observed", label: "Observed value", type: "number", defaultValue: 10.5 },
    { name: "expected", label: "Expected value", type: "number", defaultValue: 10, helperText: "The error is measured against this value." }
  ],

  // ------------------------------------------------- Maths & Algebra -------
  "MAT-001": [
    { name: "expression", label: "Expression", type: "text", defaultValue: "2 + 3 * 4", helperText: "Use + - * / ^ and brackets. Functions such as sqrt, sin and log are available." }
  ],
  "MAT-004": [
    { name: "original_price", label: "Original amount", type: "number", defaultValue: 100, helperText: "Any amount, not only a price, which is why no currency symbol is shown." },
    { name: "discount", label: "Discount (%)", type: "number", defaultValue: 20 },
    { name: "second_discount", label: "Further discount (%)", type: "number", defaultValue: 0, helperText: "Taken off the already reduced price, not off the original." }
  ],
  "MAT-007": [
    { name: "value", label: "Value", type: "number", defaultValue: 3.14159 },
    { name: "decimal_places", label: "Decimal places", type: "number", defaultValue: 2 },
    { name: "mode", label: "Rounding mode", type: "select", defaultValue: "half_up", options: ROUNDING_MODE },
    { name: "significant_figures", label: "Significant figures", type: "number", defaultValue: 3, group: "Other roundings" },
    { name: "nearest_multiple", label: "Nearest multiple of", type: "number", defaultValue: 0, group: "Other roundings", helperText: "Leave at 0 to skip this." }
  ],
  "MAT-008": [
    { name: "base", label: "Base", type: "number", defaultValue: 2 },
    { name: "exponent", label: "Exponent", type: "number", defaultValue: 10 }
  ],
  "MAT-009": [
    { name: "value", label: "Value", type: "number", defaultValue: 144 },
    { name: "index", label: "Root", type: "number", defaultValue: 2, helperText: "2 for a square root, 3 for a cube root." }
  ],
  "MAT-010": [
    { name: "value", label: "Value", type: "number", defaultValue: 1000 },
    { name: "base", label: "Base", type: "number", defaultValue: 10, helperText: "10 for the common log, 2 for binary." }
  ],
  "MAT-011": [
    { name: "value", label: "Value", type: "number", defaultValue: 123456 },
    { name: "significant_figures", label: "Significant figures", type: "number", defaultValue: 3 }
  ],
  "MAT-012": [
    { name: "a", label: "a", type: "number", defaultValue: 1, helperText: "The coefficient of x squared. It cannot be zero." },
    { name: "b", label: "b", type: "number", defaultValue: -5 },
    { name: "c", label: "c", type: "number", defaultValue: 6 }
  ],
  "MAT-013": [
    { name: "x1", label: "x1", type: "number", defaultValue: 1 },
    { name: "y1", label: "y1", type: "number", defaultValue: 2 },
    { name: "x2", label: "x2", type: "number", defaultValue: 4 },
    { name: "y2", label: "y2", type: "number", defaultValue: 8 }
  ],
  "MAT-014": [
    { name: "number", label: "Number", type: "number", defaultValue: 210, helperText: "A whole number of 2 or more." }
  ],
  "MAT-015": [
    { name: "number", label: "Number", type: "number", defaultValue: 28 }
  ],
  "MAT-016": [
    { name: "numbers", label: "Numbers", type: "text", defaultValue: "[48, 18]", helperText: "At least two whole numbers." }
  ],
  "MAT-017": [
    { name: "numbers", label: "Numbers", type: "text", defaultValue: "[12, 18, 24]" }
  ],
  "MAT-018": [
    { name: "dividend", label: "Dividend", type: "number", defaultValue: 1234, helperText: "The number being divided." },
    { name: "divisor", label: "Divisor", type: "number", defaultValue: 7 }
  ],
  "MAT-019": [
    { name: "sequence_type", label: "Type of sequence", type: "select", defaultValue: "arithmetic", options: SEQUENCE_TYPE },
    { name: "first_term", label: "First term", type: "number", defaultValue: 3 },
    { name: "step", label: "Common difference or ratio", type: "number", defaultValue: 5, helperText: "The step for an arithmetic sequence, the multiplier for a geometric one, or the second term for Fibonacci." },
    { name: "number_of_terms", label: "Number of terms", type: "number", defaultValue: 10 }
  ],
  "MAT-021": [
    { name: "operation", label: "Operation", type: "select", defaultValue: "multiply", options: MATRIX_OPERATION },
    { name: "matrix_a", label: "Matrix A", type: "text", defaultValue: "[[4, 7], [2, 6]]", helperText: "Rows of numbers, for example [[1, 2], [3, 4]]." },
    { name: "matrix_b", label: "Matrix B", type: "text", defaultValue: "[[1, 2], [3, 4]]", showWhen: { field: "operation", equals: ["add", "subtract", "multiply"] } }
  ],
  "MAT-022": [
    { name: "operation", label: "Operation", type: "select", defaultValue: "convert", options: BASE_OPERATION },
    { name: "value_a", label: "Binary value", type: "text", defaultValue: "1011" },
    { name: "value_b", label: "Second binary value", type: "text", defaultValue: "", showWhen: { field: "operation", equals: ["add", "subtract", "multiply", "divide"] } }
  ],
  "MAT-023": [
    { name: "operation", label: "Operation", type: "select", defaultValue: "convert", options: BASE_OPERATION },
    { name: "value_a", label: "Hexadecimal value", type: "text", defaultValue: "FF" },
    { name: "value_b", label: "Second hexadecimal value", type: "text", defaultValue: "", showWhen: { field: "operation", equals: ["add", "subtract", "multiply", "divide"] } }
  ],

  // ------------------------------------------------------- Geometry --------
  "GEO-001": [
    { name: "shape", label: "Shape", type: "select", defaultValue: "rectangle", options: AREA_SHAPE, helperText: "Use the same unit for every measurement; the area comes back in that unit squared." },
    { name: "a", label: "First measurement", type: "number", defaultValue: 8, helperText: "Width, side, base, radius, or the first parallel side or diagonal." },
    { name: "b", label: "Second measurement", type: "number", defaultValue: 5, showWhen: { field: "shape", equals: ["rectangle", "triangle", "trapezium", "parallelogram", "ellipse", "rhombus"] }, helperText: "Height, the second parallel side, or the second diagonal." },
    { name: "c", label: "Third measurement", type: "number", defaultValue: 0, showWhen: { field: "shape", equals: ["trapezium", "parallelogram"] }, helperText: "Height of a trapezium, or the slanted side of a parallelogram." },
    { name: "angle", label: "Angle (degrees)", type: "number", defaultValue: 90, showWhen: { field: "shape", equals: ["sector"] } }
  ],
  "GEO-002": [
    { name: "shape", label: "Solid", type: "select", defaultValue: "cuboid", options: SOLID_SHAPE, helperText: "Measure in metres if you want the answer in litres too." },
    { name: "a", label: "First measurement", type: "number", defaultValue: 5, helperText: "Length, side, radius or triangle base." },
    { name: "b", label: "Second measurement", type: "number", defaultValue: 4, showWhen: { field: "shape", equals: ["cuboid", "cylinder", "cone", "pyramid", "prism"] } },
    { name: "c", label: "Third measurement", type: "number", defaultValue: 3, showWhen: { field: "shape", equals: ["cuboid", "prism"] } }
  ],
  "GEO-003": [
    { name: "shape", label: "Solid", type: "select", defaultValue: "cylinder", options: SOLID_SHAPE },
    { name: "a", label: "First measurement", type: "number", defaultValue: 2 },
    { name: "b", label: "Second measurement", type: "number", defaultValue: 10, showWhen: { field: "shape", equals: ["cuboid", "cylinder", "cone", "pyramid", "prism"] } },
    { name: "c", label: "Third measurement", type: "number", defaultValue: 3, showWhen: { field: "shape", equals: ["cuboid", "prism"] } }
  ],
  "GEO-004": [
    { name: "side_a", label: "Side a", type: "number", defaultValue: 6 },
    { name: "side_b", label: "Side b", type: "number", defaultValue: 7 },
    { name: "side_c", label: "Side c", type: "number", defaultValue: 8, helperText: "Any two sides must add up to more than the third." }
  ],
  "GEO-005": [
    { name: "opposite", label: "Opposite side", type: "number", defaultValue: 3, helperText: "Enter any two of the three sides and the third is worked out." },
    { name: "adjacent", label: "Adjacent side", type: "number", defaultValue: 4 },
    { name: "hypotenuse", label: "Hypotenuse", type: "number", defaultValue: "", helperText: "The longest side, opposite the right angle. Leave blank to work it out." }
  ],
  "GEO-006": [
    { name: "radius", label: "Radius", type: "number", defaultValue: 5, helperText: "Enter any ONE of radius, diameter, circumference or area." },
    { name: "diameter", label: "Diameter", type: "number", defaultValue: "" },
    { name: "circumference", label: "Circumference", type: "number", defaultValue: "" },
    { name: "area", label: "Area", type: "number", defaultValue: "" },
    { name: "angle", label: "Sector angle (degrees)", type: "number", defaultValue: 0, group: "Sector and segment", helperText: "Leave at 0 to skip the sector, arc, chord and segment figures." }
  ],
  "GEO-007": [
    { name: "side_a", label: "Side a", type: "number", defaultValue: 3, helperText: "Enter any two of the three sides." },
    { name: "side_b", label: "Side b", type: "number", defaultValue: 4 },
    { name: "hypotenuse", label: "Hypotenuse (c)", type: "number", defaultValue: "" }
  ],
  "GEO-008": [
    { name: "x1", label: "x1", type: "number", defaultValue: 0 },
    { name: "y1", label: "y1", type: "number", defaultValue: 0 },
    { name: "z1", label: "z1", type: "number", defaultValue: 0, group: "Third dimension", helperText: "Leave both z values at 0 for a flat plane." },
    { name: "x2", label: "x2", type: "number", defaultValue: 3 },
    { name: "y2", label: "y2", type: "number", defaultValue: 4 },
    { name: "z2", label: "z2", type: "number", defaultValue: 0, group: "Third dimension" }
  ],
  "GEO-009": [
    { name: "rooms", label: "Rooms", type: "text", defaultValue: '[{"length": 4, "width": 3}]', helperText: 'A list of rooms in metres, for example [{"length": 4, "width": 3}, {"length": 5, "width": 4}].' },
    { name: "wastage", label: "Wastage (%)", type: "number", defaultValue: 10, helperText: "10% is usual; allow more for a diagonal or herringbone lay." },
    { name: "pack_coverage", label: "Coverage per pack (square metres)", type: "number", defaultValue: 0, group: "Materials", helperText: "Leave at 0 to skip the pack and cost figures." },
    { name: "cost_per_pack", label: "Cost per pack", type: "number", defaultValue: 0, group: "Materials" }
  ],

  // ------------------------------------------------- Health & Fitness ------
  "HLT-002": [
    { name: "sex", label: "Sex", type: "select", defaultValue: "female", options: SEX_OPTIONS, helperText: "The formulas were derived using sex at birth; they are population averages either way." },
    { name: "age", label: "Age", type: "number", defaultValue: 30, helperText: "These calculators are for adults aged 18 and over." },
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 165, helperText: "5 feet 9 inches is about 175 cm." },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 65, helperText: "12 stone is about 76 kg." },
    { name: "activity", label: "Activity level", type: "select", defaultValue: "moderate", options: ACTIVITY_LEVEL, group: "Activity" },
    { name: "body_fat_percentage", label: "Body fat (%) if known", type: "number", defaultValue: "", group: "Activity", helperText: "Optional. Unlocks the Katch-McArdle formula, which works from lean mass." }
  ],
  "HLT-003": [
    { name: "sex", label: "Sex", type: "select", defaultValue: "female", options: SEX_OPTIONS },
    { name: "age", label: "Age", type: "number", defaultValue: 30 },
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 165 },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 65 },
    { name: "activity", label: "Activity level", type: "select", defaultValue: "moderate", options: ACTIVITY_LEVEL, helperText: "Most people overestimate this. Be honest rather than aspirational." },
    { name: "body_fat_percentage", label: "Body fat (%) if known", type: "number", defaultValue: "" }
  ],
  "HLT-004": [
    { name: "maintenance_calories", label: "Your maintenance calories", type: "number", defaultValue: 2200, helperText: "Use the TDEE calculator to work this out." },
    { name: "sex", label: "Sex", type: "select", defaultValue: "female", options: SEX_OPTIONS },
    { name: "goal", label: "Goal", type: "select", defaultValue: "maintain", options: WEIGHT_GOAL },
    { name: "rate_kg_per_week", label: "Rate of change (kg per week)", type: "number", defaultValue: 0.5, showWhen: { field: "goal", equals: ["lose", "gain"] }, helperText: "Capped at 1 kg a week, the fastest rate the NHS calls safe and sustainable." },
    { name: "current_weight", label: "Current weight (kg)", type: "number", defaultValue: 80 },
    { name: "target_weight", label: "Target weight (kg)", type: "number", defaultValue: "", helperText: "Optional. Used only to estimate how long it would take." }
  ],
  "HLT-005": [
    { name: "sex", label: "Sex", type: "select", defaultValue: "female", options: SEX_OPTIONS },
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 165 },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 63 },
    { name: "neck", label: "Neck (cm)", type: "number", defaultValue: 32, helperText: "Measured just below the larynx." },
    { name: "waist", label: "Waist (cm)", type: "number", defaultValue: 74, helperText: "At the narrowest point for women, at the navel for men." },
    { name: "hip", label: "Hip (cm)", type: "number", defaultValue: 96, showWhen: { field: "sex", equals: ["female"] }, helperText: "At the widest point." }
  ],
  "HLT-006": [
    { name: "sex", label: "Sex", type: "select", defaultValue: "female", options: SEX_OPTIONS },
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 165 },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 63 },
    { name: "body_fat_percentage", label: "Body fat (%) if known", type: "number", defaultValue: "", helperText: "A measured percentage beats any formula and will be used if you supply one." }
  ],
  "HLT-007": [
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 170 },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 68 },
    { name: "higher_risk_background", label: "South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean background?", type: "select", defaultValue: "false", options: YES_NO, helperText: "The NHS uses lower BMI thresholds for these groups, who face health risks at a lower BMI." }
  ],
  "HLT-008": [
    { name: "sex", label: "Sex", type: "select", defaultValue: "female", options: SEX_OPTIONS },
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 165 }
  ],
  "HLT-009": [
    { name: "calories", label: "Daily calories", type: "number", defaultValue: 2000 },
    { name: "protein_percentage", label: "Protein (%)", type: "number", defaultValue: 30 },
    { name: "carbohydrate_percentage", label: "Carbohydrate (%)", type: "number", defaultValue: 40 },
    { name: "fat_percentage", label: "Fat (%)", type: "number", defaultValue: 30, helperText: "The three must add up to 100." },
    { name: "body_weight", label: "Body weight (kg)", type: "number", defaultValue: "", helperText: "Optional. Used to show protein per kilogram." }
  ],
  "HLT-010": [
    { name: "calories", label: "Daily calories", type: "number", defaultValue: 2500 },
    { name: "protein_percentage", label: "Protein (%)", type: "number", defaultValue: 25 },
    { name: "carbohydrate_percentage", label: "Carbohydrate (%)", type: "number", defaultValue: 50 },
    { name: "fat_percentage", label: "Fat (%)", type: "number", defaultValue: 25 },
    { name: "body_weight", label: "Body weight (kg)", type: "number", defaultValue: "" }
  ],
  "HLT-011": [
    { name: "calories", label: "Daily calories", type: "number", defaultValue: 1800 },
    { name: "protein_percentage", label: "Protein (%)", type: "number", defaultValue: 25 },
    { name: "carbohydrate_percentage", label: "Carbohydrate (%)", type: "number", defaultValue: 45 },
    { name: "fat_percentage", label: "Fat (%)", type: "number", defaultValue: 30 },
    { name: "body_weight", label: "Body weight (kg)", type: "number", defaultValue: "" }
  ],
  "HLT-012": [
    { name: "calories", label: "Daily calories", type: "number", defaultValue: 2000 },
    { name: "protein_percentage", label: "Protein (%)", type: "number", defaultValue: 30 },
    { name: "carbohydrate_percentage", label: "Carbohydrate (%)", type: "number", defaultValue: 40 },
    { name: "fat_percentage", label: "Fat (%)", type: "number", defaultValue: 30 },
    { name: "body_weight", label: "Body weight (kg)", type: "number", defaultValue: "" }
  ],
  "HLT-013": [
    { name: "met_value", label: "MET value of the activity", type: "number", defaultValue: 4.3, helperText: "Brisk walking is about 4.3, running at 10 km/h about 9.8, gentle cycling about 6." },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 70 },
    { name: "duration_minutes", label: "Duration (minutes)", type: "number", defaultValue: 45 },
    { name: "times_per_week", label: "Times per week", type: "number", defaultValue: 5 }
  ],
  "HLT-014": [
    { name: "distance_km", label: "Distance (km)", type: "number", defaultValue: 5 },
    { name: "hours", label: "Hours", type: "number", defaultValue: 0 },
    { name: "minutes", label: "Minutes", type: "number", defaultValue: 25 },
    { name: "seconds", label: "Seconds", type: "number", defaultValue: 0 }
  ],
  "HLT-015": [
    { name: "weight", label: "Weight lifted (kg)", type: "number", defaultValue: 100 },
    { name: "reps", label: "Repetitions completed", type: "number", defaultValue: 5, helperText: "Up to 10. Above that the formulas stop being reliable." }
  ],
  "HLT-016": [
    { name: "age", label: "Age", type: "number", defaultValue: 30 },
    { name: "resting_heart_rate", label: "Resting heart rate (bpm)", type: "number", defaultValue: "", helperText: "Optional, but it personalises the zones considerably. Measure it first thing, before getting up." }
  ],
  "HLT-017": [
    { name: "height", label: "Height (cm)", type: "number", defaultValue: 175 },
    { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 75 }
  ],
  "HLT-019": [
    { name: "last_period_date", label: "First day of your last period", type: "text", defaultValue: "2026-02-01", helperText: "In the form YYYY-MM-DD." },
    { name: "cycle_length", label: "Average cycle length (days)", type: "number", defaultValue: 28, helperText: "The classical due date rule assumes 28 days; this adjusts for yours." }
  ],
  "HLT-020": [
    { name: "last_period_date", label: "First day of your last period", type: "text", defaultValue: "2026-02-01", helperText: "In the form YYYY-MM-DD." },
    { name: "cycle_length", label: "Average cycle length (days)", type: "number", defaultValue: 28 }
  ],
  "HLT-022": [
    { name: "last_period_date", label: "First day of your last period", type: "text", defaultValue: "2026-06-01", helperText: "In the form YYYY-MM-DD." },
    { name: "cycle_length", label: "Average cycle length (days)", type: "number", defaultValue: 28 },
    { name: "luteal_phase", label: "Luteal phase length (days)", type: "number", defaultValue: 14, helperText: "The time between ovulation and your next period. 14 is the usual assumption." },
    { name: "cycles_to_show", label: "Cycles to show", type: "number", defaultValue: 3 }
  ],
  "HLT-023": [
    { name: "last_period_date", label: "First day of your last period", type: "text", defaultValue: "2026-06-01", helperText: "In the form YYYY-MM-DD." },
    { name: "cycle_length", label: "Average cycle length (days)", type: "number", defaultValue: 28 },
    { name: "period_length", label: "Period length (days)", type: "number", defaultValue: 5 },
    { name: "cycles_to_show", label: "Cycles to show", type: "number", defaultValue: 6 }
  ],
  "HLT-025": [
    { name: "mode", label: "What do you want to work out?", type: "select", defaultValue: "wake_time", options: SLEEP_MODE },
    { name: "time", label: "Time", type: "text", defaultValue: "07:00", helperText: "In 24-hour form, for example 22:30." },
    { name: "fall_asleep_minutes", label: "Minutes to fall asleep", type: "number", defaultValue: 15 },
    { name: "cycle_minutes", label: "Sleep cycle length (minutes)", type: "number", defaultValue: 90, helperText: "90 is the average; it genuinely varies between about 70 and 120." }
  ],

  // ---------------------------------------------------- Date & Time --------
  "DAT-002": [
    { name: "start_date", label: "Start date", type: "text", defaultValue: "2026-01-31", helperText: "In the form YYYY-MM-DD." },
    { name: "operation", label: "Add or subtract?", type: "select", defaultValue: "add", options: ADD_SUBTRACT },
    { name: "years", label: "Years", type: "number", defaultValue: 0 },
    { name: "months", label: "Months", type: "number", defaultValue: 1 },
    { name: "days", label: "Days", type: "number", defaultValue: 0 }
  ],
  "DAT-003": [
    { name: "start_date", label: "Start date", type: "text", defaultValue: "2026-04-01", helperText: "In the form YYYY-MM-DD." },
    { name: "end_date", label: "End date", type: "text", defaultValue: "2026-04-14" },
    { name: "include_working_days", label: "Count working days?", type: "select", defaultValue: "true", options: YES_NO, group: "Working days" },
    { name: "division", label: "Which part of the UK?", type: "select", defaultValue: "england-and-wales", options: UK_DIVISION, group: "Working days", showWhen: { field: "include_working_days", equals: ["true"] }, helperText: "The three divisions have genuinely different bank holidays." }
  ],
  "DAT-004": [
    { name: "date", label: "Date", type: "text", defaultValue: "2026-06-15", helperText: "In the form YYYY-MM-DD." }
  ],
  "DAT-005": [
    { name: "start_time", label: "Start time", type: "text", defaultValue: "09:30", helperText: "In 24-hour form, for example 14:30." },
    { name: "operation", label: "Add or subtract?", type: "select", defaultValue: "add", options: ADD_SUBTRACT },
    { name: "hours", label: "Hours", type: "number", defaultValue: 3 },
    { name: "minutes", label: "Minutes", type: "number", defaultValue: 15 },
    { name: "seconds", label: "Seconds", type: "number", defaultValue: 0 }
  ],
  "DAT-006": [
    { name: "start_time", label: "Start time", type: "text", defaultValue: "09:00", helperText: "In 24-hour form." },
    { name: "end_time", label: "End time", type: "text", defaultValue: "17:30", helperText: "An earlier end time is treated as a night shift crossing midnight." }
  ],
  "DAT-007": [
    { name: "shifts", label: "Shifts", type: "text", defaultValue: '[{"day":"Monday","start":"09:00","end":"17:00","break_minutes":30}]', helperText: 'A list of shifts, each with a start, an end and unpaid break minutes.' },
    { name: "overtime_threshold", label: "Overtime after (hours)", type: "number", defaultValue: 0, helperText: "Leave at 0 for no overtime split." }
  ],
  "DAT-008": [
    { name: "date", label: "Date", type: "text", defaultValue: "2026-03-20", helperText: "In the form YYYY-MM-DD." },
    { name: "time", label: "Time", type: "text", defaultValue: "12:00", helperText: "In 24-hour form, in the source zone." },
    { name: "source_zone", label: "From time zone", type: "text", defaultValue: "Europe/London", helperText: "An IANA name such as Europe/London, America/New_York or Asia/Tokyo." },
    { name: "target_zone", label: "To time zone", type: "text", defaultValue: "America/New_York" }
  ],
  "DAT-009": [
    { name: "shifts", label: "Shifts", type: "text", defaultValue: '[{"day":"Monday","start":"09:00","end":"17:00","break_minutes":30}]', helperText: 'A list of shifts, each with a day, start, end and unpaid break minutes.' },
    { name: "overtime_threshold", label: "Overtime after (hours a week)", type: "number", defaultValue: 40 },
    { name: "hourly_rate", label: "Hourly rate", type: "number", defaultValue: 15, group: "Pay" },
    { name: "overtime_multiplier", label: "Overtime multiplier", type: "number", defaultValue: 1.5, group: "Pay", helperText: "1.5 for time and a half." }
  ],

  // --- Automotive & Travel -------------------------------------------------
  "AUT-001": [
    { name: "vehicle_price", label: "Vehicle price", type: "number", defaultValue: 25000 },
    { name: "deposit", label: "Cash deposit", type: "number", defaultValue: 5000 },
    { name: "part_exchange", label: "Part exchange value", type: "number", defaultValue: 0, helperText: "What the dealer allows for your old car, after settling any finance still on it." },
    { name: "apr", label: "APR (%)", type: "number", defaultValue: 7.9, helperText: "The lender's annual percentage rate, as advertised." },
    { name: "term_months", label: "Term (months)", type: "number", defaultValue: 48 },
    { name: "fee", label: "Arrangement fee", type: "number", defaultValue: 0, group: "Fees" },
    { name: "fee_financed", label: "Is the fee added to the loan?", type: "select", defaultValue: "true", options: YES_NO, group: "Fees", helperText: "A financed fee attracts interest for the whole term." }
  ],
  "AUT-002": [
    { name: "monthly_rental", label: "Monthly rental, if you have a quote", type: "number", defaultValue: "", helperText: "Leave blank to work the rental out from the price and end value below." },
    { name: "term_months", label: "Term (months)", type: "number", defaultValue: 48, helperText: "A 9+39 quote is 48 months in total." },
    { name: "initial_rental_months", label: "Initial rental, in monthly rentals", type: "number", defaultValue: 9, helperText: "The 9 in a 9+39 deal. This is rent paid in advance, not a deposit, and none of it comes back." },
    { name: "documentation_fee", label: "Documentation fee", type: "number", defaultValue: 180 },
    { name: "vehicle_price", label: "Vehicle price", type: "number", defaultValue: 32000, group: "Working the rental out" },
    { name: "residual_value", label: "Value at the end of the lease", type: "number", defaultValue: 18000, group: "Working the rental out" },
    { name: "apr", label: "APR (%)", type: "number", defaultValue: 6.5, group: "Working the rental out" },
    { name: "annual_mileage_allowance", label: "Contracted miles a year", type: "number", defaultValue: 10000, group: "Mileage" },
    { name: "expected_annual_mileage", label: "Miles you expect to drive a year", type: "number", defaultValue: 12000, group: "Mileage" },
    { name: "excess_pence_per_mile", label: "Excess mileage charge (pence a mile)", type: "number", defaultValue: 9, group: "Mileage" }
  ],
  "AUT-003": [
    { name: "vehicle_price", label: "Vehicle price", type: "number", defaultValue: 30000 },
    { name: "deposit", label: "Your deposit", type: "number", defaultValue: 3000 },
    { name: "dealer_contribution", label: "Dealer deposit contribution", type: "number", defaultValue: 1000 },
    { name: "apr", label: "APR (%)", type: "number", defaultValue: 6.9 },
    { name: "term_months", label: "Term (months)", type: "number", defaultValue: 36 },
    { name: "gmfv", label: "Guaranteed future value, the optional final payment", type: "number", defaultValue: 14000, helperText: "Also called the balloon. You pay interest on it every month of the term even though none of it is repaid until the end." },
    { name: "option_fee", label: "Option to purchase fee", type: "number", defaultValue: 10, group: "Fees" },
    { name: "annual_mileage_allowance", label: "Contracted miles a year", type: "number", defaultValue: 10000, group: "Mileage" },
    { name: "expected_annual_mileage", label: "Miles you expect to drive a year", type: "number", defaultValue: 12000, group: "Mileage" },
    { name: "excess_pence_per_mile", label: "Excess mileage charge (pence a mile)", type: "number", defaultValue: 8, group: "Mileage" }
  ],
  "AUT-004": [
    { name: "vehicle_price", label: "Vehicle price", type: "number", defaultValue: 25000 },
    { name: "deposit", label: "Your deposit", type: "number", defaultValue: 5000 },
    { name: "apr", label: "APR (%)", type: "number", defaultValue: 7.9 },
    { name: "term_months", label: "Term (months)", type: "number", defaultValue: 48 },
    { name: "option_fee", label: "Option to purchase fee", type: "number", defaultValue: 10, helperText: "The small final payment that transfers ownership to you." }
  ],
  "AUT-005": [
    { name: "vehicle_price", label: "Vehicle price", type: "number", defaultValue: 30000 },
    { name: "deposit", label: "Your deposit", type: "number", defaultValue: 3000 },
    { name: "term_months", label: "Term (months)", type: "number", defaultValue: 36 },
    { name: "final_payment", label: "Optional final payment", type: "number", defaultValue: 14000, helperText: "Enter 0 for hire purchase or a personal loan, or the guaranteed future value for a PCP." },
    { name: "offer_a_contribution", label: "Offer A: deposit contribution", type: "number", defaultValue: 2000, group: "Offer A" },
    { name: "offer_a_apr", label: "Offer A: APR (%)", type: "number", defaultValue: 9.9, group: "Offer A" },
    { name: "offer_b_contribution", label: "Offer B: deposit contribution", type: "number", defaultValue: 0, group: "Offer B" },
    { name: "offer_b_apr", label: "Offer B: APR (%)", type: "number", defaultValue: 0, group: "Offer B" }
  ],
  "AUT-007": [
    { name: "distance", label: "Distance covered", type: "number", defaultValue: 300 },
    { name: "distance_unit", label: "Distance unit", type: "select", defaultValue: "miles", options: DISTANCE_UNIT },
    { name: "fuel_used", label: "Fuel used", type: "number", defaultValue: 30 },
    { name: "fuel_unit", label: "Fuel unit", type: "select", defaultValue: "litres", options: FUEL_UNIT, helperText: "A UK gallon is 4.546 litres; a US gallon is 3.785, which is why US mpg figures look worse." },
    { name: "fuel_price_pence", label: "Fuel price (pence a litre)", type: "number", defaultValue: 145, group: "Cost" }
  ],
  "AUT-008": [
    { name: "business_miles", label: "Business miles in the tax year", type: "number", defaultValue: 12000 },
    { name: "vehicle_type", label: "Vehicle", type: "select", defaultValue: "car_or_van", options: VEHICLE_TYPE },
    { name: "amount_paid", label: "Amount your employer paid you", type: "number", defaultValue: 0, helperText: "Enter 0 if your employer pays nothing towards business mileage." },
    { name: "marginal_rate", label: "Your marginal tax rate (%)", type: "number", defaultValue: 20, helperText: "20 for basic rate, 40 for higher rate, 45 for additional rate." },
    { name: "passenger_miles", label: "Miles carrying colleagues", type: "number", defaultValue: 0, group: "Passengers" },
    { name: "passengers", label: "Colleagues carried", type: "number", defaultValue: 0, group: "Passengers", helperText: "5p a mile per passenger, and only if your employer actually pays it." }
  ],
  "AUT-009": [
    { name: "battery_kwh", label: "Battery capacity (kWh)", type: "number", defaultValue: 64 },
    { name: "start_charge", label: "Starting charge (%)", type: "number", defaultValue: 20 },
    { name: "target_charge", label: "Target charge (%)", type: "number", defaultValue: 80 },
    { name: "price_pence_per_kwh", label: "Electricity price (pence a kWh)", type: "number", defaultValue: 24.5 },
    { name: "charging_efficiency", label: "Charging efficiency (%)", type: "number", defaultValue: 90, helperText: "You are billed for what the meter draws, which is more than what reaches the battery. Around 90% is typical at home." },
    { name: "session_fee", label: "Session or connection fee", type: "number", defaultValue: 0, group: "Charger" },
    { name: "charger_kw", label: "Charger power (kW)", type: "number", defaultValue: 7, group: "Charger" },
    { name: "miles_per_kwh", label: "Your car's miles per kWh", type: "number", defaultValue: 3.8, group: "Comparison" },
    { name: "petrol_price_pence", label: "Petrol price (pence a litre)", type: "number", defaultValue: 145, group: "Comparison" },
    { name: "petrol_mpg", label: "Petrol car economy (UK mpg)", type: "number", defaultValue: 45, group: "Comparison" }
  ],
  "AUT-010": [
    { name: "usable_battery_kwh", label: "Usable battery capacity (kWh)", type: "number", defaultValue: 64 },
    { name: "miles_per_kwh", label: "Your real consumption (miles per kWh)", type: "number", defaultValue: 3.8, helperText: "Use what your car actually achieves, not its WLTP figure." },
    { name: "current_charge", label: "Current charge (%)", type: "number", defaultValue: 80 },
    { name: "range_reduction", label: "Range reduction (%)", type: "number", defaultValue: 20, helperText: "Your own allowance for cold weather, motorway speed, a roof box or a full car. This calculator does not invent one for you." },
    { name: "reserve_charge", label: "Reserve to keep (%)", type: "number", defaultValue: 10 },
    { name: "journey_miles", label: "Journey distance (miles)", type: "number", defaultValue: 150, group: "Journey" }
  ],
  "AUT-011": [
    { name: "purchase_price", label: "Purchase price", type: "number", defaultValue: 30000 },
    { name: "years", label: "Years of ownership", type: "number", defaultValue: 3 },
    { name: "first_year_rate", label: "First year depreciation (%)", type: "number", defaultValue: 25 },
    { name: "subsequent_rate", label: "Each later year (%)", type: "number", defaultValue: 15 },
    { name: "expected_value", label: "Known value at the end", type: "number", defaultValue: "", group: "Or fit to a known value", helperText: "If you know roughly what the car will be worth, enter it here and the two rates above are ignored." },
    { name: "annual_mileage", label: "Miles a year", type: "number", defaultValue: 10000, group: "Cost per mile" }
  ],
  "AUT-012": [
    { name: "method", label: "How do you want to work it out?", type: "select", defaultValue: "torque", options: POWER_METHOD },
    { name: "torque", label: "Torque", type: "number", defaultValue: 300, showWhen: { field: "method", equals: ["torque"] } },
    { name: "torque_unit", label: "Torque unit", type: "select", defaultValue: "lb_ft", options: TORQUE_UNIT, showWhen: { field: "method", equals: ["torque"] } },
    { name: "rpm", label: "Engine speed (rpm)", type: "number", defaultValue: 5000, showWhen: { field: "method", equals: ["torque"] } },
    { name: "weight_lb", label: "Vehicle weight (lb, with driver)", type: "number", defaultValue: 3200, showWhen: { field: "method", equals: ["trap_speed", "elapsed_time"] } },
    { name: "trap_speed_mph", label: "Quarter-mile trap speed (mph)", type: "number", defaultValue: 105, showWhen: { field: "method", equals: ["trap_speed"] } },
    { name: "elapsed_time", label: "Quarter-mile elapsed time (seconds)", type: "number", defaultValue: 13.5, showWhen: { field: "method", equals: ["elapsed_time"] } }
  ],

  // --- Science & Engineering ------------------------------------------------
  "SCI-001": [
    { name: "voltage", label: "Voltage (V)", type: "number", defaultValue: 12, helperText: "Fill in any TWO of these four and leave the rest blank." },
    { name: "current", label: "Current (A)", type: "number", defaultValue: 2 },
    { name: "resistance", label: "Resistance (Ω)", type: "number", defaultValue: "" },
    { name: "power", label: "Power (W)", type: "number", defaultValue: "" }
  ],
  "SCI-002": [
    { name: "current", label: "Design current (A)", type: "number", defaultValue: 32 },
    { name: "length_m", label: "Cable run (m)", type: "number", defaultValue: 25, helperText: "The one-way length; the return conductor is allowed for in the calculation." },
    { name: "csa_mm2", label: "Conductor size (mm²)", type: "number", defaultValue: 6 },
    { name: "conductor", label: "Conductor material", type: "select", defaultValue: "copper", options: CONDUCTOR },
    { name: "system", label: "Supply system", type: "select", defaultValue: "single_phase", options: SUPPLY_SYSTEM },
    { name: "nominal_voltage", label: "Nominal voltage (V)", type: "number", defaultValue: 230 },
    { name: "circuit_use", label: "Circuit type", type: "select", defaultValue: "other", options: CIRCUIT_USE },
    { name: "operating_temperature", label: "Conductor operating temperature (°C)", type: "number", defaultValue: 70, helperText: "70 °C for standard thermoplastic insulation. Calculating at 20 °C flatters the design by about a fifth." }
  ],
  "SCI-003": [
    { name: "power_watts", label: "Appliance power (W)", type: "number", defaultValue: 2000 },
    { name: "hours_per_day", label: "Hours used a day", type: "number", defaultValue: 1 },
    { name: "days", label: "Over how many days?", type: "number", defaultValue: 365 },
    { name: "price_pence_per_kwh", label: "Unit rate (pence a kWh)", type: "number", defaultValue: 24.5, helperText: "From your own bill. Rates differ by supplier, tariff, payment method and region." },
    { name: "standing_charge_pence_per_day", label: "Standing charge (pence a day)", type: "number", defaultValue: 60 },
    { name: "uses_per_day", label: "Uses a day", type: "number", defaultValue: "", group: "Cost per use" }
  ],
  "SCI-004": [
    { name: "mode", label: "What do you want to do?", type: "select", defaultValue: "colour_code", options: RESISTOR_MODE },
    { name: "band1", label: "Band 1", type: "select", defaultValue: "yellow", options: BAND_COLOURS, showWhen: { field: "mode", equals: ["colour_code"] } },
    { name: "band2", label: "Band 2", type: "select", defaultValue: "violet", options: BAND_COLOURS, showWhen: { field: "mode", equals: ["colour_code"] } },
    { name: "band3", label: "Band 3", type: "select", defaultValue: "red", options: ANY_BAND_COLOUR, showWhen: { field: "mode", equals: ["colour_code"] }, helperText: "The multiplier on a 4-band resistor; a third digit on a 5- or 6-band one." },
    { name: "band4", label: "Band 4", type: "select", defaultValue: "gold", options: ANY_BAND_COLOUR, showWhen: { field: "mode", equals: ["colour_code"] }, helperText: "The tolerance on a 4-band resistor; the multiplier on a 5- or 6-band one." },
    { name: "band5", label: "Band 5", type: "select", defaultValue: "none", options: ANY_BAND_COLOUR, showWhen: { field: "mode", equals: ["colour_code"] }, helperText: "Leave as None for a 4-band resistor." },
    { name: "band6", label: "Band 6", type: "select", defaultValue: "none", options: TEMPCO_COLOURS, showWhen: { field: "mode", equals: ["colour_code"] } },
    { name: "resistances", label: "Resistances in ohms", type: "text", defaultValue: "100, 220, 330", showWhen: { field: "mode", equals: ["network"] }, helperText: "Separated by commas." }
  ],
  "SCI-005": [
    { name: "mass", label: "Mass", type: "number", defaultValue: 2, helperText: "Fill in any TWO of mass, volume and density." },
    { name: "mass_unit", label: "Mass unit", type: "select", defaultValue: "kg", options: MASS_UNIT },
    { name: "volume", label: "Volume", type: "number", defaultValue: 2.5 },
    { name: "volume_unit", label: "Volume unit", type: "select", defaultValue: "litre", options: VOLUME_UNIT },
    { name: "density", label: "Density (kg/m³)", type: "number", defaultValue: "" }
  ],
  "SCI-006": [
    { name: "molarity", label: "Concentration (mol/L)", type: "number", defaultValue: "", helperText: "Fill in any TWO of concentration, moles and volume." },
    { name: "moles", label: "Moles", type: "number", defaultValue: "" },
    { name: "volume_litres", label: "Volume (litres)", type: "number", defaultValue: 0.5 },
    { name: "mass_grams", label: "Mass weighed out (g)", type: "number", defaultValue: 5.85, group: "From a mass instead of moles" },
    { name: "molar_mass", label: "Molar mass (g/mol)", type: "number", defaultValue: 58.44, group: "From a mass instead of moles" },
    { name: "target_molarity", label: "Dilute to (mol/L)", type: "number", defaultValue: "", group: "Dilution" }
  ],
  "SCI-007": [
    { name: "formula", label: "Chemical formula", type: "text", defaultValue: "CuSO4.5H2O", helperText: "Brackets and hydrates are understood, as in Ca(OH)2 or CuSO4.5H2O." }
  ],
  "SCI-008": [
    { name: "temperature", label: "Air temperature", type: "number", defaultValue: 32 },
    { name: "temperature_unit", label: "Temperature unit", type: "select", defaultValue: "c", options: TEMPERATURE_UNIT },
    { name: "relative_humidity", label: "Relative humidity (%)", type: "number", defaultValue: 70 }
  ],
  "SCI-009": [
    { name: "temperature", label: "Air temperature", type: "number", defaultValue: -5, helperText: "Wind chill is only defined at or below 10 °C." },
    { name: "temperature_unit", label: "Temperature unit", type: "select", defaultValue: "c", options: TEMPERATURE_UNIT },
    { name: "wind_speed", label: "Wind speed", type: "number", defaultValue: 30, helperText: "Only defined above 4.8 km/h, about 3 mph." },
    { name: "wind_speed_unit", label: "Wind speed unit", type: "select", defaultValue: "kmh", options: WIND_SPEED_UNIT }
  ],
  "SCI-010": [
    { name: "temperature", label: "Air temperature", type: "number", defaultValue: 20 },
    { name: "temperature_unit", label: "Temperature unit", type: "select", defaultValue: "c", options: TEMPERATURE_UNIT },
    { name: "relative_humidity", label: "Relative humidity (%)", type: "number", defaultValue: 65, helperText: "Enter this OR the dew point below, and the other is worked out." },
    { name: "dew_point", label: "Dew point", type: "number", defaultValue: "" }
  ],
  "SCI-011": [
    { name: "length_m", label: "Room length (m)", type: "number", defaultValue: 4 },
    { name: "width_m", label: "Room width (m)", type: "number", defaultValue: 3.5 },
    { name: "height_m", label: "Ceiling height (m)", type: "number", defaultValue: 2.4 },
    { name: "watts_per_m3", label: "Heat needed (watts per m³)", type: "number", defaultValue: 40, helperText: "Yours to set. Roughly 25 for a well insulated room, 40 for typical, 70 or more for a solid-walled room with large windows, and about 100 for a conservatory." },
    { name: "price_pence_per_kwh", label: "Fuel price (pence a kWh)", type: "number", defaultValue: 7, group: "Running cost" }
  ],

  // --- Home & Construction --------------------------------------------------
  "HOM-001": [
    { name: "shape", label: "What are you pouring?", type: "select", defaultValue: "slab", options: CONCRETE_SHAPE },
    { name: "length_m", label: "Length (m)", type: "number", defaultValue: 5 },
    { name: "width_m", label: "Width, or diameter for a column (m)", type: "number", defaultValue: 4 },
    { name: "depth_m", label: "Depth or height (m)", type: "number", defaultValue: 0.1 },
    { name: "quantity", label: "How many identical pours?", type: "number", defaultValue: 1 },
    { name: "mix_ratio", label: "Mix ratio (cement : sand : aggregate)", type: "select", defaultValue: "1:2:4", options: CONCRETE_MIX, helperText: "By volume, which is how a mix is specified on site." },
    { name: "wastage_pct", label: "Wastage allowance (%)", type: "number", defaultValue: 10 },
    { name: "concrete_density", label: "Concrete density (kg/m³)", type: "number", defaultValue: 2400, group: "Advanced" }
  ],
  "HOM-002": [
    { name: "roof_type", label: "Roof type", type: "select", defaultValue: "gable", options: ROOF_TYPE },
    { name: "length_m", label: "Building length (m)", type: "number", defaultValue: 10 },
    { name: "width_m", label: "Building width (m)", type: "number", defaultValue: 8 },
    { name: "pitch_degrees", label: "Roof pitch (degrees)", type: "number", defaultValue: 30 },
    { name: "tiles_per_m2", label: "Tiles or slates per m²", type: "number", defaultValue: 10, helperText: "From the manufacturer's cover figure at your batten gauge." },
    { name: "batten_spacing_mm", label: "Batten gauge (mm)", type: "number", defaultValue: 300 },
    { name: "wastage_pct", label: "Wastage allowance (%)", type: "number", defaultValue: 10 },
    { name: "underlay_roll_m2", label: "Underlay roll coverage (m²)", type: "number", defaultValue: 30 }
  ],
  "HOM-003": [
    { name: "length_m", label: "Length (m)", type: "number", defaultValue: 3 },
    { name: "width_m", label: "Width or height (m)", type: "number", defaultValue: 2.4 },
    { name: "area_m2", label: "Or enter the area directly (m²)", type: "number", defaultValue: "" },
    { name: "openings_m2", label: "Doors and windows to deduct (m²)", type: "number", defaultValue: 0 },
    { name: "tile_width_mm", label: "Tile width (mm)", type: "number", defaultValue: 300 },
    { name: "tile_height_mm", label: "Tile height (mm)", type: "number", defaultValue: 300 },
    { name: "grout_gap_mm", label: "Grout gap (mm)", type: "number", defaultValue: 3 },
    { name: "wastage_pct", label: "Wastage allowance (%)", type: "number", defaultValue: 10, helperText: "10% suits straight courses in a square room. A diagonal layout or a patterned tile needs more." },
    { name: "tiles_per_box", label: "Tiles per box", type: "number", defaultValue: 10 },
    { name: "adhesive_kg_per_m2", label: "Adhesive coverage (kg per m²)", type: "number", defaultValue: 4 }
  ],
  "HOM-004": [
    { name: "length_m", label: "Length (m)", type: "number", defaultValue: 10 },
    { name: "width_m", label: "Width (m)", type: "number", defaultValue: 4 },
    { name: "area_m2", label: "Or enter the area directly (m²)", type: "number", defaultValue: "" },
    { name: "depth_mm", label: "Depth (mm)", type: "number", defaultValue: 50, helperText: "About 50 mm over a compacted sub-base is usual for a drive." },
    { name: "bulk_density", label: "Bulk density (kg/m³)", type: "number", defaultValue: 1500, helperText: "Gravel runs about 1,400 to 1,700 depending on stone size and moisture. Use your supplier's figure." },
    { name: "bag_size_litres", label: "Bag size (litres)", type: "number", defaultValue: 25, group: "Packaging" },
    { name: "bulk_bag_m3", label: "Bulk bag size (m³)", type: "number", defaultValue: 0.5, group: "Packaging" }
  ],
  "HOM-005": [
    { name: "length_m", label: "Length (m)", type: "number", defaultValue: 6 },
    { name: "width_m", label: "Width (m)", type: "number", defaultValue: 3 },
    { name: "area_m2", label: "Or enter the area directly (m²)", type: "number", defaultValue: "" },
    { name: "depth_mm", label: "Depth (mm)", type: "number", defaultValue: 75, helperText: "50 to 75 mm is the usual range: thinner and weeds come through, much thicker and it sheds rain." },
    { name: "bulk_density", label: "Bulk density (kg/m³)", type: "number", defaultValue: 350, helperText: "Bark mulch is light, around 250 to 400." },
    { name: "bag_size_litres", label: "Bag size (litres)", type: "number", defaultValue: 70, group: "Packaging" },
    { name: "bulk_bag_m3", label: "Bulk bag size (m³)", type: "number", defaultValue: 1, group: "Packaging" }
  ],
  "HOM-006": [
    { name: "total_rise_mm", label: "Total rise, floor to floor (mm)", type: "number", defaultValue: 2600, helperText: "The finished floor level below to the finished floor level above." },
    { name: "preferred_rise_mm", label: "Preferred rise per step (mm)", type: "number", defaultValue: 190, helperText: "The actual rise will differ, because the number of steps has to be a whole number." },
    { name: "going_mm", label: "Going, the depth of each tread (mm)", type: "number", defaultValue: 230 }
  ]
  ,

  // --- Conversions ----------------------------------------------------------
  "CON-002": [
    { name: "value", label: "Value", type: "number", defaultValue: 1 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "mile", options: LENGTH_UNIT_OPTIONS },
    { name: "to_unit", label: "To", type: "select", defaultValue: "kilometre", options: LENGTH_UNIT_OPTIONS }
  ],
  "CON-003": [
    { name: "value", label: "Value", type: "number", defaultValue: 1 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "stone", options: MASS_UNIT_OPTIONS },
    { name: "to_unit", label: "To", type: "select", defaultValue: "kilogram", options: MASS_UNIT_OPTIONS }
  ],
  "CON-004": [
    { name: "value", label: "Value", type: "number", defaultValue: 20 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "celsius", options: TEMPERATURE_SCALE },
    { name: "to_unit", label: "To", type: "select", defaultValue: "fahrenheit", options: TEMPERATURE_SCALE }
  ],
  "CON-005": [
    { name: "value", label: "Value", type: "number", defaultValue: 1 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "acre", options: AREA_UNIT_OPTIONS },
    { name: "to_unit", label: "To", type: "select", defaultValue: "square_metre", options: AREA_UNIT_OPTIONS }
  ],
  "CON-006": [
    { name: "value", label: "Value", type: "number", defaultValue: 1 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "uk_pint", options: VOLUME_UNIT_OPTIONS, helperText: "UK and US measures share their names and not their sizes." },
    { name: "to_unit", label: "To", type: "select", defaultValue: "millilitre", options: VOLUME_UNIT_OPTIONS }
  ],
  "CON-007": [
    { name: "value", label: "Value", type: "number", defaultValue: 60 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "miles_per_hour", options: SPEED_UNIT_OPTIONS },
    { name: "to_unit", label: "To", type: "select", defaultValue: "kilometres_per_hour", options: SPEED_UNIT_OPTIONS }
  ],
  "CON-008": [
    { name: "value", label: "Value", type: "number", defaultValue: 40 },
    { name: "from_unit", label: "From", type: "select", defaultValue: "mpg_imperial", options: FUEL_ECONOMY_UNIT },
    { name: "to_unit", label: "To", type: "select", defaultValue: "litres_per_100km", options: FUEL_ECONOMY_UNIT, helperText: "Litres per 100 km runs the other way: lower is better." }
  ],
  "CON-009": [
    { name: "size", label: "Size", type: "number", defaultValue: 9 },
    { name: "from_system", label: "In which system?", type: "select", defaultValue: "uk", options: SHOE_SYSTEM },
    { name: "gender", label: "Men's or women's sizing?", type: "select", defaultValue: "men", options: SHOE_GENDER }
  ],

  // --- Technology & Digital -------------------------------------------------
  "TEC-001": [
    { name: "address", label: "IP address", type: "text", defaultValue: "192.168.1.130", helperText: "Four numbers from 0 to 255, separated by dots." },
    { name: "prefix_length", label: "Prefix length (the number after the slash)", type: "number", defaultValue: 26, helperText: "24 is a common office subnet; 30 and 31 are point-to-point links." }
  ],
  "TEC-002": [
    { name: "file_size", label: "File size", type: "number", defaultValue: 1 },
    { name: "size_unit", label: "Size unit", type: "select", defaultValue: "gigabyte", options: DATA_SIZE_UNIT, helperText: "Drives are sold in decimal units; your operating system reports binary ones." },
    { name: "speed_mbps", label: "Connection speed (megaBITS a second)", type: "number", defaultValue: 100, helperText: "As advertised. Note this is bits, not bytes: a factor of eight." },
    { name: "overhead_pct", label: "Protocol overhead (%)", type: "number", defaultValue: 0, helperText: "A real transfer never reaches the headline rate. 5 to 15% is typical." }
  ],
  "TEC-003": [
    { name: "direction", label: "Encode or decode?", type: "select", defaultValue: "encode", options: CODEC_DIRECTION },
    { name: "text", label: "Text", type: "text", defaultValue: "Hello, world!" },
    { name: "url_safe", label: "Use the URL-safe alphabet?", type: "select", defaultValue: "false", options: YES_NO, showWhen: { field: "direction", equals: ["encode"] } }
  ],
  "TEC-004": [
    { name: "direction", label: "Encode or decode?", type: "select", defaultValue: "encode", options: CODEC_DIRECTION },
    { name: "mode", label: "What are you encoding?", type: "select", defaultValue: "component", options: URL_ENCODE_MODE, helperText: "These are not interchangeable: a value must escape the characters a whole URL keeps." },
    { name: "text", label: "Text", type: "text", defaultValue: "a=1&b=2 c" }
  ],
  "TEC-005": [
    { name: "length", label: "Length", type: "number", defaultValue: 20 },
    { name: "include_uppercase", label: "Include uppercase letters?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "include_lowercase", label: "Include lowercase letters?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "include_digits", label: "Include digits?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "include_symbols", label: "Include symbols?", type: "select", defaultValue: "true", options: YES_NO },
    { name: "exclude_ambiguous", label: "Exclude look-alike characters?", type: "select", defaultValue: "false", options: YES_NO, helperText: "Drops I, O, l, 0 and 1, which shrinks the alphabet slightly." },
    { name: "guesses_per_second", label: "Assumed guessing rate", type: "number", defaultValue: 1000000000000, group: "Attack assumption", helperText: "A trillion a second is a reasonable figure for an offline attack on a fast hash." }
  ],

  // --- Education ------------------------------------------------------------
  "EDU-001": [
    { name: "assessments", label: "Assessments", type: "text", defaultValue: "Coursework:68:40; Exam:72:60", helperText: "Name:mark:weight, separated by semicolons. Weights need not add to 100." }
  ],
  "EDU-002": [
    { name: "years", label: "Years", type: "text", defaultValue: "2:64:25; 3:69:75", helperText: "Year:average:weighting, separated by semicolons. Check your own programme regulations for the weightings." }
  ],
  "EDU-003": [
    { name: "qualifications", label: "Qualifications", type: "text", defaultValue: "a_level:A; a_level:A; a_level:B; epq:A", helperText: "type:grade, separated by semicolons. Types are a_level, as_level and epq." }
  ],
  "EDU-004": [
    { name: "years", label: "Course length (years)", type: "number", defaultValue: 3 },
    { name: "tuition_per_year", label: "Tuition fee a year", type: "number", defaultValue: 9790 },
    { name: "living_arrangement", label: "Where will you live?", type: "select", defaultValue: "away_outside_london", options: LIVING_ARRANGEMENT },
    { name: "maintenance_loan", label: "Maintenance loan a year", type: "number", defaultValue: "", helperText: "From your award letter. Leave blank to use the maximum for your circumstances, which most students do not receive." },
    { name: "rent_per_month", label: "Rent a month", type: "number", defaultValue: 650, group: "Living costs" },
    { name: "other_living_per_month", label: "Everything else a month", type: "number", defaultValue: 400, group: "Living costs" },
    { name: "months_per_year", label: "Months a year you pay for", type: "number", defaultValue: 9, group: "Living costs", helperText: "A typical term-time contract is 9 months; a 12-month tenancy costs more." }
  ],
  "EDU-005": [
    { name: "loan_per_term", label: "Loan instalment this term", type: "number", defaultValue: 3610 },
    { name: "other_income_per_term", label: "Other income this term", type: "number", defaultValue: 500, helperText: "Work, grants, family contributions." },
    { name: "rent_per_week", label: "Rent a week", type: "number", defaultValue: 150 },
    { name: "other_spending_per_week", label: "Everything else a week", type: "number", defaultValue: 120 },
    { name: "weeks_in_term", label: "Weeks in the term", type: "number", defaultValue: 13 }
  ],

  // --- Everyday & Lifestyle -------------------------------------------------
  "EVE-001": [
    { name: "bill", label: "Bill", type: "number", defaultValue: 120 },
    { name: "service_charge_pct", label: "Service charge already added (%)", type: "number", defaultValue: 12.5, helperText: "Enter 0 if none. A discretionary service charge can be removed on request." },
    { name: "tip_pct", label: "Additional tip (%)", type: "number", defaultValue: 10, helperText: "Calculated on the bill, not on the bill plus the service charge." },
    { name: "people", label: "Splitting between", type: "number", defaultValue: 4 },
    { name: "round_to", label: "Round the total up to the nearest", type: "number", defaultValue: 1, helperText: "Enter 0 for no rounding." }
  ],
  "EVE-003": [
    { name: "width_mm", label: "Width (mm)", type: "number", defaultValue: 225, helperText: "The first number on the sidewall, as in 225/45R17." },
    { name: "aspect_ratio", label: "Aspect ratio (%)", type: "number", defaultValue: 45, helperText: "The second number: the sidewall height as a percentage of the width." },
    { name: "rim_inches", label: "Rim diameter (inches)", type: "number", defaultValue: 17, helperText: "The number after the R, in inches." },
    { name: "reference_width_mm", label: "Original width (mm)", type: "number", defaultValue: 205, group: "Compare against your original tyre" },
    { name: "reference_aspect_ratio", label: "Original aspect ratio (%)", type: "number", defaultValue: 55, group: "Compare against your original tyre" },
    { name: "reference_rim_inches", label: "Original rim (inches)", type: "number", defaultValue: 16, group: "Compare against your original tyre" }
  ]
};
