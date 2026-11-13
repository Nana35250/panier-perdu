import Link from "next/link";

export const metadata = {
  title: "Conditions générales de vente | Panier Perdu",
};

function Champ({ children }: { children: string }) {
  return (
    <span className="bg-yellow-200 px-1 font-semibold">
      [À COMPLÉTER : {children}]
    </span>
  );
}

const articles = [
  {
    titre: "1. Objet",
    texte:
      "Les présentes conditions régissent l’abonnement au service Panier Perdu, qui permet à une boutique en ligne d’envoyer deux relances écrites aux clients ayant abandonné leur panier, et de suivre le chiffre d’affaires récupéré.",
  },
  {
    titre: "2. Prix et paiement",
    texte:
      "L’abonnement coûte 9 € par mois et par boutique. Le paiement est mensuel, par carte bancaire, et traité par le prestataire de paiement Stripe. Aucune donnée de carte n’est conservée par l’éditeur.",
  },
  {
    titre: "3. Durée et résiliation",
    texte:
      "L’abonnement est sans engagement. Il peut être résilié à tout moment, par simple message à l’adresse de contact indiquée dans les mentions légales. La résiliation prend effet à la fin de la période mensuelle déjà payée, et aucun nouveau prélèvement n’a lieu ensuite.",
  },
  {
    titre: "4. Garantie satisfait ou remboursé",
    texte:
      "Si le service ne te convient pas, tu peux demander le remboursement de ton premier paiement dans les 14 jours qui suivent ta souscription. Pour cela, écris à l’adresse de contact en indiquant l’adresse e-mail de ton compte. Le remboursement est effectué dans un délai de 7 jours après ta demande, sans justification à fournir.",
  },
  {
    titre: "5. Responsabilité",
    texte:
      "L’éditeur met en œuvre les moyens raisonnables pour assurer le bon fonctionnement du service, sans garantir de résultat chiffré. Le montant récupéré dépend de la boutique, de ses produits et de ses clients. Les montants affichés dans le simulateur sont des estimations, pas des engagements.",
  },
  {
    titre: "6. Données personnelles",
    texte:
      "Le traitement des données est décrit dans la politique de confidentialité, accessible depuis le pied de chaque page.",
  },
  {
    titre: "7. Droit applicable",
    texte:
      "Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action en justice.",
  },
];

export default function ConditionsGenerales() {
  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
      <Link href="/" className="text-sm font-bold text-sapin underline">
        Retour à l’accueil
      </Link>

      <h1 className="font-titre mt-6 text-3xl font-black text-sapin">
        Conditions générales de vente
      </h1>
      <p className="mt-2 text-sm text-encre/70">
        Dernière mise à jour : <Champ>date</Champ>
      </p>

      {articles.map((a) => (
        <section key={a.titre} className="mt-8 space-y-2 leading-relaxed">
          <h2 className="font-titre text-xl font-black text-sapin">{a.titre}</h2>
          <p>{a.texte}</p>
        </section>
      ))}

      <section className="mt-8 space-y-2 leading-relaxed">
        <h2 className="font-titre text-xl font-black text-sapin">8. TVA</h2>
        <p>
          <Champ>
            mention de TVA, par exemple « TVA non applicable, article 293 B du
            CGI » si tu es en micro-entreprise sous le seuil de franchise
          </Champ>
        </p>
      </section>
    </main>
  );
}
