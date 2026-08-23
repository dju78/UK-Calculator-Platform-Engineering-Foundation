export function count(data: number[]): number {
  return data.length;
}

export function sum(data: number[]): number {
  return data.reduce((acc, val) => acc + val, 0);
}

export function mean(data: number[]): number {
  if (data.length === 0) throw new Error("Dataset is empty");
  return sum(data) / count(data);
}

export function median(data: number[]): number {
  if (data.length === 0) throw new Error("Dataset is empty");
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * The value or values occurring most often.
 *
 * CONVENTION
 * ----------
 * This returns the literal definition: every value whose frequency equals the
 * maximum frequency. When all values occur equally often, all of them are
 * therefore returned.
 *
 * A previous revision instead returned an empty array in that case ("no
 * mode"), which is a common teaching convention - but it was applied
 * inconsistently: [7] returned [7] while [1,2,3,4] returned [], even though
 * every value ties in both. The canonical STA-001 benchmark fixtures use the
 * literal definition consistently, so that is the convention adopted here.
 *
 * Because "four modes" is rarely a useful statement, `hasDistinctMode` reports
 * whether the modal values actually stand out, and the STA-001 handler turns
 * that into a plain-English note rather than leaving the reader to guess.
 */
export function mode(data: number[]): number[] {
  if (data.length === 0) throw new Error("Dataset is empty");
  const freqs = new Map<number, number>();
  let maxFreq = 0;
  for (const val of data) {
    const curr = (freqs.get(val) || 0) + 1;
    freqs.set(val, curr);
    if (curr > maxFreq) maxFreq = curr;
  }

  const modes: number[] = [];
  for (const [val, freq] of freqs.entries()) {
    if (freq === maxFreq) {
      modes.push(val);
    }
  }
  return modes.sort((a, b) => a - b);
}

/**
 * True when the modal values genuinely occur more often than the rest.
 * False when every distinct value occurs equally often, in which case the mode
 * carries no information about the data.
 */
export function hasDistinctMode(data: number[]): boolean {
  if (data.length === 0) throw new Error("Dataset is empty");
  const distinct = new Set(data).size;
  return mode(data).length < distinct;
}

export function min(data: number[]): number {
  if (data.length === 0) throw new Error("Dataset is empty");
  return Math.min(...data);
}

export function max(data: number[]): number {
  if (data.length === 0) throw new Error("Dataset is empty");
  return Math.max(...data);
}

export function range(data: number[]): number {
  return max(data) - min(data);
}

export function variance(data: number[], isSample: boolean = true): number {
  const n = data.length;
  if (n === 0) throw new Error("Dataset is empty");
  if (isSample && n === 1) throw new Error("Sample variance requires at least 2 observations");
  
  const m = mean(data);
  const sse = data.reduce((acc, val) => acc + Math.pow(val - m, 2), 0);
  const denominator = isSample ? n - 1 : n;
  
  return sse / denominator;
}

export function standardDeviation(data: number[], isSample: boolean = true): number {
  return Math.sqrt(variance(data, isSample));
}
