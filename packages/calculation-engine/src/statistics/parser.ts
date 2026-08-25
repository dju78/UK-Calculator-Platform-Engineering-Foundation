/**
 * Parse a user-supplied dataset.
 *
 * The previous implementation silently DROPPED any token it could not read as
 * a number. That made `[2, 4, 6]` - a completely natural thing for someone to
 * paste, and the exact form this engine's own fixtures use - parse as `[4]`,
 * because `[2` and `6]` both became NaN and were filtered away. The user got a
 * confident mean of the wrong data with nothing to tell them.
 *
 * Silent data loss is the worst failure a statistics tool can have, so this
 * version accepts the notations people actually paste and REFUSES anything it
 * cannot read, naming the offending token.
 */
export function parseDataset(input: string | number[] | undefined | null): number[] {
  if (input === null || input === undefined || input === "") return [];

  if (Array.isArray(input)) {
    return input.map((value, i) => {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        throw new Error(`Value ${i + 1} in the data is not a valid number.`);
      }
      return n;
    });
  }

  if (typeof input !== "string") return [];

  // Accept JSON array notation, brackets of any kind, and semicolon or
  // newline separators as well as commas and spaces.
  const cleaned = input.trim().replace(/^[[({]/, "").replace(/[\])}]$/, "");

  const tokens = cleaned
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  return tokens.map((token, i) => {
    const n = Number(token);
    if (!Number.isFinite(n)) {
      throw new Error(
        `"${token}" is not a number. Check value ${i + 1} in your data; separate values with commas, spaces or new lines.`
      );
    }
    return n;
  });
}
