/**
 * Independent benchmark oracle for Wave 2 tranche 2L, Date & Time.
 *
 * Imports nothing from the calculation engine. Independence of method:
 *
 *   - Day counts are produced by ITERATING one day at a time from a fixed
 *     epoch, never by dividing a millisecond difference, so a daylight saving
 *     boundary cannot silently gain or lose a day on this side either.
 *   - Bank holidays are re-typed here from the GOV.UK feed rather than read
 *     from the ruleset, so agreement corroborates the ruleset data.
 *   - Day of the week is computed by Zeller's congruence, which is pure
 *     integer arithmetic and shares nothing with the Date object.
 *   - ISO week numbers are computed from the Zeller weekday, again without
 *     touching Date.
 *
 * Run: node scripts/oracles/wave2-datetime-oracle.mjs > /tmp/datetime.json
 */

const r2 = (n) => Math.round(n * 100) / 100;
const r8 = (n) => Math.round(n * 1e8) / 1e8;

// --- Bank holidays, re-typed from https://www.gov.uk/bank-holidays.json ----
const BANK_HOLIDAYS = {
  "england-and-wales": [
    "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25",
    "2026-08-31", "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31",
    "2027-08-30", "2027-12-27", "2027-12-28"
  ],
  "scotland": [
    "2026-01-01", "2026-01-02", "2026-04-03", "2026-05-04", "2026-05-25",
    "2026-06-15", "2026-08-03", "2026-11-30", "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-01-04", "2027-03-26", "2027-05-03", "2027-05-31",
    "2027-08-02", "2027-11-30", "2027-12-27", "2027-12-28"
  ],
  "northern-ireland": [
    "2026-01-01", "2026-03-17", "2026-04-03", "2026-04-06", "2026-05-04",
    "2026-05-25", "2026-07-13", "2026-08-31", "2026-12-25", "2026-12-28",
    "2027-01-01", "2027-03-17", "2027-03-26", "2027-03-29", "2027-05-03",
    "2027-05-31", "2027-07-12", "2027-08-30", "2027-12-27", "2027-12-28"
  ]
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function daysInMonth(y, m) {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
}

/**
 * Day of the week by Zeller's congruence: pure integer arithmetic, sharing
 * nothing with the Date object the engine uses.
 */
function zeller(y, m, d) {
  let year = y, month = m;
  if (month < 3) { month += 12; year -= 1; }
  const k = year % 100;
  const j = Math.floor(year / 100);
  const h = (d + Math.floor((13 * (month + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
  // Zeller returns 0 for Saturday; shift to 0 = Sunday.
  return (h + 6) % 7;
}

/** Absolute day number from a fixed epoch, by counting, not by dividing. */
function dayNumber(y, m, d) {
  let days = 0;
  for (let year = 1970; year < y; year++) days += isLeap(year) ? 366 : 365;
  for (let month = 0; month < m; month++) days += daysInMonth(y, month);
  return days + d - 1;
}

function parse(text) {
  const [y, m, d] = text.split("-").map(Number);
  return { y, m: m - 1, d };
}
function fmt(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
/** Convert an absolute day number back to a calendar date, by counting. */
function fromDayNumber(n) {
  let year = 1970;
  while (true) {
    const len = isLeap(year) ? 366 : 365;
    if (n < len) break;
    n -= len; year++;
  }
  let month = 0;
  while (n >= daysInMonth(year, month)) { n -= daysInMonth(year, month); month++; }
  return { y: year, m: month, d: n + 1 };
}

const fixtures = {};
function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "exact on dates and counts",
    ruleset: id === "DAT-003" ? "uk-2026-27-v1" : "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// DAT-002 Date Calculator
// ===========================================================================

for (const p of [
  { scenario: "Add days across a month end", date: "2026-01-28", y: 0, m: 0, d: 5, op: "add" },
  { scenario: "Add one month to 31 January, which clamps to the month end", date: "2026-01-31", y: 0, m: 1, d: 0, op: "add" },
  { scenario: "Add one year to a leap day", date: "2028-02-29", y: 1, m: 0, d: 0, op: "add" },
  { scenario: "Subtract months across a year boundary", date: "2026-03-15", y: 0, m: 5, d: 0, op: "subtract" },
  { scenario: "Add years, months and days together", date: "2026-06-10", y: 2, m: 3, d: 20, op: "add" },
  { scenario: "Subtract days across a year boundary", date: "2026-01-05", y: 0, m: 0, d: 10, op: "subtract" },
  { scenario: "Add one month to 31 May, which clamps to 30 June", date: "2026-05-31", y: 0, m: 1, d: 0, op: "add" }
]) {
  const start = parse(p.date);
  const sign = p.op === "subtract" ? -1 : 1;
  const totalMonths = (start.y + sign * p.y) * 12 + start.m + sign * p.m;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const last = daysInMonth(targetYear, targetMonth);
  const clamped = start.d > last;
  const day = clamped ? last : start.d;

  const afterMonths = dayNumber(targetYear, targetMonth, day);
  const result = fromDayNumber(afterMonths + sign * p.d);

  add("DAT-002", p.scenario,
    { start_date: p.date, years: p.y, months: p.m, days: p.d, operation: p.op },
    {
      result_date: fmt(result.y, result.m, result.d),
      day_of_week: WEEKDAYS[zeller(result.y, result.m + 1, result.d)],
      clamped_to_month_end: clamped,
      is_leap_year: isLeap(result.y)
    },
    "Day arithmetic by absolute day number computed by counting, and the weekday by Zeller's congruence, neither of which uses the Date object.");
}

// ===========================================================================
// DAT-003 Day Counter
// ===========================================================================

for (const p of [
  { scenario: "A working fortnight in England and Wales", start: "2026-04-01", end: "2026-04-14", working: true, div: "england-and-wales" },
  { scenario: "The same fortnight in Scotland, which has no Easter Monday", start: "2026-04-01", end: "2026-04-14", working: true, div: "scotland" },
  { scenario: "The same fortnight in Northern Ireland", start: "2026-04-01", end: "2026-04-14", working: true, div: "northern-ireland" },
  { scenario: "A full year", start: "2026-01-01", end: "2026-12-31", working: true, div: "england-and-wales" },
  { scenario: "Calendar days only, no working-day count", start: "2026-03-01", end: "2026-06-15", working: false, div: "england-and-wales" },
  { scenario: "A single day", start: "2026-07-01", end: "2026-07-01", working: true, div: "england-and-wales" },
  { scenario: "Across the August bank holiday, which differs by division", start: "2026-08-01", end: "2026-08-31", working: true, div: "scotland" }
]) {
  const s = parse(p.start), e = parse(p.end);
  const startNum = dayNumber(s.y, s.m, s.d);
  const endNum = dayNumber(e.y, e.m, e.d);
  const inclusive = endNum - startNum + 1;
  const exclusive = inclusive - 1;

  let weekdays = 0, weekend = 0, holidays = 0;
  const holidaySet = new Set(BANK_HOLIDAYS[p.div]);
  for (let n = startNum; n <= endNum; n++) {
    const date = fromDayNumber(n);
    const dow = zeller(date.y, date.m + 1, date.d);
    if (dow === 0 || dow === 6) weekend++;
    else {
      weekdays++;
      if (holidaySet.has(fmt(date.y, date.m, date.d))) holidays++;
    }
  }

  const expected = {
    total_days: inclusive,
    days_between_exclusive: exclusive,
    weeks: Math.floor(exclusive / 7),
    remaining_days: exclusive % 7,
    weekdays,
    weekend_days: weekend,
    months_approx: r2(exclusive / 30.436875),
    years_approx: r2(exclusive / 365.2425)
  };
  if (p.working) {
    expected.working_days = weekdays - holidays;
    expected.bank_holidays_in_range = holidays;
  }

  add("DAT-003", p.scenario,
    {
      start_date: p.start, end_date: p.end,
      include_working_days: p.working, division: p.div
    },
    expected,
    "The three April cases share the same dates and differ only in division, and must give DIFFERENT working-day counts, because Scotland has no Easter Monday.");
}

// ===========================================================================
// DAT-004 Day of the Week
// ===========================================================================

for (const p of [
  { scenario: "A date in mid-year", date: "2026-06-15" },
  { scenario: "New Year's Day", date: "2026-01-01" },
  { scenario: "A leap day", date: "2028-02-29" },
  { scenario: "The day after a leap day", date: "2028-03-01" },
  { scenario: "The last day of the year", date: "2026-12-31" },
  { scenario: "A date whose ISO week belongs to the previous year", date: "2027-01-01" },
  { scenario: "A weekend date", date: "2026-08-15" }
]) {
  const { y, m, d } = parse(p.date);
  const dow = zeller(y, m + 1, d);
  const dayOfYear = dayNumber(y, m, d) - dayNumber(y, 0, 1) + 1;
  const total = isLeap(y) ? 366 : 365;

  // ISO week from the Zeller weekday: find the Thursday of this week, then
  // count weeks from the Thursday of week 1.
  const isoDay = (dow + 6) % 7;
  const thursdayNum = dayNumber(y, m, d) - isoDay + 3;
  const thursdayDate = fromDayNumber(thursdayNum);
  const jan4 = dayNumber(thursdayDate.y, 0, 4);
  const jan4Dow = zeller(thursdayDate.y, 1, 4);
  const jan4Iso = (jan4Dow + 6) % 7;
  const firstThursday = jan4 - jan4Iso + 3;
  const week = 1 + Math.round((thursdayNum - firstThursday) / 7);

  add("DAT-004", p.scenario,
    { date: p.date },
    {
      day_of_week: WEEKDAYS[dow],
      day_of_year: dayOfYear,
      week_of_year: week,
      month_name: MONTHS[m],
      quarter: Math.floor(m / 3) + 1,
      days_in_month: daysInMonth(y, m),
      is_leap_year: isLeap(y),
      is_weekend: dow === 0 || dow === 6,
      days_remaining_in_year: total - dayOfYear
    },
    "Weekday by Zeller's congruence and the ISO week derived from it, neither using the Date object.");
}

// ===========================================================================
// DAT-005 Time Calculator
// ===========================================================================

function clockFmt(totalSeconds) {
  const n = ((Math.round(totalSeconds) % 86400) + 86400) % 86400;
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(Math.floor(n / 3600))}:${pad(Math.floor((n % 3600) / 60))}:${pad(n % 60)}`;
}

for (const p of [
  { scenario: "Add hours within the day", time: "09:30", h: 3, m: 15, s: 0, op: "add" },
  { scenario: "Add hours across midnight", time: "22:45", h: 4, m: 30, s: 0, op: "add" },
  { scenario: "Subtract across midnight", time: "01:15", h: 3, m: 0, s: 0, op: "subtract" },
  { scenario: "Add exactly a day", time: "12:00", h: 24, m: 0, s: 0, op: "add" },
  { scenario: "Add with seconds", time: "08:00:00", h: 0, m: 90, s: 45, op: "add" },
  { scenario: "Subtract within the day", time: "17:00", h: 8, m: 30, s: 0, op: "subtract" }
]) {
  const parts = p.time.split(":").map(Number);
  const startSeconds = parts[0] * 3600 + parts[1] * 60 + (parts[2] ?? 0);
  const sign = p.op === "subtract" ? -1 : 1;
  const raw = startSeconds + sign * (p.h * 3600 + p.m * 60 + p.s);

  add("DAT-005", p.scenario,
    { start_time: p.time, hours: p.h, minutes: p.m, seconds: p.s, operation: p.op },
    {
      result_time: clockFmt(raw),
      days_carried: Math.floor(raw / 86400),
      total_seconds: raw
    });
}

// ===========================================================================
// DAT-006 Time Duration
// ===========================================================================

for (const p of [
  { scenario: "A standard working day", start: "09:00", end: "17:30" },
  { scenario: "A night shift crossing midnight", start: "22:00", end: "06:00" },
  { scenario: "A short meeting", start: "14:15", end: "14:45" },
  { scenario: "Almost a full day", start: "00:30", end: "23:30" },
  { scenario: "With seconds", start: "08:15:30", end: "16:45:15" },
  { scenario: "Exactly midnight to midnight is treated as no elapsed time", start: "00:00", end: "00:00" }
]) {
  const sp = p.start.split(":").map(Number);
  const ep = p.end.split(":").map(Number);
  const startSeconds = sp[0] * 3600 + sp[1] * 60 + (sp[2] ?? 0);
  const endSeconds = ep[0] * 3600 + ep[1] * 60 + (ep[2] ?? 0);
  const crossed = endSeconds < startSeconds;
  const total = crossed ? endSeconds + 86400 - startSeconds : endSeconds - startSeconds;

  add("DAT-006", p.scenario,
    { start_time: p.start, end_time: p.end },
    {
      duration: clockFmt(total),
      hours: Math.floor(total / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
      total_seconds: total,
      total_hours: r8(total / 3600),
      total_minutes: r8(total / 60),
      decimal_hours: r8(total / 3600),
      crossed_midnight: crossed
    },
    "A night shift is treated as crossing midnight rather than as a negative duration.");
}

// ===========================================================================
// DAT-007 Hours Calculator and DAT-009 Time Card
// ===========================================================================

const shiftSets = [
  {
    scenario: "A standard five-day week",
    shifts: [
      { day: "Monday", start: "09:00", end: "17:00", break_minutes: 30 },
      { day: "Tuesday", start: "09:00", end: "17:00", break_minutes: 30 },
      { day: "Wednesday", start: "09:00", end: "17:00", break_minutes: 30 },
      { day: "Thursday", start: "09:00", end: "17:00", break_minutes: 30 },
      { day: "Friday", start: "09:00", end: "17:00", break_minutes: 30 }
    ],
    threshold: 40, rate: 15, multiplier: 1.5
  },
  {
    scenario: "A week with overtime",
    shifts: [
      { day: "Monday", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Tuesday", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Wednesday", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Thursday", start: "08:00", end: "18:00", break_minutes: 30 },
      { day: "Friday", start: "08:00", end: "18:00", break_minutes: 30 }
    ],
    threshold: 40, rate: 15, multiplier: 1.5
  },
  {
    scenario: "Night shifts crossing midnight",
    shifts: [
      { day: "Monday", start: "22:00", end: "06:00", break_minutes: 45 },
      { day: "Tuesday", start: "22:00", end: "06:00", break_minutes: 45 },
      { day: "Wednesday", start: "22:00", end: "06:00", break_minutes: 45 }
    ],
    threshold: 40, rate: 18, multiplier: 1.5
  },
  {
    scenario: "Part-time hours",
    shifts: [
      { day: "Monday", start: "09:30", end: "14:30", break_minutes: 0 },
      { day: "Wednesday", start: "09:30", end: "14:30", break_minutes: 0 },
      { day: "Friday", start: "09:30", end: "14:30", break_minutes: 0 }
    ],
    threshold: 40, rate: 12.5, multiplier: 1.5
  },
  {
    scenario: "A single long shift",
    shifts: [{ day: "Saturday", start: "07:00", end: "19:00", break_minutes: 60 }],
    threshold: 8, rate: 20, multiplier: 2
  },
  {
    scenario: "No overtime threshold set",
    shifts: [
      { day: "Monday", start: "09:00", end: "17:00", break_minutes: 30 },
      { day: "Tuesday", start: "09:00", end: "17:00", break_minutes: 30 }
    ],
    threshold: 0, rate: 15, multiplier: 1.5
  }
];

for (const set of shiftSets) {
  let totalSeconds = 0, totalBreak = 0;
  const entries = set.shifts.map((s, i) => {
    const sp = s.start.split(":").map(Number);
    const ep = s.end.split(":").map(Number);
    const startSeconds = sp[0] * 3600 + sp[1] * 60 + (sp[2] ?? 0);
    const endSeconds = ep[0] * 3600 + ep[1] * 60 + (ep[2] ?? 0);
    const crossed = endSeconds < startSeconds;
    const shiftSeconds = crossed ? endSeconds + 86400 - startSeconds : endSeconds - startSeconds;
    const worked = shiftSeconds - s.break_minutes * 60;
    totalSeconds += worked;
    totalBreak += s.break_minutes;
    return { worked, crossed };
  });

  const totalHours = totalSeconds / 3600;
  const regular = set.threshold > 0 ? Math.min(totalHours, set.threshold) : totalHours;
  const overtime = set.threshold > 0 ? Math.max(0, totalHours - set.threshold) : 0;

  add("DAT-007", set.scenario,
    { shifts: JSON.stringify(set.shifts), overtime_threshold: set.threshold },
    {
      total_hours: r8(totalHours),
      total_minutes: r8(totalSeconds / 60),
      regular_hours: r8(regular),
      overtime_hours: r8(overtime),
      days_worked: set.shifts.length,
      average_hours_per_day: r8(totalHours / set.shifts.length),
      total_break_minutes: totalBreak
    },
    "Breaks are deducted per shift before totalling, which the night-shift set with 45-minute breaks would expose if done in the wrong order.");

  add("DAT-009", set.scenario,
    {
      shifts: JSON.stringify(set.shifts), overtime_threshold: set.threshold,
      hourly_rate: set.rate, overtime_multiplier: set.multiplier
    },
    {
      total_hours: r8(totalHours),
      regular_hours: r8(regular),
      overtime_hours: r8(overtime),
      regular_pay: r2(regular * set.rate),
      overtime_pay: r2(overtime * set.rate * set.multiplier),
      total_pay: r2(regular * set.rate + overtime * set.rate * set.multiplier),
      days_worked: set.shifts.length,
      average_hours_per_day: r8(totalHours / set.shifts.length),
      total_break_minutes: totalBreak
    });
}

// ===========================================================================
// DAT-008 Time Zone
// ===========================================================================

/**
 * Offsets are re-derived here from the runtime's zone database, but for a
 * DELIBERATELY chosen set of dates that straddle the daylight saving
 * transitions, including the fortnight each spring when the UK and the United
 * States are four hours apart rather than five.
 */
function offsetFor(instantMs, zone) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  const parts = {};
  for (const part of f.formatToParts(new Date(instantMs))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second)
  );
  return Math.round((asUtc - instantMs) / 60000);
}

for (const p of [
  { scenario: "London to New York in winter, five hours apart", date: "2026-01-15", time: "12:00", from: "Europe/London", to: "America/New_York" },
  { scenario: "London to New York in the spring gap, four hours apart", date: "2026-03-20", time: "12:00", from: "Europe/London", to: "America/New_York" },
  { scenario: "London to New York in summer, five hours apart again", date: "2026-07-15", time: "12:00", from: "Europe/London", to: "America/New_York" },
  { scenario: "London to Tokyo, which observes no daylight saving", date: "2026-07-15", time: "09:00", from: "Europe/London", to: "Asia/Tokyo" },
  { scenario: "London to Sydney, where the seasons are reversed", date: "2026-01-15", time: "09:00", from: "Europe/London", to: "Australia/Sydney" },
  { scenario: "New York to Los Angeles", date: "2026-06-01", time: "15:30", from: "America/New_York", to: "America/Los_Angeles" },
  { scenario: "London to India, on a half-hour offset", date: "2026-06-01", time: "12:00", from: "Europe/London", to: "Asia/Kolkata" }
]) {
  const d = parse(p.date);
  const t = p.time.split(":").map(Number);
  const naive = Date.UTC(d.y, d.m, d.d, t[0], t[1], 0);
  let instant = naive;
  for (let i = 0; i < 3; i++) instant = naive - offsetFor(instant, p.from) * 60000;

  const sourceOffset = offsetFor(instant, p.from);
  const targetOffset = offsetFor(instant, p.to);
  const targetLocal = new Date(instant + targetOffset * 60000);
  const sourceLocal = new Date(instant + sourceOffset * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (dt) =>
    `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())} ` +
    `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;

  add("DAT-008", p.scenario,
    { date: p.date, time: p.time, source_zone: p.from, target_zone: p.to },
    {
      source_datetime: stamp(sourceLocal),
      target_datetime: stamp(targetLocal),
      difference_hours: r2((targetOffset - sourceOffset) / 60),
      source_offset_minutes: sourceOffset,
      target_offset_minutes: targetOffset
    },
    "The three London to New York cases sit either side of the daylight saving transitions, and the March one must show a FOUR hour difference where the other two show five. A fixed-offset table would get that fortnight wrong every year.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
