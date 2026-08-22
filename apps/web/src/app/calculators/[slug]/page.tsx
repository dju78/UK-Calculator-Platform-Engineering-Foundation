import { notFound } from "next/navigation";
import { getCalculatorDefinition, wave1Registry } from "../../../../../../dist/packages/calculator-registry/src/index.js";
import { Badge } from "@/components/ui/Badge";
import { getCalculatorComponent } from "@/components/calculators/registry";

// Generate static params for all calculators
export function generateStaticParams() {
  return wave1Registry.map((calc) => ({
    slug: calc.slug,
  }));
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
    </div>
  );
}
