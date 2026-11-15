// Wordmark CITY OF in linea: prende il colore dal testo. Tracciato da brand/09-web/logo-inline.html.
import fs from "node:fs";
import path from "node:path";

let cached: string | null = null;
function wordmark(): string {
  if (cached) return cached;
  const svg = fs.readFileSync(path.join(process.cwd(), "public", "cityof-wordmark-abisso.svg"), "utf8");
  cached = svg.replace(/fill="#0B2233"/gi, 'fill="currentColor"').replace("<svg ", '<svg height="100%" ');
  return cached;
}

export function Logo({ height = 26 }: { height?: number }) {
  return <span aria-hidden style={{ display: "inline-block", height }} dangerouslySetInnerHTML={{ __html: wordmark() }} />;
}
