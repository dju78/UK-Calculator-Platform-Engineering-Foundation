export interface FXRates {
    base: string;
    date: string;
    rates: Record<string, number>;
}

export interface FXProvider {
    getRates(base?: string): Promise<FXRates>;
}

export interface CacheOptions {
    staleTimeMs: number;
}

export class FrankfurterFXProvider implements FXProvider {
    private cache: Map<string, { timestamp: number; data: FXRates }> = new Map();
    private staleTimeMs: number;
    private baseUrl: string;

    constructor(options: { staleTimeMs?: number; baseUrl?: string } = {}) {
        this.staleTimeMs = options.staleTimeMs || 1000 * 60 * 60; // 1 hour default
        this.baseUrl = options.baseUrl || 'https://api.frankfurter.app';
    }

    async getRates(base: string = 'USD'): Promise<FXRates> {
        const cached = this.cache.get(base);
        if (cached && (Date.now() - cached.timestamp < this.staleTimeMs)) {
            return cached.data;
        }

        try {
            const response = await fetch(`${this.baseUrl}/latest?from=${base}`);
            if (!response.ok) {
                throw new Error(`FX Provider Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validation
            if (!data.base || !data.rates || typeof data.rates !== 'object') {
                throw new Error('FX Provider Error: Invalid response format');
            }

            this.cache.set(base, { timestamp: Date.now(), data });
            return data;
        } catch (error) {
            // Network failure or parsing error
            if (error instanceof Error) {
                throw new Error(`FX Fetch Failed: ${error.message}`);
            }
            throw error;
        }
    }
}
