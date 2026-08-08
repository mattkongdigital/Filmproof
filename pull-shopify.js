// pull-shopify.js
// Pull a Shopify film shop's public catalogue, match it against our canonical
// films, and print what a visitor would see.
//
//   node pull-shopify.js                                  # offline: uses data/shopify-sample.json
//   node pull-shopify.js https://analoguewonderland.co.uk # live: hits the real store
//
// The live mode needs no key — /products.json is public. Please run it kindly:
// it paginates with a delay, and you should honour each shop's terms of service.

import { readFileSync } from 'node:fs';
import { fetchAllProducts, productsToOffers } from './src/adapters/shopify.js';
import { FILMS, FILM_BY_KEY } from './src/seed-films.js';
import { matchOffer } from './src/match.js';

const baseUrl = process.argv[2];

// Optional pre-filter: a film shop's catalogue is mostly NOT film (cameras,
// chemistry, straps...). Narrowing by product_type/tag keeps the review queue
// sane. Comment this out to feed the whole catalogue through instead.
const looksLikeFilm = (o) =>
  /film/i.test(o.productType) || o.tags.some((t) => /film|35mm|120/i.test(t));

async function getProducts() {
  if (baseUrl) {
    console.log(`Fetching live from ${baseUrl}/products.json ...\n`);
    return fetchAllProducts(baseUrl);
  }
  console.log('No URL given — using offline sample (data/shopify-sample.json)\n');
  return JSON.parse(readFileSync('./data/shopify-sample.json', 'utf8')).products;
}

const money = (n) => `£${n.toFixed(2)}`;

async function run() {
  const products = await getProducts();
  const retailer = baseUrl ? new URL(baseUrl).hostname : 'Sample Shop';

  const allOffers = productsToOffers(products, { retailer, baseUrl: baseUrl || 'https://sample.shop' });
  const offers = allOffers.filter(looksLikeFilm);

  const byFilm = new Map(FILMS.map((f) => [f.id, []]));
  let reviewCount = 0;
  for (const o of offers) {
    const r = matchOffer(o, FILM_BY_KEY);
    if (r.status === 'matched') byFilm.get(r.filmId).push(r);
    else reviewCount++;
  }

  console.log(`Pulled ${products.length} products -> ${allOffers.length} variants ` +
              `-> ${offers.length} look like film.\n`);

  console.log('=== MATCHED AGAINST OUR CATALOGUE ===\n');
  for (const film of FILMS) {
    const rows = byFilm.get(film.id).sort((a, b) => a.offer.pricePerRoll - b.offer.pricePerRoll);
    if (!rows.length) continue;
    console.log(`${film.display}`);
    const bestIdx = rows.findIndex((r) => r.offer.inStock);
    rows.forEach((r, i) => {
      const o = r.offer;
      const flag = i === bestIdx ? '\u2605' : ' ';
      const pack = o.packSize > 1 ? `  (${o.packSize}-pack @ ${money(o.price)})` : '';
      const stock = o.inStock ? '' : '  \u2014 out of stock';
      console.log(`   ${flag} ${money(o.pricePerRoll)}/roll  ${o.retailer}${pack}${stock}`);
    });
    console.log('');
  }

  console.log(`(${reviewCount} film-tagged item(s) didn't match a catalogue film -> review queue)`);
}

run().catch((e) => { console.error(e); process.exit(1); });
