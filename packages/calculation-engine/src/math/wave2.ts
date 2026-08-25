/**
 * Wave 2 Maths & Algebra calculators.
 *
 * Pure mathematics: no statutory values, no rules dependency. Percentages
 * arrive as human percentages and are normalised exactly once.
 *
 * Where a result is only approximately representable in floating point, that
 * is stated rather than papered over, and integer work is kept in integers.
 */
import { assertFiniteNumber } from "../common/validation.js";

const MAX_INTEGER_FOR_FACTORING = 1e12;

function requireInteger(value: number, label: string): number {
  const n = assertFiniteNumber(value, label);
  if (!Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  return n;
}

// ---------------------------------------------------------------------------
// MAT-004 Percent Off
// ---------------------------------------------------------------------------

export interface PercentOffResult {
  original_price: number;
  first_discount: number;
  price_after_first: number;
  second_discount: number;
  final_price: number;
  total_saving: number;
  effective_single_discount: number;
  sum_of_discounts_would_have_been: number;
  stacking_saves_less_than_adding: boolean;
}

/**
 * One or two successive discounts.
 *
 * Two 20% discounts applied one after the other are NOT 40% off: they are 36%
 * off, because the second is taken from an already reduced price. Shops
 * advertise "extra 20% off sale prices" precisely because it sounds like more
 * than it is, so both figures are shown side by side.
 */
export function percentOff(
  originalPrice: number,
  firstDiscountPct: number,
  secondDiscountPct: number
): PercentOffResult {
  const price = assertFiniteNumber(originalPrice, "Original price");
  const first = assertFiniteNumber(firstDiscountPct, "Discount") / 100;
  const second = assertFiniteNumber(secondDiscountPct, "Second discount") / 100;

  if (price < 0) throw new Error("A price cannot be negative.");
  for (const [name, value] of [["first", first], ["second", second]] as const) {
    if (value < 0 || value > 1) {
      throw new Error(`The ${name} discount must be between 0% and 100%.`);
    }
  }

  const afterFirst = price * (1 - first);
  const final = afterFirst * (1 - second);
  const saving = price - final;
  const effective = price === 0 ? 0 : saving / price;
  const naiveSum = Math.min(1, first + second);

  return {
    original_price: price,
    first_discount: first,
    price_after_first: afterFirst,
    second_discount: second,
    final_price: final,
    total_saving: saving,
    effective_single_discount: effective,
    sum_of_discounts_would_have_been: naiveSum,
    stacking_saves_less_than_adding: second > 0 && effective < naiveSum - 1e-12
  };
}

// ---------------------------------------------------------------------------
// MAT-007 Rounding
// ---------------------------------------------------------------------------

export type RoundingMode = "half_up" | "half_even" | "up" | "down" | "towards_zero";

export function normaliseRoundingMode(value: unknown): RoundingMode {
  const raw = String(value ?? "half_up").toLowerCase().trim();
  if (raw === "half_even" || raw === "bankers") return "half_even";
  if (raw === "up" || raw === "ceiling") return "up";
  if (raw === "down" || raw === "floor") return "down";
  if (raw === "towards_zero" || raw === "truncate") return "towards_zero";
  return "half_up";
}

export interface RoundingResult {
  value: number;
  rounded_to_decimal_places: number;
  rounded_to_significant_figures: number;
  rounded_to_nearest_multiple: number;
  rounded_up: number;
  rounded_down: number;
  truncated: number;
  bankers_rounding: number;
  mode_used: RoundingMode;
  result: number;
  difference_from_original: number;
}

function roundHalfEven(value: number, places: number): number {
  const factor = Math.pow(10, places);
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let result: number;
  if (Math.abs(diff - 0.5) < 1e-9) {
    // Exactly a half: go to the even neighbour. This is what stops a long run
    // of roundings from drifting upwards, which is why accountants use it.
    result = floor % 2 === 0 ? floor : floor + 1;
  } else {
    result = Math.round(scaled);
  }
  return result / factor;
}

function roundSignificant(value: number, figures: number): number {
  if (value === 0) return 0;
  const magnitude = Math.ceil(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, figures - magnitude);
  return Math.round(value * factor) / factor;
}

export function rounding(
  value: number,
  decimalPlaces: number,
  significantFigures: number,
  nearestMultiple: number,
  mode: RoundingMode
): RoundingResult {
  const v = assertFiniteNumber(value, "Value");
  const dp = requireInteger(decimalPlaces, "Decimal places");
  const sf = requireInteger(significantFigures, "Significant figures");
  const multiple = assertFiniteNumber(nearestMultiple, "Nearest multiple");

  if (dp < 0 || dp > 15) throw new Error("Decimal places must be between 0 and 15.");
  if (sf < 1 || sf > 15) throw new Error("Significant figures must be between 1 and 15.");

  const factor = Math.pow(10, dp);
  const halfUp = Math.sign(v) * Math.round(Math.abs(v) * factor) / factor;
  const up = Math.ceil(v * factor) / factor;
  const down = Math.floor(v * factor) / factor;
  const truncated = Math.trunc(v * factor) / factor;
  const halfEven = roundHalfEven(v, dp);

  const byMode: Record<RoundingMode, number> = {
    half_up: halfUp,
    half_even: halfEven,
    up,
    down,
    towards_zero: truncated
  };
  const result = byMode[mode];

  return {
    value: v,
    rounded_to_decimal_places: halfUp,
    rounded_to_significant_figures: roundSignificant(v, sf),
    rounded_to_nearest_multiple: multiple === 0 ? v : Math.round(v / multiple) * multiple,
    rounded_up: up,
    rounded_down: down,
    truncated,
    bankers_rounding: halfEven,
    mode_used: mode,
    result,
    difference_from_original: result - v
  };
}

// ---------------------------------------------------------------------------
// MAT-008 Exponent, MAT-009 Root, MAT-010 Logarithm
// ---------------------------------------------------------------------------

export interface ExponentResult {
  base: number;
  exponent: number;
  result: number;
  reciprocal: number | null;
  squared: number;
  cubed: number;
  is_exact_integer: boolean;
}

export function exponent(base: number, power: number): ExponentResult {
  const b = assertFiniteNumber(base, "Base");
  const e = assertFiniteNumber(power, "Exponent");

  if (b === 0 && e < 0) {
    throw new Error("Zero cannot be raised to a negative power: that would be division by zero.");
  }
  if (b < 0 && !Number.isInteger(e)) {
    throw new Error(
      "A negative number raised to a fractional power has no real result. Use a positive base, or a whole-number exponent."
    );
  }

  const result = Math.pow(b, e);
  if (!Number.isFinite(result)) {
    throw new Error("That power is too large to represent.");
  }

  return {
    base: b,
    exponent: e,
    result,
    reciprocal: result === 0 ? null : 1 / result,
    squared: b * b,
    cubed: b * b * b,
    is_exact_integer: Number.isInteger(result) && Math.abs(result) < Number.MAX_SAFE_INTEGER
  };
}

export interface RootResult {
  value: number;
  index: number;
  root: number;
  check: number;
  square_root: number | null;
  cube_root: number;
  is_perfect_root: boolean;
}

export function root(value: number, index: number): RootResult {
  const v = assertFiniteNumber(value, "Value");
  const n = assertFiniteNumber(index, "Root index");

  if (n === 0) throw new Error("A zeroth root is not defined.");
  if (v < 0 && Number.isInteger(n) && n % 2 === 0) {
    throw new Error(
      "An even root of a negative number has no real result. Odd roots of negatives are fine."
    );
  }

  // Odd roots of negative numbers are real, but Math.pow returns NaN for them,
  // so the sign is handled explicitly rather than lost.
  const magnitude = Math.pow(Math.abs(v), 1 / n);
  const r = v < 0 ? -magnitude : magnitude;

  return {
    value: v,
    index: n,
    root: r,
    check: Math.pow(r, n),
    square_root: v < 0 ? null : Math.sqrt(v),
    cube_root: Math.cbrt(v),
    is_perfect_root: Math.abs(Math.round(r) - r) < 1e-9 && Number.isInteger(v)
  };
}

export interface LogarithmResult {
  value: number;
  base: number;
  logarithm: number;
  natural_log: number;
  log_base_10: number;
  log_base_2: number;
  check: number;
}

export function logarithm(value: number, base: number): LogarithmResult {
  const v = assertFiniteNumber(value, "Value");
  const b = assertFiniteNumber(base, "Base");

  if (v <= 0) throw new Error("A logarithm is defined only for values greater than zero.");
  if (b <= 0 || b === 1) {
    throw new Error("A logarithm base must be greater than zero and not equal to 1.");
  }

  const log = Math.log(v) / Math.log(b);
  return {
    value: v,
    base: b,
    logarithm: log,
    natural_log: Math.log(v),
    log_base_10: Math.log10(v),
    log_base_2: Math.log2(v),
    check: Math.pow(b, log)
  };
}

// ---------------------------------------------------------------------------
// MAT-011 Scientific Notation
// ---------------------------------------------------------------------------

export interface ScientificNotationResult {
  value: number;
  coefficient: number;
  exponent: number;
  scientific_notation: string;
  engineering_coefficient: number;
  engineering_exponent: number;
  engineering_notation: string;
  significant_figures: number;
  order_of_magnitude: number;
}

export function scientificNotation(value: number, significantFigures: number): ScientificNotationResult {
  const v = assertFiniteNumber(value, "Value");
  const sf = requireInteger(significantFigures, "Significant figures");
  if (sf < 1 || sf > 15) throw new Error("Significant figures must be between 1 and 15.");

  if (v === 0) {
    return {
      value: 0, coefficient: 0, exponent: 0, scientific_notation: "0",
      engineering_coefficient: 0, engineering_exponent: 0, engineering_notation: "0",
      significant_figures: sf, order_of_magnitude: 0
    };
  }

  const exponentValue = Math.floor(Math.log10(Math.abs(v)));
  const coefficient = Number((v / Math.pow(10, exponentValue)).toPrecision(sf));

  // Engineering notation uses exponents that are multiples of three, so the
  // coefficient maps onto the usual prefixes: kilo, mega, milli and so on.
  const engExponent = Math.floor(exponentValue / 3) * 3;
  const engCoefficient = Number((v / Math.pow(10, engExponent)).toPrecision(sf));

  return {
    value: v,
    coefficient,
    exponent: exponentValue,
    scientific_notation: `${coefficient} x 10^${exponentValue}`,
    engineering_coefficient: engCoefficient,
    engineering_exponent: engExponent,
    engineering_notation: `${engCoefficient} x 10^${engExponent}`,
    significant_figures: sf,
    order_of_magnitude: exponentValue
  };
}

// ---------------------------------------------------------------------------
// MAT-012 Quadratic Formula
// ---------------------------------------------------------------------------

export interface QuadraticResult {
  a: number;
  b: number;
  c: number;
  discriminant: number;
  nature_of_roots: string;
  root_1: number | null;
  root_2: number | null;
  real_part: number | null;
  imaginary_part: number | null;
  vertex_x: number;
  vertex_y: number;
  axis_of_symmetry: number;
  opens_upwards: boolean;
  sum_of_roots: number;
  product_of_roots: number;
}

/**
 * Roots of a quadratic.
 *
 * The naive formula loses catastrophic precision when b is large relative to
 * 4ac, because one root is then the difference of two nearly equal numbers.
 * The numerically stable form computes the larger root first and obtains the
 * other from the product of the roots, which has no cancellation at all.
 */
export function quadratic(a: number, b: number, c: number): QuadraticResult {
  const A = assertFiniteNumber(a, "a");
  const B = assertFiniteNumber(b, "b");
  const C = assertFiniteNumber(c, "c");

  if (A === 0) {
    throw new Error(
      "With a of zero this is a straight line, not a quadratic. Use the Slope calculator instead."
    );
  }

  const discriminant = B * B - 4 * A * C;
  const vertexX = -B / (2 * A);
  const vertexY = A * vertexX * vertexX + B * vertexX + C;

  let root1: number | null = null;
  let root2: number | null = null;
  let realPart: number | null = null;
  let imaginaryPart: number | null = null;
  let nature: string;

  if (discriminant > 0) {
    const sqrtD = Math.sqrt(discriminant);
    // Stable form: q keeps the sign of b, so no subtraction of near-equals.
    const q = -0.5 * (B + Math.sign(B || 1) * sqrtD);
    root1 = q / A;
    root2 = C / q;
    if (root1 > root2) [root1, root2] = [root2, root1];
    nature = "Two distinct real roots";
  } else if (discriminant === 0) {
    root1 = vertexX;
    root2 = vertexX;
    nature = "One repeated real root";
  } else {
    realPart = -B / (2 * A);
    imaginaryPart = Math.sqrt(-discriminant) / (2 * A);
    nature = "Two complex roots, so the curve never crosses the x axis";
  }

  return {
    a: A, b: B, c: C,
    discriminant,
    nature_of_roots: nature,
    root_1: root1,
    root_2: root2,
    real_part: realPart,
    imaginary_part: imaginaryPart,
    vertex_x: vertexX,
    vertex_y: vertexY,
    axis_of_symmetry: vertexX,
    opens_upwards: A > 0,
    // Vieta's formulas, true whether the roots are real or complex.
    sum_of_roots: -B / A,
    product_of_roots: C / A
  };
}

// ---------------------------------------------------------------------------
// MAT-013 Slope
// ---------------------------------------------------------------------------

export interface SlopeResult {
  slope: number | null;
  y_intercept: number | null;
  x_intercept: number | null;
  equation: string;
  angle_degrees: number;
  distance: number;
  midpoint_x: number;
  midpoint_y: number;
  is_vertical: boolean;
  is_horizontal: boolean;
  perpendicular_slope: number | null;
}

export function slope(x1: number, y1: number, x2: number, y2: number): SlopeResult {
  const ax = assertFiniteNumber(x1, "x1");
  const ay = assertFiniteNumber(y1, "y1");
  const bx = assertFiniteNumber(x2, "x2");
  const by = assertFiniteNumber(y2, "y2");

  if (ax === bx && ay === by) {
    throw new Error("The two points are the same, so they do not define a line.");
  }

  const dx = bx - ax;
  const dy = by - ay;
  const vertical = dx === 0;
  const m = vertical ? null : dy / dx;
  const intercept = m === null ? null : ay - m * ax;

  return {
    slope: m,
    y_intercept: intercept,
    x_intercept: m === null ? ax : m === 0 ? null : -(intercept as number) / m,
    equation: vertical
      ? `x = ${ax}`
      : `y = ${m}x ${(intercept as number) >= 0 ? "+" : "-"} ${Math.abs(intercept as number)}`,
    // Measured from the positive x axis, which is what "gradient angle" means.
    angle_degrees: (Math.atan2(dy, dx) * 180) / Math.PI,
    distance: Math.sqrt(dx * dx + dy * dy),
    midpoint_x: (ax + bx) / 2,
    midpoint_y: (ay + by) / 2,
    is_vertical: vertical,
    is_horizontal: dy === 0,
    perpendicular_slope: vertical ? 0 : m === 0 ? null : -1 / (m as number)
  };
}

// ---------------------------------------------------------------------------
// MAT-014 Prime Factorisation, MAT-015 Factors
// ---------------------------------------------------------------------------

export interface PrimeFactorisationResult {
  number: number;
  is_prime: boolean;
  prime_factors: number[];
  distinct_primes: number[];
  exponents: number[];
  factorisation: string;
  number_of_divisors: number;
  sum_of_divisors: number;
  eulers_totient: number;
}

export function primeFactorisation(value: number): PrimeFactorisationResult {
  const n = requireInteger(value, "Number");
  if (n < 2) {
    throw new Error("Prime factorisation is defined for whole numbers of 2 or more.");
  }
  if (n > MAX_INTEGER_FOR_FACTORING) {
    throw new Error(
      `Numbers above ${MAX_INTEGER_FOR_FACTORING.toLocaleString("en-GB")} take too long to factorise here.`
    );
  }

  const factors: number[] = [];
  let remaining = n;
  for (let d = 2; d * d <= remaining; d += d === 2 ? 1 : 2) {
    while (remaining % d === 0) {
      factors.push(d);
      remaining /= d;
    }
  }
  if (remaining > 1) factors.push(remaining);

  const distinct: number[] = [];
  const exponents: number[] = [];
  for (const f of factors) {
    if (distinct[distinct.length - 1] === f) exponents[exponents.length - 1]++;
    else {
      distinct.push(f);
      exponents.push(1);
    }
  }

  // The divisor count, divisor sum and totient all follow from the exponents
  // directly, so none of them needs a second pass over the divisors.
  let divisorCount = 1;
  let divisorSum = 1;
  let totient = 1;
  distinct.forEach((prime, i) => {
    const e = exponents[i];
    divisorCount *= e + 1;
    divisorSum *= (Math.pow(prime, e + 1) - 1) / (prime - 1);
    totient *= Math.pow(prime, e - 1) * (prime - 1);
  });

  return {
    number: n,
    is_prime: factors.length === 1,
    prime_factors: factors,
    distinct_primes: distinct,
    exponents,
    factorisation: distinct.map((p, i) => (exponents[i] === 1 ? `${p}` : `${p}^${exponents[i]}`)).join(" x "),
    number_of_divisors: divisorCount,
    sum_of_divisors: divisorSum,
    eulers_totient: totient
  };
}

export interface FactorsResult {
  number: number;
  factors: number[];
  factor_count: number;
  factor_pairs: Array<[number, number]>;
  is_prime: boolean;
  is_perfect: boolean;
  is_abundant: boolean;
  is_deficient: boolean;
  sum_of_proper_divisors: number;
  largest_proper_factor: number;
}

export function factors(value: number): FactorsResult {
  const n = requireInteger(value, "Number");
  if (n < 1) throw new Error("Factors are defined for whole numbers of 1 or more.");
  if (n > MAX_INTEGER_FOR_FACTORING) {
    throw new Error(
      `Numbers above ${MAX_INTEGER_FOR_FACTORING.toLocaleString("en-GB")} take too long to factorise here.`
    );
  }

  const list: number[] = [];
  const pairs: Array<[number, number]> = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d === 0) {
      list.push(d);
      pairs.push([d, n / d]);
      if (d !== n / d) list.push(n / d);
    }
  }
  list.sort((a, b) => a - b);

  const properSum = list.filter((f) => f !== n).reduce((a, b) => a + b, 0);

  return {
    number: n,
    factors: list,
    factor_count: list.length,
    factor_pairs: pairs,
    is_prime: n > 1 && list.length === 2,
    is_perfect: properSum === n && n > 1,
    is_abundant: properSum > n,
    is_deficient: properSum < n,
    sum_of_proper_divisors: properSum,
    largest_proper_factor: list.length > 1 ? list[list.length - 2] : 1
  };
}

// ---------------------------------------------------------------------------
// MAT-016 Greatest Common Factor, MAT-017 Least Common Multiple
// ---------------------------------------------------------------------------

function gcdPair(a: number, b: number): number {
  let x = Math.abs(a), y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

export interface GcdLcmResult {
  numbers: number[];
  greatest_common_factor: number;
  least_common_multiple: number;
  are_coprime: boolean;
  product_of_all: number;
  gcf_times_lcm: number | null;
  simplified_ratio: number[];
}

export function gcdLcm(values: number[]): GcdLcmResult {
  if (!Array.isArray(values) || values.length < 2) {
    throw new Error("Enter at least two whole numbers.");
  }
  const numbers = values.map((v, i) => {
    const n = requireInteger(v, `Number ${i + 1}`);
    if (n === 0) throw new Error("Zero has no greatest common factor with another number.");
    return Math.abs(n);
  });

  const gcf = numbers.reduce((a, b) => gcdPair(a, b));
  // LCM is built pairwise as a*b/gcd, dividing FIRST so the intermediate never
  // overflows the safe integer range unnecessarily.
  const lcm = numbers.reduce((a, b) => (a / gcdPair(a, b)) * b);

  const product = numbers.reduce((a, b) => a * b, 1);

  return {
    numbers,
    greatest_common_factor: gcf,
    least_common_multiple: lcm,
    are_coprime: gcf === 1,
    product_of_all: product,
    // GCF x LCM equals the product only for exactly two numbers, so it is
    // reported only then rather than stated as a general law.
    gcf_times_lcm: numbers.length === 2 ? gcf * lcm : null,
    simplified_ratio: numbers.map((n) => n / gcf)
  };
}

// ---------------------------------------------------------------------------
// MAT-018 Long Division
// ---------------------------------------------------------------------------

export interface LongDivisionStep {
  step: number;
  bring_down: string;
  partial_dividend: number;
  quotient_digit: number;
  product: number;
  remainder: number;
}

export interface LongDivisionResult {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  decimal_result: number;
  is_exact: boolean;
  mixed_number: string;
  steps: LongDivisionStep[];
}

export function longDivision(dividend: number, divisor: number): LongDivisionResult {
  const a = requireInteger(dividend, "Dividend");
  const b = requireInteger(divisor, "Divisor");
  if (b === 0) throw new Error("You cannot divide by zero.");
  if (a < 0 || b < 0) {
    throw new Error("Long division is shown for positive whole numbers. Divide the magnitudes and apply the sign yourself.");
  }

  const quotient = Math.floor(a / b);
  const remainder = a % b;

  const digits = String(a).split("");
  const steps: LongDivisionStep[] = [];
  let current = 0;
  digits.forEach((digit, i) => {
    current = current * 10 + Number(digit);
    const q = Math.floor(current / b);
    const product = q * b;
    const rem = current - product;
    // Leading zeros of the quotient are part of the working but not of the
    // answer, so they are recorded only once the quotient has started.
    if (q > 0 || steps.length > 0) {
      steps.push({
        step: steps.length + 1,
        bring_down: digit,
        partial_dividend: current,
        quotient_digit: q,
        product,
        remainder: rem
      });
    }
    current = rem;
  });

  return {
    dividend: a,
    divisor: b,
    quotient,
    remainder,
    decimal_result: a / b,
    is_exact: remainder === 0,
    mixed_number: remainder === 0 ? `${quotient}` : `${quotient} and ${remainder}/${b}`,
    steps
  };
}

// ---------------------------------------------------------------------------
// MAT-019 Number Sequence
// ---------------------------------------------------------------------------

export type SequenceType = "arithmetic" | "geometric" | "fibonacci";

export function normaliseSequenceType(value: unknown): SequenceType {
  const raw = String(value ?? "arithmetic").toLowerCase().trim();
  if (raw === "geometric") return "geometric";
  if (raw === "fibonacci") return "fibonacci";
  return "arithmetic";
}

export interface SequenceResult {
  type: SequenceType;
  terms: number[];
  nth_term: number;
  sum_of_terms: number;
  formula: string;
  common_difference: number | null;
  common_ratio: number | null;
  infinite_sum: number | null;
  converges: boolean;
}

export function numberSequence(
  type: SequenceType,
  firstTerm: number,
  step: number,
  numberOfTerms: number
): SequenceResult {
  const a = assertFiniteNumber(firstTerm, "First term");
  const d = assertFiniteNumber(step, "Common difference or ratio");
  const n = requireInteger(numberOfTerms, "Number of terms");

  if (n < 1 || n > 1000) throw new Error("The number of terms must be between 1 and 1000.");

  const terms: number[] = [];
  let sum = 0;

  if (type === "arithmetic") {
    for (let i = 0; i < n; i++) {
      const term = a + i * d;
      terms.push(term);
      sum += term;
    }
    return {
      type, terms,
      nth_term: terms[n - 1],
      sum_of_terms: sum,
      formula: `a(n) = ${a} + (n - 1) x ${d}`,
      common_difference: d,
      common_ratio: null,
      infinite_sum: null,
      converges: false
    };
  }

  if (type === "geometric") {
    if (d === 0) throw new Error("A geometric sequence needs a non-zero common ratio.");
    for (let i = 0; i < n; i++) {
      const term = a * Math.pow(d, i);
      if (!Number.isFinite(term)) {
        throw new Error(`Term ${i + 1} is too large to represent. Use fewer terms or a smaller ratio.`);
      }
      terms.push(term);
      sum += term;
    }
    // An infinite geometric series converges only when the ratio is inside
    // (-1, 1). Reporting a sum outside that range would be nonsense.
    const converges = Math.abs(d) < 1;
    return {
      type, terms,
      nth_term: terms[n - 1],
      sum_of_terms: sum,
      formula: `a(n) = ${a} x ${d}^(n - 1)`,
      common_difference: null,
      common_ratio: d,
      infinite_sum: converges ? a / (1 - d) : null,
      converges
    };
  }

  // Fibonacci-style: each term is the sum of the two before it, seeded by the
  // first term and the step.
  let previous = a;
  let currentTerm = d;
  for (let i = 0; i < n; i++) {
    if (i === 0) terms.push(previous);
    else if (i === 1) terms.push(currentTerm);
    else {
      const next = previous + currentTerm;
      if (!Number.isFinite(next)) {
        throw new Error(`Term ${i + 1} is too large to represent.`);
      }
      previous = currentTerm;
      currentTerm = next;
      terms.push(next);
    }
  }
  sum = terms.reduce((x, y) => x + y, 0);

  return {
    type, terms,
    nth_term: terms[n - 1],
    sum_of_terms: sum,
    formula: "a(n) = a(n-1) + a(n-2)",
    common_difference: null,
    common_ratio: null,
    infinite_sum: null,
    converges: false
  };
}

// ---------------------------------------------------------------------------
// MAT-021 Matrix
// ---------------------------------------------------------------------------

export type MatrixOperation = "add" | "subtract" | "multiply" | "determinant" | "inverse" | "transpose";

export function normaliseMatrixOperation(value: unknown): MatrixOperation {
  const raw = String(value ?? "multiply").toLowerCase().trim();
  const allowed: MatrixOperation[] = ["add", "subtract", "multiply", "determinant", "inverse", "transpose"];
  return (allowed as string[]).includes(raw) ? (raw as MatrixOperation) : "multiply";
}

export interface MatrixResult {
  operation: MatrixOperation;
  result: number[][] | null;
  determinant: number | null;
  is_invertible: boolean | null;
  rows: number;
  columns: number;
}

function validateMatrix(m: unknown, label: string): number[][] {
  if (!Array.isArray(m) || m.length === 0 || !Array.isArray(m[0])) {
    throw new Error(`${label} must be a table of numbers, for example [[1, 2], [3, 4]].`);
  }
  const cols = (m[0] as unknown[]).length;
  return (m as unknown[][]).map((row, i) => {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error(`Every row of ${label} must have the same number of columns.`);
    }
    return row.map((v, j) => {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        throw new Error(`${label} row ${i + 1}, column ${j + 1} is not a valid number.`);
      }
      return n;
    });
  });
}

/** Determinant and inverse by Gauss-Jordan elimination with partial pivoting. */
function gaussJordan(matrix: number[][]): { determinant: number; inverse: number[][] | null } {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  const inv = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)));
  let determinant = 1;

  for (let col = 0; col < n; col++) {
    // Partial pivoting: use the largest available pivot, which is what keeps
    // the elimination numerically stable.
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivotRow][col])) pivotRow = r;
    }
    if (Math.abs(a[pivotRow][col]) < 1e-12) {
      return { determinant: 0, inverse: null };
    }
    if (pivotRow !== col) {
      [a[col], a[pivotRow]] = [a[pivotRow], a[col]];
      [inv[col], inv[pivotRow]] = [inv[pivotRow], inv[col]];
      determinant = -determinant;
    }

    const pivot = a[col][col];
    determinant *= pivot;
    for (let j = 0; j < n; j++) {
      a[col][j] /= pivot;
      inv[col][j] /= pivot;
    }
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = a[r][col];
      if (factor === 0) continue;
      for (let j = 0; j < n; j++) {
        a[r][j] -= factor * a[col][j];
        inv[r][j] -= factor * inv[col][j];
      }
    }
  }
  return { determinant, inverse: inv };
}

export function matrixOperation(
  operation: MatrixOperation,
  matrixA: unknown,
  matrixB: unknown
): MatrixResult {
  const A = validateMatrix(matrixA, "Matrix A");

  if (operation === "transpose") {
    const result = A[0].map((_, j) => A.map((row) => row[j]));
    return { operation, result, determinant: null, is_invertible: null, rows: result.length, columns: result[0].length };
  }

  if (operation === "determinant" || operation === "inverse") {
    if (A.length !== A[0].length) {
      throw new Error(
        `A ${operation === "inverse" ? "matrix inverse" : "determinant"} exists only for a square matrix. This one is ${A.length} by ${A[0].length}.`
      );
    }
    const { determinant, inverse } = gaussJordan(A);
    if (operation === "determinant") {
      return { operation, result: null, determinant, is_invertible: inverse !== null, rows: A.length, columns: A[0].length };
    }
    if (inverse === null) {
      throw new Error(
        "This matrix has a determinant of zero, so it is singular and has no inverse."
      );
    }
    return { operation, result: inverse, determinant, is_invertible: true, rows: A.length, columns: A[0].length };
  }

  const B = validateMatrix(matrixB, "Matrix B");

  if (operation === "add" || operation === "subtract") {
    if (A.length !== B.length || A[0].length !== B[0].length) {
      throw new Error(
        `Matrices can only be added or subtracted when they are the same size. A is ${A.length} by ${A[0].length}; B is ${B.length} by ${B[0].length}.`
      );
    }
    const sign = operation === "add" ? 1 : -1;
    const result = A.map((row, i) => row.map((v, j) => v + sign * B[i][j]));
    return { operation, result, determinant: null, is_invertible: null, rows: result.length, columns: result[0].length };
  }

  if (A[0].length !== B.length) {
    throw new Error(
      `To multiply, the columns of A must match the rows of B. A has ${A[0].length} columns and B has ${B.length} rows.`
    );
  }
  const result = A.map((row) =>
    B[0].map((_, j) => row.reduce((sum, v, k) => sum + v * B[k][j], 0))
  );
  return { operation, result, determinant: null, is_invertible: null, rows: result.length, columns: result[0].length };
}

// ---------------------------------------------------------------------------
// MAT-022 Binary, MAT-023 Hexadecimal
// ---------------------------------------------------------------------------

export type BaseOperation = "convert" | "add" | "subtract" | "multiply" | "divide";

export function normaliseBaseOperation(value: unknown): BaseOperation {
  const raw = String(value ?? "convert").toLowerCase().trim();
  const allowed: BaseOperation[] = ["convert", "add", "subtract", "multiply", "divide"];
  return (allowed as string[]).includes(raw) ? (raw as BaseOperation) : "convert";
}

export interface BaseConversionResult {
  operation: BaseOperation;
  decimal_a: number;
  decimal_b: number | null;
  decimal_result: number;
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
  bit_length: number;
  twos_complement_8_bit: string | null;
}

function parseInBase(text: string, base: number, label: string): number {
  const cleaned = String(text ?? "").trim().replace(/^0[bxo]/i, "").replace(/[\s_]/g, "");
  if (cleaned === "") throw new Error(`${label} is empty.`);

  const negative = cleaned.startsWith("-");
  const digits = negative ? cleaned.slice(1) : cleaned;
  const valid = base === 2 ? /^[01]+$/ : base === 8 ? /^[0-7]+$/ : base === 16 ? /^[0-9a-fA-F]+$/ : /^[0-9]+$/;

  if (!valid.test(digits)) {
    const allowedDigits = base === 2 ? "0 and 1" : base === 8 ? "0 to 7" : base === 16 ? "0 to 9 and A to F" : "0 to 9";
    throw new Error(`${label} is not a valid base-${base} number. Use only ${allowedDigits}.`);
  }

  const value = parseInt(digits, base);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} is too large to work with exactly.`);
  }
  return negative ? -value : value;
}

export function baseArithmetic(
  operation: BaseOperation,
  base: number,
  valueA: string,
  valueB: string
): BaseConversionResult {
  const a = parseInBase(valueA, base, "The first value");
  const b = operation === "convert" ? null : parseInBase(valueB, base, "The second value");

  let result: number;
  switch (operation) {
    case "convert": result = a; break;
    case "add": result = a + (b as number); break;
    case "subtract": result = a - (b as number); break;
    case "multiply": result = a * (b as number); break;
    case "divide":
      if (b === 0) throw new Error("You cannot divide by zero.");
      // Integer division, because these calculators work in whole numbers.
      result = Math.trunc(a / (b as number));
      break;
  }

  if (!Number.isSafeInteger(result)) {
    throw new Error("The result is too large to represent exactly.");
  }

  const magnitude = Math.abs(result);
  const sign = result < 0 ? "-" : "";

  return {
    operation,
    decimal_a: a,
    decimal_b: b,
    decimal_result: result,
    binary: sign + magnitude.toString(2),
    octal: sign + magnitude.toString(8),
    decimal: String(result),
    hexadecimal: sign + magnitude.toString(16).toUpperCase(),
    bit_length: magnitude === 0 ? 1 : magnitude.toString(2).length,
    // Two's complement is only meaningful in a fixed width, so it is shown
    // only when the value actually fits in one byte.
    twos_complement_8_bit:
      result >= -128 && result <= 127
        ? (result < 0 ? (256 + result).toString(2) : result.toString(2)).padStart(8, "0")
        : null
  };
}
