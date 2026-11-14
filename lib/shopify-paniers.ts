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

type Connexion = {
  nodes: Noeud[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

type Reponse = {
  errors?: unknown;
  data?: { abandonedCheckouts: Connexion };
};

export async function synchroniserPaniers(boutique: Boutique) {
  const jeton = dechiffrer(boutique.jeton_chiffre);
  const depuis = new Date(Date.now() - JOURS * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const filtre = `created_at:>=${depuis} recovery_state:not_recovered`;

  let curseur: string | null = null;
  const lignes: Record<string, unknown>[] = [];

  for (let page = 0; page < PAGES_MAX; page++) {
    const reponse: Response = await fetch(
      `https://${boutique.domaine}/admin/api/${VERSION_API}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": jeton,
        },
        body: JSON.stringify({
          query: REQUETE,
          variables: { apres: curseur, filtre },
        }),
      }
    );
    if (!reponse.ok) {
      const corps = (await reponse.text()).slice(0, 300);
      throw new Error(`Shopify a répondu ${reponse.status} : ${corps}`);
    }
    const donnees: Reponse = await reponse.json();
    if (donnees.errors || !donnees.data) {
      throw new Error(
        "Shopify : " + JSON.stringify(donnees.errors ?? "pas de données").slice(0, 400)
      );
    }

    const connexion: Connexion = donnees.data.abandonedCheckouts;
    for (const n of connexion.nodes) {
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
    curseur = connexion.pageInfo.endCursor;
  }

  if (lignes.length > 0) {
    const { error } = await clientAdmin()
      .from("paniers")
      .upsert(lignes, { onConflict: "boutique_id,shopify_id" });
    if (error) throw new Error("Enregistrement : " + error.message);
  }

  return { enregistres: lignes.length };
}
