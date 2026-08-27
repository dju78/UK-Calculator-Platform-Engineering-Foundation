# Search Engine Verification Guide

This guide describes the configuration and verification procedures for Google Search Console and Bing Webmaster Tools on the UK Calculator Platform (`https://ukcalc.jomovate.com`).

---

## 1. Architectural Readiness

The UK Calculator Platform uses environment-driven HTML metadata verification tokens inside Next.js root layout (`apps/web/src/app/layout.tsx`).

### Supported Environment Variables
| Variable Name | Search Engine | Verification Format |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console | `<meta name="google-site-verification" content="..." />` |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools | `<meta name="msvalidate.01" content="..." />` |

### Default State
When these environment variables are unset or empty, **no verification meta tags are rendered**. Fake or placeholder verification codes are strictly prohibited.

---

## 2. Post-Deployment Verification Steps

Verification requires a live, production deployment on the canonical domain `https://ukcalc.jomovate.com`.

### Google Search Console
1. Log into [Google Search Console](https://search.google.com/search-console).
2. Select **Add Property** and choose **URL prefix**: `https://ukcalc.jomovate.com`.
3. Under **Other verification methods**, select **HTML tag**.
4. Copy the verification string (e.g. `google-site-verification=abc123xyz...`).
5. Set the environment variable in production hosting (e.g. Render Dashboard):
   ```bash
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your_google_token_here"
   ```
6. Trigger a deployment / rebuild of the web application.
7. Return to Google Search Console and click **Verify**.
8. Submit the primary sitemap at `https://ukcalc.jomovate.com/sitemap.xml`.

### Bing Webmaster Tools
1. Log into [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Add `https://ukcalc.jomovate.com` as a new site (or import from Google Search Console).
3. Choose **HTML Meta Tag** authentication.
4. Copy the alphanumeric verification code.
5. Set the environment variable in production hosting:
   ```bash
   NEXT_PUBLIC_BING_SITE_VERIFICATION="your_bing_token_here"
   ```
6. Trigger a deployment / rebuild.
7. Click **Verify** in Bing Webmaster Tools.
8. Submit the sitemap at `https://ukcalc.jomovate.com/sitemap.xml`.

---

## 3. Search Engine Indexation Boundaries

1. **Canonical URLs:** All calculator pages use their slug URL (`/calculators/[slug]`) as the canonical target.
2. **Sitemap Indexation:** Only canonical calculator pages, taxonomy categories, governance pages, and legal pages are included in `sitemap.xml`.
3. **Embed Pages:** All `/embed/[slug]` routes carry `robots: { index: false, follow: false }` and point their canonical link to the parent `/calculators/[slug]` page. Embeds will never compete in organic search results.
