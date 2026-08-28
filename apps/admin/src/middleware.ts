import { NextResponse, type NextRequest } from "next/server.js";
import { SESSION_COOKIE_NAME, evaluateRouteProtection } from "./lib/auth.js";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const decision = await evaluateRouteProtection(pathname, sessionCookie);

  if (decision.action === "redirect" && decision.redirectPath) {
    return NextResponse.redirect(new URL(decision.redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};