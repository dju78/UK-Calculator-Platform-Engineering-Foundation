export function calculateBMI(weightKg: number, heightM: number) {
    if (typeof weightKg !== 'number' || typeof heightM !== 'number') {
        throw new Error("Invalid input: weight and height must be numbers");
    }
    if (!isFinite(weightKg) || !isFinite(heightM) || isNaN(weightKg) || isNaN(heightM)) {
        throw new Error("Invalid input: weight and height must be finite numbers");
    }
    if (weightKg <= 0 || heightM <= 0) {
        throw new Error("Invalid input: weight and height must be positive numbers");
    }

    const bmi = weightKg / (heightM * heightM);
    
    if (!isFinite(bmi) || isNaN(bmi)) {
        throw new Error("Invalid calculation result");
    }

    const roundedBmi = Number(bmi.toFixed(2));
    let category = "";

    if (roundedBmi < 18.5) {
        category = "Underweight";
    } else if (roundedBmi < 25) {
        category = "Healthy weight";
    } else if (roundedBmi < 30) {
        category = "Overweight";
    } else if (roundedBmi < 40) {
        category = "Obesity";
    } else {
        category = "Severe obesity";
    }

    return {
        bmi: roundedBmi,
        category
    };
}
