import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { liveCalculators, liveCalculatorsInCategory } from "@/lib/calculators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  SITE_NAME,
  absoluteUrl,
  categoryDescription,
  categoryPath,
  getCategoryDetails,
} from "@/lib/site";

function calculatorsIn(category: string) {
  return liveCalculatorsInCategory(category);
}

export async function generateMetadata(
  props: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const category = decodeURIComponent(params.category).toLowerCase();
  const calculators = calculatorsIn(category);
  if (calculators.length === 0) return { title: "Category Not Found" };

  const label = calculators[0].category;
  const title = `${label} Calculators | ${SITE_NAME}`;
  const description = categoryDescription(label, calculators.length);

  return {
    title,
    description,
    alternates: { canonical: categoryPath(label) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(categoryPath(label)),
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function generateStaticParams() {
  const categories = Array.from(new Set(liveCalculators.map(c => c.category)));
  return categories.map((category) => ({
    category: category.toLowerCase(),
  }));
}

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const params = await props.params;
  const decodedCategory = decodeURIComponent(params.category).toLowerCase();
  
  const calculators = calculatorsIn(decodedCategory);

  // An unknown category must 404 rather than render an empty page that search
  // engines would index as thin content.
  if (calculators.length === 0) {
    notFound();
  }

  const categoryLabel = calculators[0].category;
  const details = getCategoryDetails(categoryLabel);

  // Group calculators by subcategory for better information architecture
  const subcategoriesMap = new Map<string, typeof calculators>();
  for (const calc of calculators) {
    const subcat = calc.subcategory || "General Tools";
    const list = subcategoriesMap.get(subcat) || [];
    list.push(calc);
    subcategoriesMap.set(subcat, list);
  }
  const hasMultipleSubcats = subcategoriesMap.size > 1;

  return (
    <div className="flex flex-col gap-6 max-w-6xl w-full mx-auto">
      <Breadcrumbs items={[{ label: categoryLabel }]} />

      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2">
          <Badge>{categoryLabel}</Badge>
          <span className="text-sm font-medium text-slate-500">
            {calculators.length} {calculators.length === 1 ? "Calculator" : "Calculators"}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {decodedCategory} Calculators
        </h1>
        <p className="text-slate-600 max-w-3xl text-base leading-relaxed">
          {details.summary}
        </p>
      </div>

      {hasMultipleSubcats ? (
        <div className="flex flex-col gap-8">
          {Array.from(subcategoriesMap.entries()).map(([subcat, subCalcs]) => (
            <section key={subcat} aria-labelledby={`subcat-${subcat.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2
                id={`subcat-${subcat.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between"
              >
                <span>{subcat}</span>
                <span className="text-xs font-normal text-slate-500">
                  {subCalcs.length} {subCalcs.length === 1 ? "tool" : "tools"}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subCalcs.map((calc) => (
                  <Link key={calc.id} href={`/calculators/${calc.slug}`} className="group">
                    <Card className="h-full hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col" data-calculator-id={calc.id}>
                      <CardHeader className="p-5 pb-3">
                        <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {calc.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-end gap-2">
                        <div className="flex flex-wrap gap-2 mt-auto">
                          <Badge variant="neutral">{calc.category}</Badge>
                          {calc.rulesSensitive && (
                            <Badge variant="outline">2026/27</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculators.map((calc) => (
            <Link key={calc.id} href={`/calculators/${calc.slug}`} className="group">
              <Card className="h-full hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col" data-calculator-id={calc.id}>
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {calc.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-end gap-2">
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Badge variant="neutral">{calc.category}</Badge>
                    {calc.subcategory && (
                      <Badge variant="outline">{calc.subcategory}</Badge>
                    )}
                    {calc.rulesSensitive && (
                      <Badge variant="outline">2026/27</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {details.relatedCategories && details.relatedCategories.length > 0 && (
        <section aria-labelledby="related-categories-heading" className="mt-8 border-t border-slate-200 pt-6">
          <h2 id="related-categories-heading" className="text-lg font-bold text-slate-900 mb-3">
            Explore Related Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {details.relatedCategories.map((relCat) => (
              <Link
                key={relCat}
                href={categoryPath(relCat)}
                className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                {relCat} Calculators &rarr;
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

