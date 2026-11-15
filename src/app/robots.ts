// Finché è un mockup: nessuna scansione. Al lancio: tutto aperto, compresi i crawler degli assistenti AI.
import type { MetadataRoute } from "next";
import { INDEXABLE, abs } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: abs("/sitemap.xml") };
}
