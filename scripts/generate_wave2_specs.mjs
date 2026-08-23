/**
 * Generate build-ready Wave 2 specifications.
 *
 * Specifications are DERIVED from the artefacts that actually govern the
 * calculator - the registry entry, the field definitions, the engine's real
 * outputs and the canonical benchmark cases - rather than written as prose
 * that can drift away from the code. Anything that cannot be derived
 * (purpose, scope, model boundary, methodology) comes from a hand-authored
 * notes file, so a specification is never silently auto-filled with
 * plausible-sounding but unverified claims.
 *
 * Run: node scripts/generate_wave2_specs.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/calculator-registry/src/wave2-registry.json'), 'utf8'));
const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/test-fixtures/fixtures/wave2-benchmarks.json'), 'utf8'));
const notesPath = path.join(ROOT, 'docs/specs/wave2/_notes.json');
const notes = fs.existsSync(notesPath) ? JSON.parse(fs.readFileSync(notesPath, 'utf8')) : {};

// Field definitions live in a TypeScript module; read them as text and pull out
// each calculator's field block. This keeps the generator dependency-free.
const fieldSource = fs.readFileSync(path.join(ROOT, 'apps/web/src/components/calculators/wave2FieldMappings.ts'), 'utf8');
function fieldsFor(id) {
  const keyAt = fieldSource.indexOf(`"${id}": [`);
  if (keyAt === -1) return [];
  const open = fieldSource.indexOf('[', keyAt);
  let arrayDepth = 0, end = open;
  for (let i = open; i < fieldSource.length; i++) {
    if (fieldSource[i] === '[') arrayDepth++;
    else if (fieldSource[i] === ']') { arrayDepth--; if (arrayDepth === 0) { end = i; break; } }
  }
  const block = fieldSource.slice(open + 1, end);
  // Split into field objects by brace depth while ignoring braces that appear
  // inside string literals - several defaults are JSON payloads containing {}.
  const objects = [];
  let depth = 0, objStart = -1, quote = null;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (quote) { if (ch === quote && block[i - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') { if (depth === 0) objStart = i; depth++; }
    else if (ch === '}') { depth--; if (depth === 0 && objStart !== -1) { objects.push(block.slice(objStart, i + 1)); objStart = -1; } }
  }
  return objects.map(t => {
    const get = (k) => {
      const m = t.match(new RegExp(`${k}:\\s*"([^"]*)"`)) || t.match(new RegExp(`${k}:\\s*'([^']*)'`));
      return m ? m[1] : undefined;
    };
    const getRaw = (k) => (t.match(new RegExp(`${k}:\\s*([^,}]+)`)) || [])[1];
    return {
      name: get('name'),
      label: get('label'),
      type: get('type') || 'number',
      defaultValue: (getRaw('defaultValue') || '').trim(),
      helperText: get('helperText') || ''
    };
  }).filter(f => f.name);
}

const outDir = path.join(ROOT, 'docs/specs/wave2');
fs.mkdirSync(outDir, { recursive: true });

let written = 0, skipped = 0;
for (const calc of registry) {
  const cases = benchmarks[calc.id];
  const fields = fieldsFor(calc.id);
  // Only generate a specification for a calculator that actually has
  // implementation evidence. A spec for an unbuilt calculator would be
  // aspiration, not specification.
  if (!cases || cases.length === 0 || fields.length === 0) { skipped++; continue; }

  const note = notes[calc.id] ?? {};
  const outputKeys = [...new Set(cases.flatMap(c => Object.keys(c.expected)))];

  const md = `# ${calc.id} - ${calc.name}

> Generated from the registry, field definitions and canonical benchmarks by
> \`scripts/generate_wave2_specs.mjs\`. Do not hand-edit: change the source
> artefacts and regenerate, so the specification cannot drift from the code.

## Identity

| Field | Value |
|---|---|
| ID | \`${calc.id}\` |
| Name | ${calc.name} |
| Category | ${calc.category} |
| Subcategory | ${calc.subcategory || '-'} |
| Launch wave | ${calc.launchWave} |
| Jurisdiction | ${calc.jurisdiction ?? 'UK/General'} |
| Regulatory risk | ${calc.risk} |
| Rules-sensitive | ${calc.rulesSensitive ? 'Yes' : 'No'} |
| Canonical route | \`/calculators/${calc.slug}\` |
| Status | ${calc.status} |
| Implementation status | ${calc.implementationStatus} |
| Benchmark cases | ${cases.length} |

## Purpose

${note.purpose ?? '_Not yet authored._'}

## Scope

${note.scope ?? '_Not yet authored._'}

## Assumptions

${(note.assumptions ?? []).map(a => `- ${a}`).join('\n') || '_Not yet authored._'}

## Inputs

| Name | Label | Type | Default | Units / notes |
|---|---|---|---|---|
${fields.map(f => `| \`${f.name}\` | ${f.label} | ${f.type} | ${f.defaultValue || '-'} | ${f.helperText || '-'} |`).join('\n')}

Percentages are entered as human percentages (5 means 5%) and normalised once
inside the engine.

## Validation

Enforced centrally at the engine boundary and by the shared validation module:

- Any non-finite input is rejected with a readable message.
- Any non-finite output is rejected rather than returned, so \`NaN\` and
  \`Infinity\` can never reach a user.
- Terms are bounded (maximum 150 years) and monetary amounts capped, so no
  input can spin an amortisation loop indefinitely.
${(note.validation ?? []).map(v => `- ${v}`).join('\n')}

## Formula and logic

${note.formula ?? '_Not yet authored._'}

## Outputs

${outputKeys.map(k => `- \`${k}\``).join('\n')}

Formatting is decided by the central registry in
\`apps/web/src/components/calculators/outputFormats.ts\`, per calculator and per
key, so ratios render as percentages and money as \`£1,234.56\`.

## Edge cases covered by benchmarks

${cases.map(c => `- **${c.scenario}** - ${JSON.stringify(c.inputs)}`).join('\n')}

## Rules and source dependencies

${calc.rulesSensitive
  ? (note.rules ?? '_Rules-sensitive: statutory values must come from the versioned UK Rules Engine. Sources not yet recorded._')
  : 'Not rules-sensitive. No statutory values are used.'}

## Product boundary

${note.boundary ?? '_Not yet authored._'}

## Methodology

${note.methodology ?? '_Not yet authored._'}

## Related calculators

${(note.related ?? []).map(r => `- ${r}`).join('\n') || '_None recorded._'}

## SEO metadata

- Title: \`${calc.name} | UK Calculator Platform\`
- Description: generated per calculator by \`apps/web/src/lib/site.ts\`
- Canonical: \`/calculators/${calc.slug}\`
- Structured data: \`WebApplication\`

## Definition of Done

- [${cases.length >= 5 ? 'x' : ' '}] At least five independently derived benchmark cases (${cases.length})
- [${fields.length > 0 ? 'x' : ' '}] UI field definitions registered
- [${calc.implementationStatus === 'implemented' ? 'x' : ' '}] Engine handler implemented
- [${calc.status === 'verified' ? 'x' : ' '}] Registry status verified
- [${note.purpose ? 'x' : ' '}] Narrative sections authored
`;

  fs.writeFileSync(path.join(outDir, `${calc.id}.md`), md);
  written++;
}

console.log(`Specifications written: ${written}`);
console.log(`Skipped (no implementation evidence yet): ${skipped}`);
