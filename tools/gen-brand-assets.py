"""Generate the Filmproof wordmark + Fp mark from Space Grotesk Bold outlines.

The letterforms are the same ones the site renders in the nav (Space Grotesk
Bold, letter-spacing -0.01em), converted to vector paths so the assets need no
webfont. Re-run this if the brand colours or the wordmark ever change:

    pip install fonttools pillow
    curl -sL "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf" \
        -o tools/SpaceGrotesk-Bold.ttf
    python3 tools/gen-brand-assets.py    # writes tools/out/

Then copy the wanted files into web/public/brand/ and web/app/ (see
web/public/brand/README.md for the naming used there).
"""
import os, math
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from PIL import Image, ImageChops

S = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(S, 'out')
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(S, 'SpaceGrotesk-Bold.ttf')

INK = '#ede7d7'
CHINA = '#e8532e'
BASE = '#1a1811'
AMBER = '#e6ad46'

font = TTFont(FONT)
upm = font['head'].unitsPerEm
gs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font['hmtx']
TRACK = -0.01  # matches CSS letter-spacing:-0.01em


def glyph_contours(ch):
    """Return (contours, advance) in font units; contours are lists of segments."""
    name = cmap[ord(ch)]
    pen = DecomposingRecordingPen(gs)
    gs[name].draw(pen)
    return pen.value, hmtx[name][0]


def layout(text, track=TRACK):
    """Return (list of (contours, xoffset), total advance) in font units."""
    items, x = [], 0.0
    for ch in text:
        contours, adv = glyph_contours(ch)
        items.append((contours, x))
        x += adv + track * upm
    return items, x - track * upm


# ---------- SVG path building ----------

def svg_path(items, scale, ox, oy):
    """Flip y (font up -> svg down) and emit a single path 'd'."""
    def P(pt):
        return f"{ox + pt[0] * scale:.2f} {oy - pt[1] * scale:.2f}"
    d = []
    for contours, xoff in items:
        for op, args in contours:
            a = [(p[0] + xoff, p[1]) for p in args]
            if op == 'moveTo':
                d.append(f"M{P(a[0])}")
            elif op == 'lineTo':
                d.append(f"L{P(a[0])}")
            elif op == 'qCurveTo':
                # fontTools may give implied on-curve points (last may be None)
                pts = a
                if pts[-1] is None:
                    pts = pts[:-1]
                    # implied closing: handled by TrueType spec; approximate
                    for i in range(len(pts)):
                        ctrl = pts[i]
                        nxt = pts[i + 1] if i + 1 < len(pts) else pts[0]
                        end = ((ctrl[0] + nxt[0]) / 2, (ctrl[1] + nxt[1]) / 2)
                        d.append(f"Q{P(ctrl)} {P(end)}")
                    continue
                for i in range(len(pts) - 1):
                    ctrl = pts[i]
                    if i == len(pts) - 2:
                        end = pts[-1]
                    else:
                        end = ((ctrl[0] + pts[i + 1][0]) / 2, (ctrl[1] + pts[i + 1][1]) / 2)
                    d.append(f"Q{P(ctrl)} {P(end)}")
            elif op == 'curveTo':
                for i in range(0, len(a), 3):
                    c1, c2, e = a[i], a[i + 1], a[i + 2]
                    d.append(f"C{P(c1)} {P(c2)} {P(e)}")
            elif op == 'closePath':
                d.append('Z')
    return ''.join(d)


# ---------- rasterisation (even-odd via XOR of contours) ----------

def flatten(items, scale, ox, oy, steps=24):
    """Return list of polygons (screen coords)."""
    polys, cur = [], []

    def P(pt):
        return (ox + pt[0] * scale, oy - pt[1] * scale)

    for contours, xoff in items:
        pos = None
        for op, args in contours:
            a = [(p[0] + xoff, p[1]) if p else None for p in args]
            if op == 'moveTo':
                if cur:
                    polys.append(cur)
                cur = [P(a[0])]
                pos = a[0]
            elif op == 'lineTo':
                cur.append(P(a[0]))
                pos = a[0]
            elif op == 'qCurveTo':
                pts = a
                implied = pts[-1] is None
                if implied:
                    pts = pts[:-1]
                    seq = []
                    for i in range(len(pts)):
                        ctrl = pts[i]
                        nxt = pts[(i + 1) % len(pts)]
                        seq.append((ctrl, ((ctrl[0] + nxt[0]) / 2, (ctrl[1] + nxt[1]) / 2)))
                else:
                    seq = []
                    for i in range(len(pts) - 1):
                        ctrl = pts[i]
                        end = pts[-1] if i == len(pts) - 2 else ((ctrl[0] + pts[i + 1][0]) / 2, (ctrl[1] + pts[i + 1][1]) / 2)
                        seq.append((ctrl, end))
                for ctrl, end in seq:
                    p0 = pos
                    for s in range(1, steps + 1):
                        t = s / steps
                        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * ctrl[0] + t * t * end[0]
                        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * ctrl[1] + t * t * end[1]
                        cur.append(P((x, y)))
                    pos = end
            elif op == 'curveTo':
                for i in range(0, len(a), 3):
                    c1, c2, e = a[i], a[i + 1], a[i + 2]
                    p0 = pos
                    for s in range(1, steps + 1):
                        t = s / steps
                        mt = 1 - t
                        x = mt**3 * p0[0] + 3 * mt**2 * t * c1[0] + 3 * mt * t**2 * c2[0] + t**3 * e[0]
                        y = mt**3 * p0[1] + 3 * mt**2 * t * c1[1] + 3 * mt * t**2 * c2[1] + t**3 * e[1]
                        cur.append(P((x, y)))
                    pos = e
            elif op == 'closePath':
                if cur:
                    polys.append(cur)
                cur = []
    if cur:
        polys.append(cur)
    return polys


def text_mask(items, size, scale, ox, oy, ss=4):
    from PIL import ImageDraw
    w, h = size
    mask = Image.new('L', (w * ss, h * ss), 0)
    for poly in flatten(items, scale * ss, ox * ss, oy * ss):
        if len(poly) < 3:
            continue
        layer = Image.new('L', mask.size, 0)
        ImageDraw.Draw(layer).polygon(poly, fill=255)
        mask = ImageChops.difference(mask, layer)  # XOR for binary masks
    return mask.resize((w, h), Image.LANCZOS)


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rounded_square(size, radius, color, ss=4):
    from PIL import ImageDraw
    img = Image.new('RGBA', (size * ss, size * ss), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, size * ss - 1, size * ss - 1],
                                          radius=radius * ss, fill=hexrgb(color) + (255,))
    return img.resize((size, size), Image.LANCZOS)


# ---------- bounds helper ----------

def ink_bounds(items):
    xs, ys = [], []
    for contours, xoff in items:
        for op, args in contours:
            for p in args:
                if p:
                    xs.append(p[0] + xoff)
                    ys.append(p[1])
    return min(xs), min(ys), max(xs), max(ys)


# =================== 1. WORDMARK ===================
WORD = 'Filmproof'
items, adv = layout(WORD)
x0, y0, x1, y1 = ink_bounds(items)
PAD = 40  # font units of breathing room in the viewBox
vw, vh = (x1 - x0) + 2 * PAD, (y1 - y0) + 2 * PAD


def write_wordmark_svg(path, color, title):
    scale = 1.0
    d = svg_path(items, scale, PAD - x0, PAD + y1)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.0f} {vh:.0f}" '
           f'width="{vw:.0f}" height="{vh:.0f}" role="img" aria-label="Filmproof">'
           f'<title>{title}</title>'
           f'<path fill="{color}" fill-rule="evenodd" d="{d}"/></svg>')
    open(path, 'w').write(svg)


write_wordmark_svg(os.path.join(OUT, 'filmproof-wordmark-ink.svg'), INK, 'Filmproof')
write_wordmark_svg(os.path.join(OUT, 'filmproof-wordmark-orange.svg'), CHINA, 'Filmproof')
write_wordmark_svg(os.path.join(OUT, 'filmproof-wordmark-dark.svg'), BASE, 'Filmproof')
write_wordmark_svg(os.path.join(OUT, 'filmproof-wordmark-current.svg'), 'currentColor', 'Filmproof')

# transparent PNG wordmarks at 1200px wide
for name, col in (('ink', INK), ('orange', CHINA), ('dark', BASE)):
    W = 1200
    sc = W / vw
    H = int(round(vh * sc))
    mask = text_mask(items, (W, H), sc, (PAD - x0) * sc, (PAD + y1) * sc)
    img = Image.new('RGBA', (W, H), hexrgb(col) + (0,))
    img.putalpha(mask)
    img = Image.composite(Image.new('RGBA', (W, H), hexrgb(col) + (255,)),
                          Image.new('RGBA', (W, H), (0, 0, 0, 0)), mask)
    img.save(os.path.join(OUT, f'filmproof-wordmark-{name}.png'))

# =================== 2. Fp MARK ===================
MARK = 'Fp'
mitems, madv = layout(MARK, track=TRACK)
mx0, my0, mx1, my1 = ink_bounds(mitems)
mw, mh = mx1 - mx0, my1 - my0


def fp_svg(size, bg, fg, radius_ratio=0.22, fill=0.64, inset_border=None):
    """Fp centred on a rounded square, sized so the cap-to-descender block fills `fill`."""
    scale = (size * fill) / mh
    tx = (size - mw * scale) / 2 - mx0 * scale
    ty = (size - mh * scale) / 2 + my1 * scale
    d = svg_path(mitems, scale, tx, ty)
    r = size * radius_ratio
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" role="img" aria-label="Filmproof">']
    if bg:
        parts.append(f'<rect width="{size}" height="{size}" rx="{r:.2f}" ry="{r:.2f}" fill="{bg}"/>')
    parts.append(f'<path fill="{fg}" fill-rule="evenodd" d="{d}"/>')
    parts.append('</svg>')
    return ''.join(parts)


def fp_png(size, bg, fg, radius_ratio=0.22, fill=0.64):
    scale = (size * fill) / mh
    tx = (size - mw * scale) / 2 - mx0 * scale
    ty = (size - mh * scale) / 2 + my1 * scale
    mask = text_mask(mitems, (size, size), scale, tx, ty)
    base = rounded_square(size, size * radius_ratio, bg) if bg else Image.new('RGBA', (size, size), (0, 0, 0, 0))
    fgimg = Image.new('RGBA', (size, size), hexrgb(fg) + (255,))
    return Image.composite(fgimg, base, mask)


VARIANTS = {
    'orange-on-dark': (BASE, CHINA),
    'ink-on-dark': (BASE, INK),
    'amber-on-dark': (BASE, AMBER),
    'dark-on-orange': (CHINA, BASE),
    'orange-transparent': (None, CHINA),
    'ink-transparent': (None, INK),
}
for name, (bg, fg) in VARIANTS.items():
    open(os.path.join(OUT, f'fp-{name}.svg'), 'w').write(fp_svg(512, bg, fg))
    fp_png(512, bg, fg).save(os.path.join(OUT, f'fp-{name}-512.png'))

# contact sheet for review
sheet = Image.new('RGB', (6 * 160 + 7 * 20, 2 * (160 + 20) + 20 + 40), hexrgb('#2b2b2b'))
for i, name in enumerate(VARIANTS):
    for j, px in enumerate((128, 32)):
        bg, fg = VARIANTS[name]
        im = fp_png(px, bg, fg).resize((128, 128), Image.NEAREST if px == 32 else Image.LANCZOS)
        sheet.paste(im, (20 + i * 180, 20 + j * 180), im)
sheet.save(os.path.join(OUT, 'fp-contact-sheet.png'))

print('wordmark viewBox', f'{vw:.0f}x{vh:.0f}', 'files:', sorted(os.listdir(OUT)))
