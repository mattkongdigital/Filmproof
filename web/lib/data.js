// lib/data.js — the front end's only data source.
// site.json is produced by `node build-site-data.js` at the project root
// (which runs the matcher). In production, swap this for a query against the
// offers table instead of a static import.

import site from '../data/site.json';
import meta from '../data/meta.json';
import { LEGACY_FILM_SLUGS } from './legacy-slugs.mjs';

export function getFilms() {
  return site;
}

// When build-site-data.js last pulled live prices, as an ISO timestamp.
export function getUpdatedAt() {
  return meta.updatedAt;
}

export function getFilm(slug) {
  return site.find((f) => f.slug === slug) || null;
}


// The map lives in ./legacy-slugs.mjs so plain-Node build scripts can import it.
export { LEGACY_FILM_SLUGS };

// The film a legacy slug now points at, or null. Guards against a target that
// has itself left the catalogue: a redirect to a 404 is worse than a 404. And
// against a slug that is a live film again, as a split can bring one back: a
// live page always wins over a redirect.
export function resolveLegacyFilm(slug) {
  const target = LEGACY_FILM_SLUGS[slug];
  if (!target || getFilm(slug)) return null;
  const film = getFilm(target);
  return film ? { slug: target, film } : null;
}

export const gbp = (n) => '£' + Number(n).toFixed(2);

// What one price buys. Instant film is sold in packs of shots, and sheet film
// is compared per sheet (it is boxed in 10s, 25s and 50s, so a box is no unit
// to compare on); every other format is a roll.
export const priceUnit = (film) => ({ instant: 'pack', sheet: 'sheet' }[film?.format] || 'roll');

export const formatLabel = (format) => ({
  '135': '35mm', '120': '120', '110': '110', '127': '127', '220': '220', '620': '620',
  instant: 'Instant', sheet: 'Sheet', movie: 'Cine', micro: 'Microfilm', bulk: 'Bulk',
}[format] || format || '—');

// Set this to your real domain before launch (used for canonicals + sitemap).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://filmproof.co.uk').replace(/\/$/, '');

const BRAND_LABELS = {
  fujifilm: 'Fujifilm', kodak: 'Kodak', ilford: 'Ilford', cinestill: 'CineStill',
  kentmere: 'Kentmere', kosmofoto: 'Kosmo Foto', agfa: 'AgfaPhoto', foma: 'Foma',
  lomography: 'Lomography', jch: 'Japan Camera Hunter', dubblefilm: 'dubblefilm',
  optikoldschool: 'Optik Oldschool', silbersalz: 'SilberSalz', filmneverdie: 'FilmNeverDie',
  rollei: 'Rollei', bergger: 'Bergger', adox: 'Adox', harman: 'Harman', polaroid: 'Polaroid',
  ferrania: 'Ferrania', revolog: 'Revolog', catlabs: 'CatLABS', lucky: 'Lucky Film',
  orwo: 'ORWO', reto: 'Reto', mira: 'Mira', yodica: 'Yodica', shanghai: 'Shanghai',
  washi: 'Film Washi', flic: 'Flic Film', kono: 'KONO', dragonfilm: 'Dragon Film',
  cinemot: 'CineMot', streetcandy: 'Street Candy', hanalogital: 'Hanalogital',
  kameratori: 'Kameratori', mrnegative: 'Mr Negative', reflx: 'Reflx Lab', rera: 'Rera',
  fpp: 'FPP', thisishowiroll: 'This Is How I Roll', alienfilm: 'Alien Film',
};

export const brandLabel = (slug) =>
  BRAND_LABELS[slug] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '');
