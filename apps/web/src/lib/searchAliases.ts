/**
 * Deterministic Search Aliases & Synonym Index for UK Calculator Platform.
 *
 * Maps colloquial and industry terms (e.g. "PAYE", "stamp duty", "snowball", "HICBC", "FIRE")
 * to calculator IDs, slugs, and terms to enable instant discoverability.
 */

export interface SearchAliasEntry {
  keywords: string[];
  calculatorIds?: string[];
  calculatorSlugs?: string[];
  categories?: string[];
}

export const SEARCH_ALIASES: SearchAliasEntry[] = [
  // Tax & Salary
  {
    keywords: ["paye", "tax", "income tax", "wage", "take home", "takehome", "net pay", "salary calculator"],
    calculatorIds: ["TAX-001", "TAX-002", "TAX-003"]
  },
  {
    keywords: ["national insurance", "ni", "class 1", "nic"],
    calculatorIds: ["TAX-004", "TAX-001", "TAX-003"]
  },
  {
    keywords: ["student loan", "plan 1", "plan 2", "plan 4", "plan 5", "postgraduate loan"],
    calculatorIds: ["TAX-005", "TAX-001", "TAX-003"]
  },
  {
    keywords: ["scottish tax", "scotland tax", "scottish rate", "starter rate", "intermediate rate", "advanced rate", "top rate"],
    calculatorIds: ["TAX-001", "TAX-003", "TAX-008"]
  },
  {
    keywords: ["vat", "value added tax", "sales tax", "standard rate vat", "20% vat"],
    calculatorIds: ["TAX-015", "TAX-016"]
  },
  {
    keywords: ["hicbc", "child benefit", "high income child benefit charge", "child benefit tax"],
    calculatorIds: ["TAX-019"]
  },
  {
    keywords: ["dividend", "dividends", "dividend tax", "gia", "general investment account tax"],
    calculatorIds: ["TAX-013"]
  },
  {
    keywords: ["capital gains", "cgt", "annual exempt amount", "chattels", "crypto tax"],
    calculatorIds: ["TAX-013", "PRO-028"]
  },

  // Mortgages & Property
  {
    keywords: ["sdlt", "stamp duty", "stamp duty land tax", "property tax england", "first time buyer stamp duty"],
    calculatorIds: ["PRO-023", "PRO-024", "PRO-025"]
  },
  {
    keywords: ["lbtt", "land and buildings transaction tax", "stamp duty scotland"],
    calculatorIds: ["PRO-026"]
  },
  {
    keywords: ["ltt", "land transaction tax", "stamp duty wales"],
    calculatorIds: ["PRO-027"]
  },
  {
    keywords: ["mortgage", "mortgage repayment", "home loan", "monthly mortgage payment"],
    calculatorIds: ["PRO-001", "PRO-002", "PRO-003"]
  },
  {
    keywords: ["fixed vs tracker", "tracker mortgage", "fixed rate mortgage", "mortgage comparison"],
    calculatorIds: ["PRO-008"]
  },
  {
    keywords: ["ltv", "loan to value", "deposit percentage"],
    calculatorIds: ["PRO-010"]
  },
  {
    keywords: ["property deposit", "saving for house", "mortgage deposit"],
    calculatorIds: ["PRO-011"]
  },
  {
    keywords: ["rental yield", "gross rental yield", "net rental yield", "landlord yield"],
    calculatorIds: ["PRO-016"]
  },
  {
    keywords: ["buy to let", "btl", "icr", "interest coverage ratio", "landlord tax"],
    calculatorIds: ["PRO-018", "PRO-019"]
  },
  {
    keywords: ["property cgt", "second home capital gains", "private residence relief", "prr"],
    calculatorIds: ["PRO-028"]
  },

  // Investing & Wealth
  {
    keywords: ["compound interest", "compounding", "interest on interest", "exponential growth"],
    calculatorIds: ["INV-002", "INV-001"]
  },
  {
    keywords: ["cagr", "compound annual growth rate", "annualised return"],
    calculatorIds: ["INV-007"]
  },
  {
    keywords: ["roi", "return on investment", "profit percentage"],
    calculatorIds: ["INV-008"]
  },
  {
    keywords: ["irr", "internal rate of return", "npv", "cash flow yield"],
    calculatorIds: ["INV-009"]
  },
  {
    keywords: ["fee drag", "fund fees", "platform fee", "ter", "total expense ratio", "ongoing charges"],
    calculatorIds: ["INV-011"]
  },
  {
    keywords: ["portfolio drawdown", "drawdown calculator", "retirement decumulation", "pot exhaustion"],
    calculatorIds: ["INV-025"]
  },
  {
    keywords: ["safe withdrawal rate", "swr", "4% rule", "4 percent rule", "trinity study"],
    calculatorIds: ["INV-026"]
  },
  {
    keywords: ["portfolio rebalance", "asset allocation", "rebalancing", "target weights"],
    calculatorIds: ["INV-027"]
  },
  {
    keywords: ["monte carlo", "stochastic simulation", "market volatility", "sequence of returns risk"],
    calculatorIds: ["INV-029"]
  },

  // ISA & Pensions
  {
    keywords: ["isa", "stocks and shares isa", "cash isa", "isa allowance", "20000 isa"],
    calculatorIds: ["ISA-001", "ISA-002", "ISA-007"]
  },
  {
    keywords: ["lisa", "lifetime isa", "25% bonus", "first home bonus"],
    calculatorIds: ["ISA-003"]
  },
  {
    keywords: ["pension", "workplace pension", "pension projection", "sipp", "pension pot"],
    calculatorIds: ["PEN-001", "PEN-002", "PEN-003"]
  },
  {
    keywords: ["fire", "financial independence", "retire early", "lean fire", "fat fire", "coast fire"],
    calculatorIds: ["PEN-011"]
  },
  {
    keywords: ["sipp vs isa", "pension vs isa", "tax relief arbitrage"],
    calculatorIds: ["ISA-007"]
  },
  {
    keywords: ["pcls", "25% tax free", "pension lump sum"],
    calculatorIds: ["PEN-006"]
  },

  // Debt & Personal Finance
  {
    keywords: ["apr", "annual percentage rate", "aer", "loan interest"],
    calculatorIds: ["FIN-006", "FIN-001"]
  },
  {
    keywords: ["credit card", "credit card payoff", "minimum payments", "card debt"],
    calculatorIds: ["FIN-009"]
  },
  {
    keywords: ["snowball", "avalanche", "debt payoff", "debt consolidation", "clear debt"],
    calculatorIds: ["FIN-011"]
  },
  {
    keywords: ["budget", "50/30/20", "monthly expenses", "household budget"],
    calculatorIds: ["FIN-013"]
  },

  // Health
  {
    keywords: ["bmi", "body mass index", "healthy weight", "underweight", "overweight", "obesity"],
    calculatorIds: ["HLT-001"]
  },
  {
    keywords: ["calorie", "tdee", "bmr", "maintenance calories", "calorie deficit"],
    calculatorIds: ["HLT-002", "HLT-003"]
  },
  {
    keywords: ["due date", "pregnancy", "estimated due date", "edd", "conception date", "weeks pregnant"],
    calculatorIds: ["HLT-006", "HLT-007"]
  },

  // Business & Everyday
  {
    keywords: ["margin", "profit margin", "gross margin", "net margin"],
    calculatorIds: ["BUS-001"]
  },
  {
    keywords: ["break even", "breakeven", "fixed costs", "variable costs"],
    calculatorIds: ["BUS-006"]
  },
  {
    keywords: ["discount", "sale price", "percentage off"],
    calculatorIds: ["BUS-008"]
  },
  {
    keywords: ["currency", "fx", "forex", "exchange rate", "euro to gbp", "dollar to gbp", "convert currency"],
    calculatorIds: ["CON-010"]
  },
  {
    keywords: ["fuel cost", "petrol cost", "diesel cost", "mpg", "mileage cost", "journey cost"],
    calculatorIds: ["AUT-001", "AUT-006"]
  },
  {
    keywords: ["age", "date of birth", "exact age", "how old am i", "days old"],
    calculatorIds: ["DAT-001"]
  },
  {
    keywords: ["password", "password strength", "entropy", "password security", "passphrase"],
    calculatorIds: ["TEC-005"]
  }
];

/**
 * Check if a calculator matches query keywords via deterministic aliases.
 */
export function getCalculatorIdsForQuery(query: string): Set<string> {
  const normalized = query.trim().toLowerCase();
  const matchedIds = new Set<string>();
  if (!normalized) return matchedIds;

  const tokens = normalized.split(/\s+/).filter(Boolean);

  for (const entry of SEARCH_ALIASES) {
    const hasMatch = entry.keywords.some(kw => {
      const kwLower = kw.toLowerCase();
      // Match full phrase or all individual query tokens
      if (kwLower.includes(normalized) || normalized.includes(kwLower)) {
        return true;
      }
      return tokens.every(token => kwLower.includes(token));
    });

    if (hasMatch && entry.calculatorIds) {
      for (const id of entry.calculatorIds) {
        matchedIds.add(id);
      }
    }
  }

  return matchedIds;
}
