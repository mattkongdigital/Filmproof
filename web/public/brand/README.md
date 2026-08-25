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

The favicon and the iOS home-screen icon are wired up through the Next.js app
router as `web/app/icon.png` and `web/app/apple-icon.png` — both are the primary
mark (the apple icon is full-bleed, since iOS rounds the corners itself).

Regenerate any of this with `tools/gen-brand-assets.py`.
