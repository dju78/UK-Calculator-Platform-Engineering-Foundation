import { notFound } from "next/navigation";
import { liveCalculators, getLiveCalculator } from "@/lib/calculators";
import { Badge } from "@/components/ui/Badge";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { CalculatorGuideSection } from "@/components/calculators/CalculatorGuide";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RelatedCalculators } from "@/components/calculators/RelatedCalculators";
import { CalculatorPageUtility } from "@/components/calculators/CalculatorPageUtility";
import { AdSlot } from "@/components/commercial/AdSlot";
import { Metadata } from "next";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  calculatorPath,
  categoryPath,
  getApplicationCategory,
} from "@/lib/site";
import { getCalculatorSEOMetadata } from "@/lib/calculator-seo-metadata";
import { getCalculatorGuide } from "../../../../../../dist/packages/calculator-content/src/index.js";
import type { CalculatorGuideDefinition } from "@foundation/calculator-content/src/types";

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
      title: "Calculator Not Found",
    };
  }

  const seo = getCalculatorSEOMetadata(calc);
  const title = seo.title;
  const description = seo.description;
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
  const guide = getCalculatorGuide(calc.id) as CalculatorGuideDefinition | undefined;
  const seo = getCalculatorSEOMetadata(calc);

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-6xl w-full mx-auto" data-calculator-id={calc.id}>
      {/* Primary WebApplication Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: calc.name,
            url: absoluteUrl(calculatorPath(calc.slug)),
            description: seo.description,
            ...(appCategory ? { applicationCategory: appCategory } : {}),
            operatingSystem: "Any",
            isAccessibleForFree: true,
            inLanguage: "en-GB",
            provider: { "@type": "Organization", name: "Jomovate" },
          }),
        }}
      />

      {/* BreadcrumbList Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: calc.category,
                item: absoluteUrl(categoryPath(calc.category)),
              },
              {
                "@type": "ListItem",
                position: 3,
                name: calc.name,
                item: absoluteUrl(calculatorPath(calc.slug)),
              },
            ],
          }),
        }}
      />

      {/* Semantic Schema.org FAQPage Structured Data (truthfully mirrors visible on-page FAQs) */}
      {guide?.faqs && guide.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: guide.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      )}

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

      {/* Calculator Header & Intent-Matched Introduction */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-2xs no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge>{calc.category}</Badge>
          {calc.subcategory && <Badge variant="outline">{calc.subcategory}</Badge>}
          {calc.rulesSensitive && <Badge variant="outline">2026/27 Tax Year</Badge>}
          {guide && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium px-2 py-0.5 rounded-full">
              ✓ Verified Methodology
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-950">{calc.name}</h1>
        {guide?.summary && (
          <p className="text-slate-600 max-w-3xl text-base md:text-lg leading-relaxed mt-0.5">
            {guide.summary}
          </p>
        )}
      </div>

      {/* Calculator Interactive UI */}
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

      {/* Cross-Topic Internal Linking */}
      <RelatedCalculators currentCalc={calc} limit={4} />

      {/* Statutory Disclaimers */}
      <DisclaimerBanner
        id={calc.id}
        category={calc.category}
        subcategory={calc.subcategory}
        name={calc.name}
        rulesSensitive={calc.rulesSensitive}
      />

      {/* Comprehensive Editorial & Methodology Guide */}
      <CalculatorGuideSection calculatorId={calc.id} />

      <AdSlot
        slotId="calculator-bottom"
        category={calc.category}
        calculatorSlug={calc.slug}
      />
    </div>
  );
}
