/**
 * Independent benchmark oracle for Wave 2 tranche 2I, Maths & Algebra.
 *
 * Imports nothing from the calculation engine, and where possible reaches each
 * answer by a DIFFERENT route:
 *
 *   - Quadratic roots are found by factoring the polynomial from its known
 *     roots and by Vieta's relations, not by the engine's stable formula.
 *   - Factors are found by trial division of every candidate up to n, where
 *     the engine only goes to the square root and pairs them up.
 *   - The greatest common factor is found by repeated subtraction (the
 *     original Euclidean method) rather than by the modulo form.
 *   - The matrix inverse is verified by multiplying it back to the identity
 *     rather than by re-running an elimination.
 *   - Base conversions are done by explicit digit arithmetic, not by
 *     Number.prototype.toString.
 *
 * Run: node scripts/oracles/wave2-maths-oracle.mjs > /tmp/maths.json
 */

const r8 = (n) => Math.round(n * 1e8) / 1e8;

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±1e-6 on ratios; exact on integers",
    ruleset: "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// MAT-001 Basic Calculator
// ===========================================================================

for (const p of [
  { scenario: "Order of operations", expr: "2 + 3 * 4", result: 14 },
  { scenario: "Brackets override precedence", expr: "(2 + 3) * 4", result: 20 },
  { scenario: "Powers bind tighter than multiplication", expr: "2 * 3 ^ 2", result: 18 },
  { scenario: "Division and subtraction", expr: "100 / 4 - 5", result: 20 },
  { scenario: "Nested brackets", expr: "((1 + 2) * (3 + 4)) / 7", result: 3 },
  { scenario: "Decimal arithmetic", expr: "0.1 * 3 + 0.7", result: 1 }
]) {
  add("MAT-001", p.scenario,
    { expression: p.expr },
    { result: r8(p.result), is_whole_number: Number.isInteger(p.result) },
    "Expected values were worked out by hand from the standard order of operations.");
}

// ===========================================================================
// MAT-004 Percent Off
// ===========================================================================

for (const p of [
  { scenario: "Single discount", price: 100, d1: 20, d2: 0 },
  { scenario: "Two 20% discounts are 36% off, not 40%", price: 100, d1: 20, d2: 20 },
  { scenario: "Sale price then staff discount", price: 249.99, d1: 30, d2: 10 },
  { scenario: "Full discount leaves nothing to pay", price: 80, d1: 100, d2: 0 },
  { scenario: "No discount at all", price: 55, d1: 0, d2: 0 },
  { scenario: "Half price then half again", price: 200, d1: 50, d2: 50 }
]) {
  const afterFirst = p.price * (1 - p.d1 / 100);
  const final = afterFirst * (1 - p.d2 / 100);
  const saving = p.price - final;
  add("MAT-004", p.scenario,
    { original_price: p.price, discount: p.d1, second_discount: p.d2 },
    {
      price_after_first: r8(afterFirst),
      final_price: r8(final),
      total_saving: r8(saving),
      effective_single_discount: p.price === 0 ? 0 : r8(saving / p.price),
      sum_of_discounts_would_have_been: r8(Math.min(1, (p.d1 + p.d2) / 100))
    },
    "The 20-then-20 case pins the effective discount at exactly 36%, which is the whole point of the calculator.");
}

// ===========================================================================
// MAT-007 Rounding
// ===========================================================================

/** Half-even rounding worked out by explicit case analysis. */
function halfEven(value, places) {
  const factor = Math.pow(10, places);
  const scaled = value * factor;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  let result;
  if (Math.abs(diff - 0.5) < 1e-9) result = floor % 2 === 0 ? floor : floor + 1;
  else result = Math.round(scaled);
  return result / factor;
}

function significant(value, figures) {
  if (value === 0) return 0;
  const magnitude = Math.ceil(Math.log10(Math.abs(value)));
  const factor = Math.pow(10, figures - magnitude);
  return Math.round(value * factor) / factor;
}

for (const p of [
  { scenario: "Two decimal places", v: 3.14159, dp: 2, sf: 3, mult: 0, mode: "half_up" },
  { scenario: "Exact half rounds up in the everyday mode", v: 2.5, dp: 0, sf: 2, mult: 0, mode: "half_up" },
  { scenario: "Exact half goes to the even number in banker's rounding", v: 2.5, dp: 0, sf: 2, mult: 0, mode: "half_even" },
  { scenario: "The other exact half also goes to the even number", v: 3.5, dp: 0, sf: 2, mult: 0, mode: "half_even" },
  { scenario: "Always up", v: 4.01, dp: 0, sf: 3, mult: 0, mode: "up" },
  { scenario: "Nearest multiple of 5", v: 47, dp: 0, sf: 2, mult: 5, mode: "half_up" },
  { scenario: "Significant figures on a small number", v: 0.0004567, dp: 6, sf: 2, mult: 0, mode: "half_up" }
]) {
  const factor = Math.pow(10, p.dp);
  const halfUp = Math.sign(p.v) * Math.round(Math.abs(p.v) * factor) / factor;
  const up = Math.ceil(p.v * factor) / factor;
  const down = Math.floor(p.v * factor) / factor;
  const truncated = Math.trunc(p.v * factor) / factor;
  const even = halfEven(p.v, p.dp);
  const byMode = { half_up: halfUp, half_even: even, up, down, towards_zero: truncated };

  add("MAT-007", p.scenario,
    {
      value: p.v, decimal_places: p.dp, significant_figures: p.sf,
      nearest_multiple: p.mult, mode: p.mode
    },
    {
      result: r8(byMode[p.mode]),
      rounded_to_decimal_places: r8(halfUp),
      rounded_to_significant_figures: r8(significant(p.v, p.sf)),
      rounded_to_nearest_multiple: p.mult === 0 ? r8(p.v) : r8(Math.round(p.v / p.mult) * p.mult),
      rounded_up: r8(up),
      rounded_down: r8(down),
      truncated: r8(truncated),
      bankers_rounding: r8(even),
      difference_from_original: r8(byMode[p.mode] - p.v)
    },
    "The 2.5 and 3.5 pair proves banker's rounding sends each to the even neighbour, in opposite directions.");
}

// ===========================================================================
// MAT-008 / MAT-009 / MAT-010
// ===========================================================================

for (const p of [
  { scenario: "Square", base: 7, exp: 2 },
  { scenario: "Negative exponent gives the reciprocal", base: 2, exp: -3 },
  { scenario: "Anything to the power of zero is one", base: 9.5, exp: 0 },
  { scenario: "Fractional exponent is a root", base: 16, exp: 0.5 },
  { scenario: "Negative base with a whole exponent", base: -3, exp: 3 },
  { scenario: "Large power", base: 1.05, exp: 30 }
]) {
  // Whole-number powers are checked by repeated multiplication, which shares
  // nothing with Math.pow.
  let result;
  if (Number.isInteger(p.exp) && Math.abs(p.exp) <= 60) {
    result = 1;
    for (let i = 0; i < Math.abs(p.exp); i++) result *= p.base;
    if (p.exp < 0) result = 1 / result;
  } else {
    result = Math.pow(p.base, p.exp);
  }
  add("MAT-008", p.scenario,
    { base: p.base, exponent: p.exp },
    {
      result: r8(result),
      reciprocal: result === 0 ? null : r8(1 / result),
      squared: r8(p.base * p.base),
      cubed: r8(p.base * p.base * p.base)
    },
    "Whole-number powers computed by repeated multiplication rather than by an exponential function.");
}

for (const p of [
  { scenario: "Square root of a perfect square", value: 144, index: 2 },
  { scenario: "Cube root", value: 27, index: 3 },
  { scenario: "Cube root of a negative number is real", value: -8, index: 3 },
  { scenario: "Fourth root", value: 81, index: 4 },
  { scenario: "Root of a non-perfect number", value: 50, index: 2 },
  { scenario: "Fifth root", value: 32, index: 5 }
]) {
  const magnitude = Math.pow(Math.abs(p.value), 1 / p.index);
  const rootValue = p.value < 0 ? -magnitude : magnitude;
  add("MAT-009", p.scenario,
    { value: p.value, index: p.index },
    {
      root: r8(rootValue),
      check: r8(Math.pow(rootValue, p.index)),
      square_root: p.value < 0 ? null : r8(Math.sqrt(p.value)),
      cube_root: r8(Math.cbrt(p.value))
    },
    "The odd root of a negative number is handled by sign, which a bare power function gets wrong.");
}

for (const p of [
  { scenario: "Common logarithm", value: 1000, base: 10 },
  { scenario: "Binary logarithm", value: 1024, base: 2 },
  { scenario: "Natural logarithm", value: Math.E, base: Math.E },
  { scenario: "Non-integer result", value: 50, base: 10 },
  { scenario: "Base larger than the value", value: 5, base: 10 },
  { scenario: "Fractional base", value: 8, base: 0.5 }
]) {
  const log = Math.log(p.value) / Math.log(p.base);
  add("MAT-010", p.scenario,
    { value: p.value, base: p.base },
    {
      logarithm: r8(log),
      natural_log: r8(Math.log(p.value)),
      log_base_10: r8(Math.log10(p.value)),
      log_base_2: r8(Math.log2(p.value)),
      check: r8(Math.pow(p.base, log))
    });
}

// ===========================================================================
// MAT-011 Scientific Notation
// ===========================================================================

for (const p of [
  { scenario: "Large number", v: 123456, sf: 3 },
  { scenario: "Small number", v: 0.000042, sf: 2 },
  { scenario: "Negative number", v: -98765, sf: 4 },
  { scenario: "Already a single digit", v: 7, sf: 3 },
  { scenario: "Exactly a power of ten", v: 10000, sf: 3 },
  { scenario: "Engineering notation lands on a prefix", v: 4700000, sf: 3 }
]) {
  const exponent = Math.floor(Math.log10(Math.abs(p.v)));
  const coefficient = Number((p.v / Math.pow(10, exponent)).toPrecision(p.sf));
  const engExp = Math.floor(exponent / 3) * 3;
  const engCoeff = Number((p.v / Math.pow(10, engExp)).toPrecision(p.sf));
  add("MAT-011", p.scenario,
    { value: p.v, significant_figures: p.sf },
    {
      coefficient: r8(coefficient),
      exponent,
      scientific_notation: `${coefficient} x 10^${exponent}`,
      engineering_coefficient: r8(engCoeff),
      engineering_exponent: engExp,
      engineering_notation: `${engCoeff} x 10^${engExp}`,
      order_of_magnitude: exponent
    });
}

// ===========================================================================
// MAT-012 Quadratic Formula
// ===========================================================================

for (const p of [
  { scenario: "Two whole-number roots", a: 1, b: -5, c: 6, roots: [2, 3] },
  { scenario: "A repeated root", a: 1, b: -4, c: 4, roots: [2, 2] },
  { scenario: "Complex roots", a: 1, b: 2, c: 5, roots: null },
  { scenario: "Negative leading coefficient", a: -2, b: 4, c: 6, roots: [-1, 3] },
  { scenario: "Large b, where the naive formula loses precision", a: 1, b: 200000, c: 1, roots: null },
  { scenario: "Fractional roots", a: 2, b: -7, c: 3, roots: [0.5, 3] }
]) {
  const discriminant = p.b * p.b - 4 * p.a * p.c;
  const vertexX = -p.b / (2 * p.a);
  const vertexY = p.a * vertexX * vertexX + p.b * vertexX + p.c;

  const expected = {
    discriminant: r8(discriminant),
    vertex_x: r8(vertexX),
    vertex_y: r8(vertexY),
    axis_of_symmetry: r8(vertexX),
    sum_of_roots: r8(-p.b / p.a),
    product_of_roots: r8(p.c / p.a),
    opens_upwards: p.a > 0
  };

  if (p.roots) {
    // Where the roots are known integers or simple fractions, they are stated
    // directly and verified by substitution rather than recomputed with the
    // same formula the engine uses.
    const [r1, r2] = p.roots.slice().sort((x, y) => x - y);
    for (const r of p.roots) {
      const residual = p.a * r * r + p.b * r + p.c;
      if (Math.abs(residual) > 1e-9) {
        throw new Error(`Oracle self-check failed: ${r} is not a root of the stated quadratic.`);
      }
    }
    expected.root_1 = r8(r1);
    expected.root_2 = r8(r2);
  } else if (discriminant < 0) {
    expected.real_part = r8(-p.b / (2 * p.a));
    expected.imaginary_part = r8(Math.sqrt(-discriminant) / (2 * p.a));
  }

  add("MAT-012", p.scenario,
    { a: p.a, b: p.b, c: p.c },
    expected,
    p.roots
      ? "The roots are stated independently and the oracle verifies each by substituting it back into the polynomial, so the engine's formula is checked against the definition of a root rather than against itself."
      : "Only the quantities that do not require the roots are asserted here.");
}

// A dedicated precision case: x^2 - 200000x + 1 has roots that the textbook
// formula gets badly wrong. The smaller root is very close to 1/200000.
{
  const a = 1, b = -200000, c = 1;
  const sqrtD = Math.sqrt(b * b - 4 * a * c);
  const large = (-b + sqrtD) / (2 * a);
  // The small root from the product of the roots, which has no cancellation.
  const small = c / (a * large);
  add("MAT-012", "Catastrophic cancellation case, where the naive formula fails",
    { a, b, c },
    {
      root_1: r8(small),
      root_2: r8(large),
      discriminant: r8(b * b - 4 * a * c),
      sum_of_roots: r8(-b / a),
      product_of_roots: r8(c / a)
    },
    "The smaller root is obtained from the PRODUCT of the roots, which involves no subtraction of near-equal numbers. Computing it as (-b - sqrt(D)) / 2a instead would lose almost every significant figure.");
}

// ===========================================================================
// MAT-013 Slope
// ===========================================================================

for (const p of [
  { scenario: "Positive slope", x1: 1, y1: 2, x2: 4, y2: 8 },
  { scenario: "Negative slope", x1: 0, y1: 10, x2: 5, y2: 0 },
  { scenario: "Horizontal line", x1: -3, y1: 4, x2: 6, y2: 4 },
  { scenario: "Vertical line has no slope", x1: 2, y1: 1, x2: 2, y2: 9 },
  { scenario: "Slope of exactly one", x1: 0, y1: 0, x2: 5, y2: 5 },
  { scenario: "Fractional slope", x1: 1, y1: 1, x2: 4, y2: 2 }
]) {
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1;
  const vertical = dx === 0;
  const m = vertical ? null : dy / dx;
  const intercept = m === null ? null : p.y1 - m * p.x1;
  const expected = {
    angle_degrees: r8((Math.atan2(dy, dx) * 180) / Math.PI),
    distance: r8(Math.sqrt(dx * dx + dy * dy)),
    midpoint_x: r8((p.x1 + p.x2) / 2),
    midpoint_y: r8((p.y1 + p.y2) / 2)
  };
  if (!vertical) {
    expected.slope = r8(m);
    expected.y_intercept = r8(intercept);
    expected.perpendicular_slope = m === 0 ? null : r8(-1 / m);
  }
  add("MAT-013", p.scenario,
    { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 },
    expected,
    "A vertical line is asserted only on the quantities that exist for it, because it has no slope at all.");
}

// ===========================================================================
// MAT-014 Prime Factorisation and MAT-015 Factors
// ===========================================================================

/** Factors by trial division of EVERY candidate, not just up to the square root. */
function allFactorsBrute(n) {
  const list = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) list.push(d);
  return list;
}

for (const p of [
  { scenario: "A prime", n: 97 },
  { scenario: "A perfect number", n: 28 },
  { scenario: "A power of two", n: 64 },
  { scenario: "A product of distinct primes", n: 210 },
  { scenario: "A square number", n: 144 },
  { scenario: "An abundant number", n: 12 },
  { scenario: "A large semiprime", n: 10403 }
]) {
  const list = allFactorsBrute(p.n);
  const properSum = list.filter((f) => f !== p.n).reduce((a, b) => a + b, 0);
  const pairs = [];
  for (let d = 1; d * d <= p.n; d++) if (p.n % d === 0) pairs.push([d, p.n / d]);

  add("MAT-015", p.scenario,
    { number: p.n },
    {
      factors: list,
      factor_count: list.length,
      sum_of_proper_divisors: properSum,
      largest_proper_factor: list.length > 1 ? list[list.length - 2] : 1,
      is_prime: p.n > 1 && list.length === 2,
      is_perfect: properSum === p.n && p.n > 1,
      is_abundant: properSum > p.n,
      is_deficient: properSum < p.n
    },
    "Every candidate divisor from 1 to n is tested, where the engine tests only up to the square root and pairs the results. The two must agree exactly.");

  if (p.n >= 2) {
    const primes = [];
    let remaining = p.n;
    for (let d = 2; d <= remaining; d++) {
      while (remaining % d === 0) { primes.push(d); remaining /= d; }
    }
    const distinct = [...new Set(primes)];
    const exps = distinct.map((q) => primes.filter((x) => x === q).length);
    // The divisor count and sum are checked against the BRUTE-FORCE divisor
    // list, not against the exponent formula the engine uses.
    add("MAT-014", p.scenario,
      { number: p.n },
      {
        is_prime: primes.length === 1,
        prime_factors: primes,
        distinct_primes: distinct,
        exponents: exps,
        factorisation: distinct.map((q, i) => (exps[i] === 1 ? `${q}` : `${q}^${exps[i]}`)).join(" x "),
        number_of_divisors: list.length,
        sum_of_divisors: list.reduce((a, b) => a + b, 0)
      },
      "Factorised by ascending trial division, with the divisor count and sum taken from the brute-force divisor list rather than from the exponent formula.");
  }
}

// ===========================================================================
// MAT-016 / MAT-017 Greatest Common Factor and Lowest Common Multiple
// ===========================================================================

/** The original Euclidean algorithm, by repeated subtraction. */
function gcdBySubtraction(a, b) {
  let x = Math.abs(a), y = Math.abs(b);
  while (x !== y) {
    if (x > y) x -= y; else y -= x;
  }
  return x;
}

for (const p of [
  { scenario: "Two numbers with a common factor", nums: [48, 18] },
  { scenario: "Coprime numbers", nums: [35, 64] },
  { scenario: "One divides the other", nums: [7, 49] },
  { scenario: "Three numbers", nums: [12, 18, 24] },
  { scenario: "Four numbers", nums: [8, 12, 20, 28] },
  { scenario: "Identical numbers", nums: [15, 15] }
]) {
  const gcf = p.nums.reduce((a, b) => gcdBySubtraction(a, b));
  const lcm = p.nums.reduce((a, b) => (a / gcdBySubtraction(a, b)) * b);
  const product = p.nums.reduce((a, b) => a * b, 1);
  const shared = {
    greatest_common_factor: gcf,
    least_common_multiple: lcm,
    are_coprime: gcf === 1,
    product_of_all: product
  };
  add("MAT-016", p.scenario,
    { numbers: JSON.stringify(p.nums) },
    {
      ...shared,
      simplified_ratio: p.nums.map((n) => n / gcf),
      gcf_times_lcm: p.nums.length === 2 ? gcf * lcm : null
    },
    "The greatest common factor is found by REPEATED SUBTRACTION, the original Euclidean method, rather than by the modulo form the engine uses.");
  add("MAT-017", p.scenario, { numbers: JSON.stringify(p.nums) }, shared);
}

// ===========================================================================
// MAT-018 Long Division
// ===========================================================================

for (const p of [
  { scenario: "Exact division", a: 144, b: 12 },
  { scenario: "With a remainder", a: 1234, b: 7 },
  { scenario: "Divisor larger than dividend", a: 5, b: 20 },
  { scenario: "Dividing by one", a: 987, b: 1 },
  { scenario: "Large dividend", a: 100000, b: 37 },
  { scenario: "Divisor equals dividend", a: 42, b: 42 }
]) {
  // Quotient and remainder by repeated subtraction, which is the definition
  // of division rather than an application of the floor function.
  let remaining = p.a, quotient = 0;
  while (remaining >= p.b) { remaining -= p.b; quotient++; }
  add("MAT-018", p.scenario,
    { dividend: p.a, divisor: p.b },
    {
      quotient,
      remainder: remaining,
      decimal_result: r8(p.a / p.b),
      is_exact: remaining === 0,
      mixed_number: remaining === 0 ? `${quotient}` : `${quotient} and ${remaining}/${p.b}`
    },
    "Quotient and remainder found by repeated subtraction, which is the definition of integer division.");
}

// ===========================================================================
// MAT-019 Number Sequence
// ===========================================================================

for (const p of [
  { scenario: "Arithmetic sequence", type: "arithmetic", a: 3, step: 5, n: 10 },
  { scenario: "Decreasing arithmetic sequence", type: "arithmetic", a: 100, step: -7, n: 8 },
  { scenario: "Geometric sequence that grows", type: "geometric", a: 2, step: 3, n: 8 },
  { scenario: "Geometric sequence that converges", type: "geometric", a: 1, step: 0.5, n: 10 },
  { scenario: "Fibonacci", type: "fibonacci", a: 1, step: 1, n: 12 },
  { scenario: "Lucas numbers", type: "fibonacci", a: 2, step: 1, n: 10 }
]) {
  const terms = [];
  if (p.type === "arithmetic") {
    for (let i = 0; i < p.n; i++) terms.push(p.a + i * p.step);
  } else if (p.type === "geometric") {
    for (let i = 0; i < p.n; i++) terms.push(p.a * Math.pow(p.step, i));
  } else {
    let prev = p.a, cur = p.step;
    for (let i = 0; i < p.n; i++) {
      if (i === 0) terms.push(prev);
      else if (i === 1) terms.push(cur);
      else { const next = prev + cur; prev = cur; cur = next; terms.push(next); }
    }
  }
  const sum = terms.reduce((a, b) => a + b, 0);
  const converges = p.type === "geometric" && Math.abs(p.step) < 1;

  add("MAT-019", p.scenario,
    { sequence_type: p.type, first_term: p.a, step: p.step, number_of_terms: p.n },
    {
      terms: terms.map(r8),
      nth_term: r8(terms[p.n - 1]),
      sum_of_terms: r8(sum),
      converges,
      infinite_sum: converges ? r8(p.a / (1 - p.step)) : null
    },
    "Terms generated one at a time and summed directly, so a closed-form slip in the engine could not be reproduced here.");
}

// ===========================================================================
// MAT-021 Matrix
// ===========================================================================

/** Determinant by cofactor expansion, which shares nothing with elimination. */
function determinantByCofactor(m) {
  const n = m.length;
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let total = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map((row) => row.filter((_, c) => c !== j));
    total += ((j % 2 === 0 ? 1 : -1) * m[0][j] * determinantByCofactor(minor));
  }
  return total;
}

/** Inverse by the adjugate over the determinant, again not by elimination. */
function inverseByAdjugate(m) {
  const n = m.length;
  const det = determinantByCofactor(m);
  if (Math.abs(det) < 1e-12) return null;
  const cofactors = [];
  for (let i = 0; i < n; i++) {
    cofactors.push([]);
    for (let j = 0; j < n; j++) {
      const minor = m.filter((_, r) => r !== i).map((row) => row.filter((_, c) => c !== j));
      cofactors[i].push(((i + j) % 2 === 0 ? 1 : -1) * determinantByCofactor(minor));
    }
  }
  // The adjugate is the TRANSPOSE of the cofactor matrix.
  return cofactors[0].map((_, j) => cofactors.map((row) => row[j] / det));
}

const A2 = [[4, 7], [2, 6]];
const B2 = [[1, 2], [3, 4]];
const A3 = [[2, -1, 0], [-1, 2, -1], [0, -1, 2]];

add("MAT-021", "Addition",
  { operation: "add", matrix_a: JSON.stringify(A2), matrix_b: JSON.stringify(B2) },
  { result: A2.map((row, i) => row.map((v, j) => v + B2[i][j])), rows: 2, columns: 2 });

add("MAT-021", "Subtraction",
  { operation: "subtract", matrix_a: JSON.stringify(A2), matrix_b: JSON.stringify(B2) },
  { result: A2.map((row, i) => row.map((v, j) => v - B2[i][j])), rows: 2, columns: 2 });

add("MAT-021", "Multiplication",
  { operation: "multiply", matrix_a: JSON.stringify(A2), matrix_b: JSON.stringify(B2) },
  {
    result: A2.map((row) => B2[0].map((_, j) => row.reduce((s, v, k) => s + v * B2[k][j], 0))),
    rows: 2, columns: 2
  },
  "Multiplication is not commutative, so the order of the operands matters.");

add("MAT-021", "Determinant of a 2 by 2",
  { operation: "determinant", matrix_a: JSON.stringify(A2), matrix_b: "" },
  { determinant: r8(determinantByCofactor(A2)), is_invertible: true },
  "Determinant by cofactor expansion, which shares no code path with the engine's Gauss-Jordan elimination.");

add("MAT-021", "Determinant of a 3 by 3",
  { operation: "determinant", matrix_a: JSON.stringify(A3), matrix_b: "" },
  { determinant: r8(determinantByCofactor(A3)), is_invertible: true });

{
  const inv = inverseByAdjugate(A2);
  // Self-check: the inverse must multiply back to the identity.
  const product = A2.map((row) => inv[0].map((_, j) => row.reduce((s, v, k) => s + v * inv[k][j], 0)));
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const target = i === j ? 1 : 0;
      if (Math.abs(product[i][j] - target) > 1e-9) {
        throw new Error("Oracle self-check failed: the adjugate inverse does not give the identity.");
      }
    }
  }
  add("MAT-021", "Inverse of a 2 by 2",
    { operation: "inverse", matrix_a: JSON.stringify(A2), matrix_b: "" },
    { result: inv.map((row) => row.map(r8)), determinant: r8(determinantByCofactor(A2)), is_invertible: true },
    "Inverse by the adjugate over the determinant, verified by multiplying it back to the identity before being recorded.");
}

add("MAT-021", "Transpose",
  { operation: "transpose", matrix_a: JSON.stringify([[1, 2, 3], [4, 5, 6]]), matrix_b: "" },
  { result: [[1, 4], [2, 5], [3, 6]], rows: 3, columns: 2 });

// ===========================================================================
// MAT-022 Binary and MAT-023 Hexadecimal
// ===========================================================================

/** Parse digits explicitly, never with parseInt. */
function fromBase(text, base) {
  const digits = "0123456789ABCDEF";
  let value = 0;
  for (const ch of String(text).toUpperCase()) {
    value = value * base + digits.indexOf(ch);
  }
  return value;
}

/** Build the representation by repeated division, never with toString. */
function toBase(value, base) {
  const digits = "0123456789ABCDEF";
  if (value === 0) return "0";
  let n = Math.abs(value), out = "";
  while (n > 0) {
    out = digits[n % base] + out;
    n = Math.floor(n / base);
  }
  return (value < 0 ? "-" : "") + out;
}

for (const p of [
  { id: "MAT-022", base: 2, scenario: "Convert binary to decimal", op: "convert", a: "1011", b: "" },
  { id: "MAT-022", base: 2, scenario: "Binary addition", op: "add", a: "1011", b: "1101" },
  { id: "MAT-022", base: 2, scenario: "Binary subtraction", op: "subtract", a: "11000", b: "1011" },
  { id: "MAT-022", base: 2, scenario: "Binary multiplication", op: "multiply", a: "101", b: "110" },
  { id: "MAT-022", base: 2, scenario: "Binary integer division", op: "divide", a: "100110", b: "101" },
  { id: "MAT-022", base: 2, scenario: "A byte at its maximum", op: "convert", a: "11111111", b: "" },
  { id: "MAT-023", base: 16, scenario: "Convert hexadecimal to decimal", op: "convert", a: "FF", b: "" },
  { id: "MAT-023", base: 16, scenario: "Hexadecimal addition", op: "add", a: "1A", b: "2B" },
  { id: "MAT-023", base: 16, scenario: "Hexadecimal subtraction", op: "subtract", a: "FF", b: "A0" },
  { id: "MAT-023", base: 16, scenario: "Hexadecimal multiplication", op: "multiply", a: "10", b: "10" },
  { id: "MAT-023", base: 16, scenario: "A colour value", op: "convert", a: "7F3FBF", b: "" },
  { id: "MAT-023", base: 16, scenario: "Hexadecimal integer division", op: "divide", a: "100", b: "8" }
]) {
  const a = fromBase(p.a, p.base);
  const b = p.op === "convert" ? null : fromBase(p.b, p.base);
  let result;
  switch (p.op) {
    case "convert": result = a; break;
    case "add": result = a + b; break;
    case "subtract": result = a - b; break;
    case "multiply": result = a * b; break;
    case "divide": result = Math.trunc(a / b); break;
  }
  const magnitude = Math.abs(result);
  const expected = {
    decimal_result: result,
    binary: toBase(result, 2),
    octal: toBase(result, 8),
    decimal: String(result),
    hexadecimal: toBase(result, 16),
    bit_length: magnitude === 0 ? 1 : toBase(magnitude, 2).length
  };
  if (p.id === "MAT-022") {
    expected.twos_complement_8_bit =
      result >= -128 && result <= 127
        ? (result < 0 ? toBase(256 + result, 2) : toBase(result, 2)).padStart(8, "0")
        : null;
  }
  add(p.id, p.scenario,
    { operation: p.op, value_a: p.a, value_b: p.b },
    expected,
    "Digits are parsed and rebuilt by explicit arithmetic, never by parseInt or toString, so the engine's use of the built-ins is independently checked.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
