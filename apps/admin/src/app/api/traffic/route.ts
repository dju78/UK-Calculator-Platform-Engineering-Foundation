import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";
import { getAdminTrafficOverview, getSafeTrafficStatus, TrafficTimePeriod } from "../../../lib/admin-data/traffic-analytics";

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
  const period: TrafficTimePeriod =
    periodParam === "24h" || periodParam === "30d" ? periodParam : "7d";

  const overview = await getAdminTrafficOverview(period);
  const safeStatus = getSafeTrafficStatus(overview);

  return NextResponse.json(safeStatus, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
