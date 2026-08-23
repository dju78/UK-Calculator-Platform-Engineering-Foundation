import { CalculatorHandler } from "../../types.js";
import {
  calculateLtv,
  calculatePropertyDeposit,
  calculateRentalYield,
  calculateBuyToLet,
  calculatePropertyRoi,
  calculateMortgageAffordability
} from "./core.js";
import { calculateSDLT } from "../tax/core.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

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
  const additionalProperty = inputs.additional_property !== false;

  const result = calculateBuyToLet(price, deposit, rate, term, rent, vacancy, costs, repayment);

  // `additional_property` was previously accepted and then ignored, which left
  // the purchase-cost side of a buy-to-let appraisal missing entirely. A BTL
  // purchase almost always attracts the additional-property surcharge, so the
  // estimated tax and the cash actually needed are material to the decision.
  const rules = resolveRules({ taxYear: context.taxYear || "2026/27" });
  const sdlt = calculateSDLT(price, false, additionalProperty, false, rules);
  const cashRequired = deposit + sdlt;

  const grossYield = price === 0 ? null : (rent * 12) / price;
  const netYield = price === 0 ? null : result.net_operating_income / price;

  return {
    outputs: {
      ...result,
      estimated_sdlt: round2(sdlt),
      cash_required: round2(cashRequired),
      gross_yield: grossYield,
      net_yield: netYield,
      icr_basis:
        "Interest Cover Ratio here is rental income after voids and operating costs, divided by mortgage interest. Lenders usually quote ICR on gross rent before costs, so their figure will be higher.",
      sdlt_basis:
        "Estimated Stamp Duty Land Tax for England and Northern Ireland, including the additional-property surcharge. Scotland charges LBTT and Wales charges LTT instead; this figure does not apply there."
    }
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

export const handleMortgageAffordability: CalculatorHandler = (inputs, context) => {
  const result = calculateMortgageAffordability(
    inputs.income as number,
    inputs.deposit as number,
    inputs.stress_rate as number,
    inputs.term as number,
    inputs.multiple as number,
    inputs.payment_ratio as number,
    (inputs.monthly_debt as number) || 0
  );

  return {
    outputs: result
  };
};
