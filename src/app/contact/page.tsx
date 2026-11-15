import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default function Contact() {
  const wa = whatsappLink("Hi City Of, ");
  const waPartner = whatsappLink("Hi City Of, I run a business on the coast and I'd like to work with you: ");
  return (
    <TextPage eyebrow="Contact" title="Talk to a person">
      <h2>Travellers</h2>
      <p>For a trip or a question about a booking: {wa ? <a href={wa} target="_blank" rel="noopener">WhatsApp</a> : "WhatsApp (the line opens soon)"} or email [BOOKINGS EMAIL]. To book, the quickest way is a <Link href="/amalfi-coast">request from the site</Link>: we answer with the price.</p>
      <h2 id="partners">Partners</h2>
      <p>If you run a boat, a kitchen, a guide service, a car or a hotel on the coast and want guests who know the price before they arrive, write to {waPartner ? <a href={waPartner} target="_blank" rel="noopener">us on WhatsApp</a> : "us"} or [PARTNERS EMAIL]. We come to meet you. No exclusivity.</p>
      <h2>Company</h2>
      <p>[COMPANY NAME], [ADDRESS], VAT [VAT ID].</p>
    </TextPage>
  );
}
