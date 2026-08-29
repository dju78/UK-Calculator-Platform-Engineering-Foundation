import { calculatorDescription, SITE_NAME } from "./site";

export interface PrioritySEOMetadata {
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
}

/**
 * Editorial Search-Intent & Metadata Mapping for high-value UK calculator journeys.
 * These hand-crafted titles and descriptions optimize CTR and satisfy genuine search intent,
 * while all other calculators cleanly fall back to the dynamic generator.
 */
export const PRIORITY_SEO_METADATA: Record<string, PrioritySEOMetadata> = {
  "TAX-001": {
    title: `UK Income Tax Calculator 2026/27 | Free Tax & Take-Home Tool | ${SITE_NAME}`,
    description: "Calculate your UK income tax, personal allowance taper, and taxable bands for the 2026/27 tax year with official HMRC rates. Includes Scottish tax bands and National Insurance deductions.",
    primaryKeyword: "income tax calculator uk",
    secondaryKeywords: ["uk income tax 2026/27", "personal allowance taper calculator", "hmrc income tax rates"],
    searchIntent: "Calculate personal income tax liabilities, marginal rates, and tax band thresholds under 2026/27 rules.",
  },
  "TAX-002": {
    title: `UK Salary Calculator 2026/27 | Gross to Net Pay & Deductions | ${SITE_NAME}`,
    description: "Calculate your net monthly and annual salary after 2026/27 UK Income Tax, National Insurance, student loans, and pension contributions. Fast, free, and accurate.",
    primaryKeyword: "salary calculator uk",
    secondaryKeywords: ["gross to net salary uk", "wage calculator uk", "paye tax calculator"],
    searchIntent: "Determine net pay after PAYE income tax, National Insurance, student loan, and pension deductions.",
  },
  "TAX-003": {
    title: `Take-Home Pay Calculator 2026/27 | UK Net Salary & Wage Tool | ${SITE_NAME}`,
    description: "Work out exactly how much net cash you take home each week, month, and year after UK tax, NI, and pension deductions under 2026/27 statutory rules.",
    primaryKeyword: "take home pay calculator",
    secondaryKeywords: ["net pay calculator uk", "monthly take home pay", "how much tax will i pay"],
    searchIntent: "Calculate exact net take-home pay per week, month, or year for household budgeting.",
  },
  "TAX-004": {
    title: `UK National Insurance Calculator 2026/27 | Class 1 NI Contributions | ${SITE_NAME}`,
    description: "Calculate employee and employer Class 1 National Insurance contributions using current UK statutory thresholds and 2026/27 rates.",
    primaryKeyword: "national insurance calculator",
    secondaryKeywords: ["class 1 ni calculator", "how much national insurance do i pay", "employer ni calculator uk"],
    searchIntent: "Calculate employee Class 1 NI contributions and understand Primary and Secondary thresholds.",
  },
  "TAX-015": {
    title: `UK VAT Calculator | Add or Remove 20%, 5% and 0% VAT | ${SITE_NAME}`,
    description: "Quickly add or remove 20% standard rate, 5% reduced rate, or zero-rate UK VAT. Get instant net, gross, and VAT amount breakdown.",
    primaryKeyword: "vat calculator uk",
    secondaryKeywords: ["add vat calculator", "remove vat calculator", "20 percent vat calculation"],
    searchIntent: "Add or strip 20% or 5% VAT from prices for invoicing, accounting, or consumer price checking.",
  },
  "PRO-001": {
    title: `UK Mortgage Repayment Calculator | Monthly Payments & Amortisation | ${SITE_NAME}`,
    description: "Calculate your monthly mortgage repayments, total interest payable, and amortisation schedule across any UK loan term and interest rate.",
    primaryKeyword: "mortgage repayment calculator uk",
    secondaryKeywords: ["uk mortgage calculator", "monthly mortgage payment", "mortgage interest calculator"],
    searchIntent: "Estimate monthly capital and interest mortgage payments across varying terms and rates.",
  },
  "PRO-002": {
    title: `UK Mortgage Affordability Calculator | How Much Can You Borrow? | ${SITE_NAME}`,
    description: "Estimate how much you can borrow for a UK home based on your salary, deposit, and lender stress test criteria. Understand your borrowing limits.",
    primaryKeyword: "mortgage affordability calculator",
    secondaryKeywords: ["how much mortgage can i get", "borrowing capacity calculator uk", "salary multiple mortgage"],
    searchIntent: "Determine maximum mortgage borrowing capacity based on household income and commitments.",
  },
  "PRO-023": {
    title: `Stamp Duty Calculator 2026/27 | UK SDLT Rates for Home Buyers | ${SITE_NAME}`,
    description: "Calculate UK Stamp Duty Land Tax (SDLT) on residential property purchases. Includes first-time buyer relief, home mover, and additional property surcharge rates.",
    primaryKeyword: "stamp duty calculator",
    secondaryKeywords: ["sdlt calculator uk", "stamp duty land tax", "first time buyer stamp duty"],
    searchIntent: "Calculate statutory Stamp Duty Land Tax (SDLT) brackets on English and Northern Irish property purchases.",
  },
  "INV-002": {
    title: `Compound Interest Calculator UK | Daily, Monthly & Annual Compounding | ${SITE_NAME}`,
    description: "Forecast long-term investment growth with compound interest and regular monthly deposits. See the exponential impact of reinvested returns over time.",
    primaryKeyword: "compound interest calculator uk",
    secondaryKeywords: ["compound interest formula", "investment growth calculator", "savings compounding tool"],
    searchIntent: "Model exponential capital accumulation over time with regular deposits and compounding frequency.",
  },
  "PEN-001": {
    title: `UK Pension Growth Calculator | Retirement Pot & Forecast Tool | ${SITE_NAME}`,
    description: "Project the future value of your UK pension pot, tax relief contributions, and estimated retirement income based on investment returns and inflation.",
    primaryKeyword: "pension calculator uk",
    secondaryKeywords: ["pension pot forecast", "workplace pension projection", "how much pension will i get"],
    searchIntent: "Forecast retirement pot size, ongoing contributions with tax relief, and sustainable retirement income.",
  },
  "PRO-028": {
    title: `Property Capital Gains Tax Calculator | UK Residential CGT Tool | ${SITE_NAME}`,
    description: "Calculate UK Capital Gains Tax on residential property sales. Accounts for Private Residence Relief (PRR), allowable deductions, and current CGT statutory rates.",
    primaryKeyword: "property capital gains tax calculator",
    secondaryKeywords: ["cgt on property sale", "buy to let capital gains tax", "private residence relief cgt"],
    searchIntent: "Calculate Capital Gains Tax liability on buy-to-let or second home sales after reliefs and allowances.",
  },
  "TAX-020": {
    title: `Student Loan Repayment Calculator | UK Plan 1, 2, 4, 5 & Postgrad | ${SITE_NAME}`,
    description: "Calculate monthly student loan repayments for Plan 1, Plan 2, Plan 4 (Scotland), Plan 5, and Postgraduate loans based on your UK salary and statutory thresholds.",
    primaryKeyword: "student loan repayment calculator uk",
    secondaryKeywords: ["plan 2 student loan repayment", "student loan deductions paye", "plan 5 student loan threshold"],
    searchIntent: "Determine monthly student loan PAYE deductions across all UK repayment plan types.",
  },
  "ISA-007": {
    title: `SIPP vs ISA Calculator UK | Tax Relief & Growth Comparison | ${SITE_NAME}`,
    description: "Compare pension tax relief upfront with tax-free ISA withdrawals at retirement. Model the optimal tax-efficient wealth accumulation strategy.",
    primaryKeyword: "sipp vs isa calculator",
    secondaryKeywords: ["pension vs isa comparison", "sipp tax relief vs isa", "retirement tax efficiency"],
    searchIntent: "Evaluate the mathematical tax arbitrage between SIPP pension contributions and ISA savings wrappers.",
  },
  "PEN-011": {
    title: `FIRE Calculator UK | Financial Independence & Early Retirement Runway | ${SITE_NAME}`,
    description: "Calculate your Financial Independence number, annual withdrawal rate, and years until retirement based on your savings rate and investment returns.",
    primaryKeyword: "fire calculator uk",
    secondaryKeywords: ["financial independence retire early uk", "fire number calculator", "early retirement runway"],
    searchIntent: "Calculate the required FIRE portfolio target and years to financial independence based on annual expenses.",
  },
  "AUT-006": {
    title: `UK Fuel Cost Calculator | Journey Petrol, Diesel & Mileage Expense | ${SITE_NAME}`,
    description: "Calculate the total fuel cost and cost per person for any UK car journey based on distance, mpg economy, and current petrol or diesel prices.",
    primaryKeyword: "fuel cost calculator uk",
    secondaryKeywords: ["petrol cost calculator", "diesel journey cost", "mileage cost per mile uk"],
    searchIntent: "Calculate total journey fuel costs and per-passenger split based on distance, fuel economy, and price per litre.",
  },
};

/**
 * Returns intent-matched metadata for priority calculators, or defaults to the standard formula.
 */
export function getCalculatorSEOMetadata(calc: {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory?: string;
  rulesSensitive?: boolean;
}): {
  title: string;
  description: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: string;
} {
  const priority = PRIORITY_SEO_METADATA[calc.id];
  if (priority) {
    return {
      title: priority.title,
      description: priority.description,
      primaryKeyword: priority.primaryKeyword,
      secondaryKeywords: priority.secondaryKeywords,
      searchIntent: priority.searchIntent,
    };
  }

  return {
    title: `${calc.name} | ${SITE_NAME}`,
    description: calculatorDescription(calc),
  };
}
