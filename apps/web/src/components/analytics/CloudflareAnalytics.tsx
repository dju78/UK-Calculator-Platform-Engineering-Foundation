import React from "react";

/**
 * Cloudflare Web Analytics free, privacy-first beacon integration.
 * Only rendered on the public web application when NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN is set.
 * Does NOT collect personal data, IP addresses, cookies, or fingerprinting.
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  const beaconConfig = JSON.stringify({ token: token.trim() });

  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={beaconConfig}
    />
  );
}
