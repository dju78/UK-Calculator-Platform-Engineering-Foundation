"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { calculate } from "../../../../../dist/packages/calculation-engine/src/engine.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { FieldDef, PeriodicResultConfig } from "./fieldTypes";
import { NOTE_OUTPUT_KEYS, PROVEN_DUPLICATE_SUPPRESSIONS } from "./fieldMappings";
import { formatOutputValue } from "./outputFormats";
import { formatOutputLabel } from "@/lib/outputLabels";
import { getLiveCalculator } from "@/lib/calculators";
import { generateResultSummaryText } from "@/lib/exportUtils";
import { ResultActions } from "./ResultActions";
import { trackCalculatorView, trackCalculationCompleted } from "@/lib/analytics";

export type { FieldDef };

type Inputs = Record<string, string | number>;

/** Is a conditional field currently visible? */
function isVisible(field: FieldDef, inputs: Inputs): boolean {
  if (!field.showWhen) return true;
  return field.showWhen.equals.includes(String(inputs[field.showWhen.field] ?? ""));
}

const scheduleGbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

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
  const [isDirty, setIsDirty] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    if (inputs[name] === value) return;
    const next: Inputs = { ...inputs, [name]: value };
    setResult(null);
    setError(null);
    for (const f of fields) {
      const rule = f.defaultByField;
      if (!rule || rule.field !== name) continue;
      const current = String(next[f.name] ?? "");
      if (!rule.onlyIfCurrentIn.includes(current)) continue;
      const mapped = rule.map[value];
      if (mapped !== undefined) next[f.name] = mapped;
    }
    setInputs(next);
    setIsDirty(true);
  };

  // All presentation decisions live in the central registry.
  const formatOutput = useCallback(
    (key: string, value: unknown) => formatOutputValue(calculatorId, key, value),
    [calculatorId]
  );

  const calcDef = useMemo(() => getLiveCalculator(calculatorId), [calculatorId]);
  const calculatorSlug = calcDef?.slug || calculatorId.toLowerCase();
  const calculatorName = calcDef?.name || "Calculator";
  const rulesSensitive = calcDef?.rulesSensitive;

  useEffect(() => {
    trackCalculatorView({
      calculator_slug: calculatorSlug,
      calculator_category: calcDef?.category || "",
    });
  }, [calculatorSlug, calcDef?.category]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDirty(false);
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
      if (res && res.outputs) {
        trackCalculationCompleted({
          calculator_slug: calculatorSlug,
          calculator_category: calcDef?.category || "",
          has_assumptions: Boolean(res.assumptions && res.assumptions.length > 0),
          has_warnings: Boolean(res.warnings && res.warnings.length > 0),
        });

        // P0 Post-Calculate Mobile Feedback: bring results into viewport securely without stealing focus.
        setTimeout(() => {
          if (resultsRef.current) {
            const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            resultsRef.current.scrollIntoView({
              behavior: prefersReduced ? "auto" : "smooth",
              block: "start"
            });
          }
        }, 100);
      }
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

  const outputs: Record<string, any> = useMemo(() => result?.outputs ?? {}, [result]);
  const primaryKeys = useMemo(() => new Set(primaryResult?.rows.map(r => r.key) ?? []), [primaryResult]);
  const noteEntries = useMemo(() => NOTE_OUTPUT_KEYS.filter(k => typeof outputs[k] === "string"), [outputs]);
  const suppressedKeys = useMemo(
    () => new Set(PROVEN_DUPLICATE_SUPPRESSIONS[calculatorId] ?? []),
    [calculatorId]
  );
  const detailEntries = useMemo(
    () => Object.entries(outputs).filter(
      ([k]) => !primaryKeys.has(k) && !NOTE_OUTPUT_KEYS.includes(k) && !suppressedKeys.has(k)
    ),
    [outputs, primaryKeys, suppressedKeys]
  );
  const suppressedDetailEntries = useMemo(
    () => Object.entries(outputs).filter(
      ([k]) => !primaryKeys.has(k) && !NOTE_OUTPUT_KEYS.includes(k) && suppressedKeys.has(k)
    ),
    [outputs, primaryKeys, suppressedKeys]
  );

  const summaryText = useMemo(() => {
    if (!result) return "";
    return generateResultSummaryText({
      calculatorId,
      calculatorName,
      calculatorSlug,
      rulesSensitive,
      inputs,
      fields: visibleFields,
      outputs,
      primaryResult,
      warnings: result?.warnings,
      assumptions: result?.assumptions,
      formatOutput
    });
  }, [result, calculatorId, calculatorName, calculatorSlug, rulesSensitive, inputs, visibleFields, outputs, primaryResult, formatOutput]);

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
                            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
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
                          inputMode={field.type === "text" ? undefined : "decimal"}
                          step={field.type === "text" ? undefined : "any"}
                          aria-describedby={helpId}
                          value={inputs[field.name] ?? ""}
                          onChange={e => updateField(field.name, e.target.value)}
                        />
                      )}
                      {field.helperText && (
                        <p id={helpId} className="text-xs text-slate-600 mt-1">
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
              className="mt-4 bg-slate-900 text-white rounded-lg h-10 px-5 font-medium hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              Calculate
            </button>
          </form>
          {error && !isDirty && (
            <div role="alert" className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
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
          {/* Results replace each other in place, so announce them politely
              rather than leaving screen-reader users to discover the change. */}
          <div aria-live="polite" aria-atomic="false" id="results-container" ref={resultsRef}>
          {!result || isDirty ? (
            <p className="text-slate-600 italic">Enter values and calculate to see results.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {result.rulesetId && (
                <div className="bg-blue-50/90 text-blue-900 border border-blue-200/80 p-4 rounded-xl text-sm mb-4 shadow-2xs">
                  <strong>UK Statutory Basis:</strong> 2026/27 Tax Year (Ruleset <code>{result.rulesetId}</code>).
                  <br />
                  <span className="text-xs text-blue-800 block mt-1">
                    Calculated in accordance with published UK statutory rates and allowances (HMRC / devolved administrations).
                  </span>
                </div>
              )}

              {/* Prominent periodic card. A responsive grid, never a wide
                  four-column table, so it does not scroll sideways on mobile. */}
              {primaryResult && primaryResult.rows.some(r => outputs[r.key] !== undefined) && (
                <section aria-label={primaryResult.title} className="mb-2">
                  <h3 className="font-semibold text-slate-900 mb-3">{primaryResult.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {primaryResult.rows
                      .filter(r => outputs[r.key] !== undefined)
                      .map(r => (
                        <div
                          key={r.key}
                          className="flex flex-col gap-1 rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5 shadow-2xs min-w-0"
                        >
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{r.label}</span>
                          <span
                            data-output-key={r.key}
                            className="text-xl font-bold text-slate-950 break-words"
                          >
                            {formatOutput(r.key, outputs[r.key])}
                          </span>
                        </div>
                      ))}
                  </div>
                  {primaryResult.note && (
                    <p className="text-xs text-slate-600 mt-2">{primaryResult.note}</p>
                  )}
                </section>
              )}

              <div className="grid grid-cols-1 gap-2" data-testid="detail-results">
                {detailEntries.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 min-w-0"
                  >
                    <span className="text-sm font-medium text-slate-600">
                      {formatOutputLabel(k)}
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

              {suppressedDetailEntries.length > 0 && (
                <div className="sr-only" aria-hidden="true">
                  {suppressedDetailEntries.map(([k, v]) => (
                    <span key={k} data-output-key={k}>
                      {formatOutput(k, v)}
                    </span>
                  ))}
                </div>
              )}

              {noteEntries.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {noteEntries.map(k => (
                    <p key={k} className="text-xs text-slate-600">
                      {outputs[k]}
                    </p>
                  ))}
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div
                  role="region"
                  aria-label="Calculation Warnings"
                  data-testid="calculation-warnings"
                  className="bg-amber-50/90 text-amber-900 border border-amber-200/80 p-4 rounded-xl text-sm mt-4 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <strong className="font-semibold text-amber-950">Important Notice</strong>
                      <ul className="list-disc list-inside space-y-1 text-amber-900">
                        {result.warnings.map((w: string, idx: number) => (
                          <li key={idx} className="text-sm leading-relaxed">{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {result.assumptions && result.assumptions.length > 0 && (
                <div
                  role="region"
                  aria-label="Calculation Assumptions"
                  data-testid="calculation-assumptions"
                  className="bg-slate-50/90 text-slate-800 border border-slate-200/80 p-4 rounded-xl text-sm mt-4 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <svg className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex flex-col gap-1">
                      <strong className="font-semibold text-slate-900">Calculation Assumptions</strong>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {result.assumptions.map((a: string, idx: number) => (
                          <li key={idx} className="text-sm leading-relaxed">{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {result.schedule && result.schedule.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Amortisation Schedule (Sample)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
                          <th className="py-2.5">Period</th>
                          <th className="py-2.5">Payment</th>
                          <th className="py-2.5">Interest</th>
                          <th className="py-2.5">Principal</th>
                          <th className="py-2.5 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.slice(0, 5).map((row: any, i: number) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                            <td className="py-2">{row.period || i + 1}</td>
                            <td className="py-2">
                              {scheduleGbp.format(row.payment || row.scheduled_payment || 0)}
                            </td>
                            <td className="py-2">{scheduleGbp.format(row.interest || 0)}</td>
                            <td className="py-2">{scheduleGbp.format(row.principal || 0)}</td>
                            <td className="py-2 text-right font-medium">
                              {scheduleGbp.format(row.closing_balance || row.balance || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.schedule.length > 5 && (
                      <p className="text-xs text-slate-600 mt-2 italic">
                        * Showing first 5 periods of {result.schedule.length}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <ResultActions calculatorSlug={calculatorSlug} summaryText={summaryText} />
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
