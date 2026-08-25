import type { NumericInputs, CalculationContext, CalculatorHandler } from "../types.js";
import { resolveRules } from "../../../rules-uk/src/index.js";
import {
  buildingFrom, concrete, roofing, tiles, looseMaterial, stairs,
  type ConcreteShape, type RoofType
} from "./wave2.js";

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

function opt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : fallback;
}

const ORDER_NOTE =
  "Both the bare geometric quantity and the amount to order are shown. Keeping them apart matters: it lets you check the measurement against a drawing, and it makes visible how much of the order is contingency rather than material.";

const DENSITY_NOTE =
  "THE BULK DENSITY IS AN INPUT BECAUSE IT IS NOT REALLY A PROPERTY OF THE MATERIAL. It moves with stone size, with how wet the material is, and with whether it is loose or compacted. Suppliers sell by weight while the job is measured by volume, so this is the number that decides whether a delivery is enough, and a single published figure would be wrong for most orders by enough to matter.";

/** HOM-001 Concrete Calculator */
export const hom001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const shapeRaw = str(inputs.shape, "slab");
  const shape = (["slab", "footing", "column", "steps"].includes(shapeRaw) ? shapeRaw : "slab") as ConcreteShape;
  const r = concrete(
    shape,
    Number(inputs.length_m ?? 0),
    Number(inputs.width_m ?? 0),
    Number(inputs.depth_m ?? 0),
    Number(inputs.quantity ?? 1),
    Number(inputs.wastage_pct ?? 10),
    str(inputs.mix_ratio, "1:2:4"),
    Number(inputs.concrete_density ?? 2400)
  );
  return {
    outputs: {
      volume_m3: r.volume_m3,
      volume_with_wastage_m3: r.volume_with_wastage_m3,
      weight_tonnes: r.weight_tonnes,
      cement_kg: r.cement_kg,
      cement_bags_25kg: r.cement_bags_25kg,
      sand_kg: r.sand_kg,
      aggregate_kg: r.aggregate_kg,
      water_litres: r.water_litres,
      ready_mix_loads: r.ready_mix_loads,
      wastage_pct: r.wastage_pct,
      basis:
        "THE MIX RATIO IS BY VOLUME, which is how a mix is specified on site, and it is converted to weights using each material's own bulk density. Treating the ratio as though it were by weight, which is the usual shortcut, gets the cement content wrong by about a third. " +
        "DRY MATERIALS BULK UP: it takes roughly 1.54 cubic metres of dry ingredients to make one cubic metre of wet concrete, because the sand and cement fill the voids between the aggregate. A calculator that skipped that factor under-orders every material by a third. " +
        "The water figure assumes a water to cement ratio of one half by weight, which gives a workable general-purpose mix; less water gives a stronger but stiffer concrete, and more water is the commonest way a pour ends up weak. " + ORDER_NOTE
    }
  };
};

/** HOM-002 Roofing Calculator */
export const hom002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const typeRaw = str(inputs.roof_type, "gable");
  const roofType = (["gable", "hip", "lean_to"].includes(typeRaw) ? typeRaw : "gable") as RoofType;
  const r = roofing(
    roofType,
    Number(inputs.length_m ?? 0),
    Number(inputs.width_m ?? 0),
    Number(inputs.pitch_degrees ?? 30),
    Number(inputs.tiles_per_m2 ?? 10),
    Number(inputs.batten_spacing_mm ?? 300),
    Number(inputs.wastage_pct ?? 10),
    Number(inputs.underlay_roll_m2 ?? 30)
  );
  return {
    outputs: {
      plan_area_m2: r.plan_area_m2,
      pitch_degrees: r.pitch_degrees,
      pitch_factor: r.pitch_factor,
      roof_area_m2: r.roof_area_m2,
      roof_area_with_wastage_m2: r.roof_area_with_wastage_m2,
      rafter_length_m: r.rafter_length_m,
      tiles_needed: r.tiles_needed,
      battens_length_m: r.battens_length_m,
      underlay_rolls: r.underlay_rolls,
      ridge_length_m: r.ridge_length_m,
      basis:
        "A ROOF IS BIGGER THAN THE BUILDING IT SITS ON, by one over the cosine of the pitch: about 15 per cent at 30 degrees and 41 per cent at 45. Ordering to the footprint is the classic and expensive mistake, and the pitch factor is shown as its own figure so the size of the effect is visible. " +
        "A HIP ROOF HAS THE SAME SURFACE AREA AS A GABLE ROOF over the same footprint at the same pitch: the hip ends trade triangle for triangle. What changes is the ridge length and the cutting waste, not the area, which is why a hip roof costs more in labour and offcuts rather than in coverage. " +
        "The rafter length is the true length along the slope, before any allowance for the eaves overhang or for birdsmouth cuts. " + ORDER_NOTE
    }
  };
};

/** HOM-003 Tile Calculator */
export const hom003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = tiles(
    opt(inputs.area_m2),
    Number(inputs.length_m ?? 0),
    Number(inputs.width_m ?? 0),
    Number(inputs.openings_m2 ?? 0),
    Number(inputs.tile_width_mm ?? 300),
    Number(inputs.tile_height_mm ?? 300),
    Number(inputs.grout_gap_mm ?? 3),
    Number(inputs.wastage_pct ?? 10),
    Number(inputs.tiles_per_box ?? 10),
    Number(inputs.adhesive_kg_per_m2 ?? 4)
  );
  return {
    outputs: {
      area_m2: r.area_m2,
      area_less_openings_m2: r.area_less_openings_m2,
      tiles_needed: r.tiles_needed,
      tiles_with_wastage: r.tiles_with_wastage,
      boxes_needed: r.boxes_needed,
      adhesive_kg: r.adhesive_kg,
      grout_kg: r.grout_kg,
      wastage_pct: r.wastage_pct,
      basis:
        "THE GROUT GAP IS PART OF EACH TILE'S FOOTPRINT. A tile grid repeats at the tile size plus one joint, so a 300 mm tile with a 3 mm gap covers 303 by 303. Ignoring that over-orders, and the effect is largest on small tiles and mosaics, where the joints can be a tenth of the area. " +
        "TEN PER CENT WASTAGE IS A FLOOR, NOT A RULE. Straight courses on a square room need little; a diagonal layout, a patterned tile that must be aligned, or a room that is out of square all need more, and a rectified large-format tile that snaps rather than cuts cleanly needs more again. Buying from one batch matters as much as buying enough, because shade varies between batches. " + ORDER_NOTE
    }
  };
};

/** HOM-004 Gravel Calculator */
export const hom004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = looseMaterial(
    opt(inputs.area_m2),
    Number(inputs.length_m ?? 0),
    Number(inputs.width_m ?? 0),
    Number(inputs.depth_mm ?? 50),
    Number(inputs.bulk_density ?? 1500),
    Number(inputs.bag_size_litres ?? 25),
    Number(inputs.bulk_bag_m3 ?? 0.5)
  );
  return {
    outputs: {
      area_m2: r.area_m2,
      depth_mm: r.depth_mm,
      volume_m3: r.volume_m3,
      weight_tonnes: r.weight_tonnes,
      weight_kg: r.weight_kg,
      bags_needed: r.bags_needed,
      bulk_bags_needed: r.bulk_bags_needed,
      coverage_per_tonne_m2: r.coverage_per_tonne_m2,
      bulk_density_kg_per_m3: r.bulk_density_kg_per_m3,
      basis:
        DENSITY_NOTE + " Gravel typically runs between about 1.4 and 1.7 tonnes a cubic metre depending on stone size and moisture, and the figure here is yours to set from the supplier's own data. " +
        "THE COVERAGE PER TONNE IS THE FIGURE TO CHECK A QUOTE AGAINST, because that is the unit a supplier prices in while the job is measured in area and depth. " +
        "For a drive, a depth of around 50 mm over a properly prepared and compacted sub-base is usual; deeper gravel is harder to walk and drive on rather than better, because vehicles rut it."
    }
  };
};

/** HOM-005 Mulch Calculator */
export const hom005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = looseMaterial(
    opt(inputs.area_m2),
    Number(inputs.length_m ?? 0),
    Number(inputs.width_m ?? 0),
    Number(inputs.depth_mm ?? 75),
    Number(inputs.bulk_density ?? 350),
    Number(inputs.bag_size_litres ?? 70),
    Number(inputs.bulk_bag_m3 ?? 1)
  );
  return {
    outputs: {
      area_m2: r.area_m2,
      depth_mm: r.depth_mm,
      volume_m3: r.volume_m3,
      volume_litres: r.volume_litres,
      weight_tonnes: r.weight_tonnes,
      bags_needed: r.bags_needed,
      bulk_bags_needed: r.bulk_bags_needed,
      bulk_density_kg_per_m3: r.bulk_density_kg_per_m3,
      basis:
        "MULCH IS SOLD BY VOLUME, NOT WEIGHT, which is the opposite of gravel, and bark is light: around 250 to 400 kilograms a cubic metre against gravel's 1,500. A bag measured in litres is therefore the useful unit here, and the weight is shown mainly so a delivery can be checked. " + DENSITY_NOTE + " " +
        "A DEPTH OF 50 TO 75 MM IS THE USUAL RANGE. Thinner than that and weeds come through, which is the main reason for mulching at all; much thicker and it can keep rain off the soil rather than holding moisture in. Keep mulch clear of stems and trunks, because piling it against bark keeps them wet and invites rot."
    }
  };
};

/** HOM-006 Stair Calculator */
export const hom006Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const building = buildingFrom(rulesFor(context));
  const r = stairs(
    Number(inputs.total_rise_mm ?? 0),
    Number(inputs.preferred_rise_mm ?? 190),
    Number(inputs.going_mm ?? 230),
    building
  );

  const warnings: string[] = [];
  for (const check of r.checks) {
    if (!check.passes) {
      warnings.push(
        `${check.rule}: this design gives ${check.actual}, against a limit of ${check.limit}. It would not meet Approved Document K for a private stair as drawn.`
      );
    }
  }
  if (Math.abs(r.actual_rise_mm - Number(inputs.preferred_rise_mm ?? 190)) > 0.5) {
    warnings.push(
      `The number of risers must be a whole number, so the actual rise is ${Math.round(r.actual_rise_mm * 10) / 10} mm rather than the ${inputs.preferred_rise_mm} mm you asked for. Every check below uses the actual figure, because that is what gets built.`
    );
  }

  const k = building.private_stairs_approved_document_k;
  return {
    outputs: {
      number_of_risers: r.number_of_risers,
      number_of_treads: r.number_of_treads,
      actual_rise_mm: r.actual_rise_mm,
      going_mm: r.going_mm,
      total_run_mm: r.total_run_mm,
      pitch_degrees: r.pitch_degrees,
      two_rise_plus_going_mm: r.two_rise_plus_going_mm,
      stringer_length_mm: r.stringer_length_mm,
      all_checks_pass: r.all_checks_pass,
      failed_checks: r.failed_checks,
      basis:
        "THE NUMBER OF RISERS MUST BE A WHOLE NUMBER, so the actual rise is the total rise divided by that count and is almost never the rise you asked for. Every check is run against the actual figure rather than the requested one, because the actual figure is what gets built. Note also that a flight has ONE MORE RISER THAN IT HAS TREADS, since the top surface is the landing. " +
        `THE 2R+G RULE IS NOT ARBITRARY: it encodes the length of a human stride on a slope, which is why a stair outside ${k.two_rise_plus_going_min_mm} to ${k.two_rise_plus_going_max_mm} mm feels wrong to walk even when the rise and going are each individually legal. ` +
        `THIS IS A CHECK, NOT A COMPLIANCE CERTIFICATE. ${k.reference} is guidance on one way of meeting the Building Regulations rather than the Regulations themselves, it applies to England, and Scotland, Wales and Northern Ireland publish their own. The figures used are for a PRIVATE STAIR: ${k.applies_to} A real design is signed off by building control, and this calculator also says nothing about headroom, handrails, guarding or landings, all of which the same document governs.`
    },
    warnings,
    schedule: r.checks
  };
};
