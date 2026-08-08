// seed-films.js
// The canonical catalogue. It loads from data/catalogue.json when present
// (built by `node build-catalogue.js <shop-url>`), and otherwise falls back to
// a tiny built-in sample so everything still runs offline.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseFilmTitle } from './normalise.js';

const here = dirname(fileURLToPath(import.meta.url));
const cataloguePath = join(here, '..', 'data', 'catalogue.json');

const SAMPLE = [
  { display: 'Kodak Gold 200',     title: 'Kodak Gold 200 35mm 36exp',      type: '35mm' },
  { display: 'Kodak Portra 400',   title: 'Kodak Portra 400 35mm 36exp',    type: '35mm' },
  { display: 'Kodak UltraMax 400', title: 'Kodak UltraMax 400 35mm 36exp',  type: '35mm' },
  { display: 'Ilford HP5 Plus',    title: 'Ilford HP5 Plus 400 35mm 36exp', type: '35mm' },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function loadCatalogue() {
  if (existsSync(cataloguePath)) {
    return JSON.parse(readFileSync(cataloguePath, 'utf8'));
  }
  return SAMPLE.map((f, i) => {
    const p = parseFilmTitle(f.title, f.type);
    return {
      id: i + 1,
      key: p.key,
      display: f.display,
      brand: p.brand,
      format: p.format,
      iso: p.iso ? Number(p.iso) : null,
      type: f.type,
      slug: slugify(f.display),
    };
  });
}

export const FILMS = loadCatalogue();
export const FILM_BY_KEY = new Map(FILMS.filter((f) => f.key).map((f) => [f.key, f]));
