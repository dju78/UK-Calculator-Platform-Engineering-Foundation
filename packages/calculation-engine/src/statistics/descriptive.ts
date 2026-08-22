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

export function mode(data: number[]): number[] {
  if (data.length === 0) throw new Error("Dataset is empty");
  const freqs = new Map<number, number>();
  let maxFreq = 0;
  for (const val of data) {
    const curr = (freqs.get(val) || 0) + 1;
    freqs.set(val, curr);
    if (curr > maxFreq) maxFreq = curr;
  }
  
  if (maxFreq === 1 && data.length > 1) {
    return []; // No mode (every item appears exactly once)
  }

  const modes: number[] = [];
  for (const [val, freq] of freqs.entries()) {
    if (freq === maxFreq) {
      modes.push(val);
    }
  }
  return modes.sort((a, b) => a - b);
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
