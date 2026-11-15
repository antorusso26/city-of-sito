// Dati strutturati (schema.org) per motori di ricerca e assistenti.
// Un blocco <script> per oggetto, ognuno con il suo "@context": alcuni lettori (estensioni, Safari)
// non accettano un elenco in un solo blocco e vanno in errore su r["@context"].
export function JsonLd({ data }: { data: (Record<string, unknown> | null)[] }) {
  const items = data.filter((d): d is Record<string, unknown> => Boolean(d && d["@context"]));
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Il contenuto viene dai nostri file, non dagli utenti; "<" è neutralizzato per sicurezza.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
