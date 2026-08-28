import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminSEOOverview } from "../../lib/admin-data/index";

export default function SEOPage() {
  const seo = getAdminSEOOverview();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Search & SEO Readiness</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              IndexNow protocol integration, sitemap routing, robots policy, and search engine metadata coverage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Target Host:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded">
              {seo.canonicalDomain}
            </span>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Canonical Host"
            value="ukcalc.jomovate.com"
            subtext="Single origin canonical URL derivation"
            source="site.ts"
          />
          <MetricCard
            label="Sitemap Routes"
            value={`${seo.sitemapEntryCount} URLs`}
            subtext="Home, calculators, categories, legal"
            source="sitemap.xml (derived)"
          />
          <MetricCard
            label="IndexNow Protocol"
            value={seo.indexNow.statusLabel}
            subtext="Real-time search notification"
            statusBadge={seo.indexNow.status === "INTEGRATED" ? "Verified" : "Warning"}
            source="IndexNow 1.0"
          />
          <MetricCard
            label="Metadata Coverage"
            value={seo.metadataCoverage.coverageComplete ? "100% Verified" : "Audit Incomplete"}
            subtext={`${seo.metadataCoverage.totalCalculators} calculators + ${seo.metadataCoverage.totalCategories} categories`}
            statusBadge={seo.metadataCoverage.coverageComplete ? "PASS" : "WARN"}
            source="SEO Audit"
          />
        </div>

        {/* IndexNow Integration Panel */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">IndexNow Protocol Configuration</h2>
                <StatusBadge status={seo.indexNow.status === "INTEGRATED" ? "Verified" : seo.indexNow.status === "PENDING_PARTIAL" ? "Warning" : "Not available"} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant search engine indexation notifications for Bing, Yandex, Naver, and Seznam.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              Doc: {seo.indexNow.documentationPath}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">IndexNow Endpoint</div>
              <div className="font-mono text-slate-900 font-semibold">{seo.indexNow.endpoint}</div>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Verification Key (Masked)</div>
              <div className="font-mono text-slate-900 font-semibold truncate">
                {seo.indexNow.maskedKey ? `Key: ${seo.indexNow.maskedKey}` : (seo.indexNow.keyFileName || "Not configured")}
              </div>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Public Key Location</div>
              <div className="font-mono text-blue-600 font-semibold truncate">
                {seo.indexNow.keyLocation ? (
                  <a href={seo.indexNow.keyLocation} target="_blank" rel="noreferrer" className="hover:underline">
                    {seo.indexNow.keyLocation} ↗
                  </a>
                ) : (
                  <span className="text-slate-400">Unavailable</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900 text-slate-100 font-mono text-xs space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              CLI Submission Command
            </div>
            <div className="text-emerald-400 font-bold select-all">
              npm run indexnow -- https://ukcalc.jomovate.com/
            </div>
            <div className="text-[11px] text-slate-400">
              Validates canonical host, strips query parameters (privacy safe), rejects embed/private paths.
            </div>
          </div>
        </div>

        {/* Metadata & Canonical Coverage Audit */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Metadata & Canonical Coverage Audit (Measured)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Calculator Canonical URLs</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1">
                {seo.metadataCoverage.withCanonical} / {seo.metadataCoverage.totalCalculators}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {seo.metadataCoverage.withCanonical === seo.metadataCoverage.totalCalculators ? "100% valid slug routes" : "Missing slug detected"}
              </div>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Category Metadata & Summaries</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1">
                {seo.metadataCoverage.categoriesWithMetadata} / {seo.metadataCoverage.totalCategories}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {seo.metadataCoverage.categoriesWithMetadata === seo.metadataCoverage.totalCategories ? "All categories mapped" : "Incomplete category metadata"}
              </div>
            </div>
            <div className="p-3 rounded bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Schema.org Structured Data</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1">
                {seo.metadataCoverage.withSchemaApplicationCategory} / {seo.metadataCoverage.totalCalculators}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                {seo.metadataCoverage.withSchemaApplicationCategory === seo.metadataCoverage.totalCalculators ? "100% ApplicationCategory typed" : "Untyped categories found"}
              </div>
            </div>
          </div>
        </div>

        {/* Search API Integrations Roadmap */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Search Engine API Integrations
          </h2>
          <div className="space-y-2.5 text-xs">
            {seo.apiIntegrations.map((api) => (
              <div key={api.service} className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-900">{api.service}</div>
                  <div className="text-slate-500">{api.description}</div>
                </div>
                <StatusBadge status={api.status === "PLANNED_PHASE2" ? "Planned (Phase 2)" : "Connected"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}