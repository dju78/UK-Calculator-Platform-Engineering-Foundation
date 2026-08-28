import type { ExternalProviderStatus } from "./provider-types";

export interface SearchQueryMetric {
  query: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
}

export interface SearchPageMetric {
  page: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
}

export interface SearchCountryMetric {
  country: string;
  clicks: number;
  impressions: number;
}

export interface SearchDeviceMetric {
  device: string;
  clicks: number;
  impressions: number;
}

export interface AdminGoogleSearchOverview {
  provider: "Google Search Console";
  propertyUrl: string;
  status: ExternalProviderStatus;
  statusLabel: string;
  isConfigured: boolean;
  totalClicks: number | null;
  totalImpressions: number | null;
  averageCtr: string | null;
  averagePosition: string | null;
  topQueries: SearchQueryMetric[];
  topPages: SearchPageMetric[];
  countries: SearchCountryMetric[];
  devices: SearchDeviceMetric[];
  lastPeriod: string;
  lastUpdated: string;
  notes: string;
}

export function getGoogleSearchConsoleConfig() {
  return {
    siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || "https://ukcalc.jomovate.com/",
    clientEmail: (process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)?.trim(),
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY)?.trim(),
  };
}

export function mapGoogleSearchAnalyticsResponse(
  rawData: any,
  propertyUrl: string = "https://ukcalc.jomovate.com/"
): AdminGoogleSearchOverview {
  if (!rawData || typeof rawData !== "object" || !Array.isArray(rawData.rows)) {
    return buildEmptyGoogleSearchOverview(propertyUrl, "ERROR", "Invalid Google Search Console API response");
  }

  const rows = rawData.rows;
  let totalClicks = 0;
  let totalImpressions = 0;
  let sumCtr = 0;
  let sumPos = 0;

  const topQueries: SearchQueryMetric[] = [];
  const topPages: SearchPageMetric[] = [];
  const countries: SearchCountryMetric[] = [];
  const devices: SearchDeviceMetric[] = [];

  for (const row of rows) {
    const clicks = typeof row.clicks === "number" ? row.clicks : 0;
    const impressions = typeof row.impressions === "number" ? row.impressions : 0;
    const ctr = typeof row.ctr === "number" ? `${(row.ctr * 100).toFixed(1)}%` : "0.0%";
    const position = typeof row.position === "number" ? Math.round(row.position * 10) / 10 : 0;

    totalClicks += clicks;
    totalImpressions += impressions;
    sumCtr += typeof row.ctr === "number" ? row.ctr : 0;
    sumPos += position;

    const key = Array.isArray(row.keys) ? row.keys[0] : row.keys || "Unknown";
    topQueries.push({
      query: key,
      clicks,
      impressions,
      ctr,
      position,
    });
  }

  const count = rows.length || 1;
  const avgCtrPct = totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%` : `${((sumCtr / count) * 100).toFixed(1)}%`;
  const avgPos = Math.round((sumPos / count) * 10) / 10;

  return {
    provider: "Google Search Console",
    propertyUrl,
    status: "CONNECTED",
    statusLabel: "Google Search Console Connected",
    isConfigured: true,
    totalClicks,
    totalImpressions,
    averageCtr: avgCtrPct,
    averagePosition: avgPos.toFixed(1),
    topQueries: topQueries.slice(0, 10),
    topPages,
    countries,
    devices,
    lastPeriod: "Last 28 Days (Finalized Data)",
    lastUpdated: new Date().toISOString(),
    notes: "Official organic Google Search performance data from Google Search Console API (webmasters.readonly).",
  };
}

export function buildEmptyGoogleSearchOverview(
  propertyUrl: string = "https://ukcalc.jomovate.com/",
  status: ExternalProviderStatus = "NOT_CONFIGURED",
  statusLabel?: string
): AdminGoogleSearchOverview {
  const config = getGoogleSearchConsoleConfig();
  const isConfigured = !!(config.clientEmail && config.privateKey);

  let finalStatus = status;
  let finalLabel = statusLabel;

  if (!finalLabel) {
    if (isConfigured) {
      finalStatus = "CONFIGURED";
      finalLabel = "Credentials Configured (Awaiting Sync)";
    } else {
      finalStatus = "NOT_CONFIGURED";
      finalLabel = "Google Search Console — Not Connected";
    }
  }

  return {
    provider: "Google Search Console",
    propertyUrl: config.siteUrl || propertyUrl,
    status: finalStatus,
    statusLabel: finalLabel,
    isConfigured,
    totalClicks: null,
    totalImpressions: null,
    averageCtr: null,
    averagePosition: null,
    topQueries: [],
    topPages: [],
    countries: [],
    devices: [],
    lastPeriod: "Last 28 Days",
    lastUpdated: "Not available",
    notes: isConfigured
      ? "Google Search Console service account configured. Read-only search performance metrics will sync automatically."
      : "Google Search Console is not connected. To connect, provision GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.",
  };
}

export function getAdminGoogleSearchOverview(): AdminGoogleSearchOverview {
  return buildEmptyGoogleSearchOverview();
}
