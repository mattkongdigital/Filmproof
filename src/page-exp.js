// page-exp.js
// A roll's exposure count read from the shop's product page, for a shop whose
// feed never states it. Take It Easy Lab keeps the count in a product
// metafield that its theme prints as a pill ("36 Exposure") on the product
// page, and /products.json carries no metafields, so its title, tags and
// description say nothing and every one of its offers showed "Exposures not
// stated".
//
// This is the one place the pipeline reads a shop's HTML, and it is opt-in per
// source: `pageExp` in sources.config.js, a regex whose first group is the
// count. It reads one number and nothing else. Prices, stock and names still
// come only from the feed. It is limited to products that need it (the
// source's film products with no count anywhere in the feed), it waits between
// requests, and a page that fails, or a theme change that moves the pill,
// leaves the offer as "Exposures not stated" rather than failing the build.
//
// The count is stored on the product as `page_exp`, before the product cache
// is written, so build-catalogue and build-site-data both see it from one pull.

import { sleep } from './adapters/shopify.js';

const UA = 'FilmproofBot (+https://filmproof.co.uk)';
const HAS_EXP = /\b\d{1,2}\s*(?:exposures?|exp)\b|\bexposures?\s*:\s*\d/i;
const text = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

// A film product the feed gave no count for. Instant and sheet film count
// shots and sheets, which the feed reads in its own way (adapters/shopify.js).
function needsPage(p) {
  if (!/\bfilm\b/i.test(p.product_type || '')) return false;
  if (/\b(?:instax|polaroid|instant|sheet|large format)\b/i.test(p.title || '')) return false;
  const tags = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
  const variants = (p.variants || []).map((v) => v.title || '').join(' ');
  return !HAS_EXP.test(`${p.title} ${variants} ${tags} ${text(p.body_html)}`);
}

export async function addPageExp(products, src, { fetchImpl = fetch, delayMs = 750 } = {}) {
  if (!src.pageExp || !products) return products;
  const base = src.baseUrl.replace(/\/+$/, '');
  let read = 0, missing = 0, failed = 0;
  const out = [];
  for (const p of products) {
    if (!needsPage(p) || !p.handle) { out.push(p); continue; }
    let n = null;
    try {
      const res = await fetchImpl(`${base}/products/${p.handle}`, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const m = (await res.text()).match(src.pageExp);
      const v = m ? Number(m[1]) : NaN;
      if (v >= 8 && v <= 72) n = v;
    } catch {
      failed++;
    }
    if (n != null) read++; else missing++;
    out.push(n != null ? { ...p, page_exp: n } : p);
    await sleep(delayMs);
  }
  console.log(`  ${src.retailer}: exposure count read from ${read} product page(s)${missing ? `, ${missing} without one` : ''}${failed ? ` (${failed} failed to load)` : ''}`);
  return out;
}
