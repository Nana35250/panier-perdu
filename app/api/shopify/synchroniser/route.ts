import { NextResponse } from "next/server";
import { clientServeur, clientAdmin } from "@/lib/supabase-serveur";
import { synchroniserPaniers } from "@/lib/shopify-paniers";

export async function POST(requete: Request) {
  const origine = new URL(requete.url).origin;

  const supabase = await clientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origine}/connexion`, 303);
  }

  const { data: boutiques } = await clientAdmin()
    .from("boutiques")
    .select("id, domaine, jeton_chiffre")
    .eq("utilisateur_id", user.id);

  try {
    for (const boutique of boutiques ?? []) {
      await synchroniserPaniers(boutique);
    }
    return NextResponse.redirect(`${origine}/espace/paniers`, 303);
  } catch (erreur) {
    console.error("Synchronisation des paniers :", erreur);
    const detail = erreur instanceof Error ? erreur.message : "inconnue";
    return NextResponse.redirect(
      `${origine}/espace/paniers?erreur=1&detail=${encodeURIComponent(detail)}`,
      303
    );
  }
}
