/**
 * UK property transaction taxes.
 *
 * The three UK jurisdictions levy DIFFERENT taxes with different bands,
 * reliefs and surcharges. They are never interchangeable:
 *
 *   England & Northern Ireland  Stamp Duty Land Tax (SDLT)
 *   Scotland                    Land and Buildings Transaction Tax (LBTT)
 *   Wales                       Land Transaction Tax (LTT)
 *
 * Every rate and threshold comes from the versioned ruleset. Nothing
 * statutory is written into this file.
 */
import { calculateProgressiveTax } from "../../../../rules-uk/src/progressive-bands.js";
import { assertMoney } from "../../common/validation.js";

export type PropertyJurisdiction = "england_ni" | "scotland" | "wales";

export interface PropertyTaxResult {
  tax: number;
  effective_rate: number | null;
  jurisdiction: string;
  tax_name: string;
  /** Surcharge element, where one applies. */
  surcharge: number;
  /** Tax before any surcharge. */
  base_tax: number;
  notes: string[];
}

export function normalisePropertyJurisdiction(value: unknown): PropertyJurisdiction {
  const raw = String(value ?? "england_ni").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["scotland", "sco", "lbtt"].includes(raw)) return "scotland";
  if (["wales", "cymru", "ltt"].includes(raw)) return "wales";
  if (
    ["england_ni", "england", "england_northern_ireland", "northern_ireland", "ni", "sdlt", "england_and_northern_ireland"].includes(raw)
  ) {
    return "england_ni";
  }
  throw new Error(
    `Unsupported jurisdiction "${String(value)}". Choose England & Northern Ireland, Scotland or Wales.`
  );
}

/**
 * Property transaction tax for any UK jurisdiction.
 *
 * `firstTimeBuyer` and `additionalProperty` are mutually exclusive in practice
 * - first-time buyer relief is unavailable on an additional property - and the
 * function enforces that rather than silently applying both.
 */
export function propertyTransactionTax(
  price: number,
  jurisdiction: PropertyJurisdiction,
  options: { firstTimeBuyer?: boolean; additionalProperty?: boolean; nonUkResident?: boolean } = {},
  rules: any
): PropertyTaxResult {
  assertMoney(price, "Property price");
  const firstTimeBuyer = options.firstTimeBuyer === true && options.additionalProperty !== true;
  const additionalProperty = options.additionalProperty === true;
  const notes: string[] = [];

  const ptt = rules.property_transaction_tax;
  let baseTax = 0;
  let surcharge = 0;
  let taxName: string;
  let jurisdictionLabel: string;

  if (jurisdiction === "scotland") {
    const s = ptt.scotland;
    taxName = s.tax_name;
    jurisdictionLabel = s.jurisdiction;

    if (firstTimeBuyer) {
      // First-time buyer relief raises the nil-rate band. Implemented by
      // rebuilding the band table with the raised threshold rather than by
      // subtracting a fixed amount, so the relief tapers correctly.
      const ceiling = s.first_time_buyer_nil_rate_ceiling_gbp as number;
      const bands = raiseNilRateBand(s.standard_bands, ceiling);
      baseTax = calculateProgressiveTax(price, bands);
      notes.push(`First-time buyer relief applied: the nil-rate band is raised to £${ceiling.toLocaleString("en-GB")}.`);
    } else {
      baseTax = calculateProgressiveTax(price, s.standard_bands);
    }

    if (additionalProperty) {
      const minimum = s.additional_dwelling_supplement_minimum_consideration_gbp as number;
      if (price >= minimum) {
        surcharge = price * (s.additional_dwelling_supplement_rate as number);
        notes.push(
          `Additional Dwelling Supplement of ${((s.additional_dwelling_supplement_rate as number) * 100).toFixed(0)}% applied to the whole price.`
        );
      } else {
        notes.push(
          `Additional Dwelling Supplement does not apply below £${minimum.toLocaleString("en-GB")}.`
        );
      }
    }
    if (options.nonUkResident) {
      notes.push("Scotland has no non-UK-resident surcharge; the residency option has been ignored.");
    }
  } else if (jurisdiction === "wales") {
    const w = ptt.wales;
    taxName = w.tax_name;
    jurisdictionLabel = w.jurisdiction;

    // Wales applies a separate higher-rate band TABLE for additional
    // properties, not a surcharge added on top of the main rates.
    baseTax = calculateProgressiveTax(price, additionalProperty ? w.higher_bands : w.main_bands);
    if (additionalProperty) {
      notes.push("Higher residential rates for additional properties applied.");
    }
    if (options.firstTimeBuyer) {
      notes.push(w.first_time_buyer_relief_note as string);
    }
    if (options.nonUkResident) {
      notes.push("Wales has no non-UK-resident surcharge; the residency option has been ignored.");
    }
  } else {
    const e = ptt.england_northern_ireland;
    taxName = e.tax_name;
    jurisdictionLabel = e.jurisdiction;
    const relief = e.first_time_buyer_relief;

    if (firstTimeBuyer && price <= relief.maximum_qualifying_property_value_gbp) {
      baseTax = calculateProgressiveTax(price, relief.bands);
      notes.push("First-time buyer relief applied.");
    } else {
      if (firstTimeBuyer) {
        notes.push(
          `First-time buyer relief is not available above £${(relief.maximum_qualifying_property_value_gbp as number).toLocaleString("en-GB")}, so standard rates apply.`
        );
      }
      baseTax = calculateProgressiveTax(price, e.standard_bands);
    }

    if (additionalProperty) {
      surcharge += price * (e.additional_property_surcharge_rate as number);
      notes.push("Higher rates for additional dwellings applied to the whole price.");
    }
    if (options.nonUkResident) {
      surcharge += price * (e.non_uk_resident_surcharge_rate as number);
      notes.push("Non-UK-resident surcharge applied.");
    }
  }

  const tax = baseTax + surcharge;
  return {
    tax,
    base_tax: baseTax,
    surcharge,
    effective_rate: price > 0 ? tax / price : null,
    jurisdiction: jurisdictionLabel,
    tax_name: taxName,
    notes
  };
}

/**
 * Rebuild a band table with a raised nil-rate threshold.
 *
 * Bands wholly below the new threshold become nil-rated; the band containing
 * it is split so the portion above the threshold keeps its own rate.
 */
function raiseNilRateBand(
  bands: Array<{ from?: number; to?: number; rate: number }>,
  threshold: number
): Array<{ from?: number; to?: number; rate: number }> {
  const rebuilt: Array<{ from?: number; to?: number; rate: number }> = [
    { to: threshold, rate: 0 }
  ];
  for (const band of bands) {
    const to = band.to;
    if (to !== undefined && to <= threshold) continue;
    rebuilt.push({ from: threshold + 1, to, rate: band.rate });
  }
  return rebuilt;
}
