# ADR-001 — Runtime and package boundaries

**Status:** Accepted for foundation build  
**Date:** 22 August 2026

## Decision
Use dependency-light TypeScript packages for calculator registry, deterministic calculation engine, UK rules and test fixtures. Keep calculator arithmetic separate from the presentation layer. A small Node reference server proves the end-to-end contract without coupling the calculation engine to a web framework.

The production web application can be implemented in Next.js without changing the calculation contract.

## Consequences
- Core calculations can be tested independently of React/Next.js.
- Tax-sensitive handlers must request an explicit approved ruleset.
- The reference server is a validation harness, not the final production UI.
- Each additional calculator should add a handler and tests rather than create a new engine architecture.
