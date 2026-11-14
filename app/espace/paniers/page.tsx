import Link from "next/link";
import { redirect } from "next/navigation";
import { clientServeur, clientAdmin } from "@/lib/supabase-serveur";

export const dynamic = "force-dynamic";

type Panier = {
  id: string;
  email: string | null;
  prenom: string | null;
  produits: { title: string; quantity: number }[];
  montant_centimes: number;
  devise: string;
  abandonne_le: string;
};

function euros(centimes: number, devise: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
  }).format(centimes / 100);
}

export default async function PagePaniers({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | undefined }>;
}) {
  const params = await searchParams;

  const supabase = await clientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const admin = clientAdmin();
  const { data: boutiques } = await admin
    .from("boutiques")
    .select("id, domaine")
    .eq("utilisateur_id", user.id);

  const ids = (boutiques ?? []).map((b) => b.id);
  let paniers: Panier[] = [];
  if (ids.length > 0) {
    const { data } = await admin
      .from("paniers")
      .select("id, email, prenom, produits, montant_centimes, devise, abandonne_le")
      .in("boutique_id", ids)
      .order("abandonne_le", { ascending: false })
      .limit(50);
    paniers = (data ?? []) as Panier[];
  }

  const total = paniers.reduce((somme, p) => somme + p.montant_centimes, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-encre">
      <p className="text-sm font-semibold uppercase tracking-wide text-brique">
        Mes paniers abandonnés
      </p>
      <h1 className="font-titre mt-2 text-3xl font-bold text-sapin">
        Paniers à relancer
      </h1>

      {params.erreur && (
        <p className="mt-4 rounded border-2 border-brique p-3">
          La lecture des paniers a échoué. Réessaie dans un instant.
        </p>
      )}

      {ids.length === 0 ? (
        <p className="mt-6">
          Aucune boutique n’est connectée. Retourne sur ton espace pour en
          connecter une.
        </p>
      ) : (
        <>
          <form action="/api/shopify/synchroniser" method="POST" className="mt-6">
            <button
              type="submit"
              className="rounded bg-sapin px-5 py-3 font-semibold text-creme"
            >
              Actualiser mes paniers
            </button>
          </form>

          <p className="mt-6">
            <strong>{paniers.length}</strong> panier(s) avec e-mail, pour un
            total de <strong>{euros(total, paniers[0]?.devise ?? "EUR")}</strong>.
          </p>

          <ul className="mt-4 space-y-3">
            {paniers.map((p) => (
              <li key={p.id} className="rounded border-2 border-sapin p-4">
                <p className="font-semibold">
                  {p.prenom ? `${p.prenom} · ` : ""}
                  {p.email}
                </p>
                <p className="text-sm">
                  {p.produits.map((x) => `${x.quantity} × ${x.title}`).join(", ")}
                </p>
                <p className="mt-1 text-sm">
                  {euros(p.montant_centimes, p.devise)} · abandonné le{" "}
                  {new Date(p.abandonne_le).toLocaleDateString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8">
        <Link href="/espace" className="underline">
          Retour à mon espace
        </Link>
      </p>
    </main>
  );
}
