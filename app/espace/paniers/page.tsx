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
  relance1_le: string | null;
  relance2_le: string | null;
};

function euros(centimes: number, devise: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
  }).format(centimes / 100);
}

function date(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR");
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
    .select("id, domaine, code_reduction")
    .eq("utilisateur_id", user.id);

  const ids = (boutiques ?? []).map((b) => b.id);
  const codeActuel = (boutiques?.[0]?.code_reduction as string | null) ?? "";

  let paniers: Panier[] = [];
  if (ids.length > 0) {
    const { data } = await admin
      .from("paniers")
      .select(
        "id, email, prenom, produits, montant_centimes, devise, abandonne_le, relance1_le, relance2_le"
      )
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

      {params.envoyees && (
        <p className="mt-4 rounded border-2 border-sapin p-3">
          {params.envoyees === "0"
            ? "Aucune relance à envoyer pour le moment."
            : `${params.envoyees} relance(s) envoyée(s).`}
        </p>
      )}

      {params.code === "ok" && (
        <p className="mt-4 rounded border-2 border-sapin p-3">
          Code de réduction enregistré.
        </p>
      )}

      {params.erreur === "code" && (
        <p className="mt-4 rounded border-2 border-brique p-3">
          Ce code n’est pas valide. Utilise seulement des lettres, des chiffres,
          des tirets ou des tirets bas (40 caractères au plus).
        </p>
      )}

      {params.erreur === "envoi" && (
        <p className="mt-4 rounded border-2 border-brique p-3">
          L’envoi a échoué.
          {params.detail ? ` ${params.detail}` : ""}
        </p>
      )}

      {params.erreur === "1" && (
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
          <div className="mt-6 flex flex-wrap gap-3">
            <form action="/api/shopify/synchroniser" method="POST">
              <button
                type="submit"
                className="rounded bg-sapin px-5 py-3 font-semibold text-creme"
              >
                Actualiser mes paniers
              </button>
            </form>
            <form action="/api/relances/envoyer" method="POST">
              <button
                type="submit"
                className="rounded bg-brique px-5 py-3 font-semibold text-creme"
              >
                Envoyer les relances
              </button>
            </form>
          </div>

          <form
            action="/api/boutique/reglages"
            method="POST"
            className="mt-6 rounded border-2 border-sapin p-4"
          >
            <label htmlFor="code" className="block font-semibold">
              Code de réduction de la 2e relance (facultatif)
            </label>
            <p className="mt-1 text-sm">
              Crée ce code dans l’administration de ta boutique Shopify, puis
              recopie-le ici. Laisse vide pour ne proposer aucune réduction.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <input
                id="code"
                name="code"
                type="text"
                defaultValue={codeActuel}
                maxLength={40}
                placeholder="RETOUR10"
                className="rounded border-2 border-sapin bg-white px-3 py-2"
              />
              <button
                type="submit"
                className="rounded bg-sapin px-5 py-2 font-semibold text-creme"
              >
                Enregistrer
              </button>
            </div>
          </form>

          <p className="mt-6">
            <strong>{paniers.length}</strong> panier(s) avec e-mail, pour un
            total de{" "}
            <strong>{euros(total, paniers[0]?.devise ?? "EUR")}</strong>.
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
                  {date(p.abandonne_le)}
                </p>
                <p className="mt-1 text-sm font-semibold text-sapin">
                  {p.relance2_le
                    ? `Relance 2 envoyée le ${date(p.relance2_le)}`
                    : p.relance1_le
                    ? `Relance 1 envoyée le ${date(p.relance1_le)}`
                    : "Aucune relance envoyée"}
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
