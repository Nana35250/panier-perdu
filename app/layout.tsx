import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panier Perdu : récupère les paniers abandonnés de ta boutique",
  description:
    "Deux relances automatiques pour récupérer les paniers abandonnés de ta petite boutique en ligne. 9 € par mois, sans engagement.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
