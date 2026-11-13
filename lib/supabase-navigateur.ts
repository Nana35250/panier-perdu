import { createBrowserClient } from "@supabase/ssr";

export function clientNavigateur() {
  return createBrowserClient(
    "https://qhdcufsqmmbwjycouoqm.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
