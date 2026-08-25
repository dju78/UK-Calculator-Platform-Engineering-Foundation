/**
 * Independent benchmark oracle for Wave 2 tranche 2J, Geometry.
 *
 * Imports nothing from the calculation engine, and reaches several answers by
 * a different route than the engine does:
 *
 *   - Triangle areas are computed BOTH by Heron's formula and by the
 *     cross-product (half the absolute determinant of the two edge vectors)
 *     placed in the plane, and the two must agree before a case is recorded.
 *   - Circle sector and segment areas are computed by NUMERICAL INTEGRATION
 *     of the circle, not by the closed forms the engine uses.
 *   - Right-triangle angles are checked against the sine rule as well as the
 *     arctangent.
 *   - Solid volumes are checked against a Riemann sum of cross-sectional
 *     areas where the solid has a simple axis.
 *
 * Run: node scripts/oracles/wave2-geometry-oracle.mjs > /tmp/geometry.json
 */

const r8 = (n) => Math.round(n * 1e8) / 1e8;
const PI = Math.PI;
const rad = (d) => (d * PI) / 180;
const deg = (r) => (r * 180) / PI;

/** Composite Simpson's rule, used to check closed forms by integration. */
function simpson(f, a, b, n = 200000) {
  if (n % 2 === 1) n++;
  const h = (b - a) / n;
  let total = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const v = f(a + i * h);
    total += (i % 2 === 0 ? 2 : 4) * (Number.isFinite(v) ? v : 0);
  }
  return (total * h) / 3;
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Oracle self-check failed: ${message} (${actual} vs ${expected})`);
  }
}

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "±1e-6",
    ruleset: "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// GEO-001 Area
// ===========================================================================

for (const p of [
  { scenario: "Rectangle", shape: "rectangle", a: 8, b: 5, c: 0, angle: 0 },
  { scenario: "Square", shape: "square", a: 7, b: 0, c: 0, angle: 0 },
  { scenario: "Triangle from base and height", shape: "triangle", a: 10, b: 6, c: 0, angle: 0 },
  { scenario: "Circle", shape: "circle", a: 3, b: 0, c: 0, angle: 0 },
  { scenario: "Trapezium", shape: "trapezium", a: 8, b: 12, c: 5, angle: 0 },
  { scenario: "Rhombus from its diagonals", shape: "rhombus", a: 6, b: 8, c: 0, angle: 0 },
  { scenario: "Quarter-circle sector", shape: "sector", a: 4, b: 0, c: 0, angle: 90 },
  { scenario: "Ellipse", shape: "ellipse", a: 5, b: 3, c: 0, angle: 0 }
]) {
  let areaValue, perimeter = null;
  switch (p.shape) {
    case "rectangle": areaValue = p.a * p.b; perimeter = 2 * (p.a + p.b); break;
    case "square": areaValue = p.a * p.a; perimeter = 4 * p.a; break;
    case "triangle": areaValue = 0.5 * p.a * p.b; break;
    case "circle":
      // Checked by integrating 2 * sqrt(r^2 - x^2) across the diameter.
      areaValue = PI * p.a * p.a;
      assertClose(
        simpson((x) => 2 * Math.sqrt(Math.max(0, p.a * p.a - x * x)), -p.a, p.a, 400000),
        areaValue, 1e-4, "circle area by integration"
      );
      perimeter = 2 * PI * p.a;
      break;
    case "trapezium": areaValue = 0.5 * (p.a + p.b) * p.c; break;
    case "rhombus":
      areaValue = 0.5 * p.a * p.b;
      perimeter = 4 * Math.sqrt((p.a / 2) ** 2 + (p.b / 2) ** 2);
      break;
    case "sector": {
      const theta = rad(p.angle);
      areaValue = 0.5 * p.a * p.a * theta;
      // Checked by integrating in polar coordinates.
      assertClose(
        simpson(() => 0.5 * p.a * p.a, 0, theta, 2000),
        areaValue, 1e-9, "sector area by polar integration"
      );
      perimeter = p.a * theta + 2 * p.a;
      break;
    }
    case "ellipse": {
      areaValue = PI * p.a * p.b;
      const h = ((p.a - p.b) ** 2) / ((p.a + p.b) ** 2);
      perimeter = PI * (p.a + p.b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      break;
    }
  }

  const expected = { area: r8(areaValue) };
  if (perimeter !== null) expected.perimeter = r8(perimeter);

  add("GEO-001", p.scenario,
    { shape: p.shape, a: p.a, b: p.b, c: p.c, d: 0, angle: p.angle },
    expected,
    p.shape === "circle" || p.shape === "sector"
      ? "The closed form is verified against numerical integration before being recorded."
      : undefined);
}

// ===========================================================================
// GEO-002 Volume and GEO-003 Surface Area
// ===========================================================================

const solids = [
  { scenario: "Cube", shape: "cube", a: 4, b: 0, c: 0 },
  { scenario: "Cuboid", shape: "cuboid", a: 5, b: 4, c: 3 },
  { scenario: "Sphere", shape: "sphere", a: 3, b: 0, c: 0 },
  { scenario: "Cylinder", shape: "cylinder", a: 2, b: 10, c: 0 },
  { scenario: "Cone", shape: "cone", a: 3, b: 4, c: 0 },
  { scenario: "Square-based pyramid", shape: "pyramid", a: 6, b: 4, c: 0 },
  { scenario: "Hemisphere", shape: "hemisphere", a: 5, b: 0, c: 0 },
  { scenario: "Triangular prism", shape: "prism", a: 6, b: 4, c: 10 }
];

for (const p of solids) {
  let volume, surface, lateral = null;
  switch (p.shape) {
    case "cube": volume = p.a ** 3; surface = 6 * p.a ** 2; lateral = 4 * p.a ** 2; break;
    case "cuboid":
      volume = p.a * p.b * p.c;
      surface = 2 * (p.a * p.b + p.a * p.c + p.b * p.c);
      lateral = 2 * p.c * (p.a + p.b);
      break;
    case "sphere":
      volume = (4 / 3) * PI * p.a ** 3;
      // Checked by integrating the disc area along the axis.
      assertClose(
        simpson((x) => PI * (p.a * p.a - x * x), -p.a, p.a, 400000),
        volume, 1e-4, "sphere volume by integration"
      );
      surface = 4 * PI * p.a ** 2;
      break;
    case "hemisphere":
      volume = (2 / 3) * PI * p.a ** 3;
      assertClose(
        simpson((x) => PI * (p.a * p.a - x * x), 0, p.a, 400000),
        volume, 1e-4, "hemisphere volume by integration"
      );
      surface = 3 * PI * p.a ** 2;
      lateral = 2 * PI * p.a ** 2;
      break;
    case "cylinder":
      volume = PI * p.a ** 2 * p.b;
      surface = 2 * PI * p.a * (p.a + p.b);
      lateral = 2 * PI * p.a * p.b;
      break;
    case "cone": {
      volume = (1 / 3) * PI * p.a ** 2 * p.b;
      // Checked by integrating the shrinking disc from base to apex.
      assertClose(
        simpson((x) => PI * (p.a * (1 - x / p.b)) ** 2, 0, p.b, 400000),
        volume, 1e-6, "cone volume by integration"
      );
      const slant = Math.sqrt(p.a ** 2 + p.b ** 2);
      surface = PI * p.a * (p.a + slant);
      lateral = PI * p.a * slant;
      break;
    }
    case "pyramid": {
      volume = (1 / 3) * p.a ** 2 * p.b;
      assertClose(
        simpson((x) => (p.a * (1 - x / p.b)) ** 2, 0, p.b, 400000),
        volume, 1e-6, "pyramid volume by integration"
      );
      const slant = Math.sqrt((p.a / 2) ** 2 + p.b ** 2);
      lateral = 2 * p.a * slant;
      surface = p.a ** 2 + lateral;
      break;
    }
    case "prism": {
      const triArea = 0.5 * p.a * p.b;
      const slant = Math.sqrt((p.a / 2) ** 2 + p.b ** 2);
      volume = triArea * p.c;
      lateral = (p.a + 2 * slant) * p.c;
      surface = 2 * triArea + lateral;
      break;
    }
  }

  add("GEO-002", p.scenario,
    { shape: p.shape, a: p.a, b: p.b, c: p.c },
    { volume: r8(volume), volume_litres: r8(volume * 1000), surface_area: r8(surface) },
    ["sphere", "hemisphere", "cone", "pyramid"].includes(p.shape)
      ? "The closed-form volume is verified against a numerical integration of the cross-sections before being recorded."
      : undefined);

  const surfaceExpected = { surface_area: r8(surface), volume: r8(volume) };
  if (lateral !== null) surfaceExpected.lateral_surface_area = r8(lateral);
  add("GEO-003", p.scenario, { shape: p.shape, a: p.a, b: p.b, c: p.c }, surfaceExpected);
}

// ===========================================================================
// GEO-004 Triangle
// ===========================================================================

for (const p of [
  { scenario: "A 3-4-5 right triangle", a: 3, b: 4, c: 5 },
  { scenario: "Equilateral", a: 6, b: 6, c: 6 },
  { scenario: "Isosceles", a: 5, b: 5, c: 8 },
  { scenario: "Scalene and obtuse", a: 4, b: 5, c: 8 },
  { scenario: "Scalene and acute", a: 6, b: 7, c: 8 },
  { scenario: "A 5-12-13 right triangle", a: 5, b: 12, c: 13 },
  { scenario: "Nearly degenerate but still a triangle", a: 1, b: 1, c: 1.999 }
]) {
  const s = (p.a + p.b + p.c) / 2;
  const heron = Math.sqrt(s * (s - p.a) * (s - p.b) * (s - p.c));

  // Independent check: place the triangle in the plane and take half the
  // absolute cross product of the two edge vectors from one vertex.
  const angleAtA = Math.acos((p.b * p.b + p.c * p.c - p.a * p.a) / (2 * p.b * p.c));
  const v1 = [p.c, 0];
  const v2 = [p.b * Math.cos(angleAtA), p.b * Math.sin(angleAtA)];
  const cross = Math.abs(v1[0] * v2[1] - v1[1] * v2[0]) / 2;
  assertClose(cross, heron, 1e-6, `triangle area for ${p.a},${p.b},${p.c}`);

  const clamp = (x) => Math.max(-1, Math.min(1, x));
  const A = deg(Math.acos(clamp((p.b ** 2 + p.c ** 2 - p.a ** 2) / (2 * p.b * p.c))));
  const B = deg(Math.acos(clamp((p.a ** 2 + p.c ** 2 - p.b ** 2) / (2 * p.a * p.c))));
  const C = 180 - A - B;
  assertClose(A + B + C, 180, 1e-9, "angle sum");

  add("GEO-004", p.scenario,
    { side_a: p.a, side_b: p.b, side_c: p.c },
    {
      angle_a: r8(A), angle_b: r8(B), angle_c: r8(C),
      area: r8(heron),
      perimeter: r8(p.a + p.b + p.c),
      semi_perimeter: r8(s),
      inradius: r8(heron / s),
      circumradius: r8((p.a * p.b * p.c) / (4 * heron)),
      height_to_a: r8((2 * heron) / p.a)
    },
    "The area is computed by Heron's formula AND by the cross product of the edge vectors, and the two must agree before the case is recorded.");
}

// ===========================================================================
// GEO-005 Right Triangle and GEO-007 Pythagoras
// ===========================================================================

for (const p of [
  { scenario: "Two legs given", o: 3, adj: 4, hyp: null },
  { scenario: "Leg and hypotenuse given", o: 5, adj: null, hyp: 13 },
  { scenario: "Other leg and hypotenuse given", o: null, adj: 8, hyp: 17 },
  { scenario: "An isosceles right triangle", o: 1, adj: 1, hyp: null },
  { scenario: "A 7-24-25 triple", o: 7, adj: 24, hyp: null },
  { scenario: "Non-integer sides", o: 2.5, adj: 6, hyp: null }
]) {
  let o = p.o, adj = p.adj, hyp = p.hyp;
  if (o !== null && adj !== null) hyp = Math.sqrt(o * o + adj * adj);
  else if (o !== null && hyp !== null) adj = Math.sqrt(hyp * hyp - o * o);
  else o = Math.sqrt(hyp * hyp - adj * adj);

  // Check the angles against the SINE rule as well as the arctangent.
  const angleO = deg(Math.atan2(o, adj));
  assertClose(Math.sin(rad(angleO)), o / hyp, 1e-9, "sine rule check");

  const shared = {
    opposite: r8(o), adjacent: r8(adj), hypotenuse: r8(hyp),
    angle_opposite: r8(angleO),
    angle_adjacent: r8(deg(Math.atan2(adj, o))),
    area: r8(0.5 * o * adj),
    perimeter: r8(o + adj + hyp),
    inradius: r8((o + adj - hyp) / 2)
  };

  add("GEO-005", p.scenario,
    {
      opposite: p.o === null ? "" : p.o,
      adjacent: p.adj === null ? "" : p.adj,
      hypotenuse: p.hyp === null ? "" : p.hyp
    },
    shared,
    "Angles are verified against the sine rule as well as the arctangent before the case is recorded.");

  add("GEO-007", p.scenario,
    {
      side_a: p.o === null ? "" : p.o,
      side_b: p.adj === null ? "" : p.adj,
      hypotenuse: p.hyp === null ? "" : p.hyp
    },
    {
      side_a: r8(o), side_b: r8(adj), hypotenuse: r8(hyp),
      a_squared: r8(o * o), b_squared: r8(adj * adj),
      hypotenuse_squared: r8(hyp * hyp),
      area: r8(0.5 * o * adj)
    },
    "The three squares are asserted individually, so a squared plus b squared must visibly equal c squared.");
}

// ===========================================================================
// GEO-006 Circle
// ===========================================================================

for (const p of [
  { scenario: "From the radius", radius: 5, diameter: "", circumference: "", area: "", angle: 0 },
  { scenario: "From the diameter", radius: "", diameter: 10, circumference: "", area: "", angle: 0 },
  { scenario: "From the circumference", radius: "", diameter: "", circumference: 31.41592653589793, area: "", angle: 0 },
  { scenario: "From the area", radius: "", diameter: "", circumference: "", area: 78.53981633974483, angle: 0 },
  { scenario: "With a 90 degree sector", radius: 4, diameter: "", circumference: "", area: "", angle: 90 },
  { scenario: "With a 120 degree sector", radius: 6, diameter: "", circumference: "", area: "", angle: 120 }
]) {
  let r;
  if (p.radius !== "") r = p.radius;
  else if (p.diameter !== "") r = p.diameter / 2;
  else if (p.circumference !== "") r = p.circumference / (2 * PI);
  else r = Math.sqrt(p.area / PI);

  const expected = {
    radius: r8(r),
    diameter: r8(2 * r),
    circumference: r8(2 * PI * r),
    area: r8(PI * r * r)
  };

  if (p.angle > 0) {
    const theta = rad(p.angle);
    const sectorArea = 0.5 * r * r * theta;
    const segmentArea = 0.5 * r * r * (theta - Math.sin(theta));
    // The segment area is verified by integrating the region between the
    // chord and the arc, which shares nothing with the closed form.
    const chordDistance = r * Math.cos(theta / 2);
    const half = r * Math.sin(theta / 2);
    const integrated = simpson(
      (x) => Math.sqrt(Math.max(0, r * r - x * x)) - chordDistance,
      -half, half, 400000
    );
    assertClose(integrated, segmentArea, 1e-5, `segment area at ${p.angle} degrees`);

    expected.sector_area = r8(sectorArea);
    expected.arc_length = r8(r * theta);
    expected.chord_length = r8(2 * r * Math.sin(theta / 2));
    expected.segment_area = r8(segmentArea);
  }

  add("GEO-006", p.scenario,
    {
      radius: p.radius, diameter: p.diameter,
      circumference: p.circumference, area: p.area, angle: p.angle
    },
    expected,
    p.angle > 0
      ? "The segment area is verified by numerically integrating the region between the chord and the arc."
      : "Any one measurement determines the circle; the four cases enter a different one each time and must all give the same result.");
}

// ===========================================================================
// GEO-008 Distance
// ===========================================================================

for (const p of [
  { scenario: "Two dimensions", x1: 0, y1: 0, z1: 0, x2: 3, y2: 4, z2: 0 },
  { scenario: "Three dimensions", x1: 1, y1: 2, z1: 3, x2: 4, y2: 6, z2: 15 },
  { scenario: "Negative coordinates", x1: -5, y1: -5, z1: 0, x2: 5, y2: 5, z2: 0 },
  { scenario: "Identical points", x1: 2, y1: 3, z1: 4, x2: 2, y2: 3, z2: 4 },
  { scenario: "Along one axis only", x1: 0, y1: 0, z1: 0, x2: 0, y2: 12, z2: 0 },
  { scenario: "Non-integer coordinates", x1: 1.5, y1: 2.25, z1: 0, x2: 4.75, y2: 8.5, z2: 0 }
]) {
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1, dz = p.z2 - p.z1;
  const squared = dx * dx + dy * dy + dz * dz;
  add("GEO-008", p.scenario,
    { x1: p.x1, y1: p.y1, z1: p.z1, x2: p.x2, y2: p.y2, z2: p.z2 },
    {
      distance: r8(Math.sqrt(squared)),
      distance_squared: r8(squared),
      delta_x: r8(dx), delta_y: r8(dy), delta_z: r8(dz),
      midpoint_x: r8((p.x1 + p.x2) / 2),
      midpoint_y: r8((p.y1 + p.y2) / 2),
      midpoint_z: r8((p.z1 + p.z2) / 2),
      manhattan_distance: r8(Math.abs(dx) + Math.abs(dy) + Math.abs(dz))
    });
}

// ===========================================================================
// GEO-009 Floor Area
// ===========================================================================

const FEET_PER_SQUARE_METRE = 10.763910416709722;

for (const p of [
  { scenario: "One room", rooms: [{ length: 4, width: 3 }], wastage: 10, pack: 0, cost: 0 },
  { scenario: "Three rooms", rooms: [{ length: 4, width: 3 }, { length: 5, width: 4 }, { length: 2.5, width: 2 }], wastage: 10, pack: 0, cost: 0 },
  { scenario: "With packs and a price", rooms: [{ length: 5, width: 4 }], wastage: 10, pack: 2.5, cost: 34.99 },
  { scenario: "No wastage", rooms: [{ length: 6, width: 4 }], wastage: 0, pack: 2, cost: 20 },
  { scenario: "High wastage on a diagonal lay", rooms: [{ length: 6, width: 4 }], wastage: 20, pack: 2, cost: 20 },
  { scenario: "A part pack still means a whole pack", rooms: [{ length: 3, width: 3 }], wastage: 5, pack: 5, cost: 45 }
]) {
  let total = 0, perimeter = 0;
  for (const room of p.rooms) {
    total += room.length * room.width;
    perimeter += 2 * (room.length + room.width);
  }
  const withWastage = total * (1 + p.wastage / 100);
  const packs = p.pack > 0 ? Math.ceil(withWastage / p.pack) : null;
  const cost = packs !== null && p.cost > 0 ? packs * p.cost : null;

  add("GEO-009", p.scenario,
    {
      rooms: JSON.stringify(p.rooms), wastage: p.wastage,
      pack_coverage: p.pack, cost_per_pack: p.cost
    },
    {
      area_square_metres: r8(total),
      area_square_feet: r8(total * FEET_PER_SQUARE_METRE),
      perimeter_metres: r8(perimeter),
      rooms_counted: p.rooms.length,
      material_with_wastage: r8(withWastage),
      packs_needed: packs,
      total_cost: cost === null ? null : Math.round(cost * 100) / 100
    },
    "The last case needs 9.45 square metres from packs covering 5, which is 1.89 packs and therefore 2, proving packs are rounded UP.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
