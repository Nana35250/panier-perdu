import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { clientServeur } from "@/lib/supabase-serveur";

const DOMAINE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const PORTEES = "read_orders,read_customers";

export async function GET(requete: Request) {
  const url = new URL(requete.url);
  const origine = url.origin;

  const supabase = await clientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origine}/connexion`);
  }

  const shop = (url.searchParams.get("shop") ?? "").trim().toLowerCase();
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!clientId || !DOMAINE.test(shop)) {
    return NextResponse.redirect(`${origine}/espace?erreur=installation`);
  }

  const etat = randomBytes(16).toString("hex");
  const adresse = new URL(`https://${shop}/admin/oauth/authorize`);
  adresse.searchParams.set("client_id", clientId);
  adresse.searchParams.set("scope", PORTEES);
  adresse.searchParams.set("redirect_uri", `${origine}/api/shopify/callback`);
  adresse.searchParams.set("state", etat);

  const reponse = NextResponse.redirect(adresse.toString());
  reponse.cookies.set("shopify_etat", etat, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return reponse;
}
