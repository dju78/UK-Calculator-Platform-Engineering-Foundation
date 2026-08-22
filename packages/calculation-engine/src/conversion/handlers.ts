import { CurrencyConverter } from './fx.js';
import { NumericInputs, CalculationContext } from '../types.js';

const converter = new CurrencyConverter();

export async function con010Handler(inputs: NumericInputs, context: CalculationContext) {
    const amount = Number(inputs.amount);
    const from = String(inputs.from).toUpperCase();
    const to = String(inputs.to).toUpperCase();
    
    // Check if rate is manually provided (for benchmarks)
    if (inputs.rate !== undefined && inputs.rate !== null && String(inputs.rate).trim() !== "") {
        const rate = Number(inputs.rate);
        return {
            outputs: {
                converted: amount * rate
            }
        };
    }

    // Otherwise use FX provider
    const converted = await converter.convert(amount, from, to);
    
    return {
        outputs: {
            converted
        }
    };
}
