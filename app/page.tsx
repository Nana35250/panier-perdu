export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
        Panier Perdu
      </p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight text-stone-900">
        Récupère les paniers abandonnés de ta boutique.
      </h1>
      <p className="mt-4 text-lg text-stone-700">
        Deux relances automatiques, pour 9 € par mois.
      </p>
      <a
        href="#"
        className="mt-8 block rounded-lg bg-stone-900 px-6 py-4 text-center text-lg font-bold text-white"
      >
        Commencer, c’est gratuit
      </a>
    </main>
  );
}
