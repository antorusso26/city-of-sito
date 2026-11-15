"use client";

// I quattro stili del sito, intercambiabili da un pulsante. Lo stile è un attributo su <html>
// (data-theme) e tutto il resto lo fanno le variabili CSS in src/app/cityof.css.
import { useEffect, useState } from "react";

export const THEMES = [
  { id: "luigi", label: "Luigi" },
  { id: "nostro", label: "Nostro" },
  { id: "misto", label: "Misto" },
  { id: "luxury", label: "Luxury" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "misto";
const KEY = "cityof-theme";

/** Gira nel <head> prima che la pagina si veda: niente lampo dello stile sbagliato. Accetta anche ?style=luxury. */
export const themeBootScript = `(function(){try{var ok=${JSON.stringify(THEMES.map((t) => t.id))};
var q=new URLSearchParams(location.search).get('style');var t=ok.indexOf(q)>-1?q:localStorage.getItem('${KEY}');
if(ok.indexOf(t)>-1){document.documentElement.setAttribute('data-theme',t);if(q)localStorage.setItem('${KEY}',q);}}catch(e){}})();`;

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") as ThemeId | null;
    if (t) setTheme(t);
  }, []);

  function pick(id: ThemeId) {
    setTheme(id);
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem(KEY, id); } catch {}
  }

  return (
    <div className="co-themes" data-open={open}>
      <button type="button" className="co-themes-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Style · {THEMES.find((t) => t.id === theme)?.label}
      </button>
      <div className="co-themes-list" role="radiogroup" aria-label="Site style">
        {THEMES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => pick(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
