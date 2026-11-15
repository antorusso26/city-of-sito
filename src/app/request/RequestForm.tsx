"use client";

import { useActionState } from "react";
import { type RequestState, sendRequest } from "./actions";

export function RequestForm({ items, people, pkg, whatsapp }: { items: string[]; people: number; pkg?: string; whatsapp: string | null }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(sendRequest, null);

  if (state?.ok) {
    return (
      <div className="co-msg ok">
        <p><b>Request sent. Your reference is {state.code}.</b></p>
        <p>We ask each partner and write back by email, usually within a day. You can follow it in <a href="/account">My bookings</a>.</p>
      </div>
    );
  }

  return (
    <form action={action} className="co-form">
      <input type="hidden" name="items" value={items.join(",")} />
      {pkg && <input type="hidden" name="package" value={pkg} />}
      <div className="co-row2">
        <label>Name<input name="name" autoComplete="name" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      </div>
      <div className="co-row2">
        <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" /></label>
        <label>People<input name="people" type="number" min={1} max={50} defaultValue={people} required /></label>
      </div>
      <div className="co-row2">
        <label>From<input name="starts_on" type="date" /></label>
        <label>To<input name="ends_on" type="date" /></label>
      </div>
      <label>Anything we should know<textarea name="notes" placeholder="Children, a birthday, a time that works better…" /></label>
      {state?.error && <p className="co-msg warn">{state.error}</p>}
      {state?.notConnected && (
        <div className="co-msg warn">
          <p><b>Online requests open soon.</b> For now, send us the same details on WhatsApp.</p>
          {whatsapp ? <p><a className="co-btn small" href={whatsapp} target="_blank" rel="noopener">Open WhatsApp</a></p> : <p>The WhatsApp line opens soon too.</p>}
        </div>
      )}
      <div><button className="co-btn" disabled={pending}>{pending ? "Sending…" : "Send request"}</button></div>
      <p className="co-note">Nothing is charged now. Each partner confirms first; then we send the price and how to pay the deposit.</p>
    </form>
  );
}
