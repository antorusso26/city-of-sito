"use client";

// Il cambio di città: la O di CITY OF gira, sotto compare la città nel suo colore, poi si apre la pagina.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Go = (href: string, city: { name: string; accent: string } | null) => void;
const VeilContext = createContext<Go>(() => {});
export const useVeil = () => useContext(VeilContext);

export function VeilProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shown, setShown] = useState<{ name: string; accent: string } | null>(null);
  const [on, setOn] = useState(false);
  const timers = useRef<number[]>([]);

  const go = useCallback<Go>((href, city) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { router.push(href); return; }
    timers.current.forEach(clearTimeout);
    setShown(city ?? { name: "", accent: "#F5F3EE" });
    setOn(true);
    router.prefetch(href);
    timers.current = [
      window.setTimeout(() => { router.push(href); window.scrollTo({ top: 0 }); }, 520),
      window.setTimeout(() => setOn(false), 1500),
    ];
  }, [router]);

  // Se la pagina arriva tardi, il velo resta finché non è cambiata.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (on) { const t = window.setTimeout(() => setOn(false), 900); return () => clearTimeout(t); } }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <VeilContext.Provider value={go}>
      {children}
      <div className="co-veil" data-on={on} aria-hidden="true" style={{ ["--vc" as string]: shown?.accent }}>
        {on && (
          <>
            <Wordmark />
            <div className="co-veil-city">{shown?.name}</div>
          </>
        )}
      </div>
    </VeilContext.Provider>
  );
}

/** Link a una città: fa partire il velo. Senza JavaScript resta un link normale. */
export function CityLink({ href, city, className, children, ...rest }: {
  href: string; city: { name: string; accent: string } | null; className?: string; children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const go = useVeil();
  return (
    <Link href={href} className={className} {...rest}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(href, city);
      }}>
      {children}
    </Link>
  );
}

/** Il wordmark CITY OF con la O (il timone) separata, per farla girare. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg className={className ?? "co-wordmark"} viewBox="-10 -30 568 154" role="img" aria-label="City Of">
      <path fill="currentColor" d="M90.64 15.21A52 52 0 1 0 90.64 84.79L80.24 75.43A38 38 0 1 1 80.24 24.57ZM218 0L235.2 0L266.6 43.96L298 0L315.2 0L273.6 58.24L273.6 100L259.6 100L259.6 58.24ZM106 0h14v100h-14ZM136 0h72v13h-72ZM165 0h14v100h-14ZM478 0h14v100h-14ZM478 0h70v13h-70ZM478 43.5h58v13h-58Z" />
      <g className="co-o">
        <path fill="currentColor" d="M350 50a52 52 0 1 0 104 0a52 52 0 1 0 -104 0ZM364 50a38 38 0 1 1 76 0a38 38 0 1 1 -76 0ZM405.25 50L405.25 5L398.75 5L398.75 50ZM403.62 52.81L442.6 30.31L439.35 24.69L400.38 47.19ZM400.38 52.81L439.35 75.31L442.6 69.69L403.62 47.19ZM398.75 50L398.75 95L405.25 95L405.25 50ZM400.38 47.19L361.4 69.69L364.65 75.31L403.62 52.81ZM403.62 47.19L364.65 24.69L361.4 30.31L400.38 52.81ZM407 0L407 -9A5 5 0 0 0 397 -9L397 0A5 5 0 0 0 407 0ZM447.8 29.33L455.6 24.83A5 5 0 0 0 450.6 16.17L442.8 20.67A5 5 0 0 0 447.8 29.33ZM442.8 79.33L450.6 83.83A5 5 0 0 0 455.6 75.17L447.8 70.67A5 5 0 0 0 442.8 79.33ZM397 100L397 109A5 5 0 0 0 407 109L407 100A5 5 0 0 0 397 100ZM356.2 70.67L348.4 75.17A5 5 0 0 0 353.4 83.83L361.2 79.33A5 5 0 0 0 356.2 70.67ZM361.2 20.67L353.4 16.17A5 5 0 0 0 348.4 24.83L356.2 29.33A5 5 0 0 0 361.2 20.67ZM391.5 50a10.5 10.5 0 1 0 21 0a10.5 10.5 0 1 0 -21 0Z" />
      </g>
    </svg>
  );
}
