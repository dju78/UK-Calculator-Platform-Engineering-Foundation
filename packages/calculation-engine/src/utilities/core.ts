/**
 * Calendar duration between two dates, as whole years, months and days plus a
 * total day count.
 *
 * LEAP-DAY CONVENTION (29 February)
 * ---------------------------------
 * A 29 February birth date has no exact anniversary in a non-leap year, so a
 * convention must be chosen. Two are defensible:
 *
 *   A) Treat the anniversary as 28 February  <- ADOPTED HERE
 *   B) Treat the anniversary as 1 March
 *
 * This implementation adopts convention A. Someone born on 2000-02-29 therefore
 * completes another year on 28 February in non-leap years, which is the more
 * common convention in date software and means the person is never briefly
 * recorded as a year younger than they are.
 *
 * The choice is not cosmetic: for DOB 2000-02-29 measured to 2026-08-22,
 * convention A yields 26 years, 5 months, 25 days while convention B yields
 * 26 years, 5 months, 21 days.
 *
 * `total_days` is unaffected by the convention - it is a pure count of elapsed
 * days (9,671 for the example above, independently verified against Julian Day
 * Numbers) and must never be adjusted to match the y/m/d breakdown.
 *
 * This is a duration calculation, not a legal determination of when a person
 * attains a given age, which can differ by jurisdiction and by statute.
 */
export function calculateAge(dobStr: string, refStr: string) {
    const dob = new Date(dobStr);
    const ref = new Date(refStr);

    if (isNaN(dob.getTime())) throw new Error("Enter a valid date of birth.");
    if (isNaN(ref.getTime())) throw new Error("Enter a valid reference date.");
    if (ref.getTime() < dob.getTime()) {
        throw new Error("The reference date cannot be earlier than the date of birth.");
    }

    let years = ref.getFullYear() - dob.getFullYear();
    let months = ref.getMonth() - dob.getMonth();

    let dobDay = dob.getDate();
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    // Convention A: clamp a 29 February anniversary to 28 February in non-leap years.
    if (dob.getMonth() === 1 && dobDay === 29 && !isLeapYear(ref.getFullYear())) {
        dobDay = 28;
    }

    let days = ref.getDate() - dobDay;

    if (days < 0) {
        months--;
        const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    // ensure UTC diff so daylight saving doesn't mess it up
    const utcDob = Date.UTC(dob.getFullYear(), dob.getMonth(), dob.getDate());
    const utcRef = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
    const totalDays = Math.floor((utcRef - utcDob) / msPerDay);

    const bornOnLeapDay = dob.getMonth() === 1 && dob.getDate() === 29;

    return {
        years,
        months,
        days,
        total_days: totalDays,
        ...(bornOnLeapDay
            ? {
                  leap_day_convention:
                      "Born on 29 February. In non-leap years this calculator treats 28 February as the anniversary."
              }
            : {})
    };
}

export function calculateFuelCost(distanceMiles: number, mpgUk: number, pricePencePerLitre: number, trips: number = 1) {
    const totalDistance = distanceMiles * trips;
    if (totalDistance === 0) {
        return { litres: 0, cost_gbp: 0 };
    }
    
    // 1 UK gallon = 4.54609 litres
    const LITRES_PER_UK_GALLON = 4.54609;
    const gallons = totalDistance / mpgUk;
    const litres = gallons * LITRES_PER_UK_GALLON;
    
    const costGbp = (litres * pricePencePerLitre) / 100;
    
    return {
        litres: Number(litres.toFixed(6)),
        cost_gbp: Number(costGbp.toFixed(2))
    };
}

export function convertUnits(value: number, fromUnit: string, toUnit: string) {
    // Basic affine conversion mapping to base units
    // lengths: base meter
    // weights: base kg
    // temp: base C
    // volume: base litre
    if (fromUnit === toUnit) {
        return { result: value };
    }

    const conversion: Record<string, { baseUnit: string, factor: number, offset?: number }> = {
        'km': { baseUnit: 'm', factor: 1000 },
        'm': { baseUnit: 'm', factor: 1 },
        'miles': { baseUnit: 'm', factor: 1609.344 },
        'ft': { baseUnit: 'm', factor: 0.3048 },
        'in': { baseUnit: 'm', factor: 0.0254 },
        'kg': { baseUnit: 'kg', factor: 1 },
        'lb': { baseUnit: 'kg', factor: 0.45359237 },
        'litres': { baseUnit: 'l', factor: 1 },
        'UK gallons': { baseUnit: 'l', factor: 4.54609 },
        'C': { baseUnit: 'C', factor: 1, offset: 0 },
        'F': { baseUnit: 'C', factor: 5/9, offset: -32 * (5/9) }
    };

    const from = conversion[fromUnit];
    const to = conversion[toUnit];

    if (!from || !to || from.baseUnit !== to.baseUnit) {
        throw new Error(`Cannot convert ${fromUnit} to ${toUnit}`);
    }

    // Convert from -> base
    let baseValue = value * from.factor + (from.offset || 0);

    // Convert base -> to
    // baseValue = result * to.factor + to.offset
    // result = (baseValue - to.offset) / to.factor
    let result = (baseValue - (to.offset || 0)) / to.factor;

    return { result: Number(result.toFixed(8)) };
}
