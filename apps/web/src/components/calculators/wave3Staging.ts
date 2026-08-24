import { wave3Mappings, wave3ResultConfig } from "./wave3FieldMappings.js";

/**
 * WAVE 3 STAGING AND FEATURE GATE
 * -------------------------------
 * All Wave 3 calculators are staged in this module for isolated development and testing.
 * They are deliberately NOT exported to public routing, production sitemaps, or the live calculator list
 * until Wave 2 integration is complete and Wave 3 release approval is granted.
 */

export const WAVE3_ENABLED = false;

export const stagedWave3Calculators = [
  "PRO-008",
  "PRO-028",
  "INV-025",
  "INV-026",
  "INV-027",
  "INV-029",
  "ISA-007",
  "TAX-013",
  "TAX-019",
  "PEN-011"
] as const;

export type StagedWave3CalculatorId = typeof stagedWave3Calculators[number];

export function getStagedWave3FieldDefs(id: string) {
  return wave3Mappings[id] ?? null;
}

export function getStagedWave3PrimaryResultKey(id: string) {
  return wave3ResultConfig[id] ?? null;
}

export function isWave3Staged(id: string): boolean {
  return (stagedWave3Calculators as readonly string[]).includes(id);
}
