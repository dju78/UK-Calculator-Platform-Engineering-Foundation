import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { CalculatorRegistryTable } from "../../components/calculators/CalculatorRegistryTable";
import { listAdminCalculators, getAllCategories, getCalculatorSummary } from "../../lib/admin-data/index";

export default function CalculatorsPage() {
  const calculators = listAdminCalculators();
  const categories = getAllCategories();
  const summary = getCalculatorSummary();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Calculator Registry</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only inventory of all {summary.total} platform calculators across {summary.totalCategories} categories.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
            <span>Wave 1: {summary.waveCounts["Wave 1"]}</span>
            <span>•</span>
            <span>Wave 2: {summary.waveCounts["Wave 2"]}</span>
            <span>•</span>
            <span>Wave 3: {summary.waveCounts["Wave 3"]}</span>
          </div>
        </div>

        <CalculatorRegistryTable calculators={calculators} categories={categories} />
      </div>
    </AdminLayout>
  );
}
