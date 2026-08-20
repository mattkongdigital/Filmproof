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

// TEMPORARY DIAGNOSTIC (FILMPROOF_IMAGE_DEBUG) — remove once the CineStill
// image question is settled. Everything it adds is inert unless the env var is
// set, and it writes to stderr so stdout stays exactly as it was.
const IMAGE_DEBUG = Boolean(process.env.FILMPROOF_IMAGE_DEBUG);
// FILMPROOF_IMAGE_DEBUG=1 reports on cinestill; set it to a brand slug
// (FILMPROOF_IMAGE_DEBUG=ilford) to point the same report at another brand.
const RAW_DEBUG = (process.env.FILMPROOF_IMAGE_DEBUG || '').toLowerCase();
const DEBUG_BRAND = !RAW_DEBUG || ['1', 'true', 'yes', 'on'].includes(RAW_DEBUG) ? 'cinestill' : RAW_DEBUG;
const dbg = (line) => process.stderr.write(`[image-debug] ${line}\n`);

// Shop photography sometimes carries the shop's own promotional banner baked
// right into the image — "2 FOR £55 save £13", "was £38", "5 ROLLS FOR 4" —
// which reads as misleading (that deal may not be live) and out of place on a
// page comparing many shops at once. Separately, some shops use a "shot on
// this film" sample photograph as a product image — a real photo, but not of
// the product, which looks wrong on a page whose job is to show what's
// actually for sale.
// Both can only be caught where a shop has labelled the image clearly in the
// filename or alt text — an unlabelled one will slip through. Treat this as
// a first pass, not a guarantee. Anything spotted later can be added to
// EXCLUDED_IMAGE_URLS by URL as a manual backstop.
// The quantity branches ("3 for 2", "5 rolls for 4") are deliberately capped at
// a two-digit first number and bounded by \b, so a film title's own numbers
// can't start a match — "Ilford Delta 3200 for 35mm" is a product, not an offer.
// The (?![a-z]) stops "for" matching inside "format". Currency-bearing offers
// keep their own unbounded branches, since a price can run to four digits.
// The two phrase branches ("mix & match", "for the price of") carry no digits,
// because filenames jam the whole badge together in camelCase — the real
// "IlfordOrthoPlus120Mix_Match5ForPriceOf4.png" has no word boundary between
// "Match" and "5", and "for" is followed by "Price", not a number. They allow
// underscores, ampersands, hyphens or nothing between the words so both the
// spaced and the run-together spellings match. "match" alone is never enough:
// it has to be preceded by "mix", or match-box-camera.jpg would be dropped.
const PROMO_IMAGE = /(\d+\s*for\s*£\s*\d+|\b\d{1,2}\s*for(?![a-z])\s*\d{1,3}\b|\b\d{1,2}\s*rolls?\s*for(?![a-z])\s*\d{1,3}\b|mix[\s_&+-]*match|for[\s_-]*(the[\s_-]*)?price[\s_-]*of|\bbuy\s*\d+\s*get\b|\bwas\s*£\s*\d+|\bsave\s*£?\s*\d+|\d+\s*%\s*off|\bfree\b.{0,30}\bwhen\b|\bbundle\s*(deal|offer)s?\b|\bclearance\b|\bmulti-?buy\b|\bwas\b.{0,8}\bnow\b)/i;
const SAMPLE_IMAGE = /(\bshot\s?on\b|\bshot\s?with\b|\btaken\s?(on|with)\b|\bsample\s?(shot|photo|image)\b|\bexample\s?(shot|photo|image)\b|\bgallery\b|\bportfolio\b)/i;

// Returns null when the image is fine, or {rule, match} naming what rejected it
// and the exact substring that tripped — the diagnostic below needs to report
// which pattern fired, and a bare boolean can't say.
function unsuitableReason(url, alt) {
  if (url && EXCLUDED_IMAGE_URLS.has(url)) return { rule: 'EXCLUDED_IMAGE_URLS', match: url };
  const text = `${url || ''} ${alt || ''}`;
  const promo = PROMO_IMAGE.exec(text);
  if (promo) return { rule: 'PROMO_IMAGE', match: promo[0] };
  const sample = SAMPLE_IMAGE.exec(text);
  if (sample) return { rule: 'SAMPLE_IMAGE', match: sample[0] };
  return null;
}

function looksUnsuitable(url, alt) {
  return unsuitableReason(url, alt) !== null;
}

// Only ever consider the shop's first image. Shops put the real product shot in
// position 1 and use the rest of the array as a gallery — lifestyle shots,
// "shot on this film" samples, packaging detail. So walking further down the
// array to escape an unsuitable first image just trades a promo overlay for a
// sample photo, which is worse than showing nothing. Returning null instead is
// cheap: the cross-shop backfill below (`it.image && !f.image`) lets a later
// shop's first image stand in, and that's nearly always a genuine product shot.
function pickCleanImage(images) {
  const first = (images || [])[0];
  const src = first && first.src;
  if (!src) return null;
  return looksUnsuitable(src, first.alt) ? null : src;
}

// Decide whether a product is an actual roll/sheet of film (not accessories,
// paper, chemicals, cameras...). Handles both Analogue Wonderland's short types
// ("35mm", "Camera") and Firstcall's "Department : Category" paths.
const NOT_FILM = /camera|merch|adapter|empties|accessor|gift|\bbook\b|strap|\bbag\b|spool|canister|\bpot\b|bundle|zine|\btank\b|reel|chemical|develop|process|\bscan|printing|thermometer|cylinder|funnel|clip|blower|glove|binder|holder|carrier|densitometer|loader|retriever|\bjug\b|beaker|hood|\bmask|riser|batter|viewer|lightbox|\blamp|\bpage|lens|prime|\bzoom|rangefinder|point and shoot|reflector|softbox|umbrella|tripod|\bpanel|album|instruction|manual|\bflash|trigger|bracket|\bstand\b|telephoto|wide.?angle|f\/?\d|\bback\b/i;

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
        // TEMPORARY DIAGNOSTIC: what pickCleanImage saw, so run() can explain
        // its decision. Only built when the debug flag is on.
        imageDebug: !IMAGE_DEBUG ? null : (() => {
          const imgs = p.images || [];
          const first = imgs[0];
          const src = (first && first.src) || null;
          return {
            count: imgs.length,
            src,
            alt: (first && first.alt) || '',
            reason: src ? unsuitableReason(src, first.alt) : null,
          };
        })(),
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
  .replace(/\b\d{1,3}\s*(?:exposures?|exp)\b/gi, '')
  .replace(/\bpack of \d+\b/gi, '')
  .replace(/\b\d+\s*[-x]?\s*pack\b/gi, '')
  .replace(/\b(twin|multi)-?\s*pack\b/gi, '')
  .replace(/\b\d+\s*pk\b/gi, '')
  .replace(/\b(single roll|single|value pack|coming soon)\b/i, '')
  .replace(/\s*[-–—]\s*$/, '')
  .replace(/\s+[-–—]\s+/g, ', ')
  .replace(/\s*,\s*$/, '')
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
      // TEMPORARY DIAGNOSTIC: a product can vanish before it ever has a brand,
      // so match on the title here to report the two drop-outs above the
      // brand-keyed line below.
      const debugTitle = IMAGE_DEBUG && it.title.toLowerCase().includes(DEBUG_BRAND);
      // Check the raw, unprefixed title — a shop whose own name contains a
      // NOT_FILM word (e.g. "Cameras By Max") would otherwise get every one
      // of its products rejected once itemsFor() prepends that vendor name
      // to the title for brand detection below.
      if (!isFilmProduct(it.type, it.raw)) {
        if (debugTitle) dbg(`DROPPED not-a-film-product | ${src.retailer} | ${it.title} | type=${it.type || '(none)'}`);
        continue;
      }
      filmItems++;
      const tagIso = extractIso(it.tags, '');
      const parsed = parseFilmTitle(it.title, it.type, tagIso);
      if (!parsed.identified) {
        if (debugTitle) dbg(`DROPPED unidentified-title | ${src.retailer} | ${it.title} | type=${it.type || '(none)'}`);
        unidentified.add(`${(it.type || '?').padEnd(14)} ${it.title}`); continue;
      }
      if (IMAGE_DEBUG && parsed.brand === DEBUG_BRAND) {
        const d = it.imageDebug || { count: 0, src: null, alt: '', reason: null };
        const r = d.reason;
        dbg([
          `${src.retailer} | ${it.title}`,
          `images=${d.count}`,
          `first=${d.src || '(none)'}`,
          `alt=${JSON.stringify(d.alt || '')}`,
          r ? `REJECTED by ${r.rule} matched=${JSON.stringify(r.match)}` : (d.src ? 'kept' : 'no-images'),
          `used=${it.image || '(null)'}`,
        ].join(' | '));
      }
      if (!films.has(parsed.key)) {
        const process = deriveProcess(it.type, it.title);
        const iso = (parsed.iso ? Number(parsed.iso) : null) ?? extractIso('', it.body);
        const exp = (parsed.exp ? Number(parsed.exp) : null) ?? extractExp(it.tags, it.body);
        films.set(parsed.key, {
          id: films.size + 1, key: parsed.key, display: cleanName(it.raw),
          brand: parsed.brand, format: parsed.format, iso, process, exp,
          expired: parsed.expired,
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

  // TEMPORARY DIAGNOSTIC: the final state, after cross-shop backfill — this is
  // what the site actually renders.
  if (IMAGE_DEBUG) {
    const brandFilms = catalogue.filter((f) => f.brand === DEBUG_BRAND);
    const missing = brandFilms.filter((f) => !f.image);
    dbg(`--- FINAL: ${brandFilms.length} ${DEBUG_BRAND} films, ${missing.length} with no image ---`);
    for (const f of brandFilms) dbg(`FINAL ${f.image ? 'HAS-IMAGE ' : 'NO-IMAGE  '} | ${f.display} | key=${f.key} | ${f.image || ''}`);
  }

  // Safety: a real build pulls hundreds of films from live shops. A catalogue
  // this small means live fetches failed and we silently fell back to the
  // tiny sample fixtures — refuse to publish that as if it were real data.
  if (!OFFLINE && catalogue.length < 100) {
    console.error(
      `ERROR: only ${catalogue.length} films found (expected 100+). Live fetches appear to have failed, ` +
      `and this build is refusing to publish sample data as if it were real. ` +
      `Set FILMPROOF_OFFLINE=1 if a sample-only build is intentional.`
    );
    process.exit(1);
  }

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
