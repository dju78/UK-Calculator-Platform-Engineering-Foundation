export function calculateAge(dobStr: string, refStr: string) {
    const dob = new Date(dobStr);
    const ref = new Date(refStr);
    
    let years = ref.getFullYear() - dob.getFullYear();
    let months = ref.getMonth() - dob.getMonth();
    
    let dobDay = dob.getDate();
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
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

    return {
        years,
        months,
        days,
        total_days: totalDays
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
