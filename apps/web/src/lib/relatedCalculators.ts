import { liveCalculators } from "@/lib/calculators";
import { getCategoryDetails } from "@/lib/site";

export const CURATED_RELATED: Record<string, string[]> = {
  // 1. Employment, Salary & Deductions User Journey
  "TAX-003": ["TAX-001", "TAX-004", "PEN-001", "TAX-020", "TAX-002"],
  "TAX-001": ["TAX-003", "TAX-004", "PEN-001", "TAX-020", "TAX-019"],
  "TAX-004": ["TAX-003", "TAX-001", "TAX-002", "BUS-001"],
  "TAX-020": ["TAX-003", "TAX-001", "TAX-004", "FIN-001"],
  "TAX-019": ["TAX-001", "TAX-003", "PEN-001", "ISA-001"],
  "TAX-002": ["TAX-003", "TAX-001", "TAX-004", "PEN-001"],

  // 2. Home Buying & Mortgages User Journey
  "PRO-001": ["PRO-004", "PRO-023", "PRO-010", "PRO-002", "PRO-003"],
  "PRO-004": ["PRO-001", "PRO-003", "PRO-010", "FIN-001"],
  "PRO-023": ["PRO-001", "PRO-010", "PRO-002", "PRO-026", "PRO-028"],
  "PRO-010": ["PRO-001", "PRO-002", "PRO-023", "PRO-011"],
  "PRO-002": ["PRO-001", "PRO-010", "PRO-023", "TAX-003"],
  "PRO-003": ["PRO-001", "PRO-004", "PRO-010", "FIN-001"],
  "PRO-008": ["PRO-001", "PRO-002", "PRO-004", "FIN-001"],

  // 3. Property Investment & Landlords User Journey
  "PRO-018": ["PRO-016", "PRO-019", "PRO-028", "PRO-023"],
  "PRO-016": ["PRO-018", "PRO-019", "PRO-001", "BUS-001"],
  "PRO-019": ["PRO-016", "PRO-018", "PRO-028", "INV-001"],
  "PRO-028": ["PRO-023", "TAX-013", "PRO-018", "TAX-001"],

  // 4. Retirement, Decumulation & FIRE User Journey
  "PEN-001": ["PEN-002", "PEN-007", "ISA-007", "INV-002"],
  "PEN-011": ["INV-025", "INV-026", "INV-029", "PEN-001"],
  "INV-025": ["INV-026", "INV-029", "PEN-011", "PEN-001"],
  "INV-026": ["INV-025", "INV-029", "PEN-011", "INV-001"],
  "INV-029": ["INV-025", "INV-026", "PEN-011", "INV-002"],
  "ISA-007": ["ISA-001", "PEN-001", "TAX-001", "INV-002"],
  "ISA-001": ["ISA-002", "ISA-007", "INV-001", "INV-002"],
  "INV-001": ["INV-002", "ISA-001", "PEN-001", "INV-025"],
  "INV-002": ["INV-001", "ISA-001", "PEN-001", "FIN-001"],

  // 5. Self-Employment & Enterprise User Journey
  "BUS-001": ["BUS-003", "BUS-006", "TAX-001", "TAX-015"],
  "BUS-003": ["BUS-006", "BUS-001", "FIN-001", "TAX-015"],
  "BUS-006": ["BUS-003", "BUS-001", "FIN-001", "INV-001"],
  "TAX-015": ["TAX-001", "BUS-001", "TAX-013", "ISA-001"],
  "TAX-013": ["TAX-001", "TAX-015", "PRO-028", "ISA-001"],

  // 6. Consumer Debt & Loans User Journey
  "FIN-001": ["FIN-002", "FIN-003", "PRO-001", "AUT-001"],
  "FIN-002": ["FIN-001", "FIN-006", "FIN-009", "FIN-011"],
  "FIN-009": ["FIN-011", "FIN-001", "FIN-002", "FIN-013"],
  "FIN-011": ["FIN-009", "FIN-001", "FIN-002", "FIN-013"],

  // 7. Automotive & Journey Expenses User Journey
  "AUT-001": ["AUT-002", "AUT-003", "CON-001", "FIN-001"],
  "AUT-006": ["AUT-007", "AUT-008", "CON-007", "CON-008"],
  "AUT-007": ["AUT-006", "AUT-008", "AUT-001", "CON-008"],

  // 8. Health, Nutrition & Clinical Metrics User Journey
  "HLT-001": ["HLT-002", "HLT-003", "HLT-004", "CON-003"],
  "HLT-002": ["HLT-001", "HLT-003", "HLT-004", "HLT-006"],
  "HLT-003": ["HLT-002", "HLT-001", "HLT-004", "HLT-006"],
  "HLT-020": ["HLT-019", "HLT-022", "HLT-023", "DAT-001"],
};

function findLiveCalculator(idOrSlug: string) {
  return (liveCalculators as any[]).find((c: any) => c.id === idOrSlug || c.slug === idOrSlug);
}

/**
 * Validate that all configured CURATED_RELATED sources and targets resolve to live calculators.
 */
export function validateCuratedRelationships(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [sourceKey, targets] of Object.entries(CURATED_RELATED)) {
    const sourceCalc = findLiveCalculator(sourceKey);
    if (!sourceCalc) {
      errors.push(`CURATED_RELATED source "${sourceKey}" does not match any live calculator`);
    }
    for (const targetKey of targets) {
      const targetCalc = findLiveCalculator(targetKey);
      if (!targetCalc) {
        errors.push(`CURATED_RELATED target "${targetKey}" (from source "${sourceKey}") does not match any live calculator`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function getRelatedCalculators(
  currentCalc: {
    id: string;
    slug: string;
    category: string;
    subcategory?: string;
  },
  limit: number = 4
) {
  const curatedKeys = [
    ...(CURATED_RELATED[currentCalc.id] || []),
    ...(CURATED_RELATED[currentCalc.slug] || [])
  ];

  const curatedCalcs: typeof liveCalculators = [];
  for (const key of curatedKeys) {
    const found = findLiveCalculator(key);
    if (found && found.id !== currentCalc.id && !curatedCalcs.some((c: any) => c.id === found.id)) {
      curatedCalcs.push(found);
    }
  }

  if (curatedCalcs.length >= limit) {
    return curatedCalcs.slice(0, limit);
  }

  const results = [...curatedCalcs];
  const seenIds = new Set([currentCalc.id, ...curatedCalcs.map((c: any) => c.id)]);

  // 1. Same Subcategory
  if (currentCalc.subcategory) {
    for (const calc of liveCalculators) {
      if (results.length >= limit) break;
      if (!seenIds.has(calc.id) && calc.subcategory === currentCalc.subcategory) {
        results.push(calc);
        seenIds.add(calc.id);
      }
    }
  }

  // 2. Same Category
  for (const calc of liveCalculators) {
    if (results.length >= limit) break;
    if (!seenIds.has(calc.id) && calc.category === currentCalc.category) {
      results.push(calc);
      seenIds.add(calc.id);
    }
  }

  // 3. Related Categories
  if (results.length < limit) {
    const details = getCategoryDetails(currentCalc.category);
    for (const relCat of details.relatedCategories) {
      if (results.length >= limit) break;
      for (const calc of liveCalculators) {
        if (results.length < limit && !seenIds.has(calc.id) && calc.category === relCat) {
          results.push(calc);
          seenIds.add(calc.id);
        }
      }
    }
  }

  return results;
}
