/**
 * Narrative specification sections for Wave 2 tranche 2O, Home & Construction.
 * Run: node scripts/wave2_2o_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

const ORDER_SPLIT =
  'Both the bare geometric quantity and the amount to order are reported. Keeping them apart lets the measurement be checked against a drawing, and makes visible how much of an order is contingency rather than material. A single blended figure hides both.';

const DENSITY_INPUT =
  'THE BULK DENSITY IS AN INPUT BECAUSE IT IS NOT USEFULLY A PROPERTY OF THE MATERIAL. It moves with particle size, with moisture, and with whether the material is loose or compacted. Suppliers sell by weight while the job is measured by volume, so this single number decides whether a delivery is enough, and one published figure would be wrong for most orders by enough to matter.';

Object.assign(notes, {

  "HOM-001": {
    purpose: "Work out the concrete a pour needs, and the cement, sand, aggregate and water to make it.",
    scope: "A slab, footing, round column or set of steps, with a mix ratio and a wastage allowance.",
    assumptions: [
      "The mix ratio is by VOLUME, which is how a mix is specified on site.",
      "A water to cement ratio of one half by weight, which gives a workable general-purpose mix."
    ],
    validation: [
      "A mix ratio that is not three positive numbers is refused with the expected shape.",
      "Dimensions above 200 m and more than a thousand identical pours are refused.",
      "Wastage above 50 per cent is refused."
    ],
    formula: "Volume from the shape, increased by the wastage allowance, then multiplied by 1.54 to give the dry ingredient volume, split by the ratio and converted to weights by each material's own bulk density.",
    boundary: "DRY MATERIALS BULK UP. It takes roughly 1.54 cubic metres of dry ingredients to make one cubic metre of wet concrete, because the sand and cement fill the voids between the aggregate. A calculator that skipped that factor under-orders every material by a third, which is the difference between finishing a pour and stopping halfway. " +
      "THE RATIO IS BY VOLUME, NOT BY WEIGHT. Treating it as a weight ratio, which is the usual shortcut, gets the cement content wrong by about a third in the other direction, because cement is much less dense than aggregate. " +
      "A ROUND COLUMN IS NOT A BOX: its plan area is derived from the diameter as a circle. Using length times width for a 400 mm column three metres tall overstates the concrete nearly tenfold. " +
      "More water makes concrete easier to place and weaker, and that trade is the commonest reason a domestic pour disappoints. " + ORDER_SPLIT,
    methodology: "The oracle builds volumes in MILLIMETRE units and converts once at the end, so a factor of a thousand dropped anywhere would separate the two, and derives the column's area from its CIRCUMFERENCE rather than from pi r squared, so a radius-versus-diameter slip could not be reproduced. A unit test backs the dry volume out of the reported masses and their densities and asserts the 1.54 factor, which checks the bulking allowance without trusting either implementation's arithmetic.",
    rules: "Not rules-sensitive. Bulk densities of the dry ingredients are conventional trade figures held in the module with their values stated.",
    related: ["HOM-004 Gravel Calculator", "HOM-002 Roofing Calculator"]
  },

  "HOM-002": {
    purpose: "Work out a roof's true surface area and the tiles, battens and underlay it needs.",
    scope: "A gable, hip or lean-to roof over a rectangular footprint at a given pitch.",
    assumptions: ["A rectangular plan and a uniform pitch."],
    validation: [
      "A pitch at or above 90 degrees is refused, and above 70 degrees is refused as a wall rather than a roof.",
      "A pitch at or below zero is refused."
    ],
    formula: "The roof surface is the plan area divided by the cosine of the pitch. The rafter run is half the width for a gable or hip and the whole width for a lean-to.",
    boundary: "A ROOF IS BIGGER THAN THE BUILDING IT SITS ON, by one over the cosine of the pitch: about 15 per cent at 30 degrees and 41 per cent at 45. Ordering to the footprint is the classic and expensive mistake, so the pitch factor is reported as its own figure rather than buried in the area. " +
      "A HIP ROOF HAS THE SAME SURFACE AREA AS A GABLE ROOF over the same footprint at the same pitch. The hip ends trade triangle for triangle, and what actually changes is the ridge length and the cutting waste. A hip roof therefore costs more in labour and offcuts, not in coverage, which is the opposite of what most people expect and is asserted directly in a test. " +
      "The rafter length is the true length along the slope, before any allowance for eaves overhang or birdsmouth cuts. " + ORDER_SPLIT,
    methodology: "The oracle derives the pitch factor as the square root of one plus tangent squared, which equals the secant by Pythagoras but shares no code path with the engine's reciprocal cosine. The 45 degree case pins the factor at root two, checkable by inspection, and a test asserts the hip and gable areas are identical to nine places while the ridges differ.",
    rules: "Not rules-sensitive.",
    related: ["HOM-003 Tile Calculator", "HOM-001 Concrete Calculator"]
  },

  "HOM-003": {
    purpose: "Count the tiles, boxes, adhesive and grout a surface needs.",
    scope: "A wall or floor given as dimensions or as an area, less any openings, with a tile size and joint width.",
    assumptions: ["A regular grid laid square to the room."],
    validation: [
      "Openings as large as the surface are refused, because there would be nothing to tile.",
      "A tile larger than three metres or a joint wider than 50 mm is refused.",
      "Wastage above 50 per cent is refused."
    ],
    formula: "Each tile occupies its own size plus one joint in each direction, because that is how the grid repeats. The count is the net area divided by that footprint, rounded up, then increased by the wastage allowance.",
    boundary: "THE GROUT JOINT IS PART OF EACH TILE'S FOOTPRINT. A 300 mm tile with a 3 mm joint covers 303 by 303, and ignoring that over-orders. The size of the effect depends entirely on the tile: on a 25 mm mosaic with a 2 mm joint the count falls by about fourteen per cent, while on a 1200 mm tile the same joint changes almost nothing. Both cases are benchmarked for exactly that reason. " +
      "TEN PER CENT WASTAGE IS A FLOOR, NOT A RULE. Straight courses in a square room need little; a diagonal layout, a patterned tile that must be aligned, a room out of square, or a rectified large-format tile that snaps rather than cuts cleanly all need more. Buying from ONE BATCH matters as much as buying enough, because shade varies between batches and a late top-up rarely matches. " + ORDER_SPLIT,
    methodology: "The oracle computes counts from areas in square millimetres rather than square metres. A zero-joint case pins the boundary, and a unit test asserts that boxes are rounded up but never by more than one box.",
    rules: "Not rules-sensitive.",
    related: ["HOM-002 Roofing Calculator", "GEO-001 Area Calculator"]
  },

  "HOM-004": {
    purpose: "Work out the gravel a drive or path needs, by volume, weight and packaging.",
    scope: "An area and a depth, with the supplier's own bulk density.",
    assumptions: ["An even depth over a prepared base."],
    validation: [
      "A depth above one metre is refused with a reminder that depths are in millimetres.",
      "A bulk density above 3,000 kg per cubic metre is refused as denser than solid rock.",
      "Areas above ten hectares are refused."
    ],
    formula: "Volume is the area times the depth. Weight is the volume times the bulk density. Coverage per tonne is the inverse.",
    boundary: DENSITY_INPUT + " Gravel typically runs between about 1.4 and 1.7 tonnes a cubic metre depending on stone size and moisture. " +
      "THE COVERAGE PER TONNE IS THE FIGURE TO CHECK A QUOTE AGAINST, because a supplier prices by the tonne while the job is measured in area and depth, and that conversion is where an order goes wrong. " +
      "For a drive, around 50 mm over a properly prepared and compacted sub-base is usual. Deeper gravel is harder to walk and drive on rather than better, because vehicles rut it.",
    methodology: "The oracle computes volume in LITRES first, using the identity that a square metre at one millimetre deep is exactly one litre, then converts. That is both a different route from the engine's metres throughout and the arithmetic a builders' merchant does in their head. A unit test asserts that coverage per tonne multiplied by the tonnage recovers the area exactly.",
    rules: "Not rules-sensitive.",
    related: ["HOM-005 Mulch Calculator", "HOM-001 Concrete Calculator"]
  },

  "HOM-005": {
    purpose: "Work out the mulch a bed needs, in the bags and bulk bags it is actually sold in.",
    scope: "An area and a depth, with the supplier's own bulk density.",
    assumptions: ["An even depth."],
    validation: ["As HOM-004: implausible depths, densities and areas are refused."],
    formula: "As HOM-004, with packaging in litres because that is how mulch is sold.",
    boundary: "MULCH IS SOLD BY VOLUME, NOT BY WEIGHT, which is the opposite of gravel, and bark is light: around 250 to 400 kilograms a cubic metre against gravel's 1,500. Litres are therefore the useful unit here and the weight is reported mainly so a delivery can be checked against a docket. " + DENSITY_INPUT + " " +
      "A DEPTH OF 50 TO 75 MM IS THE USUAL RANGE. Thinner and weeds come through, which is the main reason for mulching at all; much thicker and the mulch can shed rain rather than hold moisture in. Keep it clear of stems and trunks, because piling mulch against bark keeps it wet and invites rot.",
    methodology: "Shares the oracle route with HOM-004, computing in litres first. A unit test asserts that gravel and mulch give an identical volume for the same bed and a weight differing by more than fourfold, which is the whole practical point of separating the two calculators.",
    rules: "Not rules-sensitive.",
    related: ["HOM-004 Gravel Calculator"]
  },

  "HOM-006": {
    purpose: "Design a straight flight of private stairs and check it against Approved Document K.",
    scope: "A floor-to-floor rise, a preferred rise per step and a going.",
    assumptions: ["A straight private flight serving a single dwelling."],
    validation: [
      "A total rise below 100 mm or above 10 m is refused, with a reminder that the figure is in millimetres.",
      "A preferred rise outside 50 to 400 mm and a going outside 50 to 600 mm are refused."
    ],
    formula: "The riser count is the whole number nearest the total rise divided by the preferred rise; the actual rise follows from that count. Pitch is the arctangent of rise over going, and the stride figure is twice the rise plus the going.",
    boundary: "THE NUMBER OF RISERS MUST BE A WHOLE NUMBER, so the actual rise is almost never the one asked for, and every check runs against the actual figure because that is what gets built. A flight also has ONE MORE RISER THAN IT HAS TREADS, since the top surface is the landing; an off-by-one there shortens the calculated run by a full going. " +
      "THE 2R+G RULE IS NOT ARBITRARY: it encodes the length of a human stride on a slope, which is why a stair outside 550 to 700 mm feels wrong to walk even when the rise and going are each individually legal. It can fail from either direction, and both are benchmarked. " +
      "THIS IS A CHECK, NOT A COMPLIANCE CERTIFICATE. The Approved Documents are guidance on one way of meeting the Building Regulations rather than the Regulations themselves; they apply to England, and Scotland, Wales and Northern Ireland publish their own. The figures used are for a PRIVATE stair serving a single dwelling, and common, institutional and assembly stairs are tighter, so applying these to them would wrongly pass a non-compliant design. The calculator also says nothing about headroom, handrails, guarding or landings, all of which the same document governs, and a real design is signed off by building control.",
    methodology: "The oracle finds the riser count by SEARCHING for the whole number giving a rise closest to the preferred one rather than by rounding a quotient, and derives the pitch from an arcsine on the step hypotenuse rather than an arctangent on rise over going. Cases fail the stride rule from both directions, so a comparison written the wrong way round would pass one and fail the other. Unit tests assert that the risers multiply back to exactly the total rise, that there is always one more riser than tread, and that a deliberately steep flight fails exactly the three rules it should.",
    rules: "Rules-sensitive. The Part K limits are held in the versioned ruleset. The source register records that the four core figures were cross-checked across two unrelated sources agreeing exactly, that the Approved Documents are guidance rather than the Regulations, that they apply to England only, and that the private-stair qualification matters because other stair types are tighter.",
    related: ["HOM-001 Concrete Calculator"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
