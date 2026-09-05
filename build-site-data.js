// build-site-data.js
// Resolve every source in sources.config.js (live fetch where possible, sample
// otherwise), run the matcher, and write web/data/site.json — the single file
// the front end reads. This is the one command the scheduled GitHub Action runs.
//
//   node build-site-data.js               # live where configured, sample fallback
//   FILMPROOF_OFFLINE=1 node build-site-data.js   # force samples (reproducible)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { SOURCES } from './sources.config.js';
import { FILMS, FILM_BY_KEY } from './src/seed-films.js';
import { matchOffer } from './src/match.js';
import { loadWex } from './src/adapters/wex.js';
import { loadNikTrick } from './src/adapters/niktrick.js';
import { fetchAllProducts, productsToOffers } from './src/adapters/shopify.js';

const OFFLINE = process.env.FILMPROOF_OFFLINE === '1';

// What a healthy live build looks like. A run that comes in under either of
// these is treated as a fetch failure, not as the shops having sold out.
const MIN_FILMS = Number(process.env.FILMPROOF_MIN_FILMS || 300);
const MIN_LIVE_SOURCES = Number(process.env.FILMPROOF_MIN_LIVE_SOURCES || 4);

// Shops allowed to contribute nothing, by retailer name, comma-separated. The
// per-shop guard below is otherwise absolute, so this is the escape hatch for
// the one legitimate case: a shop that has genuinely stopped selling film and
// is on its way out of SOURCES.
const MAY_BE_EMPTY = new Set(
  (process.env.FILMPROOF_ALLOW_EMPTY_SHOPS || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
);

// A film shop's catalogue is mostly not film — narrow Shopify pulls by type/tag,
// or by a format signal in the title (shops label categories differently).
const filmish = (o) =>
  /film/i.test(o.productType || '') ||
  (o.tags || []).some((t) => /film|35mm|120/i.test(t)) ||
  /\b(35\s?mm|135|120|110|127|instant)\b/i.test(o.title || '');

// Returns { offers, live }. `live` is true only when the offers actually came
// from a live network fetch just now — the plausibility guard in run() needs
// this to tell "shops are really down" apart from "sample fallback".
async function resolveOffers(src) {
  try {
    if (src.kind === 'shopify') {
      if (!OFFLINE && src.baseUrl) {
        try {
          const products = await fetchAllProducts(src.baseUrl);
          const offers = productsToOffers(products, { retailer: src.retailer, baseUrl: src.baseUrl }).filter(filmish);
          console.log(`  ${src.retailer}: live — ${offers.length} film offers`);
          return { offers, live: true };
        } catch (e) {
          console.warn(`  ${src.retailer}: live fetch failed (${e.message}); using sample`);
        }
      }
      if (src.sample) {
        const products = JSON.parse(readFileSync(src.sample, 'utf8')).products;
        const offers = productsToOffers(products, { retailer: src.retailer, baseUrl: src.baseUrl || 'https://example.com' }).filter(filmish);
        return { offers, live: false };
      }
      return { offers: [], live: false };
    }
    // Feed-based shops each get their own adapter; sample-backed for now.
    if (src.kind === 'xml') return { offers: loadWex(src.sample), live: false };
    if (src.kind === 'csv') return { offers: loadNikTrick(src.sample), live: false };
    return { offers: [], live: false };
  } catch (e) {
    console.warn(`  ${src.retailer}: source error (${e.message}); skipping`);
    return { offers: [], live: false };
  }
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function run() {
  console.log(`Resolving ${SOURCES.length} sources${OFFLINE ? ' (offline mode)' : ''}...`);
  const offers = [];
  let liveSourceCount = 0;
  const empty = [];
  for (const src of SOURCES) {
    const { offers: srcOffers, live } = await resolveOffers(src);
    offers.push(...srcOffers);
    if (live && srcOffers.length > 0) liveSourceCount++;
    if (srcOffers.length === 0 && !MAY_BE_EMPTY.has(src.retailer)) empty.push(src.retailer);
  }

  const byFilm = new Map(FILMS.map((f) => [f.id, []]));
  for (const raw of offers) {
    const r = matchOffer(raw, FILM_BY_KEY);
    if (r.status === 'matched') {
      byFilm.get(r.filmId).push({
        retailer: r.offer.retailer,
        price: r.offer.price,
        packSize: r.offer.packSize,
        pricePerRoll: r.offer.pricePerRoll,
        exp: r.offer.exp ?? null,
        inStock: r.offer.inStock,
        url: r.offer.url,
      });
    }
  }

  const site = FILMS.map((f) => {
    const list = byFilm.get(f.id).sort((a, b) => a.pricePerRoll - b.pricePerRoll);
    const best = list.find((o) => o.inStock) || null;
    return {
      slug: f.slug || slugify(f.display),
      display: f.display,
      brand: f.brand ?? f.display.split(' ')[0],
      iso: f.iso ?? null,
      format: f.format ?? null,
      process: f.process ?? null,
      exp: f.exp ?? null,
      expired: f.expired === true,
      image: f.image ?? null,
      description: f.description ?? null,
      offers: list,
      best: best ? best.pricePerRoll : null,
      bestRetailer: best ? best.retailer : null,
    };
  }).filter((f) => f.offers.length > 0);

  // Safety: never publish an empty catalogue (e.g. if every source failed).
  if (site.length === 0) {
    throw new Error('No films matched from any source — refusing to write an empty site.');
  }

  // Safety: a real build has hundreds of films with offers from several live
  // shops. If live fetches are blocked (network policy, shop downtime, etc.)
  // every source silently falls back to its tiny sample fixture, matching
  // still "succeeds", and this would otherwise exit 0 — deploying a near-empty
  // site as if it were a real build. Refuse to publish that.
  //
  // The floor is not just about total failure. A PARTIAL outage is the more
  // dangerous case, because it looks entirely normal: on 2026-08-30 Analogue
  // Wonderland (the largest source) returned 503 partway through its pages and
  // the build produced 111 films instead of the usual ~440 — three quarters of
  // the catalogue missing, every remaining page rendering happily. It cleared
  // the old floor of 100 with room to spare and would have deployed had an
  // editorial cross-link not happened to point at one of the missing films.
  //
  // So the floor tracks what a healthy build actually looks like rather than
  // sitting just above zero. Raise it as the catalogue grows; a real build
  // being refused is a cheap failure, a gutted one going live is not.
  // Per-shop floor. The aggregate floor below asks whether the catalogue as a
  // whole is plausible, which is a question one shop can fail without moving:
  // eight shops in, losing any single one leaves MIN_FILMS and MIN_LIVE_SOURCES
  // comfortably met, so the build goes green and that shop simply vanishes from
  // the site — its store page renders the empty state, its offers stop
  // undercutting anyone, and nothing says why. That is the failure this exists
  // to catch, and it gets louder rather than quieter as SOURCES grows.
  //
  // Zero is the test, not a percentage. Every shop here fetches film in the
  // dozens at least, so a live pull that yields nothing means the fetch failed
  // or the shop restructured its catalogue — never an ordinary quiet day. A
  // shop that has genuinely stopped stocking film belongs in
  // FILMPROOF_ALLOW_EMPTY_SHOPS on its way out of SOURCES, not silently
  // publishing as empty.
  if (!OFFLINE && empty.length > 0) {
    console.error(
      `ERROR: ${empty.length} shop(s) contributed no film offers: ${empty.join(', ')}. ` +
      `Check the per-source lines above for "live fetch failed" or "source error". ` +
      `Refusing to publish a site that quietly drops a shop. ` +
      `Set FILMPROOF_ALLOW_EMPTY_SHOPS="${empty.join(',')}" if a shop really has ` +
      `stopped selling film, or FILMPROOF_OFFLINE=1 for a sample-only build.`
    );
    process.exit(1);
  }

  if (!OFFLINE && (site.length < MIN_FILMS || liveSourceCount < MIN_LIVE_SOURCES)) {
    console.error(
      `ERROR: build looks like a live-fetch failure, not a real catalogue ` +
      `(${site.length} films, ${liveSourceCount} sources with live offers; ` +
      `expected ${MIN_FILMS}+ films from ${MIN_LIVE_SOURCES}+ live sources). ` +
      `A partial outage at one large shop is enough to do this — check the ` +
      `per-source lines above for "live fetch failed". ` +
      `Refusing to publish a degraded catalogue as if it were real. ` +
      `Set FILMPROOF_OFFLINE=1 if a sample-only build is intentional, or ` +
      `FILMPROOF_MIN_FILMS to lower the floor for a one-off.`
    );
    process.exit(1);
  }

  mkdirSync('./web/data', { recursive: true });
  writeFileSync('./web/data/site.json', JSON.stringify(site, null, 2));

  // Lean index for client-side search (no offers/descriptions — keeps it tiny).
  const searchIndex = site.map((f) => ({
    slug: f.slug, display: f.display, brand: f.brand,
    format: f.format, iso: f.iso, best: f.best, expired: f.expired,
  }));
  writeFileSync('./web/data/search-index.json', JSON.stringify(searchIndex));

  console.log(`Wrote web/data/site.json — ${site.length} films, ${site.reduce((n, f) => n + f.offers.length, 0)} offers.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
