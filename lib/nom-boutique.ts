import { clientAdmin } from "@/lib/supabase-serveur";

type ReponseNom = { data?: { shop?: { name?: string } } };

/**
 * Lit le nom commercial de la boutique chez Shopify et l'enregistre.
 * Ne bloque jamais la synchronisation : en cas d'échec, on ignore.
 */
export async function enregistrerNom(
  boutique: { id: string; domaine: string },
  jeton: string
) {
  try {
    const reponse = await fetch(
      `https://${boutique.domaine}/admin/api/2026-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": jeton,
        },
        body: JSON.stringify({ query: "{ shop { name } }" }),
      }
    );
    if (!reponse.ok) return;
    const donnees: ReponseNom = await reponse.json();
    const nom = donnees.data?.shop?.name;
    if (nom) {
      await clientAdmin().from("boutiques").update({ nom }).eq("id", boutique.id);
    }
  } catch {
    // on ignore : le nom reste celui déjà enregistré
  }
}
