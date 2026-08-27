import { notFound } from "next/navigation";
import { getLiveCalculator } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { EMBED_ALLOWLIST, isEmbedAllowed } from "@/lib/embed";
import { SITE_NAME, calculatorPath, SITE_URL } from "@/lib/site";
import { Metadata } from "next";
import Link from "next/link";

export function generateStaticParams() {
  return EMBED_ALLOWLIST.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const calc = getLiveCalculator(params.slug);

  if (!calc || !isEmbedAllowed(params.slug)) {
    return {
      title: "Calculator Not Found",
      robots: { index: false, follow: false },
    };
  }

  const path = calculatorPath(calc.slug);

  return {
    title: `${calc.name} | ${SITE_NAME}`,
    description: `Embeddable calculation tool for ${calc.name}.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: path,
    },
  };
}

export default async function EmbedCalculatorPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;

  if (!isEmbedAllowed(params.slug)) {
    notFound();
  }

  const calc = getLiveCalculator(params.slug);
  if (!calc) {
    notFound();
  }

  const uiComponent = getCalculatorComponent(calc.id);
  const canonicalUrl = `${SITE_URL}${calculatorPath(calc.slug)}`;

  return (
    <div className="w-full flex flex-col gap-4 text-slate-900" data-embed-slug={calc.slug}>
      <header className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {calc.name}
        </h1>
      </header>

      {/* Specialist Disclaimer if applicable */}
      <DisclaimerBanner
        id={calc.id}
        category={calc.category}
        subcategory={calc.subcategory}
        name={calc.name}
        rulesSensitive={calc.rulesSensitive}
      />

      {/* Calculator Interactive Form and Results */}
      <div className="w-full">
        {uiComponent || (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
            <p>Calculator interface loading...</p>
          </div>
        )}
      </div>

      {/* Attribution Footer */}
      <footer className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          <span>Powered by </span>
          <Link
            href={canonicalUrl}
            target="_blank"
            rel="noopener"
            className="font-medium text-blue-600 hover:text-blue-800 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
          >
            UK Calculator Platform
          </Link>
        </div>
        <div className="text-xs text-slate-600">
          For illustrative purposes only.
        </div>
      </footer>
    </div>
  );
}
