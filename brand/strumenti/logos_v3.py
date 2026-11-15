"""City Of — logo system v3.
Builds on the critic's v2 geometry (logos_v2.py: outlined, six-spoke helm-O wordmark).
New in v3 (client direction, 10 Nov 2026):
  * C-helm = standalone symbol of City Of: the helm's rim opens to the right like a C,
    between the 60° and 120° spokes. (The C of City; turning, it closes into the O of Of.)
  * Seal = logo of each city: closed helm with the lit heading handle, CITY OF <CITY> on top,
    coordinates below. Text outlined from Archivo Expanded.
"""
import math, os
import logos_v2 as v2
from logos_v2 import (f, polar, ring_d, disc_d, bar_d, capsule_d, P, helm, wordmark_parts, wordmark_box,
                      text_outline, ink_bbox_of_text, _arc_text, HELM_WM, INK, CALCE, LIMONE, LIMONE_SCURO)

FONT_DIR = os.environ.get("CITYOF_FONTS", os.path.expanduser("~/.fonts"))
SANS_BOLD = os.path.join(FONT_DIR, "Archivo-ExpandedBold.ttf")
SANS_MED = os.path.join(FONT_DIR, "Archivo-ExpandedMedium.ttf")
SERIF_ITALIC = v2.SERIF_ITALIC

CITIES = dict(v2.CITIES)
CITIES["sorrento"] = dict(CITIES["sorrento"], coord="40°37′N · 14°22′E", label="Limone")
CITIES["positano"] = dict(CITIES["positano"], coord="40°38′N · 14°29′E", label="Bouganville")
CITIES["capri"] = dict(CITIES["capri"], coord="40°33′N · 14°15′E", label="Grotta")
CITIES["amalfi"] = dict(CITIES["amalfi"], coord="40°38′N · 14°36′E", label="Maiolica")
CITIES["procida"] = dict(CITIES["procida"], coord="40°46′N · 14°01′E", label="Corallo")


def arc_ring_d(cx, cy, r_out, r_in, a_from, a_to):
    """Ring segment from angle a_from clockwise to a_to (degrees clockwise from 12 o'clock)."""
    span = (a_to - a_from) % 360
    large = 1 if span > 180 else 0
    o1, o2 = polar(cx, cy, r_out, a_from), polar(cx, cy, r_out, a_to)
    i1, i2 = polar(cx, cy, r_in, a_from), polar(cx, cy, r_in, a_to)
    return (f"M{f(o1[0])} {f(o1[1])}A{f(r_out)} {f(r_out)} 0 {large} 1 {f(o2[0])} {f(o2[1])}"
            f"L{f(i2[0])} {f(i2[1])}A{f(r_in)} {f(r_in)} 0 {large} 0 {f(i1[0])} {f(i1[1])}Z")


def c_helm(cx, cy, *, rim_r, rim_w, hub_r, spoke_w, h_in, h_out, h_w, gap_half=42, ink=INK, top=None, heading=0.0,
           drop=(90,), rot=30):
    """Six-spoke helm with the rim open on the right (centred on 90°); the spokes/handles at `drop`
    angles are missing, so the open side reads as a C. Each piece is its own path (no winding holes)."""
    paths = [arc_ring_d(cx, cy, rim_r + rim_w / 2, rim_r - rim_w / 2, 90 + gap_half, 90 - gap_half + 360)]
    angles = [(a + rot) % 360 for a in range(0, 360, 60) if (a + rot) % 360 not in drop]
    if spoke_w > 0.1:
        for dg in angles:
            x2, y2 = polar(cx, cy, rim_r, dg)
            paths.append(bar_d(cx, cy, x2, y2, spoke_w))
    lit = None
    for dg in angles:
        ho = h_out + (heading if dg == 0 else 0)
        x1, y1 = polar(cx, cy, h_in, dg)
        x2, y2 = polar(cx, cy, ho - h_w / 2, dg)
        d = capsule_d(x1, y1, x2, y2, h_w)
        if dg == 0 and top:
            lit = d
        else:
            paths.append(d)
    if hub_r > 0.1:
        paths.append(disc_d(cx, cy, hub_r))
    out = f'<g fill="{ink}">' + "".join(f'<path d="{d}"/>' for d in paths) + '</g>'
    if lit:
        out += P(lit, top)
    return out


C_SYM = dict(rim_r=55, rim_w=17, hub_r=16, spoke_w=9, h_in=62, h_out=86, h_w=15)
C_MICRO = dict(rim_r=50, rim_w=26, hub_r=0, spoke_w=0, h_in=62, h_out=93, h_w=22)


def c_symbol_group(ink=INK, micro=False, gap_half=42, cx=100, cy=100):
    g = C_MICRO if micro else C_SYM
    return c_helm(cx, cy, gap_half=44 if micro else gap_half, ink=ink, **g)


def c_symbol_svg(ink=INK, micro=False, bg=None, rounded=0, gap_half=42, title="City Of"):
    bgs = f'<rect width="200" height="200" rx="{rounded}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="{title}"><title>{title}</title>'
            f'{bgs}{c_symbol_group(ink, micro, gap_half)}</svg>')


# ---------------- wordmark (v2 geometry) ----------------
def wordmark_group(ink=INK, top=None):
    body, _ = wordmark_parts(ink, top, "six", heading=6.0 if top else 0.0)
    return body


def wordmark_svg(ink=INK, top=None, title="City Of"):
    x, y, w, h = wordmark_box("six", 6.0)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(w)} {f(h)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{wordmark_group(ink, top)}</svg>')


WM_BOX = wordmark_box("six", 6.0)


# ---------------- seal (city logo) ----------------
def seal_group(city, ink=INK, bg=CALCE, top=None, lit=True):
    c = CITIES[city]
    top = (top or c["deep"]) if lit else None
    cx = cy = 150
    parts = [f'<circle cx="150" cy="150" r="146" fill="{bg}"/>' if bg else '',
             P(ring_d(cx, cy, 146, 138.5) + ring_d(cx, cy, 104.5, 101), ink),
             helm(cx, cy, n=6, rim_r=54, rim_w=15, hub_r=12, spoke_w=8, h_in=60, h_out=80, h_w=13, ink=ink, top=top,
                  heading=6 if top else 0)]
    name = f"CITY OF {c['name'].upper()}"
    size_t = 19.5
    cap = 0.71
    track = 3.2 if len(name) < 17 else 2.2
    parts.append(f'<g fill="{ink}">' + _arc_text(name, SANS_BOLD, size_t, cx, cy, 120.5 - cap * size_t / 2, tracking=track)
                 + _arc_text(c["coord"].replace("′", "’"), SANS_MED, 13.5, cx, cy, 120.5 + cap * 13.5 / 2, tracking=2.0, bottom=True)
                 + '</g>')
    parts.append(P(disc_d(26.5, 150, 3.4) + disc_d(273.5, 150, 3.4), ink))
    return "".join(parts)


def seal_svg(city, ink=INK, bg=CALCE, top=None):
    c = CITIES[city]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="City of {c["name"]}">'
            f'<title>City of {c["name"]}</title>{seal_group(city, ink, bg, top)}</svg>')


def seal_small_group(city, ink=INK, bg=CALCE, top=None):
    """Seal cut for <= 64 px: thick outer ring + helm with lit handle, no text."""
    c = CITIES[city]
    top = top or c["deep"]
    return ((f'<circle cx="100" cy="100" r="98" fill="{bg}"/>' if bg else '') + P(ring_d(100, 100, 98, 86), ink)
            + helm(100, 100, n=6, rim_r=40, rim_w=15, hub_r=13, spoke_w=11, h_in=46, h_out=70, h_w=15, ink=ink, top=top, heading=6))


def seal_small_svg(city, ink=INK, bg=CALCE, top=None):
    c = CITIES[city]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="City of {c["name"]}">'
            f'<title>City of {c["name"]}</title>{seal_small_group(city, ink, bg, top)}</svg>')


def city_horizontal_svg(city, ink=INK, top=None):
    return v2.city_horizontal_svg(city, ink=ink, top=top or CITIES[city]["deep"])


def wordmark_letters():
    """Separate outline per letter of the wordmark (for animation): C, I, T, Y, F."""
    S = 14
    r_o, r_i, cx, cy = 52, 38, 52, 50
    a = math.radians(42)
    ox0, oy0 = cx + r_o * math.cos(a), cy - r_o * math.sin(a)
    ox1, oy1 = cx + r_o * math.cos(a), cy + r_o * math.sin(a)
    ix0, iy0 = cx + r_i * math.cos(a), cy - r_i * math.sin(a)
    ix1, iy1 = cx + r_i * math.cos(a), cy + r_i * math.sin(a)
    c_d = (f"M{f(ox0)} {f(oy0)}A{r_o} {r_o} 0 1 0 {f(ox1)} {f(oy1)}L{f(ix1)} {f(iy1)}"
           f"A{r_i} {r_i} 0 1 1 {f(ix0)} {f(iy0)}Z")
    rect = lambda x, y, w, h: f"M{x} {y}h{w}v{h}h{-w}Z"
    k = 47.14 / 66
    lo, ro = 218.0, 315.2
    stem_l, stem_r = 266.6 - S / 2, 266.6 + S / 2
    t = S / math.cos(math.atan(k))
    y_join = (stem_l - lo) / k
    y_crotch = ((ro - t) - (lo + t)) / (2 * k)
    x_crotch = lo + t + k * y_crotch
    pts = [(lo, 0), (lo + t, 0), (x_crotch, y_crotch), (ro - t, 0), (ro, 0), (stem_r, y_join), (stem_r, 100),
           (stem_l, 100), (stem_l, y_join)]
    y_d = "M" + "L".join(f"{f(a_)} {f(b_)}" for a_, b_ in pts) + "Z"
    fx = 478
    return {"C": c_d, "I": rect(106, 0, S, 100), "T": rect(136, 0, 72, 13) + rect(165, 0, S, 100), "Y": y_d,
            "F": rect(fx, 0, S, 100) + rect(fx, 0, 70, 13) + rect(fx, 43.5, 58, 13)}
