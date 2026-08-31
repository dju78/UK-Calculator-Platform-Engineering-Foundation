import { ImageResponse } from "next/og";

export const alt = "UK Calculator Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px 80px",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#ffffff"
            }}
          >
            £
          </div>
          <span style={{ fontSize: "30px", fontWeight: "700", letterSpacing: "-0.5px" }}>
            UK Calculator Platform
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1
            style={{
              fontSize: "54px",
              fontWeight: "800",
              letterSpacing: "-1.5px",
              lineHeight: "1.15",
              margin: 0,
              color: "#f8fafc"
            }}
          >
            Free, Transparent UK Financial & Technical Calculators
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              margin: 0,
              maxWidth: "960px",
              lineHeight: "1.4"
            }}
          >
            253 verified calculators with official 2026/27 HMRC tax rules, mortgage amortisation, and transparent formulas.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #334155",
            paddingTop: "24px"
          }}
        >
          <span style={{ fontSize: "22px", color: "#60a5fa", fontWeight: "600" }}>
            ukcalc.jomovate.com
          </span>
          <span
            style={{
              fontSize: "18px",
              color: "#e2e8f0",
              background: "#1e3a8a",
              border: "1px solid #3b82f6",
              padding: "6px 18px",
              borderRadius: "9999px"
            }}
          >
            2026/27 Tax Year Verified
          </span>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
