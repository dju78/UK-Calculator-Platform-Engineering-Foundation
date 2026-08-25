import type { NumericInputs, CalculatorHandler } from "../types.js";
import {
  subnet, bandwidth, base64Encode, base64Decode,
  urlEncode, urlDecode, passwordStrength
} from "./wave2.js";

function str(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/** TEC-001 IP Subnet Calculator */
export const tec001Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = subnet(String(inputs.address ?? "192.168.1.1"), Number(inputs.prefix_length ?? 24));
  const warnings: string[] = [];
  if (r.usable_hosts === 0) {
    warnings.push(
      r.prefix_length === 32
        ? "A /32 is a single host address, so there is no network to divide and no usable host range."
        : "A /31 is a point-to-point link. It has two addresses and, by RFC 3021, no network or broadcast address, so both ends are usable but the ordinary host count does not apply."
    );
  }
  return {
    outputs: {
      network_address: r.network_address,
      broadcast_address: r.broadcast_address,
      first_usable_host: r.first_usable_host,
      last_usable_host: r.last_usable_host,
      subnet_mask: r.subnet_mask,
      wildcard_mask: r.wildcard_mask,
      total_addresses: r.total_addresses,
      usable_hosts: r.usable_hosts,
      cidr: r.cidr,
      ip_class: r.ip_class,
      is_private: r.is_private,
      basis:
        "TWO ADDRESSES IN EVERY ORDINARY SUBNET ARE NOT USABLE BY HOSTS: the first identifies the network and the last is the broadcast. That is why a /24 gives 254 hosts rather than 256, and why a /30, the smallest useful point-to-point subnet, gives two out of four. " +
        "THE EXCEPTIONS MATTER. A /31 has no network or broadcast address at all under RFC 3021 and both of its addresses are usable on a point-to-point link; a /32 is a single host. Reporting minus two hosts for those, which a naive subtraction does, is the classic defect in a subnet calculator. " +
        "This calculation is done in unsigned arithmetic rather than with bitwise operators, because JavaScript's bitwise operators coerce to SIGNED 32-bit integers and turn every address from 128.0.0.0 upwards negative. " +
        "The class letters are historical: classful addressing was replaced by CIDR in 1993 and the class of an address no longer determines its mask. It is shown because the terms are still used in conversation, not because it means anything to a modern router."
    },
    warnings
  };
};

/** TEC-002 Bandwidth Calculator */
export const tec002Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const r = bandwidth(
    Number(inputs.file_size ?? 0),
    str(inputs.size_unit, "gigabyte"),
    Number(inputs.speed_mbps ?? 0),
    Number(inputs.overhead_pct ?? 0)
  );
  return {
    outputs: {
      transfer_seconds: r.transfer_seconds,
      formatted_time: r.formatted_time,
      file_size_mb: r.file_size_mb,
      speed_mb_per_second: r.speed_mb_per_second,
      effective_speed_mbps: r.effective_speed_mbps,
      overhead_pct: r.overhead_pct,
      basis:
        "BITS AND BYTES ARE THE WHOLE POINT. A connection is sold in megaBITS a second and a file is measured in megaBYTES, a factor of EIGHT apart, which is why a 100 megabit line takes about eight seconds to move a 100 megabyte file rather than one. Both units are spelled out in full here, because abbreviating them to Mb and MB is exactly how the confusion survives. " +
        "DECIMAL AND BINARY SIZES ALSO DIFFER. Drives and networks are sold in decimal units where a gigabyte is a thousand million bytes; operating systems report binary units where a gibibyte is 1,073,741,824. That is the entire reason a 1 TB drive shows as about 931 GB, and both families are offered here under their proper names. " +
        "The overhead allowance exists because a real transfer never reaches the headline rate: protocol framing, acknowledgements, contention and the far end all take a share. The figure is yours to set rather than assumed."
    }
  };
};

/** TEC-003 Base64 Encode / Decode */
export const tec003Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const direction = str(inputs.direction, "encode");
  const text = String(inputs.text ?? "");
  const r = direction === "decode"
    ? base64Decode(text)
    : base64Encode(text, bool(inputs.url_safe, false));

  return {
    outputs: {
      output: r.output,
      input_length: r.input_length,
      output_length: r.output_length,
      padding_characters: r.padding_characters,
      size_change_pct: r.size_change_pct,
      basis:
        "BASE64 IS AN ENCODING, NOT ENCRYPTION. It is trivially reversible by anyone, provides no confidentiality whatsoever, and a credential that has been Base64 encoded is exactly as exposed as one that has not. Its purpose is to carry arbitrary BYTES through a channel that only reliably handles text, such as an email body or a JSON string. " +
        "IT MAKES DATA BIGGER, by about a third: every three bytes become four characters, and the equals signs at the end are padding to fill the last group. " +
        "Text is encoded as UTF-8 first, so accented and non-Latin characters survive the round trip; a byte-per-character implementation mangles them. The URL-safe variant substitutes minus and underscore for plus and slash and drops the padding, because those two characters have their own meaning inside a URL."
    }
  };
};

/** TEC-004 URL Encode / Decode */
export const tec004Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const direction = str(inputs.direction, "encode");
  const modeRaw = str(inputs.mode, "component");
  const mode = (modeRaw === "full_url" ? "full_url" : "component") as "component" | "full_url";
  const text = String(inputs.text ?? "");

  const r = direction === "decode" ? urlDecode(text, mode) : urlEncode(text, mode);
  return {
    outputs: {
      output: r.output,
      input_length: r.input_length,
      output_length: r.output_length,
      characters_changed: r.characters_changed,
      basis:
        "TWO ENCODINGS EXIST AND THEY ARE NOT INTERCHANGEABLE. Encoding a WHOLE URL leaves the structural characters alone, because the colon, slash, question mark, hash, ampersand and equals all carry meaning there. Encoding a single PARAMETER VALUE must escape those same characters, because inside a value they are data rather than structure. " +
        "GETTING THIS WRONG IS A REAL BUG, NOT A COSMETIC ONE: a value containing an ampersand, encoded with the whole-URL rules, silently splits into two parameters, and a value containing a hash loses everything after it. That is why the mode is an explicit choice here rather than a default. " +
        "A literal percent sign must itself be written as %25, which is why decoding a string that has already been decoded once usually fails rather than quietly returning something wrong."
    }
  };
};

/**
 * TEC-005 Password Generator: STRENGTH ARITHMETIC ONLY.
 *
 * This handler never sees, receives, produces or returns a password. It takes
 * a description of a character set and a length and returns the entropy that
 * follows. The generator itself runs entirely in the browser, using the Web
 * Crypto API, and its output never crosses the network.
 */
export const tec005Handler: CalculatorHandler = (inputs: NumericInputs) => {
  const length = Number(inputs.length ?? 16);
  const upper = bool(inputs.include_uppercase, true);
  const lower = bool(inputs.include_lowercase, true);
  const digits = bool(inputs.include_digits, true);
  const symbols = bool(inputs.include_symbols, true);
  const excludeAmbiguous = bool(inputs.exclude_ambiguous, false);

  // Sizes of each pool, matching exactly what the browser generator uses.
  let size = 0;
  if (upper) size += excludeAmbiguous ? 24 : 26;   // drops I and O
  if (lower) size += excludeAmbiguous ? 25 : 26;   // drops l
  if (digits) size += excludeAmbiguous ? 8 : 10;   // drops 0 and 1
  if (symbols) size += 30;

  if (size === 0) {
    throw new Error(
      "Choose at least one kind of character. With every category switched off there is nothing to build a password from."
    );
  }

  const r = passwordStrength(size, length, Number(inputs.guesses_per_second ?? 1e12));

  const warnings: string[] = [];
  if (r.entropy_bits < 60) {
    warnings.push(
      "This is below the strength worth relying on for anything important. Add length before adding character types: length buys more entropy per keystroke than complexity does."
    );
  }

  return {
    outputs: {
      character_set_size: r.character_set_size,
      length: r.length,
      entropy_bits: r.entropy_bits,
      combinations_log10: r.combinations_log10,
      strength_label: r.strength_label,
      crack_time_description: r.crack_time_description,
      crack_time_seconds: r.crack_time_seconds,
      meets_ncsc_three_words_equivalent: r.meets_ncsc_three_words_equivalent,
      basis:
        "THIS CALCULATION NEVER SEES A PASSWORD. It takes a character set size and a length and returns the arithmetic that follows. The generator itself runs ENTIRELY IN YOUR BROWSER, using the operating system's cryptographic random number source through the Web Crypto API; the password it produces is never sent to a server, never written to a log and never leaves the page. A password generated anywhere else has, by construction, existed somewhere other than your machine, and no promise about not keeping it can be checked by the person relying on it. " +
        "LENGTH BEATS COMPLEXITY. Each extra character multiplies the work by the size of the alphabet, so adding characters raises entropy faster than adding character types does; a long passphrase from a small alphabet beats a short jumble from a large one. " +
        "THE ENTROPY FIGURE ASSUMES UNIFORM RANDOM CHOICE and is therefore only true of a generated password. A human-chosen password over the same alphabet and length has far less entropy, because people do not choose uniformly: they pick words, dates, keyboard runs and predictable substitutions, and attackers guess those first. " +
        "The crack time assumes an offline attack against a stolen password hash at the stated guessing rate. Against a live login that rate limits attempts, any of these is unbreakable; against a leaked database hashed with something fast, a weak one falls in minutes. The NCSC's own advice is three random words, which lands around 40 to 45 bits, and that is the practical bar shown here."
    },
    warnings
  };
};
