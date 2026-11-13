import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <p className="font-titre text-7xl font-black text-brique">404</p>
      <h1 className="font-titre mt-4 text-3xl font-black leading-tight text-sapin">
        Cette page n’existe pas.
      </h1>
      <p className="mt-4 text-lg leading-relaxed">
        L’adresse est peut-être mal écrite, ou la page a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-8 block rounded-lg bg-sapin px-6 py-4 text-center text-lg font-bold text-creme"
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
