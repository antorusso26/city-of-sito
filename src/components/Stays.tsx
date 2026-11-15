// Alberghi e case: un ramo a parte, piccolo e curato. Due o tre posti per città.
import Link from "next/link";
import { nightPrice, type Stay } from "@/lib/content";
import { paths } from "@/lib/site";

export function StayCards({ stays, cityName }: { stays: Stay[]; cityName: string }) {
  if (stays.length === 0) return null;
  return (
    <section className="co-stays" id="stay">
      <h2 className="co-h2">Where to stay in <em>{cityName}</em></h2>
      <p className="co-status">A few hotels and houses we know. Small on purpose: we only list places we have slept in or know the owner of.</p>
      <div className="co-stays-grid">
        {stays.map((s) => (
          <Link key={s.slug} href={paths.stay(s.city, s.slug)} className="co-stay">
            {s.image ? <img src={s.image} alt="" loading="lazy" /> : <span />}
            <span className="co-stay-body">
              <span className="co-kind">{s.kind === "hotel" ? "Hotel" : "House"}</span>
              <b>{s.title}</b>
              <small>{s.summary}</small>
              <span className="co-price">From {nightPrice(s)}</span>
              <span className="co-by">{s.partner ?? (s.kind === "hotel" ? "[HOTEL NAME]" : "[HOST NAME]")}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
