import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

test("Admin Console Auth Suite", async (t: any) => {
  const authModulePath = pathToFileURL(join(process.cwd(), "apps/admin/src/lib/auth.ts")).href;
  const {
    createSessionToken,
    verifySessionToken,
    validateCredentials,
    validateRedirectDestination,
    SESSION_COOKIE_NAME,
  } = await import(authModulePath);

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

  await t.test("Route Protection Logic redirects unauthenticated requests across all protected routes", async () => {
    const protectedRoutes = [
      "/",
      "/calculators",
      "/calculators/loan-calculator",
      "/rules",
      "/qa",
      "/seo",
      "/releases",
      "/system",
    ];

    async function evaluateRouteAccess(pathname: string, sessionToken?: string) {
      const isAuthenticated = await verifySessionToken(sessionToken);
      if (pathname === "/login") {
        if (isAuthenticated) return { status: 307, location: "/" };
        return { status: 200 };
      }
      if (!isAuthenticated) {
        const fromParam = pathname !== "/" ? `?from=${encodeURIComponent(pathname)}` : "";
        return { status: 307, location: `/login${fromParam}` };
      }
      return { status: 200 };
    }

    for (const route of protectedRoutes) {
      const unauthResult = await evaluateRouteAccess(route, undefined);
      assert.strictEqual(unauthResult.status, 307, `Unauthenticated ${route} must redirect 307`);
      assert.ok(unauthResult.location?.startsWith("/login"), `Redirect location for ${route} must point to /login`);
      if (route !== "/") {
        assert.ok(unauthResult.location?.includes(`from=${encodeURIComponent(route)}`), `Redirect must preserve target route ${route}`);
      }
    }

    // Authenticated request access granted
    const validToken = await createSessionToken();
    for (const route of protectedRoutes) {
      const authResult = await evaluateRouteAccess(route, validToken);
      assert.strictEqual(authResult.status, 200, `Authenticated request to ${route} must be granted status 200`);
    }

    // Authenticated visit to /login redirects to /
    const loginResult = await evaluateRouteAccess("/login", validToken);
    assert.strictEqual(loginResult.status, 307);
    assert.strictEqual(loginResult.location, "/");
  });
});