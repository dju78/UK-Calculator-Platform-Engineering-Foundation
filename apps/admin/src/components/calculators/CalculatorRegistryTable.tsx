"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StatusBadge } from "../ui/StatusBadge";
import type { AdminCalculatorItem } from "../../lib/admin-data/index";

interface CalculatorRegistryTableProps {
  calculators: AdminCalculatorItem[];
  categories: string[];
}

export function CalculatorRegistryTable({ calculators, categories }: CalculatorRegistryTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWave, setSelectedWave] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRules, setSelectedRules] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const filtered = useMemo(() => {
    return calculators.filter((c) => {
      if (selectedCategory !== "all" && c.category !== selectedCategory) return false;
      if (selectedWave !== "all" && c.launchWave !== selectedWave) return false;
      if (selectedRisk !== "all" && c.risk !== selectedRisk) return false;
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
      if (selectedRules === "yes" && !c.rulesSensitive) return false;
      if (selectedRules === "no" && c.rulesSensitive) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.subcategory.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [calculators, search, selectedCategory, selectedWave, selectedRisk, selectedStatus, selectedRules]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function resetFilters() {
    setSearch("");
    setSelectedCategory("all");
    setSelectedWave("all");
    setSelectedRisk("all");
    setSelectedStatus("all");
    setSelectedRules("all");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="search-calculators" className="sr-only">Search calculators</label>
            <input
              id="search-calculators"
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, ID (e.g. TAX-001), slug, or keyword..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded shadow-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded font-medium border border-slate-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Launch Wave
            </label>
            <select
              value={selectedWave}
              onChange={(e) => { setSelectedWave(e.target.value); setPage(1); }}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Waves</option>
              <option value="Wave 1">Wave 1 (55 calcs)</option>
              <option value="Wave 2">Wave 2 (188 calcs)</option>
              <option value="Wave 3">Wave 3 (10 calcs)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Risk Level
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => { setSelectedRisk(e.target.value); setPage(1); }}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Registry Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="specified">Specified</option>
              <option value="planned">Planned</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Rules-Sensitive
            </label>
            <select
              value={selectedRules}
              onChange={(e) => { setSelectedRules(e.target.value); setPage(1); }}
              className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All</option>
              <option value="yes">Yes (Statutory)</option>
              <option value="no">No (Mathematical)</option>
            </select>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of {calculators.length} calculators
          </div>
          {filtered.length > pageSize && (
            <div>
              Page {page} of {totalPages}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto table-scrollbar">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-3.5 py-3">ID</th>
                <th scope="col" className="px-3.5 py-3">Calculator Name</th>
                <th scope="col" className="px-3.5 py-3">Category</th>
                <th scope="col" className="px-3.5 py-3">Wave</th>
                <th scope="col" className="px-3.5 py-3">Risk</th>
                <th scope="col" className="px-3.5 py-3">Rules</th>
                <th scope="col" className="px-3.5 py-3">Status</th>
                <th scope="col" className="px-3.5 py-3 text-right">Benchmarks</th>
                <th scope="col" className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No calculators match your current search filters.
                  </td>
                </tr>
              ) : (
                paginated.map((calc) => (
                  <tr key={calc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {calc.id}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-slate-900 max-w-xs truncate">
                      <Link
                        href={`/calculators/${calc.slug}`}
                        className="text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {calc.name}
                      </Link>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                      <div>{calc.category}</div>
                      {calc.subcategory && (
                        <div className="text-[10px] text-slate-400">{calc.subcategory}</div>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {calc.launchWave}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <StatusBadge status={calc.risk} />
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      {calc.rulesSensitive ? (
                        <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          2026/27
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pure math</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <StatusBadge status={calc.status} />
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                      {calc.benchmarkCount} cases
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap space-x-2">
                      <Link
                        href={`/calculators/${calc.slug}`}
                        className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        Inspect
                      </Link>
                      <a
                        href={calc.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-slate-600"
                        title="Open live public calculator"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

