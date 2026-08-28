import React from "react";
import { StatusBadge } from "./StatusBadge";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  source?: string;
  statusBadge?: string;
}

export function MetricCard({ label, value, subtext, source, statusBadge }: MetricCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          {statusBadge && <StatusBadge status={statusBadge} size="sm" />}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      </div>
      {(subtext || source) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtext}</span>
          {source && <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{source}</span>}
        </div>
      )}
    </div>
  );
}

