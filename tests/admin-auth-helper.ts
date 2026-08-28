import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "ukcalc_admin_session";
const SESSION_MAX_AGE_SECONDS = 86400; // 24 hours

function getSigningSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SESSION_SECRET or ADMIN_PASSWORD (min 16 chars) must be set in production"
    );
  }
  return "ukcalc-platform-insecure-dev-session-secret-change-in-prod-32ch";
}

export async function createSessionToken(): Promise<string> {
  const secret = getSigningSecret();
  const payload = {
    auth: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payloadB64).digest("base64url");

  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadB64, providedSig] = parts;

  try {
    const secret = getSigningSecret();
    const expectedSig = createHmac("sha256", secret).update(payloadB64).digest("base64url");

    const providedBuffer = Buffer.from(providedSig);
    const expectedBuffer = Buffer.from(expectedSig);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      return false;
    }

    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);

    if (!payload || payload.auth !== true) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function validateCredentials(password: string): boolean {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "production" && !configuredPassword) {
    console.error("[AUTH ERROR] ADMIN_PASSWORD is not configured in production environment.");
    return false;
  }

  const validPassword = configuredPassword || "admin";

  const inputBuffer = Buffer.from(password);
  const targetBuffer = Buffer.from(validPassword);

  if (inputBuffer.length !== targetBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, targetBuffer);
}

export function validateRedirectDestination(destination: string | null | undefined): string {
  if (!destination || typeof destination !== "string") {
    return "/";
  }

  const trimmed = destination.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("://") ||
    trimmed.toLowerCase().includes("javascript:") ||
    trimmed.toLowerCase().includes("data:")
  ) {
    return "/";
  }

  return trimmed;
}

export interface RouteProtectionDecision {
  action: "next" | "redirect";
  redirectPath?: string;
  statusCode?: number;
}

const PUBLIC_EXACT_PATHS = new Set(["/login"]);
const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon.ico"];

export async function evaluateRouteProtection(
  pathname: string,
  sessionCookieValue: string | undefined | null
): Promise<RouteProtectionDecision> {
  const isPublicPrefix = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublicPrefix) {
    return { action: "next" };
  }

  const isAuthenticated = await verifySessionToken(sessionCookieValue);

  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    if (isAuthenticated) {
      return {
        action: "redirect",
        redirectPath: "/",
        statusCode: 307,
      };
    }
    return { action: "next" };
  }

  if (!isAuthenticated) {
    const fromParam = pathname !== "/" ? `?from=${encodeURIComponent(pathname)}` : "";
    return {
      action: "redirect",
      redirectPath: `/login${fromParam}`,
      statusCode: 307,
    };
  }

  return { action: "next" };
}
