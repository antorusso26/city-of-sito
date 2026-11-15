// Collegamento a Supabase. Finché le variabili non ci sono, il sito funziona lo stesso:
// le pagine riservate lo dicono e la richiesta di prenotazione propone WhatsApp.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseReady = Boolean(URL && ANON);

/** Client lato server con la sessione dell'utente (cookie). Le regole di accesso le applica il database (RLS). */
export async function supabase() {
  if (!supabaseReady) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // In una pagina (non in un'azione) i cookie non si possono scrivere: la sessione si rinnova al prossimo invio.
        }
      },
    },
  });
}

export async function currentUser() {
  if (!supabaseReady) return null;
  const sb = await supabase();
  const { data } = await sb.auth.getUser();
  return data.user;
}

export async function currentRole(): Promise<"customer" | "partner" | "admin" | null> {
  const user = await currentUser();
  if (!user) return null;
  const sb = await supabase();
  const { data } = await sb.from("profiles").select("role").eq("id", user.id).single();
  return (data?.role as "customer" | "partner" | "admin") ?? "customer";
}
