// Accesso con un link via email (niente password), uguale per clienti, partner e noi.
import type { Metadata } from "next";
import { BackendNotice } from "@/components/BackendNotice";
import { FloatingNav } from "@/components/FloatingNav";
import { supabaseReady } from "@/lib/supabase";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/account" } = await searchParams;
  return (
    <>
      <FloatingNav />
      <main className="wrap co-page-pad" style={{ maxWidth: 640 }}>
        <p className="co-eyebrow">City Of</p>
        <h1 className="co-h2">Sign in</h1>
        <p className="co-status">Use the email you booked with. We send you a link; no password.</p>
        {supabaseReady ? <LoginForm next={next.startsWith("/") ? next : "/account"} /> : <BackendNotice />}
      </main>
    </>
  );
}
