import Link from "next/link";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="wrap pt-24 text-sm text-pietra">
      <ol className="flex flex-wrap gap-x-2">
        {items.map((it, i) => (
          <li key={it.path} className="flex gap-x-2">
            {i < items.length - 1 ? <Link href={it.path} className="inline-flex min-h-8 items-center underline">{it.name}</Link> : <span aria-current="page" className="inline-flex min-h-8 items-center">{it.name}</span>}
            {i < items.length - 1 && <span aria-hidden className="inline-flex min-h-8 items-center">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
