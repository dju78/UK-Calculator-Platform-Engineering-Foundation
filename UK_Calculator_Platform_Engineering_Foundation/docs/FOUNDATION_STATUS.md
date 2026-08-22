# Foundation engineering status

## Completed in this build
- 55-calculator Wave 1 registry imported from the approved project manifest.
- Duplicate ID/slug and benchmark-count validation.
- Canonical `calculate(calculatorId, inputs, context)` contract.
- Deterministic calculation handler registry.
- INV-002 Compound Interest Calculator implemented as the reference calculator.
- UK rules package with an explicit production gate: draft rules cannot be loaded as approved by default.
- Wave 1 benchmark fixtures copied into a machine-readable package.
- Automated tests for registry, rules governance, reference calculation and metadata.
- Benchmark runner that passes supported cases and reports unimplemented cases as skipped.
- Dependency-free reference web server and accessible Compound Interest UI.

## Next implementation tranche
1. Implement shared loan/amortisation module (FIN-001, PRO-001, PRO-003, PRO-004).
2. Implement investment time-value/returns family (INV-001, INV-003, INV-006, INV-007, INV-008, INV-009).
3. Promote UK rules only after second-person verification; then implement ISA/tax-sensitive calculators.
4. Add production Next.js application, design system components and search/category navigation.
5. Add CI workflow and browser accessibility/E2E tests once the production web framework is installed.
