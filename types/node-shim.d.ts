declare module "node:test" { const test: any; export default test; }
declare module "node:assert/strict" { const assert: any; export default assert; }
declare module "node:http" { const http: any; export default http; }
declare module "node:fs/promises" { export const readFile: any; }
declare module "node:path" { export const join: any; export const extname: any; }
declare const process: any;
declare const Buffer: any;
