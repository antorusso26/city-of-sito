import type { Metadata } from "next";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

// BOZZA da far rivedere a un legale prima del lancio. I dati tra [parentesi] vanno completati.
export default function Privacy() {
  return (
    <TextPage eyebrow="Legal" title="Privacy policy" updated="[DATE]">
      <p>This page explains what personal data City Of collects when you use this site or book through us, why, and what you can ask us to do with it.</p>
      <h2>Who is responsible</h2>
      <p>[COMPANY NAME], [ADDRESS], VAT [VAT ID] (&quot;City Of&quot;, &quot;we&quot;). Contact for privacy: [PRIVACY EMAIL].</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>When you send a booking request:</b> name, email, phone (optional), number of people, dates, what you want to book and any notes you write.</li>
        <li><b>When you sign in:</b> your email address, used to send you a sign-in link.</li>
        <li><b>When you write to us on WhatsApp or by email:</b> the messages and your contact details.</li>
        <li><b>Technical data:</b> the cookies needed to keep you signed in, and the style you chose for the site (stored only in your browser). See the <a href="/cookies">cookie policy</a>.</li>
      </ul>
      <h2>Why, and on what basis</h2>
      <ul>
        <li>To answer your request and organise the booking with the partners who run each service (performance of a contract, or steps you asked for before one).</li>
        <li>To keep records required by tax and accounting law (legal obligation).</li>
        <li>To send you news or offers, only if you agree (consent, which you can withdraw at any time).</li>
      </ul>
      <h2>Who we share it with</h2>
      <ul>
        <li>The local partner who runs each service you book: only what they need (name, people, date, notes).</li>
        <li>Service providers that host the site and data for us: [Vercel Inc.] (hosting), [Supabase Inc.] (database, servers in the EU), [Resend] (emails), [Stripe] (payments, when online payment opens), [Meta / WhatsApp] (if you write to us there).</li>
      </ul>
      <p>Some of these providers are outside the EU; transfers rely on the European Commission&apos;s standard contractual clauses or adequacy decisions. [CONFIRM FOR EACH PROVIDER]</p>
      <h2>How long we keep it</h2>
      <p>Booking data: [10 years] for tax purposes. Requests that did not become a booking: [24 months]. Marketing consent: until you withdraw it.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct, delete or move your data, to limit or object to its use, and to withdraw consent. Write to [PRIVACY EMAIL]. You can also complain to the Italian data protection authority (Garante per la protezione dei dati personali, garanteprivacy.it).</p>
    </TextPage>
  );
}
