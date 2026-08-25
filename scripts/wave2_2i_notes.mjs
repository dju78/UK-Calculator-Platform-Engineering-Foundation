/**
 * Narrative specification sections for Wave 2 tranche 2I, Maths & Algebra.
 * Run: node scripts/wave2_2i_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const PURE = 'Not rules-sensitive. No statutory values are used.';

Object.assign(notes, {

  "MAT-001": {
    purpose: "Evaluate an arithmetic expression with the standard order of operations.",
    scope: "Arithmetic, powers, brackets and the common mathematical functions.",
    assumptions: ["Angles are in radians unless a degree function is used explicitly."],
    validation: [
      "Expressions are capped in length.",
      "The expression language's own extension features - import, createUnit, a nested evaluate, and the symbolic helpers - are DISABLED inside expressions. A calculator needs none of them, and leaving them reachable is the whole of the expression-injection problem."
    ],
    formula: "Brackets, then powers, then multiplication and division, then addition and subtraction, evaluated left to right within each level.",
    boundary: "This evaluates arithmetic, not algebra: it will not solve for a variable or simplify symbolically.",
    methodology: "Benchmark expectations were worked out by hand from the order of operations, not by running any evaluator.",
    rules: PURE,
    related: ["MAT-002 Scientific Calculator", "MAT-012 Quadratic Formula"]
  },

  "MAT-004": {
    purpose: "Apply one or two successive discounts and show what they really come to.",
    scope: "An amount with a first discount and an optional further discount.",
    assumptions: ["The second discount is applied to the already reduced amount, as shops apply it."],
    validation: ["Each discount must be between 0% and 100%; a negative amount is refused."],
    formula: "Final = amount x (1 - first) x (1 - second). The effective single discount is the total saving over the original amount.",
    boundary: "Two 20% discounts are 36% off, NOT 40%: the second is taken from an already reduced price. Shops advertise 'an extra 20% off sale prices' precisely because it sounds like more than it is, so both the real figure and the naive sum are shown side by side. The calculator is unit-agnostic and shows no currency symbol.",
    methodology: "Independently derived, with a case pinning the 20-then-20 result at exactly 36%.",
    rules: PURE,
    related: ["BUS-008 Discount Calculator", "BUS-011 Pricing"]
  },

  "MAT-007": {
    purpose: "Round a number every common way at once, so the right convention can be chosen deliberately.",
    scope: "One value, to decimal places, significant figures or the nearest multiple, under five rounding modes.",
    assumptions: ["Decimal places and significant figures are within the range a double can represent."],
    validation: ["Decimal places 0 to 15; significant figures 1 to 15."],
    formula: "Half up rounds an exact half away from zero. Half to even sends it to the nearer EVEN neighbour. Up, down and towards zero are the ceiling, floor and truncation.",
    boundary: "Banker's rounding exists because always rounding halves upwards biases a long run of figures upwards. Accounting and statistics use half to even for that reason, while everyday arithmetic rounds half up. Both are shown rather than one being imposed.",
    methodology: "Benchmarks include the matched pair 2.5 and 3.5, which banker's rounding sends to 2 and 4 respectively - in opposite directions - proving the rule is the even neighbour and not a fixed direction.",
    rules: PURE,
    related: ["MAT-011 Scientific Notation", "MAT-003 Percentage Change"]
  },

  "MAT-008": {
    purpose: "Raise a number to a power, including negative and fractional exponents.",
    scope: "One base and one exponent.",
    assumptions: [],
    validation: [
      "Zero to a negative power is refused, because it is division by zero.",
      "A negative base with a fractional exponent is refused, because it has no real result - rather than being returned as a NaN the user has to interpret."
    ],
    formula: "A negative exponent gives the reciprocal; any non-zero number to the power of zero is 1; a fractional exponent is a root.",
    boundary: "Results beyond the range of a double are refused rather than reported as infinity.",
    methodology: "Whole-number powers are checked in the oracle by REPEATED MULTIPLICATION rather than by an exponential function, so the two routes share nothing.",
    rules: PURE,
    related: ["MAT-009 Root", "MAT-010 Log"]
  },

  "MAT-009": {
    purpose: "Take any root of a number, including odd roots of negatives.",
    scope: "One value and one root index.",
    assumptions: [],
    validation: [
      "A zeroth root is refused.",
      "An even root of a negative number is refused, because it has no real result."
    ],
    formula: "The magnitude is raised to the reciprocal power and the SIGN is restored separately. A bare power function returns NaN for the cube root of a negative number, which is wrong: that root is perfectly real.",
    boundary: "Only real roots are given. Complex roots are out of scope.",
    methodology: "Independently derived, including the cube root of a negative number specifically to catch the sign-handling error.",
    rules: PURE,
    related: ["MAT-008 Exponent", "GEO-007 Pythagorean Theorem"]
  },

  "MAT-010": {
    purpose: "Take a logarithm to any base, with the three common bases alongside.",
    scope: "One value and one base.",
    assumptions: [],
    validation: ["The value must be above zero; the base must be positive and not equal to 1."],
    formula: "log_b(x) = ln(x) / ln(b). The check figure raises the base back to the result to show the round trip.",
    boundary: "Real logarithms only: the logarithm of zero or a negative number is not defined over the reals and is refused.",
    methodology: "Independently derived, including a fractional base, where the logarithm is negative for values above 1.",
    rules: PURE,
    related: ["MAT-008 Exponent", "MAT-011 Scientific Notation"]
  },

  "MAT-011": {
    purpose: "Express a number in scientific and engineering notation to a chosen precision.",
    scope: "One value and a number of significant figures.",
    assumptions: [],
    validation: ["Significant figures between 1 and 15."],
    formula: "The exponent is the floor of the base-10 logarithm of the magnitude. Engineering notation uses the nearest multiple of three below that, so the coefficient lines up with the usual prefixes.",
    boundary: "Zero has no order of magnitude and is returned as zero rather than forced into the notation.",
    methodology: "Independently derived, including a value that lands exactly on an engineering prefix.",
    rules: PURE,
    related: ["MAT-007 Rounding", "MAT-010 Log"]
  },

  "MAT-012": {
    purpose: "Solve a quadratic, accurately, and describe the curve it comes from.",
    scope: "One quadratic in the form ax^2 + bx + c.",
    assumptions: [],
    validation: ["a of zero is refused, because that is a straight line and not a quadratic; the user is pointed at the Slope calculator."],
    formula: "The NUMERICALLY STABLE form is used: q = -(b + sign(b) sqrt(D)) / 2, giving one root as q/a and the other as c/q. The textbook formula computes the second root as a difference of two nearly equal numbers whenever b^2 is much larger than 4ac, and loses almost every significant figure doing it.",
    boundary: "Complex roots are reported as a real and an imaginary part rather than being omitted. Vieta's relations for the sum and product of the roots hold whether the roots are real or complex, so they are always shown.",
    methodology: "Where the roots are known exactly, the oracle states them and VERIFIES each by substituting it back into the polynomial, so the engine is checked against the definition of a root rather than against the same formula. A dedicated case, x^2 - 200000x + 1, pins the behaviour where the naive formula fails.",
    rules: PURE,
    related: ["MAT-013 Slope", "MAT-001 Basic Calculator"]
  },

  "MAT-013": {
    purpose: "Describe the line through two points: its gradient, equation, length and midpoint.",
    scope: "Two points in the plane.",
    assumptions: [],
    validation: ["Two identical points are refused, because they do not define a line."],
    formula: "Slope is the change in y over the change in x. The angle is measured from the positive x axis. Distance is Pythagorean.",
    boundary: "A VERTICAL line has no slope at all, which is different from a slope of zero. It is reported as such, with the equation in the form x = a, rather than dividing by zero.",
    methodology: "Independently derived; the vertical case asserts only the quantities that exist for it.",
    rules: PURE,
    related: ["MAT-012 Quadratic Formula", "GEO-008 Distance"]
  },

  "MAT-014": {
    purpose: "Break a number into its prime factors and report what follows from them.",
    scope: "A whole number from 2 up to a working limit.",
    assumptions: [],
    validation: [
      "Numbers below 2 are refused.",
      "Numbers above the working limit are refused with an explanation, rather than being allowed to hang the page."
    ],
    formula: "Trial division by 2 and then odd numbers up to the square root of the remainder. The divisor count, divisor sum and Euler totient follow DIRECTLY from the exponents, so none of them requires the divisors to be listed.",
    boundary: "Very large numbers are out of range: this is trial division, not a general-purpose factoring algorithm.",
    methodology: "The oracle factorises by ascending trial division and takes the divisor count and sum from a BRUTE-FORCE divisor list rather than from the exponent formula, so a slip in that formula could not be reproduced.",
    rules: PURE,
    related: ["MAT-015 Factor", "MAT-016 Greatest Common Factor"]
  },

  "MAT-015": {
    purpose: "List every factor of a number and classify it.",
    scope: "A whole number of 1 or more, up to a working limit.",
    assumptions: [],
    validation: ["Numbers below 1, and above the working limit, are refused."],
    formula: "Divisors are found up to the square root and paired, which is what makes the search fast. A number is perfect when its proper divisors sum to itself, abundant when they sum to more, deficient when less.",
    boundary: "Same range limit as MAT-014.",
    methodology: "The oracle tests EVERY candidate from 1 to n, where the engine tests only up to the square root and pairs the results. The two lists must match exactly.",
    rules: PURE,
    related: ["MAT-014 Prime Factorisation", "MAT-016 Greatest Common Factor"]
  },

  "MAT-016": {
    purpose: "Find the greatest common factor of two or more numbers, with the lowest common multiple alongside.",
    scope: "Two or more non-zero whole numbers.",
    assumptions: [],
    validation: ["At least two numbers; zero is refused, because it has no greatest common factor with another number."],
    formula: "The Euclidean algorithm, applied pairwise. The lowest common multiple is built as a divided by the common factor, then multiplied by b - dividing FIRST so the intermediate value stays small.",
    boundary: "The identity that the greatest common factor times the lowest common multiple equals the product holds for exactly TWO numbers. It does not extend to three or more, so it is reported only for a pair rather than presented as a general law.",
    methodology: "The oracle uses the original Euclidean method of REPEATED SUBTRACTION rather than the modulo form the engine uses.",
    rules: PURE,
    related: ["MAT-017 Least Common Multiple", "MAT-014 Prime Factorisation"]
  },

  "MAT-017": {
    purpose: "Find the lowest common multiple of two or more numbers.",
    scope: "Two or more non-zero whole numbers.",
    assumptions: [],
    validation: ["Same as MAT-016; the two share one implementation."],
    formula: "Built pairwise from the greatest common factor, dividing before multiplying.",
    boundary: "Same as MAT-016.",
    methodology: "Shares the benchmark scenarios with MAT-016, so the two calculators cannot disagree on the same numbers.",
    rules: PURE,
    related: ["MAT-016 Greatest Common Factor"]
  },

  "MAT-018": {
    purpose: "Divide two whole numbers and show the working, step by step.",
    scope: "Positive whole numbers.",
    assumptions: [],
    validation: [
      "Division by zero is refused.",
      "Negative inputs are refused with an explanation, because the long-division layout is defined for magnitudes."
    ],
    formula: "Each digit is brought down in turn, the quotient digit found, the product subtracted and the remainder carried forward - the method taught in schools, recorded as a table of steps.",
    boundary: "Integer division with a remainder. The decimal result is shown alongside but is not expanded step by step.",
    methodology: "The oracle finds the quotient and remainder by REPEATED SUBTRACTION, which is the definition of integer division rather than an application of the floor function.",
    rules: PURE,
    related: ["MAT-016 Greatest Common Factor", "MAT-001 Basic Calculator"]
  },

  "MAT-019": {
    purpose: "Generate a sequence, its nth term and its sum.",
    scope: "Arithmetic, geometric and Fibonacci-style sequences, up to 1000 terms.",
    assumptions: ["For a Fibonacci-style sequence the two seed values are the first term and the step."],
    validation: [
      "Between 1 and 1000 terms.",
      "A geometric sequence needs a non-zero ratio.",
      "A term that overflows a double is refused, naming the term, rather than reported as infinity."
    ],
    formula: "Arithmetic: a + (n-1)d. Geometric: a r^(n-1). Fibonacci: each term is the sum of the two before it.",
    boundary: "An infinite geometric series has a finite sum only when the ratio lies strictly between -1 and 1. Outside that range NO infinite sum is reported, because there is none - reporting a/(1-r) regardless would be nonsense.",
    methodology: "The oracle generates terms one at a time and sums them directly, so a closed-form slip could not be reproduced on both sides.",
    rules: PURE,
    related: ["MAT-008 Exponent", "INV-002 Compound Interest"]
  },

  "MAT-021": {
    purpose: "Perform the standard matrix operations with clear errors when the shapes do not allow them.",
    scope: "Addition, subtraction, multiplication, determinant, inverse and transpose.",
    assumptions: [],
    validation: [
      "Rows must all be the same length.",
      "Addition and subtraction require identical dimensions, and the error names both shapes.",
      "Multiplication requires the columns of A to match the rows of B, and the error names both counts.",
      "A determinant or inverse requires a square matrix.",
      "A singular matrix is refused for inversion with an explanation, not returned as infinities."
    ],
    formula: "Determinant and inverse by Gauss-Jordan elimination with PARTIAL PIVOTING, which selects the largest available pivot at each step and is what keeps the elimination numerically stable.",
    boundary: "Matrix multiplication is not commutative: A times B is generally not B times A, and the calculator computes the order given.",
    methodology: "The oracle computes determinants by COFACTOR EXPANSION and the inverse by the ADJUGATE over the determinant - neither of which is elimination - and verifies the inverse by multiplying it back to the identity before recording it.",
    rules: PURE,
    related: ["MAT-013 Slope", "STA-014 Linear Regression"]
  },

  "MAT-022": {
    purpose: "Convert and compute in binary, with the other common bases shown alongside.",
    scope: "Conversion and integer arithmetic in base 2.",
    assumptions: ["Whole numbers only."],
    validation: [
      "Invalid digits are named, along with which digits the base allows.",
      "Values beyond exact integer representation are refused.",
      "Division by zero is refused."
    ],
    formula: "Values are parsed from their digits and rebuilt by repeated division.",
    boundary: "Division is INTEGER division, so any fractional part is discarded, as it is in most low-level arithmetic. Two's complement is shown only where the value fits in eight bits, because the representation is meaningless without a fixed width.",
    methodology: "The oracle parses and rebuilds digits by EXPLICIT ARITHMETIC, never with parseInt or toString, so the engine's use of the built-ins is independently checked.",
    rules: PURE,
    related: ["MAT-023 Hex Calculator", "TEC-001 IP Subnet"]
  },

  "MAT-023": {
    purpose: "Convert and compute in hexadecimal, with the other common bases shown alongside.",
    scope: "Conversion and integer arithmetic in base 16.",
    assumptions: ["Whole numbers only."],
    validation: ["Same as MAT-022; the two share one implementation."],
    formula: "Same as MAT-022, at base 16.",
    boundary: "Hexadecimal digits run 0 to 9 then A to F, so each carries exactly four bits, which is why it is the usual shorthand for binary data such as colours and memory addresses.",
    methodology: "Shares the oracle with MAT-022, including a six-digit colour value.",
    rules: PURE,
    related: ["MAT-022 Binary Calculator"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
