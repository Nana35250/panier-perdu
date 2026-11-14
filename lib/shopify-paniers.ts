import { clientAdmin } from "@/lib/supabase-serveur";
import { dechiffrer } from "@/lib/chiffrement";

const VERSION_API = "2026-01";
const JOURS = 60;
const PAGES_MAX = 4;

const REQUETE = `
query Paniers($apres: String, $filtre: String) {
  abandonedCheckouts(first: 50, after: $apres, query: $filtre, sortKey: ID, reverse: true) {
    nodes {
      id
      abandonedCheckoutUrl
      createdAt
      completedAt
      customer { firstName email }
      totalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 10) { nodes { title quantity } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

type Boutique = { id: string; domaine: string; jeton_chiffre: string };

type Noeud = {
  id: string;
  abandonedCheckoutUrl: string;
  createdAt: string;
  completedAt: string | null;
  customer: { firstName: string | null; email: string | null } | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  lineItems: { nodes: { title: string; quantity: number }[] };
};

export async function synchroniserPaniers(boutique: Boutique) {
  const jeton = dechiffrer(boutique.jeton_chiffre);
  const depuis = new Date(Date.now() - JOURS * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const filtre = `created_at:>=${depuis} recovery_state:not_recovered`;

  let apres: string | null = null;
  let lus = 0;
  const lignes: Record<string, unknown>[] = [];

  for (let page = 0; page < PAGES_MAX; page++) {
    const reponse = await fetch(
      `https://${boutique.domaine}/admin/api/${VERSION_API}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": jeton,
        },
        body: JSON.stringify({ query: REQUETE, variables: { apres, filtre } }),
      }
    );
    if (!reponse.ok) {
      throw new Error(`Shopify a répondu ${reponse.status}.`);
    }
    const donnees = await reponse.json();
    if (donnees.errors) {
      throw new Error("Shopify a refusé la lecture des paniers.");
    }

    const connexion = donnees.data.abandonedCheckouts;
    for (const n of connexion.nodes as Noeud[]) {
      lus++;
      const email = n.customer?.email ?? null;
      if (!email || n.completedAt) continue;
      lignes.push({
        boutique_id: boutique.id,
        shopify_id: n.id,
        email,
        prenom: n.customer?.firstName ?? null,
        produits: n.lineItems.nodes,
        montant_centimes: Math.round(
          parseFloat(n.totalPriceSet.shopMoney.amount) * 100
        ),
        devise: n.totalPriceSet.shopMoney.currencyCode,
        lien_reprise: n.abandonedCheckoutUrl,
        abandonne_le: n.createdAt,
      });
    }

    if (!connexion.pageInfo.hasNextPage) break;
    apres = connexion.pageInfo.endCursor;
  }

  if (lignes.length > 0) {
    const { error } = await clientAdmin()
      .from("paniers")
      .upsert(lignes, { onConflict: "boutique_id,shopify_id" });
    if (error) throw new Error("Enregistrement des paniers impossible.");
  }

  return { lus, enregistres: lignes.length };
}
