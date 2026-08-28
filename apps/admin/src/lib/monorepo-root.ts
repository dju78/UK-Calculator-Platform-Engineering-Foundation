import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Returns the monorepo root directory deterministically.
 * Works whether process.cwd() is the repository root or <repo>/apps/admin (Vercel Root Directory).
 */
export function getMonorepoRootDir(): string {
  let cur = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(cur, "packages")) && existsSync(join(cur, "package.json"))) {
      return cur;
    }
    const parent = resolve(cur, "..");
    if (parent === cur) break;
    cur = parent;
  }
  return process.cwd();
}