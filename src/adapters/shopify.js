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
//
// country=GB is not optional. A shop on Shopify Markets prices products.json
// in the visitor's local currency, picked from their IP — and the deploy runs
// on a GitHub runner in the US, so Take It Easy Lab, Film Camera Store,
// Cameras By Max and JFR Film all answered in rounded US dollars that the site
// then printed as pounds (£16 for JFR's £9.99 Gold 200). Shops without
// Markets ignore the parameter. It must be country, not currency=GBP: the
// latter also shifts Analogue Wonderland's prices, which are already sterling.
export async function fetchAllProducts(baseUrl, opts = {}) {
  const { fetchImpl = fetch, limit = 250, maxPages = 40, delayMs = 500, retries = [2000, 8000, 30000] } = opts;
  const clean = baseUrl.replace(/\/+$/, '');
  const all = [];

  for (let page = 1; page <= maxPages; page++) {
    const url = `${clean}/products.json?limit=${limit}&page=${page}&country=GB`;
    const res = await fetchPage(fetchImpl, url, retries);

    const body = await res.json();
    const batch = body.products || [];
    if (batch.length === 0) break;      // ran past the last page
    all.push(...batch);
    if (batch.length < limit) break;    // partial page = last page
    await sleep(delayMs);               // be a polite guest
  }
  return all;
}

// One page, retried on a 5xx, a 429 or a dropped connection. Shopify
// storefronts throw the odd one-off 500 — Classic Photo Supplies did on
// 29 Sep 2026 and answered normally seconds later — and one failed request out
// of the twenty-odd a refresh makes used to cost the whole deploy, because
// build-site-data rightly refuses to publish with a shop missing. Any other
// 4xx is not retried: that is the shop telling us something, not a blip.
// Throws once the retries run out, so a shop that is really down still stops
// the build.
export async function fetchPage(fetchImpl, url, retries = [2000, 8000, 30000]) {
  for (let attempt = 0; ; attempt++) {
    let res = null, err = null;
    try {
      res = await fetchImpl(url, {
        headers: { 'User-Agent': 'FilmPriceCompare/0.1 (contact: you@example.com)' },
      });
    } catch (e) { err = e; }
    if (res && res.ok) return res;
    if (res && res.status < 500 && res.status !== 429) throw new Error(`${url} -> HTTP ${res.status}`);
    if (attempt >= retries.length) throw err || new Error(`${url} -> HTTP ${res.status}`);
    await sleep(backoff(res, retries[attempt]));
  }
}

// A 429 is the shop asking us to slow down, and the default retries are too
// short for it: Bass & Bligh has ~2,500 products and throttles around page 10,
// and the refresh pulls every shop twice back to back (catalogue, then
// prices). The 8s ladder can run out, and build-catalogue then logged a
// warning while the shop's films fell out of the catalogue. Honour Retry-After
// when the shop sends one, and otherwise wait far longer than for a 5xx blip.
function backoff(res, base) {
  if (!res || res.status !== 429) return base;
  const after = Number(res.headers?.get?.('retry-after'));
  if (Number.isFinite(after) && after > 0) return Math.min(after, 120) * 1000;
  return Math.max(base * 4, 15000);
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

    const shots = instantShots(p);
    for (const v of p.variants || []) {
      const { label, packSize } = variantInfo(p, v);
      const vt = label ? ' ' + label : '';
      const title = `${namePrefix}${p.title}${vt}${shots && !label ? ` ${shots} shots` : ''}`.trim();

      offers.push({
        retailer,
        retailerSku: v.sku || `${p.id}-${v.id}`,
        title,
        price: parseFloat(v.price),
        inStock: v.available !== false,
        // A variant reshaped from another platform (./woocommerce.js) brings
        // its own URL, since only Shopify serves /products/<handle>.
        url: v.url || `${clean}/products/${p.handle}?variant=${v.id}`,
        productType: p.product_type || '',
        tags: p.tags || [],
        // Only set when the variant itself states its roll count; matchOffer
        // prefers it to whatever the product title says.
        ...(packSize ? { packSize } : {}),
      });
    }
  }
  return offers;
}

// A variant's title is its option values joined with " / ", and shops often
// make those values bare numbers — "36", "36 / 3", "5" — leaving the meaning in
// the option's NAME (Exposures, Rolls, Sheets). Appended as-is, the numbers
// read as part of the film's name: "Kodak Eastman GOLD 200 - 35mm Film 36 / 3"
// keyed as kodak-336eastmanekcgold-135-200 and never reached its page, which
// silently dropped every multi-variant listing at Analogue Wonderland, PJL and
// Chemical Dependency Lab. So a bare number is spelled out from its option
// name into the words the normaliser already reads ("36 exp", "10 sheets").
//
// A pack-count option (Rolls, Pack Size, Number of rolls) is also returned as
// packSize, because the variant is the authority on how many rolls its price
// buys and the product title is not. Classic Photo Supplies lists "Kodak
// Portra 400 120 Film 5 Pack" with a "1 Roll" variant at £14.95: read from the
// title, that single roll priced at £2.99 a roll. And "Double"/"Triple" carry
// no digit at all, so a £24.95 triple pack printed as a £24.95 single.
const PACK_WORDS = { single: 1, twin: 2, double: 2, triple: 3, quad: 4 };
function variantInfo(p, v) {
  if (!v.title || v.title.toLowerCase() === 'default title') return { label: '', packSize: null };
  const names = (p.options || []).map((o) => (typeof o === 'string' ? o : o.name) || '');
  const values = [v.option1, v.option2, v.option3].filter((x) => x != null);
  if (!names.length || values.length !== Math.min(names.length, 3)) return { label: v.title, packSize: null };
  let packSize = null;
  const label = values.map((val, i) => {
    const s = String(val).trim();
    const name = names[i].toLowerCase();
    if (/roll|pack|quantity|qty/.test(name)) {
      const n = packCount(s);
      if (n) { packSize = n; return n > 1 ? `${n} pack` : 'single'; }
    }
    if (!/^\d+$/.test(s)) return s;
    if (/exposure|\bexp\b/.test(name)) return `${s} exp`;
    if (/sheet/.test(name)) return `${s} sheets`;
    return s;
  }).join(' / ');
  return { label, packSize };
}

// How many shots an instant film listing holds, from its description, when
// the title gives no count at all. Polaroid Go film only comes as a 16-shot
// double pack, and Analogue Wonderland titles it "Polaroid Go Film - Colour"
// with "Exposures: 16" in the spec, so read from the title alone a double pack
// priced as one. Appended to the offer title, where the normaliser turns it
// into packs. null for anything else, or when the title already counts.
function instantShots(p) {
  if (!/\b(?:instax|polaroid|instant)\b/i.test(p.title)) return null;
  if (/\b\d+\s*(?:shots?|sheets?|exposures?|photos?|prints?|pack)\b|\b(?:twin|double|triple|five)\s*pack\b|\btwinpack\b/i.test(p.title)) return null;
  const body = (p.body_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const m = body.match(/\bexposures:\s*(\d{1,2})\b/i) || body.match(/\bpack (?:of|contains) (\d{1,2})\s+(?:instant\s+)?(?:colou?r\s+)?(?:photos|shots|prints)\b/i);
  return m ? Number(m[1]) : null;
}

// "5", "5 Pack", "5 Roll Pack", "1 Pack (5 rolls)", "Single Roll", "Triple".
// The parenthesised roll count wins over the leading number, since "1 Pack"
// there is one box of five. null when the value says no count we trust.
function packCount(s) {
  const t = s.toLowerCase();
  const m = t.match(/\((\d+)\s*rolls?\)/) || t.match(/^(\d+)\b/);
  const n = m ? Number(m[1]) : PACK_WORDS[(t.match(/^(single|twin|double|triple|quad)\b/) || [])[1]];
  return n >= 1 && n <= 20 ? n : null;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
