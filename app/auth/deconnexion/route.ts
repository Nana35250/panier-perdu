import { NextResponse } from "next/server";
import { clientServeur } from "@/lib/supabase-serveur";

export async function POST(request: Request) {
  const supabase = await clientServeur();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
