import type { Metadata } from "next";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "Cookie policy", alternates: { canonical: "/cookies" } };

// Oggi il sito usa solo cookie tecnici: niente banner. Se si aggiungono statistiche o pixel pubblicitari serve il consenso.
export default function Cookies() {
  return (
    <TextPage eyebrow="Legal" title="Cookie policy" updated="[DATE]">
      <p>This site uses only what it needs to work. We do not use advertising or tracking cookies, so we do not ask for consent.</p>
      <ul>
        <li><b>Sign-in cookies</b> (set by our database provider, Supabase): keep you signed in to your bookings. They last until you sign out or the session expires.</li>
        <li><b>Your chosen style</b>: stored in your browser (local storage) so the site looks the way you picked. It never leaves your device.</li>
      </ul>
      <p>If we add statistics or advertising tools in the future, we will ask for your consent first and update this page.</p>
    </TextPage>
  );
}
