import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const SUPABASE_URL = "https://qhdcufsqmmbwjycouoqm.supabase.co";

type CookieAEcrire = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function clientServeur() {
  const magasin = await cookies();
  return createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return magasin.getAll();
        },
        setAll(liste: CookieAEcrire[]) {
          try {
            liste.forEach(({ name, value, options }) =>
              magasin.set(name, value, options)
            );
          } catch {
            // Appel depuis une page : les cookies sont gérés ailleurs.
          }
        },
      },
    }
  );
}

export function clientAdmin() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
