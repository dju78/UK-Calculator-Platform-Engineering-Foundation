/**
 * Renders the Phase 2 editorial guide beneath a calculator.
 *
 * A server component with no client JavaScript: the FAQ accordion uses native
 * <details>/<summary>, which is keyboard operable, screen-reader announced and
 * works with JavaScript disabled. Headings run h2 for sections and h3 inside
 * them, continuing from the page's single h1 without skipping a level.
 *
 * This component deliberately emits no JSON-LD. Structured data infrastructure
 * is Phase 3's responsibility; the guide data exposes `faqs` and
 * `relatedCalculators` for Phase 3 to consume when it gets there.
 */
import Link from "next/link";
import type {
  CalculatorGuideDefinition,
  WorkedExampleOutput,
} from "@foundation/calculator-content/src/types";
import { getCalculatorGuide } from "../../../../../dist/packages/calculator-content/src/index.js";
import { getLiveCalculator } from "@/lib/calculators";
import { calculatorPath } from "@/lib/site";

/**
 * Page-level entry point: looks the guide up and renders nothing when a
 * calculator has no authored guide yet.
 *
 * The lookup lives here rather than in the route component so that the shared
 * calculator page - which Phase 3 owns - carries only one import and one line.
 * The runtime value is imported from the compiled package, matching how the
 * app already consumes the registry and the engine, while the type comes from
 * source, so the cast below is re-checked against the real interface whenever
 * the content types change.
 */
export function CalculatorGuideSection({ calculatorId }: { calculatorId: string }) {
  const guide = getCalculatorGuide(calculatorId) as CalculatorGuideDefinition | undefined;
  if (!guide) return null;
  return <CalculatorGuide guide={guide} />;
}

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatOutput(output: WorkedExampleOutput): string {
  switch (output.format) {
    case "currency":
      return currency.format(Number(output.value));
    case "percentValue":
      return `${output.value}%`;
    case "date":
      return new Date(String(output.value)).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "text":
      return String(output.value);
    default:
      return new Intl.NumberFormat("en-GB").format(Number(output.value));
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 list-disc pl-5 text-slate-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function CalculatorGuide({ guide }: { guide: CalculatorGuideDefinition }) {
  const related = guide.relatedCalculators
    .map((r) => ({ ...r, calc: getLiveCalculator(r.calculatorId) }))
    .filter((r) => r.calc !== undefined);

  return (
    <article
      className="flex flex-col gap-10 border-t border-slate-200 pt-8"
      aria-labelledby="calculator-guide-heading"
      data-guide-for={guide.calculatorId}
    >
      <header className="flex flex-col gap-3">
        <h2
          id="calculator-guide-heading"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          {guide.title}
        </h2>
        <p className="text-lg text-slate-700">{guide.summary}</p>
        {guide.ruleset && (
          <p className="text-sm text-slate-500">
            Figures stated for the {guide.ruleset.taxYear} UK tax year. Content last
            checked against official sources on{" "}
            <time dateTime={guide.lastReviewed}>
              {new Date(guide.lastReviewed).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
            .
          </p>
        )}
      </header>

      <Section title="What this calculator does">
        <BulletList items={guide.purpose} />
      </Section>

      <Section title="How the calculation works">
        <p className="text-slate-700">{guide.methodology}</p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">The rule</h3>
          <p className="text-slate-700">{guide.formulaExplanation.formula}</p>
        </div>
        <h3 className="text-base font-semibold text-slate-800">Step by step</h3>
        <ol className="flex flex-col gap-2 list-decimal pl-5 text-slate-700">
          {guide.formulaExplanation.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section title="Worked example">
        <p className="text-slate-700">{guide.workedExample.scenario}</p>

        <h3 className="text-base font-semibold text-slate-800">What was entered</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border border-slate-200 rounded-lg">
            <caption className="sr-only">Inputs used in the worked example</caption>
            <tbody>
              {guide.workedExample.displayInputs.map((input) => (
                <tr key={input.label} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-4 py-2 font-medium text-slate-700">
                    {input.label}
                  </th>
                  <td className="px-4 py-2 text-slate-900">{input.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold text-slate-800">The arithmetic</h3>
        <ol className="flex flex-col gap-2 list-decimal pl-5 text-slate-700">
          {guide.workedExample.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h3 className="text-base font-semibold text-slate-800">What the calculator returns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border border-slate-200 rounded-lg">
            <caption className="sr-only">Results produced by the worked example</caption>
            <tbody>
              {guide.workedExample.outputs.map((output) => (
                <tr key={output.key} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-4 py-2 font-medium text-slate-700">
                    {output.label}
                  </th>
                  <td className="px-4 py-2 font-semibold text-slate-900 tabular-nums">
                    {formatOutput(output)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Key assumptions">
        <BulletList items={guide.assumptions} />
      </Section>

      <Section title="Limitations">
        <BulletList items={guide.limitations} />
      </Section>

      {guide.faqs.length > 0 && (
        <Section title="Common questions">
          <div className="flex flex-col gap-2">
            {guide.faqs.map((faq) => (
              <details
                key={faq.question}
                className="border border-slate-200 rounded-lg bg-white"
              >
                <summary className="px-4 py-3 font-medium text-slate-800 cursor-pointer">
                  {faq.question}
                </summary>
                <div className="px-4 pb-4 text-slate-700">{faq.answer}</div>
              </details>
            ))}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section title="Related calculators">
          <ul className="flex flex-col gap-3">
            {related.map((item) => (
              <li key={item.calculatorId}>
                <Link
                  href={calculatorPath(item.calc!.slug)}
                  className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                >
                  {item.calc!.name}
                </Link>
                <span className="text-slate-700"> — {item.why}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Official sources">
        <p className="text-sm text-slate-600">
          Every figure in this guide was checked against the sources below. Where a
          source could not confirm a figure, it is marked as requiring verification
          rather than presented as settled.
        </p>
        <ul className="flex flex-col gap-3">
          {guide.officialSources.map((source) => (
            <li key={source.url} className="text-sm">
              <a
                href={source.url}
                className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900"
                rel="noopener noreferrer"
              >
                {source.title}
              </a>
              <span className="text-slate-600"> — {source.publisher}</span>
              {source.effectivePeriod && (
                <span className="text-slate-500"> ({source.effectivePeriod})</span>
              )}
              <span className="block text-slate-600">{source.applicableRule}</span>
              {source.verificationStatus === "SOURCE VERIFICATION REQUIRED" && (
                <span className="block text-amber-700 font-medium">
                  This figure is awaiting source verification.
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
