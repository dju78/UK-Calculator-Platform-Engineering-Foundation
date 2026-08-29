import { NextResponse } from "next/server";
import { getAdminTrafficOverview, getSafeTrafficStatus, TrafficTimePeriod } from "../../../lib/admin-data/traffic-analytics";

export async function GET(request: Request) {
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
