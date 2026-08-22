import { calculatePmt } from "../loan/core.js";

export function calculateLtv(value: number, loan: number) {
  if (value === 0) {
    return { ltv: 0, equity: 0 }; // Handle zero division
  }
  return {
    ltv: loan / value,
    equity: value - loan
  };
}

export function calculatePropertyDeposit(mode: "target" | "mortgage", price: number, target_ltv_or_mortgage: number) {
  if (mode === "target") {
    const mortgage = price * target_ltv_or_mortgage;
    return {
      mortgage,
      deposit: price - mortgage
    };
  } else {
    // mortgage mode
    const mortgage = target_ltv_or_mortgage;
    const ltv = price === 0 ? 0 : mortgage / price;
    return {
      ltv,
      deposit: price - mortgage
    };
  }
}

export function calculateRentalYield(price: number, monthly_rent: number, vacancy: number, annual_costs: number, extra_basis: number = 0) {
  const gross_rent = monthly_rent * 12;
  const net_operating_income = gross_rent * (1 - vacancy) - annual_costs;
  const gross_yield = price === 0 ? 0 : gross_rent / price;
  const total_basis = price + extra_basis;
  const net_yield = total_basis === 0 ? 0 : net_operating_income / total_basis;
  
  return {
    gross_yield,
    net_yield,
    net_operating_income
  };
}

export function calculateBuyToLet(
  price: number,
  deposit: number,
  rate: number,
  term: number,
  rent: number,
  vacancy: number,
  costs: number,
  repayment: boolean
) {
  const mortgage = price - deposit;
  const effective_rent = rent * 12 * (1 - vacancy);
  const interest_annual = mortgage * rate; // interest only annual cost
  
  const monthly_payment = calculatePmt(mortgage, rate, term, repayment ? "repayment" : "interest-only");
  const annual_mortgage = monthly_payment * 12;
  
  const pre_tax_cashflow = effective_rent - costs - annual_mortgage;
  
  // ICR = NOI / Mortgage Interest
  const noi = effective_rent - costs;
  const icr = interest_annual === 0 ? 0 : noi / interest_annual;
  
  return {
    effective_rent,
    pre_tax_cashflow,
    icr
  };
}

export function calculatePropertyRoi(
  price: number,
  deposit: number,
  rate: number,
  term: number,
  rent: number,
  vacancy: number,
  costs: number,
  growth: number,
  holding_years: number
) {
  const mortgage = price - deposit;
  const future_property_value = price * Math.pow(1 + growth, holding_years);
  
  const monthly_payment = calculatePmt(mortgage, rate, term, "repayment");
  const r = rate / 12;
  const months = holding_years * 12;
  
  let ending_mortgage = 0;
  if (r === 0) {
    ending_mortgage = Math.max(0, mortgage - monthly_payment * months);
  } else {
    // Math logic for remaining balance
    ending_mortgage = mortgage * Math.pow(1 + r, months) - monthly_payment * (Math.pow(1 + r, months) - 1) / r;
    if (ending_mortgage < 0 || holding_years >= term) {
      ending_mortgage = 0;
    }
  }

  const effective_rent = rent * 12 * (1 - vacancy);
  const annual_mortgage = monthly_payment * 12;
  const annual_cashflow = effective_rent - costs - annual_mortgage;
  
  const total_cashflow = annual_cashflow * holding_years;
  const ending_equity = future_property_value - ending_mortgage;
  
  const ending_wealth = ending_equity + total_cashflow;
  const initial_investment = deposit;
  
  const total_return = (ending_wealth - initial_investment) / initial_investment;
  const annualised_return = Math.pow(ending_wealth / initial_investment, 1 / holding_years) - 1;
  
  return {
    ending_wealth,
    total_return,
    annualised_return,
    ending_mortgage,
    future_property_value
  };
}

export function calculateMortgageAffordability(
  income: number,
  deposit: number,
  stress_rate: number,
  term: number,
  multiple: number,
  payment_ratio: number,
  monthly_debt: number
) {
  const monthly_payment_cap = (income / 12) * payment_ratio - monthly_debt;
  
  const max_by_multiple = income * multiple;
  
  let cap_mortgage = 0;
  if (monthly_payment_cap > 0) {
    if (stress_rate === 0) {
      cap_mortgage = monthly_payment_cap * term * 12;
    } else {
      const r = stress_rate / 12;
      const n = term * 12;
      cap_mortgage = monthly_payment_cap * (1 - Math.pow(1 + r, -n)) / r;
    }
  }

  const max_mortgage = Math.max(0, Math.min(max_by_multiple, cap_mortgage));
  const max_price = max_mortgage + deposit;

  return {
    max_mortgage,
    max_price,
    monthly_payment_cap: Math.max(0, monthly_payment_cap)
  };
}
