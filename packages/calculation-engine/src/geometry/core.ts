/**
 * Wave 2 Geometry calculators.
 *
 * Pure mathematics. Every result that depends on a shape being possible checks
 * that it IS possible first: a triangle whose sides break the triangle
 * inequality, or an angle set that does not sum to 180 degrees, is refused
 * with an explanation rather than producing a confident nonsense answer.
 */
import { assertFiniteNumber } from "../common/validation.js";

const TOLERANCE = 1e-9;

function requirePositive(value: number, label: string): number {
  const n = assertFiniteNumber(value, label);
  if (n <= 0) throw new Error(`${label} must be greater than zero.`);
  return n;
}

export const degreesToRadians = (d: number) => (d * Math.PI) / 180;
export const radiansToDegrees = (r: number) => (r * 180) / Math.PI;

// ---------------------------------------------------------------------------
// GEO-001 Area
// ---------------------------------------------------------------------------

export type AreaShape =
  | "rectangle" | "square" | "triangle" | "circle" | "trapezium"
  | "parallelogram" | "ellipse" | "sector" | "rhombus";

export function normaliseAreaShape(value: unknown): AreaShape {
  const raw = String(value ?? "rectangle").toLowerCase().trim();
  const allowed: AreaShape[] = [
    "rectangle", "square", "triangle", "circle", "trapezium",
    "parallelogram", "ellipse", "sector", "rhombus"
  ];
  return (allowed as string[]).includes(raw) ? (raw as AreaShape) : "rectangle";
}

export interface AreaResult {
  shape: AreaShape;
  area: number;
  perimeter: number | null;
  formula: string;
}

export function area(
  shape: AreaShape,
  a: number, b: number, c: number, d: number, angle: number
): AreaResult {
  switch (shape) {
    case "square": {
      const side = requirePositive(a, "Side");
      return { shape, area: side * side, perimeter: 4 * side, formula: "side x side" };
    }
    case "rectangle": {
      const w = requirePositive(a, "Width");
      const h = requirePositive(b, "Height");
      return { shape, area: w * h, perimeter: 2 * (w + h), formula: "width x height" };
    }
    case "triangle": {
      const base = requirePositive(a, "Base");
      const height = requirePositive(b, "Height");
      // The perimeter needs all three sides, which a base and height do not
      // determine, so it is honestly left out rather than guessed.
      return { shape, area: 0.5 * base * height, perimeter: null, formula: "half x base x height" };
    }
    case "circle": {
      const r = requirePositive(a, "Radius");
      return { shape, area: Math.PI * r * r, perimeter: 2 * Math.PI * r, formula: "pi x radius squared" };
    }
    case "trapezium": {
      const p = requirePositive(a, "First parallel side");
      const q = requirePositive(b, "Second parallel side");
      const h = requirePositive(c, "Height");
      return {
        shape, area: 0.5 * (p + q) * h,
        // The two slanted sides are not determined by these inputs.
        perimeter: null,
        formula: "half x (a + b) x height"
      };
    }
    case "parallelogram": {
      const base = requirePositive(a, "Base");
      const height = requirePositive(b, "Height");
      const side = c > 0 ? c : null;
      return {
        shape, area: base * height,
        perimeter: side === null ? null : 2 * (base + side),
        formula: "base x height"
      };
    }
    case "rhombus": {
      const p = requirePositive(a, "First diagonal");
      const q = requirePositive(b, "Second diagonal");
      // Every side of a rhombus is half the hypotenuse of the diagonals.
      const side = Math.sqrt((p / 2) ** 2 + (q / 2) ** 2);
      return { shape, area: 0.5 * p * q, perimeter: 4 * side, formula: "half x diagonal x diagonal" };
    }
    case "ellipse": {
      const major = requirePositive(a, "Semi-major axis");
      const minor = requirePositive(b, "Semi-minor axis");
      // Ramanujan's approximation: an ellipse perimeter has no elementary
      // closed form, and this is accurate to better than one part in 10^9 for
      // any realistic shape.
      const h = ((major - minor) ** 2) / ((major + minor) ** 2);
      const perimeter = Math.PI * (major + minor) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      return { shape, area: Math.PI * major * minor, perimeter, formula: "pi x a x b" };
    }
    case "sector": {
      const r = requirePositive(a, "Radius");
      const deg = assertFiniteNumber(angle, "Angle");
      if (deg <= 0 || deg > 360) throw new Error("A sector angle must be between 0 and 360 degrees.");
      const rad = degreesToRadians(deg);
      const arc = r * rad;
      return {
        shape, area: 0.5 * r * r * rad,
        // The perimeter of a sector includes both radii as well as the arc.
        perimeter: arc + 2 * r,
        formula: "half x radius squared x angle in radians"
      };
    }
  }
}

// ---------------------------------------------------------------------------
// GEO-002 Volume and GEO-003 Surface Area
// ---------------------------------------------------------------------------

export type SolidShape =
  | "cube" | "cuboid" | "sphere" | "cylinder" | "cone" | "pyramid" | "prism" | "hemisphere";

export function normaliseSolidShape(value: unknown): SolidShape {
  const raw = String(value ?? "cuboid").toLowerCase().trim();
  const allowed: SolidShape[] = [
    "cube", "cuboid", "sphere", "cylinder", "cone", "pyramid", "prism", "hemisphere"
  ];
  return (allowed as string[]).includes(raw) ? (raw as SolidShape) : "cuboid";
}

export interface SolidResult {
  shape: SolidShape;
  volume: number;
  surface_area: number;
  lateral_surface_area: number | null;
  volume_litres: number;
  formula: string;
}

export function solid(
  shape: SolidShape,
  a: number, b: number, c: number
): SolidResult {
  let volume: number;
  let surface: number;
  let lateral: number | null = null;
  let formula: string;

  switch (shape) {
    case "cube": {
      const s = requirePositive(a, "Side");
      volume = s ** 3;
      surface = 6 * s * s;
      lateral = 4 * s * s;
      formula = "side cubed";
      break;
    }
    case "cuboid": {
      const l = requirePositive(a, "Length");
      const w = requirePositive(b, "Width");
      const h = requirePositive(c, "Height");
      volume = l * w * h;
      surface = 2 * (l * w + l * h + w * h);
      lateral = 2 * h * (l + w);
      formula = "length x width x height";
      break;
    }
    case "sphere": {
      const r = requirePositive(a, "Radius");
      volume = (4 / 3) * Math.PI * r ** 3;
      surface = 4 * Math.PI * r * r;
      formula = "four thirds x pi x radius cubed";
      break;
    }
    case "hemisphere": {
      const r = requirePositive(a, "Radius");
      volume = (2 / 3) * Math.PI * r ** 3;
      // The total surface includes the flat circular face as well as the dome.
      surface = 3 * Math.PI * r * r;
      lateral = 2 * Math.PI * r * r;
      formula = "two thirds x pi x radius cubed";
      break;
    }
    case "cylinder": {
      const r = requirePositive(a, "Radius");
      const h = requirePositive(b, "Height");
      volume = Math.PI * r * r * h;
      surface = 2 * Math.PI * r * (r + h);
      lateral = 2 * Math.PI * r * h;
      formula = "pi x radius squared x height";
      break;
    }
    case "cone": {
      const r = requirePositive(a, "Radius");
      const h = requirePositive(b, "Height");
      const slant = Math.sqrt(r * r + h * h);
      volume = (1 / 3) * Math.PI * r * r * h;
      surface = Math.PI * r * (r + slant);
      lateral = Math.PI * r * slant;
      formula = "a third x pi x radius squared x height";
      break;
    }
    case "pyramid": {
      // Square-based pyramid.
      const side = requirePositive(a, "Base side");
      const h = requirePositive(b, "Height");
      const slant = Math.sqrt((side / 2) ** 2 + h * h);
      volume = (1 / 3) * side * side * h;
      lateral = 2 * side * slant;
      surface = side * side + lateral;
      formula = "a third x base area x height";
      break;
    }
    case "prism": {
      // Triangular prism: base, height of the triangle, length of the prism.
      const base = requirePositive(a, "Triangle base");
      const triHeight = requirePositive(b, "Triangle height");
      const length = requirePositive(c, "Prism length");
      const triArea = 0.5 * base * triHeight;
      // Without the other two sides of the triangle the exact lateral surface
      // is unknown, so an isosceles triangle is assumed and said so.
      const slant = Math.sqrt((base / 2) ** 2 + triHeight * triHeight);
      lateral = (base + 2 * slant) * length;
      volume = triArea * length;
      surface = 2 * triArea + lateral;
      formula = "triangle area x length";
      break;
    }
  }

  return {
    shape,
    volume,
    surface_area: surface,
    lateral_surface_area: lateral,
    // Cubic metres to litres, the conversion people actually want for tanks
    // and ponds. Inputs are assumed to be in metres for this figure.
    volume_litres: volume * 1000,
    formula
  };
}

// ---------------------------------------------------------------------------
// GEO-004 Triangle (general)
// ---------------------------------------------------------------------------

export interface TriangleResult {
  side_a: number;
  side_b: number;
  side_c: number;
  angle_a: number;
  angle_b: number;
  angle_c: number;
  area: number;
  perimeter: number;
  semi_perimeter: number;
  inradius: number;
  circumradius: number;
  height_to_a: number;
  triangle_type: string;
  is_right_angled: boolean;
}

/**
 * Solve a triangle from three sides.
 *
 * The triangle inequality is checked FIRST: three lengths where the longest is
 * at least as long as the other two combined do not form a triangle at all,
 * and Heron's formula would otherwise return a NaN or a phantom area.
 */
export function triangleFromSides(a: number, b: number, c: number): TriangleResult {
  const A = requirePositive(a, "Side a");
  const B = requirePositive(b, "Side b");
  const C = requirePositive(c, "Side c");

  const sides = [A, B, C].sort((x, y) => x - y);
  if (sides[0] + sides[1] <= sides[2] + TOLERANCE) {
    throw new Error(
      `These lengths cannot form a triangle: ${sides[0]} and ${sides[1]} together do not exceed ${sides[2]}. Any two sides must add up to more than the third.`
    );
  }

  const s = (A + B + C) / 2;
  const areaValue = Math.sqrt(s * (s - A) * (s - B) * (s - C));

  // Angles by the cosine rule, clamped so floating-point drift can never push
  // the argument of acos outside [-1, 1].
  const clamp = (x: number) => Math.max(-1, Math.min(1, x));
  const angleA = radiansToDegrees(Math.acos(clamp((B * B + C * C - A * A) / (2 * B * C))));
  const angleB = radiansToDegrees(Math.acos(clamp((A * A + C * C - B * B) / (2 * A * C))));
  const angleC = 180 - angleA - angleB;

  const largest = Math.max(angleA, angleB, angleC);
  const type =
    Math.abs(largest - 90) < 1e-6 ? "Right-angled"
      : largest > 90 ? "Obtuse"
        : "Acute";
  const equality =
    Math.abs(A - B) < TOLERANCE && Math.abs(B - C) < TOLERANCE ? "equilateral"
      : Math.abs(A - B) < TOLERANCE || Math.abs(B - C) < TOLERANCE || Math.abs(A - C) < TOLERANCE
        ? "isosceles"
        : "scalene";

  return {
    side_a: A, side_b: B, side_c: C,
    angle_a: angleA, angle_b: angleB, angle_c: angleC,
    area: areaValue,
    perimeter: A + B + C,
    semi_perimeter: s,
    inradius: areaValue / s,
    circumradius: (A * B * C) / (4 * areaValue),
    height_to_a: (2 * areaValue) / A,
    triangle_type: `${type}, ${equality}`,
    is_right_angled: Math.abs(largest - 90) < 1e-6
  };
}

// ---------------------------------------------------------------------------
// GEO-005 Right Triangle, GEO-007 Pythagoras
// ---------------------------------------------------------------------------

export interface RightTriangleResult {
  opposite: number;
  adjacent: number;
  hypotenuse: number;
  angle_opposite: number;
  angle_adjacent: number;
  area: number;
  perimeter: number;
  inradius: number;
  is_pythagorean_triple: boolean;
}

/**
 * Solve a right-angled triangle from any two of its three sides.
 *
 * The hypotenuse must be the longest side; a "hypotenuse" shorter than a leg
 * describes no triangle and is refused rather than producing the square root
 * of a negative number.
 */
export function rightTriangle(
  opposite: number | null,
  adjacent: number | null,
  hypotenuse: number | null
): RightTriangleResult {
  const given = [opposite, adjacent, hypotenuse].filter(
    (v) => v !== null && v !== undefined && Number.isFinite(v) && (v as number) > 0
  ).length;
  if (given < 2) {
    throw new Error("Enter at least two of the three sides.");
  }

  let o = opposite ?? 0;
  let adj = adjacent ?? 0;
  let hyp = hypotenuse ?? 0;

  if (o > 0 && adj > 0) {
    hyp = Math.sqrt(o * o + adj * adj);
  } else if (o > 0 && hyp > 0) {
    if (hyp <= o) {
      throw new Error("The hypotenuse must be longer than either of the other two sides.");
    }
    adj = Math.sqrt(hyp * hyp - o * o);
  } else {
    if (hyp <= adj) {
      throw new Error("The hypotenuse must be longer than either of the other two sides.");
    }
    o = Math.sqrt(hyp * hyp - adj * adj);
  }

  const areaValue = 0.5 * o * adj;
  const isTriple =
    Number.isInteger(o) && Number.isInteger(adj) && Math.abs(hyp - Math.round(hyp)) < 1e-9;

  return {
    opposite: o,
    adjacent: adj,
    hypotenuse: hyp,
    angle_opposite: radiansToDegrees(Math.atan2(o, adj)),
    angle_adjacent: radiansToDegrees(Math.atan2(adj, o)),
    area: areaValue,
    perimeter: o + adj + hyp,
    inradius: (o + adj - hyp) / 2,
    is_pythagorean_triple: isTriple
  };
}

// ---------------------------------------------------------------------------
// GEO-006 Circle
// ---------------------------------------------------------------------------

export interface CircleResult {
  radius: number;
  diameter: number;
  circumference: number;
  area: number;
  sector_area: number | null;
  arc_length: number | null;
  chord_length: number | null;
  segment_area: number | null;
}

export function circle(
  radius: number | null,
  diameter: number | null,
  circumference: number | null,
  areaValue: number | null,
  angleDegrees: number
): CircleResult {
  // Any one of the four measurements determines the circle, so the first one
  // supplied is used and the rest derived, rather than requiring the radius.
  let r: number;
  if (radius !== null && radius > 0) r = radius;
  else if (diameter !== null && diameter > 0) r = diameter / 2;
  else if (circumference !== null && circumference > 0) r = circumference / (2 * Math.PI);
  else if (areaValue !== null && areaValue > 0) r = Math.sqrt(areaValue / Math.PI);
  else throw new Error("Enter a radius, diameter, circumference or area.");

  const deg = assertFiniteNumber(angleDegrees, "Angle");
  const hasAngle = deg > 0 && deg <= 360;
  const rad = degreesToRadians(deg);

  return {
    radius: r,
    diameter: 2 * r,
    circumference: 2 * Math.PI * r,
    area: Math.PI * r * r,
    sector_area: hasAngle ? 0.5 * r * r * rad : null,
    arc_length: hasAngle ? r * rad : null,
    chord_length: hasAngle ? 2 * r * Math.sin(rad / 2) : null,
    // The segment is the sector less the triangle formed by the two radii.
    segment_area: hasAngle ? 0.5 * r * r * (rad - Math.sin(rad)) : null
  };
}

// ---------------------------------------------------------------------------
// GEO-008 Distance
// ---------------------------------------------------------------------------

export interface DistanceResult {
  distance: number;
  distance_squared: number;
  delta_x: number;
  delta_y: number;
  delta_z: number;
  midpoint_x: number;
  midpoint_y: number;
  midpoint_z: number;
  manhattan_distance: number;
  is_three_dimensional: boolean;
}

export function distance(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): DistanceResult {
  const ax = assertFiniteNumber(x1, "x1");
  const ay = assertFiniteNumber(y1, "y1");
  const az = assertFiniteNumber(z1, "z1");
  const bx = assertFiniteNumber(x2, "x2");
  const by = assertFiniteNumber(y2, "y2");
  const bz = assertFiniteNumber(z2, "z2");

  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const squared = dx * dx + dy * dy + dz * dz;

  return {
    distance: Math.sqrt(squared),
    distance_squared: squared,
    delta_x: dx,
    delta_y: dy,
    delta_z: dz,
    midpoint_x: (ax + bx) / 2,
    midpoint_y: (ay + by) / 2,
    midpoint_z: (az + bz) / 2,
    // Manhattan distance is the route along the axes, which is what matters
    // for grid movement and for some optimisation problems.
    manhattan_distance: Math.abs(dx) + Math.abs(dy) + Math.abs(dz),
    is_three_dimensional: dz !== 0
  };
}

// ---------------------------------------------------------------------------
// GEO-009 Square Footage / Floor Area
// ---------------------------------------------------------------------------

export interface FloorAreaResult {
  area_square_metres: number;
  area_square_feet: number;
  perimeter_metres: number;
  rooms_counted: number;
  material_needed: number;
  material_with_wastage: number;
  packs_needed: number | null;
  total_cost: number | null;
}

/**
 * Floor area across one or more rooms, with material and wastage.
 *
 * Wastage is added to the AREA before packs are worked out, and packs are then
 * rounded up, because you cannot buy four fifths of a pack. Rounding the other
 * way round under-orders on almost every job.
 */
export function floorArea(
  rooms: Array<{ length: number; width: number }>,
  wastagePct: number,
  packCoverage: number,
  costPerPack: number
): FloorAreaResult {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    throw new Error("Enter at least one room.");
  }
  const wastage = assertFiniteNumber(wastagePct, "Wastage") / 100;
  if (wastage < 0 || wastage > 1) throw new Error("Wastage must be between 0% and 100%.");

  let total = 0;
  let perimeter = 0;
  rooms.forEach((room, i) => {
    const l = requirePositive(Number(room.length), `Room ${i + 1} length`);
    const w = requirePositive(Number(room.width), `Room ${i + 1} width`);
    total += l * w;
    perimeter += 2 * (l + w);
  });

  const withWastage = total * (1 + wastage);
  const coverage = Number(packCoverage);
  const packs = Number.isFinite(coverage) && coverage > 0 ? Math.ceil(withWastage / coverage) : null;
  const cost = Number(costPerPack);
  const totalCost = packs !== null && Number.isFinite(cost) && cost > 0 ? packs * cost : null;

  return {
    area_square_metres: total,
    // 1 metre = 3.280839895 feet exactly, so a square metre is that squared.
    area_square_feet: total * 10.763910416709722,
    perimeter_metres: perimeter,
    rooms_counted: rooms.length,
    material_needed: total,
    material_with_wastage: withWastage,
    packs_needed: packs,
    total_cost: totalCost
  };
}
