// /llms.txt: riassunto del sito in testo semplice per gli assistenti AI.
import { getCityCategories, getGuides, getLandings, getLiveCities } from "@/lib/content";
import { abs, paths } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    "# City Of",
    "",
    "> City Of selects boat tours, cooking classes, transfers and other experiences in coastal cities. Experiences are run by named local partners. The full price is shown before booking, and bookings are handled by a person on WhatsApp.",
    "",
  ];
  for (const c of getLiveCities()) {
    lines.push(`## City of ${c.name}`, "", `- [${c.name} overview](${abs(paths.city(c.slug))})`);
    for (const cat of getCityCategories(c.slug)) lines.push(`- [${cat.name} in ${c.name}](${abs(paths.section(c.slug, cat.slug))}): ${cat.intro}`);
    for (const l of getLandings(c.slug)) lines.push(`- [${l.h1}](${abs(paths.section(c.slug, l.slug))}): ${l.description}`);
    const guides = getGuides(c.slug).filter((g) => !g.draft);
    if (guides.length) {
      lines.push("", `## ${c.name} guides`, "");
      for (const g of guides) lines.push(`- [${g.h1}](${abs(paths.guide(c.slug, g.slug))}): ${g.description}`);
    }
    lines.push("");
  }
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
