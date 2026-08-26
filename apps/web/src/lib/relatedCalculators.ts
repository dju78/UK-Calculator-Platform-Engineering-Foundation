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
  "HLT-020": ["HLT-019", "HLT-022", "HLT-023", "DAT-001"]
};

function findLiveCalculator(idOrSlug: string) {
  return liveCalculators.find((c: any) => c.id === idOrSlug || c.slug === idOrSlug);
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
    if (found && found.id !== currentCalc.id && !curatedCalcs.some((c) => c.id === found.id)) {
      curatedCalcs.push(found);
    }
  }

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
