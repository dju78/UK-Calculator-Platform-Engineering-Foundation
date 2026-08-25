import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";
import { evaluateExpression } from "../packages/calculation-engine/src/math/core.js";

const CTX = {};
const closeTo = (a: number, e: number, tol = 1e-8) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// The expression evaluator must do arithmetic and nothing else
// ---------------------------------------------------------------------------

test("the expression language cannot reach outside arithmetic", async (t: any) => {
  await t.test("ordinary arithmetic still works", () => {
    closeTo(evaluateExpression("2 + 3 * 4"), 14);
    closeTo(evaluateExpression("sqrt(16)"), 4);
    closeTo(evaluateExpression("(1 + 2) ^ 3"), 27);
  });

  // mathjs is a full language, not a calculator. These names are the documented
  // route out of the intended sandbox, and a calculator needs none of them.
  for (const attempt of [
    'import("x")',
    'evaluate("1+1")',
    'createUnit("zzz")',
    'parse("1+1")',
    'simplify("x+x")',
    'derivative("x^2", "x")'
  ]) {
    await t.test(`${attempt} is refused`, () => {
      assert.throws(() => evaluateExpression(attempt), /is not available in an expression/);
    });
  }

  await t.test("an absurdly long expression is refused", () => {
    assert.throws(() => evaluateExpression("1+".repeat(400) + "1"), /too long/);
  });

  // The expression box takes text from anyone. These are the routes by which
  // an expression language is normally turned into code execution: reaching a
  // constructor or a prototype, naming a host global, or calling into the
  // runtime. Every one must fail.
  const escapes = [
    "[].constructor",
    "(1).constructor",
    '"".constructor',
    "[].__proto__",
    'obj["constructor"]',
    "f(x) = x.constructor; f(1)",
    "process",
    "global",
    "globalThis",
    "this",
    "window",
    'require("fs")',
    'Function("return 1")',
    "Object.keys({})",
    "Math.constructor"
  ];
  for (const attempt of escapes) {
    await t.test(`${attempt} cannot reach the host`, () => {
      assert.throws(() => evaluateExpression(attempt));
    });
  }

  // Hardening must not cost the scientific calculator anything. These are the
  // functions Wave 1's MAT-002 and its users actually rely on.
  await t.test("every scientific function still works", () => {
    const expected: Array<[string, number]> = [
      ["sin(pi/2)", 1], ["cos(0)", 1], ["log(100, 10)", 2], ["ln(e)", 1],
      ["sqrt(2)", Math.SQRT2], ["abs(-5)", 5], ["exp(1)", Math.E],
      ["round(2.567, 2)", 2.57], ["5!", 120], ["2^10", 1024],
      ["nthRoot(27, 3)", 3], ["log10(1000)", 3], ["hypot(3, 4)", 5],
      ["mod(10, 3)", 1], ["ceil(1.2)", 2], ["floor(1.8)", 1]
    ];
    for (const [expr, value] of expected) {
      closeTo(evaluateExpression(expr), value, 1e-9);
    }
  });

  // A calculator that hangs the page is a denial of service even when it
  // cannot leak anything, so runaway results are refused rather than returned.
  await t.test("runaway computations are refused, not returned", () => {
    assert.throws(() => evaluateExpression("9^9^9"), /not a finite number/);
    assert.throws(() => evaluateExpression("2000!"), /not a finite number/);
    assert.throws(() => evaluateExpression("zeros(2000, 2000)"), /did not evaluate to a number/);
  });
});

// ---------------------------------------------------------------------------
// MAT-004: two discounts are not the sum of two discounts
// ---------------------------------------------------------------------------

test("MAT-004 shows what stacked discounts really come to", async () => {
  const { outputs, warnings } = await calculate(
    "MAT-004",
    { original_price: 100, discount: 20, second_discount: 20 },
    CTX
  );
  closeTo(outputs.final_price as number, 64);
  closeTo(outputs.effective_single_discount as number, 0.36);
  closeTo(outputs.sum_of_discounts_would_have_been as number, 0.4);
  assert.ok(warnings.some((w: string) => /not the same as adding them together/i.test(w)));
});

// ---------------------------------------------------------------------------
// MAT-007: banker's rounding goes to the even neighbour, not a fixed direction
// ---------------------------------------------------------------------------

test("MAT-007 banker's rounding sends halves to the even neighbour", async () => {
  const twoPointFive = await calculate("MAT-007", {
    value: 2.5, decimal_places: 0, significant_figures: 2, nearest_multiple: 0, mode: "half_even"
  }, CTX);
  const threePointFive = await calculate("MAT-007", {
    value: 3.5, decimal_places: 0, significant_figures: 2, nearest_multiple: 0, mode: "half_even"
  }, CTX);

  // Down to 2, then UP to 4. A fixed-direction rule cannot produce both.
  assert.strictEqual(twoPointFive.outputs.result, 2);
  assert.strictEqual(threePointFive.outputs.result, 4);
  // Everyday rounding sends both upwards.
  assert.strictEqual(twoPointFive.outputs.rounded_to_decimal_places, 3);
});

// ---------------------------------------------------------------------------
// MAT-008 / MAT-009: results that have no real value are refused
// ---------------------------------------------------------------------------

test("MAT-008 refuses powers with no real result", async (t: any) => {
  await t.test("zero to a negative power", async () => {
    await assert.rejects(
      () => calculate("MAT-008", { base: 0, exponent: -2 }, CTX),
      /division by zero/
    );
  });
  await t.test("negative base with a fractional exponent", async () => {
    await assert.rejects(
      () => calculate("MAT-008", { base: -8, exponent: 0.5 }, CTX),
      /no real result/
    );
  });
});

test("MAT-009 gets the cube root of a negative number right", async () => {
  const { outputs } = await calculate("MAT-009", { value: -8, index: 3 }, CTX);
  // A bare power function returns NaN here. The root is real and is -2.
  closeTo(outputs.root as number, -2);
  closeTo(outputs.check as number, -8);
  assert.strictEqual(outputs.square_root, null);
});

test("MAT-009 refuses an even root of a negative number", async () => {
  await assert.rejects(
    () => calculate("MAT-009", { value: -16, index: 2 }, CTX),
    /no real result/
  );
});

// ---------------------------------------------------------------------------
// MAT-012: the stable quadratic formula
// ---------------------------------------------------------------------------

test("MAT-012 keeps precision where the textbook formula fails", async () => {
  const { outputs } = await calculate("MAT-012", { a: 1, b: -200000, c: 1 }, CTX);
  const small = outputs.root_1 as number;
  const large = outputs.root_2 as number;

  // The naive (-b - sqrt(D)) / 2a subtracts two numbers agreeing to ten
  // figures and returns roughly 0.0000050000 with almost no correct digits.
  // The true smaller root is 1/200000 to within a few parts in 10^11.
  closeTo(small, 5.000000000125e-6, 1e-14);
  // Both roots must satisfy the polynomial.
  for (const r of [small, large]) {
    const residual = r * r - 200000 * r + 1;
    assert.ok(Math.abs(residual) < 1e-6, `${r} does not satisfy the equation: residual ${residual}`);
  }
  // And Vieta's relations must hold.
  closeTo(small + large, 200000, 1e-6);
  closeTo(small * large, 1, 1e-9);
});

test("MAT-012 reports complex roots rather than omitting them", async () => {
  const { outputs } = await calculate("MAT-012", { a: 1, b: 2, c: 5 }, CTX);
  assert.strictEqual(outputs.root_1, null);
  closeTo(outputs.real_part as number, -1);
  closeTo(outputs.imaginary_part as number, 2);
  assert.match(String(outputs.nature_of_roots), /never crosses the x axis/);
});

test("MAT-012 refuses a with a value of zero", async () => {
  await assert.rejects(
    () => calculate("MAT-012", { a: 0, b: 2, c: 3 }, CTX),
    /straight line, not a quadratic/
  );
});

// ---------------------------------------------------------------------------
// MAT-013: a vertical line has no slope
// ---------------------------------------------------------------------------

test("MAT-013 distinguishes a vertical line from a flat one", async () => {
  const vertical = await calculate("MAT-013", { x1: 2, y1: 1, x2: 2, y2: 9 }, CTX);
  const horizontal = await calculate("MAT-013", { x1: -3, y1: 4, x2: 6, y2: 4 }, CTX);

  assert.strictEqual(vertical.outputs.slope, null);
  assert.match(String(vertical.outputs.equation), /^x = 2$/);
  assert.strictEqual(horizontal.outputs.slope, 0);
  // A horizontal line has no perpendicular slope either, because the
  // perpendicular is vertical.
  assert.strictEqual(horizontal.outputs.perpendicular_slope, null);
});

test("MAT-013 refuses two identical points", async () => {
  await assert.rejects(
    () => calculate("MAT-013", { x1: 1, y1: 1, x2: 1, y2: 1 }, CTX),
    /do not define a line/
  );
});

// ---------------------------------------------------------------------------
// MAT-014 / MAT-015: the two factor calculators must agree
// ---------------------------------------------------------------------------

test("MAT-014 and MAT-015 agree on the divisors of the same number", async (t: any) => {
  for (const n of [28, 97, 144, 210]) {
    await t.test(`n = ${n}`, async () => {
      const primes = await calculate("MAT-014", { number: n }, CTX);
      const list = await calculate("MAT-015", { number: n }, CTX);
      assert.strictEqual(primes.outputs.number_of_divisors, list.outputs.factor_count);
      assert.strictEqual(primes.outputs.is_prime, list.outputs.is_prime);
      // The divisor sum from the exponent formula must equal the sum of the
      // listed divisors.
      const listed = (list.outputs.factors as number[]).reduce((a, b) => a + b, 0);
      assert.strictEqual(primes.outputs.sum_of_divisors, listed);
    });
  }
});

test("MAT-015 identifies a perfect number", async () => {
  const { outputs } = await calculate("MAT-015", { number: 28 }, CTX);
  // 1 + 2 + 4 + 7 + 14 = 28.
  assert.strictEqual(outputs.is_perfect, true);
  assert.strictEqual(outputs.sum_of_proper_divisors, 28);
});

test("MAT-014 refuses a number outside its working range", async () => {
  await assert.rejects(() => calculate("MAT-014", { number: 1 }, CTX), /2 or more/);
  await assert.rejects(() => calculate("MAT-014", { number: 1e13 }, CTX), /too long to factorise/);
});

// ---------------------------------------------------------------------------
// MAT-016: the GCF x LCM identity holds only for two numbers
// ---------------------------------------------------------------------------

test("MAT-016 claims the product identity only for a pair", async () => {
  const pair = await calculate("MAT-016", { numbers: "[48, 18]" }, CTX);
  const triple = await calculate("MAT-016", { numbers: "[12, 18, 24]" }, CTX);

  assert.strictEqual(pair.outputs.gcf_times_lcm, pair.outputs.product_of_all);
  // For three numbers the identity is false, so nothing is claimed.
  assert.strictEqual(triple.outputs.gcf_times_lcm, null);
  assert.match(String(pair.outputs.basis), /does NOT extend to three or more/);
});

test("MAT-016 refuses zero", async () => {
  await assert.rejects(
    () => calculate("MAT-016", { numbers: "[0, 5]" }, CTX),
    /Zero has no greatest common factor/
  );
});

// ---------------------------------------------------------------------------
// MAT-019: an infinite sum is only claimed where one exists
// ---------------------------------------------------------------------------

test("MAT-019 reports an infinite sum only for a converging series", async () => {
  const converging = await calculate("MAT-019", {
    sequence_type: "geometric", first_term: 1, step: 0.5, number_of_terms: 10
  }, CTX);
  const diverging = await calculate("MAT-019", {
    sequence_type: "geometric", first_term: 2, step: 3, number_of_terms: 8
  }, CTX);

  assert.strictEqual(converging.outputs.converges, true);
  closeTo(converging.outputs.infinite_sum as number, 2);
  assert.strictEqual(diverging.outputs.converges, false);
  assert.strictEqual(diverging.outputs.infinite_sum, null);
});

test("MAT-019 produces the Fibonacci numbers", async () => {
  const { outputs } = await calculate("MAT-019", {
    sequence_type: "fibonacci", first_term: 1, step: 1, number_of_terms: 12
  }, CTX);
  assert.deepStrictEqual(outputs.terms, [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]);
});

// ---------------------------------------------------------------------------
// MAT-021: shape errors explain themselves
// ---------------------------------------------------------------------------

test("MAT-021 explains why an operation is impossible", async (t: any) => {
  await t.test("addition of different shapes", async () => {
    await assert.rejects(
      () => calculate("MAT-021", {
        operation: "add", matrix_a: "[[1,2],[3,4]]", matrix_b: "[[1,2,3],[4,5,6]]"
      }, CTX),
      /A is 2 by 2; B is 2 by 3/
    );
  });
  await t.test("multiplication with mismatched inner dimensions", async () => {
    await assert.rejects(
      () => calculate("MAT-021", {
        operation: "multiply", matrix_a: "[[1,2],[3,4]]", matrix_b: "[[1,2],[3,4],[5,6]]"
      }, CTX),
      /A has 2 columns and B has 3 rows/
    );
  });
  await t.test("inverse of a singular matrix", async () => {
    await assert.rejects(
      () => calculate("MAT-021", {
        operation: "inverse", matrix_a: "[[1,2],[2,4]]", matrix_b: ""
      }, CTX),
      /singular and has no inverse/
    );
  });
  await t.test("determinant of a non-square matrix", async () => {
    await assert.rejects(
      () => calculate("MAT-021", {
        operation: "determinant", matrix_a: "[[1,2,3],[4,5,6]]", matrix_b: ""
      }, CTX),
      /only for a square matrix/
    );
  });
});

test("MAT-021 the inverse multiplies back to the identity", async () => {
  const { outputs } = await calculate("MAT-021", {
    operation: "inverse", matrix_a: "[[4,7],[2,6]]", matrix_b: ""
  }, CTX);
  const inv = outputs.result as number[][];
  const a = [[4, 7], [2, 6]];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const value = a[i][0] * inv[0][j] + a[i][1] * inv[1][j];
      closeTo(value, i === j ? 1 : 0, 1e-7);
    }
  }
});

// ---------------------------------------------------------------------------
// MAT-022 / MAT-023: invalid digits are named
// ---------------------------------------------------------------------------

test("MAT-022 names the digits a base allows", async () => {
  await assert.rejects(
    () => calculate("MAT-022", { operation: "convert", value_a: "1021", value_b: "" }, CTX),
    /Use only 0 and 1/
  );
});

test("MAT-023 accepts hexadecimal and refuses what is not", async () => {
  const { outputs } = await calculate("MAT-023", { operation: "convert", value_a: "FF", value_b: "" }, CTX);
  assert.strictEqual(outputs.decimal_result, 255);
  assert.strictEqual(outputs.binary, "11111111");

  await assert.rejects(
    () => calculate("MAT-023", { operation: "convert", value_a: "GG", value_b: "" }, CTX),
    /Use only 0 to 9 and A to F/
  );
});

test("MAT-022 shows two's complement only where it means something", async () => {
  const inRange = await calculate("MAT-022", {
    operation: "subtract", value_a: "1010", value_b: "1111"
  }, CTX);
  const outOfRange = await calculate("MAT-022", {
    operation: "multiply", value_a: "11111111", value_b: "10"
  }, CTX);

  // -5 fits in a byte, so the eight-bit form is meaningful.
  assert.strictEqual(inRange.outputs.decimal_result, -5);
  assert.strictEqual(inRange.outputs.twos_complement_8_bit, "11111011");
  // 510 does not, so nothing is shown rather than a misleading truncation.
  assert.strictEqual(outOfRange.outputs.twos_complement_8_bit, null);
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the maths tranche
// ---------------------------------------------------------------------------

test("no maths calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["MAT-001", { expression: "0" }],
    ["MAT-004", { original_price: 0, discount: 0, second_discount: 0 }],
    ["MAT-007", { value: 0, decimal_places: 0, significant_figures: 1, nearest_multiple: 0, mode: "half_up" }],
    ["MAT-008", { base: 0, exponent: 0 }],
    ["MAT-009", { value: 0, index: 2 }],
    ["MAT-011", { value: 0, significant_figures: 1 }],
    ["MAT-012", { a: 1, b: 0, c: 0 }],
    ["MAT-013", { x1: 0, y1: 0, x2: 1, y2: 0 }],
    ["MAT-015", { number: 1 }],
    ["MAT-018", { dividend: 0, divisor: 1 }],
    ["MAT-019", { sequence_type: "arithmetic", first_term: 0, step: 0, number_of_terms: 1 }],
    ["MAT-022", { operation: "convert", value_a: "0", value_b: "" }],
    ["MAT-023", { operation: "convert", value_a: "0", value_b: "" }]
  ];
  for (const [id, inputs] of cases) {
    await t.test(`${id} at its degenerate boundary`, async () => {
      const { outputs } = await calculate(id, inputs, CTX);
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === "number") {
          assert.ok(Number.isFinite(value), `${id}.${key} is ${value}`);
        }
        assert.notStrictEqual(String(value), "[object Object]", `${id}.${key} rendered as an object`);
        assert.notStrictEqual(String(value), "undefined", `${id}.${key} is undefined`);
      }
    });
  }
});
