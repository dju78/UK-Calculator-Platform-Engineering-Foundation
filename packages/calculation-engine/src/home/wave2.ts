/**
 * Wave 2 Home & Construction calculators (HOM-001 to HOM-006).
 *
 * Two things shape this module.
 *
 * BULK DENSITIES ARE INPUTS, NOT CONSTANTS. Gravel, mulch, sand and topsoil
 * vary by a factor of two or more between suppliers, between dry and wet, and
 * between loose and compacted. Publishing one figure as though it were a
 * property of the material would be a guess wearing the costume of a
 * calculation, so the calculators ask for it and explain what moves it.
 *
 * WASTAGE IS SEPARATED FROM THE MEASUREMENT. Every quantity is reported both
 * as the bare geometric requirement and as the amount to order. Conflating
 * them hides how much of an order is contingency, and a reader who wants to
 * check the arithmetic against a drawing needs the bare figure.
 */
import { assertFiniteNumber } from "../common/validation.js";

const r2 = (n: number) => Math.round(n * 100) / 100;

const sig = (n: number, digits = 10): number => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};

function positive(value: unknown, label: string): number {
  const n = assertFiniteNumber(value, label);
  if (!(n > 0)) throw new Error(`${label} must be greater than zero.`);
  return n;
}

function nonNegative(value: unknown, label: string): number {
  const n = assertFiniteNumber(value, label);
  if (n < 0) throw new Error(`${label} cannot be negative.`);
  return n;
}

function percentage(value: unknown, label: string, max = 100): number {
  const n = assertFiniteNumber(value, label);
  if (n < 0 || n > max) {
    throw new Error(`${label} must be between 0 and ${max} per cent.`);
  }
  return n;
}

export interface BuildingRules {
  private_stairs_approved_document_k: {
    max_rise_mm: number;
    min_going_mm: number;
    max_pitch_degrees: number;
    two_rise_plus_going_min_mm: number;
    two_rise_plus_going_max_mm: number;
    min_headroom_mm: number;
    max_consecutive_risers: number;
    reference: string;
    applies_to: string;
  };
}

export function buildingFrom(rules: any): BuildingRules {
  const b = rules?.building;
  if (!b?.private_stairs_approved_document_k) {
    throw new Error(
      "The building regulation limits are missing from the ruleset for this tax year, so this calculator cannot run."
    );
  }
  return b as BuildingRules;
}

// ===========================================================================
// HOM-001 Concrete
// ===========================================================================

export type ConcreteShape = "slab" | "footing" | "column" | "steps";

export interface ConcreteResult {
  volume_m3: number;
  volume_with_wastage_m3: number;
  wastage_pct: number;
  weight_tonnes: number;
  cement_kg: number;
  sand_kg: number;
  aggregate_kg: number;
  water_litres: number;
  cement_bags_25kg: number;
  mix_ratio: string;
  ready_mix_loads: number;
}

/**
 * Concrete volume and the materials to make it.
 *
 * The mix is given as a cement : sand : aggregate ratio BY VOLUME, which is how
 * a mix is specified on site, and converted to masses using each material's own
 * bulk density. Treating the ratio as if it were by mass, which is the common
 * shortcut, gets the cement content wrong by about a third.
 */
export function concrete(
  shape: ConcreteShape,
  lengthM: number,
  widthM: number,
  depthM: number,
  quantity: number,
  wastagePct: number,
  mixRatio: string,
  concreteDensityKgM3: number
): ConcreteResult {
  const L = positive(lengthM, "Length");
  const W = shape === "column" ? positive(widthM, "Diameter") : positive(widthM, "Width");
  const D = positive(depthM, "Depth");
  const n = assertFiniteNumber(quantity, "How many");
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("The number of pours must be a whole number of at least one.");
  }
  if (n > 1000) throw new Error("More than a thousand identical pours is beyond what this calculator models.");
  const waste = percentage(wastagePct, "Wastage", 50);
  const rho = positive(concreteDensityKgM3, "Concrete density");

  for (const [v, label] of [[L, "Length"], [W, "Width"], [D, "Depth"]] as const) {
    if (v > 200) throw new Error(`${label} above 200 m is beyond what this calculator models.`);
  }

  // A column is round, so its plan area is not length times width.
  const single =
    shape === "column"
      ? Math.PI * Math.pow(W / 2, 2) * D
      : L * W * D;
  const volume = single * n;
  const withWastage = volume * (1 + waste / 100);

  const parts = mixRatio.split(":").map(p => Number(p.trim()));
  if (parts.length !== 3 || parts.some(p => !Number.isFinite(p) || p <= 0)) {
    throw new Error('The mix ratio must be three positive numbers, for example "1:2:4" for cement, sand and aggregate.');
  }
  const [cementPart, sandPart, aggPart] = parts;
  const totalParts = cementPart + sandPart + aggPart;

  // Dry materials bulk up: about 1.54 cubic metres of dry ingredients makes a
  // cubic metre of wet concrete, because the sand and cement fill the voids
  // between the aggregate. Ignoring this under-orders every material.
  const DRY_VOLUME_FACTOR = 1.54;
  const dryVolume = withWastage * DRY_VOLUME_FACTOR;

  // Bulk densities of the dry ingredients, in kg per cubic metre.
  const CEMENT_DENSITY = 1440;
  const SAND_DENSITY = 1600;
  const AGGREGATE_DENSITY = 1500;

  const cementVol = (dryVolume * cementPart) / totalParts;
  const sandVol = (dryVolume * sandPart) / totalParts;
  const aggVol = (dryVolume * aggPart) / totalParts;

  const cementKg = cementVol * CEMENT_DENSITY;
  // A water to cement ratio of 0.5 by mass is a workable general-purpose mix.
  const waterLitres = cementKg * 0.5;

  return {
    volume_m3: sig(volume),
    volume_with_wastage_m3: sig(withWastage),
    wastage_pct: waste,
    weight_tonnes: sig((withWastage * rho) / 1000),
    cement_kg: sig(cementKg),
    sand_kg: sig(sandVol * SAND_DENSITY),
    aggregate_kg: sig(aggVol * AGGREGATE_DENSITY),
    water_litres: sig(waterLitres),
    cement_bags_25kg: Math.ceil(cementKg / 25),
    mix_ratio: mixRatio,
    // A standard ready-mix truck carries about six cubic metres.
    ready_mix_loads: Math.ceil(withWastage / 6)
  };
}

// ===========================================================================
// HOM-002 Roofing
// ===========================================================================

export type RoofType = "gable" | "hip" | "lean_to";

export interface RoofingResult {
  plan_area_m2: number;
  pitch_degrees: number;
  pitch_factor: number;
  roof_area_m2: number;
  roof_area_with_wastage_m2: number;
  rafter_length_m: number;
  tiles_needed: number;
  battens_length_m: number;
  underlay_rolls: number;
  ridge_length_m: number;
}

/**
 * Roof area from a footprint and a pitch.
 *
 * The pitch factor is one over the cosine of the pitch: a roof surface is the
 * hypotenuse of the triangle whose base is the plan. A 30 degree roof is about
 * 15 per cent larger than its footprint, and a 45 degree roof 41 per cent
 * larger. Ordering to the plan area is the classic and expensive mistake.
 */
export function roofing(
  roofType: RoofType,
  lengthM: number,
  widthM: number,
  pitchDegrees: number,
  tilesPerM2: number,
  battenSpacingMm: number,
  wastagePct: number,
  underlayRollM2: number
): RoofingResult {
  const L = positive(lengthM, "Building length");
  const W = positive(widthM, "Building width");
  const pitch = assertFiniteNumber(pitchDegrees, "Roof pitch");
  if (pitch <= 0 || pitch >= 90) {
    throw new Error("The roof pitch must be above 0 and below 90 degrees.");
  }
  if (pitch > 70) {
    throw new Error("A pitch above 70 degrees is a wall rather than a roof. Check the figure.");
  }
  const tiles = positive(tilesPerM2, "Tiles per square metre");
  const battenSpacing = positive(battenSpacingMm, "Batten spacing");
  const waste = percentage(wastagePct, "Wastage", 50);
  const rollArea = positive(underlayRollM2, "Underlay roll coverage");

  const planArea = L * W;
  const radians = (pitch * Math.PI) / 180;
  const pitchFactor = 1 / Math.cos(radians);

  // A hip roof has the SAME surface area as a gable roof over the same
  // footprint at the same pitch: the hip ends trade triangle for triangle. The
  // difference is in the ridge length and the cutting waste, not the area.
  const roofArea = roofType === "lean_to" ? planArea * pitchFactor : planArea * pitchFactor;
  const withWastage = roofArea * (1 + waste / 100);

  const rafterRun = roofType === "lean_to" ? W : W / 2;
  const rafterLength = rafterRun * pitchFactor;

  const ridgeLength =
    roofType === "gable" ? L
      : roofType === "hip" ? Math.max(0, L - W)
        : 0;

  return {
    plan_area_m2: sig(planArea),
    pitch_degrees: sig(pitch),
    pitch_factor: sig(pitchFactor),
    roof_area_m2: sig(roofArea),
    roof_area_with_wastage_m2: sig(withWastage),
    rafter_length_m: sig(rafterLength),
    tiles_needed: Math.ceil(withWastage * tiles),
    battens_length_m: sig((withWastage / (battenSpacing / 1000))),
    underlay_rolls: Math.ceil(withWastage / rollArea),
    ridge_length_m: sig(ridgeLength)
  };
}

// ===========================================================================
// HOM-003 Tiles
// ===========================================================================

export interface TileResult {
  area_m2: number;
  area_less_openings_m2: number;
  tile_area_m2: number;
  tiles_needed_exact: number;
  tiles_needed: number;
  tiles_with_wastage: number;
  boxes_needed: number;
  adhesive_kg: number;
  grout_kg: number;
  wastage_pct: number;
}

export function tiles(
  areaM2: number | null,
  lengthM: number,
  widthM: number,
  openingsM2: number,
  tileWidthMm: number,
  tileHeightMm: number,
  groutGapMm: number,
  wastagePct: number,
  tilesPerBox: number,
  adhesiveKgPerM2: number
): TileResult {
  const area = areaM2 !== null && areaM2 !== undefined
    ? positive(areaM2, "Area")
    : positive(lengthM, "Length") * positive(widthM, "Width");
  const openings = nonNegative(openingsM2, "Doors and windows");
  if (openings >= area) {
    throw new Error("The openings are as large as the whole surface, so there is nothing to tile. Check the figures.");
  }
  const tw = positive(tileWidthMm, "Tile width");
  const th = positive(tileHeightMm, "Tile height");
  const gap = nonNegative(groutGapMm, "Grout gap");
  const waste = percentage(wastagePct, "Wastage", 50);
  const perBox = positive(tilesPerBox, "Tiles per box");
  const adhesiveRate = nonNegative(adhesiveKgPerM2, "Adhesive coverage");

  if (tw > 3000 || th > 3000) throw new Error("A tile larger than three metres is beyond what this calculator models.");
  if (gap > 50) throw new Error("A grout gap above 50 mm is beyond what this calculator models.");

  const net = area - openings;
  // Each tile occupies its own size PLUS one grout gap on two sides, which is
  // how a tile grid actually repeats. Ignoring the gap over-orders slightly on
  // small tiles and is the reason a mosaic estimate comes out high.
  const effectiveW = (tw + gap) / 1000;
  const effectiveH = (th + gap) / 1000;
  const tileArea = effectiveW * effectiveH;
  const exact = net / tileArea;
  const needed = Math.ceil(exact);
  const withWastage = Math.ceil(exact * (1 + waste / 100));

  // Grout volume is the gap depth times the perimeter of every tile, halved
  // because each joint is shared between two tiles.
  const tileCount = withWastage;
  const jointLength = tileCount * ((effectiveW + effectiveH) * 2) / 2;
  // Assume the grout fills the gap to the tile thickness, taken as 8 mm.
  const groutVolumeM3 = jointLength * (gap / 1000) * 0.008;
  const GROUT_DENSITY = 1600;

  return {
    area_m2: sig(area),
    area_less_openings_m2: sig(net),
    tile_area_m2: sig(tileArea),
    tiles_needed_exact: sig(exact),
    tiles_needed: needed,
    tiles_with_wastage: withWastage,
    boxes_needed: Math.ceil(withWastage / perBox),
    adhesive_kg: sig(net * adhesiveRate),
    grout_kg: sig(groutVolumeM3 * GROUT_DENSITY),
    wastage_pct: waste
  };
}

// ===========================================================================
// HOM-004 Gravel and HOM-005 Mulch: loose material over an area
// ===========================================================================

export interface LooseMaterialResult {
  area_m2: number;
  depth_mm: number;
  volume_m3: number;
  volume_litres: number;
  bulk_density_kg_per_m3: number;
  weight_tonnes: number;
  weight_kg: number;
  bags_needed: number;
  bag_size_litres: number;
  bulk_bags_needed: number;
  coverage_per_tonne_m2: number;
}

/**
 * A depth of loose material over an area.
 *
 * The bulk density is an INPUT because it is not a property of the material in
 * any useful sense: gravel runs from about 1.4 to 1.7 tonnes a cubic metre
 * depending on stone size and how wet it is, and bark mulch from about 0.25 to
 * 0.4. Publishing one figure would be wrong for most orders by enough to
 * matter, since the supplier sells by weight and the job is measured by volume.
 */
export function looseMaterial(
  areaM2: number | null,
  lengthM: number,
  widthM: number,
  depthMm: number,
  bulkDensityKgM3: number,
  bagSizeLitres: number,
  bulkBagM3: number
): LooseMaterialResult {
  const area = areaM2 !== null && areaM2 !== undefined
    ? positive(areaM2, "Area")
    : positive(lengthM, "Length") * positive(widthM, "Width");
  const depth = positive(depthMm, "Depth");
  const rho = positive(bulkDensityKgM3, "Bulk density");
  const bagLitres = positive(bagSizeLitres, "Bag size");
  const bulkBag = positive(bulkBagM3, "Bulk bag size");

  if (area > 100000) throw new Error("An area above ten hectares is beyond what this calculator models.");
  if (depth > 1000) throw new Error("A depth above one metre is beyond what this calculator models. Depths are in millimetres.");
  if (rho > 3000) throw new Error("A bulk density above 3,000 kg per cubic metre is denser than solid rock. Check the figure.");

  const volume = area * (depth / 1000);
  const kg = volume * rho;

  return {
    area_m2: sig(area),
    depth_mm: sig(depth),
    volume_m3: sig(volume),
    volume_litres: sig(volume * 1000),
    bulk_density_kg_per_m3: sig(rho),
    weight_tonnes: sig(kg / 1000),
    weight_kg: sig(kg),
    bags_needed: Math.ceil((volume * 1000) / bagLitres),
    bag_size_litres: sig(bagLitres),
    bulk_bags_needed: Math.ceil(volume / bulkBag),
    // How far a tonne goes at this depth, which is what a supplier's quote
    // needs to be checked against.
    coverage_per_tonne_m2: sig(1000 / rho / (depth / 1000))
  };
}

// ===========================================================================
// HOM-006 Stairs
// ===========================================================================

export interface StairCheck {
  rule: string;
  limit: string;
  actual: string;
  passes: boolean;
}

export interface StairResult {
  total_rise_mm: number;
  number_of_risers: number;
  number_of_treads: number;
  actual_rise_mm: number;
  going_mm: number;
  total_run_mm: number;
  pitch_degrees: number;
  two_rise_plus_going_mm: number;
  stringer_length_mm: number;
  all_checks_pass: boolean;
  failed_checks: number;
  checks: StairCheck[];
}

/**
 * A straight flight of private stairs, checked against Approved Document K.
 *
 * The number of risers must be a WHOLE NUMBER, so the actual rise is the total
 * rise divided by that count and is almost never the preferred rise the user
 * asked for. Every check is then run against the actual figure rather than the
 * requested one, because that is what gets built.
 */
export function stairs(
  totalRiseMm: number,
  preferredRiseMm: number,
  goingMm: number,
  building: BuildingRules
): StairResult {
  const k = building.private_stairs_approved_document_k;
  const totalRise = positive(totalRiseMm, "Total rise");
  const preferred = positive(preferredRiseMm, "Preferred rise");
  const going = positive(goingMm, "Going");

  if (totalRise > 10000) {
    throw new Error("A total rise above 10 metres is beyond a single domestic flight. Check the figure, in millimetres.");
  }
  if (totalRise < 100) {
    throw new Error("A total rise below 100 mm is a step rather than a stair. Check the figure, which should be in millimetres.");
  }
  if (preferred < 50 || preferred > 400) {
    throw new Error("The preferred rise must be between 50 and 400 mm.");
  }
  if (going < 50 || going > 600) {
    throw new Error("The going must be between 50 and 600 mm.");
  }

  const risers = Math.max(1, Math.round(totalRise / preferred));
  const actualRise = totalRise / risers;
  const treads = risers - 1;
  const totalRun = treads * going;
  const pitch = (Math.atan(actualRise / going) * 180) / Math.PI;
  const twoRG = 2 * actualRise + going;
  const stringer = Math.sqrt(totalRise * totalRise + totalRun * totalRun);

  const fmt = (n: number) => `${Math.round(n * 10) / 10}`;
  const checks: StairCheck[] = [
    {
      rule: "Maximum rise",
      limit: `${k.max_rise_mm} mm`,
      actual: `${fmt(actualRise)} mm`,
      passes: actualRise <= k.max_rise_mm + 1e-9
    },
    {
      rule: "Minimum going",
      limit: `${k.min_going_mm} mm`,
      actual: `${fmt(going)} mm`,
      passes: going >= k.min_going_mm - 1e-9
    },
    {
      rule: "Maximum pitch",
      limit: `${k.max_pitch_degrees} degrees`,
      actual: `${fmt(pitch)} degrees`,
      passes: pitch <= k.max_pitch_degrees + 1e-9
    },
    {
      rule: "Twice the rise plus the going",
      limit: `${k.two_rise_plus_going_min_mm} to ${k.two_rise_plus_going_max_mm} mm`,
      actual: `${fmt(twoRG)} mm`,
      passes: twoRG >= k.two_rise_plus_going_min_mm - 1e-9 && twoRG <= k.two_rise_plus_going_max_mm + 1e-9
    },
    {
      rule: "Maximum consecutive risers in one flight",
      limit: `${k.max_consecutive_risers}`,
      actual: `${risers}`,
      passes: risers <= k.max_consecutive_risers
    }
  ];

  const failed = checks.filter(c => !c.passes).length;

  return {
    total_rise_mm: sig(totalRise),
    number_of_risers: risers,
    number_of_treads: treads,
    actual_rise_mm: sig(actualRise),
    going_mm: sig(going),
    total_run_mm: sig(totalRun),
    pitch_degrees: sig(pitch),
    two_rise_plus_going_mm: sig(twoRG),
    stringer_length_mm: sig(stringer),
    all_checks_pass: failed === 0,
    failed_checks: failed,
    checks
  };
}
