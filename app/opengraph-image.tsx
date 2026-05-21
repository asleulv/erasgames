import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#171511",
          color: "#fffaf0"
        }}
      >
        <div style={{ display: "flex", color: "#fdb913", fontSize: 34, fontWeight: 900 }}>Eras Games</div>
        <div style={{ display: "flex", fontSize: 78, fontWeight: 900, lineHeight: 1.02, marginTop: 26 }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    size
  );
}
