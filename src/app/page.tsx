// Home City Of, scenografica: apertura a schermo intero (film o foto in movimento), il timone che gira
// mentre scorri città per città, come funziona, cosa prenotiamo, il pacchetto e chi siamo.
// La scelta delle città con il timone interattivo sta su /amalfi-coast.
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { FloatingNav } from "@/components/FloatingNav";
import { Footer } from "@/components/Footer";
import { HelmScroll, type ScrollCity } from "@/components/scenic/HelmScroll";
import { HeroReel } from "@/components/scenic/HeroReel";
import { Reveal } from "@/components/scenic/Reveal";
import { Trust } from "@/components/Trust";
import { getCities, getLiveCities } from "@/lib/content";
import { paths } from "@/lib/site";
import "./home.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const STEPS = [
  { n: "01", t: "Pick a town", d: "Sorrento, Positano, Amalfi or Capri. Or several: we build one trip with one price." },
  { n: "02", t: "We ask the people we know", d: "The skipper, the cook, the driver, the guide, the hotel. Each one answers for their part." },
  { n: "03", t: "You see the price first", d: "What it costs, what is included and what you pay on the day. Nothing is charged before you agree." },
  { n: "04", t: "A person stays with you", d: "Before and during the trip. If the sea is rough, we move the date or refund the deposit." },
];

const WHAT = [
  { t: "Boats", d: "Private and small-group boats to Capri, Positano and the coast.", img: "/photos/c_boat.jpg", big: true },
  { t: "Food and wine", d: "Lemon groves, a family kitchen, tables above the bay.", img: "/photos/s_lemon.jpg" },
  { t: "Walks", d: "The Path of the Gods and the old towns on foot.", img: "/photos/p_hike.jpg" },
  { t: "Drivers and transfers", d: "Ravello's gardens, Naples airport, the coast road.", img: "/photos/a_ravello.jpg" },
  { t: "Where to stay", d: "Two or three hotels and houses per town.", img: "/photos/st_c_villa.jpg" },
];

const FILM = "/film/home-loop.mp4";

export default function Home() {
  const live = getLiveCities();
  const soon = getCities().filter((c) => c.status === "soon");
  const hasFilm = fs.existsSync(path.join(process.cwd(), "public", FILM));

  const slides = live.filter((c) => c.hero).map((c) => ({ src: c.hero!, place: c.name, coords: c.coordinates }));
  const scroll: ScrollCity[] = live.map((c) => ({
    slug: c.slug, name: c.name, accent: c.accent, coords: c.coordinates, line: c.card ?? c.intro, hero: c.hero, href: paths.city(c.slug), slot: c.helmSlot,
  }));
  const ticker = [...live.map((c) => `${c.name} · ${c.coordinates}`), ...soon.map((c) => `${c.name} · opening later`)];

  return (
    <>
      <FloatingNav />
      <main className="sc-home">
        <HeroReel slides={slides} film={hasFilm ? FILM : undefined} poster={slides[0]?.src} />

        <div className="sc-marquee" aria-hidden="true">
          <div className="sc-marquee-track">
            {[0, 1].map((k) => (
              <span key={k}>{ticker.map((t) => <b key={t + k}>{t}</b>)}</span>
            ))}
          </div>
        </div>

        <HelmScroll cities={scroll} />

        <section className="wrap sc-section" id="how">
          <Reveal><p className="co-eyebrow">How it works</p><h2 className="sc-big">Four steps, <em>one person.</em></h2></Reveal>
          <ol className="sc-steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90}>
                <span className="sc-step-n">{s.n}</span>
                <b>{s.t}</b>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="wrap sc-section">
          <Reveal>
            <p className="co-eyebrow">What we book</p>
            <h2 className="sc-big">A few things in each town, <em>the ones we would do.</em></h2>
          </Reveal>
          <div className="sc-mosaic">
            {WHAT.map((w, i) => (
              <Reveal key={w.t} className={w.big ? "big" : ""} delay={i * 70}>
                <Link href="/amalfi-coast" className="sc-tile">
                  <img src={w.img} alt="" loading="lazy" />
                  <span className="sc-tile-txt"><b>{w.t}</b><small>{w.d}</small></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="sc-band">
          <div className="wrap sc-band-grid">
            <Reveal>
              <p className="co-eyebrow">The whole coast</p>
              <h2 className="sc-big light">Plan it <em>at once.</em></h2>
              <p className="sc-band-text">Switch towns on or off, pick what to do in each, tell us how many you are. One request, one price, a local partner on each stop.</p>
              <Link className="co-btn" href="/amalfi-coast#package">Build the Amalfi Coast trip</Link>
            </Reveal>
            <Reveal delay={120}>
              <p className="co-eyebrow">For partners</p>
              <h2 className="sc-big light">Run a boat, a kitchen, <em>a hotel?</em></h2>
              <p className="sc-band-text">We bring you guests who already know the price and what is included. No exclusivity. Write to us and we come to meet you.</p>
              <Link className="co-btn sc-ghost-light" href="/contact#partners">Become a partner</Link>
            </Reveal>
          </div>
        </section>

        <Trust />
      </main>
      <Footer />
    </>
  );
}
