// Cornice delle pagine di testo: legali, chi siamo, contatti.
import { FloatingNav } from "./FloatingNav";
import { Footer } from "./Footer";

export function TextPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <FloatingNav />
      <main className="wrap co-page-pad">
        <p className="co-eyebrow">{eyebrow}</p>
        <h1 className="co-h2">{title}</h1>
        {updated && <p className="co-note">Last updated {updated}</p>}
        <div className="prose co-prose">{children}</div>
      </main>
      <Footer />
    </>
  );
}
