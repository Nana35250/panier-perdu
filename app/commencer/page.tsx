"use client";

import { useState } from "react";
import Link from "next/link";

const PRIX = 9;
const TAUX_RECUPERATION = 0.05;

type Option = { label: string; valeur: number };

const questions: { titre: string; options: Option[] }[] = [
  {
    titre: "Combien de commandes reçois-tu par mois ?",
    options: [
      { label: "Moins de 20", valeur: 15 },
      { label: "20 à 50", valeur: 35 },
      { label: "50 à 100", valeur: 75 },
      { label: "Plus de 100", valeur: 130 },
    ],
  },
  {
    titre: "Quel est le montant moyen d’un panier ?",
    options: [
      { label: "Moins de 30 €", valeur: 25 },
      { label: "30 à 60 €", valeur: 45 },
      { label: "60 à 100 €", valeur: 80 },
      { label: "Plus de 100 €", valeur: 130 },
    ],
  },
  {
    titre: "Que fais-tu aujourd’hui des paniers abandonnés ?",
    options: [
      { label: "Rien du tout", valeur: 0 },
      { label: "Je relance à la main, quand j’y pense", valeur: 1 },
      { label: "J’ai un outil, mais il est trop cher", valeur: 2 },
    ],
  },
];

const situation = [
  "Aujourd’hui, tu ne relances aucun de ces paniers.",
  "Aujourd’hui, tu n’en relances que quelques-uns à la main, quand tu y penses.",
  "Aujourd’hui, tu as un outil de relance, mais il te coûte trop cher.",
];

function euros(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

export default function Commencer() {
  const [reponses, setReponses] = useState<Option[]>([]);
  const etape = reponses.length;

  function choisir(option: Option) {
    setReponses([...reponses, option]);
  }

  function revenir() {
    setReponses(reponses.slice(0, -1));
  }

  if (etape < 3) {
    const q = questions[etape];
    return (
      <main className="mx-auto max-w-xl px-6 pb-16 pt-8">
        <p className="text-sm font-bold uppercase tracking-widest text-brique">
          Question {etape + 1} sur 3
        </p>
        <div className="mt-3 h-2 w-full rounded-full bg-sapin/15">
          <div
            className="h-2 rounded-full bg-brique"
            style={{ width: `${((etape + 1) / 3) * 100}%` }}
          />
        </div>

        <h1 className="font-titre mt-8 text-3xl font-black leading-tight text-sapin">
          {q.titre}
        </h1>

        <div className="mt-8 space-y-3">
          {q.options.map((o) => (
            <button
              key={o.label}
              onClick={() => choisir(o)}
              className="block w-full rounded-lg border-2 border-sapin bg-creme px-5 py-4 text-left text-lg font-semibold text-sapin active:bg-sapin active:text-creme"
            >
              {o.label}
            </button>
          ))}
        </div>

        {etape > 0 && (
          <button
            onClick={revenir}
            className="mt-8 text-base font-semibold text-sapin underline"
          >
            Revenir à la question précédente
          </button>
        )}
      </main>
    );
  }

  const [rCommandes, rPanier, rSituation] = reponses;
  const paniersAbandonnes = Math.round((rCommandes.valeur * 7) / 3);
  const perdu = paniersAbandonnes * rPanier.valeur;
  const recupere = perdu * TAUX_RECUPERATION;
  const fois = Math.round(recupere / PRIX);

  return (
    <main className="mx-auto max-w-xl px-6 pb-16 pt-8">
      <p className="text-sm font-bold uppercase tracking-widest text-brique">
        Ton résultat
      </p>

      <h1 className="font-titre mt-4 text-3xl font-black leading-tight text-sapin">
        Tu laisses partir environ
      </h1>
      <p className="font-titre mt-2 text-6xl font-black text-brique">
        {euros(perdu)}
      </p>
      <p className="mt-2 text-lg font-semibold text-sapin">
        de paniers abandonnés chaque mois.
      </p>

      <p className="mt-6 leading-relaxed">
        Tu reçois {rCommandes.label.toLowerCase()} commandes par mois, avec un
        panier moyen de {rPanier.label.toLowerCase()}. Cela fait environ{" "}
        {paniersAbandonnes} paniers remplis puis abandonnés.{" "}
        {situation[rSituation.valeur]}
      </p>

      <section className="mt-10 border-t border-sapin/20 pt-8">
        <h2 className="font-titre text-2xl font-black text-sapin">
          Ce que Panier Perdu changerait
        </h2>
        <p className="mt-4 leading-relaxed">
          Si seulement 5 % de ces paniers revenaient grâce à deux relances,
          tu récupérerais environ
        </p>
        <p className="font-titre mt-2 text-5xl font-black text-brique">
          {euros(recupere)}
        </p>
        <p className="mt-2 text-lg font-semibold text-sapin">par mois.</p>
        <p className="mt-4 leading-relaxed">
          L’abonnement coûte {PRIX} € par mois : tu récupérerais environ{" "}
          {fois} fois ce que tu paies.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-encre/70">
          Il s’agit d’une estimation prudente, pas d’une promesse : le résultat
          dépend de ta boutique et de tes clients.
        </p>
      </section>

      <Link
        href={`/abonnement?p=${Math.round(perdu)}`}
        className="mt-10 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
      >
        Garder mon résultat et continuer
      </Link>

      <Link
        href="/"
        className="mt-5 block text-center font-semibold text-sapin underline"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
