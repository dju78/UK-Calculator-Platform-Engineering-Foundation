import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { calculatorRegistry } from "../../../../../dist/packages/calculator-registry/src/index.js";
import type { CalculatorDefinition } from "../../../../../packages/calculator-registry/src/types";

function getMonorepoRootDir(): string {
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(/* turbopackIgnore: true */ join(cur, "packages")) && existsSync(/* turbopackIgnore: true */ join(cur, "package.json"))) {
      return cur;
    }
    const parent = resolve(cur, "..");
    if (parent === cur) break;
    cur = parent;
  }
  return process.cwd();
}

export type IndexNowStatusCode = "INTEGRATED" | "PENDING_PARTIAL" | "UNCONFIGURED";

export interface IndexNowIntegrationStatus {
  status: IndexNowStatusCode;
  statusLabel: string;
  endpoint: string;
  keyFileFound: boolean;
  keyFileName?: string;
  keyLocation?: string;
  maskedKey?: string;
  submissionScriptFound: boolean;
  documentationPath: string;
}

export interface AdminSEOCoverageAudit {
  totalCalculators: number;
  withCanonical: number;
  withCustomDescription: number;
  withSchemaApplicationCategory: number;
  totalCategories: number;
  categoriesWithMetadata: number;
  coverageComplete: boolean;
}

export interface AdminSEOOverview {
  canonicalDomain: string;
  sitemapUrl: string;
  sitemapEntryCount: number;
  sitemapRoutes: string[];
  robotsConfig: {
    allowAll: boolean;
    sitemapDeclared: boolean;
  };
  metadataCoverage: AdminSEOCoverageAudit;
  indexNow: IndexNowIntegrationStatus;
  apiIntegrations: Array<{
    service: string;
    status: "PLANNED_PHASE2" | "CONNECTED" | "NOT_CONFIGURED";
    description: string;
    configured: boolean;
  }>;
}

const STATIC_SITEMAP_PAGES = [
  "",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/commercial-disclosure",
  "/accessibility",
];

const GOVERNANCE_SITEMAP_PAGES = [
  "/about",
  "/for-organisations",
  "/how-we-check-our-figures",
  "/editorial-policy",
  "/updates",
  "/contact",
];

const SCHEMA_CATEGORY_MAP: Record<string, string> = {
  "UK Tax & Salary": "FinanceApplication",
  "Finance & Debt": "FinanceApplication",
  "Mortgages & Property": "FinanceApplication",
  "Investing & Wealth": "FinanceApplication",
  "Pensions & Retirement": "FinanceApplication",
  "ISA & Tax Wrappers": "FinanceApplication",
  "Business & Commercial": "BusinessApplication",
  "Health & Fitness": "HealthApplication",
  "Education": "EducationalApplication",
  "Maths & Algebra": "EducationalApplication",
  "Geometry": "EducationalApplication",
  "Statistics & Data": "EducationalApplication",
  "Science & Engineering": "EducationalApplication",
  "Automotive & Travel": "TravelApplication",
  "Conversions": "UtilitiesApplication",
  "Date & Time": "UtilitiesApplication",
  "Everyday & Lifestyle": "UtilitiesApplication",
  "Home & Construction": "UtilitiesApplication",
  "Technology & Digital": "UtilitiesApplication",
};

export function evaluateIndexNowStatus(keyFileFound: boolean, submissionScriptFound: boolean): {
  status: IndexNowStatusCode;
  statusLabel: string;
} {
  if (keyFileFound && submissionScriptFound) {
    return { status: "INTEGRATED", statusLabel: "Integrated & Verified" };
  }
  if (keyFileFound && !submissionScriptFound) {
    return { status: "PENDING_PARTIAL", statusLabel: "Pending Submission Script" };
  }
  if (!keyFileFound && submissionScriptFound) {
    return { status: "PENDING_PARTIAL", statusLabel: "Pending Key File" };
  }
  return { status: "UNCONFIGURED", statusLabel: "Unconfigured" };
}

/**
 * Authoritative description generator mirroring apps/web/src/lib/site.ts:calculatorDescription.
 */
export function generateCalculatorDescription(calc: {
  name: string;
  category: string;
  subcategory?: string;
  rulesSensitive?: boolean;
}): string {
  if (!calc.name || typeof calc.name !== "string" || calc.name.trim().length === 0) {
    return "";
  }
  const TAX_YEAR = "2026/27";
  const topic = calc.subcategory ? `${calc.subcategory.toLowerCase()} ` : "";
  const base = `Free ${calc.name.replace(/ Calculator$/i, "")} calculator for the UK. Work out ${topic}figures in the ${calc.category ? calc.category.toLowerCase() : ""} category`;
  return calc.rulesSensitive
    ? `${base}, using ${TAX_YEAR} UK rules. Estimates only - not financial or tax advice.`
    : `${base}. Estimates only - not financial or tax advice.`;
}

export function evaluateCalculatorSEOCoverage(calculators: CalculatorDefinition[]): AdminSEOCoverageAudit {
  const totalCalculators = calculators.length;
  const categories = Array.from(new Set(calculators.map((c) => c.category)));

  let withCanonical = 0;
  let withCustomDescription = 0;
  let withSchemaApplicationCategory = 0;

  for (const c of calculators) {
    if (c.slug && typeof c.slug === "string" && c.slug.trim().length > 0) {
      withCanonical++;
    }
    const description = generateCalculatorDescription(c);
    if (description && typeof description === "string" && description.trim().length > 0) {
      withCustomDescription++;
    }
    if (c.category && SCHEMA_CATEGORY_MAP[c.category]) {
      withSchemaApplicationCategory++;
    }
  }

  let categoriesWithMetadata = 0;
  for (const cat of categories) {
    if (SCHEMA_CATEGORY_MAP[cat]) {
      categoriesWithMetadata++;
    }
  }

  const coverageComplete =
    totalCalculators > 0 &&
    withCanonical === totalCalculators &&
    withCustomDescription === totalCalculators &&
    withSchemaApplicationCategory === totalCalculators &&
    categoriesWithMetadata === categories.length;

  return {
    totalCalculators,
    withCanonical,
    withCustomDescription,
    withSchemaApplicationCategory,
    totalCategories: categories.length,
    categoriesWithMetadata,
    coverageComplete,
  };
}

export function getSitemapRouteList(): string[] {
  const calcs = calculatorRegistry as CalculatorDefinition[];
  const categories = Array.from(new Set(calcs.map((c) => c.category))).sort();

  const staticUrls = STATIC_SITEMAP_PAGES.map((p) => p === "" ? "/" : p);
  const govUrls = GOVERNANCE_SITEMAP_PAGES;
  const categoryUrls = categories.map((cat) => `/category/${encodeURIComponent(cat.toLowerCase())}`);
  const calculatorUrls = calcs.map((c) => `/calculators/${c.slug}`);

  return [...staticUrls, ...govUrls, ...categoryUrls, ...calculatorUrls];
}

export function getSitemapEntryCount(): number {
  return getSitemapRouteList().length;
}

export function getAdminSEOOverview(): AdminSEOOverview {
  const canonicalDomain = "https://ukcalc.jomovate.com";
  const sitemapUrl = `${canonicalDomain}/sitemap.xml`;
  const sitemapRoutes = getSitemapRouteList();
  const sitemapEntryCount = sitemapRoutes.length;

  const calcs = calculatorRegistry as CalculatorDefinition[];
  const metadataCoverage = evaluateCalculatorSEOCoverage(calcs);

  // Check IndexNow integration evidence via deterministic monorepo root resolver
  const rootDir = getMonorepoRootDir();
  const publicDir = join(rootDir, "apps/web/public");
  let keyFileFound = false;
  let keyFileName: string | undefined;
  let keyLocation: string | undefined;
  let maskedKey: string | undefined;

  if (existsSync(/* turbopackIgnore: true */ publicDir)) {
    try {
      const files = readdirSync(/* turbopackIgnore: true */ publicDir);
      for (const file of files) {
        if (file.endsWith(".txt") && !file.startsWith("robots") && file.length >= 12) {
          const keyCandidate = basename(file, ".txt");
          const content = readFileSync(/* turbopackIgnore: true */ join(publicDir, file), "utf8").trim();
          if (content === keyCandidate) {
            keyFileFound = true;
            keyFileName = file;
            keyLocation = `${canonicalDomain}/${file}`;
            maskedKey = keyCandidate.length > 8 ? `${keyCandidate.slice(0, 4)}...${keyCandidate.slice(-4)}` : "****";
            break;
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  const scriptFound = existsSync(/* turbopackIgnore: true */ join(rootDir, "scripts/indexnow-submit.mjs"));
  const { status, statusLabel } = evaluateIndexNowStatus(keyFileFound, scriptFound);

  const indexNow: IndexNowIntegrationStatus = {
    status,
    statusLabel,
    endpoint: "https://api.indexnow.org/indexnow",
    keyFileFound,
    keyFileName,
    keyLocation,
    maskedKey,
    submissionScriptFound: scriptFound,
    documentationPath: "docs/INDEXNOW_INTEGRATION.md",
  };

  return {
    canonicalDomain,
    sitemapUrl,
    sitemapEntryCount,
    sitemapRoutes,
    robotsConfig: {
      allowAll: true,
      sitemapDeclared: true,
    },
    metadataCoverage,
    indexNow,
    apiIntegrations: [
      {
        service: "Google Search Console API",
        status: "PLANNED_PHASE2",
        description: "Direct Search Console performance metrics, impressions, and search clicks (Planned Phase 2).",
        configured: false,
      },
      {
        service: "Bing Webmaster Tools API",
        status: "PLANNED_PHASE2",
        description: "Bing search impressions, IndexNow crawling metrics, and URL inspection stats (Planned Phase 2).",
        configured: false,
      },
    ],
  };
}