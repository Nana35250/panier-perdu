import { NextResponse } from "next/server";
import { clientServeur } from "@/lib/supabase-serveur";
import { envoyerRelances } from "@/lib/relances";

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

  const { envoyees, erreur } = await envoyerRelances(user.id);

  if (erreur) {
    return retour(
      `erreur=envoi&detail=${encodeURIComponent(erreur)}`
    );
  }
  return retour(`envoyees=${envoyees}`);
}
