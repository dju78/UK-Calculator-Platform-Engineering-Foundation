import type { NumericInputs, CalculationContext, CalculatorHandler } from "../../types.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";
import { resolveWorkingPattern, periodicBreakdown } from "../../common/frequency.js";
import { isaVsGia, lifetimeIsa, juniorIsa, cashIsa } from "./isa.js";
import {
  salarySacrifice, hourlyToSalary, salaryToHourly, overtimePay, bonusTax,
  marriageAllowance, dividendTax, capitalGainsTax, inheritanceTax,
  selfEmploymentTax, corporationTax
} from "./tax.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

const NOT_TAX_ADVICE =
  "An estimate on the figures you entered, using published 2026/27 rates. It is not a tax computation, an HMRC liability or tax advice. Your own position may differ.";

const NOT_INVESTMENT_ADVICE =
  "A projection on the assumptions you entered. Investment returns are not guaranteed and past performance does not predict future results. Not investment advice.";

/**
 * The ruleset is a versioned JSON document, so its shape is validated at load
 * time rather than by the compiler. Handlers read it structurally, exactly as
 * the Wave 1 tax handlers do.
 */
function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

// ===========================================================================
// Tranche 2D - ISA and tax wrappers
// ===========================================================================

/** ISA-003 ISA vs General Investment Account */
export const isa003Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = isaVsGia(
    Number(inputs.initial_investment ?? 0),
    Number(inputs.monthly_contribution ?? 0),
    Number(inputs.annual_growth),
    Number(inputs.dividend_yield ?? 0),
    Number(inputs.years),
    Number(inputs.other_income ?? 0),
    rules
  );
  const warnings: string[] = [];
  if (r.annual_subscription_exceeded) {
    warnings.push(
      `The contributions entered exceed the annual ISA subscription limit of £${rules.isa.overall_subscription_limit_gbp.toLocaleString("en-GB")}, so not all of this could actually be sheltered in one tax year.`
    );
  }
  return {
    outputs: {
      final_gross_value: round2(r.final_gross_value),
      total_contributions: round2(r.total_contributions),
      total_dividends: round2(r.total_dividends),
      cost_basis: round2(r.cost_basis),
      capital_gain: round2(r.capital_gain),
      isa_net_proceeds: round2(r.isa_net_proceeds),
      gia_dividend_tax: round2(r.gia_dividend_tax),
      gia_capital_gains_tax: round2(r.gia_capital_gains_tax),
      gia_net_proceeds: round2(r.gia_net_proceeds),
      isa_advantage: round2(r.isa_advantage),
      isa_advantage_percentage: round8(r.isa_advantage_percentage),
      years_dividend_allowance_exceeded: r.years_dividend_allowance_exceeded,
      basis:
        "The portfolio is identical in both wrappers; only the tax differs. Dividend tax on the taxable account is assumed to be paid from other money rather than by selling holdings, because selling to pay it would itself trigger a further capital gain. The whole gain is assumed to be realised in one tax year. " +
        NOT_INVESTMENT_ADVICE
    },
    warnings
  };
};

/** ISA-004 Lifetime ISA */
export const isa004Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const purpose = String(inputs.withdrawal_purpose ?? "first_home");
  const priceRaw = inputs.property_price;
  const price =
    priceRaw === "" || priceRaw === null || priceRaw === undefined ? null : Number(priceRaw);

  const r = lifetimeIsa(
    Number(inputs.current_balance ?? 0),
    Number(inputs.annual_contribution),
    Number(inputs.annual_growth),
    Number(inputs.years),
    purpose,
    price,
    rules
  );

  const warnings: string[] = [];
  if (r.annual_contribution_capped) {
    warnings.push(
      `Contributions have been capped at the Lifetime ISA limit of £${rules.isa.lifetime_isa_subscription_limit_gbp.toLocaleString("en-GB")} a year. Anything above that earns no bonus.`
    );
  }
  if (r.property_price_within_cap === false) {
    warnings.push(
      `A first home costing more than £${rules.isa.lifetime_isa_maximum_property_price_gbp.toLocaleString("en-GB")} does not qualify, so the 25% withdrawal charge has been applied.`
    );
  }

  return {
    outputs: {
      total_contributions: round2(r.total_contributions),
      total_bonus: round2(r.total_bonus),
      final_value: round2(r.final_value),
      investment_growth: round2(r.investment_growth),
      withdrawal_charge: round2(r.withdrawal_charge),
      net_withdrawal: round2(r.net_withdrawal),
      own_money_lost_to_charge: round2(r.own_money_lost_to_charge),
      charge_applies: r.charge_applies,
      basis: r.charge_applies
        ? "The withdrawal charge is 25% of the amount withdrawn, not 25% of the bonus. Because the bonus was 25% of what you paid in, a 25% charge on the larger balance takes back the whole bonus and about 6.25% of your own money as well. " +
          NOT_INVESTMENT_ADVICE
        : "No withdrawal charge applies to a qualifying first home, to withdrawal from age 60, or on terminal illness. " +
          NOT_INVESTMENT_ADVICE
    },
    warnings
  };
};

/** ISA-005 Junior ISA */
export const isa005Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = juniorIsa(
    Number(inputs.current_balance ?? 0),
    Number(inputs.annual_contribution),
    Number(inputs.annual_growth),
    Number(inputs.child_age),
    rules
  );
  const warnings: string[] = [];
  if (r.annual_contribution_capped) {
    warnings.push(
      `Contributions have been capped at the Junior ISA limit of £${rules.isa.junior_isa_subscription_limit_gbp.toLocaleString("en-GB")} a year.`
    );
  }
  return {
    outputs: {
      years_to_maturity: r.years_to_maturity,
      total_contributions: round2(r.total_contributions),
      final_value: round2(r.final_value),
      investment_growth: round2(r.investment_growth),
      monthly_equivalent: round2(r.monthly_equivalent),
      basis:
        `The money in a Junior ISA belongs to the child. They take control at ${rules.isa.junior_isa_maturity_age - 2} and can withdraw the whole balance at ${rules.isa.junior_isa_maturity_age}, whatever it was saved for. Nothing can be withdrawn before then except in tightly limited circumstances. ` +
        NOT_INVESTMENT_ADVICE
    },
    warnings
  };
};

/** ISA-006 Cash ISA */
export const isa006Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = cashIsa(
    Number(inputs.opening_balance ?? 0),
    Number(inputs.monthly_contribution ?? 0),
    Number(inputs.annual_rate),
    Number(inputs.years),
    Number(inputs.other_income ?? 0),
    rules
  );
  return {
    outputs: {
      isa_final_value: round2(r.isa_final_value),
      isa_interest: round2(r.isa_interest),
      taxable_final_value: round2(r.taxable_final_value),
      taxable_gross_interest: round2(r.taxable_gross_interest),
      tax_paid_on_savings: round2(r.tax_paid_on_savings),
      isa_advantage: round2(r.isa_advantage),
      personal_savings_allowance: round2(r.personal_savings_allowance),
      starting_rate_band_available: round2(r.starting_rate_band_available),
      income_tax_band: r.band,
      basis: r.advantage_is_nil
        ? "On these figures the interest stays within your Personal Savings Allowance and starting rate for savings, so an ordinary savings account would be taxed at nothing either. The ISA gives no tax advantage here, and the better account is simply the one paying the higher rate."
        : "The allowances are assumed to be entirely available to this account. If you hold other interest-bearing accounts they use up the same allowances, so the real advantage of the ISA would be larger than shown."
    }
  };
};

// ===========================================================================
// Tranche 2E - UK Tax & Salary
// ===========================================================================

/** TAX-005 Salary Sacrifice */
export const tax005Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = salarySacrifice(
    Number(inputs.gross_salary),
    Number(inputs.sacrifice_percentage),
    Number(inputs.employer_contribution_percentage ?? 0),
    String(inputs.jurisdiction ?? "England"),
    String(inputs.student_plan ?? "None"),
    Boolean(inputs.postgraduate),
    rules
  );
  const pattern = resolveWorkingPattern(inputs as Record<string, unknown>);
  const before = periodicBreakdown(r.take_home_before, pattern);
  const after = periodicBreakdown(r.take_home_after, pattern);

  const warnings: string[] = [];
  if (r.restores_personal_allowance) {
    warnings.push(
      "Sacrificing takes your pay back under the point at which the Personal Allowance starts to be withdrawn, so part of this sacrifice is effectively relieved at 60%."
    );
  }
  warnings.push(
    "A salary sacrifice cannot lawfully reduce your pay below the National Minimum Wage for the hours you work, and it reduces the salary figure used for mortgages, redundancy pay and some benefits."
  );

  return {
    outputs: {
      sacrificed_amount: round2(r.sacrificed_amount),
      post_sacrifice_salary: round2(r.post_sacrifice_salary),
      pension_contribution: round2(r.pension_contribution),
      employer_contribution: round2(r.employer_contribution),
      total_into_pension: round2(r.total_into_pension),
      take_home_before: round2(r.take_home_before),
      take_home_after: round2(r.take_home_after),
      take_home_before_monthly: round2(before.monthly),
      take_home_after_monthly: round2(after.monthly),
      take_home_reduction: round2(r.take_home_reduction),
      take_home_reduction_monthly: round2(r.take_home_reduction / 12),
      income_tax_saved: round2(r.income_tax_saved),
      national_insurance_saved: round2(r.national_insurance_saved),
      student_loan_saved: round2(r.student_loan_saved),
      total_tax_saved: round2(r.total_tax_saved),
      cost_per_pound_in_pension: round8(r.cost_per_pound_in_pension),
      basis:
        "Sacrifice reduces gross pay before Income Tax, National Insurance and student loan are worked out, which is what separates it from a net pay or relief at source arrangement. Employer National Insurance savings are not modelled: whether your employer passes any of that on depends on your scheme, so enter it as an employer contribution if it does. " +
        NOT_TAX_ADVICE
    },
    warnings
  };
};

/** TAX-006 Hourly to Salary */
export const tax006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const pattern = resolveWorkingPattern(inputs as Record<string, unknown>, { requireHours: true });
  const r = hourlyToSalary(Number(inputs.hourly_rate), pattern, Number(inputs.days_per_week ?? 5));
  return {
    outputs: {
      annual_salary: round2(r.annual),
      monthly_salary: round2(r.monthly),
      weekly_pay: round2(r.weekly),
      daily_pay: round2(r.daily),
      hourly_rate: round2(r.hourly),
      annual_hours: round2(r.annual_hours),
      hours_per_week_used: r.hours_per_week,
      paid_weeks_per_year_used: r.paid_weeks_per_year,
      basis:
        "Gross pay before any deductions. It assumes every paid week is worked at the same hours; unpaid leave, sickness and variable rotas will change the annual figure."
    }
  };
};

/** TAX-007 Salary to Hourly */
export const tax007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const pattern = resolveWorkingPattern(inputs as Record<string, unknown>);
  const r = salaryToHourly(Number(inputs.annual_salary), pattern, Number(inputs.days_per_week ?? 5));
  return {
    outputs: {
      hourly_rate: round2(r.hourly),
      daily_pay: round2(r.daily),
      weekly_pay: round2(r.weekly),
      monthly_salary: round2(r.monthly),
      annual_salary: round2(r.annual),
      annual_hours: round2(r.annual_hours),
      hours_per_week_used: r.hours_per_week,
      paid_weeks_per_year_used: r.paid_weeks_per_year,
      basis:
        "Gross pay before any deductions, spread evenly over the hours entered. Salaried work often involves unpaid additional hours, which would lower the true hourly rate."
    }
  };
};

/** TAX-008 Overtime Pay */
export const tax008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = overtimePay(
    Number(inputs.base_hourly_rate),
    Number(inputs.standard_hours),
    Number(inputs.overtime_hours ?? 0),
    Number(inputs.overtime_multiplier ?? 1.5),
    Number(inputs.premium_hours ?? 0),
    Number(inputs.premium_multiplier ?? 2),
    Number(inputs.pay_periods_per_year ?? 52)
  );
  return {
    outputs: {
      base_pay: round2(r.base_pay),
      overtime_pay: round2(r.overtime_pay),
      premium_overtime_pay: round2(r.premium_overtime_pay),
      total_pay: round2(r.total_pay),
      total_hours: round2(r.total_hours),
      blended_hourly_rate: round2(r.blended_hourly_rate),
      overtime_hourly_rate: round2(r.overtime_hourly_rate),
      premium_hourly_rate: round2(r.premium_hourly_rate),
      annualised_total: round2(r.annualised_total),
      overtime_share_of_pay: round8(r.overtime_share_of_pay),
      basis:
        "Gross pay for one pay period, before deductions. There is no legal right to a higher rate for overtime in the UK unless your contract provides one; average pay must still meet the National Minimum Wage across all hours worked."
    }
  };
};

/** TAX-009 Bonus Tax */
export const tax009Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = bonusTax(
    Number(inputs.annual_salary),
    Number(inputs.bonus),
    Number(inputs.pension_from_bonus_percentage ?? 0),
    String(inputs.jurisdiction ?? "England"),
    String(inputs.student_plan ?? "None"),
    Boolean(inputs.postgraduate),
    rules
  );
  const warnings: string[] = [];
  if (r.crosses_personal_allowance_taper) {
    warnings.push(
      `This bonus takes you into the band where the Personal Allowance is withdrawn. £${round2(r.personal_allowance_lost).toLocaleString("en-GB")} of allowance is lost, which is why the effective rate on the bonus is higher than the headline rate.`
    );
  }
  return {
    outputs: {
      bonus: round2(r.bonus),
      pension_from_bonus: round2(r.pension_from_bonus),
      taxable_bonus: round2(r.taxable_bonus),
      income_tax_on_bonus: round2(r.income_tax_on_bonus),
      national_insurance_on_bonus: round2(r.national_insurance_on_bonus),
      student_loan_on_bonus: round2(r.student_loan_on_bonus),
      total_deductions_on_bonus: round2(r.total_deductions_on_bonus),
      net_bonus: round2(r.net_bonus),
      effective_rate_on_bonus: round8(r.effective_rate_on_bonus),
      marginal_rate_band: r.marginal_rate_band,
      personal_allowance_lost: round2(r.personal_allowance_lost),
      basis:
        "A bonus has no tax rate of its own. It is taxed at the rate of the band it lands in on top of your salary, so this is worked out as the difference between your full-year position with and without it. A payslip may deduct more in the bonus month and correct itself later through cumulative PAYE. " +
        NOT_TAX_ADVICE
    },
    warnings
  };
};

/** TAX-010 Marriage Allowance */
export const tax010Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = marriageAllowance(
    Number(inputs.lower_earner_income),
    Number(inputs.higher_earner_income),
    String(inputs.jurisdiction ?? "England"),
    rules
  );
  return {
    outputs: {
      eligible: r.eligible,
      eligibility_note:
        r.ineligibility_reason ??
        "On these incomes the couple qualifies. The claim is made by the lower earner and can be backdated up to four tax years.",
      transferable_allowance: round2(r.transferable_allowance),
      transferor_tax_before: round2(r.transferor_tax_before),
      transferor_tax_after: round2(r.transferor_tax_after),
      recipient_tax_before: round2(r.recipient_tax_before),
      recipient_tax_after: round2(r.recipient_tax_after),
      household_tax_before: round2(r.household_tax_before),
      household_tax_after: round2(r.household_tax_after),
      household_benefit: round2(r.household_benefit),
      maximum_possible_benefit: round2(r.maximum_possible_benefit),
      basis:
        "The lower earner gives up part of their Personal Allowance and the higher earner receives a fixed reduction in their tax bill, not extra allowance. Where the lower earner has some income, transferring can create a small tax bill for them, which is why the household figure is the one that matters. " +
        NOT_TAX_ADVICE
    }
  };
};

/** TAX-011 Dividend Tax */
export const tax011Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const jurisdiction = String(inputs.jurisdiction ?? "England");
  const r = dividendTax(
    Number(inputs.other_income ?? 0),
    Number(inputs.dividend_income),
    jurisdiction,
    rules
  );
  const scottish = jurisdiction.toLowerCase() === "scotland";
  return {
    outputs: {
      personal_allowance: round2(r.personal_allowance),
      personal_allowance_against_dividends: round2(r.personal_allowance_against_dividends),
      dividend_allowance_used: round2(r.dividend_allowance_used),
      dividends_taxed_at_basic: round2(r.dividends_taxed_at_basic),
      dividends_taxed_at_higher: round2(r.dividends_taxed_at_higher),
      dividends_taxed_at_additional: round2(r.dividends_taxed_at_additional),
      dividend_tax: round2(r.dividend_tax),
      tax_on_other_income: round2(r.tax_on_other_income),
      total_income_tax: round2(r.total_income_tax),
      net_dividends: round2(r.net_dividends),
      effective_rate_on_dividends: round8(r.effective_rate_on_dividends),
      basis:
        (scottish
          ? "Dividend taxation is reserved rather than devolved, so your earnings are charged at Scottish rates but your dividends are charged at UK rates using UK band widths. "
          : "") +
        "Dividends are treated as the top slice of your income, so the bands they fall into depend on everything else you earn first. The dividend allowance is a nil rate band, not an exemption: it uses up band space rather than pushing later dividends into a cheaper band. " +
        NOT_TAX_ADVICE
    }
  };
};

/** TAX-012 Capital Gains Tax */
export const tax012Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = capitalGainsTax(
    Number(inputs.disposal_proceeds),
    Number(inputs.acquisition_cost),
    Number(inputs.costs ?? 0),
    Number(inputs.allowable_losses ?? 0),
    Number(inputs.other_taxable_income ?? 0),
    rules
  );
  const warnings: string[] = [];
  if (r.gross_gain < 0) {
    warnings.push(
      "This disposal makes a loss. There is no Capital Gains Tax to pay, and the loss can usually be set against gains in the same year or carried forward once reported to HMRC."
    );
  }
  return {
    outputs: {
      gross_gain: round2(r.gross_gain),
      total_costs: round2(r.total_costs),
      losses_applied: round2(r.losses_applied),
      annual_exempt_amount_used: round2(r.annual_exempt_amount_used),
      taxable_gain: round2(r.taxable_gain),
      gain_taxed_at_basic_rate: round2(r.gain_taxed_at_basic_rate),
      gain_taxed_at_higher_rate: round2(r.gain_taxed_at_higher_rate),
      basic_rate_band_remaining: round2(r.basic_rate_band_remaining),
      capital_gains_tax: round2(r.capital_gains_tax),
      net_proceeds: round2(r.net_proceeds),
      effective_rate_on_gain: round8(r.effective_rate_on_gain),
      unused_losses_carried_forward: round2(r.unused_losses_carried_forward),
      basis:
        "The gain sits on top of your income to decide the rate, and it uses the UK basic rate band even for a Scottish taxpayer, because Capital Gains Tax is reserved. Business Asset Disposal Relief, Investors' Relief, Private Residence Relief and gains inside trusts are outside the scope of this calculator. " +
        NOT_TAX_ADVICE
    },
    warnings
  };
};

/** TAX-014 Inheritance Tax */
export const tax014Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = inheritanceTax(
    Number(inputs.estate_value),
    Number(inputs.property_to_direct_descendants ?? 0),
    Number(inputs.charitable_gifts ?? 0),
    Number(inputs.transferred_nil_rate_band_percentage ?? 0),
    Number(inputs.transferred_residence_nil_rate_band_percentage ?? 0),
    rules
  );
  const warnings: string[] = [];
  if (r.residence_nil_rate_band_tapered_away > 0) {
    warnings.push(
      `The residence nil rate band is withdrawn by £1 for every £2 of estate above £${rules.inheritance_tax.residence_nil_rate_band_taper_threshold_gbp.toLocaleString("en-GB")}. £${round2(r.residence_nil_rate_band_tapered_away).toLocaleString("en-GB")} of it has been lost on this estate.`
    );
  }
  return {
    outputs: {
      gross_estate: round2(r.gross_estate),
      nil_rate_band: round2(r.nil_rate_band),
      transferred_nil_rate_band: round2(r.transferred_nil_rate_band),
      residence_nil_rate_band: round2(r.residence_nil_rate_band),
      total_allowances: round2(r.total_allowances),
      taxable_estate: round2(r.taxable_estate),
      rate_applied: round8(r.rate_applied),
      reduced_charity_rate_applies: r.reduced_charity_rate_applies,
      inheritance_tax: round2(r.inheritance_tax),
      estate_to_beneficiaries: round2(r.estate_to_beneficiaries),
      effective_rate_on_estate: round8(r.effective_rate_on_estate),
      basis:
        "This models the nil rate band, a transferred nil rate band, the residence nil rate band with its taper, and the reduced rate for leaving at least a tenth to charity. It does not model Business Relief, Agricultural Relief, trusts, gifts made in the seven years before death, or gifts with reservation of benefit. An estate with any of those needs professional advice. " +
        NOT_TAX_ADVICE
    },
    warnings
  };
};

/** TAX-016 Self-Employment Tax */
export const tax016Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = selfEmploymentTax(
    Number(inputs.turnover),
    Number(inputs.allowable_expenses ?? 0),
    Number(inputs.capital_allowances ?? 0),
    Number(inputs.other_income ?? 0),
    String(inputs.jurisdiction ?? "England"),
    rules
  );
  return {
    outputs: {
      taxable_profit: round2(r.taxable_profit),
      total_income: round2(r.total_income),
      personal_allowance: round2(r.personal_allowance),
      income_tax: round2(r.income_tax),
      class_2_national_insurance: round2(r.class_2_national_insurance),
      class_4_national_insurance: round2(r.class_4_national_insurance),
      total_national_insurance: round2(r.total_national_insurance),
      total_tax_and_national_insurance: round2(r.total_tax_and_national_insurance),
      net_profit_after_tax: round2(r.net_profit_after_tax),
      effective_rate: round8(r.effective_rate),
      voluntary_class_2_annual_cost: round2(r.voluntary_class_2_annual_cost),
      payment_on_account_each: round2(r.payment_on_account_each),
      first_payment_due: round2(r.first_payment_due),
      basis:
        (r.class_2_treated_as_paid
          ? "Profits reach the small profits threshold, so Class 2 National Insurance is treated as paid and nothing is charged for it. "
          : "Profits are below the small profits threshold, so no Class 2 is due. Paying it voluntarily protects your State Pension record. ") +
        (r.payments_on_account_required
          ? "Because the liability is above the payments on account threshold, the January demand is the balancing payment plus the first payment on account, which is why it is larger than the tax for the year. "
          : "") +
        "Class 1 National Insurance already paid on employment income is not offset against Class 4 here, and losses are not carried between years. " +
        NOT_TAX_ADVICE
    }
  };
};

/** TAX-017 Sole Trader Profit & Tax */
export const tax017Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const turnover = Number(inputs.turnover);
  const expenses = Number(inputs.allowable_expenses ?? 0);
  const capital = Number(inputs.capital_allowances ?? 0);
  const r = selfEmploymentTax(
    turnover, expenses, capital,
    Number(inputs.other_income ?? 0),
    String(inputs.jurisdiction ?? "England"),
    rules
  );
  const vat = rules.vat;
  const warnings: string[] = [];
  const threshold = vat?.registration_threshold_gbp;
  if (typeof threshold === "number" && turnover > threshold) {
    warnings.push(
      `Turnover is above the VAT registration threshold of £${threshold.toLocaleString("en-GB")}. VAT registration is a separate obligation and is not included in these figures.`
    );
  }
  return {
    outputs: {
      turnover: round2(r.turnover),
      allowable_expenses: round2(r.allowable_expenses),
      capital_allowances: round2(r.capital_allowances),
      gross_profit: round2(turnover - expenses),
      taxable_profit: round2(r.taxable_profit),
      profit_margin: turnover > 0 ? round8((turnover - expenses - capital) / turnover) : 0,
      income_tax: round2(r.income_tax),
      class_4_national_insurance: round2(r.class_4_national_insurance),
      total_tax_and_national_insurance: round2(r.total_tax_and_national_insurance),
      net_profit_after_tax: round2(r.net_profit_after_tax),
      monthly_take_home: round2(r.net_profit_after_tax / 12),
      effective_rate: round8(r.effective_rate),
      payment_on_account_each: round2(r.payment_on_account_each),
      first_payment_due: round2(r.first_payment_due),
      basis:
        "Taxable profit is turnover less allowable expenses and capital allowances. Drawings are not an expense: a sole trader is taxed on profit, not on what they take out of the business. " +
        NOT_TAX_ADVICE
    },
    warnings
  };
};

/** TAX-018 Corporation Tax */
export const tax018Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = corporationTax(
    Number(inputs.taxable_profit),
    Number(inputs.associated_companies ?? 0),
    Number(inputs.accounting_period_months ?? 12),
    rules
  );
  return {
    outputs: {
      taxable_profit: round2(r.taxable_profit),
      small_profits_limit_applied: round2(r.small_profits_limit_applied),
      main_rate_limit_applied: round2(r.main_rate_limit_applied),
      rate_band: r.rate_band,
      tax_before_marginal_relief: round2(r.tax_before_marginal_relief),
      marginal_relief: round2(r.marginal_relief),
      corporation_tax: round2(r.corporation_tax),
      effective_rate: round8(r.effective_rate),
      marginal_rate_on_next_pound: round8(r.marginal_rate_on_next_pound),
      profit_after_tax: round2(r.taxable_profit - r.corporation_tax),
      basis:
        "The profit limits are divided by the number of associated companies plus one, and reduced in proportion for an accounting period shorter than twelve months. Inside the marginal band each extra pound of profit is taxed at more than the headline main rate, because relief is being withdrawn at the same time. " +
        NOT_TAX_ADVICE
    }
  };
};
