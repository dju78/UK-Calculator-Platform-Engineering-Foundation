import test from "node:test";
import assert from "node:assert/strict";
import { getUKRuleset, listUKRulesets } from "../packages/rules-uk/src/index.js";

test("draft UK ruleset cannot be used as approved by default", () => {
  assert.throws(() => getUKRuleset("uk-2026-27-v1"), /production use requires approved status/);
});

test("draft UK ruleset can be loaded explicitly for development", () => {
  const ruleset = getUKRuleset("uk-2026-27-v1", {allowDraft:true});
  assert.equal(ruleset.tax_year, "2026/27");
  assert.equal(ruleset.status, "draft_second_review");
});

test("rules registry exposes review metadata", () => {
  const item = listUKRulesets()[0];
  assert.equal(item.ruleset_id, "uk-2026-27-v1");
  assert.ok(item.checked_at);
});
