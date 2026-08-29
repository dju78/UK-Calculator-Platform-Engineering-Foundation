import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";
import {
  getAdminGoogleSearchOverview,
  getSafeGoogleSearchStatus,
  SearchConsolePeriod,
} from "../../../lib/admin-data/google-search-console";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(sessionToken);

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Unauthorized: Admin session required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const period: SearchConsolePeriod =
    periodParam === "24h" || periodParam === "7d" || periodParam === "30d"
      ? periodParam
      : "30d";

  const overview = await getAdminGoogleSearchOverview(period);
  const safeStatus = getSafeGoogleSearchStatus(overview);

  return NextResponse.json(safeStatus, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
