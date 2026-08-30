/**
 * Utilities for formatting calculation inputs and outputs into human-readable text for copying.
 *
 * Requirements:
 * - Human-readable headings and labels.
 * - Exact rendered/formatted values.
 * - No internal calculator IDs (e.g. TAX-001) in copied output.
 * - No raw object dumps or internal snake_case keys.
 * - Canonical public URL reference.
 */

import { SITE_URL } from "./site";
import type { FieldDef, PeriodicResultConfig } from "../components/calculators/fieldTypes";
import { NOTE_OUTPUT_KEYS, PROVEN_DUPLICATE_SUPPRESSIONS } from "../components/calculators/fieldMappings";
import { formatOutputLabel } from "./outputLabels";

export interface FormatResultOptions {
  calculatorId?: string;
  calculatorName: string;
  calculatorSlug: string;
  rulesSensitive?: boolean;
  inputs: Record<string, any>;
  fields: FieldDef[];
  outputs: Record<string, any>;
  primaryResult?: PeriodicResultConfig;
  warnings?: string[];
  assumptions?: string[];
  formatOutput: (key: string, value: unknown) => string;
}

/**
 * Format a human-readable title from a field or output key.
 * Backwards-compatible wrapper delegating to formatOutputLabel.
 */
export function titleizeKey(key: string): string {
  return formatOutputLabel(key);
}

/**
 * Format a field input value cleanly for user-facing text.
 */
export function formatInputValue(field: FieldDef, value: any): string {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "select" && field.options) {
    const opt = field.options.find((o: { label: string; value: string }) => String(o.value) === String(value));
    if (opt) return opt.label;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

/**
 * Generates clean, structured, human-readable plain text summary of the calculation.
 */
export function generateResultSummaryText(options: FormatResultOptions): string {
  const {
    calculatorId,
    calculatorName,
    calculatorSlug,
    rulesSensitive,
    inputs,
    fields,
    outputs,
    primaryResult,
    warnings,
    assumptions,
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
    // Only include visible/provided inputs
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

  // If primary periodic results exist, format them first
  const primaryKeys = new Set(primaryResult?.rows.map((r: { label: string; key: string }) => r.key) ?? []);
  if (primaryResult && primaryResult.rows.some((r: { label: string; key: string }) => outputs[r.key] !== undefined)) {
    for (const row of primaryResult.rows) {
      if (outputs[row.key] !== undefined) {
        lines.push(`${row.label}: ${formatOutput(row.key, outputs[row.key])}`);
      }
    }
  }

  // Suppress duplicate aliases if defined for this calculator
  const suppressedKeys = new Set(calculatorId ? (PROVEN_DUPLICATE_SUPPRESSIONS[calculatorId] ?? []) : []);

  // Detail entries (excluding primary keys, notes, and suppressed duplicates)
  const detailEntries = Object.entries(outputs).filter(
    ([k]) => !primaryKeys.has(k) && !NOTE_OUTPUT_KEYS.includes(k) && !suppressedKeys.has(k)
  );

  for (const [k, v] of detailEntries) {
    lines.push(`${formatOutputLabel(k)}: ${formatOutput(k, v)}`);
  }

  // Add notes if any exist
  const noteEntries = NOTE_OUTPUT_KEYS.filter((k: string) => typeof outputs[k] === "string" && outputs[k].trim().length > 0);
  for (const k of noteEntries) {
    lines.push(`Note: ${outputs[k]}`);
  }

  // Add Warnings if any exist
  if (warnings && warnings.length > 0) {
    lines.push("");
    lines.push("Important Warnings:");
    for (const w of warnings) {
      lines.push(`- ${w}`);
    }
  }

  // Add Assumptions if any exist
  if (assumptions && assumptions.length > 0) {
    lines.push("");
    lines.push("Assumptions:");
    for (const a of assumptions) {
      lines.push(`- ${a}`);
    }
  }

  lines.push("");
  lines.push("Calculated using:");
  lines.push(`${SITE_URL}/calculators/${calculatorSlug}`);
  lines.push("");
  lines.push("Educational estimate — see calculator assumptions and disclaimer.");

  return lines.join("\n");
}

/**
 * Safe clipboard copy with fallback support.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Try modern navigator.clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to textarea fallback
    }
  }

  // Fallback for older browsers / iframe restrictions
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("aria-hidden", "true");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
