import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://panier-perdu-lyhm.vercel.app"),
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
    <html lang="fr" className={`${fraunces.variable} ${instrument.variable}`}>
      <body>
        {children}
        <footer className="mx-auto max-w-xl border-t border-sapin/20 px-6 py-8 text-sm">
          <nav className="flex flex-wrap gap-x-6 gap-y-3 font-semibold text-sapin">
            <Link href="/mentions-legales" className="underline">
              Mentions légales
            </Link>
            <Link href="/conditions-generales" className="underline">
              Conditions générales de vente
            </Link>
            <Link href="/confidentialite" className="underline">
              Confidentialité
            </Link>
          </nav>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
