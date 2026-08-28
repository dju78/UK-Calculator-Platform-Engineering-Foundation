#!/usr/bin/env node

/**
 * IndexNow Submission Utility for UK Calculator Platform
 *
 * Submits newly added, updated, or deleted public URLs to IndexNow search
 * engines (Bing, Yandex, Naver, Seznam, etc.) following the official IndexNow protocol.
 *
 * Official endpoint: https://api.indexnow.org/indexnow
 * Protocol spec: https://www.indexnow.org/documentation
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANONICAL_HOST = 'ukcalc.jomovate.com';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Disallowed URL path prefixes to protect private, embed, internal, and non-canonical routes.
 */
export const DISALLOWED_PATH_PREFIXES = [
  '/embed/',
  '/_not-found',
  '/_next/',
  '/api/',
];

/**
 * Validates a single URL against strict security and canonical constraints.
 *
 * Rules:
 * 1. Must be a valid well-formed URL.
 * 2. Protocol must strictly be HTTPS.
 * 3. Host must strictly match ukcalc.jomovate.com (no dev/preview/vercel.app/external domains).
 * 4. Must not contain query parameters (prevents leaking calculator inputs or state).
 * 5. Must not contain hash fragments.
 * 6. Must not point to disallowed routes (/embed/, /api/, /_next/, /_not-found).
 *
 * @param {string} rawUrl - The URL to validate.
 * @returns {{ valid: boolean; normalized?: string; error?: string }}
 */
export function validateUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: `Invalid URL format: "${rawUrl}"` };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: `Protocol must be "https:", received "${parsed.protocol}" for "${rawUrl}"`,
    };
  }

  if (parsed.hostname.toLowerCase() !== CANONICAL_HOST) {
    return {
      valid: false,
      error: `Host must strictly match "${CANONICAL_HOST}", rejected host "${parsed.hostname}" for "${rawUrl}"`,
    };
  }

  if (parsed.search && parsed.search.length > 0) {
    return {
      valid: false,
      error: `URL must not contain query parameters (privacy safeguard against leaking inputs): "${rawUrl}"`,
    };
  }

  if (parsed.hash && parsed.hash.length > 0) {
    return {
      valid: false,
      error: `URL must not contain hash fragments: "${rawUrl}"`,
    };
  }

  const pathname = parsed.pathname;
  for (const prefix of DISALLOWED_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return {
        valid: false,
        error: `Disallowed path prefix "${prefix}" in "${rawUrl}". Embed/private routes must never be submitted.`,
      };
    }
  }

  // Canonicalize URL: lowercase origin, clean pathname
  const normalized = `https://${CANONICAL_HOST}${pathname}`;
  return { valid: true, normalized };
}

/**
 * Deduplicates and validates an array of URLs.
 *
 * @param {string[]} urls - Array of candidate URLs.
 * @returns {{ validUrls: string[]; errors: string[] }}
 */
export function sanitizeUrlList(urls) {
  const validSet = new Set();
  const errors = [];

  for (const candidate of urls) {
    const result = validateUrl(candidate);
    if (result.valid && result.normalized) {
      validSet.add(result.normalized);
    } else {
      errors.push(result.error || `Invalid URL: ${candidate}`);
    }
  }

  return {
    validUrls: Array.from(validSet),
    errors,
  };
}

/**
 * Mask sensitive key string for safe logging.
 *
 * @param {string} key
 * @returns {string}
 */
export function maskKey(key) {
  if (!key || typeof key !== 'string') return '[empty]';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Resolves the IndexNow verification key from:
 * 1. Explicit CLI argument (--key <key>)
 * 2. Environment variable (INDEXNOW_KEY)
 * 3. Static verification file in apps/web/public/<key>.txt
 *
 * @param {string} [cliKey]
 * @param {string} [publicDir]
 * @returns {{ key: string | null; keyLocation: string | null; source: string }}
 */
export function resolveIndexNowKey(cliKey, publicDir) {
  if (cliKey && cliKey.trim()) {
    const trimmed = cliKey.trim();
    return {
      key: trimmed,
      keyLocation: `https://${CANONICAL_HOST}/${trimmed}.txt`,
      source: 'cli',
    };
  }

  if (process.env.INDEXNOW_KEY && process.env.INDEXNOW_KEY.trim()) {
    const trimmed = process.env.INDEXNOW_KEY.trim();
    return {
      key: trimmed,
      keyLocation: `https://${CANONICAL_HOST}/${trimmed}.txt`,
      source: 'env',
    };
  }

  const searchDir = publicDir || join(process.cwd(), 'apps', 'web', 'public');
  if (existsSync(searchDir)) {
    try {
      const files = readdirSync(searchDir);
      for (const file of files) {
        if (file.endsWith('.txt') && !file.startsWith('robots') && file.length >= 12) {
          const keyCandidate = basename(file, '.txt');
          const content = readFileSync(join(searchDir, file), 'utf8').trim();
          if (content === keyCandidate) {
            return {
              key: keyCandidate,
              keyLocation: `https://${CANONICAL_HOST}/${file}`,
              source: `file:${file}`,
            };
          }
        }
      }
    } catch {
      // Ignore file reading errors
    }
  }

  return { key: null, keyLocation: null, source: 'none' };
}

/**
 * Constructs the standard IndexNow JSON payload.
 *
 * @param {object} params
 * @param {string} params.host
 * @param {string} params.key
 * @param {string} params.keyLocation
 * @param {string[]} params.urlList
 * @returns {object}
 */
export function buildIndexNowPayload({ host = CANONICAL_HOST, key, keyLocation, urlList }) {
  if (!key) {
    throw new Error('IndexNow key is required.');
  }
  if (!Array.isArray(urlList) || urlList.length === 0) {
    throw new Error('At least one URL must be provided in urlList.');
  }

  return {
    host,
    key,
    keyLocation: keyLocation || `https://${host}/${key}.txt`,
    urlList,
  };
}

/**
 * Submits the JSON payload to the official IndexNow endpoint.
 *
 * @param {object} payload
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {string} [options.endpoint]
 * @returns {Promise<{ status: number; ok: boolean; message: string }>}
 */
export async function submitToIndexNow(payload, options = {}) {
  const fetcher = options.fetchImpl || globalThis.fetch;
  const endpoint = options.endpoint || INDEXNOW_ENDPOINT;

  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'UK-Calculator-Platform-IndexNow/1.0',
    },
    body: JSON.stringify(payload),
  });

  const status = response.status;
  let statusExplanation = '';

  switch (status) {
    case 200:
      statusExplanation = 'OK (URLs submitted and accepted)';
      break;
    case 202:
      statusExplanation = 'Accepted (URLs received, key verification pending)';
      break;
    case 400:
      statusExplanation = 'Bad Request (Invalid payload format or malformed URL)';
      break;
    case 403:
      statusExplanation = 'Forbidden (IndexNow key not valid or key verification file unreachable)';
      break;
    case 422:
      statusExplanation = 'Unprocessable Entity (URLs do not belong to host or key mismatch)';
      break;
    case 429:
      statusExplanation = 'Too Many Requests (Rate limit exceeded)';
      break;
    default:
      statusExplanation = `HTTP status ${status}`;
      break;
  }

  return {
    status,
    ok: status === 200 || status === 202,
    message: statusExplanation,
  };
}

/**
 * Parses CLI arguments.
 *
 * @param {string[]} argv
 * @returns {{ urls: string[]; key?: string; dryRun: boolean; help: boolean }}
 */
export function parseArgs(argv) {
  const urls = [];
  let key;
  let dryRun = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--key' || arg === '-k') {
      key = argv[++i];
    } else if (arg.startsWith('--key=')) {
      key = arg.slice(6);
    } else if (!arg.startsWith('-')) {
      urls.push(arg);
    }
  }

  return { urls, key, dryRun, help };
}

/**
 * Main CLI runner.
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (args.urls.length === 0 && !args.dryRun)) {
    console.log(`
IndexNow Submission Tool - UK Calculator Platform

Usage:
  npm run indexnow -- <url1> [url2] [url3...] [options]
  node scripts/indexnow-submit.mjs <url1> [url2...] [options]

Options:
  --key, -k <key>   Specify IndexNow key (defaults to INDEXNOW_KEY env or apps/web/public/<key>.txt)
  --dry-run         Validate URLs and show JSON payload without submitting
  --help, -h        Show this help message

Examples:
  npm run indexnow -- https://ukcalc.jomovate.com/
  npm run indexnow -- https://ukcalc.jomovate.com/calculators/loan-calculator --dry-run
`);
    if (args.urls.length === 0 && !args.help) {
      process.exit(1);
    }
    process.exit(0);
  }

  console.log('IndexNow Submission Tool');
  console.log('========================');

  const { validUrls, errors } = sanitizeUrlList(args.urls);

  if (errors.length > 0) {
    console.error('\nValidation Errors:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('\nSubmission aborted due to validation errors.');
    process.exit(1);
  }

  if (validUrls.length === 0) {
    console.error('\nNo valid URLs provided.');
    process.exit(1);
  }

  const { key, keyLocation, source } = resolveIndexNowKey(args.key);

  if (!key) {
    console.error('\nError: IndexNow key not found.');
    console.error('Provide the key via:');
    console.error('  1. CLI argument: --key <key>');
    console.error('  2. Environment variable: INDEXNOW_KEY=<key>');
    console.error('  3. Public verification file: apps/web/public/<key>.txt');
    process.exit(1);
  }

  console.log(`\nKey source: ${source} (Key: ${maskKey(key)})`);
  console.log(`Key location: ${keyLocation}`);
  console.log(`URLs to submit (${validUrls.length}):`);
  for (const u of validUrls) {
    console.log(`  - ${u}`);
  }

  const payload = buildIndexNowPayload({
    host: CANONICAL_HOST,
    key,
    keyLocation,
    urlList: validUrls,
  });

  if (args.dryRun) {
    console.log('\n[DRY RUN] Payload generated successfully:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\nDry run complete. No network requests sent.');
    process.exit(0);
  }

  console.log(`\nSubmitting ${validUrls.length} URL(s) to ${INDEXNOW_ENDPOINT}...`);

  try {
    const result = await submitToIndexNow(payload);
    console.log(`Response: ${result.status} - ${result.message}`);

    if (result.ok) {
      console.log('\n✓ Successfully submitted to IndexNow.');
      process.exit(0);
    } else {
      console.error(`\n✗ IndexNow submission failed with HTTP status ${result.status}: ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n✗ Network error submitting to IndexNow: ${error.message}`);
    process.exit(1);
  }
}

// Execute main if invoked directly from CLI
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1] === currentFile || basename(process.argv[1]) === basename(currentFile))) {
  main();
}
