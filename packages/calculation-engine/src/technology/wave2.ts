/**
 * Wave 2 Technology & Digital calculators (TEC-001 to TEC-004).
 *
 * NOTE ON TEC-005, THE PASSWORD GENERATOR: it is deliberately ABSENT from this
 * module and from the engine. A password generated on a server has, by
 * construction, existed somewhere other than the user's machine, and no promise
 * about not storing it can be verified by the person relying on it. TEC-005 is
 * therefore implemented entirely in the browser, in a client component that
 * uses the Web Crypto API, transmits nothing and logs nothing. What lives here
 * instead is the STRENGTH ESTIMATOR, which is pure arithmetic on a character
 * set size and a length and never sees a password.
 */
import { assertFiniteNumber } from "../common/validation.js";

const sig = (n: number, digits = 12): number => {
  if (!Number.isFinite(n) || n === 0) return n;
  const magnitude = Math.ceil(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, digits - magnitude);
  return Math.round(n * factor) / factor;
};

// ===========================================================================
// TEC-001 IP subnet
// ===========================================================================

export interface SubnetResult {
  network_address: string;
  broadcast_address: string;
  first_usable_host: string | null;
  last_usable_host: string | null;
  subnet_mask: string;
  wildcard_mask: string;
  prefix_length: number;
  total_addresses: number;
  usable_hosts: number;
  ip_class: string;
  is_private: boolean;
  cidr: string;
}

function parseIpv4(text: string): number[] {
  const parts = String(text ?? "").trim().split(".");
  if (parts.length !== 4) {
    throw new Error(`"${text}" is not an IPv4 address. It needs four numbers separated by dots, for example 192.168.1.1.`);
  }
  return parts.map((p, i) => {
    if (!/^\d+$/.test(p)) {
      throw new Error(`"${p}" is not a whole number. Each part of an IPv4 address is a number from 0 to 255.`);
    }
    const n = Number(p);
    if (n > 255) {
      throw new Error(`${n} is too large for part ${i + 1} of an IPv4 address. Each part runs from 0 to 255.`);
    }
    return n;
  });
}

const toInt = (octets: number[]): number =>
  ((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3];

const toDotted = (value: number): string => {
  const v = value >>> 0;
  return [
    Math.floor(v / 16777216) % 256,
    Math.floor(v / 65536) % 256,
    Math.floor(v / 256) % 256,
    v % 256
  ].join(".");
};

/**
 * Work out a subnet from an address and a prefix length.
 *
 * Everything is done in unsigned arithmetic on plain numbers rather than with
 * JavaScript's bitwise operators, which coerce to SIGNED 32-bit integers. That
 * coercion turns any address from 128.0.0.0 upwards negative, and a subnet
 * calculator built on `&` and `|` produces addresses like -1062731774 for the
 * whole upper half of the address space.
 */
export function subnet(address: string, prefixLength: number): SubnetResult {
  const octets = parseIpv4(address);
  const prefix = assertFiniteNumber(prefixLength, "Prefix length");
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("The prefix length must be a whole number from 0 to 32.");
  }

  const ip = toInt(octets);
  const hostBits = 32 - prefix;
  const blockSize = Math.pow(2, hostBits);
  const maskValue = 4294967296 - blockSize;

  const network = Math.floor(ip / blockSize) * blockSize;
  const broadcast = network + blockSize - 1;

  // A /31 is a point-to-point link with two addresses and no broadcast, and a
  // /32 is a single host. Neither has "usable hosts" in the ordinary sense, and
  // reporting a negative count for them is the classic bug here.
  const usable = hostBits >= 2 ? blockSize - 2 : 0;

  const first = octets[0];
  const ipClass =
    first < 128 ? "A" : first < 192 ? "B" : first < 224 ? "C" : first < 240 ? "D (multicast)" : "E (reserved)";

  const isPrivate =
    first === 10 ||
    (first === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (first === 192 && octets[1] === 168) ||
    (first === 169 && octets[1] === 254) ||
    first === 127;

  return {
    network_address: toDotted(network),
    broadcast_address: toDotted(broadcast),
    first_usable_host: usable > 0 ? toDotted(network + 1) : null,
    last_usable_host: usable > 0 ? toDotted(broadcast - 1) : null,
    subnet_mask: toDotted(maskValue),
    wildcard_mask: toDotted(blockSize - 1),
    prefix_length: prefix,
    total_addresses: blockSize,
    usable_hosts: usable,
    ip_class: ipClass,
    is_private: isPrivate,
    cidr: `${toDotted(network)}/${prefix}`
  };
}

// ===========================================================================
// TEC-002 Bandwidth and transfer time
// ===========================================================================

export interface BandwidthResult {
  file_size_bytes: number;
  file_size_mb: number;
  speed_mbps: number;
  speed_mb_per_second: number;
  transfer_seconds: number;
  transfer_hours: number;
  transfer_minutes: number;
  transfer_remaining_seconds: number;
  formatted_time: string;
  overhead_pct: number;
  effective_speed_mbps: number;
}

const SIZE_UNITS: Record<string, number> = {
  // Decimal units, as storage and network equipment are sold in.
  byte: 1,
  kilobyte: 1e3,
  megabyte: 1e6,
  gigabyte: 1e9,
  terabyte: 1e12,
  // Binary units, as an operating system reports.
  kibibyte: 1024,
  mebibyte: 1048576,
  gibibyte: 1073741824,
  tebibyte: 1099511627776
};

/**
 * How long a transfer takes.
 *
 * BITS AND BYTES ARE THE WHOLE POINT. A connection is sold in megaBITS per
 * second and a file is measured in megaBYTES, a factor of eight apart, which
 * is why a "100 Mb" line downloads a 100 MB file in eight seconds rather than
 * one. Both units appear in the output, spelled out, because abbreviating them
 * to Mb and MB is precisely how the confusion survives.
 */
export function bandwidth(
  fileSize: number,
  sizeUnit: string,
  speedMbps: number,
  overheadPct: number
): BandwidthResult {
  const size = assertFiniteNumber(fileSize, "File size");
  if (size <= 0) throw new Error("The file size must be greater than zero.");
  const factor = SIZE_UNITS[sizeUnit];
  if (factor === undefined) {
    throw new Error(`"${sizeUnit}" is not a size unit this calculator knows.`);
  }
  const speed = assertFiniteNumber(speedMbps, "Connection speed");
  if (speed <= 0) throw new Error("The connection speed must be greater than zero.");
  if (speed > 1e7) throw new Error("A speed above 10 terabits a second is beyond what this calculator models.");
  const overhead = assertFiniteNumber(overheadPct, "Protocol overhead");
  if (overhead < 0 || overhead >= 100) {
    throw new Error("The protocol overhead must be at least 0 and below 100 per cent.");
  }

  const bytes = size * factor;
  if (bytes > 1e18) throw new Error("That file size is beyond what this calculator models.");

  const effectiveMbps = speed * (1 - overhead / 100);
  // Megabits per second to bytes per second: a million bits, divided by eight.
  const bytesPerSecond = (effectiveMbps * 1e6) / 8;
  const seconds = bytes / bytesPerSecond;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  parts.push(`${Math.round(remaining * 10) / 10} seconds`);

  return {
    file_size_bytes: sig(bytes),
    file_size_mb: sig(bytes / 1e6),
    speed_mbps: sig(speed),
    speed_mb_per_second: sig(bytesPerSecond / 1e6),
    transfer_seconds: sig(seconds),
    transfer_hours: hours,
    transfer_minutes: minutes,
    transfer_remaining_seconds: sig(Math.round(remaining * 10) / 10),
    formatted_time: parts.join(", "),
    overhead_pct: overhead,
    effective_speed_mbps: sig(effectiveMbps)
  };
}

// ===========================================================================
// TEC-003 Base64
// ===========================================================================

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export interface Base64Result {
  input_length: number;
  output: string;
  output_length: number;
  padding_characters: number;
  size_change_pct: number;
  direction: string;
  url_safe: boolean;
}

/**
 * Base64 encode and decode, implemented from the alphabet rather than through
 * a platform helper, so the behaviour is identical on the server and in the
 * browser and does not depend on which runtime happens to execute it.
 */
export function base64Encode(text: string, urlSafe: boolean): Base64Result {
  const input = String(text ?? "");
  if (input.length > 100000) {
    throw new Error("That input is longer than this calculator will encode.");
  }
  // Encode as UTF-8 first, so non-ASCII text survives the round trip.
  const bytes = Array.from(new TextEncoder().encode(input));

  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const triple = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);

    out += B64_ALPHABET[(triple >> 18) & 63];
    out += B64_ALPHABET[(triple >> 12) & 63];
    out += b1 === undefined ? "=" : B64_ALPHABET[(triple >> 6) & 63];
    out += b2 === undefined ? "=" : B64_ALPHABET[triple & 63];
  }

  let result = out;
  if (urlSafe) {
    result = out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  const padding = (out.match(/=/g) ?? []).length;
  return {
    input_length: bytes.length,
    output: result,
    output_length: result.length,
    padding_characters: urlSafe ? 0 : padding,
    size_change_pct: bytes.length === 0 ? 0 : sig(((result.length - bytes.length) / bytes.length) * 100),
    direction: "encode",
    url_safe: urlSafe
  };
}

export function base64Decode(text: string): Base64Result {
  let input = String(text ?? "").trim();
  if (input.length > 200000) {
    throw new Error("That input is longer than this calculator will decode.");
  }
  // Accept the URL-safe alphabet as well, and restore any stripped padding.
  input = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (input.length % 4 !== 0) input += "=";

  const stripped = input.replace(/=+$/, "");
  for (const ch of stripped) {
    if (B64_ALPHABET.indexOf(ch) === -1) {
      throw new Error(
        `"${ch}" is not a Base64 character. Valid characters are A to Z, a to z, 0 to 9, plus and slash, with equals signs as padding at the end.`
      );
    }
  }

  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 4) {
    const chunk = input.slice(i, i + 4);
    const values = chunk.split("").map(c => (c === "=" ? 0 : B64_ALPHABET.indexOf(c)));
    const triple = (values[0] << 18) | (values[1] << 12) | (values[2] << 6) | values[3];
    const padCount = (chunk.match(/=/g) ?? []).length;
    bytes.push((triple >> 16) & 255);
    if (padCount < 2) bytes.push((triple >> 8) & 255);
    if (padCount < 1) bytes.push(triple & 255);
  }

  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    throw new Error(
      "That decodes to bytes which are not valid text. The input may be an encoded image or other binary file rather than text."
    );
  }

  return {
    input_length: input.length,
    output: decoded,
    output_length: decoded.length,
    padding_characters: (input.match(/=/g) ?? []).length,
    size_change_pct: input.length === 0 ? 0 : sig(((bytes.length - input.length) / input.length) * 100),
    direction: "decode",
    url_safe: false
  };
}

// ===========================================================================
// TEC-004 URL encoding
// ===========================================================================

export interface UrlCodecResult {
  input_length: number;
  output: string;
  output_length: number;
  characters_changed: number;
  direction: string;
  mode: string;
}

/**
 * URL encode and decode.
 *
 * TWO ENCODINGS EXIST AND THEY ARE NOT INTERCHANGEABLE. A whole URL keeps its
 * structural characters (: / ? # & =) because they carry meaning; a single
 * PARAMETER VALUE must escape them, because inside a value they are data rather
 * than structure. Encoding a value with the whole-URL rules is how a query
 * string with an ampersand in it silently splits into two parameters.
 */
export function urlEncode(text: string, mode: "component" | "full_url"): UrlCodecResult {
  const input = String(text ?? "");
  if (input.length > 100000) {
    throw new Error("That input is longer than this calculator will encode.");
  }
  const output = mode === "full_url" ? encodeURI(input) : encodeURIComponent(input);
  let changed = 0;
  for (const ch of input) {
    const enc = mode === "full_url" ? encodeURI(ch) : encodeURIComponent(ch);
    if (enc !== ch) changed++;
  }
  return {
    input_length: input.length,
    output,
    output_length: output.length,
    characters_changed: changed,
    direction: "encode",
    mode
  };
}

export function urlDecode(text: string, mode: "component" | "full_url"): UrlCodecResult {
  const input = String(text ?? "");
  if (input.length > 100000) {
    throw new Error("That input is longer than this calculator will decode.");
  }
  let output: string;
  try {
    output = mode === "full_url" ? decodeURI(input) : decodeURIComponent(input);
  } catch {
    throw new Error(
      "That is not valid percent-encoded text. A percent sign must be followed by two hexadecimal digits, so a literal percent sign has to be written as %25."
    );
  }
  return {
    input_length: input.length,
    output,
    output_length: output.length,
    characters_changed: (input.match(/%[0-9A-Fa-f]{2}/g) ?? []).length,
    direction: "decode",
    mode
  };
}

// ===========================================================================
// TEC-005 support: password strength arithmetic (never a password)
// ===========================================================================

export interface PasswordStrengthResult {
  character_set_size: number;
  length: number;
  entropy_bits: number;
  combinations_log10: number;
  strength_label: string;
  /** Null rather than Infinity where the keyspace overflows a double. */
  crack_time_seconds: number | null;
  crack_time_description: string;
  meets_ncsc_three_words_equivalent: boolean;
}

/**
 * Estimate the entropy of a password DESCRIPTION, never of a password.
 *
 * This takes a character set size and a length. It does not take, see, receive
 * or return a password, and that is deliberate: the generator itself runs in
 * the browser and its output never crosses the network. What this provides is
 * the arithmetic behind the strength shown alongside it.
 *
 * The entropy figure is only valid for a password chosen UNIFORMLY AT RANDOM
 * from the character set. A human-chosen password of the same length and
 * alphabet has far less entropy than this formula suggests, because humans do
 * not choose uniformly, and that caveat is carried in the narrative.
 */
export function passwordStrength(
  characterSetSize: number,
  length: number,
  guessesPerSecond: number
): PasswordStrengthResult {
  const size = assertFiniteNumber(characterSetSize, "Character set size");
  const len = assertFiniteNumber(length, "Length");
  const rate = assertFiniteNumber(guessesPerSecond, "Guesses per second");

  if (!Number.isInteger(size) || size < 2) {
    throw new Error("The character set must have at least two characters, or there is nothing to choose between.");
  }
  if (size > 1114112) throw new Error("That character set is larger than Unicode.");
  if (!Number.isInteger(len) || len < 1) {
    throw new Error("The length must be a whole number of at least one.");
  }
  if (len > 1000) throw new Error("A length above 1,000 characters is beyond what this calculator models.");
  if (rate <= 0) throw new Error("The guessing rate must be greater than zero.");

  // Work in logarithms throughout: 100 characters from a 95-character set is
  // about 10^197 combinations, which overflows a double long before that.
  const entropyBits = len * Math.log2(size);
  const log10Combinations = len * Math.log10(size);

  // Expected time is half the keyspace, on average.
  const log10Seconds = log10Combinations - Math.log10(2) - Math.log10(rate);
  const seconds = log10Seconds > 300 ? Infinity : Math.pow(10, log10Seconds);

  const describe = (log10s: number): string => {
    if (log10s < 0) return "Less than a second";
    const s = Math.pow(10, Math.min(log10s, 300));
    if (log10s < Math.log10(60)) return `${Math.round(s)} seconds`;
    if (log10s < Math.log10(3600)) return `${Math.round(s / 60)} minutes`;
    if (log10s < Math.log10(86400)) return `${Math.round(s / 3600)} hours`;
    if (log10s < Math.log10(31557600)) return `${Math.round(s / 86400)} days`;
    const log10Years = log10s - Math.log10(31557600);
    if (log10Years < 3) return `${Math.round(Math.pow(10, log10Years))} years`;
    if (log10Years < 6) return `${Math.round(Math.pow(10, log10Years - 3))} thousand years`;
    if (log10Years < 9) return `${Math.round(Math.pow(10, log10Years - 6))} million years`;
    if (log10Years < 12) return `${Math.round(Math.pow(10, log10Years - 9))} billion years`;
    return `about 10 to the power ${Math.round(log10Years)} years`;
  };

  // The bands are calibrated against what an OFFLINE attack on a stolen hash
  // can actually do, not against the older textbook thresholds. At a trillion
  // guesses a second, 40 bits falls in under twenty minutes and 60 bits in
  // about a week, so calling 40 bits "reasonable", as the classic bands do,
  // would be telling someone a password is fine when it is not. The bands
  // below correspond roughly to: minutes, days, millennia, and beyond reach.
  const label =
    entropyBits < 40 ? "Very weak"
      : entropyBits < 60 ? "Weak"
        : entropyBits < 80 ? "Reasonable"
          : entropyBits < 100 ? "Strong"
            : "Very strong";

  // Three random words from a large dictionary, the NCSC's advice, gives
  // roughly 40 to 45 bits. That is the practical bar this compares against.
  const NCSC_THREE_WORDS_BITS = 3 * Math.log2(20000);

  return {
    character_set_size: size,
    length: len,
    entropy_bits: sig(entropyBits),
    combinations_log10: sig(log10Combinations),
    strength_label: label,
    // Null rather than Infinity: an infinite figure would be rejected by the
    // engine's output guard, and "longer than the age of the universe" is what
    // the description says anyway.
    crack_time_seconds: Number.isFinite(seconds) ? sig(seconds) : null,
    crack_time_description: describe(log10Seconds),
    meets_ncsc_three_words_equivalent: entropyBits >= NCSC_THREE_WORDS_BITS
  };
}
