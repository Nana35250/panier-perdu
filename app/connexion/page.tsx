"use client";

import { useState } from "react";
import Link from "next/link";
import { clientNavigateur } from "@/lib/supabase-navigateur";

type Etat = "repos" | "envoi" | "envoye" | "erreur";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<Etat>("repos");

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEtat("envoi");

    const { error } = await clientNavigateur().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setEtat(error ? "erreur" : "envoye");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-bold uppercase tracking-widest text-brique">
        Espace abonné
      </p>
      <h1 className="font-titre mt-4 text-3xl font-black leading-tight text-sapin">
        Connecte-toi avec ton e-mail.
      </h1>

      {etat === "envoye" ? (
        <div className="mt-6 rounded-lg border-2 border-sapin px-5 py-5">
          <p className="font-bold text-sapin">Ton lien est en route.</p>
          <p className="mt-2 leading-relaxed">
            Un lien de connexion vient d’être envoyé à {email.trim()}. Ouvre-le
            sur cet appareil. Il est valable quelques minutes. Pense à regarder
            dans les courriers indésirables.
          </p>
        </div>
      ) : (
        <form onSubmit={envoyer} className="mt-6">
          <p className="leading-relaxed">
            Utilise l’adresse e-mail de ton abonnement. Pas de mot de passe :
            nous t’envoyons un lien qui te connecte en un clic.
          </p>
          <label htmlFor="email" className="mt-6 block font-semibold text-sapin">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.com"
            className="mt-2 block w-full rounded-lg border-2 border-sapin bg-creme px-4 py-4 text-lg"
          />
          <button
            type="submit"
            disabled={etat === "envoi"}
            className="mt-4 block w-full rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme disabled:opacity-60"
          >
            {etat === "envoi" ? "Envoi en cours…" : "Recevoir mon lien de connexion"}
          </button>
          {etat === "erreur" && (
            <p className="mt-4 font-semibold text-brique">
              Le lien n’a pas pu être envoyé. Vérifie ton adresse, puis réessaie
              dans quelques minutes.
            </p>
          )}
        </form>
      )}

      <Link href="/" className="mt-8 font-bold text-sapin underline">
        Retour à l’accueil
      </Link>
    </main>
  );
}
