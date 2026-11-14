import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { clientServeur } from "@/lib/supabase-serveur";

const DOMAINE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export async function GET(request: Request) {
  const adresse = new URL(request.url);

  const supabase = await clientServeur();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(`${adresse.origin}/connexion`);
  }

  const boutique = (adresse.searchParams.get("shop") ?? "").trim().toLowerCase();
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!clientId || !DOMAINE.test(boutique)) {
    return NextResponse.redirect(`${adresse.origin}/espace?erreur=boutique`);
  }

  const etat = randomBytes(16).toString("hex");
  const lien = new URL(`https://${boutique}/admin/oauth/authorize`);
  lien.searchParams.set("client_id", clientId);
  lien.searchParams.set("scope", "read_orders");
  lien.searchParams.set(
    "redirect_uri",
    `${adresse.origin}/api/shopify/callback`
  );
  lien.searchParams.set("state", etat);

  const reponse = NextResponse.redirect(lien.toString());
  reponse.cookies.set("shopify_etat", etat, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return reponse;
}
