import Link from "next/link";
import { redirect } from "next/navigation";
import { clientAdmin, clientServeur } from "@/lib/supabase-serveur";

export const metadata = {
  title: "Mon espace | Panier Perdu",
  robots: { index: false },
};

export default async function Espace({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const erreur = Array.isArray(params.erreur) ? params.erreur[0] : params.erreur;
  const boutiqueOk = params.boutique === "ok";

  const supabase = await clientServeur();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  const utilisateurId = data.user?.id;
  if (!email || !utilisateurId) redirect("/connexion");

  const base = clientAdmin();
  const motif = email.replace(/[\\%_]/g, "\\$&");
  const { data: lignes, error } = await base
    .from("abonnements")
    .select("statut, cree_le")
    .ilike("email", motif)
    .order("cree_le", { ascending: false })
    .limit(1);

  const { data: boutiques } = await base
    .from("boutiques")
    .select("id, domaine")
    .eq("utilisateur_id", utilisateurId);

  let totalCentimes = 0;
  let devise = "EUR";
  let nombreRecuperes = 0;
  const identifiants = (boutiques ?? []).map((b) => b.id);
  if (identifiants.length > 0) {
    const { data: recuperes } = await base
      .from("paniers")
      .select("montant_recupere_centimes, devise")
      .in("boutique_id", identifiants)
      .not("recupere_le", "is", null);
    for (const r of recuperes ?? []) {
      totalCentimes += r.montant_recupere_centimes ?? 0;
      devise = r.devise || devise;
      nombreRecuperes += 1;
    }
  }
  const montantAffiche = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
  }).format(totalCentimes / 100);

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
              {montantAffiche}
            </p>
            <p className="mt-2 leading-relaxed text-encre/70">
              {nombreRecuperes > 0
                ? `${nombreRecuperes} panier(s) récupéré(s) grâce à tes relances.`
                : "Dès qu’un client achètera après une relance, tu verras ici l’argent revenu grâce à elle."}
            </p>
          </section>

          <section className="mt-8 border-t border-sapin/20 pt-8">
            <h2 className="font-titre text-xl font-black text-sapin">
              Ta boutique
            </h2>

            {boutiqueOk && (
              <p className="mt-3 font-semibold text-sapin">
                Ta boutique est connectée.
              </p>
            )}
            {erreur === "boutique" && (
              <p className="mt-3 font-semibold text-brique">
                Cette adresse n’est pas valide. Elle ressemble à
                ma-boutique.myshopify.com.
              </p>
            )}
            {erreur === "installation" && (
              <p className="mt-3 font-semibold text-brique">
                L’installation n’a pas abouti. Réessaie dans un instant.
              </p>
            )}

            {boutiques && boutiques.length > 0 ? (
              <div className="mt-4 rounded-lg border-2 border-sapin px-5 py-4">
                <p className="font-bold text-sapin">Boutique connectée</p>
                {boutiques.map((b) => (
                  <p key={b.domaine} className="mt-1 break-all">
                    {b.domaine}
                  </p>
                ))}
                <Link
                  href="/espace/paniers"
                  className="mt-4 block rounded-lg bg-brique px-6 py-4 text-center text-lg font-bold text-creme"
                >
                  Voir mes paniers abandonnés
                </Link>
              </div>
            ) : (
              <form action="/api/shopify/install" method="get" className="mt-4">
                <label htmlFor="shop" className="block font-semibold text-sapin">
                  Adresse de ta boutique Shopify
                </label>
                <input
                  id="shop"
                  name="shop"
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="ma-boutique.myshopify.com"
                  className="mt-2 block w-full rounded-lg border-2 border-sapin bg-creme px-4 py-4 text-lg"
                />
                <button
                  type="submit"
                  className="mt-4 block w-full rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
                >
                  Connecter ma boutique
                </button>
              </form>
            )}
          </section>
        </>
      )}

      <form action="/auth/deconnexion" method="post" className="mt-10">
        <button
          type="submit"
          className="block w-full rounded-lg border-2 border-sapin px-6 py-4 text-center text-lg font-bold text-sapin"
        >
          Me déconnecter
        </button>
      </form>

      <Link href="/" className="mt-6 block font-bold text-sapin underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
