"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

const cle = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = cle ? loadStripe(cle) : null;

const MESSAGE_ERREUR =
  "Le paiement n’a pas pu s’afficher. Recharge la page ou réessaie dans un instant.";

export default function Paiement() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let actif = true;
    fetch("/api/checkout", { method: "POST" })
      .then(async (reponse) => {
        const donnees = await reponse.json();
        if (!reponse.ok || !donnees.clientSecret) {
          throw new Error(donnees.erreur ?? MESSAGE_ERREUR);
        }
        if (actif) setClientSecret(donnees.clientSecret);
      })
      .catch((e: Error) => {
        if (actif) setErreur(e.message || MESSAGE_ERREUR);
      });
    return () => {
      actif = false;
    };
  }, []);

  if (!stripePromise || erreur) {
    return (
      <div className="rounded-lg border-2 border-brique px-5 py-4">
        <p className="font-semibold text-sapin">{erreur || MESSAGE_ERREUR}</p>
        <a
          href="/abonnement"
          className="mt-3 inline-block font-bold text-sapin underline"
        >
          Réessayer
        </a>
      </div>
    );
  }

  if (!clientSecret) {
    return <p className="py-6 text-center text-lg">Chargement du paiement…</p>;
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
