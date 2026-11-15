// Il link dell'email arriva qui: si scambia il codice con la sessione e si va alla pagina richiesta.
import { NextResponse } from "next/server";
import { supabase, supabaseReady } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (code && supabaseReady) {
    const sb = await supabase();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
