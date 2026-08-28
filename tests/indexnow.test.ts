import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

test("IndexNow Integration Test Suite", async (t: any) => {
  const scriptPath = pathToFileURL(join(process.cwd(), "scripts/indexnow-submit.mjs")).href;
  const {
    CANONICAL_HOST,
    INDEXNOW_ENDPOINT,
    DISALLOWED_PATH_PREFIXES,
    validateUrl,
    sanitizeUrlList,
    maskKey,
    resolveIndexNowKey,
    buildIndexNowPayload,
    submitToIndexNow,
    parseArgs,
  } = await import(scriptPath);

  await t.test("IndexNow: Canonical host and endpoint constants", () => {
    assert.strictEqual(CANONICAL_HOST, "ukcalc.jomovate.com");
    assert.strictEqual(INDEXNOW_ENDPOINT, "https://api.indexnow.org/indexnow");
    assert.ok(DISALLOWED_PATH_PREFIXES.includes("/embed/"));
    assert.ok(DISALLOWED_PATH_PREFIXES.includes("/api/"));
    assert.ok(DISALLOWED_PATH_PREFIXES.includes("/_not-found"));
    assert.ok(DISALLOWED_PATH_PREFIXES.includes("/_next/"));
  });

  await t.test("IndexNow: URL Validation allows valid public production URLs", () => {
    const validUrls = [
      "https://ukcalc.jomovate.com/",
      "https://ukcalc.jomovate.com/about",
      "https://ukcalc.jomovate.com/calculators/loan-calculator",
      "https://ukcalc.jomovate.com/category/finance%20%26%20debt",
      "https://ukcalc.jomovate.com/how-we-check-our-figures",
    ];

    for (const url of validUrls) {
      const res = validateUrl(url);
      assert.strictEqual(res.valid, true, `URL ${url} should be valid`);
      assert.strictEqual(res.normalized, url);
    }
  });

  await t.test("IndexNow: URL Validation rejects non-HTTPS protocols", () => {
    const insecure = "http://ukcalc.jomovate.com/calculators/loan-calculator";
    const res = validateUrl(insecure);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || "", /Protocol must be "https:"/);
  });

  await t.test("IndexNow: URL Validation rejects external domains", () => {
    const externalUrls = [
      "https://google.com/search",
      "https://bing.com/",
      "https://example.com/calculator",
      "https://other-site.co.uk/",
    ];

    for (const url of externalUrls) {
      const res = validateUrl(url);
      assert.strictEqual(res.valid, false);
      assert.match(res.error || "", /Host must strictly match "ukcalc\.jomovate\.com"/);
    }
  });

  await t.test("IndexNow: URL Validation rejects preview and development environments", () => {
    const devUrls = [
      "https://ukcalc-preview.vercel.app/",
      "https://uk-calculator-platform-git-main.vercel.app/calculators/loan-calculator",
      "http://localhost:3000/",
      "http://127.0.0.1:3000/calculators/loan-calculator",
    ];

    for (const url of devUrls) {
      const res = validateUrl(url);
      assert.strictEqual(res.valid, false);
    }
  });

  await t.test("IndexNow: Privacy safeguard rejects URLs with query parameters", () => {
    const queryUrls = [
      "https://ukcalc.jomovate.com/calculators/loan-calculator?amount=25000&term=5",
      "https://ukcalc.jomovate.com/?utm_source=bing",
      "https://ukcalc.jomovate.com/calculators/salary-calculator?salary=45000",
    ];

    for (const url of queryUrls) {
      const res = validateUrl(url);
      assert.strictEqual(res.valid, false);
      assert.match(res.error || "", /query parameters \(privacy safeguard/);
    }
  });

  await t.test("IndexNow: Privacy safeguard rejects URLs with hash fragments", () => {
    const hashUrl = "https://ukcalc.jomovate.com/calculators/loan-calculator#results";
    const res = validateUrl(hashUrl);
    assert.strictEqual(res.valid, false);
    assert.match(res.error || "", /hash fragments/);
  });

  await t.test("IndexNow: Rejects private and embed routes", () => {
    const privateRoutes = [
      "https://ukcalc.jomovate.com/embed/loan-calculator",
      "https://ukcalc.jomovate.com/embed/personal-loan-calculator",
      "https://ukcalc.jomovate.com/_not-found",
      "https://ukcalc.jomovate.com/api/calculate",
      "https://ukcalc.jomovate.com/_next/static/chunk.js",
    ];

    for (const url of privateRoutes) {
      const res = validateUrl(url);
      assert.strictEqual(res.valid, false);
      assert.match(res.error || "", /Disallowed path prefix/);
    }
  });

  await t.test("IndexNow: sanitizeUrlList deduplicates and separates valid from invalid", () => {
    const inputList = [
      "https://ukcalc.jomovate.com/calculators/loan-calculator",
      "https://ukcalc.jomovate.com/calculators/loan-calculator", // duplicate
      "https://ukcalc.jomovate.com/",
      "https://invalid-host.com/page",
      "https://ukcalc.jomovate.com/embed/loan-calculator",
    ];

    const result = sanitizeUrlList(inputList);
    assert.strictEqual(result.validUrls.length, 2);
    assert.deepStrictEqual(result.validUrls, [
      "https://ukcalc.jomovate.com/calculators/loan-calculator",
      "https://ukcalc.jomovate.com/",
    ]);
    assert.strictEqual(result.errors.length, 2);
  });

  await t.test("IndexNow: maskKey masks key safely in log messages", () => {
    assert.strictEqual(maskKey(""), "[empty]");
    assert.strictEqual(maskKey("1234"), "****");
    assert.strictEqual(maskKey("abcdef1234567890"), "abcd...7890");
  });

  await t.test("IndexNow: Payload builder conforms to IndexNow standard schema", () => {
    const payload = buildIndexNowPayload({
      host: "ukcalc.jomovate.com",
      key: "abcdef1234567890abcdef1234567890",
      keyLocation: "https://ukcalc.jomovate.com/abcdef1234567890abcdef1234567890.txt",
      urlList: ["https://ukcalc.jomovate.com/calculators/loan-calculator"],
    });

    assert.strictEqual(payload.host, "ukcalc.jomovate.com");
    assert.strictEqual(payload.key, "abcdef1234567890abcdef1234567890");
    assert.strictEqual(
      payload.keyLocation,
      "https://ukcalc.jomovate.com/abcdef1234567890abcdef1234567890.txt"
    );
    assert.deepStrictEqual(payload.urlList, [
      "https://ukcalc.jomovate.com/calculators/loan-calculator",
    ]);
  });

  await t.test("IndexNow: Payload builder throws if key or urlList is empty", () => {
    assert.throws(() => {
      buildIndexNowPayload({
        host: "ukcalc.jomovate.com",
        key: "",
        keyLocation: "",
        urlList: ["https://ukcalc.jomovate.com/"],
      });
    }, /IndexNow key is required/);

    assert.throws(() => {
      buildIndexNowPayload({
        host: "ukcalc.jomovate.com",
        key: "some-key",
        keyLocation: "",
        urlList: [],
      });
    }, /At least one URL must be provided/);
  });

  await t.test("IndexNow: submitToIndexNow handles response codes correctly", async () => {
    const mockFetcher = async (url: string, init: any) => {
      assert.strictEqual(url, INDEXNOW_ENDPOINT);
      assert.strictEqual(init.method, "POST");
      assert.strictEqual(init.headers["Content-Type"], "application/json; charset=utf-8");
      return { status: 200 } as any;
    };

    const payload = {
      host: "ukcalc.jomovate.com",
      key: "testkey1234567890",
      keyLocation: "https://ukcalc.jomovate.com/testkey1234567890.txt",
      urlList: ["https://ukcalc.jomovate.com/"],
    };

    const res200 = await submitToIndexNow(payload, { fetchImpl: mockFetcher as any });
    assert.strictEqual(res200.status, 200);
    assert.strictEqual(res200.ok, true);

    const res202 = await submitToIndexNow(payload, {
      fetchImpl: (async () => ({ status: 202 })) as any,
    });
    assert.strictEqual(res202.status, 202);
    assert.strictEqual(res202.ok, true);

    const res400 = await submitToIndexNow(payload, {
      fetchImpl: (async () => ({ status: 400 })) as any,
    });
    assert.strictEqual(res400.status, 400);
    assert.strictEqual(res400.ok, false);

    const res403 = await submitToIndexNow(payload, {
      fetchImpl: (async () => ({ status: 403 })) as any,
    });
    assert.strictEqual(res403.status, 403);
    assert.strictEqual(res403.ok, false);

    const res422 = await submitToIndexNow(payload, {
      fetchImpl: (async () => ({ status: 422 })) as any,
    });
    assert.strictEqual(res422.status, 422);
    assert.strictEqual(res422.ok, false);

    const res429 = await submitToIndexNow(payload, {
      fetchImpl: (async () => ({ status: 429 })) as any,
    });
    assert.strictEqual(res429.status, 429);
    assert.strictEqual(res429.ok, false);
  });

  await t.test("IndexNow: CLI argument parser handles flags and URLs", () => {
    const parsed1 = parseArgs(["https://ukcalc.jomovate.com/", "--dry-run", "--key", "mykey123"]);
    assert.deepStrictEqual(parsed1.urls, ["https://ukcalc.jomovate.com/"]);
    assert.strictEqual(parsed1.dryRun, true);
    assert.strictEqual(parsed1.key, "mykey123");

    const parsed2 = parseArgs(["-h"]);
    assert.strictEqual(parsed2.help, true);
  });

  await t.test("IndexNow: Key resolution handles CLI, ENV, and public file", () => {
    const cliRes = resolveIndexNowKey("custom-key-123");
    assert.strictEqual(cliRes.key, "custom-key-123");
    assert.strictEqual(cliRes.source, "cli");
    assert.strictEqual(cliRes.keyLocation, "https://ukcalc.jomovate.com/custom-key-123.txt");

    process.env.INDEXNOW_KEY = "env-key-456";
    const envRes = resolveIndexNowKey();
    assert.strictEqual(envRes.key, "env-key-456");
    assert.strictEqual(envRes.source, "env");
    delete process.env.INDEXNOW_KEY;

    const fileRes = resolveIndexNowKey();
    assert.strictEqual(fileRes.key, "PASTE_YOUR_REAL_INDEXNOW_KEY_HERE");
    assert.strictEqual(fileRes.source, "file:PASTE_YOUR_REAL_INDEXNOW_KEY_HERE.txt");
    assert.strictEqual(
      fileRes.keyLocation,
      "https://ukcalc.jomovate.com/PASTE_YOUR_REAL_INDEXNOW_KEY_HERE.txt"
    );
  });
});
