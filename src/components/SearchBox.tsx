"use client";

// Ricerca in tre passi: cosa, quando, in quanti. Per ora porta alla pagina della categoria scelta.
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({ city, categories }: { city: string; categories: { slug: string; name: string; href: string }[] }) {
  const router = useRouter();
  const [cat, setCat] = useState(categories[0]?.slug ?? "");
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("2");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const target = categories.find((c) => c.slug === cat);
    if (!target) return;
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (people) q.set("people", people);
    router.push(`${target.href}${q.size ? `?${q}` : ""}#options`);
  };
  return (
    <form onSubmit={go} className="mx-auto w-full max-w-[760px]" data-search-city={city}>
      <div role="tablist" aria-label="What are you looking for" className="flex gap-1 overflow-x-auto pl-4 [scrollbar-width:none]">
        {categories.map((c) => (
          <button
            key={c.slug} type="button" role="tab" aria-selected={cat === c.slug} onClick={() => setCat(c.slug)}
            className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-2xl px-4 py-2.5 text-sm font-bold ${cat === c.slug ? "bg-white text-abisso shadow-[0_-2px_0_0_var(--color-abisso)_inset]" : "text-pietra hover:text-abisso"}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="flex items-stretch gap-2 rounded-full border-2 border-abisso bg-white p-2 shadow-[0_5px_0_0_var(--color-abisso)]">
        <label className="flex min-w-0 flex-1 flex-col justify-center px-3 sm:px-4">
          <span className="text-xs text-pietra">When</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-w-0 bg-transparent text-sm font-bold" />
        </label>
        <span aria-hidden className="my-2 w-px bg-sabbia" />
        <label className="flex w-[24%] min-w-0 flex-col justify-center px-3">
          <span className="text-xs text-pietra">People</span>
          <input type="number" min={1} max={30} value={people} onChange={(e) => setPeople(e.target.value)} className="w-full min-w-0 bg-transparent text-sm font-bold" />
        </label>
        <button type="submit" className="btn btn-blu h-12 shrink-0 px-4 sm:px-6">Search</button>
      </div>
    </form>
  );
}
