import test from "node:test";
import assert from "node:assert/strict";
import { CurrencyConverter } from "../packages/calculation-engine/src/conversion/fx.js";
import { FrankfurterFXProvider, FXProvider, FXRates } from "../packages/calculation-engine/src/conversion/fx-provider.js";
import http from 'http';

test("FX cache, freshness, and stale-data handling", async (t: any) => {
    let callCount = 0;
    const server = http.createServer((req, res) => {
        callCount++;
        if (req.url === '/latest?from=USD') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                base: 'USD',
                date: '2026-08-22',
                rates: { GBP: 0.8, EUR: 0.9, JPY: 110 }
            }));
        } else if (req.url === '/latest?from=ERR') {
            res.writeHead(500);
            res.end();
        } else if (req.url === '/latest?from=BADJSON') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end("not json");
        } else if (req.url === '/latest?from=INVALIDFMT') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ hello: "world" }));
        } else {
            res.writeHead(404);
            res.end();
        }
    });
    
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const baseUrl = `http://localhost:${port}`;
    
    await t.test("cache hits and misses", async () => {
        const provider = new FrankfurterFXProvider({ baseUrl, staleTimeMs: 1000 });
        callCount = 0;
        
        const data1 = await provider.getRates('USD');
        assert.equal(callCount, 1);
        assert.equal(data1.rates.GBP, 0.8);
        
        const data2 = await provider.getRates('USD');
        assert.equal(callCount, 1); // Cache hit
        assert.equal(data2.rates.GBP, 0.8);
    });
    
    await t.test("stale data handling", async () => {
        const provider = new FrankfurterFXProvider({ baseUrl, staleTimeMs: 10 });
        callCount = 0;
        
        await provider.getRates('USD');
        assert.equal(callCount, 1);
        
        // wait 20ms
        await new Promise(r => setTimeout(r, 20));
        
        await provider.getRates('USD');
        assert.equal(callCount, 2); // Cache miss because stale
    });
    
    await t.test("error handling - 500", async () => {
        const provider = new FrankfurterFXProvider({ baseUrl });
        await assert.rejects(provider.getRates('ERR'), /FX Fetch Failed: FX Provider Error: 500/);
    });
    
    await t.test("error handling - bad json", async () => {
        const provider = new FrankfurterFXProvider({ baseUrl });
        await assert.rejects(provider.getRates('BADJSON'), /FX Fetch Failed/);
    });
    
    await t.test("error handling - invalid format", async () => {
        const provider = new FrankfurterFXProvider({ baseUrl });
        await assert.rejects(provider.getRates('INVALIDFMT'), /Invalid response format/);
    });
    
    server.close();
});

test("CurrencyConverter cross-rate maths and same-currency", async (t: any) => {
    class MockProvider implements FXProvider {
        async getRates(base: string = 'USD'): Promise<FXRates> {
            if (base === 'USD') return { base: 'USD', date: '2026-08-22', rates: { GBP: 0.8, EUR: 0.9, JPY: 110 } as Record<string, number> };
            if (base === 'GBP') return { base: 'GBP', date: '2026-08-22', rates: { USD: 1.25, EUR: 1.125 } as Record<string, number> };
            throw new Error("unsupported base");
        }
    }
    const converter = new CurrencyConverter(new MockProvider());
    
    await t.test("same currency", async () => {
        const result = await converter.convert(100, 'GBP', 'GBP');
        assert.equal(result, 100);
    });
    
    await t.test("standard conversion", async () => {
        const result = await converter.convert(100, 'USD', 'GBP');
        assert.equal(result, 80);
    });
    
    await t.test("case insensitivity", async () => {
        const result = await converter.convert(100, 'usd', 'gbp');
        assert.equal(result, 80);
    });
    
    await t.test("unsupported target currency", async () => {
        await assert.rejects(converter.convert(100, 'USD', 'XYZ'), /Unsupported currency conversion/);
    });
});
