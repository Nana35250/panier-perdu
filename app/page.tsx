const PRIX = 9;

const benefices = [
  {
    titre: "Deux relances écrites pour toi",
    texte:
      "Un premier message quelques heures après l’abandon, un second le lendemain. Chacun reprend le nom du client et les produits laissés dans son panier.",
  },
  {
    titre: "Un code de réduction, si tu veux",
    texte:
      "Tu peux glisser un code dans la seconde relance pour convaincre les hésitants. C’est facultatif, et tu gardes la main.",
  },
  {
    titre: "Un compteur en euros",
    texte:
      "Tu vois chaque jour combien d’argent est revenu grâce aux relances. Pas de graphique compliqué, juste un chiffre.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
      <p className="text-sm font-bold uppercase tracking-widest text-brique">
        Panier Perdu
      </p>

      <h1 className="font-titre mt-4 text-4xl font-black leading-tight text-sapin sm:text-5xl">
        Récupère les paniers abandonnés de ta boutique.
      </h1>

      <p className="mt-4 text-lg leading-relaxed">
        Deux relances automatiques pour {PRIX} € par mois, sans engagement.
      </p>

      <a
        href="/commencer"
        className="mt-8 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
      >
        Commencer, c’est gratuit
      </a>

      <section className="mt-14 border-t border-sapin/20 pt-8">
        <p className="font-titre text-6xl font-black text-brique">7 sur 10</p>
        <p className="mt-2 text-lg leading-relaxed">
          Environ 7 paniers sur 10 sont abandonnés avant le paiement.
        </p>
        <p className="mt-3 leading-relaxed text-encre/70">
          Exemple : pour 40 commandes par mois, cela fait environ 93 paniers
          qui s’en vont sans un mot. Aujourd’hui, tu ne relances aucun d’entre
          eux.
        </p>
      </section>

      <section className="mt-12 border-t border-sapin/20 pt-8">
        <h2 className="font-titre text-2xl font-black text-sapin">
          Ce que tu obtiens
        </h2>
        <ul className="mt-6 space-y-7">
          {benefices.map((b) => (
            <li key={b.titre}>
              <h3 className="text-lg font-bold text-sapin">{b.titre}</h3>
              <p className="mt-1 leading-relaxed">{b.texte}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-sapin/20 pt-8">
        <p className="font-titre text-2xl font-black text-sapin">
          {PRIX} € par mois, relances illimitées.
        </p>
        <a
          href="/commencer"
          className="mt-6 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
        >
          Commencer, c’est gratuit
        </a>
      </section>
    </main>
  );
}
