# Annual Tax Year Update Runbook

## Overview
This runbook provides instructions on how to perform the annual update of the UK Rules Engine, adding support for the new tax year (e.g., transitioning from 2026/27 to 2027/28).

## Steps

### 1. Create a New Ruleset JSON
Create a new ruleset file in `packages/rules-uk/src/rulesets/`, for example `uk-2027-28-v1.json`.
Ensure it complies with `UKRuleset` type, containing:
- `ruleset_id`: The ID for the new ruleset
- `tax_year`: The new tax year (e.g., "2027/28")
- `status`: Set to "draft" initially
- Provenance details (`sources` array)

### 2. Add New Ruleset to Engine
Update `packages/rules-uk/src/index.ts` to import the new JSON and add it to the `rulesets` object.
```ts
import rawRules2728 from "./rulesets/uk-2027-28-v1.json" with { type: "json" };

const rulesets: Record<string, UKRuleset> = {
  [rawRules.ruleset_id]: rawRules as UKRuleset,
  [rawRules2728.ruleset_id]: rawRules2728 as UKRuleset
};
```

### 3. Review and Approval
Once the ruleset is thoroughly reviewed against official HMRC sources, change `status` to "approved".
Automated governance checks will prevent deployment of draft rulesets in production environments unless explicitly allowed via `allowDraft`.

### 4. Update References
If the system defaults to the latest tax year in any handlers or configurations, ensure that `context.taxYear` default fallbacks are updated to the current year.

### 5. Validate Platform
Run full platform validation tests:
```bash
npm run build
npm run test
npm run bench:reference
npm --workspace=web run test:e2e
```
