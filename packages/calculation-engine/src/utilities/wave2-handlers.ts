import type { NumericInputs, CalculationContext, CalculatorHandler } from "../types.js";
import { resolveRules } from "../../../rules-uk/src/index.js";
import {
  parseIsoDate, normaliseDivision, dateCalculator, dayCounter, dayOfWeek,
  timeCalculator, timeDuration, timeCard, timeZoneConversion, workingDays
} from "./wave2.js";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
function orNull(n: number | null | undefined, fn: (v: number) => number): number | null {
  return n === null || n === undefined ? null : fn(n);
}

function rulesFor(context: CalculationContext): any {
  return resolveRules({ taxYear: context.taxYear || "2026/27" }) as any;
}

const UTC_NOTE =
  "All date arithmetic is done in UTC, which is what stops a date crossing a daylight saving boundary from gaining or losing a day.";

const DIVISION_NOTE =
  "Working days use the real GOV.UK bank holidays for the division you chose. The three divisions genuinely differ: Scotland has no Easter Monday but does have 2nd January and St Andrew's Day, and takes its summer holiday in early August rather than late; Northern Ireland has St Patrick's Day and the Battle of the Boyne. Treating the UK as one list is wrong for two of the three.";

/** DAT-002 Date Calculator */
export const dat002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const subtract = String(inputs.operation ?? "add") === "subtract";
  const r = dateCalculator(
    parseIsoDate(inputs.start_date, "Start date"),
    Number(inputs.years ?? 0), Number(inputs.months ?? 0), Number(inputs.days ?? 0),
    subtract
  );
  const warnings: string[] = [];
  if (r.clamped_to_month_end) {
    warnings.push(
      "The starting day does not exist in the target month, so the result has been moved to the last day of that month. Adding one month to 31 January gives 28 or 29 February, not 3 March."
    );
  }
  return {
    outputs: {
      result_date: r.result_date,
      day_of_week: r.day_of_week,
      clamped_to_month_end: r.clamped_to_month_end,
      is_leap_year: r.is_leap_year,
      basis:
        "Years and months are applied first, then days, which is the convention every calendar and finance system uses. Where the day of the month does not exist in the target month the result is clamped to the last day of it, and that is reported rather than left to be discovered. " +
        UTC_NOTE
    },
    warnings
  };
};

/** DAT-003 Day Counter */
export const dat003Handler: CalculatorHandler = (inputs: NumericInputs, context: CalculationContext) => {
  const rules = rulesFor(context);
  const includeWorking = inputs.include_working_days === true || String(inputs.include_working_days) === "true";
  const division = normaliseDivision(inputs.division);
  const r = dayCounter(
    parseIsoDate(inputs.start_date, "Start date"),
    parseIsoDate(inputs.end_date, "End date"),
    includeWorking, division, rules
  );
  return {
    outputs: {
      total_days: r.total_days,
      days_between_exclusive: r.days_between_exclusive,
      weeks: r.weeks,
      remaining_days: r.remaining_days,
      weekdays: r.weekdays,
      weekend_days: r.weekend_days,
      working_days: r.working_days,
      bank_holidays_in_range: r.bank_holidays_in_range,
      months_approx: round2(r.months_approx),
      years_approx: round2(r.years_approx),
      basis:
        "Two counts are given because 'how many days' means two different things. The total counts both end dates, which is what you want for the length of a stay; the between figure excludes the start, which is what you want for an interval. Months and years are approximate, because calendar months vary in length. " +
        (includeWorking ? DIVISION_NOTE + " " : "") + UTC_NOTE
    }
  };
};

/** DAT-004 Day of the Week */
export const dat004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = dayOfWeek(parseIsoDate(inputs.date, "Date"));
  return {
    outputs: {
      day_of_week: r.day_of_week,
      day_of_year: r.day_of_year,
      week_of_year: r.week_of_year,
      month_name: r.month_name,
      quarter: r.quarter,
      days_in_month: r.days_in_month,
      is_leap_year: r.is_leap_year,
      is_weekend: r.is_weekend,
      days_remaining_in_year: r.days_remaining_in_year,
      basis:
        "The week number follows the ISO standard: weeks begin on Monday, and week 1 is the one containing the first Thursday of the year. That is why early January can fall in week 52 or 53 of the previous year, and why a simple division by seven gives the wrong answer. " +
        UTC_NOTE
    }
  };
};

/** DAT-005 Time Calculator */
export const dat005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const subtract = String(inputs.operation ?? "add") === "subtract";
  const r = timeCalculator(
    inputs.start_time, Number(inputs.hours ?? 0),
    Number(inputs.minutes ?? 0), Number(inputs.seconds ?? 0), subtract
  );
  const warnings: string[] = [];
  if (r.days_carried !== 0) {
    warnings.push(
      `The clock has wrapped past midnight ${Math.abs(r.days_carried)} time${Math.abs(r.days_carried) === 1 ? "" : "s"}, so the result is on a ${r.days_carried > 0 ? "later" : "earlier"} day.`
    );
  }
  return {
    outputs: {
      result_time: r.result_time,
      days_carried: r.days_carried,
      total_seconds: r.total_seconds,
      basis:
        "The result is a time of day, so it wraps at midnight. The number of days carried is reported, because a bare time of day would hide the fact that the answer is on a different date."
    },
    warnings
  };
};

/** DAT-006 Time Duration */
export const dat006Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = timeDuration(inputs.start_time, inputs.end_time);
  return {
    outputs: {
      duration: r.duration,
      hours: r.hours,
      minutes: r.minutes,
      seconds: r.seconds,
      total_hours: round8(r.total_hours),
      total_minutes: round8(r.total_minutes),
      total_seconds: r.total_seconds,
      decimal_hours: round8(r.decimal_hours),
      crossed_midnight: r.crossed_midnight,
      basis:
        "An end time earlier than the start is treated as crossing midnight, which is what a night shift is, rather than as a negative duration. The decimal hours figure is the one payroll systems usually want: 7 hours 30 minutes is 7.5, not 7.30."
    }
  };
};

/** DAT-007 Hours Calculator */
export const dat007Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const raw = typeof inputs.shifts === "string" ? JSON.parse(inputs.shifts as string) : inputs.shifts;
  if (!Array.isArray(raw)) {
    throw new Error('Shifts must be a list, for example [{"start": "09:00", "end": "17:00", "break_minutes": 30}].');
  }
  const r = timeCard(raw, Number(inputs.overtime_threshold ?? 0), 0, 1.5);
  return {
    outputs: {
      total_hours: round8(r.total_hours),
      total_minutes: round8(r.total_minutes),
      regular_hours: round8(r.regular_hours),
      overtime_hours: round8(r.overtime_hours),
      days_worked: r.days_worked,
      average_hours_per_day: round8(r.average_hours_per_day),
      total_break_minutes: r.total_break_minutes,
      basis:
        "Breaks are deducted from each shift BEFORE anything is totalled, because an unpaid break is not worked time. A shift ending earlier than it starts is treated as a night shift crossing midnight."
    },
    schedule: r.entries.map((e) => ({ ...e, worked_hours: round8(e.worked_hours) }))
  };
};

/** DAT-008 Time Zone */
export const dat008Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = timeZoneConversion(
    inputs.date, inputs.time,
    String(inputs.source_zone ?? "Europe/London"),
    String(inputs.target_zone ?? "America/New_York")
  );
  return {
    outputs: {
      source_datetime: r.source_datetime,
      target_datetime: r.target_datetime,
      difference_hours: round2(r.difference_hours),
      source_offset_minutes: r.source_offset_minutes,
      target_offset_minutes: r.target_offset_minutes,
      source_is_daylight_saving: r.source_is_daylight_saving,
      target_is_daylight_saving: r.target_is_daylight_saving,
      basis:
        "Offsets are read from the runtime's own time zone database for the actual date you entered, not from a table of fixed offsets. That matters: a fixed table is wrong for roughly half of every year in any zone that observes daylight saving, and the two zones rarely change on the same day. The difference between London and New York is five hours for most of the year but four for two weeks each spring."
    }
  };
};

/** DAT-009 Time Card */
export const dat009Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const raw = typeof inputs.shifts === "string" ? JSON.parse(inputs.shifts as string) : inputs.shifts;
  if (!Array.isArray(raw)) {
    throw new Error('Shifts must be a list, for example [{"day": "Monday", "start": "09:00", "end": "17:00", "break_minutes": 30}].');
  }
  const r = timeCard(
    raw,
    Number(inputs.overtime_threshold ?? 40),
    Number(inputs.hourly_rate ?? 0),
    Number(inputs.overtime_multiplier ?? 1.5)
  );
  return {
    outputs: {
      total_hours: round8(r.total_hours),
      regular_hours: round8(r.regular_hours),
      overtime_hours: round8(r.overtime_hours),
      regular_pay: orNull(r.regular_pay, round2),
      overtime_pay: orNull(r.overtime_pay, round2),
      total_pay: orNull(r.total_pay, round2),
      days_worked: r.days_worked,
      average_hours_per_day: round8(r.average_hours_per_day),
      total_break_minutes: r.total_break_minutes,
      basis:
        "Breaks are deducted from each shift before the totals, and overtime is measured against the weekly threshold you set rather than per day. Pay figures are gross, before Income Tax and National Insurance. There is no legal right to a higher rate for overtime in the UK unless your contract provides one, and average pay across all hours worked must still meet the National Minimum Wage."
    },
    schedule: r.entries.map((e) => ({ ...e, worked_hours: round8(e.worked_hours) }))
  };
};

/** Exported for the working-day helper used by DAT-003. */
export { workingDays };
