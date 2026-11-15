// Apertura a schermo intero. Se c'è il film d'apertura (public/film/home-loop.mp4) lo usa come sfondo;
// altrimenti le foto della costa si alternano con un lento movimento di camera (Ken Burns).
import Link from "next/link";

export type ReelSlide = { src: string; place: string; coords?: string };

export function HeroReel({ slides, film, poster }: { slides: ReelSlide[]; film?: string; poster?: string }) {
  const n = slides.length;
  return (
    <section className="sc-hero" style={{ ["--n" as string]: n }}>
      <div className="sc-hero-media" aria-hidden="true">
        {film ? (
          <video className="sc-hero-film" src={film} poster={poster} autoPlay muted loop playsInline preload="auto" />
        ) : (
          slides.map((s, i) => (
            <div key={s.src} className="sc-slide" style={{ ["--i" as string]: i }}>
              <img src={s.src} alt="" />
              <span className="sc-slide-place">{s.place}{s.coords ? ` · ${s.coords}` : ""}</span>
            </div>
          ))
        )}
      </div>
      <div className="sc-hero-shade" aria-hidden="true" />
      <div className="wrap sc-hero-copy">
        <p className="co-eyebrow sc-rise" style={{ ["--d" as string]: "0ms" }}>Trust the Local · Amalfi Coast</p>
        <h1 className="sc-hero-title">
          <span className="sc-line"><span style={{ ["--d" as string]: "120ms" }}>Your local agency,</span></span>
          <span className="sc-line"><span style={{ ["--d" as string]: "260ms" }}>city by <em>city.</em></span></span>
        </h1>
        <p className="sc-hero-sub sc-rise" style={{ ["--d" as string]: "520ms" }}>
          A small team from the coast. In each town we choose the people we would send our own family to, and we book them for you, with the price said first.
        </p>
        <div className="sc-hero-ctas sc-rise" style={{ ["--d" as string]: "680ms" }}>
          <Link className="co-btn" href="/amalfi-coast">Choose your town</Link>
          <Link className="co-btn sc-ghost-light" href="/experiences">See experiences</Link>
        </div>
      </div>
      <a className="sc-scroll" href="#helm" aria-label="Scroll down"><span /></a>
    </section>
  );
}
