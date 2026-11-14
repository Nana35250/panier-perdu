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
    let enregistres = 0;
    for (const boutique of boutiques ?? []) {
      const resultat = await synchroniserPaniers(boutique);
      enregistres += resultat.enregistres;
    }
    return NextResponse.redirect(`${origine}/espace?paniers=${enregistres}`, 303);
  } catch {
    return NextResponse.redirect(`${origine}/espace?erreur=paniers`, 303);
  }
}
