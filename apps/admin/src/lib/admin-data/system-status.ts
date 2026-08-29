export interface MonorepoPackageInfo {
  name: string;
  type: "package" | "application";
  description: string;
  path: string;
  status: "active" | "protected";
}

export type DomainStatus = "ACTIVE" | "PENDING" | "ERROR";

export interface DomainServingInfo {
  domain: string;
  role: "Admin Console" | "Public Application";
  status: DomainStatus;
  statusLabel: string;
  subtext: string;
  description: string;
}

export interface AdminSystemOverview {
  environment: string;
  productionDomain: string;
  adminDomain: string;
  adminDomainInfo: DomainServingInfo;
  publicDomainInfo: DomainServingInfo;
  adminVersion: string;
  nextVersion: string;
  reactVersion: string;
  nodeVersion: string;
  packages: MonorepoPackageInfo[];
  securityHeaders: Array<{ header: string; value: string; purpose: string }>;
  authPolicy: {
    type: string;
    cookieName: string;
    sessionDuration: string;
    encryption: string;
    csrfProtection: string;
  };
}

export function getAdminSystemOverview(): AdminSystemOverview {
  const packages: MonorepoPackageInfo[] = [
    {
      name: "packages/calculation-engine",
      type: "package",
      description: "Isolated core calculation engine, financial formulas, numerical algorithms, and wave handlers.",
      path: "packages/calculation-engine",
      status: "protected",
    },
    {
      name: "packages/calculator-registry",
      type: "package",
      description: "Single source of truth for calculator definitions, categorisation, risk levels, and wave metadata.",
      path: "packages/calculator-registry",
      status: "protected",
    },
    {
      name: "packages/rules-uk",
      type: "package",
      description: "Statutory UK tax, NI, pension, property, and wrapper rates (2026/27 approved ruleset).",
      path: "packages/rules-uk",
      status: "protected",
    },
    {
      name: "packages/test-fixtures",
      type: "package",
      description: "1489 independent reference benchmark cases for automated verification.",
      path: "packages/test-fixtures",
      status: "protected",
    },
    {
      name: "apps/web",
      type: "application",
      description: "Public Next.js calculator application served at ukcalc.jomovate.com.",
      path: "apps/web",
      status: "active",
    },
    {
      name: "apps/admin",
      type: "application",
      description: "Private operational management console served at admin.ukcalc.jomovate.com.",
      path: "apps/admin",
      status: "active",
    },
  ];

  const securityHeaders = [
    {
      header: "X-Frame-Options",
      value: "DENY",
      purpose: "Completely prevents clickjacking by forbidding embedding in iframes.",
    },
    {
      header: "Content-Security-Policy",
      value: "frame-ancestors 'none';",
      purpose: "Restricts frame embedding in all modern user agents.",
    },
    {
      header: "Strict-Transport-Security (HSTS)",
      value: "max-age=63072000; includeSubDomains; preload",
      purpose: "Forces all browser traffic over HTTPS with 2-year duration.",
    },
    {
      header: "X-Content-Type-Options",
      value: "nosniff",
      purpose: "Prevents MIME-type sniffing.",
    },
    {
      header: "Referrer-Policy",
      value: "origin-when-cross-origin",
      purpose: "Protects sensitive URL query parameters across cross-origin requests.",
    },
  ];

  const adminDomainInfo: DomainServingInfo = {
    domain: "admin.ukcalc.jomovate.com",
    role: "Admin Console",
    status: "ACTIVE",
    statusLabel: "Active Production Host",
    subtext: "Connected & serving over HTTPS",
    description: "Authoritative production custom domain serving the private operational management console over HTTPS.",
  };

  const publicDomainInfo: DomainServingInfo = {
    domain: "ukcalc.jomovate.com",
    role: "Public Application",
    status: "ACTIVE",
    statusLabel: "Active Canonical",
    subtext: "Connected & serving over HTTPS",
    description: "Authoritative canonical domain for public calculator pages, sitemap.xml, robots.txt, and IndexNow protocol verification.",
  };

  return {
    environment: process.env.NODE_ENV || "development",
    productionDomain: "https://ukcalc.jomovate.com",
    adminDomain: "https://admin.ukcalc.jomovate.com",
    adminDomainInfo,
    publicDomainInfo,
    adminVersion: "0.1.0",
    nextVersion: "16.3.2",
    reactVersion: "19.2.8",
    nodeVersion: process.version,
    packages,
    securityHeaders,
    authPolicy: {
      type: "Signed HTTP-Only Session Cookie",
      cookieName: "ukcalc_admin_session",
      sessionDuration: "8 Hours (28,800 seconds)",
      encryption: "HMAC-SHA256 Web Crypto Signature",
      csrfProtection: "SameSite=Lax with Strict Origin Verification",
    },
  };
}
