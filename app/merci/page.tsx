import Link from "next/link";
import Stripe from "stripe";

export const metadata = {
  title: "Merci | Panier Perdu",
};

async function paiementConfirme(sessionId: string | undefined) {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle || !sessionId) return false;
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return false;

  try {
    const stripe = new Stripe(cle);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return (
      session.status === "complete" &&
      (session.payment_status === "paid" ||
        session.payment_status === "no_payment_required")
    );
  } catch {
    return false;
  }
}

export default async function Merci({
  searchParams,
}: {
  searchParams: Promise<{ [cle: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const brut = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;
  const confirme = await paiementConfirme(brut);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-12">
      {confirme ? (
        <>
          <p className="text-sm font-bold uppercase tracking-widest text-brique">
            Paiement reçu
          </p>
          <h1 className="font-titre mt-4 text-4xl font-black leading-tight text-sapin">
            Merci, ton abonnement est enregistré.
          </h1>
          <p className="mt-4 text-lg leading-relaxed">
            Nous t’écrivons très vite pour connecter ta boutique. Garde un œil
            sur ta boîte mail, et regarde aussi dans les courriers
            indésirables.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-titre text-3xl font-black leading-tight text-sapin">
            Nous n’avons pas pu confirmer ton paiement.
          </h1>
          <p className="mt-4 text-lg leading-relaxed">
            Si tu as été débité, écris-nous à l’adresse indiquée dans les
            mentions légales, nous réglerons cela. Sinon, tu peux réessayer.
          </p>
          <Link
            href="/abonnement"
            className="mt-8 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
          >
            Réessayer
          </Link>
        </>
      )}
      <Link href="/" className="mt-6 font-bold text-sapin underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
