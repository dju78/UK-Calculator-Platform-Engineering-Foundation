import type { CalculatorHandler } from "../../types.js";
import {
  interestComparison, requiredRate, averageReturn, xirr, paybackPeriod,
  costOfWaiting, contributionGrowth, fixedTermSavings, bondPrice,
  dividendGrowth, dividendReinvestment, fundInvestment
} from "./investment.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

const NOT_ADVICE =
  "An illustration on the assumptions you entered. Investment returns are not guaranteed and past performance does not predict future results. Not investment advice.";

function parseList(value: unknown, label: string): number[] {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(raw)) throw new Error(`${label} must be a list of numbers.`);
  return raw.map(Number);
}

/** INV-004 Interest */
export const inv004Handler: CalculatorHandler = (inputs) => {
  const r = interestComparison(
    Number(inputs.principal), Number(inputs.annual_rate),
    Number(inputs.years), Number(inputs.compounds_per_year ?? 1)
  );
  return {
    outputs: {
      simple_interest: round2(r.simple_interest),
      simple_total: round2(r.simple_total),
      compound_interest: round2(r.compound_interest),
      compound_total: round2(r.compound_total),
      difference: round2(r.difference),
      basis: "Simple interest is charged only on the original sum; compound interest is charged on the balance including interest already added."
    }
  };
};

/** INV-005 Interest Rate */
export const inv005Handler: CalculatorHandler = (inputs) => {
  const rate = requiredRate(
    Number(inputs.present_value), Number(inputs.future_value),
    Number(inputs.years), Number(inputs.compounds_per_year ?? 1)
  );
  return {
    outputs: {
      required_annual_rate: round8(rate),
      basis: "The constant annual rate that turns the present value into the future value over the period entered."
    }
  };
};

/** INV-010 Average Return */
export const inv010Handler: CalculatorHandler = (inputs) => {
  const r = averageReturn(parseList(inputs.returns, "Returns"));
  return {
    outputs: {
      arithmetic_mean: round8(r.arithmetic_mean),
      geometric_mean: round8(r.geometric_mean),
      cumulative_return: round8(r.cumulative_return),
      difference: round8(r.difference),
      years: r.years,
      basis: "The geometric mean is what an investor actually earned. The arithmetic mean is always at least as high, and overstates growth whenever returns vary."
    }
  };
};

/** INV-012 XIRR */
export const inv012Handler: CalculatorHandler = (inputs) => {
  const raw = typeof inputs.cashflows === "string" ? JSON.parse(inputs.cashflows as string) : inputs.cashflows;
  const rate = xirr(raw as Array<{ date: string; amount: number }>);
  if (rate === null) {
    return {
      outputs: {
        validation:
          "No internal rate of return could be found for these cash flows. This happens when the cash flows do not change sign in a way that produces a solution."
      }
    };
  }
  return {
    outputs: {
      xirr: round8(rate),
      basis: "Annualised money-weighted return on irregularly dated cash flows, using an actual/365 day count. Solved by a bracketed root search rather than a plain Newton iteration, so the answer is a genuine sign-change root."
    }
  };
};

/** INV-013 Payback Period */
export const inv013Handler: CalculatorHandler = (inputs) => {
  const r = paybackPeriod(
    Number(inputs.initial_investment),
    parseList(inputs.annual_cashflows, "Annual cash flows"),
    Number(inputs.discount_rate ?? 0)
  );
  return {
    outputs: {
      payback_years: r.payback_years === null ? null : round8(r.payback_years),
      discounted_payback_years: r.discounted_payback_years === null ? null : round8(r.discounted_payback_years),
      total_cash_returned: round2(r.total_cash_returned),
      net_gain: round2(r.net_gain),
      basis: r.payback_years === null
        ? "The cash flows entered never recover the initial investment over the period given."
        : "Payback ignores everything after the outlay is recovered, so it is a liquidity measure rather than a profitability measure."
    }
  };
};

/** INV-016 Cost of Waiting to Invest */
export const inv016Handler: CalculatorHandler = (inputs) => {
  const r = costOfWaiting(
    Number(inputs.monthly_contribution), Number(inputs.annual_return),
    Number(inputs.years_to_goal), Number(inputs.years_delayed),
    Number(inputs.starting_amount ?? 0)
  );
  return {
    outputs: {
      value_if_starting_now: round2(r.value_if_starting_now),
      value_if_delayed: round2(r.value_if_delayed),
      cost_of_waiting: round2(r.cost_of_waiting),
      contributions_if_starting_now: round2(r.contributions_if_starting_now),
      contributions_if_delayed: round2(r.contributions_if_delayed),
      extra_monthly_needed_to_catch_up:
        r.extra_monthly_needed_to_catch_up === null ? null : round2(r.extra_monthly_needed_to_catch_up),
      basis: NOT_ADVICE
    }
  };
};

/** INV-017 Investment Contribution */
export const inv017Handler: CalculatorHandler = (inputs) => {
  const timing = String(inputs.contribution_timing ?? "end") === "start" ? "start" : "end";
  const r = contributionGrowth(
    Number(inputs.starting_amount ?? 0), Number(inputs.monthly_contribution),
    Number(inputs.annual_rate), Number(inputs.years), timing
  );
  return {
    outputs: {
      final_value: round2(r.final_value),
      total_contributions: round2(r.total_contributions),
      growth: round2(r.growth),
      effective_annual_rate: round8(r.effective_annual_rate),
      contribution_timing: timing,
      basis: `Contributions are assumed to be made at the ${timing} of each month. ${NOT_ADVICE}`
    }
  };
};

/** INV-018 Savings */
export const inv018Handler: CalculatorHandler = (inputs) => {
  const r = contributionGrowth(
    Number(inputs.starting_amount ?? 0), Number(inputs.monthly_contribution),
    Number(inputs.annual_rate), Number(inputs.years), "end"
  );
  return {
    outputs: {
      final_value: round2(r.final_value),
      total_contributions: round2(r.total_contributions),
      interest_earned: round2(r.growth),
      effective_annual_rate: round8(r.effective_annual_rate),
      basis: "Contributions are assumed to be made at the end of each month and the rate to stay constant."
    }
  };
};

/** INV-019 Fixed-Term Savings */
export const inv019Handler: CalculatorHandler = (inputs) => {
  const r = fixedTermSavings(
    Number(inputs.principal), Number(inputs.annual_rate),
    Number(inputs.years), Number(inputs.compounds_per_year ?? 1)
  );
  return {
    outputs: {
      final_value: round2(r.final_value),
      interest_earned: round2(r.interest_earned),
      effective_annual_rate: round8(r.effective_annual_rate),
      gross_annual_interest: round2(r.gross_annual_interest),
      basis: "Figures are gross. Interest above your Personal Savings Allowance may be taxable; this calculator does not deduct tax."
    }
  };
};

/** INV-020 Fixed-Rate Bond (savings product) */
export const inv020Handler: CalculatorHandler = (inputs) => {
  const r = fixedTermSavings(
    Number(inputs.principal), Number(inputs.annual_rate),
    Number(inputs.years), Number(inputs.compounds_per_year ?? 1)
  );
  return {
    outputs: {
      final_value: round2(r.final_value),
      interest_earned: round2(r.interest_earned),
      effective_annual_rate: round8(r.effective_annual_rate),
      gross_annual_interest: round2(r.gross_annual_interest),
      basis: "A fixed-rate savings bond held to maturity. Figures are gross of tax, and early withdrawal is usually not permitted or carries a penalty."
    }
  };
};

/** INV-021 Bond (fixed income security) */
export const inv021Handler: CalculatorHandler = (inputs) => {
  const r = bondPrice(
    Number(inputs.face_value), Number(inputs.coupon_rate),
    Number(inputs.yield_rate), Number(inputs.years), Number(inputs.coupons_per_year ?? 2)
  );
  return {
    outputs: {
      price: round2(r.price),
      total_coupons: round2(r.total_coupons),
      current_yield: round8(r.current_yield),
      premium_or_discount: round2(r.premium_or_discount),
      basis: "Clean price on whole coupon periods. Accrued interest between coupon dates, day-count conventions and credit risk are not modelled."
    }
  };
};

/** INV-022 Dividend Growth */
export const inv022Handler: CalculatorHandler = (inputs) => {
  const r = dividendGrowth(
    Number(inputs.investment), Number(inputs.starting_yield),
    Number(inputs.dividend_growth), Number(inputs.years)
  );
  return {
    outputs: {
      first_year_income: round2(r.first_year_income),
      final_year_income: round2(r.final_year_income),
      total_income: round2(r.total_income),
      yield_on_cost: round8(r.yield_on_cost),
      final_yield_on_cost: round8(r.final_yield_on_cost),
      basis: "Assumes the dividend grows at a constant rate and is never cut. Dividends are not guaranteed and can be reduced or stopped. " + NOT_ADVICE
    }
  };
};

/** INV-023 Dividend Reinvestment */
export const inv023Handler: CalculatorHandler = (inputs) => {
  const r = dividendReinvestment(
    Number(inputs.initial_investment), Number(inputs.starting_yield),
    Number(inputs.price_growth), Number(inputs.dividend_growth), Number(inputs.years)
  );
  return {
    outputs: {
      final_value: round2(r.final_value),
      final_value_without_reinvestment: round2(r.final_value_without_reinvestment),
      reinvestment_benefit: round2(r.reinvestment_benefit),
      total_dividends: round2(r.total_dividends),
      final_shares: round8(r.final_shares),
      basis: "Dividends are reinvested at the prevailing share price each year. Dealing charges and tax are not modelled. " + NOT_ADVICE
    }
  };
};

/** INV-024 Fund Investment */
export const inv024Handler: CalculatorHandler = (inputs) => {
  const r = fundInvestment(
    Number(inputs.initial_investment), Number(inputs.monthly_contribution),
    Number(inputs.gross_return), Number(inputs.ongoing_charge),
    Number(inputs.platform_fee ?? 0), Number(inputs.years)
  );
  return {
    outputs: {
      gross_value: round2(r.gross_value),
      net_value: round2(r.net_value),
      total_fees: round2(r.total_fees),
      total_contributions: round2(r.total_contributions),
      fee_drag_percentage: round8(r.fee_drag_percentage),
      net_annualised_return: round8(r.net_annualised_return),
      basis: "Charges are applied monthly to the running balance, which is how ongoing charges actually accrue. " + NOT_ADVICE
    }
  };
};
