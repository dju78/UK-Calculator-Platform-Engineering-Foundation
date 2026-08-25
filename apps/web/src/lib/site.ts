/**
 * Single source of truth for the canonical site origin and page metadata.
 *
 * The origin was previously hard-coded to a domain that does not serve the
 * application, which meant the sitemap advertised URLs on one host, the
 * OpenGraph tags claimed another, and the deployed site had no canonical at
 * all. Everything now derives from one value, overridable per environment.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://uk-calculator-platform.onrender.com"
).replace(/\/$/, "");

export const SITE_NAME = "UK Calculator Platform";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Canonical path for a calculator. Always the slug, never the internal id. */
export function calculatorPath(slug: string): string {
  return `/calculators/${slug}`;
}

/**
 * Canonical path for a category. The category name is percent-encoded exactly
 * once so the value is a valid URL component in sitemaps and link targets.
 */
export function categoryPath(category: string): string {
  return `/category/${encodeURIComponent(category.toLowerCase())}`;
}

const TAX_YEAR = "2026/27";

export interface CategoryDetails {
  title: string;
  summary: string;
  relatedCategories: string[];
}

export const CATEGORY_DETAILS: Record<string, CategoryDetails> = {
  "Automotive & Travel": {
    title: "Automotive & Travel",
    summary: "Plan journey expenses, fuel economy, electric vehicle charging costs, and vehicle depreciation with accurate UK road figures.",
    relatedCategories: ["Everyday & Lifestyle", "Finance & Debt", "Business & Commercial"]
  },
  "Business & Commercial": {
    title: "Business & Commercial",
    summary: "Calculate profit margins, break-even points, markup, VAT, and commercial cash flows for UK enterprises and self-employed professionals.",
    relatedCategories: ["UK Tax & Salary", "Finance & Debt", "Investing & Wealth"]
  },
  "Conversions": {
    title: "Conversions",
    summary: "Convert metric and imperial units, foreign currency mid-market rates, temperature, weight, volume, and data sizes.",
    relatedCategories: ["Science & Engineering", "Maths & Algebra", "Everyday & Lifestyle"]
  },
  "Date & Time": {
    title: "Date & Time",
    summary: "Calculate exact ages, working days, elapsed duration between calendar dates, leap year offsets, and countdowns.",
    relatedCategories: ["Everyday & Lifestyle", "Business & Commercial", "Education"]
  },
  "Education": {
    title: "Education",
    summary: "Work out university grade boundaries, GPA equivalents, study pacing, reading speeds, and educational test metrics.",
    relatedCategories: ["Everyday & Lifestyle", "Maths & Algebra", "Statistics & Data"]
  },
  "Everyday & Lifestyle": {
    title: "Everyday & Lifestyle",
    summary: "Simple everyday calculators for restaurant tip splitting, cooking conversions, party planning, and utility usage.",
    relatedCategories: ["Finance & Debt", "Health & Fitness", "Automotive & Travel"]
  },
  "Finance & Debt": {
    title: "Finance & Debt",
    summary: "Manage loans, credit card balances, personal finance budgets, APR comparisons, and debt payoff strategies.",
    relatedCategories: ["Mortgages & Property", "UK Tax & Salary", "Investing & Wealth"]
  },
  "Geometry": {
    title: "Geometry",
    summary: "Calculate perimeter, 2D area, 3D volume, surface area, and angles for shapes, polygons, and geometric structures.",
    relatedCategories: ["Home & Construction", "Maths & Algebra", "Science & Engineering"]
  },
  "Health & Fitness": {
    title: "Health & Fitness",
    summary: "Track body mass index (BMI), calorie and TDEE requirements, pregnancy milestones, target heart rates, and training metrics.",
    relatedCategories: ["Everyday & Lifestyle", "Education", "Science & Engineering"]
  },
  "Home & Construction": {
    title: "Home & Construction",
    summary: "Estimate DIY materials including paint coverage, wallpaper rolls, flooring packs, tile layouts, and brickwork.",
    relatedCategories: ["Geometry", "Mortgages & Property", "Everyday & Lifestyle"]
  },
  "ISA & Tax Wrappers": {
    title: "ISA & Tax Wrappers",
    summary: "Maximise tax-sheltered savings with Cash ISA, Stocks & Shares ISA, Lifetime ISA (LISA), and SIPP arbitrage tools.",
    relatedCategories: ["Investing & Wealth", "Pensions & Retirement", "UK Tax & Salary"]
  },
  "Investing & Wealth": {
    title: "Investing & Wealth",
    summary: "Model compound growth, regular investment plans, portfolio drawdown, Monte Carlo simulations, and Safe Withdrawal Rates.",
    relatedCategories: ["ISA & Tax Wrappers", "Pensions & Retirement", "Finance & Debt"]
  },
  "Maths & Algebra": {
    title: "Maths & Algebra",
    summary: "Solve percentages, ratios, fractions, quadratic equations, exponents, logarithms, and algebraic calculations.",
    relatedCategories: ["Statistics & Data", "Geometry", "Science & Engineering"]
  },
  "Mortgages & Property": {
    title: "Mortgages & Property",
    summary: "Calculate UK mortgage repayments, borrowing affordability, amortisation schedules, overpayments, Buy-to-Let ICR, and Stamp Duty (SDLT/LBTT/LTT).",
    relatedCategories: ["Finance & Debt", "UK Tax & Salary", "Home & Construction"]
  },
  "Pensions & Retirement": {
    title: "Pensions & Retirement",
    summary: "Plan retirement finances with workplace pension projections, SIPP contributions, 25% tax-free lump sum (PCLS), and FIRE runway tools.",
    relatedCategories: ["Investing & Wealth", "ISA & Tax Wrappers", "UK Tax & Salary"]
  },
  "Science & Engineering": {
    title: "Science & Engineering",
    summary: "Explore physics, chemistry, electronics (Ohm's law), kinetic energy, density, and scientific conversion equations.",
    relatedCategories: ["Conversions", "Maths & Algebra", "Geometry"]
  },
  "Statistics & Data": {
    title: "Statistics & Data",
    summary: "Compute statistical distributions, mean, median, standard deviation, sample size confidence intervals, and probability models.",
    relatedCategories: ["Maths & Algebra", "Technology & Digital", "Investing & Wealth"]
  },
  "Technology & Digital": {
    title: "Technology & Digital",
    summary: "Work out data transfer times, network bandwidth, storage unit conversions, password strength entropy, and Base64 encoding.",
    relatedCategories: ["Science & Engineering", "Statistics & Data", "Everyday & Lifestyle"]
  },
  "UK Tax & Salary": {
    title: "UK Tax & Salary",
    summary: "Calculate take-home pay, Income Tax, National Insurance, Scottish tax bands, VAT, student loan deductions, and child benefit charges for the 2026/27 tax year.",
    relatedCategories: ["Finance & Debt", "Pensions & Retirement", "Business & Commercial"]
  }
};

export function getCategoryDetails(category: string): CategoryDetails {
  const match = Object.entries(CATEGORY_DETAILS).find(
    ([k]) => k.toLowerCase() === category.toLowerCase()
  );
  if (match) return match[1];
  return {
    title: category,
    summary: `Browse free UK ${category.toLowerCase()} calculators with accurate mathematical models and transparent statutory rules.`,
    relatedCategories: ["Finance & Debt", "UK Tax & Salary", "Investing & Wealth"]
  };
}

/**
 * A distinct, useful description per calculator. Generic boilerplate repeated
 * across pages is treated as duplicate content by search engines, so the
 * description names the calculator, its subject area and - for rules-sensitive
 * calculators - the tax year the figures apply to.
 */
export function calculatorDescription(calc: {
  name: string;
  category: string;
  subcategory?: string;
  rulesSensitive?: boolean;
}): string {
  const topic = calc.subcategory ? `${calc.subcategory.toLowerCase()} ` : "";
  const base = `Free ${calc.name.replace(/ Calculator$/i, "")} calculator for the UK. Work out ${topic}figures in the ${calc.category.toLowerCase()} category`;
  return calc.rulesSensitive
    ? `${base}, using ${TAX_YEAR} UK rules. Estimates only - not financial or tax advice.`
    : `${base}. Estimates only - not financial or tax advice.`;
}

export function categoryDescription(category: string, count: number): string {
  const details = getCategoryDetails(category);
  return `Browse ${count} free UK ${details.title.toLowerCase()} calculators. ${details.summary}`;
}

