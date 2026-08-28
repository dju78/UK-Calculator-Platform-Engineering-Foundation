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

  await t.test("validateCredentials checks password against environment or dev fallback", () => {
    process.env.ADMIN_PASSWORD = "test-secure-admin-pass-1234";

    assert.strictEqual(validateCredentials("test-secure-admin-pass-1234"), true);
    assert.strictEqual(validateCredentials("wrong-password"), false);
    assert.strictEqual(validateCredentials(""), false);
    assert.strictEqual(validateCredentials(null as any), false);

    delete process.env.ADMIN_PASSWORD;
  });
});