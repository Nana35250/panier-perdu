import { NextResponse } from "next/server";
import { clientServeur } from "@/lib/supabase-serveur";

export async function GET(request: Request) {
  const adresse = new URL(request.url);
  const code = adresse.searchParams.get("code");

  if (code) {
    const supabase = await clientServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${adresse.origin}/espace`);
    }
  }

  return NextResponse.redirect(`${adresse.origin}/connexion?erreur=1`);
}
