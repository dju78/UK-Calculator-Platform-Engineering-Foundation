import type { CalculatorHandler } from "../../types.js";
import {
  amortisingLoanWithFee,
  amortisationSummary,
  creditCardPayoff,
  debtConsolidation,
  debtToIncome,
  emergencyFund,
  savingsGoal,
  type ExistingDebt
} from "./finance.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const NOT_A_QUOTE =
  "An illustration based on the figures you entered. It is not a quote, a credit decision or an offer of finance.";

/** FIN-003 Business Loan */
export const fin003Handler: CalculatorHandler = (inputs) => {
  const r = amortisingLoanWithFee(
    Number(inputs.amount),
    Number(inputs.annual_rate),
    Number(inputs.years),
    Number(inputs.fee ?? 0),
    inputs.fee_financed !== false
  );
  return {
    outputs: {
      monthly_payment: round2(r.monthly_payment),
      total_repayment: round2(r.total_repayment),
      total_interest: round2(r.total_interest),
      fee: round2(r.fee),
      total_cost_of_credit: round2(r.total_cost_of_credit),
      basis: NOT_A_QUOTE
    }
  };
};

/** FIN-004 Secured Loan */
export const fin004Handler: CalculatorHandler = (inputs) => {
  const r = amortisingLoanWithFee(
    Number(inputs.amount),
    Number(inputs.annual_rate),
    Number(inputs.years),
    Number(inputs.fee ?? 0),
    inputs.fee_financed !== false
  );
  const propertyValue = Number(inputs.property_value ?? 0);
  const existingMortgage = Number(inputs.existing_mortgage ?? 0);
  const combinedLtv =
    propertyValue > 0 ? (existingMortgage + Number(inputs.amount)) / propertyValue : null;

  return {
    outputs: {
      monthly_payment: round2(r.monthly_payment),
      total_repayment: round2(r.total_repayment),
      total_interest: round2(r.total_interest),
      fee: round2(r.fee),
      total_cost_of_credit: round2(r.total_cost_of_credit),
      combined_ltv: combinedLtv,
      security_warning:
        "This loan would be secured against your property. Your home may be repossessed if you do not keep up repayments.",
      basis: NOT_A_QUOTE
    }
  };
};

/** FIN-007 Amortisation */
export const fin007Handler: CalculatorHandler = (inputs) => {
  const { summary, schedule } = amortisationSummary(
    Number(inputs.principal),
    Number(inputs.annual_rate),
    Number(inputs.years)
  );
  return {
    outputs: {
      monthly_payment: round2(summary.monthly_payment),
      total_repayment: round2(summary.total_repayment),
      total_interest: round2(summary.total_interest),
      payoff_months: summary.payoff_months,
      first_year_interest: round2(summary.first_year_interest),
      first_year_principal: round2(summary.first_year_principal),
      balance_after_year_one: round2(summary.balance_after_year_one)
    },
    schedule
  };
};

/** FIN-008 Debt-to-Income Ratio */
export const fin008Handler: CalculatorHandler = (inputs) => {
  const housing = inputs.housing_payment === undefined ? undefined : Number(inputs.housing_payment);
  const r = debtToIncome(
    Number(inputs.gross_monthly_income),
    Number(inputs.total_monthly_debt),
    housing
  );
  return {
    outputs: {
      dti_ratio: r.dti_ratio,
      front_end_ratio: r.front_end_ratio,
      total_monthly_debt: round2(r.total_monthly_debt),
      gross_monthly_income: round2(r.gross_monthly_income),
      assessment: r.assessment,
      basis:
        "Calculated on gross (pre-tax) income. Lenders use their own affordability rules and may assess net income, stress-tested rates and committed expenditure differently."
    }
  };
};

/** FIN-010 Credit Card Payoff */
export const fin010Handler: CalculatorHandler = (inputs) => {
  const target = inputs.target_months === undefined ? undefined : Number(inputs.target_months);
  const r = creditCardPayoff(
    Number(inputs.balance),
    Number(inputs.apr),
    Number(inputs.monthly_payment),
    target
  );
  return {
    outputs: {
      months: r.months,
      total_interest: round2(r.total_interest),
      total_repaid: round2(r.total_repaid),
      payment_for_target: r.payment_for_target === null ? null : round2(r.payment_for_target),
      basis:
        "Assumes a fixed payment, a constant APR and no further spending on the card."
    }
  };
};

/** FIN-012 Debt Consolidation */
export const fin012Handler: CalculatorHandler = (inputs) => {
  const raw = inputs.debts;
  const debts: ExistingDebt[] = typeof raw === "string" ? JSON.parse(raw) : (raw as ExistingDebt[]);
  const r = debtConsolidation(
    debts,
    Number(inputs.consolidation_apr),
    Number(inputs.consolidation_years),
    Number(inputs.fee ?? 0)
  );
  return {
    outputs: {
      current_total_balance: round2(r.current_total_balance),
      current_monthly_payment: round2(r.current_monthly_payment),
      current_total_interest: round2(r.current_total_interest),
      current_payoff_months: r.current_payoff_months,
      consolidated_monthly_payment: round2(r.consolidated_monthly_payment),
      consolidated_total_interest: round2(r.consolidated_total_interest),
      consolidated_total_repayment: round2(r.consolidated_total_repayment),
      monthly_payment_change: round2(r.monthly_payment_change),
      total_interest_change: round2(r.total_interest_change),
      basis: r.costs_more_overall
        ? "Consolidating lowers the monthly payment but costs MORE interest overall, because the debt is repaid over a longer period."
        : "Based on the figures entered, consolidating reduces both the monthly payment and the total interest. This is not a credit decision."
    }
  };
};

/** FIN-014 Emergency Fund */
export const fin014Handler: CalculatorHandler = (inputs) => {
  const r = emergencyFund(
    Number(inputs.monthly_essentials),
    Number(inputs.months_of_cover),
    Number(inputs.current_savings ?? 0),
    Number(inputs.monthly_contribution ?? 0)
  );
  return {
    outputs: {
      target_fund: round2(r.target_fund),
      shortfall: round2(r.shortfall),
      months_covered_now: r.months_covered_now,
      months_to_target: r.months_to_target,
      basis:
        "An emergency fund is normally held in accessible cash, so no investment growth is assumed."
    }
  };
};

/** FIN-015 Savings Goal */
export const fin015Handler: CalculatorHandler = (inputs) => {
  const r = savingsGoal(
    Number(inputs.target),
    Number(inputs.months),
    Number(inputs.annual_rate ?? 0),
    Number(inputs.starting_amount ?? 0)
  );
  return {
    outputs: {
      required_monthly_saving: round2(r.required_monthly_saving),
      total_contributions: round2(r.total_contributions),
      interest_earned: round2(r.interest_earned),
      projected_value: round2(r.projected_value),
      basis:
        "Contributions are assumed to be made at the end of each month and the interest rate to stay constant."
    }
  };
};
