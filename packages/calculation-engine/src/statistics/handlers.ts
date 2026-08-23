import { parseDataset } from "./parser.js";
import { mean, median, mode, hasDistinctMode, min, max, range, count, variance, standardDeviation } from "./descriptive.js";
import { confidenceInterval, sampleSizeProportion } from "./inference.js";
import { linearRegression } from "./regression.js";
import type { NumericInputs, CalculatorHandler } from "../types.js";

function round(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

function round8(num: number): number {
  return round(num, 8);
}

export const sta001Handler: CalculatorHandler = (inputs: Record<string, any>) => {
  const data = parseDataset(inputs.values);
  if (data.length === 0) throw new Error("Dataset is invalid or empty");

  return {
    outputs: {
      mean: round8(mean(data)),
      median: round8(median(data)),
      modes: mode(data).map(round8),
      range: round8(range(data)),
      ...(hasDistinctMode(data)
        ? {}
        : {
            mode_note:
              "Every value in this dataset occurs equally often, so the mode does not identify a most common value."
          })
    }
  };
};

export const sta003Handler: CalculatorHandler = (inputs: Record<string, any>) => {
  const data = parseDataset(inputs.values);
  const isSample = inputs.definition !== "population"; // default to sample if not explicit population
  
  if (data.length === 0) throw new Error("Dataset is invalid or empty");

  return {
    outputs: {
      sd: round8(standardDeviation(data, isSample)),
      variance: round8(variance(data, isSample))
    }
  };
};

export const sta006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const m = Number(inputs.mean);
  const sd = Number(inputs.sd);
  const n = Number(inputs.n);
  const confidence = Number(inputs.confidence);

  if (!Number.isFinite(m) || !Number.isFinite(sd) || !Number.isFinite(n) || !Number.isFinite(confidence)) {
    throw new Error("Invalid inputs");
  }

  const { lower, upper, margin } = confidenceInterval(m, sd, n, confidence);

  return {
    outputs: {
      lower: round8(lower),
      upper: round8(upper),
      margin: round8(margin)
    }
  };
};

export const sta008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const confidence = Number(inputs.confidence);
  const margin = Number(inputs.margin);
  const p = inputs.p !== undefined ? Number(inputs.p) : 0.5;
  const population = inputs.population ? Number(inputs.population) : undefined;

  const n = sampleSizeProportion(confidence, margin, p, population);

  return {
    outputs: {
      n
    }
  };
};

export const sta014Handler: CalculatorHandler = (inputs: Record<string, any>) => {
  const x = parseDataset(inputs.x);
  const y = parseDataset(inputs.y);

  if (x.length === 0 || y.length === 0) throw new Error("Dataset is invalid or empty");
  
  const reg = linearRegression(x, y);

  return {
    outputs: {
      slope: round8(reg.slope),
      intercept: round8(reg.intercept),
      r2: round8(reg.r2),
      residual_se: round8(reg.residual_se)
    }
  };
};
