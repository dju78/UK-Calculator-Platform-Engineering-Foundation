export interface PropertyCgtInputs {
  disposal_price: number;
  acquisition_price: number;
  buying_costs?: number;
  selling_costs?: number;
  improvement_costs?: number;
  total_ownership_months: number;
  months_as_main_residence?: number;
  taxable_income?: number;
  joint_owners?: number;
  loss_brought_forward?: number;
}

export interface PropertyCgtResult {
  gross_gain: number;
  allowable_costs_total: number;
  prr_relief_amount: number;
  net_gain_before_allowances: number;
  annual_exempt_amount_used: number;
  taxable_gain: number;
  gain_taxed_at_basic_rate: number;
  tax_at_basic_rate: number;
  gain_taxed_at_higher_rate: number;
  tax_at_higher_rate: number;
  total_cgt_due: number;
  effective_cgt_rate_pct: number;
  reporting_deadline_days: number;
}

export function calculatePropertyCgt(inputs: PropertyCgtInputs): PropertyCgtResult {
  const disposalPrice = Number(inputs.disposal_price);
  const acquisitionPrice = Number(inputs.acquisition_price);
  const buyingCosts = Number(inputs.buying_costs ?? 0);
  const sellingCosts = Number(inputs.selling_costs ?? 0);
  const improvementCosts = Number(inputs.improvement_costs ?? 0);
  const totalMonths = Math.max(1, Number(inputs.total_ownership_months));
  const mainResidenceMonths = Math.min(totalMonths, Math.max(0, Number(inputs.months_as_main_residence ?? 0)));
  const taxableIncome = Math.max(0, Number(inputs.taxable_income ?? 0));
  const jointOwners = Math.max(1, Number(inputs.joint_owners ?? 1));
  const lossesBroughtForward = Math.max(0, Number(inputs.loss_brought_forward ?? 0));

  const allowableCostsTotal = buyingCosts + sellingCosts + improvementCosts;
  const grossGain = disposalPrice - acquisitionPrice - allowableCostsTotal;

  if (grossGain <= 0) {
    return {
      gross_gain: Math.round(grossGain * 100) / 100,
      allowable_costs_total: Math.round(allowableCostsTotal * 100) / 100,
      prr_relief_amount: 0,
      net_gain_before_allowances: 0,
      annual_exempt_amount_used: 0,
      taxable_gain: 0,
      gain_taxed_at_basic_rate: 0,
      tax_at_basic_rate: 0,
      gain_taxed_at_higher_rate: 0,
      tax_at_higher_rate: 0,
      total_cgt_due: 0,
      effective_cgt_rate_pct: 0,
      reporting_deadline_days: 60
    };
  }

  // Private Residence Relief
  let prrRelief = 0;
  if (mainResidenceMonths > 0) {
    if (mainResidenceMonths >= totalMonths) {
      prrRelief = grossGain;
    } else {
      const unoccupiedMonths = totalMonths - mainResidenceMonths;
      const deemedFinalPeriod = Math.min(9, unoccupiedMonths);
      const qualifyingMonths = Math.min(totalMonths, mainResidenceMonths + deemedFinalPeriod);
      prrRelief = grossGain * (qualifyingMonths / totalMonths);
    }
  }

  const netGainBeforeAllowances = Math.max(0, grossGain - prrRelief);
  const netAfterLosses = Math.max(0, netGainBeforeAllowances - lossesBroughtForward);

  const totalAea = 3000 * jointOwners;
  const aeaUsed = Math.min(netAfterLosses, totalAea);
  const taxableGain = Math.max(0, netAfterLosses - aeaUsed);

  // Band allocation: UK Basic rate limit is £37,700 taxable income
  const basicRateBandLimit = 37700;
  const availableBasicBandPerOwner = Math.max(0, basicRateBandLimit - taxableIncome);
  const totalAvailableBasicBand = availableBasicBandPerOwner * jointOwners;

  const gainTaxedAtBasic = Math.min(taxableGain, totalAvailableBasicBand);
  const gainTaxedAtHigher = Math.max(0, taxableGain - gainTaxedAtBasic);

  const taxAtBasic = gainTaxedAtBasic * 0.18;
  const taxAtHigher = gainTaxedAtHigher * 0.24;
  const totalCgtDue = taxAtBasic + taxAtHigher;

  const effectiveRate = grossGain > 0 ? (totalCgtDue / grossGain) * 100 : 0;

  return {
    gross_gain: Math.round(grossGain * 100) / 100,
    allowable_costs_total: Math.round(allowableCostsTotal * 100) / 100,
    prr_relief_amount: Math.round(prrRelief * 100) / 100,
    net_gain_before_allowances: Math.round(netGainBeforeAllowances * 100) / 100,
    annual_exempt_amount_used: Math.round(aeaUsed * 100) / 100,
    taxable_gain: Math.round(taxableGain * 100) / 100,
    gain_taxed_at_basic_rate: Math.round(gainTaxedAtBasic * 100) / 100,
    tax_at_basic_rate: Math.round(taxAtBasic * 100) / 100,
    gain_taxed_at_higher_rate: Math.round(gainTaxedAtHigher * 100) / 100,
    tax_at_higher_rate: Math.round(taxAtHigher * 100) / 100,
    total_cgt_due: Math.round(totalCgtDue * 100) / 100,
    effective_cgt_rate_pct: Math.round(effectiveRate * 100) / 100,
    reporting_deadline_days: 60
  };
}
