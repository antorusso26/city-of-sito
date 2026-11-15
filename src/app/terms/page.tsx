import type { Metadata } from "next";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "Terms of booking", alternates: { canonical: "/terms" } };

// BOZZA da far rivedere a un legale: il ruolo di City Of (intermediazione) è una questione aperta del brief (3.1).
export default function Terms() {
  return (
    <TextPage eyebrow="Legal" title="Terms of booking" updated="[DATE]">
      <h2>What City Of does</h2>
      <p>City Of selects local partners (boat operators, cooks, guides, drivers, hotels and hosts) and arranges bookings with them for you. Each service is run by the partner named on its page, who is responsible for providing it. [LEGAL ROLE OF CITY OF TO BE CONFIRMED]</p>
      <h2>How a booking works</h2>
      <ol>
        <li>You send a request. It is not yet a booking and nothing is charged.</li>
        <li>We ask each partner. When they confirm, we send you the full price, what is included and what is paid on the day.</li>
        <li>You confirm by paying a deposit to City Of. The balance is paid to the partner, as stated on the confirmation.</li>
      </ol>
      <h2>Prices</h2>
      <p>Prices are in euros and include VAT where due. Extras such as landing fees, grotto tickets or fuel surcharges are listed on each page and on your confirmation before you pay.</p>
      <h2>Weather and safety</h2>
      <p>The skipper or partner decides whether it is safe to go. If they cancel because of the weather, we offer another date or refund your deposit in full.</p>
      <h2>Cancelling</h2>
      <p>See the <a href="/cancellation">cancellation policy</a>.</p>
      <h2>Liability</h2>
      <p>[TO BE WRITTEN WITH A LAWYER: limits of City Of&apos;s responsibility, partners&apos; insurance, complaints.]</p>
      <h2>Law and disputes</h2>
      <p>These terms are governed by Italian law. Consumers keep the protections of the law of their country of residence. EU online dispute resolution: ec.europa.eu/consumers/odr.</p>
      <p>[COMPANY NAME], [ADDRESS], VAT [VAT ID].</p>
    </TextPage>
  );
}
