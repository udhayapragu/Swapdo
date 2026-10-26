import { ImageResponse } from "next/og";

export const alt = "SWAPDO — Everything You Need. Only When You Need It.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, backgroundColor: "#060608", backgroundImage: "radial-gradient(60% 70% at 25% 20%, rgba(201,164,95,0.35), transparent), radial-gradient(60% 60% at 85% 90%, rgba(106,79,209,0.45), transparent)", color: "#f4f0e8" }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 12, fontWeight: 700 }}>
          SWAP<span style={{ color: "#dcbb7c" }}>DO</span>
        </div>
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2, display: "flex", flexDirection: "column" }}>
          <span>Everything You Need.</span>
          <span style={{ color: "#dcbb7c", fontStyle: "italic" }}>Only When You Need It.</span>
        </div>
        <div style={{ marginTop: 36, fontSize: 28, color: "#b4b0bd" }}>Premium AI tools, digital experiences and creator services — by the hour.</div>
      </div>
    ),
    size,
  );
}
