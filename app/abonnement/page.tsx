import Link from "next/link";
import Paiement from "./paiement";

export const metadata = {
  title: "Abonnement | Panier Perdu",
};

const PRIX = 9;
const TAUX_RECUPERATION = 0.05;

const questions = [
  {
    q: "Est-ce que ça marche pour ma boutique ?",
    r: "Panier Perdu est fait pour les petites boutiques en ligne qui reçoivent quelques dizaines de commandes par mois. Le montant récupéré dépend de tes produits et de tes clients : le chiffre affiché ici est une estimation prudente, pas une promesse. Et si le service ne te convient pas, tu es remboursé.",
  },
  {
    q: "Combien de temps ça me prend ?",
    r: "Tu connectes ta boutique une seule fois. Ensuite, les deux relances partent toutes seules : tu n’as rien à faire au quotidien, à part regarder le compteur d’euros récupérés.",
  },
  {
    q: "Que se passe-t-il si je veux arrêter ?",
    r: "Tu peux résilier à tout moment, par simple message. Il n’y a aucun engagement : l’abonnement s’arrête à la fin du mois déjà payé, sans nouveau prélèvement.",
  },
  {
    q: "À quoi sert exactement ce que je paie ?",
    r: "À l’envoi de deux relances écrites aux clients qui ont abandonné leur panier, avec un code de réduction facultatif sur la seconde, et au compteur qui t’indique l’argent récupéré. Les relances sont illimitées.",
  },
];

function euros(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

export default async function Abonnement({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const brut = Array.isArray(params.p) ? params.p[0] : params.p;
  const nombre = Number(brut);
  const perdu =
    Number.isInteger(nombre) && nombre > 0 && nombre <= 1_000_000
      ? nombre
      : null;
  const recupere = perdu ? perdu * TAUX_RECUPERATION : null;
  const fois = recupere ? Math.max(1, Math.round(recupere / PRIX)) : null;

  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-8">
      <p className="text-sm font-bold uppercase tracking-widest text-brique">
        Ton abonnement
      </p>

      <h1 className="font-titre mt-4 text-3xl font-black leading-tight text-sapin">
        Ton résultat est prêt. Garde-le et passe à l’action.
      </h1>

      {perdu ? (
        <p className="mt-4 text-lg leading-relaxed">
          Tu laisses partir environ{" "}
          <span className="font-bold text-brique">{euros(perdu)}</span> de
          paniers abandonnés chaque mois.
        </p>
      ) : (
        <p className="mt-4 text-lg leading-relaxed">
          Chaque mois, une partie des paniers de ta boutique est abandonnée
          sans un mot.{" "}
          <Link href="/commencer" className="font-bold text-sapin underline">
            Calcule ce que ça te coûte
          </Link>
          .
        </p>
      )}

      {recupere && fois ? (
        <section className="mt-8 border-t border-sapin/20 pt-6">
          <h2 className="font-titre text-xl font-black text-sapin">
            Ce que ça peut te rapporter
          </h2>
          <p className="mt-3 leading-relaxed">
            Si 5 % de ces paniers reviennent grâce à deux relances, tu
            récupères environ
          </p>
          <p className="font-titre mt-2 text-5xl font-black text-brique">
            {euros(recupere)}
          </p>
          <p className="mt-2 font-semibold text-sapin">par mois</p>
          <p className="mt-3 leading-relaxed">
            L’abonnement coûte {PRIX} € par mois : environ {fois} fois moins
            que ce que tu récupères. C’est une estimation, pas une promesse.
          </p>
        </section>
      ) : null}

      <section className="mt-8 rounded-lg border-2 border-sapin px-5 py-5">
        <h2 className="font-titre text-xl font-black text-sapin">
          Panier Perdu
        </h2>
        <p className="mt-2">
          <span className="font-titre text-4xl font-black text-sapin">
            {PRIX} €
          </span>{" "}
          <span className="font-semibold">par mois</span>
        </p>
        <p className="mt-1 text-sm text-encre/70">
          Soit environ {(PRIX / 30).toFixed(2).replace(".", ",")} € par jour.
          Relances illimitées.
        </p>

        <div className="mt-5 rounded-lg bg-sapin px-4 py-4 text-creme">
          <p className="font-bold">Satisfait ou remboursé pendant 14 jours</p>
          <p className="mt-1 text-sm leading-relaxed">
            Le service ne te convient pas ? Écris-nous dans les 14 jours qui
            suivent ta souscription, à l’adresse indiquée dans les{" "}
            <Link href="/mentions-legales" className="underline">
              mentions légales
            </Link>
            . Tu es remboursé sous 7 jours, sans justification.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <p className="mb-4 font-semibold text-sapin">
          Sans engagement, résiliable à tout moment.
        </p>
        <Paiement />
      </section>

      <section className="mt-12 border-t border-sapin/20 pt-8">
        <h2 className="font-titre text-2xl font-black text-sapin">
          Questions fréquentes
        </h2>
        <div className="mt-6 space-y-7">
          {questions.map((item) => (
            <div key={item.q}>
              <h3 className="text-lg font-bold text-sapin">{item.q}</h3>
              <p className="mt-1 leading-relaxed">{item.r}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
