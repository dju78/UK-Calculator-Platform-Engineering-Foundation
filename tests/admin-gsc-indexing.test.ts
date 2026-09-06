import test from "node:test";
import assert from "node:assert/strict";
import {
  getGscIndexingSnapshot,
  formatGscIndexingMetrics,
  VERIFIED_GSC_INDEXING_SNAPSHOT,
  getAdminSEOOverview,
  getSitemapEntryCount,
} from "./admin-data-helper.js";

test("Admin Console Stage 4: Google Search Console Indexing & Reporting Suite", async (t: any) => {
  await t.test("1. Sourced snapshot contains verified production figures (27 indexed, 266 not indexed)", () => {
    const snapshot = getGscIndexingSnapshot();
    assert.strictEqual(snapshot.indexedCount, 27, "Must report exactly 27 indexed pages");
    assert.strictEqual(snapshot.notIndexedCount, 266, "Must report exactly 266 not indexed pages");
    assert.strictEqual(snapshot.totalSubmittedInSitemap, 284, "Must match 284 canonical sitemap entries");
    assert.strictEqual(snapshot.source, "Search Console snapshot");
    assert.strictEqual(snapshot.isImportedSnapshot, true);
    assert.strictEqual(snapshot.datasetDate, "2026-08-28");
    assert.strictEqual(snapshot.capturedDate, "2026-09-06");
  });

  await t.test("2. Discovered queue and unconfirmed exclusion reasons are faithfully mapped", () => {
    const snapshot = getGscIndexingSnapshot();
    assert.strictEqual(snapshot.exclusionReasons.length, 2, "Must contain exactly 2 exclusion categories");

    const discovered = snapshot.exclusionReasons.find((r) => r.reason.includes("Discovered"));
    assert.ok(discovered, "Must include 'Discovered – currently not indexed'");
    assert.strictEqual(discovered?.count, 260);
    assert.strictEqual(discovered?.status, "VALIDATION_IN_PROGRESS");
    assert.strictEqual(discovered?.lastCrawled, "N/A");

    const unconfirmed = snapshot.exclusionReasons.find((r) => r.status === "UNCONFIRMED");
    assert.ok(unconfirmed, "Must include unconfirmed category");
    assert.strictEqual(unconfirmed?.count, 6, "Must record approximately 6 unconfirmed URLs");
    assert.ok(unconfirmed?.description.includes("awaiting confirmation"), "Must explicitly state unconfirmed status");

    // Sum of exclusion breakdown equals total not indexed count
    const totalExcludedBreakdown = snapshot.exclusionReasons.reduce((acc, r) => acc + r.count, 0);
    assert.strictEqual(totalExcludedBreakdown, 266, "Sum of exclusions must equal 266");
  });

  await t.test("3. Search Console validation cycle reflects active status (0 failures)", () => {
    const snapshot = getGscIndexingSnapshot();
    assert.strictEqual(snapshot.validation.startedDate, "2026-09-06");
    assert.strictEqual(snapshot.validation.status, "IN_PROGRESS");
    assert.strictEqual(snapshot.validation.failuresCount, 0, "Must report 0 validation failures");
    assert.ok(snapshot.validation.statusLabel.includes("Started 6 Sep 2026"));
  });

  await t.test("4. Numerical invariants: no negative numbers, no NaN values, safe formatting", () => {
    const formatted = formatGscIndexingMetrics();
    assert.strictEqual(typeof formatted.indexed, "number");
    assert.strictEqual(typeof formatted.notIndexed, "number");
    assert.ok(!isNaN(formatted.indexed));
    assert.ok(!isNaN(formatted.notIndexed));
    assert.ok(formatted.indexed >= 0);
    assert.ok(formatted.notIndexed >= 0);
    assert.strictEqual(formatted.totalTracked, 293);
    assert.strictEqual(formatted.indexationRate, "9.2%");

    // Edge case: Empty / corrupted snapshot formatting does not throw or return NaN
    const emptyFormatted = formatGscIndexingMetrics({
      indexedCount: NaN as any,
      notIndexedCount: -10 as any,
      exclusionReasons: [],
      validation: { startedDate: "", status: "NOT_STARTED", statusLabel: "Not started", failuresCount: 0, notes: "" },
    } as any);
    assert.strictEqual(emptyFormatted.indexed, 0);
    assert.strictEqual(emptyFormatted.notIndexed, 0);
    assert.strictEqual(emptyFormatted.indexationRate, "0.0%");
  });

  await t.test("5. Data provenance distinction: Search Console snapshot is distinct from internal SEO verification", () => {
    const seoOverview = getAdminSEOOverview();

    // 1. Internal Technical Verification (repository-derived)
    assert.strictEqual(seoOverview.sitemapEntryCount, 284, "Internal sitemap derivations equals 284");
    assert.strictEqual(seoOverview.metadataCoverage.withCanonical, 253, "Internal canonical derivation equals 253");
    assert.strictEqual(seoOverview.indexNow.status, "CONFIGURED", "Internal IndexNow protocol verification");

    // 2. Observed External Google Search Console Snapshot (imported fact)
    assert.strictEqual(seoOverview.gscIndexingSnapshot.source, "Search Console snapshot");
    assert.strictEqual(seoOverview.gscIndexingSnapshot.indexedCount, 27, "GSC observed 27 indexed pages");
    assert.strictEqual(seoOverview.gscIndexingSnapshot.notIndexedCount, 266, "GSC observed 266 not indexed pages");

    // Never conflate the two: 284 sitemap routes != 27 indexed pages
    assert.notStrictEqual(seoOverview.sitemapEntryCount, seoOverview.gscIndexingSnapshot.indexedCount);
  });

  await t.test("6. Practical Indexing Analysis provides actionable and realistic guidance", () => {
    const snapshot = getGscIndexingSnapshot();
    const analysis = snapshot.analysis;

    // Discovered not indexed explanation
    assert.ok(analysis.discoveredNotIndexedExplanation.includes("crawl queue"));
    assert.ok(analysis.discoveredNotIndexedExplanation.includes("domain authority"));

    // Actionable recommendations
    assert.ok(analysis.recommendedActions.length >= 3);
    assert.ok(analysis.recommendedActions.some((a) => a.includes("validation cycle")));
    assert.ok(analysis.recommendedActions.some((a) => a.includes("canonical")));

    // Safeguards & cautions
    assert.ok(analysis.cautions.length >= 2);
    assert.ok(analysis.cautions.some((c) => c.includes("Do NOT manually submit all 260 URLs")));
    assert.ok(analysis.cautions.some((c) => c.includes("Google does not use IndexNow")));
  });

  await t.test("7. Security & Secret Safeguards: Zero credential leakage in snapshot structures", () => {
    const snapshot = getGscIndexingSnapshot();
    const serialized = JSON.stringify(snapshot);

    assert.strictEqual(serialized.includes("PRIVATE KEY"), false);
    assert.strictEqual(serialized.includes("client_secret"), false);
    assert.strictEqual(serialized.includes("access_token"), false);
    assert.strictEqual(serialized.includes("Bearer"), false);
  });

  await t.test("8. Canonical Host isolation: Property URL targets https://ukcalc.jomovate.com/", () => {
    const snapshot = getGscIndexingSnapshot();
    assert.strictEqual(snapshot.propertyUrl, "https://ukcalc.jomovate.com/");
    assert.strictEqual(snapshot.propertyUrl.startsWith("https://"), true);
    assert.strictEqual(snapshot.propertyUrl.includes("vercel.app"), false);
  });
});
