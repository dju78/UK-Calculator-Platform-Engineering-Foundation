import { liveCalculators } from "@/lib/calculators";
import { getCategoryDetails } from "@/lib/site";

/**
 * Phase 2 Editorial Hook:
 * When Phase 2 merges curated relationships, they can be registered here
 * without requiring rewriting the Phase 3 IElevel infrastructure.
 */
export const CURATED_RELATED: Record<string, string[]> = {
  // High-value canonical tie-edges preheated for core UK finance flows
  "TAX-001": ["TAX-002", "TAX-003", "TAX-004", "TAX-005", "ISA-007"],
  "TAX-002": ["TAX-001", "TAX-003", "TAX-004", "PEN-003"],
  "TAX-003": ["TAX-001", "TAX-002", "TAX-004", "TAX-020"],
  "PRO-001": ["PRO-002", "PRO-003", "PRO-004", "PRO-008", "PRO-023"],
  "PRO-023": ["PRO-001", "PRO-026", "PRO-027", "PRO-028"],
  "PEN-001": ["PEN-002", "PEN-003", "PEN-007", "ISA-007"],
  "ISA-001": ["ISA-002", "ISA-007", "INV-001", "INV-002"],
  "INV-029": ["INV-025", "INV-026", "PEN-011", "INV-002"],
  "PEN-011": ["INV-025", "INV-026", "INV-029", "PEN-001"],
  "HLT-020": ["HLT-019", "HLT-021", "HLT-022", "DAT-001"]
};

export function getRelatedCalculators(
  currentCalc: {
    id: string;
    slug: string;
    category: string;
    subcategory?: string;
  },
  limit: number = 4
) {
  const curatedIds = CURATED_RELATED[currentCalc.id] || [];
  const curatedCalcs = curatedIds
    .map((id) => liveCalculators.find((c: any) => c.id === id))
    .filter((c: any): c is NonNullable<typeof c> => Boolean(c));

  if (curatedCalcs.length >= limit) {
    return curatedCalcs.slice(0, limit);
  }

  const results = [...curatedCalcs];
  const seenIds = new Set([currentCalc.id, ...curatedCalcs.map((c) => c.id)]);

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
