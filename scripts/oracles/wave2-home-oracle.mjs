/**
 * Independent benchmark oracle for Wave 2 tranche 2O, Home & Construction.
 *
 * Imports nothing from the calculation engine. Independence of METHOD:
 *
 *   - Volumes are computed in MILLIMETRE units and converted at the end,
 *     rather than in metres throughout, so a factor of a thousand dropped
 *     anywhere would separate the two.
 *   - The roof pitch factor is derived as the square root of one plus tangent
 *     squared, a different trigonometric identity from the engine's reciprocal
 *     cosine. They are equal by Pythagoras, so agreeing is a real check.
 *   - A circular column's area is derived from its CIRCUMFERENCE rather than
 *     from pi r squared.
 *   - Stair pitch is derived from the arcsine of rise over stringer length,
 *     using the hypotenuse, rather than from the arctangent of rise over
 *     going. The riser count is found by a search loop rather than by
 *     rounding.
 *   - Tile counts are computed from areas in square millimetres.
 *
 * Run: node scripts/oracles/wave2-home-oracle.mjs > /tmp/home.json
 */

const sig = (n, digits = 10) => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};

const fixtures = {};

function add(id, scenario, inputs, expected, note, ruleset = "None") {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "1e-6 on ratios, ±0.011 on larger quantities",
    ruleset,
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// HOM-001 Concrete
// ===========================================================================

const DRY_FACTOR = 1.54;
const CEMENT_DENSITY = 1440;
const SAND_DENSITY = 1600;
const AGG_DENSITY = 1500;

for (const c of [
  { scenario: "A garage slab, standard 1:2:4 mix", shape: "slab", L: 5, W: 4, D: 0.1, n: 1, waste: 10, mix: "1:2:4", rho: 2400 },
  { scenario: "A strip footing run in one pour", shape: "footing", L: 12, W: 0.6, D: 0.3, n: 1, waste: 10, mix: "1:2:4", rho: 2400 },
  { scenario: "Four identical pad foundations", shape: "footing", L: 0.8, W: 0.8, D: 0.5, n: 4, waste: 5, mix: "1:1.5:3", rho: 2400 },
  { scenario: "A round column, where the area is not length times width", shape: "column", L: 3, W: 0.4, D: 3, n: 2, waste: 10, mix: "1:1.5:3", rho: 2400 },
  { scenario: "A lean 1:3:6 mix for a non-structural base", shape: "slab", L: 3, W: 3, D: 0.15, n: 1, waste: 15, mix: "1:3:6", rho: 2300 },
  { scenario: "No wastage allowance at all", shape: "slab", L: 2, W: 2, D: 0.1, n: 1, waste: 0, mix: "1:2:4", rho: 2400 }
]) {
  // Work in millimetres, then convert once at the end.
  const Lmm = c.L * 1000, Wmm = c.W * 1000, Dmm = c.D * 1000;
  let singleMm3;
  if (c.shape === "column") {
    // Area from the circumference rather than from pi r squared:
    // A = C^2 / (4 pi).
    const circumference = Math.PI * Wmm;
    singleMm3 = (circumference * circumference) / (4 * Math.PI) * Dmm;
  } else {
    singleMm3 = Lmm * Wmm * Dmm;
  }
  const volume = (singleMm3 * c.n) / 1e9;
  const withWaste = volume * (1 + c.waste / 100);

  const parts = c.mix.split(":").map(Number);
  const totalParts = parts[0] + parts[1] + parts[2];
  const dry = withWaste * DRY_FACTOR;
  const cementKg = (dry * parts[0] / totalParts) * CEMENT_DENSITY;

  add("HOM-001", c.scenario,
    {
      shape: c.shape, length_m: c.L, width_m: c.W, depth_m: c.D,
      quantity: c.n, wastage_pct: c.waste, mix_ratio: c.mix, concrete_density: c.rho
    },
    {
      volume_m3: sig(volume),
      volume_with_wastage_m3: sig(withWaste),
      weight_tonnes: sig((withWaste * c.rho) / 1000),
      cement_kg: sig(cementKg),
      sand_kg: sig((dry * parts[1] / totalParts) * SAND_DENSITY),
      aggregate_kg: sig((dry * parts[2] / totalParts) * AGG_DENSITY),
      water_litres: sig(cementKg * 0.5),
      cement_bags_25kg: Math.ceil(cementKg / 25),
      ready_mix_loads: Math.ceil(withWaste / 6),
      wastage_pct: c.waste
    },
    "Volumes are built in millimetre units and converted once, and the column's plan area is derived from its CIRCUMFERENCE rather than from pi r squared, so a radius-versus-diameter slip could not be reproduced. The zero-wastage case pins the boundary where the ordered quantity must equal the measured one exactly.");
}

// ===========================================================================
// HOM-002 Roofing
// ===========================================================================

for (const c of [
  { scenario: "A gable roof at the common 30 degree pitch", type: "gable", L: 10, W: 8, pitch: 30, tiles: 10, batten: 300, waste: 10, roll: 30 },
  { scenario: "A steeper 45 degree roof, where the area exceeds the plan by 41 per cent", type: "gable", L: 9, W: 7, pitch: 45, tiles: 10, batten: 300, waste: 10, roll: 30 },
  { scenario: "A shallow 22.5 degree roof", type: "gable", L: 12, W: 9, pitch: 22.5, tiles: 12, batten: 345, waste: 10, roll: 30 },
  { scenario: "A hip roof, same area as a gable but a shorter ridge", type: "hip", L: 10, W: 8, pitch: 30, tiles: 10, batten: 300, waste: 15, roll: 30 },
  { scenario: "A lean-to, where the rafter spans the whole width", type: "lean_to", L: 6, W: 3, pitch: 15, tiles: 10, batten: 300, waste: 10, roll: 30 },
  { scenario: "Slates at a much higher count per square metre", type: "gable", L: 8, W: 6, pitch: 35, tiles: 21, batten: 250, waste: 12, roll: 25 }
]) {
  const radians = (c.pitch * Math.PI) / 180;
  // Pythagoras rather than the reciprocal cosine: sqrt(1 + tan^2) equals sec.
  const t = Math.tan(radians);
  const pitchFactor = Math.sqrt(1 + t * t);

  const planArea = c.L * c.W;
  const roofArea = planArea * pitchFactor;
  const withWaste = roofArea * (1 + c.waste / 100);
  const rafterRun = c.type === "lean_to" ? c.W : c.W / 2;
  const ridge = c.type === "gable" ? c.L : c.type === "hip" ? Math.max(0, c.L - c.W) : 0;

  add("HOM-002", c.scenario,
    {
      roof_type: c.type, length_m: c.L, width_m: c.W, pitch_degrees: c.pitch,
      tiles_per_m2: c.tiles, batten_spacing_mm: c.batten,
      wastage_pct: c.waste, underlay_roll_m2: c.roll
    },
    {
      plan_area_m2: sig(planArea),
      pitch_factor: sig(pitchFactor),
      roof_area_m2: sig(roofArea),
      roof_area_with_wastage_m2: sig(withWaste),
      rafter_length_m: sig(rafterRun * pitchFactor),
      tiles_needed: Math.ceil(withWaste * c.tiles),
      battens_length_m: sig(withWaste / (c.batten / 1000)),
      underlay_rolls: Math.ceil(withWaste / c.roll),
      ridge_length_m: sig(ridge)
    },
    "The pitch factor is derived as the square root of one plus tangent squared, which equals the secant by Pythagoras but shares no code path with the engine's reciprocal cosine. The 45 degree case pins the factor at root two, which is checkable by inspection.");
}

// ===========================================================================
// HOM-003 Tiles
// ===========================================================================

for (const c of [
  { scenario: "A small bathroom wall in 300 mm tiles", L: 3, W: 2.4, open: 0, tw: 300, th: 300, gap: 3, waste: 10, box: 10, adh: 4 },
  { scenario: "A floor with a door opening deducted", L: 4, W: 3.5, open: 1.6, tw: 600, th: 600, gap: 3, waste: 10, box: 4, adh: 5 },
  { scenario: "Mosaic tiles, where the joints are a real fraction of the area", L: 2, W: 2, open: 0, tw: 25, th: 25, gap: 2, waste: 15, box: 100, adh: 3 },
  { scenario: "Rectangular metro tiles", L: 3.2, W: 2.2, open: 0.4, tw: 200, th: 100, gap: 2, waste: 12, box: 50, adh: 4 },
  { scenario: "A large-format tile with no grout gap at all", L: 5, W: 4, open: 0, tw: 1200, th: 600, gap: 0, waste: 10, box: 2, adh: 6 },
  { scenario: "An area given directly rather than as dimensions", area: 25, open: 2, tw: 450, th: 450, gap: 3, waste: 10, box: 6, adh: 4 }
]) {
  const area = c.area !== undefined ? c.area : c.L * c.W;
  const net = area - c.open;
  // Work in square millimetres.
  const tileMm2 = (c.tw + c.gap) * (c.th + c.gap);
  const netMm2 = net * 1e6;
  const exact = netMm2 / tileMm2;
  const withWaste = Math.ceil(exact * (1 + c.waste / 100));

  const effW = (c.tw + c.gap) / 1000;
  const effH = (c.th + c.gap) / 1000;
  const jointLength = withWaste * ((effW + effH) * 2) / 2;
  const groutKg = jointLength * (c.gap / 1000) * 0.008 * 1600;

  add("HOM-003", c.scenario,
    {
      area_m2: c.area ?? null, length_m: c.L ?? 0, width_m: c.W ?? 0,
      openings_m2: c.open, tile_width_mm: c.tw, tile_height_mm: c.th,
      grout_gap_mm: c.gap, wastage_pct: c.waste,
      tiles_per_box: c.box, adhesive_kg_per_m2: c.adh
    },
    {
      area_m2: sig(area),
      area_less_openings_m2: sig(net),
      tiles_needed: Math.ceil(exact),
      tiles_with_wastage: withWaste,
      boxes_needed: Math.ceil(withWaste / c.box),
      adhesive_kg: sig(net * c.adh),
      grout_kg: sig(groutKg),
      wastage_pct: c.waste
    },
    "Tile counts are computed from areas in SQUARE MILLIMETRES rather than square metres. The mosaic case matters: at 25 mm tiles with a 2 mm joint the grout is about fifteen per cent of the area, so an implementation that ignored the gap would over-order noticeably there and barely at all on the large-format case, which is why both are present. The zero-gap case pins the boundary.");
}

// ===========================================================================
// HOM-004 Gravel and HOM-005 Mulch
// ===========================================================================

const looseCases = [
  { id: "HOM-004", scenario: "A drive at the usual 50 mm depth", L: 10, W: 4, depth: 50, rho: 1500, bag: 25, bulk: 0.5 },
  { id: "HOM-004", scenario: "A path in coarser, denser stone", L: 20, W: 1.2, depth: 60, rho: 1700, bag: 25, bulk: 0.85 },
  { id: "HOM-004", scenario: "A large area given directly", area: 250, depth: 50, rho: 1500, bag: 25, bulk: 0.5 },
  { id: "HOM-004", scenario: "Light decorative aggregate", L: 6, W: 3, depth: 40, rho: 1400, bag: 20, bulk: 0.5 },
  { id: "HOM-004", scenario: "A deep sub-base layer", L: 8, W: 5, depth: 150, rho: 1600, bag: 25, bulk: 0.85 },
  { id: "HOM-004", scenario: "A very small area, where one bulk bag is still the minimum", L: 1, W: 1, depth: 50, rho: 1500, bag: 25, bulk: 0.5 },

  { id: "HOM-005", scenario: "A border at the recommended 75 mm", L: 6, W: 3, depth: 75, rho: 350, bag: 70, bulk: 1 },
  { id: "HOM-005", scenario: "A thinner 50 mm layer", L: 10, W: 2, depth: 50, rho: 300, bag: 70, bulk: 1 },
  { id: "HOM-005", scenario: "Heavier composted bark", L: 4, W: 4, depth: 75, rho: 400, bag: 50, bulk: 1 },
  { id: "HOM-005", scenario: "A very light wood chip", L: 12, W: 2.5, depth: 60, rho: 250, bag: 70, bulk: 1 },
  { id: "HOM-005", scenario: "An area given directly", area: 45, depth: 75, rho: 350, bag: 70, bulk: 1 },
  { id: "HOM-005", scenario: "A small bed needing a single bag", L: 1.5, W: 0.6, depth: 50, rho: 350, bag: 70, bulk: 1 }
];

for (const c of looseCases) {
  const area = c.area !== undefined ? c.area : c.L * c.W;
  // Compute in litres first, then convert to cubic metres.
  const litres = area * c.depth;              // m^2 * mm = litres exactly
  const volume = litres / 1000;
  const kg = volume * c.rho;

  add(c.id, c.scenario,
    {
      area_m2: c.area ?? null, length_m: c.L ?? 0, width_m: c.W ?? 0,
      depth_mm: c.depth, bulk_density: c.rho,
      bag_size_litres: c.bag, bulk_bag_m3: c.bulk
    },
    {
      area_m2: sig(area),
      depth_mm: sig(c.depth),
      volume_m3: sig(volume),
      weight_tonnes: sig(kg / 1000),
      bags_needed: Math.ceil(litres / c.bag),
      bulk_bags_needed: Math.ceil(volume / c.bulk),
      bulk_density_kg_per_m3: sig(c.rho)
    },
    "Volume is computed in LITRES first, using the identity that a square metre at a millimetre depth is exactly one litre, and converted afterwards. That is a different route from the engine's metres throughout, and it is also the arithmetic a merchant does in their head.");
}

// ===========================================================================
// HOM-006 Stairs
// ===========================================================================

for (const c of [
  { scenario: "A typical domestic flight that complies", rise: 2600, pref: 190, going: 230 },
  { scenario: "A steep flight that breaks three rules at once", rise: 2600, pref: 230, going: 200 },
  { scenario: "A low rise to a raised floor", rise: 900, pref: 180, going: 250 },
  { scenario: "A tall Victorian storey height", rise: 3200, pref: 195, going: 225 },
  { scenario: "A shallow flight that fails the stride rule from below", rise: 2400, pref: 150, going: 220 },
  { scenario: "A generous going that fails the stride rule from above", rise: 2700, pref: 200, going: 320 }
]) {
  // Find the riser count by SEARCHING for the whole number whose resulting rise
  // is closest to the preferred one, rather than by rounding a quotient.
  let best = 1;
  let bestError = Infinity;
  for (let n = 1; n <= 100; n++) {
    const err = Math.abs(c.rise / n - c.pref);
    if (err < bestError - 1e-12) { bestError = err; best = n; }
  }
  const risers = best;
  const actualRise = c.rise / risers;
  const treads = risers - 1;
  const totalRun = treads * c.going;
  const stringer = Math.sqrt(c.rise * c.rise + totalRun * totalRun);

  // Pitch from the ARCSINE using the hypotenuse of one step, not the arctangent
  // of rise over going.
  const stepHypotenuse = Math.sqrt(actualRise * actualRise + c.going * c.going);
  const pitch = (Math.asin(actualRise / stepHypotenuse) * 180) / Math.PI;
  const twoRG = 2 * actualRise + c.going;

  const failures =
    (actualRise <= 220 ? 0 : 1) +
    (c.going >= 220 ? 0 : 1) +
    (pitch <= 42 ? 0 : 1) +
    (twoRG >= 550 && twoRG <= 700 ? 0 : 1) +
    (risers <= 36 ? 0 : 1);

  add("HOM-006", c.scenario,
    { total_rise_mm: c.rise, preferred_rise_mm: c.pref, going_mm: c.going },
    {
      number_of_risers: risers,
      number_of_treads: treads,
      actual_rise_mm: sig(actualRise),
      going_mm: sig(c.going),
      total_run_mm: sig(totalRun),
      pitch_degrees: sig(pitch),
      two_rise_plus_going_mm: sig(twoRG),
      stringer_length_mm: sig(stringer),
      all_checks_pass: failures === 0,
      failed_checks: failures
    },
    "The riser count is found by SEARCHING for the whole number giving a rise closest to the preferred one, not by rounding a quotient, and the pitch comes from an arcsine on the step hypotenuse rather than an arctangent on rise over going. Two cases fail the stride rule from opposite directions, one because the rise is too shallow and one because the going is too generous, so a comparison written the wrong way round would pass one and fail the other.",
    "uk-2026-27-v1");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
