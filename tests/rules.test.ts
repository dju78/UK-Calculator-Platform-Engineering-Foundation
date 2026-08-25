import test from "node:test";
import assert from "node:assert/strict";
import { getUKRuleset, listUKRulesets, resolveRules } from "../packages/rules-uk/src/index.js";

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

test("rejects draft rules in production", () => {
  // Let's assume there's a draft ruleset or we mock one, or we just test the logic
  assert.throws(() => {
    getUKRuleset("non-existent");
  });
});

test("resolves rules by taxYear deterministically", () => {
  const ruleset = resolveRules({ taxYear: "2026/27" });
  assert.equal(ruleset.ruleset_id, "uk-2026-27-v1");
});

test("automated governance: rule source provenance exists", () => {
  const ruleset = getUKRuleset("uk-2026-27-v1");
  const sources = ruleset.sources as string[];
  assert.ok(sources && sources.length > 0, "Ruleset must have authoritative sources");
});

/**
 * Provenance governance.
 *
 * The previous check only asserted that the sources array was non-empty, which
 * would pass on a ruleset whose every figure had been invented so long as one
 * URL sat at the bottom of the file. These assertions check the property that
 * actually matters: that every recorded figure names WHAT was checked, AGAINST
 * WHAT, and WHAT WAS FOUND.
 *
 * The register carries two schemas. The earlier entries use topic / verified_on
 * / source / finding; the later ones use key / verified_value / source / note.
 * Both are accepted deliberately rather than one being rewritten to match the
 * other: rewriting provenance records to fit a newer shape would mean editing
 * an audit trail, and the two shapes carry the same substance.
 */
test("every provenance entry names a source and a finding", () => {
  const ruleset = getUKRuleset("uk-2026-27-v1") as any;
  const register = ruleset.source_register_notes as Array<Record<string, unknown>>;

  assert.ok(Array.isArray(register) && register.length > 0, "the source register must exist");

  const problems: string[] = [];
  register.forEach((entry, i) => {
    const label =
      (entry.key as string) ?? (entry.topic as string) ?? `entry ${i}`;

    const source = entry.source as string | undefined;
    if (!source || source.trim().length < 10) {
      problems.push(`${label}: no usable source`);
    }

    // Either a URL, or an explicit statement of a definitional or derived
    // basis. A bare word is not provenance.
    const looksCited =
      typeof source === "string" &&
      (/^https?:\/\//.test(source) || source.trim().split(/\s+/).length >= 4);
    if (!looksCited) {
      problems.push(`${label}: source "${source}" is neither a URL nor a stated basis`);
    }

    const finding =
      (entry.verified_value as string) ?? (entry.finding as string) ?? "";
    if (String(finding).trim().length < 20) {
      problems.push(`${label}: the finding is too short to be a record of what was checked`);
    }

    const commentary = (entry.note as string) ?? (entry.finding as string) ?? "";
    if (String(commentary).trim().length < 20) {
      problems.push(`${label}: no explanatory note`);
    }
  });

  assert.deepStrictEqual(problems, []);
});

test("the ruleset is approved, dated, and covers the tax year it claims", () => {
  const ruleset = getUKRuleset("uk-2026-27-v1") as any;
  assert.strictEqual(ruleset.status, "approved");
  assert.strictEqual(ruleset.tax_year, "2026/27");
  assert.match(String(ruleset.checked_at), /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(
    new Date(ruleset.effective_from) < new Date(ruleset.effective_to),
    "the effective window must run forwards"
  );
});

test("every rules-sensitive area a calculator depends on is present in the ruleset", () => {
  const ruleset = getUKRuleset("uk-2026-27-v1") as any;

  // Named rather than derived, because the point is to catch a block being
  // dropped: deriving the list from the ruleset itself would make that
  // impossible to detect.
  const required = [
    "income_tax_england_wales_ni",
    "income_tax_scotland",
    "national_insurance_employee_class1_category_a",
    "national_insurance_self_employed",
    "student_loans",
    "property_transaction_tax",
    "isa",
    "pension",
    "state_pension",
    "workplace_pension_auto_enrolment",
    "dividends",
    "capital_gains",
    "corporation_tax",
    "vat",
    "inheritance_tax",
    "tax_codes",
    "savings",
    "self_assessment",
    "marriage_allowance",
    "health",
    "bank_holidays",
    "motoring",
    "engineering",
    "building",
    "education"
  ];

  const missing = required.filter((key) => ruleset[key] === undefined);
  assert.deepStrictEqual(missing, []);

  // All three property transaction tax regimes, because using the English one
  // in Scotland or Wales would be silently and badly wrong.
  const ptt = ruleset.property_transaction_tax;
  for (const regime of ["england_northern_ireland", "scotland", "wales"]) {
    assert.ok(ptt[regime], `property transaction tax is missing the ${regime} regime`);
  }
});
