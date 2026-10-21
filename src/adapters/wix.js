// adapters/wix.js
// Wix Stores has no public product feed: no /products.json, no anonymous
// Store API. The only supported way in is the Wix REST API, which needs an API
// key the shop owner creates in their dashboard (Settings > API Keys, with
// read access to Wix Stores) and their site id. Not Quite North is the first
// shop on it.
//
// The key is a secret, so it lives in the environment, never in the config:
// a Wix entry in sources.config.js names the variable that holds it, and the
// entry is left out of SOURCES until that variable is set (see there).
//
// As with ./woocommerce.js, fetchAllProducts() reshapes each product into the
// Shopify shape the rest of the build reads, so build-catalogue's itemsFor(),
// the product cache, and productsToOffers() in ./shopify.js take it unchanged.
// Everything shop-specific about Wix lives here.
//
// This is the Catalog V1 API. Wix moved new stores to Catalog V3 in 2025 and a
// V3 store answers V1 calls with an error; that error is passed through by
// name rather than read as an empty shop.

import { sleep } from './shopify.js';

const API = 'https://www.wixapis.com/stores/v1';
// Wix's built-in collection that every product sits in. It says nothing about
// what a product is, so it is not part of the product type.
const ALL_PRODUCTS = '00000000-000000-000000-000000000001';

// --- 1. fetch -------------------------------------------------------------
// `collection` is the shop's film collection, by name ("Film"). A Wix camera
// shop is mostly cameras, merch and lab services, and Not Quite North sells its
// developing as products ("C41 35mm 27 Exp") that read like film by title, so
// the pull is narrowed to the collection rather than trusting the titles. A
// name that isn't there stops the build and lists the ones that are.
export async function fetchAllProducts(baseUrl, opts = {}) {
  const { apiKey, siteId, collection, fetchImpl = fetch, limit = 100, maxPages = 40, delayMs = 500, retries } = opts;
  if (!apiKey || !siteId) throw new Error('Wix source needs an API key and a site id');
  if (!collection) throw new Error('Wix source needs a film `collection`');
  const call = (path, body) => post(fetchImpl, `${API}${path}`, body, { apiKey, siteId }, retries);

  const { collections = [] } = await call('/collections/query', { query: { paging: { limit: 100 } } });
  const names = new Map(collections.map((c) => [c.id, c.name]));
  const film = collections.find((c) => c.name.trim().toLowerCase() === collection.trim().toLowerCase());
  if (!film) {
    throw new Error(`no collection named "${collection}" (has: ${collections.map((c) => c.name).join(', ') || 'none'})`);
  }

  const raw = [];
  for (let page = 0; page < maxPages; page++) {
    await sleep(delayMs);
    const body = await call('/products/query', {
      includeVariants: true,
      query: {
        // V1 takes the filter as a JSON string, not an object.
        filter: JSON.stringify({ 'collections.id': { $hasSome: [film.id] } }),
        paging: { limit, offset: page * limit },
      },
    });
    const batch = body.products || [];
    raw.push(...batch);
    if (batch.length < limit || raw.length >= (body.totalResults ?? Infinity)) break;
  }

  return toShopifyShape(raw, { baseUrl, collections: names });
}

// One POST, retried on a 5xx, a 429 or a dropped connection, the same rules as
// fetchPage() in ./shopify.js. Any other 4xx is not retried, and Wix's own
// message is kept: "wrong key", "missing permission" and "this is a Catalog V3
// site" all arrive as a 4xx, and each needs a different fix.
async function post(fetchImpl, url, body, { apiKey, siteId }, retries = [2000, 8000, 30000]) {
  for (let attempt = 0; ; attempt++) {
    let res = null, err = null;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'User-Agent': 'FilmPriceCompare/0.1 (contact: you@example.com)',
          'Content-Type': 'application/json',
          Authorization: apiKey,
          'wix-site-id': siteId,
        },
        body: JSON.stringify(body),
      });
    } catch (e) { err = e; }
    if (res && res.ok) return res.json();
    if (res && res.status < 500 && res.status !== 429) {
      const detail = await res.text().catch(() => '');
      throw new Error(`${url} -> HTTP ${res.status}${detail ? ` ${detail.slice(0, 300)}` : ''}`);
    }
    if (attempt >= retries.length) throw err || new Error(`${url} -> HTTP ${res.status}`);
    await sleep(res && res.status === 429 ? Math.max(retries[attempt] * 4, 15000) : retries[attempt]);
  }
}

// --- 2. reshape -----------------------------------------------------------
// Pure, so it can be tested against a saved response with no network.
export function toShopifyShape(products, { baseUrl, collections = new Map() }) {
  const clean = baseUrl.replace(/\/+$/, '');
  return products.filter((p) => p.visible !== false).map((p) => {
    const options = (p.productOptions || []).map((o) => ({ name: o.name }));
    const url = p.productPageUrl
      ? `${p.productPageUrl.base.replace(/\/+$/, '')}${p.productPageUrl.path}`
      : `${clean}/product-page/${p.slug}`;
    // A product with options carries one variant per combination; one
    // without still carries a single default variant, but a response that
    // leaves it out falls back to the product's own price and stock.
    const variants = (p.variants || []).length
      ? p.variants.filter((v) => v.variant?.visible !== false).map((v) => variant(p, v, options, url))
      : [variant(p, null, options, url)];

    return {
      id: p.id,
      title: text(p.name),
      handle: p.slug,
      vendor: text(p.brand || ''),
      // The shop's collections, as its own classification, for the same
      // reason ./woocommerce.js uses categories: "Black and White Film" is what
      // deriveProcess() trusts first, and "Film Cameras" keeps a camera out.
      product_type: (p.collectionIds || [])
        .filter((id) => id !== ALL_PRODUCTS && collections.has(id))
        .map((id) => text(collections.get(id)))
        .join(', '),
      tags: [],
      body_html: p.description || '',
      images: (p.media?.items || [])
        .filter((m) => m.mediaType === 'image' && m.image?.url)
        .map((m) => ({ src: m.image.url, alt: text(m.image.altText || m.title || '') })),
      options,
      // A discontinued listing can stay up at £0.00, as on WooCommerce. No
      // price, no offer.
      variants: variants.filter((v) => Number(v.price) > 0),
    };
  });
}

function variant(p, v, options, url) {
  const values = v ? options.map((o) => v.choices?.[o.name]).filter((x) => x != null).map(text) : [];
  const stock = v ? v.stock : p.stock;
  return {
    id: v ? v.id : p.id,
    title: values.length ? values.join(' / ') : 'Default Title',
    option1: values[0], option2: values[1], option3: values[2],
    price: price(v ? v.variant.priceData : p.priceData),
    // No stock block means we can't say, and an in-stock offer is what wins
    // "best price", so unknown counts as out.
    available: Boolean(stock && (stock.inStock ?? stock.inventoryStatus !== 'OUT_OF_STOCK')),
    sku: (v && v.variant.sku) || p.sku || '',
    // Wix product URLs are /product-page/<slug>, and there is no query that
    // reliably preselects a variant, so every variant links the product.
    url,
  };
}

// Wix prices in major units ("10.45"), with any sale already worked out in
// discountedPrice. Every price on the site is printed as pounds, so a shop
// answering in anything else stops the build rather than mispricing.
function price(data) {
  if (!data) return '0.00';
  if (data.currency !== 'GBP') throw new Error(`priced in ${data.currency}, not GBP`);
  const sale = Number(data.discountedPrice);
  return (sale > 0 ? sale : Number(data.price)).toFixed(2);
}

// Wix returns plain text but keeps the shop's own non-breaking spaces and the
// odd multiplication sign, which the normaliser reads as 4x5 only when it is
// an x.
function text(s) {
  return String(s).replace(/ /g, ' ').replace(/(\d)\s*×\s*(\d)/g, '$1x$2').trim();
}
