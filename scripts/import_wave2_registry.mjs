/**
 * Generate the Wave 2 registry from the canonical Master Calculator Registry.
 *
 * The spreadsheet is the authority for Wave 2 membership. This script derives
 * the registry file from it so membership can never drift from the canonical
 * source by hand-editing.
 *
 * Run: node scripts/import_wave2_registry.mjs <path-to-Master-Calculator-Registry.xlsx>
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const xlsx = process.argv[2];
if (!xlsx) { console.error('usage: import_wave2_registry.mjs <xlsx>'); process.exit(1); }

// Extract rows via python/openpyxl (already available in the toolchain).
const py = `
import openpyxl, json, sys
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
ws = wb['Calculator Registry']
rows = list(ws.iter_rows(values_only=True))
hdr = rows[0]
recs = [dict(zip(hdr, r)) for r in rows[1:] if r and r[0]]
print(json.dumps(recs, default=str))
`;
const recs = JSON.parse(execFileSync('python3', ['-c', py, xlsx], { maxBuffer: 64 * 1024 * 1024 }).toString());

const RISK = { 'Low': 'low', 'Medium': 'medium', 'High': 'high' };

const wave2 = recs
  .filter(r => r['Launch Wave'] === 'Wave 2')
  .map(r => ({
    id: r['Calculator ID'],
    name: r['Canonical Name'],
    slug: r['Slug'],
    category: r['Category'],
    subcategory: r['Subcategory'] || '',
    version: '1.0',
    // Everything starts planned/specified. A calculator only becomes
    // "verified" once engine, UI, benchmarks, tests and docs are all done.
    status: 'planned',
    launchWave: 'Wave 2',
    rulesSensitive: String(r['Rules-sensitive']).trim().toLowerCase() === 'yes',
    risk: RISK[String(r['Regulatory Risk']).trim()] ?? 'low',
    jurisdiction: r['Jurisdiction'] || 'UK/General',
    aliases: String(r['Aliases / Search Terms'] || '')
      .split(';').map(s => s.trim()).filter(Boolean),
    benchmarkCount: 0,
    specFile: `docs/specs/wave2/${r['Calculator ID']}.md`,
    implementationStatus: 'specified'
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const out = path.join('packages/calculator-registry/src/wave2-registry.json');
fs.writeFileSync(out, JSON.stringify(wave2, null, 2) + '\n');
console.log(`Wave 2 entries written: ${wave2.length} -> ${out}`);
const byCat = {};
for (const c of wave2) byCat[c.category] = (byCat[c.category] || 0) + 1;
console.log(JSON.stringify(byCat, null, 1));
