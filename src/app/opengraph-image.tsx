import { ImageResponse } from "next/og";

export const alt = "CrushSVG - Convert SVG to PNG Exactly as Intended";
export const size = {
  width: 1200,
  height: 630,
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFCFA",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#D94A1E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "28px",
              fontWeight: "bold",
              marginRight: "16px",
            }}
          >
            SVG
          </div>
          <span
            style={{
              fontSize: "44px",
              fontWeight: "800",
              color: "#353A3E",
              letterSpacing: "-0.02em",
            }}
          >
            Crush<span style={{ color: "#D94A1E" }}>SVG</span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "52px",
            fontWeight: "800",
            color: "#353A3E",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: "960px",
            marginBottom: "20px",
            justifyContent: "center",
          }}
        >
          Convert SVG to PNG Exactly as Intended
        </div>

        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#64748B",
            textAlign: "center",
            maxWidth: "780px",
            lineHeight: 1.4,
            marginBottom: "36px",
            justifyContent: "center",
          }}
        >
          Pixel-perfect rendering for Outlook, Gmail, newsletters and websites.
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            padding: "12px 28px",
            borderRadius: "999px",
            border: "1px solid #F2EDE8",
          }}
        >
          <span style={{ fontSize: "18px", color: "#353A3E", fontWeight: "600", marginRight: "16px" }}>No signup required</span>
          <span style={{ fontSize: "18px", color: "#D94A1E", marginRight: "16px" }}>•</span>
          <span style={{ fontSize: "18px", color: "#353A3E", fontWeight: "600", marginRight: "16px" }}>Up to 16x scale</span>
          <span style={{ fontSize: "18px", color: "#D94A1E", marginRight: "16px" }}>•</span>
          <span style={{ fontSize: "18px", color: "#353A3E", fontWeight: "600" }}>100% Free</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
