import { notFound } from "next/navigation";
import { getCalculatorDefinition, wave1Registry } from "../../../../../../dist/packages/calculator-registry/src/index.js";
import { Badge } from "@/components/ui/Badge";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Metadata } from "next";
import {
  SITE_NAME,
  absoluteUrl,
  calculatorDescription,
  calculatorPath,
} from "@/lib/site";

// Generate static params for all calculators
export function generateStaticParams() {
  return wave1Registry.map((calc) => ({
    slug: calc.slug,
  }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const calc = getCalculatorDefinition(params.slug);
  
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
    twitter: { card: "summary", title, description },
  };
}

export default async function CalculatorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const calc = getCalculatorDefinition(params.slug);
  
  if (!calc) {
    notFound();
  }

  const UiComponent = getCalculatorComponent(calc.id);

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <Badge>{calc.category}</Badge>
          <Badge variant={calc.implementationStatus === "implemented" ? "success" : "warning"}>
            {calc.implementationStatus === "implemented" ? "Live" : "Specified"}
          </Badge>
          <span className="text-sm text-slate-500 font-mono ml-auto">{calc.id}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{calc.name}</h1>
      </div>

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
            applicationCategory: "FinanceApplication",
            operatingSystem: "Any",
            isAccessibleForFree: true,
            inLanguage: "en-GB",
            provider: { "@type": "Organization", name: "Jomovate" },
          }),
        }}
      />

      {calc.implementationStatus !== "implemented" ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-700">
          <p className="mb-2 font-semibold text-lg">Specification complete — calculator implementation in progress</p>
          <p className="text-sm text-slate-500">The underlying calculation engine and user interface for this calculator are currently in development.</p>
        </div>
      ) : UiComponent ? (
        UiComponent
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
          <p>Engine implemented, but UI bindings are pending for {calc.id}.</p>
        </div>
      )}

      <DisclaimerBanner category={calc.category} />
    </div>
  );
}
