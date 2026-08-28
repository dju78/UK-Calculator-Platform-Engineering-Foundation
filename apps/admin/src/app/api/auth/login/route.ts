import { NextResponse, type NextRequest } from "next/server";
import { validateCredentials, createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!validateCredentials(password)) {
      const resp = NextResponse.json(
        { error: "Invalid administrator credentials." },
        { status: 401 }
      );
      resp.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return resp;
    }

    const token = await createSessionToken();
    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({ success: true, message: "Authenticated." });
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });

    return response;
  } catch {
    const resp = NextResponse.json(
      { error: "Malformed login request." },
      { status: 400 }
    );
    resp.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return resp;
  }
}