import type { CalculatorHandler } from "../types.js";
import { calculateBMI } from "./core.js";
import { convertUnits } from "../utilities/core.js";

export const hlt001Handler: CalculatorHandler = (inputs, context) => {
    let weightKg = inputs.weight_kg as number;
    let heightM = inputs.height_m as number;

    if (weightKg === undefined && inputs.weight_lb !== undefined) {
        weightKg = convertUnits(inputs.weight_lb as number, 'lb', 'kg').result;
    }

    if (heightM === undefined) {
        if (inputs.height_ft !== undefined || inputs.height_in !== undefined) {
            let totalM = 0;
            if (inputs.height_ft !== undefined) {
                totalM += convertUnits(inputs.height_ft as number, 'ft', 'm').result;
            }
            if (inputs.height_in !== undefined) {
                totalM += convertUnits(inputs.height_in as number, 'in', 'm').result;
            }
            heightM = totalM;
        }
    }

    const { bmi, category } = calculateBMI(weightKg, heightM);

    return {
        outputs: {
            bmi,
            category
        },
        warnings: [
            "This BMI calculator provides informational results only and does not constitute medical advice. Please consult a healthcare professional for clinical assessments."
        ]
    };
};
