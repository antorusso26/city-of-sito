import { INDEXABLE } from "@/lib/site";

/** Avviso di mockup: una riga nel piè di pagina, non un elemento che copre i contenuti. */
export function MockupBanner() {
  if (INDEXABLE) return null;
  return <p className="mt-2">Mockup: prices and partners in square brackets are placeholders until confirmed.</p>;
}
