import { calculateAge, calculateFuelCost, convertUnits } from './core.js';

export const utilitiesHandlers = {
    'DAT-001': (inputs: any) => {
        return { outputs: calculateAge(inputs.dob, inputs.reference) };
    },
    'AUT-006': (inputs: any) => {
        return { outputs: calculateFuelCost(inputs.distance_miles, inputs.mpg_uk, inputs.price_p_per_litre, inputs.trips) };
    },
    'CON-001': (inputs: any) => {
        return { outputs: convertUnits(inputs.value, inputs.from, inputs.to) };
    }
};
