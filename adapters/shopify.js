// adapters/shopify.js
// Every Shopify storefront exposes a public, read-only list of its published
// products at  https://the-shop.com/products.json  — no API key, no login.
// It's the same catalogue data the shop's own storefront runs on.
//
// This adapter does two separable jobs:
//   1. fetchAllProducts() — page through that endpoint and collect raw products
//   2. productsToOffers()  — flatten each product's variants into the offer
//                            shape the matcher already understands
// Keeping them separate means the mapping can be unit-tested with a fixture,
// no network required.

// --- 1. fetch -------------------------------------------------------------
// fetchImpl is injectable so tests can pass a fake; in real use it's global
// fetch (Node 18+). limit maxes out at 250 per Shopify's rules.
export async function fetchAllProducts(baseUrl, opts = {}) {
  const { fetchImpl = fetch, limit = 250, maxPages = 40, delayMs = 500 } = opts;
  const clean = baseUrl.replace(/\/+$/, '');
  const all = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${clean}/products.json?limit=${limit}&page=${page}`;
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': 'FilmPriceCompare/0.1 (contact: you@example.com)' },
    });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);

    const body = await res.json();
    const batch = body.products || [];
    if (batch.length === 0) break;      // ran past the last page
    all.push(...batch);
    if (batch.length < limit) break;    // partial page = last page
    await sleep(delayMs);               // be a polite guest
  }
  return all;
}

// --- 2. map ---------------------------------------------------------------
// A Shopify product holds many variants (a "36exp single", a "5 pack", etc.).
// Each sellable variant is one offer. We build a title the normaliser can read
// by combining vendor + product title + variant title.
export function productsToOffers(products, { retailer, baseUrl }) {
  const clean = baseUrl.replace(/\/+$/, '');
  const offers = [];

  for (const p of products) {
    const vendor = p.vendor || '';
    const startsWithVendor =
      vendor && p.title.toLowerCase().startsWith(vendor.toLowerCase());
    const namePrefix = startsWithVendor ? '' : (vendor ? vendor + ' ' : '');

    for (const v of p.variants || []) {
      const vt = v.title && v.title.toLowerCase() !== 'default title'
        ? ' ' + v.title
        : '';
      const title = `${namePrefix}${p.title}${vt}`.trim();

      offers.push({
        retailer,
        retailerSku: v.sku || `${p.id}-${v.id}`,
        title,
        price: parseFloat(v.price),
        inStock: v.available !== false,
        url: `${clean}/products/${p.handle}?variant=${v.id}`,
        productType: p.product_type || '',
        tags: p.tags || [],
      });
    }
  }
  return offers;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
