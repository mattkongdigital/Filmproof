// lib/data.js — the front end's only data source.
// site.json is produced by `node build-site-data.js` at the project root
// (which runs the matcher). In production, swap this for a query against the
// offers table instead of a static import.

import site from '../data/site.json';

export function getFilms() {
  return site;
}

export function getFilm(slug) {
  return site.find((f) => f.slug === slug) || null;
}

export const gbp = (n) => '£' + Number(n).toFixed(2);

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
  fpp: 'FPP',
};

export const brandLabel = (slug) =>
  BRAND_LABELS[slug] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '');
