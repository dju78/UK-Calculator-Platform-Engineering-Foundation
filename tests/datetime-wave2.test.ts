import test from "node:test";
import assert from "node:assert";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };
const closeTo = (a: number, e: number, tol = 1e-8) =>
  assert.ok(Math.abs(a - e) <= tol, `Expected ${a} to be within ${tol} of ${e}`);

// ---------------------------------------------------------------------------
// The bank holidays that actually differ across the UK
// ---------------------------------------------------------------------------

test("DAT-003 the three UK divisions give different working-day counts", async () => {
  const range = { start_date: "2026-04-01", end_date: "2026-04-14", include_working_days: true };
  const ew = await calculate("DAT-003", { ...range, division: "england-and-wales" }, CTX);
  const scotland = await calculate("DAT-003", { ...range, division: "scotland" }, CTX);
  const ni = await calculate("DAT-003", { ...range, division: "northern-ireland" }, CTX);

  // Good Friday falls in this fortnight for all three, but Easter Monday only
  // for England and Wales and Northern Ireland. Scotland does not have it, so
  // Scotland works an extra day. Treating the UK as one list gets this wrong.
  assert.strictEqual(ew.outputs.bank_holidays_in_range, 2);
  assert.strictEqual(scotland.outputs.bank_holidays_in_range, 1);
  assert.strictEqual(ni.outputs.bank_holidays_in_range, 2);
  assert.strictEqual(scotland.outputs.working_days, (ew.outputs.working_days as number) + 1);
});

test("DAT-003 Scotland's August bank holiday is early, not late", async () => {
  const range = { start_date: "2026-08-01", end_date: "2026-08-31", include_working_days: true };
  const ew = await calculate("DAT-003", { ...range, division: "england-and-wales" }, CTX);
  const scotland = await calculate("DAT-003", { ...range, division: "scotland" }, CTX);
  // Both have exactly one August bank holiday, but on different dates: the
  // 31st in England and Wales, the 3rd in Scotland.
  assert.strictEqual(ew.outputs.bank_holidays_in_range, 1);
  assert.strictEqual(scotland.outputs.bank_holidays_in_range, 1);
  assert.strictEqual(ew.outputs.working_days, scotland.outputs.working_days);
});

test("DAT-003 refuses a working-day count outside the years it has data for", async () => {
  await assert.rejects(
    () => calculate("DAT-003", {
      start_date: "2029-01-01", end_date: "2029-01-31",
      include_working_days: true, division: "england-and-wales"
    }, CTX),
    /would silently ignore holidays, so it is not offered/
  );
});

test("DAT-003 still counts calendar days outside those years", async () => {
  // Refusing the working-day count must not refuse the whole calculation.
  const { outputs } = await calculate("DAT-003", {
    start_date: "2029-01-01", end_date: "2029-01-31",
    include_working_days: false, division: "england-and-wales"
  }, CTX);
  assert.strictEqual(outputs.total_days, 31);
  assert.strictEqual(outputs.working_days, null);
});

// ---------------------------------------------------------------------------
// DAT-002: month arithmetic, where the obvious answer does not exist
// ---------------------------------------------------------------------------

test("DAT-002 clamps to the month end and says so", async () => {
  const { outputs, warnings } = await calculate("DAT-002", {
    start_date: "2026-01-31", years: 0, months: 1, days: 0, operation: "add"
  }, CTX);
  // 31 February does not exist. The convention is the last day of the month.
  assert.strictEqual(outputs.result_date, "2026-02-28");
  assert.strictEqual(outputs.clamped_to_month_end, true);
  assert.ok(warnings.some((w: string) => /not 3 March/.test(w)));
});

test("DAT-002 clamps into a leap February correctly", async () => {
  const { outputs } = await calculate("DAT-002", {
    start_date: "2028-01-31", years: 0, months: 1, days: 0, operation: "add"
  }, CTX);
  // 2028 is a leap year, so the clamp lands on the 29th.
  assert.strictEqual(outputs.result_date, "2028-02-29");
});

test("DAT-002 a leap day plus one year clamps to 28 February", async () => {
  const { outputs } = await calculate("DAT-002", {
    start_date: "2028-02-29", years: 1, months: 0, days: 0, operation: "add"
  }, CTX);
  assert.strictEqual(outputs.result_date, "2029-02-28");
  assert.strictEqual(outputs.clamped_to_month_end, true);
});

test("DAT-002 refuses a date that does not exist", async () => {
  await assert.rejects(
    () => calculate("DAT-002", {
      start_date: "2026-02-31", years: 0, months: 0, days: 1, operation: "add"
    }, CTX),
    /Check the number of days in that month/
  );
});

// ---------------------------------------------------------------------------
// DAT-004: ISO weeks are not day-of-year divided by seven
// ---------------------------------------------------------------------------

test("DAT-004 uses ISO week numbering", async () => {
  // 1 January 2027 is a Friday, so it belongs to the ISO week that started on
  // Monday 28 December 2026: week 53 of 2026, not week 1 of 2027.
  const { outputs } = await calculate("DAT-004", { date: "2027-01-01" }, CTX);
  assert.strictEqual(outputs.day_of_week, "Friday");
  assert.strictEqual(outputs.day_of_year, 1);
  assert.strictEqual(outputs.week_of_year, 53);
});

test("DAT-004 handles leap years", async () => {
  const leapDay = await calculate("DAT-004", { date: "2028-02-29" }, CTX);
  assert.strictEqual(leapDay.outputs.is_leap_year, true);
  assert.strictEqual(leapDay.outputs.days_in_month, 29);
  assert.strictEqual(leapDay.outputs.day_of_year, 60);

  const nonLeap = await calculate("DAT-004", { date: "2026-12-31" }, CTX);
  assert.strictEqual(nonLeap.outputs.day_of_year, 365);
  assert.strictEqual(nonLeap.outputs.days_remaining_in_year, 0);
});

// ---------------------------------------------------------------------------
// DAT-006 / DAT-007 / DAT-009: night shifts and breaks
// ---------------------------------------------------------------------------

test("DAT-006 treats a night shift as crossing midnight", async () => {
  const { outputs } = await calculate("DAT-006", {
    start_time: "22:00", end_time: "06:00"
  }, CTX);
  assert.strictEqual(outputs.crossed_midnight, true);
  assert.strictEqual(outputs.total_hours, 8);
  // Payroll wants 7.5 for seven and a half hours, not 7.30.
  const half = await calculate("DAT-006", { start_time: "09:00", end_time: "16:30" }, CTX);
  closeTo(half.outputs.decimal_hours as number, 7.5);
});

test("DAT-007 deducts breaks before totalling", async () => {
  const withBreaks = await calculate("DAT-007", {
    shifts: JSON.stringify([
      { day: "Mon", start: "09:00", end: "17:00", break_minutes: 30 },
      { day: "Tue", start: "09:00", end: "17:00", break_minutes: 30 }
    ]),
    overtime_threshold: 0
  }, CTX);
  // Two eight-hour shifts less two half-hour breaks is 15 hours, not 16.
  closeTo(withBreaks.outputs.total_hours as number, 15);
  assert.strictEqual(withBreaks.outputs.total_break_minutes, 60);
});

test("DAT-009 splits overtime and prices it", async () => {
  const { outputs } = await calculate("DAT-009", {
    shifts: JSON.stringify([
      { day: "Mon", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Tue", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Wed", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Thu", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Fri", start: "08:00", end: "18:00", break_minutes: 30 }
    ]),
    overtime_threshold: 40, hourly_rate: 15, overtime_multiplier: 1.5
  }, CTX);
  // Five 9.5-hour shifts is 47.5 hours: 40 regular and 7.5 overtime.
  closeTo(outputs.total_hours as number, 47.5);
  closeTo(outputs.regular_hours as number, 40);
  closeTo(outputs.overtime_hours as number, 7.5);
  closeTo(outputs.regular_pay as number, 600);
  closeTo(outputs.overtime_pay as number, 168.75);
  closeTo(outputs.total_pay as number, 768.75);
});

test("DAT-009 refuses a break longer than the shift", async () => {
  await assert.rejects(
    () => calculate("DAT-009", {
      shifts: JSON.stringify([{ day: "Mon", start: "09:00", end: "10:00", break_minutes: 90 }]),
      overtime_threshold: 40, hourly_rate: 15, overtime_multiplier: 1.5
    }, CTX),
    /break longer than the shift itself/
  );
});

// ---------------------------------------------------------------------------
// DAT-008: daylight saving is the whole difficulty
// ---------------------------------------------------------------------------

test("DAT-008 gets the spring gap between London and New York right", async () => {
  const winter = await calculate("DAT-008", {
    date: "2026-01-15", time: "12:00",
    source_zone: "Europe/London", target_zone: "America/New_York"
  }, CTX);
  const springGap = await calculate("DAT-008", {
    date: "2026-03-20", time: "12:00",
    source_zone: "Europe/London", target_zone: "America/New_York"
  }, CTX);
  const summer = await calculate("DAT-008", {
    date: "2026-07-15", time: "12:00",
    source_zone: "Europe/London", target_zone: "America/New_York"
  }, CTX);

  // The United States moves to daylight saving before the UK does, so for a
  // fortnight each spring the difference is four hours rather than five. A
  // fixed-offset table gets this wrong every year.
  closeTo(winter.outputs.difference_hours as number, -5);
  closeTo(springGap.outputs.difference_hours as number, -4);
  closeTo(summer.outputs.difference_hours as number, -5);
});

test("DAT-008 handles zones with no daylight saving and half-hour offsets", async () => {
  const tokyo = await calculate("DAT-008", {
    date: "2026-07-15", time: "09:00",
    source_zone: "Europe/London", target_zone: "Asia/Tokyo"
  }, CTX);
  assert.strictEqual(tokyo.outputs.target_is_daylight_saving, false);
  // London is on BST in July, so the difference is eight hours rather than nine.
  closeTo(tokyo.outputs.difference_hours as number, 8);

  const india = await calculate("DAT-008", {
    date: "2026-06-01", time: "12:00",
    source_zone: "Europe/London", target_zone: "Asia/Kolkata"
  }, CTX);
  // India is on a half-hour offset, which a whole-hour model cannot represent.
  closeTo(india.outputs.difference_hours as number, 4.5);
});

test("DAT-008 names the format when a zone is not recognised", async () => {
  await assert.rejects(
    () => calculate("DAT-008", {
      date: "2026-06-01", time: "12:00",
      source_zone: "GMT+1", target_zone: "America/New_York"
    }, CTX),
    /IANA name such as Europe\/London/
  );
});

// ---------------------------------------------------------------------------
// DAT-005: the clock wraps, and says so
// ---------------------------------------------------------------------------

test("DAT-005 reports when the clock has wrapped past midnight", async () => {
  const { outputs, warnings } = await calculate("DAT-005", {
    start_time: "22:45", hours: 4, minutes: 30, seconds: 0, operation: "add"
  }, CTX);
  assert.strictEqual(outputs.result_time, "03:15:00");
  assert.strictEqual(outputs.days_carried, 1);
  assert.ok(warnings.some((w: string) => /wrapped past midnight/.test(w)));
});

test("DAT-005 refuses a malformed time", async () => {
  await assert.rejects(
    () => calculate("DAT-005", {
      start_time: "9.30am", hours: 1, minutes: 0, seconds: 0, operation: "add"
    }, CTX),
    /24-hour form/
  );
});

// ---------------------------------------------------------------------------
// Engine-wide guarantees for the date tranche
// ---------------------------------------------------------------------------

test("no date calculator can emit a broken number", async (t: any) => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["DAT-002", { start_date: "2026-01-01", years: 0, months: 0, days: 0, operation: "add" }],
    ["DAT-003", { start_date: "2026-01-01", end_date: "2026-01-01", include_working_days: true, division: "england-and-wales" }],
    ["DAT-004", { date: "2026-01-01" }],
    ["DAT-005", { start_time: "00:00", hours: 0, minutes: 0, seconds: 0, operation: "add" }],
    ["DAT-006", { start_time: "00:00", end_time: "00:00" }],
    ["DAT-007", { shifts: JSON.stringify([{ start: "09:00", end: "09:00", break_minutes: 0 }]), overtime_threshold: 0 }],
    ["DAT-008", { date: "2026-01-01", time: "00:00", source_zone: "Europe/London", target_zone: "Europe/London" }],
    ["DAT-009", { shifts: JSON.stringify([{ day: "Mon", start: "09:00", end: "09:00", break_minutes: 0 }]), overtime_threshold: 0, hourly_rate: 0, overtime_multiplier: 1 }]
  ];
  for (const [id, inputs] of cases) {
    await t.test(`${id} at its degenerate boundary`, async () => {
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
