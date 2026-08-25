import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { liveCalculators, liveCalculatorsInCategory } from "@/lib/calculators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  SITE_NAME,
  absoluteUrl,
  categoryDescription,
  categoryPath,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight capitalize">
          {decodedCategory} Calculators
        </h1>
        <p className="text-slate-500">
          Browse {calculators.length} free UK calculators in this category.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <Link key={calc.id} href={`/calculators/${calc.slug}`}>
            <Card className="h-full hover:border-slate-300 transition-colors cursor-pointer flex flex-col" data-calculator-id={calc.id}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">{calc.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-2">
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge>{calc.category}</Badge>
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
    </div>
  );
}
