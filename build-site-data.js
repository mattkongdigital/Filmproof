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

// A film shop's catalogue is mostly not film — narrow Shopify pulls by type/tag,
// or by a format signal in the title (shops label categories differently).
const filmish = (o) =>
  /film/i.test(o.productType || '') ||
  (o.tags || []).some((t) => /film|35mm|120/i.test(t)) ||
  /\b(35\s?mm|135|120|110|127|instant)\b/i.test(o.title || '');

async function resolveOffers(src) {
  try {
    if (src.kind === 'shopify') {
      if (!OFFLINE && src.baseUrl) {
        try {
          const products = await fetchAllProducts(src.baseUrl);
          const offers = productsToOffers(products, { retailer: src.retailer, baseUrl: src.baseUrl }).filter(filmish);
          console.log(`  ${src.retailer}: live — ${offers.length} film offers`);
          return offers;
        } catch (e) {
          console.warn(`  ${src.retailer}: live fetch failed (${e.message}); using sample`);
        }
      }
      if (src.sample) {
        const products = JSON.parse(readFileSync(src.sample, 'utf8')).products;
        return productsToOffers(products, { retailer: src.retailer, baseUrl: src.baseUrl || 'https://example.com' }).filter(filmish);
      }
      return [];
    }
    // Feed-based shops each get their own adapter; sample-backed for now.
    if (src.kind === 'xml') return loadWex(src.sample);
    if (src.kind === 'csv') return loadNikTrick(src.sample);
    return [];
  } catch (e) {
    console.warn(`  ${src.retailer}: source error (${e.message}); skipping`);
    return [];
  }
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function run() {
  console.log(`Resolving ${SOURCES.length} sources${OFFLINE ? ' (offline mode)' : ''}...`);
  const offers = [];
  for (const src of SOURCES) offers.push(...(await resolveOffers(src)));

  const byFilm = new Map(FILMS.map((f) => [f.id, []]));
  for (const raw of offers) {
    const r = matchOffer(raw, FILM_BY_KEY);
    if (r.status === 'matched') {
      byFilm.get(r.filmId).push({
        retailer: r.offer.retailer,
        price: r.offer.price,
        packSize: r.offer.packSize,
        pricePerRoll: r.offer.pricePerRoll,
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
      offers: list,
      best: best ? best.pricePerRoll : null,
      bestRetailer: best ? best.retailer : null,
    };
  }).filter((f) => f.offers.length > 0);

  // Safety: never publish an empty catalogue (e.g. if every source failed).
  if (site.length === 0) {
    throw new Error('No films matched from any source — refusing to write an empty site.');
  }

  mkdirSync('./web/data', { recursive: true });
  writeFileSync('./web/data/site.json', JSON.stringify(site, null, 2));
  console.log(`Wrote web/data/site.json — ${site.length} films, ${site.reduce((n, f) => n + f.offers.length, 0)} offers.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
