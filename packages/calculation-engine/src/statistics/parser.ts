export function parseDataset(input: string | number[] | undefined | null): number[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(Number).filter(n => Number.isFinite(n));
  }
  
  if (typeof input !== "string") return [];

  return input
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => s !== "")
    .map(Number)
    .filter(n => Number.isFinite(n));
}
