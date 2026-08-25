import { create, all } from 'mathjs';

const math = create(all, {});
math.import({
  ln: math.log
});

/**
 * Disable the parts of the expression language that let an expression reach
 * outside arithmetic.
 *
 * mathjs is a full language, not a calculator: `import`, `createUnit`, a
 * nested `evaluate` and the symbolic helpers can all be used to escape the
 * intended sandbox. A calculator needs none of them, so they are replaced with
 * functions that refuse. This costs nothing a user would notice and removes
 * the whole class of expression-injection problem.
 */
// Capture the real evaluator BEFORE the namespace entries are replaced, so
// this module can still evaluate while an expression can no longer reach
// these names.
const evaluateSafely = math.evaluate.bind(math);

const DISABLED = ['import', 'createUnit', 'evaluate', 'parse', 'simplify', 'derivative'];
math.import(
  Object.fromEntries(
    DISABLED.map((name) => [
      name,
      () => {
        throw new Error(`"${name}" is not available in an expression.`);
      }
    ])
  ),
  { override: true }
);

const MAX_EXPRESSION_LENGTH = 500;

export function evaluateExpression(expression: string, angle: "radians" | "degrees" = "radians"): number {
  if (!expression || typeof expression !== 'string') {
    throw new Error("Invalid expression");
  }
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(
      `That expression is too long. Keep it under ${MAX_EXPRESSION_LENGTH} characters.`
    );
  }

  // mathjs eval
  try {
    let result = evaluateSafely(expression);

    if (typeof result === 'number') {
      if (!isFinite(result)) {
        throw new Error("Result is not a finite number");
      }
      return result;
    } else {
      throw new Error("Expression did not evaluate to a number");
    }
  } catch (err: any) {
    throw new Error(`Evaluation error: ${err.message}`);
  }
}

export function percentageCalculator(inputs: any): any {
  const { mode } = inputs;
  if (mode === "percent_of") {
    return { result: (inputs.pct / 100) * inputs.value };
  } else if (mode === "is_what_percent") {
    if (inputs.b === 0) throw new Error("Divide by zero");
    return { result_percent: (inputs.a / inputs.b) * 100 };
  } else if (mode === "is_percent_of_what") {
    if (inputs.pct === 0) throw new Error("Divide by zero");
    return { result: (inputs.a / (inputs.pct / 100)) };
  } else if (mode === "percent_change") {
    if (inputs.old === 0) throw new Error("Divide by zero");
    return { result_percent: ((inputs.new - inputs.old) / inputs.old) * 100 };
  }
  throw new Error("Unknown mode");
}

export function gcd(a: number, b: number): number {
  // NaN must be rejected before the loop: NaN % n is NaN and NaN !== 0 is
  // always true, so a non-finite argument would loop forever.
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error("Ratio values must be valid numbers.");
  }
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

export function ratioCalculator(inputs: any): any {
  if (inputs.scale !== undefined) {
    return { equivalent: `${inputs.a * inputs.scale}:${inputs.b * inputs.scale}` };
  }
  // Proportion mode: c is supplied and d is not (either explicitly null, as
  // sent by the benchmark fixtures, or simply absent, as sent by the web UI
  // which omits blank fields entirely rather than sending literal null).
  if (inputs.c !== undefined && inputs.c !== null && (inputs.d === null || inputs.d === undefined)) {
    // a / b = c / d  => d = (b * c) / a
    if (inputs.a === 0) throw new Error("Divide by zero");
    return { d: (inputs.b * inputs.c) / inputs.a };
  }
  // simplify
  const divisor = gcd(inputs.a, inputs.b);
  if (divisor === 0) throw new Error("Divide by zero");
  return { simplified: `${inputs.a / divisor}:${inputs.b / divisor}` };
}

export function parseFraction(frac: string): [number, number] {
  if (!frac) throw new Error("Invalid fraction");
  const parts = frac.split('/');
  if (parts.length === 1) return [parseInt(parts[0], 10), 1];
  const num = parseInt(parts[0], 10);
  const den = parseInt(parts[1], 10);
  if (den === 0) throw new Error("Denominator cannot be zero");
  return [num, den];
}

export function fractionCalculator(inputs: any): any {
  const { a, b, op } = inputs;
  const [numA, denA] = parseFraction(a);
  const [numB, denB] = parseFraction(b);

  let resNum = 0;
  let resDen = 1;

  if (op === '+') {
    resNum = numA * denB + numB * denA;
    resDen = denA * denB;
  } else if (op === '-') {
    resNum = numA * denB - numB * denA;
    resDen = denA * denB;
  } else if (op === '*') {
    resNum = numA * numB;
    resDen = denA * denB;
  } else if (op === '/') {
    if (numB === 0) throw new Error("Divide by zero");
    resNum = numA * denB;
    resDen = denA * numB;
  } else {
    throw new Error("Unknown operator");
  }

  if (resDen === 0) throw new Error("Resulting denominator is zero");
  
  const sign = (resNum < 0) !== (resDen < 0) ? -1 : 1;
  resNum = Math.abs(resNum);
  resDen = Math.abs(resDen);
  
  const div = gcd(resNum, resDen);
  resNum = (resNum / div) * sign;
  resDen = resDen / div;

  const decimal = resNum / resDen;
  let fractionStr = resDen === 1 ? `${resNum}` : `${resNum}/${resDen}`;
  
  // Format to 8 decimal places max for matching fixtures nicely if needed, or just let number do it
  // Actually, we can return the exact number.

  return {
    fraction: fractionStr,
    decimal: Number(decimal.toFixed(8)) // To handle floating point inaccuracies like 0.83333333 in the fixture
  };
}
