# Filmproof — working notes

Two halves share one repo:

- **The catalogue.** `build-catalogue.js` + `build-site-data.js` at the root pull
  live retailer data, match it through `src/normalise.js`, and write
  `web/data/site.json`. Everything the comparison side renders — film pages,
  brand pages, facet pages — is derived from that file. It is generated, not
  committed.
- **The site.** `web/` is a Next.js app built with `output: 'export'` and
  `trailingSlash: true`, deployed to GitHub Pages by `.github/workflows/refresh.yml`.

Below is the editorial layer, which is the half that is hand-authored.

## Editorial content layer

Three silos of markdown, flat and one level deep:

| Files                            | URLs                  |
| -------------------------------- | --------------------- |
| `web/content/guides/<slug>.md`      | `/guides/<slug>/`      |
| `web/content/field-notes/<slug>.md` | `/field-notes/<slug>/` |
| `web/content/opinion/<slug>.md`     | `/opinion/<slug>/`     |

The silo directory **is** the category. There are no dates in URLs, no `/blog/`
wrapper and no `/category/` routes. Each silo has an index at `/<silo>/` listing
its posts newest first, with no pagination.

The slug comes from the **filename**, never from the title — so it is stable and
hand-controlled, and retitling a post never moves its URL. A filename must be
lowercase letters, digits and single hyphens or the build stops.

Reading, parsing and validation all live in `web/lib/posts.js`; the route files
under `web/app/<silo>/` are thin wrappers over `web/components/editorial.js`.

### Frontmatter contract

```yaml
---
title: Shooting Gold 200 in flat winter light   # required
description: One sentence, used as the meta description and the index blurb.  # required
date: 2026-01-14        # required, YYYY-MM-DD
updated: 2026-02-02     # optional
draft: false            # optional, default false
location: [northumberland, tynemouth]
camera:   [pentax-me-super]
film:     [kodak-gold-200-35mm-film]
brand:    [kodak]
format:   [35mm]
---
```

Rules:

- **`title` never carries `" | Filmproof"`.** `web/app/layout.js` appends the
  suffix through the metadata title template; baking it into the string
  duplicates it. Same for the silo index titles in `SILOS`.
- **All five tag axes are lists**, and every value is lowercase and hyphenated so
  it stays URL-safe if a tag ever gets promoted to a real page. Values are
  trimmed and lowercased on parse, and a bare string is accepted as a one-item
  list, but write them as lists.
- **`title`, `description` and `date` are required.** A missing or unparseable
  one fails the build, naming the file.
- **`draft: true` excludes a post completely** — from its silo index, from its
  own route, and from `web/app/sitemap.js`. Build with `INCLUDE_DRAFTS=1` to
  render drafts locally; never set it for the deploy.

### Slug resolution — `film` and `brand`

`film` and `brand` are not free-form tags. They are cross-links into the
catalogue, and they render as links to the same pages the comparison side
generates:

- `film: [<slug>]` must match a `slug` in `web/data/site.json` (looked up with
  `getFilm()` from `web/lib/data.js`) and links to `/film/<slug>/`.
- `brand: [<slug>]` must match a brand in `brandList()` from `web/lib/facets.js`
  — the same list `/brands` is built from, i.e. brands the catalogue actually has
  films for — and links to `/brand/<slug>/`.

There is **one** slug source of truth, the catalogue itself. Do not add a second
lookup table for editorial; if a value does not resolve, fix the frontmatter or
the catalogue, not the resolver.

**A value that does not resolve fails the build**, listing every offending file
and value at once, with the closest catalogue slugs as a hint. Same reasoning as
the empty-catalogue guard in `build-site-data.js`: a dead internal link that
ships silently is worse than a build that stops. Brand slugs in particular are
not always the obvious guess — Japan Camera Hunter is `jch` — so the brand hint
also matches on display name and will point `japan-camera-hunter` at `jch`.

`location`, `camera` and `format` are free-form, unvalidated and unlinked. They
are parsed and stored so the clusters are visible later; they render as plain
text.

### Deliberately not built yet

Tag archive routes (`/location/<x>/` and friends), post-count thresholds for
promoting a tag to a hub, RSS, related posts, author pages, pagination and
comments. Tag pages below a meaningful post count are thin pages — wait until
the clusters are real. `location` and `camera` are the likely candidates;
`brand` and `film` almost certainly never, since the catalogue already has
canonical pages for both.

### One wrinkle worth knowing

`output: 'export'` refuses to build a dynamic route that produces no paths, and
a silo can legitimately be empty. `postParams()` therefore returns a single
sentinel slug (`EMPTY_SILO_PARAM`) for an empty silo; `PostArticle` calls
`notFound()` for it, so it renders the 404 page with `noindex` and appears in
nothing that links, lists or sitemaps it. Once a silo has one published post the
sentinel disappears on its own.
