import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminRulesOverview, getAdminGovernanceCalendar } from "../../lib/admin-data/index";

export default function RulesGovernancePage() {
  const rules = getAdminRulesOverview();
  const calendar = getAdminGovernanceCalendar();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Rules & Governance</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory UK tax thresholds, allowances, bands, and regulatory review calendar for {rules.taxYear}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Ruleset ID:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded">
              {rules.activeRulesetId}
            </span>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Active Ruleset"
            value={rules.activeRulesetId}
            subtext={`Tax Year ${rules.taxYear}`}
            statusBadge="Approved"
            source="rules-uk"
          />
          <MetricCard
            label="Rule Families"
            value={rules.totalRuleFamilies}
            subtext="Comprehensive UK tax & wrapper regimes"
            source="uk-2026-27-v1.json"
          />
          <MetricCard
            label="Effective Duration"
            value="2026/27"
            subtext={rules.effectivePeriod}
            source="Statutory Schedule"
          />
          <MetricCard
            label="Governance Status"
            value={calendar.overallAlertSummary}
            subtext={`Last audit: ${rules.lastChecked}`}
            statusBadge={calendar.dueCount === 0 && calendar.overdueCount === 0 ? "Current" : "Warning"}
            source="Audit Calendar"
          />
        </div>

        {/* Section 1: Statutory Governance Review Schedule (Calendar) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Statutory Governance Review Schedule ({calendar.totalRuleFamilies} Regimes)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target fiscal event review windows based on statutory HM Treasury, Devolved Governments, and DfE timetables.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {calendar.currentCount} / {calendar.totalRuleFamilies} Current
            </div>
          </div>

          <div className="overflow-x-auto table-scrollbar">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Rule Family</th>
                  <th scope="col" className="px-4 py-3">Jurisdiction</th>
                  <th scope="col" className="px-4 py-3">Next Review Target</th>
                  <th scope="col" className="px-4 py-3">Fiscal Review Trigger</th>
                  <th scope="col" className="px-4 py-3 text-right">Calculators</th>
                  <th scope="col" className="px-4 py-3 text-right">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {calendar.items.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {item.jurisdiction}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {item.nextScheduledReview}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {item.reviewTriggerEvent}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {item.dependentCalculatorsCount}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <StatusBadge status={item.status === "Current" ? "Verified" : (item.status === "Review approaching" ? "Warning" : item.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Rule Families List & Parameters */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Statutory Rule Regimes ({rules.ruleFamilies.length})
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {rules.ruleFamilies.map((fam) => (
              <div
                key={fam.key}
                className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{fam.name}</h3>
                      <StatusBadge status={fam.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Jurisdiction: <span className="font-medium text-slate-700">{fam.jurisdiction}</span> • Category: <span className="font-medium text-slate-700">{fam.category}</span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                    {fam.dependentCalculatorsCount} dependent calculators
                  </div>
                </div>

                {/* Key Parameters Table */}
                <div className="bg-slate-50/80 rounded border border-slate-200/80 p-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Key Statutory Parameters
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {Object.entries(fam.sampleParameters).map(([paramName, paramVal]) => (
                      <div key={paramName} className="bg-white p-2 rounded border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-medium">{paramName}</div>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">{paramVal}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provenance & Statutory Basis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700">Primary Source: </span>
                    {fam.primarySource}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Statutory Basis: </span>
                    {fam.statutoryBasis}
                  </div>
                </div>

                {fam.notes && (
                  <div className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                    Note: {fam.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
