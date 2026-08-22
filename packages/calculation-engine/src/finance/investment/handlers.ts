import {
  investmentGrowth,
  simpleInterest,
  futureValue,
  presentValue,
  calculateROI,
  calculateCAGR
} from "./core.js";
import type { NumericInputs, CalculatorHandler } from "../../types.js";

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

function round8(num: number): number {
  return Math.round(num * 100000000) / 100000000;
}

export const inv001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const start = Number(inputs.start);
  const monthly = Number(inputs.monthly);
  const ret = Number(inputs.return);
  const fee = Number(inputs.fee || 0);
  const years = Number(inputs.years);

  const projected_value = investmentGrowth(start, monthly, ret, fee, years);

  return {
    outputs: {
      projected_value: round2(projected_value)
    }
  };
};

export const inv003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const P = Number(inputs.P);
  const r = Number(inputs.r);
  const t = Number(inputs.t);

  const { interest, fv } = simpleInterest(P, r, t);

  return {
    outputs: {
      interest: round2(interest),
      fv: round2(fv)
    }
  };
};

export const inv006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const pv = Number(inputs.pv);
  const r = Number(inputs.r);
  const n = Number(inputs.n);

  const fv = futureValue(pv, r, n);

  return {
    outputs: {
      fv: round2(fv)
    }
  };
};

export const inv007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const fv = Number(inputs.fv);
  const r = Number(inputs.r);
  const n = Number(inputs.n);

  const pv = presentValue(fv, r, n);

  return {
    outputs: {
      pv: round2(pv)
    }
  };
};

export const inv008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const cost = Number(inputs.cost);
  const end = Number(inputs.end);
  const income = Number(inputs.income || 0);

  const { gain, roi } = calculateROI(cost, end, income);

  return {
    outputs: {
      gain: round2(gain),
      roi: round8(roi)
    }
  };
};

export const inv009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const start = Number(inputs.start);
  const end = Number(inputs.end);
  const years = Number(inputs.years);

  const cagr = calculateCAGR(start, end, years);

  return {
    outputs: {
      cagr: round8(cagr)
    }
  };
};
