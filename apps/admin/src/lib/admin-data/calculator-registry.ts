import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { calculatorRegistry } from "../../../../../packages/calculator-registry/src/index.js";
import type { CalculatorDefinition } from "../../../../../packages/calculator-registry/src/types.js";

export function getMonorepoRootDir(): string {
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ cur, "packages")) && existsSync(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ cur, "package.json"))) {
      return cur;
    }
    const parent = resolve(cur, "..");
    if (parent === cur) break;
    cur = parent;
  }
  return process.cwd();
}

export interface AdminCalculatorSummary {
  total: number;
  totalCategories: number;
  implemented: number;
  verified: number;
  rulesSensitive: number;
  waveCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  riskCounts: Record<string, number>;
}

export interface AdminCalculatorItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  launchWave: string;
  rulesSensitive: boolean;
  risk: "low" | "medium" | "high";
  benchmarkCount: number;
  status: string;
  implementationStatus: string;
  jurisdiction: string;
  publicUrl: string;
  canonicalRoute: string;
  hasSpec: boolean;
}

export interface AdminCalculatorDetail extends AdminCalculatorItem {
  version: string;
  specFile: string;
  aliases: string[];
  purpose?: string;
  assumptions?: string[];
  methodology?: string;
  sources?: string;
  inputs?: Array<{ name: string; label: string; type: string; default: string; notes?: string }>;
  outputs?: string[];
  relatedCalculators?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

const PUBLIC_BASE_URL = "https://ukcalc.jomovate.com";

export function getCalculatorSummary(): AdminCalculatorSummary {
  const waveCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const riskCounts: Record<string, number> = {};
  let implemented = 0;
  let verified = 0;
  let rulesSensitive = 0;

  for (const c of calculatorRegistry as CalculatorDefinition[]) {
    waveCounts[c.launchWave] = (waveCounts[c.launchWave] || 0) + 1;
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    riskCounts[c.risk] = (riskCounts[c.risk] || 0) + 1;
    if (c.implementationStatus === "implemented") implemented++;
    if (c.status === "verified") verified++;
    if (c.rulesSensitive) rulesSensitive++;
  }

  return {
    total: calculatorRegistry.length,
    totalCategories: Object.keys(categoryCounts).length,
    implemented,
    verified,
    rulesSensitive,
    waveCounts,
    categoryCounts,
    riskCounts,
  };
}

export function listAdminCalculators(filters?: {
  category?: string;
  launchWave?: string;
  risk?: string;
  rulesSensitive?: boolean;
  status?: string;
  implementationStatus?: string;
  jurisdiction?: string;
  search?: string;
}): AdminCalculatorItem[] {
  let list: CalculatorDefinition[] = [...(calculatorRegistry as CalculatorDefinition[])];

  if (filters) {
    if (filters.category && filters.category !== "all") {
      const cat = filters.category.toLowerCase();
      list = list.filter((c: CalculatorDefinition) => c.category.toLowerCase() === cat);
    }
    if (filters.launchWave && filters.launchWave !== "all") {
      list = list.filter((c: CalculatorDefinition) => c.launchWave === filters.launchWave);
    }
    if (filters.risk && filters.risk !== "all") {
      list = list.filter((c: CalculatorDefinition) => c.risk === filters.risk);
    }
    if (filters.status && filters.status !== "all") {
      list = list.filter((c: CalculatorDefinition) => c.status === filters.status);
    }
    if (filters.implementationStatus && filters.implementationStatus !== "all") {
      list = list.filter((c: CalculatorDefinition) => c.implementationStatus === filters.implementationStatus);
    }
    if (filters.jurisdiction && filters.jurisdiction !== "all") {
      list = list.filter((c: CalculatorDefinition) => (c.jurisdiction || "UK").toLowerCase() === filters.jurisdiction?.toLowerCase());
    }
    if (filters.rulesSensitive !== undefined) {
      list = list.filter((c: CalculatorDefinition) => c.rulesSensitive === filters.rulesSensitive);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (c: CalculatorDefinition) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.subcategory && c.subcategory.toLowerCase().includes(q))
      );
    }
  }

  const rootDir = getMonorepoRootDir();

  return list.map((c: CalculatorDefinition) => {
    const canonicalRoute = `/calculators/${c.slug}`;
    const publicUrl = `${PUBLIC_BASE_URL}${canonicalRoute}`;
    const specRelative = c.specFile || `docs/specs/${c.launchWave === "Wave 3" ? "wave3" : "wave2"}/${c.id}.md`;
    const hasSpec = existsSync(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ rootDir, specRelative));

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      subcategory: c.subcategory || "",
      launchWave: c.launchWave,
      rulesSensitive: !!c.rulesSensitive,
      risk: c.risk,
      benchmarkCount: c.benchmarkCount,
      status: c.status,
      implementationStatus: c.implementationStatus,
      jurisdiction: c.jurisdiction || "UK",
      publicUrl,
      canonicalRoute,
      hasSpec,
    };
  });
}

export function getAdminCalculatorDetail(slugOrId: string): AdminCalculatorDetail | null {
  const needle = slugOrId.trim().toLowerCase();
  const c = (calculatorRegistry as CalculatorDefinition[]).find(
    (item: CalculatorDefinition) => item.id.toLowerCase() === needle || item.slug === needle
  );

  if (!c) return null;

  const canonicalRoute = `/calculators/${c.slug}`;
  const publicUrl = `${PUBLIC_BASE_URL}${canonicalRoute}`;
  const specRelative = c.specFile || `docs/specs/${c.launchWave === "Wave 3" ? "wave3" : "wave2"}/${c.id}.md`;
  const rootDir = getMonorepoRootDir();
  const specPath = join(/*turbopackIgnore: true*/ rootDir, specRelative);

  let purpose: string | undefined;
  let assumptions: string[] | undefined;
  let methodology: string | undefined;
  let sources: string | undefined;
  let inputs: Array<{ name: string; label: string; type: string; default: string; notes?: string }> | undefined;
  let outputs: string[] | undefined;
  let relatedCalculators: string[] | undefined;
  let seoTitle: string | undefined;
  let seoDescription: string | undefined;

  if (existsSync(/*turbopackIgnore: true*/ specPath)) {
    try {
      const content = readFileSync(/*turbopackIgnore: true*/ specPath, "utf8");

      const purposeMatch = content.match(/## Purpose\s+([\s\S]*?)(?=\n## |\Z)/);
      if (purposeMatch) purpose = purposeMatch[1].trim();

      const methodMatch = content.match(/## Methodology\s+([\s\S]*?)(?=\n## |\Z)/);
      if (methodMatch) methodology = methodMatch[1].trim();

      const sourcesMatch = content.match(/## Source provenance|## Sources and Statutory References|## Rules and source dependencies\s+([\s\S]*?)(?=\n## |\Z)/);
      if (sourcesMatch) sources = sourcesMatch[1].trim();

      const assumptionsMatch = content.match(/## Assumptions\s+([\s\S]*?)(?=\n## |\Z)/);
      if (assumptionsMatch) {
        assumptions = assumptionsMatch[1]
          .split("\n")
          .map((l: string) => l.replace(/^[-*]\s+/, "").trim())
          .filter((l: string) => l.length > 0);
      }

      const relatedMatch = content.match(/## Related calculators\s+([\s\S]*?)(?=\n## |\Z)/);
      if (relatedMatch) {
        relatedCalculators = relatedMatch[1]
          .split("\n")
          .map((l: string) => l.replace(/^[-*]\s+/, "").trim())
          .filter((l: string) => l.length > 0);
      }

      const titleMatch = content.match(/Title:\s*`?([^`\n]+)`?/);
      if (titleMatch) seoTitle = titleMatch[1].trim();

      const descMatch = content.match(/Description:\s*`?([^`\n]+)`?/);
      if (descMatch) seoDescription = descMatch[1].trim();
    } catch {
      // Graceful fallback
    }
  }

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    category: c.category,
    subcategory: c.subcategory || "",
    launchWave: c.launchWave,
    rulesSensitive: !!c.rulesSensitive,
    risk: c.risk,
    benchmarkCount: c.benchmarkCount,
    status: c.status,
    implementationStatus: c.implementationStatus,
    jurisdiction: c.jurisdiction || "UK",
    publicUrl,
    canonicalRoute,
    hasSpec: existsSync(/*turbopackIgnore: true*/ specPath),
    version: c.version || "1.0.0",
    specFile: specRelative,
    aliases: c.aliases || [],
    purpose,
    assumptions,
    methodology,
    sources,
    inputs,
    outputs,
    relatedCalculators,
    seoTitle,
    seoDescription,
  };
}

export function getAllCategories(): string[] {
  const cats = new Set<string>((calculatorRegistry as CalculatorDefinition[]).map((c: CalculatorDefinition) => c.category));
  return Array.from(cats).sort();
}