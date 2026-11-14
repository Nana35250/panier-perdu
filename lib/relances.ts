import { clientAdmin } from "@/lib/supabase-serveur";

const DELAI_RELANCE_1_MS = 60 * 60 * 1000;
const DELAI_RELANCE_2_MS = 24 * 60 * 60 * 1000;
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

type Boutique = { nom: string; code: string | null };

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

function composer(panier: Panier, boutique: Boutique, numero: 1 | 2) {
  const salutation = panier.prenom ? `Bonjour ${panier.prenom},` : "Bonjour,";
  const lignes = panier.produits.map((p) => `${p.quantity} × ${p.title}`);
  const total = euros(panier.montant_centimes, panier.devise);

  const intro =
    numero === 1
      ? "Vous avez laissé quelques articles dans votre panier :"
      : "Votre panier vous attend toujours :";
  const code = numero === 2 ? boutique.code : null;
  const phraseCode = code
    ? `Pour vous remercier, voici un code de réduction à saisir au moment du paiement : ${code}`
    : null;

  const texte = [
    salutation,
    "",
    intro,
    ...lignes.map((l) => `- ${l}`),
    `Total : ${total}`,
    ...(phraseCode ? ["", phraseCode] : []),
    "",
    `Reprendre ma commande : ${panier.lien_reprise}`,
    "",
    `L’équipe ${boutique.nom}`,
  ].join("\n");

  const blocCode = code
    ? `<p style="margin:0 0 24px;padding:16px;background:#faf6ee;border-radius:6px;">Pour vous remercier, voici un code de réduction à saisir au moment du paiement :<br><strong style="font-size:20px;letter-spacing:1px;color:#d9480f;">${echapper(code)}</strong></p>`
    : "";

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px;background:#faf6ee;font-family:Arial,Helvetica,sans-serif;color:#1b1b18;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;padding:32px;border-radius:8px;">
<p style="font-size:18px;margin:0 0 16px;">${echapper(salutation)}</p>
<p style="margin:0 0 16px;">${echapper(intro)}</p>
<ul style="margin:0 0 16px;padding-left:20px;">
${lignes.map((l) => `<li>${echapper(l)}</li>`).join("\n")}
</ul>
<p style="margin:0 0 24px;"><strong>Total : ${echapper(total)}</strong></p>
${blocCode}
<p style="margin:0 0 24px;"><a href="${echapper(panier.lien_reprise)}" style="background:#14342b;color:#faf6ee;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Reprendre ma commande</a></p>
<p style="margin:0;color:#555;">L’équipe ${echapper(boutique.nom)}</p>
</div></body></html>`;

  const sujet =
    numero === 1
      ? panier.prenom
        ? `${panier.prenom}, vous avez oublié quelque chose`
        : "Vous avez oublié quelque chose dans votre panier"
      : panier.prenom
      ? `${panier.prenom}, votre panier vous attend toujours`
      : "Votre panier vous attend toujours";

  return { sujet, texte, html };
}

/**
 * Envoie toutes les relances dues.
 * Sans argument : pour toutes les boutiques (tâche automatique).
 * Avec un identifiant d'utilisateur : uniquement pour ses boutiques.
 * Un envoi refusé n'empêche pas les suivants ; la première erreur est renvoyée.
 */
export async function envoyerRelances(
  utilisateurId?: string
): Promise<{ envoyees: number; erreur?: string }> {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return { envoyees: 0, erreur: "Clé d'envoi manquante" };

  const admin = clientAdmin();
  let requeteBoutiques = admin
    .from("boutiques")
    .select("id, domaine, code_reduction");
  if (utilisateurId) {
    requeteBoutiques = requeteBoutiques.eq("utilisateur_id", utilisateurId);
  }
  const { data: lignesBoutiques } = await requeteBoutiques;

  const boutiques = new Map<string, Boutique>(
    (lignesBoutiques ?? []).map((b) => [
      b.id as string,
      {
        nom: (b.domaine as string).replace(".myshopify.com", ""),
        code: (b.code_reduction as string | null) ?? null,
      },
    ])
  );
  const ids = Array.from(boutiques.keys());
  if (ids.length === 0) return { envoyees: 0 };

  const colonnes =
    "id, boutique_id, email, prenom, produits, montant_centimes, devise, lien_reprise";

  const limite1 = new Date(Date.now() - DELAI_RELANCE_1_MS).toISOString();
  const { data: premieres } = await admin
    .from("paniers")
    .select(colonnes)
    .in("boutique_id", ids)
    .is("relance1_le", null)
    .is("recupere_le", null)
    .not("email", "is", null)
    .not("lien_reprise", "is", null)
    .lte("abandonne_le", limite1);

  const limite2 = new Date(Date.now() - DELAI_RELANCE_2_MS).toISOString();
  const { data: secondes } = await admin
    .from("paniers")
    .select(colonnes)
    .in("boutique_id", ids)
    .not("relance1_le", "is", null)
    .is("relance2_le", null)
    .is("recupere_le", null)
    .not("email", "is", null)
    .not("lien_reprise", "is", null)
    .lte("relance1_le", limite2);

  const taches: { panier: Panier; numero: 1 | 2 }[] = [
    ...((premieres ?? []) as Panier[]).map((panier) => ({
      panier,
      numero: 1 as const,
    })),
    ...((secondes ?? []) as Panier[]).map((panier) => ({
      panier,
      numero: 2 as const,
    })),
  ];

  let envoyees = 0;
  let erreur: string | undefined;

  for (const { panier, numero } of taches) {
    const boutique = boutiques.get(panier.boutique_id) ?? {
      nom: "la boutique",
      code: null,
    };
    const mail = composer(panier, boutique, numero);

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
      console.error(`Envoi relance ${numero} refusé :`, reponse.status, corps);
      if (!erreur) erreur = `Resend ${reponse.status} : ${corps}`;
      continue;
    }

    const maintenant = new Date().toISOString();
    await admin
      .from("paniers")
      .update(
        numero === 1
          ? { relance1_le: maintenant }
          : { relance2_le: maintenant, code_reduction: boutique.code }
      )
      .eq("id", panier.id);
    envoyees++;
  }

  return { envoyees, erreur };
}
