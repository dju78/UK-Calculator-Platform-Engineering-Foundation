/**
 * Wave 2 tranche 2O, Home & Construction.
 *
 * What matters in this family is not arithmetic precision but the handful of
 * facts that make a materials estimate right or expensive: a roof is larger
 * than the building it covers, dry concrete ingredients bulk up, a grout joint
 * is part of a tile's footprint, and a stair's riser count is a whole number so
 * the actual rise is never quite the one asked for.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };

function closeTo(actual: number, expected: number, tol = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected} +/- ${tol}, got ${actual}`);
}

async function run(id: string, inputs: Record<string, unknown>) {
  return calculate(id, inputs as never, CTX);
}

async function throwsWith(id: string, inputs: Record<string, unknown>, fragment: string) {
  await assert.rejects(
    () => run(id, inputs),
    (err: Error) => {
      assert.ok(
        err.message.toLowerCase().includes(fragment.toLowerCase()),
        `expected a message containing "${fragment}", got "${err.message}"`
      );
      return true;
    }
  );
}

const SLAB = {
  shape: "slab", length_m: 5, width_m: 4, depth_m: 0.1, quantity: 1,
  wastage_pct: 10, mix_ratio: "1:2:4", concrete_density: 2400
};

// ---------------------------------------------------------------------------
// HOM-001 Concrete
// ---------------------------------------------------------------------------

test("a round column's volume uses its diameter as a circle, not as a width", async () => {
  const column = await run("HOM-001", {
    shape: "column", length_m: 3, width_m: 0.4, depth_m: 3, quantity: 1,
    wastage_pct: 0, mix_ratio: "1:2:4", concrete_density: 2400
  });
  // pi * 0.2^2 * 3
  closeTo(column.outputs.volume_m3 as number, Math.PI * 0.04 * 3, 1e-6);

  // A box of the same nominal dimensions would be 0.4 * 3 * 3 = 3.6 m3, which
  // is nearly ten times larger. Getting this wrong is not a rounding error.
  assert.ok((column.outputs.volume_m3 as number) < 1);
});

test("dry ingredients bulk up, so the materials exceed the wet volume", async () => {
  const r = await run("HOM-001", SLAB);
  const wetVolume = r.outputs.volume_with_wastage_m3 as number;
  const cementKg = r.outputs.cement_kg as number;
  const sandKg = r.outputs.sand_kg as number;
  const aggKg = r.outputs.aggregate_kg as number;

  // Back out the dry volumes from the masses and their bulk densities.
  const dryVolume = cementKg / 1440 + sandKg / 1600 + aggKg / 1500;
  closeTo(dryVolume / wetVolume, 1.54, 1e-6);
});

test("the mix ratio is honoured by volume, so a richer mix uses more cement for the same pour", async () => {
  const general = await run("HOM-001", { ...SLAB, mix_ratio: "1:2:4" });
  const structural = await run("HOM-001", { ...SLAB, mix_ratio: "1:1.5:3" });
  const lean = await run("HOM-001", { ...SLAB, mix_ratio: "1:3:6" });

  assert.ok((structural.outputs.cement_kg as number) > (general.outputs.cement_kg as number));
  assert.ok((lean.outputs.cement_kg as number) < (general.outputs.cement_kg as number));
  // The wet volume is identical across all three; only the recipe changes.
  closeTo(structural.outputs.volume_m3 as number, general.outputs.volume_m3 as number, 1e-9);
});

test("zero wastage means the ordered volume equals the measured volume exactly", async () => {
  const r = await run("HOM-001", { ...SLAB, wastage_pct: 0 });
  closeTo(r.outputs.volume_with_wastage_m3 as number, r.outputs.volume_m3 as number, 1e-9);
});

test("a malformed mix ratio is refused with the expected shape", async () => {
  await throwsWith("HOM-001", { ...SLAB, mix_ratio: "1:2" }, "three positive numbers");
  await throwsWith("HOM-001", { ...SLAB, mix_ratio: "1:0:4" }, "three positive numbers");
});

// ---------------------------------------------------------------------------
// HOM-002 Roofing
// ---------------------------------------------------------------------------

test("a roof is always larger than its footprint, and at 45 degrees by exactly root two", async () => {
  const common = {
    roof_type: "gable", length_m: 10, width_m: 8, tiles_per_m2: 10,
    batten_spacing_mm: 300, wastage_pct: 0, underlay_roll_m2: 30
  };
  const flat = await run("HOM-002", { ...common, pitch_degrees: 1 });
  const thirty = await run("HOM-002", { ...common, pitch_degrees: 30 });
  const fortyFive = await run("HOM-002", { ...common, pitch_degrees: 45 });

  closeTo(fortyFive.outputs.pitch_factor as number, Math.SQRT2, 1e-9);
  closeTo(thirty.outputs.pitch_factor as number, 2 / Math.sqrt(3), 1e-9);

  for (const r of [flat, thirty, fortyFive]) {
    assert.ok(
      (r.outputs.roof_area_m2 as number) > (r.outputs.plan_area_m2 as number),
      "a pitched roof is always larger than the plan it covers"
    );
  }
});

test("a hip roof has the same area as a gable roof, but a shorter ridge", async () => {
  const common = {
    length_m: 10, width_m: 8, pitch_degrees: 30, tiles_per_m2: 10,
    batten_spacing_mm: 300, wastage_pct: 0, underlay_roll_m2: 30
  };
  const gable = await run("HOM-002", { ...common, roof_type: "gable" });
  const hip = await run("HOM-002", { ...common, roof_type: "hip" });

  closeTo(hip.outputs.roof_area_m2 as number, gable.outputs.roof_area_m2 as number, 1e-9);
  assert.ok(
    (hip.outputs.ridge_length_m as number) < (gable.outputs.ridge_length_m as number),
    "a hip roof's ridge is shorter than the building; a gable's runs its full length"
  );
  closeTo(hip.outputs.ridge_length_m as number, 2, 1e-9);
});

test("a lean-to rafter spans the whole width, a gable rafter only half", async () => {
  const common = {
    length_m: 6, width_m: 4, pitch_degrees: 30, tiles_per_m2: 10,
    batten_spacing_mm: 300, wastage_pct: 0, underlay_roll_m2: 30
  };
  const gable = await run("HOM-002", { ...common, roof_type: "gable" });
  const leanTo = await run("HOM-002", { ...common, roof_type: "lean_to" });
  closeTo(
    leanTo.outputs.rafter_length_m as number,
    2 * (gable.outputs.rafter_length_m as number),
    1e-9
  );
});

test("an impossible pitch is refused", async () => {
  const common = {
    roof_type: "gable", length_m: 10, width_m: 8, tiles_per_m2: 10,
    batten_spacing_mm: 300, wastage_pct: 10, underlay_roll_m2: 30
  };
  await throwsWith("HOM-002", { ...common, pitch_degrees: 90 }, "below 90 degrees");
  await throwsWith("HOM-002", { ...common, pitch_degrees: 0 }, "above 0");
  await throwsWith("HOM-002", { ...common, pitch_degrees: 80 }, "wall rather than a roof");
});

// ---------------------------------------------------------------------------
// HOM-003 Tiles
// ---------------------------------------------------------------------------

test("the grout gap is part of each tile's footprint, and matters most on small tiles", async () => {
  const mosaicBase = {
    length_m: 2, width_m: 2, area_m2: "", openings_m2: 0,
    tile_width_mm: 25, tile_height_mm: 25, wastage_pct: 0,
    tiles_per_box: 100, adhesive_kg_per_m2: 3
  };
  const noGap = await run("HOM-003", { ...mosaicBase, grout_gap_mm: 0 });
  const withGap = await run("HOM-003", { ...mosaicBase, grout_gap_mm: 2 });

  // 25 mm tiles with a 2 mm joint repeat at 27 mm, so the count falls by
  // (25/27)^2, about 14 per cent. Ignoring the gap over-orders by that much.
  const ratio = (withGap.outputs.tiles_needed as number) / (noGap.outputs.tiles_needed as number);
  assert.ok(ratio < 0.9, `a 2 mm joint on a 25 mm tile should cut the count by over a tenth, got ${ratio}`);

  // On a large-format tile the same joint barely registers.
  const largeBase = {
    length_m: 5, width_m: 4, area_m2: "", openings_m2: 0,
    tile_width_mm: 1200, tile_height_mm: 600, wastage_pct: 0,
    tiles_per_box: 2, adhesive_kg_per_m2: 6
  };
  const largeNoGap = await run("HOM-003", { ...largeBase, grout_gap_mm: 0 });
  const largeWithGap = await run("HOM-003", { ...largeBase, grout_gap_mm: 3 });
  const largeRatio = (largeWithGap.outputs.tiles_needed as number) / (largeNoGap.outputs.tiles_needed as number);
  assert.ok(largeRatio > 0.98, "on a 1200 mm tile a 3 mm joint should barely change the count");
});

test("openings are deducted before anything is counted", async () => {
  const common = {
    length_m: 4, width_m: 3.5, area_m2: "", tile_width_mm: 600,
    tile_height_mm: 600, grout_gap_mm: 3, wastage_pct: 0,
    tiles_per_box: 4, adhesive_kg_per_m2: 5
  };
  const full = await run("HOM-003", { ...common, openings_m2: 0 });
  const withDoor = await run("HOM-003", { ...common, openings_m2: 1.6 });
  closeTo(withDoor.outputs.area_less_openings_m2 as number, 14 - 1.6, 1e-9);
  assert.ok((withDoor.outputs.tiles_needed as number) < (full.outputs.tiles_needed as number));
});

test("openings as large as the surface are refused rather than answered with nothing to tile", async () => {
  await throwsWith(
    "HOM-003",
    {
      length_m: 2, width_m: 2, area_m2: "", openings_m2: 4,
      tile_width_mm: 300, tile_height_mm: 300, grout_gap_mm: 3,
      wastage_pct: 10, tiles_per_box: 10, adhesive_kg_per_m2: 4
    },
    "nothing to tile"
  );
});

test("boxes are rounded up, because you cannot buy part of one", async () => {
  const r = await run("HOM-003", {
    length_m: 3, width_m: 2.4, area_m2: "", openings_m2: 0,
    tile_width_mm: 300, tile_height_mm: 300, grout_gap_mm: 3,
    wastage_pct: 10, tiles_per_box: 10, adhesive_kg_per_m2: 4
  });
  const tilesNeeded = r.outputs.tiles_with_wastage as number;
  const boxes = r.outputs.boxes_needed as number;
  assert.ok(Number.isInteger(boxes));
  assert.ok(boxes * 10 >= tilesNeeded, "the boxes ordered must cover the tiles needed");
  assert.ok((boxes - 1) * 10 < tilesNeeded, "and must not be more than one box over");
});

// ---------------------------------------------------------------------------
// HOM-004 / HOM-005 Loose materials
// ---------------------------------------------------------------------------

test("a square metre at a millimetre deep is exactly one litre", async () => {
  const r = await run("HOM-004", {
    length_m: 100, width_m: 10, area_m2: "", depth_mm: 1,
    bulk_density: 1500, bag_size_litres: 25, bulk_bag_m3: 0.5
  });
  closeTo(r.outputs.volume_m3 as number, 1, 1e-9);
});

test("weight scales with the bulk density and nothing else", async () => {
  const common = {
    length_m: 10, width_m: 4, area_m2: "", depth_mm: 50,
    bag_size_litres: 25, bulk_bag_m3: 0.5
  };
  const light = await run("HOM-004", { ...common, bulk_density: 1400 });
  const heavy = await run("HOM-004", { ...common, bulk_density: 1700 });
  closeTo(light.outputs.volume_m3 as number, heavy.outputs.volume_m3 as number, 1e-9);
  closeTo(
    (heavy.outputs.weight_tonnes as number) / (light.outputs.weight_tonnes as number),
    1700 / 1400,
    1e-9
  );
});

test("coverage per tonne is the inverse of density times depth, which is what a quote is checked against", async () => {
  const r = await run("HOM-004", {
    length_m: 10, width_m: 4, area_m2: "", depth_mm: 50,
    bulk_density: 1500, bag_size_litres: 25, bulk_bag_m3: 0.5
  });
  // A tonne is 1/1.5 of a cubic metre, spread 50 mm deep, covers 13.33 m2.
  closeTo(r.outputs.coverage_per_tonne_m2 as number, (1000 / 1500) / 0.05, 1e-6);
  // And that figure times the tonnage must recover the area.
  closeTo(
    (r.outputs.coverage_per_tonne_m2 as number) * (r.outputs.weight_tonnes as number),
    r.outputs.area_m2 as number,
    1e-6
  );
});

test("mulch is far lighter than gravel for the same volume", async () => {
  const common = { length_m: 6, width_m: 3, area_m2: "", depth_mm: 75 };
  const gravel = await run("HOM-004", {
    ...common, bulk_density: 1500, bag_size_litres: 25, bulk_bag_m3: 0.5
  });
  const mulch = await run("HOM-005", {
    ...common, bulk_density: 350, bag_size_litres: 70, bulk_bag_m3: 1
  });
  closeTo(gravel.outputs.volume_m3 as number, mulch.outputs.volume_m3 as number, 1e-9);
  assert.ok(
    (gravel.outputs.weight_tonnes as number) > 4 * (mulch.outputs.weight_tonnes as number),
    "gravel should be several times heavier than bark for the same volume"
  );
});

test("a depth entered in metres by mistake is refused rather than answered", async () => {
  await throwsWith(
    "HOM-004",
    {
      length_m: 10, width_m: 4, area_m2: "", depth_mm: 2000,
      bulk_density: 1500, bag_size_litres: 25, bulk_bag_m3: 0.5
    },
    "depths are in millimetres"
  );
});

// ---------------------------------------------------------------------------
// HOM-006 Stairs
// ---------------------------------------------------------------------------

test("a flight has one more riser than it has treads", async () => {
  for (const rise of [900, 2400, 2600, 3200]) {
    const r = await run("HOM-006", {
      total_rise_mm: rise, preferred_rise_mm: 190, going_mm: 230
    });
    assert.strictEqual(
      r.outputs.number_of_treads,
      (r.outputs.number_of_risers as number) - 1,
      "the top surface is the landing, not a tread"
    );
  }
});

test("the risers multiply back to exactly the total rise", async () => {
  for (const rise of [900, 2400, 2600, 3200, 2750]) {
    const r = await run("HOM-006", {
      total_rise_mm: rise, preferred_rise_mm: 190, going_mm: 230
    });
    closeTo(
      (r.outputs.actual_rise_mm as number) * (r.outputs.number_of_risers as number),
      rise,
      1e-6
    );
  }
});

test("the actual rise differs from the preferred one, and the user is told", async () => {
  const r = await run("HOM-006", {
    total_rise_mm: 2600, preferred_rise_mm: 190, going_mm: 230
  });
  // 2600 / 190 is 13.68, so 14 risers at 185.7 mm.
  assert.strictEqual(r.outputs.number_of_risers, 14);
  closeTo(r.outputs.actual_rise_mm as number, 2600 / 14, 1e-6);
  assert.ok(
    (r.warnings ?? []).some(w => /whole number/i.test(w)),
    "a design whose actual rise differs from the requested one must say so"
  );
});

test("a compliant flight passes every Part K check and a steep one fails several", async () => {
  const good = await run("HOM-006", {
    total_rise_mm: 2600, preferred_rise_mm: 190, going_mm: 230
  });
  assert.strictEqual(good.outputs.all_checks_pass, true);
  assert.strictEqual(good.outputs.failed_checks, 0);
  assert.ok((good.outputs.pitch_degrees as number) <= 42);

  const steep = await run("HOM-006", {
    total_rise_mm: 2600, preferred_rise_mm: 230, going_mm: 200
  });
  assert.strictEqual(steep.outputs.all_checks_pass, false);
  // The rise, the going and the pitch all breach.
  assert.strictEqual(steep.outputs.failed_checks, 3);
  const checks = steep.schedule as Array<{ rule: string; passes: boolean }>;
  const failed = checks.filter(c => !c.passes).map(c => c.rule);
  assert.deepStrictEqual(
    failed.sort(),
    ["Maximum pitch", "Maximum rise", "Minimum going"].sort()
  );
});

test("the stride rule can fail from either direction", async () => {
  // Too shallow: a small rise with a normal going falls below 550.
  const shallow = await run("HOM-006", {
    total_rise_mm: 2400, preferred_rise_mm: 150, going_mm: 220
  });
  // Too generous: a normal rise with a very deep going exceeds 700.
  const deep = await run("HOM-006", {
    total_rise_mm: 2700, preferred_rise_mm: 200, going_mm: 320
  });

  assert.ok((shallow.outputs.two_rise_plus_going_mm as number) < 550);
  assert.ok((deep.outputs.two_rise_plus_going_mm as number) > 700);
  for (const r of [shallow, deep]) {
    const checks = r.schedule as Array<{ rule: string; passes: boolean }>;
    const stride = checks.find(c => c.rule === "Twice the rise plus the going");
    assert.strictEqual(stride?.passes, false, "the stride rule must fail in both directions");
  }
});

test("the stringer length is the hypotenuse of the whole flight", async () => {
  const r = await run("HOM-006", {
    total_rise_mm: 2600, preferred_rise_mm: 190, going_mm: 230
  });
  const rise = 2600;
  const run_ = r.outputs.total_run_mm as number;
  closeTo(r.outputs.stringer_length_mm as number, Math.sqrt(rise * rise + run_ * run_), 1e-6);
});

test("a rise entered in metres by mistake is refused", async () => {
  await throwsWith(
    "HOM-006",
    { total_rise_mm: 2.6, preferred_rise_mm: 190, going_mm: 230 },
    "should be in millimetres"
  );
});

// ---------------------------------------------------------------------------
// Nothing broken ever reaches a user
// ---------------------------------------------------------------------------

test("every home calculator returns finite numbers, strings or nulls only", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["HOM-001", SLAB],
    ["HOM-002", { roof_type: "gable", length_m: 10, width_m: 8, pitch_degrees: 30, tiles_per_m2: 10, batten_spacing_mm: 300, wastage_pct: 10, underlay_roll_m2: 30 }],
    ["HOM-003", { length_m: 3, width_m: 2.4, area_m2: "", openings_m2: 0, tile_width_mm: 300, tile_height_mm: 300, grout_gap_mm: 3, wastage_pct: 10, tiles_per_box: 10, adhesive_kg_per_m2: 4 }],
    ["HOM-004", { length_m: 10, width_m: 4, area_m2: "", depth_mm: 50, bulk_density: 1500, bag_size_litres: 25, bulk_bag_m3: 0.5 }],
    ["HOM-005", { length_m: 6, width_m: 3, area_m2: "", depth_mm: 75, bulk_density: 350, bag_size_litres: 70, bulk_bag_m3: 1 }],
    ["HOM-006", { total_rise_mm: 2600, preferred_rise_mm: 190, going_mm: 230 }]
  ];
  for (const [id, inputs] of cases) {
    const r = await run(id, inputs);
    for (const [key, value] of Object.entries(r.outputs)) {
      if (value === null) continue;
      const kind = typeof value;
      assert.ok(
        kind === "number" || kind === "string" || kind === "boolean",
        `${id}.${key} is a ${kind}, which would render as [object Object]`
      );
      if (kind === "number") {
        assert.ok(Number.isFinite(value as number), `${id}.${key} is not finite`);
      }
      if (kind === "string") {
        assert.ok(
          !/NaN|Infinity|undefined|\[object/.test(value as string),
          `${id}.${key} contains a broken value: ${value}`
        );
      }
    }
  }
});
