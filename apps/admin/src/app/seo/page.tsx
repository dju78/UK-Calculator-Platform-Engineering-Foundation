import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminSEOOverview, getAdminGoogleSearchOverview } from "../../lib/admin-data/index";

export default function SEOPage() {
  const seo = getAdminSEOOverview();
  const gsc = getAdminGoogleSearchOverview();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Search & SEO Readiness</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              IndexNow protocol integration, Google organic search performance, sitemap routing, and metadata coverage.
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
            statusBadge={
              seo.indexNow.status === "CONFIGURED"
                ? "Verified"
                : (seo.indexNow.status === "PARTIAL" ? "Warning" : "Not available")
            }
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

        {/* Section: Google Organic Search Performance */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Google Organic Search Performance</h2>
                <StatusBadge
                  status={
                    gsc.status === "CONNECTED"
                      ? "Connected"
                      : (gsc.isConfigured ? "Configured" : "Not available")
                  }
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official organic search traffic metrics via Google Search Console Search Analytics API (webmasters.readonly).
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
              <span className="font-semibold text-slate-900">GOOGLE ORGANIC SEARCH DATA</span>
              <span>• {gsc.lastPeriod}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Organic Clicks"
              value={gsc.totalClicks !== null ? gsc.totalClicks.toLocaleString() : "Not available"}
              subtext={gsc.status === "CONNECTED" ? "Google search clicks" : "API not connected"}
              source="Google Search Console"
            />
            <MetricCard
              label="Total Impressions"
              value={gsc.totalImpressions !== null ? gsc.totalImpressions.toLocaleString() : "Not available"}
              subtext={gsc.status === "CONNECTED" ? "SERP visibility" : "API not connected"}
              source="Google Search Console"
            />
            <MetricCard
              label="Average CTR"
              value={gsc.averageCtr || "Not available"}
              subtext={gsc.status === "CONNECTED" ? "Click-through rate" : "API not connected"}
              source="Google Search Console"
            />
            <MetricCard
              label="Average Position"
              value={gsc.averagePosition || "Not available"}
              subtext={gsc.status === "CONNECTED" ? "Mean ranking position" : "API not connected"}
              source="Google Search Console"
            />
          </div>

          {gsc.status !== "CONNECTED" && (
            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">
                Google Search Console API Integration (Optional / Free)
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                To connect live organic clicks, impressions, and keyword queries, provision a read-only Google Cloud service account with the <span className="font-mono font-medium">webmasters.readonly</span> permission and set <span className="font-mono font-medium">GOOGLE_CLIENT_EMAIL</span> and <span className="font-mono font-medium">GOOGLE_PRIVATE_KEY</span> in environment variables.
              </p>
            </div>
          )}

          {/* Search Performance Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Top Queries */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                Top Search Queries
              </div>
              <div className="overflow-x-auto table-scrollbar">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th scope="col" className="px-3 py-2">Query</th>
                      <th scope="col" className="px-3 py-2 text-right">Clicks</th>
                      <th scope="col" className="px-3 py-2 text-right">Impressions</th>
                      <th scope="col" className="px-3 py-2 text-right">CTR</th>
                      <th scope="col" className="px-3 py-2 text-right">Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {gsc.topQueries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                          {gsc.status === "CONNECTED" ? "No query data available." : "Not available (GSC not connected)."}
                        </td>
                      </tr>
                    ) : (
                      gsc.topQueries.map((q) => (
                        <tr key={q.query} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-900">{q.query}</td>
                          <td className="px-3 py-2 text-right font-mono">{q.clicks}</td>
                          <td className="px-3 py-2 text-right font-mono">{q.impressions}</td>
                          <td className="px-3 py-2 text-right font-mono">{q.ctr}</td>
                          <td className="px-3 py-2 text-right font-mono">{q.position}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Landing Pages */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                Top Organic Landing Pages
              </div>
              <div className="overflow-x-auto table-scrollbar">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th scope="col" className="px-3 py-2">Landing URL</th>
                      <th scope="col" className="px-3 py-2 text-right">Clicks</th>
                      <th scope="col" className="px-3 py-2 text-right">Impressions</th>
                      <th scope="col" className="px-3 py-2 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {gsc.topPages.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                          {gsc.status === "CONNECTED" ? "No landing page data available." : "Not available (GSC not connected)."}
                        </td>
                      </tr>
                    ) : (
                      gsc.topPages.map((p) => (
                        <tr key={p.page} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-slate-900">{p.page}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.clicks}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.impressions}</td>
                          <td className="px-3 py-2 text-right font-mono">{p.ctr}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* IndexNow Integration Panel */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">IndexNow Protocol Configuration</h2>
                <StatusBadge
                  status={
                    seo.indexNow.status === "CONFIGURED"
                      ? "Verified"
                      : (seo.indexNow.status === "PARTIAL" ? "Warning" : "Not available")
                  }
                />
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
      </div>
    </AdminLayout>
  );
}