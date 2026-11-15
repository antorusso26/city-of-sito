import type { Metadata } from "next";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "Cancellation policy", alternates: { canonical: "/cancellation" } };

// BOZZA: le soglie e le percentuali sono da decidere (brief, "regole di cancellazione del cliente").
export default function Cancellation() {
  return (
    <TextPage eyebrow="Legal" title="Cancellation policy" updated="[DATE]">
      <h2>If the partner or the weather cancels</h2>
      <p>You choose: another date, or a full refund of your deposit. Always.</p>
      <h2>If you cancel</h2>
      <ul>
        <li>More than [X] days before: full refund of the deposit.</li>
        <li>Between [X] and [Y] days before: [PERCENT] of the deposit is refunded.</li>
        <li>Less than [Y] days before, or if you do not show up: the deposit is not refunded.</li>
      </ul>
      <p>Hotels and houses may have their own rules; they are written on the confirmation before you pay.</p>
      <h2>How to cancel</h2>
      <p>Reply to your confirmation email or write to us on WhatsApp with your booking reference. A person answers.</p>
    </TextPage>
  );
}
