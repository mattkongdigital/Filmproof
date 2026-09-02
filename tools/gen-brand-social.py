"""Social avatars, lockups and the share card, built on the same outlines as
gen-brand-assets.py (see that file for setup; run it from the repo root:

    python3 tools/gen-brand-social.py     # writes tools/out/
"""
import importlib.util, os
from PIL import Image

_spec = importlib.util.spec_from_file_location(
    'gen_brand_assets', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen-brand-assets.py'))
gen = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gen)

OUT = os.path.join(gen.S, 'out')

INK, CHINA, BASE = gen.INK, gen.CHINA, gen.BASE

# wordmark ink metrics (gen pads the viewBox by PAD on every side)
WX0, WY0, WX1, WY1 = gen.x0, gen.y0, gen.x1, gen.y1
WW, WH = WX1 - WX0, WY1 - WY0          # 4440 x 914 font units
# Fp block metrics
MX0, MY0, MX1, MY1 = gen.mx0, gen.my0, gen.mx1, gen.my1
MW, MH = gen.mw, gen.mh                 # 1050 x 900

WORD_RATIO = 0.62   # wordmark ink height as a fraction of the tile
GAP_RATIO = 0.24    # space between tile and wordmark
FP_FILL = 0.64      # Fp height inside its tile (matches the favicon)


def lockup_geom(tile):
    wh = tile * WORD_RATIO
    wscale = wh / WH
    ww = WW * wscale
    gap = tile * GAP_RATIO
    return dict(tile=tile, gap=gap, wscale=wscale, ww=ww, wh=wh,
                W=tile + gap + ww, H=tile)


def lockup_svg(tile, word_color, grain=True):
    g = lockup_geom(tile)
    W, H = g['W'], g['H']
    r = tile * 0.22
    p = gen.GRAIN_PITCH * tile / 512
    # Fp inside the tile
    fs = (tile * FP_FILL) / MH
    fx = (tile - MW * fs) / 2 - MX0 * fs
    fy = (tile - MH * fs) / 2 + MY1 * fs
    fp_d = gen.svg_path(gen.mitems, fs, fx, fy)
    # wordmark, ink-centred against the tile
    wx = tile + g['gap'] - WX0 * g['wscale']
    wy = (H - g['wh']) / 2 + WY1 * g['wscale']
    word_d = gen.svg_path(gen.items, g['wscale'], wx, wy)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}" '
             f'width="{W:.0f}" height="{H:.0f}" role="img" aria-label="Filmproof">'
             f'<title>Filmproof</title>']
    if grain:
        parts.append(
            f'<defs><pattern id="fp-grain" width="{p:.3f}" height="{p:.3f}" patternUnits="userSpaceOnUse">'
            f'<circle cx="{p/2:.3f}" cy="{p/2:.3f}" r="{gen.GRAIN_R * tile / 512:.3f}" fill="#ffffff" fill-opacity="{gen.GRAIN_ALPHA}"/>'
            f'</pattern></defs>')
    parts.append(f'<rect width="{tile}" height="{tile}" rx="{r:.2f}" ry="{r:.2f}" fill="{BASE}"/>')
    if grain:
        parts.append(f'<rect width="{tile}" height="{tile}" rx="{r:.2f}" ry="{r:.2f}" fill="url(#fp-grain)"/>')
    parts.append(f'<path fill="{CHINA}" fill-rule="evenodd" d="{fp_d}"/>')
    parts.append(f'<path fill="{word_color}" fill-rule="evenodd" d="{word_d}"/>')
    parts.append('</svg>')
    return ''.join(parts)


def lockup_png(tile, word_color):
    g = lockup_geom(tile)
    W, H = int(round(g['W'])), int(round(g['H']))
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    img.paste(gen.fp_png(tile, BASE, CHINA), (0, 0))
    wx = tile + g['gap'] - WX0 * g['wscale']
    wy = (H - g['wh']) / 2 + WY1 * g['wscale']
    mask = gen.text_mask(gen.items, (W, H), g['wscale'], wx, wy)
    word = Image.new('RGBA', (W, H), gen.hexrgb(word_color) + (255,))
    return Image.composite(word, img, mask)


def avatar_png(size, fill=0.56):
    """Full-bleed textured square — square corners so a circular crop looks
    intentional, letters kept inside the inscribed circle."""
    scale = (size * fill) / MH
    tx = (size - MW * scale) / 2 - MX0 * scale
    ty = (size - MH * scale) / 2 + MY1 * scale
    base = Image.new('RGBA', (size, size), gen.hexrgb(BASE) + (255,))
    overlay = gen.grain_overlay(size)
    if overlay is not None:
        base = Image.alpha_composite(base, overlay)
    mask = gen.text_mask(gen.mitems, (size, size), scale, tx, ty)
    fg = Image.new('RGBA', (size, size), gen.hexrgb(CHINA) + (255,))
    return Image.composite(fg, base, mask)


def avatar_svg(size=1000, fill=0.56):
    scale = (size * fill) / MH
    tx = (size - MW * scale) / 2 - MX0 * scale
    ty = (size - MH * scale) / 2 + MY1 * scale
    d = gen.svg_path(gen.mitems, scale, tx, ty)
    p = gen.GRAIN_PITCH * size / 512
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" '
            f'role="img" aria-label="Filmproof"><title>Filmproof</title>'
            f'<defs><pattern id="fp-grain" width="{p:.3f}" height="{p:.3f}" patternUnits="userSpaceOnUse">'
            f'<circle cx="{p/2:.3f}" cy="{p/2:.3f}" r="{gen.GRAIN_R * size / 512:.3f}" fill="#ffffff" fill-opacity="{gen.GRAIN_ALPHA}"/>'
            f'</pattern></defs>'
            f'<rect width="{size}" height="{size}" fill="{BASE}"/>'
            f'<rect width="{size}" height="{size}" fill="url(#fp-grain)"/>'
            f'<path fill="{CHINA}" fill-rule="evenodd" d="{d}"/></svg>')


def card_png(W, H, word_frac=0.56):
    """Textured dark card with the wordmark centred — share/link-preview image."""
    base = Image.new('RGBA', (W, H), gen.hexrgb(BASE) + (255,))
    overlay = gen.grain_overlay(max(W, H))
    if overlay is not None:
        base = Image.alpha_composite(base, overlay.crop((0, 0, W, H)))
    wscale = (W * word_frac) / WW
    wx = (W - WW * wscale) / 2 - WX0 * wscale
    wy = (H - WH * wscale) / 2 + WY1 * wscale
    mask = gen.text_mask(gen.items, (W, H), wscale, wx, wy)
    fg = Image.new('RGBA', (W, H), gen.hexrgb(INK) + (255,))
    return Image.composite(fg, base, mask)


def card_svg(W, H, word_frac=0.56):
    wscale = (W * word_frac) / WW
    wx = (W - WW * wscale) / 2 - WX0 * wscale
    wy = (H - WH * wscale) / 2 + WY1 * wscale
    d = gen.svg_path(gen.items, wscale, wx, wy)
    p = gen.GRAIN_PITCH * max(W, H) / 512
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
            f'role="img" aria-label="Filmproof"><title>Filmproof</title>'
            f'<defs><pattern id="fp-grain" width="{p:.3f}" height="{p:.3f}" patternUnits="userSpaceOnUse">'
            f'<circle cx="{p/2:.3f}" cy="{p/2:.3f}" r="{gen.GRAIN_R * max(W, H) / 512:.3f}" fill="#ffffff" fill-opacity="{gen.GRAIN_ALPHA}"/>'
            f'</pattern></defs>'
            f'<rect width="{W}" height="{H}" fill="{BASE}"/>'
            f'<rect width="{W}" height="{H}" fill="url(#fp-grain)"/>'
            f'<path fill="{INK}" fill-rule="evenodd" d="{d}"/></svg>')


if __name__ == '__main__':
    open(os.path.join(OUT, 'lockup-onlight.svg'), 'w').write(lockup_svg(256, BASE))
    open(os.path.join(OUT, 'lockup-ondark.svg'), 'w').write(lockup_svg(256, INK))
    lockup_png(400, BASE).save(os.path.join(OUT, 'lockup-onlight.png'))
    lockup_png(400, INK).save(os.path.join(OUT, 'lockup-ondark.png'))
    avatar_png(1000).save(os.path.join(OUT, 'avatar.png'))
    open(os.path.join(OUT, 'avatar.svg'), 'w').write(avatar_svg())
    card_png(1200, 630).save(os.path.join(OUT, 'card.png'))
    print('ok', lockup_geom(400))
