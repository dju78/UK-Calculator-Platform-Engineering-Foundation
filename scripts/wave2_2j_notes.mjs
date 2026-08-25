/**
 * Narrative specification sections for Wave 2 tranche 2J, Geometry.
 * Run: node scripts/wave2_2j_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const PURE = 'Not rules-sensitive. No statutory values are used.';
const UNITS =
  'Units are the user\'s own and are never converted: whatever unit the lengths are entered in, an area comes back in that unit squared and a volume in that unit cubed. The calculator states this rather than assuming metres, because a silent unit assumption is the easiest way to be wrong by a factor of a thousand.';

const INTEGRATION =
  'Closed forms are verified in the oracle against NUMERICAL INTEGRATION before a case is recorded: circle areas by integrating the chord across the diameter, sector areas in polar coordinates, sphere, cone, hemisphere and pyramid volumes by integrating their cross-sections, and the circular segment by integrating the region between the chord and the arc. The two routes share no formula.';

Object.assign(notes, {

  "GEO-001": {
    purpose: "Find the area of any common plane shape, with the perimeter where the inputs determine it.",
    scope: "Rectangle, square, triangle, circle, trapezium, parallelogram, rhombus, ellipse and circular sector.",
    assumptions: ["All lengths are in the same unit."],
    validation: [
      "Every length must be greater than zero.",
      "A sector angle must be between 0 and 360 degrees."
    ],
    formula: "Standard area formulas. The ellipse perimeter uses Ramanujan's approximation, since an ellipse perimeter has no elementary closed form; it is accurate to better than one part in 10^9 for any realistic shape. A sector's perimeter is the arc PLUS both radii, not the arc alone.",
    boundary: "The perimeter is left BLANK for a triangle from base and height, and for a trapezium, because those measurements do not determine the remaining sides. Returning a perimeter there would mean inventing lengths the user never gave. " + UNITS,
    methodology: INTEGRATION,
    rules: PURE,
    related: ["GEO-002 Volume", "GEO-004 Triangle", "GEO-009 Square Footage"]
  },

  "GEO-002": {
    purpose: "Find the volume of any common solid, in the user's own units and in litres.",
    scope: "Cube, cuboid, sphere, hemisphere, cylinder, cone, square-based pyramid and triangular prism.",
    assumptions: [
      "All lengths are in the same unit.",
      "The figure in litres assumes those lengths were in metres."
    ],
    validation: ["Every measurement must be greater than zero."],
    formula: "Standard volume formulas, with the surface area returned alongside so the two can be read together.",
    boundary: "The triangular prism is assumed ISOSCELES, because a base and a height do not fix the other two sides of the triangle and therefore do not fix the sloping faces. The calculator states that assumption rather than leaving the user to discover it. " + UNITS,
    methodology: INTEGRATION,
    rules: PURE,
    related: ["GEO-003 Surface Area", "GEO-001 Area", "HOM-001 Concrete"]
  },

  "GEO-003": {
    purpose: "Find the total and lateral surface area of a solid.",
    scope: "The same eight solids as GEO-002.",
    assumptions: ["As GEO-002; the two share one implementation."],
    validation: ["As GEO-002."],
    formula: "Total surface area includes every face. Lateral surface area excludes the flat ends: it is the part a label would wrap around.",
    boundary: "The distinction matters for real jobs - painting the side of a tank is a lateral area, wrapping it entirely is a total area - so both are given rather than one. " + UNITS,
    methodology: "Shares the benchmark scenarios with GEO-002, so the volume and surface figures for the same solid cannot disagree, and a test asserts that directly.",
    rules: PURE,
    related: ["GEO-002 Volume", "GEO-001 Area"]
  },

  "GEO-004": {
    purpose: "Solve a triangle completely from its three sides.",
    scope: "Any triangle given by three side lengths.",
    assumptions: [],
    validation: [
      "The TRIANGLE INEQUALITY is checked first: any two sides must add up to more than the third. Lengths that break it, including the degenerate collinear case where the sum is exactly equal, are refused with the offending lengths named.",
      "The argument of the inverse cosine is clamped, so floating-point drift can never push it outside the valid range."
    ],
    formula: "Area by Heron's formula, angles by the cosine rule, and the inradius and circumradius from the area and the sides.",
    boundary: "Without the inequality check, Heron's formula returns a NaN or a phantom zero area for impossible lengths, either of which looks like an answer. " + UNITS,
    methodology: "The oracle computes the area BOTH by Heron's formula and by the cross product of the edge vectors placed in the plane, and the two must agree before a case is recorded. The angle sum is verified to be exactly 180 degrees.",
    rules: PURE,
    related: ["GEO-005 Right Triangle", "GEO-007 Pythagorean Theorem"]
  },

  "GEO-005": {
    purpose: "Solve a right-angled triangle from any two of its sides.",
    scope: "Two of the opposite, adjacent and hypotenuse.",
    assumptions: [],
    validation: [
      "At least two sides are required.",
      "A hypotenuse no longer than a leg is REFUSED, rather than producing the square root of a negative number."
    ],
    formula: "Pythagoras for the missing side, the arctangent for the angles, and (a + b - c) / 2 for the inradius.",
    boundary: UNITS,
    methodology: "The oracle verifies each angle against the SINE rule as well as the arctangent before recording a case.",
    rules: PURE,
    related: ["GEO-007 Pythagorean Theorem", "GEO-004 Triangle"]
  },

  "GEO-006": {
    purpose: "Work out every measurement of a circle from whichever one is known, including sector and segment.",
    scope: "Radius, diameter, circumference or area, with an optional sector angle.",
    assumptions: [],
    validation: ["At least one of the four measurements is required."],
    formula: "Any one of the four determines the radius, and everything else follows. The segment is the SECTOR LESS THE TRIANGLE formed by the two radii, which is half r squared times (theta minus sin theta).",
    boundary: "Sector, arc, chord and segment figures are omitted entirely when no angle is given, rather than defaulting to a full circle. " + UNITS,
    methodology: INTEGRATION + " Four benchmark cases enter a DIFFERENT one of the four measurements and must all describe the same circle, which a test asserts directly.",
    rules: PURE,
    related: ["GEO-001 Area", "GEO-002 Volume"]
  },

  "GEO-007": {
    purpose: "Apply Pythagoras' theorem and show the three squares.",
    scope: "Two of the three sides of a right-angled triangle.",
    assumptions: [],
    validation: ["As GEO-005; the two share one implementation."],
    formula: "a squared plus b squared equals c squared.",
    boundary: "The three squares are returned individually so the identity can be checked by eye rather than taken on trust. " + UNITS,
    methodology: "A test asserts that the two smaller squares sum to the largest across every benchmark case.",
    rules: PURE,
    related: ["GEO-005 Right Triangle", "GEO-008 Distance", "MAT-009 Root"]
  },

  "GEO-008": {
    purpose: "Find the distance between two points in two or three dimensions.",
    scope: "Two points, with the third dimension optional.",
    assumptions: ["Leaving both z values at zero gives the two-dimensional case."],
    validation: ["All six coordinates must be finite numbers."],
    formula: "The straight-line distance is Pythagoras extended to three dimensions. The Manhattan distance is the sum of the absolute differences along each axis.",
    boundary: "The two distances answer different questions: the straight line is how far apart the points are, the Manhattan distance is how far you must travel if you can only move along the axes, as on a street grid. Both are given. " + UNITS,
    methodology: "Independently derived, including identical points, a purely axial separation, and a 3-4-12 Pythagorean quadruple whose distance is exactly 13.",
    rules: PURE,
    related: ["GEO-007 Pythagorean Theorem", "MAT-013 Slope"]
  },

  "GEO-009": {
    purpose: "Work out floor area across several rooms and how much material to order.",
    scope: "One or more rectangular rooms in metres, with wastage, pack coverage and a price.",
    assumptions: ["Rooms are rectangular and measured in metres."],
    validation: [
      "At least one room is required, and every dimension must be greater than zero.",
      "Wastage must be between 0% and 100%.",
      "Packs and cost are omitted, not guessed, when no coverage is given."
    ],
    formula: "Wastage is added to the AREA first, and the number of packs is then rounded UP, because you cannot buy part of a pack. Doing it in the other order under-orders on almost every job: 9 square metres plus 5% is 9.45, which is 1.89 packs of 5 and therefore 2, where rounding first would have said 1.",
    boundary: "Rooms are assumed rectangular; an L-shaped room should be entered as two rectangles. Square feet use the exact conversion, a square metre being 10.7639104167 square feet.",
    methodology: "Independently derived, with a case chosen specifically so that the pack count only comes out right if wastage is applied before rounding.",
    rules: PURE,
    related: ["GEO-001 Area", "HOM-003 Tile Calculator", "HOM-004 Gravel"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
