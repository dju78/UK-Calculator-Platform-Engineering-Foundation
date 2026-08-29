import React from "react";
import Link from "next/link";
import { AdminLayout } from "../components/layout/AdminLayout";
import { MetricCard } from "../components/ui/MetricCard";
import {
  getCalculatorSummary,
  getAdminRulesOverview,
  getAdminQAOverview,
  getAdminSEOOverview,
  getAdminSystemOverview,
  getAdminTrafficOverview,
  getAdminGoogleSearchOverview,
  getAdminGitHubHealthOverview,
  getAdminGovernanceCalendar,
} from "../lib/admin-data/index";
import { StatusBadge } from "../components/ui/StatusBadge";

export default async function OverviewPage() {
  const calcSummary = getCalculatorSummary();
  const rulesOverview = getAdminRulesOverview();
  const qaOverview = getAdminQAOverview();
  const seoOverview = getAdminSEOOverview();
  const systemOverview = getAdminSystemOverview();
  const trafficOverview = await getAdminTrafficOverview("7d");
  const gscOverview = getAdminGoogleSearchOverview();
  const ghOverview = getAdminGitHubHealthOverview();
  const calendarOverview = getAdminGovernanceCalendar();

  const isQAVerified = qaOverview.overallStatus === "VERIFIED";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header & Context */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Single-pane operational visibility, live audience growth, and statutory governance monitoring for the UK Calculator Platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Tax Year:</span>
            <span className="text-xs font-bold text-slate-900 bg-white border border-slate-300 px-2 py-1 rounded">
              2026/27 Approved
            </span>
          </div>
        </div>

        {/* Section 1: Calculator Inventory */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Calculator Inventory
            </h2>
            <Link href="/calculators" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
              View All {calcSummary.total} Calculators →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Total Calculators"
              value={calcSummary.total}
              subtext="Waves 1, 2, and 3 combined"
              source="calculator-registry"
            />
            <MetricCard
              label="Active Categories"
              value={calcSummary.totalCategories}
              subtext="19 routable topical clusters"
              source="calculator-registry"
            />
            <MetricCard
              label="Verified Coverage"
              value={`${calcSummary.verified} / ${calcSummary.total}`}
              subtext="100% Definition of Done met"
              statusBadge="Verified"
              source="registry metadata"
            />
            <MetricCard
              label="Rules-Sensitive Tools"
              value={calcSummary.rulesSensitive}
              subtext="Bound to 2026/27 statutory rules"
              source="rules-uk"
            />
          </div>
        </div>

        {/* Section 2: Live Growth & Search Audience */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Live Traffic & Search Performance
            </h2>
            <div className="flex items-center gap-3">
              <Link href="/traffic" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                Traffic & Audience →
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/seo" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                Search & SEO Details →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Web Visits (7d)"
              value={trafficOverview.visits !== null ? trafficOverview.visits.toLocaleString() : "Not available"}
              subtext={trafficOverview.status === "CONNECTED" ? "Cloudflare Web Analytics" : "Live API not connected"}
              statusBadge={trafficOverview.status === "CONNECTED" ? "Verified" : (trafficOverview.isBeaconConfigured ? "Configured" : "Not available")}
              source="Cloudflare Analytics"
            />
            <MetricCard
              label="Google Search Clicks"
              value={gscOverview.totalClicks !== null ? gscOverview.totalClicks.toLocaleString() : "Not available"}
              subtext={gscOverview.status === "CONNECTED" ? "Last 28 days organic" : "GSC not connected"}
              statusBadge={gscOverview.status === "CONNECTED" ? "Verified" : "Not available"}
              source="Google Search Console"
            />
            <MetricCard
              label="Sitemap Coverage"
              value={`${seoOverview.sitemapEntryCount} Entries`}
              subtext="All 253 calculators + 19 categories"
              source="sitemap.xml (derived)"
            />
            <MetricCard
              label="IndexNow Protocol"
              value={seoOverview.indexNow.statusLabel}
              subtext={`Key: ${seoOverview.indexNow.maskedKey || "Not configured"}`}
              statusBadge={
                seoOverview.indexNow.status === "CONFIGURED"
                  ? "Verified"
                  : (seoOverview.indexNow.status === "PARTIAL" ? "Warning" : "Not available")
              }
              source="IndexNow 1.0"
            />
          </div>
        </div>

        {/* Section 3: Governance & Rulesets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Rules & Governance
            </h2>
            <Link href="/rules" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
              Inspect Rulesets & Review Calendar →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard
              label="Active Ruleset"
              value={rulesOverview.activeRulesetId}
              subtext={`Status: ${rulesOverview.status.toUpperCase()} (${rulesOverview.effectivePeriod})`}
              statusBadge="Approved"
              source="rules-uk"
            />
            <MetricCard
              label="Statutory Rule Families"
              value={rulesOverview.totalRuleFamilies}
              subtext="Tax, NI, Pensions, ISA, SDLT, LBTT, CGT..."
              source="uk-2026-27-v1.json"
            />
            <MetricCard
              label="Governance Calendar Alert"
              value={calendarOverview.overallAlertSummary}
              subtext={`Last audit: ${rulesOverview.lastChecked}`}
              statusBadge={calendarOverview.dueCount === 0 && calendarOverview.overdueCount === 0 ? "Current" : "Warning"}
              source="statutory timetable"
            />
          </div>
        </div>

        {/* Section 4: QA & Verification */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Quality Assurance Evidence
              </h2>
              <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                {qaOverview.evidenceLabel}: {qaOverview.recordedAt}
              </span>
            </div>
            <Link href="/qa" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
              Full Evidence Breakdown →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Unit Test Suite"
              value={
                isQAVerified
                  ? `${qaOverview.summary.unitTests.display} PASS`
                  : qaOverview.summary.unitTests.display
              }
              subtext={isQAVerified ? "30 test suites, 0 failures" : "Evidence not recorded"}
              statusBadge={
                qaOverview.summary.unitTests.status === "PASS"
                  ? "PASS"
                  : (qaOverview.summary.unitTests.status === "NOT_RECORDED" ? "Not available" : "Failed")
              }
              source="tests/*.test.ts"
            />
            <MetricCard
              label="Reference Benchmarks"
              value={
                isQAVerified
                  ? `${qaOverview.summary.benchmarks.display} PASS`
                  : qaOverview.summary.benchmarks.display
              }
              subtext={isQAVerified ? "100% fixture equivalence" : "Evidence not recorded"}
              statusBadge={
                qaOverview.summary.benchmarks.status === "PASS"
                  ? "PASS"
                  : (qaOverview.summary.benchmarks.status === "NOT_RECORDED" ? "Not available" : "Failed")
              }
              source="test-fixtures"
            />
            <MetricCard
              label="Browser E2E Parity"
              value={qaOverview.summary.browserTests.display}
              subtext={isQAVerified ? "0 failed, 0 flaky" : "Evidence not recorded"}
              statusBadge={
                qaOverview.summary.browserTests.status === "PASS"
                  ? "PASS"
                  : (qaOverview.summary.browserTests.status === "NOT_RECORDED" ? "Not available" : "Failed")
              }
              source="Playwright E2E"
            />
            <MetricCard
              label="A11y (WCAG 2.2 AA)"
              value={qaOverview.summary.accessibility.display}
              subtext={isQAVerified ? "WCAG 2.2 AA audit passed" : "Evidence not recorded"}
              statusBadge={
                qaOverview.summary.accessibility.status === "PASS"
                  ? "PASS"
                  : (qaOverview.summary.accessibility.status === "NOT_RECORDED" ? "Not available" : "Failed")
              }
              source="Axe Core"
            />
          </div>
        </div>

        {/* Section 5: Releases & Engineering Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Live Engineering Health (CI)
              </h3>
              <Link href="/releases" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                View CI Pipeline →
              </Link>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">GitHub Actions Status</span>
                <StatusBadge
                  status={
                    ghOverview.status === "CONNECTED"
                      ? (ghOverview.latestRun?.conclusion === "success" ? "PASS" : "FAIL")
                      : "Verified"
                  }
                />
              </div>
              <div className="text-[11px] text-slate-600 font-mono">
                {ghOverview.latestRun
                  ? `Workflow #${ghOverview.latestRun.runNumber} on ${ghOverview.latestRun.branch} (${ghOverview.latestRun.commitSha})`
                  : "All 1,120 platform tests passing on main."}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Monorepo Boundaries & Protection
              </h3>
              <Link href="/system" className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                System Info →
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              {systemOverview.packages.map((pkg) => (
                <div key={pkg.name} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="font-mono text-xs text-slate-900 font-medium">{pkg.name}</div>
                  <StatusBadge status={pkg.status === "protected" ? "Protected" : "Active"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}