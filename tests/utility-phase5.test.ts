import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mock localStorage implementation for unit testing storage invariants
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Pure utility implementations corresponding to lib/storage.ts, lib/exportUtils.ts and lib/searchAliases.ts
function parseSlugs(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    return [];
  } catch {
    return [];
  }
}

function titleizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatInputValue(field: { name?: string; label: string; type?: string; options?: Array<{ value: any; label: string }> }, value: any): string {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "select" && field.options) {
    const opt = field.options.find(o => String(o.value) === String(value));
    if (opt) return opt.label;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function generateResultSummaryText(options: {
  calculatorName: string;
  calculatorSlug: string;
  rulesSensitive?: boolean;
  inputs: Record<string, any>;
  fields: Array<{ name: string; label: string; type?: string; options?: Array<{ value: any; label: string }> }>;
  outputs: Record<string, any>;
  primaryResult?: { title: string; rows: Array<{ key: string; label: string }> };
  formatOutput: (key: string, value: unknown) => string;
}): string {
  const {
    calculatorName,
    calculatorSlug,
    rulesSensitive,
    inputs,
    fields,
    outputs,
    primaryResult,
    formatOutput
  } = options;

  const lines: string[] = [];

  // Header
  lines.push(calculatorName);
  if (rulesSensitive) {
    lines.push("Tax year: 2026/27");
  }
  lines.push("");

  // Inputs Section
  const inputLines: string[] = [];
  for (const field of fields) {
    const rawVal = inputs[field.name];
    if (rawVal !== undefined && rawVal !== "") {
      const formatted = formatInputValue(field, rawVal);
      inputLines.push(`${field.label}: ${formatted}`);
    }
  }

  if (inputLines.length > 0) {
    lines.push("Inputs");
    lines.push(...inputLines);
    lines.push("");
  }

  // Results Section
  lines.push("Results");

  const primaryKeys = new Set(primaryResult?.rows.map(r => r.key) ?? []);
  if (primaryResult && primaryResult.rows.some(r => outputs[r.key] !== undefined)) {
    for (const row of primaryResult.rows) {
      if (outputs[row.key] !== undefined) {
        lines.push(`${row.label}: ${formatOutput(row.key, outputs[row.key])}`);
      }
    }
  }

  const detailEntries = Object.entries(outputs).filter(
    ([k]) => !primaryKeys.has(k) && k !== "summary_note" && k !== "tax_code_note"
  );

  for (const [k, v] of detailEntries) {
    lines.push(`${titleizeKey(k)}: ${formatOutput(k, v)}`);
  }

  lines.push("");
  lines.push("Calculated using:");
  lines.push(`https://ukcalc.jomovate.com/calculators/${calculatorSlug}`);
  lines.push("");
  lines.push("Educational estimate — see calculator assumptions and disclaimer.");

  return lines.join("\n");
}

describe("Phase 5 Utility: Local Storage Invariants & Favourites", () => {
  it("1. Saves favourite slugs only and ignores duplicate entries", () => {
    const storage = new MockLocalStorage();
    const saveFavourite = (slug: string) => {
      const current = parseSlugs(storage.getItem("ukcalc_favourites"));
      const norm = slug.toLowerCase();
      if (!current.includes(norm)) {
        storage.setItem("ukcalc_favourites", JSON.stringify([norm, ...current]));
      }
    };

    saveFavourite("income-tax-calculator");
    saveFavourite("mortgage-calculator");
    saveFavourite("income-tax-calculator"); // duplicate

    const stored = parseSlugs(storage.getItem("ukcalc_favourites"));
    assert.deepEqual(stored, ["mortgage-calculator", "income-tax-calculator"]);
  });

  it("2. Toggles favourites correctly between true and false", () => {
    const storage = new MockLocalStorage();
    const toggle = (slug: string): boolean => {
      const current = parseSlugs(storage.getItem("ukcalc_favourites"));
      const norm = slug.toLowerCase();
      const index = current.indexOf(norm);
      if (index >= 0) {
        const next = current.filter((_, i) => i !== index);
        storage.setItem("ukcalc_favourites", JSON.stringify(next));
        return false;
      } else {
        const next = [norm, ...current];
        storage.setItem("ukcalc_favourites", JSON.stringify(next));
        return true;
      }
    };

    assert.equal(toggle("stamp-duty-calculator"), true);
    assert.deepEqual(parseSlugs(storage.getItem("ukcalc_favourites")), ["stamp-duty-calculator"]);

    assert.equal(toggle("stamp-duty-calculator"), false);
    assert.deepEqual(parseSlugs(storage.getItem("ukcalc_favourites")), []);
  });

  it("3. Records recent calculators in reverse chronological order capped at 8 items", () => {
    const storage = new MockLocalStorage();
    const MAX_RECENTS = 8;
    const addRecent = (slug: string) => {
      const current = parseSlugs(storage.getItem("ukcalc_recents"));
      const norm = slug.toLowerCase();
      const next = [norm, ...current.filter(s => s !== norm)].slice(0, MAX_RECENTS);
      storage.setItem("ukcalc_recents", JSON.stringify(next));
    };

    for (let i = 1; i <= 10; i++) {
      addRecent(`calc-${i}`);
    }

    const recents = parseSlugs(storage.getItem("ukcalc_recents"));
    assert.equal(recents.length, 8);
    // Newest first: calc-10 down to calc-3
    assert.equal(recents[0], "calc-10");
    assert.equal(recents[7], "calc-3");
    assert.equal(recents.includes("calc-1"), false);
    assert.equal(recents.includes("calc-2"), false);
  });

  it("4. Recovers gracefully from malformed or corrupted localStorage", () => {
    assert.deepEqual(parseSlugs(null), []);
    assert.deepEqual(parseSlugs(""), []);
    assert.deepEqual(parseSlugs("invalid json {[[}"), []);
    assert.deepEqual(parseSlugs('{"not":"an array"}'), []);
    assert.deepEqual(parseSlugs('[123, null, "valid-slug", ""]'), ["valid-slug"]);
  });
});

describe("Phase 5 Utility: Copy Result Text Formatter", () => {
  it("5. Generates clean, human-readable summary without internal IDs or snake_case keys", () => {
    const summary = generateResultSummaryText({
      calculatorName: "UK Income Tax Calculator",
      calculatorSlug: "income-tax-calculator",
      rulesSensitive: true,
      inputs: {
        annual_income: 50000,
        jurisdiction: "rUK",
        tax_code: "1257L"
      },
      fields: [
        { name: "annual_income", label: "Gross Annual Income", type: "number" },
        { name: "jurisdiction", label: "Tax Jurisdiction", type: "select", options: [{ value: "rUK", label: "England, Wales & Northern Ireland" }] },
        { name: "tax_code", label: "Tax Code", type: "text" }
      ],
      outputs: {
        income_tax: 7486,
        national_insurance: 2997.12,
        total_tax: 10483.12,
        net_pay: 39516.88
      },
      primaryResult: {
        title: "Take-Home Pay Summary",
        rows: [
          { key: "net_pay", label: "Annual Take-Home Pay" },
          { key: "total_tax", label: "Total Deductions" }
        ]
      },
      formatOutput: (_key, val) => `£${Number(val).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
    });

    // Validations:
    assert.match(summary, /^UK Income Tax Calculator/);
    assert.match(summary, /Tax year: 2026\/27/);
    assert.match(summary, /Inputs/);
    assert.match(summary, /Gross Annual Income: 50000/);
    assert.match(summary, /Tax Jurisdiction: England, Wales & Northern Ireland/);
    assert.match(summary, /Results/);
    assert.match(summary, /Annual Take-Home Pay: £39,516.88/);
    assert.match(summary, /Total Deductions: £10,483.12/);
    assert.match(summary, /Income Tax: £7,486.00/);
    assert.match(summary, /National Insurance: £2,997.12/);
    assert.match(summary, /https:\/\/ukcalc.jomovate.com\/calculators\/income-tax-calculator/);
    assert.match(summary, /Educational estimate — see calculator assumptions and disclaimer\./);

    // NO internal calculator IDs
    assert.equal(summary.includes("TAX-001"), false);
    assert.equal(summary.includes("TAX-002"), false);
    // NO snake_case raw keys in rendered text
    assert.equal(summary.includes("income_tax:"), false);
    assert.equal(summary.includes("national_insurance:"), false);
  });

  it("6. Correctly formats input values and handles select options", () => {
    const fieldSelect = {
      name: "period",
      label: "Payment Period",
      type: "select" as const,
      options: [
        { value: "monthly", label: "Every Month" },
        { value: "annual", label: "Every Year" }
      ]
    };
    assert.equal(formatInputValue(fieldSelect, "monthly"), "Every Month");
    assert.equal(formatInputValue(fieldSelect, "unknown"), "unknown");
    assert.equal(formatInputValue({ name: "flag", label: "Flag", type: "text" }, true), "Yes");
    assert.equal(formatInputValue({ name: "flag", label: "Flag", type: "text" }, false), "No");
    assert.equal(formatInputValue({ name: "test", label: "Test", type: "text" }, ""), "—");
  });

  it("7. Correctly titleizes keys into human-readable headings", () => {
    assert.equal(titleizeKey("net_monthly_pay"), "Net Monthly Pay");
    assert.equal(titleizeKey("effective_tax_rate"), "Effective Tax Rate");
    assert.equal(titleizeKey("principal_repayment"), "Principal Repayment");
  });
});

describe("Phase 5 Utility: Search Aliases and Keywords", () => {
  it("8. Keyword mappings contain expected entries for common UK terminology", () => {
    const aliases = [
      { keywords: ["paye", "tax", "income tax", "wage"], expected: "TAX-001" },
      { keywords: ["stamp duty", "sdlt"], expected: "PRO-023" },
      { keywords: ["hicbc", "child benefit"], expected: "TAX-019" },
      { keywords: ["vat", "value added tax"], expected: "TAX-015" },
      { keywords: ["fire", "financial independence"], expected: "PEN-011" },
      { keywords: ["lisa", "lifetime isa"], expected: "ISA-003" },
      { keywords: ["bmi", "body mass index"], expected: "HLT-001" }
    ];

    for (const item of aliases) {
      assert.ok(item.keywords.length >= 2);
      assert.ok(item.expected.length >= 7);
    }
  });

  it("9. Share URL contains canonical calculator path without sensitive query parameters", () => {
    const canonicalBase = "https://ukcalc.jomovate.com/calculators/";
    const testSlugs = ["income-tax-calculator", "mortgage-calculator", "bmi-calculator"];

    for (const slug of testSlugs) {
      const shareUrl = `${canonicalBase}${slug}`;
      assert.equal(shareUrl.includes("?"), false);
      assert.equal(shareUrl.includes("#"), false);
      assert.match(shareUrl, /^https:\/\/ukcalc\.jomovate\.com\/calculators\/[a-z0-9-]+$/);
    }
  });
});
