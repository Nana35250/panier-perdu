import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité | Panier Perdu",
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
    titre: "Quelles données sont collectées",
    texte:
      "Lors de ton inscription : ton adresse e-mail. Lorsque tu connectes ta boutique : les paniers abandonnés (produits, montants) et les adresses e-mail des clients concernés, uniquement pour leur envoyer les relances que tu as activées. Lors du paiement : les informations de carte sont saisies directement chez Stripe, et l’éditeur ne les voit ni ne les conserve.",
  },
  {
    titre: "Pourquoi ces données sont utilisées",
    texte:
      "Pour fournir le service (envoi des relances, calcul du chiffre d’affaires récupéré), gérer ton abonnement et te répondre quand tu nous écris. Elles ne sont ni vendues ni utilisées à d’autres fins publicitaires.",
  },
  {
    titre: "Qui peut y accéder",
    texte:
      "Uniquement l’éditeur et les prestataires techniques nécessaires au service : Vercel (hébergement), Supabase (base de données et connexion), Stripe (paiement) et le service d’envoi d’e-mails utilisé pour les relances. Certains de ces prestataires sont situés hors de l’Union européenne.",
  },
  {
    titre: "Mesure d’audience",
    texte:
      "Le site utilise Vercel Web Analytics, une mesure d’audience qui ne dépose aucun cookie et ne permet pas d’identifier les visiteurs. Les réponses au simulateur affiché sur la page « Commencer » ne sont pas enregistrées.",
  },
  {
    titre: "Durée de conservation",
    texte:
      "Les données de ton compte sont conservées pendant la durée de ton abonnement, puis supprimées dans un délai de 12 mois après sa fin, sauf obligation légale de conservation (par exemple pour la comptabilité).",
  },
  {
    titre: "Tes droits",
    texte:
      "Tu peux demander l’accès à tes données, leur correction, leur suppression ou leur export, en écrivant à l’adresse indiquée ci-dessous. Tu peux aussi introduire une réclamation auprès de la CNIL (cnil.fr).",
  },
];

export default function Confidentialite() {
  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
      <Link href="/" className="text-sm font-bold text-sapin underline">
        Retour à l’accueil
      </Link>

      <h1 className="font-titre mt-6 text-3xl font-black text-sapin">
        Politique de confidentialité
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
        <h2 className="font-titre text-xl font-black text-sapin">Contact</h2>
        <p>
          Responsable du traitement : <Champ>nom et prénom, ou raison sociale</Champ>
        </p>
        <p>
          Adresse e-mail : <Champ>adresse e-mail de contact</Champ>
        </p>
      </section>
    </main>
  );
}
