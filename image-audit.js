// image-audit.js
// Standalone diagnostic: how much of the catalogue is currently missing a
// product image? Run it by hand after build-site-data.js to size how much a
// fallback tile would matter.
//
//   node image-audit.js
//
// Nothing imports this and nothing runs it automatically — it only reads
// web/data/site.json and prints. No dependencies, no build step.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const sitePath = join(here, 'web', 'data', 'site.json');

const TOP_BRANDS = 15;
const SAMPLE_NAMES = 12;

// Matches what the front end actually does: FilmImage treats a falsy src as
// "no image" and renders the placeholder frame. build-catalogue.js has already
// nulled out promo banners and sample shots by this point, so anything left
// here is a genuine gap. A whitespace-only string would slip past a bare
// truthiness check and render a broken <img>, so trim before testing.
const hasImage = (film) => typeof film.image === 'string' && film.image.trim() !== '';

const pct = (n, total) => (total === 0 ? '0.0' : ((n / total) * 100).toFixed(1));

function loadSite() {
  let raw;
  try {
    raw = readFileSync(sitePath, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error(`No site data at ${sitePath}`);
      console.error('Build it first:  node build-site-data.js');
      process.exit(1);
    }
    throw e;
  }

  let site;
  try {
    site = JSON.parse(raw);
  } catch (e) {
    console.error(`${sitePath} is not valid JSON — ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(site)) {
    console.error(`${sitePath} should be an array of films, got ${typeof site}.`);
    process.exit(1);
  }
  return site;
}

function main() {
  const site = loadSite();
  const total = site.length;

  if (total === 0) {
    console.log('site.json holds no films — nothing to audit.');
    return;
  }

  const withImage = site.filter(hasImage);
  const missing = site.filter((f) => !hasImage(f));

  console.log('Image audit');
  console.log('===========');
  console.log(`Films:      ${total}`);
  console.log(`With image: ${withImage.length} (${pct(withImage.length, total)}%)`);
  console.log(`No image:   ${missing.length} (${pct(missing.length, total)}%)`);

  if (missing.length === 0) {
    console.log('\nEvery film has an image — a fallback tile would never be seen.');
    return;
  }

  // Per-brand totals as well as misses: "8 of 9 missing" sizes the gap far
  // better than a bare count, since a big brand and a one-film brand can
  // otherwise look identical.
  const brands = new Map();
  for (const film of site) {
    const brand = (typeof film.brand === 'string' && film.brand.trim()) || '(no brand)';
    const row = brands.get(brand) || { brand, missing: 0, total: 0 };
    row.total += 1;
    if (!hasImage(film)) row.missing += 1;
    brands.set(brand, row);
  }

  const ranked = [...brands.values()]
    .filter((r) => r.missing > 0)
    // Most misses first; alphabetical within a tie so runs are reproducible.
    .sort((a, b) => b.missing - a.missing || a.brand.localeCompare(b.brand));

  console.log(`\nNo image by brand (${ranked.length} brand${ranked.length === 1 ? '' : 's'} affected)`);
  const shown = ranked.slice(0, TOP_BRANDS);
  const nameWidth = Math.max(...shown.map((r) => r.brand.length));
  for (const row of shown) {
    const share = pct(row.missing, row.total);
    console.log(`  ${row.brand.padEnd(nameWidth)}  ${String(row.missing).padStart(4)} of ${String(row.total).padEnd(4)} (${share}%)`);
  }
  if (ranked.length > shown.length) {
    console.log(`  ... and ${ranked.length - shown.length} more brand${ranked.length - shown.length === 1 ? '' : 's'}`);
  }

  console.log(`\nSample of films with no image (first ${Math.min(SAMPLE_NAMES, missing.length)} of ${missing.length})`);
  for (const film of missing.slice(0, SAMPLE_NAMES)) {
    console.log(`  ${film.display || film.slug || '(unnamed film)'}`);
  }
}

main();
