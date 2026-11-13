"use client";

import Link from "next/link";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="font-titre text-3xl font-black leading-tight text-sapin">
        Quelque chose s’est mal passé.
      </h1>
      <p className="mt-4 text-lg leading-relaxed">
        Ce n’est pas de ta faute. Tu peux réessayer, ou revenir à l’accueil.
      </p>
      <button
        onClick={() => reset()}
        className="mt-8 block w-full rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
      >
        Réessayer
      </button>
      <Link
        href="/"
        className="mt-4 block w-full rounded-lg border-2 border-sapin px-6 py-4 text-center text-lg font-bold text-sapin"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
