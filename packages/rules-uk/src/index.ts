import rawRules from "./rulesets/uk-2026-27-v1.json" with { type: "json" };
import type { UKRuleset } from "./types.js";

const rulesets: Record<string, UKRuleset> = {
  [rawRules.ruleset_id]: rawRules as UKRuleset
};

export interface GetRulesetOptions {
  allowDraft?: boolean;
}

export function getUKRuleset(id = "uk-2026-27-v1", options: GetRulesetOptions = {}): UKRuleset {
  const ruleset = rulesets[id];
  if (!ruleset) throw new Error(`Unknown UK ruleset: ${id}`);
  const approved = ruleset.status === "approved";
  if (!approved && !options.allowDraft) {
    throw new Error(`Ruleset ${id} is ${ruleset.status}; production use requires approved status.`);
  }
  return structuredClone(ruleset);
}

export function listUKRulesets(): Array<Pick<UKRuleset, "ruleset_id" | "tax_year" | "status" | "checked_at">> {
  return Object.values(rulesets).map(({ruleset_id, tax_year, status, checked_at}) => ({ruleset_id, tax_year, status, checked_at}));
}
