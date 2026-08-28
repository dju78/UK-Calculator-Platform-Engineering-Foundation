export interface ReleaseMilestone {
  version: string;
  codename: string;
  date: string;
  calculatorCount: number;
  description: string;
  keyDeliverables: string[];
  status: "CURRENT" | "RELEASED" | "PLANNED";
}

export interface AdminReleaseOverview {
  platformVersion: string;
  adminVersion: string;
  activeRuleset: string;
  totalCalculators: number;
  gitBranch: string;
  milestones: ReleaseMilestone[];
  externalIntegrations: Array<{
    name: string;
    description: string;
    readyInPhase: string;
  }>;
}

export function getAdminReleaseOverview(): AdminReleaseOverview {
  const milestones: ReleaseMilestone[] = [
    {
      version: "v0.1.0-admin",
      codename: "Admin Console Phase 1",
      date: "2026-08-28",
      calculatorCount: 253,
      description: "Private, read-only operational management console for platform owner.",
      keyDeliverables: [
        "Authenticated private dashboard with HMAC-SHA256 session guard",
        "Full calculator registry search, category filtering and detailed specification views",
        "2026/27 UK rules & statutory governance registry",
        "QA verification evidence, benchmark counts and WCAG accessibility audit tracking",
        "Search & SEO readiness visibility including IndexNow integration confirmation",
      ],
      status: "CURRENT",
    },
    {
      version: "v0.1.0-growth",
      codename: "Professionalisation Phase 6: Growth & SEO",
      date: "2026-08-28",
      calculatorCount: 253,
      description: "IndexNow standard protocol integration, privacy-safe analytics foundation.",
      keyDeliverables: [
        "IndexNow URL update notification tool and key verification",
        "Privacy-first measurement framework (zero client calculation telemetry)",
        "Canonical domain hardening (ukcalc.jomovate.com)",
      ],
      status: "RELEASED",
    },
    {
      version: "v0.1.0-phase5",
      codename: "Professionalisation Phase 5: Utility & Parity",
      date: "2026-08-26",
      calculatorCount: 253,
      description: "Local utility tools, result copying, print stylesheets, 1642 browser tests.",
      keyDeliverables: [
        "Privacy-safe URL share token generator",
        "Clean result text formatter and print stylesheets",
        "Favourites and recent calculator localStorage manager",
        "1642-test Playwright browser parity validation",
      ],
      status: "RELEASED",
    },
    {
      version: "v0.1.0-phase4",
      codename: "Professionalisation Phase 4: Governance & A11y",
      date: "2026-08-25",
      calculatorCount: 253,
      description: "Comprehensive WCAG 2.2 AA accessibility audit, editorial policies.",
      keyDeliverables: [
        "WCAG 2.2 AA compliance across all 253 calculators",
        "Editorial Policy, Methodology verification and Organisation hub",
        "Statutory tax and conveyancing disclaimer hierarchy",
      ],
      status: "RELEASED",
    },
    {
      version: "v0.1.0-wave3",
      codename: "Wave 3: Advanced Financial Tools",
      date: "2026-08-25",
      calculatorCount: 253,
      description: "10 high-precision specialist calculators (Monte Carlo, SWR, Property CGT, HICBC).",
      keyDeliverables: [
        "Added PRO-008, PRO-028, INV-025..029, ISA-007, TAX-013, TAX-019, PEN-011",
        "50 independently derived benchmark fixtures",
        "Monte Carlo simulation PRNG with deterministic seeding",
      ],
      status: "RELEASED",
    },
    {
      version: "v0.1.0-wave2",
      codename: "Wave 2: Full Platform Expansion",
      date: "2026-08-22",
      calculatorCount: 243,
      description: "188 calculators across 19 categories covering finance, science, maths, lifestyle.",
      keyDeliverables: [
        "188 calculators implemented and verified with 1164 benchmark test cases",
        "2026/27 statutory ruleset integration (Income Tax, NI, SDLT, LBTT, LTT)",
        "Responsive UI components and field mapping architecture",
      ],
      status: "RELEASED",
    },
    {
      version: "v0.1.0-wave1",
      codename: "Wave 1: Engineering Foundation",
      date: "2026-08-15",
      calculatorCount: 55,
      description: "Core UK calculator foundation, salary tax, mortgage and loan calculation engine.",
      keyDeliverables: [
        "55 foundational UK calculators with 275 reference benchmarks",
        "Rules engine architecture with progressive band calculator",
        "Next.js SSG frontend foundation with Tailwind CSS",
      ],
      status: "RELEASED",
    },
  ];

  return {
    platformVersion: "0.1.0",
    adminVersion: "0.1.0",
    activeRuleset: "uk-2026-27-v1",
    totalCalculators: 253,
    gitBranch: "admin-console-phase-1",
    milestones,
    externalIntegrations: [
      {
        name: "GitHub Actions / Workflow API",
        description: "Live CI/CD workflow status, commit history, and test run triggers.",
        readyInPhase: "Phase 2",
      },
      {
        name: "Vercel Deployment & Webhook API",
        description: "Real-time deployment previews, build logs, and environment variable synchronization.",
        readyInPhase: "Phase 2",
      },
    ],
  };
}

