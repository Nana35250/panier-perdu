import Link from "next/link";

export const metadata = {
  title: "Mentions légales | Panier Perdu",
};

function Champ({ children }: { children: string }) {
  return (
    <span className="bg-yellow-200 px-1 font-semibold">
      [À COMPLÉTER : {children}]
    </span>
  );
}

export default function MentionsLegales() {
  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
      <Link href="/" className="text-sm font-bold text-sapin underline">
        Retour à l’accueil
      </Link>

      <h1 className="font-titre mt-6 text-3xl font-black text-sapin">
        Mentions légales
      </h1>

      <section className="mt-8 space-y-2 leading-relaxed">
        <h2 className="font-titre text-xl font-black text-sapin">Éditeur du site</h2>
        <p>Le site Panier Perdu est édité par :</p>
        <p>
          <Champ>nom et prénom, ou raison sociale</Champ>
        </p>
        <p>
          Statut : <Champ>par exemple « micro-entrepreneur »</Champ>
        </p>
        <p>
          Numéro SIRET : <Champ>numéro à 14 chiffres</Champ>
        </p>
        <p>
          Adresse : <Champ>adresse postale</Champ>
        </p>
        <p>
          Adresse électronique : <Champ>adresse e-mail de contact</Champ>
        </p>
      </section>

      <section className="mt-8 space-y-2 leading-relaxed">
        <h2 className="font-titre text-xl font-black text-sapin">
          Directeur de la publication
        </h2>
        <p>
          <Champ>nom et prénom</Champ>
        </p>
      </section>

      <section className="mt-8 space-y-2 leading-relaxed">
        <h2 className="font-titre text-xl font-black text-sapin">Hébergeur</h2>
        <p>
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
          Site : vercel.com
        </p>
      </section>

      <section className="mt-8 space-y-2 leading-relaxed">
        <h2 className="font-titre text-xl font-black text-sapin">
          Propriété intellectuelle
        </h2>
        <p>
          Les textes, la présentation et le nom Panier Perdu sont la propriété
          de l’éditeur. Toute reproduction sans autorisation est interdite.
        </p>
      </section>
    </main>
  );
}
