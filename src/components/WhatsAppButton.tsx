import { whatsappLink } from "@/lib/site";

/** Invito all'azione principale del sito. Finché il numero non è impostato lo dice chiaramente, senza sembrare rotto. */
export function WhatsAppButton({ message, label = "Message us on WhatsApp", variant = "city" }: { message: string; label?: string; variant?: "city" | "dark" }) {
  const href = whatsappLink(message);
  const cls = variant === "city" ? "btn btn-city" : "btn";
  if (!href) {
    return (
      <span className="inline-flex flex-col items-start gap-1.5">
        <span className={cls} role="link" aria-disabled="true" tabIndex={0}>{label}</span>
        <span className="text-xs opacity-80">WhatsApp line opens soon.</span>
      </span>
    );
  }
  return (
    <a className={cls} href={href} target="_blank" rel="noopener">
      {label}
    </a>
  );
}
