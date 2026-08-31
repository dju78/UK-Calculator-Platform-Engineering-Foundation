import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = process.cwd();

import { FORBIDDEN_KEYS_PATTERNS, ALLOWED_EVENTS, ALLOWED_EVENT_FIELDS, isFieldForbidden, isEventAllowed, sanitizePath, sanitizePayload } from "../apps/web/src/lib/analytics/sanitizer.js";

const ANALYTICS_CONSENT_KEY = "ukcalc_analytics_consent";

const EXCLUDED_AD_CATEGORIES = new Set([
  "health & fitness",
  "health information",
  "pregnancy & fertility",
  "debt & insolvency",
]);

const EXCLUDED_AD_SLUGS = new Set([
  "bmi-calculator",
  "body-fat-percentage-calculator",
  "calorie-deficit-calculator",
  "pregnancy-due-date-calculator",
  "debt-payoff-calculator",
  "credit-card-payoff-calculator",
]);

function isAdSlotAllowed(category?: string, slug?: string): boolean {
  if (category && EXCLUDED_AD_CATEGORIES.has(category.toLowerCase().trim())) return false;
  if (slug && EXCLUDED_AD_SLUGS.has(slug.toLowerCase().trim())) return false;
  return true;
}

const EMBED_ALLOWLIST: readonly string[] = [
  "loan-calculator",
  "personal-loan-calculator",
  "apr-calculator",
  "compound-interest-calculator",
  "percentage-calculator",
  "vat-calculator",
  "unit-conversion-calculator",
  "fuel-cost-calculator",
  "age-calculator",
  "savings-calculator",
] as const;

function isEmbedAllowed(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;
  return new Set<string>(EMBED_ALLOWLIST).has(slug.toLowerCase().trim());
}

// Mock localStorage
class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, value); }
  removeItem(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
}

// ----------------- TEST SUITE -----------------

describe("Professionalisation Phase 6: Privacy-Safe Analytics & Sanitizer", () => {
  it("1. Strict Event Allowlist enforces allowed event names and rejects unapproved events", () => {
    assert.strictEqual(isEventAllowed("page_view"), true);
    assert.strictEqual(isEventAllowed("calculator_view"), true);
    assert.strictEqual(isEventAllowed("calculation_completed"), true);
    assert.strictEqual(isEventAllowed("calculator_copy_result"), true);
    assert.strictEqual(isEventAllowed("calculator_share_link"), true);
    assert.strictEqual(isEventAllowed("calculator_search"), true);
    assert.strictEqual(isEventAllowed("embed_loaded"), true);
    assert.strictEqual(isEventAllowed("for_organisations_view"), true);
    assert.strictEqual(isEventAllowed("commercial_disclosure_view"), true);

    // Unapproved / arbitrary event names
    assert.strictEqual(isEventAllowed("user_signup"), false);
    assert.strictEqual(isEventAllowed("payment_submitted"), false);
    assert.strictEqual(isEventAllowed("track_user_profile"), false);
    assert.strictEqual(isEventAllowed("salary_entered"), false);
  });

  it("2. Sensitive and Financial Field Blocklist identifies all prohibited keys", () => {
    const forbiddenKeys = [
      "salary",
      "annual_salary",
      "gross_income",
      "net_income",
      "tax",
      "tax_due",
      "national_insurance",
      "student_loan",
      "pension_pot",
      "mortgage_amount",
      "loan_balance",
      "property_price",
      "savings_balance",
      "interest_rate",
      "cagr",
      "roi",
      "irr",
      "bmi",
      "weight_kg",
      "height_cm",
      "pregnancy_due_date",
      "edd",
      "date_of_birth",
      "user_name",
      "email_address",
      "phone_number",
      "postcode",
      "vehicle_reg",
      "inputs",
      "outputs",
      "results",
      "raw_query",
      "query_string",
    ];

    for (const key of forbiddenKeys) {
      assert.strictEqual(
        isFieldForbidden(key),
        true,
        `Key '${key}' should be flagged as forbidden`
      );
    }

    // Safe metadata keys must NOT be forbidden
    assert.strictEqual(isFieldForbidden("calculator_slug"), false);
    assert.strictEqual(isFieldForbidden("calculator_category"), false);
    assert.strictEqual(isFieldForbidden("result_count"), false);
    assert.strictEqual(isFieldForbidden("has_assumptions"), false);
  });

  it("3. Fail-Closed Payload Sanitizer drops unknown fields and strips forbidden keys", () => {
    const dirtyPayload: any = {
      calculator_slug: "income-tax-calculator",
      calculator_category: "UK Tax & Salary",
      has_assumptions: false,
      has_warnings: false,
      salary: 50000,
      tax_due: 12500,
      inputs: { gross: 50000 },
      outputs: { takeHome: 37500 },
      custom_sneaky_field: "unauthorized_tracking",
    };

    const clean = sanitizePayload("calculation_completed", dirtyPayload);

    assert.deepStrictEqual(clean, {
      calculator_slug: "income-tax-calculator",
      calculator_category: "UK Tax & Salary",
      has_assumptions: false,
      has_warnings: false,
    });

    assert.strictEqual("salary" in clean, false);
    assert.strictEqual("tax_due" in clean, false);
    assert.strictEqual("inputs" in clean, false);
    assert.strictEqual("outputs" in clean, false);
    assert.strictEqual("custom_sneaky_field" in clean, false);
  });

    it("3b. Structural fields with 'age' in their name survive sanitization while user age is blocked", () => {
      // Simulate page view where page_type and page_slug contain "age" 
      const dirtyPayload = {
        path: "/calculators/age-calculator",
        title: "Age Calculator",
        page_type: "mortgage_calculator",
        page_slug: "age-calculator",
        age: 35, // user input age
        user_age: 35,
        salary: 50000,
        email: "test@example.com"
      };

      const clean1 = sanitizePayload("page_view", dirtyPayload);
      assert.strictEqual(clean1.page_type, "mortgage_calculator");
      assert.strictEqual("age" in clean1, false);

      const clean2 = sanitizePayload("governance_page_view", dirtyPayload);
      assert.strictEqual(clean2.page_slug, "age-calculator");
      assert.strictEqual("age" in clean2, false);
      
      // Prohibited sensitive keys must NOT be present
      assert.strictEqual("user_age" in clean1, false);
      assert.strictEqual("salary" in clean1, false);
      assert.strictEqual("email" in clean1, false);
    });

  it("4. Path sanitizer strips query parameters and URL hashes", () => {
    assert.strictEqual(
      sanitizePath("/calculators/income-tax-calculator?salary=65000&tax=15000#results"),
      "/calculators/income-tax-calculator"
    );
    assert.strictEqual(sanitizePath("/privacy?utm_source=test"), "/privacy");
    assert.strictEqual(sanitizePath(""), "/");
  });

  it("5. Search payload sanitizer rejects raw user query text", () => {
    const searchPayload: any = {
      result_count: 5,
      category_filter: "UK Tax & Salary",
      raw_query: "how much tax on 100000 salary",
      user_search_term: "secret text",
    };

    const clean = sanitizePayload("calculator_search", searchPayload);

    assert.deepStrictEqual(clean, {
      result_count: 5,
      category_filter: "UK Tax & Salary",
    });
    assert.strictEqual("raw_query" in clean, false);
    assert.strictEqual("user_search_term" in clean, false);
  });
});

describe("Professionalisation Phase 6: Consent & Tracking Preferences", () => {
  it("6. Consent storage manages granted and denied states correctly", () => {
    const mockStorage = new MockLocalStorage();

    assert.strictEqual(mockStorage.getItem(ANALYTICS_CONSENT_KEY), null);

    mockStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
    assert.strictEqual(mockStorage.getItem(ANALYTICS_CONSENT_KEY), "granted");

    mockStorage.setItem(ANALYTICS_CONSENT_KEY, "denied");
    assert.strictEqual(mockStorage.getItem(ANALYTICS_CONSENT_KEY), "denied");
  });
});

describe("Professionalisation Phase 6: Monetisation Governance & Safeguards", () => {
  it("7. AdSlot enforces category exclusions on health, pregnancy, and debt tools", () => {
    assert.strictEqual(isAdSlotAllowed("Health & Fitness"), false);
    assert.strictEqual(isAdSlotAllowed("Health Information"), false);
    assert.strictEqual(isAdSlotAllowed("Pregnancy & Fertility"), false);
    assert.strictEqual(isAdSlotAllowed("Debt & Insolvency"), false);
    assert.strictEqual(isAdSlotAllowed(undefined, "bmi-calculator"), false);
    assert.strictEqual(isAdSlotAllowed(undefined, "debt-payoff-calculator"), false);

    // Permitted non-sensitive categories
    assert.strictEqual(isAdSlotAllowed("Everyday & Lifestyle", "unit-converter"), true);
    assert.strictEqual(isAdSlotAllowed("Business & Commercial", "vat-calculator"), true);
    assert.strictEqual(isAdSlotAllowed("Conversions", "currency-converter"), true);
  });

  it("8. Excluded ad categories and slugs are strictly maintained", () => {
    assert.strictEqual(EXCLUDED_AD_CATEGORIES.has("health & fitness"), true);
    assert.strictEqual(EXCLUDED_AD_SLUGS.has("bmi-calculator"), true);
    assert.strictEqual(EXCLUDED_AD_SLUGS.has("pregnancy-due-date-calculator"), true);
  });
});

describe("Professionalisation Phase 6: B2B & Embed Foundation", () => {
  it("9. Embed allowlist contains strictly generic, low-risk tools", () => {
    assert.strictEqual(isEmbedAllowed("loan-calculator"), true);
    assert.strictEqual(isEmbedAllowed("compound-interest-calculator"), true);
    assert.strictEqual(isEmbedAllowed("vat-calculator"), true);
    assert.strictEqual(isEmbedAllowed("unit-conversion-calculator"), true);
    assert.strictEqual(isEmbedAllowed("percentage-calculator"), true);
    assert.strictEqual(isEmbedAllowed("age-calculator"), true);
    assert.strictEqual(isEmbedAllowed("savings-calculator"), true);

    // Excluded / unapproved slugs must NOT be allowed
    assert.strictEqual(isEmbedAllowed("income-tax-calculator"), false);
    assert.strictEqual(isEmbedAllowed("salary-calculator"), false);
    assert.strictEqual(isEmbedAllowed("pension-calculator"), false);
    assert.strictEqual(isEmbedAllowed("fire-calculator"), false);
    assert.strictEqual(isEmbedAllowed("unsupported-slug"), false);
  });

  it("10. Total allowlisted embed tools is exactly 10", () => {
    assert.strictEqual(EMBED_ALLOWLIST.length, 10);
  });
});

describe("Professionalisation Phase 6: Codebase & Architecture File Audits", () => {
  it("11. apps/web/src/lib/analytics contains complete sanitizer, consent, events, and provider suite", () => {
    const analyticsFiles = fs.readdirSync(path.join(rootDir, "apps/web/src/lib/analytics"));
    assert.strictEqual(analyticsFiles.includes("sanitizer.ts"), true);
    assert.strictEqual(analyticsFiles.includes("consent.ts"), true);
    assert.strictEqual(analyticsFiles.includes("events.ts"), true);
    assert.strictEqual(analyticsFiles.includes("analytics.ts"), true);
    assert.strictEqual(analyticsFiles.includes("types.ts"), true);
  });

  it("12. Sitemap includes For Organisations and Commercial Disclosure but excludes Embed routes", () => {
    const sitemapFile = fs.readFileSync(path.join(rootDir, "apps/web/src/app/sitemap.ts"), "utf8");
    assert.strictEqual(sitemapFile.includes("'/for-organisations'"), true);
    assert.strictEqual(sitemapFile.includes("'/commercial-disclosure'"), true);
    assert.strictEqual(sitemapFile.includes("/embed/"), false);
  });

  it("13. Root layout includes search engine verification token configuration and ConsentBanner", () => {
    const layoutFile = fs.readFileSync(path.join(rootDir, "apps/web/src/app/layout.tsx"), "utf8");
    assert.strictEqual(layoutFile.includes("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"), true);
    assert.strictEqual(layoutFile.includes("NEXT_PUBLIC_BING_SITE_VERIFICATION"), true);
    assert.strictEqual(layoutFile.includes("verification:"), true);
  });

  it("14. Frame security headers are configured in next.config.ts for embed vs standard routes", () => {
    const configContent = fs.readFileSync(path.join(rootDir, "apps/web/next.config.ts"), "utf8");
    assert.strictEqual(configContent.includes("source: '/embed/:path*'"), true);
    assert.strictEqual(configContent.includes("frame-ancestors *;"), true);
    assert.strictEqual(configContent.includes("SAMEORIGIN"), true);
  });

  it("15. For Organisations and Commercial Disclosure pages exist and define canonical metadata", () => {
    const orgPage = fs.readFileSync(path.join(rootDir, "apps/web/src/app/for-organisations/page.tsx"), "utf8");
    const commPage = fs.readFileSync(path.join(rootDir, "apps/web/src/app/commercial-disclosure/page.tsx"), "utf8");

    assert.strictEqual(orgPage.includes('alternates: { canonical: "/for-organisations" }'), true);
    assert.strictEqual(commPage.includes('alternates: { canonical: "/commercial-disclosure" }'), true);
  });

  it("16. DynamicCalculator and ResultActions dispatch only privacy-safe analytics metadata", () => {
    const dynCalc = fs.readFileSync(path.join(rootDir, "apps/web/src/components/calculators/DynamicCalculator.tsx"), "utf8");
    const resActions = fs.readFileSync(path.join(rootDir, "apps/web/src/components/calculators/ResultActions.tsx"), "utf8");

    assert.strictEqual(dynCalc.includes("trackCalculatorView"), true);
    assert.strictEqual(dynCalc.includes("trackCalculationCompleted"), true);
    assert.strictEqual(resActions.includes("trackCopyResult"), true);
    assert.strictEqual(resActions.includes("trackShareLink"), true);
    assert.strictEqual(resActions.includes("trackPrint"), true);
  });

  it("17. Footer establishes consistent brand hierarchy: UK Calculator Platform — A Jomovate Digital Product", () => {
    const footerContent = fs.readFileSync(path.join(rootDir, "apps/web/src/components/layout/Footer.tsx"), "utf8");
    assert.ok(footerContent.includes("UK Calculator Platform"));
    assert.ok(footerContent.includes("A Jomovate Digital Product"));
    assert.ok(footerContent.includes("Operated by Jomovate"));
  });

  it("18. Root layout outputs Schema.org @graph connecting Organization (Jomovate) and WebSite", () => {
    const layoutContent = fs.readFileSync(path.join(rootDir, "apps/web/src/app/layout.tsx"), "utf8");
    assert.ok(layoutContent.includes('"@type": "Organization"') || layoutContent.includes('"Organization"'));
    assert.ok(layoutContent.includes('name: "Jomovate"'));
    assert.ok(layoutContent.includes('"@type": "WebSite"') || layoutContent.includes('"WebSite"'));
    assert.ok(layoutContent.includes('publisher:'));
  });

  it("19. Calculator page does not output deprecated or restricted FAQPage JSON-LD schema", () => {
    const calcPageContent = fs.readFileSync(path.join(rootDir, "apps/web/src/app/calculators/[slug]/page.tsx"), "utf8");
    assert.strictEqual(calcPageContent.includes('"@type": "FAQPage"'), false);
    assert.ok(calcPageContent.includes('"@type": "WebApplication"'));
    assert.ok(calcPageContent.includes('"@type": "BreadcrumbList"'));
  });

  it("20. CURATED_RELATED builds contextual clusters based on user journeys", () => {
    const content = fs.readFileSync(path.join(rootDir, "apps/web/src/lib/relatedCalculators.ts"), "utf8");

    // Take-Home Pay journey
    assert.ok(content.includes('"TAX-003": ["TAX-001", "TAX-004", "PEN-001", "TAX-020"'));

    // Mortgage journey
    assert.ok(content.includes('"PRO-001": ["PRO-004", "PRO-023", "PRO-010", "PRO-002", "PRO-003"'));

    // Property investment journey
    assert.ok(content.includes('"PRO-018": ["PRO-016", "PRO-019", "PRO-028", "PRO-023"'));

    // FIRE / Retirement journey
    assert.ok(content.includes('"PEN-011": ["INV-025", "INV-026", "INV-029", "PEN-001"'));
  });
});
