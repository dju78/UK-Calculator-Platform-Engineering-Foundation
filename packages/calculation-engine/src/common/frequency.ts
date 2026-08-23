/**
 * Shared income-frequency / payroll-frequency model.
 *
 * This is the single place where the platform converts between annual,
 * monthly, weekly and hourly money. Calculator handlers and React components
 * MUST use these helpers rather than scattering `* 12`, `* 52` or
 * `hoursPerWeek` arithmetic of their own.
 *
 * Two distinct concepts live here and must not be conflated:
 *
 *   INCOME FREQUENCY  - the frequency in which the USER chose to type their
 *                       pay ("I earn £15 an hour", "I earn £3,250 a month").
 *                       It only affects how we annualise their input.
 *
 *   PAYROLL FREQUENCY - how often the user is actually PAID. An hourly worker
 *                       may be paid weekly or monthly; a salaried worker is
 *                       usually paid monthly. This is a genuinely separate
 *                       state because some payroll deductions are pay-period
 *                       sensitive in real PAYE.
 */

export type IncomeFrequency = "annual" | "monthly" | "weekly" | "hourly";
export type PayrollFrequency = "monthly" | "weekly";

export const INCOME_FREQUENCIES: IncomeFrequency[] = ["annual", "monthly", "weekly", "hourly"];
export const PAYROLL_FREQUENCIES: PayrollFrequency[] = ["monthly", "weekly"];

export const MONTHS_PER_YEAR = 12;
export const DEFAULT_HOURS_PER_WEEK = 37.5;
export const DEFAULT_PAID_WEEKS_PER_YEAR = 52;

/**
 * The working-pattern assumptions behind any weekly or hourly figure.
 * These are always user-editable and must always be displayed alongside any
 * hourly result - they are assumptions, never invisible constants.
 */
export interface WorkingPattern {
  hoursPerWeek: number;
  paidWeeksPerYear: number;
  /** True when the caller actually supplied hours (not just defaulted). */
  hoursKnown: boolean;
}

export interface PeriodicAmounts {
  yearly: number;
  monthly: number;
  weekly: number;
  /** null when no working-hours assumption is available. */
  hourly: number | null;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function normaliseIncomeFrequency(value: unknown): IncomeFrequency {
  const raw = String(value ?? "annual").trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (raw) {
    case "annual":
    case "annually":
    case "year":
    case "yearly":
    case "per_year":
      return "annual";
    case "monthly":
    case "month":
    case "per_month":
      return "monthly";
    case "weekly":
    case "week":
    case "per_week":
      return "weekly";
    case "hourly":
    case "hour":
    case "per_hour":
      return "hourly";
    default:
      throw new Error(
        `Unsupported income frequency "${String(value)}". Use annual, monthly, weekly or hourly.`
      );
  }
}

export function normalisePayrollFrequency(value: unknown): PayrollFrequency {
  const raw = String(value ?? "monthly").trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (raw) {
    case "monthly":
    case "month":
      return "monthly";
    case "weekly":
    case "week":
      return "weekly";
    default:
      throw new Error(
        `Unsupported payroll frequency "${String(value)}". This calculator supports monthly or weekly payroll.`
      );
  }
}

/**
 * Resolve the working pattern from raw calculator inputs.
 *
 * `hoursKnown` is false when the caller supplied no hours at all. Callers use
 * that to decide whether an hourly equivalent may honestly be shown: we never
 * invent an hourly figure from an assumption the user never saw.
 */
export function resolveWorkingPattern(
  inputs: Record<string, unknown>,
  options: { requireHours?: boolean } = {}
): WorkingPattern {
  const hours = toFiniteNumber(inputs.hours_per_week ?? inputs.hours_week ?? inputs.hoursPerWeek);
  const weeks = toFiniteNumber(
    inputs.paid_weeks_per_year ?? inputs.weeks ?? inputs.paidWeeksPerYear
  );

  if (options.requireHours && hours === undefined) {
    throw new Error("Hours per week is required when income is entered as an hourly rate.");
  }
  if (hours !== undefined && hours <= 0) {
    throw new Error("Hours per week must be greater than zero.");
  }
  if (weeks !== undefined && (weeks <= 0 || weeks > 53)) {
    throw new Error("Paid weeks per year must be between 1 and 53.");
  }

  return {
    hoursPerWeek: hours ?? DEFAULT_HOURS_PER_WEEK,
    paidWeeksPerYear: weeks ?? DEFAULT_PAID_WEEKS_PER_YEAR,
    hoursKnown: hours !== undefined
  };
}

/** Total paid working hours in a year under the given pattern. */
export function annualWorkingHours(pattern: WorkingPattern): number {
  return pattern.hoursPerWeek * pattern.paidWeeksPerYear;
}

/**
 * Convert an amount entered at `frequency` into an annual amount.
 *
 *   annual   -> amount
 *   monthly  -> amount * 12
 *   weekly   -> amount * paidWeeksPerYear
 *   hourly   -> amount * hoursPerWeek * paidWeeksPerYear
 */
export function annualiseIncome(
  amount: number,
  frequency: IncomeFrequency,
  pattern: WorkingPattern
): number {
  if (!Number.isFinite(amount)) throw new Error("Income amount must be a finite number.");
  switch (frequency) {
    case "annual":
      return amount;
    case "monthly":
      return amount * MONTHS_PER_YEAR;
    case "weekly":
      return amount * pattern.paidWeeksPerYear;
    case "hourly":
      return amount * annualWorkingHours(pattern);
  }
}

/**
 * Expand an annual amount into yearly / monthly / weekly / hourly equivalents.
 *
 * The hourly figure is an ANNUALISED EQUIVALENT, never a payslip figure, and
 * is omitted entirely when no working-hours assumption is available.
 */
export function periodicBreakdown(
  annualAmount: number,
  pattern: WorkingPattern,
  options: { allowHourly?: boolean } = {}
): PeriodicAmounts {
  const allowHourly = options.allowHourly ?? pattern.hoursKnown;
  const hours = annualWorkingHours(pattern);
  return {
    yearly: annualAmount,
    monthly: annualAmount / MONTHS_PER_YEAR,
    weekly: annualAmount / pattern.paidWeeksPerYear,
    hourly: allowHourly && hours > 0 ? annualAmount / hours : null
  };
}

/** Number of pay periods in a year for the given payroll frequency. */
export function payPeriodsPerYear(
  frequency: PayrollFrequency,
  pattern: WorkingPattern
): number {
  return frequency === "monthly" ? MONTHS_PER_YEAR : pattern.paidWeeksPerYear;
}
