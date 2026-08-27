import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, absoluteUrl, calculatorPath } from "@/lib/site";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { platformUpdates, formatGovernanceDate } from "@/lib/governance";
import { getLiveCalculator } from "@/lib/calculators";
import { Badge } from "@/components/ui/Badge";

const DESCRIPTION =
  "A record of meaningful changes to the UK Calculator Platform: statutory corrections, new calculators, editorial content and transparency improvements.";

export const metadata: Metadata = {
  title: `Updates | ${SITE_NAME}`,
  description: DESCRIPTION,
  alternates: { canonical: "/updates" },
  openGraph: {
    title: `Updates | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/updates"),
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Updates | ${SITE_NAME}`,
    description: DESCRIPTION,
  },
};

export default function Updates() {
  // Newest first. Sorting here rather than trusting the data to be ordered
  // means a future entry appended in the wrong place still renders correctly.
  const updates = [...platformUpdates].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="prose max-w-none">
      <Breadcrumbs items={[{ label: "Updates" }]} className="mb-6 not-prose" />
      <h1>Updates</h1>

      <p>
        Changes that affect what you see or what you can rely on: statutory
        corrections, new calculators, published guides and transparency work.
        Internal engineering changes are left out — this is a record of what
        changed for readers, not a commit log.
      </p>
      <p>
        If you think a figure is wrong, the{" "}
        <Link href="/contact">contact page</Link> explains how to report it, and{" "}
        <Link href="/editorial-policy">our corrections policy</Link> sets out
        how reports are handled.
      </p>

      <ol className="not-prose mt-8 space-y-8 border-l border-slate-200 pl-6">
        {updates.map((update) => (
          <li key={`${update.date}-${update.title}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.8125rem] top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400"
            />
            <div className="flex flex-wrap items-center gap-3">
              <time
                dateTime={update.date}
                className="text-sm font-medium text-slate-500"
              >
                {formatGovernanceDate(update.date)}
              </time>
              <Badge variant="outline">{update.category}</Badge>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {update.title}
            </h2>
            <p className="mt-2 text-slate-700">{update.summary}</p>

            {update.affectedCalculators && update.affectedCalculators.length > 0 && (
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-medium">Calculators affected: </span>
                {update.affectedCalculators.map((id, index) => {
                  const calc = getLiveCalculator(id);
                  return (
                    <span key={id}>
                      {index > 0 && ", "}
                      {calc ? (
                        <Link
                          href={calculatorPath(calc.slug)}
                          className="underline underline-offset-2 hover:text-slate-900"
                        >
                          {calc.name}
                        </Link>
                      ) : (
                        id
                      )}
                    </span>
                  );
                })}
              </p>
            )}

            {update.reference && (
              <p className="mt-3 text-sm">
                <Link
                  href={update.reference.href}
                  className="underline underline-offset-2 hover:text-slate-900"
                >
                  {update.reference.label}
                </Link>
              </p>
            )}
          </li>
        ))}
      </ol>

      <h2 className="mt-12">How this record is kept</h2>
      <p>
        Every date above is taken from the repository history of the change
        that shipped it, not estimated after the fact. Entries appear when a
        reader&apos;s answer changed, or their reason to trust an answer
        changed. Where a correction altered a published result, the calculators
        affected are named.
      </p>
      <p>
        For the verification behind those figures, see{" "}
        <Link href="/how-we-check-our-figures">
          how we check our figures
        </Link>
        .
      </p>
    </div>
  );
}
