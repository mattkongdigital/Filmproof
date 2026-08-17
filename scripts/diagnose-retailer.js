// scripts/diagnose-retailer.js
// One-off, read-only diagnostic: fetch a single Shopify retailer's live
// products.json, run every film-ish item through the real parser, and print
// why each one does or doesn't identify. No files written, no site data
// touched — safe to run against any retailer while debugging a match gap.
//
//   node scripts/diagnose-retailer.js https://camerasbymax.co.uk

import { fetchAllProducts, productsToOffers } from '../src/adapters/shopify.js';
import { parseFilmTitle } from '../src/normalise.js';
import { extractIso } from '../src/describe.js';

const baseUrl = process.argv[2];
if (!baseUrl) { console.error('usage: node scripts/diagnose-retailer.js <baseUrl>'); process.exit(1); }

const filmish = (o) =>
  /film/i.test(o.productType || '') ||
  (o.tags || []).some((t) => /film|35mm|120/i.test(t)) ||
  /\b(35\s?mm|135|120|110|127|instant)\b/i.test(o.title || '');

const products = await fetchAllProducts(baseUrl);
console.log(`Fetched ${products.length} products from ${baseUrl}`);

const offers = productsToOffers(products, { retailer: 'diagnostic', baseUrl }).filter(filmish);
console.log(`${offers.length} pass the filmish() filter\n`);

let identified = 0;
for (const o of offers) {
  const tagIso = extractIso(Array.isArray(o.tags) ? o.tags.join(', ') : (o.tags || ''), '');
  const p = parseFilmTitle(o.title, o.productType, tagIso);
  if (p.identified) identified++;
  console.log(JSON.stringify({
    title: o.title,
    productType: o.productType,
    tags: o.tags,
    brand: p.brand, format: p.format, line: p.line, iso: p.iso,
    key: p.key, identified: p.identified,
  }));
}

console.log(`\n${identified}/${offers.length} identified.`);
