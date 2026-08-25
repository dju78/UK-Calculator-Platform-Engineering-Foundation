/**
 * Independent benchmark oracle for Wave 2 tranche 2Q, Technology & Digital.
 *
 * Imports nothing from the calculation engine. Independence of METHOD:
 *
 *   - Subnets are computed by building the 32-bit mask as an ARRAY OF BITS and
 *     applying it octet by octet, rather than by integer division on the whole
 *     address. Neither side uses JavaScript's bitwise operators on the full
 *     address, because those coerce to signed 32-bit and break everything from
 *     128.0.0.0 upwards, and the octet-wise route makes that impossible to
 *     reintroduce unnoticed.
 *   - Transfer times are derived from BITS throughout, converting the file to
 *     bits rather than converting the line speed to bytes.
 *   - Base64 is produced by an explicit BIT-STRING construction: bytes are
 *     written out as binary text, regrouped into sixes and looked up. That is
 *     the definition of the encoding rather than an optimised form of it.
 *   - Percent-encoding is built from an explicit list of unreserved characters
 *     and a hand-written hex formatter, never from encodeURIComponent.
 *   - Password entropy is computed with natural logarithms and converted,
 *     rather than with log2 directly.
 *
 * TEC-005 CARRIES NO PASSWORD AND NO RANDOMNESS. Its benchmarks assert the
 * arithmetic relating a character set size and a length to an entropy, which
 * is all the engine ever computes; the generator itself is browser-only and is
 * covered by unit tests on its properties instead.
 *
 * Run: node scripts/oracles/wave2-technology-oracle.mjs > /tmp/technology.json
 */

const sig = (n, digits = 12) => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};

const fixtures = {};

function add(id, scenario, inputs, expected, note) {
  (fixtures[id] ||= []).push({
    scenario, inputs, expected,
    tolerance: "exact on addresses and counts, 1e-6 on derived numbers",
    ruleset: "None",
    note: note ?? "Independently derived; no engine code used."
  });
}

// ===========================================================================
// TEC-001 Subnets
// ===========================================================================

for (const c of [
  { scenario: "A quarter of a class C, the common /26", ip: "192.168.1.130", prefix: 26 },
  { scenario: "A whole class C network", ip: "200.100.50.25", prefix: 24 },
  { scenario: "A point-to-point /30, the smallest ordinary subnet", ip: "172.16.4.5", prefix: 30 },
  { scenario: "A /31 point-to-point link, which has no broadcast address", ip: "10.0.0.1", prefix: 31 },
  { scenario: "A single host /32", ip: "8.8.8.8", prefix: 32 },
  { scenario: "A large private range", ip: "10.20.30.40", prefix: 16 },
  { scenario: "An address in the upper half, where signed arithmetic would break", ip: "200.200.200.200", prefix: 25 },
  { scenario: "The whole address space", ip: "0.0.0.0", prefix: 0 }
]) {
  const octets = c.ip.split(".").map(Number);

  // Build the mask as an ARRAY OF 32 BITS and apply it octet by octet.
  const bits = Array.from({ length: 32 }, (_, i) => (i < c.prefix ? 1 : 0));
  const maskOctets = [0, 1, 2, 3].map(o =>
    bits.slice(o * 8, o * 8 + 8).reduce((acc, b) => acc * 2 + b, 0)
  );
  const wildcardOctets = maskOctets.map(m => 255 - m);

  const networkOctets = octets.map((o, i) => {
    // Octet-wise AND without bitwise operators: keep the bits the mask keeps.
    let value = 0;
    for (let b = 0; b < 8; b++) {
      const bitValue = Math.pow(2, 7 - b);
      const ipBit = Math.floor(o / bitValue) % 2;
      const maskBit = Math.floor(maskOctets[i] / bitValue) % 2;
      if (ipBit === 1 && maskBit === 1) value += bitValue;
    }
    return value;
  });
  const broadcastOctets = networkOctets.map((o, i) => o + wildcardOctets[i]);

  const hostBits = 32 - c.prefix;
  const total = Math.pow(2, hostBits);
  const usable = hostBits >= 2 ? total - 2 : 0;

  const inc = (arr) => {
    const out = arr.slice();
    for (let i = 3; i >= 0; i--) {
      if (out[i] < 255) { out[i] += 1; break; }
      out[i] = 0;
    }
    return out;
  };
  const dec = (arr) => {
    const out = arr.slice();
    for (let i = 3; i >= 0; i--) {
      if (out[i] > 0) { out[i] -= 1; break; }
      out[i] = 255;
    }
    return out;
  };

  const first = octets[0];
  const ipClass =
    first < 128 ? "A" : first < 192 ? "B" : first < 224 ? "C" : first < 240 ? "D (multicast)" : "E (reserved)";
  const isPrivate =
    first === 10 ||
    (first === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (first === 192 && octets[1] === 168) ||
    (first === 169 && octets[1] === 254) ||
    first === 127;

  add("TEC-001", c.scenario,
    { address: c.ip, prefix_length: c.prefix },
    {
      network_address: networkOctets.join("."),
      broadcast_address: broadcastOctets.join("."),
      first_usable_host: usable > 0 ? inc(networkOctets).join(".") : null,
      last_usable_host: usable > 0 ? dec(broadcastOctets).join(".") : null,
      subnet_mask: maskOctets.join("."),
      wildcard_mask: wildcardOctets.join("."),
      total_addresses: total,
      usable_hosts: usable,
      cidr: `${networkOctets.join(".")}/${c.prefix}`,
      ip_class: ipClass,
      is_private: isPrivate
    },
    "The mask is built as an array of 32 bits and applied OCTET BY OCTET without any bitwise operator, so the signed 32-bit coercion that breaks addresses above 127 cannot be reintroduced on this side. The 200.200.200.200 case exists solely to catch it, and the /31 and /32 cases pin the two prefixes where the ordinary host arithmetic does not apply.");
}

// ===========================================================================
// TEC-002 Bandwidth
// ===========================================================================

const SIZE_FACTORS = {
  byte: 1, kilobyte: 1e3, megabyte: 1e6, gigabyte: 1e9, terabyte: 1e12,
  kibibyte: 1024, mebibyte: 1048576, gibibyte: 1073741824, tebibyte: 1099511627776
};

for (const c of [
  { scenario: "A gigabyte over a 100 megabit line", size: 1, unit: "gigabyte", speed: 100, overhead: 0 },
  { scenario: "A large file over a slow line", size: 25, unit: "gigabyte", speed: 10, overhead: 0 },
  { scenario: "A gibibyte, the unit an operating system reports", size: 1, unit: "gibibyte", speed: 100, overhead: 0 },
  { scenario: "With a realistic protocol overhead", size: 5, unit: "gigabyte", speed: 500, overhead: 12 },
  { scenario: "A small file on a fast line", size: 500, unit: "megabyte", speed: 1000, overhead: 5 },
  { scenario: "A terabyte backup overnight", size: 1, unit: "terabyte", speed: 940, overhead: 8 }
]) {
  // Derive everything in BITS, converting the file rather than the line.
  const bytes = c.size * SIZE_FACTORS[c.unit];
  const fileBits = bytes * 8;
  const effectiveMbps = c.speed * (1 - c.overhead / 100);
  const lineBitsPerSecond = effectiveMbps * 1e6;
  const seconds = fileBits / lineBitsPerSecond;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  add("TEC-002", c.scenario,
    {
      file_size: c.size, size_unit: c.unit,
      speed_mbps: c.speed, overhead_pct: c.overhead
    },
    {
      transfer_seconds: sig(seconds),
      file_size_mb: sig(bytes / 1e6),
      speed_mb_per_second: sig(lineBitsPerSecond / 8 / 1e6),
      effective_speed_mbps: sig(effectiveMbps),
      overhead_pct: c.overhead
    },
    "Derived in BITS throughout, converting the file to bits rather than the line speed to bytes, which is the opposite direction from the engine. The gigabyte and gibibyte cases sit side by side because they differ by about seven per cent and are constantly conflated: a drive sold as 1 TB reports as 931 GB for exactly this reason.");
}

// ===========================================================================
// TEC-003 Base64
// ===========================================================================

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Encode by explicit BIT-STRING construction, which is the definition. */
function encodeByBits(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length === 0) return "";
  const bitString = bytes.map(b => b.toString(2).padStart(8, "0")).join("");
  const padBits = (6 - (bitString.length % 6)) % 6;
  const padded = bitString + "0".repeat(padBits);

  let out = "";
  for (let i = 0; i < padded.length; i += 6) {
    out += B64[parseInt(padded.slice(i, i + 6), 2)];
  }
  while (out.length % 4 !== 0) out += "=";
  return out;
}

for (const c of [
  { scenario: "Plain ASCII", text: "Hello, world!", dir: "encode", urlSafe: false },
  { scenario: "Text with non-ASCII characters, which must survive as UTF-8", text: "Hello, wörld!", dir: "encode", urlSafe: false },
  { scenario: "A length that needs two padding characters", text: "a", dir: "encode", urlSafe: false },
  { scenario: "A length that needs one padding character", text: "ab", dir: "encode", urlSafe: false },
  { scenario: "A length that needs no padding at all", text: "abc", dir: "encode", urlSafe: false },
  { scenario: "The URL-safe alphabet, with padding stripped", text: "subjects?_d=1&x=~", dir: "encode", urlSafe: true }
]) {
  const encoded = encodeByBits(c.text);
  const output = c.urlSafe
    ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : encoded;
  const inputBytes = new TextEncoder().encode(c.text).length;

  add("TEC-003", c.scenario,
    { direction: "encode", text: c.text, url_safe: c.urlSafe },
    {
      output,
      input_length: inputBytes,
      output_length: output.length,
      padding_characters: c.urlSafe ? 0 : (encoded.match(/=/g) ?? []).length,
      size_change_pct: sig(((output.length - inputBytes) / inputBytes) * 100)
    },
    "Encoded by writing every byte out as binary text, regrouping the bit string into sixes and looking each group up. That is the DEFINITION of Base64 rather than an optimised form of it, so a shift or mask error in the engine's arithmetic version could not be reproduced. The one, two and three character cases pin all three padding outcomes.");
}

for (const c of [
  { scenario: "Decoding plain ASCII", encoded: "SGVsbG8sIHdvcmxkIQ==" },
  { scenario: "Decoding UTF-8 with an accented character", encoded: "SGVsbG8sIHfDtnJsZCE=" },
  { scenario: "Decoding with no padding needed", encoded: "YWJj" },
  { scenario: "Decoding the URL-safe alphabet", encoded: "c3ViamVjdHM_X2Q9MSZ4PX4" },
  { scenario: "Decoding a single character", encoded: "YQ==" },
  { scenario: "Decoding a longer passage", encoded: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==" }
]) {
  // Decode by the same bit-string route, in reverse.
  let normalised = c.encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (normalised.length % 4 !== 0) normalised += "=";
  const stripped = normalised.replace(/=+$/, "");
  const bitString = stripped.split("").map(ch => B64.indexOf(ch).toString(2).padStart(6, "0")).join("");
  const byteCount = Math.floor(bitString.length / 8);
  const bytes = [];
  for (let i = 0; i < byteCount; i++) {
    bytes.push(parseInt(bitString.slice(i * 8, i * 8 + 8), 2));
  }
  const decoded = new TextDecoder("utf-8").decode(new Uint8Array(bytes));

  add("TEC-003", c.scenario,
    { direction: "decode", text: c.encoded, url_safe: false },
    {
      output: decoded,
      input_length: normalised.length,
      output_length: decoded.length,
      padding_characters: (normalised.match(/=/g) ?? []).length
    },
    "Decoded through the same explicit bit-string route in reverse. The URL-safe case asserts that the substituted characters and the stripped padding are both restored before decoding, which a decoder that only knew the standard alphabet would fail.");
}

// ===========================================================================
// TEC-004 URL encoding
// ===========================================================================

// The unreserved set, written out rather than inferred.
const UNRESERVED = new Set(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()".split("")
);
// Characters encodeURI additionally leaves alone, because they are structural.
const URI_RESERVED = new Set(";/?:@&=+$,#".split(""));

function percentEncode(text, keepReserved) {
  let out = "";
  for (const byte of new TextEncoder().encode(text)) {
    const ch = String.fromCharCode(byte);
    if (UNRESERVED.has(ch) || (keepReserved && URI_RESERVED.has(ch))) {
      out += ch;
    } else {
      out += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
    }
  }
  return out;
}

for (const c of [
  { scenario: "A parameter value containing an ampersand and an equals sign", text: "a=1&b=2 c", mode: "component" },
  { scenario: "The same characters inside a whole URL, where they are structural", text: "https://x.co/a b?q=1&r=2", mode: "full_url" },
  { scenario: "A value with a hash, which would otherwise truncate the URL", text: "colour#ff0000", mode: "component" },
  { scenario: "Non-ASCII text, encoded as UTF-8 bytes", text: "café", mode: "component" },
  { scenario: "A value needing no encoding at all", text: "already-safe_value.123", mode: "component" },
  { scenario: "A path with spaces in a whole URL", text: "https://example.com/my file.pdf", mode: "full_url" }
]) {
  const output = percentEncode(c.text, c.mode === "full_url");
  let changed = 0;
  for (const ch of c.text) {
    if (percentEncode(ch, c.mode === "full_url") !== ch) changed++;
  }

  add("TEC-004", c.scenario,
    { direction: "encode", text: c.text, mode: c.mode },
    {
      output,
      input_length: c.text.length,
      output_length: output.length,
      characters_changed: changed
    },
    "Built from an EXPLICIT list of unreserved characters and a hand-written hexadecimal formatter, never from encodeURIComponent. The first two cases are the same characters in the two modes and must give different answers: as a parameter value the ampersand and equals must be escaped, and as part of a whole URL they must not, because that is where a query string with an ampersand in it silently splits into two parameters.");
}

// ===========================================================================
// TEC-005 Password strength arithmetic
// ===========================================================================

for (const c of [
  { scenario: "Twenty characters from the full set", length: 20, upper: true, lower: true, digits: true, symbols: true, ambiguous: false },
  { scenario: "Eight lowercase letters, which is far weaker than it looks", length: 8, upper: false, lower: true, digits: false, symbols: false, ambiguous: false },
  { scenario: "Twelve characters, letters and digits only", length: 12, upper: true, lower: true, digits: true, symbols: false, ambiguous: false },
  { scenario: "Look-alike characters excluded, which shrinks the alphabet", length: 16, upper: true, lower: true, digits: true, symbols: false, ambiguous: true },
  { scenario: "A long passphrase-length string from a small alphabet", length: 40, upper: false, lower: true, digits: false, symbols: false, ambiguous: false },
  { scenario: "The shortest thing anyone would call a password", length: 6, upper: true, lower: true, digits: true, symbols: true, ambiguous: false }
]) {
  let size = 0;
  if (c.upper) size += c.ambiguous ? 24 : 26;
  if (c.lower) size += c.ambiguous ? 25 : 26;
  if (c.digits) size += c.ambiguous ? 8 : 10;
  if (c.symbols) size += 30;

  // Natural logarithms throughout, converted at the end, rather than log2.
  const entropyBits = (c.length * Math.log(size)) / Math.log(2);
  const log10Combinations = (c.length * Math.log(size)) / Math.log(10);

  const label =
    entropyBits < 40 ? "Very weak"
      : entropyBits < 60 ? "Weak"
        : entropyBits < 80 ? "Reasonable"
          : entropyBits < 100 ? "Strong"
            : "Very strong";

  add("TEC-005", c.scenario,
    {
      length: c.length,
      include_uppercase: c.upper, include_lowercase: c.lower,
      include_digits: c.digits, include_symbols: c.symbols,
      exclude_ambiguous: c.ambiguous,
      guesses_per_second: 1e12
    },
    {
      character_set_size: size,
      length: c.length,
      entropy_bits: sig(entropyBits),
      combinations_log10: sig(log10Combinations),
      strength_label: label,
      meets_ncsc_three_words_equivalent: entropyBits >= 3 * (Math.log(20000) / Math.log(2))
    },
    "Entropy is computed with NATURAL logarithms and converted, rather than with a base-2 logarithm directly. No password appears anywhere in this oracle, because none appears anywhere in the engine: the generator runs only in the browser. The 40-character lowercase case against the 20-character full-set case is the point that length beats complexity, and both are in the fixtures so the comparison is visible there.");
}

const total = Object.values(fixtures).reduce((n, f) => n + f.length, 0);
console.log(JSON.stringify(fixtures, null, 2));
console.error(`Oracle produced ${Object.keys(fixtures).length} calculators, ${total} cases.`);
for (const [id, cases] of Object.entries(fixtures)) {
  if (cases.length < 5) console.error(`  WARNING: ${id} has only ${cases.length} cases.`);
}
