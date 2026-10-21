// adapters/woocommerce.js
// WooCommerce shops have no /products.json, but WooCommerce ships a public,
// read-only Store API at  /wp-json/wc/store/v1/products  — the same data the
// shop's own block checkout runs on, no key or login. Parallax Photographic is
// the first shop on it.
//
// Rather than a second pipeline, fetchAllProducts() reshapes each product into
// the Shopify shape the rest of the build already reads: build-catalogue's
// itemsFor(), the product cache, and productsToOffers() in ./shopify.js all
// take it unchanged. Everything shop-specific about WooCommerce lives here.

import { fetchPage, sleep } from './shopify.js';

// --- 1. fetch -------------------------------------------------------------
// `category` narrows the pull to the shop's film category (a slug or id). A
// WooCommerce photo shop is mostly cameras, darkroom kit and paper — Parallax
// lists ~2,200 products and under 400 of them are film — so this is the
// difference between four requests and twenty-two. per_page maxes out at 100.
export async function fetchAllProducts(baseUrl, opts = {}) {
  const { category = null, fetchImpl = fetch, perPage = 100, maxPages = 40, delayMs = 500, retries } = opts;
  const clean = baseUrl.replace(/\/+$/, '');
  const api = `${clean}/wp-json/wc/store/v1/products`;
  const raw = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${api}?per_page=${perPage}&page=${page}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
    const batch = await (await fetchPage(fetchImpl, url, retries)).json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    raw.push(...batch);
    if (batch.length < perPage) break;
    await sleep(delayMs);
  }

  // A variable product's own price is a range and its stock is "any variant in
  // stock", so its variants are fetched for real prices — all of them in one
  // request per hundred, since the Store API takes a list of ids.
  const variationIds = raw.flatMap((p) => (p.type === 'variable' ? (p.variations || []).map((v) => v.id) : []));
  const variations = new Map();
  for (let i = 0; i < variationIds.length; i += perPage) {
    await sleep(delayMs);
    const ids = variationIds.slice(i, i + perPage);
    const url = `${api}?type=variation&per_page=${perPage}&include=${ids.join(',')}`;
    for (const v of await (await fetchPage(fetchImpl, url, retries)).json()) variations.set(v.id, v);
  }

  return toShopifyShape(raw, variations);
}

// --- 2. reshape -----------------------------------------------------------
// Pure, so it can be tested against a saved response with no network.
export function toShopifyShape(products, variations = new Map()) {
  return products.map((p) => {
    const variable = p.type === 'variable';
    const options = variable
      ? (p.attributes || []).filter((a) => a.has_variations).map((a) => ({ name: text(a.name) }))
      : [];
    const variants = variable
      ? (p.variations || []).map((ref) => variations.get(ref.id)).filter(Boolean)
          .map((v) => variant(v, labelValues(v.variation, options)))
      : [variant(p, [])];
    // A discontinued listing stays up with its price cleared to 0, and an
    // offer at £0.00 would print as one. No price, no offer — the product
    // still names its film for the catalogue, which is what Shopify shops'
    // sold-out listings do too.
    const priced = variants.filter((v) => Number(v.price) > 0);

    return {
      id: p.id,
      title: title(p.name),
      handle: p.slug,
      // No vendor field in WooCommerce; Parallax's titles lead with the brand,
      // as most Shopify shops' do, and the normaliser reads it from there.
      vendor: '',
      product_type: productType(p.categories),
      // The shop's own tags only. Its attributes ("Film Sensitivity: 200 ISO")
      // look like better data and aren't: Parallax gives Harman Switch Azure
      // (ISO 125) and Flic Aurora 400 as 200, and an ISO read from tags joins
      // a film's identity key, so a wrong one splits a film across pages.
      tags: (p.tags || []).map((t) => text(t.name)),
      body_html: p.description || p.short_description || '',
      images: (p.images || []).map((im) => ({ src: im.src, alt: text(im.alt || '') })),
      options,
      variants: priced,
    };
  });
}

function variant(item, values) {
  return {
    id: item.id,
    title: values.length ? values.join(' / ') : 'Default Title',
    option1: values[0], option2: values[1], option3: values[2],
    price: price(item.prices),
    // Backorder counts as out of stock. Parallax's backorders are its
    // "Special Order Item" listings, weeks away rather than in the building,
    // and an in-stock offer is what wins "best price" on a film page.
    available: Boolean(item.is_in_stock && !item.is_on_backorder && item.is_purchasable),
    sku: item.sku || '',
    // WooCommerce URLs aren't /products/<handle>; a variation's permalink
    // already carries the attribute query that preselects it.
    url: item.permalink,
  };
}

// The Store API prices in minor units of the shop's currency ("1045" is
// £10.45), VAT included. Every price on the site is printed as pounds, so a
// shop answering in anything else stops the build rather than mispricing.
function price(prices) {
  if (prices.currency_code !== 'GBP') throw new Error(`priced in ${prices.currency_code}, not GBP`);
  return (Number(prices.price) / 10 ** prices.currency_minor_unit).toFixed(2);
}

// A variation names itself "Bulk Roll Size: 30 m" (several attributes are
// joined with ", "). Split it back into one value per option, in option order.
function labelValues(label, options) {
  const parts = {};
  const names = options.map((o) => o.name);
  const re = new RegExp(`(?:^|,\\s*)(${names.map(escape).join('|')}):\\s*`, 'g');
  const marks = [...text(label || '').matchAll(re)];
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : undefined;
    parts[m[1]] = text(label).slice(m.index + m[0].length, end).trim();
  });
  return names.map((n) => parts[n]).filter(Boolean);
}

// The shop's categories, as the shop's own classification: "Colour Film",
// "Black and White Film", "Instant Film" are what deriveProcess() trusts first,
// and "Camera" or "Darkroom" is what keeps a disposable or a tank out. Brand
// categories are left out — the title already leads with the brand.
function productType(categories = []) {
  return categories
    .filter((c) => !/\/brands\//.test(c.link || ''))
    .map((c) => text(c.name))
    .join(', ');
}

// Listing status the shop appends to the name — not part of the film's
// identity, and left in it forks "Fuji 200 – Short Dated" off "Fuji 200".
const STATUS_SUFFIX = /\s+[–—-]\s+(?:discontinued|special order item|short dated)\s*$/i;
function title(name) {
  return text(name).replace(STATUS_SUFFIX, '').trim();
}

// WordPress returns names HTML-encoded ("4&#215;5", "B&amp;W"). The
// multiplication sign becomes an x, because "4×5" is how the shop writes the
// sheet format and the normaliser reads it as 4x5.
const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', times: '×', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘' };
function text(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
    .replace(/(\d)\s*×\s*(\d)/g, '$1x$2');
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
