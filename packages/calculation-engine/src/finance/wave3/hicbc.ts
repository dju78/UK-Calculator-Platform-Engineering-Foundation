export interface HicbcInputs {
  gross_salary: number;
  other_taxable_income?: number;
  pension_contributions_gross?: number;
  gift_aid_net?: number;
  children_count: number;
}

export interface HicbcResult {
  total_child_benefit_received: number;
  adjusted_net_income: number;
  charge_percentage: number;
  hicbc_tax_charge: number;
  net_benefit_retained: number;
  pension_top_up_needed_to_eliminate_charge: number;
  effective_marginal_tax_rate_note: string;
}

export function calculateHicbc(inputs: HicbcInputs): HicbcResult {
  const salary = Math.max(0, Number(inputs.gross_salary));
  const otherIncome = Math.max(0, Number(inputs.other_taxable_income ?? 0));
  const pensionGross = Math.max(0, Number(inputs.pension_contributions_gross ?? 0));
  const giftAidNet = Math.max(0, Number(inputs.gift_aid_net ?? 0));
  const children = Math.max(1, Math.round(Number(inputs.children_count)));

  // 2026/27 Child Benefit rates, confirmed against GOV.UK on 25 August 2026:
  // £27.05/wk for the eldest or only child, £17.90/wk for each additional
  // child. These were previously £25.60 and £16.95, which are the preceding
  // year's rates, so both the benefit received and the resulting charge were
  // understated.
  const CHILD_BENEFIT_ELDEST_WEEKLY = 27.05;
  const CHILD_BENEFIT_ADDITIONAL_WEEKLY = 17.90;
  const weeklyBenefit =
    CHILD_BENEFIT_ELDEST_WEEKLY +
    Math.max(0, children - 1) * CHILD_BENEFIT_ADDITIONAL_WEEKLY;
  const annualBenefit = Math.round(weeklyBenefit * 52 * 100) / 100;

  // Gross Gift Aid
  const grossGiftAid = giftAidNet * (100 / 80);

  // Adjusted Net Income (ANI)
  const ani = salary + otherIncome - pensionGross - grossGiftAid;

  // Reformed HICBC rules (Thresholds: £60,000 to £80,000)
  let chargePct = 0;
  if (ani <= 60000) {
    chargePct = 0;
  } else if (ani >= 80000) {
    chargePct = 100;
  } else {
    // 1% per £200 excess above £60,000 (with integer steps)
    const excess = ani - 60000;
    chargePct = Math.floor(excess / 200) * 1.0;
  }

  const taxCharge = Math.round(annualBenefit * (chargePct / 100) * 100) / 100;
  const netRetained = Math.round((annualBenefit - taxCharge) * 100) / 100;
  const pensionTopUpNeeded = Math.max(0, ani - 60000);

  const note = chargePct > 0 && chargePct < 100
    ? "Every £100 earned between £60,000 and £80,000 creates a 40% income tax charge plus a 0.5% Child Benefit clawback per £100."
    : chargePct === 100
    ? "Adjusted Net Income is at or above £80,000. 100% of Child Benefit received is clawed back via HICBC."
    : "Adjusted Net Income is £60,000 or below. No High Income Child Benefit Charge is due.";

  return {
    total_child_benefit_received: annualBenefit,
    adjusted_net_income: Math.round(ani * 100) / 100,
    charge_percentage: Math.round(chargePct * 100) / 100,
    hicbc_tax_charge: taxCharge,
    net_benefit_retained: netRetained,
    pension_top_up_needed_to_eliminate_charge: Math.round(pensionTopUpNeeded * 100) / 100,
    effective_marginal_tax_rate_note: note
  };
}
