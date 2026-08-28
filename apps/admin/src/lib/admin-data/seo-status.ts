import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { calculatorRegistry } from "../../../../../dist/packages/calculator-registry/src/index.js";
import type { CalculatorDefinition } from "../../../../../packages/calculator-registry/src/types";

export interface IndexNowIntegrationStatus {
  status: "INTEGRATED" | "PENDING_KEY" | "UNCONFIGURED";
  endpoint: string;
  keyFileFound: boolean;
  keyFileName?: string;
  keyLocation?: string;
  maskedKey?: string;
  submissionScriptFound: boolean;
  documentationPath: string;
}

export interface AdminSEOOverview {
  canonicalDomain: string;
  sitemapUrl: string;
  sitemapEntryCount: number;
  robotsConfig: {
    allowAll: boolean;
    sitemapDeclared: boolean;
  };
  metadataCoverage: {
    totalCalculators: number;
    withCanonical: number;
    withCustomDescription: number;
    withSchemaApplicationCategory: number;
    totalCategories: number;
    categoriesWithMetadata: number;
  };
  indexNow: IndexNowIntegrationStatus;
  apiIntegrations: Array<{
    service: string;
    status: "PLANNED_PHASE2" | "CONNECTED" | "NOT_CONFIGURED";
    description: string;
    configured: boolean;
  }>;
}

export function getAdminSEOOverview(): AdminSEOOverview {
  const canonicalDomain = "https://ukcalc.jomovate.com";
  const sitemapUrl = `${canonicalDomain}/sitemap.xml`;

  const calcs = calculatorRegistry as CalculatorDefinition[];
  const totalCalculators = calcs.length;
  const categories = Array.from(new Set(calcs.map((c: CalculatorDefinition) => c.category)));
  const staticAndGovernanceRoutes = 5; // home + 4 legal/governance
  const sitemapEntryCount = totalCalculators + categories.length + staticAndGovernanceRoutes;

  // Check IndexNow integration evidence
  const publicDir = join(process.cwd(), "apps/web/public");
  let keyFileFound = false;
  let keyFileName: string | undefined;
  let keyLocation: string | undefined;
  let maskedKey: string | undefined;

  if (existsSync(publicDir)) {
    try {
      const files = readdirSync(publicDir);
      for (const file of files) {
        if (file.endsWith(".txt") && !file.startsWith("robots") && file.length >= 12) {
          const keyCandidate = basename(file, ".txt");
          const content = readFileSync(join(publicDir, file), "utf8").trim();
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

  const scriptFound = existsSync(join(process.cwd(), "scripts/indexnow-submit.mjs"));

  const indexNow: IndexNowIntegrationStatus = {
    status: keyFileFound && scriptFound ? "INTEGRATED" : keyFileFound ? "INTEGRATED" : "UNCONFIGURED",
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
    robotsConfig: {
      allowAll: true,
      sitemapDeclared: true,
    },
    metadataCoverage: {
      totalCalculators,
      withCanonical: totalCalculators,
      withCustomDescription: totalCalculators,
      withSchemaApplicationCategory: totalCalculators,
      totalCategories: categories.length,
      categoriesWithMetadata: categories.length,
    },
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