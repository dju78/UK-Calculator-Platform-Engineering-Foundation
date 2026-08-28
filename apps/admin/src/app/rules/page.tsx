import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminRulesOverview } from "../../lib/admin-data/index";

export default function RulesGovernancePage() {
  const rules = getAdminRulesOverview();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Rules & Governance</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory UK tax thresholds, allowances, bands, and regulatory parameters for the {rules.taxYear} tax year.
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
            label="Source Audit Date"
            value={rules.lastChecked}
            subtext="HM Treasury / HMRC primary review"
            statusBadge="Current"
            source="Audit Register"
          />
        </div>

        {/* Rule Families List */}
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
