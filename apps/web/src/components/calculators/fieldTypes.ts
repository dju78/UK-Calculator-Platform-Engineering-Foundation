/**
 * Pure field/config types shared by the calculator UI and the E2E parity
 * harness.
 *
 * This module must stay free of React and of any engine import so that both
 * the browser bundle and the Playwright test process can load it cheaply, and
 * so the parity harness can read the SAME field definitions the UI renders
 * instead of guessing at them with string heuristics.
 */

export type FieldDef = {
  name: string;
  label: string;
  type?: "number" | "text" | "select";
  options?: { label: string; value: string }[];
  defaultValue?: string | number;
  /**
   * Multiplier applied once, at the UI/engine boundary, to convert what the
   * user types into what the engine expects. Human percentages use 0.01 so the
   * user enters 5 to mean 5%.
   */
  scale?: number;
  /** Short guidance rendered beneath the control and wired up via aria-describedby. */
  helperText?: string;
  /** Optional visual grouping heading. */
  group?: string;
  /** Render this field only while another field holds one of these values. */
  showWhen?: { field: string; equals: string[] };
  /**
   * Re-default this field when another field changes - but only while its
   * current value is still one of `onlyIfCurrentIn`, so a value the user
   * deliberately chose is never overwritten.
   */
  defaultByField?: {
    field: string;
    map: Record<string, string>;
    onlyIfCurrentIn: string[];
  };
};

/** One row of the prominent periodic results card. */
export type PeriodicRow = {
  label: string;
  key: string;
};

export type PeriodicResultConfig = {
  title: string;
  rows: PeriodicRow[];
  note?: string;
};

export type CalculatorConfig = {
  fields: FieldDef[];
  /** Rendered as a prominent responsive card above the detail breakdown. */
  primaryResult?: PeriodicResultConfig;
  /** Output keys rendered as prose notes rather than value rows. */
  noteKeys?: string[];
};

/**
 * Fields whose entered value is scaled before reaching the engine, as a plain
 * name -> multiplier map. The parity harness uses this to convert an engine
 * fixture value back into what a human would type.
 */
export function scaledFieldsFor(fields: FieldDef[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of fields) {
    if (f.scale !== undefined) out[f.name] = f.scale;
  }
  return out;
}
