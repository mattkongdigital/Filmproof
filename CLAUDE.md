# Filmproof — working notes

Two halves share one repo:

- **The catalogue.** `build-catalogue.js` + `build-site-data.js` at the root pull
  live retailer data, match it through `src/normalise.js`, and write
  `web/data/site.json`. Everything the comparison side renders — film pages,
  brand pages, facet pages — is derived from that file. It is generated, not
  committed.

  Every deploy rebuilds it from live shop data, so it is the most volatile thing
  in the repo. `build-site-data.js` refuses to write a catalogue below
  `MIN_FILMS` (300) or from fewer than `MIN_LIVE_SOURCES` (4) live shops: a
  partial outage at one large shop is enough to halve it while every page still
  renders happily, which is far more dangerous than a total failure. Raise the
  floor as the catalogue grows.
- **The site.** `web/` is a Next.js app built with `output: 'export'` and
  `trailingSlash: true`, deployed to GitHub Pages by `.github/workflows/refresh.yml`.

### Merged films and dead slugs

A film page's slug is derived from the first shop's title for it, so two shops
writing the same film differently can fork it into two pages. `LomoChrome` is
Lomography's family name and shops include or drop it freely, so
`lomography-metropolis-110-film` and `lomography-lomochrome-metropolis-110-film`
were one film with two pages. The token is in `NOISE` in `src/normalise.js`,
which merges them — and Purple, Turquoise and Classicolor the same way.

The cost is that a title whose only line token is `lomochrome` no longer
identifies. That is the right outcome: LomoChrome is a family, not a film, so
such a title belongs in the review queue rather than as a page of its own.

When a merge retires a URL that was live, add it to `LEGACY_FILM_SLUGS` in
`web/lib/data.js`. `output: 'export'` has no server to issue a 301, so
`/film/[slug]/` builds a page for it: canonical at the survivor, `noindex`, a
script that replaces the history entry, and readable copy for anyone with JS
off. A legacy slug whose target has itself left the catalogue is skipped — a
redirect to a 404 is worse than a 404. Ordinary churn (a film going out of
stock and its page vanishing for a build) is NOT for this map; it is the normal
behaviour of a catalogue rebuilt from live data.

Below is the editorial layer, which is the half that is hand-authored.

## Editorial content layer

One silo of markdown, flat and one level deep:

| Files                               | URLs                   |
| ----------------------------------- | ---------------------- |
| `web/content/field-notes/<slug>.md` | `/field-notes/<slug>/` |

The silo directory **is** the category. There are no dates in URLs, no `/blog/`
wrapper and no `/category/` routes. The silo has an index at `/field-notes/`
listing its posts newest first, with no pagination.

The slug comes from the **filename**, never from the title — so it is stable and
hand-controlled, and retitling a post never moves its URL. A filename must be
lowercase letters, digits and single hyphens or the build stops.

Reading, parsing and validation all live in `web/lib/posts.js`; the route files
under `web/app/field-notes/` are thin wrappers over `web/components/editorial.js`.

### Frontmatter contract

```yaml
---
title: Shooting Gold 200 in flat winter light   # required
description: One sentence, used as the meta description and the index blurb.  # required
date: 2026-01          # required, the SHOOT date: YYYY-MM, or YYYY-MM-DD if the day is known
updated: 2026-02-02     # optional
draft: false            # optional, default false
image: /images/field-notes/<slug>/01-thing.jpg   # optional, overrides the index thumbnail
location: [northumberland, tynemouth]
camera:   [pentax-me-super]
film:     [kodak-gold-200-35mm-film]
brand:    [kodak]
format:   [35mm]
---
```

Rules:

- **`date` is when the roll was shot**, not when the post went up, and the page
  labels it "Shoot date" so a bare date is not read as a publish date. A roll is
  often only remembered to the month, so `YYYY-MM` is as valid as `YYYY-MM-DD`
  and is **not** promoted to a day: the precision carries through to what the
  page prints and to the `<time dateTime>` attribute, rather than inventing a
  1st of the month and asserting it. Posts still sort against each other, a
  month-only date sorting as its first day.
- **`description` is the standfirst.** It is the meta description, the index
  blurb, and the italic summary line under the post's dateline — so write it as
  a sentence that stands alone, not as an opening paragraph. It is styled
  (`.post-standfirst`) to read as a summary rather than as body copy, which is
  why it does not use the shared `.lead` class the static pages use.
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

### Images and carousels

Post images live in `web/public/images/field-notes/<slug>/` and are referenced
from the markdown by absolute path — `/images/field-notes/<slug>/01-thing.jpg`.
They are deliberately **not** under `web/public/field-notes/`, which would write
into the same exported directory as the `/field-notes/<slug>/` route itself.

**A run of two or more image-only paragraphs becomes a carousel.** A lone image
stays a lone image. The convention is the markdown itself — put the frames one
after another and they gallery up — so there is no shortcode to learn and the
file still reads as a normal post anywhere else. The splitting happens in
`renderBody()` in `web/lib/posts.js`, which hands `PostArticle` a list of blocks
rather than one HTML string; `web/components/carousel.js` renders the runs.

The carousel track is a scroll-snapping row, so swipe, trackpad and shift-scroll
work before the component hydrates and if its JS never arrives. The buttons,
dots, counter and arrow keys are the enhancement on top. Frames letterbox rather
than crop, because a roll mixes portrait and landscape.

**The silo index shows a thumbnail** for each post. It is the post's first body
image, so a post that opens with a lead frame gets a preview for free and there
is no required field. An optional `image:` in frontmatter overrides it — set it
when the first frame is not the one that should represent the post. A post with
no images simply has no thumbnail. Index thumbnails crop to a common 4:3 box so
the rows line up; the post itself still letterboxes.

The thumbnail loads the full-size file, since there is no resized variant. That
is fine at single-digit post counts and worth revisiting when the index is long.

Resize before committing — these are served straight off Pages, and the
originals off a scanner run 5–11 MB each. 1600px on the long edge at quality 82
is the sizing used so far.

### Deliberately not built yet

Tag archive routes (`/location/<x>/` and friends), post-count thresholds for
promoting a tag to a hub, RSS, related posts, author pages, pagination and
comments. Tag pages below a meaningful post count are thin pages — wait until
the clusters are real. `location` and `camera` are the likely candidates;
`brand` and `film` almost certainly never, since the catalogue already has
canonical pages for both.

### Adding another silo

`/field-notes/` is the pattern. A second silo (`/guides/`, `/opinion/`, whatever
earns one) is an entry in `SILOS` in `web/lib/posts.js` plus a copy of the two
route files in `web/app/field-notes/` with the slug swapped — the index page and
the `[slug]` page, both thin wrappers over `web/components/editorial.js`. Nothing
else changes: the frontmatter contract, the catalogue resolution,
`web/app/sitemap.js` and the footer nav in `web/components/site-footer.js` all
iterate `SILOS`, so a new silo is linked and indexed without touching them.

**Add a silo only alongside the posts that fill it.** `output: 'export'` refuses
to build a dynamic route that produces no paths, so an empty silo does not render
a bare index — it fails the whole build. That is also why there is exactly one
silo here: the others were removed rather than shipped empty. An empty silo is a
thin page anyway, the same reason the tag archives above are still on the shelf.
