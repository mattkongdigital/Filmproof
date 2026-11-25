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

  It is the one exception to "nothing survives a build": `build-news.js`
  compares each build with a snapshot of the last deployed one, kept on the
  `catalogue-state` branch. See "News" below.
- **The site.** `web/` is a Next.js app built with `output: 'export'` and
  `trailingSlash: true`, deployed to GitHub Pages by `.github/workflows/refresh.yml`.

  The workflow has no `schedule:`. GitHub ran its daily cron 6 to 10 hours late
  and sometimes skipped it, so the daily refresh is a Claude Code scheduled
  task on the owner's plan ("Filmproof daily refresh", 05:38 UK time) that
  starts the workflow through `workflow_dispatch` and reports the result. Like
  the opportunities task below, it wakes the session that set it up; if that
  session is ever archived, the task needs setting up again from a new one,
  or the site stops refreshing.

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
`web/lib/legacy-slugs.mjs` (re-exported from `web/lib/data.js`; it is its own
module so `build-news.js` can read it in plain Node). `output: 'export'` has no server to issue a 301, so
`/film/[slug]/` builds a page for it: canonical at the survivor, `noindex`, a
script that replaces the history entry, and readable copy for anyone with JS
off. A legacy slug whose target has itself left the catalogue is skipped — a
redirect to a 404 is worse than a 404. Ordinary churn (a film going out of
stock and its page vanishing for a build) is NOT for this map; it is the normal
behaviour of a catalogue rebuilt from live data.

### Kodak and Eastman Kodak

Since late 2025 Eastman Kodak distributes the still films Kodak Alaris used
to, and shops sell both boxes: "Kodak Gold 200" beside "Kodak Eastman Gold
200" or "Eastman Kodak (EKC) Kodak Eastman GOLD 200". A film that kept its
name (Gold, UltraMax, Tri-X, Ektar, Ektachrome, Kodacolor) is one product
either way. The brand is always `kodak`: `eastman`, `ekc` and `alaris` are
`BRAND_WORDS` in `src/normalise.js`, so they never reach the matching key,
and `pageName()` in `build-catalogue.js` leaves "Eastman" and "EKC" out of
the name a Kodak page shows. A new shop's spelling of the Eastman box should
land on the existing page; if it forks one, fix the normaliser, never add a
second page.

The slugs are a different matter. Many Kodak pages were first named from
Analogue Wonderland's Eastman listing, so their slugs are `kodak-eastman-*`
(`kodak-eastman-gold-200-35mm-film`), with the plain `kodak-gold-200-35mm-film`
in `LEGACY_FILM_SLUGS` pointing at them. Those are the published URLs: the
slug is read from the shop's title, not from `pageName()`, precisely so that
dropping "Eastman" from the shown name moved no URL. Don't "tidy" them.

Each offer carries an optional `box` (`build-site-data.js`): `eastman` when
its title says Eastman or EKC, `alaris` when it says Kodak Alaris or Kodak
Professional, and unset when it says neither. Unset means unknown, not
either box, so never fill it in by guessing.

Renamed films stay separate products, because they are sold as separate
products: Portra 160/400/800 and Ektacolor Pro 160/400/800, T-Max
100/400/P3200 and Ektapan 100/400/P3200, and Pro Image 100 / ColorPlus 200
and Kodacolor 100/200. The first two pairs are listed in `EQUIVALENT_RANGES`
in `web/lib/equivalents.js`, which puts an "Equivalent" link on both pages
when exactly one film in the other range has the same format, speed, sheet
size and bulk-or-not. Kodacolor has no entry until its equivalence is
confirmed.

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

A brand × facet page (`/brand/adox/120-film/`) follows the same 3-film bar. A
pair can lower it in `BRAND_FACET_MIN` in `web/lib/facets.js`, keyed
`<brand>/<facet>`, as Adox 120 does at 2. Same rule as `minFresh`: only with
copy for it in `BRAND_SUB_CONTENT`.

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
scraping of shop pages, with one narrow exception. A shop that states a roll's
exposure count only on its product page (Take It Easy Lab prints it as a pill
from a metafield that `/products.json` leaves out) can set `pageExp` in
`SOURCES`, a regex whose first group is the count. `src/page-exp.js` then loads
the page of each film product the feed gave no count for, reads that one number
and nothing else, and stores it as `page_exp` before the product cache is
written. A page that fails or no longer matches leaves the offer as "Exposures
not stated"; it never stops the build. The count is read from the title, then
tags, then description, then the page. Prices, stock and names still come only
from the feed, and this is not a pattern for anything beyond the exposure
count.

Before adding the shop, build once and keep `web/data/site.json`; build again
with it added and diff the slugs. A new shop's spellings are where the
normaliser forks a film in two ("400Dynamic" for CineStill 400D, "Tri-X 320
TXP"), and its titles can make an existing ISO-less stub merge into its entry
and take its slug. Fix the first in `src/normalise.js`; the second is
`LEGACY_FILM_SLUGS` (below). Also check that no existing shop's offer lost its
page.

A new shop's first build seeds its rows in the news snapshot silently, so its
range does not post as "newly listed". From its second build on, its changes
are news like any other shop's (see "News"). If it has a blog, add its feed to
`SHOP_FEEDS` too (see "Shop news").

Once a shop is in `SOURCES`, a live pull that yields no film fails the build —
by name, before anything deploys — rather than letting the shop quietly vanish
from the site. A shop that has really stopped selling film goes in
`FILMPROOF_ALLOW_EMPTY_SHOPS` on its way out of `SOURCES`, never left in as an
empty source. Its news history stays on the state branch; its rows go
unlisted. Onboarding a shop can merge or retire film slugs through the
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

`/opportunities/` lists competitions, open calls, commissions and grants a film
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

## News

`/news/` is one feed of short items about film in the UK. It is built to carry
three types; the first two exist so far:

| Type            | `type`          | Where its items come from                                  |
| --------------- | --------------- | ---------------------------------------------------------- |
| Shop updates    | `shop-update`   | `build-news.js`, diffing each build against the last one   |
| Shop news       | `shop-news`     | `build-news.js`, reading the shops' own blog feeds         |
| Industry news   | `industry-news` | not built: a weekly round-up drafted for review            |

The feed is one evergreen page, newest first, grouped by UK day, filtered by
type in the browser (a chip only appears for a type with items). It shows the
last `NEWS_WINDOW_DAYS` (28) days. Everything also sits on its ISO week's
archive page, `/news/2026-w48/`, for good: the slug is the week, so an item's
archive address is known the day it is posted and never moves. There are no
per-item or per-type URLs. `/news/` with nothing in its window builds as
`noindex` and stays out of the sitemap and footer, like the opportunities
board. The archive route always builds the current week, because
`output: 'export'` fails a dynamic route with no paths and the first build has
no items; an empty week is `noindex` and not in the sitemap.

### The snapshot and the state branch

`catalogue-state.json` is the only catalogue data that survives from one build
to the next. It lives on the orphan `catalogue-state` branch with the news
logs, `news/shop-updates.json` and `news/shop-news.json`. Only the refresh
workflow writes it:

1. The build job extracts the branch into `./state` (gitignored). No branch
   means a first run.
2. `node build-news.js`, after `build-site-data.js`, diffs `web/data/site.json`
   against the snapshot, reads the shop blog feeds, writes the next snapshot
   and both logs into `./state`, and copies the logs to `web/data/news/` for
   the site.
3. `./state` goes up as an artifact. The `save-state` job commits it to the
   branch **only after the deploy succeeds**. If a deploy fails, the next run
   diffs against the last snapshot that actually went live, so nothing is lost
   or posted twice. A `GITHUB_TOKEN` push starts no workflow, so the commit
   cannot loop. The branch's history is a free day-by-day price and stock log.

Why a branch and not the alternatives: `actions/cache` can be evicted, and an
eviction would read as a first run. Artifacts expire after 90 days at most.
Reading the snapshot back off the live site ties it to Pages being up.
Committing to `main` clutters history and collides with PRs.

Locally there is usually no `./state`, so `node build-news.js` seeds one and
posts nothing. `FILMPROOF_STATE_DIR` points it elsewhere. An offline
(`FILMPROOF_OFFLINE=1`) build never touches the snapshot: a sample catalogue
would read as everything selling out.

Its shape (`SNAPSHOT_VERSION` 1, one row per line so a quiet day's commit is
small):

- `builtAt` / `previousBuiltAt`: changes are dated from the stored previous
  build, never a rolling 24 hours.
- `retailers[name]`: `firstSeen`, and `skips` (see the guards).
- `films[key]`: `slug`, `display`, `brand`, `format`, `firstSeen`,
  `lastListed` (null while any shop lists it) and `outEverywhereSince` (null
  while any shop has it in stock).
- `offers["key|retailer"]`: `firstSeen`, `listed`, `inStock`, `stockSince`,
  `price` (cheapest in-stock single item now) and `lastPrice` (the last one
  seen in stock). No retailer URLs: news links use this build's.

Rows are never deleted. A listing gone from a shop's feed stays as
`listed: false`, so it coming back is a restock, not a new listing. A film every
shop has dropped keeps its `films` entry with `lastListed` set. That is the
data a tombstone page for a departed film would read ("last listed 12 March at
3 shops, from £9.50"); nothing renders one yet.

**Changes are keyed on the normaliser's `key` plus the retailer name, never on
the slug.** The slug is read from the first shop's title, so a shop retitling a
listing can move it; the key survives that. `build-site-data.js` writes `key`
into `site.json` for this. When a normaliser merge does change a key, the new
key inherits the old one's history if it took over the old slug, or if
`LEGACY_FILM_SLUGS` points the old slug at it. So add the legacy entry in the
same PR as the merge, or the merged film posts as new at every shop.

A snapshot in an older `version` stops the build rather than being re-seeded,
which would wipe its history. Migrate it.

### What counts as a shop update

`src/news/shop-updates.js` holds the rules, and `node src/news/test.js` checks
them. Per (key, retailer):

- **Newly listed**: a row the snapshot never had, in stock now. One that
  arrives out of stock is recorded silently; its restock is the news.
- **Back in stock**: out of stock (or unlisted) in the snapshot, in stock now.
- **Lower price**: the cheapest in-stock single-item offer (`packSize` 1, the
  same filter as the Product JSON-LD's AggregateOffer) fell by at least 3% and
  £0.25, while in stock in both builds. Rises are ignored. Multipacks never
  count.

Routine changes are rolled up into one item per shop per day ("Analogue
Wonderland: 4 newly listed, 6 back in stock"), expandable to the full list. A
change gets an item of its own when it is notable:

- `new-film`: a key new to the whole catalogue.
- `back-everywhere`: a film out of stock at every shop for at least
  `outEverywhereDays` (3) days, back at one or more. Shorter gaps are mostly
  feed blips.
- `back-at-shop`: a film back at one shop after at least `retailerGapDays`
  (60) days out there.

A notable change is not repeated in its shop's roll-up. All thresholds are in
`THRESHOLDS`. A second build on the same UK day merges into that day's items
by id rather than posting again.

Wording is factual and about availability ("back in stock after 14 days out
of stock", "now £9.00, was £10.00"), never which shop is cheapest. House style
applies: no dashes in reader-facing copy.

### The guards

- **First run** (no snapshot): every shop seeds silently. Nothing fails.
- **A new shop** (a retailer the snapshot has never seen) seeds silently on its
  first build, so onboarding a shop does not post its whole range as new.
- **An implausible diff**: a shop with more than 25 changes that are also more
  than 30% of its listings (sell-outs and delistings count) is taken to be a
  broken or restructured feed. Its changes are skipped for that run with a
  `WARNING` in the log, and its snapshot rows are kept, so the site's film
  pages are unaffected and a real change still posts next time. After 3 skips
  in a row the feed is taken as the shop's new normal and re-seeded silently.
  `FILMPROOF_NEWS_ACCEPT="Shop Name"` takes one shop's large diff silently for
  a single run (a known catalogue restructure, say).
- **A shop leaving `SOURCES`**: its rows go unlisted silently.

### Shop news

Each shop's own blog posts, read by `build-news.js` on every build from the
feeds in `SHOP_FEEDS` (`src/news/shop-news-sources.js`): Shopify blogs at
`/blogs/<handle>.atom`, Parallax's WordPress `/feed/`. The rules are in
`src/news/shop-news.js` and tested in `src/news/test.js`.

- **An item is the post's title, linked to the shop's own page for it.**
  `summary` is null: the post is the shop's writing, and nothing here writes a
  summary in our own words, so none is shown. The post's text is read only to
  apply `filmOnly`. Titles are the shop's, so the no-dashes rule does not
  apply to them.
- **Dated by the day the shop published it** (UK time), not the day we found
  it. A future date is clamped to today, a missing one is the first-seen day.
- **Only posts published within `NEWS_WINDOW_DAYS` (28) are ever posted.**
  That one rule handles a new shop's back catalogue (its last month of posts
  appears, each on its real day, and the rest never does), an old article
  re-dated by the shop, and a post found late. It is why there is no seen
  list: an old post is skipped on every read.
- **The id is `shop-news:<shop>:<normaliseUrl(post url)>`.** A post already on
  file keeps its date and first sighting and takes a changed title. Nothing is
  removed from the log, even if a shop deletes the post.
- **`filmOnly: true`** keeps only posts whose title or text mentions film
  (`FILM_WORDS`). It is for a shop whose blog covers other things too: Bass &
  Bligh's covers binoculars and spotting scopes.
- **A feed that fails is a `WARNING` and is skipped**, never fatal. Its posts
  already on file stay, and any it published meanwhile appear on a later build
  while still inside the window.
- **Fetching uses the opportunities pipeline's `politeFetch`**
  (`opportunities/lib.js`): the `FilmproofBot` user agent, robots.txt
  honoured, 1.5 s between hits to one host. All 19 feeds, from all 11 shops, take about 20
  seconds. `opportunities/proxy.js` is imported first, so it also works in the
  cloud environment.

To add a shop's blog: check its robots.txt allows the feed, open the feed and
check the items are posts (Shopify answers `/blogs/<handle>.atom` for each
blog; a blog is not always linked from the home page, so also try the default
`/blogs/news.atom`), and add it to `SHOP_FEEDS` under the
retailer name used in `SOURCES` and `STORES`. Set `filmOnly` if the blog strays
from film. The next build posts its last 28 days.

### The item model

Every type writes items in one shape, so the page never needs to know which
pipeline made them:

```js
{
  id: 'shop-update:2026-11-25:rollup:analogue-wonderland', // stable, type-prefixed
  type: 'shop-update',          // a NEWS_TYPES id
  kind: 'rollup',               // per type: rollup | new-film | back-everywhere | back-at-shop
  date: '2026-11-25',           // UK day first seen: the day group and the archive week
  firstSeenAt: '2026-11-25T05:41:12.000Z',
  source: { kind: 'retailer', name: 'Analogue Wonderland' }, // or 'catalogue', 'publication'
  title: 'Analogue Wonderland: 4 newly listed, 6 back in stock',
  summary: null,                // our own words, when we have them (industry news)
  url: undefined,               // optional external link for the title (a shop-news post)
  film: { key, slug, display }, // optional: the film a notable item is about
  children: [                   // optional: the expandable list
    { change: 'restock', film: { key, slug, display, format }, retailer, offerUrl, price, outDays },
  ],
  publish: true,                // optional; false holds an item back (industry review)
}
```

`web/lib/news.js` merges the loaders, drops `publish: false`, and resolves
links against the current catalogue: a film whose slug was retired follows
`LEGACY_FILM_SLUGS`, and one that has left the catalogue keeps its name,
unlinked, rather than pointing at a 404. Shop names link to `/store/<slug>/`
through `STORES`. Dates, ISO weeks, wording and `NEWS_TYPES` are in
`web/lib/news-format.mjs`, which is plain ESM so the build script, the server
pages and the client feed share it.

### Adding a news type

1. Write its items in the shape above, to a JSON file of its own. Never write
   to another type's file.
2. Add its loader to `LOADERS` in `web/lib/news.js`. Its `NEWS_TYPES` entry
   already exists; the chip appears once it has items.
3. Pick where the file lives by who writes it:
   - **Generated on each build** (as shop updates and shop news are): a file
     under `news/` on the state branch, written by a `build-news.js` step and
     copied to `web/data/news/`.
   - **Industry news**, drafted and reviewed: `web/content/news/industry-news.json`
     on `main`, landing through a review PR with `publish: false` until
     approved, the opportunities pattern. Never delete an item there; holding
     it back is `publish: false`.
4. Give it a `kind` vocabulary and, if it needs one, an extra tag label in
   `KIND_LABEL` in `web/components/news-feed.js`. Use `summary` and `url` for
   a post. Use `children` only for a genuine list.
5. Keep ids stable and type-prefixed (`shop-news:<retailer>:<post-url-key>`),
   so a re-run merges into an existing item instead of posting it twice.
6. Add its items to the lede on `web/app/news/page.js` if it changes what the
   page covers.

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
