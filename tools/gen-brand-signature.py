"""Signature images: the lockup on a solid ground, sized for a 300x100 slot.

Email clients render transparency unpredictably, so these ship on a solid white
or solid dark ground. See gen-brand-assets.py for setup. The dark version is
regenerated with full-canvas grain by hand (see README) rather than pasting the
grained tile onto a flat ground.
"""
import importlib.util, os
from PIL import Image

spec = importlib.util.spec_from_file_location('gensocial', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen-brand-social.py'))
gs = importlib.util.module_from_spec(spec); spec.loader.exec_module(gs)
gen = gs.gen

BRAND = '/home/user/Filmproof/web/public/brand'
W, H = 600, 200          # 2x of a 300x100 slot
LOCK_W = 520             # leaves ~40px (=20px displayed) of clear space

RATIO = gs.lockup_geom(1000)['W'] / 1000.0


def signature(bg, word_colour):
    tile = int(round(LOCK_W / RATIO))
    lock = gs.lockup_png(tile, word_colour)
    lock = lock.resize((LOCK_W, int(round(LOCK_W / RATIO))), Image.LANCZOS)
    canvas = Image.new('RGB', (W, H), gen.hexrgb(bg))
    canvas.paste(lock, ((W - lock.width) // 2, (H - lock.height) // 2), lock)
    return canvas


signature('#ffffff', gen.BASE).save(f'{BRAND}/filmproof-signature-white.png')
signature(gen.BASE, gen.INK).save(f'{BRAND}/filmproof-signature-dark.png')
print('saved 600x200 signature images')
