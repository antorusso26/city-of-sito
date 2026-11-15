#!/usr/bin/env python3
"""Genera i loghi di una nuova città City Of.

Uso:
  pip install fonttools
  python3 nuova_citta.py "Positano" "#E0528A" "#B23A68" "40°38'N · 14°29'E"

Argomenti: nome, colore su scuro, colore su chiaro, coordinate.
Crea la cartella ../01-logo/nuove-citta/<nome>/ con sigillo (chiaro, scuro, piccolo) e logo orizzontale in SVG.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault("CITYOF_FONTS", os.path.join(HERE, "..", "04-font"))
sys.path.insert(0, HERE)
import logos_v2 as v2, logos_v3 as L

if len(sys.argv) != 5:
    sys.exit(__doc__)
name, color, deep, coord = sys.argv[1:]
key = "".join(ch for ch in name.lower() if ch.isalnum())
entry = dict(name=name, color=color, deep=deep, coord=coord.replace("'", "′"), label=name)
L.CITIES[key] = entry
v2.CITIES[key] = entry
out = os.path.join(HERE, "..", "01-logo", "nuove-citta", key)
os.makedirs(out, exist_ok=True)
INK, CALCE = "#0B2233", "#F5F3EE"
files = {
    f"cityof{key}-sigillo-chiaro.svg": L.seal_svg(key, ink=INK, bg=CALCE, top=deep),
    f"cityof{key}-sigillo-scuro.svg": L.seal_svg(key, ink=CALCE, bg=INK, top=color),
    f"cityof{key}-sigillo-piccolo-chiaro.svg": L.seal_small_svg(key, ink=INK, bg=CALCE, top=deep),
    f"cityof{key}-sigillo-piccolo-scuro.svg": L.seal_small_svg(key, ink=CALCE, bg=INK, top=color),
    f"cityof{key}-orizzontale-chiaro.svg": v2.city_horizontal_svg(key, ink=INK, top=deep),
    f"cityof{key}-orizzontale-scuro.svg": v2.city_horizontal_svg(key, ink=CALCE, top=color),
}
for fn, svg in files.items():
    open(os.path.join(out, fn), "w").write(svg)
print("Creati", len(files), "file in", os.path.normpath(out))
