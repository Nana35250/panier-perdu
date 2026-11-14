import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { chiffrer } from "@/lib/chiffrement";
import { clientAdmin, clientServeur } from "@/lib/supabase-serveur";

const DOMAINE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

function signatureValide(parametres: URLSearchParams, secret: string) {
  const recue = parametres.get("hmac") ?? "";
  const message = Array.from(parametres.entries())
    .filter(([cle]) => cle !== "hmac")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([cle, valeur]) => `${cle}=${valeur}`)
    .join("&");
  const attendue = createHmac("sha256", secret).update(message).digest("hex");
  const a = Buffer.from(recue, "utf8");
  const b = Buffer.from(attendue, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const adresse = new URL(request.url);

  function fin(chemin: string) {
    const reponse = NextResponse.redirect(`${adresse.origin}${chemin}`);
    reponse.cookies.delete("shopify_etat");
    return reponse;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  const p = adresse.searchParams;
  const boutique = (p.get("shop") ?? "").toLowerCase();
  const code = p.get("code") ?? "";
  const etat = p.get("state") ?? "";

  if (!clientId || !secret || !code || !DOMAINE.test(boutique)) {
    return fin("/espace?erreur=installation");
  }
  if (!signatureValide(p, secret)) {
    return fin("/espace?erreur=installation");
  }

  const magasin = await cookies();
  const etatAttendu = magasin.get("shopify_etat")?.value;
  if (!etatAttendu || etatAttendu !== etat) {
    return fin("/espace?erreur=installation");
  }

  const supabase = await clientServeur();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fin("/connexion");

  try {
    const reponse = await fetch(`https://${boutique}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: secret, code }),
    });
    if (!reponse.ok) return fin("/espace?erreur=installation");

    const jeton = (await reponse.json()) as {
      access_token?: string;
      scope?: string;
    };
    if (!jeton.access_token) return fin("/espace?erreur=installation");

    const { error } = await clientAdmin()
      .from("boutiques")
      .upsert(
        {
          utilisateur_id: data.user.id,
          plateforme: "shopify",
          domaine: boutique,
          jeton_chiffre: chiffrer(jeton.access_token),
          portee: jeton.scope ?? "",
          mis_a_jour_le: new Date().toISOString(),
        },
        { onConflict: "domaine" }
      );
    if (error) return fin("/espace?erreur=installation");
  } catch {
    return fin("/espace?erreur=installation");
  }

  return fin("/espace?boutique=ok");
}
