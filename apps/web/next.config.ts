import type { NextConfig } from "next";

const baseSecurityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

const standardHeaders = [
  ...baseSecurityHeaders,
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self';"
  }
];

const embedHeaders = [
  ...baseSecurityHeaders,
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors *;"
  }
];

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: embedHeaders,
      },
      {
        source: '/((?!embed).*)',
        headers: standardHeaders,
      },
    ];
  },
};

export default nextConfig;
