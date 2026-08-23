import { DynamicCalculator } from "./DynamicCalculator";
import { mappings, calculatorResultConfig } from "./fieldMappings";
import type { FieldDef } from "./fieldTypes";

export type { FieldDef };
export { mappings };

export function getCalculatorComponent(id: string) {
  const fields = mappings[id];
  if (!fields) return null;
  return (
    <DynamicCalculator
      calculatorId={id}
      fields={fields}
      primaryResult={calculatorResultConfig[id]}
    />
  );
}
