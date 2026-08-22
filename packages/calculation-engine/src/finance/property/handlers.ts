import { CalculatorHandler } from "../../types.js";
import { 
  calculateLtv,
  calculatePropertyDeposit,
  calculateRentalYield,
  calculateBuyToLet,
  calculatePropertyRoi
} from "./core.js";

export const handleLoanToValue: CalculatorHandler = (inputs, context) => {
  const value = inputs.value as number;
  const loan = inputs.loan as number;

  const result = calculateLtv(value, loan);

  return {
    outputs: result
  };
};

export const handlePropertyDeposit: CalculatorHandler = (inputs, context) => {
  const price = inputs.price as number;
  
  let result;
  if (inputs.target_ltv !== undefined) {
    result = calculatePropertyDeposit("target", price, inputs.target_ltv as number);
  } else {
    result = calculatePropertyDeposit("mortgage", price, inputs.mortgage as number);
  }

  return {
    outputs: result
  };
};

export const handleRentalYield: CalculatorHandler = (inputs, context) => {
  const price = inputs.price as number;
  const monthly_rent = inputs.monthly_rent as number;
  const vacancy = inputs.vacancy as number;
  const annual_costs = inputs.annual_costs as number;
  const extra_basis = (inputs.extra_basis as number) || 0;

  const result = calculateRentalYield(price, monthly_rent, vacancy, annual_costs, extra_basis);

  return {
    outputs: result
  };
};

export const handleBuyToLet: CalculatorHandler = (inputs, context) => {
  const price = inputs.price as number;
  const deposit = inputs.deposit as number;
  const rate = inputs.rate as number;
  const term = inputs.term as number;
  const rent = inputs.rent as number;
  const vacancy = inputs.vacancy as number;
  const costs = inputs.costs as number;
  const repayment = inputs.repayment as boolean;
  // Intentionally omitting sdlt

  const result = calculateBuyToLet(price, deposit, rate, term, rent, vacancy, costs, repayment);

  return {
    outputs: result
  };
};

export const handlePropertyRoi: CalculatorHandler = (inputs, context) => {
  const price = inputs.price as number;
  const deposit = inputs.deposit as number;
  const rate = inputs.rate as number;
  const term = inputs.term as number;
  const rent = inputs.rent as number;
  const vacancy = inputs.vacancy as number;
  const costs = inputs.costs as number;
  const growth = inputs.growth as number;
  const holding_years = inputs.holding_years as number;

  const result = calculatePropertyRoi(
    price,
    deposit,
    rate,
    term,
    rent,
    vacancy,
    costs,
    growth,
    holding_years
  );

  return {
    outputs: result
  };
};
