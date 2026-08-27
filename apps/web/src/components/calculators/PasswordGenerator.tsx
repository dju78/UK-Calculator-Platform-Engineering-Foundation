"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

/**
 * TEC-005 Password Generator.
 *
 * SECURITY PROPERTIES, WHICH ARE THE POINT OF THIS COMPONENT:
 *
 *  1. The password is generated ENTIRELY IN THE BROWSER. There is no fetch, no
 *     form post, no analytics call and no server action anywhere in this file.
 *  2. Randomness comes from `crypto.getRandomValues`, the Web Crypto API, which
 *     is backed by the operating system's cryptographic random source.
 *     `Math.random` is NEVER used: it is a fast non-cryptographic generator
 *     whose output is predictable from a handful of samples, and a password
 *     built on it is not a secret.
 *  3. The password is NEVER logged. There is no console call in this file, and
 *     it is held only in React state for as long as the page is open.
 *  4. The password is NEVER persisted. No localStorage, no sessionStorage, no
 *     cookie, no IndexedDB.
 *
 * The engine-backed calculator alongside this component computes the STRENGTH
 * arithmetic from the character set size and length. It never receives the
 * password itself, because it does not need to and because sending it would
 * defeat every property above.
 */

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?/~`";

// Characters that are hard to tell apart in common fonts.
const AMBIGUOUS = new Set(["I", "O", "l", "0", "1"]);

function poolFor(opts: {
  upper: boolean; lower: boolean; digits: boolean; symbols: boolean; excludeAmbiguous: boolean;
}): string {
  let pool = "";
  if (opts.upper) pool += UPPER;
  if (opts.lower) pool += LOWER;
  if (opts.digits) pool += DIGITS;
  if (opts.symbols) pool += SYMBOLS;
  if (opts.excludeAmbiguous) {
    pool = pool.split("").filter(c => !AMBIGUOUS.has(c)).join("");
  }
  return pool;
}

/**
 * A uniformly distributed index into a pool, by REJECTION SAMPLING.
 *
 * Taking a random byte modulo the pool size is the obvious approach and it is
 * biased: 256 does not divide by 62, so the first few characters of the
 * alphabet come up more often than the rest. The bias is small but it is real,
 * it is measurable, and it reduces the effective entropy below the figure the
 * strength calculator reports. Discarding the values in the incomplete final
 * block removes it entirely, at the cost of an occasional extra draw.
 */
function uniformIndex(poolSize: number): number {
  const limit = Math.floor(256 / poolSize) * poolSize;
  const buffer = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % poolSize;
  }
}

export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setCopied(false);
    const pool = poolFor({ upper, lower, digits, symbols, excludeAmbiguous });
    if (pool.length === 0) {
      setError("Choose at least one kind of character. With every category switched off there is nothing to build a password from.");
      setPassword("");
      return;
    }
    if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
      // Refusing is the only safe response. Falling back to Math.random would
      // produce something that LOOKS like a password and is not a secret.
      setError("This browser does not provide a cryptographic random number source, so a password cannot be generated safely here. Nothing has been produced; please use an up-to-date browser.");
      setPassword("");
      return;
    }
    setError("");
    let out = "";
    for (let i = 0; i < length; i++) {
      out += pool[uniformIndex(pool.length)];
    }
    setPassword(out);
  };

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("The browser would not allow copying to the clipboard. Select the password and copy it manually.");
    }
  };

  const checkboxes: Array<[string, boolean, (v: boolean) => void, string]> = [
    ["Uppercase letters", upper, setUpper, "gen-upper"],
    ["Lowercase letters", lower, setLower, "gen-lower"],
    ["Digits", digits, setDigits, "gen-digits"],
    ["Symbols", symbols, setSymbols, "gen-symbols"],
    ["Exclude look-alike characters (I, O, l, 0, 1)", excludeAmbiguous, setExcludeAmbiguous, "gen-ambiguous"]
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Generate a password</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">
          This runs entirely in your browser, using your device&apos;s cryptographic
          random number source. The password is not sent anywhere, not logged and
          not saved. Close the page and it is gone.
        </p>

        <div className="mb-4">
          <label htmlFor="gen-length" className="block text-sm font-medium mb-1">
            Length
          </label>
          <input
            id="gen-length"
            name="gen_length"
            type="number"
            min={4}
            max={128}
            value={length}
            onChange={e => setLength(Math.max(4, Math.min(128, Number(e.target.value) || 4)))}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <fieldset className="mb-4">
          <legend className="text-sm font-semibold text-slate-900 mb-2">Include</legend>
          {checkboxes.map(([label, value, setter, id]) => (
            <div key={id} className="flex items-center gap-2 mb-1.5">
              <input
                id={id}
                type="checkbox"
                checked={value}
                onChange={e => setter(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor={id} className="text-sm text-slate-700">{label}</label>
            </div>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={generate}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          Generate password
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700 font-medium">{error}</p>
        )}

        {password && !error && (
          <div className="mt-4">
            <label htmlFor="generated-password" className="block text-sm font-semibold text-slate-900 mb-1">
              Your password
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                id="generated-password"
                readOnly
                value={password}
                // A password field would hide it from the person who just asked
                // to see it, and autocomplete must never offer to save this.
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm shadow-2xs"
              />
              <button
                type="button"
                onClick={copy}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {copied ? "Password copied to the clipboard." : ""}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Use the strength calculator below to see what this length and
              character set is worth, then store the password in a password
              manager rather than reusing it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
