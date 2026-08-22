"use client";

import { useState } from "react";
import { calculate } from "../../../../../dist/packages/calculation-engine/src/engine.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export type FieldDef = {
  name: string;
  label: string;
  type?: "number" | "text" | "select";
  options?: { label: string; value: string }[];
  defaultValue?: string | number;
};

export function DynamicCalculator({ 
  calculatorId, 
  fields 
}: { 
  calculatorId: string, 
  fields: FieldDef[] 
}) {
  const [inputs, setInputs] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) init[f.name] = f.defaultValue;
    });
    return init;
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = calculate(calculatorId, inputs);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Calculation failed");
    }
  };

  const formatOutput = (key: string, value: any) => {
    if (typeof value === "number") {
      // Basic formatting heuristic: if it looks like money
      if (key.includes("payment") || key.includes("repayment") || key.includes("interest") || key.includes("loan") || key.includes("principal")) {
        return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
      }
      return new Intl.NumberFormat("en-GB").format(value);
    }
    return String(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="flex flex-col gap-4">
            {fields.map(field => (
              <div key={field.name}>
                {field.type === "select" ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor={`field-${field.name}`} className="text-sm font-medium text-slate-700">{field.label}</label>
                    <select
                      id={`field-${field.name}`}
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={inputs[field.name] || ""}
                      onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                    >
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Input
                    label={field.label}
                    type="number"
                    step="any"
                    value={inputs[field.name] || ""}
                    onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                    required
                  />
                )}
              </div>
            ))}
            <button 
              type="submit"
              className="mt-4 bg-slate-900 text-white rounded-md h-10 px-4 font-medium hover:bg-slate-800 transition-colors"
            >
              Calculate
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
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
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(result.outputs || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-600 capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="text-lg font-semibold text-slate-900">{formatOutput(k, v)}</span>
                  </div>
                ))}
              </div>
              
              {result.schedule && result.schedule.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-slate-800 mb-2">Amortisation Schedule (Sample)</h3>
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
                            <td className="py-1">{row.period || i+1}</td>
                            <td className="py-1">{formatOutput('payment', row.payment || row.scheduled_payment || 0)}</td>
                            <td className="py-1">{formatOutput('interest', row.interest || 0)}</td>
                            <td className="py-1">{formatOutput('principal', row.principal || 0)}</td>
                            <td className="py-1 text-right">{formatOutput('balance', row.closing_balance || row.balance || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.schedule.length > 5 && (
                      <p className="text-xs text-slate-500 mt-2 italic">* Showing first 5 periods of {result.schedule.length}</p>
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
