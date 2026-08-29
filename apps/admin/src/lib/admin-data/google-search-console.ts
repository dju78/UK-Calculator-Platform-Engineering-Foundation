import { createSign } from "node:crypto";
import type { ExternalProviderStatus } from "./provider-types";

export type SearchConsolePeriod = "24h" | "7d" | "30d";

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

export interface QueryPagePairMetric {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
}

export interface SearchAnalyticsQueryOptions {
  dimensions?: ("query" | "page" | "country" | "device" | "date")[];
  startDate?: string;
  endDate?: string;
  countryFilter?: string; // e.g. "gbr"
  deviceFilter?: "DESKTOP" | "MOBILE" | "TABLET";
  pageFilter?: string;
  queryFilter?: string;
  rowLimit?: number; // 10..25000
  startRow?: number; // pagination
}

export interface AdminGoogleSearchOverview {
  provider: "Google Search Console";
  propertyUrl: string;
  period: SearchConsolePeriod;
  status: ExternalProviderStatus;
  statusLabel: string;
  isConfigured: boolean;
  isConnected: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  totalClicks: number | null;
  totalImpressions: number | null;
  averageCtr: string | null;
  averagePosition: string | null;
  topQueries: SearchQueryMetric[];
  topPages: SearchPageMetric[];
  countries: SearchCountryMetric[];
  devices: SearchDeviceMetric[];
  dateRange: {
    startDate: string;
    endDate: string;
    label: string;
    dataLatencyNote: string;
  };
  lastPeriod: string;
  lastUpdated: string;
  notes: string;
}

export function getGoogleSearchConsoleConfig() {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || "https://ukcalc.jomovate.com/";
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL)?.trim() || "";
  const rawKey = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_PRIVATE_KEY)?.trim() || "";

  return {
    siteUrl,
    clientEmail,
    privateKey: rawKey ? formatPEMPrivateKey(rawKey) : "",
    isConfigured: Boolean(clientEmail && rawKey),
  };
}

export function formatPEMPrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n");
  key = key.replace(/\r/g, "");
  return key;
}

export function createGoogleServiceAccountJwt(
  clientEmail: string,
  privateKeyPem: string,
  scope: string = "https://www.googleapis.com/auth/webmasters.readonly"
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: clientEmail,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = signer.sign(privateKeyPem, "base64url");

  return `${unsignedToken}.${signature}`;
}

export async function fetchGoogleOAuthAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<{ accessToken: string } | { error: string; statusCode: number }> {
  try {
    const jwt = createGoogleServiceAccountJwt(clientEmail, privateKeyPem);
    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("assertion", jwt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "UKCalc-Admin-Console/0.2.0",
      },
      body: params.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorDesc = errorJson.error_description || errorJson.error || `HTTP ${res.status}`;
      return { error: errorDesc, statusCode: res.status };
    }

    const data = await res.json();
    if (!data || !data.access_token) {
      return { error: "Missing access_token in token response", statusCode: 500 };
    }

    return { accessToken: data.access_token };
  } catch (err: any) {
    return {
      error: err.name === "AbortError" ? "Token exchange timed out" : err.message || "Network error",
      statusCode: 504,
    };
  }
}

export function calculateGscDateRange(period: SearchConsolePeriod = "30d"): {
  startDate: string;
  endDate: string;
  label: string;
  dataLatencyNote: string;
} {
  const now = new Date();
  const lagDays = 3; // 3 days latency for finalized Search Console data

  const end = new Date(now);
  end.setDate(end.getDate() - lagDays);

  const start = new Date(end);
  if (period === "24h") {
    start.setDate(end.getDate());
  } else if (period === "7d") {
    start.setDate(end.getDate() - 6);
  } else {
    start.setDate(end.getDate() - 27);
  }

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const startDateStr = formatDate(start);
  const endDateStr = formatDate(end);

  const dataLatencyNote =
    "Finalized Search Console data (2-3 day latency; real-time search data is not supported by Google Search Console API).";

  const label =
    period === "24h"
      ? `Latest Finalized Day (${endDateStr})`
      : period === "7d"
      ? `Last 7 Finalized Days (${startDateStr} to ${endDateStr})`
      : `Last 28 Finalized Days (${startDateStr} to ${endDateStr})`;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    label,
    dataLatencyNote,
  };
}

export async function queryGoogleSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimension: "query" | "page"
): Promise<{ rows?: any[]; error?: string; statusCode?: number }> {
  try {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const body = {
      startDate,
      endDate,
      dimensions: [dimension],
      rowLimit: 10,
    };

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": "UKCalc-Admin-Console/0.2.0",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        next: { revalidate: 300 },
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const msg = errorJson.error?.message || errorJson.error_description || `HTTP ${res.status}`;
      return { error: msg, statusCode: res.status };
    }

    const data = await res.json();
    return { rows: data.rows || [] };
  } catch (err: any) {
    return {
      error: err.name === "AbortError" ? "GSC query timed out" : err.message || "Network error",
      statusCode: 504,
    };
  }
}

export function calculateImpressionWeightedPosition(
  items: { position?: number; impressions?: number }[] = []
): number {
  if (!items || items.length === 0) return 0;
  let totalWeighted = 0;
  let totalImpressions = 0;
  let sumPos = 0;

  for (const item of items) {
    const pos = typeof item.position === "number" ? item.position : 0;
    const imp = typeof item.impressions === "number" ? item.impressions : 0;
    totalWeighted += pos * imp;
    totalImpressions += imp;
    sumPos += pos;
  }

  if (totalImpressions === 0) {
    return Math.round((sumPos / items.length) * 10) / 10;
  }

  return Math.round((totalWeighted / totalImpressions) * 10) / 10;
}

export async function queryGoogleSearchAnalyticsAdvanced(
  accessToken: string,
  siteUrl: string,
  options: SearchAnalyticsQueryOptions = {}
): Promise<{
  rows?: any[];
  queryPagePairs?: QueryPagePairMetric[];
  countries?: SearchCountryMetric[];
  devices?: SearchDeviceMetric[];
  weightedPosition?: number;
  totalClicks?: number;
  totalImpressions?: number;
  averageCtr?: string;
  error?: string;
  statusCode?: number;
}> {
  try {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const body: Record<string, any> = {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions || ["query"],
      rowLimit: Math.min(options.rowLimit || 25, 25000),
      startRow: options.startRow || 0,
    };

    const filters: any[] = [];

    if (options.countryFilter) {
      filters.push({
        dimension: "country",
        operator: "equals",
        expression: options.countryFilter.toLowerCase(),
      });
    }

    if (options.deviceFilter) {
      filters.push({
        dimension: "device",
        operator: "equals",
        expression: options.deviceFilter.toUpperCase(),
      });
    }

    if (options.pageFilter) {
      filters.push({
        dimension: "page",
        operator: "contains",
        expression: options.pageFilter,
      });
    }

    if (options.queryFilter) {
      filters.push({
        dimension: "query",
        operator: "contains",
        expression: options.queryFilter.toLowerCase(),
      });
    }

    if (filters.length > 0) {
      body.dimensionFilterGroups = [{ filters }];
    }

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "User-Agent": "UKCalc-Admin-Console/0.2.0",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        next: { revalidate: 300 },
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const msg = errorJson.error?.message || errorJson.error_description || `HTTP ${res.status}`;
      return { error: msg, statusCode: res.status };
    }

    const data = await res.json();
    const rows = data.rows || [];

    const dims = options.dimensions || ["query"];
    const isQueryPage = dims.includes("query") && dims.includes("page");

    let totalClicks = 0;
    let totalImpressions = 0;
    const queryPagePairs: QueryPagePairMetric[] = [];
    const countries: SearchCountryMetric[] = [];
    const devices: SearchDeviceMetric[] = [];

    for (const r of rows) {
      const clicks = typeof r.clicks === "number" ? r.clicks : 0;
      const impressions = typeof r.impressions === "number" ? r.impressions : 0;
      const ctr = typeof r.ctr === "number" ? `${(r.ctr * 100).toFixed(1)}%` : "0.0%";
      const position = typeof r.position === "number" ? Math.round(r.position * 10) / 10 : 0;

      totalClicks += clicks;
      totalImpressions += impressions;

      if (isQueryPage) {
        const queryIdx = dims.indexOf("query");
        const pageIdx = dims.indexOf("page");
        const q = Array.isArray(r.keys) ? r.keys[queryIdx] || "Unknown" : "Unknown";
        const p = Array.isArray(r.keys) ? r.keys[pageIdx] || "Unknown" : "Unknown";
        queryPagePairs.push({
          query: q,
          page: p,
          clicks,
          impressions,
          ctr,
          position,
        });
      } else if (dims.length === 1 && dims[0] === "country") {
        const c = Array.isArray(r.keys) ? r.keys[0] || "Unknown" : r.keys || "Unknown";
        countries.push({
          country: c.toUpperCase() === "GBR" ? "United Kingdom (GBR)" : c.toUpperCase(),
          clicks,
          impressions,
        });
      } else if (dims.length === 1 && dims[0] === "device") {
        const d = Array.isArray(r.keys) ? r.keys[0] || "Unknown" : r.keys || "Unknown";
        devices.push({
          device: d.toUpperCase(),
          clicks,
          impressions,
        });
      }
    }

    const weightedPosition = calculateImpressionWeightedPosition(rows);
    const averageCtr = totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%` : "0.0%";

    return {
      rows,
      queryPagePairs: isQueryPage ? queryPagePairs : undefined,
      countries: dims.includes("country") ? countries : undefined,
      devices: dims.includes("device") ? devices : undefined,
      weightedPosition,
      totalClicks,
      totalImpressions,
      averageCtr,
    };
  } catch (err: any) {
    return {
      error: err.name === "AbortError" ? "GSC query timed out" : err.message || "Network error",
      statusCode: 504,
    };
  }
}

export function mapGoogleSearchAnalyticsResponse(
  queryRows: any[] = [],
  pageRows: any[] = [],
  propertyUrl: string = "https://ukcalc.jomovate.com/",
  period: SearchConsolePeriod = "30d",
  dateRangeOverride?: any
): AdminGoogleSearchOverview {
  const dateRange = dateRangeOverride || calculateGscDateRange(period);

  let totalClicks = 0;
  let totalImpressions = 0;
  let sumCtr = 0;

  const topQueries: SearchQueryMetric[] = [];
  const topPages: SearchPageMetric[] = [];

  for (const row of queryRows) {
    const clicks = typeof row.clicks === "number" ? row.clicks : 0;
    const impressions = typeof row.impressions === "number" ? row.impressions : 0;
    const ctr = typeof row.ctr === "number" ? `${(row.ctr * 100).toFixed(1)}%` : "0.0%";
    const position = typeof row.position === "number" ? Math.round(row.position * 10) / 10 : 0;

    totalClicks += clicks;
    totalImpressions += impressions;
    sumCtr += typeof row.ctr === "number" ? row.ctr : 0;

    const key = Array.isArray(row.keys) ? row.keys[0] : row.keys || "Unknown";
    topQueries.push({
      query: key,
      clicks,
      impressions,
      ctr,
      position,
    });
  }

  for (const row of pageRows) {
    const clicks = typeof row.clicks === "number" ? row.clicks : 0;
    const impressions = typeof row.impressions === "number" ? row.impressions : 0;
    const ctr = typeof row.ctr === "number" ? `${(row.ctr * 100).toFixed(1)}%` : "0.0%";
    const position = typeof row.position === "number" ? Math.round(row.position * 10) / 10 : 0;

    const key = Array.isArray(row.keys) ? row.keys[0] : row.keys || "Unknown";
    topPages.push({
      page: key,
      clicks,
      impressions,
      ctr,
      position,
    });
  }

  const count = queryRows.length || 1;
  const avgCtrPct =
    totalImpressions > 0
      ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%`
      : `${((sumCtr / count) * 100).toFixed(1)}%`;
  
  // Truthful impression-weighted average position
  const activeRows = queryRows.length > 0 ? queryRows : pageRows;
  const avgPos = calculateImpressionWeightedPosition(activeRows);

  const isZeroData = queryRows.length === 0 && pageRows.length === 0;

  return {
    provider: "Google Search Console",
    propertyUrl,
    period,
    status: "CONNECTED",
    statusLabel: isZeroData
      ? "Google Search Console Connected (Zero Data Recorded)"
      : "Google Search Console Connected",
    isConfigured: true,
    isConnected: true,
    errorCode: null,
    errorMessage: null,
    totalClicks: isZeroData ? 0 : totalClicks,
    totalImpressions: isZeroData ? 0 : totalImpressions,
    averageCtr: isZeroData ? "0.0%" : avgCtrPct,
    averagePosition: isZeroData ? "0.0" : avgPos.toFixed(1),
    topQueries: topQueries.slice(0, 10),
    topPages: topPages.slice(0, 10),
    countries: [],
    devices: [],
    dateRange,
    lastPeriod: dateRange.label,
    lastUpdated: new Date().toISOString(),
    notes:
      "Official organic Google Search performance metrics from Google Search Console API (webmasters.readonly).",
  };
}

export function buildEmptyGoogleSearchOverview(
  propertyUrl: string = "https://ukcalc.jomovate.com/",
  status: ExternalProviderStatus = "NOT_CONFIGURED",
  statusLabel?: string,
  errorCode: string | null = null,
  errorMessage: string | null = null,
  period: SearchConsolePeriod = "30d"
): AdminGoogleSearchOverview {
  const config = getGoogleSearchConsoleConfig();
  const dateRange = calculateGscDateRange(period);

  let finalStatus = status;
  let finalLabel = statusLabel;

  if (!finalLabel) {
    if (status === "AUTH_ERROR") {
      finalLabel = "Google Authentication Failed";
    } else if (status === "PERMISSION_DENIED") {
      finalLabel = "Search Console Permission Denied";
    } else if (status === "RATE_LIMITED") {
      finalLabel = "Google API Rate Limit Exceeded";
    } else if (status === "QUERY_ERROR") {
      finalLabel = "Search Analytics Query Error";
    } else if (status === "UNAVAILABLE") {
      finalLabel = "Search Console API Unreachable";
    } else if (config.isConfigured) {
      finalStatus = "CONFIGURED";
      finalLabel = "Credentials Configured (Awaiting Sync)";
    } else {
      finalStatus = "NOT_CONFIGURED";
      finalLabel = "Google Search Console — Not Configured";
    }
  }

  let finalErrorMsg = errorMessage;
  if (!finalErrorMsg) {
    if (finalStatus === "NOT_CONFIGURED") {
      finalErrorMsg =
        "Google Search Console credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY) are not configured in environment variables.";
    } else if (finalStatus === "AUTH_ERROR") {
      finalErrorMsg =
        "Failed to authenticate with Google OAuth2 using the configured service account credentials.";
    } else if (finalStatus === "PERMISSION_DENIED") {
      finalErrorMsg =
        `Service account email does not have Read permission on property ${propertyUrl} in Google Search Console.`;
    }
  }

  return {
    provider: "Google Search Console",
    propertyUrl: config.siteUrl || propertyUrl,
    period,
    status: finalStatus,
    statusLabel: finalLabel,
    isConfigured: config.isConfigured,
    isConnected: false,
    errorCode: errorCode || (finalStatus !== "CONFIGURED" ? finalStatus : null),
    errorMessage: finalErrorMsg,
    totalClicks: null,
    totalImpressions: null,
    averageCtr: null,
    averagePosition: null,
    topQueries: [],
    topPages: [],
    countries: [],
    devices: [],
    dateRange,
    lastPeriod: dateRange.label,
    lastUpdated: "Not available",
    notes: config.isConfigured
      ? "Google Search Console service account configured. Read-only search performance metrics will sync automatically."
      : "Google Search Console is not connected. To connect, provision GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY.",
  };
}

export async function fetchLiveGoogleSearchOverview(
  period: SearchConsolePeriod = "30d",
  siteUrlOverride?: string
): Promise<AdminGoogleSearchOverview> {
  const config = getGoogleSearchConsoleConfig();
  const siteUrl = siteUrlOverride?.trim() || config.siteUrl || "https://ukcalc.jomovate.com/";

  if (!config.clientEmail || !config.privateKey) {
    return buildEmptyGoogleSearchOverview(
      siteUrl,
      "NOT_CONFIGURED",
      "Google Search Console — Not Configured",
      "NOT_CONFIGURED",
      "Google Search Console credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY) are not provisioned in environment variables.",
      period
    );
  }

  // 1. Authenticate & Obtain OAuth2 Access Token
  const tokenResult = await fetchGoogleOAuthAccessToken(config.clientEmail, config.privateKey);
  if ("error" in tokenResult) {
    const isAuth = tokenResult.statusCode === 400 || tokenResult.statusCode === 401;
    return buildEmptyGoogleSearchOverview(
      siteUrl,
      isAuth ? "AUTH_ERROR" : "UNAVAILABLE",
      isAuth ? "Google Authentication Failed" : "OAuth Token Exchange Failed",
      isAuth ? "AUTH_ERROR" : "NETWORK_ERROR",
      tokenResult.error,
      period
    );
  }

  const accessToken = tokenResult.accessToken;
  const dateRange = calculateGscDateRange(period);

  // 2. Query Search Analytics for top queries
  const queryResult = await queryGoogleSearchAnalytics(
    accessToken,
    siteUrl,
    dateRange.startDate,
    dateRange.endDate,
    "query"
  );

  if (queryResult.error) {
    if (queryResult.statusCode === 403) {
      return buildEmptyGoogleSearchOverview(
        siteUrl,
        "PERMISSION_DENIED",
        "Search Console Permission Denied",
        "PERMISSION_DENIED",
        `Service account email (${config.clientEmail}) does not have Read permission on property ${siteUrl} in Google Search Console.`,
        period
      );
    }
    if (queryResult.statusCode === 429) {
      return buildEmptyGoogleSearchOverview(
        siteUrl,
        "RATE_LIMITED",
        "Google API Rate Limit Exceeded",
        "RATE_LIMITED",
        "Search Console API rate limit exceeded. Retrying shortly.",
        period
      );
    }
    if (queryResult.statusCode === 400) {
      return buildEmptyGoogleSearchOverview(
        siteUrl,
        "QUERY_ERROR",
        "Search Analytics Query Error",
        "QUERY_ERROR",
        queryResult.error,
        period
      );
    }
    return buildEmptyGoogleSearchOverview(
      siteUrl,
      "UNAVAILABLE",
      "Google Search Console Unreachable",
      "NETWORK_ERROR",
      queryResult.error,
      period
    );
  }

  // 3. Query Search Analytics for top landing pages
  const pageResult = await queryGoogleSearchAnalytics(
    accessToken,
    siteUrl,
    dateRange.startDate,
    dateRange.endDate,
    "page"
  );

  return mapGoogleSearchAnalyticsResponse(
    queryResult.rows || [],
    pageResult.rows || [],
    siteUrl,
    period,
    dateRange
  );
}

export async function getAdminGoogleSearchOverview(
  period: SearchConsolePeriod = "30d"
): Promise<AdminGoogleSearchOverview> {
  return fetchLiveGoogleSearchOverview(period);
}

export function getSafeGoogleSearchStatus(overview: AdminGoogleSearchOverview) {
  return {
    provider: overview.provider,
    propertyUrl: overview.propertyUrl,
    period: overview.period,
    status: overview.status,
    statusLabel: overview.statusLabel,
    isConfigured: overview.isConfigured,
    isConnected: overview.isConnected,
    errorCode: overview.errorCode,
    errorMessage: overview.errorMessage,
    totalClicks: overview.totalClicks,
    totalImpressions: overview.totalImpressions,
    averageCtr: overview.averageCtr,
    averagePosition: overview.averagePosition,
    topQueries: overview.topQueries,
    topPages: overview.topPages,
    dateRange: overview.dateRange,
    lastPeriod: overview.lastPeriod,
    lastUpdated: overview.lastUpdated,
    notes: overview.notes,
  };
}

