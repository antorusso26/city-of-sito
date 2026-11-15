import type { Faq } from "@/lib/content";

export function FaqList({ faq, title = "Questions people ask us" }: { faq: Faq[]; title?: string }) {
  if (faq.length === 0) return null;
  return (
    <section className="wrap mt-16">
      <h2 className="text-4xl">{title}</h2>
      <div className="mt-6 max-w-3xl divide-y divide-sabbia border-y border-sabbia">
        {faq.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="cursor-pointer list-none text-lg font-semibold">{f.q}</summary>
            <p className="mt-2 text-pietra">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
