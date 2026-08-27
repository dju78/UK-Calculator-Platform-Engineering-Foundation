import { notFound } from "next/navigation";
import { liveCalculators, getLiveCalculator } from "@/lib/calculators";
import { Badge } from "@/components/ui/Badge";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
// Phase 2 rendering hook. See docs/PHASE2_INTEGRATION_NOTES.md.
import { CalculatorGuideSection } from "@/components/calculators/CalculatorGuide";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RelatedCalculators } from "@/components/calculators/RelatedCalculators";
import { CalculatorPageUtility } from "@/components/calculators/CalculatorPageUtility";
import { AdSlot } from "@/components/commercial/AdSlot";
import { Metadata } from "next";
import {
  SITE_NAME,
  absoluteUrl,
  calculatorDescription,
  calculatorPath,
  categoryPath,
  getApplicationCategory,
} from "@/lib/site";

// Generate static params for all calculators
export function generateStaticParams() {
  return liveCalculators.map((calc) => ({
    slug: calc.slug,
  }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const calc = getLiveCalculator(params.slug);
  
  if (!calc) {
    return {
      title: 'Calculator Not Found',
    };
  }

  const title = `${calc.name} | ${SITE_NAME}`;
  const description = calculatorDescription(calc);
  const path = calculatorPath(calc.slug);

  return {
    title,
    description,
    // Canonical is the slug URL, so the internal-id form of the route can
    // never be indexed as a duplicate of the same page.
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CalculatorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const calc = getLiveCalculator(params.slug);
  
  if (!calc) {
    notFound();
  }

  const UiComponent = getCalculatorComponent(calc.id);

  const appCategory = getApplicationCategory(calc.category);

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto" data-calculator-id={calc.id}>
      <script
        type="application/ld+json"
        // Structured data describing the tool itself. Kept minimal and factual
        // so it stays valid: no invented ratings, prices or authorship.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: calc.name,
            url: absoluteUrl(calculatorPath(calc.slug)),
            description: calculatorDescription(calc),
            ...(appCategory ? { applicationCategory: appCategory } : {}),
            operatingSystem: "Any",
            isAccessibleForFree: true,
            inLanguage: "en-GB",
            provider: { "@type": "Organization", name: "Jomovate" },
          }),
        }}
      />

      <Breadcrumbs
        items={[
          { label: calc.category, href: categoryPath(calc.category) },
          { label: calc.name },
        ]}
      />

      <CalculatorPageUtility
        slug={calc.slug}
        name={calc.name}
        rulesSensitive={calc.rulesSensitive}
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-2xs no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge>{calc.category}</Badge>
          {calc.subcategory && <Badge variant="outline">{calc.subcategory}</Badge>}
          {calc.rulesSensitive && <Badge variant="outline">2026/27 Tax Year</Badge>}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-950">{calc.name}</h1>
      </div>

      {calc.implementationStatus !== "implemented" ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-slate-700 shadow-2xs">
          <p className="mb-2 font-semibold text-lg text-slate-900">Calculator implementation in progress</p>
          <p className="text-sm text-slate-600">The user interface for this calculator is currently being prepared.</p>
        </div>
      ) : UiComponent ? (
        UiComponent
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center text-slate-600 shadow-2xs">
          <p>Calculator interface loading...</p>
        </div>
      )}

      <RelatedCalculators currentCalc={calc} limit={4} />

      <DisclaimerBanner
        id={calc.id}
        category={calc.category}
        subcategory={calc.subcategory}
        name={calc.name}
        rulesSensitive={calc.rulesSensitive}
      />

      <CalculatorGuideSection calculatorId={calc.id} />

      <AdSlot
        slotId="calculator-bottom"
        category={calc.category}
        calculatorSlug={calc.slug}
      />
    </div>
  );
}

