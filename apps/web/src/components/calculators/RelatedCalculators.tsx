import Link from "next/link";
import { getRelatedCalculators } from "@/lib/relatedCalculators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RelatedCalculatorsProps {
  currentCalc: {
    id: string;
    slug: string;
    name: string;
    category: string;
    subcategory?: string;
  };
  limit?: number;
}

export function RelatedCalculators({
  currentCalc,
  limit = 4,
}: RelatedCalculatorsProps) {
  const related = getRelatedCalculators(currentCalc, limit);

  if (related.length === 0) return null;

  return (
    <section className="mt-8 border-t border-slate-200 pt-8 no-print">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Related Calculators
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {related.map((calc) => (
          <Link key={calc.id} href={`/calculators/${calc.slug}`} className="group">
            <Card className="h-full hover:border-slate-300 hover:shadow-sm transition-all flex flex-col">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {calc.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end">
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  <Badge variant="neutral">
                    {calc.category}
                  </Badge>
                  {calc.subcategory && (
                    <Badge variant="outline">
                      {calc.subcategory}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
