# Wave 2 Implementation Report

Generated 2026-08-24. All counts derived from the registry and fixtures.

## Scope delivered

| | |
|---|---|
| Wave 2 calculators | **188 / 188** |
| Wave 1 (unchanged) | 55 / 55 |
| Total platform | 243 |
| Specifications | 188 |
| Benchmark cases (Wave 2) | 1164 |
| Minimum cases per calculator | 5 (target 5) |
| Files added since 2C | 227 |
| Files modified since 2C | 19 |

## By category

| Category | Verified | Benchmark cases |
|---|---|---|
| Automotive & Travel | 11/11 | 68 |
| Business & Commercial | 9/9 | 62 |
| Conversions | 8/8 | 50 |
| Date & Time | 8/8 | 52 |
| Education | 5/5 | 30 |
| Everyday & Lifestyle | 2/2 | 12 |
| Finance & Debt | 8/8 | 40 |
| Geometry | 9/9 | 61 |
| Health & Fitness | 21/21 | 128 |
| Home & Construction | 6/6 | 36 |
| ISA & Tax Wrappers | 4/4 | 24 |
| Investing & Wealth | 14/14 | 70 |
| Maths & Algebra | 18/18 | 113 |
| Mortgages & Property | 15/15 | 75 |
| Pensions & Retirement | 7/7 | 52 |
| Science & Engineering | 11/11 | 76 |
| Statistics & Data | 15/15 | 93 |
| Technology & Digital | 5/5 | 38 |
| UK Tax & Salary | 12/12 | 84 |

## Architecture

The platform is registry-driven. A calculator exists in the registry with two
independent axes: `status` (planned to specified to verified) and
`implementationStatus` (specified to implemented). Publication requires BOTH a
handler and verified status, so writing engine code cannot by itself put a
calculator in front of a user.

Engine modules are grouped by domain under `packages/calculation-engine/src/`,
with a handler layer that adapts the pure functions to the calculator contract
and carries the narrative each result explains itself with. Rules-sensitive
values live in a versioned ruleset with a source register, never in code and
never in a React component.

Output formatting is decided in one place, per calculator AND per key, because
the same name means different things in different calculators: `margin` is a
ratio in BUS-001 and an absolute width in STA-006.

## Oracle files

Each tranche has an independent oracle that shares no code with the engine and
uses a different METHOD, not merely different code.

- `scripts/oracles/wave2-automotive-oracle.mjs`
- `scripts/oracles/wave2-business-oracle.mjs`
- `scripts/oracles/wave2-conversion-oracle.mjs`
- `scripts/oracles/wave2-datetime-oracle.mjs`
- `scripts/oracles/wave2-education-oracle.mjs`
- `scripts/oracles/wave2-finance-oracle.mjs`
- `scripts/oracles/wave2-geometry-oracle.mjs`
- `scripts/oracles/wave2-health-oracle.mjs`
- `scripts/oracles/wave2-home-oracle.mjs`
- `scripts/oracles/wave2-investment-oracle.mjs`
- `scripts/oracles/wave2-isa-tax-oracle.mjs`
- `scripts/oracles/wave2-maths-oracle.mjs`
- `scripts/oracles/wave2-pension-oracle.mjs`
- `scripts/oracles/wave2-property-oracle.mjs`
- `scripts/oracles/wave2-science-oracle.mjs`
- `scripts/oracles/wave2-statistics-oracle.mjs`
- `scripts/oracles/wave2-technology-oracle.mjs`

## Test files

- `tests/audit-regressions.test.ts`
- `tests/automotive-wave2.test.ts`
- `tests/business-wave2.test.ts`
- `tests/business.test.ts`
- `tests/compound-interest.test.ts`
- `tests/conversion-wave2.test.ts`
- `tests/datetime-wave2.test.ts`
- `tests/education-wave2.test.ts`
- `tests/fx.test.ts`
- `tests/geometry-wave2.test.ts`
- `tests/health-wave2.test.ts`
- `tests/home-wave2.test.ts`
- `tests/investment.test.ts`
- `tests/isa-tax-wave2.test.ts`
- `tests/loan.test.ts`
- `tests/math.test.ts`
- `tests/maths-wave2.test.ts`
- `tests/pension-wave2.test.ts`
- `tests/pension.test.ts`
- `tests/personal.test.ts`
- `tests/property.test.ts`
- `tests/registry.test.ts`
- `tests/rules.test.ts`
- `tests/science-wave2.test.ts`
- `tests/statistics-wave2.test.ts`
- `tests/statistics.test.ts`
- `tests/tax-frequency.test.ts`
- `tests/technology-wave2.test.ts`
- `tests/utilities.test.ts`
