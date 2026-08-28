export const SESSION_COOKIE_NAME = "ukcalc_admin_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (secret && secret.length >= 8) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD or ADMIN_SESSION_SECRET environment variable is required in production.");
  }
  return "ukcalc-admin-dev-fallback-session-key-only";
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function validateCredentials(password: string): boolean {
  if (typeof password !== "string" || password.trim() === "") {
    return false;
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    if (process.env.NODE_ENV === "production") {
      console.error("[AUTH ERROR] ADMIN_PASSWORD environment variable is not configured in production.");
      return false;
    }
    return password === "admin";
  }

  if (password.length !== expectedPassword.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < password.length; i++) {
    result |= password.charCodeAt(i) ^ expectedPassword.charCodeAt(i);
  }
  return result === 0;
}

async function signData(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function createSessionToken(): Promise<string> {
  const payload = {
    auth: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sigB64 = await signData(payloadB64, getSecretKey());
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) {
    return false;
  }

  try {
    const expectedSig = await signData(payloadB64, getSecretKey());
    if (expectedSig !== signatureB64) {
      return false;
    }

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);

    if (!payload.auth || !payload.exp || payload.exp < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}