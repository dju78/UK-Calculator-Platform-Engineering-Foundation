/**
 * The source hierarchy the platform's editorial content is held to.
 *
 * The hierarchy exists so that "we checked it" has a testable meaning. A tier
 * is assigned from the source's own domain rather than from a hand-set field,
 * because a hand-set tier is exactly the field an author would get wrong under
 * deadline, and a mis-tiered source is how a blog post ends up standing in for
 * legislation.
 */
import type { SourceTier, SourceTierDefinition } from "./types.js";

/**
 * Domains whose publisher is a statutory, regulatory or official national
 * body. A Tier 1 source may stand alone as authority for a statutory figure.
 *
 * Matched on registrable-domain suffix, so `www.gov.uk`, `assets.gov.uk` and
 * `taxsummaries.gov.uk` all resolve alike, and a lookalike host such as
 * `gov.uk.example.com` does not.
 */
const TIER_1_DOMAINS = [
  "gov.uk",           // GOV.UK, HMRC, DWP, ONS, VOA and other departments
  "legislation.gov.uk",
  "parliament.uk",
  "gov.scot",
  "gov.wales",
  "revenue.scot",     // Revenue Scotland - devolved statutory tax authority
  "wra.gov.wales",    // Welsh Revenue Authority
  "nidirect.gov.uk",
  "fca.org.uk",       // Financial Conduct Authority, incl. handbook subdomain
  "bankofengland.co.uk",
  "ons.gov.uk",
  "nhs.uk",
  "nice.org.uk",      // NICE - statutory clinical guidance body
  "pensionsregulator.gov.uk",
  "hmrc.gov.uk",
];

/**
 * Domains of authoritative institutional bodies that are not themselves the
 * statutory source. MoneyHelper is government-backed guidance from the Money
 * and Pensions Service, which makes it reliable and citable - but the rule it
 * describes still lives in legislation or HMRC guidance, so it is Tier 2.
 */
const TIER_2_DOMAINS = [
  "moneyhelper.org.uk",
  "maps.org.uk",
  "pensionwise.gov.uk",
  "britishheartfoundation.org.uk",
  "resolutionfoundation.org",
  "ifs.org.uk",
];

/** Host matches a registrable-domain suffix rather than a substring. */
function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** The hostname of an absolute URL, lowercased, or "" if unparseable. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * The tier a cited source belongs to.
 *
 * Anything not on an explicitly recognised list is Tier 3: unknown provenance
 * defaults to the weakest standing, never the strongest.
 */
export function sourceTier(url: string): SourceTier {
  const host = hostOf(url);
  if (!host) return 3;
  if (TIER_1_DOMAINS.some((d) => hostMatches(host, d))) return 1;
  if (TIER_2_DOMAINS.some((d) => hostMatches(host, d))) return 2;
  return 3;
}

/** Whether a source may stand alone as authority for a statutory figure. */
export function isPrimaryOfficialSource(url: string): boolean {
  return sourceTier(url) === 1;
}

/** The published hierarchy, rendered on /how-we-check-our-figures. */
export const SOURCE_HIERARCHY: SourceTierDefinition[] = [
  {
    tier: 1,
    name: "Primary official sources",
    description:
      "The statutory, regulatory and official national bodies that set or publish a rule in the first place: legislation itself, the department that administers it, or the regulator that supervises it.",
    standing:
      "Required for every statutory figure. A Tier 1 source is the only kind that can stand on its own as authority for a tax rate, threshold, benefit amount or statutory formula.",
    publishers: [
      "GOV.UK and its departments, including HMRC and DWP",
      "legislation.gov.uk",
      "Revenue Scotland and the Welsh Revenue Authority",
      "Financial Conduct Authority",
      "Bank of England",
      "Office for National Statistics",
      "NHS and NICE for health guidance",
    ],
  },
  {
    tier: 2,
    name: "Authoritative institutional sources",
    description:
      "Public-interest bodies that explain or consolidate official rules accurately, including government-backed guidance services and established research institutes.",
    standing:
      "Used for explanation, corroboration and worked context. A Tier 2 source may clarify how a rule is applied in practice, but it may not be the only evidence behind a statutory value.",
    publishers: [
      "MoneyHelper, from the Money and Pensions Service",
      "Pension Wise",
      "Established independent research institutes",
    ],
  },
  {
    tier: 3,
    name: "Secondary explanatory sources",
    description:
      "General reference material, industry commentary and educational writing.",
    standing:
      "Background reading only. A Tier 3 source is never sufficient evidence for a rule-sensitive figure, and search-result snippets and AI-generated summaries do not count as sources at any tier.",
    publishers: [
      "Industry and professional commentary",
      "General reference and educational material",
    ],
  },
];

/** Tier definition lookup, for rendering a tier badge next to a source. */
export function getSourceTierDefinition(tier: SourceTier): SourceTierDefinition {
  const found = SOURCE_HIERARCHY.find((t) => t.tier === tier);
  if (!found) throw new Error(`Unknown source tier: ${tier}`);
  return found;
}
