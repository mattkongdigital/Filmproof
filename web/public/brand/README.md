# Filmproof brand assets

Everything here is drawn from the same letterforms as the site nav — **Space
Grotesk Bold, letter-spacing -0.01em** — converted to outlines, so no webfont is
needed to render them.

## Colours

| Token | Hex | Use |
| --- | --- | --- |
| `--ink` | `#ede7d7` | wordmark on the dark site background |
| `--china` | `#e8532e` | the nav hover orange; the Fp mark's letters |
| `--base` | `#1a1811` | site background; the Fp mark's tile |

## Wordmark

| File | Notes |
| --- | --- |
| `filmproof-wordmark-ink.svg` / `.png` | `#ede7d7` — the default, for dark backgrounds |
| `filmproof-wordmark-orange.svg` / `.png` | `#e8532e` — the hover colour, for accent use |
| `filmproof-wordmark-dark.svg` / `.png` | `#1a1811` — for light/white backgrounds |
| `filmproof-wordmark-currentcolor.svg` | inherits `color` from CSS — inline it to get hover states for free |

The SVGs are transparent cut-outs with the artwork trimmed to the glyphs plus a
small even margin, so setting a width is enough to place them. PNGs are 1200px
wide with a transparent background.

## Fp mark

| File | Notes |
| --- | --- |
| `filmproof-mark-fp.svg` | orange on the dark rounded tile — the primary mark |
| `filmproof-mark-fp-{512,180,64,32,16}.png` | the same, rasterised |
| `filmproof-mark-fp-orange.svg` / `-orange-512.png` | letters only, transparent |
| `filmproof-mark-fp-ink.svg` / `-ink-512.png` | letters only in `#ede7d7`, transparent |
| `filmproof-mark-fp-inverse.svg` | dark letters on an orange tile |

The tile carries the same dot grain as the site background
(`radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)` on a 3px grid),
scaled to the artwork rather than to screen pixels — it matches the site's grain
when the mark is shown at roughly 128px, and is slightly stronger in alpha so it
survives scaling and re-encoding. The 16/32/64px rasters are left clean, since
dots that fine only turn to noise at those sizes.

The favicon and the iOS home-screen icon are wired up through the Next.js app
router as `web/app/icon.png` and `web/app/apple-icon.png` — both are the primary
mark (the apple icon is full-bleed, since iOS rounds the corners itself).

## Socials

| File | Notes |
| --- | --- |
| `filmproof-avatar-1000.png` / `-400.png` / `.svg` | square profile picture — full-bleed textured tile, orange Fp |
| `filmproof-card-1200x630.png` / `filmproof-card.svg` | 1200×630 share / link-preview card, wordmark on the textured ground |

The avatar is deliberately **square-cornered and full-bleed**: X, Instagram and
LinkedIn crop profile pictures to a circle, which would clip the rounded corners
of the app icon and look like a mistake. The letters sit well inside the
inscribed circle, so the same file works cropped to a circle, a rounded square,
or left square. Upload the 1000px version anywhere that accepts it.

## Lockup (email signature, headers, decks)

| File | Notes |
| --- | --- |
| `filmproof-lockup-onlight-1200.png` / `-600.png` / `.svg` | dark wordmark — for white and light backgrounds |
| `filmproof-lockup-ondark-1200.png` / `-600.png` / `.svg` | ink wordmark — for dark backgrounds |

Mark plus wordmark, 4.25:1, transparent background. PNGs are sized for retina:
ship the 600px file and display it at 200px wide, or the 1200px file at 400px.

Email clients strip SVG and ignore CSS backgrounds, so signatures must use the
PNG with explicit `width`/`height` attributes. Once the site is deployed the
files are served from `/brand/…`:

```html
<a href="https://filmproof.co.uk" style="text-decoration:none">
  <img src="https://filmproof.co.uk/brand/filmproof-lockup-onlight-600.png"
       alt="Filmproof" width="200" height="47"
       style="display:block;border:0;outline:none;text-decoration:none">
</a>
```

Use the `-ondark-` file instead if the recipient's client is likely to invert
your signature (Outlook dark mode), or keep the dark-text version and accept the
transparent background going light-on-light — the mark's own tile keeps it
readable either way.

Regenerate any of this with `tools/gen-brand-assets.py` (wordmark, mark, icons)
and `tools/gen-brand-social.py` (avatar, lockups, card).
