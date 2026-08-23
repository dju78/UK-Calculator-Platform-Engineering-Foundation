/**
 * Workplace pension arrangements.
 *
 * The four arrangements deliberately do NOT share tax/NI treatment - that
 * difference is the whole point of modelling them:
 *
 *   none            No pension deduction at all.
 *
 *   salary_sacrifice
 *                   The employee gives up contractual salary. Both Income Tax
 *                   AND National Insurance are assessed on the reduced salary,
 *                   which is why sacrifice saves NI where the other
 *                   arrangements do not. Student loan repayments also follow
 *                   the reduced salary because they are assessed on NI-able pay.
 *
 *   net_pay         The contribution is taken from gross pay BEFORE Income Tax,
 *                   so it reduces taxable pay - but NI is still charged on the
 *                   full gross, and student loan repayments still follow the
 *                   full gross.
 *
 *   relief_at_source
 *                   The employee pays out of net (already taxed) pay and the
 *                   pension provider reclaims basic-rate relief from HMRC. Tax
 *                   and NI are assessed on the FULL gross. We model the gross
 *                   contribution, the employee's cash outlay and the provider
 *                   top-up. Higher and additional-rate relief is claimed
 *                   separately from HMRC and is NOT credited to take-home here.
 */

export type PensionArrangement =
  | "none"
  | "salary_sacrifice"
  | "net_pay"
  | "relief_at_source";

export const PENSION_ARRANGEMENTS: PensionArrangement[] = [
  "none",
  "salary_sacrifice",
  "net_pay",
  "relief_at_source"
];

export interface PensionOutcome {
  arrangement: PensionArrangement;
  /** Gross pension contribution going into the pot from the employee side. */
  employeeGrossContribution: number;
  /** Cash actually leaving the employee's pay. */
  employeeCashCost: number;
  /** Basic-rate top-up added by the provider (relief at source only). */
  basicRateReliefTopUp: number;
  /** Employer contribution - never deducted from the employee. */
  employerContribution: number;
  /** Everything landing in the pension pot. */
  totalContribution: number;

  /** Pay figure Income Tax is assessed on. */
  earningsForIncomeTax: number;
  /** Pay figure National Insurance is assessed on. */
  earningsForNationalInsurance: number;
  /** Pay figure student loan repayments are assessed on. */
  earningsForStudentLoan: number;
  /** Contractual gross after any salary sacrifice - the base for net pay. */
  payAfterSacrifice: number;
}

export function normalisePensionArrangement(value: unknown): PensionArrangement {
  const raw = String(value ?? "none").trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (raw) {
    case "":
    case "none":
    case "no_pension":
      return "none";
    case "salary_sacrifice":
    case "sacrifice":
      return "salary_sacrifice";
    case "net_pay":
    case "net_pay_arrangement":
      return "net_pay";
    case "relief_at_source":
    case "ras":
      return "relief_at_source";
    default:
      throw new Error(
        `Unsupported pension arrangement "${String(value)}". Use none, salary sacrifice, net pay or relief at source.`
      );
  }
}

/**
 * Apply a pension arrangement to an annual gross salary.
 *
 * `employeeRate` and `employerRate` are DECIMAL fractions (0.05 for 5%).
 * Converting a human percentage into a fraction happens once, at the UI/engine
 * boundary, and must not be repeated here.
 */
export function applyPensionArrangement(
  annualGross: number,
  arrangement: PensionArrangement,
  employeeRate: number,
  employerRate: number,
  rules: any
): PensionOutcome {
  if (!Number.isFinite(annualGross) || annualGross < 0) {
    throw new Error("Gross salary must be a non-negative number.");
  }
  for (const [label, rate] of [
    ["Pension contribution", employeeRate],
    ["Employer pension contribution", employerRate]
  ] as const) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      throw new Error(`${label} must be between 0% and 100%.`);
    }
  }

  const employerContribution = annualGross * employerRate;
  const base: Omit<PensionOutcome, "arrangement"> = {
    employeeGrossContribution: 0,
    employeeCashCost: 0,
    basicRateReliefTopUp: 0,
    employerContribution,
    totalContribution: employerContribution,
    earningsForIncomeTax: annualGross,
    earningsForNationalInsurance: annualGross,
    earningsForStudentLoan: annualGross,
    payAfterSacrifice: annualGross
  };

  if (arrangement === "none" || employeeRate === 0) {
    return { arrangement, ...base };
  }

  const contribution = annualGross * employeeRate;

  switch (arrangement) {
    case "salary_sacrifice": {
      const reduced = annualGross - contribution;
      return {
        arrangement,
        ...base,
        employeeGrossContribution: contribution,
        employeeCashCost: contribution,
        totalContribution: contribution + employerContribution,
        earningsForIncomeTax: reduced,
        earningsForNationalInsurance: reduced,
        earningsForStudentLoan: reduced,
        payAfterSacrifice: reduced
      };
    }

    case "net_pay": {
      return {
        arrangement,
        ...base,
        employeeGrossContribution: contribution,
        employeeCashCost: contribution,
        totalContribution: contribution + employerContribution,
        // Deducted before Income Tax...
        earningsForIncomeTax: annualGross - contribution,
        // ...but NI and student loan still follow the full gross.
        earningsForNationalInsurance: annualGross,
        earningsForStudentLoan: annualGross,
        payAfterSacrifice: annualGross
      };
    }

    case "relief_at_source": {
      const basicRate = rules?.pension?.relief_at_source_basic_rate;
      if (typeof basicRate !== "number") {
        throw new Error(
          "The active ruleset does not define pension.relief_at_source_basic_rate."
        );
      }
      // The percentage is treated as the GROSS contribution into the pot; the
      // employee pays the net-of-basic-rate share and the provider adds the rest.
      const employeeCash = contribution * (1 - basicRate);
      const topUp = contribution - employeeCash;
      return {
        arrangement,
        ...base,
        employeeGrossContribution: contribution,
        employeeCashCost: employeeCash,
        basicRateReliefTopUp: topUp,
        totalContribution: contribution + employerContribution,
        // Tax and NI are both assessed on the full gross.
        earningsForIncomeTax: annualGross,
        earningsForNationalInsurance: annualGross,
        earningsForStudentLoan: annualGross,
        payAfterSacrifice: annualGross
      };
    }

    default:
      return { arrangement, ...base };
  }
}
