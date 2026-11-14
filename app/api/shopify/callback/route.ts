import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { clientServeur, clientAdmin } from "@/lib/supabase-serveur";
import { chiffrer } from "@/lib/chiffrement";

const DOMAINE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

function hmacValide(params: URLSearchParams, secret: string): boolean {
  const recu = params.get("hmac");
  if (!recu) return false;
  const message = Array.from(params.entries())
    .filter(([cle]) => cle !== "hmac")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([cle, valeur]) => `${cle}=${valeur}`)
    .join("&");
  const attendu = createHmac("sha256", secret).update(message).digest("hex");
  const a = Buffer.from(attendu, "utf8");
  const b = Buffer.from(recu, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type ReponseJeton = {
  access_token?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

export async function GET(requete: Request) {
  const url = new URL(requete.url);
  const origine = url.origin;
  const echec = () =>
    NextResponse.redirect(`${origine}/espace?erreur=installation`);

  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  if (!secret || !clientId) return echec();

  const params = url.searchParams;
  const shop = params.get("shop") ?? "";
  const code = params.get("code");
  const etat = params.get("state");

  if (!hmacValide(params, secret) || !DOMAINE.test(shop) || !code) {
    return echec();
  }

  const jar = await cookies();
  const etatCookie = jar.get("shopify_etat")?.value;
  if (!etat || !etatCookie || etat !== etatCookie) return echec();

  const supabase = await clientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origine}/connexion`);
  }

  const echange = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      code,
      expiring: "1",
    }),
  });
  if (!echange.ok) return echec();

  const jeton: ReponseJeton = await echange.json();
  if (!jeton.access_token) return echec();

  const maintenant = Date.now();
  const { error } = await clientAdmin()
    .from("boutiques")
    .upsert(
      {
        utilisateur_id: user.id,
        plateforme: "shopify",
        domaine: shop,
        jeton_chiffre: chiffrer(jeton.access_token),
        portee: jeton.scope ?? "read_orders",
        jeton_expire_le: jeton.expires_in
          ? new Date(maintenant + jeton.expires_in * 1000).toISOString()
          : null,
        renouvellement_chiffre: jeton.refresh_token
          ? chiffrer(jeton.refresh_token)
          : null,
        renouvellement_expire_le: jeton.refresh_token_expires_in
          ? new Date(
              maintenant + jeton.refresh_token_expires_in * 1000
            ).toISOString()
          : null,
        mis_a_jour_le: new Date().toISOString(),
      },
      { onConflict: "domaine" }
    );
  if (error) return echec();

  const reponse = NextResponse.redirect(`${origine}/espace?boutique=ok`);
  reponse.cookies.delete("shopify_etat");
  return reponse;
}
