import { clientAdmin } from "@/lib/supabase-serveur";
import { dechiffrer, chiffrer } from "@/lib/chiffrement";

const VERSION_API = "2026-01";
const JOURS = 60;
const PAGES_MAX = 4;
const MARGE_MS = 5 * 60 * 1000;

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

type ReponseJeton = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

async function jetonValide(boutique: Boutique): Promise<string> {
  const admin = clientAdmin();
  const { data } = await admin
    .from("boutiques")
    .select("jeton_chiffre, jeton_expire_le, renouvellement_chiffre")
    .eq("id", boutique.id)
    .single();
  if (!data) throw new Error("Boutique introuvable.");

  const expire = data.jeton_expire_le
    ? new Date(data.jeton_expire_le).getTime()
    : null;
  if (expire === null || expire > Date.now() + MARGE_MS) {
    return dechiffrer(data.jeton_chiffre);
  }

  if (!data.renouvellement_chiffre) {
    throw new Error("Clé expirée : reconnecte ta boutique.");
  }
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("Identifiants Shopify manquants.");

  const reponse = await fetch(
    `https://${boutique.domaine}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: secret,
        grant_type: "refresh_token",
        refresh_token: dechiffrer(data.renouvellement_chiffre),
      }),
    }
  );
  if (!reponse.ok) {
    throw new Error(
      `Renouvellement refusé (${reponse.status}) : reconnecte ta boutique.`
    );
  }
  const jeton: ReponseJeton = await reponse.json();
  if (!jeton.access_token) throw new Error("Renouvellement sans clé.");

  const maintenant = Date.now();
  const { error } = await admin
    .from("boutiques")
    .update({
      jeton_chiffre: chiffrer(jeton.access_token),
      jeton_expire_le: jeton.expires_in
        ? new Date(maintenant + jeton.expires_in * 1000).toISOString()
        : null,
      renouvellement_chiffre: jeton.refresh_token
        ? chiffrer(jeton.refresh_token)
        : data.renouvellement_chiffre,
      renouvellement_expire_le: jeton.refresh_token_expires_in
        ? new Date(
            maintenant + jeton.refresh_token_expires_in * 1000
          ).toISOString()
        : null,
      mis_a_jour_le: new Date().toISOString(),
    })
    .eq("id", boutique.id);
  if (error) throw new Error("Enregistrement de la nouvelle clé impossible.");

  return jeton.access_token;
}

export async function synchroniserPaniers(boutique: Boutique) {
  const jeton = await jetonValide(boutique);
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
