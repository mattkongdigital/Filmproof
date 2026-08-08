// export-films.js  (v2)
// Pull a Shopify film shop, keep real FILM (still + movie), drop merch and
// services, work out a sane price-per-roll, and write films.csv for Excel.
//
//   node export-films.js https://analoguewonderland.co.uk   (live -> films.csv)
//   node export-films.js                                    (offline sample)
//
// Then:  start films.csv     (or just double-click films.csv in Explorer)

import { readFileSync, writeFileSync } from 'node:fs';
import { fetchAllProducts, productsToOffers } from './src/adapters/shopify.js';

const baseUrl = process.argv[2];

// Film-themed MERCH we never want.
const MERCH = /sticker|\bpin\b|badge|pencil|\bdice\b|cloth|spool|\bmug\b|tote|patch|poster|\bbook\b|magazine|\bzine\b|keyring|key ring|lanyard|strap|shirt|hoodie|postcard|voucher|gift ?card|gift ?set|\bprint\b|\bframe\b|\bbag\b|pouch|\bcap\b|\bhat\b|enamel|\bsock|calendar|\bguide\b|\bclub\b|member|subscription|\btape\b|notebook|journal|coaster|magnet|greeting|\btin\b|washi/i;

// Services / consumables that aren't a roll of film.
const SERVICE = /develop|processing|\bscan|\blab\b|chemic|chemistry|\breel\b|\btank\b|postage|shipping|changing/i;

// A genuine film format signal — this is what marks a product as actual film.
const FILM_SIGNAL = /\b(35\s?mm|135|120|110|127|220|instant|sheet|large format|4x5|5x4|8x10|10x8|super\s?8|std\s?8|double\s?8|16\s?mm|movie film|cine|micro\s?film|disposable|reload)\b/i;

function isRealFilm(o) {
  const hay = (o.productType || '') + ' ' + (o.title || '');
  if (MERCH.test(hay) || SERVICE.test(hay)) return false;
  return FILM_SIGNAL.test(hay) || /film/i.test(o.productType || '');
}

function packSize(title) {
  const m = title.match(/(\d+)\s*[-x]?\s*pack\b/i) || title.match(/pack of (\d+)/i) || title.match(/\bbundle of (\d+)/i);
  if (m) { const n = parseInt(m[1], 10); if (n >= 2 && n <= 12) return n; }
  return 1;
}

async function getProducts() {
  if (baseUrl) { console.log(`Fetching live from ${baseUrl}/products.json ...`); return fetchAllProducts(baseUrl); }
  console.log('No URL given - using offline sample.');
  return JSON.parse(readFileSync('./data/shopify-sample.json', 'utf8')).products;
}

const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

async function run() {
  const products = await getProducts();
  const retailer = baseUrl ? new URL(baseUrl).hostname : 'sample shop';

  const rows = productsToOffers(products, { retailer, baseUrl: baseUrl || 'https://sample.shop' })
    .filter(isRealFilm)
    .map((o) => ({
      perRoll: +(o.price / packSize(o.title)).toFixed(2),
      price: o.price, pack: packSize(o.title),
      inStock: o.inStock ? 'yes' : 'no',
      type: o.productType, title: o.title, url: o.url,
    }))
    .filter((r) => r.perRoll > 0 && r.perRoll < 300)
    .sort((a, b) => (a.type || '').localeCompare(b.type || '') || a.title.localeCompare(b.title));

  const header = ['Price per roll', 'Price', 'Pack', 'In stock', 'Type', 'Film', 'URL'];
  const lines = [header.join(',')];
  for (const r of rows) lines.push([r.perRoll, r.price, r.pack, r.inStock, r.type, r.title, r.url].map(esc).join(','));
  writeFileSync('films.csv', '\uFEFF' + lines.join('\r\n'), 'utf8');

  // Show the categories that made it in, so you can see the shop's taxonomy.
  const byType = {};
  for (const r of rows) byType[r.type || '(none)'] = (byType[r.type || '(none)'] || 0) + 1;
  console.log(`\nWrote films.csv - ${rows.length} film listings (from ${products.length} products).`);
  console.log('\nCategories kept:');
  for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${t}`);
  }
  console.log('\nOpen it with:  start films.csv');
}

run().catch((e) => { console.error(e); process.exit(1); });
