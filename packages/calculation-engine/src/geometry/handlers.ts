import type { NumericInputs, CalculatorHandler } from "../types.js";
import {
  area, normaliseAreaShape, solid, normaliseSolidShape, triangleFromSides,
  rightTriangle, circle, distance, floorArea
} from "./core.js";

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
function orNull(n: number | null | undefined, fn: (v: number) => number): number | null {
  return n === null || n === undefined ? null : fn(n);
}
function optional(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const UNITS_NOTE =
  "Use the same unit for every length you enter. The answer comes back in that unit, squared for an area and cubed for a volume; this calculator does not convert between units.";

/** GEO-001 Area */
export const geo001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const shape = normaliseAreaShape(inputs.shape);
  const r = area(
    shape,
    Number(inputs.a ?? 0), Number(inputs.b ?? 0), Number(inputs.c ?? 0),
    Number(inputs.d ?? 0), Number(inputs.angle ?? 0)
  );
  return {
    outputs: {
      shape: r.shape,
      area: round8(r.area),
      perimeter: orNull(r.perimeter, round8),
      formula: r.formula,
      basis:
        r.perimeter === null
          ? `${UNITS_NOTE} The perimeter is not shown for this shape because the measurements entered do not determine it: a base and a height fix the area but not the remaining sides.`
          : UNITS_NOTE
    }
  };
};

/** GEO-002 Volume */
export const geo002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const shape = normaliseSolidShape(inputs.shape);
  const r = solid(shape, Number(inputs.a ?? 0), Number(inputs.b ?? 0), Number(inputs.c ?? 0));
  return {
    outputs: {
      shape: r.shape,
      volume: round8(r.volume),
      volume_litres: round8(r.volume_litres),
      surface_area: round8(r.surface_area),
      formula: r.formula,
      basis:
        `${UNITS_NOTE} The figure in litres assumes your measurements were in metres, since a cubic metre is a thousand litres.` +
        (shape === "prism"
          ? " The triangular prism is assumed to be isosceles, because the base and height alone do not fix the other two sides."
          : "")
    }
  };
};

/** GEO-003 Surface Area */
export const geo003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const shape = normaliseSolidShape(inputs.shape);
  const r = solid(shape, Number(inputs.a ?? 0), Number(inputs.b ?? 0), Number(inputs.c ?? 0));
  return {
    outputs: {
      shape: r.shape,
      surface_area: round8(r.surface_area),
      lateral_surface_area: orNull(r.lateral_surface_area, round8),
      volume: round8(r.volume),
      basis:
        `${UNITS_NOTE} Lateral surface area excludes the flat ends: it is the part you would wrap a label around, whereas total surface area includes every face.`
    }
  };
};

/** GEO-004 Triangle */
export const geo004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = triangleFromSides(Number(inputs.side_a), Number(inputs.side_b), Number(inputs.side_c));
  return {
    outputs: {
      angle_a: round8(r.angle_a),
      angle_b: round8(r.angle_b),
      angle_c: round8(r.angle_c),
      area: round8(r.area),
      perimeter: round8(r.perimeter),
      semi_perimeter: round8(r.semi_perimeter),
      inradius: round8(r.inradius),
      circumradius: round8(r.circumradius),
      height_to_a: round8(r.height_to_a),
      triangle_type: r.triangle_type,
      is_right_angled: r.is_right_angled,
      basis:
        "Solved from three sides using Heron's formula for the area and the cosine rule for the angles. Any two sides must add up to more than the third, and lengths that break that rule are refused rather than producing a phantom triangle. " +
        UNITS_NOTE
    }
  };
};

/** GEO-005 Right Triangle */
export const geo005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = rightTriangle(
    optional(inputs.opposite), optional(inputs.adjacent), optional(inputs.hypotenuse)
  );
  return {
    outputs: {
      opposite: round8(r.opposite),
      adjacent: round8(r.adjacent),
      hypotenuse: round8(r.hypotenuse),
      angle_opposite: round8(r.angle_opposite),
      angle_adjacent: round8(r.angle_adjacent),
      area: round8(r.area),
      perimeter: round8(r.perimeter),
      inradius: round8(r.inradius),
      is_pythagorean_triple: r.is_pythagorean_triple,
      basis:
        "Enter any two sides and the third follows from Pythagoras. The hypotenuse is always the longest side, so a hypotenuse shorter than a leg describes no triangle and is refused. " +
        UNITS_NOTE
    }
  };
};

/** GEO-006 Circle */
export const geo006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = circle(
    optional(inputs.radius), optional(inputs.diameter),
    optional(inputs.circumference), optional(inputs.area),
    Number(inputs.angle ?? 0)
  );
  return {
    outputs: {
      radius: round8(r.radius),
      diameter: round8(r.diameter),
      circumference: round8(r.circumference),
      area: round8(r.area),
      sector_area: orNull(r.sector_area, round8),
      arc_length: orNull(r.arc_length, round8),
      chord_length: orNull(r.chord_length, round8),
      segment_area: orNull(r.segment_area, round8),
      basis:
        "Any ONE of radius, diameter, circumference or area fixes the circle, so enter whichever you have. The segment is the sector with the triangle between the two radii taken out of it. " +
        UNITS_NOTE
    }
  };
};

/** GEO-007 Pythagorean Theorem */
export const geo007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = rightTriangle(
    optional(inputs.side_a), optional(inputs.side_b), optional(inputs.hypotenuse)
  );
  return {
    outputs: {
      side_a: round8(r.opposite),
      side_b: round8(r.adjacent),
      hypotenuse: round8(r.hypotenuse),
      a_squared: round8(r.opposite * r.opposite),
      b_squared: round8(r.adjacent * r.adjacent),
      hypotenuse_squared: round8(r.hypotenuse * r.hypotenuse),
      area: round8(r.area),
      is_pythagorean_triple: r.is_pythagorean_triple,
      basis:
        "a squared plus b squared equals c squared, where c is the hypotenuse. The three squares are shown so the identity can be checked by eye. " +
        UNITS_NOTE
    }
  };
};

/** GEO-008 Distance */
export const geo008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = distance(
    Number(inputs.x1 ?? 0), Number(inputs.y1 ?? 0), Number(inputs.z1 ?? 0),
    Number(inputs.x2 ?? 0), Number(inputs.y2 ?? 0), Number(inputs.z2 ?? 0)
  );
  return {
    outputs: {
      distance: round8(r.distance),
      distance_squared: round8(r.distance_squared),
      delta_x: round8(r.delta_x),
      delta_y: round8(r.delta_y),
      delta_z: round8(r.delta_z),
      midpoint_x: round8(r.midpoint_x),
      midpoint_y: round8(r.midpoint_y),
      midpoint_z: round8(r.midpoint_z),
      manhattan_distance: round8(r.manhattan_distance),
      basis:
        "The straight-line distance comes from Pythagoras, extended to three dimensions. The Manhattan distance is the route along the axes instead, which is what matters on a grid. Leave the z values at zero for a flat plane. " +
        UNITS_NOTE
    }
  };
};

/** GEO-009 Square Footage / Floor Area */
export const geo009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const raw = typeof inputs.rooms === "string" ? JSON.parse(inputs.rooms as string) : inputs.rooms;
  if (!Array.isArray(raw)) {
    throw new Error('Rooms must be a list, for example [{"length": 4, "width": 3}].');
  }
  const r = floorArea(
    raw as Array<{ length: number; width: number }>,
    Number(inputs.wastage ?? 10),
    Number(inputs.pack_coverage ?? 0),
    Number(inputs.cost_per_pack ?? 0)
  );
  return {
    outputs: {
      area_square_metres: round8(r.area_square_metres),
      area_square_feet: round8(r.area_square_feet),
      perimeter_metres: round8(r.perimeter_metres),
      rooms_counted: r.rooms_counted,
      material_with_wastage: round8(r.material_with_wastage),
      packs_needed: r.packs_needed,
      total_cost: orNull(r.total_cost, (v) => Math.round(v * 100) / 100),
      basis:
        "Wastage is added to the area BEFORE the number of packs is worked out, and packs are then rounded up, because you cannot buy part of a pack. Doing it the other way round under-orders on almost every job. Measurements are assumed to be in metres."
    }
  };
};
