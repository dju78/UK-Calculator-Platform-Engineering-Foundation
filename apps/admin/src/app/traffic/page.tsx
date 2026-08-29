import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminTrafficOverview, TrafficTimePeriod } from "../../lib/admin-data/index";

export default async function TrafficPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const periodParam = resolvedParams.period;
  const period: TrafficTimePeriod =
    periodParam === "24h" || periodParam === "30d" ? periodParam : "7d";

  const traffic = await getAdminTrafficOverview(period);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Traffic & Audience</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Privacy-first aggregate traffic analytics for the public UKCalc application via Cloudflare Web Analytics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Time Range:</span>
            <div className="flex items-center rounded border border-slate-300 bg-white p-0.5 text-xs font-mono">
              <a
                href="/traffic?period=24h"
                className={`px-2.5 py-1 rounded ${
                  period === "24h"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                24h
              </a>
              <a
                href="/traffic?period=7d"
                className={`px-2.5 py-1 rounded ${
                  period === "7d"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                7d
              </a>
              <a
                href="/traffic?period=30d"
                className={`px-2.5 py-1 rounded ${
                  period === "30d"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30d
              </a>
            </div>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Total Visits"
            value={traffic.visits !== null ? traffic.visits.toLocaleString() : "Not available"}
            subtext={traffic.status === "CONNECTED" ? `Aggregated over last ${period}` : "Live API not connected"}
            statusBadge={traffic.status === "CONNECTED" ? "Verified" : "Not available"}
            source="Cloudflare Analytics"
          />
          <MetricCard
            label="Total Page Views"
            value={traffic.pageViews !== null ? traffic.pageViews.toLocaleString() : "Not available"}
            subtext={traffic.status === "CONNECTED" ? "Calculators & category pages" : "Live API not connected"}
            statusBadge={traffic.status === "CONNECTED" ? "Verified" : "Not available"}
            source="Cloudflare Analytics"
          />
          <MetricCard
            label="Top Country"
            value={traffic.topCountry || "Not available"}
            subtext={traffic.status === "CONNECTED" ? "Primary audience territory" : "Live API not connected"}
            source="Geo Distribution"
          />
          <MetricCard
            label="Top Landing Page"
            value={traffic.topPage || "Not available"}
            subtext={traffic.status === "CONNECTED" ? "Highest traffic path" : "Live API not connected"}
            source="Route Metrics"
          />
        </div>

        {/* Integration Status Panel */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Cloudflare Web Analytics Provider</h2>
                <StatusBadge
                  status={
                    traffic.status === "CONNECTED"
                      ? "Connected"
                      : (traffic.isBeaconConfigured ? "Configured" : "Not available")
                  }
                />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Free-tier, privacy-first aggregate measurement running on the public application without tracking cookies or personal profiling.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <span>£0 / mo Analytics Cost</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Public App Beacon</div>
              <div className="font-mono text-slate-900 font-semibold">
                {traffic.isBeaconConfigured ? "Beacon Injected (apps/web)" : "Not Configured"}
              </div>
              <p className="text-[11px] text-slate-500">
                {traffic.isBeaconConfigured
                  ? "NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN active."
                  : "Set NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN in apps/web."}
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Admin Server GraphQL API</div>
              <div className="font-mono text-slate-900 font-semibold">
                {traffic.isApiConnected ? "Live API Ingestion Connected" : "Not Connected"}
              </div>
              <p className="text-[11px] text-slate-500">
                {traffic.isApiConnected
                  ? "Server-side Cloudflare API token active."
                  : (traffic.statusLabel || "Cloudflare Analytics API credentials are not configured.")}
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 font-medium">Privacy Safeguards</div>
              <div className="font-mono text-emerald-700 font-semibold">
                Privacy-First & Cookie-Free
              </div>
              <p className="text-[11px] text-slate-500">
                Does not collect or use visitors&apos; personal data and does not track individual end users across sites.
              </p>
            </div>
          </div>

          {traffic.status !== "CONNECTED" && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>
                  {traffic.status === "AUTH_ERROR"
                    ? "⚠️ Cloudflare Authentication Failed"
                    : traffic.status === "PERMISSION_DENIED"
                    ? "⚠️ Cloudflare Permission Denied"
                    : traffic.status === "ERROR"
                    ? "⚠️ Cloudflare GraphQL Query Failed"
                    : traffic.status === "UNAVAILABLE"
                    ? "⚠️ Cloudflare API Service Unavailable"
                    : "ℹ Live Cloudflare API Ingestion Not Connected"}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {traffic.status === "AUTH_ERROR" ? (
                  <>
                    Cloudflare rejected the API token (HTTP 401). Verify that <span className="font-mono font-semibold">CLOUDFLARE_API_TOKEN</span> is valid and active in server environment variables.
                  </>
                ) : traffic.status === "PERMISSION_DENIED" ? (
                  <>
                    Cloudflare API token lacks required permissions (HTTP 403). Ensure the token has <span className="font-mono font-semibold">Account Analytics Read</span> permission for account <span className="font-mono font-semibold">CLOUDFLARE_ACCOUNT_ID</span>.
                  </>
                ) : traffic.status === "ERROR" || traffic.status === "UNAVAILABLE" ? (
                  <>
                    {traffic.errorMessage || traffic.statusLabel}
                  </>
                ) : (
                  <>
                    Public visit measurement requires Cloudflare Web Analytics. To display live charts and breakdowns inside this admin console, provision <span className="font-mono font-semibold">CLOUDFLARE_ACCOUNT_ID</span> and <span className="font-mono font-semibold">CLOUDFLARE_API_TOKEN</span> in your server environment variables. The public website will collect aggregate page views without these server tokens once the public beacon token is provisioned.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Breakdowns Register */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Pages */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Top Visited Pages ({period})
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Public Application Routes</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Route Path</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Page Views</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Traffic Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {traffic.topPages.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        {traffic.status === "CONNECTED"
                          ? "No page views recorded in selected time window."
                          : "Not available (Live Cloudflare API not connected)."}
                      </td>
                    </tr>
                  ) : (
                    traffic.topPages.map((p) => (
                      <tr key={p.path} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-mono text-slate-900">{p.path}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                          {p.views.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{p.share}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Top Audience Countries ({period})
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Geographic Spread</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Country / Territory</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Visits</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {traffic.topCountries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        {traffic.status === "CONNECTED"
                          ? "No geographic metrics recorded in selected time window."
                          : "Not available (Live Cloudflare API not connected)."}
                      </td>
                    </tr>
                  ) : (
                    traffic.topCountries.map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {c.country} ({c.code})
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                          {c.visits.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{c.share}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Devices & Referrers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Referrers */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Top Traffic Referrers ({period})
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Acquisition Channels</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Referrer Source</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Referral Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {traffic.topReferrers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                        {traffic.status === "CONNECTED"
                          ? "No external referrers detected."
                          : "Not available (Live Cloudflare API not connected)."}
                      </td>
                    </tr>
                  ) : (
                    traffic.topReferrers.map((r) => (
                      <tr key={r.source} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{r.source}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                          {r.visits.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Device Types */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Device Distribution ({period})
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Form Factors</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Device Type</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Visits</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {traffic.deviceTypes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        {traffic.status === "CONNECTED"
                          ? "No device metrics recorded."
                          : "Not available (Live Cloudflare API not connected)."}
                      </td>
                    </tr>
                  ) : (
                    traffic.deviceTypes.map((d) => (
                      <tr key={d.device} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-medium text-slate-900">{d.device}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-900">
                          {d.visits.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{d.share}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
