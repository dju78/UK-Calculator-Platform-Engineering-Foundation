/**
 * The Phase 2 priority set, taken from docs/CALCULATOR_CONTENT_BACKFILL_PLAN.md.
 *
 * The calculator id is treated as the authoritative identity, because that is
 * what the registry, the engine and the routes all key on. Several of the
 * plan's descriptive labels do not match the calculator sitting at the id it
 * names; those are corrected here and recorded in `planLabelCorrections`
 * rather than fixed silently. Exactly one plan entry names an id that does not
 * exist anywhere in the 253-calculator registry, and that substitution is
 * recorded separately in `planSubstitutions`.
 */

export interface Top40Group {
  /** Batch number in the Phase 2 rollout. */
  batch: 1 | 2 | 3 | 4 | 5;
  name: string;
  calculatorIds: string[];
}

export const TOP_40_GROUPS: Top40Group[] = [
  {
    batch: 1,
    name: "UK Tax & Salary",
    calculatorIds: [
      "TAX-001",
      "TAX-002",
      "TAX-003",
      "TAX-004",
      "TAX-005",
      "TAX-011",
      "TAX-013",
      "TAX-015",
      "TAX-019",
      "TAX-020",
    ],
  },
  {
    batch: 2,
    name: "Mortgages & Property",
    calculatorIds: [
      "PRO-001",
      "PRO-002",
      "PRO-003",
      "PRO-004",
      "PRO-008",
      "PRO-010",
      "PRO-018",
      "PRO-023",
      "PRO-026",
      "PRO-028",
    ],
  },
  {
    batch: 3,
    name: "Pensions & Retirement",
    calculatorIds: [
      "PEN-001",
      "PEN-002",
      "PEN-003",
      "PEN-006",
      "PEN-007",
      "PEN-009",
      "PEN-011",
      "PEN-012",
    ],
  },
  {
    batch: 4,
    name: "Investing, Wealth & ISA",
    calculatorIds: [
      "ISA-001",
      "ISA-002",
      "ISA-007",
      "INV-001",
      "INV-002",
      "INV-026",
      "INV-029",
    ],
  },
  {
    batch: 5,
    name: "Health, Finance & Automotive",
    calculatorIds: ["HLT-001", "HLT-002", "HLT-020", "FIN-009", "AUT-006"],
  },
];

/** Flat list of all forty target calculator ids. */
export const TOP_40_IDS: string[] = TOP_40_GROUPS.flatMap((g) => g.calculatorIds);

/**
 * A plan entry whose id does not exist in the registry at all, and what was
 * used instead. Never applied silently.
 */
export interface PlanSubstitution {
  planId: string;
  planLabel: string;
  actualId: string;
  actualName: string;
  reason: string;
}

export const planSubstitutions: PlanSubstitution[] = [
  {
    planId: "TAX-021",
    planLabel: "Dividend Tax Calculator",
    actualId: "TAX-011",
    actualName: "Dividend Tax Calculator",
    reason:
      "There is no TAX-021 in the 253-calculator registry. The Dividend Tax Calculator the plan describes is TAX-011, and the plan's quoted rates (8.75% / 33.75%) are also stale: GOV.UK publishes 10.75% / 35.75% / 39.35% for 2026/27.",
  },
];

/**
 * Plan entries where the id exists but the plan's label names a different
 * calculator. The id was treated as authoritative and the guide was written
 * for the calculator that actually sits there.
 */
export interface PlanLabelCorrection {
  calculatorId: string;
  planLabel: string;
  actualName: string;
  note: string;
}

export const planLabelCorrections: PlanLabelCorrection[] = [
  {
    calculatorId: "TAX-005",
    planLabel: "Scottish Income Tax Calculator",
    actualName: "Salary Sacrifice Calculator",
    note:
      "No standalone Scottish Income Tax calculator exists in the registry. Scottish bands are covered inside the TAX-001 guide, which is where a reader actually encounters them.",
  },
  {
    calculatorId: "PEN-006",
    planLabel: "Retirement Income Calculator",
    actualName: "Retirement Calculator",
    note: "PEN-006 models accumulation towards a retirement pot. PEN-007 is the Retirement Income Calculator.",
  },
  {
    calculatorId: "PEN-007",
    planLabel: "Pension Drawdown Calculator",
    actualName: "Retirement Income Calculator",
    note: "PEN-007 models income drawn in retirement; it is named Retirement Income Calculator in the registry.",
  },
  {
    calculatorId: "PEN-009",
    planLabel: "25% Tax-Free Lump Sum (PCLS) Calculator",
    actualName: "Annuity Calculator",
    note: "PEN-009 is the Annuity Calculator. No standalone PCLS calculator exists in the registry.",
  },
  {
    calculatorId: "PEN-012",
    planLabel: "State Pension Age & Forecast Calculator",
    actualName: "Retirement Target Calculator",
    note: "PEN-012 works out the pot needed to hit a retirement income target. No State Pension forecast calculator exists in the registry.",
  },
  {
    calculatorId: "ISA-002",
    planLabel: "Lifetime ISA (LISA) Calculator",
    actualName: "ISA Allowance Calculator",
    note: "ISA-002 tracks use of the overall ISA subscription limit, including the Lifetime ISA sub-limit.",
  },
  {
    calculatorId: "HLT-002",
    planLabel: "Calorie & TDEE Calculator",
    actualName: "BMR Calculator",
    note: "HLT-002 calculates Basal Metabolic Rate, which is the input to a TDEE figure rather than the TDEE itself.",
  },
];
