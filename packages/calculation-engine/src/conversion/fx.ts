import { FXProvider, FrankfurterFXProvider } from './fx-provider.js';

export class CurrencyConverter {
    private provider: FXProvider;

    constructor(provider?: FXProvider) {
        this.provider = provider || new FrankfurterFXProvider();
    }

    async convert(amount: number, from: string, to: string): Promise<number> {
        from = from.toUpperCase();
        to = to.toUpperCase();

        if (from === to) {
            return amount;
        }

        const ratesData = await this.provider.getRates(from);
        
        const rate = ratesData.rates[to];
        if (rate === undefined) {
            throw new Error(`Unsupported currency conversion: ${from} to ${to}`);
        }

        return amount * rate;
    }
}
