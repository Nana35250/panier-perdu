import { NextResponse } from "next/server";
import { clientServeur, clientAdmin } from "@/lib/supabase-serveur";

const FORMAT = /^[A-Za-z0-9_-]{1,40}$/;

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

  const formulaire = await requete.formData();
  const brut = String(formulaire.get("code") ?? "").trim();
  if (brut !== "" && !FORMAT.test(brut)) {
    return retour("erreur=code");
  }

  const { error } = await clientAdmin()
    .from("boutiques")
    .update({ code_reduction: brut === "" ? null : brut })
    .eq("utilisateur_id", user.id);
  if (error) return retour("erreur=code");

  return retour("code=ok");
}
