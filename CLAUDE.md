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

### Ranges

A range is a maker's product line across speeds and formats (Kodak Portra,
Tri-X), listed by hand in `RANGES` in `web/lib/facets.js` and matched on the
film's display title. It gets a page at `/brand/<brand>/<range>/`, sharing the
route with the brand's facet pages, once it has `MIN_COMBO_FILMS` (3) fresh
films; expired stock is listed on the page but never earns one, since it comes
and goes between builds. A range can lower its own bar with `minFresh`, as
Kodak Gold, Ilford SFX, Fujifilm Provia, Superia and Acros, Harman Red and
Switch Azure, Lomography Earl Grey and Lady Grey, CineStill's four films, Rollei
Superpan and Infrared, Foma Ortho 400 and R 100,
Kentmere Pan 200, Ferrania's three films, Adox HR-50, Scala and
CMS 20 II, Polaroid 8x10, and Washi's films do at 2: two films, worth a page for its copy.
Use it only alongside copy. A range slug must not end in `-film` (the build stops), and its copy
goes in `BRAND_SUB_CONTENT` under `<brand>/<range>`. Without copy the page
falls back to a generated lede.

### Adding a shop

A shop is an entry in `SOURCES` in `sources.config.js` and a matching entry in
`STORES` in `web/lib/stores.js` (its page, logo and blurb). If it also develops
film in-house or repairs customers' cameras, list that in its `services`
(`'lab'`, `'repairs'`, from `web/lib/store-services.js`): that is what puts the
badge on its page and the shop under the matching filter on `/stores/`. Two platforms are
wired up, so check which one answers first:

- **Shopify** (`kind: 'shopify'`): a public `/products.json`.
- **WooCommerce** (`kind: 'woocommerce'`): the public Store API at
  `/wp-json/wc/store/v1/products`. Give the entry a `category` (the shop's film
  category slug, from `/wp-json/wc/store/v1/products/categories`) — a WooCommerce
  photo shop is mostly not film. `src/adapters/woocommerce.js` reshapes each
  product into Shopify's shape, so nothing downstream knows the difference. It
  deliberately ignores the shop's product attributes: Parallax's "Film
  Sensitivity" is wrong often enough to split films across pages.

Anything else (BigCommerce, a bespoke site) needs its own adapter; there is no
scraping of shop pages.

Before adding the shop, build once and keep `web/data/site.json`; build again
with it added and diff the slugs. A new shop's spellings are where the
normaliser forks a film in two ("400Dynamic" for CineStill 400D, "Tri-X 320
TXP"), and its titles can make an existing ISO-less stub merge into its entry
and take its slug. Fix the first in `src/normalise.js`; the second is
`LEGACY_FILM_SLUGS` (below). Also check that no existing shop's offer lost its
page.

Once a shop is in `SOURCES`, a live pull that yields no film fails the build —
by name, before anything deploys — rather than letting the shop quietly vanish
from the site. A shop that has really stopped selling film goes in
`FILMPROOF_ALLOW_EMPTY_SHOPS` on its way out of `SOURCES`, never left in as an
empty source. Onboarding a shop can merge or retire film slugs through the
normaliser; check the built catalogue for slugs that disappeared and add any
that were live to `LEGACY_FILM_SLUGS` (above).

## House style: no dashes in copy

Reader-facing text uses commas, not em or en dashes (`—`, `–`) or a spaced
hyphen standing in for one. That covers shop blurbs in `web/lib/stores.js`,
brand and category copy, page ledes, silo descriptions, field notes and
opportunity summaries. Where a dashed aside holds a list, lead it in with a
word so the commas still parse:

- No: `Parallax carries a broad film range — 35mm, 120 and 110 — alongside…`
- Yes: `Parallax carries a broad film range, covering 35mm, 120 and 110, alongside…`

If commas alone make a sentence ambiguous, rewrite it rather than reaching for
a dash. Not affected: code comments, an `A–Z` range, the `—` placeholder in an
empty spec cell, and names quoted as their owner writes them (an opportunity's
title is the organiser's).

## Opportunities board

`/opportunities/` lists competitions, open calls and commissions a film
photographer could enter. It is one evergreen page, filtered by type in the
browser — no per-listing or per-type URLs, so nothing churns as calls open and
close.

### How it is filled

Once a week (Monday 07:52 UK time) a Claude Code scheduled task on the owner's
plan wakes the long-running session that built this pipeline, which follows
`opportunities/RUNBOOK.md`. (Scheduled runs that started a fresh session never
reached GitHub, so the task resumes a session known to have repo push access,
GitHub and the network. If that session is ever archived, the task needs
setting up again from a new one.)

1. `node opportunities/fetch.js` reads every feed in
   `opportunities/sources.config.js`, skips items already in
   `opportunities/seen.json`, and saves each new item's page as text plus its
   links under `opportunities/work/` (gitignored).
2. The session reads each page and writes `work/extractions.json`: a verdict,
   and for a real opportunity the fields, a summary in its own words, and an
   exact quote backing each of deadline, fee and rights.
3. `node opportunities/merge.js` checks every claim against the fetched pages
   (`opportunities/validate.js`), dedupes, and writes
   `web/content/opportunities.json`, `seen.json` and the PR body.
4. The session opens one PR, `Opportunities: weekly review <date>`. **Nothing is
   live until it is merged.** If last week's review is still open, the run
   stops rather than stacking a second one.

The extraction is done by a session rather than the Claude API from a GitHub
Action so that it runs on the plan rather than on metered API credit. That
means it runs in the cloud environment, whose network policy must allow the
source sites and the organisers' own pages. Traffic there leaves through
`HTTPS_PROXY`, which Node's built-in fetch ignores unless
`NODE_USE_ENV_PROXY=1` is set; `opportunities/proxy.js` re-runs the fetch
scripts with it, so they just work there and do nothing different elsewhere.

### The rules that make it safe to merge

- **Uncertain fields stay empty.** `validate.js` keeps a deadline, fee or
  rights summary only when its quote is actually on a fetched page; otherwise
  the field is `null` and the entry carries `needs-review:<field>`. A fee that
  isn't stated is `free: null` — unknown — never free.
- **The official URL can't be invented.** It must be a fetched page or a link
  on one, or the entry is dropped (and listed in the PR as dropped).
- **Summaries are our own words.** A summary sharing a run of eight words with
  the source is flagged `needs-review:summary`.
- **Fee and rights are flagged, not judged.** `fee`, `rights:<flag>` (perpetual,
  exclusive, commercial-unpaid, all-entrants, copyright-transfer) and any
  `needs-review:*` set `publish: false`. The board never shows a held entry; to
  publish one, set `publish: true` in the review PR. Fee and rights flags still
  show on the card once published.
- **Never delete an entry.** Rejecting one means leaving it `publish: false`: a
  deleted entry is found again the next week. Closed calls stay in the file as
  history.
- **Dedupe is by normalised official URL** (`normaliseUrl()` in
  `opportunities/lib.js`: no scheme, no `www.`, no trailing slash, no tracking
  params). A second source for a known call only adds to its `sources`; fields
  already reviewed are never overwritten.
- **Fetching is polite.** Every request sends `FilmproofBot` as its user agent,
  honours robots.txt, and waits between hits to one host.

### Expiry

Decided at build time by `liveOpportunities()` in `web/lib/opportunities.js` (the rules are in `web/lib/opportunity-format.js`), so the daily rebuild
handles it: an entry is live through its deadline day (UK time), and an entry
with no confirmed deadline drops off `UNDATED_LIFETIME_DAYS` (60) after it was
first found. The board also re-checks in the browser, for a page that sits in a
tab past midnight. Nothing is removed from the data file.

An empty board still builds — it is a static page, not a dynamic route — but it
is `noindex` and left out of the sitemap and the footer until something is live.
Same thin-page reasoning as the editorial silos.

### Adding an opportunity source

1. **Check it is allowed.** Read the site's robots.txt and terms of use. Skip
   anything that forbids automated access, anything paywalled, and any
   newsletter or directory whose value is its own curation (The Open Call List,
   ForPhotographersOnly): pulling from those republishes someone else's paid
   work, whatever we link to.
2. **Find its feed.** WordPress sites have `/feed/`, an archive feed at
   `/<archive>/feed/` and category feeds at `/<category-base>/<slug>/feed/`;
   Squarespace collections answer `?format=rss`. Prefer a feed scoped to
   opportunities over the site-wide one, and open it to check the items really
   are opportunities: WordPress answers `/feed/?post_type=<type>` for a type
   that doesn't exist with the site's main feed rather than an error, so a
   wrong guess looks like it works. Set `itemPath` when the real items share a
   path (`/opportunities/`) — a feed with nothing under it then fails loudly
   instead. A source with no feed is not onboarded — this pipeline does not
   scrape listing pages.
3. **Add it to `OPPORTUNITY_SOURCES`** with a new, permanent `id`. Set
   `prefilter: true` for a general news feed where calls are a small share, so
   only items mentioning `PREFILTER_WORDS` are read. List alternative feed URLs
   in `feeds` if the site has more than one plausible address. When a site
   files its opportunities under categories and only some are in scope (Fast
   Forward mixes jobs and conference calls in with real calls), list the
   in-scope category feeds and set `union: true` so all of them are read and
   merged, rather than the whole archive.
4. **Allow its domain** in the cloud environment's network settings, or the
   weekly session can't reach it.
5. **Dry-run it:** `node opportunities/fetch.js` and look at the source's line
   and a few `work/pages/*.json` — the text should be the post, not navigation.
   Its back catalogue arrives in the next review PR (items older than
   `MAX_AGE_DAYS` in `fetch.js` are marked seen unread).
6. `node opportunities/test.js` covers the parsing and validation rules; add a
   case there if the new source's feed has a shape the existing ones don't.

A source that fails is logged and skipped, and the PR body says so; it never
stops the run. Remove a source that has stopped working rather than leaving it
failing every week — its `seen.json` keys can stay.

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
shot: 2026-01          # required, when the ROLL was shot: YYYY-MM, or YYYY-MM-DD
published: 2026-02-14   # required, when the write-up went up. The index sorts on this
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

- **Two dates, because they answer different questions.** `shot` is when the
  roll went through the camera; `published` is when the write-up went up. Both
  are required, both are labelled on the page, and the silo index **sorts on
  `published`** — a roll from 2019 written up today belongs at the top of the
  index where a reader will see it, not buried in 2019. The index leads with the
  publish date for that reason (a list ordered by one date and labelled with
  another reads as broken) and carries the shoot date after it.
- **Either date may stop at the month.** A roll is often only remembered to
  `YYYY-MM`, which is as valid as `YYYY-MM-DD` and is **not** promoted to a day:
  the precision carries through to what the page prints and to the
  `<time dateTime>` attribute, rather than inventing a 1st of the month and
  asserting it. A month-only date sorts as its first day. Posts sharing a
  publish date — a batch written up from the archive together — fall back to the
  shoot date, then the slug, so the order is total and stable.
- **The old single `date` field is gone.** A post still using it fails the build
  with a message naming both replacements, rather than being quietly read as one
  or the other.
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
