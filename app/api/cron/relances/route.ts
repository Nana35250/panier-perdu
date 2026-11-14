import { NextResponse } from "next/server";
import { clientAdmin } from "@/lib/supabase-serveur";
import { synchroniserPaniers } from "@/lib/shopify-paniers";
import { envoyerRelances } from "@/lib/relances";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(requete: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || requete.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const { data: boutiques } = await clientAdmin()
    .from("boutiques")
    .select("id, domaine, jeton_chiffre")
    .eq("plateforme", "shopify");

  const erreurs: string[] = [];
  let enregistres = 0;
  let recuperes = 0;

  for (const b of boutiques ?? []) {
    try {
      const r = await synchroniserPaniers({
        id: b.id as string,
        domaine: b.domaine as string,
        jeton_chiffre: b.jeton_chiffre as string,
      });
      enregistres += r.enregistres;
      recuperes += r.recuperes;
    } catch (e) {
      const message = e instanceof Error ? e.message : "erreur inconnue";
      console.error("Synchronisation échouée :", b.domaine, message);
      erreurs.push(`${b.domaine} : ${message}`);
    }
  }

  const { envoyees, erreur } = await envoyerRelances();
  if (erreur) erreurs.push(erreur);

  return NextResponse.json({ enregistres, recuperes, envoyees, erreurs });
}
