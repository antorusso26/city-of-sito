// Riquadro illustrato al posto delle foto, finché non ci sono scatti veri.
// Quando un contenuto avrà il campo `image`, questo componente mostrerà la foto.
type Kind = "boat-tours" | "cooking-classes" | "transfers" | "guide" | "city";

const LOOK: Record<Kind, { bg: string; fg: string }> = {
  "boat-tours": { bg: "#dbe5ff", fg: "#1447e6" },
  "cooking-classes": { bg: "#fdeab0", fg: "#0b2233" },
  transfers: { bg: "#d9efe6", fg: "#0f6b54" },
  guide: { bg: "#f8f0e3", fg: "#0b2233" },
  city: { bg: "#0b2233", fg: "#f2b705" },
};

function Icon({ kind }: { kind: Kind }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "boat-tours")
    return (<><path {...p} d="M14 62h72l-10 16H24z" /><path {...p} d="M50 62V18l24 34H50" /><path {...p} d="M8 90c8-6 14-6 21 0s14 6 21 0 14-6 21 0 14 6 21 0" /></>);
  if (kind === "cooking-classes")
    return (<><path {...p} d="M20 46h60v22a14 14 0 0 1-14 14H34a14 14 0 0 1-14-14z" /><path {...p} d="M10 46h80M38 30c-4-6 4-8 0-14M52 30c-4-6 4-8 0-14M66 30c-4-6 4-8 0-14" /></>);
  if (kind === "transfers")
    return (<><path {...p} d="M12 62l8-22a8 8 0 0 1 8-5h44a8 8 0 0 1 8 5l8 22v14H12z" /><circle {...p} cx="30" cy="78" r="7" /><circle {...p} cx="70" cy="78" r="7" /><path {...p} d="M24 56h52" /></>);
  if (kind === "guide")
    return (<><circle {...p} cx="50" cy="50" r="34" /><path {...p} d="M62 38L56 56 38 62l6-18z" /></>);
  return (<><circle {...p} cx="50" cy="50" r="24" /><path {...p} d="M50 12v76M17 31l66 38M17 69l66-38" /></>);
}

export function Art({ kind, className = "" }: { kind: string; className?: string }) {
  const k = (kind in LOOK ? kind : "guide") as Kind;
  return (
    <div aria-hidden className={`flex items-center justify-center overflow-hidden ${className}`} style={{ background: LOOK[k].bg, color: LOOK[k].fg }}>
      <svg viewBox="0 0 100 100" className="h-[46%] w-[46%]"><Icon kind={k} /></svg>
    </div>
  );
}
