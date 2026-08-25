import type { NumericInputs, CalculationContext, CalculatorHandler } from "../../types.js";
import { resolveRules } from "../../../../rules-uk/src/index.js";
import {
  employerPensionContribution, normaliseBasis,
  pensionTaxRelief, normaliseReliefArrangement,
  statePensionEntitlement, retirementIncome, pensionDrawdown,
  annuity, retirementTarget
} from "./pension.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

const NOT_ADVICE =
  "A projection on the assumptions you entered. Investment returns are not guaranteed, and this is not pension, investment or financial advice. Pension decisions are difficult to reverse; free impartial guidance is available from MoneyHelper, and Pension Wise offers a free appointment from age 50.";

const NOT_A_FORECAST =
  "An estimate, not a State Pension forecast. Records that began before April 2016 are worked out under transitional rules. Check your own forecast on GOV.UK.";

/** PEN-004 Employer Pension Contribution */
export const pen004Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const basis = normaliseBasis(inputs.contribution_basis);
  const r = employerPensionContribution(
    Number(inputs.annual_salary),
    basis,
    Number(inputs.employer_rate),
    Number(inputs.employee_rate),
    rules
  );
  const ae = rules.workplace_pension_auto_enrolment;
  const warnings: string[] = [];
  if (!r.auto_enrolment_eligible) {
    warnings.push(
      `Earnings are below the automatic enrolment trigger of £${ae.earnings_trigger_annual_gbp.toLocaleString("en-GB")}, so your employer does not have to enrol you. You can usually ask to join, and if you earn above the lower qualifying limit your employer must still contribute.`
    );
  }
  if (!r.meets_total_minimum && r.auto_enrolment_eligible) {
    warnings.push(
      `The combined contribution is £${round2(r.total_shortfall).toLocaleString("en-GB")} below the automatic enrolment minimum for these earnings.`
    );
  }
  return {
    outputs: {
      pensionable_earnings: round2(r.pensionable_earnings),
      employer_contribution: round2(r.employer_contribution),
      employee_contribution: round2(r.employee_contribution),
      total_contribution: round2(r.total_contribution),
      monthly_total_contribution: round2(r.total_contribution / 12),
      employer_minimum_required: round2(r.employer_minimum_required),
      total_minimum_required: round2(r.total_minimum_required),
      meets_employer_minimum: r.meets_employer_minimum,
      meets_total_minimum: r.meets_total_minimum,
      contribution_as_share_of_salary: round8(r.contribution_as_share_of_salary),
      basis:
        basis === "qualifying_earnings"
          ? `Contributions are worked out on qualifying earnings, the band between £${ae.qualifying_earnings_lower_limit_annual_gbp.toLocaleString("en-GB")} and £${ae.qualifying_earnings_upper_limit_annual_gbp.toLocaleString("en-GB")}, not on your whole salary. That is why a headline percentage buys less than it appears to.`
          : "Contributions are worked out on your whole pay under this scheme's definition, which is more generous than the statutory qualifying earnings band. The statutory minimums shown are still measured on qualifying earnings."
    },
    warnings
  };
};

/** PEN-005 Pension Tax Relief */
export const pen005Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const arrangement = normaliseReliefArrangement(inputs.arrangement);
  const r = pensionTaxRelief(
    Number(inputs.gross_income),
    Number(inputs.personal_contribution),
    arrangement,
    Number(inputs.employer_contribution ?? 0),
    Boolean(inputs.flexibly_accessed),
    String(inputs.jurisdiction ?? "England/Wales/NI"),
    rules
  );
  const warnings: string[] = [];
  if (r.earnings_limit_exceeded) {
    warnings.push(
      "Tax relief on your own contributions is limited to your relevant UK earnings, and the gross contribution shown is above your income. Relief would be restricted."
    );
  }
  if (r.excess_over_allowance > 0) {
    warnings.push(
      `Contributions exceed your annual allowance by £${round2(r.excess_over_allowance).toLocaleString("en-GB")}. Unused allowance carried forward from the previous three years may cover this; carry forward is not modelled here.`
    );
  }
  if (r.tapered) {
    warnings.push(
      `Your annual allowance is tapered to £${round2(r.annual_allowance).toLocaleString("en-GB")} because both the threshold income and adjusted income limits are exceeded.`
    );
  }
  return {
    outputs: {
      personal_payment: round2(r.personal_payment),
      basic_rate_relief_added: round2(r.basic_rate_relief_added),
      gross_contribution: round2(r.gross_contribution),
      higher_rate_relief_claimable: round2(r.higher_rate_relief_claimable),
      total_tax_relief: round2(r.total_tax_relief),
      net_cost: round2(r.net_cost),
      relief_rate: round8(r.relief_rate),
      annual_allowance: round2(r.annual_allowance),
      allowance_used: round2(r.allowance_used),
      allowance_remaining: round2(r.allowance_remaining),
      excess_over_allowance: round2(r.excess_over_allowance),
      annual_allowance_charge: round2(r.annual_allowance_charge),
      basis:
        (arrangement === "relief_at_source"
          ? "Under relief at source you pay from money that has already been taxed and your provider reclaims basic rate for you. Any higher or additional rate relief is NOT automatic: you have to claim it, through Self Assessment or by contacting HMRC. A great deal of it goes unclaimed. "
          : arrangement === "net_pay"
            ? "Under a net pay arrangement the contribution comes out of gross pay, so full relief at your highest rate is given immediately and there is nothing to claim. "
            : "Under salary sacrifice your gross pay is reduced, so you save National Insurance as well as Income Tax. That National Insurance saving is not shown as tax relief here; use the Salary Sacrifice calculator to see it. ") +
        NOT_ADVICE
    },
    warnings
  };
};

/** PEN-007 Retirement Income */
export const pen007Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = retirementIncome(
    Number(inputs.pension_pot),
    Boolean(inputs.take_tax_free_lump_sum),
    Number(inputs.drawdown_rate),
    Number(inputs.qualifying_years ?? 0),
    Number(inputs.other_income ?? 0),
    String(inputs.jurisdiction ?? "England/Wales/NI"),
    rules
  );
  const warnings: string[] = [];
  if (r.lump_sum_capped_by_allowance) {
    warnings.push(
      `The tax-free lump sum is capped at the lump sum allowance of £${rules.pension.lump_sum_allowance_gbp.toLocaleString("en-GB")}, so you cannot take a quarter of a pot this size tax free.`
    );
  }
  return {
    outputs: {
      tax_free_lump_sum: round2(r.tax_free_lump_sum),
      pot_after_lump_sum: round2(r.pot_after_lump_sum),
      drawdown_income: round2(r.drawdown_income),
      state_pension_income: round2(r.state_pension_income),
      other_income: round2(r.other_income),
      total_gross_income: round2(r.total_gross_income),
      personal_allowance: round2(r.personal_allowance),
      income_tax: round2(r.income_tax),
      total_net_income: round2(r.total_net_income),
      monthly_net_income: round2(r.monthly_net_income),
      effective_tax_rate: round8(r.effective_tax_rate),
      basis:
        "The tax-free lump sum is not income and is excluded from the taxable total. The State Pension IS taxable even though it is paid without tax deducted, which is what catches people out: the tax is collected through the tax code on other income. " +
        NOT_A_FORECAST + " " + NOT_ADVICE
    },
    warnings
  };
};

/** PEN-008 Pension Drawdown */
export const pen008Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = pensionDrawdown(
    Number(inputs.pension_pot),
    Boolean(inputs.take_tax_free_lump_sum),
    Number(inputs.annual_withdrawal),
    Number(inputs.annual_growth),
    Number(inputs.inflation),
    Number(inputs.projection_years),
    rules
  );
  const warnings: string[] = [];
  if (r.pot_exhausted) {
    warnings.push(
      `On these assumptions the pot runs out after ${r.years_pot_lasts} years. A withdrawal of about £${round2(r.sustainable_annual_withdrawal).toLocaleString("en-GB")} in the first year, rising with inflation, would last the full period.`
    );
  }
  return {
    outputs: {
      tax_free_lump_sum: round2(r.tax_free_lump_sum),
      pot_after_lump_sum: round2(r.pot_after_lump_sum),
      first_year_withdrawal: round2(r.first_year_withdrawal),
      final_year_withdrawal: round2(r.final_year_withdrawal),
      total_withdrawn: round2(r.total_withdrawn),
      years_pot_lasts: r.years_pot_lasts,
      final_pot_value: round2(r.final_pot_value),
      real_value_of_final_withdrawal: round2(r.real_value_of_final_withdrawal),
      sustainable_annual_withdrawal: round2(r.sustainable_annual_withdrawal),
      basis:
        "Withdrawals rise with inflation each year, so the figures keep their buying power rather than quietly losing it. Withdrawals above the tax-free lump sum are taxable as income, which this projection does not deduct. Drawdown leaves you exposed to investment falls and to living longer than the projection. " +
        NOT_ADVICE
    },
    warnings
  };
};

/** PEN-009 Annuity */
export const pen009Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = annuity(
    Number(inputs.pension_pot),
    Boolean(inputs.take_tax_free_lump_sum),
    Number(inputs.annuity_rate),
    Number(inputs.escalation ?? 0),
    Number(inputs.guarantee_period ?? 0),
    Number(inputs.spouse_proportion ?? 0),
    Number(inputs.projection_years),
    rules
  );
  return {
    outputs: {
      tax_free_lump_sum: round2(r.tax_free_lump_sum),
      purchase_amount: round2(r.purchase_amount),
      first_year_income: round2(r.first_year_income),
      monthly_income: round2(r.monthly_income),
      final_year_income: round2(r.final_year_income),
      total_income_over_period: round2(r.total_income_over_period),
      guaranteed_minimum_income: round2(r.guaranteed_minimum_income),
      spouse_annual_income: round2(r.spouse_annual_income),
      years_to_recover_purchase_price: r.years_to_recover_purchase_price,
      basis:
        "The annuity rate is the one quoted to you, not a market figure this calculator knows. Rates depend on your age, health, where you live and the options you choose, and a level annuity that never rises loses buying power every year. An annuity income is taxable. Shopping around, and declaring any health conditions, routinely raises the rate offered. " +
        NOT_ADVICE
    }
  };
};

/** PEN-010 State Pension */
export const pen010Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const current = statePensionEntitlement(Number(inputs.qualifying_years), rules);
  const extra = Number(inputs.additional_years_planned ?? 0);
  const projected = statePensionEntitlement(Number(inputs.qualifying_years) + extra, rules);
  const sp = rules.state_pension;

  const warnings: string[] = [];
  if (!current.meets_minimum) {
    warnings.push(
      `With fewer than ${sp.minimum_qualifying_years} qualifying years there is no new State Pension entitlement at all. This is a threshold, not a sliding scale: reaching ${sp.minimum_qualifying_years} years takes the entitlement from nothing to a real income.`
    );
  }
  return {
    outputs: {
      qualifying_years: current.qualifying_years,
      weekly_amount: round2(current.weekly_amount),
      annual_amount: round2(current.annual_amount),
      proportion_of_full: round8(current.proportion_of_full),
      years_short_of_full: current.years_short_of_full,
      value_of_one_more_year_annual: round2(current.value_of_one_more_year_annual),
      projected_qualifying_years: projected.qualifying_years,
      projected_weekly_amount: round2(projected.weekly_amount),
      projected_annual_amount: round2(projected.annual_amount),
      full_amount_weekly: round2(sp.new_state_pension_weekly_gbp),
      full_amount_annual: round2(sp.new_state_pension_weekly_gbp * sp.weeks_per_year),
      basis:
        `${sp.full_entitlement_qualifying_years} qualifying years are needed for the full new State Pension and at least ${sp.minimum_qualifying_years} for any of it. Entitlement is treated here as proportionate to years, which is right for a record that began after April 2016. ` +
        NOT_A_FORECAST +
        " This calculator does not work out your State Pension age, which depends on your date of birth; check it with the GOV.UK State Pension age tool."
    },
    warnings
  };
};

/** PEN-012 Retirement Target */
export const pen012Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const r = retirementTarget(
    Number(inputs.target_annual_income),
    Number(inputs.current_pot ?? 0),
    Number(inputs.monthly_contribution ?? 0),
    Number(inputs.years_to_retirement),
    Number(inputs.annual_growth),
    Number(inputs.safe_withdrawal_rate),
    Boolean(inputs.include_state_pension),
    Number(inputs.qualifying_years ?? 0),
    rules
  );
  return {
    outputs: {
      target_annual_income: round2(r.target_annual_income),
      state_pension_income: round2(r.state_pension_income),
      income_needed_from_pot: round2(r.income_needed_from_pot),
      target_pot: round2(r.target_pot),
      projected_pot: round2(r.projected_pot),
      shortfall: round2(r.shortfall),
      surplus: round2(r.surplus),
      on_track: r.on_track,
      required_monthly_contribution: round2(r.required_monthly_contribution),
      additional_monthly_contribution_needed: round2(r.additional_monthly_contribution_needed),
      basis:
        "The target pot is the income you need from the pot divided by the withdrawal rate you chose, which assumes that rate is sustainable for as long as you live. The required contribution is solved exactly rather than found by trial and error. Figures are in today's money only if the growth rate you entered is a real rate above inflation. " +
        NOT_ADVICE
    }
  };
};
