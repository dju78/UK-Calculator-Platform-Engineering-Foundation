import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLayout } from "../../../components/layout/AdminLayout";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { getAdminCalculatorDetail } from "../../../lib/admin-data/index";

interface CalculatorDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CalculatorDetailPage({ params }: CalculatorDetailPageProps) {
  const { slug } = await params;
  const calc = getAdminCalculatorDetail(slug);

  if (!calc) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/calculators" className="hover:text-slate-900 font-medium">
            ← Back to Calculator Registry
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-mono">{calc.id}</span>
        </div>

        {/* Title Header */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                  {calc.id}
                </span>
                <span className="text-xs text-slate-500 font-mono">v{calc.version}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1.5">
                {calc.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: <span className="font-medium text-slate-700">{calc.category}</span>
                {calc.subcategory && <span> &gt; {calc.subcategory}</span>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={calc.status} size="md" />
              <StatusBadge status={calc.implementationStatus} size="md" />
              <StatusBadge status={calc.risk} size="md" />
              <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                {calc.launchWave}
              </span>
            </div>
          </div>

          {/* Quick Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Canonical Slug</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5 truncate">{calc.slug}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Jurisdiction</div>
              <div className="font-semibold text-slate-900 mt-0.5">{calc.jurisdiction}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Rules Sensitivity</div>
              <div className="mt-0.5">
                {calc.rulesSensitive ? (
                  <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    2026/27 Statutory Rules
                  </span>
                ) : (
                  <span className="text-slate-600">Pure Mathematical Model</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Reference Benchmarks</div>
              <div className="font-mono font-semibold text-slate-900 mt-0.5">{calc.benchmarkCount} fixture cases</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Public Production URL:</span>
              <a
                href={calc.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-blue-600 hover:underline flex items-center gap-1"
              >
                {calc.publicUrl}
                <span className="text-xs">↗</span>
              </a>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Spec: {calc.specFile}
            </div>
          </div>
        </div>

        {/* Detail Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purpose & Scope */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Purpose & Functional Scope
              </h2>
              <div className="text-xs text-slate-700 leading-relaxed">
                {calc.purpose || "Detailed functional purpose specification documented in repository."}
              </div>
            </div>

            {/* Assumptions */}
            {calc.assumptions && calc.assumptions.length > 0 && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Model Assumptions & Constraints
                </h2>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {calc.assumptions.map((asm, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400">•</span>
                      <span>{asm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Methodology */}
            {calc.methodology && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mathematical & Statutory Methodology
                </h2>
                <div className="text-xs text-slate-700 leading-relaxed font-sans">
                  {calc.methodology}
                </div>
              </div>
            )}

            {/* Sources & Statutory References */}
            {calc.sources && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Source Provenance & Authority
                </h2>
                <div className="text-xs text-slate-700 leading-relaxed font-sans">
                  {calc.sources}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* SEO & Structured Data */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                SEO & Discoverability
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Page Title</div>
                  <div className="text-slate-900 mt-0.5 font-medium">{calc.seoTitle || calc.name}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Meta Description</div>
                  <div className="text-slate-700 mt-0.5 leading-relaxed">
                    {calc.seoDescription || "Standard platform SEO metadata applied."}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Structured Data</div>
                  <div className="font-mono text-slate-800 mt-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    Schema.org WebApplication
                  </div>
                </div>
              </div>
            </div>

            {/* Related Calculators */}
            {calc.relatedCalculators && calc.relatedCalculators.length > 0 && (
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Curated Related Tools
                </h2>
                <ul className="space-y-2 text-xs text-slate-700">
                  {calc.relatedCalculators.map((rel, idx) => (
                    <li key={idx} className="p-2 rounded bg-slate-50 border border-slate-100 font-mono text-[11px]">
                      {rel}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Governance Invariants Card */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Read-Only Governance Invariant
              </div>
              <p>
                Calculators are defined in shared packages. No formulas, inputs, or risk levels can be modified from this console.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
