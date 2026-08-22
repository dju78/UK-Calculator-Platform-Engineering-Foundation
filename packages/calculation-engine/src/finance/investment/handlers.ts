import {
  investmentGrowth,
  simpleInterest,
  futureValue,
  presentValue,
  calculateROI,
  calculateCAGR,
  calculateIRR,
  calculateFeeDrag,
  calculateRealReturn
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

export const inv011Handler: CalculatorHandler = (inputs: NumericInputs) => {
  // Try to parse array if inputs.cashflows is string or object
  let cashflows: number[] = [];
  if (Array.isArray(inputs.cashflows)) {
    cashflows = inputs.cashflows.map(Number);
  } else if (typeof inputs.cashflows === "string") {
    try {
      cashflows = JSON.parse(inputs.cashflows).map(Number);
    } catch {
      cashflows = [];
    }
  }

  const irr = calculateIRR(cashflows);

  return {
    outputs: {
      irr: round8(irr)
    }
  };
};

export const inv014Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const start = Number(inputs.start);
  const monthly = Number(inputs.monthly || 0);
  const gross_return = Number(inputs.gross_return);
  const fee = Number(inputs.fee);
  const years = Number(inputs.years);

  const { gross_value, net_value, fee_drag } = calculateFeeDrag(start, monthly, gross_return, fee, years);

  return {
    outputs: {
      gross_value: round2(gross_value),
      net_value: round2(net_value),
      fee_drag: round2(fee_drag)
    }
  };
};

export const inv015Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const nominal = Number(inputs.nominal);
  const inflation = Number(inputs.inflation);
  const years = Number(inputs.years);
  const future_amount = Number(inputs.future_amount);

  const { real_return, real_value } = calculateRealReturn(nominal, inflation, years, future_amount);

  return {
    outputs: {
      real_return: round8(real_return),
      real_value: round2(real_value)
    }
  };
};

