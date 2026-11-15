import Link from "next/link";
import { type Experience, formatPrice } from "@/lib/content";
import { paths } from "@/lib/site";
import { Art } from "./Art";

/** Scheda alta, come nei cataloghi di esperienze: immagine, etichetta, titolo, partner, prezzo. */
export function ExperienceCard({ e, wide = false }: { e: Experience; wide?: boolean }) {
  // Scheda larga: per le file con poche esperienze, così la riga non sembra vuota.
  if (wide) {
    return (
      <article className="group">
        <Link href={paths.experience(e.city, e.category, e.slug)} className="flex gap-4 rounded-2xl border border-sabbia p-3 hover:border-abisso sm:gap-5">
          {e.image ? <img src={e.image} alt="" loading="lazy" className="co-card-photo aspect-square w-[34%] max-w-[200px] shrink-0 rounded-xl object-cover" /> : <Art kind={e.category} className="aspect-square w-[34%] max-w-[200px] shrink-0 rounded-xl" />}
          <div className="flex min-w-0 flex-col py-1">
            <p className="text-xs font-bold uppercase tracking-wider text-pietra">{e.format === "private" ? "Private" : "Small group"} · {e.duration.replace("About ", "")}</p>
            <h3 className="mt-1.5 text-lg font-bold leading-snug group-hover:underline sm:text-xl">{e.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-pietra">{e.summary}</p>
            <p className="mt-auto pt-3 text-sm">From <strong className="text-lg">{formatPrice(e)}</strong></p>
          </div>
        </Link>
      </article>
    );
  }
  return (
    <article className="group">
      <Link href={paths.experience(e.city, e.category, e.slug)} className="block">
        {e.image ? <img src={e.image} alt="" loading="lazy" className="co-card-photo aspect-[4/3] w-full rounded-2xl object-cover transition-transform duration-500 ease-giro group-hover:-translate-y-1" /> : <Art kind={e.category} className="aspect-[4/3] rounded-2xl transition-transform duration-500 ease-giro group-hover:-translate-y-1" />}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-pietra">
          <span>{e.format === "private" ? "Private" : "Small group"}</span>
          <span>{e.duration.replace("About ", "")}</span>
        </div>
        <h3 className="mt-1.5 text-[17px] font-bold leading-snug group-hover:underline">{e.title}</h3>
        <p className="mt-1 text-sm text-pietra">Run by {e.partner ?? "[PARTNER]"}</p>
        <p className="mt-2 text-sm">From <strong className="text-lg">{formatPrice(e)}</strong></p>
      </Link>
    </article>
  );
}
