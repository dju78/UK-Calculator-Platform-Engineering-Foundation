# UK Calculator Platform — Engineering Foundation

This repository is the first executable engineering layer beneath the project artefact pack.

## What is included
- **55-calculator Wave 1 registry** generated from the project manifest.
- **Calculation engine** with a stable result contract and handler registry.
- **INV-002 Compound Interest Calculator** implemented end-to-end.
- **UK rules package** carrying the current project ruleset as `draft_second_review`, with a hard production gate.
- **275 Wave 1 benchmark fixtures** preserved; the reference runner executes the five cases for the implemented calculator and skips the rest until handlers are added.
- **Reference web server/UI** using only Node built-ins, so the calculation contract can be demonstrated before the production Next.js dependency layer is installed.

## Commands
```bash
npm run build
npm test
npm run bench:reference
npm run serve:reference
```
Then open `http://localhost:3000`.

## Reference calculator contract
```ts
calculate(calculatorId, inputs, context)
```
returns calculator/version metadata, inputs, outputs, warnings, assumptions, engine version, ruleset ID where applicable and calculation timestamp.

## Governance rule
The included 2026/27 UK ruleset is intentionally marked `draft_second_review`. `getUKRuleset()` rejects it for production by default. Development code must pass `{ allowDraft: true }` explicitly until the ruleset is independently approved.

## Production path
The next step is not to duplicate the arithmetic in page components. The production Next.js app should call the same calculation engine and render the registry-driven input/output schema.
