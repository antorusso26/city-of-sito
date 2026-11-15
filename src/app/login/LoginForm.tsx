"use client";

import { useActionState } from "react";
import { type LoginState, sendLink } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendLink, null);
  if (state?.sent) return <p className="co-msg ok">Check your inbox: the link to sign in is on its way.</p>;
  return (
    <form action={action} className="co-form">
      <input type="hidden" name="next" value={next} />
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      {state?.error && <p className="co-msg warn">{state.error}</p>}
      <div><button className="co-btn" disabled={pending}>{pending ? "Sending…" : "Send me a link"}</button></div>
    </form>
  );
}
