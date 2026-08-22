import test from "node:test";
import assert from "node:assert/strict";
import { utilities } from "../packages/calculation-engine/src/index.js";
const { calculateAge, calculateFuelCost, convertUnits } = utilities;

test("calculateAge", async (t) => {
    await t.test("Standard age calculation", () => {
        const res = calculateAge("1990-01-01", "2026-08-22");
        assert.equal(res.years, 36);
        assert.equal(res.months, 7);
        assert.equal(res.days, 21);
        assert.equal(res.total_days, 13382);
    });

    await t.test("Birthday today", () => {
        const res = calculateAge("2000-08-22", "2026-08-22");
        assert.equal(res.years, 26);
        assert.equal(res.months, 0);
        assert.equal(res.days, 0);
        assert.equal(res.total_days, 9496);
    });
    
    await t.test("Leap day", () => {
        const res = calculateAge("2000-02-29", "2026-08-22");
        assert.equal(res.years, 26);
        assert.equal(res.months, 5);
        assert.equal(res.days, 25);
        assert.equal(res.total_days, 9671);
    });
});

test("calculateFuelCost", async (t) => {
    await t.test("100 miles", () => {
        const res = calculateFuelCost(100, 40, 150, 1);
        // distance: 100, mpg: 40 -> 2.5 gal -> 11.365225 L -> 17.05 GBP
        assert.ok(Math.abs(res.litres - 11.365225) < 0.0001);
        assert.ok(Math.abs(res.cost_gbp - 17.05) < 0.01);
    });

    await t.test("Round trip", () => {
        const res = calculateFuelCost(100, 40, 150, 2);
        assert.ok(Math.abs(res.litres - 22.73045) < 0.0001);
        assert.ok(Math.abs(res.cost_gbp - 34.1) < 0.01);
    });

    await t.test("Zero distance", () => {
        const res = calculateFuelCost(0, 40, 150, 1);
        assert.equal(res.litres, 0);
        assert.equal(res.cost_gbp, 0);
    });
});

test("convertUnits", async (t) => {
    await t.test("km to miles", () => {
        const res = convertUnits(10, "km", "miles");
        assert.ok(Math.abs(res.result - 6.21371192) < 0.0001);
    });

    await t.test("C to F", () => {
        const res = convertUnits(0, "C", "F");
        assert.equal(res.result, 32);
    });

    await t.test("litres to UK gallons", () => {
        const res = convertUnits(4.54609, "litres", "UK gallons");
        assert.ok(Math.abs(res.result - 1) < 0.0001);
    });
});
