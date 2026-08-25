/**
 * Wave 2 tranche 2Q, Technology & Digital.
 *
 * The password generator's tests are unusual and deliberately so. Its security
 * properties are claims about what the code DOES NOT DO: it must not transmit
 * the password, must not log it, must not persist it, and must not use a
 * non-cryptographic random source. Those are not observable from an output, so
 * they are asserted against the SOURCE of the component itself. A test that
 * reads the file is the only kind that can catch a `fetch` added later.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculate } from "../packages/calculation-engine/src/engine.js";

const CTX = { taxYear: "2026/27" };

function closeTo(actual: number, expected: number, tol = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected} +/- ${tol}, got ${actual}`);
}

async function run(id: string, inputs: Record<string, unknown>) {
  return calculate(id, inputs as never, CTX);
}

async function throwsWith(id: string, inputs: Record<string, unknown>, fragment: string) {
  await assert.rejects(
    () => run(id, inputs),
    (err: Error) => {
      assert.ok(
        err.message.toLowerCase().includes(fragment.toLowerCase()),
        `expected a message containing "${fragment}", got "${err.message}"`
      );
      return true;
    }
  );
}

// ---------------------------------------------------------------------------
// TEC-001 Subnets
// ---------------------------------------------------------------------------

test("an address above 127 is handled correctly, where signed 32-bit arithmetic breaks", async () => {
  // Anything from 128.0.0.0 upwards has the top bit set. A calculator built on
  // JavaScript's bitwise operators returns a negative number here, and prints
  // an address like -1062731774.
  for (const addr of ["128.0.0.1", "192.168.1.130", "200.200.200.200", "255.255.255.254"]) {
    const r = await run("TEC-001", { address: addr, prefix_length: 24 });
    for (const key of ["network_address", "broadcast_address", "subnet_mask"]) {
      const value = r.outputs[key] as string;
      assert.ok(
        /^\d+\.\d+\.\d+\.\d+$/.test(value),
        `${key} for ${addr} was "${value}", which is not a dotted quad`
      );
      for (const octet of value.split(".")) {
        const n = Number(octet);
        assert.ok(n >= 0 && n <= 255, `${key} for ${addr} has an octet out of range: ${octet}`);
      }
    }
  }
});

test("the usable host count is total minus two, except where it is not", async () => {
  const cases: Array<[number, number, number]> = [
    // [prefix, total addresses, usable hosts]
    [24, 256, 254],
    [26, 64, 62],
    [30, 4, 2],
    [31, 2, 0],   // point-to-point, no broadcast, so the rule does not apply
    [32, 1, 0]    // a single host
  ];
  for (const [prefix, total, usable] of cases) {
    const r = await run("TEC-001", { address: "10.0.0.1", prefix_length: prefix });
    assert.strictEqual(r.outputs.total_addresses, total, `/${prefix} total`);
    assert.strictEqual(r.outputs.usable_hosts, usable, `/${prefix} usable`);
    assert.ok(
      (r.outputs.usable_hosts as number) >= 0,
      "a negative host count is the classic subnet calculator bug and must never appear"
    );
  }
});

test("a /31 and a /32 explain themselves rather than reporting a bare zero", async () => {
  for (const prefix of [31, 32]) {
    const r = await run("TEC-001", { address: "10.0.0.1", prefix_length: prefix });
    assert.ok(
      (r.warnings ?? []).length > 0,
      `/${prefix} must explain why the ordinary host count does not apply`
    );
    assert.strictEqual(r.outputs.first_usable_host, null);
    assert.strictEqual(r.outputs.last_usable_host, null);
  }
});

test("the network address is the address with its host bits cleared", async () => {
  const r = await run("TEC-001", { address: "192.168.1.130", prefix_length: 26 });
  assert.strictEqual(r.outputs.network_address, "192.168.1.128");
  assert.strictEqual(r.outputs.broadcast_address, "192.168.1.191");
  assert.strictEqual(r.outputs.first_usable_host, "192.168.1.129");
  assert.strictEqual(r.outputs.last_usable_host, "192.168.1.190");
  assert.strictEqual(r.outputs.subnet_mask, "255.255.255.192");
  assert.strictEqual(r.outputs.wildcard_mask, "0.0.0.63");
});

test("the private ranges are recognised and public addresses are not", async () => {
  for (const addr of ["10.1.2.3", "172.16.0.1", "172.31.255.254", "192.168.0.1", "127.0.0.1"]) {
    const r = await run("TEC-001", { address: addr, prefix_length: 24 });
    assert.strictEqual(r.outputs.is_private, true, `${addr} is a private address`);
  }
  for (const addr of ["8.8.8.8", "172.32.0.1", "192.169.0.1", "1.1.1.1"]) {
    const r = await run("TEC-001", { address: addr, prefix_length: 24 });
    assert.strictEqual(r.outputs.is_private, false, `${addr} is a public address`);
  }
});

test("a malformed address is refused with a useful message", async () => {
  await throwsWith("TEC-001", { address: "192.168.1", prefix_length: 24 }, "four numbers separated by dots");
  await throwsWith("TEC-001", { address: "192.168.1.256", prefix_length: 24 }, "too large");
  await throwsWith("TEC-001", { address: "192.168.1.x", prefix_length: 24 }, "not a whole number");
  await throwsWith("TEC-001", { address: "192.168.1.1", prefix_length: 33 }, "from 0 to 32");
});

// ---------------------------------------------------------------------------
// TEC-002 Bandwidth
// ---------------------------------------------------------------------------

test("bits and bytes differ by exactly eight, which is the whole point", async () => {
  // 1 gigabyte over 100 megabits a second: 8,000 megabits at 100 = 80 seconds.
  const r = await run("TEC-002", {
    file_size: 1, size_unit: "gigabyte", speed_mbps: 100, overhead_pct: 0
  });
  closeTo(r.outputs.transfer_seconds as number, 80, 1e-9);
  closeTo(r.outputs.speed_mb_per_second as number, 12.5, 1e-9);
});

test("decimal and binary units differ by about seven per cent, which is why a 1 TB drive shows as 931 GB", async () => {
  const decimal = await run("TEC-002", {
    file_size: 1, size_unit: "terabyte", speed_mbps: 100, overhead_pct: 0
  });
  const binary = await run("TEC-002", {
    file_size: 1, size_unit: "tebibyte", speed_mbps: 100, overhead_pct: 0
  });
  const ratio = (binary.outputs.transfer_seconds as number) / (decimal.outputs.transfer_seconds as number);
  closeTo(ratio, 1099511627776 / 1e12, 1e-9);
  assert.ok(ratio > 1.09 && ratio < 1.10, "a tebibyte is about ten per cent larger than a terabyte");
});

test("overhead lengthens a transfer proportionally", async () => {
  const clean = await run("TEC-002", {
    file_size: 5, size_unit: "gigabyte", speed_mbps: 500, overhead_pct: 0
  });
  const real = await run("TEC-002", {
    file_size: 5, size_unit: "gigabyte", speed_mbps: 500, overhead_pct: 20
  });
  closeTo(
    (real.outputs.transfer_seconds as number) / (clean.outputs.transfer_seconds as number),
    1 / 0.8,
    1e-9
  );
});

// ---------------------------------------------------------------------------
// TEC-003 Base64
// ---------------------------------------------------------------------------

test("Base64 round-trips, including non-ASCII text", async () => {
  for (const text of ["Hello, world!", "Hello, wörld!", "a", "ab", "abc", "日本語のテキスト", "€100 & 50%"]) {
    const encoded = await run("TEC-003", { direction: "encode", text, url_safe: "false" });
    const decoded = await run("TEC-003", { direction: "decode", text: encoded.outputs.output });
    assert.strictEqual(decoded.outputs.output, text, `round trip failed for "${text}"`);
  }
});

test("padding appears exactly where the byte count requires it", async () => {
  const one = await run("TEC-003", { direction: "encode", text: "a", url_safe: "false" });
  const two = await run("TEC-003", { direction: "encode", text: "ab", url_safe: "false" });
  const three = await run("TEC-003", { direction: "encode", text: "abc", url_safe: "false" });
  assert.strictEqual(one.outputs.padding_characters, 2);
  assert.strictEqual(two.outputs.padding_characters, 1);
  assert.strictEqual(three.outputs.padding_characters, 0);
  assert.strictEqual(one.outputs.output, "YQ==");
  assert.strictEqual(three.outputs.output, "YWJj");
});

test("Base64 makes data about a third larger", async () => {
  const r = await run("TEC-003", {
    direction: "encode", text: "The quick brown fox jumps over the lazy dog", url_safe: "false"
  });
  const pct = r.outputs.size_change_pct as number;
  assert.ok(pct > 30 && pct < 40, `expected roughly a third larger, got ${pct}%`);
});

test("the URL-safe alphabet round-trips despite substituted characters and stripped padding", async () => {
  const text = "subjects?_d=1&x=~";
  const encoded = await run("TEC-003", { direction: "encode", text, url_safe: "true" });
  const out = encoded.outputs.output as string;
  assert.ok(!out.includes("+") && !out.includes("/") && !out.includes("="),
    "the URL-safe alphabet must contain none of plus, slash or equals");
  const decoded = await run("TEC-003", { direction: "decode", text: out });
  assert.strictEqual(decoded.outputs.output, text);
});

test("invalid Base64 is refused by naming the offending character", async () => {
  await throwsWith("TEC-003", { direction: "decode", text: "not valid base64!!" }, "is not a Base64 character");
});

// ---------------------------------------------------------------------------
// TEC-004 URL encoding
// ---------------------------------------------------------------------------

test("the two encoding modes give DIFFERENT answers for the same structural characters", async () => {
  const text = "a=1&b=2";
  const component = await run("TEC-004", { direction: "encode", text, mode: "component" });
  const fullUrl = await run("TEC-004", { direction: "encode", text, mode: "full_url" });

  assert.ok((component.outputs.output as string).includes("%26"), "a value must escape the ampersand");
  assert.ok((component.outputs.output as string).includes("%3D"), "a value must escape the equals sign");
  assert.ok(!(fullUrl.outputs.output as string).includes("%26"), "a whole URL must keep its ampersand");
  assert.notStrictEqual(component.outputs.output, fullUrl.outputs.output);
});

test("a hash in a value is escaped, because otherwise everything after it is lost", async () => {
  const r = await run("TEC-004", { direction: "encode", text: "colour#ff0000", mode: "component" });
  assert.ok((r.outputs.output as string).includes("%23"));
});

test("URL encoding round-trips in both modes", async () => {
  for (const mode of ["component", "full_url"]) {
    for (const text of ["a=1&b=2 c", "café", "already-safe_value.123"]) {
      const encoded = await run("TEC-004", { direction: "encode", text, mode });
      const decoded = await run("TEC-004", { direction: "decode", text: encoded.outputs.output, mode });
      assert.strictEqual(decoded.outputs.output, text, `round trip failed for "${text}" in ${mode} mode`);
    }
  }
});

test("malformed percent-encoding is refused with the reason", async () => {
  await throwsWith("TEC-004", { direction: "decode", text: "100%", mode: "component" }, "two hexadecimal digits");
});

// ---------------------------------------------------------------------------
// TEC-005 strength arithmetic
// ---------------------------------------------------------------------------

test("the engine handler never returns anything resembling a password", async () => {
  const r = await run("TEC-005", {
    length: 20, include_uppercase: "true", include_lowercase: "true",
    include_digits: "true", include_symbols: "true", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  const keys = Object.keys(r.outputs);
  for (const forbidden of ["password", "generated", "secret", "value", "output"]) {
    assert.ok(
      !keys.includes(forbidden),
      `the strength handler must not carry a "${forbidden}" output; generation is browser-only`
    );
  }
});

test("length buys more entropy than complexity does", async () => {
  // Forty lowercase letters against twenty characters of everything.
  const longSimple = await run("TEC-005", {
    length: 40, include_uppercase: "false", include_lowercase: "true",
    include_digits: "false", include_symbols: "false", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  const shortComplex = await run("TEC-005", {
    length: 20, include_uppercase: "true", include_lowercase: "true",
    include_digits: "true", include_symbols: "true", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  assert.ok(
    (longSimple.outputs.entropy_bits as number) > (shortComplex.outputs.entropy_bits as number),
    "forty lowercase letters must beat twenty characters of the full set"
  );
});

test("entropy is exactly length times log2 of the alphabet", async () => {
  const r = await run("TEC-005", {
    length: 12, include_uppercase: "true", include_lowercase: "true",
    include_digits: "true", include_symbols: "false", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  assert.strictEqual(r.outputs.character_set_size, 62);
  closeTo(r.outputs.entropy_bits as number, 12 * Math.log2(62), 1e-6);
});

test("excluding look-alike characters shrinks the alphabet and the entropy with it", async () => {
  const full = await run("TEC-005", {
    length: 16, include_uppercase: "true", include_lowercase: "true",
    include_digits: "true", include_symbols: "false", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  const trimmed = await run("TEC-005", {
    length: 16, include_uppercase: "true", include_lowercase: "true",
    include_digits: "true", include_symbols: "false", exclude_ambiguous: "true",
    guesses_per_second: 1e12
  });
  assert.strictEqual(full.outputs.character_set_size, 62);
  assert.strictEqual(trimmed.outputs.character_set_size, 57);
  assert.ok((trimmed.outputs.entropy_bits as number) < (full.outputs.entropy_bits as number));
});

test("a weak password is labelled weak, not flattered", async () => {
  const weak = await run("TEC-005", {
    length: 8, include_uppercase: "false", include_lowercase: "true",
    include_digits: "false", include_symbols: "false", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  // 37.6 bits falls in under a second to an offline attack, so any label
  // suggesting it is adequate would be misleading.
  assert.strictEqual(weak.outputs.strength_label, "Very weak");
  assert.strictEqual(weak.outputs.meets_ncsc_three_words_equivalent, false);
  assert.ok((weak.warnings ?? []).some(w => /add length/i.test(w)));
});

test("an enormous keyspace returns null rather than an infinite crack time", async () => {
  const r = await run("TEC-005", {
    length: 200, include_uppercase: "true", include_lowercase: "true",
    include_digits: "true", include_symbols: "true", exclude_ambiguous: "false",
    guesses_per_second: 1e12
  });
  assert.strictEqual(r.outputs.crack_time_seconds, null);
  assert.ok(typeof r.outputs.crack_time_description === "string");
  assert.ok((r.outputs.crack_time_description as string).length > 0);
});

test("switching every character type off is refused rather than producing an empty alphabet", async () => {
  await throwsWith(
    "TEC-005",
    {
      length: 16, include_uppercase: "false", include_lowercase: "false",
      include_digits: "false", include_symbols: "false", exclude_ambiguous: "false",
      guesses_per_second: 1e12
    },
    "at least one kind of character"
  );
});

// ---------------------------------------------------------------------------
// TEC-005 security properties, asserted against the component's own source
// ---------------------------------------------------------------------------

test("the password generator component honours its security constraints", () => {
  const path = join(
    process.cwd(),
    "apps/web/src/components/calculators/PasswordGenerator.tsx"
  );
  const source = readFileSync(path, "utf8");

  // Strip comments, so prose ABOUT these constraints does not trip the checks.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  // 1. Cryptographic randomness, and nothing else.
  assert.ok(
    /crypto\.getRandomValues/.test(code),
    "the generator must use crypto.getRandomValues"
  );
  assert.ok(
    !/Math\.random/.test(code),
    "Math.random is not a cryptographic source and must never generate a password"
  );

  // 2. Nothing is transmitted.
  for (const pattern of [/\bfetch\s*\(/, /XMLHttpRequest/, /navigator\.sendBeacon/, /new\s+WebSocket/, /axios/]) {
    assert.ok(
      !pattern.test(code),
      `the generator must not transmit anything; found ${pattern}`
    );
  }

  // 3. Nothing is logged.
  assert.ok(
    !/console\s*\./.test(code),
    "the generator must not log; a password in a console is a password on disk"
  );

  // 4. Nothing is persisted.
  for (const pattern of [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/]) {
    assert.ok(
      !pattern.test(code),
      `the generator must not persist anything; found ${pattern}`
    );
  }

  // 5. It runs in the browser, which is the precondition for all of the above.
  assert.ok(
    /^"use client"/m.test(source),
    "the generator must be a client component"
  );
});

test("the engine contains no password generation at all", () => {
  const path = join(
    process.cwd(),
    "packages/calculation-engine/src/technology/wave2-handlers.ts"
  );
  const source = readFileSync(path, "utf8");
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  assert.ok(
    !/Math\.random|getRandomValues|randomBytes|randomUUID/.test(code),
    "no randomness of any kind belongs in the server-side handler; generation is browser-only"
  );
});

// ---------------------------------------------------------------------------
// Nothing broken ever reaches a user
// ---------------------------------------------------------------------------

test("every technology calculator returns finite numbers, strings or nulls only", async () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ["TEC-001", { address: "192.168.1.130", prefix_length: 26 }],
    ["TEC-002", { file_size: 1, size_unit: "gigabyte", speed_mbps: 100, overhead_pct: 0 }],
    ["TEC-003", { direction: "encode", text: "Hello", url_safe: "false" }],
    ["TEC-004", { direction: "encode", text: "a=1&b=2", mode: "component" }],
    ["TEC-005", { length: 20, include_uppercase: "true", include_lowercase: "true", include_digits: "true", include_symbols: "true", exclude_ambiguous: "false", guesses_per_second: 1e12 }]
  ];
  for (const [id, inputs] of cases) {
    const r = await run(id, inputs);
    for (const [key, value] of Object.entries(r.outputs)) {
      if (value === null) continue;
      const kind = typeof value;
      assert.ok(
        kind === "number" || kind === "string" || kind === "boolean",
        `${id}.${key} is a ${kind}, which would render as [object Object]`
      );
      if (kind === "number") {
        assert.ok(Number.isFinite(value as number), `${id}.${key} is not finite`);
      }
      if (kind === "string") {
        assert.ok(
          !/NaN|Infinity|undefined|\[object/.test(value as string),
          `${id}.${key} contains a broken value: ${value}`
        );
      }
    }
  }
});
