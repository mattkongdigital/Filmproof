// product-cache.js
// The refresh runs build-catalogue.js and then build-site-data.js, and both
// need every shop's full product list. Fetching it twice doubled the requests
// to each shop inside a few minutes, which is what tips Bass & Bligh (~2,500
// products, ten-plus pages) into rate-limiting us. So the catalogue step saves
// each shop's raw products here and the price step reuses them: one pull per
// shop per refresh, and both steps see exactly the same data.
//
// Only a fresh file counts. A cache left over from an earlier local run is
// stale prices, so anything older than MAX_AGE_MS is ignored and the price
// step fetches live as it always did. In CI the checkout is clean, so the only
// cache there is the one this run just wrote.

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'products');
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

const fileFor = (retailer) =>
  join(DIR, `${retailer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.json`);

export function saveProducts(retailer, products) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(fileFor(retailer), JSON.stringify(products));
}

export function loadProducts(retailer) {
  const file = fileFor(retailer);
  try {
    if (Date.now() - statSync(file).mtimeMs > MAX_AGE_MS) return null;
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}
