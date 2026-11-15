import { NextResponse } from "next/server";
import { supabase, supabaseReady } from "@/lib/supabase";

export async function POST(request: Request) {
  if (supabaseReady) await (await supabase()).auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
