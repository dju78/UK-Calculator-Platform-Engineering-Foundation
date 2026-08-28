import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "../../../../lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out." });
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}