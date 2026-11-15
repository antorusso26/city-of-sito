/** Mostrato nelle pagine riservate finché Supabase non è collegato. */
export function BackendNotice() {
  return (
    <div className="co-msg warn">
      <p><b>The booking system is not connected yet.</b></p>
      <p>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to the environment, load
        <code> supabase/migrations</code> and <code>supabase/seed.sql</code>, then reload. See <code>docs/backend.md</code>.</p>
    </div>
  );
}
