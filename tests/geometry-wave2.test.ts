import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = {};
const closeTo = (a: number, e: number, tol = 1e-8) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// GEO-004: a shape that cannot exist is refused, not approximated
// ---------------------------------------------------------------------------

test("GEO-004 refuses lengths that cannot form a triangle", async (t: any) => {
  await t.test("the longest side exceeds the other two combined", async () => {
    await assert.rejects(
      () => calculate("GEO-004", { side_a: 1, side_b: 2, side_c: 10 }, CTX),
      /cannot form a triangle/
    );
  });
  await t.test("degenerate, where the three points are collinear", async () => {
    // Heron's formula returns exactly zero here rather than an error, which
    // looks like a valid answer. It is not a triangle.
    await assert.rejects(
      () => calculate("GEO-004", { side_a: 3, side_b: 4, side_c: 7 }, CTX),
      /cannot form a triangle/
    );
  });
});

test("GEO-004 solves a triangle consistently", async () => {
  const { outputs } = await calculate("GEO-004", { side_a: 3, side_b: 4, side_c: 5 }, CTX);
  closeTo(outputs.area as number, 6);
  closeTo(outputs.angle_a as number + (outputs.angle_b as number) + (outputs.angle_c as number), 180, 1e-6);
  assert.strictEqual(outputs.is_right_angled, true);
  // The inradius of a 3-4-5 triangle is exactly 1, and the circumradius 2.5.
  closeTo(outputs.inradius as number, 1);
  closeTo(outputs.circumradius as number, 2.5);
});

test("GEO-004 classifies triangles correctly", async (t: any) => {
  const cases: Array<[string, number, number, number, RegExp]> = [
    ["equilateral", 6, 6, 6, /Acute, equilateral/],
    ["isosceles", 5, 5, 8, /isosceles/],
    ["obtuse scalene", 4, 5, 8, /Obtuse, scalene/],
    ["right-angled", 5, 12, 13, /Right-angled/]
  ];
  for (const [name, a, b, c, pattern] of cases) {
    await t.test(name, async () => {
      const { outputs } = await calculate("GEO-004", { side_a: a, side_b: b, side_c: c }, CTX);
      assert.match(String(outputs.triangle_type), pattern);
    });
  }
});

// ---------------------------------------------------------------------------
// GEO-005 / GEO-007: the hypotenuse is the longest side
// ---------------------------------------------------------------------------

test("GEO-005 refuses a hypotenuse shorter than a leg", async () => {
  await assert.rejects(
    () => calculate("GEO-005", { opposite: 10, adjacent: "", hypotenuse: 5 }, CTX),
    /must be longer than either of the other two sides/
  );
});

test("GEO-005 needs at least two sides", async () => {
  await assert.rejects(
    () => calculate("GEO-005", { opposite: 3, adjacent: "", hypotenuse: "" }, CTX),
    /at least two of the three sides/
  );
});

test("GEO-007 the three squares satisfy Pythagoras", async (t: any) => {
  for (const [a, b] of [[3, 4], [5, 12], [7, 24], [2.5, 6]]) {
    await t.test(`${a} and ${b}`, async () => {
      const { outputs } = await calculate(
        "GEO-007",
        { side_a: a, side_b: b, hypotenuse: "" },
        CTX
      );
      closeTo(
        (outputs.a_squared as number) + (outputs.b_squared as number),
        outputs.hypotenuse_squared as number,
        1e-6
      );
    });
  }
});

// ---------------------------------------------------------------------------
// GEO-006: any one measurement determines the circle
// ---------------------------------------------------------------------------

test("GEO-006 gives the same circle whichever measurement is entered", async () => {
  const fromRadius = await calculate("GEO-006", {
    radius: 5, diameter: "", circumference: "", area: "", angle: 0
  }, CTX);
  const fromDiameter = await calculate("GEO-006", {
    radius: "", diameter: 10, circumference: "", area: "", angle: 0
  }, CTX);
  const fromCircumference = await calculate("GEO-006", {
    radius: "", diameter: "", circumference: 2 * Math.PI * 5, area: "", angle: 0
  }, CTX);
  const fromArea = await calculate("GEO-006", {
    radius: "", diameter: "", circumference: "", area: Math.PI * 25, angle: 0
  }, CTX);

  for (const result of [fromDiameter, fromCircumference, fromArea]) {
    closeTo(result.outputs.radius as number, fromRadius.outputs.radius as number, 1e-6);
    closeTo(result.outputs.area as number, fromRadius.outputs.area as number, 1e-6);
  }
});

test("GEO-006 the segment is the sector less the triangle", async () => {
  const { outputs } = await calculate("GEO-006", {
    radius: 6, diameter: "", circumference: "", area: "", angle: 120
  }, CTX);
  const theta = (120 * Math.PI) / 180;
  const triangle = 0.5 * 36 * Math.sin(theta);
  closeTo(
    (outputs.sector_area as number) - triangle,
    outputs.segment_area as number,
    1e-6
  );
});

test("GEO-006 omits sector figures when no angle is given", async () => {
  const { outputs } = await calculate("GEO-006", {
    radius: 5, diameter: "", circumference: "", area: "", angle: 0
  }, CTX);
  assert.strictEqual(outputs.sector_area, null);
  assert.strictEqual(outputs.arc_length, null);
  assert.strictEqual(outputs.segment_area, null);
});

test("GEO-006 needs at least one measurement", async () => {
  await assert.rejects(
    () => calculate("GEO-006", {
      radius: "", diameter: "", circumference: "", area: "", angle: 0
    }, CTX),
    /Enter a radius, diameter, circumference or area/
  );
});

// ---------------------------------------------------------------------------
// GEO-001 / GEO-002 / GEO-003: geometry that holds together
// ---------------------------------------------------------------------------

test("GEO-001 leaves the perimeter blank where the inputs do not determine it", async () => {
  // A base and a height fix a triangle's area but not its other two sides.
  // Returning a perimeter here would mean inventing them.
  const triangle = await calculate("GEO-001", {
    shape: "triangle", a: 10, b: 6, c: 0, d: 0, angle: 0
  }, CTX);
  assert.strictEqual(triangle.outputs.perimeter, null);
  assert.match(String(triangle.outputs.basis), /do not determine it/);

  const rectangle = await calculate("GEO-001", {
    shape: "rectangle", a: 8, b: 5, c: 0, d: 0, angle: 0
  }, CTX);
  closeTo(rectangle.outputs.perimeter as number, 26);
});

test("GEO-001 a sector perimeter includes both radii, not just the arc", async () => {
  const { outputs } = await calculate("GEO-001", {
    shape: "sector", a: 4, b: 0, c: 0, d: 0, angle: 90
  }, CTX);
  const arc = 4 * (Math.PI / 2);
  closeTo(outputs.perimeter as number, arc + 8, 1e-6);
});

test("GEO-002 and GEO-003 agree on the same solid", async (t: any) => {
  const solids: Array<[string, number, number, number]> = [
    ["cube", 4, 0, 0],
    ["cuboid", 5, 4, 3],
    ["sphere", 3, 0, 0],
    ["cylinder", 2, 10, 0],
    ["cone", 3, 4, 0]
  ];
  for (const [shape, a, b, c] of solids) {
    await t.test(shape, async () => {
      const volume = await calculate("GEO-002", { shape, a, b, c }, CTX);
      const surface = await calculate("GEO-003", { shape, a, b, c }, CTX);
      assert.strictEqual(surface.outputs.volume, volume.outputs.volume);
      assert.strictEqual(surface.outputs.surface_area, volume.outputs.surface_area);
    });
  }
});

test("GEO-002 converts cubic metres to litres", async () => {
  const { outputs } = await calculate("GEO-002", { shape: "cube", a: 1, b: 0, c: 0 }, CTX);
  // One cubic metre is a thousand litres.
  closeTo(outputs.volume as number, 1);
  closeTo(outputs.volume_litres as number, 1000);
});

test("GEO-002 states the assumption it had to make", async () => {
  const { outputs } = await calculate("GEO-002", { shape: "prism", a: 6, b: 4, c: 10 }, CTX);
  // The base and height of a triangle do not fix its other two sides, so the
  // surface area needs an assumption, and the calculator names it.
  assert.match(String(outputs.basis), /assumed to be isosceles/);
});

test("GEO-002 refuses a measurement of zero", async () => {
  await assert.rejects(
    () => calculate("GEO-002", { shape: "cylinder", a: 0, b: 10, c: 0 }, CTX),
    /must be greater than zero/
  );
});

// ---------------------------------------------------------------------------
// GEO-008: straight line versus grid distance
// ---------------------------------------------------------------------------

test("GEO-008 distinguishes straight-line from Manhattan distance", async () => {
  const { outputs } = await calculate("GEO-008", {
    x1: 0, y1: 0, z1: 0, x2: 3, y2: 4, z2: 0
  }, CTX);
  closeTo(outputs.distance as number, 5);
  closeTo(outputs.manhattan_distance as number, 7);
});

test("GEO-008 extends to three dimensions", async () => {
  const { outputs } = await calculate("GEO-008", {
    x1: 1, y1: 2, z1: 3, x2: 4, y2: 6, z2: 15
  }, CTX);
  // 3, 4, 12 is a Pythagorean quadruple: the distance is exactly 13.
  closeTo(outputs.distance as number, 13);
});

test("GEO-008 identical points are zero apart, not an error", async () => {
  const { outputs } = await calculate("GEO-008", {
    x1: 2, y1: 3, z1: 4, x2: 2, y2: 3, z2: 4
  }, CTX);
  assert.strictEqual(outputs.distance, 0);
  assert.strictEqual(outputs.manhattan_distance, 0);
});

// ---------------------------------------------------------------------------
// GEO-009: packs round up, and wastage comes first
// ---------------------------------------------------------------------------

test("GEO-009 rounds packs up and applies wastage first", async () => {
  const { outputs } = await calculate("GEO-009", {
    rooms: '[{"length": 3, "width": 3}]', wastage: 5, pack_coverage: 5, cost_per_pack: 45
  }, CTX);
  // 9 square metres plus 5% is 9.45, which is 1.89 packs of 5 and therefore 2.
  // Rounding before adding wastage would have said 1 pack and under-ordered.
  closeTo(outputs.area_square_metres as number, 9);
  closeTo(outputs.material_with_wastage as number, 9.45);
  assert.strictEqual(outputs.packs_needed, 2);
  closeTo(outputs.total_cost as number, 90);
});

test("GEO-009 totals several rooms", async () => {
  const { outputs } = await calculate("GEO-009", {
    rooms: '[{"length": 4, "width": 3}, {"length": 5, "width": 4}, {"length": 2.5, "width": 2}]',
    wastage: 10, pack_coverage: 0, cost_per_pack: 0
  }, CTX);
  closeTo(outputs.area_square_metres as number, 12 + 20 + 5);
  assert.strictEqual(outputs.rooms_counted, 3);
  // Packs and cost are not invented when no coverage is given.
  assert.strictEqual(outputs.packs_needed, null);
  assert.strictEqual(outputs.total_cost, null);
});

test("GEO-009 converts square metres to square feet", async () => {
  const { outputs } = await calculate("GEO-009", {
    rooms: '[{"length": 10, "width": 10}]', wastage: 0, pack_coverage: 0, cost_per_pack: 0
  }, CTX);
  // 100 square metres is 1076.39 square feet.
  closeTo(outputs.area_square_feet as number, 1076.3910416709722, 1e-6);
});

test("GEO-009 refuses an empty or impossible room list", async () => {
  await assert.rejects(
    () => calculate("GEO-009", { rooms: "[]", wastage: 10, pack_coverage: 0, cost_per_pack: 0 }, CTX),
    /at least one room/
  );
  await assert.rejects(
    () => calculate("GEO-009", {
      rooms: '[{"length": 0, "width": 3}]', wastage: 10, pack_coverage: 0, cost_per_pack: 0
    }, CTX),
    /must be greater than zero/
  );
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the geometry tranche
// ---------------------------------------------------------------------------

test("no geometry calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["GEO-001", { shape: "square", a: 1, b: 0, c: 0, d: 0, angle: 0 }],
    ["GEO-002", { shape: "cube", a: 1, b: 0, c: 0 }],
    ["GEO-003", { shape: "sphere", a: 1, b: 0, c: 0 }],
    ["GEO-004", { side_a: 1, side_b: 1, side_c: 1 }],
    ["GEO-005", { opposite: 1, adjacent: 1, hypotenuse: "" }],
    ["GEO-006", { radius: 1, diameter: "", circumference: "", area: "", angle: 0 }],
    ["GEO-007", { side_a: 1, side_b: 1, hypotenuse: "" }],
    ["GEO-008", { x1: 0, y1: 0, z1: 0, x2: 0, y2: 0, z2: 0 }],
    ["GEO-009", { rooms: '[{"length": 1, "width": 1}]', wastage: 0, pack_coverage: 0, cost_per_pack: 0 }]
  ];
  for (const [id, inputs] of cases) {
    await t.test(`${id} at its smallest valid input`, async () => {
      const { outputs } = await calculate(id, inputs, CTX);
      for (const [key, value] of Object.entries(outputs)) {
        if (typeof value === "number") {
          assert.ok(Number.isFinite(value), `${id}.${key} is ${value}`);
        }
        assert.notStrictEqual(String(value), "[object Object]", `${id}.${key} rendered as an object`);
        assert.notStrictEqual(String(value), "undefined", `${id}.${key} is undefined`);
      }
    });
  }
});
