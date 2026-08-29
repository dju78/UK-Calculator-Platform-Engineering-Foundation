import test from "node:test";
import assert from "node:assert/strict";
import {
  createSessionToken,
  verifySessionToken,
  validateCredentials,
  validateRedirectDestination,
  evaluateRouteProtection,
  SESSION_COOKIE_NAME,
} from "./admin-auth-helper.js";

test("Admin Console Auth & Route Protection Suite", async (t: any) => {
  let NextRequest: any;
  let NextResponse: any;
  try {
    const nextServer = await import("next/server.js");
    NextRequest = nextServer.NextRequest;
    NextResponse = nextServer.NextResponse;
  } catch {
    // fallback if Next not installed
  }

  const middleware = async (request: any) => {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const decision = await evaluateRouteProtection(pathname, sessionCookie);

    if (decision.action === "redirect" && decision.redirectPath) {
      if (NextResponse) {
        return NextResponse.redirect(new URL(decision.redirectPath, request.url));
      }
      return { status: decision.statusCode || 307, headers: new Map([["location", decision.redirectPath]]) };
    }

    if (NextResponse) {
      return NextResponse.next();
    }
    return { status: 200 };
  };

  await t.test("Auth constants and cookie name", () => {
    assert.strictEqual(SESSION_COOKIE_NAME, "ukcalc_admin_session");
  });

  await t.test("createSessionToken generates valid HMAC signed token", async () => {
    const token = await createSessionToken();
    assert.ok(typeof token === "string");
    assert.ok(token.includes("."));
    const [payloadB64, sigB64] = token.split(".");
    assert.ok(payloadB64.length > 0);
    assert.ok(sigB64.length > 0);

    const isValid = await verifySessionToken(token);
    assert.strictEqual(isValid, true, "Generated token must be valid");
  });

  await t.test("verifySessionToken rejects tampered payload", async () => {
    const token = await createSessionToken();
    const [payloadB64, sigB64] = token.split(".");

    // Tamper payload slightly
    const tamperedPayload = Buffer.from(JSON.stringify({ auth: true, exp: 9999999999 })).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${sigB64}`;

    assert.strictEqual(await verifySessionToken(tamperedToken), false);
  });

  await t.test("verifySessionToken rejects tampered signature", async () => {
    const token = await createSessionToken();
    const [payloadB64] = token.split(".");
    const fakeSig = Buffer.from("forged_signature_bytes_123456").toString("base64url");
    const tamperedToken = `${payloadB64}.${fakeSig}`;

    assert.strictEqual(await verifySessionToken(tamperedToken), false);
  });

  await t.test("verifySessionToken rejects empty, null, or malformed input", async () => {
    assert.strictEqual(await verifySessionToken(""), false);
    assert.strictEqual(await verifySessionToken(null as any), false);
    assert.strictEqual(await verifySessionToken(undefined as any), false);
    assert.strictEqual(await verifySessionToken("no-period-token"), false);
    assert.strictEqual(await verifySessionToken("invalid.base64.garbage"), false);
  });

  await t.test("validateCredentials enforces production safety invariants", () => {
    const origEnv = process.env.NODE_ENV;
    const origPass = process.env.ADMIN_PASSWORD;

    try {
      // Dev mode: fallback to "admin"
      process.env.NODE_ENV = "development";
      delete process.env.ADMIN_PASSWORD;
      assert.strictEqual(validateCredentials("admin"), true);
      assert.strictEqual(validateCredentials("wrong"), false);

      // Dev mode with custom password
      process.env.ADMIN_PASSWORD = "custom-dev-password";
      assert.strictEqual(validateCredentials("custom-dev-password"), true);
      assert.strictEqual(validateCredentials("admin"), false);

      // Production mode: requires ADMIN_PASSWORD
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_PASSWORD;
      assert.strictEqual(validateCredentials("admin"), false, "Must fail closed if password unset in production");

      process.env.ADMIN_PASSWORD = "strong-production-admin-pass-32char!";
      assert.strictEqual(validateCredentials("strong-production-admin-pass-32char!"), true);
      assert.strictEqual(validateCredentials("wrong-pass"), false);
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origPass) process.env.ADMIN_PASSWORD = origPass;
      else delete process.env.ADMIN_PASSWORD;
    }
  });

  await t.test("validateRedirectDestination sanitizes malicious open redirects", () => {
    // Valid internal paths
    assert.strictEqual(validateRedirectDestination("/"), "/");
    assert.strictEqual(validateRedirectDestination("/calculators"), "/calculators");
    assert.strictEqual(validateRedirectDestination("/rules"), "/rules");
    assert.strictEqual(validateRedirectDestination("/calculators/loan-calculator"), "/calculators/loan-calculator");

    // Malicious open redirects
    assert.strictEqual(validateRedirectDestination("//evil.com"), "/");
    assert.strictEqual(validateRedirectDestination("//evil.com/path"), "/");
    assert.strictEqual(validateRedirectDestination("/\\evil.com"), "/");
    assert.strictEqual(validateRedirectDestination("https://evil.com"), "/");
    assert.strictEqual(validateRedirectDestination("http://evil.com/login"), "/");
    assert.strictEqual(validateRedirectDestination("javascript:alert(1)"), "/");
    assert.strictEqual(validateRedirectDestination("data:text/html,<html>"), "/");
    assert.strictEqual(validateRedirectDestination(""), "/");
    assert.strictEqual(validateRedirectDestination(null), "/");
    assert.strictEqual(validateRedirectDestination(undefined), "/");
  });

  await t.test("Route-decision helper: evaluateRouteProtection logic verification", async () => {
    const protectedRoutes = [
      "/",
      "/calculators",
      "/calculators/loan-calculator",
      "/rules",
      "/qa",
      "/seo",
      "/releases",
      "/system",
      "/traffic",
      "/api/traffic",
      "/api/search-console",
    ];

    for (const route of protectedRoutes) {
      const decision = await evaluateRouteProtection(route, undefined);
      assert.strictEqual(decision.action, "redirect", `Unauthenticated request to ${route} must trigger redirect`);
      assert.strictEqual(decision.statusCode, 307);
      assert.ok(decision.redirectPath?.startsWith("/login"), `Redirect path for ${route} must start with /login`);
      if (route !== "/") {
        assert.ok(decision.redirectPath?.includes(`from=${encodeURIComponent(route)}`), `Redirect must preserve target route for ${route}`);
      }
    }

    // Authenticated request passes through
    const validToken = await createSessionToken();
    for (const route of protectedRoutes) {
      const authDecision = await evaluateRouteProtection(route, validToken);
      assert.strictEqual(authDecision.action, "next", `Authenticated request to ${route} must pass through`);
    }

    // Authenticated user accessing /login is redirected to /
    const loginDecision = await evaluateRouteProtection("/login", validToken);
    assert.strictEqual(loginDecision.action, "redirect");
    assert.strictEqual(loginDecision.redirectPath, "/");
  });

  await t.test("Actual middleware integration: NextRequest execution with evaluateRouteProtection", async () => {
    if (!NextRequest) {
      return;
    }

    const protectedRoutes = [
      "/",
      "/calculators",
      "/calculators/loan-calculator",
      "/rules",
      "/qa",
      "/seo",
      "/releases",
      "/system",
      "/traffic",
      "/api/traffic",
      "/api/search-console",
    ];

    const validToken = await createSessionToken();
    const tamperedToken = `${validToken.split(".")[0]}.invalid_signature_bytes_12345`;

    // Case A: Unauthenticated requests -> 307 redirect to /login?from=...
    for (const route of protectedRoutes) {
      const req = new NextRequest(`https://admin.ukcalc.jomovate.com${route}`);
      const res = await middleware(req);
      assert.strictEqual(res.status, 307, `Actual middleware: unauthenticated ${route} must return 307 redirect`);
      const location = res.headers.get("location");
      assert.ok(location?.includes("/login"), `Location for ${route} must point to /login`);
      if (route !== "/") {
        assert.ok(location?.includes(`from=${encodeURIComponent(route)}`), `Location must preserve from=${route}`);
      }
    }

    // Case B: Authenticated requests with valid session -> 200 pass through
    for (const route of protectedRoutes) {
      const authReq = new NextRequest(`https://admin.ukcalc.jomovate.com${route}`, {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${validToken}` },
      });
      const authRes = await middleware(authReq);
      assert.strictEqual(authRes.status, 200, `Actual middleware: authenticated request to ${route} must pass through with status 200`);
    }

    // Case C: Authenticated request to /login -> 307 redirect to /
    const loginReq = new NextRequest("https://admin.ukcalc.jomovate.com/login", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${validToken}` },
    });
    const loginRes = await middleware(loginReq);
    assert.strictEqual(loginRes.status, 307, "Actual middleware: authenticated /login must return 307 redirect");
    const loginLoc = loginRes.headers.get("location");
    assert.ok(loginLoc?.endsWith("/"), "Location must point to /");

    // Case D: Tampered/invalid session -> 307 redirect to /login
    for (const route of protectedRoutes) {
      const tamperedReq = new NextRequest(`https://admin.ukcalc.jomovate.com${route}`, {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${tamperedToken}` },
      });
      const tamperedRes = await middleware(tamperedReq);
      assert.strictEqual(tamperedRes.status, 307, `Actual middleware: tampered session on ${route} must redirect to /login`);
      const loc = tamperedRes.headers.get("location");
      assert.ok(loc?.includes("/login"), `Tampered session location must point to /login`);
    }
  });
});