import { NextResponse } from "next/server";
import { clientServeur, clientAdmin } from "@/lib/supabase-serveur";

const DELAI_RELANCE_1_MS = 60 * 60 * 1000;
const EXPEDITEUR = "Panier Perdu <onboarding@resend.dev>";

type Produit = { title: string; quantity: number };

type Panier = {
  id: string;
  boutique_id: string;
  email: string;
  prenom: string | null;
  produits: Produit[];
  montant_centimes: number;
  devise: string;
  lien_reprise: string;
};

function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function euros(centimes: number, devise: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
  }).format(centimes / 100);
}

function composer(panier: Panier, nomBoutique: string) {
  const salutation = panier.prenom ? `Bonjour ${panier.prenom},` : "Bonjour,";
  const lignes = panier.produits.map((p) => `${p.quantity} × ${p.title}`);
  const total = euros(panier.montant_centimes, panier.devise);

  const texte = [
    salutation,
    "",
    "Vous avez laissé quelques articles dans votre panier :",
    ...lignes.map((l) => `- ${l}`),
    `Total : ${total}`,
    "",
    `Reprendre ma commande : ${panier.lien_reprise}`,
    "",
    `L’équipe ${nomBoutique}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#1b1b18;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;padding:32px;border-radius:8px;">
<p style="font-size:18px;margin:0 0 16px;">${echapper(salutation)}</p>
<p style="margin:0 0 16px;">Vous avez laissé quelques articles dans votre panier :</p>
<ul style="margin:0 0 16px;padding-left:20px;">
${lignes.map((l) => `<li>${echapper(l)}</li>`).join("\n")}
</ul>
<p style="margin:0 0 24px;"><strong>Total : ${echapper(total)}</strong></p>
<p style="margin:0 0 24px;"><a href="${echapper(panier.lien_reprise)}" style="background:#14342b;color:#faf6ee;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Reprendre ma commande</a></p>
<p style="margin:0;color:#555;">L’équipe ${echapper(nomBoutique)}</p>
</div></body></html>`;

  return {
    sujet: panier.prenom
      ? `${panier.prenom}, vous avez oublié quelque chose`
      : "Vous avez oublié quelque chose dans votre panier",
    texte,
    html,
  };
}

export async function POST(requete: Request) {
  const origine = new URL(requete.url).origin;
  const retour = (params: string) =>
    NextResponse.redirect(`${origine}/espace/paniers?${params}`, 303);

  const supabase = await clientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origine}/connexion`, 303);
  }

  const cle = process.env.RESEND_API_KEY;
  if (!cle) return retour("erreur=envoi&detail=Cl%C3%A9%20d%27envoi%20manquante");

  const admin = clientAdmin();
  const { data: boutiques } = await admin
    .from("boutiques")
    .select("id, domaine")
    .eq("utilisateur_id", user.id);

  const noms = new Map<string, string>(
    (boutiques ?? []).map((b) => [
      b.id as string,
      (b.domaine as string).replace(".myshopify.com", ""),
    ])
  );
  const ids = Array.from(noms.keys());
  if (ids.length === 0) return retour("envoyees=0");

  const limite = new Date(Date.now() - DELAI_RELANCE_1_MS).toISOString();
  const { data } = await admin
    .from("paniers")
    .select(
      "id, boutique_id, email, prenom, produits, montant_centimes, devise, lien_reprise"
    )
    .in("boutique_id", ids)
    .is("relance1_le", null)
    .is("recupere_le", null)
    .not("email", "is", null)
    .not("lien_reprise", "is", null)
    .lte("abandonne_le", limite);

  const paniers = (data ?? []) as Panier[];
  let envoyees = 0;

  for (const panier of paniers) {
    const mail = composer(panier, noms.get(panier.boutique_id) ?? "la boutique");
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: [panier.email],
        subject: mail.sujet,
        html: mail.html,
        text: mail.texte,
      }),
    });

    if (!reponse.ok) {
      const corps = (await reponse.text()).slice(0, 250);
      console.error("Envoi relance 1 refusé :", reponse.status, corps);
      return retour(
        `erreur=envoi&detail=${encodeURIComponent(`Resend ${reponse.status} : ${corps}`)}`
      );
    }

    await admin
      .from("paniers")
      .update({ relance1_le: new Date().toISOString() })
      .eq("id", panier.id);
    envoyees++;
  }

  return retour(`envoyees=${envoyees}`);
}
