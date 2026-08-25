/**
 * Wave 2 Date & Time calculators.
 *
 * All date arithmetic is done in UTC. Doing it in local time is the classic
 * source of off-by-one-day errors, because a date that crosses a daylight
 * saving boundary is 23 or 25 hours long, not 24, and dividing by 86,400,000
 * then silently gains or loses a day.
 *
 * Working-day calculations use the real GOV.UK bank holidays, and REQUIRE a
 * division, because England and Wales, Scotland and Northern Ireland genuinely
 * differ: Scotland has no Easter Monday, has 2nd January and St Andrew's Day,
 * and takes its summer holiday in early August rather than late.
 */
import { assertFiniteNumber } from "../common/validation.js";

const DAY_MS = 86400000;

export type Division = "england-and-wales" | "scotland" | "northern-ireland";

export function normaliseDivision(value: unknown): Division {
  const raw = String(value ?? "england-and-wales").toLowerCase().trim().replace(/_/g, "-");
  if (raw.startsWith("scot")) return "scotland";
  if (raw.startsWith("north")) return "northern-ireland";
  return "england-and-wales";
}

export function parseIsoDate(value: unknown, label: string): Date {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${label} must be a date in the form YYYY-MM-DD.`);
  }
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a real date.`);
  // Guards against 2026-02-31, which JavaScript would silently roll forward
  // into March rather than rejecting.
  if (date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${label} is not a real date. Check the number of days in that month.`);
  }
  return date;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function isLeapYear(year: number): boolean {
  // Divisible by 4, except centuries, except those divisible by 400. 1900 was
  // not a leap year; 2000 was.
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

// ---------------------------------------------------------------------------
// Bank holidays and working days
// ---------------------------------------------------------------------------

function bankHolidaySet(division: Division, rules: any): { dates: Set<string>; years: number[] } {
  const table = rules.bank_holidays?.[division];
  if (!table) throw new Error("Bank holiday data is not available for that division.");
  const dates = new Set<string>();
  for (const year of Object.keys(table)) {
    for (const d of table[year]) dates.add(d);
  }
  return { dates, years: rules.bank_holidays.covered_years };
}

export interface WorkingDaysResult {
  total_days: number;
  weekdays: number;
  weekend_days: number;
  bank_holidays_in_range: number;
  working_days: number;
  bank_holiday_dates: string[];
  division_used: Division;
}

/**
 * Count working days between two dates, inclusive of both.
 *
 * Refuses any range that falls outside the years the bank holiday data
 * actually covers, rather than quietly returning a count that ignores
 * holidays it does not know about. A silently wrong working-day count is worse
 * than a refusal, because nothing about the answer looks wrong.
 */
export function workingDays(
  start: Date,
  end: Date,
  division: Division,
  rules: any
): WorkingDaysResult {
  if (end.getTime() < start.getTime()) {
    throw new Error("The end date is before the start date.");
  }

  const { dates, years } = bankHolidaySet(division, rules);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  if (startYear < minYear || endYear > maxYear) {
    throw new Error(
      `Bank holiday data is held for ${minYear} to ${maxYear} only. A working-day count outside those years would silently ignore holidays, so it is not offered.`
    );
  }

  let total = 0, weekdays = 0, weekend = 0, holidays = 0;
  const holidayDates: string[] = [];

  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const day = new Date(t);
    const dow = day.getUTCDay();
    total++;
    if (dow === 0 || dow === 6) {
      weekend++;
    } else {
      weekdays++;
      const iso = isoDate(day);
      if (dates.has(iso)) {
        holidays++;
        holidayDates.push(iso);
      }
    }
  }

  return {
    total_days: total,
    weekdays,
    weekend_days: weekend,
    // Only bank holidays that fall on a weekday reduce the working-day count;
    // one falling on a weekend was never a working day to begin with.
    bank_holidays_in_range: holidays,
    working_days: weekdays - holidays,
    bank_holiday_dates: holidayDates,
    division_used: division
  };
}

// ---------------------------------------------------------------------------
// DAT-002 Date Calculator
// ---------------------------------------------------------------------------

export interface DateCalculatorResult {
  start_date: string;
  result_date: string;
  day_of_week: string;
  operation: string;
  years_added: number;
  months_added: number;
  days_added: number;
  clamped_to_month_end: boolean;
  is_leap_year: boolean;
}

/**
 * Add or subtract years, months and days from a date.
 *
 * Month arithmetic is the interesting part. 31 January plus one month has no
 * obvious answer, because 31 February does not exist. This CLAMPS to the last
 * day of the target month, which is the convention almost every calendar and
 * finance system uses, and reports that it did so rather than leaving the user
 * to wonder.
 */
export function dateCalculator(
  start: Date,
  years: number,
  months: number,
  days: number,
  subtract: boolean
): DateCalculatorResult {
  const sign = subtract ? -1 : 1;
  const y = Math.trunc(assertFiniteNumber(years, "Years"));
  const m = Math.trunc(assertFiniteNumber(months, "Months"));
  const d = Math.trunc(assertFiniteNumber(days, "Days"));

  const targetYearRaw = start.getUTCFullYear() + sign * y;
  const totalMonths = targetYearRaw * 12 + start.getUTCMonth() + sign * m;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  if (targetYear < 1 || targetYear > 9999) {
    throw new Error("That takes the date outside the range this calculator handles, which is year 1 to 9999.");
  }

  const startDay = start.getUTCDate();
  const lastDay = daysInMonth(targetYear, targetMonth);
  const clamped = startDay > lastDay;
  const day = clamped ? lastDay : startDay;

  const afterMonths = new Date(Date.UTC(targetYear, targetMonth, day));
  const result = addDaysUtc(afterMonths, sign * d);

  return {
    start_date: isoDate(start),
    result_date: isoDate(result),
    day_of_week: WEEKDAYS[result.getUTCDay()],
    operation: subtract ? "subtracted" : "added",
    years_added: sign * y,
    months_added: sign * m,
    days_added: sign * d,
    clamped_to_month_end: clamped,
    is_leap_year: isLeapYear(result.getUTCFullYear())
  };
}

// ---------------------------------------------------------------------------
// DAT-003 Day Counter
// ---------------------------------------------------------------------------

export interface DayCounterResult {
  start_date: string;
  end_date: string;
  total_days: number;
  days_between_exclusive: number;
  weeks: number;
  remaining_days: number;
  weekdays: number;
  weekend_days: number;
  working_days: number | null;
  bank_holidays_in_range: number | null;
  months_approx: number;
  years_approx: number;
  division_used: Division | null;
}

export function dayCounter(
  start: Date,
  end: Date,
  includeWorkingDays: boolean,
  division: Division,
  rules: any
): DayCounterResult {
  if (end.getTime() < start.getTime()) {
    throw new Error("The end date is before the start date.");
  }

  // Inclusive of both endpoints, which is what "how many days is the trip"
  // means. The exclusive count is reported alongside because "days between"
  // usually means the other thing.
  const inclusive = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const exclusive = inclusive - 1;

  let weekdays = 0, weekend = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const dow = new Date(t).getUTCDay();
    if (dow === 0 || dow === 6) weekend++; else weekdays++;
  }

  let working: number | null = null;
  let holidays: number | null = null;
  if (includeWorkingDays) {
    const w = workingDays(start, end, division, rules);
    working = w.working_days;
    holidays = w.bank_holidays_in_range;
  }

  return {
    start_date: isoDate(start),
    end_date: isoDate(end),
    total_days: inclusive,
    days_between_exclusive: exclusive,
    weeks: Math.floor(exclusive / 7),
    remaining_days: exclusive % 7,
    weekdays,
    weekend_days: weekend,
    working_days: working,
    bank_holidays_in_range: holidays,
    // Approximate, and labelled as such: calendar months vary in length.
    months_approx: exclusive / 30.436875,
    years_approx: exclusive / 365.2425,
    division_used: includeWorkingDays ? division : null
  };
}

// ---------------------------------------------------------------------------
// DAT-004 Day of the Week
// ---------------------------------------------------------------------------

export interface DayOfWeekResult {
  date: string;
  day_of_week: string;
  day_number_iso: number;
  day_of_year: number;
  week_of_year: number;
  month_name: string;
  quarter: number;
  days_in_month: number;
  is_leap_year: boolean;
  is_weekend: boolean;
  days_remaining_in_year: number;
}

export function dayOfWeek(date: Date): DayOfWeekResult {
  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const dayOfYear = Math.round((date.getTime() - startOfYear) / DAY_MS) + 1;

  // ISO week number: weeks start on Monday and week 1 is the one containing
  // the first Thursday of the year, which is why this is not simply
  // dayOfYear / 7.
  const target = new Date(date.getTime());
  const isoDay = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - isoDay + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstIsoDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstIsoDay + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * DAY_MS));

  const dow = date.getUTCDay();
  const totalDaysInYear = isLeapYear(year) ? 366 : 365;

  return {
    date: isoDate(date),
    day_of_week: WEEKDAYS[dow],
    day_number_iso: isoDay + 1,
    day_of_year: dayOfYear,
    week_of_year: week,
    month_name: MONTHS[date.getUTCMonth()],
    quarter: Math.floor(date.getUTCMonth() / 3) + 1,
    days_in_month: daysInMonth(year, date.getUTCMonth()),
    is_leap_year: isLeapYear(year),
    is_weekend: dow === 0 || dow === 6,
    days_remaining_in_year: totalDaysInYear - dayOfYear
  };
}

// ---------------------------------------------------------------------------
// DAT-005 Time Calculator and DAT-006 Time Duration
// ---------------------------------------------------------------------------

function parseClock(value: unknown, label: string): { hours: number; minutes: number; seconds: number } {
  const text = String(value ?? "").trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (!match) throw new Error(`${label} must be a time in 24-hour form, for example 14:30 or 14:30:00.`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) {
    throw new Error(`${label} is not a valid time of day.`);
  }
  return { hours, minutes, seconds };
}

function formatClock(totalSeconds: number): string {
  const normalised = ((Math.round(totalSeconds) % 86400) + 86400) % 86400;
  const h = Math.floor(normalised / 3600);
  const m = Math.floor((normalised % 3600) / 60);
  const s = normalised % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export interface TimeCalculatorResult {
  start_time: string;
  result_time: string;
  days_carried: number;
  total_seconds: number;
  operation: string;
}

export function timeCalculator(
  startTime: unknown,
  hours: number,
  minutes: number,
  seconds: number,
  subtract: boolean
): TimeCalculatorResult {
  const start = parseClock(startTime, "Start time");
  const sign = subtract ? -1 : 1;
  const startSeconds = start.hours * 3600 + start.minutes * 60 + start.seconds;
  const delta =
    sign *
    (assertFiniteNumber(hours, "Hours") * 3600 +
      assertFiniteNumber(minutes, "Minutes") * 60 +
      assertFiniteNumber(seconds, "Seconds"));

  const raw = startSeconds + delta;
  // Days carried tells the user the clock has wrapped, which a bare time of
  // day would hide.
  const daysCarried = Math.floor(raw / 86400);

  return {
    start_time: formatClock(startSeconds),
    result_time: formatClock(raw),
    days_carried: daysCarried,
    total_seconds: raw,
    operation: subtract ? "subtracted" : "added"
  };
}

export interface TimeDurationResult {
  start_time: string;
  end_time: string;
  crossed_midnight: boolean;
  total_seconds: number;
  total_minutes: number;
  total_hours: number;
  duration: string;
  hours: number;
  minutes: number;
  seconds: number;
  decimal_hours: number;
}

/**
 * Duration between two times of day.
 *
 * An end time earlier than the start is treated as crossing midnight, which
 * is what a night shift is, rather than as a negative duration. The fact that
 * it wrapped is reported.
 */
export function timeDuration(startTime: unknown, endTime: unknown): TimeDurationResult {
  const start = parseClock(startTime, "Start time");
  const end = parseClock(endTime, "End time");

  const startSeconds = start.hours * 3600 + start.minutes * 60 + start.seconds;
  const endSeconds = end.hours * 3600 + end.minutes * 60 + end.seconds;

  const crossed = endSeconds < startSeconds;
  const total = crossed ? endSeconds + 86400 - startSeconds : endSeconds - startSeconds;

  return {
    start_time: formatClock(startSeconds),
    end_time: formatClock(endSeconds),
    crossed_midnight: crossed,
    total_seconds: total,
    total_minutes: total / 60,
    total_hours: total / 3600,
    duration: formatClock(total),
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    decimal_hours: total / 3600
  };
}

// ---------------------------------------------------------------------------
// DAT-007 Hours Calculator and DAT-009 Time Card
// ---------------------------------------------------------------------------

export interface TimeCardEntry {
  day: string;
  start: string;
  end: string;
  break_minutes: number;
  worked_hours: number;
  crossed_midnight: boolean;
}

export interface TimeCardResult {
  entries: TimeCardEntry[];
  total_hours: number;
  total_minutes: number;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number | null;
  overtime_pay: number | null;
  total_pay: number | null;
  days_worked: number;
  average_hours_per_day: number;
  total_break_minutes: number;
}

/**
 * Total hours from a timesheet, with breaks deducted and overtime split out.
 *
 * Breaks are deducted from each shift BEFORE the totals, because unpaid breaks
 * are not worked time. A shift ending before it starts is treated as crossing
 * midnight rather than as an error, since night shifts are ordinary.
 */
export function timeCard(
  entries: Array<{ day?: string; start: unknown; end: unknown; break_minutes?: number }>,
  overtimeThresholdHours: number,
  hourlyRate: number,
  overtimeMultiplier: number
): TimeCardResult {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("Enter at least one shift.");
  }

  const threshold = assertFiniteNumber(overtimeThresholdHours, "Overtime threshold");
  const rate = assertFiniteNumber(hourlyRate, "Hourly rate");
  const multiplier = assertFiniteNumber(overtimeMultiplier, "Overtime multiplier");
  if (multiplier < 1) {
    throw new Error("An overtime multiplier below 1 would pay less than the standard rate.");
  }

  const rows: TimeCardEntry[] = [];
  let totalSeconds = 0;
  let totalBreak = 0;

  entries.forEach((entry, i) => {
    const duration = timeDuration(entry.start, entry.end);
    const breakMinutes = Math.max(0, Number(entry.break_minutes ?? 0));
    const workedSeconds = duration.total_seconds - breakMinutes * 60;
    if (workedSeconds < 0) {
      throw new Error(
        `Shift ${i + 1} has a break longer than the shift itself. Check the times and the break.`
      );
    }
    totalSeconds += workedSeconds;
    totalBreak += breakMinutes;
    rows.push({
      day: String(entry.day ?? `Shift ${i + 1}`),
      start: duration.start_time,
      end: duration.end_time,
      break_minutes: breakMinutes,
      worked_hours: workedSeconds / 3600,
      crossed_midnight: duration.crossed_midnight
    });
  });

  const totalHours = totalSeconds / 3600;
  const regular = threshold > 0 ? Math.min(totalHours, threshold) : totalHours;
  const overtime = threshold > 0 ? Math.max(0, totalHours - threshold) : 0;

  const regularPay = rate > 0 ? regular * rate : null;
  const overtimePay = rate > 0 ? overtime * rate * multiplier : null;

  return {
    entries: rows,
    total_hours: totalHours,
    total_minutes: totalSeconds / 60,
    regular_hours: regular,
    overtime_hours: overtime,
    regular_pay: regularPay,
    overtime_pay: overtimePay,
    total_pay: regularPay === null || overtimePay === null ? null : regularPay + overtimePay,
    days_worked: rows.length,
    average_hours_per_day: totalHours / rows.length,
    total_break_minutes: totalBreak
  };
}

// ---------------------------------------------------------------------------
// DAT-008 Time Zone
// ---------------------------------------------------------------------------

export interface TimeZoneResult {
  source_zone: string;
  target_zone: string;
  source_datetime: string;
  target_datetime: string;
  source_offset_minutes: number;
  target_offset_minutes: number;
  difference_hours: number;
  source_is_daylight_saving: boolean;
  target_is_daylight_saving: boolean;
}

/**
 * Offset of a named IANA time zone at a given instant, in minutes.
 *
 * Computed from the runtime's own zone database rather than from a table of
 * fixed offsets, so daylight saving is handled correctly for the actual date
 * rather than for an assumed part of the year. A fixed-offset table is wrong
 * for roughly half of every year in any zone that observes DST.
 */
function offsetMinutes(instant: Date, zone: string): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second)
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

function validateZone(zone: string, label: string): string {
  const name = String(zone ?? "").trim();
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: name });
  } catch {
    throw new Error(
      `${label} is not a recognised time zone. Use an IANA name such as Europe/London, America/New_York or Asia/Tokyo.`
    );
  }
  return name;
}

/** Whether a zone is observing daylight saving at this instant. */
function isDaylightSaving(instant: Date, zone: string): boolean {
  const year = instant.getUTCFullYear();
  const january = offsetMinutes(new Date(Date.UTC(year, 0, 1)), zone);
  const july = offsetMinutes(new Date(Date.UTC(year, 6, 1)), zone);
  const standard = Math.min(january, july);
  return offsetMinutes(instant, zone) > standard;
}

export function timeZoneConversion(
  dateText: unknown,
  timeText: unknown,
  sourceZone: string,
  targetZone: string
): TimeZoneResult {
  const source = validateZone(sourceZone, "The source time zone");
  const target = validateZone(targetZone, "The target time zone");
  const date = parseIsoDate(dateText, "Date");
  const clock = parseClock(timeText, "Time");

  // The wall-clock time in the source zone corresponds to an instant that has
  // to be found by iteration, because the offset depends on the instant and
  // the instant depends on the offset.
  const naive = Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
    clock.hours, clock.minutes, clock.seconds
  );
  let instant = new Date(naive);
  for (let i = 0; i < 3; i++) {
    instant = new Date(naive - offsetMinutes(instant, source) * 60000);
  }

  const sourceOffset = offsetMinutes(instant, source);
  const targetOffset = offsetMinutes(instant, target);

  const targetLocal = new Date(instant.getTime() + targetOffset * 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const targetText =
    `${targetLocal.getUTCFullYear()}-${pad(targetLocal.getUTCMonth() + 1)}-${pad(targetLocal.getUTCDate())} ` +
    `${pad(targetLocal.getUTCHours())}:${pad(targetLocal.getUTCMinutes())}`;

  const sourceLocal = new Date(instant.getTime() + sourceOffset * 60000);
  const sourceText =
    `${sourceLocal.getUTCFullYear()}-${pad(sourceLocal.getUTCMonth() + 1)}-${pad(sourceLocal.getUTCDate())} ` +
    `${pad(sourceLocal.getUTCHours())}:${pad(sourceLocal.getUTCMinutes())}`;

  return {
    source_zone: source,
    target_zone: target,
    source_datetime: sourceText,
    target_datetime: targetText,
    source_offset_minutes: sourceOffset,
    target_offset_minutes: targetOffset,
    difference_hours: (targetOffset - sourceOffset) / 60,
    source_is_daylight_saving: isDaylightSaving(instant, source),
    target_is_daylight_saving: isDaylightSaving(instant, target)
  };
}
