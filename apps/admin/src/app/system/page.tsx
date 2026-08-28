import React from "react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getAdminSystemOverview } from "../../lib/admin-data/index";

export default function SystemPage() {
  const sys = getAdminSystemOverview();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">System & Security Health</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monorepo package boundaries, runtime environment, security headers, and authentication safeguards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">Runtime:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded">
              Node.js {sys.nodeVersion}
            </span>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Environment"
            value={sys.environment.toUpperCase()}
            subtext="Node environment configuration"
            source="process.env.NODE_ENV"
          />
          <MetricCard
            label="Next.js Framework"
            value={`v${sys.nextVersion}`}
            subtext={`React v${sys.reactVersion}`}
            source="dependencies"
          />
          <MetricCard
            label="Public Target Host"
            value="ukcalc.jomovate.com"
            subtext="apps/web application host"
            source="Vercel"
          />
          <MetricCard
            label="Admin Target Host"
            value="admin.ukcalc.jomovate.com"
            subtext="apps/admin console host"
            source="Vercel Subdomain"
          />
        </div>

        {/* Monorepo Architecture Register */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Monorepo Package Boundaries & Protection Levels
            </h2>
          </div>
          <div className="overflow-x-auto table-scrollbar">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Package / Workspace</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Governance Status</th>
                  <th scope="col" className="px-4 py-3">Functional Role & Protection Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sys.packages.map((pkg) => (
                  <tr key={pkg.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {pkg.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px] uppercase">
                      {pkg.type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={pkg.status === "protected" ? "Protected Package" : "Active Application"} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {pkg.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Headers Register */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            HTTP Security Headers Policy
          </h2>
          <div className="overflow-x-auto table-scrollbar">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Header Name</th>
                  <th scope="col" className="px-3.5 py-2.5">Configured Value</th>
                  <th scope="col" className="px-3.5 py-2.5">Security Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sys.securityHeaders.map((hdr) => (
                  <tr key={hdr.header} className="hover:bg-slate-50/80">
                    <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {hdr.header}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-700 bg-slate-50/50 max-w-xs truncate">
                      {hdr.value}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600">
                      {hdr.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Authentication Policy & Privacy Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Authentication & Session Security
            </h2>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Session Mechanism:</span>
                <span className="font-semibold">{sys.authPolicy.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cookie Name:</span>
                <span className="font-mono">{sys.authPolicy.cookieName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Session Duration:</span>
                <span>{sys.authPolicy.sessionDuration}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cryptographic Signing:</span>
                <span className="font-mono">{sys.authPolicy.encryption}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">CSRF Safeguard:</span>
                <span>{sys.authPolicy.csrfProtection}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Zero Secret Exposure Invariant
            </h2>
            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              <p>
                In accordance with platform security standards, no raw secrets, API tokens, or administrator passwords are rendered to static HTML or sent to client bundles.
              </p>
              <p>
                Credentials must be provisioned through secure Vercel environment variables (<span className="font-mono text-slate-900 font-semibold">ADMIN_PASSWORD</span> and <span className="font-mono text-slate-900 font-semibold">ADMIN_SESSION_SECRET</span>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
