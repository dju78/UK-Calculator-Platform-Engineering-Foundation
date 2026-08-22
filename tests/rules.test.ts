import test from "node:test";
import assert from "node:assert/strict";
import { getUKRuleset, listUKRulesets } from "../packages/rules-uk/src/index.js";

test("approved UK ruleset can be used by default", () => {
  const ruleset = getUKRuleset("uk-2026-27-v1");
  assert.equal(ruleset.tax_year, "2026/27");
  assert.equal(ruleset.status, "approved");
});

test("rules registry exposes review metadata", () => {
  const item = listUKRulesets()[0];
  assert.equal(item.ruleset_id, "uk-2026-27-v1");
  assert.ok(item.checked_at);
});
