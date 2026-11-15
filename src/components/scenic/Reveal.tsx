"use client";

// Fa entrare un blocco quando arriva sullo schermo (una volta sola). Senza JavaScript il contenuto è già visibile.
// Doppio controllo (IntersectionObserver + scorrimento) e un limite di tempo: il contenuto non resta mai nascosto.
import { useEffect, useRef, useState } from "react";

export function Reveal({ children, className = "", as: Tag = "div", delay = 0 }: {
  children: React.ReactNode; className?: string; as?: "div" | "li" | "section"; delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"static" | "wait" | "in">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const inView = () => el.getBoundingClientRect().top < window.innerHeight * 0.88;
    if (inView()) return; // già in vista: niente animazione
    setState("wait");
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setState("in");
      cleanup();
    };
    const onScroll = () => { if (inView()) show(); };
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(([e]) => { if (e.isIntersecting) show(); }, { threshold: 0.12 })
      : null;
    io?.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Rete di sicurezza: alcuni browser (e gli scorrimenti fatti da script) non mandano eventi.
    const poll = window.setInterval(onScroll, 300);
    const cleanup = () => { io?.disconnect(); window.removeEventListener("scroll", onScroll); window.clearInterval(poll); };
    return cleanup;
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`sc-reveal ${className}`} data-reveal={state} style={{ ["--rd" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
