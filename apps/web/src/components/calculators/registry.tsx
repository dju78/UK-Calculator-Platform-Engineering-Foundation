import { DynamicCalculator } from "./DynamicCalculator";
import { PasswordGenerator } from "./PasswordGenerator";
import { mappings, calculatorResultConfig } from "./fieldMappings";
import type { FieldDef } from "./fieldTypes";

export type { FieldDef };
export { mappings };

export function getCalculatorComponent(id: string) {
  const fields = mappings[id];
  if (!fields) return null;

  const standard = (
    <DynamicCalculator
      calculatorId={id}
      fields={fields}
      primaryResult={calculatorResultConfig[id]}
    />
  );

  // TEC-005 is the one calculator whose headline output must never be computed
  // on a server. The generator is a browser-only component that uses the Web
  // Crypto API and transmits nothing; the engine-backed calculator beneath it
  // does the STRENGTH arithmetic from a character set size and a length and
  // never sees the password. Composing them this way keeps the standard form,
  // parity and accessibility plumbing intact and makes the generator purely
  // additive.
  if (id === "TEC-005") {
    return (
      <>
        <PasswordGenerator />
        {standard}
      </>
    );
  }

  return standard;
}
