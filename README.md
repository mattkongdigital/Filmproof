# film-price-compare

An MVP scaffold for a camera-film price comparison site. It demonstrates the
part that actually makes or breaks such a site: **matching the same film across
retailers** when every shop lists it under a slightly different name.

## The model

- **films** — the canonical catalogue. One row per film, whoever sells it.
- **retailers** — the shops, each with a feed and an adapter.
- **offers** — one row per retailer listing, pointing back at a film. Ranked by
  `price_per_roll`, so a 5-pack and a single compare fairly.
- **review_queue** — anything that can't be matched confidently waits here for a
  human. Nothing dubious hits the live page.

The matching trick: canonical films and incoming feed titles are run through the
**same** normaliser (`src/normalise.js`), which reduces both to a key like
`kodak-gold-135-200-36` (brand · line · format · iso · exposures). A match is
then just key equality.

## Run the demo (no database, no dependencies)

```bash
node demo.js
```

It loads the two sample feeds, matches everything, and prints the comparison a
visitor would see plus the review queue. Try editing a title in `data/` to see
how the normaliser copes — e.g. change "35mm" to "135" or add "36 Exposures".

The samples deliberately include: two spellings of the same Gold 200, a
multipack that wins on per-roll price, an out-of-stock item, an expired Portra
400 (which keys separately from the fresh one, so both are listed), and a Kodak
Ektar that isn't in the catalogue (so it lands in review).

## Wire it to Postgres (the real version)

```bash
createdb film
psql film < schema.sql
npm i pg
DATABASE_URL=postgres://localhost:5432/film node ingest.js
```

`ingest.js` is what you'd run on a schedule (cron or a GitHub Action): fetch,
match, upsert offers, queue the rest, mark unseen listings out of stock.

## Where to take it next

1. Seed 3–4 films you actually buy; add more to `src/seed-films.js`.
2. Add real retailers — one adapter per feed. Start with whoever offers an
   affiliate product feed (Wex has one; Clifton and Park Cameras run Awin
   programmes). Put your affiliate tag on `product_url`.
3. Build the front end (Next.js) reading `films` + the `best_offer` view.

## The front end (Next.js)

A static Next.js site lives in `web/`, reading `web/data/site.json`:

```bash
node build-site-data.js     # regenerate site.json from the sources
cd web && npm install && npm run dev
```

The homepage is a contact sheet of every film; each links to a `/film/[slug]`
comparison page. The cheapest in-stock offer gets the chinagraph "keeper" mark.
`preview.html` at the root is the same design as a single self-contained file
you can open with no build step.

### Browse taxonomy

`web/lib/facets.js` defines three orthogonal axes, and every browse page is
derived from them — a page only exists if films actually match it, so there are
no dead links:

| Axis | Values | URLs |
| --- | --- | --- |
| Format | 35mm, 120, 110, 127, large format, instant, cine | `/35mm-film` |
| Type | colour, black & white, slide | `/colour-film` |
| Condition | expired | `/expired-film` |

Any two axes combine into one page, and the URL direction is fixed by rank —
format outranks type, and a condition is never a parent — so each pair has
exactly one URL: `/35mm-film/colour`, `/35mm-film/expired`, `/colour-film/expired`.
Two facets on the *same* axis never combine. Brands cross any axis at
`/brand/kodak/expired-film`. Adding a value to an axis array is enough to create
its pages, its navigation entries and its sitemap URLs; long-form copy for a
page is optional and lives in `web/lib/category-content.js`.

Condition reads the `expired` flag that `src/normalise.js` sets when a listing
title says so — the same signal that keys expired stock separately from fresh in
the catalogue, so the two never merge into one row.

## Building your catalogue

Your canonical film list is generated from a shop, not hand-typed:

```bash
node build-catalogue.js https://analoguewonderland.co.uk
```

This filters to real film (by the shop's clean product Type), derives a
canonical identity per film, de-dupes, and writes `data/catalogue.json`. Films
it can't identify go to `data/catalogue-unidentified.txt` for review. Every
other shop then matches against this catalogue.

## Keeping it current (GitHub Actions)

`.github/workflows/refresh.yml` re-pulls live prices, rebuilds the static site,
and deploys to GitHub Pages — on a daily schedule, on demand, and on push.

Data sources live in `sources.config.js`. A source is *live* if it has a
`baseUrl` (fetched fresh each run) and/or *sample* (a local fallback used
offline or if the live fetch fails). Analogue Wonderland is live via its public
`/products.json`; shops without a feed stay sample-backed until they provide one.

To turn it on: push to GitHub, then Settings → Pages → Source → "GitHub Actions".
Using a custom domain? Set `PAGES_BASE_PATH` to an empty string in the workflow.

## Honest notes

- The XML/CSV parsers here are minimal for a zero-dep demo. In production swap
  in `fast-xml-parser` and `csv-parse`.
- The sample feed data is **fabricated** to exercise the matcher — it is not
  real pricing, and the retailers shown may not all offer public product feeds.
- Start the matcher as a hand-curated `sku -> film` table before trusting the
  parser to propose matches. At ~40 films × 4 shops that's tractable and 100%
  accurate.
