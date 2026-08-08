// list-films.js
// Fetch a Shopify film shop and print EVERY film it sells, cheapest per-roll
// first — so you can actually see what the live pull returns.
//
//   node list-films.js https://analoguewonderland.co.uk        (live)
//   node list-films.js                                         (offline sample)
//
// Tip: send it to a file you can scroll/search:
//   node list-films.js https://analoguewonderland.co.uk > films.txt
//   notepad films.txt

import { readFileSync } from 'node:fs';
import { fetchAllProducts, productsToOffers } from './src/adapters/shopify.js';
import { parseFilmTitle } from './src/normalise.js';

const baseUrl = process.argv[2];

const filmish = (o) =>
  /film/i.test(o.productType || '') ||
  (o.tags || []).some((t) => /film|35mm|120/i.test(t));

async function getProducts() {
  if (baseUrl) {
    console.log(`Fetching live from ${baseUrl}/products.json ...\n`);
    return fetchAllProducts(baseUrl);
  }
  console.log('No URL given — using offline sample.\n');
  return JSON.parse(readFileSync('./data/shopify-sample.json', 'utf8')).products;
}

const money = (n) => '£' + n.toFixed(2);
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

async function run() {
  const products = await getProducts();
  const retailer = baseUrl ? new URL(baseUrl).hostname : 'sample shop';
  const offers = productsToOffers(products, { retailer, baseUrl: baseUrl || 'https://sample.shop' })
    .filter(filmish);

  // Work out a per-roll price for each (so multipacks compare fairly).
  const rows = offers.map((o) => {
    const parsed = parseFilmTitle(o.title);
    const pack = parsed.packSize || 1;
    return {
      perRoll: o.price / pack,
      price: o.price,
      pack,
      title: o.title,
      inStock: o.inStock,
    };
  }).filter((r) => !Number.isNaN(r.perRoll) && r.perRoll > 0);

  rows.sort((a, b) => a.perRoll - b.perRoll);

  console.log(`${rows.length} film listings at ${retailer}, cheapest per roll first:\n`);
  for (const r of rows) {
    const perRoll = pad(money(r.perRoll) + '/roll', 13);
    const pack = r.pack > 1 ? `  [${r.pack}-pack ${money(r.price)}]` : '';
    const stock = r.inStock ? '' : '  (out of stock)';
    console.log(`${perRoll} ${r.title}${pack}${stock}`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
