# Engineering foundation validation report

**Run date:** 22 August 2026  
**Foundation version:** 0.1.0

## Automated tests
- TypeScript compilation: PASS
- Node test suite: **13 passed, 0 failed**
- Wave 1 registry count: **55**
- Duplicate calculator IDs/slugs: **0**
- Registry benchmark minimum check: PASS
- UK rules production-status gate: PASS
- INV-002 benchmark fixtures: **5 passed, 0 failed**
- Remaining Wave 1 benchmark fixtures: **270 skipped intentionally** because their calculator handlers are not implemented yet

## Reference server smoke test
- `GET /health`: HTTP 200
- `POST /api/calculate` for INV-002: HTTP 200 and expected calculation payload
- `GET /`: HTTP 200

## Reference benchmark
For £10,000 at a 5% nominal annual rate, compounded monthly for 10 years, the engine returns a future value of **£16,470.0949769028**, which rounds to the specification benchmark of **£16,470.09**.

## Release interpretation
This validation demonstrates the package boundaries, calculation contract, registry controls, ruleset gate and first reference calculator. It does **not** mean all 55 Wave 1 calculators are implemented. Only INV-002 is executable in foundation version 0.1.0.
