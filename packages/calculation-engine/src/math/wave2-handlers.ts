import type { NumericInputs, CalculatorHandler } from "../types.js";
import { evaluateExpression } from "./core.js";
import {
  percentOff, rounding, normaliseRoundingMode, exponent, root, logarithm,
  scientificNotation, quadratic, slope, primeFactorisation, factors, gcdLcm,
  longDivision, numberSequence, normaliseSequenceType, matrixOperation,
  normaliseMatrixOperation, baseArithmetic, normaliseBaseOperation
} from "./wave2.js";

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
function orNull(n: number | null | undefined, fn: (v: number) => number): number | null {
  return n === null || n === undefined ? null : fn(n);
}

function parseList(value: unknown, label: string): number[] {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(raw)) throw new Error(`${label} must be a list of numbers.`);
  return raw.map(Number);
}
function parseMatrixInput(value: unknown): unknown {
  return typeof value === "string" ? JSON.parse(value) : value;
}

/** MAT-001 Basic Calculator */
export const mat001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const expression = String(inputs.expression ?? "").trim();
  const result = evaluateExpression(expression);
  return {
    outputs: {
      expression,
      result: round8(result),
      rounded_2dp: Math.round(result * 100) / 100,
      is_whole_number: Number.isInteger(result),
      basis:
        "Standard order of operations applies: brackets, then powers, then multiplication and division, then addition and subtraction. Only arithmetic is available; the expression language's own extension features are switched off."
    }
  };
};

/** MAT-004 Percent Off */
export const mat004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = percentOff(
    Number(inputs.original_price),
    Number(inputs.discount),
    Number(inputs.second_discount ?? 0)
  );
  const warnings: string[] = [];
  if (r.stacking_saves_less_than_adding) {
    warnings.push(
      `Two discounts applied one after the other are not the same as adding them together. These come to ${round8(r.effective_single_discount * 100)}% off, not ${round8(r.sum_of_discounts_would_have_been * 100)}%, because the second is taken from an already reduced price.`
    );
  }
  return {
    outputs: {
      price_after_first: round8(r.price_after_first),
      final_price: round8(r.final_price),
      total_saving: round8(r.total_saving),
      effective_single_discount: round8(r.effective_single_discount),
      sum_of_discounts_would_have_been: round8(r.sum_of_discounts_would_have_been),
      basis:
        "A second discount is taken from the already reduced price, never from the original, which is why 20% and then a further 20% is 36% off rather than 40%."
    },
    warnings
  };
};

/** MAT-007 Rounding */
export const mat007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const mode = normaliseRoundingMode(inputs.mode);
  const r = rounding(
    Number(inputs.value),
    Number(inputs.decimal_places ?? 2),
    Number(inputs.significant_figures ?? 3),
    Number(inputs.nearest_multiple ?? 0),
    mode
  );
  return {
    outputs: {
      result: round8(r.result),
      rounded_to_decimal_places: round8(r.rounded_to_decimal_places),
      rounded_to_significant_figures: round8(r.rounded_to_significant_figures),
      rounded_to_nearest_multiple: round8(r.rounded_to_nearest_multiple),
      rounded_up: round8(r.rounded_up),
      rounded_down: round8(r.rounded_down),
      truncated: round8(r.truncated),
      bankers_rounding: round8(r.bankers_rounding),
      difference_from_original: round8(r.difference_from_original),
      mode_used: r.mode_used,
      basis:
        "Banker's rounding sends an exact half to the nearer EVEN number rather than always upwards. Over many roundings that keeps the total unbiased, which is why accounting and statistics use it while everyday arithmetic rounds half up."
    }
  };
};

/** MAT-008 Exponent */
export const mat008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = exponent(Number(inputs.base), Number(inputs.exponent));
  return {
    outputs: {
      result: round8(r.result),
      reciprocal: orNull(r.reciprocal, round8),
      squared: round8(r.squared),
      cubed: round8(r.cubed),
      is_exact_integer: r.is_exact_integer,
      basis:
        "A negative exponent gives the reciprocal, and any non-zero number to the power of zero is 1. A negative base with a fractional exponent has no real answer and is refused rather than returned as an error value."
    }
  };
};

/** MAT-009 Root */
export const mat009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = root(Number(inputs.value), Number(inputs.index ?? 2));
  return {
    outputs: {
      root: round8(r.root),
      check: round8(r.check),
      square_root: orNull(r.square_root, round8),
      cube_root: round8(r.cube_root),
      is_perfect_root: r.is_perfect_root,
      basis:
        "Odd roots of negative numbers are real and are computed correctly here; even roots of negatives are not real and are refused. The check figure raises the answer back to the power to show the round trip."
    }
  };
};

/** MAT-010 Logarithm */
export const mat010Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = logarithm(Number(inputs.value), Number(inputs.base ?? 10));
  return {
    outputs: {
      logarithm: round8(r.logarithm),
      natural_log: round8(r.natural_log),
      log_base_10: round8(r.log_base_10),
      log_base_2: round8(r.log_base_2),
      check: round8(r.check),
      basis:
        "A logarithm answers what power the base must be raised to in order to give the value. It is defined only for values above zero, and the base must be positive and not 1."
    }
  };
};

/** MAT-011 Scientific Notation */
export const mat011Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = scientificNotation(Number(inputs.value), Number(inputs.significant_figures ?? 3));
  return {
    outputs: {
      coefficient: round8(r.coefficient),
      exponent: r.exponent,
      scientific_notation: r.scientific_notation,
      engineering_coefficient: round8(r.engineering_coefficient),
      engineering_exponent: r.engineering_exponent,
      engineering_notation: r.engineering_notation,
      order_of_magnitude: r.order_of_magnitude,
      basis:
        "Engineering notation uses exponents that are multiples of three, so the coefficient lines up with the usual prefixes: kilo, mega, milli and so on."
    }
  };
};

/** MAT-012 Quadratic Formula */
export const mat012Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = quadratic(Number(inputs.a), Number(inputs.b), Number(inputs.c));
  return {
    outputs: {
      discriminant: round8(r.discriminant),
      nature_of_roots: r.nature_of_roots,
      root_1: orNull(r.root_1, round8),
      root_2: orNull(r.root_2, round8),
      real_part: orNull(r.real_part, round8),
      imaginary_part: orNull(r.imaginary_part, round8),
      vertex_x: round8(r.vertex_x),
      vertex_y: round8(r.vertex_y),
      axis_of_symmetry: round8(r.axis_of_symmetry),
      sum_of_roots: round8(r.sum_of_roots),
      product_of_roots: round8(r.product_of_roots),
      opens_upwards: r.opens_upwards,
      basis:
        "The roots are found by the numerically stable form of the quadratic formula, which computes the larger root first and derives the other from the product of the roots. The textbook form loses most of its accuracy when b is large compared with 4ac, because one root then becomes the difference of two nearly equal numbers."
    }
  };
};

/** MAT-013 Slope */
export const mat013Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = slope(Number(inputs.x1), Number(inputs.y1), Number(inputs.x2), Number(inputs.y2));
  return {
    outputs: {
      slope: orNull(r.slope, round8),
      y_intercept: orNull(r.y_intercept, round8),
      x_intercept: orNull(r.x_intercept, round8),
      equation: r.equation,
      angle_degrees: round8(r.angle_degrees),
      distance: round8(r.distance),
      midpoint_x: round8(r.midpoint_x),
      midpoint_y: round8(r.midpoint_y),
      perpendicular_slope: orNull(r.perpendicular_slope, round8),
      basis:
        "A vertical line has no slope at all rather than a slope of zero, and its equation takes the form x = a. That case is reported as such instead of dividing by zero."
    }
  };
};

/** MAT-014 Prime Factorisation */
export const mat014Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = primeFactorisation(Number(inputs.number));
  return {
    outputs: {
      is_prime: r.is_prime,
      prime_factors: r.prime_factors,
      distinct_primes: r.distinct_primes,
      exponents: r.exponents,
      factorisation: r.factorisation,
      number_of_divisors: r.number_of_divisors,
      sum_of_divisors: r.sum_of_divisors,
      eulers_totient: r.eulers_totient,
      basis:
        "Every whole number above 1 has exactly one prime factorisation. The divisor count, divisor sum and Euler totient all follow directly from the exponents, so none of them needs the divisors to be listed."
    }
  };
};

/** MAT-015 Factors */
export const mat015Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = factors(Number(inputs.number));
  return {
    outputs: {
      factors: r.factors,
      factor_count: r.factor_count,
      sum_of_proper_divisors: r.sum_of_proper_divisors,
      largest_proper_factor: r.largest_proper_factor,
      is_prime: r.is_prime,
      is_perfect: r.is_perfect,
      is_abundant: r.is_abundant,
      is_deficient: r.is_deficient,
      basis:
        "A number is perfect when its proper divisors add up to itself, abundant when they add up to more, and deficient when they add up to less. 6 and 28 are the first two perfect numbers."
    }
  };
};

/** MAT-016 Greatest Common Factor */
export const mat016Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = gcdLcm(parseList(inputs.numbers, "Numbers"));
  return {
    outputs: {
      greatest_common_factor: r.greatest_common_factor,
      least_common_multiple: r.least_common_multiple,
      are_coprime: r.are_coprime,
      simplified_ratio: r.simplified_ratio,
      gcf_times_lcm: r.gcf_times_lcm,
      product_of_all: r.product_of_all,
      basis:
        "Found by the Euclidean algorithm. For exactly two numbers the greatest common factor times the lowest common multiple equals their product; that identity does NOT extend to three or more, so it is shown only for a pair."
    }
  };
};

/** MAT-017 Least Common Multiple */
export const mat017Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = gcdLcm(parseList(inputs.numbers, "Numbers"));
  return {
    outputs: {
      least_common_multiple: r.least_common_multiple,
      greatest_common_factor: r.greatest_common_factor,
      are_coprime: r.are_coprime,
      product_of_all: r.product_of_all,
      basis:
        "Built up pair by pair as a divided by their common factor, then multiplied by b. Dividing before multiplying keeps the intermediate value small, so large inputs do not overflow needlessly."
    }
  };
};

/** MAT-018 Long Division */
export const mat018Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = longDivision(Number(inputs.dividend), Number(inputs.divisor));
  return {
    outputs: {
      quotient: r.quotient,
      remainder: r.remainder,
      decimal_result: round8(r.decimal_result),
      is_exact: r.is_exact,
      mixed_number: r.mixed_number,
      basis:
        "The working below shows each digit brought down, the quotient digit it produces and the remainder carried forward, which is the method taught in schools."
    },
    schedule: r.steps
  };
};

/** MAT-019 Number Sequence */
export const mat019Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const type = normaliseSequenceType(inputs.sequence_type);
  const r = numberSequence(
    type,
    Number(inputs.first_term),
    Number(inputs.step),
    Number(inputs.number_of_terms)
  );
  return {
    outputs: {
      terms: r.terms.map(round8),
      nth_term: round8(r.nth_term),
      sum_of_terms: round8(r.sum_of_terms),
      formula: r.formula,
      common_difference: orNull(r.common_difference, round8),
      common_ratio: orNull(r.common_ratio, round8),
      infinite_sum: orNull(r.infinite_sum, round8),
      converges: r.converges,
      basis:
        type === "geometric"
          ? "An infinite geometric series adds up to a finite total only when the ratio lies strictly between -1 and 1. Outside that range no infinite sum is reported, because there is none."
          : "Each term follows from the rule shown. The sum is of the terms listed, not of an infinite series."
    }
  };
};

/** MAT-021 Matrix */
export const mat021Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const operation = normaliseMatrixOperation(inputs.operation);
  const r = matrixOperation(
    operation,
    parseMatrixInput(inputs.matrix_a),
    inputs.matrix_b === "" || inputs.matrix_b === undefined ? null : parseMatrixInput(inputs.matrix_b)
  );
  return {
    outputs: {
      operation: r.operation,
      result: r.result === null ? null : r.result.map((row) => row.map(round8)),
      determinant: orNull(r.determinant, round8),
      is_invertible: r.is_invertible,
      rows: r.rows,
      columns: r.columns,
      basis:
        "The determinant and inverse are found by Gauss-Jordan elimination with partial pivoting, which chooses the largest available pivot at each step and is what keeps the arithmetic stable. Matrix multiplication is not commutative: A times B is generally not B times A."
    }
  };
};

/** MAT-022 Binary */
export const mat022Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const operation = normaliseBaseOperation(inputs.operation);
  const r = baseArithmetic(operation, 2, String(inputs.value_a), String(inputs.value_b ?? ""));
  return {
    outputs: {
      binary: r.binary,
      decimal: r.decimal,
      hexadecimal: r.hexadecimal,
      octal: r.octal,
      decimal_result: r.decimal_result,
      bit_length: r.bit_length,
      twos_complement_8_bit: r.twos_complement_8_bit,
      basis:
        "Division is integer division, so any fractional part is discarded, as it is in most low-level arithmetic. Two's complement is shown only where the value actually fits in eight bits, because the representation is meaningless without a fixed width."
    }
  };
};

/** MAT-023 Hexadecimal */
export const mat023Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const operation = normaliseBaseOperation(inputs.operation);
  const r = baseArithmetic(operation, 16, String(inputs.value_a), String(inputs.value_b ?? ""));
  return {
    outputs: {
      hexadecimal: r.hexadecimal,
      decimal: r.decimal,
      binary: r.binary,
      octal: r.octal,
      decimal_result: r.decimal_result,
      bit_length: r.bit_length,
      basis:
        "Hexadecimal digits run 0 to 9 then A to F, so each one carries exactly four bits. That is why hexadecimal is the usual shorthand for binary data such as colours and memory addresses."
    }
  };
};
