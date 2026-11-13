import Link from "next/link";
import { redirect } from "next/navigation";
import { clientAdmin, clientServeur } from "@/lib/supabase-serveur";

export const metadata = {
  title: "Mon espace | Panier Perdu",
  robots: { index: false },
};

export default async function Espace() {
  const supabase = await clientServeur();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) redirect("/connexion");

  const motif = email.replace(/[\\%_]/g, "\\$&");
  const { data: lignes, error } = await clientAdmin()
    .from("abonnements")
    .select("statut, cree_le")
    .ilike("email", motif)
    .order("cree_le", { ascending: false })
    .limit(1);

  const abonnement = lignes?.[0];

  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
      <p className="text-sm font-bold uppercase tracking-widest text-brique">
        Mon espace
      </p>
      <h1 className="font-titre mt-4 text-3xl font-black leading-tight text-sapin">
        Bonjour.
      </h1>
      <p className="mt-2 text-sm text-encre/70">Connecté avec {email}</p>

      {error ? (
        <div className="mt-8 rounded-lg border-2 border-brique px-5 py-5">
          <p className="font-bold text-sapin">
            Nous n’arrivons pas à lire ton abonnement.
          </p>
          <p className="mt-2 leading-relaxed">
            Recharge la page dans un instant. Si le problème continue, écris-nous
            à l’adresse indiquée dans les mentions légales.
          </p>
        </div>
      ) : !abonnement ? (
        <div className="mt-8 rounded-lg border-2 border-sapin px-5 py-5">
          <p className="font-bold text-sapin">
            Aucun abonnement n’est lié à cette adresse.
          </p>
          <p className="mt-2 leading-relaxed">
            Tu t’es peut-être abonné avec une autre adresse e-mail. Sinon, tu
            peux t’abonner en quelques instants.
          </p>
          <Link
            href="/abonnement"
            className="mt-4 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
          >
            Voir l’abonnement
          </Link>
        </div>
      ) : abonnement.statut === "impaye" ? (
        <div className="mt-8 rounded-lg border-2 border-brique px-5 py-5">
          <p className="font-bold text-sapin">Ton dernier paiement a échoué.</p>
          <p className="mt-2 leading-relaxed">
            Vérifie ta carte bancaire. Si tu as besoin d’aide, écris-nous à
            l’adresse indiquée dans les mentions légales.
          </p>
        </div>
      ) : abonnement.statut === "resilie" ? (
        <div className="mt-8 rounded-lg border-2 border-sapin px-5 py-5">
          <p className="font-bold text-sapin">Ton abonnement est résilié.</p>
          <p className="mt-2 leading-relaxed">
            Tu peux te réabonner quand tu veux.
          </p>
          <Link
            href="/abonnement"
            className="mt-4 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
          >
            Me réabonner
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-lg border-2 border-sapin px-5 py-5">
            <p className="font-bold text-sapin">Ton abonnement est actif.</p>
            <p className="mt-1 text-sm text-encre/70">
              Depuis le{" "}
              {new Date(abonnement.cree_le).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <section className="mt-8 border-t border-sapin/20 pt-8">
            <h2 className="font-titre text-xl font-black text-sapin">
              Chiffre d’affaires récupéré
            </h2>
            <p className="font-titre mt-3 text-6xl font-black text-brique">
              0 €
            </p>
            <p className="mt-2 leading-relaxed text-encre/70">
              Dès que tes relances partiront, tu verras ici l’argent revenu
              grâce à elles.
            </p>
          </section>

          <section className="mt-8 border-t border-sapin/20 pt-8">
            <h2 className="font-titre text-xl font-black text-sapin">
              Ta boutique
            </h2>
            <p className="mt-3 leading-relaxed">
              Aucune boutique n’est encore connectée. La connexion à ta boutique
              n’est pas encore disponible : tu la feras depuis cette page.
            </p>
          </section>
        </>
      )}

      <Link href="/" className="mt-10 block font-bold text-sapin underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
