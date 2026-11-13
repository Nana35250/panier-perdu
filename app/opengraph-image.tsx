import { ImageResponse } from "next/og";

export const alt = "Panier Perdu : récupère les paniers abandonnés de ta boutique";
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
          justifyContent: "center",
          padding: "80px",
          background: "#FAF6EE",
          color: "#14342B",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#D9480F",
          }}
        >
          PANIER PERDU
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 84,
            fontWeight: 900,
            lineHeight: 1.05,
          }}
        >
          Récupère les paniers abandonnés de ta boutique.
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 38 }}>
          Deux relances automatiques, 9 € par mois.
        </div>
      </div>
    ),
    { ...size }
  );
}
