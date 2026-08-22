const fs = require('fs');
const file = 'packages/calculation-engine/src/finance/tax/handlers.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/getUKRuleset/g, 'resolveRules');
content = content.replace(/resolveRules\(context\.rulesetId \|\| "uk-2026-27-v1"\)/g, 'resolveRules({ taxYear: context.taxYear || "2026/27" })');
content = content.replace(/import { resolveRules } from "\.\.\/\.\.\/\.\.\/\.\.\/rules-uk\/src\/index\.js";/g, 'import { resolveRules } from "../../../../rules-uk/src/index.js";'); // Fix import if needed.

fs.writeFileSync(file, content);
