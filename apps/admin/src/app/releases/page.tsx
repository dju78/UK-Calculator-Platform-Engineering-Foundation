import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminReleaseOverview } from "../../lib/admin-data/index";

export default function ReleasesPage() {
  const rel = getAdminReleaseOverview();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Releases</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Documented release records, milestone deliverables, wave progressions, and platform version history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Active Branch:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded">
              {rel.gitBranch}
            </span>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Platform Version"
            value={rel.platformVersion}
            subtext="Engineering foundation core"
            source="package.json"
          />
          <MetricCard
            label="Admin Version"
            value={rel.adminVersion}
            subtext="Management console Phase 1"
            statusBadge="Current"
            source="apps/admin"
          />
          <MetricCard
            label="Live Calculators"
            value={rel.totalCalculators}
            subtext="Across all 3 waves"
            source="calculator-registry"
          />
          <MetricCard
            label="Active Ruleset"
            value={rel.activeRuleset}
            subtext="Statutory tax year 2026/27"
            source="rules-uk"
          />
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Documented Milestones & Launch History ({rel.milestones.length})
          </h2>

          <div className="space-y-3">
            {rel.milestones.map((m) => (
              <div
                key={m.codename}
                className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {m.version}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{m.codename}</h3>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                  </div>

                  <div className="text-right text-xs font-mono text-slate-500 whitespace-nowrap">
                    <div>{m.date}</div>
                    <div className="text-[11px] text-slate-400 font-sans">{m.calculatorCount} calculators</div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Key Deliverables & Evidence
                  </div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {m.keyDeliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External API Integrations Extension Points */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            External CI/CD & Deployment Integrations (Planned Architecture)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {rel.externalIntegrations.map((ext) => (
              <div key={ext.name} className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">{ext.name}</div>
                  <StatusBadge status={ext.readyInPhase} />
                </div>
                <div className="text-slate-500">{ext.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
