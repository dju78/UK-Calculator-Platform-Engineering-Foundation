export const SESSION_COOKIE_NAME = "ukcalc_admin_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

function getSecretKey(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (isProduction) {
    if (!sessionSecret || sessionSecret.trim().length < 32) {
      throw new Error(
        "[FATAL AUTH CONFIG] ADMIN_SESSION_SECRET is required in production and must be at least 32 characters long."
      );
    }
    return sessionSecret.trim();
  }

  // Development environment only
  if (sessionSecret && sessionSecret.trim().length >= 8) {
    return sessionSecret.trim();
  }
  return "ukcalc-dev-only-session-secret-must-be-32-chars-or-longer";
}

export function validateRedirectDestination(from: string | null | undefined): string {
  if (!from || typeof from !== "string") {
    return "/";
  }
  const trimmed = from.trim();

  // Must begin with exactly one forward slash, not // (protocol-relative), not contain colons (schemes)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes(":") || trimmed.includes("\0")) {
    return "/";
  }

  // Safe internal path
  return trimmed;
}

export function validateCredentials(password: string): boolean {
  if (typeof password !== "string" || password.trim() === "") {
    return false;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (isProduction) {
    if (!expectedPassword || expectedPassword.trim() === "") {
      console.error("[AUTH ERROR] ADMIN_PASSWORD is not configured in production environment.");
      return false;
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

  // Development fallback
  const devPassword = expectedPassword || "admin";
  if (password.length !== devPassword.length) {
    return false;
  }
  let devResult = 0;
  for (let i = 0; i < password.length; i++) {
    devResult |= password.charCodeAt(i) ^ devPassword.charCodeAt(i);
  }
  return devResult === 0;
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