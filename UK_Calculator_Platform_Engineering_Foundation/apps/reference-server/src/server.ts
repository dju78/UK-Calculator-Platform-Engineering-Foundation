import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { calculate, CalculationValidationError, CalculatorNotImplementedError } from "../../../packages/calculation-engine/src/index.js";
import { getCalculatorDefinition, wave1Registry } from "../../../packages/calculator-registry/src/index.js";

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(process.cwd(), "apps/reference-server/public");

function send(res: any, status: number, body: string, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, {"content-type": contentType, "cache-control": "no-store"});
  res.end(body);
}

async function readJson(req: any): Promise<unknown> {
  const chunks: any[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = Buffer.from(chunk);
    size += b.length;
    if (size > 64 * 1024) throw new Error("Request body too large");
    chunks.push(b);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = http.createServer(async (req: any, res: any) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, JSON.stringify({status:"ok", engine:"0.1.0"}));
    }
    if (req.method === "GET" && url.pathname === "/api/calculators") {
      return send(res, 200, JSON.stringify(wave1Registry));
    }
    if (req.method === "POST" && url.pathname === "/api/calculate") {
      const payload = await readJson(req) as {calculatorId?:string;inputs?:Record<string,unknown>};
      if (!payload.calculatorId || !payload.inputs) return send(res, 400, JSON.stringify({error:"calculatorId and inputs are required"}));
      const definition = getCalculatorDefinition(payload.calculatorId);
      if (!definition) return send(res, 404, JSON.stringify({error:"Unknown calculator"}));
      const result = calculate(definition.id, payload.inputs);
      return send(res, 200, JSON.stringify(result));
    }
    if (req.method === "GET") {
      const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      if (file.includes("..")) return send(res, 400, "Bad path", "text/plain; charset=utf-8");
      const full = join(publicDir, file);
      const body = await readFile(full);
      const type = extname(full) === ".css" ? "text/css; charset=utf-8" : extname(full) === ".js" ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8";
      res.writeHead(200, {"content-type":type}); res.end(body); return;
    }
    send(res, 404, JSON.stringify({error:"Not found"}));
  } catch (error) {
    if (error instanceof CalculationValidationError) return send(res, 422, JSON.stringify({error:error.message, issues:error.issues}));
    if (error instanceof CalculatorNotImplementedError) return send(res, 501, JSON.stringify({error:error.message}));
    console.error(error);
    return send(res, 500, JSON.stringify({error:"Internal server error"}));
  }
});

server.listen(port, () => console.log(`Reference calculator server: http://localhost:${port}`));
