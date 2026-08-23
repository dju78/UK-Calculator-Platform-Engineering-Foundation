"use client";

import { useMemo, useState } from "react";
import { calculate } from "../../../../../dist/packages/calculation-engine/src/engine.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { FieldDef, PeriodicResultConfig } from "./fieldTypes";
import { NOTE_OUTPUT_KEYS } from "./fieldMappings";

export type { FieldDef };

type Inputs = Record<string, string | number>;

/** Is a conditional field currently visible? */
function isVisible(field: FieldDef, inputs: Inputs): boolean {
  if (!field.showWhen) return true;
  return field.showWhen.equals.includes(String(inputs[field.showWhen.field] ?? ""));
}

/**
 * Money formatting for the UK Tax & Salary family: always "£", comma grouping
 * and exactly two decimal places, so results never mix £3,566.00 with 1426.4.
 */
const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const plain = new Intl.NumberFormat("en-GB");

/** Keys in the TAX family that are counts or assumptions, not money. */
const TAX_NON_MONEY_KEYS = new Set([
  "hours_per_week_used",
  "paid_weeks_per_year_used",
  "payroll_frequency",
  "pension_arrangement",
  "tax_code"
]);

function isTaxFamily(calculatorId: string): boolean {
  return calculatorId.startsWith("TAX-") && calculatorId !== "TAX-015";
}

export function DynamicCalculator({
  calculatorId,
  fields,
  primaryResult
}: {
  calculatorId: string;
  fields: FieldDef[];
  primaryResult?: PeriodicResultConfig;
}) {
  const [inputs, setInputs] = useState<Inputs>(() => {
    const init: Inputs = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) init[f.name] = f.defaultValue;
    });
    return init;
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleFields = useMemo(
    () => fields.filter(f => isVisible(f, inputs)),
    [fields, inputs]
  );

  /**
   * Apply a change, then re-default any field that follows it - for example
   * switching the default tax code when the jurisdiction changes. A value the
   * user picked deliberately is left alone.
   */
  const updateField = (name: string, value: string) => {
    const next: Inputs = { ...inputs, [name]: value };
    for (const f of fields) {
      const rule = f.defaultByField;
      if (!rule || rule.field !== name) continue;
      const current = String(next[f.name] ?? "");
      if (!rule.onlyIfCurrentIn.includes(current)) continue;
      const mapped = rule.map[value];
      if (mapped !== undefined) next[f.name] = mapped;
    }
    setInputs(next);
  };

  const formatOutput = (key: string, value: any) => {
    if (typeof value !== "number") return String(value);

    if (isTaxFamily(calculatorId)) {
      return TAX_NON_MONEY_KEYS.has(key) ? plain.format(value) : gbp.format(value);
    }

    // Historic heuristic, unchanged, for the rest of the platform.
    if (
      key.includes("payment") ||
      key.includes("repayment") ||
      key.includes("interest") ||
      key.includes("loan") ||
      key.includes("principal")
    ) {
      return gbp.format(value);
    }
    if (key === "converted") {
      return new Intl.NumberFormat("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
    return plain.format(value);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const transformed: Record<string, any> = {};

      for (const field of fields) {
        // A hidden field is not part of the user's input. This matters: it is
        // what stops us emitting an "hourly equivalent" from a working pattern
        // the user was never shown.
        if (!isVisible(field, inputs)) continue;

        const raw = inputs[field.name];
        if (raw === "" || raw === undefined) continue;

        // A "custom" choice defers to its companion free-text field.
        if (raw === "custom") {
          const custom = inputs[`${field.name}_custom`];
          if (custom === undefined || String(custom).trim() === "") {
            throw new Error(`Enter a value for ${field.label.toLowerCase()}.`);
          }
          transformed[field.name] = String(custom).trim();
          continue;
        }
        // The companion field itself is not sent separately.
        if (field.name.endsWith("_custom")) continue;

        let value: any = raw;
        if (field.type !== "text" && field.type !== "select") {
          value = Number(value);
          if (!Number.isFinite(value)) {
            throw new Error(`${field.label} must be a number.`);
          }
        }
        if (field.scale !== undefined) {
          // Normalise a human percentage exactly once, here at the boundary.
          value = Number(value) * field.scale;
        }
        if (field.type === "select" && (value === "true" || value === "false")) {
          value = value === "true";
        }
        if (typeof value === "string" && value.startsWith("[")) {
          try {
            value = JSON.parse(value);
          } catch {
            // leave as the original string
          }
        }
        transformed[field.name] = value;
      }

      const res = await calculate(calculatorId, transformed);
      setResult(res);
    } catch (err: any) {
      setResult(null);
      setError(err.message || "Calculation failed");
    }
  };

  // Group fields for display while preserving declaration order.
  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, FieldDef[]>();
    for (const f of visibleFields) {
      const g = f.group ?? "";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(f);
    }
    return order.map(g => ({ name: g, fields: byGroup.get(g)! }));
  }, [visibleFields]);

  const outputs: Record<string, any> = result?.outputs ?? {};
  const primaryKeys = new Set(primaryResult?.rows.map(r => r.key) ?? []);
  const noteEntries = NOTE_OUTPUT_KEYS.filter(k => typeof outputs[k] === "string");
  const detailEntries = Object.entries(outputs).filter(
    ([k]) => !primaryKeys.has(k) && !NOTE_OUTPUT_KEYS.includes(k)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="flex flex-col gap-4">
            {groups.map(group => (
              <fieldset key={group.name || "_"} className="flex flex-col gap-4 min-w-0">
                {group.name && (
                  <legend className="text-sm font-semibold text-slate-800 pt-2">
                    {group.name}
                  </legend>
                )}
                {group.fields.map(field => {
                  const controlId = `field-${field.name}`;
                  const helpId = field.helperText ? `${controlId}-help` : undefined;
                  return (
                    <div key={field.name}>
                      {field.type === "select" ? (
                        <div className="flex flex-col gap-1.5 w-full">
                          <label
                            htmlFor={controlId}
                            className="text-sm font-medium text-slate-700"
                          >
                            {field.label}
                          </label>
                          <select
                            id={controlId}
                            name={field.name}
                            aria-describedby={helpId}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            value={inputs[field.name] ?? ""}
                            onChange={e => updateField(field.name, e.target.value)}
                          >
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <Input
                          id={controlId}
                          name={field.name}
                          label={field.label}
                          type={field.type || "number"}
                          step={field.type === "text" ? undefined : "any"}
                          aria-describedby={helpId}
                          value={inputs[field.name] ?? ""}
                          onChange={e => updateField(field.name, e.target.value)}
                        />
                      )}
                      {field.helperText && (
                        <p id={helpId} className="text-xs text-slate-500 mt-1">
                          {field.helperText}
                        </p>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            ))}
            <button
              type="submit"
              className="mt-4 bg-slate-900 text-white rounded-md h-10 px-4 font-medium hover:bg-slate-800 transition-colors"
            >
              Calculate
            </button>
          </form>
          {error && (
            <div role="alert" className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-slate-500 italic">Enter values and calculate to see results.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {result.rulesetId && (
                <div className="bg-blue-50 text-blue-900 border border-blue-200 p-3 rounded text-sm mb-4">
                  <strong>Regulatory Context:</strong> Calculation executed under UK Ruleset{" "}
                  <code>{result.rulesetId}</code>. (Tax Year 2026/27).
                  <br />
                  <em className="text-xs text-blue-700 block mt-1">
                    Disclaimer: Results are estimates for illustration only and do not
                    constitute financial advice. Source provenance checked and active.
                  </em>
                </div>
              )}

              {/* Prominent periodic card. A responsive grid, never a wide
                  four-column table, so it does not scroll sideways on mobile. */}
              {primaryResult && primaryResult.rows.some(r => outputs[r.key] !== undefined) && (
                <section aria-label={primaryResult.title} className="mb-2">
                  <h3 className="font-semibold text-slate-800 mb-3">{primaryResult.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {primaryResult.rows
                      .filter(r => outputs[r.key] !== undefined)
                      .map(r => (
                        <div
                          key={r.key}
                          className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 min-w-0"
                        >
                          <span className="text-xs font-medium text-slate-600">{r.label}</span>
                          <span
                            data-output-key={r.key}
                            className="text-xl font-semibold text-slate-900 break-words"
                          >
                            {formatOutput(r.key, outputs[r.key])}
                          </span>
                        </div>
                      ))}
                  </div>
                  {primaryResult.note && (
                    <p className="text-xs text-slate-500 mt-2">{primaryResult.note}</p>
                  )}
                </section>
              )}

              <div className="grid grid-cols-1 gap-3">
                {detailEntries.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-0 min-w-0"
                  >
                    <span className="text-sm font-medium text-slate-600 capitalize">
                      {k.replace(/_/g, " ")}
                    </span>
                    <span
                      data-output-key={k}
                      className="text-lg font-semibold text-slate-900 text-right break-words"
                    >
                      {formatOutput(k, v)}
                    </span>
                  </div>
                ))}
              </div>

              {noteEntries.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {noteEntries.map(k => (
                    <p key={k} className="text-xs text-slate-500">
                      {outputs[k]}
                    </p>
                  ))}
                </div>
              )}

              {result.schedule && result.schedule.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-800 mb-2">
                    Amortisation Schedule (Sample)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-2">Period</th>
                          <th className="py-2">Payment</th>
                          <th className="py-2">Interest</th>
                          <th className="py-2">Principal</th>
                          <th className="py-2 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.slice(0, 5).map((row: any, i: number) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-1">{row.period || i + 1}</td>
                            <td className="py-1">
                              {formatOutput("payment", row.payment || row.scheduled_payment || 0)}
                            </td>
                            <td className="py-1">{formatOutput("interest", row.interest || 0)}</td>
                            <td className="py-1">{formatOutput("principal", row.principal || 0)}</td>
                            <td className="py-1 text-right">
                              {formatOutput("balance", row.closing_balance || row.balance || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.schedule.length > 5 && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        * Showing first 5 periods of {result.schedule.length}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
