/**
 * Narrative specification sections for Wave 2 tranche 2Q, Technology & Digital.
 * Run: node scripts/wave2_2q_notes.mjs
 */
import fs from 'fs';
import path from 'path';

const p = path.join(process.cwd(), 'docs/specs/wave2/_notes.json');
const notes = JSON.parse(fs.readFileSync(p, 'utf8'));

Object.assign(notes, {

  "TEC-001": {
    purpose: "Work out a subnet's network, broadcast, mask and usable host range from an address and a prefix.",
    scope: "IPv4 addresses with prefix lengths from 0 to 32.",
    assumptions: ["Classless addressing, which has been the rule since 1993."],
    validation: [
      "A malformed address is refused, naming which part is wrong and why.",
      "An octet above 255 is refused with the offending number quoted.",
      "A prefix outside 0 to 32 is refused."
    ],
    formula: "The host bits are cleared to give the network address and set to give the broadcast. The usable count is the block size less two, except at /31 and /32.",
    boundary: "TWO ADDRESSES IN EVERY ORDINARY SUBNET ARE UNUSABLE BY HOSTS: the first identifies the network and the last is the broadcast. That is why a /24 gives 254 hosts rather than 256, and why a /30 gives two out of four. " +
      "THE EXCEPTIONS ARE WHERE CALCULATORS BREAK. A /31 has no network or broadcast address at all under RFC 3021, and both its addresses are usable on a point-to-point link; a /32 is a single host. A naive subtraction reports MINUS TWO hosts for a /31, which is the classic defect, so both prefixes return zero with an explanation rather than a nonsense number. " +
      "SIGNED ARITHMETIC IS THE OTHER TRAP. JavaScript's bitwise operators coerce to signed 32-bit integers, which turns every address from 128.0.0.0 upwards negative and prints addresses like -1062731774. This calculator does the whole thing in unsigned arithmetic on plain numbers, and a benchmark at 200.200.200.200 exists to catch a regression. " +
      "The class letters are historical. Classful addressing was replaced by CIDR in 1993 and an address's class no longer determines its mask; the letter is shown because the terms are still used in conversation, not because a router cares.",
    methodology: "The oracle builds the mask as an ARRAY OF 32 BITS and applies it octet by octet without any bitwise operator, so the signed coercion cannot be reintroduced on that side either. Unit tests assert that every returned address is a valid dotted quad with octets in range across the upper half of the space, that the host count is never negative, and that /31 and /32 both carry an explanation.",
    rules: "Not rules-sensitive.",
    related: ["TEC-002 Bandwidth Calculator"]
  },

  "TEC-002": {
    purpose: "Work out how long a transfer takes, in the units connections and files are actually quoted in.",
    scope: "A file size in decimal or binary units, a line speed in megabits, and an overhead allowance.",
    assumptions: ["A steady rate for the whole transfer."],
    validation: [
      "A zero or negative size or speed is refused.",
      "An overhead of 100 per cent or more is refused.",
      "An unknown size unit is refused by name."
    ],
    formula: "The file in bytes times eight, divided by the effective line rate in bits per second.",
    boundary: "BITS AND BYTES DIFFER BY EIGHT, AND THAT IS THE WHOLE POINT. A connection is sold in megaBITS a second and a file is measured in megaBYTES, which is why a 100 megabit line takes about eight seconds to move a 100 megabyte file rather than one. Both units are spelled out in full in the labels, because abbreviating them to Mb and MB is precisely how the confusion survives. " +
      "DECIMAL AND BINARY SIZES ALSO DIFFER. Drives and networks are sold in decimal units where a gigabyte is a thousand million bytes; operating systems report binary units where a gibibyte is 1,073,741,824. That single fact is the entire reason a 1 TB drive shows as about 931 GB, and both families are offered under their proper names rather than one being chosen silently. " +
      "The overhead allowance exists because a real transfer never reaches the headline rate: protocol framing, acknowledgements, contention and the far end all take a share. It is an input rather than an assumed figure.",
    methodology: "The oracle derives everything in BITS, converting the file rather than the line, which is the opposite direction from the engine. A unit test asserts the terabyte and tebibyte cases differ by exactly the ratio of their definitions.",
    rules: "Not rules-sensitive.",
    related: ["TEC-001 IP Subnet Calculator"]
  },

  "TEC-003": {
    purpose: "Encode and decode Base64, including the URL-safe variant.",
    scope: "Text of up to 100,000 characters, in either direction.",
    assumptions: ["Text is UTF-8."],
    validation: [
      "An invalid Base64 character is refused BY NAME with the valid set listed.",
      "Bytes that do not decode to valid text are refused with an explanation that the input may be binary.",
      "Oversized inputs are refused."
    ],
    formula: "Every three bytes become four characters from a 64-character alphabet, with equals signs padding the final group.",
    boundary: "BASE64 IS AN ENCODING, NOT ENCRYPTION. It is trivially reversible by anyone, provides no confidentiality whatsoever, and a credential that has been Base64 encoded is exactly as exposed as one that has not. Its purpose is to carry arbitrary BYTES through a channel that only reliably handles text, such as an email body or a JSON string. This is worth saying plainly because Base64 in a configuration file is routinely mistaken for a protected secret. " +
      "IT MAKES DATA ABOUT A THIRD LARGER, and the equals signs at the end are padding rather than data. " +
      "TEXT IS ENCODED AS UTF-8 FIRST, so accented and non-Latin characters survive the round trip; a byte-per-character implementation mangles them, and round-trip tests here include Japanese and a euro sign for that reason. The implementation is written out from the alphabet rather than delegated to a platform helper, so the behaviour is identical wherever it runs.",
    methodology: "The oracle encodes by an explicit BIT-STRING construction: each byte is written out as binary text, the string is regrouped into sixes and each group looked up. That is the definition of the encoding rather than an optimised form of it, so a shift or mask error in the engine's arithmetic version could not be reproduced. One, two and three character cases pin all three padding outcomes.",
    rules: "Not rules-sensitive.",
    related: ["TEC-004 URL Encode / Decode"]
  },

  "TEC-004": {
    purpose: "Percent-encode and decode text, for a whole URL or for a single parameter value.",
    scope: "Text of up to 100,000 characters, in either direction, in either mode.",
    assumptions: ["UTF-8 percent-encoding, as required by modern URL standards."],
    validation: [
      "Malformed percent-encoding is refused with the reason, including the point that a literal percent sign must be written as %25.",
      "Oversized inputs are refused."
    ],
    formula: "Unreserved characters pass through; everything else becomes a percent sign and two hexadecimal digits per UTF-8 byte. The two modes differ in whether the reserved structural characters are escaped.",
    boundary: "TWO ENCODINGS EXIST AND THEY ARE NOT INTERCHANGEABLE. Encoding a WHOLE URL leaves the structural characters alone, because the colon, slash, question mark, hash, ampersand and equals all carry meaning there. Encoding a single PARAMETER VALUE must escape those same characters, because inside a value they are data rather than structure. " +
      "GETTING THIS WRONG IS A REAL BUG, NOT A COSMETIC ONE. A value containing an ampersand, encoded with the whole-URL rules, silently splits into two parameters; a value containing a hash loses everything after it. Both failures are silent, produce a URL that looks fine, and are found in production rather than in review. That is why the mode is an explicit choice here rather than a default, and why a unit test asserts the two modes give DIFFERENT answers for the same input.",
    methodology: "The oracle builds the encoding from an EXPLICIT list of unreserved characters and a hand-written hexadecimal formatter, never from encodeURIComponent, so it does not merely re-run the platform function the engine uses. Benchmark cases include the same structural characters in both modes so the difference is visible in the fixtures themselves.",
    rules: "Not rules-sensitive.",
    related: ["TEC-003 Base64 Encode / Decode"]
  },

  "TEC-005": {
    purpose: "Generate a strong password in the browser, and show what its length and character set are actually worth.",
    scope: "A length and a choice of character categories, with an assumed offline guessing rate.",
    assumptions: [
      "The entropy figure assumes the password is chosen UNIFORMLY AT RANDOM, which is true of a generated one and not of a human-chosen one.",
      "The crack time assumes an offline attack against a stolen hash."
    ],
    validation: [
      "Switching every character category off is refused, because there is nothing to build a password from.",
      "A length or character set outside sensible bounds is refused.",
      "Where the keyspace overflows a double, the crack time is reported as null with a description rather than as infinity."
    ],
    formula: "Entropy is the length times the base-2 logarithm of the alphabet size. Expected crack time is half the keyspace at the stated guessing rate, computed in logarithms so it does not overflow.",
    boundary: "THE PASSWORD IS GENERATED ENTIRELY IN THE BROWSER AND NEVER CROSSES THE NETWORK. This is the central design decision of the calculator, not a detail. A password generated on a server has, by construction, existed somewhere other than the user's machine, and no promise about not storing it can be verified by the person relying on it. The generator is therefore a browser-only component that uses the Web Crypto API, and the server-side handler computes only the ARITHMETIC relating a character set size to an entropy. It never receives, sees, produces or returns a password. " +
      "RANDOMNESS COMES FROM THE OPERATING SYSTEM'S CRYPTOGRAPHIC SOURCE. Math.random is never used: it is a fast non-cryptographic generator whose output is predictable from a handful of samples, and a password built on it is not a secret. Where a browser cannot provide a cryptographic source, the generator REFUSES rather than falling back, because falling back would produce something that looks like a password and is not one. " +
      "THE SAMPLING IS UNBIASED. Taking a random byte modulo the alphabet size is the obvious approach and it is biased, because 256 does not divide by 62; the first few characters come up more often than the rest, which reduces the real entropy below the figure shown. Rejection sampling removes the bias entirely at the cost of an occasional extra draw. " +
      "LENGTH BEATS COMPLEXITY. Each extra character multiplies the work by the size of the alphabet, so a long passphrase from a small alphabet beats a short jumble from a large one; forty lowercase letters carry more entropy than twenty characters of everything, and a test asserts exactly that. " +
      "THE STRENGTH BANDS ARE CALIBRATED TO REAL OFFLINE ATTACKS rather than to the older textbook thresholds. At a trillion guesses a second, 40 bits falls in under twenty minutes, so the classic bands that call 40 bits 'reasonable' would be telling someone a password is fine when it is not. Eight lowercase letters is labelled Very weak here, because it falls in a fraction of a second. " +
      "THE ENTROPY FIGURE IS ONLY TRUE OF A GENERATED PASSWORD. A human-chosen password over the same alphabet and length has far less, because people choose words, dates, keyboard runs and predictable substitutions, and attackers guess those first.",
    methodology: "The security properties are claims about what the code DOES NOT DO, which no output can demonstrate, so they are asserted against the component's own SOURCE: a test reads the file and fails if it contains fetch, XMLHttpRequest, sendBeacon, WebSocket, any console call, localStorage, sessionStorage, indexedDB, document.cookie or Math.random, and fails if it does not contain crypto.getRandomValues and the client directive. A second test asserts the engine handler contains no randomness of any kind. Those are the only tests that can catch a network call added a year from now. The arithmetic itself is benchmarked against an oracle using natural logarithms rather than base-2, and a test asserts the handler exposes no output that could carry a password.",
    rules: "Not rules-sensitive. The NCSC's three-random-words advice is used as the practical comparison bar, at roughly 43 bits.",
    related: ["TEC-003 Base64 Encode / Decode"]
  }
});

fs.writeFileSync(p, JSON.stringify(notes, null, 2) + '\n');
console.log(`Narrative notes now cover ${Object.keys(notes).length} Wave 2 calculators.`);
