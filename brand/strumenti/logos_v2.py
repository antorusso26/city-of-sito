"""City Of — logo geometry v2 (critic revision).

Differences from /home/claude/gen/logos.py (v1) are listed in CHANGES below. Everything is still pure
geometry, but v2 writes FILLED OUTLINES (no strokes, no clipPath, no live <text>) so files scale, cut and
print predictably. City names and seal text are outlined from the font files with fontTools.
"""
import math
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

CHANGES = """
1  Wordmark viewBox computed from the real bounding box (v1 cropped 5 units off the F) with equal clear space.
2  Word space restored: Y->O kept open (rim 31 -> 35 from the Y at cap line, no handle pointing into the gap), O->F tightened (rim 41 -> 24 from the F stem).
3  Helm-O lightened for the word: hub r 11 -> 10.5, spokes 6 -> 6.5 but only 6 of them (variant 'six'),
   handles 11 -> 10 wide and ending at r 64 incl. the round cap (v1: 63 + 5.5 cap = 68.5). Helm height
   1.37 -> 1.28 cap heights (1.31 for cities with the heading handle).
4  One geometry for master and cities (rotation 0). Master = no lit handle; city = lit handle (+ longer
   'heading' handle so the difference survives one colour).
5  Six spokes/handles instead of eight (option 'eight' kept): fewer, bigger counters at 16-32 px; departs
   from Kubernetes (7) and the Dharma-wheel / U+2638 drawing (8).
6  Micro favicon redrawn so it no longer reads as the 'settings' gear: spokes kept (3 thick bars through the
   hub), handles long and slim, small hub.
7  Lockups: city name outlined, no opacity divider in the horizontal lockup (word space instead: 'City of
   Sorrento' is one phrase), tight viewBoxes.
8  Seal: text outlined and centred in its band, inner hairline 2 -> 3.5, helm larger, Calce ground.
"""

INK = "#0B2233"      # Abisso
CALCE = "#F5F3EE"
LIMONE = "#F2B705"
LIMONE_SCURO = "#8F6600"
PIETRA = "#5E666B"

FONT_DIR = os.environ.get("CITYOF_FONTS", os.path.expanduser("~/.fonts"))
SERIF_ITALIC = os.path.join(FONT_DIR, "InstrumentSerif-Italic.ttf")
SERIF_REGULAR = os.path.join(FONT_DIR, "InstrumentSerif-Regular.ttf")

CITIES = {
    "sorrento": {"name": "Sorrento", "color": LIMONE, "deep": LIMONE_SCURO, "coord": "40°37′N · 14°22′E"},
    "positano": {"name": "Positano", "color": "#E0528A", "deep": "#B23A68", "coord": "40°38′N · 14°29′E"},
    "capri": {"name": "Capri", "color": "#3AA3E8", "deep": "#1F6FA8", "coord": "40°33′N · 14°14′E"},
    "amalfi": {"name": "Amalfi", "color": "#17A68F", "deep": "#0F7565", "coord": "40°38′N · 14°36′E"},
    "procida": {"name": "Procida", "color": "#F2805C", "deep": "#B4512F", "coord": "40°46′N · 14°02′E"},
}


def f(x):
    s = f"{x:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def polar(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + r * math.sin(a), cy - r * math.cos(a)


# ---------- primitives as filled outlines ----------
def ring_d(cx, cy, r_out, r_in):
    return (f"M{f(cx - r_out)} {f(cy)}a{f(r_out)} {f(r_out)} 0 1 0 {f(2 * r_out)} 0a{f(r_out)} {f(r_out)} 0 1 0 {f(-2 * r_out)} 0Z"
            f"M{f(cx - r_in)} {f(cy)}a{f(r_in)} {f(r_in)} 0 1 1 {f(2 * r_in)} 0a{f(r_in)} {f(r_in)} 0 1 1 {f(-2 * r_in)} 0Z")


def disc_d(cx, cy, r):
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 0 {f(2 * r)} 0a{f(r)} {f(r)} 0 1 0 {f(-2 * r)} 0Z"


def bar_d(x1, y1, x2, y2, w):
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * w / 2, dx / L * w / 2
    pts = [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]
    return "M" + "L".join(f"{f(a)} {f(b)}" for a, b in pts) + "Z"


def capsule_d(x1, y1, x2, y2, w):
    """Bar with round ends (round cap beyond both end points, like stroke-linecap=round)."""
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    nx, ny = -dy / L * w / 2, dx / L * w / 2
    r = w / 2
    a = (x1 + nx, y1 + ny)
    b = (x2 + nx, y2 + ny)
    c = (x2 - nx, y2 - ny)
    d = (x1 - nx, y1 - ny)
    return (f"M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}A{f(r)} {f(r)} 0 0 0 {f(c[0])} {f(c[1])}"
            f"L{f(d[0])} {f(d[1])}A{f(r)} {f(r)} 0 0 0 {f(a[0])} {f(a[1])}Z")


def P(d, fill, rule=None):
    fr = f' fill-rule="{rule}"' if rule else ""
    return f'<path d="{d}" fill="{fill}"{fr}/>'


# ---------- the helm ----------
def helm(cx, cy, *, rim_r, rim_w, hub_r, spoke_w, h_in, h_out, h_w, rot=0.0, n=6,
         ink=INK, top=None, heading=0.0, spokes=True, spoke_n=None, hub_hole=0.0):
    """Ship's wheel as filled outlines.
    n         handles (and spokes unless spoke_n is given)
    top       colour of the 12 o'clock handle (None = same ink)
    heading   extra length of the 12 o'clock handle (the 'heading' a city sets)
    """
    out = []
    ink_d = [ring_d(cx, cy, rim_r + rim_w / 2, rim_r - rim_w / 2)]
    sn = spoke_n or n
    if spokes and spoke_w > 0:
        for i in range(sn):
            dg = rot + i * 360 / sn
            x1, y1 = polar(cx, cy, 0, dg)
            x2, y2 = polar(cx, cy, rim_r, dg)
            ink_d.append(bar_d(x1, y1, x2, y2, spoke_w))
    lit = None
    for i in range(n):
        dg = rot + i * 360 / n
        is_top = abs(((dg % 360) + 360) % 360) < 0.01
        ho = h_out + (heading if is_top else 0)
        x1, y1 = polar(cx, cy, h_in, dg)
        x2, y2 = polar(cx, cy, ho - h_w / 2, dg)  # round cap ends exactly at ho
        d = capsule_d(x1, y1, x2, y2, h_w)
        if is_top and top:
            lit = d
        else:
            ink_d.append(d)
    ink_d.append(disc_d(cx, cy, hub_r))
    out.append(P("".join(ink_d), ink))
    if hub_hole:
        out.append(P(disc_d(cx, cy, hub_hole), "#fff"))
    if lit:
        out.append(P(lit, top))
    return "".join(out)


# ---------- WORDMARK "CITY OF" (cap height 100, stroke 14) ----------
S = 14
SH = 13  # optical correction: horizontal strokes one unit thinner than verticals
HELM_WM = dict(rim_r=45, rim_w=S, hub_r=10.5, spoke_w=6.5, h_in=50, h_out=64, h_w=10)
VARIANTS = {
    # name: (n handles, spoke_n, O centre x, F x)
    "six": dict(n=6, cx=402, fx=478),
    "eight": dict(n=8, cx=404, fx=486),
}


def wordmark_parts(ink=INK, top=None, variant="six", heading=0.0, rot=0.0):
    v = VARIANTS[variant]
    p = []
    # C — ring segment, butt terminals cut radially at +-42 deg (as v1)
    r_o, r_i, cx, cy = 52, 38, 52, 50
    a = math.radians(42)
    ox0, oy0 = cx + r_o * math.cos(a), cy - r_o * math.sin(a)
    ox1, oy1 = cx + r_o * math.cos(a), cy + r_o * math.sin(a)
    ix0, iy0 = cx + r_i * math.cos(a), cy - r_i * math.sin(a)
    ix1, iy1 = cx + r_i * math.cos(a), cy + r_i * math.sin(a)
    c_d = (f"M{f(ox0)} {f(oy0)}A{r_o} {r_o} 0 1 0 {f(ox1)} {f(oy1)}L{f(ix1)} {f(iy1)}"
           f"A{r_i} {r_i} 0 1 1 {f(ix0)} {f(iy0)}Z")
    # I, T
    rects = [(106, 0, S, 100), (136, 0, 72, SH), (165, 0, S, 100)]
    # Y — polygon (v1 geometry: junction centreline at y=56, arms 35.5 deg, clipped to cap band)
    k = 47.14 / 66
    lo = 218.0
    ro = 315.2
    stem_l, stem_r = 266.6 - S / 2, 266.6 + S / 2
    y_join = (stem_l - lo) / k
    y_crotch = ((ro - S / math.cos(math.atan(k))) - (lo + S / math.cos(math.atan(k)))) / (2 * k)
    x_crotch = lo + S / math.cos(math.atan(k)) + k * y_crotch
    y_pts = [(lo, 0), (lo + S / math.cos(math.atan(k)), 0), (x_crotch, y_crotch),
             (ro - S / math.cos(math.atan(k)), 0), (ro, 0), (stem_r, y_join), (stem_r, 100),
             (stem_l, 100), (stem_l, y_join)]
    y_d = "M" + "L".join(f"{f(a_)} {f(b_)}" for a_, b_ in y_pts) + "Z"
    fx = v["fx"]
    rects += [(fx, 0, S, 100), (fx, 0, 70, SH), (fx, 43.5, 58, SH)]
    d = c_d + y_d + "".join(f"M{x} {y}h{w}v{h}h{-w}Z" for x, y, w, h in rects)
    p.append(P(d, ink))
    p.append(helm(v["cx"], 50, n=v["n"], rot=rot, ink=ink, top=top, heading=heading, **HELM_WM))
    right = fx + 70
    return "".join(p), right


def wordmark_box(variant="six", heading=6.0, pad=10):
    """Same box for master and cities, so lockups align. Top = tallest (city with heading handle)."""
    _, right = wordmark_parts(variant=variant)
    top = 50 - (HELM_WM["h_out"] + heading)
    bottom = 50 + HELM_WM["h_out"]
    return (-pad, top - pad, right + 2 * pad, bottom - top + 2 * pad)


def wordmark_svg(ink=INK, top=None, variant="six", heading=0.0, title="City Of", width=None, box_heading=6.0, rot=0.0):
    x, y, w, h = wordmark_box(variant, box_heading)
    body, _ = wordmark_parts(ink, top, variant, heading, rot)
    wa = f' width="{width}"' if width else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(x)} {f(y)} {f(w)} {f(h)}"{wa} role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}</svg>')


# ---------- SYMBOL (viewBox 200) ----------
SYM = dict(rim_r=55, rim_w=17, hub_r=16, spoke_w=9, h_in=62, h_out=86, h_w=15)
SYM_SMALL = dict(rim_r=54, rim_w=22, hub_r=16, spoke_w=15, h_in=62, h_out=88, h_w=21)


def symbol_svg(ink=INK, top=None, n=6, heading=0.0, small=False, bg=None, rounded=0, title="City Of", cy=100, scale=1.0):
    g = SYM_SMALL if small else SYM
    g = {k: v * scale for k, v in g.items()}
    bgs = f'<rect width="200" height="200" rx="{rounded}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="{title}">'
            f'<title>{title}</title>{bgs}{helm(100, cy, n=n, ink=ink, top=top, heading=heading * scale, **g)}</svg>')


def micro_svg(ink=CALCE, top=None, bg=INK, rounded=40, title="City Of", n=6, heading=0.0):
    """Favicon cut (<= 32 px): thick rim, 3 thick spokes through a small hub, long slim handles.
    Built against the 'settings gear' reading: a gear = solid ring + short wide teeth + empty centre."""
    g = dict(rim_r=50, rim_w=19, hub_r=14, spoke_w=13, h_in=58, h_out=88, h_w=20)
    bgs = f'<rect width="200" height="200" rx="{rounded}" fill="{bg}"/>' if bg else ''
    cy = 100 - heading / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="{title}">'
            f'<title>{title}</title>{bgs}{helm(100, cy, n=n, ink=ink, top=top, heading=heading, **g)}</svg>')


# ---------- outlined text ----------
_fonts = {}


def _font(path):
    if path not in _fonts:
        _fonts[path] = TTFont(path)
    return _fonts[path]


def _kern_table(font):
    """Very small GPOS pair-kerning reader (format 1 and 2), enough for Latin names."""
    if hasattr(font, "_kp"):
        return font._kp
    kp = {}
    try:
        gpos = font["GPOS"].table
        for lookup in gpos.LookupList.Lookup:
            for st in lookup.SubTable:
                if getattr(st, "ExtSubTable", None) is not None:
                    st = st.ExtSubTable
                if getattr(st, "LookupType", None) != 2 and type(st).__name__ != "PairPos":
                    continue
                if st.Format == 1:
                    cov = st.Coverage.glyphs
                    for i, ps in enumerate(st.PairSet):
                        for pvr in ps.PairValueRecord:
                            v = getattr(pvr.Value1, "XAdvance", 0) or 0
                            if v:
                                kp.setdefault((cov[i], pvr.SecondGlyph), v)
                elif st.Format == 2:
                    cov = st.Coverage.glyphs
                    cd1 = st.ClassDef1.classDefs
                    cd2 = st.ClassDef2.classDefs
                    font._kc = (cov, cd1, cd2, st)
                    kp.setdefault("__class__", []).append((set(cov), cd1, cd2, st))
    except Exception:
        pass
    font._kp = kp
    return kp


def _kern(font, a, b):
    kp = _kern_table(font)
    if (a, b) in kp:
        return kp[(a, b)]
    for cov, cd1, cd2, st in kp.get("__class__", []):
        if a in cov:
            c1 = cd1.get(a, 0)
            c2 = cd2.get(b, 0)
            rec = st.Class1Record[c1].Class2Record[c2]
            v = getattr(rec.Value1, "XAdvance", 0) or 0
            if v:
                return v
    return 0


def text_outline(s, font_path, size, x=0, y=0, tracking=0, anchor="start"):
    """Return (path d, width) for string s set at font size `size`, baseline y."""
    font = _font(font_path)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    sc = size / upm
    names = [cmap[ord(ch)] for ch in s]
    advs = []
    for i, g in enumerate(names):
        a = font["hmtx"][g][0]
        if i < len(names) - 1:
            a += _kern(font, g, names[i + 1]) + tracking
        advs.append(a)
    width = sum(advs) * sc
    x0 = x - (width / 2 if anchor == "middle" else width if anchor == "end" else 0)
    pen = SVGPathPen(gs, ntos=lambda v: f(v))
    cur = 0
    for g, a in zip(names, advs):
        tp = TransformPen(pen, (sc, 0, 0, -sc, x0 + cur * sc, y))
        gs[g].draw(tp)
        cur += a
    return pen.getCommands(), width


def ink_bbox_of_text(s, font_path, size, tracking=0):
    """Approximate ink bounds (xmin, ymin, xmax, ymax) relative to origin/baseline."""
    from fontTools.pens.boundsPen import BoundsPen
    font = _font(font_path)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    sc = size / font["head"].unitsPerEm
    cur = 0
    xs, ys = [], []
    names = [cmap[ord(ch)] for ch in s]
    for i, g in enumerate(names):
        bp = BoundsPen(gs)
        gs[g].draw(bp)
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            xs += [cur + x0, cur + x1]
            ys += [y0, y1]
        cur += font["hmtx"][g][0] + ((_kern(font, g, names[i + 1]) + tracking) if i < len(names) - 1 else 0)
    return min(xs) * sc, -max(ys) * sc, max(xs) * sc, -min(ys) * sc


# ---------- CITY LOCKUPS ----------
def city_horizontal_svg(city, ink=INK, top=None, variant="six", title=None, name_ratio=1.42):
    """'CITY OF Sorrento' as one phrase: word space instead of a divider. Name cap height ~= wordmark cap height."""
    c = CITIES[city]
    top = top or c["deep"]
    wx, wy, ww, wh = wordmark_box(variant)
    body, right = wordmark_parts(ink, top, variant, heading=6.0)
    size = 100 / 0.72 * 1.0 * name_ratio / 1.42  # Instrument Serif cap height = 0.72 em -> name caps = 100
    gap = 34  # word space ~ 1/3 cap
    xb0, _, xb1, _ = ink_bbox_of_text(c["name"], SERIF_ITALIC, size, tracking=-10)
    d, w = text_outline(c["name"], SERIF_ITALIC, size, x=right + gap - xb0, y=100, tracking=-10)
    total_w = right + gap - xb0 + xb1 + 10
    title = title or f"City of {c['name']}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(wx)} {f(wy)} {f(total_w - wx)} {f(wh)}" role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}{P(d, ink)}</svg>')


def city_stacked_svg(city, ink=INK, top=None, variant="six", title=None, text_fill=None):
    """Wordmark over city name. Fixed SIZE ratio (not fixed width): name x-height = 1.0 x wordmark cap height."""
    c = CITIES[city]
    top = top or c["deep"]
    text_fill = text_fill or ink
    wx, wy, ww, wh = wordmark_box(variant)
    body, right = wordmark_parts(ink, top, variant, heading=6.0)
    wm_w = right
    size = 100 / 0.51 * 1.0  # x-height 0.51 em -> x-height = wordmark cap height (100)
    x0, y0, x1, y1 = ink_bbox_of_text(c["name"], SERIF_ITALIC, size, tracking=-10)
    name_w = x1 - x0
    W = max(wm_w, name_w) + 40
    gap = 34  # from wordmark bottom handle to name cap line
    wm_x = (W - wm_w) / 2
    name_base = 50 + HELM_WM["h_out"] + gap - y0  # y0 is negative (cap top)
    d, _ = text_outline(c["name"], SERIF_ITALIC, size, x=(W - name_w) / 2 - x0, y=name_base, tracking=-10)
    top_y = wy - 10
    H = name_base + y1 + 20 - top_y
    title = title or f"City of {c['name']}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {f(top_y)} {f(W)} {f(H)}" role="img" aria-label="{title}">'
            f'<title>{title}</title><g transform="translate({f(wm_x)} 0)">{body}</g>{P(d, text_fill)}</svg>')


# ---------- SEAL ----------
def _arc_text(s, font_path, size, cx, cy, R, tracking, bottom=False):
    font = _font(font_path)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    sc = size / font["head"].unitsPerEm
    names = [cmap[ord(ch)] for ch in s]
    advs = [font["hmtx"][g][0] * sc + (tracking if i < len(names) - 1 else 0) for i, g in enumerate(names)]
    total = sum(advs)
    span = total / R  # radians
    out = []
    pos = -total / 2
    for g, a in zip(names, advs):
        gw = font["hmtx"][g][0] * sc
        mid = (pos + gw / 2) / R
        deg = math.degrees(mid)
        pen = SVGPathPen(gs, ntos=lambda v: f(v))
        tp = TransformPen(pen, (sc, 0, 0, -sc, -gw / 2, 0))
        gs[g].draw(tp)
        dd = pen.getCommands()
        if dd:
            if bottom:
                tr = f"translate({f(cx)} {f(cy)}) rotate({f(-deg)}) translate(0 {f(R)})"
            else:
                tr = f"translate({f(cx)} {f(cy)}) rotate({f(deg)}) translate(0 {f(-R)})"
            out.append(f'<path transform="{tr}" d="{dd}"/>')
        pos += a
    return "".join(out)


def seal_svg(city, ink=INK, bg=CALCE, top=None, n=6):
    c = CITIES[city]
    top = top or c["deep"]
    cx = cy = 150
    # band between r=104 (inner ring) and r=139.5 (outer ring inner edge): centre text in it
    sym = helm(cx, cy, n=n, rim_r=56, rim_w=15, hub_r=11, spoke_w=7.5, h_in=62, h_out=82, h_w=13, ink=ink, top=top, heading=6)
    ring = (f'<circle cx="150" cy="150" r="146" fill="{bg}"/>'
            + P(ring_d(cx, cy, 146, 139), ink) + P(ring_d(cx, cy, 106, 102.5), ink))
    cap = 0.72
    size_t = 25
    # cap-height centred on band mid radius 122: baseline radius = 122 - cap*size/2
    top_txt = _arc_text(f"CITY OF {c['name'].upper()}", SERIF_REGULAR, size_t, cx, cy, 122 - cap * size_t / 2, tracking=4.2)
    size_b = 17
    bot_txt = _arc_text(c["coord"].replace("′", "'"), SERIF_REGULAR, size_b, cx, cy, 122 + cap * size_b / 2, tracking=2.4, bottom=True)
    dots = P(disc_d(28, 150, 3.5) + disc_d(272, 150, 3.5), ink)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="City of {c["name"]} seal">'
            f'<title>City of {c["name"]}</title>{ring}{sym}<g fill="{ink}">{top_txt}{bot_txt}</g>{dots}</svg>')


# ---------- ALTERNATIVE: "C-O" monogram (C of City + helm-O), for avatars where a bare helm is generic ----------
def monogram_svg(ink=INK, top=None, bg=None, rounded=0, heading=0.0, gap=13, title="City Of"):
    S_ = 14
    a = math.radians(42)
    r_o, r_i, ccx, ccy = 52, 38, 52, 50
    ox0, oy0 = ccx + r_o * math.cos(a), ccy - r_o * math.sin(a)
    ox1, oy1 = ccx + r_o * math.cos(a), ccy + r_o * math.sin(a)
    ix0, iy0 = ccx + r_i * math.cos(a), ccy - r_i * math.sin(a)
    ix1, iy1 = ccx + r_i * math.cos(a), ccy + r_i * math.sin(a)
    c_d = (f"M{f(ox0)} {f(oy0)}A{r_o} {r_o} 0 1 0 {f(ox1)} {f(oy1)}L{f(ix1)} {f(iy1)}"
           f"A{r_i} {r_i} 0 1 1 {f(ix0)} {f(iy0)}Z")
    hx = 104 + gap + 52 - 14  # C outer right ~ 90.6; helm rim left = hx - 52
    body = P(c_d, ink) + helm(hx, 50, n=6, ink=ink, top=top, heading=heading, **HELM_WM)
    # fit into 200x200: content x 0..hx+56, y -(64+heading)..114
    x0, x1 = 0, hx + 56
    y0, y1 = 50 - 64 - heading, 114
    w, h = x1 - x0, y1 - y0
    sc = 150 / max(w, h)
    tx = 100 - (x0 + w / 2) * sc
    ty = 100 - (y0 + h / 2) * sc
    bgs = f'<rect width="200" height="200" rx="{rounded}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="{title}"><title>{title}</title>'
            f'{bgs}<g transform="translate({f(tx)} {f(ty)}) scale({f(sc)})">{body}</g></svg>')
