import { ImageResponse } from "next/og";
import { siteDescription, siteName } from "@/lib/site";

export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link preview for the pages that have no poster of their own. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "linear-gradient(135deg, #0b0b0f 0%, #1c1a12 100%)",
          color: "#fafaf9",
        }}
      >
        <div style={{ fontSize: 96 }}>🎬</div>
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
          {siteName}
        </div>
        <div style={{ fontSize: 30, color: "#fbbf24", maxWidth: 800, textAlign: "center" }}>
          {siteDescription}
        </div>
      </div>
    ),
    size,
  );
}
