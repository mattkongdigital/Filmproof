// build-catalogue.js
// Build YOUR canonical film list from ALL live shops in sources.config.js
// (not just one), merged and de-duplicated. This is the backbone every shop's
// offers get matched against. Films it can't identify go to
// data/catalogue-unidentified.txt for review.
//
//   node build-catalogue.js                 (pulls every live shop in the config)
//   FILMPROOF_OFFLINE=1 node build-catalogue.js   (samples only, reproducible)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { SOURCES } from './sources.config.js';
import { fetchAllProducts } from './src/adapters/shopify.js';
import { loadWex } from './src/adapters/wex.js';
import { loadNikTrick } from './src/adapters/niktrick.js';
import { parseFilmTitle } from './src/normalise.js';
import { deriveProcess, describe, extractIso, extractExp } from './src/describe.js';
import { EXCLUDED_IMAGE_URLS } from './src/image-exclusions.js';

const OFFLINE = process.env.FILMPROOF_OFFLINE === '1';

// Shop photography sometimes carries the shop's own promotional banner baked
// right into the image — "2 FOR £55 save £13", "was £38" — which reads as
// misleading (that deal may not be live) and out of place on a page comparing
// many shops at once. This can only catch images a shop has labelled clearly
// in the filename or alt text; a banner with no distinguishing text will slip
// through — treat it as a first pass, not a guarantee. Anything spotted later
// can be added to EXCLUDED_IMAGE_URLS by URL as a manual backstop.
const PROMO_IMAGE = /(\d+\s*for\s*£\s*\d+|\bwas\s*£\s*\d+|\bsave\s*£\s*\d+|\d+\s*%\s*off|\bclearance\b|\bmulti-?buy\b|\bwas\b.{0,8}\bnow\b)/i;

function looksPromotional(url, alt) {
  if (url && EXCLUDED_IMAGE_URLS.has(url)) return true;
  return PROMO_IMAGE.test(`${url || ''} ${alt || ''}`);
}

function pickCleanImage(images) {
  for (const img of images || []) {
    const src = img && img.src;
    if (src && !looksPromotional(src, img && img.alt)) return src;
  }
  return null;
}

// Decide whether a product is an actual roll/sheet of film (not accessories,
// paper, chemicals, cameras...). Handles both Analogue Wonderland's short types
// ("35mm", "Camera") and Firstcall's "Department : Category" paths.
const NOT_FILM = /camera|merch|adapter|empties|accessor|gift|\bbook\b|strap|\bbag\b|spool|canister|\bpot\b|bundle|zine|\btank\b|reel|chemical|develop|process|\bscan|printing|thermometer|cylinder|funnel|clip|blower|glove|binder|holder|carrier|densitometer|loader|retriever|\bjug\b|beaker|hood|\bmask|riser|batter|viewer|lightbox|\blamp|\bpage|lens|prime|\bzoom|rangefinder|point and shoot|reflector|softbox|umbrella|tripod|\bpanel|album|instruction|manual|\bflash|trigger|bracket|\bstand\b|telephoto|wide.?angle|f\/?\d/i;

function isFilmProduct(type, title) {
  if (NOT_FILM.test(title)) return false;
  const t = (type || '').toLowerCase();

  if (t.includes(':')) {
    // Firstcall-style "Department : Category"
    const [dept, leaf = ''] = t.split(':').map((s) => s.trim());
    if (!/film/.test(dept)) return false; // Print / Studio / Photographic depts out
    // Within the Film department, drop the non-roll categories.
    if (/equipment|scanning|storage|cleaning|projection|book|chemical|label|recoder|develop/.test(leaf)) return false;
    return true; // Black & White Film, Colour Print Film, Slide Film, Instant Film...
  }

  if (NOT_FILM.test(t)) return false;
  if (t) return true; // AW short film type, already vetted above
  // No type: rely on a format signal in the title.
  return /\b(35\s?mm|135|120|110|127|620|instant|sheet|movie|super\s?8|16\s?mm|large format)\b/i.test(title);
}

// Yield {title, type} items for a source (products for Shopify; offers for feeds).
async function itemsFor(src) {
  try {
    if (src.kind === 'shopify') {
      let products = null;
      if (!OFFLINE && src.baseUrl) {
        try { products = await fetchAllProducts(src.baseUrl); }
        catch (e) { console.warn(`  ${src.retailer}: live fetch failed (${e.message})`); }
      }
      if (!products && src.sample) products = JSON.parse(readFileSync(src.sample, 'utf8')).products;
      if (!products) return [];
      return products.map((p) => ({
        title: `${p.vendor && !p.title.toLowerCase().startsWith(p.vendor.toLowerCase()) ? p.vendor + ' ' : ''}${p.title}`.trim(),
        type: p.product_type || '',
        raw: p.title,
        image: pickCleanImage(p.images),
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        body: (p.body_html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2000),
      }));
    }
    const offers = src.kind === 'xml' ? loadWex(src.sample) : src.kind === 'csv' ? loadNikTrick(src.sample) : [];
    return offers.map((o) => ({ title: o.title, type: '', raw: o.title, image: null, tags: '', body: '' }));
  } catch (e) {
    console.warn(`  ${src.retailer}: ${e.message}`);
    return [];
  }
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cleanName = (t) => t
  .replace(/\b\d{1,3}\s*(?:exposures?|exp)\b/gi, '')     // "36 exposures", "24Exp"
  .replace(/\bpack of \d+\b/gi, '')                       // "Pack of 3"
  .replace(/\b\d+\s*[-x]?\s*pack\b/gi, '')                // "3 pack", "3-pack", "3x pack"
  .replace(/\b(twin|multi)-?\s*pack\b/gi, '')             // "Twin Pack", "Multipack"
  .replace(/\b\d+\s*pk\b/gi, '')                          // "3pk"
  .replace(/\b(single roll|single|value pack|coming soon)\b/i, '')
  .replace(/\s*[-–]\s*$/, '')                             // trailing dash left behind
  .replace(/\s{2,}/g, ' ').trim();

async function run() {
  console.log(`Building catalogue from ${SOURCES.length} sources${OFFLINE ? ' (offline)' : ''}...`);
  const films = new Map();
  const unidentified = new Set();
  let filmItems = 0;

  for (const src of SOURCES) {
    const items = await itemsFor(src);
    let kept = 0;
    for (const it of items) {
      if (!isFilmProduct(it.type, it.title)) continue;
      filmItems++;
      const tagIso = extractIso(it.tags, '');
      const parsed = parseFilmTitle(it.title, it.type, tagIso);
      if (!parsed.identified) { unidentified.add(`${(it.type || '?').padEnd(14)} ${it.title}`); continue; }
      if (!films.has(parsed.key)) {
        const process = deriveProcess(it.type, it.title);
        const iso = (parsed.iso ? Number(parsed.iso) : null) ?? extractIso('', it.body);
        const exp = (parsed.exp ? Number(parsed.exp) : null) ?? extractExp(it.tags, it.body);
        films.set(parsed.key, {
          id: films.size + 1, key: parsed.key, display: cleanName(it.raw),
          brand: parsed.brand, format: parsed.format, iso, process, exp,
          image: it.image || null,
          description: describe({ display: cleanName(it.raw), brand: parsed.brand, format: parsed.format, iso, process }),
          type: it.type, slug: slugify(cleanName(it.raw)),
        });
        kept++;
      } else {
        // Backfill anything a later shop can supply.
        const f = films.get(parsed.key);
        if (it.image && !f.image) f.image = it.image;
        if (f.iso == null) { const i = extractIso(it.tags, it.body); if (i != null) f.iso = i; }
        if (f.exp == null) { const e = extractExp(it.tags, it.body); if (e != null) f.exp = e; }
      }
    }
    console.log(`  ${src.retailer}: +${kept} new films`);
  }

  const catalogue = [...films.values()];
  mkdirSync('./data', { recursive: true });
  writeFileSync('./data/catalogue.json', JSON.stringify(catalogue, null, 2));
  writeFileSync('./data/catalogue-unidentified.txt', [...unidentified].sort().join('\n'));

  const byFormat = {};
  for (const f of catalogue) byFormat[f.format] = (byFormat[f.format] || 0) + 1;
  console.log(`\nCatalogue: ${catalogue.length} unique films (from ${filmItems} film items).`);
  console.log(`Unidentified: ${unidentified.size}  (data/catalogue-unidentified.txt)`);
  console.log('By format:');
  for (const [f, n] of Object.entries(byFormat).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
