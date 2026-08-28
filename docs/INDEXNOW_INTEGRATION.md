# IndexNow Protocol Integration

## 1. Purpose

IndexNow is an open search engine protocol that enables website publishers to instantly inform participating search engines (including Microsoft Bing, Yandex, Naver, and Seznam) whenever public content is created, materially updated, or deleted. 

By pushing updates proactively through IndexNow rather than waiting for crawler passes, search engines can reflect changes in search results within minutes while reducing crawler load and server overhead.

This integration provides a safe, standards-compliant CLI submission utility and static key verification mechanism for the UK Calculator Platform (`https://ukcalc.jomovate.com`).

---

## 2. Key Verification & Public URL

IndexNow requires proof of site ownership via a plain text verification file placed at the root of the serving domain.

- **Verification File Path:** `apps/web/public/<INDEXNOW_KEY>.txt`
- **Served Public URL:** `https://ukcalc.jomovate.com/<INDEXNOW_KEY>.txt`
- **File Encoding & Content:** UTF-8 text containing exactly `<INDEXNOW_KEY>` and nothing else.

Vercel serves all files placed within `apps/web/public/` directly from the origin root (`/`), satisfying the IndexNow verification requirement.

---

## 3. Submission Command

The platform provides a standalone, safe submission script:

```bash
npm run indexnow -- <url1> [url2] [url3...] [options]
```

Or directly via Node.js:

```bash
node scripts/indexnow-submit.mjs <url1> [url2...] [options]
```

### Options

| Flag | Description |
| :--- | :--- |
| `--key, -k <key>` | Explicitly specify the IndexNow key (otherwise resolved via `INDEXNOW_KEY` env var or `apps/web/public/<key>.txt`). |
| `--dry-run` | Validates URLs, checks security rules, and previews JSON payload without sending any network request. |
| `--help, -h` | Displays usage instructions and available options. |

### Examples

```bash
# Submit single updated homepage
npm run indexnow -- https://ukcalc.jomovate.com/

# Submit multiple updated calculators
npm run indexnow -- https://ukcalc.jomovate.com/calculators/mortgage-repayment-calculator https://ukcalc.jomovate.com/calculators/stamp-duty-calculator

# Dry-run validation check
npm run indexnow -- https://ukcalc.jomovate.com/calculators/loan-calculator --dry-run
```

---

## 4. When to Submit

IndexNow should be triggered **selectively and deliberately**:

1. **Newly Published Pages:** When a new calculator, category, or editorial page is published live.
2. **Material Content Updates:** When calculator methodology, statutory tax rules (e.g. Autumn Budget / Spring Statement rate updates), or explanatory content is significantly revised.
3. **Deleted or Deprecated Pages:** When a URL is removed or redirected.

---

## 5. When NOT to Submit

To maintain search engine trust and avoid API rate limits or spam penalties, **do NOT submit**:

- **Every Build / CI Mass Submissions:** Do NOT automatically blast the full 284+ sitemap URLs on every CI deployment.
- **Unchanged Pages:** Routine technical deployments without content changes do not warrant URL notifications.
- **Preview or Staging URLs:** Vercel preview environments (`*.vercel.app`) or `localhost` are strictly rejected by the script.
- **Private, Internal, or Embed Routes:** Embed routes (`/embed/*`), API endpoints (`/api/*`), or Next.js internals (`/_next/*`) must never be submitted.
- **Calculation URLs with User Query Parameters:** URLs containing input query parameters or calculation outputs must never be submitted.

---

## 6. Response Codes Reference

The submission script targets the official IndexNow endpoint:
`https://api.indexnow.org/indexnow`

| Status Code | IndexNow Meaning | Action / Handling |
| :---: | :--- | :--- |
| **200** | **OK** | URLs received and successfully submitted for indexation. |
| **202** | **Accepted** | Request accepted; key verification is pending validation. |
| **400** | **Bad Request** | Malformed JSON payload or invalid URL syntax. |
| **403** | **Forbidden** | Key is invalid or verification file (`/<key>.txt`) could not be resolved on the domain. |
| **422** | **Unprocessable Entity** | One or more URLs in `urlList` do not belong to `ukcalc.jomovate.com` or do not match the key location. |
| **429** | **Too Many Requests** | Rate limit reached; wait before submitting further batches. |

---

## 7. Vercel Deployment Requirement

1. Place the IndexNow verification file at `apps/web/public/<INDEXNOW_KEY>.txt`.
2. Deploy the Next.js application to Vercel.
3. Verify by making an HTTP GET request in a browser or via `curl`:
   ```bash
   curl -i https://ukcalc.jomovate.com/<INDEXNOW_KEY>.txt
   ```
4. Ensure the response returns `HTTP 200 OK`, `Content-Type: text/plain`, and the body matches `<INDEXNOW_KEY>` exactly.

---

## 8. Bing Webmaster Tools Verification Procedure

Bing participates directly in the IndexNow protocol. Verification through Bing Webmaster Tools is straightforward:

1. Sign in to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Ensure `https://ukcalc.jomovate.com` is verified in your account.
3. Navigate to **IndexNow** under the **Configure My Site** / **SEO** section.
4. You can generate or register your API key in Bing Webmaster Tools, or copy your existing key to `apps/web/public/<INDEXNOW_KEY>.txt`.
5. Bing will automatically verify the key by requesting `https://ukcalc.jomovate.com/<INDEXNOW_KEY>.txt`.
6. Once verified, URL submission history, submitted URL counts, and crawl activity will populate in the IndexNow dashboard.

---

## 9. Privacy & Security Safeguards

- **Zero Client-Side Exposure:** IndexNow submission scripts run exclusively in server, build, or developer/CI environments. No submission endpoints or keys are embedded in client-side bundles.
- **No Unauthenticated Public Endpoints:** No public HTTP route is exposed to allow arbitrary visitors to trigger submissions.
- **Strict Host Isolation:** All URLs must match `ukcalc.jomovate.com` on `https:`. External domains or preview domains are rejected.
- **URL Parameter Stripping & Rejection:** URLs containing query strings or hash anchors are rejected to ensure user-entered calculation values, personal inputs, or tracking tokens are never transmitted to search engine endpoints.
- **Key Masking in Logs:** CLI output masks verification keys (e.g. `abcd...1234`) to prevent accidental credential leakage in public CI logs.
