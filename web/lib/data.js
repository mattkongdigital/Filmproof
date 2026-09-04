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


// Slugs that used to be their own film page and now resolve to another. The
// catalogue is rebuilt from live shop data every deploy, so a slug normally
// comes and goes with the stock behind it — that churn is not worth tracking.
// This is for the other case: two pages that were always ONE film, merged in
// the normaliser. The old URL was real, was indexed, and now has nowhere to go,
// so it keeps a page that points at the survivor.
//
// `lomography-lomochrome-metropolis-110-film` was the same 110 Metropolis as
// `lomography-metropolis-110-film`; shops write LomoChrome's family name or
// drop it, and the line forked on that token.
//
// Lucky's colour negative forked the same way on the manufacturer's "C" code:
// `lucky-colour-200-film-35mm` and `lucky-film-200-120` were the shops that
// write the speed bare, and they are the same films as the C200 pages.
export const LEGACY_FILM_SLUGS = {
  'lomography-lomochrome-metropolis-110-film': 'lomography-metropolis-110-film',
  'lucky-colour-200-film-35mm': 'lucky-colour-c200-35mm-film',
  'lucky-film-200-120': 'lucky-colour-c200-120-film',
};

// The film a legacy slug now points at, or null. Guards against a target that
// has itself left the catalogue: a redirect to a 404 is worse than a 404.
export function resolveLegacyFilm(slug) {
  const target = LEGACY_FILM_SLUGS[slug];
  if (!target) return null;
  const film = getFilm(target);
  return film ? { slug: target, film } : null;
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
