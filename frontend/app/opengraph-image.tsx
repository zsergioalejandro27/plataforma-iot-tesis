import { ImageResponse } from "next/og";

// Imagen que aparece al compartir el enlace (WhatsApp, LinkedIn, etc.).
// Next la genera con este código; no hay que mantener un PNG.
export const alt = "Sema · Central de IoT";
export const size = { width: 1200, height: 630 };
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
          background: "#12181B",
          color: "#F7F6F2",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 170,
              height: 170,
              borderRadius: 38,
              background: "#2B6E63",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 44,
            }}
          >
            <svg width="116" height="116" viewBox="0 0 64 64" fill="none">
              <path
                d="M46 14H18L34 32L18 50H46"
                stroke="#E2A33D"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="18" cy="14" r="5" fill="#E2A33D" />
              <circle cx="34" cy="32" r="5" fill="#E2A33D" />
              <circle cx="18" cy="50" r="5" fill="#E2A33D" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 128,
                fontWeight: 700,
                letterSpacing: 22,
              }}
            >
              SEMA
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 44,
                color: "#E2A33D",
                letterSpacing: 4,
              }}
            >
              Central de IoT
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 64,
            fontSize: 30,
            color: "#9AA5A1",
          }}
        >
          Plataforma IoT modular y multi-tenant
        </div>
      </div>
    ),
    { ...size },
  );
}
